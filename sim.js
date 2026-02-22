#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Headless Simulation Harness (Thin wrapper over game-core)
//
// Extracts pure game logic from index.html. No canvas, no audio, no DOM.
// Runs ~100 full games/second. Seeded RNG for reproducibility.
//
// Usage:
//   node sim.js                          # Default: all metrics, 500 runs
//   node sim.js --runs 2000              # More runs for higher confidence
//   node sim.js --metric skill-ceiling   # Single metric
//   node sim.js --round 5 --viewport 390x844  # Specific round + viewport
//   node sim.js --config '{"EXPLOSION_RADIUS_PCT":0.15}'  # Test parameter changes
//   node sim.js --compare '{"speedMin":0.6}' '{"speedMin":1.0}'  # A/B test
// =========================================================================

const { Game, Bots, DEFAULTS, getRoundParams, getMultiplier, createRNG } = require('./game-core.js');

// Backward-compat alias
const DEFAULT_CONFIG = DEFAULTS;

// =========================================================================
// SIMULATION WRAPPER (maps seed-based API to game-core's rng-based API)
// =========================================================================

class Simulation extends Game {
    constructor(width, height, config = {}, seed = 42) {
        super(width, height, config, createRNG(seed));
    }
}

// =========================================================================
// METRICS
// =========================================================================

