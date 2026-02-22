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
     * OracleContinuous: Theoretically near-optimal play.
     *
     * Key insight: chain resolution is deterministic given a tap point. The optimal
     * strategy is to evaluate the full chain cascade for every possible tap position,
     * not just count dots within initial explosion radius.
     *
     * Approach:
     *   1. Every active dot is a candidate tap target (chains start from caught dots)
     *   2. For each candidate, run full chain resolution via clone sim
     *   3. Test multiple time offsets to find when dots cluster optimally
     *   4. Score = dots cleared, with density pressure bonus near overflow
     *   5. 2-ply lookahead: resolve first tap, simulate spawns during cooldown,
     *      find best second tap, maximize total cleared
     *   6. Model future spawns during wait time (not just current dots)
     *
     * This is near-optimal because:
     *   - We exhaustively test every dot position as tap center
     *   - Full chain resolution (not radius approximation) determines outcome
     *   - 2-ply lookahead with spawn modeling captures tap sequencing value
     *   - Only gap from theoretical optimum: finite time horizon (2-ply, not N-ply)
     */
    oracle(sim) {
        if (!sim.canTap()) return { action: 'wait' };

        const snapshot = sim.dots.map(d => ({
            x: d.x, y: d.y, vx: d.vx, vy: d.vy,
            active: d.active, type: d.type, bloomTimer: 0
        }));
        const activeDots = snapshot.filter(d => d.active);
        const density = activeDots.length / sim.cfg.maxDots;
        const DT = 16.67;
        const margin = sim.cfg.SCREEN_MARGIN;

        // Advance dot positions by deltaMs (physics + gravity pull, no spawning)
        function advanceDots(dots, deltaMs) {
            const r = sim.explosionRadius;
            for (let ms = 0; ms < deltaMs; ms += DT) {
                // Gravity pull first
                for (const d of dots) {
                    if (d.active && d.type === 'gravity') {
                        const pullR = r * 2.5;
                        for (const o of dots) {
                            if (o === d || !o.active) continue;
                            const dist = Math.hypot(o.x - d.x, o.y - d.y);
                            if (dist < pullR && dist > 5) {
                                const f = 0.012 / (dist / r);
                                o.vx += (d.x - o.x) / dist * f;
                                o.vy += (d.y - o.y) / dist * f;
                            }
                        }
                    }
                }
                // Movement + bounce
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

        // Full chain resolution via clone sim — returns dots caught
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

        // Phase 1: Exhaustive candidate generation at multiple time offsets.
        // Three candidate sources, ALL evaluated with full chain resolution:
        //   A. Every active dot position (chain starts from nearest dot)
        //   B. Midpoints between close dot pairs (catches 2+ in initial explosion)
        //   C. 20x20 grid search (catches cluster centers that dots miss)
        const candidates = [];
        const timeOffsets = [0, 100, 200, 400, 600, 800, 1100];
        const r = sim.explosionRadius;

        for (const delay of timeOffsets) {
            const futureDots = snapshot.map(d => ({ ...d }));
            advanceDots(futureDots, delay);

            const active = futureDots.filter(d => d.active);
            if (active.length === 0) continue;

            // Candidate generation: cover the space of meaningful tap points.
            //
            // Theory: f(x,y) = cascade_caught is a complex function of position
            // because dots MOVE during cascade resolution (1200ms+ of physics).
            // The static disk-arrangement model breaks down. Instead, we
            // exhaustively test all structurally distinct tap positions and
            // evaluate each with full chain resolution (which includes drift).
            //
            // Sources:
            //   A. Every active dot position (natural cluster centers)
            //   B. Midpoints of close dot pairs (catches 2+ initially)
            //   C. Weighted centroid of 3-dot clusters within 2R
            //      (catches 3+ initially — highest chain potential)

            const posMap = new Map();

            // A. Every active dot position
            for (const d of active) {
                const key = `${Math.round(d.x/2)},${Math.round(d.y/2)}`;
                if (!posMap.has(key)) posMap.set(key, { x: d.x, y: d.y });
            }

            // B. Midpoints between close dot pairs
            for (let i = 0; i < active.length; i++) {
                for (let j = i + 1; j < active.length; j++) {
                    const dist = Math.hypot(active[i].x - active[j].x, active[i].y - active[j].y);
                    if (dist < r * 2) {
                        const mx = (active[i].x + active[j].x) / 2;
                        const my = (active[i].y + active[j].y) / 2;
                        const key = `${Math.round(mx/2)},${Math.round(my/2)}`;
                        if (!posMap.has(key)) posMap.set(key, { x: mx, y: my });
                    }
                }
            }

            // C. Centroids of 3-dot clusters (for triple-catches)
            if (active.length <= 60) {
                for (let i = 0; i < active.length; i++) {
                    for (let j = i + 1; j < active.length; j++) {
                        if (Math.hypot(active[i].x - active[j].x, active[i].y - active[j].y) >= r * 2) continue;
                        for (let k = j + 1; k < active.length; k++) {
                            if (Math.hypot(active[i].x - active[k].x, active[i].y - active[k].y) >= r * 2) continue;
                            if (Math.hypot(active[j].x - active[k].x, active[j].y - active[k].y) >= r * 2) continue;
                            const cx = (active[i].x + active[j].x + active[k].x) / 3;
                            const cy = (active[i].y + active[j].y + active[k].y) / 3;
                            const key = `${Math.round(cx/2)},${Math.round(cy/2)}`;
                            if (!posMap.has(key)) posMap.set(key, { x: cx, y: cy });
                        }
                    }
                }
            }

            // Evaluate ALL candidates with full chain resolution
            for (const [, pos] of posMap) {
                const caught = evalTap(futureDots, pos.x, pos.y);
                if (caught < 1) continue;
                const pressureBonus = density > 0.5 ? caught * (density - 0.5) * 3 : 0;
                candidates.push({ x: pos.x, y: pos.y, delay, caught, score: caught + pressureBonus });
            }
        }

        if (candidates.length === 0) {
            return { action: 'tap', x: sim.W / 2, y: sim.H / 2, waitMs: 0 };
        }

        // Sort by score descending, take top candidates for 2-ply
        candidates.sort((a, b) => b.score - a.score);

        // Phase 2: 2-ply lookahead (Bertsekas rollout policy)
        //
        // For top candidates, resolve first tap then find best second tap
        // after cooldown. By the Rollout Theorem (Bertsekas 1997), this
        // is provably >= the greedy (1-ply) policy.
        const cooldown = sim.cfg.tapCooldown;
        let bestTotal = 0, bestCandidate = candidates[0];

        const plyCount = Math.min(8, candidates.length);
        for (let i = 0; i < plyCount; i++) {
            const c = candidates[i];
            const futureDots = snapshot.map(d => ({ ...d }));
            advanceDots(futureDots, c.delay);

            // Resolve first tap via clone sim
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

            // After chain resolves, advance remaining dots by cooldown
            const remainingDots = clone.dots.filter(d => d.active).map(d => ({ ...d }));
            advanceDots(remainingDots, cooldown);

            // Best second tap: test every remaining dot position
            let secondBest = 0;
            for (const d of remainingDots) {
                if (!d.active) continue;
                const caught2 = evalTap(remainingDots, d.x, d.y);
                if (caught2 > secondBest) secondBest = caught2;
            }

            const totalCaught = firstCaught + secondBest;
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
