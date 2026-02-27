// platform/eval/runner.js — Headless game runner for evaluation
// Runs N games with a bot at a given difficulty, collects results

import { runHeadless, emptyInput } from '../core.js';
import { createRNG } from '../rng.js';

// ---------------------------------------------------------------------------
// Run a single game with a bot
// ---------------------------------------------------------------------------
export function runOne(game, { seed = 1, params = {}, botDifficulty = 0.5, maxTicks = 60000 } = {}) {
  return runHeadless(game, { seed, params, botDifficulty, maxTicks });
}

// ---------------------------------------------------------------------------
// Run N games, collect results
// ---------------------------------------------------------------------------
export function runMany(game, { n = 100, params = {}, botDifficulty = 0.5, maxTicks = 60000, baseSeed = 1 } = {}) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(runOne(game, {
      seed: baseSeed + i,
      params,
      botDifficulty,
      maxTicks,
    }));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Bot ladder — run at multiple difficulty levels
// ---------------------------------------------------------------------------
export function botLadder(game, {
  difficulties = [0, 0.25, 0.5, 0.75, 1.0],
  runsPerLevel = 50,
  params = {},
  maxTicks = 60000,
  baseSeed = 1,
} = {}) {
  const ladder = [];

  for (const diff of difficulties) {
    const results = runMany(game, {
      n: runsPerLevel,
      params,
      botDifficulty: diff,
      maxTicks,
      baseSeed,
    });

    const scores = results.map(r => r.score.primary);
    const times = results.map(r => r.time);
    const ended = results.filter(r => r.endReason !== 'timeout');

    ladder.push({
      difficulty: diff,
      runs: results.length,
      ended: ended.length,
      scores: {
        mean: mean(scores),
        median: median(scores),
        min: Math.min(...scores),
        max: Math.max(...scores),
        stddev: stddev(scores),
      },
      times: {
        mean: mean(times),
        median: median(times),
        min: Math.min(...times),
        max: Math.max(...times),
        stddev: stddev(times),
      },
      endReasons: countBy(results, r => r.endReason),
    });
  }

  // Skill discrimination: ratio of highest to lowest difficulty scores
  const loScore = ladder[0].scores.mean;
  const hiScore = ladder[ladder.length - 1].scores.mean;
  const skillDiscrimination = loScore > 0 ? hiScore / loScore : Infinity;

  return {
    ladder,
    skillDiscrimination,
    summary: ladder.map(l =>
      `d=${l.difficulty.toFixed(2)}: score=${l.scores.mean.toFixed(1)} ± ${l.scores.stddev.toFixed(1)}, ` +
      `time=${l.times.mean.toFixed(1)}s, ended=${l.ended}/${l.runs}`
    ).join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Parameter sweep — run bot ladder for each parameter combination
// ---------------------------------------------------------------------------
export function sweep(game, {
  paramGrid,
  botDifficulty = 0.5,
  runsPerConfig = 30,
  maxTicks = 60000,
  baseSeed = 1,
} = {}) {
  const keys = Object.keys(paramGrid);
  const combos = cartesian(keys.map(k => paramGrid[k].map(v => [k, v])));
  const results = [];

  for (const combo of combos) {
    const params = Object.fromEntries(combo);
    const runs = runMany(game, {
      n: runsPerConfig,
      params,
      botDifficulty,
      maxTicks,
      baseSeed,
    });

    const scores = runs.map(r => r.score.primary);
    results.push({
      params,
      scores: {
        mean: mean(scores),
        median: median(scores),
        stddev: stddev(scores),
      },
      times: {
        mean: mean(runs.map(r => r.time)),
      },
      endedPct: runs.filter(r => r.endReason !== 'timeout').length / runs.length,
    });
  }

  // Sort by mean score descending
  results.sort((a, b) => b.scores.mean - a.scores.mean);
  return results;
}

// ---------------------------------------------------------------------------
// PvP evaluation — two bots play against each other
// ---------------------------------------------------------------------------
export function runPvP(game, {
  seed = 1,
  params = {},
  difficulty1 = 0.5,
  difficulty2 = 0.5,
  maxTicks = 60000,
} = {}) {
  const rng = createRNG(seed);
  const config = { ...params };
  const g = game.createGame(config);

  if (!g.meta.players || g.meta.players < 2) {
    throw new Error('Game does not support PvP (meta.players < 2)');
  }

  let state = g.init(config);
  const dt = 1 / (g.meta.tickRate || 60);

  const bot1 = g.bot ? g.bot(difficulty1, rng.fork('bot1')) : null;
  const bot2 = g.bot ? g.bot(difficulty2, rng.fork('bot2')) : null;

  let tick = 0;
  while (tick < maxTicks) {
    const input1 = bot1 ? bot1(state, dt) : emptyInput();
    const input2 = bot2 ? bot2(state, dt) : emptyInput();
    state = g.step(state, [input1, input2], dt, rng);
    tick++;

    const s = g.status(state);
    if (s !== 'playing') {
      return {
        score: g.score(state),
        ticks: tick,
        time: tick * dt,
        endReason: s.reason || 'ended',
      };
    }
  }

  return {
    score: g.score(state),
    ticks: tick,
    time: tick * dt,
    endReason: 'timeout',
  };
}

// ---------------------------------------------------------------------------
// Stat helpers
// ---------------------------------------------------------------------------
function mean(arr) {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}

function countBy(arr, fn) {
  const counts = {};
  for (const item of arr) {
    const key = fn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function cartesian(arrays) {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restCombos = cartesian(rest);
  const result = [];
  for (const item of first) {
    for (const combo of restCombos) {
      result.push([item, ...combo]);
    }
  }
  return result;
}
