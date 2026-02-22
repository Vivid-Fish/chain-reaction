'use strict';

// =========================================================================
// CHAIN REACTION — Spectator Bot (Browser IO)
//
// Thin wrapper: creates a BotRunner from game-core.js and feeds taps
// to handleTap(). The bot logic itself is 100% shared with headless sim.
//
// Depends on: game-core.js (BotRunner, BOT_PROFILES)
//             game.js (game, gameState, handleTap, etc.)
//             ui.js (uiButtons)
// =========================================================================

// Spectator mode state
const urlParams = new URLSearchParams(window.location.search);
let spectatorMode = urlParams.has('watch');
let botSkillLevel = null; // null = match tier, or 'CALM'|'FLOW'|'SURGE'|'TRANSCENDENCE'|'IMPOSSIBLE'
const BOT_SKILL_NAMES = { CALM: 'Dumb', FLOW: 'Average', SURGE: 'Good', TRANSCENDENCE: 'Pro', IMPOSSIBLE: 'Inhuman' };
const BOT_SKILL_ORDER = ['CALM', 'FLOW', 'SURGE', 'TRANSCENDENCE', 'IMPOSSIBLE'];

// BotRunner instance — created/updated lazily
let botRunner = null;
let botRunnerSkill = null;

function getOrUpdateRunner() {
    const skillKey = botSkillLevel || (continuousActive ? selectedTier : 'FLOW');
    if (!botRunner || botRunnerSkill !== skillKey) {
        botRunner = new BotRunner(game, skillKey);
        botRunnerSkill = skillKey;
    }
    return botRunner;
}

let lastBotFrame = 0;

function updateBot(now) {
    if (!spectatorMode) return;

    // Auto-advance through menus
    if (gameState === 'start') { handleTap(W / 2, H / 2); return; }
    if (gameState === 'gameover' && gameOverTimer > 0.8) { handleTap(W / 2, H / 2); return; }
    if (continuousActive && overflowBloomPhase === 'summary') { handleTap(W / 2, H / 2); return; }
    if (gameState !== 'playing') return;

    // BotRunner.update(dt) — identical to headless sim
    const dt = lastBotFrame ? now - lastBotFrame : 16.67;
    lastBotFrame = now;

    const runner = getOrUpdateRunner();
    const tap = runner.update(Math.min(dt, 50));
    if (tap) handleTap(tap.x, tap.y);
}

function drawBotOverlay(ctx) {
    const s = Math.max(1, Math.min(W, H) / 600);

    // Crosshair on bot target
    const runner = botRunner;
    if (spectatorMode && runner && runner.target && gameState === 'playing') {
        const pulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4 * pulse;
        ctx.strokeStyle = 'rgba(255, 255, 100, 1)';
        ctx.lineWidth = 1.5;
        const cr = 15 * s;
        ctx.beginPath(); ctx.moveTo(runner.target.x - cr, runner.target.y); ctx.lineTo(runner.target.x + cr, runner.target.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(runner.target.x, runner.target.y - cr); ctx.lineTo(runner.target.x, runner.target.y + cr); ctx.stroke();
        ctx.globalAlpha = 0.15 * pulse;
        ctx.beginPath(); ctx.arc(runner.target.x, runner.target.y, explosionRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    // BOT pill + skill selector
    if (gameState === 'playing' || gameState === 'resolving') {
        const bx = 8 * s, by = 8 * s;
        const bw = spectatorMode ? 52 * s : 36 * s;
        const bh = 22 * s;
        const br = bh / 2;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, br);
        ctx.fillStyle = spectatorMode ? 'rgba(255, 255, 100, 0.12)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fill();
        ctx.strokeStyle = spectatorMode ? 'rgba(255, 255, 100, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.5; ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `600 ${8 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = spectatorMode ? 'rgba(255, 255, 100, 0.5)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fillText('BOT', bx + bw / 2, by + bh / 2);
        if (spectatorMode) {
            ctx.beginPath(); ctx.arc(bx + bw - 8 * s, by + bh / 2, 3 * s, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 255, 100, 0.6)'; ctx.fill();
        }
        uiButtons.push({ id: 'watch', x: bx, y: by, w: bw, h: bh });

        // Bot skill pill (tappable during gameplay)
        if (spectatorMode) {
            const sx = bx + bw + 6 * s, sy = by;
            const skillName = botSkillLevel ? BOT_SKILL_NAMES[botSkillLevel] : 'Auto';
            ctx.font = `400 ${7 * s | 0}px Inter, system-ui, sans-serif`;
            const sw = Math.max(44 * s, ctx.measureText(skillName).width + 16 * s);
            ctx.beginPath(); ctx.roundRect(sx, sy, sw, bh, br);
            ctx.fillStyle = 'rgba(255, 255, 100, 0.08)'; ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 100, 0.15)'; ctx.lineWidth = 0.5; ctx.stroke();
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
            ctx.fillText(skillName, sx + sw / 2, sy + bh / 2);
            uiButtons.push({ id: 'bot_skill', x: sx, y: sy, w: sw, h: bh });
        }
    }
}

// =====================================================================
// BOOT (last file loaded — all globals from game-core, engine, audio,
//       game, ui are available)
// =====================================================================

initAmbient();
initGame();
if (spectatorMode) audio.init();
loop();
