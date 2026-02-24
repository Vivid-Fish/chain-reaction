'use strict';

// =========================================================================
// CHAIN REACTION — Game Core
//
// Single source of truth for all game physics, chain resolution, bots, and
// constants. Used by both headless simulation (sim.js, continuous-sim.js)
// and browser (index.html + engine.js renderer).
//
// Architecture:
//   Constants .............. ~15-75     DOT_TYPES, cascade, explosion, tiers
//   Utilities .............. ~80-120    createRNG, getRoundParams, getMultiplier
//   Game class ............. ~125-420   State, physics, chain resolution, modes
//   Bots ................... ~425-680   random, greedy, humanSim, oracle
// =========================================================================

// =====================================================================
// CONSTANTS
// =====================================================================

const DOT_TYPES = {
    standard: { label: 'standard', radiusMult: 1.0, speedMult: 1.0 },
    gravity:  { label: 'gravity',  radiusMult: 1.0, speedMult: 0.7, pullRange: 2.5, pullForce: 0.012 },
    volatile: { label: 'volatile', radiusMult: 1.5, speedMult: 1.3 },
};

const DEFAULTS = {
    EXPLOSION_RADIUS_PCT: 0.10,
    EXPLOSION_RADIUS_MIN_PX: 35,
    EXPLOSION_GROW_MS: 200,
    EXPLOSION_HOLD_MS: 1000,
    EXPLOSION_SHRINK_MS: 500,
    CASCADE_STAGGER_MS: 80,
    CASCADE_JITTER_MS: 25,
    CASCADE_RADIUS_GROWTH: 0,
    CASCADE_HOLD_GROWTH_MS: 80,
    CASCADE_GEN_CAP: 4,
    MIN_DOT_DISTANCE: 25,
    SCREEN_MARGIN: 16,
    MULT_THRESHOLDS: [
        { pct: 0.00, mult: 1 }, { pct: 0.10, mult: 2 },
        { pct: 0.20, mult: 3 }, { pct: 0.35, mult: 4 },
        { pct: 0.50, mult: 5 }, { pct: 0.75, mult: 8 },
    ],
    CELEBRATIONS: [
        { pct: 0.25, text: 'NICE!', hue: 50, size: 1.0 },
        { pct: 0.40, text: 'AMAZING!', hue: 35, size: 1.3 },
        { pct: 0.55, text: 'INCREDIBLE!', hue: 15, size: 1.6 },
        { pct: 0.70, text: 'LEGENDARY!', hue: 300, size: 2.0 },
        { pct: 0.85, text: 'GODLIKE!', hue: 280, size: 2.5 },
    ],
};

// Calibrated via calibrate-continuous.js (600s sessions, 5 seeds).
// Browser rates set at ~90% of oracle survival threshold (see DESIGN.md).
// spawnDensityScale: positive feedback — spawn rate increases with board density.
// effectiveRate = baseRate * (1 + density * spawnDensityScale)
// This creates inevitable death: more dots → faster spawning → even more dots.
const CONTINUOUS_TIERS = {
    CALM:          { spawnRate: 0.65, cooldown: 1500, maxDots:  80, speedMin: 0.4, speedMax: 0.8, dotTypes: {standard:1.0}, overflowDensity: 0.8, spawnDensityScale: 0.4 },
    FLOW:          { spawnRate: 3.60, cooldown: 2000, maxDots:  90, speedMin: 0.5, speedMax: 1.0, dotTypes: {standard:0.85, gravity:0.15}, overflowDensity: 0.8, spawnDensityScale: 0.4 },
    SURGE:         { spawnRate: 5.80, cooldown: 2500, maxDots: 100, speedMin: 0.6, speedMax: 1.2, dotTypes: {standard:0.70, gravity:0.20, volatile:0.10}, overflowDensity: 0.8, spawnDensityScale: 1.0 },
    TRANSCENDENCE: { spawnRate: 3.00, cooldown: 2000, maxDots:  60, speedMin: 0.7, speedMax: 1.4, dotTypes: {standard:0.50, gravity:0.25, volatile:0.25}, overflowDensity: 0.8, spawnDensityScale: 0.4 },
    IMPOSSIBLE:    { spawnRate: 2.20, cooldown: 1500, maxDots:  40, speedMin: 0.8, speedMax: 1.6, dotTypes: {standard:0.30, gravity:0.30, volatile:0.40}, overflowDensity: 0.8, spawnDensityScale: 0.4 },
};

// =====================================================================
// EASING (needed for explosion grow/shrink physics)
// =====================================================================
const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInQuad = t => t * t;

// =====================================================================
// UTILITIES
// =====================================================================

