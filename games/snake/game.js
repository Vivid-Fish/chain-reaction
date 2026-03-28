// games/snake/game.js — Classic snake with continuous movement
// Genre: STEER — continuous control, eat food, grow, survive
// Validates: thumb-rect input, continuous steering, collision detection

export function createGame(config) {
  const TICK_RATE = 60;
  const dt = 1 / TICK_RATE;

  // Segment spacing (distance between segment centers along the body)
  const SEGMENT_SPACING = 0.018;
  const SEGMENT_RADIUS = 0.012;
  const FOOD_RADIUS = 0.015;
  const WALL_MARGIN = 0.02;

  function spawnFood(state, rng) {
    // Spawn food away from snake body
    for (let attempt = 0; attempt < 50; attempt++) {
      const fx = rng.float(WALL_MARGIN + FOOD_RADIUS, 1 - WALL_MARGIN - FOOD_RADIUS);
      const fy = rng.float(WALL_MARGIN + FOOD_RADIUS, 1 - WALL_MARGIN - FOOD_RADIUS);
      let tooClose = false;
      for (const seg of state.snake) {
        const dx = seg.x - fx;
        const dy = seg.y - fy;
        if (dx * dx + dy * dy < 0.003) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) return { x: fx, y: fy, age: 0 };
    }
    // Fallback: just place it somewhere
    return {
      x: rng.float(WALL_MARGIN + FOOD_RADIUS, 1 - WALL_MARGIN - FOOD_RADIUS),
      y: rng.float(WALL_MARGIN + FOOD_RADIUS, 1 - WALL_MARGIN - FOOD_RADIUS),
      age: 0,
    };
  }

  return {
    meta: {
      id: 'snake',
      name: 'Snake',
      version: '0.1.0',
      players: 1,
      inputChannels: ['thumb'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 3 / 4 },
    },

    init(params) {
      const initialSpeed = params.initialSpeed || 0.2;
      const snake = [];
      // Start with 5 segments near center, heading right
      const startX = 0.5;
      const startY = 0.5;
      for (let i = 0; i < 5; i++) {
        snake.push({ x: startX - i * SEGMENT_SPACING, y: startY });
      }

      const state = {
        snake,
        direction: 0, // angle in radians (0 = right)
        food: null,
        score: 0,
        speed: initialSpeed,
        alive: true,
        growQueue: 0,
        time: 0,
        initialSpeed,
        turnRate: params.turnRate || 5.0,
        growAmount: params.growAmount || 3,
        speedIncrement: 0.003,
      };

      // Will spawn food on first step since we need rng
      return state;
    },

    step(state, input, dt, rng) {
      if (!state.alive) return state;

      state.time += dt;

      // Spawn food if needed
      if (!state.food) {
        state.food = spawnFood(state, rng);
      }
      state.food.age += dt;

      const head = state.snake[0];

      // Steer toward thumb position
      if (input.thumb && input.thumb.active) {
        const tx = input.thumb.x;
        const ty = input.thumb.y;
        const dx = tx - head.x;
        const dy = ty - head.y;
        const targetAngle = Math.atan2(dy, dx);

        // Smooth turning with limited turn rate
        let angleDiff = targetAngle - state.direction;
        // Normalize to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const maxTurn = state.turnRate * dt;
        if (Math.abs(angleDiff) < maxTurn) {
          state.direction = targetAngle;
        } else {
          state.direction += Math.sign(angleDiff) * maxTurn;
        }
        // Normalize direction
        while (state.direction > Math.PI) state.direction -= 2 * Math.PI;
        while (state.direction < -Math.PI) state.direction += 2 * Math.PI;
      }

      // Move head
      const moveX = Math.cos(state.direction) * state.speed * dt;
      const moveY = Math.sin(state.direction) * state.speed * dt;
      const newHeadX = head.x + moveX;
      const newHeadY = head.y + moveY;

      // Wall collision
      if (
        newHeadX < WALL_MARGIN ||
        newHeadX > 1 - WALL_MARGIN ||
        newHeadY < WALL_MARGIN ||
        newHeadY > 1 - WALL_MARGIN
      ) {
        state.alive = false;
        return state;
      }

      // Insert new head position, body follows via chain
      state.snake.unshift({ x: newHeadX, y: newHeadY });

      // If growing, don't remove the tail
      if (state.growQueue > 0) {
        state.growQueue--;
      } else {
        state.snake.pop();
      }

      // Enforce segment spacing: each segment trails the one in front of it
      for (let i = 1; i < state.snake.length; i++) {
        const prev = state.snake[i - 1];
        const curr = state.snake[i];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > SEGMENT_SPACING) {
          const ratio = SEGMENT_SPACING / dist;
          curr.x = prev.x + dx * ratio;
          curr.y = prev.y + dy * ratio;
        }
      }

      // Food collision
      if (state.food) {
        const fdx = state.snake[0].x - state.food.x;
        const fdy = state.snake[0].y - state.food.y;
        const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
        if (fdist < SEGMENT_RADIUS + FOOD_RADIUS) {
          state.score++;
          state.growQueue += state.growAmount;
          state.speed = state.initialSpeed + state.score * state.speedIncrement;
          state.food = spawnFood(state, rng);
        }
      }

      // Self-collision: check head against body segments (skip first few near head)
      const headSeg = state.snake[0];
      const skipSegments = Math.max(8, Math.ceil(SEGMENT_RADIUS * 2 / SEGMENT_SPACING));
      for (let i = skipSegments; i < state.snake.length; i++) {
        const seg = state.snake[i];
        const sdx = headSeg.x - seg.x;
        const sdy = headSeg.y - seg.y;
        const sdist = sdx * sdx + sdy * sdy;
        const collisionDist = SEGMENT_RADIUS * 1.6;
        if (sdist < collisionDist * collisionDist) {
          state.alive = false;
          return state;
        }
      }

      return state;
    },

    render(state, draw, alpha) {
      // Background with radial center glow
      draw.clear(0.02, 0.04, 0.02);
      draw.circle(0.5, 0.5, 0.6, {
        gradient: [
          { stop: 0, color: 'hsla(120, 25%, 10%, 0.3)' },
          { stop: 1, color: 'hsla(120, 25%, 3%, 0)' },
        ],
      });

      // Subtle grid
      const gridSize = 0.05;
      for (let x = gridSize; x < 1; x += gridSize) {
        draw.line(x, 0, x, 1, { color: 'rgba(255,255,255,0.03)', width: 1 });
      }
      for (let y = gridSize; y < 1; y += gridSize) {
        draw.line(0, y, 1, y, { color: 'rgba(255,255,255,0.03)', width: 1 });
      }

      // Wall boundary
      draw.rect(0.5, 0.5, 1 - WALL_MARGIN * 2, 1 - WALL_MARGIN * 2, {
        stroke: 'rgba(100,255,100,0.15)',
        lineWidth: 1,
        radius: 0.005,
      });

      // Snake body (draw from tail to head so head is on top)
      const len = state.snake.length;
      for (let i = len - 1; i >= 0; i--) {
        const seg = state.snake[i];
        const t = i / Math.max(1, len - 1);
        const hue = 120;
        const lightness = 25 + t * 40;
        const saturation = 50 + t * 30;
        const opacity = 0.5 + t * 0.5;
        const radius = SEGMENT_RADIUS * (0.7 + t * 0.3);

        draw.circle(seg.x, seg.y, radius, {
          gradient: [
            { stop: 0, color: `hsla(${hue}, ${saturation + 10}%, ${lightness + 15}%, ${opacity})` },
            { stop: 1, color: `hsla(${hue}, ${saturation}%, ${lightness - 5}%, ${opacity * 0.8})` },
          ],
          clip: true,
        });
      }

      // Head glow aura
      if (state.snake.length > 0) {
        const head = state.snake[0];
        draw.circle(head.x, head.y, SEGMENT_RADIUS * 3, {
          gradient: [
            { stop: 0, color: 'hsla(120, 80%, 65%, 0.12)' },
            { stop: 1, color: 'hsla(120, 80%, 50%, 0)' },
          ],
          blend: 'lighter',
        });
        // Head with glossy gradient
        draw.circle(head.x, head.y, SEGMENT_RADIUS * 1.1, {
          gradient: [
            { stop: 0, color: 'hsla(120, 60%, 92%, 1)' },
            { stop: 0.4, color: 'hsla(120, 80%, 65%, 1)' },
            { stop: 1, color: 'hsla(120, 85%, 40%, 0.9)' },
          ],
          gradientOffset: { x: -SEGMENT_RADIUS * 0.15, y: -SEGMENT_RADIUS * 0.15 },
          clip: true,
        });

        // Eyes
        const eyeOffset = SEGMENT_RADIUS * 0.4;
        const eyeRadius = SEGMENT_RADIUS * 0.2;
        const perpAngle = state.direction + Math.PI / 2;
        const eyeFwdX = Math.cos(state.direction) * eyeOffset * 0.6;
        const eyeFwdY = Math.sin(state.direction) * eyeOffset * 0.6;
        const eyeSideX = Math.cos(perpAngle) * eyeOffset;
        const eyeSideY = Math.sin(perpAngle) * eyeOffset;

        draw.circle(head.x + eyeFwdX + eyeSideX, head.y + eyeFwdY + eyeSideY, eyeRadius, {
          fill: '#fff',
        });
        draw.circle(head.x + eyeFwdX - eyeSideX, head.y + eyeFwdY - eyeSideY, eyeRadius, {
          fill: '#fff',
        });
      }

      // Food (pulsing) with gradient
      if (state.food) {
        const pulse = 1 + 0.15 * Math.sin(state.food.age * 6);
        const foodRadius = FOOD_RADIUS * pulse;
        // Food glow
        draw.circle(state.food.x, state.food.y, foodRadius * 2.5, {
          gradient: [
            { stop: 0, color: 'hsla(0, 85%, 60%, 0.12)' },
            { stop: 1, color: 'hsla(0, 85%, 50%, 0)' },
          ],
          blend: 'lighter',
        });
        draw.circle(state.food.x, state.food.y, foodRadius, {
          gradient: [
            { stop: 0, color: 'hsla(0, 60%, 92%, 1)' },
            { stop: 0.4, color: 'hsla(0, 80%, 60%, 1)' },
            { stop: 1, color: 'hsla(0, 85%, 38%, 0.9)' },
          ],
          gradientOffset: { x: -foodRadius * 0.15, y: -foodRadius * 0.15 },
          clip: true,
        });
      }

      // Score
      draw.text(`${state.score}`, 0.5, 0.04, {
        size: 0.04,
        align: 'center',
        color: 'rgba(255,255,255,0.8)',
        shadow: 'rgba(0,0,0,0.5)',
        shadowBlur: 4,
      });

      // Speed indicator
      draw.text(`${state.speed.toFixed(2)}x`, 0.95, 0.04, {
        size: 0.02,
        align: 'right',
        color: 'rgba(255,255,255,0.4)',
      });

      // Length indicator
      draw.text(`len: ${state.snake.length}`, 0.05, 0.04, {
        size: 0.02,
        align: 'left',
        color: 'rgba(255,255,255,0.4)',
      });

      // Game over
      if (!state.alive) {
        draw.text('GAME OVER', 0.5, 0.4, {
          size: 0.06,
          align: 'center',
          color: '#fff',
          shadow: 'rgba(100, 255, 100, 0.5)',
          shadowBlur: 20,
        });
        draw.text(`Score: ${state.score}`, 0.5, 0.48, {
          size: 0.03,
          align: 'center',
          color: 'rgba(255,255,255,0.7)',
          shadow: 'rgba(0,0,0,0.5)',
          shadowBlur: 4,
        });
        draw.text(`Length: ${state.snake.length}`, 0.5, 0.54, {
          size: 0.025,
          align: 'center',
          color: 'rgba(255,255,255,0.5)',
        });
      }
    },

    effects(prev, state) {
      const fx = [];
      // Eat food: burst + float at food location + ring
      if (state.score > prev.score && prev.food) {
        fx.push({ type: 'burst', x: prev.food.x, y: prev.food.y, hue: 0, count: 12, intensity: 0.5 });
        fx.push({ type: 'float', x: prev.food.x, y: prev.food.y, text: `+1`, hue: 120 });
        fx.push({ type: 'ring', x: prev.food.x, y: prev.food.y, radius: 0.04, hue: 120, duration: 0.3 });
        // Every 5 food: celebration
        if (state.score % 5 === 0) {
          fx.push({ type: 'float', x: 0.5, y: 0.12, text: `${state.score}!`, hue: 60, celebration: true, scale: 1.3 });
          fx.push({ type: 'burst', x: 0.5, y: 0.12, hue: 60, count: 16, intensity: 0.5 });
        }
      }
      // Death: burst at head + shake + flash
      if (prev.alive && !state.alive) {
        const head = state.snake[0];
        fx.push({ type: 'burst', x: head.x, y: head.y, hue: 120, count: 30, intensity: 0.8, spread: 0.1 });
        fx.push({ type: 'shake', trauma: 0.45 });
        fx.push({ type: 'flash', intensity: 0.35 });
      }
      return fx;
    },

    audio(prev, state) {
      const events = [];

      // Eat sound: ascending pentatonic note
      if (state.score > prev.score) {
        const noteIdx = Math.min(state.score % 20, 19);
        events.push({ type: 'note', index: noteIdx, gain: 0.2 });
        // Every 5 food: celebration chord
        if (state.score % 5 === 0) {
          const base = Math.min(state.score % 15, 14);
          events.push({ type: 'chord', notes: [base, base + 2, base + 4], delay: 0.05 });
        }
      }

      // Turning click
      if (state.alive && state.snake.length > 0 && prev.snake.length > 0) {
        const head = state.snake[0];
        const prevHead = prev.snake[0];
        const dx = head.x - prevHead.x;
        const dy = head.y - prevHead.y;
        const pdx = prevHead.x - (prev.snake[1]?.x || prevHead.x);
        const pdy = prevHead.y - (prev.snake[1]?.y || prevHead.y);
        if (Math.abs(dx * pdy - dy * pdx) > 0.0001) {
          events.push({ type: 'tap' });
        }
      }

      // Death sound
      if (prev.alive && !state.alive) {
        events.push({ type: 'gameover' });
      }

      return events;
    },

    score(state) {
      return {
        primary: state.score,
        label: 'Score',
        unit: 'pts',
        normalized: null,
      };
    },

    status(state) {
      if (!state.alive) return { ended: true, reason: 'collision' };
      return 'playing';
    },

    bot(difficulty, rng) {
      return (state, dt) => {
        if (!state.alive) return { thumb: null, gyro: null, taps: [], keys: {} };

        const head = state.snake[0];

        // Target is always the food
        let targetX = state.food ? state.food.x : 0.5;
        let targetY = state.food ? state.food.y : 0.5;

        // Scale body awareness with difficulty (no threshold gate)
        if (state.snake.length > 5 + Math.floor((1 - difficulty) * 20)) {
          const dx = targetX - head.x;
          const dy = targetY - head.y;
          const distToFood = Math.sqrt(dx * dx + dy * dy);
          const dirToFood = Math.atan2(dy, dx);

          // Look ahead along the path to food for body segments
          const lookSteps = Math.floor(3 + difficulty * difficulty * 17);
          const stepDist = Math.min(distToFood, 0.15) / lookSteps;
          let blocked = false;

          for (let s = 1; s <= lookSteps; s++) {
            const checkX = head.x + Math.cos(dirToFood) * stepDist * s;
            const checkY = head.y + Math.sin(dirToFood) * stepDist * s;

            for (let i = 8; i < state.snake.length; i++) {
              const seg = state.snake[i];
              const bdx = checkX - seg.x;
              const bdy = checkY - seg.y;
              if (bdx * bdx + bdy * bdy < SEGMENT_RADIUS * SEGMENT_RADIUS * 6) {
                blocked = true;
                break;
              }
            }
            if (blocked) break;
          }

          if (blocked) {
            // Try perpendicular directions to route around
            const perpAngle1 = dirToFood + Math.PI / 2;
            const perpAngle2 = dirToFood - Math.PI / 2;
            const escapeDistance = 0.1 + difficulty * 0.1;

            // Pick the perpendicular that is less blocked
            const opt1X = head.x + Math.cos(perpAngle1) * escapeDistance;
            const opt1Y = head.y + Math.sin(perpAngle1) * escapeDistance;
            const opt2X = head.x + Math.cos(perpAngle2) * escapeDistance;
            const opt2Y = head.y + Math.sin(perpAngle2) * escapeDistance;

            // Score by distance from body and staying in bounds
            const scoreOption = (ox, oy) => {
              let score = 0;
              // Penalty for being out of bounds
              if (ox < WALL_MARGIN || ox > 1 - WALL_MARGIN || oy < WALL_MARGIN || oy > 1 - WALL_MARGIN) {
                score -= 10;
              }
              // Reward for distance from body
              for (let i = 5; i < state.snake.length; i += 3) {
                const sdx = ox - state.snake[i].x;
                const sdy = oy - state.snake[i].y;
                score += Math.sqrt(sdx * sdx + sdy * sdy);
              }
              return score;
            };

            if (scoreOption(opt1X, opt1Y) > scoreOption(opt2X, opt2Y)) {
              targetX = opt1X;
              targetY = opt1Y;
            } else {
              targetX = opt2X;
              targetY = opt2Y;
            }
          }
        }

        // Wall avoidance: if close to a wall, push target away from it
        const wallPush = 0.08;
        if (head.x < WALL_MARGIN + wallPush) targetX = Math.max(targetX, WALL_MARGIN + wallPush);
        if (head.x > 1 - WALL_MARGIN - wallPush) targetX = Math.min(targetX, 1 - WALL_MARGIN - wallPush);
        if (head.y < WALL_MARGIN + wallPush) targetY = Math.max(targetY, WALL_MARGIN + wallPush);
        if (head.y > 1 - WALL_MARGIN - wallPush) targetY = Math.min(targetY, 1 - WALL_MARGIN - wallPush);

        // Add noise: quadratic so low difficulty wanders a lot
        const noise = (1 - difficulty) * (1 - difficulty) * 0.2;
        targetX += rng.float(-noise, noise);
        targetY += rng.float(-noise, noise);

        // Clamp target to bounds
        targetX = Math.max(WALL_MARGIN, Math.min(1 - WALL_MARGIN, targetX));
        targetY = Math.max(WALL_MARGIN, Math.min(1 - WALL_MARGIN, targetY));

        return {
          thumb: { active: true, x: targetX, y: targetY, vx: 0, vy: 0, startX: targetX, startY: targetY, duration: 1 },
          gyro: null,
          taps: [],
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'initialSpeed', label: 'Initial Speed', type: 'float', min: 0.1, max: 0.5, default: 0.2, step: 0.02 },
        { key: 'turnRate', label: 'Turn Rate', type: 'float', min: 2.0, max: 10.0, default: 5.0, step: 0.5 },
        { key: 'growAmount', label: 'Grow Amount', type: 'int', min: 1, max: 10, default: 3, step: 1 },
      ];
    },
  };
}
