#!/usr/bin/env node
'use strict';

// =========================================================================
// QUALITY.JS — Game Quality Metrics
//
// Computes metrics that tell us whether a game design is GOOD, not just
// whether bots can survive. These metrics detect:
//   - Missing positive feedback (density should trend up, not plateau)
//   - Lack of mortality (games should eventually end)
//   - Insufficient skill discrimination (better play should matter)
//   - Strategic shallowness (decisions should vary across game states)
//
// Usage:
//   const { computeQuality, compareExperiments } = require('./quality.js');
//   const metrics = computeQuality(runs);  // runs = array from runContinuous
//   const comparison = compareExperiments(baseline, variant);
// =========================================================================

// =========================================================================
// TIER 1: Core Metrics
// =========================================================================

/**
 * Coefficient of variation of survival times.
 * Low CV = deterministic (boring). High CV = chaotic (dramatic).
 * Target: 0.3-0.6
 */
function survivalTimeCV(runs) {
    const times = runs.map(r => r.overflowed ? r.overflowTime : r.duration);
    if (times.length < 2) return 0;
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    if (mean === 0) return 0;
    const variance = times.reduce((a, t) => a + (t - mean) ** 2, 0) / times.length;
    return Math.sqrt(variance) / mean;
}

/**
 * What fraction of games end in death?
 * Target: >0.95 at all tiers for a well-designed endless game.
 * If mortality is low, the game self-stabilizes and "endless" is literal.
 */
function mortalityRate(runs) {
    return runs.filter(r => r.overflowed).length / runs.length;
}

/**
 * Linear regression slope of density over time.
 * Positive = pressure builds (good). Zero/negative = self-stabilizing (bad).
 * Computed from the density history of each run, then averaged.
 */
function densityTrendSlope(runs) {
    const slopes = [];
    for (const r of runs) {
        if (!r.densityHistory || r.densityHistory.length < 4) continue;
        const h = r.densityHistory;
        const n = h.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            const x = h[i].time / 1000; // seconds
            const y = h[i].density;
            sumX += x; sumY += y;
            sumXY += x * y; sumX2 += x * x;
        }
        const denom = n * sumX2 - sumX * sumX;
        if (denom === 0) continue;
        slopes.push((n * sumXY - sumX * sumY) / denom);
    }
    return slopes.length ? slopes.reduce((a, b) => a + b, 0) / slopes.length : 0;
}

/**
 * Ratio of expert survival time to novice survival time.
 * Target: 2x-5x. Too low = skill doesn't matter. Too high = game is unfair.
 */
function skillDiscrimination(expertRuns, noviceRuns) {
    const avgTime = runs => {
        const times = runs.map(r => r.overflowed ? r.overflowTime : r.duration);
        return times.reduce((a, b) => a + b, 0) / times.length;
    };
    const noviceAvg = avgTime(noviceRuns);
    if (noviceAvg === 0) return Infinity;
    return avgTime(expertRuns) / noviceAvg;
}

/**
 * Theoretical minimum chain length needed to sustain.
 * breakEven = spawnRate / tapRate
 * If avg chain >> breakEven, the game is too easy to sustain.
 */
function breakEvenAnalysis(runs, spawnRate, cooldownMs) {
    const tapRate = 1000 / cooldownMs;
    const breakEven = spawnRate / tapRate;
    const avgChain = runs.reduce((a, r) => a + r.avgChainLength, 0) / runs.length;
    return {
        breakEvenChain: breakEven,
        actualAvgChain: avgChain,
        ratio: avgChain / breakEven,  // >1 means sustainable, <1 means unsustainable
    };
}

/**
 * Does density ever recover to low levels mid-game?
 * Counts how many times density drops below 30% after being above 50%.
 * High recovery count = negative feedback (self-stabilizing, bad).
 */
function densityRecoveryCount(runs) {
    let totalRecoveries = 0;
    for (const r of runs) {
        if (!r.densityHistory || r.densityHistory.length < 10) continue;
        let wasAbove50 = false;
        for (const h of r.densityHistory) {
            if (h.density > 0.50) wasAbove50 = true;
            if (wasAbove50 && h.density < 0.30) {
                totalRecoveries++;
                wasAbove50 = false;
            }
        }
    }
    return totalRecoveries / runs.length;
}

/**
 * Measures the "drama" of density trajectory.
 * GEI-inspired: sum of absolute density changes, normalized by game length.
 * Higher = more volatile/dramatic. Lower = flat/boring.
 */
