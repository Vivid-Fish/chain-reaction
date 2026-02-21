#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Continuous Play Difficulty Calibration
//
// Binary-searches spawn rate per bot type to find parameters where the bot
// achieves steady-state at ~90% of critical density (thin survival margin).
//
// For each tier (bot), finds:
//   - The spawn rate where the bot SURVIVES 600s (just barely)
//   - The spawn rate where the bot OVERFLOWS within 600s (margin test)
//
// Outputs tier parameters for use in difficulty-regression.js.
//
// Usage:
//   node calibrate-continuous.js              # Calibrate all tiers
//   node calibrate-continuous.js --bot greedy  # Single bot
//   node calibrate-continuous.js --fast         # Faster (fewer trials)
// =========================================================================

const { ContinuousSimulation, ContinuousBots, runContinuous, CONTINUOUS_DEFAULTS } = require('./continuous-sim.js');

// --- Tier definitions (initial guesses, calibration will refine spawnRate) ---
const TIER_DEFS = {
    CALM: {
        bot: 'random',
        speedMin: 0.4, speedMax: 0.8,
        dotTypes: { standard: 1.0 },
        tapCooldown: 1500,
        maxDots: 80,
        overflowDensity: 0.8,
    },
    FLOW: {
        bot: 'humanSim',
        speedMin: 0.5, speedMax: 1.0,
        dotTypes: { standard: 0.85, gravity: 0.15 },
        tapCooldown: 2000,
        maxDots: 90,
        overflowDensity: 0.8,
    },
    SURGE: {
        bot: 'greedy',
        speedMin: 0.6, speedMax: 1.2,
        dotTypes: { standard: 0.70, gravity: 0.20, volatile: 0.10 },
        tapCooldown: 2500,
        maxDots: 100,
        overflowDensity: 0.8,
    },
    TRANSCENDENCE: {
        bot: 'oracle',
        speedMin: 0.7, speedMax: 1.4,
        dotTypes: { standard: 0.50, gravity: 0.25, volatile: 0.25 },
        tapCooldown: 2000,
        maxDots: 60,             // lower cap = tighter overflow = skill differentiates
        overflowDensity: 0.8,
    },
};

/**
 * Test if a bot survives for `duration` ms at a given spawn rate.
 * Returns { survived, stats } averaged over multiple seeds.
 */
function testSurvival(tierDef, spawnRate, duration, seeds) {
    let survivals = 0;
    let totalMeanDensity = 0;
    let totalMaxDensity = 0;
    const allStats = [];

    for (const seed of seeds) {
        const config = {
            ...tierDef,
            spawnRate,
            spawnAccel: 0, // constant rate for calibration
        };
        const stats = runContinuous({
            bot: tierDef.bot,
            duration,
            width: 390,
            height: 844,
            config,
            seed,
        });
        allStats.push(stats);
        if (!stats.overflowed) survivals++;
        totalMeanDensity += stats.meanDensity;
        totalMaxDensity += stats.maxDensity;
    }

    const n = seeds.length;
    return {
        survivalRate: survivals / n,
        survived: survivals / n >= 0.8, // 80%+ survival = "survives"
        meanDensity: totalMeanDensity / n,
        maxDensity: totalMaxDensity / n,
        avgChainLen: allStats.reduce((s, st) => s + st.avgChainLength, 0) / n,
        avgScore: allStats.reduce((s, st) => s + st.score, 0) / n,
        avgTaps: allStats.reduce((s, st) => s + st.totalTaps, 0) / n,
    };
}

/**
 * Binary search for the highest spawn rate where the bot survives.
 * Returns { spawnRate, stats }
 */
