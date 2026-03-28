// games/stack/game.js — Classic block stacking game
// Genre: TAP — timing-based, tap to drop swinging block, stack as high as possible
// Validates: tap input, timing precision, score-per-action

export function createGame(config) {
  const TICK_RATE = 60;

  return {
    meta: {
      id: 'stack',
      name: 'Stack',
      version: '0.1.0',
      players: 1,
      inputChannels: ['taps'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 16 },
    },

    init(params) {
      const initialWidth = params.initialWidth || 0.4;
      const speed = params.speed || 0.5;
      const perfectThreshold = params.perfectThreshold || 0.01;

      // The base block sits at the bottom, centered
      const baseBlock = {
        x: 0.5,
        width: initialWidth,
        height: 0.04,
      };

      return {
        tower: [baseBlock],
        currentBlock: {
          x: 0.0,
          width: initialWidth,
          height: 0.04,
          direction: 1, // 1 = moving right, -1 = moving left
        },
        baseWidth: initialWidth,
        speed: speed,
        perfectThreshold: perfectThreshold,
        minWidth: 0.02,
        alive: true,
        perfectStreak: 0,
        totalPerfects: 0,
        justPlaced: false,      // true on the frame a block was placed
        wasPerfect: false,      // true if the last placement was perfect
        gameOverReason: null,
      };
    },

    step(state, input, dt, rng) {
      if (!state.alive) return state;

      // Reset per-frame flags
      state.justPlaced = false;
      state.wasPerfect = false;

      const block = state.currentBlock;

      // Increase speed with tower height (gradual ramp)
      const heightBonus = state.tower.length * 0.012;
      const effectiveSpeed = state.speed + heightBonus;

      // Oscillate current block left-right
      block.x += block.direction * effectiveSpeed * dt;

      // Bounce off edges (keep the block center within [0, 1])
      if (block.x + block.width / 2 > 1.0) {
        block.x = 1.0 - block.width / 2;
        block.direction = -1;
      } else if (block.x - block.width / 2 < 0.0) {
        block.x = block.width / 2;
        block.direction = 1;
      }

      // Check for tap input
      const tapped = input.taps && input.taps.length > 0;

      if (tapped) {
        const prev = state.tower[state.tower.length - 1];

        // Calculate overlap between current block and top of tower
        const currLeft = block.x - block.width / 2;
        const currRight = block.x + block.width / 2;
        const prevLeft = prev.x - prev.width / 2;
        const prevRight = prev.x + prev.width / 2;

        const overlapLeft = Math.max(currLeft, prevLeft);
        const overlapRight = Math.min(currRight, prevRight);
        const overlapWidth = overlapRight - overlapLeft;

        if (overlapWidth <= 0) {
          // No overlap — missed entirely, game over
          state.alive = false;
          state.gameOverReason = 'missed';
          return state;
        }

        // Check if this is a perfect drop
        const offset = Math.abs(block.x - prev.x);
        const isPerfect = offset <= state.perfectThreshold;

        let placedWidth;
        let placedX;

        if (isPerfect) {
          // Perfect: keep the full width of the previous block
          placedWidth = prev.width;
          placedX = prev.x;
          state.perfectStreak++;
          state.totalPerfects++;
        } else {
          // Trim overhang: new block is only the overlapping region
          placedWidth = overlapWidth;
          placedX = overlapLeft + overlapWidth / 2;
          state.perfectStreak = 0;
        }

        state.justPlaced = true;
        state.wasPerfect = isPerfect;

        // Place the trimmed block on the tower
        state.tower.push({
          x: placedX,
          width: placedWidth,
          height: block.height,
        });

        // Check if block has become too narrow
        if (placedWidth < state.minWidth) {
          state.alive = false;
          state.gameOverReason = 'too_narrow';
          return state;
        }

        // Spawn new swinging block with the placed width
        // Alternate starting direction each level
        const newDirection = state.tower.length % 2 === 0 ? 1 : -1;
        state.currentBlock = {
          x: newDirection === 1 ? placedWidth / 2 : 1.0 - placedWidth / 2,
          width: placedWidth,
          height: block.height,
          direction: newDirection,
        };
      }

      return state;
    },

    render(state, draw, alpha) {
      // Background with radial depth
      draw.clear(0.05, 0.05, 0.12);
      draw.circle(0.5, 0.3, 0.7, {
        gradient: [
          { stop: 0, color: 'hsla(240, 30%, 16%, 0.3)' },
          { stop: 1, color: 'hsla(240, 30%, 5%, 0)' },
        ],
      });

      const towerHeight = state.tower.length;
      const blockH = 0.04;
      const stackingY = 0.35;
      const currentLevel = towerHeight;
      const cameraOffset = Math.max(0, currentLevel * blockH - (1.0 - stackingY));

      function blockY(index) {
        return 1.0 - (index + 1) * blockH + cameraOffset;
      }

      // Subtle grid lines for depth
      for (let i = 0; i < 20; i++) {
        const gy = 1.0 - i * blockH + cameraOffset;
        if (gy < -0.1 || gy > 1.1) continue;
        draw.line(0, gy, 1, gy, { color: 'rgba(255,255,255,0.03)', width: 1 });
      }

      // Placed tower blocks with gradient
      for (let i = 0; i < state.tower.length; i++) {
        const block = state.tower[i];
        const y = blockY(i);
        if (y > 1.1 || y + blockH < -0.1) continue;

        const hue = (i * 17) % 360;
        const saturation = 65 + (i % 3) * 10;
        const lightness = 50 + (i % 5) * 3;

        draw.rect(block.x, y + blockH / 2, block.width, blockH * 0.9, {
          gradient: [
            { stop: 0, color: `hsl(${hue}, ${saturation}%, ${lightness + 12}%)` },
            { stop: 1, color: `hsl(${hue}, ${saturation}%, ${lightness - 8}%)` },
          ],
          radius: 0.003,
        });

        // Subtle highlight on top edge
        draw.rect(block.x, y + blockH * 0.15, block.width * 0.95, blockH * 0.15, {
          fill: `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.3)`,
        });
      }

      // Current swinging block with glow
      if (state.alive) {
        const block = state.currentBlock;
        const y = blockY(towerHeight);

        const hue = (towerHeight * 17) % 360;

        // Glow behind active block
        draw.rect(block.x, y + blockH / 2, block.width * 1.1, blockH * 1.3, {
          gradient: [
            { stop: 0, color: `hsla(${hue}, 80%, 60%, 0.15)` },
            { stop: 1, color: `hsla(${hue}, 80%, 50%, 0)` },
          ],
          blend: 'lighter',
        });

        draw.rect(block.x, y + blockH / 2, block.width, blockH * 0.9, {
          gradient: [
            { stop: 0, color: `hsl(${hue}, 75%, 72%)` },
            { stop: 1, color: `hsl(${hue}, 70%, 48%)` },
          ],
          radius: 0.003,
        });

        // Guide lines
        if (state.tower.length > 0) {
          const prev = state.tower[state.tower.length - 1];
          draw.line(prev.x - prev.width / 2, y + blockH, prev.x - prev.width / 2, y, {
            color: 'rgba(255,255,255,0.15)',
            width: 1,
          });
          draw.line(prev.x + prev.width / 2, y + blockH, prev.x + prev.width / 2, y, {
            color: 'rgba(255,255,255,0.15)',
            width: 1,
          });
        }
      }

      // Height counter
      draw.text(`${towerHeight}`, 0.5, 0.05, {
        size: 0.05,
        align: 'center',
        color: 'rgba(255,255,255,0.9)',
        shadow: 'rgba(0,0,0,0.5)',
        shadowBlur: 4,
      });

      // Perfect streak indicator
      if (state.perfectStreak > 0 && state.alive) {
        const streakText = state.perfectStreak >= 3
          ? `PERFECT x${state.perfectStreak}!`
          : 'PERFECT!';
        const streakHue = 50 + state.perfectStreak * 20;
        draw.text(streakText, 0.5, 0.11, {
          size: 0.025,
          align: 'center',
          color: `hsl(${streakHue}, 100%, 70%)`,
          shadow: `hsla(${streakHue}, 100%, 60%, 0.5)`,
          shadowBlur: 10,
        });
      }

      // Speed indicator
      const effectiveSpeed = state.speed + towerHeight * 0.012;
      draw.text(`${effectiveSpeed.toFixed(1)}x`, 0.95, 0.05, {
        size: 0.02,
        align: 'right',
        color: 'rgba(255,255,255,0.4)',
      });

      // Game over
      if (!state.alive) {
        draw.text('GAME OVER', 0.5, 0.35, {
          size: 0.06,
          align: 'center',
          color: '#fff',
          shadow: 'rgba(255, 100, 50, 0.6)',
          shadowBlur: 20,
        });
        draw.text(`Height: ${towerHeight} blocks`, 0.5, 0.43, {
          size: 0.03,
          align: 'center',
          color: 'rgba(255,255,255,0.7)',
          shadow: 'rgba(0,0,0,0.5)',
          shadowBlur: 4,
        });
        if (state.totalPerfects > 0) {
          draw.text(`Perfect drops: ${state.totalPerfects}`, 0.5, 0.49, {
            size: 0.022,
            align: 'center',
            color: 'rgba(255,220,100,0.7)',
          });
        }
      }
    },

    effects(prev, state) {
      const fx = [];
      const height = state.tower.length;

      if (state.justPlaced) {
        const top = state.tower[state.tower.length - 1];
        const hue = ((height - 1) * 17) % 360;

        if (state.wasPerfect) {
          // Perfect — big burst and ring
          fx.push({ type: 'burst', x: top.x, y: 0.35, hue: hue, count: 12, intensity: 0.9 });
          fx.push({ type: 'ring', x: top.x, y: 0.35, radius: 0.15, hue: hue });
          fx.push({ type: 'float', x: top.x, y: 0.3, text: 'PERFECT', hue: 50, celebration: true, scale: 1.5 });
          fx.push({ type: 'shake', trauma: 0.1 });

          // Streak milestones
          if (state.perfectStreak >= 3) {
            fx.push({ type: 'flash', intensity: 0.2 });
            fx.push({ type: 'float', x: 0.5, y: 0.25, text: `x${state.perfectStreak}`, hue: 50, celebration: true, scale: 2.0 });
          }
        } else {
          // Normal placement — smaller burst
          fx.push({ type: 'burst', x: top.x, y: 0.35, hue: hue, count: 5, intensity: 0.4 });
          fx.push({ type: 'shake', trauma: 0.05 });
        }
      }

      // Game over — heavy shake and flash
      if (prev.alive && !state.alive) {
        fx.push({ type: 'shake', trauma: 0.5 });
        fx.push({ type: 'flash', intensity: 0.5 });
      }

      return fx;
    },

    audio(prev, state) {
      const events = [];
      const height = state.tower.length;

      // Block placed (non-perfect) — note rises with height
      if (state.justPlaced && !state.wasPerfect) {
        const noteIndex = Math.min(height, 19);
        events.push({ type: 'note', index: noteIndex, gain: 0.2 });
        events.push({ type: 'tap' });
      }

      // Perfect drop — chord that rises with height
      if (state.justPlaced && state.wasPerfect) {
        const base = Math.min(height, 14);
        events.push({ type: 'chord', notes: [base, base + 4, base + 7], gain: 0.25 });

        // Big streak milestone
        if (state.perfectStreak >= 3 && state.perfectStreak % 3 === 0) {
          events.push({ type: 'chord', notes: [base + 2, base + 5, base + 9, base + 12], delay: 0.08, gain: 0.15 });
        }
      }

      // Game over
      if (prev.alive && !state.alive) {
        events.push({ type: 'gameover' });
      }

      return events;
    },

    score(state) {
      return {
        primary: state.tower.length,
        label: 'Height',
        unit: ' blocks',
        breakdown: {
          perfects: state.totalPerfects,
          bestStreak: state.perfectStreak,
        },
        normalized: null, // no natural ceiling
      };
    },

    status(state) {
      if (!state.alive) return { ended: true, reason: state.gameOverReason || 'missed' };
      return 'playing';
    },

    bot(difficulty, rng) {
      // Bot that times the drop based on how close the swinging block is to alignment
      // Higher difficulty = drops closer to perfect center, less noise
      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        const block = state.currentBlock;
        const prev = state.tower[state.tower.length - 1];

        // Calculate how far off-center the block is
        const offset = Math.abs(block.x - prev.x);

        // Difficulty determines the acceptable offset before tapping
        // At difficulty 1.0: tap when nearly perfectly aligned
        // At difficulty 0.0: tap with large random tolerance
        const maxAcceptableOffset = prev.width * (0.5 - difficulty * 0.45);
        const noise = (1 - difficulty) * rng.float(0, prev.width * 0.15);
        const threshold = maxAcceptableOffset + noise;

        // Also add a reaction delay: lower difficulty bots react slower
        // Simulated by requiring the block to be moving toward center
        const movingTowardCenter = (block.x > prev.x && block.direction === -1) ||
                                   (block.x < prev.x && block.direction === 1) ||
                                   offset < threshold;

        const shouldTap = offset < threshold && movingTowardCenter;

        if (shouldTap) {
          return {
            thumb: null,
            gyro: null,
            taps: [{ x: 0.5, y: 0.5, time: 0 }],
            keys: {},
          };
        }

        // Not tapping this frame
        return { thumb: null, gyro: null, taps: [], keys: {} };
      };
    },

    configure() {
      return [
        { key: 'initialWidth', label: 'Initial Width', type: 'float', min: 0.15, max: 0.6, default: 0.4, step: 0.05 },
        { key: 'speed', label: 'Block Speed', type: 'float', min: 0.2, max: 1.5, default: 0.5, step: 0.1 },
        { key: 'perfectThreshold', label: 'Perfect Threshold', type: 'float', min: 0.005, max: 0.05, default: 0.01, step: 0.005 },
      ];
    },
  };
}