function densityDrama(runs) {
    const dramas = [];
    for (const r of runs) {
        if (!r.densityHistory || r.densityHistory.length < 4) continue;
        const h = r.densityHistory;
        let totalChange = 0;
        for (let i = 1; i < h.length; i++) {
            totalChange += Math.abs(h[i].density - h[i - 1].density);
        }
        const gameLengthSec = (r.overflowed ? r.overflowTime : r.duration) / 1000;
        if (gameLengthSec > 0) dramas.push(totalChange / gameLengthSec);
    }
    return dramas.length ? dramas.reduce((a, b) => a + b, 0) / dramas.length : 0;
}

/**
 * Is density higher in the last third of the game than the first third?
 * Positive = escalating (good). Zero/negative = flat or deescalating (bad).
 */
function densityEscalation(runs) {
    const escalations = [];
    for (const r of runs) {
        if (!r.densityHistory || r.densityHistory.length < 6) continue;
        const h = r.densityHistory;
        const third = Math.floor(h.length / 3);
        const firstThird = h.slice(0, third);
        const lastThird = h.slice(-third);
        const avg = arr => arr.reduce((a, x) => a + x.density, 0) / arr.length;
        escalations.push(avg(lastThird) - avg(firstThird));
    }
    return escalations.length ? escalations.reduce((a, b) => a + b, 0) / escalations.length : 0;
}

// =========================================================================
// COMPOSITE QUALITY SCORE
// =========================================================================

/**
 * Compute all quality metrics from a set of runs.
 * @param {Object} opts - { runs, expertRuns?, noviceRuns?, spawnRate, cooldownMs }
 * @returns {Object} All metrics + overall quality assessment
 */
function computeQuality(opts) {
    const { runs, expertRuns, noviceRuns, spawnRate, cooldownMs } = opts;

    const metrics = {
        survivalTimeCV: survivalTimeCV(runs),
        mortalityRate: mortalityRate(runs),
        densityTrendSlope: densityTrendSlope(runs),
        densityRecoveryCount: densityRecoveryCount(runs),
        densityDrama: densityDrama(runs),
        densityEscalation: densityEscalation(runs),
        breakEven: breakEvenAnalysis(runs, spawnRate, cooldownMs),
    };

    if (expertRuns && noviceRuns) {
        metrics.skillDiscrimination = skillDiscrimination(expertRuns, noviceRuns);
    }

    // Quality flags
    metrics.flags = [];
    if (metrics.mortalityRate < 0.80) metrics.flags.push('LOW_MORTALITY');
    if (metrics.densityTrendSlope <= 0.0001) metrics.flags.push('NO_PRESSURE_BUILDUP');
    if (metrics.densityRecoveryCount > 1.0) metrics.flags.push('SELF_STABILIZING');
    if (metrics.densityEscalation < 0.05) metrics.flags.push('NO_ESCALATION');
    if (metrics.breakEven.ratio > 2.5) metrics.flags.push('TOO_EASY_TO_SUSTAIN');
    if (metrics.survivalTimeCV < 0.15) metrics.flags.push('TOO_DETERMINISTIC');
    if (metrics.survivalTimeCV > 0.8) metrics.flags.push('TOO_CHAOTIC');
    if (metrics.skillDiscrimination !== undefined) {
        if (metrics.skillDiscrimination < 1.3) metrics.flags.push('SKILL_DOESNT_MATTER');
        if (metrics.skillDiscrimination > 8) metrics.flags.push('TOO_PUNISHING_FOR_NOVICE');
    }

    return metrics;
}

/**
 * Compare two experiments and summarize improvements/regressions.
 */
function compareExperiments(baseline, variant) {
    const changes = {};
    const improved = [];
    const regressed = [];

    const compare = (name, base, test, higherIsBetter) => {
        if (base === undefined || test === undefined) return;
        const delta = test - base;
        const pctChange = base !== 0 ? (delta / Math.abs(base)) * 100 : (test !== 0 ? Infinity : 0);
        changes[name] = { baseline: base, variant: test, delta, pctChange };
        if (higherIsBetter ? delta > 0 : delta < 0) improved.push(name);
        else if (higherIsBetter ? delta < 0 : delta > 0) regressed.push(name);
    };

    compare('mortalityRate', baseline.mortalityRate, variant.mortalityRate, true);
    compare('densityTrendSlope', baseline.densityTrendSlope, variant.densityTrendSlope, true);
    compare('densityEscalation', baseline.densityEscalation, variant.densityEscalation, true);
    compare('densityDrama', baseline.densityDrama, variant.densityDrama, true);
    compare('densityRecoveryCount', baseline.densityRecoveryCount, variant.densityRecoveryCount, false);
    compare('breakEvenRatio', baseline.breakEven?.ratio, variant.breakEven?.ratio, false);

    const baseFlags = new Set(baseline.flags || []);
    const variantFlags = new Set(variant.flags || []);
    const flagsFixed = [...baseFlags].filter(f => !variantFlags.has(f));
    const flagsNew = [...variantFlags].filter(f => !baseFlags.has(f));

    return { changes, improved, regressed, flagsFixed, flagsNew };
}

