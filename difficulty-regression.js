#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Continuous Play Difficulty Regression Test
//
// Validates the "indefinite play" invariant: each difficulty tier is
// calibrated so its matched bot survives almost indefinitely while
// experiencing higher pressure at increased difficulty.
//
// 4 tiers × 3 tests each = 12 tests:
//   1. Steady-state: bot plays 600s, density stays below Dcrit
//   2. Margin: same bot at 2x spawn rate overflows within 600s
//   3. Lower-bot-struggles: one-tier-lower bot at tier params has
//      significantly higher density (or overflows)
//
// Usage:
//   node difficulty-regression.js          # Run all tests
//   node difficulty-regression.js --fast   # Quick validation (120s, 3 seeds)
//   node difficulty-regression.js --tier FLOW  # Single tier
// =========================================================================

const { runContinuous } = require('./continuous-sim.js');

// --- Calibrated tier parameters ---
// From calibrate-continuous.js full run (10min, 5 seeds).
// Rates set conservatively below calibrated edge for reliable steady-state.
// IMPORTANT: Re-run calibration after changing sim physics.
// Calibrated with chain-resolving 2-ply oracle (2026-02-22).
// Rates are the bot survival thresholds. Browser uses ~90% of these.
const CALIBRATED_TIERS = {
    CALM: {
        bot: 'random',
        spawnRate: 0.72,
        speedMin: 0.4, speedMax: 0.8,
        dotTypes: { standard: 1.0 },
        tapCooldown: 1500,
        maxDots: 80,
        overflowDensity: 0.8,
    },
    FLOW: {
        bot: 'humanSim',
        spawnRate: 4.0,
        speedMin: 0.5, speedMax: 1.0,
        dotTypes: { standard: 0.85, gravity: 0.15 },
        tapCooldown: 2000,
        maxDots: 90,
        overflowDensity: 0.8,
    },
    SURGE: {
        bot: 'greedy',
        spawnRate: 5.8,
        speedMin: 0.6, speedMax: 1.2,
        dotTypes: { standard: 0.70, gravity: 0.20, volatile: 0.10 },
        tapCooldown: 2500,
        maxDots: 100,
        overflowDensity: 0.8,
    },
    TRANSCENDENCE: {
        bot: 'oracle',
        spawnRate: 3.0,
        speedMin: 0.7, speedMax: 1.4,
        dotTypes: { standard: 0.50, gravity: 0.25, volatile: 0.25 },
        tapCooldown: 2000,
        maxDots: 60,
        overflowDensity: 0.8,
    },
    IMPOSSIBLE: {
        bot: 'oracle',
        spawnRate: 2.1,
        speedMin: 0.8, speedMax: 1.6,
        dotTypes: { standard: 0.30, gravity: 0.30, volatile: 0.40 },
        tapCooldown: 1500,
        maxDots: 40,
        overflowDensity: 0.8,
    },
};

// Lower bot mapping: which bot struggles at this tier.
// Adjacent-tier bots are nearly equivalent in continuous mode (humanSim ≈ greedy,
// greedy ≈ oracle) because tap cooldown negates timing/precision advantages.
// Use wider gaps to get meaningful differentiation.
// Lower-bot-struggles test: verify the random bot overflows at each tier's rate.
// Cascade momentum narrows the gap between adjacent bots, so we use random
// as the universal baseline — it should overflow at all non-CALM rates.
const LOWER_BOT = {
    CALM: null,          // no tier below CALM
    FLOW: 'random',      // random overflows at humanSim rates
    SURGE: 'random',     // random overflows at greedy rates
    TRANSCENDENCE: 'random', // random overflows at oracle rates
    IMPOSSIBLE: 'random',    // random overflows at oracle rates
};

// =========================================================================
// TEST RUNNER
// =========================================================================

/**
 * Run a test across multiple seeds and return aggregate result.
 */
function runTest(testName, botName, config, duration, seeds) {
    let survivals = 0;
    let totalMeanDensity = 0;
    let totalMaxDensity = 0;
    let totalScore = 0;
    let totalChains = 0;
    let totalAvgChainLen = 0;

    for (const seed of seeds) {
        const stats = runContinuous({
            bot: botName,
            duration,
            width: 390,
            height: 844,
            config: { ...config, spawnAccel: 0 },
            seed,
        });

        if (!stats.overflowed) survivals++;
        totalMeanDensity += stats.meanDensity;
        totalMaxDensity += stats.maxDensity;
        totalScore += stats.score;
        totalChains += stats.chainCount;
        totalAvgChainLen += stats.avgChainLength;
    }

    const n = seeds.length;
    return {
        test: testName,
        survivalRate: survivals / n,
        meanDensity: totalMeanDensity / n,
        maxDensity: totalMaxDensity / n,
        avgScore: totalScore / n,
        avgChains: totalChains / n,
        avgChainLen: totalAvgChainLen / n,
    };
}

/**
 * Run all tests for a tier. Returns array of { test, pass, ... }
 */
