#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Continuous Play Simulation (Thin wrapper over game-core)
//
// Extends game-core for Tetris-style continuous play. No rounds, no targets.
// Dots spawn continuously at screen edges with inward velocity.
// Game ends on density overflow (Dcrit sustained for 10s).
//
// Usage:
//   node continuous-sim.js                        # Quick demo: 60s each bot
//   node continuous-sim.js --bot greedy --time 300 # Specific bot, 5 min
//   node continuous-sim.js --tier FLOW             # Run a difficulty tier
// =========================================================================

const { Game, Bots, DEFAULTS, CONTINUOUS_TIERS, createRNG } = require('./game-core.js');

// --- Continuous play defaults (backward-compat re-export) ---
const CONTINUOUS_DEFAULTS = {
    spawnRate: 2.5,
    spawnAccel: 0.0,
    maxDots: 100,
    speedMin: 0.5,
    speedMax: 1.0,
    dotTypes: { standard: 1.0 },
    tapCooldown: 2000,
    overflowDensity: 0.8,
    overflowDuration: 10000,
    densitySampleInterval: 500,
    ...DEFAULTS,
};

// =========================================================================
// BACKWARD-COMPAT WRAPPERS
// =========================================================================

/** Map flat config (with tapCooldown) to game-core tier config format */
function toTierConfig(cfg) {
    return {
        spawnRate: cfg.spawnRate || 2.5,
        spawnAccel: cfg.spawnAccel || 0,
        cooldown: cfg.tapCooldown || cfg.cooldown || 2000,
        maxDots: cfg.maxDots || 100,
        speedMin: cfg.speedMin || 0.5,
        speedMax: cfg.speedMax || 1.0,
        dotTypes: cfg.dotTypes || { standard: 1.0 },
        overflowDensity: cfg.overflowDensity || 0.8,
        overflowDuration: cfg.overflowDuration || 10000,
    };
}

/** Backward-compat class: new ContinuousSimulation(w, h, config, seed) */
class ContinuousSimulation extends Game {
    constructor(width, height, config = {}, seed = 42) {
        const merged = { ...CONTINUOUS_DEFAULTS, ...config };
        super(width, height, merged, createRNG(seed));
        this.startContinuous(toTierConfig(merged));
    }
}

// Backward-compat alias: old ContinuousBots maps to game-core Bots
const ContinuousBots = Bots;

// =========================================================================
// RUNNER — Play a bot for a given duration
// =========================================================================

/**
 * Run a continuous simulation with a bot for a specified duration.
 * @param {object} opts
 * @param {string} opts.bot - 'random'|'greedy'|'humanSim'|'oracle'
 * @param {number} opts.duration - sim time in ms
 * @param {number} opts.width - viewport width
 * @param {number} opts.height - viewport height
 * @param {object} opts.config - continuous config overrides
 * @param {number} opts.seed - RNG seed
 * @returns {object} stats from getStats()
 */
function runContinuous(opts) {
    const {
        bot = 'greedy',
        duration = 60000,
        width = 390,
        height = 844,
        config = {},
        seed = 42,
    } = opts;

    const merged = { ...CONTINUOUS_DEFAULTS, ...config };
    const game = new Game(width, height, merged, createRNG(seed));
    game.startContinuous(toTierConfig(merged));

    const botFn = Bots[bot];
    if (!botFn) throw new Error(`Unknown bot: ${bot}`);

    const DT = 16.67; // ~60fps
    let botWaitUntil = 0;
    let pendingTap = null;

    while (game.time < duration && !game.overflowed) {
        game.step(DT);
        game.events = []; // drain events (headless — no consumer)

        // Bot logic: execute pending tap if wait is over
        if (pendingTap && game.time >= botWaitUntil) {
            game.tap(pendingTap.x, pendingTap.y);
            pendingTap = null;
        }

        // If no pending tap and not resolving, ask bot for next action
        if (!pendingTap && game.gameState === 'playing') {
            const decision = botFn(game);
            if (decision.action === 'tap') {
                if (decision.waitMs > 0) {
                    pendingTap = { x: decision.x, y: decision.y };
                    botWaitUntil = game.time + decision.waitMs;
                } else {
                    game.tap(decision.x, decision.y);
                }
            }
        }
    }

    return game.getStats();
}

// =========================================================================
// EXPORTS
// =========================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ContinuousSimulation,
        ContinuousBots,
        CONTINUOUS_DEFAULTS,
        runContinuous,
    };
}

// =========================================================================
// CLI
// =========================================================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const opts = {
        bot: 'greedy',
        time: 60,
        width: 390,
        height: 844,
        seed: 42,
        config: {},
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--bot') opts.bot = args[++i];
        else if (args[i] === '--time') opts.time = parseInt(args[++i]);
        else if (args[i] === '--seed') opts.seed = parseInt(args[++i]);
        else if (args[i] === '--config') opts.config = JSON.parse(args[++i]);
        else if (args[i] === '--viewport') {
            const [w, h] = args[++i].split('x').map(Number);
            opts.width = w; opts.height = h;
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  CHAIN REACTION — Continuous Play Simulation`);
    console.log(`  Bot: ${opts.bot} | Duration: ${opts.time}s | Seed: ${opts.seed}`);
    console.log(`${'='.repeat(60)}\n`);

    const t0 = Date.now();

    if (args.length === 0) {
        const bots = ['random', 'greedy', 'humanSim', 'oracle'];
        const duration = 60000;

        console.log(`  Running all bots for ${duration / 1000}s each...\n`);
        for (const botName of bots) {
            const bt = Date.now();
            const stats = runContinuous({
                bot: botName, duration,
                width: opts.width, height: opts.height,
                seed: opts.seed,
            });
            const elapsed = Date.now() - bt;
            console.log(`  ── ${botName} (${elapsed}ms) ──`);
            console.log(`    Duration: ${(stats.duration / 1000).toFixed(1)}s${stats.overflowed ? ' (OVERFLOW)' : ''}`);
            console.log(`    Taps: ${stats.totalTaps} | Dots spawned: ${stats.totalDotsSpawned} | Caught: ${stats.totalDotsCaught}`);
            console.log(`    Chains: ${stats.chainCount} | Avg length: ${stats.avgChainLength.toFixed(1)} | Max: ${stats.maxChainLength}`);
            console.log(`    Score: ${stats.score} | Mean density: ${(stats.meanDensity * 100).toFixed(1)}%`);
            console.log(`    Max density: ${(stats.maxDensity * 100).toFixed(1)}%`);
            console.log('');
        }
    } else {
        const stats = runContinuous({
            bot: opts.bot,
            duration: opts.time * 1000,
            width: opts.width,
            height: opts.height,
            config: opts.config,
            seed: opts.seed,
        });

        console.log(`  Duration: ${(stats.duration / 1000).toFixed(1)}s${stats.overflowed ? ' (OVERFLOW at ' + (stats.overflowTime / 1000).toFixed(1) + 's)' : ''}`);
        console.log(`  Taps: ${stats.totalTaps} | Dots spawned: ${stats.totalDotsSpawned} | Caught: ${stats.totalDotsCaught}`);
        console.log(`  Chains: ${stats.chainCount} | Avg length: ${stats.avgChainLength.toFixed(1)} | Max: ${stats.maxChainLength}`);
        console.log(`  Score: ${stats.score}`);
        console.log(`  Mean density: ${(stats.meanDensity * 100).toFixed(1)}% | Max: ${(stats.maxDensity * 100).toFixed(1)}%`);
    }

    console.log(`  Total wall time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}
