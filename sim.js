#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Headless Simulation Harness
//
// Extracts pure game logic from index.html. No canvas, no audio, no DOM.
// Runs ~100 full games/second. Seeded RNG for reproducibility.
//
// Usage:
//   node sim.js                          # Default: all metrics, 500 runs
//   node sim.js --runs 2000              # More runs for higher confidence
//   node sim.js --metric skill-ceiling   # Single metric
//   node sim.js --round 5 --viewport 390x844  # Specific round + viewport
//   node sim.js --config '{"EXPLOSION_RADIUS_PCT":0.15}'  # Test parameter changes
//   node sim.js --compare '{"speedMin":0.6}' '{"speedMin":1.0}'  # A/B test
// =========================================================================

// --- Seeded PRNG (mulberry32) ---
function createRNG(seed) {
    let s = seed | 0;
    return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// --- Easing ---
const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInQuad = t => t * t;

// --- Default Config (mirrors index.html v6) ---
const DEFAULT_CONFIG = {
    EXPLOSION_RADIUS_PCT: 0.10,
    EXPLOSION_RADIUS_MIN_PX: 35,
    EXPLOSION_GROW_MS: 200,
    EXPLOSION_HOLD_MS: 1000,
    EXPLOSION_SHRINK_MS: 500,
    CASCADE_STAGGER_MS: 80,
    CASCADE_JITTER_MS: 25,
    CASCADE_RADIUS_GROWTH: 0,       // no cascade radius growth (v11)
    CASCADE_HOLD_GROWTH_MS: 80,     // +80ms hold per generation (v11)
    CASCADE_GEN_CAP: 4,            // max generation for cascade scaling
    MIN_DOT_DISTANCE: 25,
    SCREEN_MARGIN: 16,
    // Multiplier thresholds — percentage of round's total dots (matches browser engine)
    MULT_THRESHOLDS: [
        { pct: 0.00, mult: 1 }, { pct: 0.10, mult: 2 },
        { pct: 0.20, mult: 3 }, { pct: 0.35, mult: 4 },
        { pct: 0.50, mult: 5 }, { pct: 0.75, mult: 8 },
    ],
};

function getRoundParams(r, config) {
    const dots = Math.min(60, Math.floor(10 + r * 2.5));
    const pct = Math.min(0.80, 0.05 + (r - 1) * 0.028);
    const target = Math.max(1, Math.ceil(dots * pct));
    const speedMin = (config.speedMin || 0.7) + Math.min(0.6, (r - 1) * 0.04);
    const speedMax = (config.speedMax || 1.4) + Math.min(1.2, (r - 1) * 0.07);
    return { dots, target, pct, speedMin, speedMax };
}

function getMultiplier(chain, thresholds, totalDots) {
    let m = 1;
    for (const t of thresholds) {
        const threshold = Math.ceil(t.pct * totalDots);
        if (chain >= threshold) m = t.mult;
    }
    return m;
}

// =========================================================================
// SIMULATION ENGINE
// =========================================================================

class Simulation {
    constructor(width, height, config = {}, seed = 42) {
        this.W = width;
        this.H = height;
        this.cfg = { ...DEFAULT_CONFIG, ...config };
        this.rng = createRNG(seed);

        const refDim = Math.min(width, height, 800);
        this.explosionRadius = Math.max(
            this.cfg.EXPLOSION_RADIUS_MIN_PX,
            refDim * this.cfg.EXPLOSION_RADIUS_PCT
        );
        this.TOTAL_MS = this.cfg.EXPLOSION_GROW_MS + this.cfg.EXPLOSION_HOLD_MS + this.cfg.EXPLOSION_SHRINK_MS;

        this.reset();
    }

    reset() {
        this.dots = [];
        this.explosions = [];
        this.pendingExplosions = [];
        this.scheduledDetonations = new Set();
        this.chainCount = 0;
        this.score = 0;
        this.currentMultiplier = 1;
        this.gameState = 'idle';
        this.time = 0;
        this.slowMo = 1.0;
        this.slowMoTarget = 1.0;

        // Metrics instrumentation
        this._hitLog = []; // {dotIndex, generation, time, expansionHit: bool}
    }

    _pickType(typeWeights) {
        if (!typeWeights) return 'standard';
        const r = this.rng();
        let sum = 0;
        for (const [type, weight] of Object.entries(typeWeights)) {
            sum += weight;
            if (r <= sum) return type;
        }
        return 'standard';
    }

    generateDots(count, speedMin, speedMax, typeWeights) {
        this.dots = [];
        let attempts = 0;
        const topMargin = this.cfg.SCREEN_MARGIN + 50;
        const speedMults = { standard: 1.0, gravity: 0.7, volatile: 1.3 };
        while (this.dots.length < count && attempts < 5000) {
            const x = this.cfg.SCREEN_MARGIN + this.rng() * (this.W - this.cfg.SCREEN_MARGIN * 2);
            const y = topMargin + this.rng() * (this.H - topMargin - this.cfg.SCREEN_MARGIN);
            let valid = true;
            for (const d of this.dots) {
                if (Math.hypot(d.x - x, d.y - y) < this.cfg.MIN_DOT_DISTANCE) { valid = false; break; }
            }
            if (valid) {
                const type = this._pickType(typeWeights);
                const a = this.rng() * Math.PI * 2;
                const spd = (speedMin + this.rng() * (speedMax - speedMin)) * (speedMults[type] || 1.0);
                this.dots.push({
                    x, y,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    active: true,
                    bloomTimer: 0,
                    type,
                });
            }
            attempts++;
        }
    }

    setupRound(round) {
        // Per-round radius decay (matches engine.js getRoundRadiusScale)
        const radiusScale = Math.max(0.85, 1.0 - (round - 1) * 0.01);
        const refDim = Math.min(this.W, this.H, 800);
        this.explosionRadius = Math.max(this.cfg.EXPLOSION_RADIUS_MIN_PX, refDim * this.cfg.EXPLOSION_RADIUS_PCT) * radiusScale;

        const params = getRoundParams(round, this.cfg);
        // Compute type weights matching the game's getRoundParams
        let typeWeights = this.cfg.dotTypes; // allow override via config
        if (!typeWeights) {
            if (round <= 2) {
                typeWeights = { standard: 1.0 };
            } else if (round <= 4) {
                const gw = Math.min(0.25, (round - 2) * 0.12);
                typeWeights = { standard: 1 - gw, gravity: gw };
            } else {
                const gw = Math.min(0.25, 0.12 + (round - 4) * 0.03);
                const vw = Math.min(0.20, (round - 4) * 0.08);
                typeWeights = { standard: Math.max(0.5, 1 - gw - vw), gravity: gw, volatile: vw };
            }
        }
        this.generateDots(params.dots, params.speedMin, params.speedMax, typeWeights);
        this.totalDots = this.dots.length;  // For percentage-based multiplier thresholds
        this.explosions = [];
        this.pendingExplosions = [];
        this.scheduledDetonations = new Set();
        this.chainCount = 0;
        this.score = 0;
        this.currentMultiplier = 1;
        this.gameState = 'playing';
        this.time = 0;
        this.slowMo = 1.0;
        this.slowMoTarget = 1.0;
        this._hitLog = [];
        return params;
    }

    tap(x, y) {
        if (this.gameState !== 'playing') return;
        this.gameState = 'resolving';
        this.explosions.push(this._createExplosion(x, y, 0));
    }

    _createExplosion(x, y, generation, dotType) {
        const radiusMult = dotType === 'volatile' ? 1.5 : 1.0;
        let maxRadius = this.explosionRadius * radiusMult;
        let holdMs = this.cfg.EXPLOSION_HOLD_MS;
        // Cascade momentum: each generation grows bigger + holds longer (capped)
        const effectiveGen = Math.min(generation, this.cfg.CASCADE_GEN_CAP);
        if (effectiveGen > 0) {
            maxRadius *= (1 + this.cfg.CASCADE_RADIUS_GROWTH * effectiveGen);
            holdMs += this.cfg.CASCADE_HOLD_GROWTH_MS * effectiveGen;
        }
        return {
            x, y, generation,
            dotType: dotType || 'standard',
            maxRadius,
            holdMs,
            radius: 0,
            phase: 'grow',
            age: 0,
            caught: new Set(),
            createdAt: this.time,
        };
    }

    // Advance simulation by dt milliseconds
    step(dt) {
        this.time += dt;

        // Process pending explosions
        for (let i = this.pendingExplosions.length - 1; i >= 0; i--) {
            if (this.time >= this.pendingExplosions[i].time) {
                const p = this.pendingExplosions[i];
                this.explosions.push(this._createExplosion(p.x, p.y, p.generation, p.dotType));
                this.pendingExplosions.splice(i, 1);
            }
        }

        // Update dots (movement + wall bounce + gravity pull)
        const margin = this.cfg.SCREEN_MARGIN;
        for (const d of this.dots) {
            if (!d.active) continue;
            d.x += d.vx * this.slowMo;
            d.y += d.vy * this.slowMo;

            // Gravity dots pull nearby dots
            if (d.type === 'gravity') {
                const pullR = this.explosionRadius * 2.5;
                const pullF = 0.012;
                for (const o of this.dots) {
                    if (o === d || !o.active) continue;
                    const dist = Math.hypot(o.x - d.x, o.y - d.y);
                    if (dist < pullR && dist > 5) {
                        const f = pullF * this.slowMo / (dist / this.explosionRadius);
                        o.vx += (d.x - o.x) / dist * f;
                        o.vy += (d.y - o.y) / dist * f;
                    }
                }
            }

            if (d.x < margin) { d.vx = Math.abs(d.vx); d.x = margin; }
            if (d.x > this.W - margin) { d.vx = -Math.abs(d.vx); d.x = this.W - margin; }
            if (d.y < margin) { d.vy = Math.abs(d.vy); d.y = margin; }
            if (d.y > this.H - margin) { d.vy = -Math.abs(d.vy); d.y = this.H - margin; }
        }

        // Update explosions
        const cfg = this.cfg;
        this.explosions = this.explosions.filter(e => {
            const elapsed = dt * this.slowMo;
            e.age += elapsed;

            const holdMs = e.holdMs || cfg.EXPLOSION_HOLD_MS;
            if (e.phase === 'grow') {
                if (e.age >= cfg.EXPLOSION_GROW_MS) e.phase = 'hold';
                e.radius = e.maxRadius * easeOutExpo(Math.min(e.age / cfg.EXPLOSION_GROW_MS, 1));
            } else if (e.phase === 'hold') {
                if (e.age >= cfg.EXPLOSION_GROW_MS + holdMs) e.phase = 'shrink';
                e.radius = e.maxRadius;
            } else if (e.phase === 'shrink') {
                const t = (e.age - cfg.EXPLOSION_GROW_MS - holdMs) / cfg.EXPLOSION_SHRINK_MS;
                if (t >= 1) return false; // Remove
                e.radius = e.maxRadius * (1 - easeInQuad(t));
            }

            // Collision detection + gravity pull during grow + hold
            if (e.phase === 'grow' || e.phase === 'hold') {
                // Gravity-type explosions pull nearby dots inward
                if (e.dotType === 'gravity') {
                    const pullR = e.maxRadius * 2.5;
                    for (let i = 0; i < this.dots.length; i++) {
                        const dot = this.dots[i];
                        if (!dot.active || e.caught.has(i)) continue;
                        const dist = Math.hypot(dot.x - e.x, dot.y - e.y);
                        if (dist < pullR && dist > 5) {
                            const f = 0.025 * this.slowMo / (dist / e.maxRadius);
                            dot.vx += (e.x - dot.x) / dist * f;
                            dot.vy += (e.y - dot.y) / dist * f;
                        }
                    }
                }

                for (let i = 0; i < this.dots.length; i++) {
                    const dot = this.dots[i];
                    if (!dot.active || e.caught.has(i)) continue;
                    if (Math.hypot(dot.x - e.x, dot.y - e.y) <= e.radius) {
                        e.caught.add(i);
                        this._detonateDot(dot, i, e.generation, e);
                    }
                }
            }
            return true;
        });

        // Slow-mo lerp
        if (this.slowMo !== this.slowMoTarget) {
            this.slowMo += (this.slowMoTarget - this.slowMo) * 0.15;
            if (Math.abs(this.slowMo - this.slowMoTarget) < 0.01) this.slowMo = this.slowMoTarget;
        }
        if (this.slowMoTarget < 1 && this.explosions.length === 0 && this.pendingExplosions.length === 0) {
            this.slowMoTarget = 1.0;
        }

        // Check round end
        if (this.gameState === 'resolving' && this.explosions.length === 0 && this.pendingExplosions.length === 0) {
            this.gameState = 'done';
        }
    }

    _detonateDot(dot, dotIndex, generation, explosion) {
        if (this.scheduledDetonations.has(dotIndex)) return;
        this.scheduledDetonations.add(dotIndex);
        dot.active = false;
        this.chainCount++;

        // Score
        const newMult = getMultiplier(this.chainCount, this.cfg.MULT_THRESHOLDS, this.totalDots);
        if (newMult > this.currentMultiplier) this.currentMultiplier = newMult;
        const basePoints = 10 * (generation + 1);
        this.score += basePoints * this.currentMultiplier;

        // Log hit for drift analysis
        const expansionEnd = explosion.createdAt + this.cfg.EXPLOSION_GROW_MS;
        this._hitLog.push({
            dotIndex, generation,
            time: this.time,
            expansionHit: this.time <= expansionEnd,
        });

        // Schedule cascade — inherits dot type (property transmission)
        const delay = this.cfg.CASCADE_STAGGER_MS + (this.rng() - 0.5) * 2 * this.cfg.CASCADE_JITTER_MS;
        this.pendingExplosions.push({
            x: dot.x, y: dot.y,
            generation: generation + 1,
            time: this.time + delay,
            dotType: dot.type || 'standard',
        });
    }

    // Run until chain resolves (max 30s safety)
    resolveChain() {
        const DT = 16.67; // ~60fps
        let safetyLimit = 30000 / DT;
        while (this.gameState === 'resolving' && safetyLimit-- > 0) {
            this.step(DT);
        }
    }

    // Get snapshot of current dot positions
    getSnapshot() {
        return this.dots.map(d => ({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, active: d.active }));
    }

    // Count dots within radius of a point
    countInRadius(x, y, radius) {
        let c = 0;
        for (const d of this.dots) {
            if (d.active && Math.hypot(d.x - x, d.y - y) <= radius) c++;
        }
        return c;
    }
}

// =========================================================================
// BOTS
// =========================================================================

const Bots = {
    // Random: tap uniformly random position
    random(sim) {
        const margin = sim.cfg.SCREEN_MARGIN + 20;
        return {
            x: margin + sim.rng() * (sim.W - margin * 2),
            y: margin + 50 + sim.rng() * (sim.H - margin * 2 - 50),
        };
    },

    // Greedy: grid search for densest cluster right now
    greedy(sim, gridSize = 20) {
        let bestX = sim.W / 2, bestY = sim.H / 2, bestCount = 0;
        const r = sim.explosionRadius;
        for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
                const x = (gx + 0.5) * sim.W / gridSize;
                const y = (gy + 0.5) * sim.H / gridSize;
                const count = sim.countInRadius(x, y, r);
                if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
            }
        }
        // Refine around best
        const step = sim.W / gridSize / 4;
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                const x = bestX + dx * step;
                const y = bestY + dy * step;
                const count = sim.countInRadius(x, y, r);
                if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
            }
        }
        return { x: bestX, y: bestY, clusterSize: bestCount };
    },

    // Human-sim: greedy + 200ms reaction delay + position noise
    humanSim(sim) {
        // Find best spot now
        const best = Bots.greedy(sim, 15);
        // Add gaussian noise (stddev ~15px, simulating finger imprecision)
        const noiseX = (sim.rng() + sim.rng() + sim.rng() - 1.5) * 20;
        const noiseY = (sim.rng() + sim.rng() + sim.rng() - 1.5) * 20;
        return {
            x: Math.max(20, Math.min(sim.W - 20, best.x + noiseX)),
            y: Math.max(70, Math.min(sim.H - 20, best.y + noiseY)),
            delay: 200, // ms to wait before tapping (dots drift during this)
        };
    },

    // Oracle: search positions AND timing for absolute maximum
    oracle(sim, timeSteps = 10, gridSize = 20) {
        let bestScore = 0, bestX = sim.W / 2, bestY = sim.H / 2, bestDelay = 0;
        const snapshot = sim.getSnapshot();

        for (let t = 0; t < timeSteps; t++) {
            const delay = t * 200; // 0ms, 200ms, 400ms, ...

            // Create a clone sim, advance by delay, then grid search
            const clone = Bots._cloneSim(sim, snapshot, delay);
            const tap = Bots.greedy(clone, gridSize);

            // Now simulate the full chain
            clone.tap(tap.x, tap.y);
            clone.resolveChain();

            if (clone.score > bestScore) {
                bestScore = clone.score;
                bestX = tap.x;
                bestY = tap.y;
                bestDelay = delay;
            }
        }
        return { x: bestX, y: bestY, delay: bestDelay, projectedScore: bestScore };
    },

    _cloneSim(sim, snapshot, advanceMs) {
        const clone = new Simulation(sim.W, sim.H, sim.cfg, Date.now());
        clone.dots = snapshot.map(d => ({ ...d }));
        clone.explosionRadius = sim.explosionRadius;
        clone.gameState = 'playing';
        // Advance by delay
        const DT = 16.67;
        for (let t = 0; t < advanceMs; t += DT) {
            const margin = clone.cfg.SCREEN_MARGIN;
            for (const d of clone.dots) {
                if (!d.active) continue;
                d.x += d.vx;
                d.y += d.vy;
                if (d.x < margin) { d.vx = Math.abs(d.vx); d.x = margin; }
                if (d.x > clone.W - margin) { d.vx = -Math.abs(d.vx); d.x = clone.W - margin; }
                if (d.y < margin) { d.vy = Math.abs(d.vy); d.y = margin; }
                if (d.y > clone.H - margin) { d.vy = -Math.abs(d.vy); d.y = clone.H - margin; }
            }
        }
        return clone;
    },
};

