#!/usr/bin/env node
'use strict';

// =========================================================================
// EXPERIMENT.JS — Design Hypothesis Testing Pipeline
//
// Runs a game config variant through the full bot ladder, computes quality
// metrics, and compares against baseline. This is the core autonomous
// iteration tool.
//
// Usage:
//   node experiment.js                                    # Baseline only
//   node experiment.js --variant '{"spawnDensityScale":1}' --label "H6-k1"
//   node experiment.js --sweep '{"agingRate":[0,0.0005,0.001,0.002]}'
//   node experiment.js --compare baseline.json variant.json
//
// The variant object is merged into the tier config for each run.
// Custom game mechanics can be added by extending game-core.js to read
// new config keys.
// =========================================================================

const { CONTINUOUS_TIERS, BOT_PROFILES } = require('./game-core.js');
const { runContinuous } = require('./continuous-sim.js');
const { computeQuality, printQuality, compareExperiments, printComparison } = require('./quality.js');
const fs = require('fs');

// =========================================================================
// CONFIG
// =========================================================================

const DEFAULT_OPTS = {
    seeds: 20,
    duration: 120000,  // 2 min per run
    width: 390,
    height: 844,
    tiers: ['FLOW', 'SURGE', 'IMPOSSIBLE'],  // representative subset
    noviceBot: 'CALM',
};

// =========================================================================
// CORE: Run one experiment configuration
// =========================================================================

function runExperiment(variantConfig = {}, opts = {}) {
    const { seeds, duration, width, height, tiers, noviceBot } = { ...DEFAULT_OPTS, ...opts };
    const seedList = Array.from({ length: seeds }, (_, i) => i + 1);
    const results = {};

    for (const tierName of tiers) {
        const tier = CONTINUOUS_TIERS[tierName];
        if (!tier) { console.error(`Unknown tier: ${tierName}`); continue; }

        const mergedConfig = { ...tier, ...variantConfig, spawnAccel: 0 };

        // Expert runs (matched bot for this tier)
        const expertRuns = seedList.map(seed => runContinuous({
            bot: tierName, duration, width, height,
            config: mergedConfig, seed,
        }));

        // Novice runs (CALM bot)
        const noviceRuns = seedList.map(seed => runContinuous({
            bot: noviceBot, duration, width, height,
            config: mergedConfig, seed,
        }));

        const quality = computeQuality({
            runs: expertRuns,
            expertRuns,
            noviceRuns,
            spawnRate: tier.spawnRate,
            cooldownMs: tier.cooldown,
        });

        // Summary stats
        const expertSurvival = expertRuns.filter(r => !r.overflowed).length / expertRuns.length;
        const avgScore = expertRuns.reduce((a, r) => a + r.score, 0) / expertRuns.length;
        const avgChain = expertRuns.reduce((a, r) => a + r.avgChainLength, 0) / expertRuns.length;

        results[tierName] = {
            quality,
            summary: { expertSurvival, avgScore, avgChain },
            config: mergedConfig,
        };
    }

    return results;
}

// =========================================================================
// SWEEP: Test multiple values of a parameter
// =========================================================================

function runSweep(paramName, values, opts = {}) {
    const allResults = {};

    // Baseline
    process.stdout.write(`  Running baseline... `);
    allResults['baseline'] = runExperiment({}, opts);
    console.log('done');

    // Variants
    for (const val of values) {
        const label = `${paramName}=${val}`;
        process.stdout.write(`  Running ${label}... `);
        allResults[label] = runExperiment({ [paramName]: val }, opts);
        console.log('done');
    }

    return allResults;
}

// =========================================================================
// REPORTING
// =========================================================================

function printExperiment(results, label = 'Experiment') {
    console.log(`\n${'#'.repeat(70)}`);
    console.log(`  ${label}`);
    console.log(`${'#'.repeat(70)}`);

    for (const [tierName, data] of Object.entries(results)) {
        printQuality(data.quality, `${tierName} — survival: ${(data.summary.expertSurvival * 100).toFixed(0)}%, ` +
            `score: ${Math.round(data.summary.avgScore)}, chain: ${data.summary.avgChain.toFixed(1)}`);
    }
}

