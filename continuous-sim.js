#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Continuous Play Simulation
//
// Extends sim.js for Tetris-style continuous play. No rounds, no targets.
// Dots spawn continuously at screen edges with inward velocity.
// Game ends on density overflow (Dcrit sustained for 10s).
//
// Usage:
//   node continuous-sim.js                        # Quick demo: 60s each bot
//   node continuous-sim.js --bot greedy --time 300 # Specific bot, 5 min
//   node continuous-sim.js --tier FLOW             # Run a difficulty tier
// =========================================================================

const { Simulation, DEFAULT_CONFIG, Bots, createRNG } = require('./sim.js');

// --- Continuous play defaults ---
const CONTINUOUS_DEFAULTS = {
    // Spawn
    spawnRate: 2.5,           // dots/second base rate
    spawnAccel: 0.0,          // additional dots/s per 30s elapsed (0 = constant)
    maxDots: 100,             // hard cap on active dots

    // Dot speeds
    speedMin: 0.5,
    speedMax: 1.0,

    // Dot type weights: { standard, gravity, volatile }
    dotTypes: { standard: 1.0 },

    // Tap cooldown
    tapCooldown: 2000,        // ms between taps

    // Overflow
    overflowDensity: 0.8,     // fraction of maxDots that counts as critical
    overflowDuration: 10000,  // ms at critical density before overflow

    // Sampling
    densitySampleInterval: 500, // ms between density history samples

    // Inherited from sim.js DEFAULT_CONFIG
    ...DEFAULT_CONFIG,
};

// =========================================================================
// CONTINUOUS SIMULATION ENGINE
// =========================================================================

class ContinuousSimulation extends Simulation {
    constructor(width, height, config = {}, seed = 42) {
        const merged = { ...CONTINUOUS_DEFAULTS, ...config };
        super(width, height, merged, seed);
        this.cfg = merged;

        // Spawn accumulator
        this._spawnAccum = 0;

        // Tap cooldown tracking
        this._lastTapTime = -Infinity;

        // Density history (sampled every densitySampleInterval ms)
        this.densityHistory = [];
        this._lastDensitySample = 0;

        // Overflow tracking
        this._overflowStart = -1; // time when density first exceeded Dcrit
        this.overflowed = false;

        // Stats
        this.totalDotsSpawned = 0;
        this.totalDotsCaught = 0;
        this.totalTaps = 0;
        this.chainLengths = [];

        // Set initial state
        this.gameState = 'playing';
        this.totalDots = 0; // running count for multiplier thresholds
    }

    /** Whether a tap is allowed right now (cooldown elapsed) */
    canTap() {
        return this.gameState === 'playing' &&
               (this.time - this._lastTapTime) >= this.cfg.tapCooldown;
    }

    /** Time remaining on cooldown (ms), 0 if ready */
    cooldownRemaining() {
        return Math.max(0, this.cfg.tapCooldown - (this.time - this._lastTapTime));
    }

    /** Tap at position. Returns false if cooldown not elapsed. */
    tap(x, y) {
        if (!this.canTap()) return false;
        this._lastTapTime = this.time;
        this.totalTaps++;

        // Track chain for this tap
        this._preTapChain = this.chainCount;

        // Set totalDots for multiplier threshold calculation
        this.totalDots = this.activeDotCount();

        // Start resolving (must set state so base class detects chain end)
        this.gameState = 'resolving';
        this.explosions.push(this._createExplosion(x, y, 0));
        return true;
    }

    /** Count currently active dots */
    activeDotCount() {
        let c = 0;
        for (const d of this.dots) if (d.active) c++;
        return c;
    }

    /** Current density as fraction of maxDots */
    density() {
        return this.activeDotCount() / this.cfg.maxDots;
    }

    /** Spawn dots at screen edges with inward velocity */
    spawnTick(dt) {
        const elapsed = this.time;
        const rate = this.cfg.spawnRate + this.cfg.spawnAccel * (elapsed / 30000);
        this._spawnAccum += rate * (dt / 1000);

        while (this._spawnAccum >= 1 && this.activeDotCount() < this.cfg.maxDots) {
            this._spawnAccum -= 1;
            this._spawnOneDot();
        }

        // Clamp accumulator to prevent burst after long pauses
        if (this._spawnAccum > 3) this._spawnAccum = 3;
    }

