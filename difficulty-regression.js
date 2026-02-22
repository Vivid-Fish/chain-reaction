#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Difficulty Regression Test
//
// Tests the ACTUAL game config from game-core.js — no separate calibrated
// values. Uses BotRunner (same code as browser + headless sim).
//
// For each tier, the matched bot (from BOT_PROFILES) should survive
// indefinitely at the tier's spawn rate (from CONTINUOUS_TIERS).
//
// 5 tiers × 3 tests each = 15 tests:
//   1. Steady-state: matched bot survives, density manageable
//   2. Margin: 2x spawn rate creates significantly higher pressure
//   3. Lower-bot-struggles: CALM bot overflows at this tier's rate
//
// Usage:
//   node difficulty-regression.js          # Full run (10min, 5 seeds)
//   node difficulty-regression.js --fast   # Quick (2min, 3 seeds)
//   node difficulty-regression.js --tier FLOW
// =========================================================================

const { CONTINUOUS_TIERS, BOT_PROFILES } = require('./game-core.js');
const { runContinuous } = require('./continuous-sim.js');

// =========================================================================
// TEST RUNNER
// =========================================================================

function runTest(testName, skillKey, tierOverrides, duration, seeds, width = 390, height = 844) {
    let survivals = 0;
    let totalMeanDensity = 0;
    let totalMaxDensity = 0;
    let totalScore = 0;
    let totalChains = 0;
    let totalAvgChainLen = 0;

    for (const seed of seeds) {
        const stats = runContinuous({
            bot: skillKey,
            duration,
            width,
            height,
            config: { ...tierOverrides, spawnAccel: 0 },
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

function runTierTests(tierName, tier, opts) {
    const { duration, marginDuration, lowerBotDuration, seeds, vpW = 390, vpH = 844 } = opts;
    const profile = BOT_PROFILES[tierName];
    const results = [];

    // Test 1: Steady-state — matched bot survives at tier's actual params
    process.stdout.write(`    [1/3] Steady-state (${profile.bot}, ${duration / 1000}s)... `);
    const steady = runTest(
        `${tierName}/steady-state`,
        tierName,
        tier,
        duration,
        seeds,
        vpW, vpH
    );
    const steadyPass = steady.survivalRate >= 0.6 && steady.meanDensity < 0.70;
    console.log(
        `${steadyPass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}` +
        ` (${(steady.survivalRate * 100).toFixed(0)}% survived, density ${(steady.meanDensity * 100).toFixed(0)}%)`
    );
    results.push({ ...steady, pass: steadyPass });

    // Test 2: Margin — 2x spawn rate should overwhelm even the matched bot
    const marginRate = tier.spawnRate * 2;
    process.stdout.write(`    [2/3] Margin (${profile.bot}, ${marginRate.toFixed(1)}/s, ${marginDuration / 1000}s)... `);
    const margin = runTest(
        `${tierName}/margin`,
        tierName,
        { ...tier, spawnRate: marginRate },
        marginDuration,
        seeds,
        vpW, vpH
    );
    const densityIncrease = margin.meanDensity - steady.meanDensity;
    const marginPass = margin.survivalRate <= 0.4 || margin.meanDensity > 0.65 || densityIncrease > 0.10;
    console.log(
        `${marginPass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}` +
        ` (${((1 - margin.survivalRate) * 100).toFixed(0)}% overflowed, density ${(margin.meanDensity * 100).toFixed(0)}%` +
        `, +${(densityIncrease * 100).toFixed(0)}% vs steady)`
    );
    results.push({ ...margin, pass: marginPass });

    // Test 3: Lower-bot-struggles — CALM (random/dumb) bot at this tier's rate
    if (tierName !== 'CALM') {
        process.stdout.write(`    [3/3] Lower-bot (CALM at ${tierName}, ${lowerBotDuration / 1000}s)... `);
        const lower = runTest(
            `${tierName}/lower-bot`,
            'CALM',
            tier,
            lowerBotDuration,
            seeds,
            vpW, vpH
        );
        const densityGap = lower.meanDensity - steady.meanDensity;
        const lowerPass = lower.survivalRate <= 0.6 || densityGap > 0.05;
        console.log(
            `${lowerPass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}` +
            ` (${((1 - lower.survivalRate) * 100).toFixed(0)}% overflowed, density ${(lower.meanDensity * 100).toFixed(0)}%` +
            `, gap +${(densityGap * 100).toFixed(0)}%)`
        );
        results.push({ ...lower, pass: lowerPass });
    } else {
        console.log(`    [3/3] Lower-bot: SKIP (no tier below CALM)`);
        results.push({ test: `${tierName}/lower-bot`, pass: true, skipped: true });
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
    let vpW = 390, vpH = 844;
    if (args.includes('--viewport')) {
        const [w, h] = args[args.indexOf('--viewport') + 1].split('x').map(Number);
        vpW = w; vpH = h;
    }

    const opts = fast ? {
        duration: 120000,
        marginDuration: 120000,
        lowerBotDuration: 120000,
        seeds: [42, 137, 256],
        vpW, vpH,
    } : {
        duration: 600000,
        marginDuration: 600000,
        lowerBotDuration: 300000,
        seeds: [42, 137, 256, 314, 999],
        vpW, vpH,
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  CHAIN REACTION — Difficulty Regression Test`);
    console.log(`  Mode: ${fast ? 'FAST (2min, 3 seeds)' : 'FULL (10min, 5 seeds)'}`);
    console.log(`  Viewport: ${vpW}x${vpH}`);
    console.log(`  Source: game-core.js CONTINUOUS_TIERS + BOT_PROFILES`);
    console.log(`${'='.repeat(60)}\n`);

    const t0 = Date.now();
    const allResults = [];
    let totalTests = 0, totalPass = 0;

    for (const [name, tier] of Object.entries(CONTINUOUS_TIERS)) {
        if (tierFilter && name !== tierFilter) continue;

        const profile = BOT_PROFILES[name];
        console.log(`  ── ${name} (${profile.bot}, ${tier.spawnRate}/s, ${tier.cooldown}ms cd) ──`);
        const results = runTierTests(name, tier, opts);
        allResults.push(...results);

        for (const r of results) {
            totalTests++;
            if (r.pass) totalPass++;
        }
        console.log('');
    }

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