const Metrics = {

    // 1. Skill Ceiling Ratio: optimal / random scores
    skillCeiling(W, H, config, runs, round) {
        const randomScores = [];
        const greedyScores = [];
        const oracleScores = [];

        for (let i = 0; i < runs; i++) {
            const seed = i * 7 + 1;

            // Random bot
            const sim1 = new Simulation(W, H, config, seed);
            sim1.setupRound(round);
            const rTap = Bots.random(sim1);
            sim1.tap(rTap.x, rTap.y);
            sim1.resolveChain();
            randomScores.push(sim1.chainCount);

            // Greedy bot
            const sim2 = new Simulation(W, H, config, seed);
            sim2.setupRound(round);
            const gTap = Bots.greedy(sim2);
            sim2.tap(gTap.x, gTap.y);
            sim2.resolveChain();
            greedyScores.push(sim2.chainCount);

            // Oracle (expensive — run fewer)
            if (i < Math.min(runs, 100)) {
                const sim3 = new Simulation(W, H, config, seed);
                sim3.setupRound(round);
                const oTap = Bots.oracle(sim3);
                const sim3b = new Simulation(W, H, config, seed);
                sim3b.setupRound(round);
                // Advance by oracle delay
                const DT = 16.67;
                for (let t = 0; t < (oTap.waitMs || 0); t += DT) sim3b.step(DT);
                sim3b.tap(oTap.x, oTap.y);
                sim3b.resolveChain();
                oracleScores.push(sim3b.chainCount);
            }
        }

        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const pct = (arr, p) => { const s = [...arr].sort((a,b) => a - b); return s[Math.floor(s.length * p)] || 0; };

        const rAvg = avg(randomScores);
        const gAvg = avg(greedyScores);
        const oAvg = oracleScores.length ? avg(oracleScores) : gAvg;

        return {
            metric: 'skill-ceiling',
            randomAvg: rAvg,
            greedyAvg: gAvg,
            oracleAvg: oAvg,
            SCR: rAvg > 0 ? oAvg / rAvg : Infinity,
            greedySCR: rAvg > 0 ? gAvg / rAvg : Infinity,
            skillGapRatio: oAvg > 0 ? (oAvg - rAvg) / oAvg : 0,
            humanCapture: oAvg > rAvg ? (gAvg - rAvg) / (oAvg - rAvg) : 0,
            randomP50: pct(randomScores, 0.5),
            greedyP50: pct(greedyScores, 0.5),
            oracleP50: oracleScores.length ? pct(oracleScores, 0.5) : null,
        };
    },

    // 2. Drift Hit Ratio
    driftRatio(W, H, config, runs, round) {
        let totalHits = 0, driftHits = 0, expansionHits = 0;
        const driftTimings = [];

        for (let i = 0; i < runs; i++) {
            const sim = new Simulation(W, H, config, i * 7 + 1);
            sim.setupRound(round);
            const tap = Bots.greedy(sim);
            sim.tap(tap.x, tap.y);
            sim.resolveChain();

            for (const h of sim._hitLog) {
                totalHits++;
                if (h.expansionHit) expansionHits++;
                else { driftHits++; driftTimings.push(h.time); }
            }
        }

        return {
            metric: 'drift-ratio',
            totalHits,
            expansionHits,
            driftHits,
            DHR: totalHits > 0 ? driftHits / totalHits : 0,
            avgDriftTime: driftTimings.length > 0
                ? driftTimings.reduce((a, b) => a + b, 0) / driftTimings.length : 0,
        };
    },

    // 3. Chain Length Distribution
    chainDistribution(W, H, config, runs, round) {
        const chains = [];
        const greedyChains = [];

        for (let i = 0; i < runs; i++) {
            const seed = i * 7 + 1;

            // Random taps
            const sim1 = new Simulation(W, H, config, seed);
            sim1.setupRound(round);
            const rTap = Bots.random(sim1);
            sim1.tap(rTap.x, rTap.y);
            sim1.resolveChain();
            chains.push(sim1.chainCount);

            // Greedy taps
            const sim2 = new Simulation(W, H, config, seed);
            sim2.setupRound(round);
            const gTap = Bots.greedy(sim2);
            sim2.tap(gTap.x, gTap.y);
            sim2.resolveChain();
            greedyChains.push(sim2.chainCount);
        }

        const histogram = {};
        for (const c of chains) histogram[c] = (histogram[c] || 0) + 1;

        const sorted = [...chains].sort((a, b) => a - b);
        const gSorted = [...greedyChains].sort((a, b) => a - b);
        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const pct = (s, p) => s[Math.floor(s.length * p)] || 0;

        const params = getRoundParams(round, config);
        const godThreshold = Math.floor(params.dots * 0.8);

        return {
            metric: 'chain-distribution',
            random: {
                mean: avg(chains),
                median: pct(sorted, 0.5),
                p10: pct(sorted, 0.1),
                p90: pct(sorted, 0.9),
                p99: pct(sorted, 0.99),
                max: sorted[sorted.length - 1],
                zeroChains: chains.filter(c => c === 0).length,
                godChains: chains.filter(c => c >= godThreshold).length,
            },
            greedy: {
                mean: avg(greedyChains),
                median: pct(gSorted, 0.5),
                p90: pct(gSorted, 0.9),
                max: gSorted[gSorted.length - 1],
                godChains: greedyChains.filter(c => c >= godThreshold).length,
            },
            godThreshold,
            histogram: Object.entries(histogram).sort((a, b) => +a[0] - +b[0])
                .map(([k, v]) => `${k}:${v}`).join(' '),
        };
    },

    // 4. Opportunity Density
    opportunityDensity(W, H, config, runs, round) {
        const clusterCounts = [];
        const gapDurations = [];
        const halfLives = [];

        for (let i = 0; i < runs; i++) {
            const sim = new Simulation(W, H, config, i * 7 + 1);
            sim.setupRound(round);
            const DT = 16.67;
            const frameClusters = [];
            let inCluster = false, clusterStart = 0, gapStart = 0;

            // Simulate 10 seconds of drift (no tap)
            for (let t = 0; t < 10000; t += DT) {
                sim.step(DT);
                let maxC = 0;
                const gridN = 12;
                for (let gx = 0; gx < gridN; gx++) {
                    for (let gy = 0; gy < gridN; gy++) {
                        const x = (gx + 0.5) * sim.W / gridN;
                        const y = (gy + 0.5) * sim.H / gridN;
                        maxC = Math.max(maxC, sim.countInRadius(x, y, sim.explosionRadius));
                    }
                }
                frameClusters.push(maxC);

                const hasCluster = maxC >= 3;
                if (hasCluster && !inCluster) {
                    inCluster = true;
                    clusterStart = t;
                    if (gapStart > 0) gapDurations.push(t - gapStart);
                } else if (!hasCluster && inCluster) {
                    inCluster = false;
                    gapStart = t;
                    halfLives.push(t - clusterStart);
                }
            }
            clusterCounts.push(...frameClusters);
        }

        const f3 = clusterCounts.filter(c => c >= 3).length / clusterCounts.length;
        const f5 = clusterCounts.filter(c => c >= 5).length / clusterCounts.length;
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const pct = (arr, p) => {
            if (!arr.length) return 0;
            const s = [...arr].sort((a, b) => a - b);
            return s[Math.floor(s.length * p)] || 0;
        };

        return {
            metric: 'opportunity-density',
            f3: (f3 * 100).toFixed(1) + '%',
            f5: (f5 * 100).toFixed(1) + '%',
            avgMaxCluster: avg(clusterCounts).toFixed(2),
            gapBetweenClusters: {
                mean: avg(gapDurations).toFixed(0) + 'ms',
                median: pct(gapDurations, 0.5).toFixed(0) + 'ms',
            },
            clusterHalfLife: {
                mean: avg(halfLives).toFixed(0) + 'ms',
                median: pct(halfLives, 0.5).toFixed(0) + 'ms',
            },
        };
    },

    // 5. Input Sensitivity
    inputSensitivity(W, H, config, runs, round) {
        const r50Values = [];
        const gradients = [];

        for (let i = 0; i < Math.min(runs, 200); i++) {
            const sim = new Simulation(W, H, config, i * 7 + 1);
            sim.setupRound(round);

            const opt = Bots.greedy(sim);

            const simOpt = new Simulation(W, H, config, i * 7 + 1);
            simOpt.setupRound(round);
            simOpt.tap(opt.x, opt.y);
            simOpt.resolveChain();
            const optScore = simOpt.chainCount;
            if (optScore === 0) continue;

            const deltas = [10, 20, 40, 60, 80, 100];
            let foundR50 = false;
            for (const delta of deltas) {
                let avgOffsetScore = 0;
                const dirs = 8;
                for (let d = 0; d < dirs; d++) {
                    const angle = (d / dirs) * Math.PI * 2;
                    const ox = opt.x + Math.cos(angle) * delta;
                    const oy = opt.y + Math.sin(angle) * delta;
                    const simOff = new Simulation(W, H, config, i * 7 + 1);
                    simOff.setupRound(round);
                    simOff.tap(ox, oy);
                    simOff.resolveChain();
                    avgOffsetScore += simOff.chainCount;
                }
                avgOffsetScore /= dirs;
                const retention = avgOffsetScore / optScore;
                if (!foundR50 && retention <= 0.5) {
                    r50Values.push(delta);
                    foundR50 = true;
                }
                if (delta === 10) {
                    gradients.push(1 - retention);
                }
            }
            if (!foundR50) r50Values.push(100);
        }

        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const pct = (arr, p) => {
            if (!arr.length) return 0;
            const s = [...arr].sort((a, b) => a - b);
            return s[Math.floor(s.length * p)] || 0;
        };

        return {
            metric: 'input-sensitivity',
            r50: {
                mean: avg(r50Values).toFixed(1) + 'px',
                median: pct(r50Values, 0.5).toFixed(1) + 'px',
                p25: pct(r50Values, 0.25).toFixed(1) + 'px',
            },
            scoreDropPer10px: {
                mean: (avg(gradients) * 100).toFixed(1) + '%',
                median: (pct(gradients, 0.5) * 100).toFixed(1) + '%',
            },
        };
    },

    // 6. Chaos Decay Rate
    chaosDecay(W, H, config, runs, round) {
        const decays = [];

        for (let i = 0; i < Math.min(runs, 100); i++) {
            const seed = i * 7 + 1;
            const sim = new Simulation(W, H, config, seed);
            sim.setupRound(round);

            const tapNow = Bots.greedy(sim);

            const sim1 = new Simulation(W, H, config, seed);
            sim1.setupRound(round);
            sim1.tap(tapNow.x, tapNow.y);
            sim1.resolveChain();
            const scoreNow = sim1.chainCount;
            if (scoreNow === 0) continue;

            const sim2 = new Simulation(W, H, config, seed);
            sim2.setupRound(round);
            const DT = 16.67;
            for (let t = 0; t < 200; t += DT) sim2.step(DT);
            sim2.tap(tapNow.x, tapNow.y);
            sim2.resolveChain();
            const score200 = sim2.chainCount;

            const sim3 = new Simulation(W, H, config, seed);
            sim3.setupRound(round);
            for (let t = 0; t < 500; t += DT) sim3.step(DT);
            sim3.tap(tapNow.x, tapNow.y);
            sim3.resolveChain();
            const score500 = sim3.chainCount;

            decays.push({
                scoreNow, score200, score500,
                retention200: score200 / scoreNow,
                retention500: score500 / scoreNow,
            });
        }

        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        return {
            metric: 'chaos-decay',
            samples: decays.length,
            retention200ms: (avg(decays.map(d => d.retention200)) * 100).toFixed(1) + '%',
            retention500ms: (avg(decays.map(d => d.retention500)) * 100).toFixed(1) + '%',
            avgChainNow: avg(decays.map(d => d.scoreNow)).toFixed(1),
            avgChain200: avg(decays.map(d => d.score200)).toFixed(1),
            avgChain500: avg(decays.map(d => d.score500)).toFixed(1),
        };
    },
};

