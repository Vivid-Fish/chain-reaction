#!/usr/bin/env node
'use strict';

// =========================================================================
// CHAIN REACTION — Parallel Parameter Sweep
//
// Tests many parameter combinations in parallel using worker_threads.
// Finds configs that put all metrics in the sweet spot.
//
// Usage:
//   node sweep.js                    # Default sweep
//   node sweep.js --workers 8        # Use 8 threads
//   node sweep.js --quick            # Fewer runs per config (faster)
//   node sweep.js --mechanics        # Test mechanic variations too
// =========================================================================

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

// =========================================================================
// WORKER CODE (runs inside each thread)
// =========================================================================

if (!isMainThread) {
    // Re-require the simulation engine inline (workers can't share module state)
    const { config, W, H, round, runs, configLabel } = workerData;

    // --- Inline simulation engine (extracted from sim.js) ---
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

    class Sim {
        constructor(w, h, cfg, seed) {
            this.W = w; this.H = h; this.cfg = cfg;
            this.rng = createRNG(seed);
            const refDim = Math.min(w, h, 800);
            this.explosionRadius = Math.max(cfg.EXPLOSION_RADIUS_MIN_PX, refDim * cfg.EXPLOSION_RADIUS_PCT);
            this.reset();
        }
        reset() {
            this.dots = []; this.explosions = []; this.pendingExplosions = [];
            this.scheduledDetonations = new Set(); this.chainCount = 0; this.score = 0;
            this.currentMultiplier = 1; this.gameState = 'idle'; this.time = 0;
            this.slowMo = 1.0; this.slowMoTarget = 1.0; this._hitLog = [];
        }
        generateDots(count, speedMin, speedMax) {
            this.dots = [];
            let att = 0;
            const topM = this.cfg.SCREEN_MARGIN + 50;
            while (this.dots.length < count && att < 5000) {
                const x = this.cfg.SCREEN_MARGIN + this.rng() * (this.W - this.cfg.SCREEN_MARGIN * 2);
                const y = topM + this.rng() * (this.H - topM - this.cfg.SCREEN_MARGIN);
                let ok = true;
                for (const d of this.dots) {
                    if (Math.hypot(d.x - x, d.y - y) < this.cfg.MIN_DOT_DISTANCE) { ok = false; break; }
                }
                if (ok) {
                    const a = this.rng() * Math.PI * 2;
                    const spd = speedMin + this.rng() * (speedMax - speedMin);
                    const dot = { x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, active: true, type: 'standard' };
                    // Mechanic: assign types if configured
                    if (this.cfg.dotTypes) {
                        const roll = this.rng();
                        let cum = 0;
                        for (const [type, pct] of Object.entries(this.cfg.dotTypes)) {
                            cum += pct;
                            if (roll < cum) { dot.type = type; break; }
                        }
                    }
                    // Mechanic: type-specific speed modifiers
                    if (dot.type === 'heavy') { dot.vx *= 0.4; dot.vy *= 0.4; }
                    if (dot.type === 'volatile') { dot.vx *= 1.8; dot.vy *= 1.8; }
                    this.dots.push(dot);
                }
                att++;
            }
        }
        setupRound(round) {
            const dots = Math.min(60, Math.floor(10 + round * 2.5));
            const pct = Math.min(0.80, 0.05 + (round - 1) * 0.028);
            const target = Math.max(1, Math.ceil(dots * pct));
            const sMin = (this.cfg.speedMin || 0.6) + Math.min(0.4, (round - 1) * 0.03);
            const sMax = (this.cfg.speedMax || 1.2) + Math.min(0.8, (round - 1) * 0.05);
            this.generateDots(dots, sMin, sMax);
            this.explosions = []; this.pendingExplosions = [];
            this.scheduledDetonations = new Set(); this.chainCount = 0; this.score = 0;
            this.currentMultiplier = 1; this.gameState = 'playing'; this.time = 0;
            this.slowMo = 1.0; this.slowMoTarget = 1.0; this._hitLog = [];
            return { dots, target, pct, speedMin: sMin, speedMax: sMax };
        }
        tap(x, y) {
            if (this.gameState !== 'playing') return;
            this.gameState = 'resolving';
            this.explosions.push(this._mkExp(x, y, 0));
        }
        _mkExp(x, y, gen) {
            return { x, y, generation: gen, maxRadius: this.explosionRadius, radius: 0,
                phase: 'grow', age: 0, caught: new Set(), createdAt: this.time };
        }
        step(dt) {
            this.time += dt;
            for (let i = this.pendingExplosions.length - 1; i >= 0; i--) {
                if (this.time >= this.pendingExplosions[i].time) {
                    const p = this.pendingExplosions[i];
                    this.explosions.push(this._mkExp(p.x, p.y, p.generation));
                    this.pendingExplosions.splice(i, 1);
                }
            }
            const m = this.cfg.SCREEN_MARGIN;
            for (const d of this.dots) {
                if (!d.active) continue;
                d.x += d.vx * this.slowMo; d.y += d.vy * this.slowMo;
                // Mechanic: gravity dots pull neighbors
                if (d.type === 'gravity' && d.active) {
                    const pullR = this.explosionRadius * (this.cfg.gravityRange || 2.5);
                    const pullF = this.cfg.gravityForce || 0.015;
                    for (const o of this.dots) {
                        if (o === d || !o.active) continue;
                        const dist = Math.hypot(o.x - d.x, o.y - d.y);
                        if (dist < pullR && dist > 5) {
                            const f = pullF / (dist / this.explosionRadius);
                            o.vx += (d.x - o.x) / dist * f;
                            o.vy += (d.y - o.y) / dist * f;
                        }
                    }
                }
                if (d.x < m) { d.vx = Math.abs(d.vx); d.x = m; }
                if (d.x > this.W - m) { d.vx = -Math.abs(d.vx); d.x = this.W - m; }
                if (d.y < m) { d.vy = Math.abs(d.vy); d.y = m; }
                if (d.y > this.H - m) { d.vy = -Math.abs(d.vy); d.y = this.H - m; }
            }
            const cfg = this.cfg;
            this.explosions = this.explosions.filter(e => {
                e.age += dt * this.slowMo;
                if (e.phase === 'grow') {
                    if (e.age >= cfg.EXPLOSION_GROW_MS) e.phase = 'hold';
                    e.radius = e.maxRadius * easeOutExpo(Math.min(e.age / cfg.EXPLOSION_GROW_MS, 1));
                } else if (e.phase === 'hold') {
                    if (e.age >= cfg.EXPLOSION_GROW_MS + cfg.EXPLOSION_HOLD_MS) e.phase = 'shrink';
                    e.radius = e.maxRadius;
                    // Mechanic: volatile explosions have bigger radius
                } else if (e.phase === 'shrink') {
                    const t = (e.age - cfg.EXPLOSION_GROW_MS - cfg.EXPLOSION_HOLD_MS) / cfg.EXPLOSION_SHRINK_MS;
                    if (t >= 1) return false;
                    e.radius = e.maxRadius * (1 - easeInQuad(t));
                }
                // Mechanic: type-based radius modifier
                let effectiveRadius = e.radius;
                if (e.dotType === 'volatile') effectiveRadius *= (cfg.volatileRadiusMult || 1.5);

                if (e.phase === 'grow' || e.phase === 'hold') {
                    for (let i = 0; i < this.dots.length; i++) {
                        const dot = this.dots[i];
                        if (!dot.active || e.caught.has(i)) continue;
                        if (Math.hypot(dot.x - e.x, dot.y - e.y) <= effectiveRadius) {
                            e.caught.add(i);
                            this._det(dot, i, e.generation, e);
                        }
                    }
                }
                return true;
            });
            if (this.slowMo !== this.slowMoTarget) {
                this.slowMo += (this.slowMoTarget - this.slowMo) * 0.15;
                if (Math.abs(this.slowMo - this.slowMoTarget) < 0.01) this.slowMo = this.slowMoTarget;
            }
            if (this.slowMoTarget < 1 && !this.explosions.length && !this.pendingExplosions.length) this.slowMoTarget = 1;
            if (this.gameState === 'resolving' && !this.explosions.length && !this.pendingExplosions.length) this.gameState = 'done';
        }
        _det(dot, idx, gen, exp) {
            if (this.scheduledDetonations.has(idx)) return;
            this.scheduledDetonations.add(idx); dot.active = false; this.chainCount++;
            const mults = this.cfg.MULT_THRESHOLDS || [{ chain: 0, mult: 1 }];
            let mult = 1;
            for (const t of mults) { if (this.chainCount >= t.chain) mult = t.mult; }
            if (mult > this.currentMultiplier) this.currentMultiplier = mult;
            this.score += 10 * (gen + 1) * this.currentMultiplier;
            const expEnd = exp.createdAt + this.cfg.EXPLOSION_GROW_MS;
            this._hitLog.push({ idx, gen, time: this.time, expansionHit: this.time <= expEnd });
            const delay = this.cfg.CASCADE_STAGGER_MS + (this.rng() - 0.5) * 2 * this.cfg.CASCADE_JITTER_MS;
            const childExp = { x: dot.x, y: dot.y, generation: gen + 1, time: this.time + delay };
            // Inherit dot type to explosion
            childExp.dotType = dot.type;
            this.pendingExplosions.push(childExp);
        }
        resolveChain() {
            let lim = 30000 / 16.67;
            while (this.gameState === 'resolving' && lim-- > 0) this.step(16.67);
        }
        countInRadius(x, y, r) {
            let c = 0;
            for (const d of this.dots) { if (d.active && Math.hypot(d.x - x, d.y - y) <= r) c++; }
            return c;
        }
        getSnapshot() { return this.dots.map(d => ({ ...d })); }
    }

    // --- Run metrics for this config ---
    function runMetrics(W, H, cfg, runs, round) {
        const randomChains = [], greedyChains = [];
        let totalHits = 0, driftHits = 0;
        const r50s = [];

        for (let i = 0; i < runs; i++) {
            const seed = i * 7 + 1;

            // Random
            const s1 = new Sim(W, H, cfg, seed);
            s1.setupRound(round);
            const m = cfg.SCREEN_MARGIN + 20;
            const rx = m + s1.rng() * (W - m * 2);
            const ry = m + 50 + s1.rng() * (H - m * 2 - 50);
            s1.tap(rx, ry);
            s1.resolveChain();
            randomChains.push(s1.chainCount);

            // Greedy
            const s2 = new Sim(W, H, cfg, seed);
            s2.setupRound(round);
            let bx = W/2, by = H/2, bc = 0;
            for (let gx = 0; gx < 20; gx++) {
                for (let gy = 0; gy < 20; gy++) {
                    const x = (gx + 0.5) * W / 20, y = (gy + 0.5) * H / 20;
                    const c = s2.countInRadius(x, y, s2.explosionRadius);
                    if (c > bc) { bc = c; bx = x; by = y; }
                }
            }
            s2.tap(bx, by);
            s2.resolveChain();
            greedyChains.push(s2.chainCount);

            // Drift hits
            for (const h of s2._hitLog) {
                totalHits++;
                if (!h.expansionHit) driftHits++;
            }

            // Input sensitivity (subsample)
            if (i < 100 && s2.chainCount > 0) {
                let found = false;
                for (const delta of [10, 20, 40, 60, 80, 100]) {
                    let avgOff = 0;
                    for (let d = 0; d < 8; d++) {
                        const a = (d / 8) * Math.PI * 2;
                        const sx = new Sim(W, H, cfg, seed);
                        sx.setupRound(round);
                        sx.tap(bx + Math.cos(a) * delta, by + Math.sin(a) * delta);
                        sx.resolveChain();
                        avgOff += sx.chainCount;
                    }
                    avgOff /= 8;
                    if (!found && avgOff / s2.chainCount <= 0.5) { r50s.push(delta); found = true; }
                }
                if (!found) r50s.push(100);
            }
        }

        // Chaos decay (subsample)
        const retentions = [];
        for (let i = 0; i < Math.min(runs, 50); i++) {
            const seed = i * 7 + 1;
            const s1 = new Sim(W, H, cfg, seed);
            s1.setupRound(round);
            let bx = W/2, by = H/2, bc = 0;
            for (let gx = 0; gx < 15; gx++) {
                for (let gy = 0; gy < 15; gy++) {
                    const x = (gx + 0.5) * W / 15, y = (gy + 0.5) * H / 15;
                    const c = s1.countInRadius(x, y, s1.explosionRadius);
                    if (c > bc) { bc = c; bx = x; by = y; }
                }
            }
            const sNow = new Sim(W, H, cfg, seed);
            sNow.setupRound(round);
            sNow.tap(bx, by); sNow.resolveChain();
            if (sNow.chainCount === 0) continue;
            const s200 = new Sim(W, H, cfg, seed);
            s200.setupRound(round);
            for (let t = 0; t < 200; t += 16.67) s200.step(16.67);
            s200.tap(bx, by); s200.resolveChain();
            retentions.push(s200.chainCount / sNow.chainCount);
        }

        // Opportunity density (subsample)
        let f3frames = 0, totalFrames = 0;
        for (let i = 0; i < Math.min(runs, 20); i++) {
            const s = new Sim(W, H, cfg, i * 7 + 1);
            s.setupRound(round);
            for (let t = 0; t < 5000; t += 16.67) {
                s.step(16.67);
                let maxC = 0;
                for (let gx = 0; gx < 10; gx++) {
                    for (let gy = 0; gy < 10; gy++) {
                        maxC = Math.max(maxC, s.countInRadius(
                            (gx + 0.5) * W / 10, (gy + 0.5) * H / 10, s.explosionRadius));
                    }
                }
                totalFrames++;
                if (maxC >= 3) f3frames++;
            }
        }

        const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
        const rAvg = avg(randomChains), gAvg = avg(greedyChains);

        return {
            label: configLabel,
            SCR: rAvg > 0 ? gAvg / rAvg : 0,
            randomAvg: rAvg.toFixed(2),
            greedyAvg: gAvg.toFixed(2),
            DHR: totalHits > 0 ? (driftHits / totalHits) : 0,
            f3: totalFrames > 0 ? (f3frames / totalFrames) : 0,
            r50: avg(r50s),
            chaosRet200: avg(retentions),
            greedyMax: Math.max(...greedyChains),
            randomMax: Math.max(...randomChains),
        };
    }

    const result = runMetrics(W, H, config, runs, round);
    parentPort.postMessage(result);
    return;
}