    _spawnOneDot() {
        const margin = this.cfg.SCREEN_MARGIN;
        const type = this._pickType(this.cfg.dotTypes);
        const speedMults = { standard: 1.0, gravity: 0.7, volatile: 1.3 };
        const speed = (this.cfg.speedMin + this.rng() * (this.cfg.speedMax - this.cfg.speedMin))
                      * (speedMults[type] || 1.0);

        // Pick a random edge: 0=top, 1=right, 2=bottom, 3=left
        const edge = Math.floor(this.rng() * 4);
        let x, y, vx, vy;
        const spread = Math.PI * 0.4; // ±0.4 rad from inward normal

        switch (edge) {
            case 0: // top
                x = margin + this.rng() * (this.W - margin * 2);
                y = margin;
                { const a = Math.PI / 2 + (this.rng() - 0.5) * spread; vx = Math.cos(a) * speed; vy = Math.sin(a) * speed; }
                break;
            case 1: // right
                x = this.W - margin;
                y = margin + this.rng() * (this.H - margin * 2);
                { const a = Math.PI + (this.rng() - 0.5) * spread; vx = Math.cos(a) * speed; vy = Math.sin(a) * speed; }
                break;
            case 2: // bottom
                x = margin + this.rng() * (this.W - margin * 2);
                y = this.H - margin;
                { const a = -Math.PI / 2 + (this.rng() - 0.5) * spread; vx = Math.cos(a) * speed; vy = Math.sin(a) * speed; }
                break;
            case 3: // left
                x = margin;
                y = margin + this.rng() * (this.H - margin * 2);
                { const a = 0 + (this.rng() - 0.5) * spread; vx = Math.cos(a) * speed; vy = Math.sin(a) * speed; }
                break;
        }

        this.dots.push({
            x, y, vx, vy,
            active: true,
            bloomTimer: 0,
            type,
        });
        this.totalDotsSpawned++;
    }

    /** Advance simulation by dt ms. Handles spawning, physics, overflow. */
    step(dt) {
        if (this.overflowed) return;

        // Spawn new dots (always, even while resolving)
        this.spawnTick(dt);

        // Run base physics + explosion resolution
        super.step(dt);

        // After base step, if explosions just finished, record the chain
        if (this.gameState === 'done') {
            // Chain just resolved — record length
            const chainLen = this.chainCount - (this._preTapChain || 0);
            if (chainLen > 0) {
                this.chainLengths.push(chainLen);
                this.totalDotsCaught += chainLen;
            }
            // Return to playing state (continuous — no round end)
            this.gameState = 'playing';
        }

        // Sample density
        if (this.time - this._lastDensitySample >= this.cfg.densitySampleInterval) {
            this._lastDensitySample = this.time;
            const d = this.density();
            this.densityHistory.push({ time: this.time, density: d, count: this.activeDotCount() });
        }

        // Check overflow
        this._checkOverflow();
    }

    _checkOverflow() {
        const d = this.density();
        const Dcrit = this.cfg.overflowDensity;

        if (d >= Dcrit) {
            if (this._overflowStart < 0) {
                this._overflowStart = this.time;
            } else if (this.time - this._overflowStart >= this.cfg.overflowDuration) {
                this.overflowed = true;
                this.gameState = 'overflow';
            }
        } else {
            this._overflowStart = -1; // reset
        }
    }

    /** Get summary stats */
    getStats() {
        const densities = this.densityHistory.map(h => h.density);
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const max = arr => arr.length ? Math.max(...arr) : 0;

        return {
            duration: this.time,
            totalTaps: this.totalTaps,
            totalDotsSpawned: this.totalDotsSpawned,
            totalDotsCaught: this.totalDotsCaught,
            chainCount: this.chainLengths.length,
            avgChainLength: avg(this.chainLengths),
            maxChainLength: this.chainLengths.length ? Math.max(...this.chainLengths) : 0,
            score: this.score,
            overflowed: this.overflowed,
            overflowTime: this.overflowed ? this.time : null,
            meanDensity: avg(densities),
            maxDensity: max(densities),
            densitySamples: this.densityHistory.length,
        };
    }
}

// =========================================================================
// CONTINUOUS BOTS
//
// Adapt sim.js bots for continuous play. Key difference: bots must decide
// WHEN to tap (not just where), respecting tap cooldown.
// =========================================================================

