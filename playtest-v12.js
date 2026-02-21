#!/usr/bin/env node
'use strict';

// =========================================================================
// FULL-GAME BOT PLAYTEST — v12 Celebration Verification
//
// Simulates complete multi-round sessions with greedy + random bots.
// Tracks: celebrations triggered, multipliers hit, round clears, scores.
// Validates that celebrations scale correctly with round difficulty.
// =========================================================================

const { Simulation, DEFAULT_CONFIG, getRoundParams, getMultiplier, Bots, createRNG } = require('./sim.js');

// Mirror engine.js v12.1 celebration thresholds (recalibrated from bot playtest)
const CELEBRATIONS = [
    { pct: 0.25, text: 'NICE!' },
    { pct: 0.40, text: 'AMAZING!' },
    { pct: 0.55, text: 'INCREDIBLE!' },
    { pct: 0.70, text: 'LEGENDARY!' },
    { pct: 0.85, text: 'GODLIKE!' },
];

const MULT_THRESHOLDS = [
    { pct: 0.00, mult: 1 }, { pct: 0.10, mult: 2 },
    { pct: 0.20, mult: 3 }, { pct: 0.35, mult: 4 },
    { pct: 0.50, mult: 5 }, { pct: 0.75, mult: 8 },
];

const W = 390, H = 844; // iPhone viewport
const MAX_ROUND = 25;
const SESSIONS = 50;

function getCelebrations(chainCount, totalDots) {
    const triggered = [];
    for (const cel of CELEBRATIONS) {
        const threshold = Math.ceil(cel.pct * totalDots);
        if (chainCount >= threshold && totalDots > 0) {
            triggered.push(cel.text);
        }
    }
    return triggered;
}

function getMaxMult(chainCount, totalDots) {
    let m = 1;
    for (const t of MULT_THRESHOLDS) {
        const threshold = Math.ceil(t.pct * totalDots);
        if (chainCount >= threshold) m = t.mult;
    }
    return m;
}

// Run a full game session with a given bot strategy
function playFullGame(botName, botFn, seed) {
    const sim = new Simulation(W, H, DEFAULT_CONFIG, seed);
    const rounds = [];
    let totalScore = 0;

    for (let round = 1; round <= MAX_ROUND; round++) {
        const params = sim.setupRound(round);
        const totalDots = sim.totalDots;

        // Bot picks tap location
        const tap = botFn(sim);

        // If bot needs delay (humanSim), advance dots first
        if (tap.delay) {
            const DT = 16.67;
            for (let t = 0; t < tap.delay; t += DT) sim.step(DT);
        }

        sim.tap(tap.x, tap.y);
        sim.resolveChain();

        const caught = sim.chainCount;
        const clearPct = totalDots > 0 ? caught / totalDots : 0;
        const celebrations = getCelebrations(caught, totalDots);
        const maxMult = getMaxMult(caught, totalDots);
        const passed = caught >= params.target;

        rounds.push({
            round,
            totalDots,
            target: params.target,
            caught,
            clearPct: (clearPct * 100).toFixed(1) + '%',
            score: sim.score,
            maxMult,
            celebrations,
            passed,
        });

        totalScore += sim.score;

        if (!passed) break; // Game over
    }

    return { botName, seed, rounds, totalScore, maxRound: rounds.length };
}