// =========================================================================
// METRICS
// =========================================================================

const Metrics = {

    // 1. Skill Ceiling Ratio: optimal / random scores
    skillCeiling(W, H, config, runs, round) {
        const randomScores = [];
        const greedyScores = [];
        const oracleScores = [];

        for (let i = 0; i < runs; i++) {
            const seed = i * 7 + 1;

            // Random bot
            const sim1 = new Simulation(W, H, config, seed);
            sim1.setupRound(round);
            const rTap = Bots.random(sim1);
            sim1.tap(rTap.x, rTap.y);
            sim1.resolveChain();
            randomScores.push(sim1.chainCount);

            // Greedy bot
            const sim2 = new Simulation(W, H, config, seed);
            sim2.setupRound(round);
            const gTap = Bots.greedy(sim2);
            sim2.tap(gTap.x, gTap.y);
            sim2.resolveChain();
            greedyScores.push(sim2.chainCount);

            // Oracle (expensive — run fewer)
            if (i < Math.min(runs, 100)) {
                const sim3 = new Simulation(W, H, config, seed);
                sim3.setupRound(round);
                const oTap = Bots.oracle(sim3, 8, 15);
                const sim3b = new Simulation(W, H, config, seed);
                sim3b.setupRound(round);
                // Advance by oracle delay
                const DT = 16.67;
                for (let t = 0; t < oTap.delay; t += DT) sim3b.step(DT);
                sim3b.tap(oTap.x, oTap.y);
                sim3b.resolveChain();
                oracleScores.push(sim3b.chainCount);
            }
        }

        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const pct = (arr, p) => { const s = [...arr].sort((a,b) => a - b); return s[Math.floor(s.length * p)] || 0; };

        const rAvg = avg(randomScores);
        const gAvg = avg(greedyScores);
        const oAvg = oracleScores.length ? avg(oracleScores) : gAvg;

        return {
            metric: 'skill-ceiling',
            randomAvg: rAvg,
            greedyAvg: gAvg,
            oracleAvg: oAvg,
            SCR: rAvg > 0 ? oAvg / rAvg : Infinity,
            greedySCR: rAvg > 0 ? gAvg / rAvg : Infinity,
            skillGapRatio: oAvg > 0 ? (oAvg - rAvg) / oAvg : 0,
            humanCapture: oAvg > rAvg ? (gAvg - rAvg) / (oAvg - rAvg) : 0,
            randomP50: pct(randomScores, 0.5),
            greedyP50: pct(greedyScores, 0.5),
            oracleP50: oracleScores.length ? pct(oracleScores, 0.5) : null,
        };
    },

    // 2. Drift Hit Ratio
    driftRatio(W, H, config, runs, round) {
        let totalHits = 0, driftHits = 0, expansionHits = 0;
        const driftTimings = [];

        for (let i = 0; i < runs; i++) {
            const sim = new Simulation(W, H, config, i * 7 + 1);
            sim.setupRound(round);
            const tap = Bots.greedy(sim);
            sim.tap(tap.x, tap.y);
            sim.resolveChain();

            for (const h of sim._hitLog) {
                totalHits++;
                if (h.expansionHit) expansionHits++;
                else { driftHits++; driftTimings.push(h.time); }
            }
        }

        return {
            metric: 'drift-ratio',
            totalHits,
            expansionHits,
            driftHits,
            DHR: totalHits > 0 ? driftHits / totalHits : 0,
            avgDriftTime: driftTimings.length > 0
                ? driftTimings.reduce((a, b) => a + b, 0) / driftTimings.length : 0,
        };
    },

    // 3. Chain Length Distribution
    chainDistribution(W, H, config, runs, round) {
        const chains = [];
        const greedyChains = [];

        for (let i = 0; i < runs; i++) {
            const seed = i * 7 + 1;

            // Random taps
            const sim1 = new Simulation(W, H, config, seed);
            sim1.setupRound(round);
            const rTap = Bots.random(sim1);
            sim1.tap(rTap.x, rTap.y);
            sim1.resolveChain();
            chains.push(sim1.chainCount);

            // Greedy taps
            const sim2 = new Simulation(W, H, config, seed);
            sim2.setupRound(round);
            const gTap = Bots.greedy(sim2);
            sim2.tap(gTap.x, gTap.y);
            sim2.resolveChain();
            greedyChains.push(sim2.chainCount);
        }

        const histogram = {};
        for (const c of chains) histogram[c] = (histogram[c] || 0) + 1;

        const sorted = [...chains].sort((a, b) => a - b);
        const gSorted = [...greedyChains].sort((a, b) => a - b);
        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const pct = (s, p) => s[Math.floor(s.length * p)] || 0;

        const params = getRoundParams(round, config);
        const godThreshold = Math.floor(params.dots * 0.8);

        return {
            metric: 'chain-distribution',
            random: {
                mean: avg(chains),
                median: pct(sorted, 0.5),
                p10: pct(sorted, 0.1),
                p90: pct(sorted, 0.9),
                p99: pct(sorted, 0.99),
                max: sorted[sorted.length - 1],
                zeroChains: chains.filter(c => c === 0).length,
                godChains: chains.filter(c => c >= godThreshold).length,
            },
            greedy: {
                mean: avg(greedyChains),
                median: pct(gSorted, 0.5),
                p90: pct(gSorted, 0.9),
                max: gSorted[gSorted.length - 1],
                godChains: greedyChains.filter(c => c >= godThreshold).length,
            },
            godThreshold,
            histogram: Object.entries(histogram).sort((a, b) => +a[0] - +b[0])
                .map(([k, v]) => `${k}:${v}`).join(' '),
        };
    },

    // 4. Opportunity Density
    opportunityDensity(W, H, config, runs, round) {
        const clusterCounts = []; // max cluster per frame
        const gapDurations = [];
        const halfLives = [];

        for (let i = 0; i < runs; i++) {
            const sim = new Simulation(W, H, config, i * 7 + 1);
            sim.setupRound(round);
            const DT = 16.67;
            const frameClusters = [];
            let inCluster = false, clusterStart = 0, gapStart = 0;

            // Simulate 10 seconds of drift (no tap)
            for (let t = 0; t < 10000; t += DT) {
                sim.step(DT);
                // Grid search for max cluster
                let maxC = 0;
                const gridN = 12;
                for (let gx = 0; gx < gridN; gx++) {
                    for (let gy = 0; gy < gridN; gy++) {
                        const x = (gx + 0.5) * sim.W / gridN;
                        const y = (gy + 0.5) * sim.H / gridN;
                        maxC = Math.max(maxC, sim.countInRadius(x, y, sim.explosionRadius));
                    }
                }
                frameClusters.push(maxC);

                const hasCluster = maxC >= 3;
                if (hasCluster && !inCluster) {
                    inCluster = true;
                    clusterStart = t;
                    if (gapStart > 0) gapDurations.push(t - gapStart);
                } else if (!hasCluster && inCluster) {
                    inCluster = false;
                    gapStart = t;
                    halfLives.push(t - clusterStart);
                }
            }
            clusterCounts.push(...frameClusters);
        }

        const f3 = clusterCounts.filter(c => c >= 3).length / clusterCounts.length;
        const f5 = clusterCounts.filter(c => c >= 5).length / clusterCounts.length;
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const pct = (arr, p) => {
            if (!arr.length) return 0;
            const s = [...arr].sort((a, b) => a - b);
            return s[Math.floor(s.length * p)] || 0;
        };

        return {
            metric: 'opportunity-density',
            f3: (f3 * 100).toFixed(1) + '%',
            f5: (f5 * 100).toFixed(1) + '%',
            avgMaxCluster: avg(clusterCounts).toFixed(2),
            gapBetweenClusters: {
                mean: avg(gapDurations).toFixed(0) + 'ms',
                median: pct(gapDurations, 0.5).toFixed(0) + 'ms',
            },
            clusterHalfLife: {
                mean: avg(halfLives).toFixed(0) + 'ms',
                median: pct(halfLives, 0.5).toFixed(0) + 'ms',
            },
        };
    },

    // 5. Input Sensitivity
    inputSensitivity(W, H, config, runs, round) {
        const r50Values = [];
        const gradients = [];

        for (let i = 0; i < Math.min(runs, 200); i++) {
            const sim = new Simulation(W, H, config, i * 7 + 1);
            sim.setupRound(round);

            // Find optimal tap
            const opt = Bots.greedy(sim);

            // Score at optimal
            const simOpt = new Simulation(W, H, config, i * 7 + 1);
            simOpt.setupRound(round);
            simOpt.tap(opt.x, opt.y);
            simOpt.resolveChain();
            const optScore = simOpt.chainCount;
            if (optScore === 0) continue;

            // Score at 10px offsets (8 directions)
            const deltas = [10, 20, 40, 60, 80, 100];
            let foundR50 = false;
            for (const delta of deltas) {
                let avgOffsetScore = 0;
                const dirs = 8;
                for (let d = 0; d < dirs; d++) {
                    const angle = (d / dirs) * Math.PI * 2;
                    const ox = opt.x + Math.cos(angle) * delta;
                    const oy = opt.y + Math.sin(angle) * delta;
                    const simOff = new Simulation(W, H, config, i * 7 + 1);
                    simOff.setupRound(round);
                    simOff.tap(ox, oy);
                    simOff.resolveChain();
                    avgOffsetScore += simOff.chainCount;
                }
                avgOffsetScore /= dirs;
                const retention = avgOffsetScore / optScore;
                if (!foundR50 && retention <= 0.5) {
                    r50Values.push(delta);
                    foundR50 = true;
                }
                if (delta === 10) {
                    gradients.push(1 - retention); // score drop per 10px
                }
            }
            if (!foundR50) r50Values.push(100); // very forgiving
        }

        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const pct = (arr, p) => {
            if (!arr.length) return 0;
            const s = [...arr].sort((a, b) => a - b);
            return s[Math.floor(s.length * p)] || 0;
        };

        return {
            metric: 'input-sensitivity',
            r50: {
                mean: avg(r50Values).toFixed(1) + 'px',
                median: pct(r50Values, 0.5).toFixed(1) + 'px',
                p25: pct(r50Values, 0.25).toFixed(1) + 'px',
            },
            scoreDropPer10px: {
                mean: (avg(gradients) * 100).toFixed(1) + '%',
                median: (pct(gradients, 0.5) * 100).toFixed(1) + '%',
            },
        };
    },

    // 6. Chaos Decay Rate
    chaosDecay(W, H, config, runs, round) {
        const decays = []; // score retention after 200ms delay

        for (let i = 0; i < Math.min(runs, 100); i++) {
            const seed = i * 7 + 1;
            const sim = new Simulation(W, H, config, seed);
            sim.setupRound(round);

            // Find optimal now
            const tapNow = Bots.greedy(sim);

            // Score tapping now
            const sim1 = new Simulation(W, H, config, seed);
            sim1.setupRound(round);
            sim1.tap(tapNow.x, tapNow.y);
            sim1.resolveChain();
            const scoreNow = sim1.chainCount;
            if (scoreNow === 0) continue;

            // Score tapping same spot 200ms later (dots have drifted)
            const sim2 = new Simulation(W, H, config, seed);
            sim2.setupRound(round);
            const DT = 16.67;
            for (let t = 0; t < 200; t += DT) sim2.step(DT);
            sim2.tap(tapNow.x, tapNow.y);
            sim2.resolveChain();
            const score200 = sim2.chainCount;

            // Score tapping same spot 500ms later
            const sim3 = new Simulation(W, H, config, seed);
            sim3.setupRound(round);
            for (let t = 0; t < 500; t += DT) sim3.step(DT);
            sim3.tap(tapNow.x, tapNow.y);
            sim3.resolveChain();
            const score500 = sim3.chainCount;

            decays.push({
                scoreNow, score200, score500,
                retention200: score200 / scoreNow,
                retention500: score500 / scoreNow,
            });
        }

        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        return {
            metric: 'chaos-decay',
            samples: decays.length,
            retention200ms: (avg(decays.map(d => d.retention200)) * 100).toFixed(1) + '%',
            retention500ms: (avg(decays.map(d => d.retention500)) * 100).toFixed(1) + '%',
            avgChainNow: avg(decays.map(d => d.scoreNow)).toFixed(1),
            avgChain200: avg(decays.map(d => d.score200)).toFixed(1),
            avgChain500: avg(decays.map(d => d.score500)).toFixed(1),
        };
    },
};

