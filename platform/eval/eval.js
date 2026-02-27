#!/usr/bin/env node
// platform/eval/eval.js — Unified CLI for game evaluation
//
// Usage:
//   node eval.js                          # validate all games
//   node eval.js --game dodge             # validate one game
//   node eval.js --game dodge --ladder    # bot ladder (skill discrimination)
//   node eval.js --game dodge --quality   # quality metrics (50 runs)
//   node eval.js --game dodge --determinism  # replay determinism check
//   node eval.js --game pong --pvp        # PvP bot matchup
//   node eval.js --all                    # full eval of all games
//   node eval.js --sweep --game dodge --params '{"speed":[0.2,0.3,0.4]}'
//   node eval.js --json                   # machine-readable output
//   node eval.js --runs 200              # override default run count

import {
  discoverGames, loadGame, runOne, runMany, botLadder, sweep,
  runPvP, checkDeterminism, quality, validateInterface,
  mean, stddev,
} from './runner.js';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      flags[key] = args[++i];
    } else {
      flags[key] = true;
    }
  }
}

const jsonOutput = !!flags.json;
const runs = parseInt(flags.runs || '50');
const maxTicks = parseInt(flags.ticks || '10000');
const gameName = flags.game;

function log(...args) {
  if (!jsonOutput) console.log(...args);
}

function pad(s, n) { return String(s).padEnd(n); }
function rpad(s, n) { return String(s).padStart(n); }

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmtNum(n, decimals = 1) {
  if (typeof n !== 'number' || isNaN(n)) return '?';
  if (!isFinite(n)) return 'Inf';
  return n.toFixed(decimals);
}

function fmtBar(val, max, width = 20) {
  const filled = Math.round((val / max) * width);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, width - filled));
}

function printTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => String(r[i]).length))
  );
  log(headers.map((h, i) => pad(h, widths[i])).join('  '));
  log(widths.map(w => '─'.repeat(w)).join('──'));
  for (const row of rows) {
    log(row.map((c, i) => pad(String(c), widths[i])).join('  '));
  }
}

// ---------------------------------------------------------------------------
// Evaluate a single game
// ---------------------------------------------------------------------------

