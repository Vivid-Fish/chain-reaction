// platform/eval/runner.js — Game evaluation library
// Game-agnostic: works with any module that implements the GDI
// (createGame → { meta, init, step, render, audio, score, status, bot, configure })
//
// Exports:
//   runOne        — single headless game
//   runMany       — N games at one difficulty
//   botLadder     — sweep across difficulty levels
//   sweep         — cartesian parameter grid search
//   runPvP        — two bots play each other
//   checkDeterminism — verify replay produces identical results
//   quality       — compute quality metrics over a batch of results
//   discoverGames — find all game modules in games/
//   loadGame      — dynamic import a game module
//   stats         — { mean, median, stddev, percentile, cv, countBy }

import { runHeadless, resolveParams, emptyInput } from '../core.js';
import { createRNG } from '../rng.js';
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Game discovery
// ---------------------------------------------------------------------------

export function discoverGames() {
  const gamesDir = join(ROOT, 'games');
  if (!existsSync(gamesDir)) return [];
  return readdirSync(gamesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(gamesDir, d.name, 'game.js')))
    .map(d => d.name)
    .sort();
}

export async function loadGame(name) {
  const path = join(ROOT, 'games', name, 'game.js');
  const mod = await import(path);
  return { createGame: mod.createGame };
}

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
// Bot ladder — run at multiple difficulty levels, measure skill discrimination
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
      scores: summarize(scores),
      times: summarize(times),
      endReasons: countBy(results, r => r.endReason),
    });
  }

  // Skill discrimination: ratio of highest to lowest difficulty scores
  const loScore = ladder[0].scores.mean;
  const hiScore = ladder[ladder.length - 1].scores.mean;
  const skillDiscrimination = loScore > 0 ? hiScore / loScore : Infinity;

  return { ladder, skillDiscrimination };
}

// ---------------------------------------------------------------------------
// Parameter sweep — run games for each parameter combination
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
      scores: summarize(scores),
      times: { mean: mean(runs.map(r => r.time)) },
      endedPct: runs.filter(r => r.endReason !== 'timeout').length / runs.length,
    });
  }

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
    throw new Error(`Game does not support PvP (meta.players = ${g.meta.players || 1})`);
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
// Determinism check — run same seed twice, verify identical results
// ---------------------------------------------------------------------------

export function checkDeterminism(game, { seeds = [1, 42, 100, 777, 9999], params = {}, botDifficulty = 0.5, maxTicks = 10000 } = {}) {
  const failures = [];

  for (const seed of seeds) {
    const r1 = runOne(game, { seed, params, botDifficulty, maxTicks });
    const r2 = runOne(game, { seed, params, botDifficulty, maxTicks });

    if (r1.score.primary !== r2.score.primary) {
      failures.push({ seed, field: 'score', a: r1.score.primary, b: r2.score.primary });
    }
    if (r1.ticks !== r2.ticks) {
      failures.push({ seed, field: 'ticks', a: r1.ticks, b: r2.ticks });
    }
    if (r1.endReason !== r2.endReason) {
      failures.push({ seed, field: 'endReason', a: r1.endReason, b: r2.endReason });
    }
  }

  return {
    deterministic: failures.length === 0,
    seeds: seeds.length,
    failures,
  };
}

// ---------------------------------------------------------------------------
// Quality metrics — computed over a batch of run results
// ---------------------------------------------------------------------------

export function quality(results) {
  const scores = results.map(r => r.score.primary);
  const times = results.map(r => r.time);
  const ended = results.filter(r => r.endReason !== 'timeout');

  return {
    n: results.length,
    scores: summarize(scores),
    times: summarize(times),
    // Coefficient of variation — 0.3–0.6 is good (variety without chaos)
    scoreCV: cv(scores),
    timeCV: cv(times),
    // Mortality rate — fraction of games that end naturally (target: >0.9)
    mortalityRate: ended.length / results.length,
    // End reason distribution
    endReasons: countBy(results, r => r.endReason),
    // Score concentration — what % of games fall within ±1 stddev
    scoreConcentration: concentration(scores),
  };
}

// ---------------------------------------------------------------------------
// Validate game interface
// ---------------------------------------------------------------------------

export function validateInterface(game) {
  const issues = [];
  let g;
  try {
    g = game.createGame({});
  } catch (e) {
    return { valid: false, issues: [`createGame({}) threw: ${e.message}`] };
  }

  const required = ['meta', 'init', 'step', 'score', 'status'];
  for (const key of required) {
    if (typeof g[key] !== 'function' && typeof g[key] !== 'object') {
      issues.push(`missing ${key}`);
    }
  }

  if (g.meta) {
    if (!g.meta.id) issues.push('meta.id missing');
    if (!g.meta.name) issues.push('meta.name missing');
    if (!g.meta.tickRate) issues.push('meta.tickRate missing');
  }

  if (typeof g.bot !== 'function') {
    issues.push('no bot (headless eval will use empty input)');
  }

  if (typeof g.render !== 'function') {
    issues.push('no render (browser play will fail)');
  }

  if (typeof g.configure !== 'function') {
    issues.push('no configure (no tunable parameters)');
  }

  return { valid: issues.filter(i => !i.startsWith('no ')).length === 0, issues };
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export function mean(arr) {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}

export function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function cv(arr) {
  const m = mean(arr);
  return m === 0 ? 0 : stddev(arr) / Math.abs(m);
}

export function countBy(arr, fn) {
  const counts = {};
  for (const item of arr) {
    const key = typeof fn === 'function' ? fn(item) : item[fn];
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function concentration(arr) {
  if (arr.length < 2) return 1;
  const m = mean(arr);
  const sd = stddev(arr);
  if (sd === 0) return 1;
  return arr.filter(x => Math.abs(x - m) <= sd).length / arr.length;
}

function summarize(arr) {
  return {
    mean: mean(arr),
    median: median(arr),
    min: Math.min(...arr),
    max: Math.max(...arr),
    stddev: stddev(arr),
    p10: percentile(arr, 10),
    p90: percentile(arr, 90),
  };
}

export function cartesian(arrays) {
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