function runTierTests(tierName, tier, opts) {
    const { duration, marginDuration, lowerBotDuration, seeds } = opts;
    const results = [];

    // Test 1: Steady-state — bot survives full duration with manageable density
    process.stdout.write(`    [1/3] Steady-state (${tier.bot}, ${duration / 1000}s)... `);
    const steady = runTest(
        `${tierName}/steady-state`,
        tier.bot,
        tier,
        duration,
        seeds
    );
    // Pass if 60%+ survive AND mean density < 70%
    const steadyPass = steady.survivalRate >= 0.6 && steady.meanDensity < 0.70;
    console.log(
        `${steadyPass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}` +
        ` (${(steady.survivalRate * 100).toFixed(0)}% survived, density ${(steady.meanDensity * 100).toFixed(0)}%)`
    );
    results.push({ ...steady, pass: steadyPass });

    // Test 2: Margin — 2x spawn rate creates significantly higher pressure
    const marginRate = tier.spawnRate * 2;
    process.stdout.write(`    [2/3] Margin (${tier.bot}, ${marginRate.toFixed(1)}/s, ${marginDuration / 1000}s)... `);
    const margin = runTest(
        `${tierName}/margin`,
        tier.bot,
        { ...tier, spawnRate: marginRate },
        marginDuration,
        seeds
    );
    // Pass if: overflows 40%+, OR density > 65%, OR density significantly higher than steady-state
    const densityIncrease = margin.meanDensity - steady.meanDensity;
    const marginPass = margin.survivalRate <= 0.4 || margin.meanDensity > 0.65 || densityIncrease > 0.10;
    console.log(
        `${marginPass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}` +
        ` (${((1 - margin.survivalRate) * 100).toFixed(0)}% overflowed, density ${(margin.meanDensity * 100).toFixed(0)}%` +
        `, +${(densityIncrease * 100).toFixed(0)}% vs steady)`
    );
    results.push({ ...margin, pass: marginPass });

    // Test 3: Lower-bot-struggles — weaker bot has higher density or overflows
    const lowerBot = LOWER_BOT[tierName];
    if (lowerBot) {
        process.stdout.write(`    [3/3] Lower-bot-struggles (${lowerBot}, ${lowerBotDuration / 1000}s)... `);
        const lower = runTest(
            `${tierName}/lower-bot-struggles`,
            lowerBot,
            tier,
            lowerBotDuration,
            seeds
        );
        // Pass if lower bot overflows 40%+ OR has mean density > matched bot + 0.05
        const densityGap = lower.meanDensity - steady.meanDensity;
        const lowerPass = lower.survivalRate <= 0.6 || densityGap > 0.05;
        console.log(
            `${lowerPass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}` +
            ` (${((1 - lower.survivalRate) * 100).toFixed(0)}% overflowed, density ${(lower.meanDensity * 100).toFixed(0)}%` +
            `, gap +${(densityGap * 100).toFixed(0)}%)`
        );
        results.push({ ...lower, pass: lowerPass });
    } else {
        console.log(`    [3/3] Lower-bot-struggles: SKIP (no tier below ${tierName})`);
        results.push({ test: `${tierName}/lower-bot-struggles`, pass: true, skipped: true });
    }

    return results;
}

// =========================================================================
// CLI
// =========================================================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const fast = args.includes('--fast');
    const tierFilter = args.includes('--tier') ? args[args.indexOf('--tier') + 1] : null;

    const opts = fast ? {
        duration: 120000,         // 2min steady-state
        marginDuration: 120000,   // 2min margin
        lowerBotDuration: 120000, // 2min lower bot
        seeds: [42, 137, 256],
    } : {
        duration: 600000,         // 10min steady-state
        marginDuration: 600000,   // 10min margin
        lowerBotDuration: 300000, // 5min lower bot
        seeds: [42, 137, 256, 314, 999],
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  CHAIN REACTION — Difficulty Regression Test`);
    console.log(`  Mode: ${fast ? 'FAST (2min, 3 seeds)' : 'FULL (10min, 5 seeds)'}`);
    console.log(`${'='.repeat(60)}\n`);

    const t0 = Date.now();
    const allResults = [];
    let totalTests = 0, totalPass = 0;

    for (const [name, tier] of Object.entries(CALIBRATED_TIERS)) {
        if (tierFilter && name !== tierFilter) continue;

        console.log(`  ── ${name} (${tier.bot}, ${tier.spawnRate}/s) ──`);
        const results = runTierTests(name, tier, opts);
        allResults.push(...results);

        for (const r of results) {
            totalTests++;
            if (r.pass) totalPass++;
        }
        console.log('');
    }

    // Summary
    console.log(`${'═'.repeat(60)}`);
    const allPassed = totalPass === totalTests;
    const color = allPassed ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${color}${totalPass}/${totalTests} tests passed\x1b[0m`);

    if (!allPassed) {
        console.log('\n  FAILED TESTS:');
        for (const r of allResults) {
            if (!r.pass && !r.skipped) {
                console.log(`    ✗ ${r.test} (survival: ${(r.survivalRate * 100).toFixed(0)}%, density: ${(r.meanDensity * 100).toFixed(0)}%)`);
            }
        }
    }

    console.log(`\n  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
    process.exit(allPassed ? 0 : 1);
}
