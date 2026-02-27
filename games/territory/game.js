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
      // Background
      draw.clear(0.05, 0.07, 0.05);

      const padding = 0.06;
      const gridArea = 1 - 2 * padding;
      const cellSize = gridArea / state.size;

      // Player colors
      const colors = ['#4488ff', '#ff4444'];
      const colorsDim = ['rgba(68, 136, 255, 0.3)', 'rgba(255, 68, 68, 0.3)'];
      const colorsGlow = ['rgba(68, 136, 255, 0.5)', 'rgba(255, 68, 68, 0.5)'];

      // Draw grid background
      draw.rect(padding, padding, gridArea, gridArea, {
        fill: 'rgba(0, 0, 0, 0.3)',
        radius: 0.01,
      });

      // Draw grid lines
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

      // Get valid moves for current player (for indicators)
      const validMoves = state.ended ? [] : getValidMoves(state.grid, state.currentPlayer, state.size);
      const validSet = new Set(validMoves.map(m => `${m.row},${m.col}`));

      // Draw cells
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
              draw.circle(cx, cy, pieceRadius * 1.3, {
                fill: colorsGlow[player],
                opacity: state.captureFlash / 0.4,
              });
            }

            // Piece
            draw.circle(cx, cy, pieceRadius, {
              fill: colors[player],
              glow: 0.005,
              glowColor: colorsGlow[player],
            });
          } else if (validSet.has(`${r},${c}`)) {
            // Valid move indicator
            draw.circle(cx, cy, pieceRadius * 0.3, {
              fill: colorsDim[state.currentPlayer],
            });
          }
        }
      }

      // Score display (top area above grid would need more space; use bottom)
      const scoreY = padding + gridArea + 0.035;

      // Player 0 (blue) score — left
      draw.circle(0.12, scoreY, 0.015, { fill: colors[0] });
      draw.text(`${state.scores[0]}`, 0.16, scoreY, {
        size: 0.03,
        align: 'left',
        color: colors[0],
      });

      // Player 1 (red) score — right
      draw.circle(0.88, scoreY, 0.015, { fill: colors[1] });
      draw.text(`${state.scores[1]}`, 0.84, scoreY, {
        size: 0.03,
        align: 'right',
        color: colors[1],
      });

      // Turn indicator
      if (!state.ended) {
        const turnLabel = state.currentPlayer === 0 ? 'Blue' : 'Red';
        draw.text(`${turnLabel}'s Turn`, 0.5, scoreY, {
          size: 0.028,
          align: 'center',
          color: colors[state.currentPlayer],
        });

        // Turn timer (if enabled)
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

        draw.text(resultText, 0.5, 0.42, {
          size: 0.06,
          align: 'center',
          color: state.winner !== null ? colors[state.winner] : '#ffffff',
        });

        draw.text(`${state.scores[0]} - ${state.scores[1]}`, 0.5, 0.52, {
          size: 0.04,
          align: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
        });

        const reasonText = state.endReason === 'full' ? 'Board Full' : 'No Moves Left';
        draw.text(reasonText, 0.5, 0.60, {
          size: 0.025,
          align: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
        });
      }
    },

    audio(prev, state) {
      const events = [];

      // Piece placement tone
      if (state.moveCount > prev.moveCount) {
        const player = state.lastMove ? state.lastMove.player : 0;
        const freq = player === 0 ? 440 : 330; // blue higher, red lower
        events.push({
          type: 'tone',
          freq,
          duration: 0.1,
          gain: 0.2,
          wave: 'sine',
        });

        // Capture sweep — pitch rises with number of captures
        const numCaptures = state.lastCaptures ? state.lastCaptures.length : 0;
        if (numCaptures > 0) {
          events.push({
            type: 'sweep',
            freqStart: 300,
            freqEnd: 300 + numCaptures * 80,
            duration: 0.15 + numCaptures * 0.03,
            gain: 0.15,
            wave: 'triangle',
          });
        }
      }

      // Game end drum
      if (state.ended && !prev.ended) {
        events.push({
          type: 'drum',
          freq: 60,
          noiseGain: 0.4,
          toneGain: 0.6,
          duration: 0.3,
        });
        // Victory chord
        if (state.winner !== null) {
          const baseFreq = state.winner === 0 ? 261 : 220;
          events.push({
            type: 'chord',
            freqs: [baseFreq, baseFreq * 1.25, baseFreq * 1.5],
            duration: 0.6,
            gain: 0.2,
            wave: 'triangle',
          });
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