// =========================================================================
// CLI
// =========================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        runs: 500,
        round: 5,
        viewport: '800x600',
        metric: 'all',
        config: {},
        compare: null,
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--runs') opts.runs = parseInt(args[++i]);
        else if (args[i] === '--round') opts.round = parseInt(args[++i]);
        else if (args[i] === '--viewport') opts.viewport = args[++i];
        else if (args[i] === '--metric') opts.metric = args[++i];
        else if (args[i] === '--config') opts.config = JSON.parse(args[++i]);
        else if (args[i] === '--compare') {
            opts.compare = [JSON.parse(args[++i]), JSON.parse(args[++i])];
        }
    }
    return opts;
}

function runDashboard(W, H, config, runs, round) {
    const label = `${W}x${H} R${round} (${runs} runs)`;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  CHAIN REACTION — Simulation Dashboard`);
    console.log(`  ${label}`);
    console.log(`  explosionRadius: ${Math.max(DEFAULTS.EXPLOSION_RADIUS_MIN_PX, Math.min(W, H, 800) * (config.EXPLOSION_RADIUS_PCT || DEFAULTS.EXPLOSION_RADIUS_PCT)).toFixed(1)}px`);
    console.log(`${'='.repeat(60)}\n`);

    const t0 = Date.now();

    process.stdout.write('  [1/6] Chain distribution...      ');
    const chains = Metrics.chainDistribution(W, H, config, runs, round);
    console.log(`done (${Date.now() - t0}ms)`);
    printResult(chains);

    const t1 = Date.now();
    process.stdout.write('  [2/6] Skill ceiling...           ');
    const skill = Metrics.skillCeiling(W, H, config, runs, round);
    console.log(`done (${Date.now() - t1}ms)`);
    printResult(skill);

    const t2 = Date.now();
    process.stdout.write('  [3/6] Drift hit ratio...         ');
    const drift = Metrics.driftRatio(W, H, config, runs, round);
    console.log(`done (${Date.now() - t2}ms)`);
    printResult(drift);

    const t3 = Date.now();
    process.stdout.write('  [4/6] Input sensitivity...       ');
    const sensitivity = Metrics.inputSensitivity(W, H, config, Math.min(runs, 200), round);
    console.log(`done (${Date.now() - t3}ms)`);
    printResult(sensitivity);

    const t4 = Date.now();
    process.stdout.write('  [5/6] Opportunity density...     ');
    const density = Metrics.opportunityDensity(W, H, config, Math.min(runs, 50), round);
    console.log(`done (${Date.now() - t4}ms)`);
    printResult(density);

    const t5 = Date.now();
    process.stdout.write('  [6/6] Chaos decay...             ');
    const chaos = Metrics.chaosDecay(W, H, config, Math.min(runs, 100), round);
    console.log(`done (${Date.now() - t5}ms)`);
    printResult(chaos);

    console.log(`\n${'─'.repeat(60)}`);
    console.log('  SWEET SPOT CHECK');
    console.log(`${'─'.repeat(60)}`);

    const scr = skill.SCR;
    const dhr = drift.DHR;
    const f3 = parseFloat(density.f3);
    const r50 = parseFloat(sensitivity.r50.mean);
    const ret200 = parseFloat(chaos.retention200ms);

    check('Skill ceiling (SCR)', scr, 2.0, 5.0, '×');
    check('Drift hit ratio', dhr, 0.30, 0.55, '');
    check('Opportunity (F3)', f3, 30, 60, '%');
    check('Input sensitivity (R50)', r50, 30, 80, 'px');
    check('Chaos retention @200ms', ret200, 40, 85, '%');

    console.log(`\n  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

    return { chains, skill, drift, sensitivity, density, chaos };
}

