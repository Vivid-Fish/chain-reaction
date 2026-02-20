#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Mechanic Experiment Harness
//
// Tests 4 candidate mechanics against baseline, all 6 metrics.
// Each mechanic is a toggleable config flag in an enhanced Simulation.
//
// Usage:
//   node experiment.js                    # Run all experiments
//   node experiment.js --only afterglow   # Run one experiment
//   node experiment.js --runs 200         # Fewer runs (faster)
//   node experiment.js --round 5          # Test at specific round
//   node experiment.js --combos           # Test promising combinations
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

// --- Default Config (matches game v7) ---
const DEFAULT_CONFIG = {
    EXPLOSION_RADIUS_PCT: 0.11,
    EXPLOSION_RADIUS_MIN_PX: 35,
    EXPLOSION_GROW_MS: 200,
    EXPLOSION_HOLD_MS: 1000,
    EXPLOSION_SHRINK_MS: 500,
    CASCADE_STAGGER_MS: 80,
    CASCADE_JITTER_MS: 25,
    MIN_DOT_DISTANCE: 25,
    SCREEN_MARGIN: 16,
    MULT_THRESHOLDS: [
        { chain: 0, mult: 1 }, { chain: 5, mult: 2 },
        { chain: 10, mult: 3 }, { chain: 15, mult: 4 },
        { chain: 20, mult: 5 }, { chain: 30, mult: 8 },
    ],

    // === MECHANIC TOGGLES ===
    // Afterglow: explosion leaves ember zone after shrinking
    afterglow: false,
    afterglowRadiusPct: 0.40,   // ember = 40% of peak explosion radius
    afterglowDurationMs: 500,    // ember persists this long

    // Resonance: near-miss dots get speed boost
    resonance: false,
    resonanceRange: 2.0,        // multiplier of explosion radius
    resonanceSpeedBoost: 0.60,  // +60% speed
    resonanceDecayMs: 2000,     // boost decays over 2s
    resonanceRadiusBoost: 0.20, // excited dots have +20% explosion radius

    // Elastic collisions: dots bounce off each other
    elastic: false,
    elasticRestitution: 0.8,    // bounciness (1.0 = perfect elastic)

    // Cascade momentum: each chain step bigger + longer
    cascade: false,
    cascadeRadiusGrowth: 0.10,  // +10% radius per generation
    cascadeDurationGrowth: 100, // +100ms hold per generation
    cascadeGenCap: 4,           // max generation for cascade scaling
    cascadePullAtDepth: 5,      // start pulling dots at chain depth 5+
    cascadePullForce: 0.015,    // pull strength
};

function getRoundParams(r, config) {
    const dots = Math.min(60, Math.floor(10 + r * 2.5));
    const pct = Math.min(0.80, 0.05 + (r - 1) * 0.028);
    const target = Math.max(1, Math.ceil(dots * pct));
    const speedMin = (config.speedMin || 0.6) + Math.min(0.4, (r - 1) * 0.03);
    const speedMax = (config.speedMax || 1.2) + Math.min(0.8, (r - 1) * 0.05);
    return { dots, target, pct, speedMin, speedMax };
}

function getMultiplier(chain, thresholds) {
    let m = 1;
    for (const t of thresholds) { if (chain >= t.chain) m = t.mult; }
    return m;
}

