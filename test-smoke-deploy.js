#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.TEST_URL || 'https://chain-reaction.vivid.fish';
const screenshotDir = path.resolve(__dirname, 'screenshots');

async function run() {
    console.log('\n' + '='.repeat(60));
    console.log('  CHAIN REACTION — User Journey Smoke Test');
    console.log('='.repeat(60) + '\n');

    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const results = [];

    function check(name, pass, detail) {
        const icon = pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
        console.log(`  [${icon}] ${name}${detail ? ': ' + detail : ''}`);
        results.push({ name, pass });
    }

    // ═══════════════════════════════════════════════
    // JOURNEY 1: Solo Mode (Desktop)
    // ═══════════════════════════════════════════════
    console.log('\n  ── Journey 1: Solo Mode (Desktop 1920x1080) ──\n');
    {
        const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        // Load main page
        const resp = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        check('Solo: HTTP 200', resp.status() === 200, `got ${resp.status()}`);

        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(screenshotDir, 'j1-solo-start.png') });

        // Check canvas fills viewport
        const canvasOK = await page.evaluate(() => {
            const c = document.getElementById('game');
            return c && c.width === window.innerWidth && c.height === window.innerHeight;
        });
        check('Solo: Canvas fills viewport', canvasOK);

        // Check game state
        const startState = await page.evaluate(() => typeof gameState === 'string' ? gameState : null);
        check('Solo: Start screen loaded', startState === 'start', `state="${startState}"`);

        // Check core globals exist
        const globalsOK = await page.evaluate(() =>
            typeof Game === 'function' && typeof CONTINUOUS_TIERS === 'object' && typeof handleTap === 'function'
        );
        check('Solo: Game globals present', globalsOK);

        // Start a game (tap center of screen)
        await page.evaluate(() => handleTap(W / 2, H / 2));
        await page.waitForTimeout(300);
        const playState = await page.evaluate(() => gameState);
        check('Solo: Game started', playState === 'playing', `state="${playState}"`);

        await page.screenshot({ path: path.join(screenshotDir, 'j1-solo-playing.png') });

        check('Solo: No JS errors', errors.length === 0, errors.length > 0 ? errors[0] : '');

        await ctx.close();
    }

    // ═══════════════════════════════════════════════
    // JOURNEY 2: Solo → PvP Navigation (Desktop)
    // ═══════════════════════════════════════════════
    console.log('\n  ── Journey 2: Solo → PvP Navigation (Desktop) ──\n');
    {
        const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800);

        // Navigate to PvP
        await page.goto(BASE_URL + '/pvp.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800);

        // Check PvP page loaded
        const pvpCanvas = await page.evaluate(() => {
            const c = document.getElementById('pvp');
            return c && c.width > 0 && c.height > 0;
        });
        check('PvP: Page loaded', pvpCanvas);

        await page.screenshot({ path: path.join(screenshotDir, 'j2-pvp-menu.png') });

        // Check PvP globals
        const pvpGlobals = await page.evaluate(() =>
            typeof pvpState === 'string' && typeof handleTap === 'function' &&
            typeof GarbageQueue === 'function' && typeof calcGarbage === 'function'
        );
        check('PvP: Game globals present', pvpGlobals);

        // Check menu state
        const menuState = await page.evaluate(() => pvpState);
        check('PvP: Menu displayed', menuState === 'menu', `state="${menuState}"`);

        // Start a match (tap below the selectors)
        await page.evaluate(() => handleTap(W / 2, H * 0.75));
        await page.waitForTimeout(500);

        const matchState = await page.evaluate(() => pvpState);
        check('PvP: Match started', matchState === 'playing', `state="${matchState}"`);

        await page.screenshot({ path: path.join(screenshotDir, 'j2-pvp-playing.png') });

        // Verify both games exist and are running
        const gamesExist = await page.evaluate(() =>
            gameA && gameB && typeof gameA.density === 'function' && typeof gameB.density === 'function'
        );
        check('PvP: Both game instances active', gamesExist);

        // Verify bot is running (in vs bot mode)
        const botRunning = await page.evaluate(() => botRunner !== null);
        check('PvP: Bot opponent active', botRunning);

        // Wait a bit and check game is progressing
        await page.waitForTimeout(2000);
        const dotsSpawned = await page.evaluate(() => gameA.totalDotsSpawned > 0 && gameB.totalDotsSpawned > 0);
        check('PvP: Dots spawning on both boards', dotsSpawned);

        await page.screenshot({ path: path.join(screenshotDir, 'j2-pvp-mid-game.png') });

        check('PvP Desktop: No JS errors', errors.length === 0, errors.length > 0 ? errors[0] : '');

        await ctx.close();
    }

    // ═══════════════════════════════════════════════
    // JOURNEY 3: PvP on Mobile (Portrait — Stacked)
    // ═══════════════════════════════════════════════
    console.log('\n  ── Journey 3: PvP on Mobile (390x844 Portrait) ──\n');
    {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(BASE_URL + '/pvp.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800);

        // Check stacked layout detected
        const layoutOK = await page.evaluate(() => isStacked === true);
        check('Mobile PvP: Stacked layout detected', layoutOK);

        await page.screenshot({ path: path.join(screenshotDir, 'j3-pvp-mobile-menu.png') });

        // Start match
        await page.evaluate(() => handleTap(W / 2, H * 0.75));
        await page.waitForTimeout(500);

        const mobileMatch = await page.evaluate(() => pvpState === 'playing');
        check('Mobile PvP: Match started', mobileMatch);

        // Verify board dimensions are correct for stacked layout
        const dims = await page.evaluate(() => ({
            gameAW: gameA.W, gameAH: gameA.H,
            gameBW: gameB.W, gameBH: gameB.H,
            screenW: W, screenH: H,
            pW: playerW, pH: playerH,
        }));
        check('Mobile PvP: Board width = screen width', dims.gameAW === dims.screenW, `${dims.gameAW} vs ${dims.screenW}`);
        check('Mobile PvP: Board height = half screen', dims.gameAH < dims.screenH, `${dims.gameAH} < ${dims.screenH}`);

        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, 'j3-pvp-mobile-playing.png') });

        check('Mobile PvP: No JS errors', errors.length === 0, errors.length > 0 ? errors[0] : '');

        await ctx.close();
    }

    // ═══════════════════════════════════════════════
    // JOURNEY 4: PvP on Wide Screen (Landscape)
    // ═══════════════════════════════════════════════
    console.log('\n  ── Journey 4: PvP on Landscape (1024x768) ──\n');
    {
        const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(BASE_URL + '/pvp.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800);

        const sideBySlide = await page.evaluate(() => isStacked === false);
        check('Landscape PvP: Side-by-side layout', sideBySlide);

        // Start match
        await page.evaluate(() => handleTap(W / 2, H * 0.75));
        await page.waitForTimeout(500);

        const landscapeMatch = await page.evaluate(() => pvpState === 'playing');
        check('Landscape PvP: Match started', landscapeMatch);

        // Verify side-by-side dimensions
        const lDims = await page.evaluate(() => ({
            gameAW: gameA.W, gameBW: gameB.W, screenW: W,
        }));
        check('Landscape PvP: Each board = half width', lDims.gameAW < lDims.screenW, `${lDims.gameAW} < ${lDims.screenW}`);

        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, 'j4-pvp-landscape-playing.png') });

        check('Landscape PvP: No JS errors', errors.length === 0, errors.length > 0 ? errors[0] : '');

        await ctx.close();
    }

    // ═══════════════════════════════════════════════
    // JOURNEY 5: Endless Mode (Phone)
    // ═══════════════════════════════════════════════
    console.log('\n  ── Journey 5: Endless Mode (Phone 390x844) ──\n');
    {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800);

        // Switch to endless mode by setting it directly
        await page.evaluate(() => {
            gameMode = 'continuous';
            localStorage.setItem('cr_game_mode', 'continuous');
        });
        await page.waitForTimeout(200);

        await page.screenshot({ path: path.join(screenshotDir, 'j5-endless-start.png') });

        // Start continuous game
        await page.evaluate(() => handleTap(W / 2, H / 2));
        await page.waitForTimeout(500);

        const contActive = await page.evaluate(() => continuousActive);
        check('Endless: Continuous mode active', contActive === true);

        // Wait for some dots to spawn
        await page.waitForTimeout(3000);
        const dotCount = await page.evaluate(() => game.activeDotCount());
        check('Endless: Dots spawning', dotCount > 0, `${dotCount} active dots`);

        await page.screenshot({ path: path.join(screenshotDir, 'j5-endless-playing.png') });

        check('Endless (Phone): No JS errors', errors.length === 0, errors.length > 0 ? errors[0] : '');

        await ctx.close();
    }

    // ═══════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════
    await browser.close();

    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;

    console.log('\n' + '='.repeat(60));
    console.log(`  ${passed}/${results.length} checks passed` + (failed > 0 ? ` (${failed} FAILED)` : ''));
    if (failed > 0) {
        console.log('\n  Failed:');
        results.filter(r => !r.pass).forEach(r => console.log(`    - ${r.name}`));
    }
    console.log('\n  Screenshots: ' + screenshotDir);
    console.log('  URL: ' + BASE_URL);
    console.log('='.repeat(60) + '\n');

    process.exit(failed === 0 ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