async function evalGame(name, mode) {
  const game = await loadGame(name);
  const g = game.createGame({});
  const results = {};

  // Always validate interface
  const iface = validateInterface(game);
  results.interface = iface;

  if (mode === 'validate' || mode === 'all') {
    log(`\n${g.meta.name} (${g.meta.id})`);
    log(`  players: ${g.meta.players}  tick: ${g.meta.tickRate}Hz  input: ${(g.meta.inputChannels || []).join(', ')}`);
    if (iface.issues.length > 0) {
      log(`  issues: ${iface.issues.join(', ')}`);
    }

    // Quick validation run
    try {
      const r = runOne(game, { seed: 42, botDifficulty: 0.5, maxTicks: 3000 });
      log(`  quick run: score=${fmtNum(r.score.primary)} (${r.score.label || 'Score'} ${r.score.unit || ''})  time=${fmtNum(r.time)}s  end=${r.endReason}`);
      results.quickRun = r;
    } catch (e) {
      log(`  quick run: ERROR — ${e.message}`);
      results.error = e.message;
    }
  }

  if (mode === 'determinism' || mode === 'all') {
    log(`  determinism:`);
    const det = checkDeterminism(game, { maxTicks });
    if (det.deterministic) {
      log(`    PASS — ${det.seeds} seeds identical`);
    } else {
      log(`    FAIL — ${det.failures.length} divergences:`);
      for (const f of det.failures) {
        log(`      seed ${f.seed}: ${f.field} = ${f.a} vs ${f.b}`);
      }
    }
    results.determinism = det;
  }

  if (mode === 'quality' || mode === 'all') {
    log(`  quality (${runs} runs @ d=0.5):`);
    const batch = runMany(game, { n: runs, botDifficulty: 0.5, maxTicks });
    const q = quality(batch);
    log(`    score: ${fmtNum(q.scores.mean)} ± ${fmtNum(q.scores.stddev)}  [${fmtNum(q.scores.p10)}..${fmtNum(q.scores.p90)}]`);
    log(`    time:  ${fmtNum(q.times.mean)}s ± ${fmtNum(q.times.stddev)}s`);
    log(`    score CV: ${fmtNum(q.scoreCV, 2)}  time CV: ${fmtNum(q.timeCV, 2)}`);
    log(`    mortality: ${fmtNum(q.mortalityRate * 100, 0)}%  concentration: ${fmtNum(q.scoreConcentration * 100, 0)}%`);
    log(`    end reasons: ${Object.entries(q.endReasons).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    results.quality = q;
  }

  if (mode === 'ladder' || mode === 'all') {
    log(`  bot ladder (${runs} runs/level):`);
    const lad = botLadder(game, { runsPerLevel: runs, maxTicks });
    const maxScore = Math.max(...lad.ladder.map(l => l.scores.mean));
    for (const l of lad.ladder) {
      const bar = fmtBar(l.scores.mean, maxScore);
      log(`    d=${fmtNum(l.difficulty, 2)}  ${bar}  score=${rpad(fmtNum(l.scores.mean), 7)} ± ${rpad(fmtNum(l.scores.stddev), 6)}  time=${fmtNum(l.times.mean)}s  end=${l.ended}/${l.runs}`);
    }
    log(`    skill discrimination: ${fmtNum(lad.skillDiscrimination, 2)}x`);

    // Flag issues
    if (lad.skillDiscrimination < 1.5) {
      log(`    ⚠ Low discrimination — bot difficulty has little effect on score`);
    } else if (lad.skillDiscrimination > 20) {
      log(`    ⚠ Very high discrimination — might indicate scoring runaway`);
    }
    results.ladder = lad;
  }

  if (mode === 'pvp') {
    if (g.meta.players < 2) {
      log(`  pvp: skipped (${g.meta.players}-player game)`);
    } else {
      log(`  pvp matchups (${runs} runs each):`);
      const matchups = [
        [0.0, 1.0],
        [0.25, 0.75],
        [0.5, 0.5],
        [0.75, 0.25],
        [1.0, 0.0],
      ];
      const pvpResults = [];
      for (const [d1, d2] of matchups) {
        const batch = [];
        for (let i = 0; i < runs; i++) {
          batch.push(runPvP(game, { seed: i + 1, difficulty1: d1, difficulty2: d2, maxTicks }));
        }
        const scores1 = batch.map(r => r.score.primary);
        const times = batch.map(r => r.time);
        const entry = {
          d1, d2,
          meanScore: mean(scores1),
          meanTime: mean(times),
        };
        pvpResults.push(entry);
        log(`    d1=${fmtNum(d1, 2)} vs d2=${fmtNum(d2, 2)}: score=${fmtNum(entry.meanScore)}  time=${fmtNum(entry.meanTime)}s`);
      }
      results.pvp = pvpResults;
    }
  }

  if (mode === 'sweep') {
    const paramGridStr = flags.params;
    if (!paramGridStr) {
      // Auto-generate sweep from configure()
      if (typeof g.configure === 'function') {
        const configDefs = g.configure();
        const paramGrid = {};
        for (const def of configDefs) {
          if (def.type === 'float' || def.type === 'int') {
            const range = def.max - def.min;
            const step = def.step || range / 4;
            const values = [];
            for (let v = def.min; v <= def.max + step * 0.01; v += step) {
              values.push(Math.round(v * 10000) / 10000);
            }
            // Limit to 5 values per param to avoid combinatorial explosion
            if (values.length > 5) {
              const pick = [values[0], values[Math.floor(values.length * 0.25)], values[Math.floor(values.length * 0.5)], values[Math.floor(values.length * 0.75)], values[values.length - 1]];
              paramGrid[def.key] = [...new Set(pick)];
            } else {
              paramGrid[def.key] = values;
            }
          }
        }
        log(`  sweep (auto from configure(), ${flags.runs || 30} runs/config):`);
        const sweepResults = sweep(game, {
          paramGrid,
          runsPerConfig: parseInt(flags.runs || '30'),
          maxTicks,
        });
        for (const r of sweepResults.slice(0, 10)) {
          const paramStr = Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join(' ');
          log(`    ${paramStr}  score=${fmtNum(r.scores.mean)} ± ${fmtNum(r.scores.stddev)}  end=${fmtNum(r.endedPct * 100, 0)}%`);
        }
        if (sweepResults.length > 10) {
          log(`    ... ${sweepResults.length - 10} more configs`);
        }
        results.sweep = sweepResults;
      } else {
        log(`  sweep: no configure() and no --params provided`);
      }
    } else {
      const paramGrid = JSON.parse(paramGridStr);
      log(`  sweep (${Object.keys(paramGrid).length} params, ${flags.runs || 30} runs/config):`);
      const sweepResults = sweep(game, {
        paramGrid,
        runsPerConfig: parseInt(flags.runs || '30'),
        maxTicks,
      });
      for (const r of sweepResults) {
        const paramStr = Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join(' ');
        log(`    ${paramStr}  score=${fmtNum(r.scores.mean)} ± ${fmtNum(r.scores.stddev)}  end=${fmtNum(r.endedPct * 100, 0)}%`);
      }
      results.sweep = sweepResults;
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const allGames = discoverGames();
  const startTime = performance.now();

  if (allGames.length === 0) {
    console.error('No games found in games/ directory');
    process.exit(1);
  }

  // Determine mode
  let mode = 'validate';
  if (flags.all) mode = 'all';
  else if (flags.ladder) mode = 'ladder';
  else if (flags.quality) mode = 'quality';
  else if (flags.determinism) mode = 'determinism';
  else if (flags.pvp) mode = 'pvp';
  else if (flags.sweep) mode = 'sweep';

  // Determine games to eval
  const gameNames = gameName ? [gameName] : allGames;

  log(`=== Game Lab Eval — ${mode} ===`);
  log(`Games: ${gameNames.join(', ')}  Runs: ${runs}  MaxTicks: ${maxTicks}`);

  const allResults = {};
  let passed = 0;
  let failed = 0;

  for (const name of gameNames) {
    try {
      allResults[name] = await evalGame(name, mode);
      passed++;
    } catch (e) {
      log(`\n${name}: ERROR — ${e.message}`);
      allResults[name] = { error: e.message };
      failed++;
    }
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

  if (mode === 'validate' && gameNames.length > 1) {
    log(`\n${passed} passed, ${failed} failed out of ${gameNames.length} games (${elapsed}s)`);
  } else {
    log(`\nDone in ${elapsed}s`);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(allResults, null, 2));
  }

  if (failed > 0) process.exit(1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
