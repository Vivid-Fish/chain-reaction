// games/rhythm/game.js — Rhythm tapping game
// Genre: TAP — 4-lane beat-matching, timing precision, combo building
// Validates: taps input, timing accuracy, escalating difficulty

export function createGame(config) {
  const TICK_RATE = 60;

  // Lane layout constants (normalized 0-1)
  const LANE_COUNT = 4;
  const LANE_WIDTH = 1 / LANE_COUNT;
  const STRIKE_Y = 0.85;            // where beats should be hit
  const STRIKE_TOLERANCE = 0.045;    // half-height of the strike zone
  const PERFECT_TOLERANCE = 0.018;   // tighter window for "perfect"
  const SPAWN_Y = -0.04;            // beats spawn just above viewport
  const DESPAWN_Y = 0.96;           // beats removed below this

  // Scoring
  const PERFECT_SCORE = 100;
  const GOOD_SCORE = 50;
  const MISS_PENALTY_HEALTH = 8;
  const GOOD_PENALTY_HEALTH = 2;

  // Lane colors — distinct, readable on dark background
  const LANE_HUES = [320, 200, 50, 130]; // magenta, blue, gold, green

  // Beat pattern templates for procedural generation
  // Each is an array of lane indices to spawn simultaneously
  const PATTERNS_EASY = [
    [0], [1], [2], [3],
  ];
  const PATTERNS_MEDIUM = [
    [0], [1], [2], [3],
    [0, 2], [1, 3],        // two-tap spreads
  ];
  const PATTERNS_HARD = [
    [0], [1], [2], [3],
    [0, 2], [1, 3], [0, 3], [1, 2],
    [0, 1], [2, 3],
    [0, 1, 2], [1, 2, 3],  // three-tap runs
  ];

  // Helper: pick a pattern set based on current BPM
  function getPatterns(bpm) {
    if (bpm < 120) return PATTERNS_EASY;
    if (bpm < 160) return PATTERNS_MEDIUM;
    return PATTERNS_HARD;
  }

  // Helper: compute the y-travel speed for a given BPM
  // At the base BPM, a beat takes exactly `travelBeats` beats to reach the strike zone
  // travelBeats is how many beats of "look ahead" the player gets
  function beatSpeed(bpm, travelBeats) {
    // distance from spawn to strike = STRIKE_Y - SPAWN_Y
    const distance = STRIKE_Y - SPAWN_Y;
    // time in seconds for `travelBeats` beats at `bpm`
    const travelTime = (travelBeats * 60) / bpm;
    // speed in normalized units per second
    return distance / travelTime;
  }

  return {
    meta: {
      id: 'rhythm',
      name: 'Rhythm',
      version: '0.1.0',
      players: 1,
      inputChannels: ['taps'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 16 },
    },

    init(params) {
      const bpm = params.bpm || 100;
      const beatDensity = params.beatDensity || 1.0;
      const healthDrain = params.healthDrain || 1.0;
      const travelBeats = params.travelBeats || 4;

      return {
        // Beat queue: active beats falling down lanes
        beats: [],
        // Recently judged beats (for rendering hit/miss flash effects)
        judgments: [],  // { x, y, type: 'perfect'|'good'|'miss', age: 0 }

        // Timing state
        bpm,
        beatDensity,
        healthDrain,
        travelBeats,
        time: 0,                  // total elapsed time in seconds
        beatTimer: 0,             // accumulator for beat spawning
        nextBeatInterval: 60 / bpm, // seconds between beat spawns

        // Player state
        score: 0,
        combo: 0,
        maxCombo: 0,
        health: 100,
        alive: true,

        // Accuracy tracking
        perfects: 0,
        goods: 0,
        misses: 0,
        totalBeats: 0,

        // BPM ramping
        baseBpm: bpm,
        bpmRampRate: params.bpmRampRate || 0.5, // BPM increase per second
        maxBpm: params.maxBpm || 220,

        // Pattern sequencing
        patternIndex: 0,
        lastPatternLane: -1,     // avoid immediate repeats
      };
    },

    step(state, input, dt, rng) {
      if (!state.alive) return state;

      state.time += dt;

      // --- BPM ramping ---
      const oldBpm = state.bpm;
      state.bpm = Math.min(
        state.maxBpm,
        state.baseBpm + state.bpmRampRate * state.time
      );
      state.nextBeatInterval = 60 / (state.bpm * state.beatDensity);

      // --- Spawn beats ---
      state.beatTimer += dt;
      while (state.beatTimer >= state.nextBeatInterval) {
        state.beatTimer -= state.nextBeatInterval;

        const patterns = getPatterns(state.bpm);
        // Pick a pattern, avoiding exact repeat of the last single-lane beat
        let chosen;
        let attempts = 0;
        do {
          chosen = rng.pick(patterns);
          attempts++;
        } while (
          attempts < 5 &&
          chosen.length === 1 &&
          chosen[0] === state.lastPatternLane
        );

        if (chosen.length === 1) {
          state.lastPatternLane = chosen[0];
        } else {
          state.lastPatternLane = -1;
        }

        for (const lane of chosen) {
          state.beats.push({
            lane,
            y: SPAWN_Y,
            speed: beatSpeed(state.bpm, state.travelBeats),
            hit: false,
            id: state.totalBeats++,
          });
        }
      }

      // --- Move beats ---
      for (const beat of state.beats) {
        beat.y += beat.speed * dt;
      }

      // --- Process taps ---
      if (input.taps && input.taps.length > 0) {
        for (const tap of input.taps) {
          // Map x position to lane
          const lane = Math.min(LANE_COUNT - 1, Math.max(0, Math.floor(tap.x * LANE_COUNT)));

          // Find the closest unhit beat in this lane within the strike tolerance
          let bestBeat = null;
          let bestDist = Infinity;

          for (const beat of state.beats) {
            if (beat.hit || beat.lane !== lane) continue;
            const dist = Math.abs(beat.y - STRIKE_Y);
            if (dist < STRIKE_TOLERANCE + STRIKE_TOLERANCE && dist < bestDist) {
              bestDist = dist;
              bestBeat = beat;
            }
          }

          if (bestBeat) {
            bestBeat.hit = true;
            const dist = Math.abs(bestBeat.y - STRIKE_Y);

            if (dist <= PERFECT_TOLERANCE) {
              // Perfect hit
              state.combo++;
              const comboMult = Math.min(2, 1 + Math.floor(state.combo / 10) * 0.25);
              state.score += Math.round(PERFECT_SCORE * comboMult);
              state.perfects++;
              state.judgments.push({
                x: (lane + 0.5) * LANE_WIDTH,
                y: STRIKE_Y,
                type: 'perfect',
                age: 0,
              });
            } else if (dist <= STRIKE_TOLERANCE) {
              // Good hit
              state.combo++;
              const comboMult = Math.min(2, 1 + Math.floor(state.combo / 10) * 0.25);
              state.score += Math.round(GOOD_SCORE * comboMult);
              state.goods++;
              state.health = Math.max(0, state.health - GOOD_PENALTY_HEALTH * state.healthDrain * 0.3);
              state.judgments.push({
                x: (lane + 0.5) * LANE_WIDTH,
                y: STRIKE_Y,
                type: 'good',
                age: 0,
              });
            } else {
              // In the wider window but not close enough — still count as good
              state.combo++;
              const comboMult = Math.min(2, 1 + Math.floor(state.combo / 10) * 0.25);
              state.score += Math.round(GOOD_SCORE * 0.5 * comboMult);
              state.goods++;
              state.judgments.push({
                x: (lane + 0.5) * LANE_WIDTH,
                y: STRIKE_Y,
                type: 'good',
                age: 0,
              });
            }

            state.maxCombo = Math.max(state.maxCombo, state.combo);
          } else {
            // Tapped but no beat nearby — empty tap miss
            state.combo = 0;
            state.health = Math.max(0, state.health - MISS_PENALTY_HEALTH * state.healthDrain * 0.4);
            state.judgments.push({
              x: (lane + 0.5) * LANE_WIDTH,
              y: STRIKE_Y,
              type: 'miss',
              age: 0,
            });
          }
        }
      }

      // --- Check for beats that passed the strike zone without being hit ---
      for (const beat of state.beats) {
        if (!beat.hit && beat.y > STRIKE_Y + STRIKE_TOLERANCE) {
          beat.hit = true; // mark as missed so we don't count twice
          state.misses++;
          state.combo = 0;
          state.health = Math.max(0, state.health - MISS_PENALTY_HEALTH * state.healthDrain);
          state.judgments.push({
            x: (beat.lane + 0.5) * LANE_WIDTH,
            y: STRIKE_Y,
            type: 'miss',
            age: 0,
          });
        }
      }

      // --- Remove despawned beats ---
      state.beats = state.beats.filter(b => b.y < DESPAWN_Y);

      // --- Age and prune judgments ---
      for (const j of state.judgments) {
        j.age += dt;
      }
      state.judgments = state.judgments.filter(j => j.age < 0.6);

      // --- Health regeneration on combo ---
      if (state.combo > 0 && state.combo % 10 === 0) {
        state.health = Math.min(100, state.health + 3);
      }

      // --- Death check ---
      if (state.health <= 0) {
        state.alive = false;
        state.health = 0;
      }

      return state;
    },

    render(state, draw, alpha) {
      // Background — deep dark with subtle color
      draw.clear(0.04, 0.03, 0.08);

      // --- Lane dividers ---
      for (let i = 1; i < LANE_COUNT; i++) {
        const x = i * LANE_WIDTH;
        draw.line(x, 0, x, 1, {
          color: 'rgba(255, 255, 255, 0.06)',
          width: 1,
        });
      }

      // --- Lane background tint (subtle, shows which lane is which) ---
      for (let i = 0; i < LANE_COUNT; i++) {
        const hue = LANE_HUES[i];
        draw.rect(
          (i + 0.5) * LANE_WIDTH, 0.5,
          LANE_WIDTH, 1.0,
          { fill: `hsla(${hue}, 40%, 15%, 0.08)` }
        );
      }

      // --- Strike zone ---
      // Glowing bar across all lanes
      draw.rect(0.5, STRIKE_Y, 1.0, STRIKE_TOLERANCE * 2, {
        fill: 'rgba(255, 255, 255, 0.06)',
      });
      draw.line(0, STRIKE_Y - STRIKE_TOLERANCE, 1, STRIKE_Y - STRIKE_TOLERANCE, {
        color: 'rgba(255, 255, 255, 0.15)',
        width: 1,
      });
      draw.line(0, STRIKE_Y + STRIKE_TOLERANCE, 1, STRIKE_Y + STRIKE_TOLERANCE, {
        color: 'rgba(255, 255, 255, 0.15)',
        width: 1,
      });

      // Strike zone target circles per lane
      for (let i = 0; i < LANE_COUNT; i++) {
        const hue = LANE_HUES[i];
        const cx = (i + 0.5) * LANE_WIDTH;
        draw.circle(cx, STRIKE_Y, 0.022, {
          fill: `hsla(${hue}, 60%, 40%, 0.25)`,
        });
        draw.circle(cx, STRIKE_Y, 0.022, {
          fill: 'transparent',
          stroke: `hsla(${hue}, 70%, 55%, 0.5)`,
          lineWidth: 2,
        });
      }

      // --- Falling beats ---
      for (const beat of state.beats) {
        if (beat.hit) continue;
        const hue = LANE_HUES[beat.lane];
        const cx = (beat.lane + 0.5) * LANE_WIDTH;

        // Distance to strike zone affects glow intensity
        const distToStrike = Math.abs(beat.y - STRIKE_Y);
        const proximity = Math.max(0, 1 - distToStrike / 0.4);

        // Main beat circle
        const baseRadius = 0.02;
        const pulseRadius = baseRadius + proximity * 0.005;

        // Glow when approaching strike zone
        if (proximity > 0.3) {
          draw.circle(cx, beat.y, pulseRadius + 0.008, {
            fill: `hsla(${hue}, 80%, 60%, ${proximity * 0.15})`,
          });
        }

        // Beat body
        draw.circle(cx, beat.y, pulseRadius, {
          fill: `hsl(${hue}, 75%, 60%)`,
          glow: proximity > 0.5 ? 0.01 : 0,
          glowColor: `hsla(${hue}, 80%, 60%, 0.4)`,
        });

        // Inner highlight
        draw.circle(cx, beat.y, pulseRadius * 0.5, {
          fill: `hsla(${hue}, 60%, 85%, 0.4)`,
        });
      }

      // --- Judgment effects ---
      for (const j of state.judgments) {
        const progress = j.age / 0.6; // 0..1 over lifetime
        const fadeAlpha = 1 - progress;
        const riseOffset = progress * 0.06;

        if (j.type === 'perfect') {
          // Bright expanding ring + text
          draw.circle(j.x, j.y - riseOffset, 0.015 + progress * 0.02, {
            fill: `rgba(255, 255, 100, ${fadeAlpha * 0.3})`,
          });
          draw.text('PERFECT', j.x, j.y - 0.04 - riseOffset, {
            size: 0.022,
            align: 'center',
            color: `rgba(255, 255, 100, ${fadeAlpha})`,
          });
        } else if (j.type === 'good') {
          draw.text('GOOD', j.x, j.y - 0.04 - riseOffset, {
            size: 0.02,
            align: 'center',
            color: `rgba(100, 220, 255, ${fadeAlpha})`,
          });
        } else {
          // Miss — red X
          draw.text('MISS', j.x, j.y - 0.04 - riseOffset, {
            size: 0.02,
            align: 'center',
            color: `rgba(255, 80, 80, ${fadeAlpha})`,
          });
        }
      }

      // --- HUD ---

      // Score (top center)
      draw.text(`${state.score}`, 0.5, 0.03, {
        size: 0.04,
        align: 'center',
        color: 'rgba(255, 255, 255, 0.9)',
      });

      // Combo (below score, only when active)
      if (state.combo >= 2) {
        const comboScale = Math.min(0.045, 0.025 + state.combo * 0.0005);
        const comboGlow = state.combo >= 10
          ? `rgba(255, 255, 100, ${0.5 + Math.sin(state.time * 8) * 0.3})`
          : 'rgba(255, 255, 255, 0.85)';
        draw.text(`${state.combo}x COMBO`, 0.5, 0.075, {
          size: comboScale,
          align: 'center',
          color: comboGlow,
        });
      }

      // BPM (top-right)
      draw.text(`${Math.round(state.bpm)} BPM`, 0.95, 0.03, {
        size: 0.018,
        align: 'right',
        color: 'rgba(255, 255, 255, 0.4)',
      });

      // Health bar (below strike zone, full width)
      const healthBarY = 0.93;
      const healthBarH = 0.012;
      // Background
      draw.rect(0.5, healthBarY, 0.9, healthBarH, {
        fill: 'rgba(255, 255, 255, 0.08)',
        radius: 0.004,
      });
      // Fill
      const healthFrac = state.health / 100;
      const healthHue = healthFrac > 0.5
        ? 120  // green
        : healthFrac > 0.25
          ? 50  // yellow
          : 0;  // red
      if (healthFrac > 0) {
        draw.rect(
          0.05 + (0.9 * healthFrac) / 2,
          healthBarY,
          0.9 * healthFrac,
          healthBarH,
          {
            fill: `hsl(${healthHue}, 70%, 50%)`,
            radius: 0.004,
          }
        );
      }

      // Accuracy (top-left)
      const totalJudged = state.perfects + state.goods + state.misses;
      if (totalJudged > 0) {
        const accuracy = ((state.perfects + state.goods * 0.5) / totalJudged * 100).toFixed(1);
        draw.text(`${accuracy}%`, 0.05, 0.03, {
          size: 0.018,
          align: 'left',
          color: 'rgba(255, 255, 255, 0.4)',
        });
      }

      // --- Game Over overlay ---
      if (!state.alive) {
        // Dim overlay
        draw.rect(0.5, 0.5, 1, 1, {
          fill: 'rgba(0, 0, 0, 0.6)',
        });

        draw.text('GAME OVER', 0.5, 0.35, {
          size: 0.06,
          align: 'center',
          color: '#fff',
        });

        draw.text(`Score: ${state.score}`, 0.5, 0.44, {
          size: 0.03,
          align: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
        });

        draw.text(`Max Combo: ${state.maxCombo}x`, 0.5, 0.50, {
          size: 0.025,
          align: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
        });

        const totalJudged2 = state.perfects + state.goods + state.misses;
        if (totalJudged2 > 0) {
          draw.text(
            `Perfect: ${state.perfects}  Good: ${state.goods}  Miss: ${state.misses}`,
            0.5, 0.56,
            {
              size: 0.018,
              align: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
            }
          );
        }

        draw.text(`BPM reached: ${Math.round(state.bpm)}`, 0.5, 0.62, {
          size: 0.018,
          align: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
        });
      }
    },

    audio(prev, state) {
      const events = [];

      // --- Hit sounds: check for new judgments ---
      // Compare judgment counts to detect new ones
      const prevJudged = prev.perfects + prev.goods + prev.misses;
      const currJudged = state.perfects + state.goods + state.misses;

      if (currJudged > prevJudged) {
        // New perfects
        if (state.perfects > prev.perfects) {
          const count = state.perfects - prev.perfects;
          for (let i = 0; i < count; i++) {
            // Bright, satisfying tone — higher pitch for longer combos
            const comboBoost = Math.min(state.combo * 5, 200);
            events.push({
              type: 'tone',
              freq: 440 + comboBoost,
              duration: 0.12,
              gain: 0.18,
            });
            // Harmonic shimmer
            events.push({
              type: 'tone',
              freq: (440 + comboBoost) * 1.5,
              duration: 0.08,
              gain: 0.06,
            });
          }
        }

        // New goods
        if (state.goods > prev.goods) {
          const count = state.goods - prev.goods;
          for (let i = 0; i < count; i++) {
            events.push({
              type: 'tone',
              freq: 330 + Math.min(state.combo * 3, 100),
              duration: 0.08,
              gain: 0.12,
            });
          }
        }

        // New misses
        if (state.misses > prev.misses) {
          const count = state.misses - prev.misses;
          for (let i = 0; i < count; i++) {
            events.push({
              type: 'noise',
              filter: 'lowpass',
              freq: 300,
              duration: 0.15,
              gain: 0.12,
            });
          }
        }
      }

      // --- Combo milestone sweep ---
      if (
        state.combo > 0 &&
        state.combo !== prev.combo &&
        state.combo % 25 === 0
      ) {
        // Ascending sweep for big combo milestones
        events.push({
          type: 'tone',
          freq: 300,
          duration: 0.3,
          gain: 0.15,
          sweep: 900,
        });
      } else if (
        state.combo > 0 &&
        state.combo !== prev.combo &&
        state.combo % 10 === 0
      ) {
        // Smaller sweep for every 10 combo
        events.push({
          type: 'tone',
          freq: 400,
          duration: 0.15,
          gain: 0.10,
          sweep: 600,
        });
      }

      // --- Death sound ---
      if (prev.alive && !state.alive) {
        events.push({
          type: 'noise',
          filter: 'lowpass',
          freq: 150,
          duration: 0.8,
          gain: 0.25,
        });
        events.push({
          type: 'tone',
          freq: 200,
          duration: 0.4,
          gain: 0.15,
          sweep: 80,
        });
      }

      // --- Low health warning pulse ---
      if (
        state.alive &&
        state.health <= 20 &&
        state.health > 0 &&
        Math.floor(state.time * 4) > Math.floor(prev.time * 4)
      ) {
        events.push({
          type: 'tone',
          freq: 180,
          duration: 0.05,
          gain: 0.06,
        });
      }

      return events;
    },

    score(state) {
      return {
        primary: state.score,
        label: 'Score',
        unit: 'pts',
        normalized: null,
      };
    },

    status(state) {
      if (!state.alive) return { ended: true, reason: 'missed' };
      return 'playing';
    },

    bot(difficulty, rng) {
      // Bot reads the beat queue and taps when beats reach the strike zone.
      // Higher difficulty = tighter timing precision, fewer missed beats.
      //
      // difficulty 0.0 = very sloppy, misses many beats, terrible timing
      // difficulty 0.5 = hits most beats, mediocre timing (mostly "good")
      // difficulty 1.0 = near-perfect, rarely misses, mostly "perfect"

      // The bot's "ideal tap point" is offset from STRIKE_Y by noise.
      // At difficulty 1.0: offset is nearly 0 (taps right at STRIKE_Y)
      // At difficulty 0.0: offset is up to STRIKE_TOLERANCE (always late/early)
      const maxOffset = STRIKE_TOLERANCE * (1 - difficulty * 0.95);

      // The bot decides to tap when the beat crosses its personal "trigger line"
      // Each beat gets a pre-committed trigger offset (decided when first seen)
      const beatTriggers = new Map();

      // Miss probability: chance the bot just ignores a beat entirely
      // difficulty 0: 25% miss rate; difficulty 0.5: 5%; difficulty 1.0: 0%
      const missRate = Math.max(0, 0.25 * (1 - difficulty * 1.1));

      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        const taps = [];

        for (const beat of state.beats) {
          if (beat.hit) continue;

          // Assign a trigger offset when we first see this beat
          if (!beatTriggers.has(beat.id)) {
            // Decide if we'll miss this beat entirely
            if (rng.float(0, 1) < missRate) {
              beatTriggers.set(beat.id, null); // null = will not attempt
            } else {
              // Pre-commit a trigger y-position (STRIKE_Y + noise)
              const offset = rng.float(-maxOffset, maxOffset);
              beatTriggers.set(beat.id, STRIKE_Y + offset);
            }
          }

          const trigger = beatTriggers.get(beat.id);
          if (trigger === null) continue; // intentionally skipping

          // Tap when the beat crosses or reaches the trigger line
          // (beat.y was below trigger last frame, now at or past it)
          if (beat.y >= trigger) {
            taps.push({
              x: (beat.lane + 0.3 + rng.float(0, 0.4)) * LANE_WIDTH,
              y: STRIKE_Y + rng.float(-0.02, 0.02),
              time: state.time,
            });
            beatTriggers.set(beat.id, null); // don't tap again
          }
        }

        // Clean up triggers for beats no longer in the queue
        for (const id of beatTriggers.keys()) {
          if (!state.beats.some(b => b.id === id)) {
            beatTriggers.delete(id);
          }
        }

        return {
          thumb: null,
          gyro: null,
          taps,
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'bpm', label: 'Starting BPM', type: 'float', min: 60, max: 180, default: 100, step: 10 },
        { key: 'beatDensity', label: 'Beat Density', type: 'float', min: 0.5, max: 3.0, default: 1.0, step: 0.25 },
        { key: 'healthDrain', label: 'Health Drain', type: 'float', min: 0.5, max: 3.0, default: 1.0, step: 0.25 },
        { key: 'travelBeats', label: 'Look-Ahead Beats', type: 'float', min: 2, max: 8, default: 4, step: 0.5 },
        { key: 'bpmRampRate', label: 'BPM Ramp (per sec)', type: 'float', min: 0, max: 2.0, default: 0.5, step: 0.1 },
        { key: 'maxBpm', label: 'Max BPM', type: 'float', min: 120, max: 300, default: 220, step: 10 },
      ];
    },
  };
}