// =========================================================================
// MAIN THREAD — Orchestrate parallel workers
// =========================================================================

const DEFAULT_CFG = {
    EXPLOSION_RADIUS_PCT: 0.13, EXPLOSION_RADIUS_MIN_PX: 35,
    EXPLOSION_GROW_MS: 200, EXPLOSION_HOLD_MS: 1000, EXPLOSION_SHRINK_MS: 500,
    CASCADE_STAGGER_MS: 80, CASCADE_JITTER_MS: 25,
    MIN_DOT_DISTANCE: 25, SCREEN_MARGIN: 16,
    MULT_THRESHOLDS: [
        { chain: 0, mult: 1 }, { chain: 5, mult: 2 },
        { chain: 10, mult: 3 }, { chain: 15, mult: 4 },
        { chain: 20, mult: 5 }, { chain: 30, mult: 8 },
    ],
};

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = { workers: Math.max(1, os.cpus().length - 1), quick: false, mechanics: false,
        round: 5, viewport: '390x844' };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--workers') opts.workers = parseInt(args[++i]);
        else if (args[i] === '--quick') opts.quick = true;
        else if (args[i] === '--mechanics') opts.mechanics = true;
        else if (args[i] === '--round') opts.round = parseInt(args[++i]);
        else if (args[i] === '--viewport') opts.viewport = args[++i];
    }
    return opts;
}

