#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Progression Metric
//
// The meter in the front hall, not the basement.
// Tests R1-R15 with greedy bot, measures per-round:
//   - Clear rate (% of attempts that meet target)
//   - Chain/target ratio (how much chains overshoot target)
//   - Wipe rate (% of attempts catching >90% of all dots)
//   - All 5 standard metrics per round
//
// Meadows Level 6: "Missing feedback is one of the most common causes
// of system malfunction." Testing only R5 was missing feedback.
//
// Usage:
//   node progression-test.js                    # Full R1-R15 progression
//   node progression-test.js --cap 5            # Test cascade cap at gen 5
//   node progression-test.js --cap 4 --decay    # Cap + diminishing returns
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

const DEFAULT_CONFIG = {
    EXPLOSION_RADIUS_PCT: 0.10,
    EXPLOSION_RADIUS_MIN_PX: 35,
    EXPLOSION_GROW_MS: 200,
    EXPLOSION_HOLD_MS: 1000,
    EXPLOSION_SHRINK_MS: 500,
    CASCADE_STAGGER_MS: 80,
    CASCADE_JITTER_MS: 25,
    CASCADE_RADIUS_GROWTH: 0.08,
    CASCADE_HOLD_GROWTH_MS: 200,
    CASCADE_GEN_CAP: Infinity,        // max generation for cascade growth
    CASCADE_DIMINISH: false,          // diminishing returns on cascade
    MIN_DOT_DISTANCE: 25,
    SCREEN_MARGIN: 16,
    MULT_THRESHOLDS: [
        { chain: 0, mult: 1 }, { chain: 5, mult: 2 },
        { chain: 10, mult: 3 }, { chain: 15, mult: 4 },
        { chain: 20, mult: 5 }, { chain: 30, mult: 8 },
    ],
};

