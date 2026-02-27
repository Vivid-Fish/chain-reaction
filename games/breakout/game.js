// games/breakout/game.js — Classic breakout / brick breaker game
// Genre: STEER — continuous paddle control, destroy bricks, score points
// Validates: thumb-rect input, angle-based ball physics, power-ups, multi-level progression

export function createGame(config) {
  const TICK_RATE = 60;

  // Brick color palette by HP: vibrant hues, higher HP = hotter color
  const BRICK_COLORS = [
    null,                          // 0 hp (destroyed)
    { h: 120, s: 70, l: 55 },     // 1 hp — green
    { h: 60,  s: 80, l: 50 },     // 2 hp — yellow
    { h: 30,  s: 85, l: 50 },     // 3 hp — orange
    { h: 0,   s: 80, l: 50 },     // 4 hp — red
    { h: 280, s: 70, l: 55 },     // 5 hp — purple
  ];

  // Power-up types
  const POWERUP_TYPES = ['multiball', 'wide', 'slow'];
  const POWERUP_COLORS = {
    multiball: '#f4a',
    wide: '#4af',
    slow: '#4fa',
  };
  const POWERUP_DURATION = 8; // seconds for timed power-ups

  function generateBricks(rows, cols, rng, level) {
    const bricks = [];
    const brickW = 1 / cols;
    const brickH = 0.03;
    const topMargin = 0.08;
    const gap = 0.004;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Higher rows (lower index, closer to top) have more HP
        const baseHP = Math.max(1, rows - row);
        // Level scaling: add HP as levels progress
        const hp = Math.min(5, baseHP + Math.floor(level / 3));
        const x = col * brickW + brickW / 2;
        const y = topMargin + row * (brickH + gap) + brickH / 2;

        bricks.push({
          x, y,
          w: brickW - gap,
          h: brickH,
          hp,
          maxHp: hp,
          col, row,
        });
      }
    }
    return bricks;
  }

  function brickColor(hp, maxHp) {
    const entry = BRICK_COLORS[Math.min(hp, BRICK_COLORS.length - 1)];
    if (!entry) return '#333';
    // Dim slightly as HP decreases from max
    const dimFactor = 0.6 + 0.4 * (hp / maxHp);
    return `hsl(${entry.h}, ${entry.s}%, ${entry.l * dimFactor}%)`;
  }

  function brickBorderColor(hp) {
    const entry = BRICK_COLORS[Math.min(hp, BRICK_COLORS.length - 1)];
    if (!entry) return '#222';
    return `hsl(${entry.h}, ${entry.s}%, ${entry.l + 15}%)`;
  }

  return {
    meta: {
      id: 'breakout',
      name: 'Breakout',
      version: '0.1.0',
      players: 1,
      inputChannels: ['thumb'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 16 },
    },

    init(params) {
      const ballSpeed = params.ballSpeed || 0.45;
      const paddleWidth = params.paddleWidth || 0.15;
      const brickRows = params.brickRows || 5;
      const lives = params.lives || 3;
      const brickCols = 8;

      // We need an rng to generate bricks but init doesn't receive one.
      // Generate a simple procedural layout; the first step call will
      // have the proper rng if we need randomness later.
      const bricks = [];
      const brickW = 1 / brickCols;
      const brickH = 0.03;
      const topMargin = 0.08;
      const gap = 0.004;

      for (let row = 0; row < brickRows; row++) {
        for (let col = 0; col < brickCols; col++) {
          const hp = Math.max(1, brickRows - row);
          const x = col * brickW + brickW / 2;
          const y = topMargin + row * (brickH + gap) + brickH / 2;
          bricks.push({
            x, y,
            w: brickW - gap,
            h: brickH,
            hp,
            maxHp: hp,
          });
        }
      }

      return {
        paddle: { x: 0.5, width: paddleWidth, height: 0.015, y: 0.92 },
        balls: [
          {
            x: 0.5,
            y: 0.88,
            vx: 0, vy: 0,
            radius: 0.01,
            needsLaunch: true,
          },
        ],
        bricks,
        score: 0,
        lives,
        maxLives: lives,
        combo: 0,
        comboTimer: 0,
        comboDisplay: 0,    // for rendering fading combo text
        comboDisplayTimer: 0,
        powerups: [],        // active power-up effects [{type, timer}]
        fallingPowerups: [], // power-ups dropping from destroyed bricks [{x, y, vy, type}]
        level: 1,
        ballSpeed,
        basePaddleWidth: paddleWidth,
        brickRows,
        brickCols,
        lastBrickHit: false,   // for audio: was a brick hit this frame
        lastPaddleHit: false,  // for audio: did ball hit paddle this frame
        lastPowerup: false,    // for audio: was a power-up collected this frame
        lastBallLost: false,   // for audio: was a ball lost this frame
        particles: [],         // visual particles from brick destruction
      };
    },

    step(state, input, dt, rng) {
      if (state.lives <= 0) return state;

      // Deferred ball launch — uses rng for deterministic replay
      for (const ball of state.balls) {
        if (ball.needsLaunch) {
          const angle = -Math.PI / 2 + rng.float(-0.2, 0.2);
          ball.vx = Math.cos(angle) * state.ballSpeed;
          ball.vy = Math.sin(angle) * state.ballSpeed;
          ball.needsLaunch = false;
        }
      }

      // Reset audio flags
      state.lastBrickHit = false;
      state.lastPaddleHit = false;
      state.lastPowerup = false;
      state.lastBallLost = false;

      // --- Paddle movement: smooth follow toward thumb.x ---
      if (input.thumb && input.thumb.active) {
        const targetX = input.thumb.x;
        const dx = targetX - state.paddle.x;
        state.paddle.x += dx * 0.18;
      }
      // Compute effective paddle width (may be widened by power-up)
      const hasWide = state.powerups.some(p => p.type === 'wide');
      const effectiveWidth = hasWide ? state.basePaddleWidth * 1.6 : state.paddle.width;
      state.paddle.width = effectiveWidth;
      // Clamp paddle to screen bounds
      const halfPad = effectiveWidth / 2;
      state.paddle.x = Math.max(halfPad, Math.min(1 - halfPad, state.paddle.x));

      // --- Ball speed modifier ---
      const hasSlow = state.powerups.some(p => p.type === 'slow');
      const speedMult = hasSlow ? 0.65 : 1.0;

      // --- Combo timer decay ---
      if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) {
          state.combo = 0;
          state.comboTimer = 0;
        }
      }

      // --- Combo display fade ---
      if (state.comboDisplayTimer > 0) {
        state.comboDisplayTimer -= dt;
      }

      // --- Move balls ---
      const ballsToRemove = [];
      for (let bi = 0; bi < state.balls.length; bi++) {
        const ball = state.balls[bi];
        ball.x += ball.vx * speedMult * dt;
        ball.y += ball.vy * speedMult * dt;

        // --- Wall bounces ---
        // Left wall
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
        }
        // Right wall
        if (ball.x + ball.radius > 1) {
          ball.x = 1 - ball.radius;
          ball.vx = -Math.abs(ball.vx);
        }
        // Ceiling
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
        }

        // --- Paddle collision ---
        const py = state.paddle.y;
        const px = state.paddle.x;
        const pw = state.paddle.width;
        const ph = state.paddle.height;

        if (
          ball.vy > 0 &&
          ball.y + ball.radius >= py - ph / 2 &&
          ball.y + ball.radius <= py + ph / 2 + ball.vy * dt * 2 &&
          ball.x >= px - pw / 2 &&
          ball.x <= px + pw / 2
        ) {
          // Hit position on paddle: -1 (left edge) to +1 (right edge)
          const hitPos = (ball.x - px) / (pw / 2);
          // Angle: -60 to -120 degrees (from positive x axis), mapped from hit position
          const minAngle = -Math.PI * 0.8;  // steep left
          const maxAngle = -Math.PI * 0.2;  // steep right
          const angle = minAngle + (hitPos + 1) / 2 * (maxAngle - minAngle);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx = Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;
          // Ensure ball is above paddle
          ball.y = py - ph / 2 - ball.radius;
          state.lastPaddleHit = true;
        }

        // --- Brick collision ---
        for (let i = state.bricks.length - 1; i >= 0; i--) {
          const brick = state.bricks[i];
          if (brick.hp <= 0) continue;

          // AABB collision between ball (treated as point + radius) and brick
          const bLeft = brick.x - brick.w / 2;
          const bRight = brick.x + brick.w / 2;
          const bTop = brick.y - brick.h / 2;
          const bBottom = brick.y + brick.h / 2;

          // Closest point on brick to ball center
          const closestX = Math.max(bLeft, Math.min(bRight, ball.x));
          const closestY = Math.max(bTop, Math.min(bBottom, ball.y));
          const distX = ball.x - closestX;
          const distY = ball.y - closestY;
          const distSq = distX * distX + distY * distY;

          if (distSq < ball.radius * ball.radius) {
            // Determine bounce direction
            const overlapX = ball.radius - Math.abs(distX);
            const overlapY = ball.radius - Math.abs(distY);

            if (overlapX < overlapY) {
              ball.vx = -ball.vx;
              ball.x += (distX > 0 ? overlapX : -overlapX);
            } else {
              ball.vy = -ball.vy;
              ball.y += (distY > 0 ? overlapY : -overlapY);
            }

            // Damage brick
            brick.hp--;
            state.lastBrickHit = true;

            // Combo system
            state.combo++;
            state.comboTimer = 1.5; // 1.5s window to keep combo alive
            if (state.combo >= 3) {
              state.comboDisplay = state.combo;
              state.comboDisplayTimer = 1.0;
            }

            // Score: base 10 per hit, multiplied by combo
            const comboMult = Math.min(state.combo, 10);
            state.score += 10 * comboMult;

            if (brick.hp <= 0) {
              // Brick destroyed — bonus score
              state.score += 20;

              // Spawn particles
              for (let p = 0; p < 4; p++) {
                state.particles.push({
                  x: brick.x,
                  y: brick.y,
                  vx: rng.float(-0.3, 0.3),
                  vy: rng.float(-0.3, 0.1),
                  life: rng.float(0.3, 0.6),
                  maxLife: 0.6,
                  hue: BRICK_COLORS[Math.min(brick.maxHp, BRICK_COLORS.length - 1)]?.h || 0,
                });
              }

              // Chance to spawn power-up (15% chance)
              if (rng.float(0, 1) < 0.15) {
                const type = POWERUP_TYPES[Math.floor(rng.float(0, POWERUP_TYPES.length))];
                state.fallingPowerups.push({
                  x: brick.x,
                  y: brick.y,
                  vy: 0.2,
                  type,
                  radius: 0.015,
                });
              }
            }

            // Only collide with one brick per frame per ball
            break;
          }
        }

        // --- Ball lost below screen ---
        if (ball.y - ball.radius > 1.05) {
          ballsToRemove.push(bi);
        }
      }

      // Remove lost balls (iterate in reverse)
      for (let i = ballsToRemove.length - 1; i >= 0; i--) {
        state.balls.splice(ballsToRemove[i], 1);
      }

      // If all balls lost, lose a life and respawn
      if (state.balls.length === 0) {
        state.lives--;
        state.lastBallLost = true;
        state.combo = 0;
        state.comboTimer = 0;

        if (state.lives > 0) {
          // Respawn ball on paddle
          const angle = -Math.PI / 2 + rng.float(-0.3, 0.3);
          state.balls.push({
            x: state.paddle.x,
            y: state.paddle.y - state.paddle.height / 2 - 0.015,
            vx: Math.cos(angle) * state.ballSpeed,
            vy: Math.sin(angle) * state.ballSpeed,
            radius: 0.01,
          });
          // Clear timed power-ups on life loss
          state.powerups = [];
          state.paddle.width = state.basePaddleWidth;
        }
      }

      // --- Remove destroyed bricks ---
      state.bricks = state.bricks.filter(b => b.hp > 0);

      // --- Level complete: all bricks gone ---
      if (state.bricks.length === 0 && state.lives > 0) {
        state.level++;
        state.score += 100 * state.level; // level bonus

        // Generate new bricks with increasing difficulty
        const rows = Math.min(state.brickRows + Math.floor(state.level / 2), 8);
        state.bricks = generateBricks(rows, state.brickCols, rng, state.level);

        // Speed up slightly each level
        state.ballSpeed = (state.ballSpeed || 0.45) + 0.02;

        // Reset balls
        const angle = -Math.PI / 2 + rng.float(-0.3, 0.3);
        state.balls = [{
          x: state.paddle.x,
          y: state.paddle.y - state.paddle.height / 2 - 0.015,
          vx: Math.cos(angle) * state.ballSpeed,
          vy: Math.sin(angle) * state.ballSpeed,
          radius: 0.01,
        }];

        // Clear power-ups on new level
        state.powerups = [];
        state.fallingPowerups = [];
        state.paddle.width = state.basePaddleWidth;
      }

      // --- Falling power-ups ---
      for (let i = state.fallingPowerups.length - 1; i >= 0; i--) {
        const pu = state.fallingPowerups[i];
        pu.y += pu.vy * dt;

        // Check if paddle catches it
        if (
          pu.y + pu.radius >= state.paddle.y - state.paddle.height / 2 &&
          pu.y - pu.radius <= state.paddle.y + state.paddle.height / 2 &&
          pu.x >= state.paddle.x - state.paddle.width / 2 &&
          pu.x <= state.paddle.x + state.paddle.width / 2
        ) {
          // Activate power-up
          state.lastPowerup = true;

          if (pu.type === 'multiball') {
            // Spawn 2 extra balls from current ball positions
            const sourceBalls = [...state.balls];
            for (const src of sourceBalls) {
              if (state.balls.length >= 6) break; // cap at 6 balls
              for (let n = 0; n < 2; n++) {
                if (state.balls.length >= 6) break;
                const spreadAngle = rng.float(-0.8, 0.8);
                const speed = Math.sqrt(src.vx * src.vx + src.vy * src.vy);
                const baseAngle = Math.atan2(src.vy, src.vx);
                state.balls.push({
                  x: src.x,
                  y: src.y,
                  vx: Math.cos(baseAngle + spreadAngle) * speed,
                  vy: Math.sin(baseAngle + spreadAngle) * speed,
                  radius: 0.01,
                });
              }
              break; // only split from one source ball
            }
          } else if (pu.type === 'wide' || pu.type === 'slow') {
            // Remove existing instance of same type, then add fresh
            state.powerups = state.powerups.filter(p => p.type !== pu.type);
            state.powerups.push({ type: pu.type, timer: POWERUP_DURATION });
          }

          state.fallingPowerups.splice(i, 1);
          continue;
        }

        // Off-screen removal
        if (pu.y > 1.1) {
          state.fallingPowerups.splice(i, 1);
        }
      }

      // --- Tick power-up timers ---
      for (let i = state.powerups.length - 1; i >= 0; i--) {
        state.powerups[i].timer -= dt;
        if (state.powerups[i].timer <= 0) {
          const expired = state.powerups[i];
          state.powerups.splice(i, 1);
          // Reset paddle width if wide expired
          if (expired.type === 'wide') {
            state.paddle.width = state.basePaddleWidth;
          }
        }
      }

      // --- Particles ---
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.5 * dt; // gravity
        p.life -= dt;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
        }
      }

      return state;
    },

    render(state, draw, alpha) {
      // --- Background: dark with subtle grid pattern ---
      draw.clear(0.03, 0.02, 0.08);

      // Subtle vertical lines
      for (let i = 1; i < 8; i++) {
        draw.line(i / 8, 0, i / 8, 1, { color: 'rgba(255,255,255,0.02)', width: 1 });
      }
      // Subtle horizontal lines in brick area
      for (let i = 1; i <= 10; i++) {
        const y = 0.05 + i * 0.035;
        if (y < 0.45) {
          draw.line(0, y, 1, y, { color: 'rgba(255,255,255,0.015)', width: 1 });
        }
      }

      // --- Bricks ---
      for (const brick of state.bricks) {
        // Main brick body
        draw.rect(brick.x, brick.y, brick.w, brick.h, {
          fill: brickColor(brick.hp, brick.maxHp),
          radius: 0.003,
        });
        // Highlight on top edge
        draw.rect(brick.x, brick.y - brick.h * 0.3, brick.w, brick.h * 0.3, {
          fill: `rgba(255,255,255,0.12)`,
          radius: 0.002,
        });
      }

      // --- Particles ---
      for (const p of state.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        draw.circle(p.x, p.y, 0.005 * alpha, {
          fill: `hsla(${p.hue}, 80%, 60%, ${alpha})`,
        });
      }

      // --- Falling power-ups ---
      for (const pu of state.fallingPowerups) {
        const color = POWERUP_COLORS[pu.type] || '#fff';
        draw.circle(pu.x, pu.y, pu.radius, {
          fill: color,
          glow: 0.01,
          glowColor: color + '66',
        });
        // Label inside power-up
        const label = pu.type === 'multiball' ? 'M' : pu.type === 'wide' ? 'W' : 'S';
        draw.text(label, pu.x, pu.y, {
          size: 0.015,
          align: 'center',
          color: '#fff',
        });
      }

      // --- Paddle ---
      const hasWide = state.powerups.some(p => p.type === 'wide');
      const paddleColor = hasWide ? '#4af' : '#dde';
      draw.rect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height, {
        fill: paddleColor,
        radius: 0.005,
        glow: 0.008,
        glowColor: hasWide ? 'rgba(68,170,255,0.4)' : 'rgba(200,210,230,0.2)',
      });

      // --- Balls ---
      for (const ball of state.balls) {
        draw.circle(ball.x, ball.y, ball.radius, {
          fill: '#fff',
          glow: 0.012,
          glowColor: 'rgba(255,255,255,0.5)',
        });
      }

      // --- Active power-up indicators (top-right) ---
      let puY = 0.04;
      for (const pu of state.powerups) {
        const color = POWERUP_COLORS[pu.type] || '#fff';
        const remaining = Math.ceil(pu.timer);
        draw.text(`${pu.type} ${remaining}s`, 0.98, puY, {
          size: 0.018,
          align: 'right',
          color,
        });
        puY += 0.03;
      }

      // --- Score display ---
      draw.text(`${state.score}`, 0.5, 0.02, {
        size: 0.032,
        align: 'center',
        color: 'rgba(255,255,255,0.9)',
      });

      // --- Level indicator ---
      draw.text(`LV ${state.level}`, 0.03, 0.02, {
        size: 0.02,
        align: 'left',
        color: 'rgba(255,255,255,0.5)',
      });

      // --- Lives indicator ---
      for (let i = 0; i < state.maxLives; i++) {
        const lx = 0.03 + i * 0.03;
        const ly = 0.97;
        const alive = i < state.lives;
        draw.circle(lx, ly, 0.008, {
          fill: alive ? '#f55' : 'rgba(255,255,255,0.15)',
        });
      }

      // --- Combo text (fades) ---
      if (state.comboDisplayTimer > 0 && state.comboDisplay >= 3) {
        const fadeAlpha = Math.min(1, state.comboDisplayTimer / 0.4);
        const yOff = 0.5 - (1 - fadeAlpha) * 0.05;
        draw.text(`${state.comboDisplay}x COMBO!`, 0.5, yOff, {
          size: 0.045 + state.comboDisplay * 0.002,
          align: 'center',
          color: `rgba(255, 220, 80, ${fadeAlpha})`,
        });
      }

      // --- Slow-mo indicator ---
      if (state.powerups.some(p => p.type === 'slow')) {
        draw.text('SLOW', 0.5, 0.96, {
          size: 0.018,
          align: 'center',
          color: 'rgba(80, 255, 160, 0.6)',
        });
      }

      // --- Game over ---
      if (state.lives <= 0) {
        // Dim overlay
        draw.rect(0.5, 0.5, 1, 1, {
          fill: 'rgba(0,0,0,0.6)',
        });
        draw.text('GAME OVER', 0.5, 0.4, {
          size: 0.06,
          align: 'center',
          color: '#fff',
        });
        draw.text(`Score: ${state.score}`, 0.5, 0.48, {
          size: 0.03,
          align: 'center',
          color: 'rgba(255,255,255,0.7)',
        });
        draw.text(`Level: ${state.level}`, 0.5, 0.54, {
          size: 0.025,
          align: 'center',
          color: 'rgba(255,255,255,0.5)',
        });
      }
    },

    audio(prev, state) {
      const events = [];

      // Paddle bounce — satisfying click
      if (state.lastPaddleHit) {
        events.push({ type: 'tone', freq: 440, duration: 0.06, gain: 0.15 });
      }

      // Brick hit — higher pitched, pitch scales with combo
      if (state.lastBrickHit) {
        const comboFreq = 600 + state.combo * 40;
        events.push({ type: 'tone', freq: Math.min(comboFreq, 1200), duration: 0.04, gain: 0.12 });
      }

      // Power-up collected — drum-like thump
      if (state.lastPowerup) {
        events.push({ type: 'tone', freq: 150, duration: 0.12, gain: 0.25 });
        events.push({ type: 'tone', freq: 800, duration: 0.05, gain: 0.1 });
      }

      // Ball lost — noise burst
      if (state.lastBallLost) {
        events.push({ type: 'noise', filter: 'lowpass', freq: 300, duration: 0.4, gain: 0.25 });
      }

      // Level complete detection: bricks went from some to none
      if (prev.bricks && prev.bricks.length > 0 && state.bricks.length > 0 && state.level > prev.level) {
        events.push({ type: 'tone', freq: 523, duration: 0.1, gain: 0.15 });
        events.push({ type: 'tone', freq: 659, duration: 0.1, gain: 0.15 });
        events.push({ type: 'tone', freq: 784, duration: 0.15, gain: 0.2 });
      }

      return events;
    },

    score(state) {
      return {
        primary: state.score,
        label: 'Score',
        unit: 'pts',
        normalized: null, // no natural ceiling
      };
    },

    status(state) {
      if (state.lives <= 0) return { ended: true, reason: 'no_lives' };
      return 'playing';
    },

    bot(difficulty, rng) {
      // Bot that controls the paddle to intercept the ball
      let lastTargetX = 0.5;
      let reactionTimer = 0;
      let currentTargetX = 0.5;

      return (state, dt) => {
        if (state.lives <= 0) {
          return { thumb: null, gyro: null, taps: [], keys: {} };
        }

        // Find the most relevant ball to track
        let trackBall = null;
        let bestScore = -Infinity;

        for (const ball of state.balls) {
          const urgency = ball.y + (ball.vy > 0 ? ball.vy * 0.5 : 0);
          if (urgency > bestScore) {
            bestScore = urgency;
            trackBall = ball;
          }
        }

        if (!trackBall) {
          return {
            thumb: { active: true, x: 0.5, y: 0.5, vx: 0, vy: 0, startX: 0.5, startY: 0.5, duration: 1 },
            gyro: null,
            taps: [],
            keys: {},
          };
        }

        // Reaction delay: low difficulty re-evaluates slowly
        reactionTimer -= dt;
        if (reactionTimer <= 0) {
          reactionTimer = (1 - difficulty) * 0.15;

          // Prediction quality scales smoothly with difficulty
          // d=0: just follow ball.x. d=1: full wall-bounce prediction.
          const timeToReach = trackBall.vy > 0.01
            ? (state.paddle.y - trackBall.y) / trackBall.vy
            : 2.0;

          // Prediction time scales with difficulty (d=0: 0s, d=1: full)
          const predictionTime = Math.min(timeToReach, 1.5) * difficulty;

          let predX = trackBall.x;
          let predVx = trackBall.vx;
          let remaining = predictionTime;
          const step = 1 / 60;

          while (remaining > 0) {
            predX += predVx * step;
            if (predX < 0.01) { predX = 0.01; predVx = Math.abs(predVx); }
            else if (predX > 0.99) { predX = 0.99; predVx = -Math.abs(predVx); }
            remaining -= step;
          }

          // Noise: quadratic falloff
          const noise = (1 - difficulty) * (1 - difficulty) * 0.12;
          currentTargetX = predX + rng.float(-noise, noise);
        }

        // Tracking speed: fast enough to catch, but not so fast it overshoots
        const blend = 0.15 + difficulty * 0.5;
        lastTargetX = lastTargetX + (currentTargetX - lastTargetX) * blend;

        // Clamp to valid range
        lastTargetX = Math.max(0.05, Math.min(0.95, lastTargetX));

        return {
          thumb: {
            active: true,
            x: lastTargetX,
            y: 0.5,
            vx: 0,
            vy: 0,
            startX: lastTargetX,
            startY: 0.5,
            duration: 1,
          },
          gyro: null,
          taps: [],
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'ballSpeed', label: 'Ball Speed', type: 'float', min: 0.2, max: 0.8, default: 0.45, step: 0.05 },
        { key: 'paddleWidth', label: 'Paddle Width', type: 'float', min: 0.08, max: 0.3, default: 0.15, step: 0.01 },
        { key: 'brickRows', label: 'Brick Rows', type: 'int', min: 2, max: 8, default: 5, step: 1 },
        { key: 'lives', label: 'Lives', type: 'int', min: 1, max: 5, default: 3, step: 1 },
      ];
    },
  };
}
