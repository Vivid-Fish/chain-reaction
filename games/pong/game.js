// games/pong/game.js — PvP Pong (2-player, bot vs bot or human vs bot)
// Genre: PVP — competitive, continuous control, real-time
// Validates: 2-player input, PvP bot calibration, competitive scoring

export function createGame(config) {
  const TICK_RATE = 60;

  return {
    meta: {
      id: 'pong',
      name: 'Pong',
      version: '0.1.0',
      players: 2,
      inputChannels: ['thumb'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'landscape', aspect: 16 / 9 },
    },

    init(params) {
      return {
        paddles: [
          { y: 0.5, height: params.paddleHeight || 0.15, speed: params.paddleSpeed || 1.5 },
          { y: 0.5, height: params.paddleHeight || 0.15, speed: params.paddleSpeed || 1.5 },
        ],
        ball: {
          x: 0.5, y: 0.5,
          vx: 0, vy: 0,
        },
        scores: [0, 0],
        maxScore: params.maxScore || 5,
        paddleX: 0.03,
        paddleWidth: 0.015,
        ballRadius: 0.012,
        serveTimer: 0.01,
        serving: true,
        rally: 0,
        ballSpeed: params.ballSpeed || 0.5,
      };
    },

    step(state, input, dt, rng) {
      // Handle serve pause
      if (state.serving) {
        state.serveTimer -= dt;
        if (state.serveTimer <= 0) {
          state.serving = false;
          const dir = rng.float(0, 1) > 0.5 ? 1 : -1;
          const angle = rng.float(-0.4, 0.4);
          state.ball.vx = dir * state.ballSpeed * Math.cos(angle);
          state.ball.vy = state.ballSpeed * Math.sin(angle);
        }
        return state;
      }

      // Handle input (array of 2 inputs for 2P, or single for 1P)
      const inputs = Array.isArray(input) ? input : [input, { thumb: null, gyro: null, taps: [], keys: {} }];

      for (let p = 0; p < 2; p++) {
        const inp = inputs[p];
        if (inp && inp.thumb && inp.thumb.active) {
          const targetY = inp.thumb.y;
          const dy = targetY - state.paddles[p].y;
          state.paddles[p].y += Math.sign(dy) * Math.min(Math.abs(dy), state.paddles[p].speed * dt);
        }
        // Clamp paddle
        const half = state.paddles[p].height / 2;
        state.paddles[p].y = Math.max(half, Math.min(1 - half, state.paddles[p].y));
      }

      // Move ball
      state.ball.x += state.ball.vx * dt;
      state.ball.y += state.ball.vy * dt;

      // Top/bottom bounce
      if (state.ball.y < state.ballRadius) {
        state.ball.y = state.ballRadius;
        state.ball.vy = Math.abs(state.ball.vy);
      }
      if (state.ball.y > 1 - state.ballRadius) {
        state.ball.y = 1 - state.ballRadius;
        state.ball.vy = -Math.abs(state.ball.vy);
      }

      // Paddle collision
      for (let p = 0; p < 2; p++) {
        const px = p === 0 ? state.paddleX : 1 - state.paddleX;
        const paddle = state.paddles[p];
        const halfH = paddle.height / 2;

        const ballNear = p === 0
          ? (state.ball.x - state.ballRadius < px + state.paddleWidth / 2 && state.ball.vx < 0)
          : (state.ball.x + state.ballRadius > px - state.paddleWidth / 2 && state.ball.vx > 0);

        if (ballNear && state.ball.y > paddle.y - halfH && state.ball.y < paddle.y + halfH) {
          // Bounce with angle based on hit position
          const relativeY = (state.ball.y - paddle.y) / halfH; // -1 to 1
          const angle = relativeY * Math.PI / 4;
          const speed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
          const newSpeed = speed * 1.03; // slight acceleration
          const dir = p === 0 ? 1 : -1;
          state.ball.vx = dir * newSpeed * Math.cos(angle);
          state.ball.vy = newSpeed * Math.sin(angle);
          state.ball.x = p === 0
            ? px + state.paddleWidth / 2 + state.ballRadius
            : px - state.paddleWidth / 2 - state.ballRadius;
          state.rally++;
        }
      }

      // Score
      if (state.ball.x < 0) {
        state.scores[1]++;
        state.ball.x = 0.5;
        state.ball.y = 0.5;
        state.ball.vx = 0;
        state.ball.vy = 0;
        state.serving = true;
        state.serveTimer = 0.8;
        state.rally = 0;
      }
      if (state.ball.x > 1) {
        state.scores[0]++;
        state.ball.x = 0.5;
        state.ball.y = 0.5;
        state.ball.vx = 0;
        state.ball.vy = 0;
        state.serving = true;
        state.serveTimer = 0.8;
        state.rally = 0;
      }

      return state;
    },

    render(state, draw, alpha) {
      draw.clear(0.02, 0.02, 0.05);

      // Center line
      for (let y = 0; y < 1; y += 0.04) {
        draw.rect(0.5, y + 0.01, 0.003, 0.02, {
          fill: 'rgba(255,255,255,0.15)',
        });
      }

      // Paddles
      for (let p = 0; p < 2; p++) {
        const px = p === 0 ? state.paddleX : 1 - state.paddleX;
        const color = p === 0 ? '#4af' : '#f64';
        draw.rect(px, state.paddles[p].y, state.paddleWidth, state.paddles[p].height, {
          fill: color,
          radius: 0.004,
        });
      }

      // Ball
      if (!state.serving) {
        draw.circle(state.ball.x, state.ball.y, state.ballRadius, {
          fill: '#fff',
          glow: 0.008,
          glowColor: 'rgba(255,255,255,0.4)',
        });
      } else {
        // Blinking during serve
        if (Math.floor(state.serveTimer * 6) % 2 === 0) {
          draw.circle(state.ball.x, state.ball.y, state.ballRadius, {
            fill: 'rgba(255,255,255,0.5)',
          });
        }
      }

      // Scores
      draw.text(`${state.scores[0]}`, 0.35, 0.08, {
        size: 0.06,
        color: '#4af',
      });
      draw.text(`${state.scores[1]}`, 0.65, 0.08, {
        size: 0.06,
        color: '#f64',
      });

      // Rally counter
      if (state.rally > 2) {
        draw.text(`Rally: ${state.rally}`, 0.5, 0.95, {
          size: 0.02,
          color: 'rgba(255,255,255,0.4)',
        });
      }

      // Game over
      const done = state.scores[0] >= state.maxScore || state.scores[1] >= state.maxScore;
      if (done) {
        const winner = state.scores[0] >= state.maxScore ? 'BLUE' : 'RED';
        const color = state.scores[0] >= state.maxScore ? '#4af' : '#f64';
        draw.text(`${winner} WINS`, 0.5, 0.45, {
          size: 0.06,
          color,
        });
        draw.text(`${state.scores[0]} - ${state.scores[1]}`, 0.5, 0.55, {
          size: 0.035,
          color: 'rgba(255,255,255,0.7)',
        });
      }
    },

    audio(prev, state) {
      const events = [];
      // Paddle hit
      if (state.rally > prev.rally) {
        events.push({ type: 'tone', freq: 300 + state.rally * 20, duration: 0.06, gain: 0.12, wave: 'square' });
      }
      // Score
      if (state.scores[0] > prev.scores[0] || state.scores[1] > prev.scores[1]) {
        events.push({ type: 'drum', freq: 120, duration: 0.2, gain: 0.2 });
      }
      return events;
    },

    score(state) {
      return {
        primary: state.scores[0] - state.scores[1],
        label: 'Lead',
        unit: '',
        players: [...state.scores],
      };
    },

    status(state) {
      if (state.scores[0] >= state.maxScore) return { ended: true, reason: 'match_won', winner: 0 };
      if (state.scores[1] >= state.maxScore) return { ended: true, reason: 'match_won', winner: 1 };
      return 'playing';
    },

    bot(difficulty, rng) {
      let reactionDelay = 0;
      let lastKnownBallY = 0.5;

      return (state, dt) => {
        // Predict where ball will intersect paddle's x
        let targetY = 0.5;

        if (state.ball.vx !== 0) {
          // Simple prediction: linear extrapolation
          const speed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
          let bx = state.ball.x, by = state.ball.y;
          let bvx = state.ball.vx, bvy = state.ball.vy;

          // Simulate ball path (with bounces) for up to 200 steps
          for (let i = 0; i < 200; i++) {
            bx += bvx * dt;
            by += bvy * dt;
            if (by < 0.01) { by = 0.01; bvy = Math.abs(bvy); }
            if (by > 0.99) { by = 0.99; bvy = -Math.abs(bvy); }
            if (bx < 0.03 || bx > 0.97) {
              targetY = by;
              break;
            }
          }

          // Reaction delay — lower difficulty = more lag
          reactionDelay -= dt;
          if (reactionDelay <= 0) {
            lastKnownBallY = targetY;
            reactionDelay = (1 - difficulty) * 0.3;
          }
        }

        // Add imprecision
        const noise = (1 - difficulty) * 0.15;
        const aim = lastKnownBallY + rng.float(-noise, noise);

        return {
          thumb: { active: true, x: 0.5, y: aim, vx: 0, vy: 0, startX: 0.5, startY: aim, duration: 1 },
          gyro: null,
          taps: [],
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'ballSpeed', label: 'Ball Speed', type: 'float', min: 0.2, max: 1.0, default: 0.5, step: 0.05 },
        { key: 'paddleHeight', label: 'Paddle Size', type: 'float', min: 0.05, max: 0.3, default: 0.15, step: 0.02 },
        { key: 'paddleSpeed', label: 'Paddle Speed', type: 'float', min: 0.5, max: 3.0, default: 1.5, step: 0.25 },
        { key: 'maxScore', label: 'Points to Win', type: 'int', min: 3, max: 11, default: 5, step: 1 },
      ];
    },
  };
}