// =========================================================================
// MAIN
// =========================================================================

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  CHAIN REACTION v12 — Full-Game Bot Playtest               ║');
console.log('║  Verifying percentage-based celebrations & multipliers      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// --- Show the thresholds table ---
console.log('  CELEBRATION THRESHOLDS (v12 — percentage-based):');
console.log('  ┌─────────────────┬─────────┬──────────────────────────────┐');
console.log('  │ Celebration     │ % Reqd  │ Dots needed @ R1/R5/R10/R20 │');
console.log('  ├─────────────────┼─────────┼──────────────────────────────┤');
for (const cel of CELEBRATIONS) {
    const r1 = getRoundParams(1, DEFAULT_CONFIG).dots;
    const r5 = getRoundParams(5, DEFAULT_CONFIG).dots;
    const r10 = getRoundParams(10, DEFAULT_CONFIG).dots;
    const r20 = getRoundParams(20, DEFAULT_CONFIG).dots;
    const d1 = Math.ceil(cel.pct * r1);
    const d5 = Math.ceil(cel.pct * r5);
    const d10 = Math.ceil(cel.pct * r10);
    const d20 = Math.ceil(cel.pct * r20);
    console.log(`  │ ${cel.text.padEnd(15)} │ ${(cel.pct * 100).toFixed(0).padStart(5)}%  │ ${String(d1).padStart(3)}/${String(d5).padStart(3)}/${String(d10).padStart(3)}/${String(d20).padStart(3)}${' '.repeat(18)} │`);
}
console.log('  └─────────────────┴─────────┴──────────────────────────────┘');

// Show round parameters
console.log('\n  ROUND PARAMETERS:');
console.log('  ┌───────┬──────┬────────┬──────────┬────────────┐');
console.log('  │ Round │ Dots │ Target │ Tgt %    │ Speed      │');
console.log('  ├───────┼──────┼────────┼──────────┼────────────┤');
for (let r = 1; r <= 20; r++) {
    const p = getRoundParams(r, DEFAULT_CONFIG);
    console.log(`  │ R${String(r).padStart(2)}   │ ${String(p.dots).padStart(4)} │ ${String(p.target).padStart(6)} │ ${(p.pct * 100).toFixed(1).padStart(6)}%  │ ${p.speedMin.toFixed(1)}-${p.speedMax.toFixed(1)}    │`);
}
console.log('  └───────┴──────┴────────┴──────────┴────────────┘');

// --- Run sessions ---
const bots = [
    { name: 'Random', fn: (sim) => Bots.random(sim), sessions: SESSIONS },
    { name: 'Greedy', fn: (sim) => Bots.greedy(sim), sessions: SESSIONS },
    { name: 'HumanSim', fn: (sim) => Bots.humanSim(sim), sessions: SESSIONS },
    { name: 'Oracle', fn: (sim) => Bots.oracle(sim, 5, 15), sessions: 20 },  // fewer — oracle is slow
];

for (const bot of bots) {
    const botSessions = bot.sessions || SESSIONS;
    console.log(`\n${'═'.repeat(64)}`);
    console.log(`  BOT: ${bot.name} — ${botSessions} full-game sessions`);
    console.log('═'.repeat(64));

    // Aggregate stats
    const celebCounts = {};
    for (const c of CELEBRATIONS) celebCounts[c.text] = 0;
    const roundReached = [];
    const roundClearRates = {};  // round -> [cleared, total]
    const roundCelebrations = {}; // round -> {celName: count}
    let totalSessions = 0;
    const chainPcts = {};  // round -> [clearPct, clearPct, ...]

    for (let s = 0; s < botSessions; s++) {
        const result = playFullGame(bot.name, bot.fn, 1000 + s);
        roundReached.push(result.maxRound);
        totalSessions++;

        for (const rd of result.rounds) {
            if (!roundClearRates[rd.round]) roundClearRates[rd.round] = [0, 0];
            roundClearRates[rd.round][1]++;
            if (rd.passed) roundClearRates[rd.round][0]++;

            if (!roundCelebrations[rd.round]) {
                roundCelebrations[rd.round] = {};
                for (const c of CELEBRATIONS) roundCelebrations[rd.round][c.text] = 0;
            }

            for (const celName of rd.celebrations) {
                celebCounts[celName]++;
                roundCelebrations[rd.round][celName]++;
            }

            if (!chainPcts[rd.round]) chainPcts[rd.round] = [];
            chainPcts[rd.round].push(rd.caught / rd.totalDots);
        }
    }

    // Print sample game (first session, detailed)
    const sample = playFullGame(bot.name, bot.fn, 1000);
    console.log(`\n  SAMPLE GAME (seed 1000):`);
    console.log('  ┌───────┬──────┬────────┬────────┬──────┬──────────┬──────────────────────────┐');
    console.log('  │ Round │ Dots │ Caught │ Clear% │ Mult │ Score    │ Celebrations             │');
    console.log('  ├───────┼──────┼────────┼────────┼──────┼──────────┼──────────────────────────┤');
    for (const rd of sample.rounds) {
        const celStr = rd.celebrations.length > 0 ? rd.celebrations.join(', ') : '—';
        const passIcon = rd.passed ? '✓' : '✗';
        console.log(`  │ R${String(rd.round).padStart(2)} ${passIcon} │ ${String(rd.totalDots).padStart(4)} │ ${String(rd.caught).padStart(6)} │ ${rd.clearPct.padStart(6)} │ ${String(rd.maxMult).padStart(4)}x │ ${String(rd.score).padStart(8)} │ ${celStr.padEnd(24)} │`);
    }
    console.log('  └───────┴──────┴────────┴────────┴──────┴──────────┴──────────────────────────┘');
    console.log(`  Final: Round ${sample.maxRound}, Total Score: ${sample.totalScore}`);

    // Print aggregate: round clear rates + celebration frequency
    console.log(`\n  AGGREGATE (${botSessions} sessions):`);
    console.log(`  Rounds reached: min=${Math.min(...roundReached)}, median=${roundReached.sort((a,b)=>a-b)[Math.floor(botSessions/2)]}, max=${Math.max(...roundReached)}`);

    console.log('\n  Per-Round Clear Rate + Celebration Frequency:');
    console.log('  ┌───────┬───────────┬─────────┬──────────┬─────────────┬───────────┬──────────┐');
    console.log('  │ Round │ Clear Rate│ NICE!   │ AMAZING! │ INCREDIBLE! │ LEGENDARY!│ GODLIKE! │');
    console.log('  ├───────┼───────────┼─────────┼──────────┼─────────────┼───────────┼──────────┤');
    const maxRd = Math.max(...Object.keys(roundClearRates).map(Number));
    for (let r = 1; r <= Math.min(maxRd, 20); r++) {
        if (!roundClearRates[r]) continue;
        const [cleared, total] = roundClearRates[r];
        const rate = ((cleared / total) * 100).toFixed(0) + '%';
        const rc = roundCelebrations[r] || {};
        const nice = rc['NICE!'] || 0;
        const amaz = rc['AMAZING!'] || 0;
        const incr = rc['INCREDIBLE!'] || 0;
        const lege = rc['LEGENDARY!'] || 0;
        const god = rc['GODLIKE!'] || 0;
        const pctOf = (n) => total > 0 ? `${n}/${total} ${((n/total)*100).toFixed(0)}%` : '—';
        console.log(`  │ R${String(r).padStart(2)}   │ ${rate.padStart(9)} │ ${pctOf(nice).padStart(7)} │ ${pctOf(amaz).padStart(8)} │ ${pctOf(incr).padStart(11)} │ ${pctOf(lege).padStart(9)} │ ${pctOf(god).padStart(8)} │`);
    }
    console.log('  └───────┴───────────┴─────────┴──────────┴─────────────┴───────────┴──────────┘');

    // Chain % distribution per round
    console.log('\n  CHAIN CLEAR % DISTRIBUTION (median / p75 / p90 / max):');
    for (let r = 1; r <= Math.min(maxRd, 15); r++) {
        if (!chainPcts[r] || chainPcts[r].length < 3) continue;
        const sorted = chainPcts[r].sort((a, b) => a - b);
        const p = (frac) => sorted[Math.floor(frac * sorted.length)] || sorted[sorted.length - 1];
        const fmt = (v) => (v * 100).toFixed(0).padStart(3) + '%';
        const n = sorted.length;
        console.log(`    R${String(r).padStart(2)}: median=${fmt(p(0.5))} p75=${fmt(p(0.75))} p90=${fmt(p(0.9))} max=${fmt(sorted[n-1])} (n=${n})`);
    }

    // Overall celebration totals
    console.log('\n  TOTAL CELEBRATIONS across all rounds:');
    for (const [name, count] of Object.entries(celebCounts)) {
        const totalRounds = Object.values(roundClearRates).reduce((s, [_, t]) => s + t, 0);
        console.log(`    ${name.padEnd(15)} ${count} times (${((count / totalRounds) * 100).toFixed(1)}% of all rounds played)`);
    }
}

console.log('\n' + '═'.repeat(64));
console.log('  VERDICT');
console.log('═'.repeat(64));
console.log('  Key checks:');
console.log('  1. LEGENDARY! and GODLIKE! should be RARE (< 5% of rounds for greedy)');
console.log('  2. NICE! should fire often at low rounds, less at high rounds');
console.log('  3. Greedy bot should NOT clear R20+ consistently');
console.log('  4. Random bot should fail early (R1-R3)');
console.log('  5. Multiplier 8x should be extremely rare');
console.log('');
