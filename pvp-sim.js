#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — PvP Simulation (Headless)
//
// Two Game instances + BotRunners in a shared loop with garbage system.
// No server, no UI — pure game logic for tuning garbage parameters.
//
// Garbage system:
//   1. When a chain ends, garbage dots are generated (quadratic in chain length)
//   2. Garbage is queued with a delay before spawning
//   3. Defender's chain can offset (cancel) queued garbage
//   4. Surplus garbage from offset is sent back as counter-attack
//
// Usage:
//   node pvp-sim.js                              # Quick demo
//   node pvp-sim.js --a IMPOSSIBLE --b FLOW      # Skill matchup
//   node pvp-sim.js --sweep-divisor              # Tune garbageDivisor
//   node pvp-sim.js --ladder                     # Full bot ladder
// =========================================================================

const { Game, BotRunner, BOT_PROFILES, CONTINUOUS_TIERS, createRNG } = require('./game-core.js');
const { CONTINUOUS_DEFAULTS } = require('./continuous-sim.js');

// =========================================================================
// PVP CONFIG
// =========================================================================

const PVP_DEFAULTS = {
    garbageDivisor: 9,        // chainLength² / divisor = garbage sent
    garbageDelay: 1500,       // ms before queued garbage spawns
    garbageSpeedMult: 1.0,    // speed multiplier for garbage dots
    garbageRadiusMult: 0.7,   // explosion radius multiplier for garbage cascades
    garbageChainSends: false, // if true, chaining garbage dots also sends garbage
    maxPendingGarbage: 30,    // cap on queued garbage to prevent instant death
    tier: 'FLOW',             // game tier for both players
};

// =========================================================================
// GARBAGE QUEUE
// =========================================================================

class GarbageQueue {
    constructor() {
        this.pending = [];  // { amount, spawnTime }
        this.totalSent = 0;
        this.totalReceived = 0;
        this.totalOffset = 0;
    }

    /** Queue garbage to arrive at spawnTime */
    queue(amount, spawnTime) {
        if (amount <= 0) return;
        this.pending.push({ amount, spawnTime });
        this.totalSent += amount;
    }

    /** Offset: cancel pending garbage, return surplus */
    offset(chainGarbage) {
        let remaining = chainGarbage;
        // Cancel oldest pending first
        for (let i = 0; i < this.pending.length && remaining > 0; i++) {
            const cancel = Math.min(this.pending[i].amount, remaining);
            this.pending[i].amount -= cancel;
            remaining -= cancel;
            this.totalOffset += cancel;
        }
        // Remove fully cancelled entries
        this.pending = this.pending.filter(p => p.amount > 0);
        return remaining; // surplus to send back
    }

    /** Get garbage that should spawn now, remove from queue */
    getReady(currentTime) {
        let total = 0;
        this.pending = this.pending.filter(p => {
            if (currentTime >= p.spawnTime) {
                total += p.amount;
                return false;
            }
            return true;
        });
        this.totalReceived += total;
        return total;
    }

    /** Total pending garbage amount */
    pendingTotal() {
        return this.pending.reduce((a, p) => a + p.amount, 0);
    }
}

// =========================================================================
// GARBAGE FORMULA
// =========================================================================

/** Calculate garbage dots from a chain length */
function calcGarbage(chainLength, divisor) {
    if (chainLength < 2) return 0;
    return Math.floor(chainLength * chainLength / divisor);
}

// =========================================================================
// PVP MATCH
// =========================================================================

function toTierConfig(cfg) {
    return {
        spawnRate: cfg.spawnRate || 2.5,
        spawnAccel: 0,
        cooldown: cfg.cooldown || 2000,
        maxDots: cfg.maxDots || 100,
        speedMin: cfg.speedMin || 0.5,
        speedMax: cfg.speedMax || 1.0,
        dotTypes: cfg.dotTypes || { standard: 1.0 },
        overflowDensity: cfg.overflowDensity || 0.8,
        spawnDensityScale: cfg.spawnDensityScale || 0,
    };
}