/** Seeded PRNG (mulberry32) */
function createRNG(seed) {
    let s = seed | 0;
    return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Round parameters: dot count, target, speeds, type weights */
function getRoundParams(round, config) {
    const dots = Math.min(60, Math.floor(10 + round * 2.5));
    const pct = Math.min(0.80, 0.05 + (round - 1) * 0.028);
    const target = Math.max(1, Math.ceil(dots * pct));
    const speedMin = ((config && config.speedMin) || 0.7) + Math.min(0.6, (round - 1) * 0.04);
    const speedMax = ((config && config.speedMax) || 1.4) + Math.min(1.2, (round - 1) * 0.07);

    // Type weights by round (gravity unlocks R3, volatile unlocks R5)
    let typeWeights;
    if (config && config.dotTypes) {
        typeWeights = config.dotTypes;
    } else if (round <= 2) {
        typeWeights = { standard: 1.0 };
    } else if (round <= 4) {
        const gw = Math.min(0.25, (round - 2) * 0.12);
        typeWeights = { standard: 1 - gw, gravity: gw };
    } else {
        const gw = Math.min(0.25, 0.12 + (round - 4) * 0.03);
        const vw = Math.min(0.20, (round - 4) * 0.08);
        typeWeights = { standard: Math.max(0.5, 1 - gw - vw), gravity: gw, volatile: vw };
    }

    return { dots, target, pct, speedMin, speedMax, typeWeights };
}

/** Look up score multiplier from chain count */
function getMultiplier(chain, thresholds, totalDots) {
    const t = thresholds || DEFAULTS.MULT_THRESHOLDS;
    let m = 1;
    for (const th of t) {
        if (chain >= Math.ceil(th.pct * totalDots)) m = th.mult;
    }
    return m;
}

// =====================================================================
// GAME CLASS — State + Physics + Chain Resolution + Modes
// =====================================================================

class Game {
    /**
     * @param {number} width - Viewport width
     * @param {number} height - Viewport height
     * @param {object} config - Override DEFAULTS
     * @param {function} rng - Random number generator (default: Math.random)
     */
    constructor(width, height, config = {}, rng = Math.random) {
        this.W = width;
        this.H = height;
        this.cfg = { ...DEFAULTS, ...config };
        this.rng = rng;

        // Spatial scale: normalize all px-dimensional physics to reference viewport
        const REF_AREA = 390 * 844;
        this.spatialScale = Math.sqrt((this.W * this.H) / REF_AREA);

        // Scale spatial constants by s (always from unscaled DEFAULTS to avoid double-scaling
        // when a clone inherits an already-scaled cfg)
        this.cfg.SCREEN_MARGIN = DEFAULTS.SCREEN_MARGIN * this.spatialScale;
        this.cfg.MIN_DOT_DISTANCE = DEFAULTS.MIN_DOT_DISTANCE * this.spatialScale;

        this.recalcRadius(0);

        // Events: filled during step(), drained by consumer
        this.events = [];

        // Continuous mode state
        this._continuous = false;
        this._contCfg = null;
        this._spawnAccum = 0;
        this._lastTapTime = -Infinity;
        this._overflowStart = -1;
        this.overflowed = false;
        this.totalTaps = 0;
        this.totalDotsSpawned = 0;
        this.totalDotsCaught = 0;
        this.chainLengths = [];
        this.densityHistory = [];
        this._lastDensitySample = 0;

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
        this.totalDots = 0;
        this.lastCelebration = 0;

        // Metrics instrumentation
        this._hitLog = [];
    }

    /** Recalculate explosion radius for current viewport + optional round scaling. */
    recalcRadius(round) {
        const REF_RADIUS = 39; // 390 * 0.10 at reference viewport
        let r = REF_RADIUS * this.spatialScale;
        if (round > 0) r *= Math.max(0.85, 1.0 - (round - 1) * 0.01);
        this.explosionRadius = r;
        return r;
    }

    // === ROUND MODE ===

    setupRound(round) {
        this.recalcRadius(round);

        const params = getRoundParams(round, this.cfg);
        this._generateDots(params.dots, params.speedMin, params.speedMax, params.typeWeights);
        this.totalDots = this.dots.length;
        this.explosions = [];
        this.pendingExplosions = [];
        this.scheduledDetonations = new Set();
        this.chainCount = 0;
        this.score = 0;
        this.currentMultiplier = 1;
        this.lastCelebration = 0;
        this.gameState = 'playing';
        this.time = 0;
        this.slowMo = 1.0;
        this.slowMoTarget = 1.0;
        this._hitLog = [];
        this._continuous = false;
        return params;
    }

    // === CONTINUOUS MODE ===

    startContinuous(tierConfig) {
        this._contCfg = tierConfig;
        this._continuous = true;
        this._spawnAccum = 0;
        this._lastTapTime = -Infinity;
        this._overflowStart = -1;
        this.overflowed = false;
        this.totalTaps = 0;
        this.totalDotsSpawned = 0;
        this.totalDotsCaught = 0;
        this.chainLengths = [];
        this.densityHistory = [];
        this._lastDensitySample = 0;

        this.dots = [];
        this.explosions = [];
        this.pendingExplosions = [];
        this.scheduledDetonations = new Set();
        this.chainCount = 0;
        this.score = 0;
        this.currentMultiplier = 1;
        this.lastCelebration = 0;
        this.gameState = 'playing';
        this.time = 0;
        this.totalDots = 0;
        this._hitLog = [];
    }

    canTap() {
        if (!this._continuous) return this.gameState === 'playing';
        // Continuous: only cooldown gates tapping — chains resolve in background
        return (this.time - this._lastTapTime) >= this._contCfg.cooldown;
    }

    cooldownRemaining() {
        if (!this._continuous) return 0;
        return Math.max(0, this._contCfg.cooldown - (this.time - this._lastTapTime));
    }

    // === CORE API ===

    tap(x, y) {
        if (this._continuous) {
            if (!this.canTap()) return false;
            this._lastTapTime = this.time;
            this.totalTaps++;
            this.totalDots = this.activeDotCount();

            // H2: Radius decay per tap
            if (this._contCfg.radiusDecayPerTap) {
                this.explosionRadius *= (1 - this._contCfg.radiusDecayPerTap);
                // Floor at 50% of base radius
                const baseRadius = 39 * this.spatialScale;
                if (this.explosionRadius < baseRadius * 0.5) {
                    this.explosionRadius = baseRadius * 0.5;
                }
            }

            // Finalize previous chain if one is still resolving
            if (this.chainCount > 0) {
                this.chainLengths.push(this.chainCount);
                this.totalDotsCaught += this.chainCount;
                this.events.push({ type: 'chainEnd', chainLength: this.chainCount });
            }
            // Reset per-tap chain tracking for correct multiplier/celebration
            this.chainCount = 0;
            this.currentMultiplier = 1;
            this.lastCelebration = 0;
        }
        if (this.gameState !== 'playing' && this.gameState !== 'resolving') return false;
        this.gameState = 'resolving';
        this.explosions.push(this._createExplosion(x, y, 0));
        return true;
    }

    step(dt) {
        if (this._continuous && this.overflowed) return;
        this.time += dt;

        // Continuous: spawn new dots
        if (this._continuous) {
            this._spawnTick(dt);

            // H2: Radius regeneration over time
            if (this._contCfg && this._contCfg.radiusRegenRate) {
                const baseRadius = 39 * this.spatialScale;
                if (this.explosionRadius < baseRadius) {
                    this.explosionRadius += this._contCfg.radiusRegenRate * baseRadius * (dt / 1000);
                    if (this.explosionRadius > baseRadius) this.explosionRadius = baseRadius;
                }
            }
        }

        // Process pending explosions
        for (let i = this.pendingExplosions.length - 1; i >= 0; i--) {
            if (this.time >= this.pendingExplosions[i].time) {
                const p = this.pendingExplosions[i];
                this.explosions.push(this._createExplosion(p.x, p.y, p.generation, p.dotType));
                this.pendingExplosions.splice(i, 1);
            }
        }

        // Update dots: movement + gravity pull + wall bounce
        const margin = this.cfg.SCREEN_MARGIN;
        for (const d of this.dots) {
            if (!d.active) continue;
            d.x += d.vx * this.slowMo;
            d.y += d.vy * this.slowMo;

            // Gravity dots pull nearby dots
            if (d.type === 'gravity') {
                const pullR = this.explosionRadius * 2.5;
                const pullF = 0.012 * this.spatialScale;
                const deadzone = 5 * this.spatialScale;
                for (const o of this.dots) {
                    if (o === d || !o.active) continue;
                    const dist = Math.hypot(o.x - d.x, o.y - d.y);
                    if (dist < pullR && dist > deadzone) {
                        const f = pullF * this.slowMo / (dist / this.explosionRadius);
                        o.vx += (d.x - o.x) / dist * f;
                        o.vy += (d.y - o.y) / dist * f;
                    }
                }
            }

            // === FLOCKING: Cohesion + Alignment + Separation (Boids) ===
            // Cohesion: steer toward centroid of nearby same-type dots
            // Alignment (Schooling): match velocity of nearby same-type dots
            // Separation: avoid getting too close to any neighbor
            if (this._contCfg && (this._contCfg.cohesionForce > 0 || this._contCfg.alignmentForce > 0 || this._contCfg.separationForce > 0)) {
                const cRange = (this._contCfg.cohesionRange || 80) * this.spatialScale;
                const cForce = (this._contCfg.cohesionForce || 0) * this.spatialScale;
                const aForce = (this._contCfg.alignmentForce || 0) * this.spatialScale;
                const sForce = (this._contCfg.separationForce || 0) * this.spatialScale;
                const sepDist = 20 * this.spatialScale;  // separation radius

                let cx = 0, cy = 0, avx = 0, avy = 0, sx = 0, sy = 0;
                let cCount = 0, sCount = 0;

                for (const o of this.dots) {
                    if (o === d || !o.active) continue;
                    const dx = o.x - d.x, dy = o.y - d.y;
                    const dist = Math.hypot(dx, dy);

                    // Separation: repel from ALL nearby dots (any type)
                    if (sForce > 0 && dist < sepDist && dist > 1) {
                        sx -= dx / dist / dist;  // inverse-square repulsion
                        sy -= dy / dist / dist;
                        sCount++;
                    }

                    // Cohesion + Alignment: same-type only
                    if (o.type !== d.type) continue;
                    if (dist < cRange && dist > 1) {
                        cx += o.x; cy += o.y;
                        avx += o.vx; avy += o.vy;
                        cCount++;
                    }
                }

                // Apply cohesion (steer toward centroid)
                if (cCount > 0 && cForce > 0) {
                    cx /= cCount; cy /= cCount;
                    const dist = Math.hypot(cx - d.x, cy - d.y);
                    if (dist > 1) {
                        d.vx += (cx - d.x) / dist * cForce * this.slowMo;
                        d.vy += (cy - d.y) / dist * cForce * this.slowMo;
                    }
                }

                // Apply alignment (match average velocity of same-type neighbors)
                if (cCount > 0 && aForce > 0) {
                    avx /= cCount; avy /= cCount;
                    d.vx += (avx - d.vx) * aForce * this.slowMo;
                    d.vy += (avy - d.vy) * aForce * this.slowMo;
                }

                // Apply separation (push away from too-close neighbors)
                if (sCount > 0 && sForce > 0) {
                    d.vx += sx * sForce * this.slowMo;
                    d.vy += sy * sForce * this.slowMo;
                }
            }

            // === TEMPERATURE: speed varies by board position ===
            // Edges = cold (slow), center = hot (fast)
            if (this._contCfg && this._contCfg.temperatureStrength > 0) {
                const tStr = this._contCfg.temperatureStrength;
                // Distance from center, normalized 0-1
                const nx = (d.x - this.W / 2) / (this.W / 2);
                const ny = (d.y - this.H / 2) / (this.H / 2);
                const edgeness = Math.max(Math.abs(nx), Math.abs(ny));  // 0 at center, 1 at edge
                // Target speed multiplier: center=1+tStr, edge=1-tStr*0.5
                const speedMult = 1 + tStr * (1 - edgeness * 1.5);
                const speed = Math.hypot(d.vx, d.vy);
                if (speed > 0.1) {
                    const targetSpeed = d.baseSpeed * Math.max(0.3, speedMult);
                    const blend = 0.02 * this.slowMo;  // gentle lerp
                    const newSpeed = speed + (targetSpeed - speed) * blend;
                    d.vx *= newSpeed / speed;
                    d.vy *= newSpeed / speed;
                }
            }

            // === MASS: dots grow with age ===
            if (this._contCfg && this._contCfg.massGrowth > 0 && d.age !== undefined) {
                const growth = this._contCfg.massGrowth;
                const ageSec = d.age / 1000;
                // Size multiplier: grows logarithmically, caps at 3x
                d._massMult = Math.min(3.0, 1 + Math.log1p(ageSec * growth));
                // Heavier dots slow down proportionally
                const speed = Math.hypot(d.vx, d.vy);
                if (speed > 0.1 && d._massMult > 1.01) {
                    const targetSpeed = d.baseSpeed / Math.sqrt(d._massMult);
                    const blend = 0.01 * this.slowMo;
                    const newSpeed = speed + (targetSpeed - speed) * blend;
                    d.vx *= newSpeed / speed;
                    d.vy *= newSpeed / speed;
                }
            }

            if (d.x < margin) { d.vx = Math.abs(d.vx); d.x = margin; }
            if (d.x > this.W - margin) { d.vx = -Math.abs(d.vx); d.x = this.W - margin; }
            if (d.y < margin) { d.vy = Math.abs(d.vy); d.y = margin; }
            if (d.y > this.H - margin) { d.vy = -Math.abs(d.vy); d.y = this.H - margin; }

            // H1: Dot aging — dots accelerate over their lifetime
            // Creates tradeoff: clear early (small chains) vs wait (bigger chains, faster dots)
            if (this._contCfg && this._contCfg.agingRate && d.age !== undefined) {
                d.age += dt;
                const ageFactor = 1 + this._contCfg.agingRate * (d.age / 1000);
                const speed = Math.hypot(d.vx, d.vy);
                if (speed > 0) {
                    const targetSpeed = d.baseSpeed * ageFactor;
                    const scale = targetSpeed / speed;
                    d.vx *= scale;
                    d.vy *= scale;
                }
            }
        }

        // Update explosions: grow/hold/shrink + collision detection
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
                if (t >= 1) return false;
                e.radius = e.maxRadius * (1 - easeInQuad(t));
            }

            // Collision + gravity pull during grow + hold
            if (e.phase === 'grow' || e.phase === 'hold') {
                // Gravity-type explosions pull nearby dots
                if (e.dotType === 'gravity') {
                    const pullR = e.maxRadius * 2.5;
                    const deadzone = 5 * this.spatialScale;
                    for (let i = 0; i < this.dots.length; i++) {
                        const dot = this.dots[i];
                        if (!dot.active || e.caught.has(i)) continue;
                        const dist = Math.hypot(dot.x - e.x, dot.y - e.y);
                        if (dist < pullR && dist > deadzone) {
                            const f = 0.025 * this.spatialScale * this.slowMo / (dist / e.maxRadius);
                            dot.vx += (e.x - dot.x) / dist * f;
                            dot.vy += (e.y - dot.y) / dist * f;
                        }
                    }
                }

                // Catch dots within radius
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

        // Check chain end
        if (this.gameState === 'resolving' && this.explosions.length === 0 && this.pendingExplosions.length === 0) {
            if (this._continuous) {
                // Record chain length, return to playing
                if (this.chainCount > 0) {
                    this.chainLengths.push(this.chainCount);
                    this.totalDotsCaught += this.chainCount;
                    this.events.push({ type: 'chainEnd', chainLength: this.chainCount });
                }
                this.gameState = 'playing';
            } else {
                this.gameState = 'done';
                this.events.push({ type: 'roundDone' });
            }
        }

        // Continuous: density sampling + overflow
        if (this._continuous) {
            if (this.time - this._lastDensitySample >= 500) {
                this._lastDensitySample = this.time;
                const d = this.density();
                this.densityHistory.push({ time: this.time, density: d, count: this.activeDotCount() });
            }
            this._checkOverflow();
        }
    }

    resolveChain() {
        const DT = 16.67;
        let safetyLimit = 30000 / DT;
        while (this.gameState === 'resolving' && safetyLimit-- > 0) {
            this.step(DT);
        }
    }

    // === QUERIES ===

    activeDotCount() {
        let c = 0;
        for (const d of this.dots) if (d.active) c++;
        return c;
    }

    density() {
        if (!this._contCfg) return 0;
        return this.activeDotCount() / this._contCfg.maxDots;
    }

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
            densityHistory: this.densityHistory,
            chainLengths: this.chainLengths,
        };
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

    // === INTERNAL ===

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

    _generateDots(count, speedMin, speedMax, typeWeights) {
        this.dots = [];
        let attempts = 0;
        const topMargin = this.cfg.SCREEN_MARGIN + 50 * this.spatialScale;
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
                const spd = (speedMin + this.rng() * (speedMax - speedMin)) * (DOT_TYPES[type] || DOT_TYPES.standard).speedMult * this.spatialScale;
                this.dots.push({
                    x, y,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    active: true,
                    bloomTimer: 0,
                    type,
                    age: 0,
                    baseSpeed: spd,
                });
            }
            attempts++;
        }
    }

    _createExplosion(x, y, generation, dotType) {
        const typeDef = DOT_TYPES[dotType] || DOT_TYPES.standard;
        const radiusMult = typeDef.radiusMult || 1.0;
        let maxRadius = this.explosionRadius * radiusMult;
        let holdMs = this.cfg.EXPLOSION_HOLD_MS;
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

    _detonateDot(dot, dotIndex, generation, explosion) {
        if (this.scheduledDetonations.has(dotIndex)) return;
        this.scheduledDetonations.add(dotIndex);
        dot.active = false;
        dot.bloomTimer = 12;
        this.chainCount++;

        const newMult = getMultiplier(this.chainCount, this.cfg.MULT_THRESHOLDS, this.totalDots);
        if (newMult > this.currentMultiplier) {
            this.currentMultiplier = newMult;
            this.events.push({ type: 'multiplierUp', mult: newMult, chainCount: this.chainCount });
        }

        const basePoints = 10 * (generation + 1);
        const points = basePoints * this.currentMultiplier;
        this.score += points;

        // Determine hue for rendering
        const typeHues = { standard: 210, gravity: 270, volatile: 30 };
        const hue = typeHues[dot.type] || 210;

        // Log hit for metrics
        const expansionEnd = explosion.createdAt + this.cfg.EXPLOSION_GROW_MS;
        this._hitLog.push({
            dotIndex, generation,
            time: this.time,
            expansionHit: this.time <= expansionEnd,
        });

        // Emit event (browser hooks audio/particles/text here)
        this.events.push({
            type: 'dotCaught',
            x: dot.x, y: dot.y,
            dotIndex, generation, points,
            chainCount: this.chainCount,
            hue,
            dotType: dot.type,
            parentX: explosion.x,
            parentY: explosion.y,
        });

        // Check celebrations
        if (this.totalDots > 0) {
            for (const cel of this.cfg.CELEBRATIONS) {
                const threshold = Math.ceil(cel.pct * this.totalDots);
                if (this.chainCount >= threshold && this.lastCelebration < threshold) {
                    this.lastCelebration = threshold;
                    this.events.push({
                        type: 'celebration',
                        text: cel.text, hue: cel.hue, scale: cel.size,
                        chainCount: this.chainCount,
                    });
                }
            }
        }

        // Schedule cascade explosion at caught dot's position
        const delay = this.cfg.CASCADE_STAGGER_MS +
                      (this.rng() - 0.5) * 2 * this.cfg.CASCADE_JITTER_MS;
        this.pendingExplosions.push({
            x: dot.x, y: dot.y,
            generation: generation + 1,
            time: this.time + delay,
            dotType: dot.type || 'standard',
        });
    }

    // Continuous mode: spawn dots at screen edges
    _spawnTick(dt) {
        const cfg = this._contCfg;
        let rate = cfg.spawnRate + (cfg.spawnAccel || 0) * (this.time / 30000);

        // H6: Density-scaled spawn rate — positive feedback loop
        // Higher density → faster spawning → more dots → higher density
        if (cfg.spawnDensityScale) {
            const density = this.density();
            rate *= (1 + density * cfg.spawnDensityScale);
        }

        // Wave spawn mode: dots arrive in bursts from edges
        if (cfg.waveSpawn) {
            const interval = cfg.waveInterval || 3000;
            const size = cfg.waveSize || 6;
            if (!this._waveTimer) this._waveTimer = 0;
            this._waveTimer += dt;
            if (this._waveTimer >= interval && this.activeDotCount() + size <= cfg.maxDots) {
                this._waveTimer = 0;
                const edge = Math.floor(this.rng() * 4);
                const type = this._pickType(cfg.dotTypes);
                for (let i = 0; i < size; i++) {
                    this._spawnOneDot(edge, type);
                }
            }
            return;
        }

        this._spawnAccum += rate * (dt / 1000);

        while (this._spawnAccum >= 1 && this.activeDotCount() < cfg.maxDots) {
            this._spawnAccum -= 1;
            this._spawnOneDot();
        }
        if (this._spawnAccum > 3) this._spawnAccum = 3;
    }

    _spawnOneDot(forceEdge, forceType) {
        const cfg = this._contCfg;
        const margin = this.cfg.SCREEN_MARGIN;
        const type = forceType || this._pickType(cfg.dotTypes);
        const typeDef = DOT_TYPES[type] || DOT_TYPES.standard;
        const speed = (cfg.speedMin + this.rng() * (cfg.speedMax - cfg.speedMin)) * typeDef.speedMult * this.spatialScale;

        const edge = forceEdge != null ? forceEdge : Math.floor(this.rng() * 4);
        const spread = Math.PI * 0.4;
        let x, y, vx, vy;

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
            default: // left
                x = margin;
                y = margin + this.rng() * (this.H - margin * 2);
                { const a = (this.rng() - 0.5) * spread; vx = Math.cos(a) * speed; vy = Math.sin(a) * speed; }
                break;
        }

        this.dots.push({ x, y, vx, vy, active: true, bloomTimer: 0, type, age: 0, baseSpeed: speed });
        this.totalDotsSpawned++;
    }

    /**
     * Spawn a garbage dot aimed toward a target position.
     * Spawns from the nearest edge, aimed at (tx, ty) with some spread.
     * Falls back to random edge spawn if no target given.
     */
    _spawnGarbageDot(tx, ty) {
        if (tx == null || ty == null) return this._spawnOneDot();

        const cfg = this._contCfg;
        const margin = this.cfg.SCREEN_MARGIN;
        const speed = (cfg.speedMin + this.rng() * (cfg.speedMax - cfg.speedMin)) * this.spatialScale;
        const spread = Math.PI * 0.3;

        // Pick the nearest edge to the target
        const dTop = ty, dBot = this.H - ty, dLeft = tx, dRight = this.W - tx;
        const minDist = Math.min(dTop, dBot, dLeft, dRight);

        let x, y;
        if (minDist === dTop) { x = tx + (this.rng() - 0.5) * 60 * this.spatialScale; y = margin; }
        else if (minDist === dBot) { x = tx + (this.rng() - 0.5) * 60 * this.spatialScale; y = this.H - margin; }
        else if (minDist === dLeft) { x = margin; y = ty + (this.rng() - 0.5) * 60 * this.spatialScale; }
        else { x = this.W - margin; y = ty + (this.rng() - 0.5) * 60 * this.spatialScale; }

        x = Math.max(margin, Math.min(this.W - margin, x));
        y = Math.max(margin, Math.min(this.H - margin, y));

        // Aim toward target with spread
        const angle = Math.atan2(ty - y, tx - x) + (this.rng() - 0.5) * spread;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        this.dots.push({ x, y, vx, vy, active: true, bloomTimer: 8, type: 'standard', age: 0, baseSpeed: speed });
        this.totalDotsSpawned++;
    }

    _checkOverflow() {
        const d = this.density();
        const Dcrit = this._contCfg.overflowDensity;

        if (d >= Dcrit) {
            if (this._overflowStart < 0) {
                this._overflowStart = this.time;
            } else if (this.time - this._overflowStart >= (this._contCfg.overflowDuration || 10000)) {
                this.overflowed = true;
                this.gameState = 'overflow';
                this.events.push({ type: 'overflow' });
            }
        } else {
            this._overflowStart = -1;
        }
    }
}

