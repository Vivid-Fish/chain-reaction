#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Supernova Mechanic Experiment
//
// Tests candidate "Zone/Supernova" mechanics to find which creates the
// most dramatic contrast between normal and charged rounds.
//
// Prior art informing design:
//   - Tetris Effect Zone: gravity stops, lines stack, audio submerges
//   - Bayonetta Witch Time: earned via frame-perfect play, full agency
//   - Peggle Extreme Fever: disproportionate celebration, Ode to Joy
//   - Bejeweled Blazing Speed: 3-stage rocket, AoE mode
//   - Geometry Wars: multiplier as super-mode, resets on death
//
// Design requirements (from gap analysis):
//   1. EARNED, not given (charges through good play)
//   2. RULE INVERSION, not just "more power" (changes how game works)
//   3. PRESERVED AGENCY (player still makes meaningful decisions)
//   4. DRAMATIC CONTRAST (metrics must be measurably different)
//
// Usage:
//   node supernova-experiment.js
//   node supernova-experiment.js --runs 500
//   node supernova-experiment.js --only multi_tap
// =========================================================================

// --- Seeded PRNG ---
function createRNG(seed) {
    let s = seed | 0;
    return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInQuad = t => t * t;

const BASE_CONFIG = {
    EXPLOSION_RADIUS_PCT: 0.10,
    EXPLOSION_RADIUS_MIN_PX: 35,
    EXPLOSION_GROW_MS: 200,
    EXPLOSION_HOLD_MS: 1000,
    EXPLOSION_SHRINK_MS: 500,
    CASCADE_STAGGER_MS: 80,
    CASCADE_JITTER_MS: 25,
    CASCADE_RADIUS_GROWTH: 0.08,
    CASCADE_HOLD_GROWTH_MS: 200,
    CASCADE_GEN_CAP: 4,
    MIN_DOT_DISTANCE: 25,
    SCREEN_MARGIN: 16,
};

function getRoundParams(r) {
    const dots = Math.min(60, Math.floor(10 + r * 2.5));
    const pct = Math.min(0.80, 0.05 + (r - 1) * 0.028);
    const target = Math.max(1, Math.ceil(dots * pct));
    const speedMin = 0.7 + Math.min(0.4, (r - 1) * 0.03);
    const speedMax = 1.4 + Math.min(0.8, (r - 1) * 0.05);
    let typeWeights;
    if (r <= 2) typeWeights = { standard: 1.0 };
    else if (r <= 4) {
        const gw = Math.min(0.25, (r - 2) * 0.12);
        typeWeights = { standard: 1 - gw, gravity: gw };
    } else {
        const gw = Math.min(0.25, 0.12 + (r - 4) * 0.03);
        const vw = Math.min(0.20, (r - 4) * 0.08);
        typeWeights = { standard: Math.max(0.5, 1 - gw - vw), gravity: gw, volatile: vw };
    }
    return { dots, target, pct, speedMin, speedMax, typeWeights };
}

// =========================================================================
// SIMULATION (matches v8.1 game)
// =========================================================================

class Simulation {
    constructor(W, H, config = {}, seed = 42) {
        this.W = W; this.H = H;
        this.cfg = { ...BASE_CONFIG, ...config };
        this.rng = createRNG(seed);
        const refDim = Math.min(W, H, 800);
        this.explosionRadius = Math.max(this.cfg.EXPLOSION_RADIUS_MIN_PX, refDim * this.cfg.EXPLOSION_RADIUS_PCT);
        this.reset();
    }

    reset() {
        this.dots = [];
        this.explosions = [];
        this.pendingExplosions = [];
        this.scheduledDetonations = new Set();
        this.chainCount = 0;
        this.gameState = 'idle';
        this.time = 0;
        this._hitLog = [];
        this._maxGen = 0;
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
                this.dots.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, active: true, type });
            }
            attempts++;
        }
    }

    setupRound(round) {
        const params = getRoundParams(round);
        this.generateDots(params.dots, params.speedMin, params.speedMax, params.typeWeights);
        this.explosions = [];
        this.pendingExplosions = [];
        this.scheduledDetonations = new Set();
        this.chainCount = 0;
        this.gameState = 'playing';
        this.time = 0;
        this._hitLog = [];
        this._maxGen = 0;
        return params;
    }

    tap(x, y, radiusOverride) {
        if (this.gameState !== 'playing') return;
        this.gameState = 'resolving';
        this.explosions.push(this._createExplosion(x, y, 0, undefined, radiusOverride));
    }

    _createExplosion(x, y, generation, dotType, radiusOverride) {
        const radiusMult = dotType === 'volatile' ? 1.5 : 1.0;
        let maxRadius = (radiusOverride || this.explosionRadius) * radiusMult;
        let holdMs = this.cfg.EXPLOSION_HOLD_MS;

        if (generation > 0) {
            const effectiveGen = Math.min(generation, this.cfg.CASCADE_GEN_CAP);
            maxRadius *= (1 + this.cfg.CASCADE_RADIUS_GROWTH * effectiveGen);
            holdMs += this.cfg.CASCADE_HOLD_GROWTH_MS * effectiveGen;
        }

        if (generation > this._maxGen) this._maxGen = generation;

        return {
            x, y, generation, dotType: dotType || 'standard',
            maxRadius, holdMs, radius: 0, phase: 'grow', age: 0,
            caught: new Set(), createdAt: this.time,
        };
    }

    step(dt) {
        this.time += dt;

        for (let i = this.pendingExplosions.length - 1; i >= 0; i--) {
            if (this.time >= this.pendingExplosions[i].time) {
                const p = this.pendingExplosions[i];
                this.explosions.push(this._createExplosion(p.x, p.y, p.generation, p.dotType));
                this.pendingExplosions.splice(i, 1);
            }
        }

        const margin = this.cfg.SCREEN_MARGIN;
        for (const d of this.dots) {
            if (!d.active) continue;
            d.x += d.vx; d.y += d.vy;
            if (d.type === 'gravity') {
                const pullR = this.explosionRadius * 2.5;
                for (const o of this.dots) {
                    if (o === d || !o.active) continue;
                    const dist = Math.hypot(o.x - d.x, o.y - d.y);
                    if (dist < pullR && dist > 5) {
                        const f = 0.012 / (dist / this.explosionRadius);
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

        this.explosions = this.explosions.filter(e => {
            e.age += dt;
            const holdMs = e.holdMs;

            if (e.phase === 'grow') {
                if (e.age >= this.cfg.EXPLOSION_GROW_MS) e.phase = 'hold';
                e.radius = e.maxRadius * easeOutExpo(Math.min(e.age / this.cfg.EXPLOSION_GROW_MS, 1));
            } else if (e.phase === 'hold') {
                if (e.age >= this.cfg.EXPLOSION_GROW_MS + holdMs) e.phase = 'shrink';
                e.radius = e.maxRadius;
            } else if (e.phase === 'shrink') {
                const t = (e.age - this.cfg.EXPLOSION_GROW_MS - holdMs) / this.cfg.EXPLOSION_SHRINK_MS;
                if (t >= 1) return false;
                e.radius = e.maxRadius * (1 - easeInQuad(t));
            }

            if (e.phase === 'grow' || e.phase === 'hold') {
                if (e.dotType === 'gravity') {
                    const pullR = e.maxRadius * 2.5;
                    for (let i = 0; i < this.dots.length; i++) {
                        const dot = this.dots[i];
                        if (!dot.active || e.caught.has(i)) continue;
                        const dist = Math.hypot(dot.x - e.x, dot.y - e.y);
                        if (dist < pullR && dist > 5) {
                            const f = 0.025 / (dist / e.maxRadius);
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

        if (this.gameState === 'resolving' && this.explosions.length === 0 && this.pendingExplosions.length === 0) {
            this.gameState = 'done';
        }
    }

    _detonateDot(dot, dotIndex, generation, explosion) {
        if (this.scheduledDetonations.has(dotIndex)) return;
        this.scheduledDetonations.add(dotIndex);
        dot.active = false;
        this.chainCount++;
        const expansionHit = this.time <= explosion.createdAt + this.cfg.EXPLOSION_GROW_MS;
        this._hitLog.push({ dotIndex, generation, time: this.time, expansionHit });
        const delay = this.cfg.CASCADE_STAGGER_MS + (this.rng() - 0.5) * 2 * this.cfg.CASCADE_JITTER_MS;
        this.pendingExplosions.push({
            x: dot.x, y: dot.y, generation: generation + 1,
            time: this.time + delay, dotType: dot.type || 'standard',
        });
    }

    resolveChain() {
        const DT = 16.67;
        let safetyLimit = 30000 / DT;
        while (this.gameState === 'resolving' && safetyLimit-- > 0) this.step(DT);
    }

    countInRadius(x, y, radius) {
        let c = 0;
        for (const d of this.dots) if (d.active && Math.hypot(d.x - x, d.y - y) <= radius) c++;
        return c;
    }
}

// =========================================================================
// BOTS
// =========================================================================

function greedyTap(sim) {
    let bestX = sim.W / 2, bestY = sim.H / 2, bestCount = 0;
    const r = sim.explosionRadius;
    for (let gx = 0; gx < 20; gx++) {
        for (let gy = 0; gy < 20; gy++) {
            const x = (gx + 0.5) * sim.W / 20;
            const y = (gy + 0.5) * sim.H / 20;
            const count = sim.countInRadius(x, y, r);
            if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
        }
    }
    const step = sim.W / 80;
    for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
            const x = bestX + dx * step;
            const y = bestY + dy * step;
            const count = sim.countInRadius(x, y, r);
            if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
        }
    }
    return { x: bestX, y: bestY };
}

// Multi-tap bot: taps N times, each time finding best remaining position
function multiTapBot(sim, numTaps) {
    const taps = [];
    // We need to simulate sequentially — can't just greedy N times on same state
    // Clone dots state for greedy search, but actually run separate rounds
    for (let t = 0; t < numTaps; t++) {
        const pos = greedyTap(sim);
        taps.push(pos);
        if (t < numTaps - 1) {
            // Fire this tap and resolve
            sim.tap(pos.x, pos.y);
            sim.resolveChain();
            // Reset for next tap
            sim.gameState = 'playing';
            sim.explosions = [];
            sim.pendingExplosions = [];
            sim.scheduledDetonations = new Set();
        }
    }
    return taps;
}

// =========================================================================
// SUPERNOVA VARIANTS
// =========================================================================

const SUPERNOVA_VARIANTS = {
    // Baseline: normal round, 1 tap
    baseline: {
        label: 'NORMAL (baseline)',
        description: '1 tap, standard rules',
        run(sim, round) {
            const params = sim.setupRound(round);
            const pos = greedyTap(sim);
            sim.tap(pos.x, pos.y);
            sim.resolveChain();
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },

    // MULTI-TAP: Player gets 3 taps per round (Tetris Effect Zone: break normal rules)
    multi_tap: {
        label: 'MULTI-TAP (3 taps)',
        description: '3 sequential taps — breaks the one-tap rule',
        run(sim, round) {
            const params = sim.setupRound(round);
            const taps = multiTapBot(sim, 3);
            // Final tap
            sim.tap(taps[taps.length - 1].x, taps[taps.length - 1].y);
            sim.resolveChain();
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },

    // MEGA-RADIUS: 2x base explosion radius (simple power boost)
    mega_radius: {
        label: 'MEGA-RADIUS (2x)',
        description: '2x base explosion radius on tap',
        run(sim, round) {
            const params = sim.setupRound(round);
            const bigRadius = sim.explosionRadius * 2;
            const pos = greedyTap(sim);  // bot still searches at normal radius
            sim.tap(pos.x, pos.y, bigRadius);
            sim.resolveChain();
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },

    // NO-CAP: Cascade cap removed for one round (unchecked positive feedback)
    no_cap: {
        label: 'UNCAPPED CASCADE',
        description: 'Cascade gen cap removed — chain grows without limit',
        run(sim, round) {
            const savedCap = sim.cfg.CASCADE_GEN_CAP;
            sim.cfg.CASCADE_GEN_CAP = Infinity;
            const params = sim.setupRound(round);
            const pos = greedyTap(sim);
            sim.tap(pos.x, pos.y);
            sim.resolveChain();
            sim.cfg.CASCADE_GEN_CAP = savedCap;
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },

    // GRAVITY WELL: Tap creates a gravity well that pulls ALL dots toward center for 500ms before exploding
    gravity_well: {
        label: 'GRAVITY WELL',
        description: 'Tap pulls all dots inward for 500ms, then explodes — herding mechanic',
        run(sim, round) {
            const params = sim.setupRound(round);
            const pos = greedyTap(sim);

            // Phase 1: Pull dots toward tap position for 500ms
            const pullDuration = 500;
            const pullForce = 0.03;
            const DT = 16.67;
            let elapsed = 0;
            while (elapsed < pullDuration) {
                // Pull all dots toward tap position
                for (const d of sim.dots) {
                    if (!d.active) continue;
                    const dist = Math.hypot(d.x - pos.x, d.y - pos.y);
                    if (dist > 5) {
                        const f = pullForce / Math.max(1, dist / sim.explosionRadius);
                        d.vx += (pos.x - d.x) / dist * f;
                        d.vy += (pos.y - d.y) / dist * f;
                    }
                }
                sim.step(DT);
                elapsed += DT;
            }

            // Phase 2: Normal explosion
            sim.gameState = 'playing';
            sim.tap(pos.x, pos.y);
            sim.resolveChain();
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },

    // TIME-FREEZE: Dots freeze in place, player gets oracle-level planning (Superhot: time stops)
    time_freeze: {
        label: 'TIME-FREEZE',
        description: 'Dots freeze — perfect prediction (oracle mode)',
        run(sim, round) {
            const params = sim.setupRound(round);
            // Save dot positions (frozen state)
            const savedDots = sim.dots.map(d => ({ ...d }));

            // Oracle search: try many positions with a ghost sim
            let bestX = 0, bestY = 0, bestChain = 0;
            const positions = [];
            for (let gx = 0; gx < 20; gx++) {
                for (let gy = 0; gy < 20; gy++) {
                    positions.push({ x: (gx + 0.5) * sim.W / 20, y: (gy + 0.5) * sim.H / 20 });
                }
            }

            for (const p of positions) {
                // Create a ghost sim with frozen dots
                const ghost = new Simulation(sim.W, sim.H, sim.cfg, 1);
                ghost.dots = savedDots.map(d => ({ ...d, vx: 0, vy: 0 }));  // frozen
                ghost.explosions = [];
                ghost.pendingExplosions = [];
                ghost.scheduledDetonations = new Set();
                ghost.chainCount = 0;
                ghost.gameState = 'playing';
                ghost.time = 0;
                ghost._hitLog = [];
                ghost._maxGen = 0;

                ghost.tap(p.x, p.y);
                ghost.resolveChain();

                if (ghost.chainCount > bestChain) {
                    bestChain = ghost.chainCount;
                    bestX = p.x; bestY = p.y;
                }
            }

            // Actually play with frozen dots at the best position
            sim.dots = savedDots.map(d => ({ ...d, vx: 0, vy: 0 }));
            sim.gameState = 'playing';
            sim.tap(bestX, bestY);
            sim.resolveChain();
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },

    // CHAIN STARTER: First explosion auto-catches the 3 nearest dots (guaranteed chain start)
    chain_starter: {
        label: 'CHAIN-STARTER (3 free)',
        description: 'First explosion auto-catches 3 nearest dots regardless of distance',
        run(sim, round) {
            const params = sim.setupRound(round);
            const pos = greedyTap(sim);
            sim.tap(pos.x, pos.y);

            // Immediately catch the 3 nearest active dots
            const distances = sim.dots
                .map((d, i) => ({ i, dist: Math.hypot(d.x - pos.x, d.y - pos.y), dot: d }))
                .filter(d => d.dot.active)
                .sort((a, b) => a.dist - b.dist);

            const exp = sim.explosions[0];
            for (let k = 0; k < Math.min(3, distances.length); k++) {
                const { i, dot } = distances[k];
                if (!exp.caught.has(i) && dot.active) {
                    exp.caught.add(i);
                    sim._detonateDot(dot, i, 0, exp);
                }
            }

            sim.resolveChain();
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },

    // VOLATILE BURST: All dots become volatile for one round (1.5x explosion radius each)
    volatile_burst: {
        label: 'VOLATILE BURST',
        description: 'All dots become volatile (1.5x radius each) — screen-clearing potential',
        run(sim, round) {
            const params = sim.setupRound(round);
            // Convert all dots to volatile
            for (const d of sim.dots) d.type = 'volatile';
            const pos = greedyTap(sim);
            sim.tap(pos.x, pos.y);
            sim.resolveChain();
            return { chain: sim.chainCount, dots: params.dots, target: params.target, maxGen: sim._maxGen };
        },
    },
};

// =========================================================================
// EXPERIMENT RUNNER
// =========================================================================

function runExperiment(W, H, variant, round, runs) {
    const results = { chains: [], clearRates: [], wipeRates: [], maxGens: [], chainTargetRatios: [] };

    for (let i = 0; i < runs; i++) {
        const sim = new Simulation(W, H, {}, i + 1);
        const result = variant.run(sim, round);

        const cleared = result.chain >= result.target;
        const wiped = result.chain >= result.dots * 0.9;

        results.chains.push(result.chain);
        results.clearRates.push(cleared ? 1 : 0);
        results.wipeRates.push(wiped ? 1 : 0);
        results.maxGens.push(result.maxGen);
        results.chainTargetRatios.push(result.chain / result.target);
    }

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const p = (arr, pct) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length * pct)]; };

    return {
        avgChain: avg(results.chains),
        medianChain: p(results.chains, 0.5),
        maxChain: Math.max(...results.chains),
        p90Chain: p(results.chains, 0.9),
        clearRate: avg(results.clearRates),
        wipeRate: avg(results.wipeRates),
        avgMaxGen: avg(results.maxGens),
        avgChainTargetRatio: avg(results.chainTargetRatios),
    };
}

// =========================================================================
// MAIN
// =========================================================================

const args = process.argv.slice(2);
let runs = 300;
let only = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runs') runs = parseInt(args[++i]);
    else if (args[i] === '--only') only = args[++i];
}

const W = 390, H = 844;
const testRounds = [5, 8, 12];  // Low, mid, high difficulty

console.log(`\n${'═'.repeat(80)}`);
console.log(`  CHAIN REACTION — Supernova Mechanic Experiment`);
console.log(`  ${W}x${H}, ${runs} runs per variant per round`);
console.log(`${'═'.repeat(80)}`);

let variants;
if (only) {
    if (!SUPERNOVA_VARIANTS[only]) {
        console.error(`Unknown variant: ${only}. Available: ${Object.keys(SUPERNOVA_VARIANTS).join(', ')}`);
        process.exit(1);
    }
    variants = { baseline: SUPERNOVA_VARIANTS.baseline, [only]: SUPERNOVA_VARIANTS[only] };
} else {
    variants = SUPERNOVA_VARIANTS;
}

const allResults = {};

for (const round of testRounds) {
    const params = getRoundParams(round);
    console.log(`\n  ── R${round} (${params.dots} dots, target ${params.target}) ──\n`);
    console.log(`  ${'Variant'.padEnd(22)} AvgChain MedChain  P90  Max  Clear%  Wipe% AvgGen Chn/Tgt`);
    console.log(`  ${'─'.repeat(78)}`);

    allResults[round] = {};

    for (const [name, variant] of Object.entries(variants)) {
        const t0 = Date.now();
        const r = runExperiment(W, H, variant, round, runs);
        const ms = Date.now() - t0;
        allResults[round][name] = r;

        const clearPct = (r.clearRate * 100).toFixed(0).padStart(4);
        const wipePct = (r.wipeRate * 100).toFixed(0).padStart(4);

        console.log(`  ${name.padEnd(22)} ${r.avgChain.toFixed(1).padStart(8)} ${r.medianChain.toString().padStart(8)} ${r.p90Chain.toString().padStart(4)} ${r.maxChain.toString().padStart(4)} ${clearPct}% ${wipePct}%  ${r.avgMaxGen.toFixed(1).padStart(5)} ${r.avgChainTargetRatio.toFixed(2).padStart(7)}  (${ms}ms)`);
    }
}

// =========================================================================
// CONTRAST ANALYSIS
// =========================================================================

console.log(`\n${'═'.repeat(80)}`);
console.log(`  CONTRAST ANALYSIS (Supernova vs Normal)`);
console.log(`${'═'.repeat(80)}`);
console.log(`\n  The best Supernova creates dramatic contrast without trivializing the game.`);
console.log(`  Ideal: clear rate boost of +30-50%, wipe rate stays <30%, feels earned.\n`);

console.log(`  ${'Variant'.padEnd(22)}  R5 Δclear  R8 Δclear  R12 Δclear  R5 wipe  R8 wipe  R12 wipe  Score`);
console.log(`  ${'─'.repeat(90)}`);

const baseResults = {};
for (const round of testRounds) {
    baseResults[round] = allResults[round].baseline;
}

for (const [name, variant] of Object.entries(variants)) {
    if (name === 'baseline') continue;

    let score = 0;
    const cols = [];

    for (const round of testRounds) {
        const base = baseResults[round];
        const nova = allResults[round][name];
        const clearDelta = nova.clearRate - base.clearRate;
        const wipeRate = nova.wipeRate;

        cols.push(`${(clearDelta * 100).toFixed(0).padStart(4)}%`);

        // Score: reward clear rate boost, penalize excessive wipes
        if (clearDelta > 0.10) score += 1;
        if (clearDelta > 0.25) score += 1;
        if (clearDelta > 0.40) score += 1;
        if (wipeRate > 0.50) score -= 2;  // too trivial
        else if (wipeRate > 0.30) score -= 1;
        if (wipeRate < 0.20 && clearDelta > 0.15) score += 1;  // sweet spot: boost without wipes
    }

    const wipes = testRounds.map(r => `${(allResults[r][name].wipeRate * 100).toFixed(0).padStart(4)}%`);

    console.log(`  ${name.padEnd(22)} ${cols.map(c => c.padStart(9)).join('')}  ${wipes.map(w => w.padStart(7)).join('')}  ${score > 0 ? '+' : ''}${score}`);
}

console.log(`\n  Scoring: +1 for Δclear >10%, +1 >25%, +1 >40%, +1 low wipe + good boost`);
console.log(`  Penalties: -1 wipe >30%, -2 wipe >50% (too trivial, no agency)`);
console.log(`\n  The winner is the variant with the highest score: dramatic but earned.\n`);