function printSweepTable(sweepResults, paramName) {
    const tiers = Object.keys(Object.values(sweepResults)[0]);

    for (const tier of tiers) {
        console.log(`\n${'='.repeat(90)}`);
        console.log(`  ${tier} — ${paramName} sweep`);
        console.log(`${'='.repeat(90)}`);
        console.log(
            'Value'.padEnd(20) +
            'Mortality'.padStart(10) +
            'DensSlope'.padStart(10) +
            'Escalation'.padStart(11) +
            'Recovery'.padStart(9) +
            'Drama'.padStart(8) +
            'BE Ratio'.padStart(9) +
            'SkillDisc'.padStart(10) +
            'Flags'.padStart(5)
        );
        console.log('-'.repeat(90));

        for (const [label, results] of Object.entries(sweepResults)) {
            const q = results[tier].quality;
            console.log(
                label.padEnd(20) +
                `${(q.mortalityRate * 100).toFixed(0)}%`.padStart(10) +
                `${(q.densityTrendSlope * 1000).toFixed(2)}`.padStart(10) +
                `${(q.densityEscalation * 100).toFixed(1)}%`.padStart(11) +
                `${q.densityRecoveryCount.toFixed(2)}`.padStart(9) +
                `${(q.densityDrama * 100).toFixed(1)}`.padStart(8) +
                `${q.breakEven.ratio.toFixed(2)}x`.padStart(9) +
                `${q.skillDiscrimination !== undefined ? q.skillDiscrimination.toFixed(2) + 'x' : 'n/a'}`.padStart(10) +
                `${q.flags.length}`.padStart(5)
            );
        }
    }
}

// =========================================================================
// CLI
// =========================================================================

if (require.main === module) {
    const args = process.argv.slice(2);

    let variantConfig = {};
    let label = 'Baseline';
    let sweepConfig = null;
    let compareFiles = null;
    let seedCount = 20;
    let tierFilter = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--variant') variantConfig = JSON.parse(args[++i]);
        else if (args[i] === '--label') label = args[++i];
        else if (args[i] === '--sweep') sweepConfig = JSON.parse(args[++i]);
        else if (args[i] === '--compare') compareFiles = [args[++i], args[++i]];
        else if (args[i] === '--seeds') seedCount = parseInt(args[++i]);
        else if (args[i] === '--tier') tierFilter = args[++i];
        else if (args[i] === '--fast') seedCount = 8;
    }

    const opts = { seeds: seedCount };
    if (tierFilter) opts.tiers = [tierFilter];

    if (compareFiles) {
        const baseline = JSON.parse(fs.readFileSync(compareFiles[0], 'utf-8'));
        const variant = JSON.parse(fs.readFileSync(compareFiles[1], 'utf-8'));
        for (const tier of Object.keys(baseline)) {
            console.log(`\n  ${tier}:`);
            printComparison(compareExperiments(baseline[tier].quality, variant[tier].quality));
        }
    } else if (sweepConfig) {
        const paramName = Object.keys(sweepConfig)[0];
        const values = sweepConfig[paramName];
        console.log(`\nSWEEP: ${paramName} = [${values.join(', ')}]`);
        console.log(`Seeds: ${seedCount}, Duration: ${DEFAULT_OPTS.duration / 1000}s\n`);

        const t0 = Date.now();
        const results = runSweep(paramName, values, opts);
        printSweepTable(results, paramName);

        // Save results
        const outFile = `experiment-${paramName}-${Date.now()}.json`;
        fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to ${outFile}`);
        console.log(`Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } else {
        console.log(`\nEXPERIMENT: ${label}`);
        console.log(`Config: ${JSON.stringify(variantConfig)}`);
        console.log(`Seeds: ${seedCount}, Duration: ${DEFAULT_OPTS.duration / 1000}s\n`);

        const t0 = Date.now();
        const results = runExperiment(variantConfig, opts);
        printExperiment(results, label);

        // Save results
        const outFile = `experiment-${label.replace(/\s+/g, '-')}-${Date.now()}.json`;
        fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to ${outFile}`);
        console.log(`Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
}

module.exports = { runExperiment, runSweep };
