#!/usr/bin/env node
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'https://chain-reaction.apps.vivid.fish';
const screenshotDir = path.resolve(__dirname, 'screenshots');

async function run() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  CHAIN REACTION — Deployment Smoke Test             ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const gates = [];
    function gate(num, desc, pass) {
        const icon = pass ? '✓' : '✗';
        console.log(`  ${icon} S${num}: ${desc}`);
        gates.push({ num, desc, pass });
    }

    // Desktop viewport
    console.log('━━━ Desktop (1920x1080) ━━━\n');
    {
        const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        const response = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        gate(1, `HTTP ${response.status()} (expected 200)`, response.status() === 200);

        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, 'deploy-desktop-start.png') });
        console.log('  📸 deploy-desktop-start.png');

        // Verify game globals exist
        const hasGame = await page.evaluate(() => 
            typeof gameState === 'string' && typeof handleTap === 'function' && typeof LEVELS === 'object'
        );
        gate(2, `Game globals present`, hasGame);

        // Start and play
        await page.evaluate(() => handleTap(W / 2, H / 2));
        await page.waitForTimeout(200);

        const state = await page.evaluate(() => gameState);
        gate(3, `Game started: "${state}" (expected "playing")`, state === 'playing');

        // Tap optimally
        await page.evaluate(() => {
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
        });

        // Wait for resolve
        try {
            await page.waitForFunction(() => gameState !== 'resolving', { timeout: 15000 });
        } catch {}
        
        const endState = await page.evaluate(() => gameState);
        gate(4, `Level resolved: "${endState}"`, endState === 'celebrating' || endState === 'failed');

        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, 'deploy-desktop-result.png') });
        console.log('  📸 deploy-desktop-result.png');

        gate(5, `No JS errors: ${errors.length}`, errors.length === 0);

        await context.close();
    }

    // Phone viewport
    console.log('\n━━━ Phone (390x844) ━━━\n');
    {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(screenshotDir, 'deploy-phone-start.png') });
        console.log('  📸 deploy-phone-start.png');

        // Canvas fills viewport
        const canvasSize = await page.evaluate(() => {
            const cvs = document.getElementById('game');
            return { w: cvs.width, h: cvs.height, ww: window.innerWidth, wh: window.innerHeight };
        });
        gate(6, `Canvas fills viewport: ${canvasSize.w}x${canvasSize.h} vs ${canvasSize.ww}x${canvasSize.wh}`,
            canvasSize.w === canvasSize.ww && canvasSize.h === canvasSize.wh);

        gate(7, `No JS errors on phone: ${errors.length}`, errors.length === 0);

        await context.close();
    }

    // Summary
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  SMOKE TEST SUMMARY                                 ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    const passed = gates.filter(g => g.pass).length;
    const failed = gates.filter(g => !g.pass).length;
    console.log(`  PASS: ${passed}  FAIL: ${failed}  Total: ${gates.length}`);
    if (failed > 0) {
        console.log('\n  Failed:');
        gates.filter(g => !g.pass).forEach(g => console.log(`    ✗ S${g.num}: ${g.desc}`));
    }
    console.log(`\n  URL: ${URL}`);

    await browser.close();
    process.exit(failed === 0 ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