/**
 * Run a PvP match between two bots.
 *
 * @param {object} opts
 * @param {string} opts.botA - Skill key for player A
 * @param {string} opts.botB - Skill key for player B
 * @param {string} opts.tier - Tier name (both players use same tier)
 * @param {number} opts.maxDuration - Max game time in ms
 * @param {number} opts.seed - RNG seed
 * @param {object} opts.pvpConfig - Override PVP_DEFAULTS
 * @returns {object} Match result
 */
function runPvpMatch(opts) {
    const {
        botA = 'FLOW',
        botB = 'FLOW',
        tier = 'FLOW',
        maxDuration = 300000,
        seed = 42,
        width = 390,
        height = 844,
        pvpConfig = {},
    } = opts;

    const cfg = { ...PVP_DEFAULTS, ...pvpConfig };
    const tierConfig = CONTINUOUS_TIERS[tier];
    if (!tierConfig) throw new Error(`Unknown tier: ${tier}`);

    // Create two independent games with separate RNGs
    const gameA = new Game(width, height, { ...CONTINUOUS_DEFAULTS, ...tierConfig }, createRNG(seed));
    const gameB = new Game(width, height, { ...CONTINUOUS_DEFAULTS, ...tierConfig }, createRNG(seed + 1000));
    gameA.startContinuous(toTierConfig(tierConfig));
    gameB.startContinuous(toTierConfig(tierConfig));

    const runnerA = new BotRunner(gameA, botA, createRNG(seed + 1));
    const runnerB = new BotRunner(gameB, botB, createRNG(seed + 1001));

    const queueA = new GarbageQueue(); // garbage queued FOR player A
    const queueB = new GarbageQueue(); // garbage queued FOR player B

    const DT = 16.67;
    let prevChainCountA = 0, prevChainCountB = 0;
    let totalGarbageSentA = 0, totalGarbageSentB = 0;

    while (gameA.time < maxDuration && !gameA.overflowed && !gameB.overflowed) {
        // Step both games
        gameA.step(DT);
        gameB.step(DT);
        gameA.events = [];
        gameB.events = [];

        // Bot decisions
        const tapA = runnerA.update(DT);
        if (tapA) {
            gameA.tap(tapA.x, tapA.y);
        }
        const tapB = runnerB.update(DT);
        if (tapB) {
            gameB.tap(tapB.x, tapB.y);
        }

        // Check for chain completions (new entries in chainLengths)
        if (gameA.chainLengths.length > prevChainCountA) {
            const chainLen = gameA.chainLengths[gameA.chainLengths.length - 1];
            const rawGarbage = calcGarbage(chainLen, cfg.garbageDivisor);

            // Offset: A's chain first cancels A's incoming garbage
            const surplus = queueA.offset(rawGarbage);

            // Surplus goes to B as garbage
            if (surplus > 0) {
                const capped = Math.min(surplus, cfg.maxPendingGarbage - queueB.pendingTotal());
                if (capped > 0) {
                    queueB.queue(capped, gameA.time + cfg.garbageDelay);
                    totalGarbageSentA += capped;
                }
            }
            prevChainCountA = gameA.chainLengths.length;
        }

        if (gameB.chainLengths.length > prevChainCountB) {
            const chainLen = gameB.chainLengths[gameB.chainLengths.length - 1];
            const rawGarbage = calcGarbage(chainLen, cfg.garbageDivisor);

            const surplus = queueB.offset(rawGarbage);

            if (surplus > 0) {
                const capped = Math.min(surplus, cfg.maxPendingGarbage - queueA.pendingTotal());
                if (capped > 0) {
                    queueA.queue(capped, gameB.time + cfg.garbageDelay);
                    totalGarbageSentB += capped;
                }
            }
            prevChainCountB = gameB.chainLengths.length;
        }

        // Spawn ready garbage on each board
        const garbageForA = queueA.getReady(gameA.time);
        for (let i = 0; i < garbageForA && gameA.activeDotCount() < tierConfig.maxDots; i++) {
            gameA._spawnOneDot(); // Garbage dots spawn like normal dots
        }

        const garbageForB = queueB.getReady(gameB.time);
        for (let i = 0; i < garbageForB && gameB.activeDotCount() < tierConfig.maxDots; i++) {
            gameB._spawnOneDot();
        }
    }

    const statsA = gameA.getStats();
    const statsB = gameB.getStats();

    let winner;
    if (gameA.overflowed && gameB.overflowed) {
        winner = 'draw';
    } else if (gameA.overflowed) {
        winner = 'B';
    } else if (gameB.overflowed) {
        winner = 'A';
    } else {
        // Time out — higher score wins
        winner = statsA.score > statsB.score ? 'A' : statsB.score > statsA.score ? 'B' : 'draw';
    }

    return {
        winner,
        duration: Math.min(statsA.duration, statsB.duration),
        playerA: {
            bot: botA,
            ...statsA,
            garbageSent: totalGarbageSentA,
            garbageReceived: queueA.totalReceived,
            garbageOffset: queueA.totalOffset,
        },
        playerB: {
            bot: botB,
            ...statsB,
            garbageSent: totalGarbageSentB,
            garbageReceived: queueB.totalReceived,
            garbageOffset: queueB.totalOffset,
        },
    };
}

