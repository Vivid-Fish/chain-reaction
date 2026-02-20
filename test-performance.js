#!/usr/bin/env node
'use strict';
// =========================================================================
// CHAIN REACTION — Performance Profiling (Phase 4)
// Playwright: wraps update()+draw() to measure actual CPU work per frame.
// Headless Chrome vsync-locks RAF to 16.67ms, so RAF interval != work time.
// =========================================================================

const { chromium } = require('playwright');
const path = require('path');

function analyzeWorkTimes(workTimes) {
    if (!workTimes.length) return { avg: 0, max: 0, p95: 0, p99: 0, dropped: 0, frames: 0 };
    const sorted = [...workTimes].sort((a, b) => a - b);
    return {
        avg: workTimes.reduce((a, b) => a + b, 0) / workTimes.length,
        max: Math.max(...workTimes),
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        dropped: workTimes.filter(t => t > 16.67).length,
        frames: workTimes.length,
    };
}

async function measureScenario(browser, viewport, setupCode, frames) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Inject work-time measurement wrappers
    await page.evaluate(() => {
        window.__workTimes = [];
        const _origUpdate = update;
        const _origDraw = draw;
        update = function() {
            window.__frameT0 = performance.now();
            _origUpdate();
        };
        draw = function() {
            _origDraw();
            if (window.__frameT0) {
                window.__workTimes.push(performance.now() - window.__frameT0);
            }
        };
    });
    await page.waitForTimeout(100);

    // Run scenario setup
    await page.evaluate(new Function(setupCode));
    await page.waitForTimeout(200);

    // Clear previous measurements and wait for N frames
    await page.evaluate(() => { window.__workTimes = []; });

    // Wait for enough frames
    const waitMs = Math.ceil(frames * 16.67) + 500;
    await page.waitForTimeout(waitMs);

    const workTimes = await page.evaluate((n) => window.__workTimes.slice(0, n), frames);
    await context.close();
    return analyzeWorkTimes(workTimes);
}

