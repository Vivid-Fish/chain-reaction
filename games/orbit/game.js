// games/orbit/game.js — Orbital gravity game
// Genre: PHYSICS — tap to switch gravity direction, orbit around planets
// Validates: tap timing, physics simulation, trajectory planning

export function createGame(config) {
  const TICK_RATE = 60;

  return {
    meta: {
      id: 'orbit',
      name: 'Orbit',
      version: '0.1.0',
      players: 1,
      inputChannels: ['taps'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 16 },
    },

    init(params) {
      return {
        ship: { x: 0.5, y: 0.7, vx: 0.15, vy: 0, radius: 0.01 },
        planets: [
          { x: 0.5, y: 0.4, radius: 0.04, mass: params.gravity || 0.3, color: '#4af' },
        ],
        stars: [], // collected
        starSpawns: [],
        trail: [],
        orbiting: null, // index of planet we're attracted to
        score: 0,
        alive: true,
        elapsed: 0,
        nextPlanetDist: 0.8,
        gravity: params.gravity || 0.3,
        starTimer: 0,
        cameraY: 0,
      };
    },

    step(state, input, dt, rng) {
      if (!state.alive) return state;

      state.elapsed += dt;

      // Tap switches orbital target or releases
      if (input.taps && input.taps.length > 0) {
        if (state.orbiting !== null) {
          // Release from orbit — keep current velocity
          state.orbiting = null;
        } else {
          // Snap to nearest planet
          let nearest = 0;
          let nearestDist = Infinity;
          for (let i = 0; i < state.planets.length; i++) {
            const dx = state.ship.x - state.planets[i].x;
            const dy = (state.ship.y - state.cameraY) - (state.planets[i].y - state.cameraY);
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < nearestDist) {
              nearestDist = d;
              nearest = i;
            }
          }
          state.orbiting = nearest;
        }
      }

      // Apply gravity toward orbiting planet
      if (state.orbiting !== null && state.orbiting < state.planets.length) {
        const planet = state.planets[state.orbiting];
        const dx = planet.x - state.ship.x;
        const dy = planet.y - state.ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.001) {
          const force = planet.mass / (dist * dist + 0.01);
          state.ship.vx += (dx / dist) * force * dt;
          state.ship.vy += (dy / dist) * force * dt;
        }

        // Check collision with planet
        if (dist < planet.radius + state.ship.radius) {
          state.alive = false;
          return state;
        }
      }

      // Move ship
      state.ship.x += state.ship.vx * dt;
      state.ship.y += state.ship.vy * dt;

      // Trail
      state.trail.push({ x: state.ship.x, y: state.ship.y });
      if (state.trail.length > 60) state.trail.shift();

      // Camera follows ship upward
      state.cameraY = Math.min(state.cameraY, state.ship.y - 0.6);

      // Out of bounds (sides)
      if (state.ship.x < -0.1 || state.ship.x > 1.1) {
        state.alive = false;
        return state;
      }
      // Fell too far below camera
      if (state.ship.y > state.cameraY + 1.2) {
        state.alive = false;
        return state;
      }

      // Spawn new planets above
      while (state.cameraY - 0.3 < state.nextPlanetDist * -1) {
        const px = rng.float(0.15, 0.85);
        const py = state.nextPlanetDist * -1;
        state.planets.push({
          x: px,
          y: py,
          radius: rng.float(0.03, 0.06),
          mass: rng.float(0.2, 0.4),
          color: `hsl(${rng.float(0, 360)}, 60%, 55%)`,
        });
        state.nextPlanetDist += rng.float(0.3, 0.6);
      }

      // Spawn stars (collectibles) near planets
      state.starTimer += dt;
      if (state.starTimer > 0.5) {
        state.starTimer = 0;
        for (const p of state.planets) {
          if (Math.abs(p.y - state.cameraY) < 0.8 && rng.float(0, 1) < 0.3) {
            const angle = rng.float(0, Math.PI * 2);
            const dist = p.radius + rng.float(0.05, 0.15);
            state.starSpawns.push({
              x: p.x + Math.cos(angle) * dist,
              y: p.y + Math.sin(angle) * dist,
              collected: false,
            });
          }
        }
      }

      // Collect stars
      for (const star of state.starSpawns) {
        if (star.collected) continue;
        const dx = state.ship.x - star.x;
        const dy = state.ship.y - star.y;
        if (Math.sqrt(dx * dx + dy * dy) < 0.025) {
          star.collected = true;
          state.score += 100;
        }
      }

      // Cleanup off-screen
      state.planets = state.planets.filter(p => p.y > state.cameraY - 0.5);
      state.starSpawns = state.starSpawns.filter(s => !s.collected && s.y > state.cameraY - 0.5);
      state.trail = state.trail.filter(t => t.y > state.cameraY - 0.1);

      // Fix orbiting index after cleanup
      if (state.orbiting !== null && state.orbiting >= state.planets.length) {
        state.orbiting = null;
      }

      // Score from altitude
      const altitude = Math.floor(Math.abs(state.ship.y) * 100);
      state.score = Math.max(state.score, altitude);

      return state;
    },

    render(state, draw, alpha) {
      draw.clear(0.02, 0.02, 0.06);

      const cy = state.cameraY;

      // Background stars
      for (let i = 0; i < 30; i++) {
        const sx = (i * 0.137 + 0.1) % 1;
        const sy = ((i * 0.271 + cy * 0.1) % 1 + 1) % 1;
        draw.circle(sx, sy, 0.002, {
          fill: `rgba(255,255,255,${0.1 + (i % 5) * 0.05})`,
        });
      }

      // Trail
      for (let i = 0; i < state.trail.length - 1; i++) {
        const t = i / state.trail.length;
        draw.circle(state.trail[i].x, state.trail[i].y - cy, 0.003 * t, {
          fill: `rgba(100, 200, 255, ${t * 0.3})`,
        });
      }

      // Planets
      for (const p of state.planets) {
        const screenY = p.y - cy;
        if (screenY < -0.1 || screenY > 1.1) continue;
        draw.circle(p.x, screenY, p.radius, {
          fill: p.color,
          glow: 0.015,
          glowColor: p.color.replace('55%', '30%'),
        });
        // Gravity ring
        draw.circle(p.x, screenY, p.radius + 0.08, {
          stroke: `rgba(255,255,255,0.05)`,
          strokeWidth: 1,
        });
      }

      // Stars
      for (const star of state.starSpawns) {
        if (star.collected) continue;
        const screenY = star.y - cy;
        if (screenY < -0.05 || screenY > 1.05) continue;
        const pulse = 0.8 + 0.2 * Math.sin(state.elapsed * 5 + star.x * 10);
        draw.circle(star.x, screenY, 0.008 * pulse, {
          fill: '#fd0',
          glow: 0.006,
          glowColor: 'rgba(255, 220, 0, 0.3)',
        });
      }

      // Ship
      if (state.alive) {
        const sy = state.ship.y - cy;
        draw.circle(state.ship.x, sy, state.ship.radius, {
          fill: '#fff',
          glow: 0.01,
          glowColor: 'rgba(200, 220, 255, 0.5)',
        });
        // Thrust indicator when orbiting
        if (state.orbiting !== null) {
          draw.circle(state.ship.x, sy, state.ship.radius + 0.005, {
            stroke: 'rgba(100, 200, 255, 0.4)',
            strokeWidth: 1,
          });
        }
      }

      // HUD
      draw.text(`${state.score}`, 0.5, 0.04, {
        size: 0.035,
        color: 'rgba(255,255,255,0.8)',
      });

      const hint = state.orbiting !== null ? 'TAP to release' : 'TAP to orbit';
      draw.text(hint, 0.5, 0.96, {
        size: 0.018,
        color: 'rgba(255,255,255,0.3)',
      });

      if (!state.alive) {
        draw.text('LOST IN SPACE', 0.5, 0.4, {
          size: 0.05,
          color: '#fff',
        });
        draw.text(`Altitude: ${state.score}`, 0.5, 0.5, {
          size: 0.03,
          color: 'rgba(255,255,255,0.7)',
        });
      }
    },

    audio(prev, state) {
      const events = [];
      if (prev.alive && !state.alive) {
        events.push({ type: 'noise', filter: 'lowpass', freq: 150, duration: 0.5, gain: 0.3 });
      }
      if (prev.orbiting === null && state.orbiting !== null) {
        events.push({ type: 'tone', freq: 500, duration: 0.08, gain: 0.1 });
      }
      if (prev.orbiting !== null && state.orbiting === null) {
        events.push({ type: 'sweep', freqStart: 400, freqEnd: 700, duration: 0.1, gain: 0.08 });
      }
      if (state.score > prev.score && (state.score - prev.score) >= 100) {
        events.push({ type: 'tone', freq: 800, duration: 0.05, gain: 0.1, wave: 'triangle' });
      }
      return events;
    },

    score(state) {
      return {
        primary: state.score,
        label: 'Altitude',
        unit: '',
      };
    },

    status(state) {
      if (!state.alive) return { ended: true, reason: 'lost' };
      return 'playing';
    },

    bot(difficulty, rng) {
      let tapCooldown = 0;

      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        tapCooldown -= dt;
        const taps = [];

        if (state.orbiting !== null) {
          // Check if we have good velocity to release (moving upward or toward a star)
          const vy = state.ship.vy;
          const speed = Math.sqrt(state.ship.vx * state.ship.vx + state.ship.vy * state.ship.vy);

          // Release when moving upward with good speed
          const shouldRelease = vy < -0.05 && speed > 0.1 && tapCooldown <= 0;
          const releaseChance = 0.3 + difficulty * 0.7;

          if (shouldRelease && rng.float(0, 1) < releaseChance * dt * 5) {
            taps.push({ x: 0.5, y: 0.5, time: 0 });
            tapCooldown = 0.2 + (1 - difficulty) * 0.5;
          }
        } else {
          // Not orbiting — find nearest planet and attach
          if (tapCooldown <= 0 && state.planets.length > 0) {
            let nearest = 0;
            let nearestDist = Infinity;
            for (let i = 0; i < state.planets.length; i++) {
              const dx = state.ship.x - state.planets[i].x;
              const dy = state.ship.y - state.planets[i].y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < nearestDist) {
                nearestDist = d;
                nearest = i;
              }
            }
            // Orbit if close enough
            if (nearestDist < 0.3) {
              const orbitChance = difficulty * 0.5;
              if (rng.float(0, 1) < orbitChance * dt * 10) {
                taps.push({ x: 0.5, y: 0.5, time: 0 });
                tapCooldown = 0.3;
              }
            }
          }
        }

        return { thumb: null, gyro: null, taps, keys: {} };
      };
    },

    configure() {
      return [
        { key: 'gravity', label: 'Gravity Strength', type: 'float', min: 0.1, max: 0.6, default: 0.3, step: 0.05 },
      ];
    },
  };
}
