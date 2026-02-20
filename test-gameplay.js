#!/usr/bin/env node
'use strict';
// =========================================================================
// CHAIN REACTION — Automated Gameplay Testing (Phase 5)
// Playwright: plays the game end-to-end
// Uses page.waitForFunction to poll state transitions (cascade can take 10s+)
// Uses page.evaluate for taps (avoids coordinate mapping issues)
// =========================================================================

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const RESOLVE_TIMEOUT = 15000; // Max time to wait for cascade to finish

async function waitForResolve(page) {
    try {
        await page.waitForFunction(
            () => gameState !== 'resolving',
            { timeout: RESOLVE_TIMEOUT }
        );
    } catch {
        // Timeout — game stuck in resolving
    }
    return page.evaluate(() => gameState);
}

async function run() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  CHAIN REACTION — Automated Gameplay Suite          ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    const screenshotDir = path.resolve(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const gates = [];
    function gate(num, desc, pass) {
        const icon = pass ? '✓' : '✗';
        console.log(`  ${icon} G${num}: ${desc}`);
        gates.push({ num, desc, pass });
    }

    // --- Test 1: State transitions ---
    console.log('━━━ Test 1: State Transitions ━━━\n');
    {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
        const page = await context.newPage();
        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const state1 = await page.evaluate(() => gameState);
        gate(1, `Start screen: "${state1}" (expected "start")`, state1 === 'start');

        // Start game
        await page.evaluate(() => handleTap(W / 2, H / 2));
        await page.waitForTimeout(200);

        const state2 = await page.evaluate(() => gameState);
        gate(2, `After start: "${state2}" (expected "playing")`, state2 === 'playing');

        // Random tap
        await page.evaluate(() => {
            const rx = 100 + Math.random() * (W - 200);
            const ry = 100 + Math.random() * (H - 200);
            handleTap(rx, ry);
        });
        await page.waitForTimeout(100);

        const state3 = await page.evaluate(() => gameState);
        gate(3, `After tap: "${state3}" (expected "resolving")`, state3 === 'resolving');

        // Wait for resolution (poll, not fixed wait)
        const state4 = await waitForResolve(page);
        gate(4, `After resolve: "${state4}" (celebrating or failed)`,
            state4 === 'celebrating' || state4 === 'failed');

        await context.close();
    }

    // --- Test 2: One-tap enforcement ---
    console.log('\n━━━ Test 2: One-Tap Enforcement ━━━\n');
    {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
        const page = await context.newPage();
        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        await page.evaluate(() => handleTap(W / 2, H / 2)); // start
        await page.waitForTimeout(200);

        // Rapid multi-tap
        await page.evaluate(() => {
            handleTap(200, 200);
            handleTap(400, 300);
            handleTap(600, 400);
        });
        await page.waitForTimeout(100);

        const explosionCount = await page.evaluate(() => {
            // The first tap sets gameState = 'resolving' and creates one explosion
            // Subsequent handleTap calls see gameState !== 'playing' and return early
            // Count gen-0 explosions (only the player's tap creates gen-0)
            return explosions.filter(e => e.generation === 0).length;
        });

        gate(5, `One-tap: ${explosionCount} gen-0 explosion(s) (expected 1)`, explosionCount === 1);

        await context.close();
    }

    // --- Test 3: Optimal player ---
    console.log('\n━━━ Test 3: Optimal Player (level progression) ━━━\n');
    {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
        const page = await context.newPage();
        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        await page.evaluate(() => handleTap(W / 2, H / 2)); // start
        await page.waitForTimeout(200);

        const levelResults = [];
        const maxRetries = 10;

        for (let level = 0; level < 12; level++) {
            let cleared = false;
            let attempts = 0;
            let bestChain = 0;

            await page.evaluate((lvl) => { currentLevel = lvl; startLevel(); }, level);
            await page.waitForTimeout(200);

            for (let retry = 0; retry < maxRetries && !cleared; retry++) {
                attempts++;

                // Find optimal tap via grid search and tap
                await page.evaluate(() => {
                    let bestX = W/2, bestY = H/2, bestCount = 0;
                    for (let gx = 0; gx < 20; gx++) {
                        for (let gy = 0; gy < 20; gy++) {
                            const x = (gx + 0.5) * W / 20;
                            const y = (gy + 0.5) * H / 20;
                            let count = 0;
                            for (const d of dots) {
                                if (d.active && Math.hypot(d.x - x, d.y - y) <= explosionRadius) count++;
                            }
                            if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
                        }
                    }
                    handleTap(bestX, bestY);
                });

                // Wait for cascade to complete
                await waitForResolve(page);

                const result = await page.evaluate(() => ({
                    state: gameState,
                    chain: chainCount,
                    target: LEVELS[currentLevel].target,
                }));

                bestChain = Math.max(bestChain, result.chain);

                if (result.state === 'celebrating') {
                    cleared = true;
                    await page.screenshot({
                        path: path.join(screenshotDir, `level-${level + 1}-clear.png`)
                    });
                } else {
                    // Retry
                    await page.evaluate((lvl) => { currentLevel = lvl; startLevel(); }, level);
                    await page.waitForTimeout(200);
                }
            }

            levelResults.push({ level: level + 1, cleared, attempts, bestChain });
            const status = cleared ? `cleared in ${attempts}` : `failed (best: ${bestChain})`;
            console.log(`  L${String(level + 1).padStart(2)}: ${status}`);
        }

        const l1Cleared = levelResults[0]?.cleared;
        gate(6, `L1 cleared by optimal player`, l1Cleared === true);

        const l6Cleared = levelResults[5]?.cleared;
        gate(7, `L6 cleared by optimal player`, l6Cleared === true);

        const clearedCount = levelResults.filter(r => r.cleared).length;
        gate(8, `At least 6 levels cleared (${clearedCount}/12)`, clearedCount >= 6);

        const l1Attempts = levelResults[0]?.attempts || 999;
        gate(9, `L1 cleared in ${l1Attempts} attempts (<=3)`, l1Attempts <= 3);

        await context.close();
    }

    // --- Test 4: Edge cases ---
    console.log('\n━━━ Test 4: Edge Cases ━━━\n');
    {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        await page.evaluate(() => handleTap(W / 2, H / 2)); // start
        await page.waitForTimeout(200);

        // Corner tap
        await page.evaluate(() => handleTap(2, 2));
        const cornerState = await waitForResolve(page);
        gate(10, `Corner tap resolves: "${cornerState}" (not "resolving")`,
            cornerState !== 'resolving');

        // Canvas has content
        const hasUI = await page.evaluate(() => {
            const cvs = document.getElementById('game');
            const ctx = cvs.getContext('2d');
            const data = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
            // Check if any non-zero pixel exists
            for (let i = 0; i < data.length; i += 40) {
                if (data[i] > 5 || data[i+1] > 5 || data[i+2] > 5) return true;
            }
            return false;
        });
        gate(11, `Canvas has content`, hasUI);

        // No JS errors
        gate(12, `No JS errors: ${errors.length}`, errors.length === 0);

        await context.close();
    }

    // --- Summary ---
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  GAMEPLAY SUMMARY                                   ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    const passed = gates.filter(g => g.pass).length;
    const failed = gates.filter(g => !g.pass).length;
    console.log(`  PASS: ${passed}  FAIL: ${failed}  Total: ${gates.length}`);
    if (failed > 0) {
        console.log('\n  Failed:');
        gates.filter(g => !g.pass).forEach(g => console.log(`    ✗ G${g.num}: ${g.desc}`));
    }

    await browser.close();
    process.exit(failed === 0 ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