// =========================================================================
// CLI
// =========================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        runs: 500,
        round: 5,
        viewport: '800x600',
        metric: 'all',
        config: {},
        compare: null,
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--runs') opts.runs = parseInt(args[++i]);
        else if (args[i] === '--round') opts.round = parseInt(args[++i]);
        else if (args[i] === '--viewport') opts.viewport = args[++i];
        else if (args[i] === '--metric') opts.metric = args[++i];
        else if (args[i] === '--config') opts.config = JSON.parse(args[++i]);
        else if (args[i] === '--compare') {
            opts.compare = [JSON.parse(args[++i]), JSON.parse(args[++i])];
        }
    }
    return opts;
}

function runDashboard(W, H, config, runs, round) {
    const label = `${W}x${H} R${round} (${runs} runs)`;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  CHAIN REACTION — Simulation Dashboard`);
    console.log(`  ${label}`);
    console.log(`  explosionRadius: ${Math.max(DEFAULT_CONFIG.EXPLOSION_RADIUS_MIN_PX, Math.min(W, H, 800) * (config.EXPLOSION_RADIUS_PCT || DEFAULT_CONFIG.EXPLOSION_RADIUS_PCT)).toFixed(1)}px`);
    console.log(`${'='.repeat(60)}\n`);

    const t0 = Date.now();

    // Chain distribution (fast)
    process.stdout.write('  [1/6] Chain distribution...      ');
    const chains = Metrics.chainDistribution(W, H, config, runs, round);
    console.log(`done (${Date.now() - t0}ms)`);
    printResult(chains);

    // Skill ceiling
    const t1 = Date.now();
    process.stdout.write('  [2/6] Skill ceiling...           ');
    const skill = Metrics.skillCeiling(W, H, config, runs, round);
    console.log(`done (${Date.now() - t1}ms)`);
    printResult(skill);

    // Drift ratio
    const t2 = Date.now();
    process.stdout.write('  [3/6] Drift hit ratio...         ');
    const drift = Metrics.driftRatio(W, H, config, runs, round);
    console.log(`done (${Date.now() - t2}ms)`);
    printResult(drift);

    // Input sensitivity
    const t3 = Date.now();
    process.stdout.write('  [4/6] Input sensitivity...       ');
    const sensitivity = Metrics.inputSensitivity(W, H, config, Math.min(runs, 200), round);
    console.log(`done (${Date.now() - t3}ms)`);
    printResult(sensitivity);

    // Opportunity density (slower — fewer runs)
    const t4 = Date.now();
    process.stdout.write('  [5/6] Opportunity density...     ');
    const density = Metrics.opportunityDensity(W, H, config, Math.min(runs, 50), round);
    console.log(`done (${Date.now() - t4}ms)`);
    printResult(density);

    // Chaos decay (expensive)
    const t5 = Date.now();
    process.stdout.write('  [6/6] Chaos decay...             ');
    const chaos = Metrics.chaosDecay(W, H, config, Math.min(runs, 100), round);
    console.log(`done (${Date.now() - t5}ms)`);
    printResult(chaos);

    // Summary with sweet-spot ranges
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  SWEET SPOT CHECK');
    console.log(`${'─'.repeat(60)}`);

    const scr = skill.SCR;
    const dhr = drift.DHR;
    const f3 = parseFloat(density.f3);
    const r50 = parseFloat(sensitivity.r50.mean);
    const ret200 = parseFloat(chaos.retention200ms);

    check('Skill ceiling (SCR)', scr, 2.0, 5.0, '×');
    check('Drift hit ratio', dhr, 0.30, 0.55, '');
    check('Opportunity (F3)', f3, 30, 60, '%');
    check('Input sensitivity (R50)', r50, 30, 80, 'px');
    check('Chaos retention @200ms', ret200, 40, 85, '%');

    console.log(`\n  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

    return { chains, skill, drift, sensitivity, density, chaos };
}

