#!/usr/bin/env node
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
    const dir = path.resolve(__dirname, 'screenshots/v4b');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const browser = await chromium.launch({ headless: true });

    // Phone viewport
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(dir, '01-start.png') });

    // Start game
    await page.evaluate(() => handleTap(W / 2, H / 2));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(dir, '02-playing-r1.png') });

    // Wait for dots to drift, then screenshot connections
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '03-connections.png') });

    // Optimal tap
    await page.evaluate(() => {
        let bestX = W/2, bestY = H/2, bestCount = 0;
        for (let gx = 0; gx < 25; gx++) {
            for (let gy = 0; gy < 25; gy++) {
                const x = (gx + 0.5) * W / 25;
                const y = (gy + 0.5) * H / 25;
                let count = 0;
                for (const d of dots) {
                    if (d.active && Math.hypot(d.x - x, d.y - y) <= explosionRadius) count++;
                }
                if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
            }
        }
        handleTap(bestX, bestY);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(dir, '04-cascade-start.png') });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(dir, '05-cascade-peak.png') });

    // Wait for resolve
    try {
        await page.waitForFunction(() => gameState !== 'resolving', { timeout: 15000 });
    } catch {}
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dir, '06-after-resolve.png') });

    // Try to get to R3+ for more dots / connections
    for (let attempt = 0; attempt < 5; attempt++) {
        const state = await page.evaluate(() => gameState);
        if (state === 'gameover') break;
        if (state !== 'playing') {
            await page.waitForTimeout(500);
            continue;
        }
        await page.waitForTimeout(1500); // let dots spread
        await page.evaluate(() => {
            let bestX = W/2, bestY = H/2, bestCount = 0;
            for (let gx = 0; gx < 25; gx++) {
                for (let gy = 0; gy < 25; gy++) {
                    const x = (gx + 0.5) * W / 25;
                    const y = (gy + 0.5) * H / 25;
                    let count = 0;
                    for (const d of dots) {
                        if (d.active && Math.hypot(d.x - x, d.y - y) <= explosionRadius) count++;
                    }
                    if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
                }
            }
            handleTap(bestX, bestY);
        });
        try {
            await page.waitForFunction(() => gameState !== 'resolving', { timeout: 15000 });
        } catch {}
        await page.waitForTimeout(500);
    }

    // Final state
    const finalState = await page.evaluate(() => ({ state: gameState, round, chainCount }));
    await page.screenshot({ path: path.join(dir, '07-later-round.png') });

    // Desktop viewport
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page2 = await ctx2.newPage();
    await page2.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
    await page2.waitForTimeout(600);
    await page2.evaluate(() => handleTap(W / 2, H / 2));
    await page2.waitForTimeout(2000);
    await page2.screenshot({ path: path.join(dir, '08-desktop-connections.png') });

    // Desktop optimal tap
    await page2.evaluate(() => {
        let bestX = W/2, bestY = H/2, bestCount = 0;
        for (let gx = 0; gx < 25; gx++) {
            for (let gy = 0; gy < 25; gy++) {
                const x = (gx + 0.5) * W / 25;
                const y = (gy + 0.5) * H / 25;
                let count = 0;
                for (const d of dots) {
                    if (d.active && Math.hypot(d.x - x, d.y - y) <= explosionRadius) count++;
                }
                if (count > bestCount) { bestCount = count; bestX = x; bestY = y; }
            }
        }
        handleTap(bestX, bestY);
    });
    await page2.waitForTimeout(500);
    await page2.screenshot({ path: path.join(dir, '09-desktop-cascade.png') });

    console.log(`Final state: ${JSON.stringify(finalState)}`);
    console.log(`JS errors: ${errors.length}${errors.length ? '\n  ' + errors.join('\n  ') : ''}`);

    await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
