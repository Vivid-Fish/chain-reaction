// Quick headless test: run dodge game with bot ladder
import { runOne, botLadder, loadGame } from './eval/runner.js';

const game = await loadGame('dodge');

console.log('=== Single run test ===');
const result = runOne(game, { seed: 42, botDifficulty: 0.5, maxTicks: 10000 });
console.log(`Score: ${result.score.primary}m, Time: ${result.time.toFixed(1)}s, Reason: ${result.endReason}`);

console.log('\n=== Bot ladder ===');
const ladder = botLadder(game, {
  difficulties: [0, 0.25, 0.5, 0.75, 1.0],
  runsPerLevel: 30,
  maxTicks: 10000,
});

for (const l of ladder.ladder) {
  console.log(`d=${l.difficulty.toFixed(2)}: score=${l.scores.mean.toFixed(1)} ± ${l.scores.stddev.toFixed(1)}, time=${l.times.mean.toFixed(1)}s, ended=${l.ended}/${l.runs}`);
}
console.log(`\nSkill discrimination: ${ladder.skillDiscrimination.toFixed(2)}x`);