function calibrateTier(tierName, tierDef, opts = {}) {
    const {
        duration = 600000,  // 600s
        seeds = [42, 137, 256, 314, 999],
        lowRate = 0.5,
        highRate = 8.0,
        tolerance = 0.1,    // stop when range < 0.1 dots/s
    } = opts;

    let lo = lowRate, hi = highRate;
    let bestRate = lo, bestResult = null;
    let iterations = 0;

    process.stdout.write(`  ${tierName} (${tierDef.bot}): `);

    while (hi - lo > tolerance && iterations < 20) {
        const mid = (lo + hi) / 2;
        const result = testSurvival(tierDef, mid, duration, seeds);
        iterations++;

        process.stdout.write(`${mid.toFixed(1)}(${result.survived ? 'OK' : 'OVF'}) `);

        if (result.survived) {
            bestRate = mid;
            bestResult = result;
            lo = mid; // can go higher
        } else {
            hi = mid; // too fast
        }
    }

    // Final verification at best rate
    if (!bestResult) {
        bestResult = testSurvival(tierDef, bestRate, duration, seeds);
    }

    // Also find the "margin" rate (1.1x) overflow behavior
    const marginRate = bestRate * 1.1;
    const marginResult = testSurvival(tierDef, marginRate, duration, seeds);

    console.log(`→ ${bestRate.toFixed(2)}/s (density: ${(bestResult.meanDensity * 100).toFixed(0)}%, margin OVF: ${marginResult.survived ? 'NO' : 'YES'})`);

    return {
        tier: tierName,
        bot: tierDef.bot,
        spawnRate: Math.round(bestRate * 100) / 100,
        marginRate: Math.round(marginRate * 100) / 100,
        stats: bestResult,
        marginOverflows: !marginResult.survived,
        config: {
            ...tierDef,
            spawnRate: Math.round(bestRate * 100) / 100,
            spawnAccel: 0,
        },
    };
}

// =========================================================================
// CLI
// =========================================================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const fast = args.includes('--fast');
    const botFilter = args.includes('--bot') ? args[args.indexOf('--bot') + 1] : null;

    const duration = fast ? 120000 : 600000; // 2min fast, 10min normal
    const seeds = fast ? [42, 137, 256] : [42, 137, 256, 314, 999];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  CHAIN REACTION — Difficulty Calibration`);
    console.log(`  Mode: ${fast ? 'FAST (2min, 3 seeds)' : 'FULL (10min, 5 seeds)'}`);
    console.log(`${'='.repeat(60)}\n`);

    const t0 = Date.now();
    const results = {};

    for (const [name, def] of Object.entries(TIER_DEFS)) {
        if (botFilter && def.bot !== botFilter) continue;
        results[name] = calibrateTier(name, def, { duration, seeds });
    }

    // Summary table
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  CALIBRATED TIER PARAMETERS');
    console.log(`${'─'.repeat(60)}`);
    console.log('  Tier            Bot        Rate   Cooldown  MaxDots  Density  Margin');
    console.log('  ' + '─'.repeat(56));

    for (const [name, r] of Object.entries(results)) {
        const def = TIER_DEFS[name];
        console.log(
            `  ${name.padEnd(16)} ${r.bot.padEnd(10)} ${r.spawnRate.toFixed(1).padStart(5)}/s` +
            `  ${(def.tapCooldown / 1000).toFixed(1)}s`.padStart(9) +
            `  ${def.maxDots}`.padStart(8) +
            `  ${(r.stats.meanDensity * 100).toFixed(0)}%`.padStart(8) +
            `  ${r.marginOverflows ? 'PASS' : 'FAIL'}`.padStart(7)
        );
    }

    // Output as JS constant for difficulty-regression.js
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  CALIBRATED_TIERS (copy to difficulty-regression.js):');
    console.log(`${'─'.repeat(60)}`);
    console.log('const CALIBRATED_TIERS = {');
    for (const [name, r] of Object.entries(results)) {
        const def = TIER_DEFS[name];
        const types = JSON.stringify(def.dotTypes);
        console.log(`    ${name}: {`);
        console.log(`        bot: '${r.bot}',`);
        console.log(`        spawnRate: ${r.spawnRate},`);
        console.log(`        speedMin: ${def.speedMin}, speedMax: ${def.speedMax},`);
        console.log(`        dotTypes: ${types},`);
        console.log(`        tapCooldown: ${def.tapCooldown},`);
        console.log(`        maxDots: ${def.maxDots},`);
        console.log(`        overflowDensity: ${def.overflowDensity},`);
        console.log(`    },`);
    }
    console.log('};');

    console.log(`\n  Total calibration time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}