// =====================================================================
// BOTS
//
// All bots return { action: 'wait'|'tap', x?, y?, waitMs? }
// For round-mode callers that just need (x,y), use .x and .y directly.
// =====================================================================

const Bots = {
    /** Random: tap random position. 1-4s extra delay in continuous mode. */
    random(game) {
        if (!game.canTap()) return { action: 'wait' };
        const margin = game.cfg.SCREEN_MARGIN + 20;
        const waitMs = game._continuous ? 1000 + game.rng() * 3000 : 0;
        return {
            action: 'tap',
            x: margin + game.rng() * (game.W - margin * 2),
            y: margin + 50 + game.rng() * (game.H - margin * 2 - 50),
            waitMs,
        };
    },

    /** Greedy: grid search for densest cluster. */
    greedy(game, gridSize) {
        if (!game.canTap()) return { action: 'wait' };
        gridSize = gridSize || 20;
        let bestX = game.W / 2, bestY = game.H / 2, bestCount = 0;
        const r = game.explosionRadius;
        const stepX = game.W / gridSize, stepY = game.H / gridSize;

        for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
                const x = (gx + 0.5) * stepX;
                const y = (gy + 0.5) * stepY;
                let count = 0;
                for (const d of game.dots) {
                    if (d.active && Math.hypot(d.x - x, d.y - y) <= r) count++;
                }
                if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
            }
        }

        // Refine around best position
        const fineStep = stepX / 4;
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                const x = bestX + dx * fineStep;
                const y = bestY + dy * fineStep;
                let count = 0;
                for (const d of game.dots) {
                    if (d.active && Math.hypot(d.x - x, d.y - y) <= r) count++;
                }
                if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
            }
        }

        return { action: 'tap', x: bestX, y: bestY, waitMs: 0, clusterSize: bestCount };
    },

    /** HumanSim: greedy + spatial noise + reaction delay. */
    humanSim(game) {
        if (!game.canTap()) return { action: 'wait' };
        const best = Bots.greedy(game, 15);
        const noiseX = (game.rng() + game.rng() + game.rng() - 1.5) * 20;
        const noiseY = (game.rng() + game.rng() + game.rng() - 1.5) * 20;
        return {
            action: 'tap',
            x: Math.max(20, Math.min(game.W - 20, best.x + noiseX)),
            y: Math.max(70, Math.min(game.H - 20, best.y + noiseY)),
            waitMs: 200 + game.rng() * 100,
        };
    },

    /**
     * Oracle: Near-optimal play via exhaustive candidate evaluation + 2-ply lookahead.
     * See DESIGN.md "Oracle Bot v4 — Proof of Near-Optimality" for theoretical analysis.
     */
    oracle(game) {
        if (!game.canTap()) return { action: 'wait' };

        const snapshot = game.dots.map(d => ({
            x: d.x, y: d.y, vx: d.vx, vy: d.vy,
            active: d.active, type: d.type, bloomTimer: 0
        }));
        const activeDots = snapshot.filter(d => d.active);
        const maxDots = game._contCfg ? game._contCfg.maxDots : game.totalDots;
        const density = maxDots > 0 ? activeDots.length / maxDots : 0;
        const DT = 16.67;
        const margin = game.cfg.SCREEN_MARGIN;
        const r = game.explosionRadius;

        // Advance dot positions by deltaMs (physics + gravity pull, no spawning)
        function advanceDots(dots, deltaMs) {
            for (let ms = 0; ms < deltaMs; ms += DT) {
                for (const d of dots) {
                    if (d.active && d.type === 'gravity') {
                        const pullR = r * 2.5;
                        for (const o of dots) {
                            if (o === d || !o.active) continue;
                            const dist = Math.hypot(o.x - d.x, o.y - d.y);
                            if (dist < pullR && dist > 5 * game.spatialScale) {
                                const f = 0.012 * game.spatialScale / (dist / r);
                                o.vx += (d.x - o.x) / dist * f;
                                o.vy += (d.y - o.y) / dist * f;
                            }
                        }
                    }
                }
                for (const d of dots) {
                    if (!d.active) continue;
                    d.x += d.vx; d.y += d.vy;
                    if (d.x < margin) { d.vx = Math.abs(d.vx); d.x = margin; }
                    if (d.x > game.W - margin) { d.vx = -Math.abs(d.vx); d.x = game.W - margin; }
                    if (d.y < margin) { d.vy = Math.abs(d.vy); d.y = margin; }
                    if (d.y > game.H - margin) { d.vy = -Math.abs(d.vy); d.y = game.H - margin; }
                }
            }
        }

        // Full chain resolution via clone game — returns dots caught
        function evalTap(dots, x, y) {
            const clone = new Game(game.W, game.H, game.cfg, createRNG(0));
            clone.dots = dots.map(d => ({ ...d }));
            clone.explosionRadius = game.explosionRadius;
            clone.totalDots = dots.filter(d => d.active).length;
            if (game._continuous) {
                clone.startContinuous(game._contCfg);
                clone.dots = dots.map(d => ({ ...d }));
                clone._lastTapTime = -Infinity;
            } else {
                clone.gameState = 'playing';
            }
            clone.chainCount = 0;
            clone.tap(x, y);
            clone.resolveChain();
            return clone.chainCount;
        }

        // Phase 1: Exhaustive candidate generation at multiple time offsets
        const candidates = [];
        const timeOffsets = [0, 100, 200, 400, 600, 800, 1100];

        for (const delay of timeOffsets) {
            const futureDots = snapshot.map(d => ({ ...d }));
            advanceDots(futureDots, delay);
            const active = futureDots.filter(d => d.active);
            if (active.length === 0) continue;

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

            // Evaluate ALL with full chain resolution
            for (const [, pos] of posMap) {
                const caught = evalTap(futureDots, pos.x, pos.y);
                if (caught < 1) continue;
                const pressureBonus = density > 0.5 ? caught * (density - 0.5) * 3 : 0;
                candidates.push({ x: pos.x, y: pos.y, delay, caught, score: caught + pressureBonus });
            }
        }

        if (candidates.length === 0) {
            return { action: 'tap', x: game.W / 2, y: game.H / 2, waitMs: 0 };
        }

        candidates.sort((a, b) => b.score - a.score);

        // Phase 2: 2-ply lookahead (Bertsekas rollout policy)
        const cooldown = game._contCfg ? game._contCfg.cooldown : 2000;
        let bestTotal = 0, bestCandidate = candidates[0];

        const plyCount = Math.min(8, candidates.length);
        for (let i = 0; i < plyCount; i++) {
            const c = candidates[i];
            const futureDots = snapshot.map(d => ({ ...d }));
            advanceDots(futureDots, c.delay);

            const clone = new Game(game.W, game.H, game.cfg, createRNG(0));
            clone.dots = futureDots.map(d => ({ ...d }));
            clone.explosionRadius = game.explosionRadius;
            clone.totalDots = futureDots.filter(d => d.active).length;
            if (game._continuous) {
                clone.startContinuous(game._contCfg);
                clone.dots = futureDots.map(d => ({ ...d }));
                clone._lastTapTime = -Infinity;
            } else {
                clone.gameState = 'playing';
            }
            clone.chainCount = 0;
            clone.tap(c.x, c.y);
            clone.resolveChain();
            const firstCaught = clone.chainCount;

            const remainingDots = clone.dots.filter(d => d.active).map(d => ({ ...d }));
            advanceDots(remainingDots, cooldown);

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

// =====================================================================
// BOT PROFILES — Humanization parameters per skill level
//
// scanInterval: ms between bot scans for a target
// delay:        base reaction time before executing
// jitter:       spatial noise in pixels on tap position
// =====================================================================

const BOT_PROFILES = {
    CALM:          { bot: 'random',   scanInterval: 800,  delay: 1200, jitter: 40 },
    FLOW:          { bot: 'humanSim', scanInterval: 400,  delay: 600,  jitter: 20 },
    SURGE:         { bot: 'greedy',   scanInterval: 200,  delay: 300,  jitter: 10 },
    TRANSCENDENCE: { bot: 'greedy',   scanInterval: 100,  delay: 150,  jitter: 5 },
    IMPOSSIBLE:    { bot: 'greedy',   scanInterval: 50,   delay: 80,   jitter: 2 },
    ORACLE:        { bot: 'oracle',   scanInterval: 0,    delay: 0,    jitter: 0 },
};

// =====================================================================
// BOT RUNNER — Unified bot state machine for both headless and browser
//
// Usage (identical in both environments):
//   const runner = new BotRunner(game, 'CALM', rng);
//   // each frame:
//   const tap = runner.update(dt);
//   if (tap) game.tap(tap.x, tap.y);  // or handleTap(tap.x, tap.y)
// =====================================================================

class BotRunner {
    constructor(game, skillKey, rng = Math.random) {
        this.game = game;
        this.rng = rng;
        this.setSkill(skillKey);
        this.target = null;
        this.thinkTimer = 0;
        this.scanTimer = 0;
    }

    setSkill(skillKey) {
        this.skillKey = skillKey;
        this.profile = BOT_PROFILES[skillKey] || BOT_PROFILES.FLOW;
        this.botFn = Bots[this.profile.bot];
    }

    /** Advance bot by dt ms. Returns {x, y} if bot wants to tap, null otherwise. */
    update(dt) {
        const game = this.game;
        if (game._continuous) {
            if (!game.canTap()) return null;
        } else {
            if (game.gameState !== 'playing') return null;
        }

        // Scan phase: find a target
        if (!this.target) {
            this.scanTimer += dt;
            if (this.scanTimer < this.profile.scanInterval) return null;
            this.scanTimer = 0;

            const decision = this.botFn(game);
            if (decision.action !== 'tap') return null;

            this.target = {
                x: decision.x + (this.rng() - 0.5) * this.profile.jitter,
                y: decision.y + (this.rng() - 0.5) * this.profile.jitter,
            };
            // Bot's waitMs (strategy-specific delay) + profile delay (humanization)
            this.thinkTimer = this.profile.delay
                + (decision.waitMs || 0)
                + this.rng() * (this.profile.delay * 0.3);
            return null;
        }

        // Think phase: wait for reaction time
        this.thinkTimer -= dt;
        if (this.thinkTimer > 0) return null;

        // Execute phase: re-evaluate with fresh game state, then tap
        const decision = this.botFn(game);
        this.target = null;
        this.scanTimer = 0;

        if (decision.action !== 'tap') return null;

        const jit = this.profile.jitter * 0.5;
        return {
            x: decision.x + (this.rng() - 0.5) * jit,
            y: decision.y + (this.rng() - 0.5) * jit,
        };
    }

    /** Reset bot state (e.g., between rounds). */
    reset() {
        this.target = null;
        this.thinkTimer = 0;
        this.scanTimer = 0;
    }
}

// =====================================================================
// EXPORTS (isomorphic)
// =====================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game, Bots, BotRunner, BOT_PROFILES, DEFAULTS, CONTINUOUS_TIERS, DOT_TYPES, getRoundParams, getMultiplier, createRNG };
}