async function run() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  CHAIN REACTION — Performance Profiling Suite       ║');
    console.log('║  (measures actual update()+draw() CPU cost)         ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    const browser = await chromium.launch({ headless: true });
    const gates = [];
    function gate(num, desc, pass) {
        const icon = pass ? '✓' : '✗';
        console.log(`  ${icon} P${num}: ${desc}`);
        gates.push({ num, desc, pass });
    }

    // --- Test 1: Normal gameplay (L5, 30 dots, cascade) ---
    console.log('━━━ Test 1: Normal Gameplay (L5, 30 dots) ━━━\n');
    {
        const r = await measureScenario(browser, { width: 800, height: 600 }, `
            handleTap(W / 2, H / 2);
            currentLevel = 4;
            startLevel();
            let bestX = W/2, bestY = H/2, bestCount = 0;
            for (let gx = 0; gx < 20; gx++) {
                for (let gy = 0; gy < 20; gy++) {
                    const x = (gx + 0.5) * W / 20, y = (gy + 0.5) * H / 20;
                    let count = 0;
                    for (const d of dots) {
                        if (d.active && Math.hypot(d.x - x, d.y - y) <= explosionRadius) count++;
                    }
                    if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
                }
            }
            handleTap(bestX, bestY);
        `, 300);

        console.log(`  Avg: ${r.avg.toFixed(2)}ms | Max: ${r.max.toFixed(2)}ms | P95: ${r.p95.toFixed(2)}ms | P99: ${r.p99.toFixed(2)}ms | >16.67ms: ${r.dropped}`);
        gate(1, `Normal avg ${r.avg.toFixed(2)}ms (<12ms)`, r.avg < 12);
        gate(2, `Normal max ${r.max.toFixed(2)}ms (<25ms)`, r.max < 25);
        gate(3, `Normal p95 ${r.p95.toFixed(2)}ms (<16.67ms)`, r.p95 < 16.67);
        gate(4, `Normal >16.67ms frames: ${r.dropped} (<10)`, r.dropped < 10);
    }

    // --- Test 2: Peak stress (L12, 60 dots, cascade) ---
    console.log('\n━━━ Test 2: Peak Stress (L12, 60 dots) ━━━\n');
    {
        const r = await measureScenario(browser, { width: 800, height: 600 }, `
            handleTap(W / 2, H / 2);
            currentLevel = 11;
            startLevel();
            let bestX = W/2, bestY = H/2, bestCount = 0;
            for (let gx = 0; gx < 20; gx++) {
                for (let gy = 0; gy < 20; gy++) {
                    const x = (gx + 0.5) * W / 20, y = (gy + 0.5) * H / 20;
                    let count = 0;
                    for (const d of dots) {
                        if (d.active && Math.hypot(d.x - x, d.y - y) <= explosionRadius) count++;
                    }
                    if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
                }
            }
            handleTap(bestX, bestY);
        `, 300);

        console.log(`  Avg: ${r.avg.toFixed(2)}ms | Max: ${r.max.toFixed(2)}ms | P95: ${r.p95.toFixed(2)}ms | P99: ${r.p99.toFixed(2)}ms | >16.67ms: ${r.dropped}`);
        gate(5, `Stress avg ${r.avg.toFixed(2)}ms (<14ms)`, r.avg < 14);
        gate(6, `Stress max ${r.max.toFixed(2)}ms (<30ms)`, r.max < 30);
        gate(7, `Stress p95 ${r.p95.toFixed(2)}ms (<20ms)`, r.p95 < 20);
    }

    // --- Test 3: Synthetic worst case (all 60 simultaneous) ---
    console.log('\n━━━ Test 3: Worst Case (all 60 simultaneous) ━━━\n');
    {
        const r = await measureScenario(browser, { width: 800, height: 600 }, `
            handleTap(W / 2, H / 2);
            currentLevel = 11;
            startLevel();
            gameState = 'resolving';
            dots.forEach((dot) => {
                if (dot.active) {
                    dot.active = false;
                    chainCount++;
                    emitParticles(dot.x, dot.y, dot.getHue(), 0);
                    explosions.push(new Explosion(dot.x, dot.y, 0, null));
                }
            });
        `, 120);

        console.log(`  Avg: ${r.avg.toFixed(2)}ms | Max: ${r.max.toFixed(2)}ms | P95: ${r.p95.toFixed(2)}ms | >16.67ms: ${r.dropped}`);
        gate(8, `Worst avg ${r.avg.toFixed(2)}ms (<16ms)`, r.avg < 16);
        gate(9, `Worst max ${r.max.toFixed(2)}ms (<35ms)`, r.max < 35);
    }

    // --- Test 4: Phone viewport ---
    console.log('\n━━━ Test 4: Phone (390x844, L12 cascade) ━━━\n');
    {
        const r = await measureScenario(browser, { width: 390, height: 844 }, `
            handleTap(W / 2, H / 2);
            currentLevel = 11;
            startLevel();
            let bestX = W/2, bestY = H/2, bestCount = 0;
            for (let gx = 0; gx < 20; gx++) {
                for (let gy = 0; gy < 20; gy++) {
                    const x = (gx + 0.5) * W / 20, y = (gy + 0.5) * H / 20;
                    let count = 0;
                    for (const d of dots) {
                        if (d.active && Math.hypot(d.x - x, d.y - y) <= explosionRadius) count++;
                    }
                    if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
                }
            }
            handleTap(bestX, bestY);
        `, 300);

        console.log(`  Avg: ${r.avg.toFixed(2)}ms | Max: ${r.max.toFixed(2)}ms | P95: ${r.p95.toFixed(2)}ms | >16.67ms: ${r.dropped}`);
        gate(10, `Phone avg ${r.avg.toFixed(2)}ms (<14ms)`, r.avg < 14);
        gate(11, `Phone p95 ${r.p95.toFixed(2)}ms (<20ms)`, r.p95 < 20);
    }

    // --- Summary ---
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  PERFORMANCE SUMMARY                                ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    const passed = gates.filter(g => g.pass).length;
    const failed = gates.filter(g => !g.pass).length;
    console.log(`  PASS: ${passed}  FAIL: ${failed}  Total: ${gates.length}`);
    if (failed > 0) {
        console.log('\n  Failed:');
        gates.filter(g => !g.pass).forEach(g => console.log(`    ✗ P${g.num}: ${g.desc}`));
    }

    await browser.close();
    process.exit(failed === 0 ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