const ContinuousBots = {
    /**
     * RandomContinuous: After cooldown, wait random 1-4s, tap random position.
     * Returns { action: 'wait'|'tap', x?, y?, waitMs? }
     */
    random(sim) {
        if (!sim.canTap()) return { action: 'wait' };
        // Random delay after cooldown: 1-4s
        const waitMs = 1000 + sim.rng() * 3000;
        const margin = sim.cfg.SCREEN_MARGIN + 20;
        return {
            action: 'tap',
            x: margin + sim.rng() * (sim.W - margin * 2),
            y: margin + 50 + sim.rng() * (sim.H - margin * 2 - 50),
            waitMs,
        };
    },

    /**
     * GreedyContinuous: Tap immediately after cooldown at best greedy position.
     */
    greedy(sim) {
        if (!sim.canTap()) return { action: 'wait' };
        const tap = Bots.greedy(sim, 20);
        return { action: 'tap', x: tap.x, y: tap.y, waitMs: 0 };
    },

    /**
     * HumanSimContinuous: Tap after cooldown + 200ms + noise.
     */
    humanSim(sim) {
        if (!sim.canTap()) return { action: 'wait' };
        const best = Bots.greedy(sim, 15);
        const noiseX = (sim.rng() + sim.rng() + sim.rng() - 1.5) * 20;
        const noiseY = (sim.rng() + sim.rng() + sim.rng() - 1.5) * 20;
        return {
            action: 'tap',
            x: Math.max(20, Math.min(sim.W - 20, best.x + noiseX)),
            y: Math.max(70, Math.min(sim.H - 20, best.y + noiseY)),
            waitMs: 200 + sim.rng() * 100, // 200-300ms reaction time
        };
    },

    /**
     * OracleContinuous: Near-optimal play via full chain resolution + 2-ply lookahead.
     *
     * 1. Snapshots current dots with positions + velocities
     * 2. Tests 12 time offsets (0-1100ms in 100ms steps)
     * 3. At each offset, advances physics (with wall bouncing) to future positions
     * 4. Does 30x30 grid search + refinement to find best tap position
     * 5. Fully resolves the chain (with cascade momentum) and counts dots caught
     * 6. Scores = dotsCaught + densityPressureBonus (prioritize clearing when near overflow)
     * 7. For top 3 candidates, does 2-ply lookahead: after cooldown, what's the best 2nd tap?
     */
    oracle(sim) {
        if (!sim.canTap()) return { action: 'wait' };

        const snapshot = sim.dots.map(d => ({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, active: d.active, type: d.type, bloomTimer: 0 }));
        const activeDots = snapshot.filter(d => d.active).length;
        const density = activeDots / sim.cfg.maxDots;
        const DT = 16.67;
        const margin = sim.cfg.SCREEN_MARGIN;

        // Helper: advance dot positions by deltaMs (physics only, no spawning)
        function advanceDots(dots, deltaMs) {
            for (let ms = 0; ms < deltaMs; ms += DT) {
                for (const d of dots) {
                    if (!d.active) continue;
                    d.x += d.vx; d.y += d.vy;
                    if (d.x < margin) { d.vx = Math.abs(d.vx); d.x = margin; }
                    if (d.x > sim.W - margin) { d.vx = -Math.abs(d.vx); d.x = sim.W - margin; }
                    if (d.y < margin) { d.vy = Math.abs(d.vy); d.y = margin; }
                    if (d.y > sim.H - margin) { d.vy = -Math.abs(d.vy); d.y = sim.H - margin; }
                }
            }
        }

        // Helper: create clone sim with given dots, resolve tap, return dots caught
        function evalTap(dots, x, y) {
            const clone = new ContinuousSimulation(sim.W, sim.H, sim.cfg, 0);
            clone.dots = dots.map(d => ({ ...d }));
            clone.explosionRadius = sim.explosionRadius;
            clone.gameState = 'playing';
            clone._lastTapTime = -Infinity;
            clone.totalDots = dots.filter(d => d.active).length;
            clone.chainCount = 0;
            clone.tap(x, y);
            clone.resolveChain();
            return clone.chainCount;
        }

        // Helper: grid search on dot array, return {x, y, caught}
        function gridSearch(dots, gridSize) {
            let bestX = sim.W / 2, bestY = sim.H / 2, bestCaught = 0;
            const r = sim.explosionRadius;
            // Coarse grid
            for (let gx = 0; gx < gridSize; gx++) {
                for (let gy = 0; gy < gridSize; gy++) {
                    const x = (gx + 0.5) * sim.W / gridSize;
                    const y = (gy + 0.5) * sim.H / gridSize;
                    let count = 0;
                    for (const d of dots) {
                        if (d.active && Math.hypot(d.x - x, d.y - y) <= r) count++;
                    }
                    if (count > bestCaught) { bestCaught = count; bestX = x; bestY = y; }
                }
            }
            // Refinement around best (7x7 sub-grid)
            const step = sim.W / gridSize / 4;
            for (let dx = -3; dx <= 3; dx++) {
                for (let dy = -3; dy <= 3; dy++) {
                    const x = bestX + dx * step;
                    const y = bestY + dy * step;
                    let count = 0;
                    for (const d of dots) {
                        if (d.active && Math.hypot(d.x - x, d.y - y) <= r) count++;
                    }
                    if (count > bestCaught) { bestCaught = count; bestX = x; bestY = y; }
                }
            }
            // Also check every active dot's position as candidate (cluster centers)
            for (const d of dots) {
                if (!d.active) continue;
                let count = 0;
                for (const d2 of dots) {
                    if (d2.active && Math.hypot(d2.x - d.x, d2.y - d.y) <= r) count++;
                }
                if (count > bestCaught) { bestCaught = count; bestX = d.x; bestY = d.y; }
            }
            return { x: bestX, y: bestY, count: bestCaught };
        }

        // Phase 1: Evaluate all time offsets with full chain resolution
        const candidates = [];
        const timeSteps = 12; // 0ms to 1100ms in 100ms steps
        for (let t = 0; t < timeSteps; t++) {
            const delay = t * 100;
            const futureDots = snapshot.map(d => ({ ...d }));
            advanceDots(futureDots, delay);

            // Find best tap position via grid search
            const best = gridSearch(futureDots, 30);
            if (best.count < 1) continue;

            // Full chain resolution to get actual dots caught
            const caught = evalTap(futureDots, best.x, best.y);

            // Density pressure bonus: when near overflow, reward clearing more dots
            const pressureBonus = density > 0.5 ? caught * (density - 0.5) * 2 : 0;
            const score = caught + pressureBonus;

            candidates.push({ x: best.x, y: best.y, delay, caught, score });
        }

        if (candidates.length === 0) {
            return { action: 'tap', x: sim.W / 2, y: sim.H / 2, waitMs: 0 };
        }

        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        // Phase 2: 2-ply lookahead on top 3 candidates
        const cooldown = sim.cfg.tapCooldown;
        let bestTotal = 0, bestCandidate = candidates[0];

        for (let i = 0; i < Math.min(3, candidates.length); i++) {
            const c = candidates[i];
            // Simulate first tap + resolve + advance by cooldown + second tap
            const futureDots = snapshot.map(d => ({ ...d }));
            advanceDots(futureDots, c.delay);

            // Resolve first tap
            const clone = new ContinuousSimulation(sim.W, sim.H, sim.cfg, 0);
            clone.dots = futureDots.map(d => ({ ...d }));
            clone.explosionRadius = sim.explosionRadius;
            clone.gameState = 'playing';
            clone._lastTapTime = -Infinity;
            clone.totalDots = futureDots.filter(d => d.active).length;
            clone.chainCount = 0;
            clone.tap(c.x, c.y);
            clone.resolveChain();
            const firstCaught = clone.chainCount;

            // After first chain resolves, advance remaining dots by cooldown
            const remainingDots = clone.dots.filter(d => d.active).map(d => ({ ...d }));
            advanceDots(remainingDots, cooldown);

            // Find best second tap
            const best2 = gridSearch(remainingDots, 20);
            const secondCaught = best2.count >= 1 ? evalTap(remainingDots, best2.x, best2.y) : 0;

            const totalCaught = firstCaught + secondCaught;
            if (totalCaught > bestTotal) {
                bestTotal = totalCaught;
                bestCandidate = c;
            }
        }

        return { action: 'tap', x: bestCandidate.x, y: bestCandidate.y, waitMs: bestCandidate.delay };
    },
};

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

    const sim = new ContinuousSimulation(width, height, config, seed);
    const botFn = ContinuousBots[bot];
    if (!botFn) throw new Error(`Unknown bot: ${bot}`);

    const DT = 16.67; // ~60fps
    let botWaitUntil = 0; // time when bot will tap (after reaction delay)
    let pendingTap = null;

    while (sim.time < duration && !sim.overflowed) {
        sim.step(DT);

        // Bot logic: check if we have a pending tap to execute
        if (pendingTap && sim.time >= botWaitUntil) {
            sim.tap(pendingTap.x, pendingTap.y);
            pendingTap = null;
        }

        // If no pending tap and not resolving, ask bot for next action
        if (!pendingTap && sim.gameState === 'playing') {
            const decision = botFn(sim);
            if (decision.action === 'tap') {
                if (decision.waitMs > 0) {
                    pendingTap = { x: decision.x, y: decision.y };
                    botWaitUntil = sim.time + decision.waitMs;
                } else {
                    sim.tap(decision.x, decision.y);
                }
            }
        }
    }

    return sim.getStats();
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

    // Run all bots if none specified specially
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