function buildConfigs(mechanics) {
    const configs = [];

    // Parameter sweep: explosion radius
    for (const r of [0.09, 0.10, 0.11, 0.13, 0.15]) {
        configs.push({
            label: `radius=${r}`,
            config: { ...DEFAULT_CFG, EXPLOSION_RADIUS_PCT: r },
        });
    }

    // Parameter sweep: dot speed
    for (const s of [0.4, 0.6, 0.8, 1.0, 1.4]) {
        configs.push({
            label: `speed=${s}`,
            config: { ...DEFAULT_CFG, speedMin: s, speedMax: s * 2 },
        });
    }

    // Parameter sweep: hold duration
    for (const h of [500, 750, 1000, 1500, 2000]) {
        configs.push({
            label: `hold=${h}ms`,
            config: { ...DEFAULT_CFG, EXPLOSION_HOLD_MS: h },
        });
    }

    // Combined: smaller radius + faster dots
    configs.push({
        label: 'r=0.10+spd=1.0',
        config: { ...DEFAULT_CFG, EXPLOSION_RADIUS_PCT: 0.10, speedMin: 1.0, speedMax: 2.0 },
    });
    configs.push({
        label: 'r=0.11+spd=0.8',
        config: { ...DEFAULT_CFG, EXPLOSION_RADIUS_PCT: 0.11, speedMin: 0.8, speedMax: 1.6 },
    });
    configs.push({
        label: 'r=0.11+spd=1.0+hold=750',
        config: { ...DEFAULT_CFG, EXPLOSION_RADIUS_PCT: 0.11, speedMin: 1.0, speedMax: 2.0, EXPLOSION_HOLD_MS: 750 },
    });

    if (mechanics) {
        // Mechanic: gravity dots (20% of dots have gravity pull)
        configs.push({
            label: 'gravity-20%',
            config: { ...DEFAULT_CFG, dotTypes: { standard: 0.8, gravity: 0.2 }, gravityForce: 0.015 },
        });
        configs.push({
            label: 'gravity-30%+strong',
            config: { ...DEFAULT_CFG, dotTypes: { standard: 0.7, gravity: 0.3 }, gravityForce: 0.03 },
        });

        // Mechanic: volatile dots (bigger explosion radius)
        configs.push({
            label: 'volatile-20%',
            config: { ...DEFAULT_CFG, dotTypes: { standard: 0.8, volatile: 0.2 }, volatileRadiusMult: 1.5 },
        });

        // Mechanic: heavy dots (slow) + volatile (fast, big boom)
        configs.push({
            label: 'heavy+volatile',
            config: { ...DEFAULT_CFG, dotTypes: { standard: 0.5, heavy: 0.25, volatile: 0.25 }, volatileRadiusMult: 1.5 },
        });

        // Mechanic: gravity + volatile combo
        configs.push({
            label: 'gravity+volatile',
            config: { ...DEFAULT_CFG, dotTypes: { standard: 0.5, gravity: 0.25, volatile: 0.25 },
                gravityForce: 0.02, volatileRadiusMult: 1.5 },
        });

        // Combined tuning: smaller radius + mechanics
        configs.push({
            label: 'r=0.11+gravity+volatile',
            config: { ...DEFAULT_CFG, EXPLOSION_RADIUS_PCT: 0.11,
                dotTypes: { standard: 0.5, gravity: 0.25, volatile: 0.25 },
                gravityForce: 0.02, volatileRadiusMult: 1.5 },
        });
    }

    return configs;
}