// =========================================================================
// MATCH SERIES
// =========================================================================

function runSeries(opts, numGames = 20) {
    const seeds = Array.from({ length: numGames }, (_, i) => i + 1);
    let winsA = 0, winsB = 0, draws = 0;
    let totalDuration = 0;
    let totalGarbageA = 0, totalGarbageB = 0;
    let totalOffsetA = 0, totalOffsetB = 0;

    for (const seed of seeds) {
        const result = runPvpMatch({ ...opts, seed });
        if (result.winner === 'A') winsA++;
        else if (result.winner === 'B') winsB++;
        else draws++;
        totalDuration += result.duration;
        totalGarbageA += result.playerA.garbageSent;
        totalGarbageB += result.playerB.garbageSent;
        totalOffsetA += result.playerA.garbageOffset;
        totalOffsetB += result.playerB.garbageOffset;
    }

    const n = numGames;
    const totalGarbage = totalGarbageA + totalGarbageB;
    const totalOffset = totalOffsetA + totalOffsetB;

    return {
        winsA, winsB, draws,
        winRateA: winsA / n,
        winRateB: winsB / n,
        avgDuration: totalDuration / n / 1000,
        avgGarbagePerGame: totalGarbage / n,
        offsetRate: totalGarbage > 0 ? totalOffset / totalGarbage : 0,
        avgGarbageA: totalGarbageA / n,
        avgGarbageB: totalGarbageB / n,
    };
}

// =========================================================================
// CLI
// =========================================================================

