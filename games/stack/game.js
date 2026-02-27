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
      // Background — dark gradient feel
      draw.clear(0.05, 0.05, 0.12);

      const towerHeight = state.tower.length;
      const blockH = 0.04;
      // Camera offset: scroll up so the action stays in the upper-middle area
      // We want the current stacking level to be around y=0.35
      const stackingY = 0.35;
      const currentLevel = towerHeight; // the level the swinging block is at
      const cameraOffset = Math.max(0, currentLevel * blockH - (1.0 - stackingY));

      // Helper: convert tower index to screen Y
      function blockY(index) {
        return 1.0 - (index + 1) * blockH + cameraOffset;
      }

      // Draw subtle grid lines for depth
      for (let i = 0; i < 20; i++) {
        const gy = 1.0 - i * blockH + cameraOffset;
        if (gy < -0.1 || gy > 1.1) continue;
        draw.line(0, gy, 1, gy, { color: 'rgba(255,255,255,0.03)', width: 1 });
      }

      // Draw placed tower blocks
      for (let i = 0; i < state.tower.length; i++) {
        const block = state.tower[i];
        const y = blockY(i);

        // Skip blocks that are off-screen
        if (y > 1.1 || y + blockH < -0.1) continue;

        // Color: hue cycles through spectrum based on height
        const hue = (i * 17) % 360;
        const saturation = 65 + (i % 3) * 10;
        const lightness = 50 + (i % 5) * 3;
        const fill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        draw.rect(block.x, y + blockH / 2, block.width, blockH * 0.9, {
          fill: fill,
          radius: 0.003,
        });

        // Subtle highlight on top edge
        draw.rect(block.x, y + blockH * 0.15, block.width * 0.95, blockH * 0.15, {
          fill: `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.3)`,
        });
      }

      // Draw current swinging block (if alive)
      if (state.alive) {
        const block = state.currentBlock;
        const y = blockY(towerHeight);

        const hue = (towerHeight * 17) % 360;
        const fill = `hsl(${hue}, 70%, 60%)`;

        draw.rect(block.x, y + blockH / 2, block.width, blockH * 0.9, {
          fill: fill,
          radius: 0.003,
          glow: 0.008,
          glowColor: `hsla(${hue}, 80%, 60%, 0.4)`,
        });

        // Guide line showing where the previous block is
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

      // Height counter (top center)
      draw.text(`${towerHeight}`, 0.5, 0.05, {
        size: 0.05,
        align: 'center',
        color: 'rgba(255,255,255,0.9)',
      });

      // Perfect streak indicator
      if (state.perfectStreak > 0 && state.alive) {
        const streakText = state.perfectStreak >= 3
          ? `PERFECT x${state.perfectStreak}!`
          : 'PERFECT!';
        draw.text(streakText, 0.5, 0.11, {
          size: 0.025,
          align: 'center',
          color: `hsl(${50 + state.perfectStreak * 20}, 100%, 70%)`,
        });
      }

      // Speed indicator
      const effectiveSpeed = state.speed + towerHeight * 0.012;
      draw.text(`${effectiveSpeed.toFixed(1)}x`, 0.95, 0.05, {
        size: 0.02,
        align: 'right',
        color: 'rgba(255,255,255,0.4)',
      });

      // Game over overlay
      if (!state.alive) {
        draw.text('GAME OVER', 0.5, 0.35, {
          size: 0.06,
          align: 'center',
          color: '#fff',
        });
        draw.text(`Height: ${towerHeight} blocks`, 0.5, 0.43, {
          size: 0.03,
          align: 'center',
          color: 'rgba(255,255,255,0.7)',
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

    audio(prev, state) {
      const events = [];

      // Block placed — rising click based on height
      if (state.justPlaced && !state.wasPerfect) {
        const height = state.tower.length;
        events.push({
          type: 'tone',
          freq: 300 + height * 20,
          duration: 0.08,
          gain: 0.2,
        });
      }

      // Perfect drop — special harmonic chord
      if (state.justPlaced && state.wasPerfect) {
        const height = state.tower.length;
        // Base note rises with height
        events.push({
          type: 'tone',
          freq: 400 + height * 25,
          duration: 0.15,
          gain: 0.25,
        });
        // Harmonic fifth above
        events.push({
          type: 'tone',
          freq: (400 + height * 25) * 1.5,
          duration: 0.12,
          gain: 0.15,
        });
      }

      // Game over — low thud
      if (prev.alive && !state.alive) {
        events.push({
          type: 'noise',
          filter: 'lowpass',
          freq: 150,
          duration: 0.6,
          gain: 0.35,
        });
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