async function runWorker(config, W, H, round, runs) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
            workerData: { config: config.config, W, H, round, runs, configLabel: config.label }
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => { if (code !== 0) reject(new Error(`Worker exited ${code}`)); });
    });
}

async function main() {
    const opts = parseArgs();
    const [W, H] = opts.viewport.split('x').map(Number);
    const runs = opts.quick ? 100 : 300;
    const configs = buildConfigs(opts.mechanics);

    console.log(`\n${'='.repeat(72)}`);
    console.log(`  CHAIN REACTION — Parameter Sweep`);
    console.log(`  ${configs.length} configs × ${runs} runs each, ${opts.workers} threads, ${W}x${H} R${opts.round}`);
    console.log(`${'='.repeat(72)}\n`);

    const t0 = Date.now();
    const results = [];

    // Run in batches of opts.workers
    for (let i = 0; i < configs.length; i += opts.workers) {
        const batch = configs.slice(i, i + opts.workers);
        const batchLabel = batch.map(c => c.label).join(', ');
        process.stdout.write(`  Running: ${batchLabel}...`);

        const batchResults = await Promise.all(
            batch.map(c => runWorker(c, W, H, opts.round, runs))
        );
        results.push(...batchResults);
        console.log(' done');
    }

    // Sort by composite score (how many metrics are in sweet spot)
    for (const r of results) {
        r.inRange = 0;
        if (r.SCR >= 2.0 && r.SCR <= 5.0) r.inRange++;
        if (r.DHR >= 0.30 && r.DHR <= 0.55) r.inRange++;
        if (r.f3 >= 0.30 && r.f3 <= 0.60) r.inRange++;
        if (r.r50 >= 30 && r.r50 <= 80) r.inRange++;
        if (r.chaosRet200 >= 0.40 && r.chaosRet200 <= 0.85) r.inRange++;
    }
    results.sort((a, b) => b.inRange - a.inRange || b.SCR - a.SCR);

    // Print results table
    console.log(`\n${'─'.repeat(72)}`);
    console.log('  RESULTS (sorted by metrics in sweet spot)');
    console.log(`${'─'.repeat(72)}`);

    const header = '  Config'.padEnd(30) + 'SCR'.padStart(6) + 'DHR'.padStart(6) +
        'F3'.padStart(6) + 'R50'.padStart(6) + 'Chaos'.padStart(7) + '  OK  gMax';
    console.log(header);
    console.log('  ' + '─'.repeat(70));

    for (const r of results) {
        const scr = r.SCR.toFixed(1);
        const dhr = r.DHR.toFixed(2);
        const f3 = (r.f3 * 100).toFixed(0) + '%';
        const r50 = r.r50.toFixed(0);
        const chaos = (r.chaosRet200 * 100).toFixed(0) + '%';

        const colorize = (val, lo, hi, str) => {
            const v = parseFloat(val);
            if (v >= lo && v <= hi) return `\x1b[32m${str}\x1b[0m`;
            return `\x1b[33m${str}\x1b[0m`;
        };

        const line = `  ${r.label.padEnd(28)}` +
            colorize(r.SCR, 2, 5, scr.padStart(6)) +
            colorize(r.DHR, 0.3, 0.55, dhr.padStart(6)) +
            colorize(r.f3, 0.3, 0.6, f3.padStart(6)) +
            colorize(r.r50, 30, 80, r50.padStart(6)) +
            colorize(r.chaosRet200, 0.4, 0.85, chaos.padStart(7)) +
            `  ${r.inRange}/5  ${r.greedyMax}`;
        console.log(line);
    }

    // Best config recommendation
    const best = results[0];
    console.log(`\n${'─'.repeat(72)}`);
    console.log(`  BEST: "${best.label}" (${best.inRange}/5 metrics in sweet spot)`);
    console.log(`  SCR=${best.SCR.toFixed(2)} DHR=${best.DHR.toFixed(2)} F3=${(best.f3*100).toFixed(0)}% R50=${best.r50.toFixed(0)}px Chaos=${(best.chaosRet200*100).toFixed(0)}%`);
    console.log(`  Greedy avg chain: ${best.greedyAvg}, max: ${best.greedyMax}`);
    console.log(`${'─'.repeat(72)}`);

    console.log(`\n  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