/**
 * Pretty-print quality metrics to console.
 */
function printQuality(metrics, label = '') {
    if (label) console.log(`\n${'='.repeat(60)}\n  ${label}\n${'='.repeat(60)}`);

    console.log(`\n  Survival time CV:     ${metrics.survivalTimeCV.toFixed(3)}` +
        (metrics.survivalTimeCV < 0.15 ? ' [!] too deterministic' :
         metrics.survivalTimeCV > 0.8 ? ' [!] too chaotic' : ' [ok]'));

    console.log(`  Mortality rate:       ${(metrics.mortalityRate * 100).toFixed(0)}%` +
        (metrics.mortalityRate < 0.80 ? ' [!] games dont end' : ' [ok]'));

    console.log(`  Density trend slope:  ${(metrics.densityTrendSlope * 1000).toFixed(3)}/s` +
        (metrics.densityTrendSlope <= 0.0001 ? ' [!] no pressure buildup' : ' [ok]'));

    console.log(`  Density escalation:   ${(metrics.densityEscalation * 100).toFixed(1)}%` +
        (metrics.densityEscalation < 0.05 ? ' [!] no escalation' : ' [ok]'));

    console.log(`  Density recovery:     ${metrics.densityRecoveryCount.toFixed(2)} per game` +
        (metrics.densityRecoveryCount > 1.0 ? ' [!] self-stabilizing' : ' [ok]'));

    console.log(`  Density drama:        ${(metrics.densityDrama * 100).toFixed(2)}/s` +
        ' (higher = more volatile)');

    if (metrics.breakEven) {
        console.log(`  Break-even chain:     ${metrics.breakEven.breakEvenChain.toFixed(1)} (actual: ${metrics.breakEven.actualAvgChain.toFixed(1)}, ratio: ${metrics.breakEven.ratio.toFixed(2)}x)` +
            (metrics.breakEven.ratio > 2.5 ? ' [!] too easy to sustain' : ' [ok]'));
    }

    if (metrics.skillDiscrimination !== undefined) {
        console.log(`  Skill discrimination: ${metrics.skillDiscrimination.toFixed(2)}x` +
            (metrics.skillDiscrimination < 1.3 ? ' [!] skill doesnt matter' :
             metrics.skillDiscrimination > 8 ? ' [!] too punishing' : ' [ok]'));
    }

    if (metrics.flags.length > 0) {
        console.log(`\n  FLAGS: ${metrics.flags.join(', ')}`);
    } else {
        console.log(`\n  No quality flags — all metrics in healthy range`);
    }
}

/**
 * Pretty-print comparison between baseline and variant.
 */
function printComparison(comparison) {
    console.log('\n  COMPARISON:');
    for (const [name, c] of Object.entries(comparison.changes)) {
        const arrow = c.delta > 0 ? '\x1b[32m+' : c.delta < 0 ? '\x1b[31m' : '';
        console.log(`    ${name.padEnd(24)} ${c.baseline.toFixed(4)} → ${c.variant.toFixed(4)} (${arrow}${c.pctChange.toFixed(0)}%\x1b[0m)`);
    }
    if (comparison.flagsFixed.length) console.log(`  \x1b[32mFixed:\x1b[0m ${comparison.flagsFixed.join(', ')}`);
    if (comparison.flagsNew.length) console.log(`  \x1b[31mNew issues:\x1b[0m ${comparison.flagsNew.join(', ')}`);
}

// =========================================================================
// EXPORTS
// =========================================================================

module.exports = {
    computeQuality,
    compareExperiments,
    printQuality,
    printComparison,
    // Individual metrics for custom use
    survivalTimeCV,
    mortalityRate,
    densityTrendSlope,
    skillDiscrimination,
    breakEvenAnalysis,
    densityRecoveryCount,
    densityDrama,
    densityEscalation,
};
