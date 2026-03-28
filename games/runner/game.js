// games/runner/game.js — Endless runner with lane switching and jumping
// Genre: RUNNER — discrete + continuous input, pattern recognition
// Validates: tap for jump, thumb for lane, procedural generation

export function createGame(config) {
  const TICK_RATE = 60;

  return {
    meta: {
      id: 'runner',
      name: 'Runner',
      version: '0.1.0',
      players: 1,
      inputChannels: ['thumb', 'taps'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 16 },
    },

    init(params) {
      return {
        player: {
          lane: 1, // 0=left, 1=center, 2=right
          targetLane: 1,
          x: 0.5,
          y: 0.75,
          jumping: false,
          jumpVel: 0,
          jumpHeight: 0,
          sliding: false,
          slideTimer: 0,
        },
        obstacles: [],
        coins: [],
        speed: params.initialSpeed || 0.4,
        acceleration: params.acceleration || 0.003,
        distance: 0,
        score: 0,
        alive: true,
        spawnTimer: 0,
        coinTimer: 0,
        stripeOffset: 0,
      };
    },

    step(state, input, dt, rng) {
      if (!state.alive) return state;

      const laneWidth = 1 / 3;
      const lanePositions = [laneWidth / 2, 0.5, 1 - laneWidth / 2];

      // Handle input
      if (input.thumb && input.thumb.active) {
        // Map thumb x to lane
        if (input.thumb.x < 0.33) state.player.targetLane = 0;
        else if (input.thumb.x > 0.66) state.player.targetLane = 2;
        else state.player.targetLane = 1;
      }

      // Tap to jump
      if (input.taps && input.taps.length > 0 && !state.player.jumping) {
        state.player.jumping = true;
        state.player.jumpVel = 0.6;
      }

      // Smooth lane transition
      const targetX = lanePositions[state.player.targetLane];
      state.player.x += (targetX - state.player.x) * 0.2;
      state.player.lane = state.player.targetLane;

      // Jump physics
      if (state.player.jumping) {
        state.player.jumpHeight += state.player.jumpVel * dt;
        state.player.jumpVel -= 2.0 * dt;
        if (state.player.jumpHeight <= 0) {
          state.player.jumpHeight = 0;
          state.player.jumping = false;
          state.player.jumpVel = 0;
        }
      }

      // Speed increases
      state.speed += state.acceleration * dt;
      state.distance += state.speed * dt;

      // Moving stripes for speed feel
      state.stripeOffset = (state.stripeOffset + state.speed * dt) % 0.1;

      // Spawn obstacles
      state.spawnTimer += dt;
      const spawnInterval = 1.2 / (state.speed / 0.4);
      while (state.spawnTimer >= spawnInterval) {
        state.spawnTimer -= spawnInterval;
        const obsLane = rng.int(0, 2);
        const type = rng.float(0, 1) < 0.3 ? 'high' : 'ground';
        state.obstacles.push({
          lane: obsLane,
          x: lanePositions[obsLane],
          y: -0.05,
          type,
          width: laneWidth * 0.7,
          height: type === 'high' ? 0.025 : 0.04,
        });
      }

      // Spawn coins
      state.coinTimer += dt;
      if (state.coinTimer > 0.5) {
        state.coinTimer -= 0.5;
        const coinLane = rng.int(0, 2);
        state.coins.push({
          lane: coinLane,
          x: lanePositions[coinLane],
          y: -0.03,
          collected: false,
        });
      }

      // Move obstacles and coins
      for (const obs of state.obstacles) {
        obs.y += state.speed * dt;
      }
      for (const coin of state.coins) {
        coin.y += state.speed * dt;
      }

      // Cleanup
      state.obstacles = state.obstacles.filter(o => o.y < 1.1);
      state.coins = state.coins.filter(c => c.y < 1.1 && !c.collected);

      // Collision with obstacles
      for (const obs of state.obstacles) {
        if (obs.lane !== state.player.lane) continue;
        if (Math.abs(obs.y - state.player.y) > 0.05) continue;

        // High obstacles can be ducked, ground obstacles can be jumped
        if (obs.type === 'high' && state.player.jumpHeight > 0.05) continue;
        if (obs.type === 'ground' && state.player.jumpHeight > 0.08) continue;

        state.alive = false;
        return state;
      }

      // Coin collection
      for (const coin of state.coins) {
        if (coin.collected) continue;
        if (coin.lane !== state.player.lane) continue;
        if (Math.abs(coin.y - state.player.y) < 0.04) {
          coin.collected = true;
          state.score += 10;
        }
      }

      // Distance score
      state.score = Math.max(state.score, Math.floor(state.distance * 100));

      return state;
    },

    render(state, draw, alpha) {
      // Sky with radial vignette
      draw.clear(0.05, 0.05, 0.12);
      draw.circle(0.5, 0.3, 0.7, {
        gradient: [
          { stop: 0, color: 'hsla(240, 30%, 16%, 0.35)' },
          { stop: 1, color: 'hsla(240, 30%, 5%, 0)' },
        ],
      });

      // Ground with gradient
      draw.rect(0.5, 0.85, 1, 0.3, {
        gradient: [
          { stop: 0, color: 'rgba(40, 45, 55, 1)' },
          { stop: 1, color: 'rgba(20, 25, 30, 1)' },
        ],
      });

      // Lane dividers
      for (let i = 1; i < 3; i++) {
        const x = i / 3;
        for (let y = -state.stripeOffset; y < 1; y += 0.05) {
          draw.rect(x, y, 0.003, 0.025, {
            fill: 'rgba(255, 255, 255, 0.1)',
          });
        }
      }

      // Obstacles with gradient
      for (const obs of state.obstacles) {
        const hue = obs.type === 'high' ? 25 : 0;
        const yOffset = obs.type === 'high' ? -0.04 : 0;
        draw.rect(obs.x, obs.y + yOffset, obs.width, obs.height, {
          gradient: [
            { stop: 0, color: `hsla(${hue}, 80%, 70%, 1)` },
            { stop: 1, color: `hsla(${hue}, 75%, 42%, 0.9)` },
          ],
          radius: 0.005,
        });
      }

      // Coins with gradient
      for (const coin of state.coins) {
        if (coin.collected) continue;
        const pulse = 0.8 + 0.2 * Math.sin(state.distance * 20 + coin.y * 10);
        const r = 0.015 * pulse;
        draw.circle(coin.x, coin.y, r * 2, {
          gradient: [
            { stop: 0, color: 'hsla(50, 90%, 60%, 0.12)' },
            { stop: 1, color: 'hsla(50, 90%, 50%, 0)' },
          ],
          blend: 'lighter',
        });
        draw.circle(coin.x, coin.y, r, {
          gradient: [
            { stop: 0, color: 'hsla(50, 80%, 95%, 1)' },
            { stop: 0.5, color: 'hsla(45, 90%, 65%, 1)' },
            { stop: 1, color: 'hsla(40, 85%, 45%, 0.9)' },
          ],
          gradientOffset: { x: -r * 0.15, y: -r * 0.15 },
          clip: true,
        });
      }

      // Player
      if (state.alive) {
        const py = state.player.y - state.player.jumpHeight;
        if (state.player.jumping) {
          draw.circle(state.player.x, state.player.y, 0.02 * (1 - state.player.jumpHeight * 2), {
            fill: 'rgba(0, 0, 0, 0.2)',
          });
        }
        // Glow aura
        draw.circle(state.player.x, py, 0.022 * 2.5, {
          gradient: [
            { stop: 0, color: 'hsla(200, 85%, 70%, 0.12)' },
            { stop: 1, color: 'hsla(200, 80%, 50%, 0)' },
          ],
          blend: 'lighter',
        });
        // Body with glossy gradient
        draw.circle(state.player.x, py, 0.022, {
          gradient: [
            { stop: 0, color: 'hsla(200, 60%, 95%, 1)' },
            { stop: 0.4, color: 'hsla(200, 85%, 70%, 1)' },
            { stop: 1, color: 'hsla(200, 90%, 45%, 0.9)' },
          ],
          gradientOffset: { x: -0.003, y: -0.003 },
          clip: true,
        });
        // Direction indicator
        draw.circle(state.player.x, py - 0.012, 0.006, {
          fill: '#8cf',
        });
      }

      // HUD
      draw.text(`${Math.floor(state.distance * 100)}m`, 0.5, 0.04, {
        size: 0.035,
        color: 'rgba(255,255,255,0.8)',
        shadow: 'rgba(0,0,0,0.5)',
        shadowBlur: 4,
      });

      draw.text(`${state.speed.toFixed(1)}x`, 0.92, 0.04, {
        size: 0.02,
        color: 'rgba(255,255,255,0.4)',
      });

      // Game over
      if (!state.alive) {
        draw.text('CRASH', 0.5, 0.4, {
          size: 0.06,
          color: '#fff',
          shadow: 'rgba(255, 80, 50, 0.6)',
          shadowBlur: 20,
        });
        draw.text(`${Math.floor(state.distance * 100)}m`, 0.5, 0.5, {
          size: 0.035,
          color: 'rgba(255,255,255,0.7)',
          shadow: 'rgba(0,0,0,0.5)',
          shadowBlur: 4,
        });
      }
    },

    effects(prev, state) {
      const fx = [];
      const laneWidth = 1 / 3;
      const lanePositions = [laneWidth / 2, 0.5, 1 - laneWidth / 2];
      // Death: burst + shake + flash at player position
      if (prev.alive && !state.alive) {
        fx.push({ type: 'burst', x: state.player.x, y: state.player.y, hue: 200, count: 25, intensity: 0.7, spread: 0.08 });
        fx.push({ type: 'shake', trauma: 0.45 });
        fx.push({ type: 'flash', intensity: 0.35 });
      }
      // Coin collect: burst + float at coin location
      const coinCollected = state.score > prev.score && state.score !== Math.floor(state.distance * 100);
      if (coinCollected) {
        // Find a recently collected coin
        for (const coin of prev.coins) {
          if (!coin.collected && coin.lane === state.player.lane && Math.abs(coin.y - state.player.y) < 0.04) {
            fx.push({ type: 'burst', x: coin.x, y: coin.y, hue: 50, count: 8, intensity: 0.3 });
            fx.push({ type: 'float', x: coin.x, y: coin.y, text: '+10', hue: 50 });
            break;
          }
        }
      }
      // Jump: small ring at launch point
      if (state.player.jumping && !prev.player.jumping) {
        fx.push({ type: 'ring', x: state.player.x, y: state.player.y, radius: 0.03, hue: 200, duration: 0.2 });
      }
      // Distance milestone every 1000m
      const curKm = Math.floor(state.distance * 100 / 1000);
      const prevKm = Math.floor(prev.distance * 100 / 1000);
      if (curKm > prevKm) {
        fx.push({ type: 'float', x: 0.5, y: 0.2, text: `${curKm * 1000}m!`, hue: 120, celebration: true, scale: 1.2 });
        fx.push({ type: 'burst', x: 0.5, y: 0.2, hue: 120, count: 15, intensity: 0.5 });
      }
      return fx;
    },

    audio(prev, state) {
      const events = [];
      // Death
      if (prev.alive && !state.alive) {
        events.push({ type: 'gameover' });
      }
      // Jump
      if (state.player.jumping && !prev.player.jumping) {
        events.push({ type: 'tap' });
        events.push({ type: 'sweep', freqStart: 300, freqEnd: 600, duration: 0.1, gain: 0.1 });
      }
      // Landing
      if (!state.player.jumping && prev.player.jumping) {
        events.push({ type: 'drum', freq: 100, duration: 0.06, gain: 0.08 });
      }
      // Lane change
      if (state.player.lane !== prev.player.lane) {
        events.push({ type: 'tap' });
      }
      // Coin collect: ascending note based on score
      const coinCollected = state.score > prev.score && state.score !== Math.floor(state.distance * 100);
      if (coinCollected) {
        const noteIdx = Math.min(Math.floor(state.score / 10) % 20, 19);
        events.push({ type: 'note', index: noteIdx, gain: 0.15 });
      }
      // Speed milestones every 1000m: celebration chord
      const curKm = Math.floor(state.distance * 100 / 1000);
      const prevKm = Math.floor(prev.distance * 100 / 1000);
      if (curKm > prevKm) {
        const base = Math.min(curKm * 3, 15);
        events.push({ type: 'chord', notes: [base, base + 2, base + 4], delay: 0.06 });
      }
      return events;
    },

    score(state) {
      return {
        primary: Math.floor(state.distance * 100),
        label: 'Distance',
        unit: 'm',
      };
    },

    status(state) {
      if (!state.alive) return { ended: true, reason: 'collision' };
      return 'playing';
    },

    bot(difficulty, rng) {
      let reactionTimer = 0;
      let decidedLane = 1;
      let lastDecisionTime = 0;

      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        const laneWidth = 1 / 3;
        const lanePositions = [laneWidth / 2, 0.5, 1 - laneWidth / 2];
        const taps = [];

        // Reaction delay: low difficulty bots re-evaluate slowly
        // d=0: every 0.2s, d=1.0: every frame
        reactionTimer -= dt;
        if (reactionTimer <= 0) {
          reactionTimer = (1 - difficulty) * (1 - difficulty) * 0.2;

          // Look-ahead distance scales with difficulty
          // d=0: sees 0.15 ahead, d=1: sees 0.4 ahead
          const lookDist = 0.15 + difficulty * 0.25;
          const upcoming = state.obstacles.filter(o =>
            o.y > state.player.y - lookDist && o.y < state.player.y
          );

          if (upcoming.length > 0) {
            const laneScores = [0, 0, 0];
            for (const obs of upcoming) {
              const urgency = 1 / Math.max(0.01, state.player.y - obs.y);
              laneScores[obs.lane] -= urgency;
              if (obs.type === 'ground') {
                laneScores[obs.lane] += urgency * 0.3 * difficulty;
              }
            }

            // Add noise inversely proportional to difficulty (multiplicative)
            for (let i = 0; i < 3; i++) {
              laneScores[i] += rng.float(-1, 1) * (1 - difficulty) * 3;
            }

            let best = 0;
            for (let i = 1; i < 3; i++) {
              if (laneScores[i] > laneScores[best]) best = i;
            }
            decidedLane = best;
          }
        }

        // Jump: only high-difficulty bots jump reliably, low bots miss the timing
        const upcoming = state.obstacles.filter(o =>
          o.lane === decidedLane &&
          o.type === 'ground' &&
          o.y > state.player.y - 0.15 && o.y < state.player.y
        );
        if (upcoming.length > 0 && !state.player.jumping) {
          // Jump probability scales with difficulty
          const jumpChance = difficulty * difficulty;
          if (rng.float(0, 1) < jumpChance) {
            taps.push({ x: 0.5, y: 0.5, time: 0 });
          }
        }

        return {
          thumb: { active: true, x: lanePositions[decidedLane], y: 0.5, vx: 0, vy: 0, startX: lanePositions[decidedLane], startY: 0.5, duration: 1 },
          gyro: null,
          taps,
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'initialSpeed', label: 'Initial Speed', type: 'float', min: 0.2, max: 0.8, default: 0.4, step: 0.05 },
        { key: 'acceleration', label: 'Speed Up', type: 'float', min: 0, max: 0.01, default: 0.003, step: 0.001 },
      ];
    },
  };
}
