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
      state.gyroRaw = input.gyro ? `${input.gyro.tiltX.toFixed(2)},${input.gyro.tiltY.toFixed(2)}` : 'none';
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

      // Check if ball fell off platform
      const dx = state.ball.x - state.platform.x;
      const dy = state.ball.y - state.platform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > state.platform.radius - state.ball.radius) {
        // Edge bounce (keep ball on platform with elastic bounce)
        if (dist > state.platform.radius) {
          state.alive = false;
          return state;
        }
        // Push back toward center
        const nx = dx / dist;
        const ny = dy / dist;
        const dot = state.ball.vx * nx + state.ball.vy * ny;
        if (dot > 0) {
          state.ball.vx -= 2 * dot * nx * 0.3;
          state.ball.vy -= 2 * dot * ny * 0.3;
        }
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

      // Platform (circular)
      draw.circle(state.platform.x, state.platform.y, state.platform.radius, {
        fill: 'rgba(40, 40, 60, 0.8)',
        stroke: 'rgba(100, 130, 200, 0.3)',
        strokeWidth: 2,
      });

      // Platform edge ring
      draw.circle(state.platform.x, state.platform.y, state.platform.radius, {
        stroke: 'rgba(100, 130, 200, 0.15)',
        strokeWidth: 1,
      });

      // Concentric guide rings
      for (let r = 0.1; r < state.platform.radius; r += 0.1) {
        draw.circle(state.platform.x, state.platform.y, r, {
          stroke: 'rgba(100, 130, 200, 0.06)',
          strokeWidth: 1,
        });
      }

      // Hazards
      for (const h of state.hazards) {
        const pulse = 0.5 + 0.5 * Math.sin(h.life * 8);
        const opacity = Math.min(1, (h.maxLife - h.life) / (h.maxLife * 0.3));
        draw.circle(h.x, h.y, h.radius * (0.8 + pulse * 0.4), {
          fill: `rgba(255, 60, 60, ${opacity * 0.4})`,
          stroke: `rgba(255, 80, 80, ${opacity * 0.6})`,
          strokeWidth: 1,
        });
      }

      // Tilt indicator
      const tiltVizX = state.platform.x + state.tiltX * 0.05;
      const tiltVizY = state.platform.y + state.tiltY * 0.05;
      draw.line(state.platform.x, state.platform.y, tiltVizX, tiltVizY, {
        color: 'rgba(255, 200, 100, 0.3)',
        width: 2,
      });

      // Ball
      if (state.alive) {
        draw.circle(state.ball.x, state.ball.y, state.ball.radius, {
          fill: '#6cf',
          glow: 0.01,
          glowColor: 'rgba(100, 200, 255, 0.5)',
        });
        // Ball shadow
        draw.circle(state.ball.x + 0.003, state.ball.y + 0.003, state.ball.radius, {
          fill: 'rgba(0,0,0,0.2)',
        });
      }

      // Score
      draw.text(`${state.score}`, 0.5, 0.06, {
        size: 0.04,
        color: 'rgba(255,255,255,0.8)',
      });

      // Tilt hint + gyro debug
      if (state.gyroActive) {
        draw.text('gyro active', 0.5, 0.93, { size: 0.018, color: 'rgba(100,200,255,0.4)' });
      } else {
        draw.text('touch to tilt', 0.5, 0.93, { size: 0.018, color: 'rgba(255,255,255,0.2)' });
      }
      // Debug: show raw gyro data
      draw.text(`gyro: ${state.gyroRaw || 'none'}`, 0.5, 0.97, {
        size: 0.013,
        color: 'rgba(255,255,255,0.15)',
      });

      if (!state.alive) {
        draw.text('FELL OFF', 0.5, 0.4, {
          size: 0.06,
          color: '#fff',
        });
        draw.text(`Survived: ${(state.elapsed).toFixed(1)}s`, 0.5, 0.5, {
          size: 0.03,
          color: 'rgba(255,255,255,0.7)',
        });
      }
    },

    audio(prev, state) {
      const events = [];
      if (prev.alive && !state.alive) {
        events.push({ type: 'drum', freq: 80, duration: 0.4, gain: 0.3 });
      }
      // Proximity warning
      if (state.alive) {
        const dx = state.ball.x - state.platform.x;
        const dy = state.ball.y - state.platform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const danger = dist / state.platform.radius;
        if (danger > 0.7 && Math.floor(state.elapsed * 4) > Math.floor(prev.elapsed * 4)) {
          events.push({ type: 'tone', freq: 300 + danger * 400, duration: 0.05, gain: 0.05 * danger });
        }
      }
      // Score milestones
      if (Math.floor(state.score / 50) > Math.floor(prev.score / 50)) {
        events.push({ type: 'sweep', freqStart: 400, freqEnd: 800, duration: 0.15, gain: 0.1 });
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
      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        // Bot tilts to counteract ball velocity and position
        const cx = state.platform.x;
        const cy = state.platform.y;
        const dx = state.ball.x - cx;
        const dy = state.ball.y - cy;

        // PD controller: correct position + dampen velocity
        const kp = 0.5 + difficulty * 1.5;
        const kd = 0.3 + difficulty * 0.7;
        let targetTiltX = -(dx * kp + state.ball.vx * kd);
        let targetTiltY = -(dy * kp + state.ball.vy * kd);

        // Add noise
        const noise = (1 - difficulty) * 0.3;
        targetTiltX += rng.float(-noise, noise);
        targetTiltY += rng.float(-noise, noise);

        // Convert tilt to thumb position (tilt = (thumb - 0.5) * 2)
        const thumbX = 0.5 + targetTiltX / 2;
        const thumbY = 0.5 + targetTiltY / 2;

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