function check(name, value, low, high, unit) {
    let status;
    if (value >= low && value <= high) status = '\x1b[32m OK \x1b[0m';
    else if (value < low) status = '\x1b[33m LOW\x1b[0m';
    else status = '\x1b[33mHIGH\x1b[0m';

    const val = typeof value === 'number' ? value.toFixed(2) : value;
    console.log(`  ${status}  ${name.padEnd(28)} ${val}${unit}  (sweet: ${low}-${high}${unit})`);
}

function printResult(obj) {
    const { metric, ...rest } = obj;
    console.log(`\n  ── ${metric} ──`);
    for (const [k, v] of Object.entries(rest)) {
        if (typeof v === 'object' && v !== null) {
            console.log(`    ${k}:`);
            for (const [k2, v2] of Object.entries(v)) {
                console.log(`      ${k2}: ${v2}`);
            }
        } else {
            console.log(`    ${k}: ${v}`);
        }
    }
}

// =========================================================================
// EXPORTS (backward-compatible)
// =========================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Simulation, DEFAULT_CONFIG, getRoundParams, getMultiplier, Bots, Metrics, createRNG };
}

// =========================================================================
// MAIN (only when run directly)
// =========================================================================

if (require.main === module) {
    const opts = parseArgs();
    const [W, H] = opts.viewport.split('x').map(Number);
    const config = { ...DEFAULT_CONFIG, ...opts.config };

    if (opts.compare) {
        console.log('\n  A/B COMPARISON\n');
        console.log('  Config A:', JSON.stringify(opts.compare[0]));
        const resultA = runDashboard(W, H, { ...config, ...opts.compare[0] }, opts.runs, opts.round);
        console.log('\n  Config B:', JSON.stringify(opts.compare[1]));
        const resultB = runDashboard(W, H, { ...config, ...opts.compare[1] }, opts.runs, opts.round);
    } else if (opts.metric !== 'all') {
        const fn = Metrics[opts.metric.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
        if (!fn) { console.error(`Unknown metric: ${opts.metric}`); process.exit(1); }
        const result = fn(W, H, config, opts.runs, opts.round);
        printResult(result);
    } else {
        runDashboard(W, H, config, opts.runs, opts.round);
    }
}
