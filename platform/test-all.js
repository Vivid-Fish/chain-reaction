// platform/test-all.js — Validate all games through headless runner
import { runHeadless } from './core.js';

const games = [
  { name: 'dodge', path: '../games/dodge/game.js' },
  { name: 'rhythm', path: '../games/rhythm/game.js' },
  { name: 'territory', path: '../games/territory/game.js' },
  { name: 'stack', path: '../games/stack/game.js' },
  { name: 'snake', path: '../games/snake/game.js' },
  { name: 'breakout', path: '../games/breakout/game.js' },
  { name: 'aim', path: '../games/aim/game.js' },
  { name: 'balance', path: '../games/balance/game.js' },
  { name: 'pong', path: '../games/pong/game.js' },
  { name: 'runner', path: '../games/runner/game.js' },
  { name: 'orbit', path: '../games/orbit/game.js' },
  { name: 'meteor', path: '../games/meteor/game.js' },
];

console.log('=== Game Lab — Headless Validation ===\n');

let passed = 0;
let failed = 0;

for (const g of games) {
  try {
    const mod = await import(g.path);
    const game = { createGame: mod.createGame };

    // Verify interface
    const instance = game.createGame({});
    const required = ['meta', 'init', 'step', 'render', 'score', 'status'];
    const missing = required.filter(k => typeof instance[k] !== 'function' && typeof instance[k] !== 'object');
    if (missing.length > 0) {
      throw new Error(`Missing interface: ${missing.join(', ')}`);
    }

    // Run headless
    const result = runHeadless(game, { seed: 42, botDifficulty: 0.5, maxTicks: 3000 });

    const scoreStr = typeof result.score.primary === 'number' ? result.score.primary : '?';
    const label = result.score.label || 'Score';
    const unit = result.score.unit || '';

    console.log(`  ✓ ${g.name.padEnd(12)} ${label}: ${String(scoreStr).padStart(6)}${unit}  time: ${result.time.toFixed(1).padStart(5)}s  end: ${result.endReason}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${g.name.padEnd(12)} ERROR: ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${games.length} games`);
if (failed > 0) process.exit(1);
