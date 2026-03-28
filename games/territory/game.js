// games/territory/game.js — Grid-based area control (Go/Othello hybrid)
// Genre: STRATEGY — turn-based placement, capture mechanics, positional play
// Validates: tap input, PvP (2-player), turn-based state, bot difficulty gradient

export function createGame(config) {
  const TICK_RATE = 30;
  const GRID_SIZE = config.gridSize || 8;
  const TURN_TIME = config.turnTime || 30; // seconds per turn, 0 = unlimited

  // Directions for adjacency checks (4-directional: up, down, left, right)
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Positional value map for bot AI — corners and edges are strategically valuable
  function positionalValue(row, col, size) {
    const isCorner = (row === 0 || row === size - 1) && (col === 0 || col === size - 1);
    const isEdge = row === 0 || row === size - 1 || col === 0 || col === size - 1;
    // Adjacent to corner is dangerous (can be captured easily)
    const adjCorner =
      ((row === 0 || row === size - 1) && (col === 1 || col === size - 2)) ||
      ((col === 0 || col === size - 1) && (row === 1 || row === size - 2)) ||
      ((row === 1 || row === size - 2) && (col === 1 || col === size - 2));
    if (isCorner) return 5;
    if (adjCorner) return -2;
    if (isEdge) return 2;
    return 1;
  }

  // Check if placing at (row, col) for player is valid and return captures
  function getCaptures(grid, row, col, player, size) {
    if (row < 0 || row >= size || col < 0 || col >= size) return null;
    if (grid[row][col] !== -1) return null; // cell occupied

    const opponent = 1 - player;
    const captures = [];

    // For each direction, walk outward looking for a line of opponent pieces
    // bookended by the player's own piece (Othello-style flanking)
    for (const [dr, dc] of DIRS) {
      const line = [];
      let r = row + dr;
      let c = col + dc;

      // Walk through opponent pieces
      while (r >= 0 && r < size && c >= 0 && c < size && grid[r][c] === opponent) {
        line.push([r, c]);
        r += dr;
        c += dc;
      }

      // Must end on our own piece, and must have flipped at least one
      if (line.length > 0 && r >= 0 && r < size && c >= 0 && c < size && grid[r][c] === player) {
        captures.push(...line);
      }
    }

    return captures;
  }

  // Get all valid moves for a player
  function getValidMoves(grid, player, size) {
    const moves = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const caps = getCaptures(grid, r, c, player, size);
        if (caps !== null && caps.length > 0) {
          moves.push({ row: r, col: c, captures: caps });
        }
      }
    }
    return moves;
  }

  // Count pieces for each player
  function countPieces(grid, size) {
    const scores = [0, 0];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) scores[0]++;
        if (grid[r][c] === 1) scores[1]++;
      }
    }
    return scores;
  }

  return {
    meta: {
      id: 'territory',
      name: 'Territory',
      version: '0.1.0',
      players: 2,
      inputChannels: ['taps'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 10 },
    },

    init(params) {
      const size = params.gridSize || GRID_SIZE;
      // Initialize empty grid (-1 = empty, 0 = player 0, 1 = player 1)
      const grid = [];
      for (let r = 0; r < size; r++) {
        grid.push(new Array(size).fill(-1));
      }

      // Starting position: 4 pieces in the center (classic Othello opening)
      const mid = Math.floor(size / 2);
      grid[mid - 1][mid - 1] = 0;
      grid[mid - 1][mid] = 1;
      grid[mid][mid - 1] = 1;
      grid[mid][mid] = 0;

      return {
        grid,
        size,
        currentPlayer: 0,
        scores: [2, 2],
        moveCount: 0,
        turnTimer: params.turnTime || TURN_TIME,
        turnTimeLeft: params.turnTime || TURN_TIME,
        lastMove: null,       // { row, col, player, captures }
        lastCaptures: [],     // cells that were just captured (for animation)
        captureFlash: 0,      // countdown for capture animation
        consecutivePasses: 0, // track when both players can't move
        ended: false,
        endReason: null,
        winner: null,
        // Track taps already processed this tick to prevent double-processing
        tapProcessed: false,
      };
    },

    step(state, input, dt, rng) {
      if (state.ended) return state;

      // Decay capture flash animation
      if (state.captureFlash > 0) {
        state.captureFlash -= dt;
        if (state.captureFlash < 0) state.captureFlash = 0;
      }

      // Get valid moves for current player
      const validMoves = getValidMoves(state.grid, state.currentPlayer, state.size);

      // If no valid moves, pass turn
      if (validMoves.length === 0) {
        state.consecutivePasses++;
        if (state.consecutivePasses >= 2) {
          // Both players passed — game over
          state.ended = true;
          state.endReason = 'no_moves';
          state.scores = countPieces(state.grid, state.size);
          if (state.scores[0] > state.scores[1]) state.winner = 0;
          else if (state.scores[1] > state.scores[0]) state.winner = 1;
          else state.winner = null;
          return state;
        }
        // Switch to other player
        state.currentPlayer = 1 - state.currentPlayer;
        state.turnTimeLeft = state.turnTimer;
        state.tapProcessed = false;
        return state;
      }

      // Turn timer
      if (state.turnTimer > 0) {
        state.turnTimeLeft -= dt;
        if (state.turnTimeLeft <= 0) {
          // Time ran out — random valid move (forced)
          const forced = validMoves[Math.floor(rng.random() * validMoves.length)];
          return applyMove(state, forced.row, forced.col, forced.captures);
        }
      }

      // Process input from current player
      // For 2P games, input is [input0, input1] array
      const playerInput = Array.isArray(input) ? input[state.currentPlayer] : input;

      if (playerInput && playerInput.taps && playerInput.taps.length > 0 && !state.tapProcessed) {
        const tap = playerInput.taps[0]; // Process first tap only

        // Map normalized tap position to grid cell
        // Grid is drawn with padding, calculate the grid region
        const padding = 0.06;
        const gridArea = 1 - 2 * padding;
        const cellSize = gridArea / state.size;

        const col = Math.floor((tap.x - padding) / cellSize);
        const row = Math.floor((tap.y - padding) / cellSize);

        // Find if this is a valid move
        const move = validMoves.find(m => m.row === row && m.col === col);
        if (move) {
          state.tapProcessed = true;
          return applyMove(state, move.row, move.col, move.captures);
        }
      }

      return state;

      function applyMove(st, row, col, captures) {
        const player = st.currentPlayer;

        // Place piece
        st.grid[row][col] = player;

        // Flip captured pieces
        for (const [cr, cc] of captures) {
          st.grid[cr][cc] = player;
        }

        // Update scores
        st.scores = countPieces(st.grid, st.size);

        // Record move for rendering
        st.lastMove = { row, col, player, captures };
        st.lastCaptures = captures.slice();
        st.captureFlash = 0.4; // flash duration

        st.moveCount++;
        st.consecutivePasses = 0;

        // Check if grid is full
        let emptyCells = 0;
        for (let r = 0; r < st.size; r++) {
          for (let c = 0; c < st.size; c++) {
            if (st.grid[r][c] === -1) emptyCells++;
          }
        }

        if (emptyCells === 0) {
          st.ended = true;
          st.endReason = 'full';
          if (st.scores[0] > st.scores[1]) st.winner = 0;
          else if (st.scores[1] > st.scores[0]) st.winner = 1;
          else st.winner = null;
          return st;
        }

        // Switch turns
        st.currentPlayer = 1 - player;
        st.turnTimeLeft = st.turnTimer;
        st.tapProcessed = false;

        return st;
      }
    },

    render(state, draw, alpha) {
      // Background with vignette
      draw.clear(0.05, 0.07, 0.05);
      draw.circle(0.5, 0.45, 0.6, {
        gradient: [
          { stop: 0, color: 'hsla(120, 20%, 10%, 0.25)' },
          { stop: 1, color: 'hsla(120, 20%, 3%, 0)' },
        ],
      });

      const padding = 0.06;
      const gridArea = 1 - 2 * padding;
      const cellSize = gridArea / state.size;

      // Player colors
      const colors = ['#4488ff', '#ff4444'];
      const colorsDim = ['rgba(68, 136, 255, 0.3)', 'rgba(255, 68, 68, 0.3)'];
      const colorsGlow = ['rgba(68, 136, 255, 0.5)', 'rgba(255, 68, 68, 0.5)'];

      // Grid background with gradient
      draw.rect(padding, padding, gridArea, gridArea, {
        gradient: [
          { stop: 0, color: 'rgba(10, 10, 10, 0.35)' },
          { stop: 1, color: 'rgba(0, 0, 0, 0.25)' },
        ],
        radius: 0.01,
      });

      // Grid lines
      for (let i = 0; i <= state.size; i++) {
        const x = padding + i * cellSize;
        const y = padding + i * cellSize;
        draw.line(x, padding, x, padding + gridArea, {
          color: 'rgba(255, 255, 255, 0.15)',
          width: 1,
        });
        draw.line(padding, y, padding + gridArea, y, {
          color: 'rgba(255, 255, 255, 0.15)',
          width: 1,
        });
      }

      // Valid moves
      const validMoves = state.ended ? [] : getValidMoves(state.grid, state.currentPlayer, state.size);
      const validSet = new Set(validMoves.map(m => `${m.row},${m.col}`));

      // Cells
      for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
          const cx = padding + (c + 0.5) * cellSize;
          const cy = padding + (r + 0.5) * cellSize;
          const pieceRadius = cellSize * 0.38;

          if (state.grid[r][c] >= 0) {
            const player = state.grid[r][c];
            const isLastMove = state.lastMove &&
              state.lastMove.row === r && state.lastMove.col === c;
            const isLastCapture = state.lastCaptures.some(
              ([cr, cc]) => cr === r && cc === c
            );

            // Piece glow for recently captured/placed
            if ((isLastMove || isLastCapture) && state.captureFlash > 0) {
              draw.circle(cx, cy, pieceRadius * 1.5, {
                gradient: [
                  { stop: 0, color: colorsGlow[player] },
                  { stop: 1, color: colorsGlow[player].replace('0.5)', '0)') },
                ],
                alpha: state.captureFlash / 0.4,
                blend: 'lighter',
              });
            }

            // Piece with glossy gradient
            const hue = player === 0 ? 215 : 0;
            draw.circle(cx, cy, pieceRadius, {
              gradient: [
                { stop: 0, color: `hsla(${hue}, 65%, 88%, 1)` },
                { stop: 0.35, color: `hsla(${hue}, 75%, 62%, 1)` },
                { stop: 1, color: `hsla(${hue}, 80%, 38%, 0.9)` },
              ],
              gradientOffset: { x: -pieceRadius * 0.15, y: -pieceRadius * 0.15 },
              clip: true,
            });
          } else if (validSet.has(`${r},${c}`)) {
            draw.circle(cx, cy, pieceRadius * 0.3, {
              fill: colorsDim[state.currentPlayer],
            });
          }
        }
      }

      // Score display
      const scoreY = padding + gridArea + 0.035;

      // Player 0 (blue) score
      draw.circle(0.12, scoreY, 0.015, {
        gradient: [
          { stop: 0, color: 'hsla(215, 65%, 85%, 1)' },
          { stop: 1, color: 'hsla(215, 80%, 45%, 0.9)' },
        ],
        clip: true,
      });
      draw.text(`${state.scores[0]}`, 0.16, scoreY, {
        size: 0.03,
        align: 'left',
        color: colors[0],
        shadow: 'rgba(68, 136, 255, 0.3)',
        shadowBlur: 6,
      });

      // Player 1 (red) score
      draw.circle(0.88, scoreY, 0.015, {
        gradient: [
          { stop: 0, color: 'hsla(0, 65%, 85%, 1)' },
          { stop: 1, color: 'hsla(0, 80%, 40%, 0.9)' },
        ],
        clip: true,
      });
      draw.text(`${state.scores[1]}`, 0.84, scoreY, {
        size: 0.03,
        align: 'right',
        color: colors[1],
        shadow: 'rgba(255, 68, 68, 0.3)',
        shadowBlur: 6,
      });

      // Turn indicator
      if (!state.ended) {
        const turnLabel = state.currentPlayer === 0 ? 'Blue' : 'Red';
        draw.text(`${turnLabel}'s Turn`, 0.5, scoreY, {
          size: 0.028,
          align: 'center',
          color: colors[state.currentPlayer],
          shadow: state.currentPlayer === 0 ? 'rgba(68, 136, 255, 0.25)' : 'rgba(255, 68, 68, 0.25)',
          shadowBlur: 6,
        });

        if (state.turnTimer > 0) {
          const timerY = scoreY + 0.035;
          const timeLeft = Math.max(0, Math.ceil(state.turnTimeLeft));
          const timerColor = timeLeft <= 5 ? '#ff6666' : 'rgba(255, 255, 255, 0.5)';
          draw.text(`${timeLeft}s`, 0.5, timerY, {
            size: 0.022,
            align: 'center',
            color: timerColor,
          });
        }
      }

      // Move count
      draw.text(`Move ${state.moveCount}`, 0.5, 0.025, {
        size: 0.02,
        align: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
      });

      // Game over overlay
      if (state.ended) {
        draw.rect(0.5, 0.5, 1, 1, {
          fill: 'rgba(0, 0, 0, 0.5)',
        });

        let resultText;
        if (state.winner === null) {
          resultText = 'DRAW';
        } else {
          resultText = state.winner === 0 ? 'BLUE WINS' : 'RED WINS';
        }

        const winColor = state.winner !== null ? colors[state.winner] : '#ffffff';
        const winShadow = state.winner === 0 ? 'rgba(68, 136, 255, 0.6)' :
          state.winner === 1 ? 'rgba(255, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.4)';
        draw.text(resultText, 0.5, 0.42, {
          size: 0.06,
          align: 'center',
          color: winColor,
          shadow: winShadow,
          shadowBlur: 20,
        });

        draw.text(`${state.scores[0]} - ${state.scores[1]}`, 0.5, 0.52, {
          size: 0.04,
          align: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
          shadow: 'rgba(0,0,0,0.5)',
          shadowBlur: 4,
        });

        const reasonText = state.endReason === 'full' ? 'Board Full' : 'No Moves Left';
        draw.text(reasonText, 0.5, 0.60, {
          size: 0.025,
          align: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
        });
      }
    },

    effects(prev, state) {
      const fx = [];
      const p0Hue = 210; // blue
      const p1Hue = 0;   // red

      const padding = 0.06;
      const gridArea = 1 - 2 * padding;
      const cellSize = gridArea / state.size;

      // Piece placement: burst at placed cell
      if (state.moveCount > prev.moveCount && state.lastMove) {
        const { row, col, player, captures } = state.lastMove;
        const cx = padding + (col + 0.5) * cellSize;
        const cy = padding + (row + 0.5) * cellSize;
        const hue = player === 0 ? p0Hue : p1Hue;

        fx.push({ type: 'burst', x: cx, y: cy, hue, count: 8, intensity: 0.4 });

        // Captures: burst on each flipped cell + shake proportional to captures
        const numCaptures = captures ? captures.length : 0;
        if (numCaptures > 0) {
          for (const [cr, cc] of captures) {
            const capX = padding + (cc + 0.5) * cellSize;
            const capY = padding + (cr + 0.5) * cellSize;
            fx.push({ type: 'burst', x: capX, y: capY, hue, count: 4, intensity: 0.3 });
          }
          fx.push({ type: 'shake', trauma: Math.min(0.1 + numCaptures * 0.05, 0.4) });
          fx.push({ type: 'float', x: cx, y: cy - 0.04, text: `+${numCaptures}`, hue });
        }

        // Big capture (4+): ring effect
        if (numCaptures >= 4) {
          fx.push({ type: 'ring', x: cx, y: cy, radius: 0.1, hue, duration: 0.4 });
        }
      }

      // Game end
      if (state.ended && !prev.ended) {
        fx.push({ type: 'flash', intensity: 0.3 });
        fx.push({ type: 'shake', trauma: 0.3 });
        if (state.winner !== null) {
          const winHue = state.winner === 0 ? p0Hue : p1Hue;
          fx.push({ type: 'burst', x: 0.5, y: 0.5, hue: winHue, count: 35, intensity: 1.0, spread: 0.8 });
          fx.push({ type: 'float', x: 0.5, y: 0.35, text: state.winner === 0 ? 'BLUE WINS' : 'RED WINS', hue: winHue, celebration: true, scale: 1.5 });
        } else {
          fx.push({ type: 'float', x: 0.5, y: 0.35, text: 'DRAW', hue: 60, scale: 1.5 });
        }
      }

      return fx;
    },

    audio(prev, state) {
      const events = [];

      // Piece placement — note based on move count
      if (state.moveCount > prev.moveCount) {
        events.push({ type: 'tap' });
        events.push({ type: 'note', index: Math.min(19, state.moveCount % 20), gain: 0.15 });

        // Capture sweep — ascending notes for captures
        const numCaptures = state.lastCaptures ? state.lastCaptures.length : 0;
        if (numCaptures > 0) {
          events.push({ type: 'note', index: Math.min(19, numCaptures + 5), generation: 1, gain: 0.12 });
        }
        // Big capture chord (4+)
        if (numCaptures >= 4) {
          const base = Math.min(14, numCaptures);
          events.push({ type: 'chord', notes: [base, base + 2, base + 5], delay: 0.05, gain: 0.1 });
        }
      }

      // Game end
      if (state.ended && !prev.ended) {
        if (state.winner !== null) {
          events.push({ type: 'clear' });
        } else {
          events.push({ type: 'gameover' });
        }
      }

      return events;
    },

    score(state) {
      return {
        primary: state.scores[0] - state.scores[1],
        label: 'Lead',
        unit: '',
        players: state.scores.slice(),
      };
    },

    status(state) {
      if (state.ended) {
        return {
          ended: true,
          reason: state.endReason,
          winner: state.winner,
        };
      }
      return 'playing';
    },

    bot(difficulty, rng) {
      // Smooth scaling: all features present at all difficulties, weighted by difficulty
      return (state, dt) => {
        const noInput = { thumb: null, gyro: null, taps: [], keys: {} };

        if (state.ended) return noInput;

        const validMoves = getValidMoves(state.grid, state.currentPlayer, state.size);
        if (validMoves.length === 0) return noInput;

        let chosen;

        // Score all moves with features weighted by difficulty
        const scored = validMoves.map(m => {
          // Capture value: always present, weight increases with difficulty
          const captureVal = m.captures.length * (1 + difficulty * 2);

          // Positional value: kicks in proportionally with difficulty
          const posVal = positionalValue(m.row, m.col, state.size) * difficulty;

          // Look-ahead: only at high difficulty (expensive), scales smoothly
          let lookaheadVal = 0;
          if (difficulty > 0.5) {
            const lookaheadStrength = (difficulty - 0.5) * 2; // 0 to 1 over d=0.5..1.0
            const simGrid = state.grid.map(row => row.slice());
            simGrid[m.row][m.col] = state.currentPlayer;
            for (const [cr, cc] of m.captures) {
              simGrid[cr][cc] = state.currentPlayer;
            }
            const oppMoves = getValidMoves(simGrid, 1 - state.currentPlayer, state.size);
            let oppBestCaptures = 0;
            for (const om of oppMoves) {
              if (om.captures.length > oppBestCaptures) oppBestCaptures = om.captures.length;
            }
            lookaheadVal = -(oppBestCaptures * 2 + oppMoves.length * 0.1) * lookaheadStrength;
          }

          // Noise: quadratic, large at low difficulty
          const noise = rng.float(-1, 1) * (1 - difficulty) * (1 - difficulty) * 3;

          return { move: m, value: captureVal + posVal + lookaheadVal + noise };
        });
        scored.sort((a, b) => b.value - a.value);
        chosen = scored[0].move;

        // Convert grid cell back to normalized tap coordinates
        const padding = 0.06;
        const gridArea = 1 - 2 * padding;
        const cellSize = gridArea / state.size;
        const tapX = padding + (chosen.col + 0.5) * cellSize;
        const tapY = padding + (chosen.row + 0.5) * cellSize;

        return {
          thumb: null,
          gyro: null,
          taps: [{ x: tapX, y: tapY }],
          keys: {},
        };
      };
    },

    configure() {
      return [
        { key: 'gridSize', label: 'Grid Size', type: 'int', min: 4, max: 12, default: 8, step: 2 },
        { key: 'turnTime', label: 'Turn Time (s)', type: 'float', min: 0, max: 60, default: 30, step: 5 },
      ];
    },
  };
}