function getRoundParams(r, config) {
    const dots = Math.min(60, Math.floor(10 + r * 2.5));
    const pct = Math.min(0.80, 0.05 + (r - 1) * 0.028);
    const target = Math.max(1, Math.ceil(dots * pct));
    const speedMin = (config.speedMin || 0.7) + Math.min(0.4, (r - 1) * 0.03);
    const speedMax = (config.speedMax || 1.4) + Math.min(0.8, (r - 1) * 0.05);
    let typeWeights;
    if (r <= 2) {
        typeWeights = { standard: 1.0 };
    } else if (r <= 4) {
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
// SIMULATION (with cascade cap support)
// =========================================================================

class Simulation {
    constructor(W, H, config = {}, seed = 42) {
        this.W = W; this.H = H;
        this.cfg = { ...DEFAULT_CONFIG, ...config };
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
        this.score = 0;
        this.currentMultiplier = 1;
        this.gameState = 'idle';
        this.time = 0;
        this.slowMo = 1.0;
        this.slowMoTarget = 1.0;
        this._hitLog = [];
        this._maxGen = 0;  // track deepest chain generation
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
        const params = getRoundParams(round, this.cfg);
        this.generateDots(params.dots, params.speedMin, params.speedMax, params.typeWeights);
        this.explosions = [];
        this.pendingExplosions = [];
        this.scheduledDetonations = new Set();
        this.chainCount = 0;
        this.score = 0;
        this.currentMultiplier = 1;
        this.gameState = 'playing';
        this.time = 0;
        this.slowMo = 1.0;
        this._hitLog = [];
        this._maxGen = 0;
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

        // Cascade momentum with cap and optional diminishing returns
        if (generation > 0) {
            const effectiveGen = Math.min(generation, this.cfg.CASCADE_GEN_CAP);
            let growth, holdGrowth;
            if (this.cfg.CASCADE_DIMINISH) {
                // Diminishing returns: growth decays with 1/(1 + gen*0.3)
                growth = 0;
                holdGrowth = 0;
                for (let g = 1; g <= effectiveGen; g++) {
                    const factor = 1 / (1 + (g - 1) * 0.3);
                    growth += this.cfg.CASCADE_RADIUS_GROWTH * factor;
                    holdGrowth += this.cfg.CASCADE_HOLD_GROWTH_MS * factor;
                }
            } else {
                growth = this.cfg.CASCADE_RADIUS_GROWTH * effectiveGen;
                holdGrowth = this.cfg.CASCADE_HOLD_GROWTH_MS * effectiveGen;
            }
            maxRadius *= (1 + growth);
            holdMs += holdGrowth;
        }

        if (generation > this._maxGen) this._maxGen = generation;

        return {
            x, y, generation,
            dotType: dotType || 'standard',
            maxRadius, holdMs,
            radius: 0, phase: 'grow', age: 0,
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
            d.x += d.vx * this.slowMo;
            d.y += d.vy * this.slowMo;
            if (d.type === 'gravity') {
                const pullR = this.explosionRadius * 2.5;
                for (const o of this.dots) {
                    if (o === d || !o.active) continue;
                    const dist = Math.hypot(o.x - d.x, o.y - d.y);
                    if (dist < pullR && dist > 5) {
                        const f = 0.012 * this.slowMo / (dist / this.explosionRadius);
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

            if (e.phase === 'grow' || e.phase === 'hold') {
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

        if (this.gameState === 'resolving' && this.explosions.length === 0 && this.pendingExplosions.length === 0) {
            this.gameState = 'done';
        }
    }

    _detonateDot(dot, dotIndex, generation, explosion) {
        if (this.scheduledDetonations.has(dotIndex)) return;
        this.scheduledDetonations.add(dotIndex);
        dot.active = false;
        this.chainCount++;
        const explosionGrowEnd = explosion.createdAt + this.cfg.EXPLOSION_GROW_MS;
        this._hitLog.push({ dotIndex, generation, time: this.time, expansionHit: this.time <= explosionGrowEnd });
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

// --- Bot ---
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

// =========================================================================
// PROGRESSION METRIC
// =========================================================================

function runProgression(W, H, config, runs, maxRound) {
    const results = [];

    for (let round = 1; round <= maxRound; round++) {
        let clears = 0, totalChains = 0, totalDots = 0, wipes = 0;
        let totalHits = 0, driftHits = 0;
        let maxChainSeen = 0;

        const params = getRoundParams(round, config);

        for (let i = 0; i < runs; i++) {
            const sim = new Simulation(W, H, config, i * 7 + round * 1000 + 1);
            sim.setupRound(round);
            const tap = greedyTap(sim);
            sim.tap(tap.x, tap.y);
            sim.resolveChain();

            totalChains += sim.chainCount;
            totalDots += params.dots;
            if (sim.chainCount >= params.target) clears++;
            if (sim.chainCount >= params.dots * 0.9) wipes++;
            if (sim.chainCount > maxChainSeen) maxChainSeen = sim.chainCount;

            for (const h of sim._hitLog) {
                totalHits++;
                if (!h.expansionHit) driftHits++;
            }
        }

        const clearRate = clears / runs;
        const avgChain = totalChains / runs;
        const chainTargetRatio = avgChain / params.target;
        const wipeRate = wipes / runs;
        const DHR = totalHits > 0 ? driftHits / totalHits : 0;

        results.push({
            round, dots: params.dots, target: params.target,
            clearRate, avgChain, chainTargetRatio, wipeRate,
            maxChain: maxChainSeen, DHR,
        });
    }
    return results;
}

function printProgression(label, results) {
    console.log(`\n${'═'.repeat(90)}`);
    console.log(`  ${label}`);
    console.log(`${'═'.repeat(90)}`);

    const header = '  ' + 'Round'.padEnd(7) + 'Dots'.padStart(5) + 'Target'.padStart(7) +
        'ClearRate'.padStart(10) + 'AvgChain'.padStart(9) + 'Chain/Tgt'.padStart(10) +
        'WipeRate'.padStart(9) + 'MaxChain'.padStart(9) + 'DHR'.padStart(6);
    console.log(header);
    console.log('  ' + '─'.repeat(86));

    let problemRounds = [];

    for (const r of results) {
        // Color coding
        let clearTag = r.clearRate >= 0.95 ? '\x1b[33m' : (r.clearRate >= 0.60 ? '\x1b[32m' : '\x1b[31m');
        let wipeTag = r.wipeRate >= 0.50 ? '\x1b[31m' : (r.wipeRate >= 0.20 ? '\x1b[33m' : '\x1b[32m');
        let reset = '\x1b[0m';

        const row = '  R' + String(r.round).padEnd(4) +
            String(r.dots).padStart(5) +
            String(r.target).padStart(7) +
            clearTag + (r.clearRate * 100).toFixed(0).padStart(9) + '%' + reset +
            r.avgChain.toFixed(1).padStart(9) +
            r.chainTargetRatio.toFixed(2).padStart(10) +
            wipeTag + (r.wipeRate * 100).toFixed(0).padStart(8) + '%' + reset +
            String(r.maxChain).padStart(9) +
            r.DHR.toFixed(2).padStart(6);
        console.log(row);

        // Flag problems
        if (r.clearRate > 0.95) problemRounds.push(`R${r.round}: trivial (${(r.clearRate*100).toFixed(0)}% clear)`);
        if (r.wipeRate > 0.50) problemRounds.push(`R${r.round}: wipe city (${(r.wipeRate*100).toFixed(0)}% wipe rate)`);
        if (r.clearRate < 0.30 && r.round > 3) problemRounds.push(`R${r.round}: wall (${(r.clearRate*100).toFixed(0)}% clear)`);
    }

    // Summary
    console.log(`\n  ${'─'.repeat(40)}`);
    const avgClear = results.reduce((a, r) => a + r.clearRate, 0) / results.length;
    const avgWipe = results.reduce((a, r) => a + r.wipeRate, 0) / results.length;
    const avgDHR = results.reduce((a, r) => a + r.DHR, 0) / results.length;
    console.log(`  Avg clear rate: ${(avgClear * 100).toFixed(1)}%  (target: 60-70%)`);
    console.log(`  Avg wipe rate:  ${(avgWipe * 100).toFixed(1)}%  (target: <10%)`);
    console.log(`  Avg DHR:        ${avgDHR.toFixed(3)}  (target: 0.30-0.55)`);

    if (problemRounds.length > 0) {
        console.log(`\n  \x1b[33mPROBLEMS:\x1b[0m`);
        for (const p of problemRounds) console.log(`    - ${p}`);
    } else {
        console.log(`\n  \x1b[32mNo problems detected across progression.\x1b[0m`);
    }

    return { avgClear, avgWipe, avgDHR, problems: problemRounds.length };
}

// =========================================================================
// MAIN
// =========================================================================

const args = process.argv.slice(2);
let runs = 200;
let maxRound = 15;
let cascadeCap = Infinity;
let diminish = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runs') runs = parseInt(args[++i]);
    else if (args[i] === '--rounds') maxRound = parseInt(args[++i]);
    else if (args[i] === '--cap') cascadeCap = parseInt(args[++i]);
    else if (args[i] === '--decay' || args[i] === '--diminish') diminish = true;
}

const W = 390, H = 844;

// Test configurations
const configs = [
    {
        name: 'v8 (current, no cap)',
        config: { ...DEFAULT_CONFIG },
    },
];

// Add cap variants if requested or by default
if (cascadeCap < Infinity) {
    configs.push({
        name: `cascade cap=${cascadeCap}${diminish ? ' +diminish' : ''}`,
        config: { ...DEFAULT_CONFIG, CASCADE_GEN_CAP: cascadeCap, CASCADE_DIMINISH: diminish },
    });
} else {
    // Default: test current + several cap options
    configs.push(
        { name: 'cap=4', config: { ...DEFAULT_CONFIG, CASCADE_GEN_CAP: 4 } },
        { name: 'cap=5', config: { ...DEFAULT_CONFIG, CASCADE_GEN_CAP: 5 } },
        { name: 'cap=4+diminish', config: { ...DEFAULT_CONFIG, CASCADE_GEN_CAP: 4, CASCADE_DIMINISH: true } },
        { name: 'diminish only', config: { ...DEFAULT_CONFIG, CASCADE_DIMINISH: true } },
    );
}

console.log(`\n  CHAIN REACTION — Progression Test (Meadows Level 6)`);
console.log(`  ${W}x${H}, R1-R${maxRound}, ${runs} runs/round\n`);

const summaries = [];
for (const { name, config } of configs) {
    const t0 = Date.now();
    process.stdout.write(`  Running ${name}...`);
    const results = runProgression(W, H, config, runs, maxRound);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(` (${elapsed}s)`);
    const summary = printProgression(name, results);
    summaries.push({ name, ...summary, results });
}

// Comparison table
if (summaries.length > 1) {
    console.log(`\n\n${'═'.repeat(70)}`);
    console.log(`  COMPARISON`);
    console.log(`${'═'.repeat(70)}`);
    console.log('  ' + 'Config'.padEnd(22) + 'AvgClear'.padStart(10) + 'AvgWipe'.padStart(9) +
        'AvgDHR'.padStart(8) + 'Problems'.padStart(10) + 'WipeR10+'.padStart(10));
    console.log('  ' + '─'.repeat(67));
    for (const s of summaries) {
        // Average wipe rate for R10+
        const lateWipe = s.results.filter(r => r.round >= 10);
        const avgLateWipe = lateWipe.length > 0 ? lateWipe.reduce((a, r) => a + r.wipeRate, 0) / lateWipe.length : 0;
        console.log('  ' + s.name.padEnd(22) +
            ((s.avgClear * 100).toFixed(1) + '%').padStart(10) +
            ((s.avgWipe * 100).toFixed(1) + '%').padStart(9) +
            s.avgDHR.toFixed(3).padStart(8) +
            String(s.problems).padStart(10) +
            ((avgLateWipe * 100).toFixed(1) + '%').padStart(10)
        );
    }
}

console.log('');
