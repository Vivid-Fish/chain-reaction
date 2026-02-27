// platform/replay.js — Replay a recorded session headlessly
// Usage: node platform/replay.js <session-file-or-url>
// Deterministically replays recorded inputs and prints results

import { createRNG } from './rng.js';
import { expandInput, emptyInput } from './core.js';
import { readFileSync } from 'fs';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node platform/replay.js <session.json | session-id>');
  console.error('  node platform/replay.js data/sessions/abc-123.json');
  console.error('  node platform/replay.js abc-123  (fetches from /api/session/abc-123)');
  process.exit(1);
}

let session;
if (arg.endsWith('.json') || arg.includes('/')) {
  session = JSON.parse(readFileSync(arg, 'utf-8'));
} else {
  // Assume it's a session ID, try to load from data dir
  const path = `data/sessions/${arg}.json`;
  session = JSON.parse(readFileSync(path, 'utf-8'));
}

console.log(`Replaying: ${session.gameId} (seed=${session.seed}, ${session.inputs.length} input frames)`);
console.log(`Original score: ${session.score?.primary} ${session.score?.unit || ''}`);
console.log();

// Load game dynamically
const gameMod = await import(`../games/${session.gameId}/game.js`);
const g = gameMod.createGame(session.config || {});
const rng = createRNG(session.seed);
const dt = 1 / (g.meta.tickRate || 60);

let state = g.init(session.config || {});
let tick = 0;

for (tick = 0; tick < session.inputs.length; tick++) {
  const compact = session.inputs[tick];
  const input = Object.keys(compact).length > 0 ? expandInput(compact) : emptyInput();
  state = g.step(state, input, dt, rng);

  const s = g.status(state);
  if (s !== 'playing') {
    console.log(`Game ended at tick ${tick + 1} (${((tick + 1) * dt).toFixed(1)}s): ${s.reason}`);
    break;
  }
}

const score = g.score(state);
console.log(`Replay score: ${score.primary} ${score.unit || ''}`);
console.log(`Ticks: ${tick + 1}, Time: ${((tick + 1) * dt).toFixed(1)}s`);

// Verify determinism
if (session.score && score.primary !== session.score.primary) {
  console.log(`\n⚠ SCORE MISMATCH: original=${session.score.primary} replay=${score.primary}`);
  console.log('  This means the game is not deterministic or inputs were lost.');
} else if (session.score) {
  console.log(`\n✓ Deterministic replay verified (scores match)`);
}

// Print some stats about the input
const thumbFrames = session.inputs.filter(i => i.t).length;
const tapFrames = session.inputs.filter(i => i.p).length;
const emptyFrames = session.inputs.filter(i => Object.keys(i).length === 0).length;
console.log(`\nInput stats:`);
console.log(`  Thumb active: ${thumbFrames}/${session.inputs.length} frames (${(thumbFrames/session.inputs.length*100).toFixed(0)}%)`);
console.log(`  Taps: ${tapFrames} frames with taps`);
console.log(`  Empty: ${emptyFrames}/${session.inputs.length} frames (${(emptyFrames/session.inputs.length*100).toFixed(0)}%)`);