// =========================================================================
// ENHANCED SIMULATION (supports all 4 mechanic toggles)
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
        this.embers = [];          // afterglow hot zones
        this.chainCount = 0;
        this.score = 0;
        this.currentMultiplier = 1;
        this.gameState = 'idle';
        this.time = 0;
        this.slowMo = 1.0;
        this.slowMoTarget = 1.0;
        this._hitLog = [];
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
                    // Resonance state
                    excited: 0,          // remaining excitement ms (0 = normal)
                    baseSpeed: spd,      // original speed magnitude
                });
            }
            attempts++;
        }
    }

    setupRound(round) {
        const params = getRoundParams(round, this.cfg);
        let typeWeights = this.cfg.dotTypes;
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
        this.explosions = [];
        this.pendingExplosions = [];
        this.embers = [];
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

        // Cascade momentum: each generation bigger + longer (capped)
        if (this.cfg.cascade && generation > 0) {
            const effectiveGen = Math.min(generation, this.cfg.cascadeGenCap);
            maxRadius *= (1 + this.cfg.cascadeRadiusGrowth * effectiveGen);
            holdMs += this.cfg.cascadeDurationGrowth * effectiveGen;
        }

        // Resonance: excited dots get bigger explosions
        if (this.cfg.resonance && dotType === '_excited') {
            maxRadius *= (1 + this.cfg.resonanceRadiusBoost);
            dotType = 'standard'; // excited is a state, not a type
        }

        return {
            x, y, generation,
            dotType: dotType || 'standard',
            maxRadius,
            radius: 0,
            phase: 'grow',
            age: 0,
            holdMs,
            caught: new Set(),
            createdAt: this.time,
        };
    }

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

        // Update dots
        const margin = this.cfg.SCREEN_MARGIN;
        for (const d of this.dots) {
            if (!d.active) continue;

            // Resonance: decay excitement, apply speed boost
            if (this.cfg.resonance && d.excited > 0) {
                d.excited = Math.max(0, d.excited - dt);
                const boostFactor = 1 + this.cfg.resonanceSpeedBoost * (d.excited / this.cfg.resonanceDecayMs);
                const currentSpeed = Math.hypot(d.vx, d.vy);
                if (currentSpeed > 0.01) {
                    const targetSpeed = d.baseSpeed * boostFactor;
                    const scale = targetSpeed / currentSpeed;
                    d.vx *= scale;
                    d.vy *= scale;
                }
            }

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

            // Wall bounce
            if (d.x < margin) { d.vx = Math.abs(d.vx); d.x = margin; }
            if (d.x > this.W - margin) { d.vx = -Math.abs(d.vx); d.x = this.W - margin; }
            if (d.y < margin) { d.vy = Math.abs(d.vy); d.y = margin; }
            if (d.y > this.H - margin) { d.vy = -Math.abs(d.vy); d.y = this.H - margin; }
        }

        // Elastic collisions: dots bounce off each other
        if (this.cfg.elastic) {
            const activeDots = this.dots.filter(d => d.active);
            for (let i = 0; i < activeDots.length; i++) {
                for (let j = i + 1; j < activeDots.length; j++) {
                    const a = activeDots[i], b = activeDots[j];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy);
                    const minDist = 10; // dot diameter
                    if (dist < minDist && dist > 0.1) {
                        // Elastic collision with restitution
                        const nx = dx / dist, ny = dy / dist;
                        const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
                        const dvn = dvx * nx + dvy * ny;
                        if (dvn > 0) { // approaching
                            const massA = a.type === 'gravity' ? 2.0 : (a.type === 'volatile' ? 0.7 : 1.0);
                            const massB = b.type === 'gravity' ? 2.0 : (b.type === 'volatile' ? 0.7 : 1.0);
                            const e = this.cfg.elasticRestitution;
                            const j_imp = (1 + e) * dvn / (1/massA + 1/massB);
                            a.vx -= (j_imp / massA) * nx;
                            a.vy -= (j_imp / massA) * ny;
                            b.vx += (j_imp / massB) * nx;
                            b.vy += (j_imp / massB) * ny;
                            // Separate overlapping dots
                            const overlap = minDist - dist;
                            a.x -= nx * overlap * 0.5;
                            a.y -= ny * overlap * 0.5;
                            b.x += nx * overlap * 0.5;
                            b.y += ny * overlap * 0.5;
                        }
                    }
                }
            }
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
                if (t >= 1) {
                    // Afterglow: spawn ember when explosion dies
                    if (cfg.afterglow) {
                        this.embers.push({
                            x: e.x, y: e.y,
                            radius: e.maxRadius * cfg.afterglowRadiusPct,
                            dotType: e.dotType,
                            generation: e.generation,
                            remaining: cfg.afterglowDurationMs,
                            caught: new Set(e.caught), // don't re-catch same dots
                        });
                    }
                    return false;
                }
                e.radius = e.maxRadius * (1 - easeInQuad(t));
            }

            // Collision detection
            if (e.phase === 'grow' || e.phase === 'hold') {
                // Gravity-type explosion pull
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

                // Cascade momentum: pull at high chain depths
                if (cfg.cascade && e.generation >= cfg.cascadePullAtDepth) {
                    const pullR = e.maxRadius * 2.0;
                    for (let i = 0; i < this.dots.length; i++) {
                        const dot = this.dots[i];
                        if (!dot.active || e.caught.has(i)) continue;
                        const dist = Math.hypot(dot.x - e.x, dot.y - e.y);
                        if (dist < pullR && dist > 5) {
                            const f = cfg.cascadePullForce * this.slowMo / (dist / e.maxRadius);
                            dot.vx += (e.x - dot.x) / dist * f;
                            dot.vy += (e.y - dot.y) / dist * f;
                        }
                    }
                }

                // Resonance: excite near-miss dots
                if (cfg.resonance) {
                    const exciteR = e.maxRadius * cfg.resonanceRange;
                    for (let i = 0; i < this.dots.length; i++) {
                        const dot = this.dots[i];
                        if (!dot.active || e.caught.has(i)) continue;
                        const dist = Math.hypot(dot.x - e.x, dot.y - e.y);
                        if (dist > e.radius && dist < exciteR) {
                            // Excite this dot (reset timer to full)
                            dot.excited = cfg.resonanceDecayMs;
                        }
                    }
                }

                // Standard collision: catch dots inside radius
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

        // Update embers (afterglow hot zones)
        if (cfg.afterglow) {
            this.embers = this.embers.filter(ember => {
                ember.remaining -= dt * this.slowMo;
                if (ember.remaining <= 0) return false;

                // Check for dots drifting into ember
                for (let i = 0; i < this.dots.length; i++) {
                    const dot = this.dots[i];
                    if (!dot.active || ember.caught.has(i)) continue;
                    if (Math.hypot(dot.x - ember.x, dot.y - ember.y) <= ember.radius) {
                        ember.caught.add(i);
                        this._detonateDot(dot, i, ember.generation, {
                            createdAt: this.time - 100, // treat as drift hit
                            dotType: ember.dotType,
                        });
                    }
                }
                return true;
            });
        }

        // Slow-mo lerp
        if (this.slowMo !== this.slowMoTarget) {
            this.slowMo += (this.slowMoTarget - this.slowMo) * 0.15;
            if (Math.abs(this.slowMo - this.slowMoTarget) < 0.01) this.slowMo = this.slowMoTarget;
        }
        if (this.slowMoTarget < 1 && this.explosions.length === 0 && this.pendingExplosions.length === 0) {
            this.slowMoTarget = 1.0;
        }

        // Check round end (include embers for afterglow)
        const hasActiveEffects = this.explosions.length > 0 || this.pendingExplosions.length > 0 ||
            (cfg.afterglow && this.embers.length > 0);
        if (this.gameState === 'resolving' && !hasActiveEffects) {
            this.gameState = 'done';
        }
    }

    _detonateDot(dot, dotIndex, generation, explosion) {
        if (this.scheduledDetonations.has(dotIndex)) return;
        this.scheduledDetonations.add(dotIndex);
        dot.active = false;
        this.chainCount++;

        const newMult = getMultiplier(this.chainCount, this.cfg.MULT_THRESHOLDS);
        if (newMult > this.currentMultiplier) this.currentMultiplier = newMult;
        const basePoints = 10 * (generation + 1);
        this.score += basePoints * this.currentMultiplier;

        // Log hit for drift analysis
        const explosionGrowEnd = explosion.createdAt + this.cfg.EXPLOSION_GROW_MS;
        this._hitLog.push({
            dotIndex, generation,
            time: this.time,
            expansionHit: this.time <= explosionGrowEnd,
        });

        // Schedule cascade — property transmission
        const delay = this.cfg.CASCADE_STAGGER_MS + (this.rng() - 0.5) * 2 * this.cfg.CASCADE_JITTER_MS;
        let dotType = dot.type || 'standard';

        // Resonance: excited dots get boosted explosions
        if (this.cfg.resonance && dot.excited > 0) {
            dotType = '_excited'; // signal to _createExplosion
        }

        this.pendingExplosions.push({
            x: dot.x, y: dot.y,
            generation: generation + 1,
            time: this.time + delay,
            dotType,
        });
    }

    resolveChain() {
        const DT = 16.67;
        let safetyLimit = 30000 / DT;
        while (this.gameState === 'resolving' && safetyLimit-- > 0) {
            this.step(DT);
        }
    }

    getSnapshot() {
        return this.dots.map(d => ({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, active: d.active, type: d.type }));
    }

    countInRadius(x, y, radius) {
        let c = 0;
        for (const d of this.dots) {
            if (d.active && Math.hypot(d.x - x, d.y - y) <= radius) c++;
        }
        return c;
    }
}

