// Quick headless test: run dodge game with bot ladder
import { runHeadless } from './core.js';
import { botLadder } from './eval/runner.js';
import { createGame } from '../games/dodge/game.js';

// Wrap the game module to match the expected interface
const game = {
  createGame: (config) => createGame(config),
};

console.log('=== Single run test ===');
const result = runHeadless(game, { seed: 42, botDifficulty: 0.5, maxTicks: 10000 });
console.log(`Score: ${result.score.primary}m, Time: ${result.time.toFixed(1)}s, Reason: ${result.endReason}`);

console.log('\n=== Bot ladder ===');
const ladder = botLadder(game, {
  difficulties: [0, 0.25, 0.5, 0.75, 1.0],
  runsPerLevel: 30,
  maxTicks: 10000,
});

console.log(ladder.summary);
console.log(`\nSkill discrimination: ${ladder.skillDiscrimination.toFixed(2)}x`);