function check(name, value, low, high, unit) {
    let status;
    if (value >= low && value <= high) status = '\x1b[32m OK \x1b[0m';
    else if (value < low) status = '\x1b[33m LOW\x1b[0m';
    else status = '\x1b[33mHIGH\x1b[0m';

    const val = typeof value === 'number' ? value.toFixed(2) : value;
    console.log(`  ${status}  ${name.padEnd(28)} ${val}${unit}  (sweet: ${low}-${high}${unit})`);
}

function printResult(obj) {
    const { metric, ...rest } = obj;
    console.log(`\n  ── ${metric} ──`);
    for (const [k, v] of Object.entries(rest)) {
        if (typeof v === 'object' && v !== null) {
            console.log(`    ${k}:`);
            for (const [k2, v2] of Object.entries(v)) {
                console.log(`      ${k2}: ${v2}`);
            }
        } else {
            console.log(`    ${k}: ${v}`);
        }
    }
}

// =========================================================================
// EXPORTS (for require() by other scripts)
// =========================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Simulation, DEFAULT_CONFIG, getRoundParams, getMultiplier, Bots, Metrics, createRNG };
}

// =========================================================================
// MAIN (only when run directly)
// =========================================================================

if (require.main === module) {
    const opts = parseArgs();
    const [W, H] = opts.viewport.split('x').map(Number);
    const config = { ...DEFAULT_CONFIG, ...opts.config };

    if (opts.compare) {
        console.log('\n  A/B COMPARISON\n');
        console.log('  Config A:', JSON.stringify(opts.compare[0]));
        const resultA = runDashboard(W, H, { ...config, ...opts.compare[0] }, opts.runs, opts.round);
        console.log('\n  Config B:', JSON.stringify(opts.compare[1]));
        const resultB = runDashboard(W, H, { ...config, ...opts.compare[1] }, opts.runs, opts.round);
    } else if (opts.metric !== 'all') {
        const fn = Metrics[opts.metric.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
        if (!fn) { console.error(`Unknown metric: ${opts.metric}`); process.exit(1); }
        const result = fn(W, H, config, opts.runs, opts.round);
        printResult(result);
    } else {
        runDashboard(W, H, config, opts.runs, opts.round);
    }
}
