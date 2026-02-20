#!/usr/bin/env node
'use strict';
// =========================================================================
// CHAIN REACTION — Screenshot Checkpoints (Phase 3)
// Playwright: captures game at key moments across 3 viewports
// =========================================================================

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
    { name: 'phone',   width: 390,  height: 844  },
    { name: 'tablet',  width: 768,  height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
];

const screenshotDir = path.resolve(__dirname, 'screenshots');

async function captureAt(page, name, viewport) {
    const filepath = path.join(screenshotDir, `${viewport}-${name}.png`);
    await page.screenshot({ path: filepath });
    console.log(`  📸 ${viewport}-${name}.png`);
    return filepath;
}

async function run() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  CHAIN REACTION — Screenshot Checkpoint Suite       ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const screenshots = [];

    // --- Capture 4 moments per viewport ---
    for (const vp of VIEWPORTS) {
        console.log(`\n━━━ ${vp.name} (${vp.width}x${vp.height}) ━━━\n`);

        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await context.newPage();
        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // 1. Start screen
        screenshots.push(await captureAt(page, '01-start', vp.name));
        await page.waitForTimeout(500);

        // Start game and go to L3 for interesting visuals
        await page.evaluate(() => {
            handleTap(W / 2, H / 2); // start
            currentLevel = 2; // L3
            startLevel();
        });
        await page.waitForTimeout(500);

        // 2. Idle state (dots drifting, pre-tap)
        screenshots.push(await captureAt(page, '02-idle', vp.name));

        // Find optimal tap
        const tapPos = await page.evaluate(() => {
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
            return { x: bestX, y: bestY };
        });

        // Tap and capture cascade progression
        await page.evaluate(({x, y}) => handleTap(x, y), tapPos);

        // 3. Mid-cascade (200ms)
        await page.waitForTimeout(200);
        screenshots.push(await captureAt(page, '03-mid-cascade', vp.name));

        // 4. Peak cascade (500ms)
        await page.waitForTimeout(300);
        screenshots.push(await captureAt(page, '04-peak-cascade', vp.name));

        await context.close();
    }

    // --- Special moments ---
    console.log('\n━━━ Special Moments ━━━\n');

    // 5. Level-clear celebration
    {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
        const page = await context.newPage();
        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        // L1 is easy to clear
        await page.evaluate(() => {
            handleTap(W / 2, H / 2);
            currentLevel = 0;
            startLevel();
        });
        await page.waitForTimeout(300);

        // Optimal tap for L1
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
        await page.waitForTimeout(4000);
        screenshots.push(await captureAt(page, '05-celebration', 'special'));
        await context.close();
    }

    // 6. Failure with near-miss highlights
    {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
        const page = await context.newPage();
        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        // L8 is hard — tap in a bad spot to guarantee failure
        await page.evaluate(() => {
            handleTap(W / 2, H / 2);
            currentLevel = 7; // L8
            startLevel();
        });
        await page.waitForTimeout(300);

        // Tap in corner for likely failure
        await page.evaluate(() => handleTap(50, 50));
        await page.waitForTimeout(5000);
        screenshots.push(await captureAt(page, '06-failure', 'special'));
        await context.close();
    }

    // 7. L12 dense field (60 dots)
    {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
        const page = await context.newPage();
        await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        await page.evaluate(() => {
            handleTap(W / 2, H / 2);
            currentLevel = 11; // L12
            startLevel();
        });
        await page.waitForTimeout(500);
        screenshots.push(await captureAt(page, '07-L12-dense', 'special'));

        // Also capture L12 cascade
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
        await page.waitForTimeout(400);
        screenshots.push(await captureAt(page, '08-L12-cascade', 'special'));
        await context.close();
    }

    console.log(`\n━━━ Summary ━━━`);
    console.log(`  Total screenshots: ${screenshots.length}`);
    console.log(`  Location: ${screenshotDir}/`);

    await browser.close();
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