// =========================================================================
// BOTS (same as sim.js)
// =========================================================================

const Bots = {
    random(sim) {
        const margin = sim.cfg.SCREEN_MARGIN + 20;
        return {
            x: margin + sim.rng() * (sim.W - margin * 2),
            y: margin + 50 + sim.rng() * (sim.H - margin * 2 - 50),
        };
    },

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

    humanSim(sim) {
        const best = Bots.greedy(sim, 15);
        const noiseX = (sim.rng() + sim.rng() + sim.rng() - 1.5) * 20;
        const noiseY = (sim.rng() + sim.rng() + sim.rng() - 1.5) * 20;
        return {
            x: Math.max(20, Math.min(sim.W - 20, best.x + noiseX)),
            y: Math.max(70, Math.min(sim.H - 20, best.y + noiseY)),
            delay: 200,
        };
    },

    oracle(sim, timeSteps = 8, gridSize = 15) {
        let bestScore = 0, bestX = sim.W / 2, bestY = sim.H / 2, bestDelay = 0;
        const snapshot = sim.getSnapshot();

        for (let t = 0; t < timeSteps; t++) {
            const delay = t * 200;
            const clone = Bots._cloneSim(sim, snapshot, delay);
            const tap = Bots.greedy(clone, gridSize);
            clone.tap(tap.x, tap.y);
            clone.resolveChain();
            if (clone.score > bestScore) {
                bestScore = clone.score;
                bestX = tap.x; bestY = tap.y; bestDelay = delay;
            }
        }
        return { x: bestX, y: bestY, delay: bestDelay, projectedScore: bestScore };
    },

    _cloneSim(sim, snapshot, advanceMs) {
        const clone = new Simulation(sim.W, sim.H, sim.cfg, Date.now());
        clone.dots = snapshot.map(d => ({ ...d, excited: 0, baseSpeed: Math.hypot(d.vx, d.vy) }));
        clone.explosionRadius = sim.explosionRadius;
        clone.gameState = 'playing';
        const DT = 16.67;
        for (let t = 0; t < advanceMs; t += DT) {
            const margin = clone.cfg.SCREEN_MARGIN;
            for (const d of clone.dots) {
                if (!d.active) continue;
                d.x += d.vx; d.y += d.vy;
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
// METRICS (condensed — returns numeric values for easy comparison)
// =========================================================================

function runMetrics(W, H, config, runs, round) {
    let randomTotal = 0, greedyTotal = 0, oracleTotal = 0, oracleN = 0;
    let totalHits = 0, driftHits = 0;
    const chainLengths = [];
    const greedyChainLengths = [];

    for (let i = 0; i < runs; i++) {
        const seed = i * 7 + 1;

        // Random
        const sim1 = new Simulation(W, H, config, seed);
        sim1.setupRound(round);
        const rTap = Bots.random(sim1);
        sim1.tap(rTap.x, rTap.y);
        sim1.resolveChain();
        randomTotal += sim1.chainCount;
        chainLengths.push(sim1.chainCount);

        // Greedy
        const sim2 = new Simulation(W, H, config, seed);
        sim2.setupRound(round);
        const gTap = Bots.greedy(sim2);
        sim2.tap(gTap.x, gTap.y);
        sim2.resolveChain();
        greedyTotal += sim2.chainCount;
        greedyChainLengths.push(sim2.chainCount);

        // Drift ratio (from greedy runs)
        for (const h of sim2._hitLog) {
            totalHits++;
            if (!h.expansionHit) driftHits++;
        }

        // Oracle (fewer)
        if (i < Math.min(runs, 80)) {
            const sim3 = new Simulation(W, H, config, seed);
            sim3.setupRound(round);
            const oTap = Bots.oracle(sim3, 8, 15);
            const sim3b = new Simulation(W, H, config, seed);
            sim3b.setupRound(round);
            const DT = 16.67;
            for (let t = 0; t < oTap.delay; t += DT) sim3b.step(DT);
            sim3b.tap(oTap.x, oTap.y);
            sim3b.resolveChain();
            oracleTotal += sim3b.chainCount;
            oracleN++;
        }
    }

    const rAvg = randomTotal / runs;
    const gAvg = greedyTotal / runs;
    const oAvg = oracleN > 0 ? oracleTotal / oracleN : gAvg;
    const SCR = rAvg > 0 ? oAvg / rAvg : 0;
    const DHR = totalHits > 0 ? driftHits / totalHits : 0;

    // Opportunity density (F3) — fewer runs, heavier computation
    let f3Frames = 0, f3Total = 0;
    for (let i = 0; i < Math.min(runs, 30); i++) {
        const sim = new Simulation(W, H, config, i * 7 + 1);
        sim.setupRound(round);
        const DT = 16.67;
        for (let t = 0; t < 10000; t += DT) {
            sim.step(DT);
            let maxC = 0;
            const gridN = 10;
            for (let gx = 0; gx < gridN; gx++) {
                for (let gy = 0; gy < gridN; gy++) {
                    const x = (gx + 0.5) * sim.W / gridN;
                    const y = (gy + 0.5) * sim.H / gridN;
                    maxC = Math.max(maxC, sim.countInRadius(x, y, sim.explosionRadius));
                }
            }
            f3Total++;
            if (maxC >= 3) f3Frames++;
        }
    }
    const F3 = f3Total > 0 ? (f3Frames / f3Total) * 100 : 0;

    // Input sensitivity (R50)
    let r50Sum = 0, r50N = 0;
    for (let i = 0; i < Math.min(runs, 100); i++) {
        const sim = new Simulation(W, H, config, i * 7 + 1);
        sim.setupRound(round);
        const opt = Bots.greedy(sim);
        const simOpt = new Simulation(W, H, config, i * 7 + 1);
        simOpt.setupRound(round);
        simOpt.tap(opt.x, opt.y);
        simOpt.resolveChain();
        if (simOpt.chainCount === 0) continue;
        const optScore = simOpt.chainCount;

        for (const delta of [20, 40, 60, 80, 100]) {
            let avgOff = 0;
            for (let d = 0; d < 8; d++) {
                const angle = (d / 8) * Math.PI * 2;
                const simOff = new Simulation(W, H, config, i * 7 + 1);
                simOff.setupRound(round);
                simOff.tap(opt.x + Math.cos(angle) * delta, opt.y + Math.sin(angle) * delta);
                simOff.resolveChain();
                avgOff += simOff.chainCount;
            }
            if (avgOff / 8 / optScore <= 0.5) {
                r50Sum += delta; r50N++; break;
            }
            if (delta === 100) { r50Sum += 100; r50N++; }
        }
    }
    const R50 = r50N > 0 ? r50Sum / r50N : 100;

    // Chaos decay
    let retSum = 0, retN = 0;
    for (let i = 0; i < Math.min(runs, 60); i++) {
        const seed = i * 7 + 1;
        const sim = new Simulation(W, H, config, seed);
        sim.setupRound(round);
        const tapNow = Bots.greedy(sim);
        const sim1 = new Simulation(W, H, config, seed);
        sim1.setupRound(round);
        sim1.tap(tapNow.x, tapNow.y);
        sim1.resolveChain();
        if (sim1.chainCount === 0) continue;

        const sim2 = new Simulation(W, H, config, seed);
        sim2.setupRound(round);
        const DT = 16.67;
        for (let t = 0; t < 200; t += DT) sim2.step(DT);
        sim2.tap(tapNow.x, tapNow.y);
        sim2.resolveChain();
        retSum += sim2.chainCount / sim1.chainCount;
        retN++;
    }
    const Chaos = retN > 0 ? (retSum / retN) * 100 : 0;

    // Chain distribution stats
    const sorted = [...greedyChainLengths].sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const max = sorted[sorted.length - 1] || 0;
    const params = getRoundParams(round, config);
    const godThreshold = Math.floor(params.dots * 0.8);
    const godPct = greedyChainLengths.filter(c => c >= godThreshold).length / greedyChainLengths.length * 100;

    return { SCR, DHR, F3, R50, Chaos, gAvg, oAvg, rAvg, p90, p99, max, godPct };
}

// =========================================================================
// SWEET SPOT SCORING
// =========================================================================

function scoreMetrics(m) {
    let score = 0;
    if (m.SCR >= 2.0 && m.SCR <= 5.0) score++;
    if (m.DHR >= 0.30 && m.DHR <= 0.55) score++;
    if (m.F3 >= 30 && m.F3 <= 60) score++;
    if (m.R50 >= 30 && m.R50 <= 80) score++;
    if (m.Chaos >= 40 && m.Chaos <= 85) score++;
    return score;
}

function formatMetric(name, value, low, high, unit) {
    const inRange = value >= low && value <= high;
    const tag = inRange ? '\x1b[32m OK \x1b[0m' : (value < low ? '\x1b[33m LOW\x1b[0m' : '\x1b[33mHIGH\x1b[0m');
    return `  ${tag}  ${name.padEnd(28)} ${value.toFixed(2)}${unit}  (${low}-${high}${unit})`;
}

function printResults(label, m) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${label}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(formatMetric('Skill ceiling (SCR)', m.SCR, 2.0, 5.0, 'x'));
    console.log(formatMetric('Drift hit ratio (DHR)', m.DHR, 0.30, 0.55, ''));
    console.log(formatMetric('Opportunity (F3)', m.F3, 30, 60, '%'));
    console.log(formatMetric('Input sensitivity (R50)', m.R50, 30, 80, 'px'));
    console.log(formatMetric('Chaos retention @200ms', m.Chaos, 40, 85, '%'));
    console.log(`\n  Score: ${scoreMetrics(m)}/5 in sweet spot`);
    console.log(`  Greedy avg chain: ${m.gAvg.toFixed(1)}  Oracle avg: ${m.oAvg.toFixed(1)}  Random avg: ${m.rAvg.toFixed(1)}`);
    console.log(`  Chain P90: ${m.p90}  P99: ${m.p99}  Max: ${m.max}  God%: ${m.godPct.toFixed(1)}%`);
}

// =========================================================================
// EXPERIMENT CONFIGS
// =========================================================================

const EXPERIMENTS = {
    baseline: {
        label: 'BASELINE (v7, no new mechanics)',
        config: {},
    },
    afterglow: {
        label: 'AFTERGLOW — Lingering ember zones after explosions',
        config: { afterglow: true },
    },
    afterglow_long: {
        label: 'AFTERGLOW (LONG) — 800ms embers, 50% radius',
        config: { afterglow: true, afterglowDurationMs: 800, afterglowRadiusPct: 0.50 },
    },
    resonance: {
        label: 'RESONANCE — Near-miss dots get excited (+60% speed)',
        config: { resonance: true },
    },
    resonance_strong: {
        label: 'RESONANCE (STRONG) — +80% speed, wider range',
        config: { resonance: true, resonanceSpeedBoost: 0.80, resonanceRange: 2.5 },
    },
    elastic: {
        label: 'ELASTIC — Dots bounce off each other',
        config: { elastic: true },
    },
    elastic_bouncy: {
        label: 'ELASTIC (BOUNCY) — High restitution, more chaos',
        config: { elastic: true, elasticRestitution: 1.0 },
    },
    cascade: {
        label: 'CASCADE MOMENTUM — Chains escalate in power',
        config: { cascade: true },
    },
    cascade_aggressive: {
        label: 'CASCADE (AGGRESSIVE) — +15% per gen, pull at depth 3',
        config: { cascade: true, cascadeRadiusGrowth: 0.15, cascadePullAtDepth: 3, cascadePullForce: 0.020 },
    },
    // Tuned cascade: tighter base radius, cascade compensates
    cascade_tight: {
        label: 'CASCADE TIGHT — r=0.095 base, +12%/gen, no pull',
        config: {
            cascade: true, EXPLOSION_RADIUS_PCT: 0.095,
            cascadeRadiusGrowth: 0.12, cascadePullAtDepth: 99, // no pull
        },
    },
    cascade_tight2: {
        label: 'CASCADE TIGHT2 — r=0.09 base, +15%/gen, pull@4',
        config: {
            cascade: true, EXPLOSION_RADIUS_PCT: 0.09,
            cascadeRadiusGrowth: 0.15, cascadeDurationGrowth: 80,
            cascadePullAtDepth: 4, cascadePullForce: 0.012,
        },
    },
    cascade_hold: {
        label: 'CASCADE HOLD — r=0.10, +8% radius, +150ms hold/gen',
        config: {
            cascade: true, EXPLOSION_RADIUS_PCT: 0.10,
            cascadeRadiusGrowth: 0.08, cascadeDurationGrowth: 150,
            cascadePullAtDepth: 99, // no pull
        },
    },
    // Focused cascade_hold tuning
    hold_200ms: {
        label: 'CASCADE HOLD 200ms — r=0.10, +8%r, +200ms hold/gen',
        config: { cascade: true, EXPLOSION_RADIUS_PCT: 0.10, cascadeRadiusGrowth: 0.08, cascadeDurationGrowth: 200, cascadePullAtDepth: 99 },
    },
    hold_250ms: {
        label: 'CASCADE HOLD 250ms — r=0.10, +6%r, +250ms hold/gen',
        config: { cascade: true, EXPLOSION_RADIUS_PCT: 0.10, cascadeRadiusGrowth: 0.06, cascadeDurationGrowth: 250, cascadePullAtDepth: 99 },
    },
    hold_200_fast: {
        label: 'CASCADE HOLD 200ms + FAST — speedMin 0.7, speedMax 1.4',
        config: { cascade: true, EXPLOSION_RADIUS_PCT: 0.10, cascadeRadiusGrowth: 0.08, cascadeDurationGrowth: 200, cascadePullAtDepth: 99, speedMin: 0.7, speedMax: 1.4 },
    },
    hold_150_fast: {
        label: 'CASCADE HOLD 150ms + FAST — speedMin 0.7, speedMax 1.3',
        config: { cascade: true, EXPLOSION_RADIUS_PCT: 0.10, cascadeRadiusGrowth: 0.08, cascadeDurationGrowth: 150, cascadePullAtDepth: 99, speedMin: 0.7, speedMax: 1.3 },
    },
    hold_200_r12: {
        label: 'CASCADE HOLD 200ms + 12%r — bigger growth, longer hold',
        config: { cascade: true, EXPLOSION_RADIUS_PCT: 0.10, cascadeRadiusGrowth: 0.12, cascadeDurationGrowth: 200, cascadePullAtDepth: 99 },
    },
    hold_150_r105: {
        label: 'CASCADE HOLD 150ms r=0.105 — slightly larger base',
        config: { cascade: true, EXPLOSION_RADIUS_PCT: 0.105, cascadeRadiusGrowth: 0.10, cascadeDurationGrowth: 150, cascadePullAtDepth: 99 },
    },
    // v8.1 — the shipped game config (cascade + cap)
    v8_1: {
        label: 'v8.1 SHIPPED — cascade +8%r +200ms hold, cap=4, speed 0.7-1.4',
        config: { cascade: true, EXPLOSION_RADIUS_PCT: 0.10, cascadeRadiusGrowth: 0.08, cascadeDurationGrowth: 200, cascadeGenCap: 4, cascadePullAtDepth: 99, speedMin: 0.7, speedMax: 1.4 },
    },
    // Combos
    afterglow_resonance: {
        label: 'AFTERGLOW + RESONANCE — Embers catch excited dots',
        config: { afterglow: true, resonance: true },
    },
    resonance_cascade: {
        label: 'RESONANCE + CASCADE — Excited dots feed growing chains',
        config: { resonance: true, cascade: true },
    },
    cascade_afterglow: {
        label: 'CASCADE + AFTERGLOW — Growing chains leave embers',
        config: { cascade: true, afterglow: true, EXPLOSION_RADIUS_PCT: 0.10 },
    },
    all_three: {
        label: 'AFTERGLOW + RESONANCE + CASCADE — Kitchen sink',
        config: { afterglow: true, resonance: true, cascade: true },
    },
};

// =========================================================================
// MAIN
// =========================================================================

const args = process.argv.slice(2);
let runs = 300;
let round = 5;
let only = null;
let combos = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runs') runs = parseInt(args[++i]);
    else if (args[i] === '--round') round = parseInt(args[++i]);
    else if (args[i] === '--only') only = args[++i];
    else if (args[i] === '--combos') combos = true;
}

const W = 390, H = 844; // phone viewport

console.log(`\n${'='.repeat(60)}`);
console.log(`  CHAIN REACTION — Mechanic Experiment Lab`);
console.log(`  ${W}x${H} R${round} (${runs} runs per experiment)`);
console.log(`${'='.repeat(60)}`);

let toRun;
if (only) {
    toRun = { [only]: EXPERIMENTS[only] };
    if (!toRun[only]) {
        console.error(`Unknown experiment: ${only}. Available: ${Object.keys(EXPERIMENTS).join(', ')}`);
        process.exit(1);
    }
} else if (combos) {
    toRun = {};
    for (const [k, v] of Object.entries(EXPERIMENTS)) {
        if (k.includes('_') && k !== 'afterglow_long' && k !== 'resonance_strong' &&
            k !== 'elastic_bouncy' && k !== 'cascade_aggressive') {
            toRun[k] = v;
        }
    }
    // Include baseline for comparison
    toRun = { baseline: EXPERIMENTS.baseline, ...toRun };
} else {
    // Run baseline + all solo mechanics (skip combos and variants)
    toRun = {
        baseline: EXPERIMENTS.baseline,
        afterglow: EXPERIMENTS.afterglow,
        resonance: EXPERIMENTS.resonance,
        elastic: EXPERIMENTS.elastic,
        cascade: EXPERIMENTS.cascade,
    };
}

const results = {};
for (const [name, exp] of Object.entries(toRun)) {
    const t0 = Date.now();
    process.stdout.write(`\n  Running: ${exp.label}...`);
    const m = runMetrics(W, H, { ...DEFAULT_CONFIG, ...exp.config }, runs, round);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(` (${elapsed}s)`);
    printResults(exp.label, m);
    results[name] = { ...m, label: exp.label };
}

// =========================================================================
// COMPARISON TABLE
// =========================================================================

console.log(`\n\n${'='.repeat(80)}`);
console.log(`  COMPARISON TABLE`);
console.log(`${'='.repeat(80)}`);

const header = '  ' + 'Mechanic'.padEnd(20) + 'SCR'.padStart(7) + 'DHR'.padStart(7) +
    'F3%'.padStart(7) + 'R50'.padStart(7) + 'Chaos'.padStart(7) + 'Score'.padStart(7) +
    'AvgChain'.padStart(9) + 'God%'.padStart(7);
console.log(header);
console.log('  ' + '─'.repeat(78));

for (const [name, m] of Object.entries(results)) {
    const row = '  ' + name.padEnd(20) +
        m.SCR.toFixed(2).padStart(7) +
        m.DHR.toFixed(2).padStart(7) +
        m.F3.toFixed(0).padStart(6) + '%' +
        m.R50.toFixed(0).padStart(6) +
        m.Chaos.toFixed(0).padStart(6) + '%' +
        (scoreMetrics(m) + '/5').padStart(7) +
        m.gAvg.toFixed(1).padStart(9) +
        m.godPct.toFixed(1).padStart(6) + '%';
    console.log(row);
}

// Highlight best DHR improver
const baselineDHR = results.baseline?.DHR || 0;
let bestDHR = null, bestDHRName = '';
for (const [name, m] of Object.entries(results)) {
    if (name === 'baseline') continue;
    if (!bestDHR || m.DHR > bestDHR) { bestDHR = m.DHR; bestDHRName = name; }
}

console.log(`\n  Baseline DHR: ${baselineDHR.toFixed(3)}`);
if (bestDHR) {
    const improvement = ((bestDHR - baselineDHR) / baselineDHR * 100).toFixed(1);
    console.log(`  Best DHR: ${bestDHRName} → ${bestDHR.toFixed(3)} (+${improvement}%)`);
}

// Find best overall (most metrics in sweet spot, then highest DHR as tiebreaker)
let bestOverall = null, bestName = '';
for (const [name, m] of Object.entries(results)) {
    if (name === 'baseline') continue;
    const s = scoreMetrics(m);
    if (!bestOverall || s > scoreMetrics(bestOverall) ||
        (s === scoreMetrics(bestOverall) && m.DHR > bestOverall.DHR)) {
        bestOverall = m; bestName = name;
    }
}
if (bestOverall) {
    console.log(`\n  BEST OVERALL: ${bestName} (${scoreMetrics(bestOverall)}/5, DHR ${bestOverall.DHR.toFixed(3)})`);
}

console.log('');
