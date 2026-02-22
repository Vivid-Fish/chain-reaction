#!/usr/bin/env node
'use strict';

// =========================================================================
// VIEWPORT SWEEP — Measure how game difficulty varies across screen sizes.
//
// Runs the same tier + bot + seed at multiple viewport sizes.
// Reports: survival time, overflow rate, chain stats, mean density.
// This tells us empirically whether difficulty is screen-size-invariant.
//
// Usage:
//   node sweep-viewport.js                    # All tiers, greedy bot
//   node sweep-viewport.js --tier SURGE       # Single tier
//   node sweep-viewport.js --bot oracle       # Different bot
//   node sweep-viewport.js --seeds 20         # More seeds for confidence
// =========================================================================

const { Game, Bots, BotRunner, BOT_PROFILES, DEFAULTS, CONTINUOUS_TIERS, createRNG } = require('./game-core.js');

const VIEWPORTS = [
    { label: 'iPhone SE',      w: 375,  h: 667  },
    { label: 'iPhone 14',      w: 390,  h: 844  },
    { label: 'iPad Mini',      w: 744,  h: 1133 },
    { label: 'iPad Pro 11"',   w: 834,  h: 1194 },
    { label: 'Laptop 1080p',   w: 1920, h: 1080 },
    { label: 'Desktop 1440p',  w: 2560, h: 1440 },
];

function runOnce(tier, viewport, bot, seed, duration) {
    const tierCfg = CONTINUOUS_TIERS[tier];
    const gameRng = createRNG(seed);
    const botRng = createRNG(seed + 1);
    const config = { ...DEFAULTS, ...tierCfg };
    const game = new Game(viewport.w, viewport.h, config, gameRng);
    game.startContinuous(tierCfg);

    const skillKey = BOT_PROFILES[bot] ? bot :
        Object.keys(BOT_PROFILES).find(k => BOT_PROFILES[k].bot === bot) || 'FLOW';
    const runner = new BotRunner(game, skillKey, botRng);
    const DT = 16.67;

    while (game.time < duration && !game.overflowed) {
        game.step(DT);
        game.events = [];
        const tap = runner.update(DT);
        if (tap) game.tap(tap.x, tap.y);
    }

    const stats = game.getStats();
    return {
        survived: !game.overflowed,
        duration: stats.duration,
        overflowTime: stats.overflowTime || null,
        taps: stats.totalTaps,
        dotsCaught: stats.totalDotsCaught,
        dotsSpawned: stats.totalDotsSpawned,
        chainCount: stats.chainCount,
        avgChain: stats.avgChainLength,
        maxChain: stats.maxChainLength,
        meanDensity: stats.meanDensity,
        maxDensity: stats.maxDensity,
        score: stats.score,
        explosionRadius: game.explosionRadius,
        area: viewport.w * viewport.h,
    };
}

// --- CLI ---
const args = process.argv.slice(2);
let tierFilter = null;
let bot = 'greedy';
let numSeeds = 10;
let duration = 90000; // 90s

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier') tierFilter = args[++i];
    else if (args[i] === '--bot') bot = args[++i];
    else if (args[i] === '--seeds') numSeeds = parseInt(args[++i]);
    else if (args[i] === '--duration') duration = parseInt(args[++i]) * 1000;
}

const tiers = tierFilter ? [tierFilter] : Object.keys(CONTINUOUS_TIERS);

console.log(`\nVIEWPORT DIFFICULTY SWEEP`);
console.log(`Bot: ${bot} | Seeds: ${numSeeds} | Duration: ${duration/1000}s | Tiers: ${tiers.join(', ')}\n`);

for (const tier of tiers) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`  TIER: ${tier}`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`${'Viewport'.padEnd(16)} ${'Area'.padStart(10)} ${'ExpR'.padStart(5)} ${'Surv%'.padStart(6)} ${'AvgLife'.padStart(8)} ${'AvgChain'.padStart(9)} ${'MaxChain'.padStart(9)} ${'MeanDens'.padStart(9)} ${'Score'.padStart(8)} ${'Caught'.padStart(7)}`);
    console.log(`${'─'.repeat(100)}`);

    for (const vp of VIEWPORTS) {
        let survivals = 0;
        let totalDuration = 0;
        let totalAvgChain = 0;
        let totalMaxChain = 0;
        let totalMeanDensity = 0;
        let totalScore = 0;
        let totalCaught = 0;
        let expR = 0;

        for (let s = 0; s < numSeeds; s++) {
            const r = runOnce(tier, vp, bot, 42 + s, duration);
            if (r.survived) survivals++;
            totalDuration += r.duration;
            totalAvgChain += r.avgChain;
            totalMaxChain += r.maxChain;
            totalMeanDensity += r.meanDensity;
            totalScore += r.score;
            totalCaught += r.dotsCaught;
            expR = r.explosionRadius;
        }

        const n = numSeeds;
        const survPct = ((survivals / n) * 100).toFixed(0);
        const avgLife = (totalDuration / n / 1000).toFixed(1);
        const avgChain = (totalAvgChain / n).toFixed(1);
        const maxChain = (totalMaxChain / n).toFixed(0);
        const meanDens = ((totalMeanDensity / n) * 100).toFixed(1);
        const avgScore = Math.round(totalScore / n);
        const avgCaught = Math.round(totalCaught / n);

        console.log(
            `${vp.label.padEnd(16)} ${(vp.w + 'x' + vp.h).padStart(10)} ${expR.toFixed(0).padStart(5)} ${(survPct + '%').padStart(6)} ${(avgLife + 's').padStart(8)} ${avgChain.padStart(9)} ${maxChain.padStart(9)} ${(meanDens + '%').padStart(9)} ${String(avgScore).padStart(8)} ${String(avgCaught).padStart(7)}`
        );
    }
}

console.log(`\nDone.\n`);
