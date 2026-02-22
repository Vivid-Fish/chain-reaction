'use strict';

// =========================================================================
// CHAIN REACTION — Spectator Bot
//
// Auto-play using game-core Bots. Each skill level maps to a different
// bot strategy (random, humanSim, greedy) + humanization (delay, jitter).
//
// CRITICAL FIX: Previously all skill levels used the same greedy grid
// search — "Dumb" bot survived IMPOSSIBLE indefinitely. Now CALM→random,
// FLOW→humanSim, SURGE+→greedy, matching the headless sim calibration.
//
// Depends on: game-core.js (Bots), game.js (game, gameState, handleTap, etc.)
// =========================================================================

// Spectator mode state
const urlParams = new URLSearchParams(window.location.search);
let spectatorMode = urlParams.has('watch');
let botSkillLevel = null; // null = match tier, or 'CALM'|'FLOW'|'SURGE'|'TRANSCENDENCE'|'IMPOSSIBLE'
const BOT_SKILL_NAMES = { CALM: 'Dumb', FLOW: 'Average', SURGE: 'Good', TRANSCENDENCE: 'Pro', IMPOSSIBLE: 'Inhuman' };
const BOT_SKILL_ORDER = ['CALM', 'FLOW', 'SURGE', 'TRANSCENDENCE', 'IMPOSSIBLE'];

let botTarget = null;
let botThinkTimer = 0;
let botLastScan = 0;

// Bot strategy + humanization per skill level.
// Uses game-core Bots for strategy — same code as headless sim.
const BOT_MAP = {
    CALM:          { bot: 'random',   scanInterval: 800,  delay: 1200, jitter: 40 },
    FLOW:          { bot: 'humanSim', scanInterval: 400,  delay: 600,  jitter: 20 },
    SURGE:         { bot: 'greedy',   scanInterval: 200,  delay: 300,  jitter: 10 },
    TRANSCENDENCE: { bot: 'greedy',   scanInterval: 100,  delay: 150,  jitter: 5 },
    IMPOSSIBLE:    { bot: 'greedy',   scanInterval: 50,   delay: 80,   jitter: 2 },
};

function updateBot(now) {
    if (!spectatorMode) return;
    if (gameState === 'start') { handleTap(W / 2, H / 2); return; }
    if (gameState === 'gameover' && gameOverTimer > 0.8) { handleTap(W / 2, H / 2); return; }
    if (continuousActive && overflowBloomPhase === 'summary') { handleTap(W / 2, H / 2); return; }
    if (gameState !== 'playing') return;

    // Use bot skill level if set, otherwise match tier in continuous mode
    const skillKey = botSkillLevel || (continuousActive ? selectedTier : 'FLOW');
    const profile = BOT_MAP[skillKey] || BOT_MAP.FLOW;

    // In continuous mode, respect tap cooldown
    if (continuousActive && !game.canTap()) return;

    // Scan phase: ask game-core bot for next action
    if (!botTarget && now - botLastScan > profile.scanInterval) {
        botLastScan = now;
        const decision = Bots[profile.bot](game);
        if (decision.action === 'tap') {
            botTarget = {
                x: decision.x + (Math.random() - 0.5) * profile.jitter,
                y: decision.y + (Math.random() - 0.5) * profile.jitter,
            };
            botThinkTimer = profile.delay + Math.random() * (profile.delay * 0.3);
        }
    }

    // Execute phase: tap after reaction delay
    if (botTarget) {
        botThinkTimer -= 16.67;
        if (botThinkTimer <= 0) {
            // Re-evaluate with fresh game state
            const decision = Bots[profile.bot](game);
            if (decision.action === 'tap') {
                const jit = profile.jitter * 0.5;
                handleTap(
                    decision.x + (Math.random() - 0.5) * jit,
                    decision.y + (Math.random() - 0.5) * jit
                );
            }
            botTarget = null;
            botLastScan = now;
        }
    }
}

function drawBotOverlay(ctx) {
    const s = Math.max(1, Math.min(W, H) / 600);

    // Crosshair on bot target
    if (spectatorMode && botTarget && gameState === 'playing') {
        const pulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4 * pulse;
        ctx.strokeStyle = 'rgba(255, 255, 100, 1)';
        ctx.lineWidth = 1.5;
        const cr = 15 * s;
        ctx.beginPath(); ctx.moveTo(botTarget.x - cr, botTarget.y); ctx.lineTo(botTarget.x + cr, botTarget.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(botTarget.x, botTarget.y - cr); ctx.lineTo(botTarget.x, botTarget.y + cr); ctx.stroke();
        ctx.globalAlpha = 0.15 * pulse;
        ctx.beginPath(); ctx.arc(botTarget.x, botTarget.y, explosionRadius, 0, Math.PI * 2); ctx.stroke();
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
