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
      // Sky gradient (approximated)
      draw.clear(0.05, 0.05, 0.12);

      // Ground
      draw.rect(0.5, 0.85, 1, 0.3, { fill: 'rgba(30, 35, 40, 1)' });

      // Lane dividers
      for (let i = 1; i < 3; i++) {
        const x = i / 3;
        // Dashed line effect
        for (let y = -state.stripeOffset; y < 1; y += 0.05) {
          draw.rect(x, y, 0.003, 0.025, {
            fill: 'rgba(255, 255, 255, 0.1)',
          });
        }
      }

      // Obstacles
      for (const obs of state.obstacles) {
        const color = obs.type === 'high' ? '#f84' : '#e44';
        const yOffset = obs.type === 'high' ? -0.04 : 0;
        draw.rect(obs.x, obs.y + yOffset, obs.width, obs.height, {
          fill: color,
          radius: 0.005,
        });
      }

      // Coins
      for (const coin of state.coins) {
        if (coin.collected) continue;
        const pulse = 0.8 + 0.2 * Math.sin(state.distance * 20 + coin.y * 10);
        draw.circle(coin.x, coin.y, 0.015 * pulse, {
          fill: '#fd0',
          glow: 0.008,
          glowColor: 'rgba(255, 220, 0, 0.3)',
        });
      }

      // Player
      if (state.alive) {
        const py = state.player.y - state.player.jumpHeight;
        // Shadow
        if (state.player.jumping) {
          draw.circle(state.player.x, state.player.y, 0.02 * (1 - state.player.jumpHeight * 2), {
            fill: 'rgba(0, 0, 0, 0.2)',
          });
        }
        // Body
        draw.circle(state.player.x, py, 0.022, {
          fill: '#4af',
          glow: 0.01,
          glowColor: 'rgba(68, 170, 255, 0.4)',
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
        });
        draw.text(`${Math.floor(state.distance * 100)}m`, 0.5, 0.5, {
          size: 0.035,
          color: 'rgba(255,255,255,0.7)',
        });
      }
    },

    audio(prev, state) {
      const events = [];
      if (prev.alive && !state.alive) {
        events.push({ type: 'noise', filter: 'lowpass', freq: 200, duration: 0.4, gain: 0.3 });
      }
      if (state.player.jumping && !prev.player.jumping) {
        events.push({ type: 'sweep', freqStart: 300, freqEnd: 600, duration: 0.1, gain: 0.1 });
      }
      // Coin collect
      if (state.score > prev.score && state.score % 10 === 0) {
        events.push({ type: 'tone', freq: 800, duration: 0.05, gain: 0.1 });
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
      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        const laneWidth = 1 / 3;
        const lanePositions = [laneWidth / 2, 0.5, 1 - laneWidth / 2];

        // Look ahead at upcoming obstacles
        const upcoming = state.obstacles.filter(o =>
          o.y > state.player.y - 0.4 && o.y < state.player.y
        );

        let targetLane = state.player.lane;
        const taps = [];

        if (upcoming.length > 0) {
          // Score each lane
          const laneScores = [0, 0, 0];
          for (const obs of upcoming) {
            const urgency = 1 / Math.max(0.01, state.player.y - obs.y);
            laneScores[obs.lane] -= urgency;
            // Can we jump this?
            if (obs.type === 'ground') {
              laneScores[obs.lane] += urgency * 0.5 * difficulty;
            }
          }

          // Add noise
          for (let i = 0; i < 3; i++) {
            laneScores[i] += rng.float(0, 1) * (1 - difficulty) * 2;
          }

          // Pick best lane
          let best = 0;
          for (let i = 1; i < 3; i++) {
            if (laneScores[i] > laneScores[best]) best = i;
          }
          targetLane = best;

          // Jump if obstacle in our lane is ground type and close
          const closestInLane = upcoming.find(o =>
            o.lane === targetLane &&
            o.type === 'ground' &&
            state.player.y - o.y < 0.15
          );
          if (closestInLane && !state.player.jumping && difficulty > 0.3) {
            taps.push({ x: 0.5, y: 0.5, time: 0 });
          }
        }

        return {
          thumb: { active: true, x: lanePositions[targetLane], y: 0.5, vx: 0, vy: 0, startX: lanePositions[targetLane], startY: 0.5, duration: 1 },
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