if (require.main === module) {
    const args = process.argv.slice(2);
    let botA = 'FLOW', botB = 'FLOW';
    let tier = 'FLOW';
    let numGames = 20;
    let pvpConfig = {};
    let mode = 'match';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--a') botA = args[++i];
        else if (args[i] === '--b') botB = args[++i];
        else if (args[i] === '--tier') tier = args[++i];
        else if (args[i] === '--games') numGames = parseInt(args[++i]);
        else if (args[i] === '--divisor') pvpConfig.garbageDivisor = parseFloat(args[++i]);
        else if (args[i] === '--delay') pvpConfig.garbageDelay = parseInt(args[++i]);
        else if (args[i] === '--sweep-divisor') mode = 'sweep-divisor';
        else if (args[i] === '--ladder') mode = 'ladder';
        else if (args[i] === '--fast') numGames = 10;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  CHAIN REACTION — PvP Simulation`);
    console.log(`${'='.repeat(60)}\n`);

    const t0 = Date.now();

    if (mode === 'sweep-divisor') {
        // Sweep garbageDivisor to find balanced settings
        const divisors = [3, 5, 7, 9, 12, 15, 20];
        console.log(`  Sweeping garbageDivisor: [${divisors.join(', ')}]`);
        console.log(`  ${numGames} games per setting, tier: ${tier}\n`);

        console.log('  Divisor | A WinRate | B WinRate | Draws | AvgLen(s) | Garbage/g | Offset%');
        console.log('  ' + '-'.repeat(80));

        for (const div of divisors) {
            const result = runSeries({
                botA: 'IMPOSSIBLE', botB: 'FLOW',
                tier, pvpConfig: { ...pvpConfig, garbageDivisor: div },
            }, numGames);

            console.log(
                '  ' + div.toString().padEnd(8) + '| ' +
                ((result.winRateA * 100).toFixed(0) + '%').padEnd(10) + '| ' +
                ((result.winRateB * 100).toFixed(0) + '%').padEnd(10) + '| ' +
                ((result.draws).toString()).padEnd(6) + '| ' +
                result.avgDuration.toFixed(1).padEnd(10) + '| ' +
                result.avgGarbagePerGame.toFixed(1).padEnd(10) + '| ' +
                (result.offsetRate * 100).toFixed(0) + '%'
            );
        }
    } else if (mode === 'ladder') {
        // Full bot ladder
        const bots = ['CALM', 'FLOW', 'SURGE', 'TRANSCENDENCE', 'IMPOSSIBLE'];
        console.log(`  Bot ladder at tier ${tier}, ${numGames} games per matchup`);
        console.log(`  garbageDivisor: ${pvpConfig.garbageDivisor || PVP_DEFAULTS.garbageDivisor}\n`);

        // Header
        process.stdout.write('  ' + ''.padEnd(16));
        for (const b of bots) process.stdout.write(b.substring(0, 5).padEnd(8));
        console.log('');
        console.log('  ' + '-'.repeat(16 + bots.length * 8));

        for (const a of bots) {
            process.stdout.write('  ' + a.padEnd(16));
            for (const b of bots) {
                if (a === b) {
                    process.stdout.write('  ---  ');
                    continue;
                }
                const result = runSeries({
                    botA: a, botB: b, tier,
                    pvpConfig,
                }, numGames);
                process.stdout.write(((result.winRateA * 100).toFixed(0) + '%').padEnd(8));
            }
            console.log('');
        }
    } else {
        // Single matchup
        console.log(`  ${botA} vs ${botB} at tier ${tier}`);
        console.log(`  ${numGames} games, divisor: ${pvpConfig.garbageDivisor || PVP_DEFAULTS.garbageDivisor}\n`);

        const result = runSeries({ botA, botB, tier, pvpConfig }, numGames);

        console.log(`  Results:`);
        console.log(`    ${botA} wins: ${result.winsA} (${(result.winRateA * 100).toFixed(0)}%)`);
        console.log(`    ${botB} wins: ${result.winsB} (${(result.winRateB * 100).toFixed(0)}%)`);
        console.log(`    Draws: ${result.draws}`);
        console.log(`    Avg game length: ${result.avgDuration.toFixed(1)}s`);
        console.log(`    Avg garbage per game: ${result.avgGarbagePerGame.toFixed(1)}`);
        console.log(`    Offset rate: ${(result.offsetRate * 100).toFixed(0)}%`);
        console.log(`    ${botA} avg garbage sent: ${result.avgGarbageA.toFixed(1)}`);
        console.log(`    ${botB} avg garbage sent: ${result.avgGarbageB.toFixed(1)}`);
    }

    console.log(`\n  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

module.exports = { runPvpMatch, runSeries, calcGarbage, PVP_DEFAULTS };
