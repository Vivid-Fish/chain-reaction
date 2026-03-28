// games/balance/game.js — Gyro-first tilt balance game
// Genre: TILT — continuous gyro/thumb control, keep ball on platform
// Validates: gyro input, continuous physics, tilt mechanics

export function createGame(config) {
  const TICK_RATE = 60;
  const dt = 1 / TICK_RATE;

  return {
    meta: {
      id: 'balance',
      name: 'Balance',
      version: '0.1.0',
      players: 1,
      inputChannels: ['thumb', 'gyro'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'any', aspect: 1 },
    },

    init(params) {
      const platformRadius = params.platformRadius || 0.3;
      return {
        ball: { x: 0.5, y: 0.5, vx: 0, vy: 0, radius: 0.015 },
        platform: { x: 0.5, y: 0.5, radius: platformRadius },
        tiltX: 0,
        tiltY: 0,
        score: 0,
        alive: true,
        elapsed: 0,
        gravity: params.gravity || 0.5,
        friction: params.friction || 0.96,
        hazards: [],
        hazardTimer: 0,
        difficulty: 1,
      };
    },

    step(state, input, dt, rng) {
      if (!state.alive) return state;

      state.elapsed += dt;
      state.difficulty = 1 + state.elapsed * 0.05;

      // Get tilt from gyro (primary on mobile) or thumb (fallback/desktop)
      state.hasGyro = !!input.gyro;
      state.gyroActive = !!(input.gyro && (input.gyro.tiltX !== 0 || input.gyro.tiltY !== 0));
      if (state.gyroActive) {
        // Gyro available: use it directly as the tilt source
        state.tiltX = input.gyro.tiltX * 1.5;
        state.tiltY = input.gyro.tiltY * 1.5;
        // Thumb adds fine adjustment on top
        if (input.thumb && input.thumb.active) {
          state.tiltX += (input.thumb.x - 0.5) * 0.5;
          state.tiltY += (input.thumb.y - 0.5) * 0.5;
        }
      } else if (input.thumb && input.thumb.active) {
        // No gyro: thumb is sole control
        state.tiltX = (input.thumb.x - 0.5) * 2;
        state.tiltY = (input.thumb.y - 0.5) * 2;
      } else {
        // No input: decay
        state.tiltX *= 0.92;
        state.tiltY *= 0.92;
      }

      // Apply gravity based on tilt (velocity in units/sec)
      state.ball.vx += state.tiltX * state.gravity * dt;
      state.ball.vy += state.tiltY * state.gravity * dt;

      // Friction (per-tick damping)
      state.ball.vx *= state.friction;
      state.ball.vy *= state.friction;

      // Move ball (integrate velocity over dt)
      state.ball.x += state.ball.vx * dt;
      state.ball.y += state.ball.vy * dt;

      // Check if ball fell off platform (dead when ball edge reaches platform edge)
      const dx = state.ball.x - state.platform.x;
      const dy = state.ball.y - state.platform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > state.platform.radius - state.ball.radius) {
        state.alive = false;
        return state;
      }

      // Spawn hazards (pulsing danger zones on the platform)
      state.hazardTimer += dt;
      if (state.hazardTimer > 3 / state.difficulty) {
        state.hazardTimer = 0;
        const angle = rng.float(0, Math.PI * 2);
        const r = rng.float(0.05, state.platform.radius * 0.7);
        state.hazards.push({
          x: state.platform.x + Math.cos(angle) * r,
          y: state.platform.y + Math.sin(angle) * r,
          radius: rng.float(0.02, 0.05),
          life: 3,
          maxLife: 3,
        });
      }

      // Update hazards
      for (const h of state.hazards) {
        h.life -= dt;
      }
      state.hazards = state.hazards.filter(h => h.life > 0);

      // Check hazard collision
      for (const h of state.hazards) {
        if (h.life > h.maxLife * 0.3) continue; // only dangerous when fading in
        const hdx = state.ball.x - h.x;
        const hdy = state.ball.y - h.y;
        const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
        if (hdist < state.ball.radius + h.radius * 0.5) {
          state.alive = false;
          return state;
        }
      }

      // Score increases with time
      state.score = Math.floor(state.elapsed * 10);

      return state;
    },

    render(state, draw, alpha) {
      draw.clear(0.04, 0.04, 0.08);
      // Vignette
      draw.circle(0.5, 0.5, 0.65, {
        gradient: [
          { stop: 0, color: 'hsla(230, 30%, 12%, 0.3)' },
          { stop: 1, color: 'hsla(230, 30%, 4%, 0)' },
        ],
      });

      // Platform with radial gradient
      draw.circle(state.platform.x, state.platform.y, state.platform.radius, {
        gradient: [
          { stop: 0, color: 'rgba(55, 55, 80, 0.85)' },
          { stop: 0.8, color: 'rgba(35, 35, 55, 0.8)' },
          { stop: 1, color: 'rgba(25, 25, 40, 0.7)' },
        ],
        clip: true,
      });

      // Platform edge ring
      draw.circle(state.platform.x, state.platform.y, state.platform.radius, {
        stroke: 'rgba(100, 130, 200, 0.3)',
        strokeWidth: 2,
      });

      // Concentric guide rings
      for (let r = 0.1; r < state.platform.radius; r += 0.1) {
        draw.circle(state.platform.x, state.platform.y, r, {
          stroke: 'rgba(100, 130, 200, 0.06)',
          strokeWidth: 1,
        });
      }

      // Hazards with gradient
      for (const h of state.hazards) {
        const pulse = 0.5 + 0.5 * Math.sin(h.life * 8);
        const opacity = Math.min(1, (h.maxLife - h.life) / (h.maxLife * 0.3));
        const hr = h.radius * (0.8 + pulse * 0.4);
        draw.circle(h.x, h.y, hr, {
          gradient: [
            { stop: 0, color: `rgba(255, 80, 60, ${opacity * 0.5})` },
            { stop: 1, color: `rgba(255, 40, 40, ${opacity * 0.1})` },
          ],
        });
        draw.circle(h.x, h.y, hr, {
          stroke: `rgba(255, 80, 80, ${opacity * 0.6})`,
          strokeWidth: 1,
        });
      }

      // Ball
      if (state.alive) {
        // Ball shadow (drawn first, offset)
        draw.circle(state.ball.x + 0.003, state.ball.y + 0.003, state.ball.radius, {
          fill: 'rgba(0,0,0,0.2)',
        });
        // Ball glow
        draw.circle(state.ball.x, state.ball.y, state.ball.radius * 3, {
          gradient: [
            { stop: 0, color: 'hsla(195, 80%, 70%, 0.12)' },
            { stop: 1, color: 'hsla(195, 80%, 50%, 0)' },
          ],
          blend: 'lighter',
        });
        // Ball with glossy gradient
        draw.circle(state.ball.x, state.ball.y, state.ball.radius, {
          gradient: [
            { stop: 0, color: 'hsla(195, 60%, 95%, 1)' },
            { stop: 0.4, color: 'hsla(195, 80%, 70%, 1)' },
            { stop: 1, color: 'hsla(195, 85%, 45%, 0.9)' },
          ],
          gradientOffset: { x: -state.ball.radius * 0.15, y: -state.ball.radius * 0.15 },
          clip: true,
        });
      }

      // Score
      draw.text(`${state.score}`, 0.5, 0.06, {
        size: 0.04,
        color: 'rgba(255,255,255,0.8)',
        shadow: 'rgba(0,0,0,0.5)',
        shadowBlur: 4,
      });

      // Tilt hint
      if (!state.gyroActive && state.elapsed < 5 && !state.hasGyro) {
        draw.text('drag to tilt the platform', 0.5, 0.93, { size: 0.016, color: 'rgba(255,255,255,0.25)' });
        draw.text('enable motion sensors for gyro', 0.5, 0.96, { size: 0.012, color: 'rgba(255,255,255,0.15)' });
      }

      if (!state.alive) {
        draw.text('FELL OFF', 0.5, 0.4, {
          size: 0.06,
          color: '#fff',
          shadow: 'rgba(100, 200, 255, 0.5)',
          shadowBlur: 20,
        });
        draw.text(`Survived: ${(state.elapsed).toFixed(1)}s`, 0.5, 0.5, {
          size: 0.03,
          color: 'rgba(255,255,255,0.7)',
          shadow: 'rgba(0,0,0,0.5)',
          shadowBlur: 4,
        });
      }
    },

    effects(prev, state) {
      const fx = [];
      // Death: burst + shake + flash at ball position
      if (prev.alive && !state.alive) {
        fx.push({ type: 'burst', x: state.ball.x, y: state.ball.y, hue: 0, count: 30, intensity: 0.8 });
        fx.push({ type: 'shake', trauma: 0.4 });
        fx.push({ type: 'flash', intensity: 0.3 });
        fx.push({ type: 'float', x: state.ball.x, y: state.ball.y - 0.04, text: 'FELL OFF', hue: 0, scale: 1.5 });
      }
      // Score milestones every 50 pts
      if (Math.floor(state.score / 50) > Math.floor(prev.score / 50)) {
        const milestone = Math.floor(state.score / 50) * 50;
        fx.push({ type: 'float', x: 0.5, y: 0.12, text: `+${milestone - Math.floor(prev.score / 50) * 50}`, hue: 200, celebration: true });
        fx.push({ type: 'ring', x: state.ball.x, y: state.ball.y, radius: 0.08, hue: 200, duration: 0.4 });
      }
      // Hazard near-miss: ball close to active hazard but survives
      if (state.alive) {
        for (const h of state.hazards) {
          if (h.life > h.maxLife * 0.3) continue;
          const hdx = state.ball.x - h.x;
          const hdy = state.ball.y - h.y;
          const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
          if (hdist < state.ball.radius + h.radius * 1.5 && hdist >= state.ball.radius + h.radius * 0.5) {
            fx.push({ type: 'burst', x: h.x, y: h.y, hue: 0, count: 5, intensity: 0.3 });
          }
        }
      }
      return fx;
    },

    audio(prev, state) {
      const events = [];
      // Death
      if (prev.alive && !state.alive) {
        events.push({ type: 'gameover' });
      }
      // Proximity warning
      if (state.alive) {
        const dx = state.ball.x - state.platform.x;
        const dy = state.ball.y - state.platform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const danger = dist / state.platform.radius;
        if (danger > 0.7 && Math.floor(state.elapsed * 4) > Math.floor(prev.elapsed * 4)) {
          events.push({ type: 'note', index: Math.min(19, Math.floor(danger * 15)), gain: 0.05 * danger });
        }
      }
      // Score milestones every 50
      if (Math.floor(state.score / 50) > Math.floor(prev.score / 50)) {
        const level = Math.floor(state.score / 50);
        events.push({ type: 'chord', notes: [level % 20, (level + 4) % 20, (level + 7) % 20], gain: 0.12 });
      }
      // Score ticks every 10
      if (Math.floor(state.score / 10) > Math.floor(prev.score / 10)) {
        events.push({ type: 'note', index: Math.min(19, Math.floor(state.score / 10) % 20), gain: 0.04 });
      }
      return events;
    },

    score(state) {
      return {
        primary: state.score,
        label: 'Balance',
        unit: 'pts',
      };
    },

    status(state) {
      if (!state.alive) return { ended: true, reason: 'fell_off' };
      return 'playing';
    },

    bot(difficulty, rng) {
      // Reaction delay: low difficulty = slow updates
      let updateCooldown = 0;
      let lastTiltX = 0, lastTiltY = 0;

      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        // Bot tilts to counteract ball velocity and position
        const cx = state.platform.x;
        const cy = state.platform.y;
        const dx = state.ball.x - cx;
        const dy = state.ball.y - cy;

        // Reaction delay: low difficulty bots update their aim slowly
        updateCooldown -= dt;
        if (updateCooldown <= 0) {
          // PD controller: gains scale quadratically with difficulty
          // d=0: kp=0.1, kd=0.0 (almost no correction)
          // d=0.5: kp=0.6, kd=0.25
          // d=1.0: kp=2.0, kd=1.0
          const kp = 0.1 + difficulty * difficulty * 1.9;
          const kd = difficulty * difficulty * 1.0;
          let targetTiltX = -(dx * kp + state.ball.vx * kd);
          let targetTiltY = -(dy * kp + state.ball.vy * kd);

          // Add noise: multiplicative so it scales with the correction magnitude
          const noise = (1 - difficulty) * 0.6;
          targetTiltX += rng.float(-noise, noise);
          targetTiltY += rng.float(-noise, noise);

          lastTiltX = targetTiltX;
          lastTiltY = targetTiltY;
          // Low difficulty: update every 200ms; high: every frame
          updateCooldown = (1 - difficulty) * 0.2;
        }

        // Convert tilt to thumb position (tilt = (thumb - 0.5) * 2)
        const thumbX = 0.5 + lastTiltX / 2;
        const thumbY = 0.5 + lastTiltY / 2;

        return {
          thumb: { active: true, x: thumbX, y: thumbY, vx: 0, vy: 0, startX: thumbX, startY: thumbY, duration: 1 },
          gyro: null,
          taps: [],
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'gravity', label: 'Gravity', type: 'float', min: 0.2, max: 1.5, default: 0.5, step: 0.1 },
        { key: 'friction', label: 'Friction', type: 'float', min: 0.9, max: 0.99, default: 0.96, step: 0.01 },
        { key: 'platformRadius', label: 'Platform Size', type: 'float', min: 0.15, max: 0.45, default: 0.3, step: 0.05 },
      ];
    },
  };
}
