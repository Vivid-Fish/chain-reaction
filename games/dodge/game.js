// games/dodge/game.js — Simple obstacle dodge game
// Genre: STEER — continuous control, avoid obstacles, survive as long as possible
// Validates: thumb-rect input, continuous control, distance-based scoring

export function createGame(config) {
  const TICK_RATE = 60;
  const dt = 1 / TICK_RATE;

  return {
    meta: {
      id: 'dodge',
      name: 'Dodge',
      version: '0.1.0',
      players: 1,
      inputChannels: ['thumb'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 16 },
    },

    init(params) {
      return {
        player: { x: 0.5, y: 0.8, radius: 0.025 },
        obstacles: [],
        distance: 0,
        alive: true,
        spawnTimer: 0,
        speed: params.speed || 0.3,
        spawnRate: params.spawnRate || 1.5,
        acceleration: params.acceleration || 0.002,
      };
    },

    step(state, input, dt, rng) {
      if (!state.alive) return state;

      // Move player toward thumb position
      if (input.thumb && input.thumb.active) {
        const targetX = input.thumb.x;
        const dx = targetX - state.player.x;
        // Smooth follow with slight inertia
        state.player.x += dx * 0.15;
      }
      // Clamp player to bounds
      state.player.x = Math.max(state.player.radius, Math.min(1 - state.player.radius, state.player.x));

      // Speed increases over time
      state.speed += state.acceleration * dt;

      // Spawn obstacles
      state.spawnTimer += dt;
      const spawnInterval = 1 / state.spawnRate;
      while (state.spawnTimer >= spawnInterval) {
        state.spawnTimer -= spawnInterval;
        const width = rng.float(0.05, 0.2);
        const x = rng.float(width / 2, 1 - width / 2);
        state.obstacles.push({
          x, y: -0.05,
          width, height: 0.02,
          hue: rng.float(0, 360),
        });
      }

      // Move obstacles down
      for (const obs of state.obstacles) {
        obs.y += state.speed * dt;
      }

      // Remove off-screen obstacles
      state.obstacles = state.obstacles.filter(o => o.y < 1.1);

      // Collision detection (AABB vs circle)
      for (const obs of state.obstacles) {
        const closestX = Math.max(obs.x - obs.width / 2, Math.min(obs.x + obs.width / 2, state.player.x));
        const closestY = Math.max(obs.y - obs.height / 2, Math.min(obs.y + obs.height / 2, state.player.y));
        const dx = state.player.x - closestX;
        const dy = state.player.y - closestY;
        if (dx * dx + dy * dy < state.player.radius * state.player.radius) {
          state.alive = false;
          break;
        }
      }

      // Distance increases
      state.distance += state.speed * dt;

      return state;
    },

    render(state, draw, alpha) {
      // Background
      draw.clear(0.02, 0.02, 0.06);

      // Lane lines (subtle visual)
      for (let i = 1; i <= 4; i++) {
        draw.line(i * 0.2, 0, i * 0.2, 1, { color: 'rgba(255,255,255,0.05)', width: 1 });
      }

      // Obstacles
      for (const obs of state.obstacles) {
        draw.rect(obs.x, obs.y, obs.width, obs.height, {
          fill: `hsl(${obs.hue}, 70%, 55%)`,
          radius: 0.005,
        });
      }

      // Player
      if (state.alive) {
        draw.circle(state.player.x, state.player.y, state.player.radius, {
          fill: '#4af',
          glow: 0.015,
          glowColor: 'rgba(68, 170, 255, 0.4)',
        });
      }

      // Score
      draw.text(`${Math.floor(state.distance * 100)}m`, 0.5, 0.04, {
        size: 0.035,
        align: 'center',
        color: 'rgba(255,255,255,0.8)',
      });

      // Speed indicator
      draw.text(`${state.speed.toFixed(1)}x`, 0.95, 0.04, {
        size: 0.02,
        align: 'right',
        color: 'rgba(255,255,255,0.4)',
      });

      // Game over
      if (!state.alive) {
        draw.text('GAME OVER', 0.5, 0.4, {
          size: 0.06,
          align: 'center',
          color: '#fff',
        });
        draw.text(`Distance: ${Math.floor(state.distance * 100)}m`, 0.5, 0.5, {
          size: 0.03,
          align: 'center',
          color: 'rgba(255,255,255,0.7)',
        });
      }
    },

    audio(prev, state) {
      const events = [];
      if (prev.alive && !state.alive) {
        events.push({ type: 'noise', filter: 'lowpass', freq: 200, duration: 0.5, gain: 0.3 });
      }
      // Periodic whoosh as speed increases
      if (Math.floor(state.distance * 10) > Math.floor(prev.distance * 10)) {
        events.push({ type: 'tone', freq: 300 + state.speed * 100, duration: 0.05, gain: 0.08 });
      }
      return events;
    },

    score(state) {
      return {
        primary: Math.floor(state.distance * 100),
        label: 'Distance',
        unit: 'm',
        normalized: null, // no natural ceiling
      };
    },

    status(state) {
      if (!state.alive) return { ended: true, reason: 'collision' };
      return 'playing';
    },

    bot(difficulty, rng) {
      // Bot that avoids obstacles by moving toward the safest column
      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        // Find the safest x position based on upcoming obstacles
        const lookAhead = state.obstacles.filter(o => o.y < state.player.y && o.y > state.player.y - 0.3);
        let targetX = state.player.x;

        if (lookAhead.length > 0) {
          // Score each x position by distance from obstacles
          let bestX = state.player.x;
          let bestScore = -Infinity;
          const steps = 10 + Math.floor(difficulty * 20); // more precision at higher difficulty

          for (let i = 0; i <= steps; i++) {
            const testX = i / steps;
            let minDist = Infinity;
            for (const obs of lookAhead) {
              const d = Math.abs(testX - obs.x) - obs.width / 2;
              minDist = Math.min(minDist, d);
            }
            // Add noise inversely proportional to difficulty
            const noise = (1 - difficulty) * rng.float(-0.1, 0.1);
            const score = minDist + noise;
            if (score > bestScore) {
              bestScore = score;
              bestX = testX;
            }
          }
          targetX = bestX;
        }

        // Add reaction delay: lower difficulty = lag behind
        const blend = 0.3 + difficulty * 0.7;
        const smoothedX = state.player.x + (targetX - state.player.x) * blend;

        return {
          thumb: { active: true, x: smoothedX, y: 0.5, vx: 0, vy: 0, startX: smoothedX, startY: 0.5, duration: 1 },
          gyro: null,
          taps: [],
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'speed', label: 'Initial Speed', type: 'float', min: 0.1, max: 1.0, default: 0.3, step: 0.05 },
        { key: 'spawnRate', label: 'Obstacle Rate', type: 'float', min: 0.5, max: 5.0, default: 1.5, step: 0.5 },
        { key: 'acceleration', label: 'Speed Increase', type: 'float', min: 0, max: 0.01, default: 0.002, step: 0.001 },
      ];
    },
  };
}
