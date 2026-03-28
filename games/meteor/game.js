// games/meteor/game.js — Asteroids-inspired twin-stick shooter
// Genre: SHOOT — thrust+rotate via thumb, auto-fire, destroy asteroids
// Validates: analog direction control, wrapping space, momentum

export function createGame(config) {
  const TICK_RATE = 60;
  const TWO_PI = Math.PI * 2;

  return {
    meta: {
      id: 'meteor',
      name: 'Meteor',
      version: '0.1.0',
      players: 1,
      inputChannels: ['thumb'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'any', aspect: 1 },
    },

    init(params) {
      return {
        ship: { x: 0.5, y: 0.5, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 0.015 },
        bullets: [],
        asteroids: [],
        particles: [],
        score: 0,
        lives: params.lives || 3,
        alive: true,
        fireTimer: 0,
        fireRate: params.fireRate || 0.15,
        waveTimer: 2,
        wave: 0,
        thrust: 0,
        invincible: 0, // seconds of invincibility after respawn
        elapsed: 0,
        lastHitPos: null,      // {x, y, hue, size} of last asteroid destroyed
        lastShipHit: false,    // ship took damage this frame
        lastScoreGain: 0,      // points gained this frame
        lastFired: false,      // bullet fired this frame
      };
    },

    step(state, input, dt, rng) {
      if (state.lives <= 0 && !state.alive) return state;

      state.elapsed += dt;
      if (state.invincible > 0) state.invincible -= dt;

      // Reset per-frame flags
      state.lastHitPos = null;
      state.lastShipHit = false;
      state.lastScoreGain = 0;
      state.lastFired = false;

      // Ship control via thumb direction relative to center
      if (state.alive && input.thumb && input.thumb.active) {
        const dx = input.thumb.x - 0.5;
        const dy = input.thumb.y - 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.02) {
          state.ship.angle = Math.atan2(dy, dx);
          state.thrust = Math.min(dist * 4, 1);
        } else {
          state.thrust *= 0.9;
        }
      } else {
        state.thrust *= 0.95;
      }

      // Apply thrust
      if (state.alive) {
        const thrustPower = 0.8;
        state.ship.vx += Math.cos(state.ship.angle) * state.thrust * thrustPower * dt;
        state.ship.vy += Math.sin(state.ship.angle) * state.thrust * thrustPower * dt;

        // Drag
        state.ship.vx *= 0.995;
        state.ship.vy *= 0.995;

        // Speed cap
        const speed = Math.sqrt(state.ship.vx * state.ship.vx + state.ship.vy * state.ship.vy);
        if (speed > 0.5) {
          state.ship.vx *= 0.5 / speed;
          state.ship.vy *= 0.5 / speed;
        }

        // Move ship
        state.ship.x += state.ship.vx * dt;
        state.ship.y += state.ship.vy * dt;

        // Wrap
        state.ship.x = ((state.ship.x % 1) + 1) % 1;
        state.ship.y = ((state.ship.y % 1) + 1) % 1;

        // Auto-fire
        state.fireTimer -= dt;
        if (state.fireTimer <= 0 && state.thrust > 0.1) {
          state.fireTimer = state.fireRate;
          const bulletSpeed = 0.6;
          state.bullets.push({
            x: state.ship.x + Math.cos(state.ship.angle) * 0.02,
            y: state.ship.y + Math.sin(state.ship.angle) * 0.02,
            vx: Math.cos(state.ship.angle) * bulletSpeed + state.ship.vx * 0.3,
            vy: Math.sin(state.ship.angle) * bulletSpeed + state.ship.vy * 0.3,
            life: 1.5,
          });
          state.lastFired = true;
        }
      }

      // Update bullets
      for (const b of state.bullets) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.x = ((b.x % 1) + 1) % 1;
        b.y = ((b.y % 1) + 1) % 1;
        b.life -= dt;
      }
      state.bullets = state.bullets.filter(b => b.life > 0);

      // Update asteroids
      for (const a of state.asteroids) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.x = ((a.x % 1) + 1) % 1;
        a.y = ((a.y % 1) + 1) % 1;
        a.rot += a.rotSpeed * dt;
      }

      // Spawn waves
      if (state.asteroids.length === 0) {
        state.waveTimer -= dt;
        if (state.waveTimer <= 0) {
          state.wave++;
          const count = 3 + state.wave;
          for (let i = 0; i < count; i++) {
            // Spawn at edges
            const edge = rng.int(0, 3);
            let ax, ay;
            switch (edge) {
              case 0: ax = 0; ay = rng.float(0, 1); break;
              case 1: ax = 1; ay = rng.float(0, 1); break;
              case 2: ax = rng.float(0, 1); ay = 0; break;
              default: ax = rng.float(0, 1); ay = 1; break;
            }
            const angle = rng.float(0, TWO_PI);
            const speed = rng.float(0.05, 0.15);
            state.asteroids.push({
              x: ax, y: ay,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: rng.float(0.03, 0.06),
              rot: 0,
              rotSpeed: rng.float(-2, 2),
              size: 2, // 2=large, 1=medium, 0=small
              hue: rng.float(15, 45),
            });
          }
          state.waveTimer = 3;
        }
      }

      // Bullet-asteroid collisions
      for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
        const b = state.bullets[bi];
        for (let ai = state.asteroids.length - 1; ai >= 0; ai--) {
          const a = state.asteroids[ai];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          if (dx * dx + dy * dy < a.radius * a.radius) {
            // Hit!
            state.bullets.splice(bi, 1);
            const hitScore = (3 - a.size) * 50;
            state.score += hitScore;
            state.lastScoreGain += hitScore;
            state.lastHitPos = { x: a.x, y: a.y, hue: a.hue, size: a.size };

            // Spawn particles
            for (let p = 0; p < 4; p++) {
              const pAngle = rng.float(0, TWO_PI);
              const pSpeed = rng.float(0.1, 0.3);
              state.particles.push({
                x: a.x, y: a.y,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                life: 0.5,
                hue: a.hue,
              });
            }

            // Split asteroid
            if (a.size > 0) {
              for (let j = 0; j < 2; j++) {
                const angle = rng.float(0, TWO_PI);
                const speed = rng.float(0.08, 0.2);
                state.asteroids.push({
                  x: a.x, y: a.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  radius: a.radius * 0.6,
                  rot: 0,
                  rotSpeed: rng.float(-3, 3),
                  size: a.size - 1,
                  hue: a.hue + rng.float(-10, 10),
                });
              }
            }

            state.asteroids.splice(ai, 1);
            break;
          }
        }
      }

      // Ship-asteroid collision
      if (state.alive && state.invincible <= 0) {
        for (const a of state.asteroids) {
          const dx = state.ship.x - a.x;
          const dy = state.ship.y - a.y;
          if (dx * dx + dy * dy < (state.ship.radius + a.radius) * (state.ship.radius + a.radius)) {
            state.lives--;
            state.lastShipHit = true;
            if (state.lives <= 0) {
              state.alive = false;
            } else {
              // Respawn
              state.ship.x = 0.5;
              state.ship.y = 0.5;
              state.ship.vx = 0;
              state.ship.vy = 0;
              state.invincible = 2;
            }
            break;
          }
        }
      }

      // Update particles
      for (const p of state.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      state.particles = state.particles.filter(p => p.life > 0);

      return state;
    },

    render(state, draw, alpha) {
      draw.clear(0.01, 0.01, 0.04);

      // Particles
      for (const p of state.particles) {
        const a = p.life * 2;
        draw.circle(p.x, p.y, 0.004 * p.life * 2, {
          fill: `hsla(${p.hue}, 70%, 60%, ${a})`,
        });
      }

      // Asteroids
      for (const a of state.asteroids) {
        const sides = a.size === 2 ? 7 : a.size === 1 ? 6 : 5;
        const points = [];
        for (let i = 0; i < sides; i++) {
          const angle = a.rot + (i / sides) * TWO_PI;
          const wobble = 0.8 + 0.2 * Math.sin(i * 2.7);
          points.push({
            x: a.x + Math.cos(angle) * a.radius * wobble,
            y: a.y + Math.sin(angle) * a.radius * wobble,
          });
        }
        draw.polygon(points, {
          fill: `hsl(${a.hue}, 30%, 35%)`,
          stroke: `hsl(${a.hue}, 40%, 50%)`,
          strokeWidth: 1,
        });
      }

      // Bullets
      for (const b of state.bullets) {
        draw.circle(b.x, b.y, 0.003, {
          fill: '#ff8',
          glow: 0.004,
          glowColor: 'rgba(255, 255, 100, 0.4)',
        });
      }

      // Ship
      if (state.alive) {
        const s = state.ship;
        const blink = state.invincible > 0 && Math.floor(state.invincible * 8) % 2 === 0;
        if (!blink) {
          // Triangle ship
          const nose = { x: s.x + Math.cos(s.angle) * 0.02, y: s.y + Math.sin(s.angle) * 0.02 };
          const left = { x: s.x + Math.cos(s.angle + 2.4) * 0.015, y: s.y + Math.sin(s.angle + 2.4) * 0.015 };
          const right = { x: s.x + Math.cos(s.angle - 2.4) * 0.015, y: s.y + Math.sin(s.angle - 2.4) * 0.015 };
          draw.polygon([nose, left, right], {
            fill: '#4af',
            stroke: '#8cf',
            strokeWidth: 1,
          });

          // Thrust flame
          if (state.thrust > 0.1) {
            const flameLen = 0.01 + state.thrust * 0.01;
            const tail = { x: s.x - Math.cos(s.angle) * flameLen, y: s.y - Math.sin(s.angle) * flameLen };
            draw.polygon([left, tail, right], {
              fill: `rgba(255, 150, 50, ${state.thrust * 0.6})`,
            });
          }
        }
      }

      // HUD
      draw.text(`${state.score}`, 0.5, 0.04, {
        size: 0.035,
        color: 'rgba(255,255,255,0.8)',
      });

      // Lives
      for (let i = 0; i < state.lives; i++) {
        draw.circle(0.05 + i * 0.03, 0.04, 0.008, {
          fill: '#4af',
        });
      }

      // Wave
      draw.text(`WAVE ${state.wave}`, 0.92, 0.04, {
        size: 0.02,
        align: 'right',
        color: 'rgba(255,255,255,0.4)',
      });

      if (!state.alive) {
        draw.text('DESTROYED', 0.5, 0.4, {
          size: 0.06,
          color: '#fff',
        });
        draw.text(`Score: ${state.score}`, 0.5, 0.5, {
          size: 0.03,
          color: 'rgba(255,255,255,0.7)',
        });
        draw.text(`Wave ${state.wave}`, 0.5, 0.56, {
          size: 0.02,
          color: 'rgba(255,255,255,0.5)',
        });
      }
    },

    effects(prev, state) {
      const fx = [];

      // Asteroid destroyed — burst at hit position
      if (state.lastHitPos) {
        const p = state.lastHitPos;
        const count = (3 - p.size) * 4 + 4; // more particles for smaller (harder) asteroids
        fx.push({ type: 'burst', x: p.x, y: p.y, hue: p.hue, count: count, intensity: 0.7 });
        fx.push({ type: 'ring', x: p.x, y: p.y, radius: 0.05 + (2 - p.size) * 0.03, hue: p.hue });

        // Score float
        if (state.lastScoreGain > 0) {
          fx.push({ type: 'float', x: p.x, y: p.y, text: `+${state.lastScoreGain}`, hue: p.hue });
        }

        // Shake proportional to asteroid size
        fx.push({ type: 'shake', trauma: 0.05 + (2 - p.size) * 0.03 });
      }

      // Ship hit — heavy shake and flash
      if (state.lastShipHit) {
        fx.push({ type: 'shake', trauma: 0.4 });
        fx.push({ type: 'flash', intensity: 0.35 });
        fx.push({ type: 'burst', x: state.ship.x, y: state.ship.y, hue: 200, count: 15, intensity: 1.0 });
        fx.push({ type: 'ring', x: state.ship.x, y: state.ship.y, radius: 0.12, hue: 0 });
      }

      // Death — maximum impact
      if (prev.alive && !state.alive) {
        fx.push({ type: 'shake', trauma: 0.5 });
        fx.push({ type: 'flash', intensity: 0.6 });
      }

      // New wave — celebration ring
      if (state.wave > prev.wave) {
        fx.push({ type: 'ring', x: 0.5, y: 0.5, radius: 0.4, hue: 180, duration: 0.8 });
        fx.push({ type: 'float', x: 0.5, y: 0.45, text: `WAVE ${state.wave}`, hue: 180, celebration: true, scale: 2.0 });
        fx.push({ type: 'flash', intensity: 0.15 });
      }

      return fx;
    },

    audio(prev, state) {
      const events = [];

      // Asteroid destroyed — note scales with score gain
      if (state.lastHitPos) {
        const size = state.lastHitPos.size;
        // Small asteroids = higher notes (harder kills)
        const noteIndex = Math.min((2 - size) * 4 + 5, 16);
        events.push({ type: 'note', index: noteIndex, gain: 0.12 });
      }

      // Bullet fired — tap
      if (state.lastFired) {
        events.push({ type: 'tap' });
      }

      // Ship hit but survived — miss sound
      if (state.lastShipHit && state.alive) {
        events.push({ type: 'miss' });
        events.push({ type: 'drum', freq: 100, duration: 0.3, gain: 0.2 });
      }

      // Death
      if (prev.alive && !state.alive) {
        events.push({ type: 'gameover' });
      }

      // New wave — victory chord
      if (state.wave > prev.wave) {
        events.push({ type: 'clear' });
      }

      return events;
    },

    score(state) {
      return {
        primary: state.score,
        label: 'Score',
        unit: 'pts',
      };
    },

    status(state) {
      if (!state.alive && state.lives <= 0) return { ended: true, reason: 'destroyed' };
      return 'playing';
    },

    bot(difficulty, rng) {
      let aimX = 0.5, aimY = 0.5;
      let aimCooldown = 0;
      let targetId = -1; // stick to a target to avoid jittering

      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        // Reaction delay: d=0 re-aims every 300ms, d=1 every frame
        aimCooldown -= dt;
        if (aimCooldown <= 0) {
          aimCooldown = (1 - difficulty) * 0.3;

          // Target selection: closest asteroid (simple, stable)
          let nearest = null;
          let nearestDist = Infinity;
          for (const a of state.asteroids) {
            const dx = a.x - state.ship.x;
            const dy = a.y - state.ship.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < nearestDist) {
              nearestDist = d;
              nearest = a;
            }
          }

          if (nearest) {
            const dx = nearest.x - state.ship.x;
            const dy = nearest.y - state.ship.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            // Lead prediction: d=0 aims at current position, d=1 leads perfectly
            const bulletSpeed = 0.6;
            const rawLeadTime = d / bulletSpeed;
            const leadTime = rawLeadTime * difficulty;
            const predX = nearest.x + nearest.vx * leadTime;
            const predY = nearest.y + nearest.vy * leadTime;

            const pdx = predX - state.ship.x;
            const pdy = predY - state.ship.y;
            const pd = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pd > 0.01) {
              aimX = 0.5 + (pdx / pd) * 0.3;
              aimY = 0.5 + (pdy / pd) * 0.3;
            }
          }

          // Aim noise: large at low difficulty, zero at high
          const noise = (1 - difficulty) * 0.2;
          aimX += rng.float(-noise, noise);
          aimY += rng.float(-noise, noise);
        }

        return {
          thumb: { active: true, x: aimX, y: aimY, vx: 0, vy: 0, startX: aimX, startY: aimY, duration: 1 },
          gyro: null,
          taps: [],
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'fireRate', label: 'Fire Rate', type: 'float', min: 0.05, max: 0.5, default: 0.15, step: 0.05 },
        { key: 'lives', label: 'Lives', type: 'int', min: 1, max: 5, default: 3, step: 1 },
      ];
    },
  };
}
