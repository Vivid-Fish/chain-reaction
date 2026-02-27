#!/usr/bin/env node
// platform/test-all.js — Validate all games: interface, headless run, determinism
// Quick smoke test — use eval/eval.js for deeper analysis

import { discoverGames, loadGame, runOne, checkDeterminism, validateInterface } from './eval/runner.js';

const games = discoverGames();

console.log('=== Game Lab — Validation ===\n');

let passed = 0;
let failed = 0;
const startTime = performance.now();

for (const name of games) {
  try {
    const game = await loadGame(name);
    const iface = validateInterface(game);

    if (!iface.valid) {
      throw new Error(`Interface: ${iface.issues.join(', ')}`);
    }

    // Headless run
    const result = runOne(game, { seed: 42, botDifficulty: 0.5, maxTicks: 3000 });
    const scoreStr = typeof result.score.primary === 'number' ? result.score.primary : '?';
    const label = result.score.label || 'Score';
    const unit = result.score.unit || '';

    // Determinism check (2 seeds, fast)
    const det = checkDeterminism(game, { seeds: [42, 100], maxTicks: 3000 });
    const detStr = det.deterministic ? 'det=OK' : `det=FAIL(${det.failures.length})`;

    console.log(`  ✓ ${name.padEnd(12)} ${label}: ${String(scoreStr).padStart(6)}${unit}  time: ${result.time.toFixed(1).padStart(5)}s  end: ${result.endReason.padEnd(10)}  ${detStr}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name.padEnd(12)} ERROR: ${e.message}`);
    failed++;
  }
}

const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
console.log(`\n${passed} passed, ${failed} failed out of ${games.length} games (${elapsed}s)`);
if (failed > 0) process.exit(1);
