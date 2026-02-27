// games/aim/game.js — Aim/reflex trainer
// Genre: TAP — discrete input, reaction time + precision scoring, health-based survival
// Validates: taps input, discrete target acquisition, combo systems, bounded scoring

export function createGame(config) {
  const TICK_RATE = 60;
  const dt = 1 / TICK_RATE;

  return {
    meta: {
      id: 'aim',
      name: 'Aim Trainer',
      version: '0.1.0',
      players: 1,
      inputChannels: ['taps'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'landscape', aspect: 16 / 9 },
    },

    init(params) {
      return {
        targets: [],
        // Visual-only hit effects (not part of game logic, just rendering)
        hitEffects: [],
        score: 0,
        health: 100,
        combo: 0,
        maxCombo: 0,
        spawnTimer: 0,
        elapsed: 0,
        targetsHit: 0,
        targetsMissed: 0,
        // Configurable params with defaults
        targetLife: params.targetLife || 2.0,
        spawnRate: params.spawnRate || 1.2,
        healthDrain: params.healthDrain || 15,
        targetRadius: params.targetRadius || 0.045,
        // Internal tracking
        nextTargetId: 0,
        // Difficulty ramp: spawn rate increases over time
        difficultyTimer: 0,
        // Multi-target: chance of spawning 2+ targets at once
        multiTargetChance: 0.0,
      };
    },

    step(state, input, dt, rng) {
      if (state.health <= 0) return state;

      state.elapsed += dt;
      state.difficultyTimer += dt;

      // Ramp difficulty over time
      // Every 10 seconds: spawn rate increases, multi-target chance grows, target life shrinks
      const difficultyLevel = Math.floor(state.difficultyTimer / 10);
      const currentSpawnRate = state.spawnRate + difficultyLevel * 0.15;
      const currentTargetLife = Math.max(0.8, state.targetLife - difficultyLevel * 0.1);
      state.multiTargetChance = Math.min(0.5, difficultyLevel * 0.08);

      // Update existing targets — shrink them over their lifetime
      for (const target of state.targets) {
        target.age += dt;
        // Remaining life fraction (1.0 = fresh, 0.0 = expired)
        target.life = Math.max(0, 1 - target.age / target.maxLife);
      }

      // Remove expired targets — each expired target costs health
      const expired = state.targets.filter(t => t.life <= 0);
      for (const t of expired) {
        state.health -= state.healthDrain;
        state.combo = 0;
        state.targetsMissed++;
      }
      state.targets = state.targets.filter(t => t.life > 0);

      // Process taps — find closest target within hit radius
      if (input.taps && input.taps.length > 0) {
        for (const tap of input.taps) {
          let bestTarget = null;
          let bestDist = Infinity;

          for (const target of state.targets) {
            if (target.hit) continue;
            const dx = tap.x - target.x;
            const dy = tap.y - target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Hit radius is the target's current visual radius (shrinks with life)
            const hitRadius = target.radius * target.life;
            if (dist < hitRadius && dist < bestDist) {
              bestDist = dist;
              bestTarget = target;
            }
          }

          if (bestTarget) {
            bestTarget.hit = true;

            // Score calculation:
            // - Base points for hitting
            // - Accuracy bonus: closer to center = more points (0-50 bonus)
            // - Time bonus: hitting early = more points (0-50 bonus)
            // - Combo multiplier
            const hitRadius = bestTarget.radius * bestTarget.life;
            const accuracyRatio = 1 - (bestDist / hitRadius);
            const timeRatio = bestTarget.life;

            const basePoints = 100;
            const accuracyBonus = Math.floor(accuracyRatio * 50);
            const timeBonus = Math.floor(timeRatio * 50);

            state.combo++;
            if (state.combo > state.maxCombo) state.maxCombo = state.combo;

            const comboMultiplier = 1 + Math.min(state.combo - 1, 9) * 0.1; // max 2.0x at 10 combo
            const points = Math.floor((basePoints + accuracyBonus + timeBonus) * comboMultiplier);
            state.score += points;
            state.targetsHit++;

            // Store hit info for rendering and audio
            bestTarget.hitAccuracy = accuracyRatio;
            bestTarget.hitPoints = points;
            bestTarget.hitTime = state.elapsed;

            // Add hit effect for rendering
            state.hitEffects.push({
              x: bestTarget.x,
              y: bestTarget.y,
              radius: bestTarget.radius,
              accuracy: accuracyRatio,
              points: points,
              time: 0,
              maxTime: 0.4,
            });
          }
        }

        // Remove hit targets
        state.targets = state.targets.filter(t => !t.hit);
      }

      // Update hit effects
      for (const effect of state.hitEffects) {
        effect.time += dt;
      }
      state.hitEffects = state.hitEffects.filter(e => e.time < e.maxTime);

      // Spawn new targets
      state.spawnTimer += dt;
      const spawnInterval = 1 / currentSpawnRate;
      while (state.spawnTimer >= spawnInterval) {
        state.spawnTimer -= spawnInterval;

        // Determine how many targets to spawn
        const count = rng.random() < state.multiTargetChance ? rng.int(2, 3) : 1;

        for (let i = 0; i < count; i++) {
          const radius = state.targetRadius;
          // Keep targets within padded bounds so they're fully visible
          const pad = radius + 0.02;
          // Viewport height in normalized coords: for 16:9 landscape, height = 9/16
          const viewH = 9 / 16;
          const x = rng.float(pad, 1 - pad);
          const y = rng.float(pad + 0.06, viewH - pad); // extra top pad for HUD

          state.targets.push({
            id: state.nextTargetId++,
            x,
            y,
            radius,
            age: 0,
            maxLife: currentTargetLife,
            life: 1.0,
            hit: false,
            hitAccuracy: 0,
            hitPoints: 0,
            hitTime: 0,
            hue: rng.float(0, 360),
          });
        }
      }

      // Clamp health
      state.health = Math.max(0, Math.min(100, state.health));

      return state;
    },

    render(state, draw, alpha) {
      // Dark background
      draw.clear(0.06, 0.05, 0.08);

      const viewH = 9 / 16;

      // Subtle grid lines for spatial reference
      for (let i = 1; i <= 4; i++) {
        draw.line(i * 0.2, 0, i * 0.2, viewH, { color: 'rgba(255,255,255,0.03)', width: 1 });
      }
      for (let i = 1; i <= 2; i++) {
        draw.line(0, i * viewH / 3, 1, i * viewH / 3, { color: 'rgba(255,255,255,0.03)', width: 1 });
      }

      // Draw targets
      for (const target of state.targets) {
        const currentRadius = target.radius * target.life;
        const urgency = 1 - target.life; // 0 = fresh, 1 = about to expire

        // Outer ring — timer indicator (shrinks with life)
        draw.circle(target.x, target.y, target.radius, {
          stroke: `hsla(${target.hue}, 70%, 55%, 0.3)`,
          lineWidth: 0.002,
        });

        // Inner filled circle — the actual target (shrinks)
        const fillAlpha = 0.6 + urgency * 0.4;
        draw.circle(target.x, target.y, currentRadius, {
          fill: `hsla(${target.hue}, 80%, 60%, ${fillAlpha})`,
          glow: 0.008 + urgency * 0.012,
          glowColor: `hsla(${target.hue}, 90%, 70%, ${0.3 + urgency * 0.4})`,
        });

        // Center dot — bullseye
        draw.circle(target.x, target.y, 0.004, {
          fill: '#fff',
        });

        // Warning pulse when target is about to expire (last 30% of life)
        if (target.life < 0.3) {
          const pulse = Math.sin(state.elapsed * 15) * 0.5 + 0.5;
          draw.circle(target.x, target.y, currentRadius + 0.005, {
            stroke: `rgba(255, 80, 60, ${pulse * 0.6})`,
            lineWidth: 0.003,
          });
        }
      }

      // Draw hit effects — expanding ring + floating score
      for (const effect of state.hitEffects) {
        const progress = effect.time / effect.maxTime;
        const expandRadius = effect.radius * (1 + progress * 2);
        const fadeAlpha = 1 - progress;

        // Expanding ring
        const hue = effect.accuracy > 0.7 ? 120 : effect.accuracy > 0.4 ? 60 : 30;
        draw.circle(effect.x, effect.y, expandRadius, {
          stroke: `hsla(${hue}, 80%, 70%, ${fadeAlpha * 0.6})`,
          lineWidth: 0.002 * (1 - progress),
        });

        // Floating score text
        const floatY = effect.y - progress * 0.05;
        draw.text(`+${effect.points}`, effect.x, floatY, {
          size: 0.02 + effect.accuracy * 0.01,
          align: 'center',
          color: `hsla(${hue}, 80%, 80%, ${fadeAlpha})`,
        });
      }

      // HUD — Score and combo (top center)
      draw.text(`${state.score}`, 0.5, 0.025, {
        size: 0.035,
        align: 'center',
        color: 'rgba(255,255,255,0.9)',
      });

      // Combo display
      if (state.combo > 1) {
        const comboAlpha = Math.min(1, 0.5 + state.combo * 0.05);
        const comboHue = Math.min(120, state.combo * 12);
        draw.text(`${state.combo}x COMBO`, 0.5, 0.055, {
          size: 0.018,
          align: 'center',
          color: `hsla(${comboHue}, 80%, 70%, ${comboAlpha})`,
        });
      }

      // Health bar (top left)
      const barW = 0.2;
      const barH = 0.012;
      const barX = 0.05;
      const barY = 0.02;
      // Background
      draw.rect(barX + barW / 2, barY + barH / 2, barW, barH, {
        fill: 'rgba(255,255,255,0.1)',
        radius: 0.003,
      });
      // Fill
      const healthFrac = state.health / 100;
      const healthHue = healthFrac * 120; // red to green
      if (healthFrac > 0) {
        const fillW = barW * healthFrac;
        draw.rect(barX + fillW / 2, barY + barH / 2, fillW, barH, {
          fill: `hsl(${healthHue}, 70%, 50%)`,
          radius: 0.003,
        });
      }
      // Health label
      draw.text('HP', barX - 0.015, barY + barH / 2 + 0.003, {
        size: 0.012,
        align: 'right',
        color: 'rgba(255,255,255,0.5)',
      });

      // Stats (top right)
      const accuracy = state.targetsHit + state.targetsMissed > 0
        ? Math.floor((state.targetsHit / (state.targetsHit + state.targetsMissed)) * 100)
        : 100;
      draw.text(`${accuracy}%`, 0.95, 0.025, {
        size: 0.018,
        align: 'right',
        color: 'rgba(255,255,255,0.5)',
      });
      draw.text(`${state.targetsHit}/${state.targetsHit + state.targetsMissed}`, 0.95, 0.045, {
        size: 0.012,
        align: 'right',
        color: 'rgba(255,255,255,0.3)',
      });

      // Game over overlay
      if (state.health <= 0) {
        // Dim background
        draw.rect(0.5, viewH / 2, 1, viewH, {
          fill: 'rgba(0,0,0,0.6)',
        });

        draw.text('GAME OVER', 0.5, viewH * 0.35, {
          size: 0.06,
          align: 'center',
          color: '#fff',
        });
        draw.text(`Score: ${state.score}`, 0.5, viewH * 0.48, {
          size: 0.03,
          align: 'center',
          color: 'rgba(255,255,255,0.8)',
        });
        draw.text(`Accuracy: ${accuracy}%  |  Max Combo: ${state.maxCombo}x`, 0.5, viewH * 0.58, {
          size: 0.018,
          align: 'center',
          color: 'rgba(255,255,255,0.5)',
        });
      }
    },

    audio(prev, state) {
      const events = [];

      // Hit sound — satisfying pop, pitch varies by accuracy
      if (state.targetsHit > prev.targetsHit) {
        const recentHit = state.hitEffects.find(e => e.time < 0.02);
        const accuracy = recentHit ? recentHit.accuracy : 0.5;
        // Higher accuracy = higher pitch pop
        const freq = 400 + accuracy * 600; // 400-1000 Hz range
        events.push({
          type: 'tone',
          freq,
          duration: 0.08,
          gain: 0.25,
          wave: 'sine',
          env: 'pluck',
        });
      }

      // Miss sound — low thud when target expires (health decreased)
      if (state.targetsMissed > prev.targetsMissed) {
        events.push({
          type: 'noise',
          filter: 'lowpass',
          filterFreq: 300,
          duration: 0.15,
          gain: 0.2,
        });
      }

      // Combo chime — ascending tone when combo reaches multiples of 5
      if (state.combo >= 5 && state.combo > prev.combo && state.combo % 5 === 0) {
        const comboLevel = Math.min(state.combo / 5, 4);
        events.push({
          type: 'sweep',
          freqStart: 500 + comboLevel * 100,
          freqEnd: 800 + comboLevel * 150,
          duration: 0.2,
          gain: 0.15,
          wave: 'triangle',
        });
      }

      // Combo break sound
      if (prev.combo >= 3 && state.combo === 0) {
        events.push({
          type: 'tone',
          freq: 150,
          duration: 0.2,
          gain: 0.15,
          wave: 'sawtooth',
          env: 'pluck',
        });
      }

      // Death sound
      if (prev.health > 0 && state.health <= 0) {
        events.push({
          type: 'sweep',
          freqStart: 600,
          freqEnd: 80,
          duration: 0.6,
          gain: 0.3,
          wave: 'sawtooth',
        });
      }

      return events;
    },

    score(state) {
      const total = state.targetsHit + state.targetsMissed;
      return {
        primary: state.score,
        label: 'Score',
        unit: 'pts',
        breakdown: {
          targetsHit: state.targetsHit,
          targetsMissed: state.targetsMissed,
          accuracy: total > 0 ? state.targetsHit / total : 0,
          maxCombo: state.maxCombo,
        },
        normalized: null, // no natural ceiling
      };
    },

    status(state) {
      if (state.health <= 0) return { ended: true, reason: 'health_depleted' };
      return 'playing';
    },

    bot(difficulty, rng) {
      // Bot state: reaction delay tracking
      let reactionCooldown = 0;
      let currentTarget = null;

      return (state, dt) => {
        if (state.health <= 0) return { thumb: null, gyro: null, taps: [], keys: {} };

        const taps = [];

        // Reaction delay: inversely proportional to difficulty
        // difficulty 1.0 = 3 frames delay (~50ms), difficulty 0.0 = 40 frames (~667ms)
        const maxDelay = 40;
        const minDelay = 3;
        const reactionFrames = Math.floor(minDelay + (1 - difficulty) * (maxDelay - minDelay));

        if (reactionCooldown > 0) {
          reactionCooldown--;
        }

        if (reactionCooldown <= 0 && state.targets.length > 0) {
          // Pick the target with the least remaining life (most urgent)
          let bestTarget = null;
          let bestLife = Infinity;
          for (const target of state.targets) {
            if (target.life < bestLife) {
              bestLife = target.life;
              bestTarget = target;
            }
          }

          if (bestTarget) {
            // Aim precision scales with difficulty
            // Low difficulty: large offset from center. High difficulty: near-perfect aim.
            const maxOffset = bestTarget.radius * bestTarget.life * (1 - difficulty) * 0.8;
            const angle = rng.float(0, Math.PI * 2);
            const offset = rng.float(0, maxOffset);

            const tapX = bestTarget.x + Math.cos(angle) * offset;
            const tapY = bestTarget.y + Math.sin(angle) * offset;

            taps.push({ x: tapX, y: tapY, time: 0 });

            // Reset cooldown
            reactionCooldown = reactionFrames;
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
        { key: 'targetLife', label: 'Target Lifetime', type: 'float', min: 0.5, max: 5.0, default: 2.0, step: 0.1 },
        { key: 'spawnRate', label: 'Spawn Rate', type: 'float', min: 0.3, max: 3.0, default: 1.2, step: 0.1 },
        { key: 'healthDrain', label: 'Miss Penalty', type: 'float', min: 5, max: 50, default: 15, step: 5 },
        { key: 'targetRadius', label: 'Target Size', type: 'float', min: 0.02, max: 0.08, default: 0.045, step: 0.005 },
      ];
    },
  };
}
