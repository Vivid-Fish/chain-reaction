'use strict';

// =========================================================================
// CHAIN REACTION — UI Layer
//
// All rendering (HUD, start screens, game over, settings), input handling
// (pointer + keyboard), and the game loop (requestAnimationFrame).
//
// Loaded after: game-core.js, engine.js, audio.js, game.js
// Loaded before: bot.js
// =========================================================================

// =====================================================================
// UI STATE
// =====================================================================

let uiButtons = [];

// Settings
let settingsOpen = false;
let settingsSlideProgress = 0;
let settingsDragging = false;
const settings = {
    volume: parseFloat(localStorage.getItem('cr_volume') || '0.6'),
    shake: localStorage.getItem('cr_shake') || 'FULL',
    particles: localStorage.getItem('cr_particles') || 'FULL',
    reducedMotion: localStorage.getItem('cr_reduced_motion') === 'true',
    highContrast: localStorage.getItem('cr_high_contrast') === 'true',
};

function applySettings() {
    if (audio.masterGain) audio.masterGain.gain.value = settings.volume;
    if (settings.reducedMotion || settings.shake === 'OFF') {
        shakeEnabled = false;
    } else {
        shakeEnabled = true;
        shakeMultiplier = settings.shake === 'GENTLE' ? 0.4 : 1.0;
    }
    particleMultiplier = (settings.reducedMotion || settings.particles === 'REDUCED') ? 0.3 : 1.0;
    localStorage.setItem('cr_volume', settings.volume);
    localStorage.setItem('cr_shake', settings.shake);
    localStorage.setItem('cr_particles', settings.particles);
    localStorage.setItem('cr_reduced_motion', settings.reducedMotion);
    localStorage.setItem('cr_high_contrast', settings.highContrast);
}
applySettings();

// =====================================================================
// DRAW — Main composite
// =====================================================================

function draw() {
    if (gameState === 'start') updateFlicker();
    else canvas.style.filter = '';
    engineDrawScene(ctx, game, gameState, supernovaActive);
    drawUI();
    drawSettingsIcon();
    if (settingsOpen && settingsSlideProgress < 1) {
        settingsSlideProgress = Math.min(1, settingsSlideProgress + 0.12);
    } else if (!settingsOpen && settingsSlideProgress > 0) {
        settingsSlideProgress = Math.max(0, settingsSlideProgress - 0.12);
    }
    drawSettingsPanel();
}

// =====================================================================
// HUD & SCREENS
// =====================================================================

function drawUI() {
    const params = getRoundParams(round);
    const screenMin = Math.min(W, H);
    const s = Math.max(1, screenMin / 600);

    if (gameState === 'start') { drawStartScreen(); return; }

    // Mode-specific HUD
    if (continuousActive) {
        if (overflowTriggered) {
            if (overflowBloomPhase !== 'summary') {
                drawContinuousHUD(s);
                if (overflowWhiteAlpha > 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${overflowWhiteAlpha})`;
                    ctx.fillRect(0, 0, W, H);
                }
            } else {
                drawContinuousSummary(s);
            }
        } else {
            drawContinuousHUD(s);
        }
    } else {

    // Round counter
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.font = `400 ${13 * s | 0}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.letterSpacing = '2px';
    ctx.fillText('ROUND', W/2, 14 * s);
    ctx.letterSpacing = '0px';

    ctx.font = `300 ${38 * s | 0}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(round, W/2, 28 * s);

    // Chain / target
    const infoY = 72 * s;
    if (gameState === 'resolving') {
        const targetMet = game.chainCount >= params.target;
        ctx.font = `700 ${14 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.save();
        ctx.shadowColor = targetMet ? 'rgba(255, 200, 60, 0.4)' : 'rgba(255,255,255,0.2)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = targetMet ? 'rgba(255, 220, 100, 0.95)' : 'rgba(255,255,255,0.7)';
        ctx.fillText(`${game.chainCount} / ${params.target}`, W/2, infoY);
        ctx.restore();

        if (game.currentMultiplier > 1) {
            const mp = multiplierPulse > 0 ? 1 + easeOutBack(multiplierPulse) * 0.4 : 1;
            const multSize = Math.round(22 * s * mp);
            const multHue = game.currentMultiplier >= 5 ? 300 : game.currentMultiplier >= 3 ? 15 : 50;
            ctx.save();
            ctx.shadowColor = `hsla(${multHue}, 90%, 60%, 0.6)`;
            ctx.shadowBlur = 12 * s;
            ctx.font = `900 ${multSize}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `hsl(${multHue}, 90%, 70%)`;
            ctx.fillText(`x${game.currentMultiplier}`, W/2, infoY + 22 * s);
            ctx.restore();
        }

        if (supernovaActive) {
            const tapY = infoY + (game.currentMultiplier > 1 ? 48 : 22) * s;
            ctx.font = `600 ${13 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.save();
            ctx.shadowColor = 'rgba(255, 200, 60, 0.4)';
            ctx.shadowBlur = 8;
            ctx.fillStyle = 'rgba(255, 200, 60, 0.85)';
            if (supernovaTapsRemaining > 0) {
                ctx.fillText(`${supernovaTapsRemaining} tap${supernovaTapsRemaining !== 1 ? 's' : ''} left`, W/2, tapY);
            }
            ctx.restore();
        }
    } else if (gameState === 'playing') {
        ctx.font = `400 ${13 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`Target: ${params.target}`, W/2, infoY);

        if (supernovaActive) {
            ctx.font = `600 ${13 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.save();
            ctx.shadowColor = 'rgba(255, 200, 60, 0.4)';
            ctx.shadowBlur = 8;
            ctx.fillStyle = 'rgba(255, 200, 60, 0.85)';
            ctx.fillText(`SUPERNOVA — ${supernovaTapsRemaining} taps`, W/2, infoY + 18 * s);
            ctx.restore();
        } else if (mercyBonus > 0) {
            ctx.font = `300 ${10 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.fillText(`+${Math.round(mercyBonus * 100)}% reach`, W/2, infoY + 18 * s);
        }
    }

    // Supernova charge meter
    if (!supernovaActive && supernovaCharge > 0 && (gameState === 'playing' || gameState === 'resolving')) {
        const meterY = 68 * s;
        const segW = 8 * s;
        const segH = 3 * s;
        const gap = 3 * s;
        const totalW = SUPERNOVA_CHARGE_NEEDED * segW + (SUPERNOVA_CHARGE_NEEDED - 1) * gap;
        const mx = W / 2 - totalW / 2;
        for (let i = 0; i < SUPERNOVA_CHARGE_NEEDED; i++) {
            const filled = i < supernovaCharge;
            ctx.fillStyle = filled ? 'rgba(255, 200, 60, 0.6)' : 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.roundRect(mx + i * (segW + gap), meterY, segW, segH, segH / 2);
            ctx.fill();
        }
    }

    if (gameState === 'gameover') drawGameOver();

    if (bestRound > 0 && gameState === 'playing') {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = `300 ${12 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText(`Best: Round ${bestRound}`, W/2, H - 12 * s);
    }

    } // end rounds-mode else block

    // --- Shared HUD elements (both modes) ---

    // Quit button
    if (gameState === 'playing' || gameState === 'resolving') {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.font = `200 ${10 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        const quitLabel = continuousActive ? '\u2715 ' + TIER_LABELS[selectedTier] : '\u2715 Menu';
        ctx.fillText(quitLabel, W - 12 * s, 16 * s);
        const qw = ctx.measureText(quitLabel).width + 16 * s;
        uiButtons.push({ id: 'quit_menu', x: W - 12 * s - qw, y: 8 * s, w: qw + 12 * s, h: 24 * s });
    }

    // Build info
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.font = `400 ${11 * s | 0}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(`${BUILD_VERSION}`, W - 8 * s, H - 6 * s);
}

// =====================================================================
// START SCREEN
// =====================================================================

function drawStartScreen() {
    uiButtons = [];

    // Animate swipe offsets
    if (Math.abs(modeSwipeOffset - modeSwipeTarget) > 1) {
        modeSwipeOffset += (modeSwipeTarget - modeSwipeOffset) * 0.15;
    } else { modeSwipeOffset = modeSwipeTarget; }
    if (Math.abs(tierSwipeOffset - tierSwipeTarget) > 1) {
        tierSwipeOffset += (tierSwipeTarget - tierSwipeOffset) * 0.15;
    } else { tierSwipeOffset = tierSwipeTarget; }

    const roundsX = gameMode === 'rounds' ? modeSwipeOffset : modeSwipeOffset - W;
    const contX = gameMode === 'rounds' ? modeSwipeOffset + W : modeSwipeOffset;

    ctx.save();
    if (Math.abs(roundsX) < W) drawRoundsStartPage(roundsX);
    if (Math.abs(contX) < W) drawContinuousStartPage(contX);
    ctx.restore();

    // Page indicator tabs
    const s = Math.max(1, Math.min(W, H) / 600);
    const indicatorY = H - 22 * s;
    const modeLabels = ['Rounds', 'Endless'];
    const activeIdx = gameMode === 'rounds' ? 0 : 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${10 * s | 0}px Inter, system-ui, sans-serif`;
    const tabGap = 60 * s;
    for (let i = 0; i < 2; i++) {
        const tx = W / 2 + (i - 0.5) * tabGap;
        const isActive = i === activeIdx;
        ctx.fillStyle = isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
        ctx.fillText(modeLabels[i], tx, indicatorY);
        if (isActive) {
            const tw = ctx.measureText(modeLabels[i]).width;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(tx - tw / 2, indicatorY + 8 * s, tw, 1.5);
        }
    }

    // Swipe hint
    if (sessionCount < 5 && modeSwipeOffset === 0) {
        const hintAlpha = 0.12 + 0.1 * Math.sin(performance.now() * 0.003);
        const bobX = 6 * Math.sin(performance.now() * 0.002);
        ctx.font = `300 ${11 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${hintAlpha})`;
        if (gameMode === 'continuous') {
            ctx.textAlign = 'left';
            ctx.fillText('\u2190 Rounds', 12 * s + bobX, H / 2);
        } else {
            ctx.textAlign = 'right';
            ctx.fillText('Endless \u2192', W - 12 * s + bobX, H / 2);
        }
    }
}

// Flickering light bulb: infrequent bursts of rapid on/off toggles
let _flickerBurst = null; // array of timestamps when state toggles
let _flickerIdx = 0;
let _flickerNext = 8000 + Math.random() * 12000;
let _flickerOn = false;

function _scheduleFlickerBurst(now) {
    // Build a burst: 2-4 very fast toggles with tiny gaps (16-50ms)
    const count = 2 + (Math.random() * 3 | 0);
    _flickerBurst = [now];
    let t = now;
    for (let i = 0; i < count; i++) {
        t += 16 + Math.random() * 34;
        _flickerBurst.push(t);
    }
    _flickerIdx = 0;
    _flickerOn = true;
}

function updateFlicker() {
    const now = performance.now();
    if (_flickerBurst) {
        // Walk through the burst timeline
        while (_flickerIdx < _flickerBurst.length - 1 && now >= _flickerBurst[_flickerIdx + 1]) {
            _flickerIdx++;
            _flickerOn = !_flickerOn;
        }
        canvas.style.filter = _flickerOn ? 'invert(1)' : '';
        // Burst finished
        if (_flickerIdx >= _flickerBurst.length - 1 && now >= _flickerBurst[_flickerBurst.length - 1] + 60) {
            _flickerBurst = null;
            _flickerOn = false;
            canvas.style.filter = '';
            _flickerNext = now + 10000 + Math.random() * 15000;
        }
    } else {
        canvas.style.filter = '';
        if (now > _flickerNext) _scheduleFlickerBurst(now);
    }
}

function drawTitle(cx, titleY) {
    const titleSize = Math.min(52, W * 0.10);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `300 ${titleSize}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = `${Math.max(1, titleSize * 0.06)}px`;

    ctx.shadowColor = 'rgba(120, 180, 255, 0.4)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.fillText('CHAIN REACTION', cx, titleY);
    ctx.shadowBlur = 60;
    ctx.shadowColor = 'rgba(100, 160, 255, 0.2)';
    ctx.fillText('CHAIN REACTION', cx, titleY);

    ctx.letterSpacing = '0px';
    ctx.restore();
}

function drawRoundsStartPage(offsetX) {
    const cx = W / 2 + offsetX;
    const titleSize = Math.min(52, W * 0.10);
    const subSize = Math.min(16, W * 0.038);
    const s = Math.max(1, Math.min(W, H) / 600);
    const titleY = H * 0.22;

    drawTitle(cx, titleY);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `400 ${subSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Tap to start a chain reaction.', cx, titleY + titleSize * 0.8);

    ctx.font = `200 ${Math.min(11, subSize * 0.7)}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = '3px';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('ROUNDS', cx, titleY + titleSize * 0.8 + subSize * 1.2);
    ctx.letterSpacing = '0px';

    let resumeBtnBottom = titleY + titleSize * 0.8 + subSize * 2.5;
    if (resumeCheckpoint && resumeCheckpoint.round > 1) {
        const resumeRect = drawPill(ctx, cx, resumeBtnBottom, `Resume Round ${resumeCheckpoint.round}`, true, 120);
        uiButtons.push({ id: 'resume', ...resumeRect });
        resumeBtnBottom += 36 * s;
    }

    const promptAlpha = 0.2 + 0.12 * Math.sin(performance.now() * 0.003);
    ctx.font = `400 ${Math.min(14, subSize * 0.85)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = `rgba(255,255,255,${promptAlpha + 0.1})`;
    ctx.fillText(resumeCheckpoint && resumeCheckpoint.round > 1 ? 'Tap anywhere for new game' : 'Tap anywhere to begin', cx, resumeBtnBottom);

    if (bestRound > 0) {
        ctx.font = `200 ${Math.min(13, subSize * 0.8)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText(`Best: Round ${bestRound}`, cx, resumeBtnBottom + subSize * 2);
    }

    // Leaderboard
    if (Math.abs(offsetX) < W * 0.5 && leaderboard && leaderboard.byScore && leaderboard.byScore.length > 0) {
        const lbY = H * 0.56;
        const rowH = 18 * s;
        ctx.font = `600 ${11 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.letterSpacing = '2px';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('LEADERBOARD', cx, lbY);
        ctx.letterSpacing = '0px';

        const entries = leaderboard.byScore.slice(0, 5);
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const ey = lbY + (i + 1) * rowH + 6 * s;
            const isMe = e.device_id === deviceId;
            ctx.font = `${isMe ? 600 : 300} ${10 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = isMe ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255,255,255,0.3)';
            const name = e.player_name || (e.is_bot ? 'Bot' : 'Anon');
            const label = `${i + 1}. ${name} — R${e.peak_round} — ${Number(e.total_score).toLocaleString()}`;
            ctx.fillText(label, cx, ey);
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = isMe ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.08)';
            ctx.fillRect(cx - tw/2, ey + 6 * s, tw, 1);
            uiButtons.push({ id: `leaderboard_${i}`, sessionId: e.id, x: cx - tw/2 - 10, y: ey - rowH/2, w: tw + 20, h: rowH });
        }
    }

    // Bottom buttons
    const btnY = H - 50 * s;
    if (spectatorMode) {
        const watchRect = drawPill(ctx, cx - 60 * s, btnY, 'Bot: ON', true, 42);
        uiButtons.push({ id: 'watch', ...watchRect });
        const skillName = botSkillLevel ? BOT_SKILL_NAMES[botSkillLevel] : 'Auto';
        const skillRect = drawPill(ctx, cx + 60 * s, btnY, `Skill: ${skillName}`, false, 55);
        uiButtons.push({ id: 'bot_skill', ...skillRect });
    } else {
        const watchRect = drawPill(ctx, cx - 55 * s, btnY, 'Watch Bot', false, 55);
        uiButtons.push({ id: 'watch', ...watchRect });
        const pvpRect = drawPill(ctx, cx + 55 * s, btnY, 'PvP', false, 0);
        uiButtons.push({ id: 'pvp', ...pvpRect });
    }
}

function drawContinuousStartPage(offsetX) {
    const cx = W / 2 + offsetX;
    const titleSize = Math.min(52, W * 0.10);
    const subSize = Math.min(16, W * 0.038);
    const s = Math.max(1, Math.min(W, H) / 600);
    const titleY = H * 0.22;

    drawTitle(cx, titleY);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `200 ${Math.min(11, subSize * 0.7)}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = '3px';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('ENDLESS', cx, titleY + titleSize * 0.8);
    ctx.letterSpacing = '0px';

    // Difficulty label
    const tierNameY = titleY + titleSize * 0.8 + subSize * 1.8;
    ctx.font = `300 ${Math.min(28, W * 0.06)}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = '4px';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(TIER_LABELS[selectedTier], cx, tierNameY);
    ctx.letterSpacing = '0px';

    ctx.font = `300 ${Math.min(13, subSize * 0.8)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(TIER_DESCRIPTIONS[selectedTier], cx, tierNameY + 28 * s);

    // Difficulty navigation hint
    const tierIdx = TIER_ORDER.indexOf(selectedTier);
    ctx.font = `200 ${9 * s}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    if (tierIdx > 0) ctx.fillText('\u25B2 ' + TIER_LABELS[TIER_ORDER[tierIdx - 1]], cx, tierNameY - 32 * s);
    if (tierIdx < TIER_ORDER.length - 1) ctx.fillText(TIER_LABELS[TIER_ORDER[tierIdx + 1]] + ' \u25BC', cx, tierNameY + 48 * s);

    // Tap prompt
    const promptAlpha = 0.2 + 0.12 * Math.sin(performance.now() * 0.003);
    ctx.font = `400 ${Math.min(14, subSize * 0.85)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = `rgba(255,255,255,${promptAlpha + 0.1})`;
    ctx.fillText('Tap anywhere to begin', cx, H * 0.55);

    if (contBestScore > 0) {
        ctx.font = `200 ${Math.min(13, subSize * 0.8)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText(`Best: ${contBestScore.toLocaleString()}`, cx, H * 0.55 + subSize * 2);
    }

    // Continuous leaderboard
    if (Math.abs(offsetX) < W * 0.5 && contLeaderboard && contLeaderboard.byScore && contLeaderboard.byScore.length > 0) {
        const lbY = H * 0.64;
        const rowH = 18 * s;
        ctx.font = `600 ${11 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.letterSpacing = '2px';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('LEADERBOARD', cx, lbY);
        ctx.letterSpacing = '0px';

        const entries = contLeaderboard.byScore.slice(0, 5);
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const ey = lbY + (i + 1) * rowH + 6 * s;
            const isMe = e.device_id === deviceId;
            ctx.font = `${isMe ? 600 : 300} ${10 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = isMe ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255,255,255,0.3)';
            const name = e.player_name || (e.is_bot ? 'Bot' : 'Anon');
            const dur = e.duration_ms ? `${Math.floor(e.duration_ms / 60000)}:${String(Math.floor((e.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--';
            const label = `${i + 1}. ${name} — ${dur} — ${Number(e.total_score).toLocaleString()}`;
            ctx.fillText(label, cx, ey);
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = isMe ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.08)';
            ctx.fillRect(cx - tw/2, ey + 6 * s, tw, 1);
            uiButtons.push({ id: `cont_leaderboard_${i}`, sessionId: e.id, x: cx - tw/2 - 10, y: ey - rowH/2, w: tw + 20, h: rowH });
        }
    }

    // Bottom buttons
    const btnY = H - 50 * s;
    if (spectatorMode) {
        const watchRect = drawPill(ctx, cx - 60 * s, btnY, 'Bot: ON', true, 42);
        uiButtons.push({ id: 'watch', ...watchRect });
        const skillName = botSkillLevel ? BOT_SKILL_NAMES[botSkillLevel] : 'Auto';
        const skillRect = drawPill(ctx, cx + 60 * s, btnY, `Skill: ${skillName}`, false, 55);
        uiButtons.push({ id: 'bot_skill', ...skillRect });
    } else {
        const watchRect = drawPill(ctx, cx - 55 * s, btnY, 'Watch Bot', false, 55);
        uiButtons.push({ id: 'watch', ...watchRect });
        const pvpRect = drawPill(ctx, cx + 55 * s, btnY, 'PvP', false, 0);
        uiButtons.push({ id: 'pvp', ...pvpRect });
    }
}

// =====================================================================
// CONTINUOUS HUD
// =====================================================================

function drawContinuousHUD(s) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Score
    ctx.font = `700 ${32 * s | 0}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(game.score.toLocaleString(), W / 2, 16 * s);

    // Duration
    const mins = Math.floor(contDuration / 60000);
    const secs = Math.floor((contDuration % 60000) / 1000);
    ctx.font = `200 ${12 * s | 0}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W / 2, 50 * s);

    // Pressure bar
    if (currentTier) {
        const density = game.density();
        const barH = H * 0.3;
        const barW = 4 * s;
        const barX = 12 * s;
        const barY = H * 0.35;

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(barX, barY, barW, barH);

        const fillH = barH * Math.min(1, density);
        const densityHue = density >= 0.8 ? 0 : density >= 0.6 ? 30 : 200;
        const densityAlpha = density >= 0.8 ? 0.7 : 0.5;
        ctx.fillStyle = `hsla(${densityHue}, 70%, 60%, ${densityAlpha})`;
        ctx.fillRect(barX, barY + barH - fillH, barW, fillH);

        const dangerH = barH * 0.2;
        const dangerPulse = density >= 0.8 ? 0.08 + 0.06 * Math.sin(performance.now() * 0.006) : 0.03;
        ctx.fillStyle = `rgba(255, 60, 60, ${dangerPulse})`;
        ctx.fillRect(barX - 1, barY, barW + 2, dangerH);

        const critY = barY + dangerH;
        ctx.strokeStyle = `rgba(255, 80, 80, ${density >= 0.7 ? 0.5 : 0.2})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(barX - 2, critY); ctx.lineTo(barX + barW + 6, critY); ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `200 ${7 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${density >= 0.6 ? 0.35 : 0.15})`;
        ctx.translate(barX + barW / 2, barY + barH + 14 * s);
        ctx.fillText('pressure', 0, 0);
        ctx.restore();
    }

    // Momentum indicator
    if (game.momentum > 0) {
        const mx = W - 16 * s;
        const my = H * 0.35;
        const mh = H * 0.3;
        const mw = 4 * s;
        const mFill = Math.min(1, game.momentum / 10);

        // Background
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(mx - mw, my, mw, mh);

        // Fill (gold)
        const fillH = mh * mFill;
        const mPulse = game.momentum >= 5 ? 0.15 * Math.sin(performance.now() * 0.006) : 0;
        ctx.fillStyle = `hsla(45, 80%, ${55 + mPulse * 100}%, ${0.5 + mFill * 0.3})`;
        ctx.fillRect(mx - mw, my + mh - fillH, mw, fillH);

        // Label
        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `600 ${9 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,220,100,${0.4 + mFill * 0.4})`;
        ctx.translate(mx - mw / 2, my + mh + 14 * s);
        ctx.fillText(`x${game.momentum}`, 0, 0);
        ctx.restore();
    }

    // Tap-blocked indicator: screen edge glow
    // Shows during cooldown (continuous) or chain resolution (rounds)
    const tapBlocked = continuousActive
        ? (lastTapTime > 0 && currentTier && ((performance.now() - lastTapTime) < currentTier.cooldown))
        : (gameState === 'resolving');
    if (tapBlocked) {
        let progress = 1, hue = 200;
        if (continuousActive && currentTier) {
            progress = Math.min(1, (performance.now() - lastTapTime) / currentTier.cooldown);
            hue = progress > 0.8 ? 140 : 210;  // green when nearly ready
        } else {
            // Rounds: pulse gently while chain resolves
            progress = 0.5 + 0.2 * Math.sin(performance.now() * 0.004);
            hue = 30;  // warm amber for "chain active"
        }
        const edgeW = 20 * s;
        const alpha = (1 - progress) * 0.4 + 0.05;
        ctx.save();
        // Bottom edge glow
        const gBot = ctx.createLinearGradient(0, H, 0, H - edgeW);
        gBot.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha})`);
        gBot.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
        ctx.fillStyle = gBot;
        ctx.fillRect(0, H - edgeW, W * (continuousActive ? progress : 1), edgeW);
        // Left edge glow
        const gLeft = ctx.createLinearGradient(0, 0, edgeW, 0);
        gLeft.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha * 0.5})`);
        gLeft.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
        ctx.fillStyle = gLeft;
        ctx.fillRect(0, 0, edgeW, H);
        // Right edge glow
        const gRight = ctx.createLinearGradient(W, 0, W - edgeW, 0);
        gRight.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha * 0.5})`);
        gRight.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
        ctx.fillStyle = gRight;
        ctx.fillRect(W - edgeW, 0, edgeW, H);
        ctx.restore();
    }

    // Multiplier display
    if (gameState === 'resolving' && game.currentMultiplier > 1) {
        const mHue = game.currentMultiplier >= 5 ? 45 : game.currentMultiplier >= 3 ? 200 : 180;
        const mScale = 1 + multiplierPulse * 0.3;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `700 ${20 * s * mScale | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `hsla(${mHue}, 80%, 65%, 0.8)`;
        ctx.fillText(`x${game.currentMultiplier}`, W / 2, 72 * s);
    }

    // Overflow warning
    const overflowTimer = game._overflowStart >= 0 ? (game.time - game._overflowStart) : 0;
    if (overflowTimer > 0 && !overflowTriggered) {
        const pct = Math.min(1, overflowTimer / 10000);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        if (overflowTimer < 3000) {
            const a = 0.15 + 0.1 * Math.sin(performance.now() * 0.004);
            ctx.font = `300 ${12 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `rgba(255, 160, 80, ${a})`;
            ctx.fillText('clear some dots...', W / 2, H - 40 * s);
        } else if (overflowTimer < 7000) {
            const secsLeft = Math.ceil((10000 - overflowTimer) / 1000);
            const a = 0.3 + 0.2 * Math.sin(performance.now() * 0.008);
            ctx.font = `500 ${14 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `rgba(255, 100, 60, ${a})`;
            ctx.fillText(`overflowing in ${secsLeft}s`, W / 2, H - 40 * s);
        } else {
            const secsLeft = Math.ceil((10000 - overflowTimer) / 1000);
            const a = 0.5 + 0.4 * Math.sin(performance.now() * 0.015);
            const sz = 16 + 2 * Math.sin(performance.now() * 0.012);
            ctx.font = `700 ${sz * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `rgba(255, 60, 40, ${a})`;
            ctx.fillText(`${secsLeft}`, W / 2, H - 40 * s);
        }

        if (pct > 0.2) {
            const vigAlpha = (pct - 0.2) * 0.15;
            const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.3, W/2, H/2, Math.min(W,H) * 0.7);
            grad.addColorStop(0, 'rgba(255,0,0,0)');
            grad.addColorStop(1, `rgba(255,30,10,${vigAlpha})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // Build info
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.font = `400 ${11 * s | 0}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(`${BUILD_VERSION}`, W - 8 * s, H - 6 * s);
}

// =====================================================================
// CONTINUOUS SUMMARY
// =====================================================================

function drawContinuousSummary(s) {
    summaryTimer = Math.min(1, summaryTimer + 0.012);
    const t = easeOutCubic(summaryTimer);

    ctx.fillStyle = `rgba(0, 0, 0, ${t * 0.6})`;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const scaleT = easeOutBack(Math.min(t * 1.5, 1));
    ctx.font = `600 ${24 * s * scaleT | 0}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = `rgba(255,255,255,${t * 0.9})`;
    ctx.fillText('SESSION COMPLETE', W / 2, H * 0.22);

    ctx.font = `200 ${11 * s | 0}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = '3px';
    ctx.fillStyle = `rgba(255,255,255,${t * 0.3})`;
    ctx.fillText(TIER_LABELS[selectedTier], W / 2, H * 0.28);
    ctx.letterSpacing = '0px';

    if (t > 0.3) {
        const a = Math.min(1, (t - 0.3) * 3);
        ctx.font = `700 ${36 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${a * 0.95})`;
        ctx.fillText(game.score.toLocaleString(), W / 2, H * 0.38);

        const mins = Math.floor(contDuration / 60000);
        const secs = Math.floor((contDuration % 60000) / 1000);
        ctx.font = `300 ${14 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${a * 0.5})`;
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W / 2, H * 0.44);
    }

    if (t > 0.5) {
        const a = Math.min(1, (t - 0.5) * 3);
        const statY = H * 0.54;
        const gap = 22 * s;
        ctx.font = `300 ${11 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${a * 0.4})`;
        ctx.fillText(`Peak Epoch: ${EPOCHS[peakEpochIdx].name}`, W / 2, statY);
        ctx.fillText(`Longest Chain: ${peakChainLength}`, W / 2, statY + gap);
        ctx.fillText(`Total Taps: ${game.totalTaps}`, W / 2, statY + gap * 2);
        ctx.fillText(`Dots Caught: ${game.totalDotsCaught}`, W / 2, statY + gap * 3);

        if (game.score > contBestScore) {
            contBestScore = game.score;
            localStorage.setItem('cr_cont_bestScore', contBestScore);
            ctx.font = `600 ${13 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `rgba(255, 215, 0, ${a * 0.7})`;
            ctx.fillText('New Best!', W / 2, statY + gap * 4);
        }
    }

    if (t > 0.7) {
        const btnY = H * 0.82;
        const playRect = drawPill(ctx, W / 2 - 60 * s, btnY, 'Play Again', true, 200);
        uiButtons.push({ id: 'cont_play_again', ...playRect });
        const menuRect = drawPill(ctx, W / 2 + 60 * s, btnY, 'Menu', false, 0);
        uiButtons.push({ id: 'cont_menu', ...menuRect });
    }
}

// =====================================================================
// GAME OVER (rounds)
// =====================================================================

function drawGameOver() {
    const t = easeOutCubic(gameOverTimer);
    const s = Math.max(1, Math.min(W, H) / 600);

    ctx.fillStyle = `rgba(0, 0, 0, ${t * 0.55})`;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const scaleT = easeOutBack(Math.min(t * 1.5, 1));
    ctx.save();
    ctx.shadowColor = 'rgba(255, 140, 60, 0.35)';
    ctx.shadowBlur = 30 * s;
    ctx.font = `300 ${Math.round(48 * s * scaleT)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(`Round ${round}`, W/2, H/2 - 50 * s);
    ctx.restore();

    if (t > 0.3) {
        const t2 = easeOutCubic((t - 0.3) / 0.7);
        ctx.globalAlpha = t2;

        ctx.font = `300 ${18 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255, 160, 80, 0.85)';
        const params = getRoundParams(round);
        ctx.fillText(`Chain: ${game.chainCount} / ${params.target}`, W/2, H/2);

        if (game.chainCount < params.target && params.target > 0) {
            const ratio = game.chainCount / params.target;
            if (ratio >= 0.6) {
                const needed = params.target - game.chainCount;
                ctx.font = `400 ${12 * s | 0}px Inter, system-ui, sans-serif`;
                ctx.fillStyle = 'rgba(255, 210, 120, 0.65)';
                ctx.fillText(`${needed} more ${needed === 1 ? 'dot' : 'dots'} to clear — So close!`, W/2, H/2 + 16 * s);
            }
        }

        ctx.font = `300 ${15 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`Total Score: ${totalScore + game.score}`, W/2, H/2 + 34 * s);

        if (round >= bestRound) {
            ctx.font = `600 ${14 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.fillText('New Best!', W/2, H/2 + 58 * s);
        }

        const restartRound = Math.max(1, round - SETBACK_ROUNDS);
        if (restartRound > 1) {
            ctx.font = `300 ${12 * s | 0}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillText(`Restart from Round ${restartRound}`, W/2, H/2 + 72 * s);
        }
    }

    if (t > 0.6) {
        const t3 = (t - 0.6) / 0.4;
        const pa = t3 * (0.3 + 0.1 * Math.sin(performance.now() * 0.003));
        ctx.font = `300 ${14 * s | 0}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${pa})`;
        ctx.fillText('Tap to try again', W/2, H/2 + 100 * s);

        const btnY = H - 50 * s;
        const nameLabel = playerName ? `Name: ${playerName}` : 'Set Name';
        const nameRect = drawPill(ctx, W / 2 - 90 * s, btnY, nameLabel, !!playerName, 180);
        uiButtons.push({ id: 'setname', ...nameRect });

        const watchRect = drawPill(ctx, W / 2, btnY, spectatorMode ? 'Bot: ON' : 'Watch Bot', spectatorMode, 55);
        uiButtons.push({ id: 'watch', ...watchRect });

        if (lastSessionId) {
            const replayRect = drawPill(ctx, W / 2 + 90 * s, btnY, 'Watch Replay', false, 200);
            uiButtons.push({ id: 'viewreplay', ...replayRect });
        }
    }

    ctx.globalAlpha = 1;
}

// =====================================================================
// SETTINGS
// =====================================================================

function drawSettingsIcon() {
    if (gameState !== 'start' || settingsOpen) return;
    const s = Math.max(1, Math.min(W, H) / 600);
    const iconSize = 22 * s;
    const ix = W - 30 * s;
    const iy = 28 * s;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ix, iy, iconSize * 0.45, 0, Math.PI * 2); ctx.stroke();
    const lw = iconSize * 0.3;
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(ix - lw, iy + i * iconSize * 0.2);
        ctx.lineTo(ix + lw, iy + i * iconSize * 0.2);
        ctx.stroke();
    }
    ctx.restore();
    uiButtons.push({ id: 'settings', x: ix - iconSize/2, y: iy - iconSize/2, w: iconSize, h: iconSize });
}

function drawSettingsPanel() {
    if (settingsSlideProgress <= 0) return;
    const s = Math.max(1, Math.min(W, H) / 600);
    const panelW = Math.min(320 * s, W * 0.85);
    const slideX = W - panelW * settingsSlideProgress;

    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * settingsSlideProgress})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(8, 8, 24, 0.95)';
    ctx.fillRect(slideX, 0, panelW, H);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(slideX, 0); ctx.lineTo(slideX, H); ctx.stroke();

    const px = slideX + 24 * s;
    const pw = panelW - 48 * s;
    let py = 40 * s;
    const rowH = 52 * s;

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

    // Close button
    const closeSize = 20 * s;
    const closeX = slideX + panelW - 30 * s;
    const closeY = 28 * s;
    ctx.font = `300 ${16 * s}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('\u00D7', closeX, closeY);
    uiButtons.push({ id: 'settings_close', x: closeX - closeSize/2, y: closeY - closeSize/2, w: closeSize, h: closeSize });

    // Title
    ctx.textAlign = 'left';
    ctx.font = `600 ${13 * s}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = '2px';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('SETTINGS', px, py);
    ctx.letterSpacing = '0px';
    py += rowH * 0.8;

    // Volume slider
    ctx.font = `400 ${11 * s}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Volume', px, py);
    py += 20 * s;
    const trackX = px, trackW = pw, trackY = py;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(trackX, trackY - 2, trackW, 4);
    const fillW = trackW * settings.volume;
    ctx.fillStyle = 'rgba(120, 180, 255, 0.5)';
    ctx.fillRect(trackX, trackY - 2, fillW, 4);
    const handleX = trackX + fillW;
    ctx.beginPath(); ctx.arc(handleX, trackY, 8 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 180, 255, 0.9)'; ctx.fill();
    uiButtons.push({ id: 'volume_slider', x: trackX - 10, y: trackY - 20 * s, w: trackW + 20, h: 40 * s, trackX, trackW });
    py += rowH * 0.6;

    // Screen Shake
    py += 8 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Screen Shake', px, py);
    py += 22 * s;
    const shakeOpts = ['OFF', 'GENTLE', 'FULL'];
    const segW = Math.floor(pw / 3);
    for (let i = 0; i < 3; i++) {
        const sx = px + i * segW;
        const active = settings.shake === shakeOpts[i];
        ctx.fillStyle = active ? 'rgba(120, 180, 255, 0.25)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(sx, py - 12 * s, segW - 2, 24 * s);
        ctx.fillStyle = active ? 'rgba(120, 180, 255, 0.9)' : 'rgba(255,255,255,0.35)';
        ctx.font = `${active ? 600 : 400} ${9 * s}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(shakeOpts[i], sx + segW / 2, py);
        uiButtons.push({ id: `shake_${shakeOpts[i]}`, x: sx, y: py - 12 * s, w: segW - 2, h: 24 * s });
    }
    ctx.textAlign = 'left';
    py += rowH * 0.7;

    // Particles
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `400 ${11 * s}px Inter, system-ui, sans-serif`;
    ctx.fillText('Particles', px, py);
    py += 22 * s;
    const partOpts = ['REDUCED', 'FULL'];
    const partW = Math.floor(pw / 2);
    for (let i = 0; i < 2; i++) {
        const sx = px + i * partW;
        const active = settings.particles === partOpts[i];
        ctx.fillStyle = active ? 'rgba(120, 180, 255, 0.25)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(sx, py - 12 * s, partW - 2, 24 * s);
        ctx.fillStyle = active ? 'rgba(120, 180, 255, 0.9)' : 'rgba(255,255,255,0.35)';
        ctx.font = `${active ? 600 : 400} ${9 * s}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(partOpts[i], sx + partW / 2, py);
        uiButtons.push({ id: `particles_${partOpts[i]}`, x: sx, y: py - 12 * s, w: partW - 2, h: 24 * s });
    }
    ctx.textAlign = 'left';
    py += rowH * 0.8;

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(px, py, pw, 1);
    py += 16 * s;
    ctx.font = `600 ${10 * s}px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = '1px';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('ACCESSIBILITY', px, py);
    ctx.letterSpacing = '0px';
    py += 24 * s;

    drawToggle(px, py, pw, s, 'Reduced Motion', settings.reducedMotion, 'reduced_motion');
    py += rowH * 0.7;
    drawToggle(px, py, pw, s, 'High Contrast', settings.highContrast, 'high_contrast');
}

function drawToggle(px, py, pw, s, label, active, id) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `400 ${11 * s}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(label, px, py);
    const tw = 36 * s, th = 18 * s;
    const tx = px + pw - tw;
    const ty = py - th / 2;
    ctx.fillStyle = active ? 'rgba(120, 180, 255, 0.4)' : 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, th / 2); ctx.fill();
    const knobX = active ? tx + tw - th / 2 : tx + th / 2;
    ctx.beginPath(); ctx.arc(knobX, py, th * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = active ? 'rgba(120, 180, 255, 0.95)' : 'rgba(255,255,255,0.4)';
    ctx.fill();
    uiButtons.push({ id: `toggle_${id}`, x: tx - 10, y: ty - 5, w: tw + 20, h: th + 10 });
}

// =====================================================================
// INPUT
// =====================================================================

function hitTestButtons(x, y) {
    for (const btn of uiButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) return btn;
    }
    return null;
}

// Gesture state
let pointerStartX = 0, pointerStartY = 0, pointerStartTime = 0;
let pointerState = 'idle';
let swipeDirection = null;
const SWIPE_THRESHOLD_PX = 15;

function handleButtonHit(x, y) {
    const hitBtn = hitTestButtons(x, y);
    const hit = hitBtn ? hitBtn.id : null;
    if (!hit) return false;

    if (hit === 'settings') { settingsOpen = true; return true; }
    if (hit === 'settings_close') { settingsOpen = false; return true; }

    if (hit === 'volume_slider') return true;
    if (hit.startsWith('shake_')) { settings.shake = hit.split('_')[1]; applySettings(); return true; }
    if (hit.startsWith('particles_')) { settings.particles = hit.split('_')[1]; applySettings(); return true; }
    if (hit === 'toggle_reduced_motion') {
        settings.reducedMotion = !settings.reducedMotion;
        if (settings.reducedMotion) { settings.shake = 'OFF'; settings.particles = 'REDUCED'; }
        applySettings(); return true;
    }
    if (hit === 'toggle_high_contrast') { settings.highContrast = !settings.highContrast; applySettings(); return true; }

    if (hit === 'cont_play_again') {
        overflowTriggered = false;
        overflowBloomPhase = null;
        bgOverride = null;
        stopAllEpochAudio();
        startContinuous();
        return true;
    }
    if (hit === 'quit_menu' || hit === 'cont_menu') {
        if (continuousActive) {
            continuousActive = false;
            overflowTriggered = false;
            overflowBloomPhase = null;
            bgOverride = null;
            stopAllEpochAudio();
        }
        gameState = 'start';
        game = new Game(W, H, {}, Math.random);
        game._generateDots(10, 0.5, 1.0);
        return true;
    }
    if (hit === 'watch') {
        spectatorMode = !spectatorMode;
        if (spectatorMode) { botTarget = null; botLastScan = 0; }
        return true;
    }
    if (hit === 'bot_skill') {
        if (!botSkillLevel) {
            botSkillLevel = BOT_SKILL_ORDER[0];
        } else {
            const idx = BOT_SKILL_ORDER.indexOf(botSkillLevel);
            botSkillLevel = idx < BOT_SKILL_ORDER.length - 1 ? BOT_SKILL_ORDER[idx + 1] : null;
        }
        return true;
    }
    if (hit === 'pvp') { window.location.href = 'pvp.html'; return true; }
    if (hit === 'replay') { downloadReplay(); return true; }
    if (hit === 'resume' && resumeCheckpoint) {
        audio.init();
        round = resumeCheckpoint.round;
        totalScore = Number(resumeCheckpoint.total_score) || 0;
        consecutiveFails = resumeCheckpoint.consecutive_fails || 0;
        mercyBonus = resumeCheckpoint.mercy_bonus || 0;
        supernovaCharge = resumeCheckpoint.supernova_charge || 0;
        supernovaActive = false;
        supernovaTapsRemaining = 0;
        peakRound = round;
        lastSessionId = null;
        replayLog = [];
        replayStartTime = performance.now();
        game = new Game(W, H, {}, Math.random);
        startRound();
        return true;
    }
    if (hit === 'setname') {
        const name = prompt('Enter your name:', playerName || '');
        if (name !== null) {
            playerName = name.trim().slice(0, 20) || null;
            if (playerName) localStorage.setItem('cr_player_name', playerName);
            else localStorage.removeItem('cr_player_name');
        }
        return true;
    }
    if (hit === 'viewreplay' && lastSessionId) {
        window.open(`/replay/${lastSessionId}`, '_blank');
        return true;
    }
    if (hit && hit.startsWith('leaderboard_') && hitBtn.sessionId) {
        window.open(`/replay/${hitBtn.sessionId}`, '_blank');
        return true;
    }

    return false;
}

function dispatchSwipe(dir) {
    if (gameState !== 'start') return;

    if (dir === 'left' && gameMode === 'rounds') {
        gameMode = 'continuous';
        modeSwipeTarget = 0;
        modeSwipeOffset = W;
        localStorage.setItem('cr_game_mode', gameMode);
    } else if (dir === 'right' && gameMode === 'continuous') {
        gameMode = 'rounds';
        modeSwipeTarget = 0;
        modeSwipeOffset = -W;
        localStorage.setItem('cr_game_mode', gameMode);
    }

    if (gameMode === 'continuous') {
        const idx = TIER_ORDER.indexOf(selectedTier);
        if (dir === 'up' && idx < TIER_ORDER.length - 1) {
            selectedTier = TIER_ORDER[idx + 1];
            localStorage.setItem('cr_continuous_tier', selectedTier);
            API.fetchLeaderboard('continuous', selectedTier);
        } else if (dir === 'down' && idx > 0) {
            selectedTier = TIER_ORDER[idx - 1];
            localStorage.setItem('cr_continuous_tier', selectedTier);
            API.fetchLeaderboard('continuous', selectedTier);
        }
    }
}

canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    const x = e.clientX, y = e.clientY;

    if (settingsOpen) {
        const volBtn = uiButtons.find(b => b.id === 'volume_slider');
        if (volBtn && x >= volBtn.x && x <= volBtn.x + volBtn.w && y >= volBtn.y && y <= volBtn.y + volBtn.h) {
            settingsDragging = true;
            settings.volume = Math.max(0, Math.min(1, (x - volBtn.trackX) / volBtn.trackW));
            applySettings();
            return;
        }
        if (handleButtonHit(x, y)) return;
        const panelW = Math.min(320 * Math.max(1, Math.min(W, H) / 600), W * 0.85);
        if (x < W - panelW) { settingsOpen = false; return; }
        return;
    }

    if (gameState !== 'start') {
        if (handleButtonHit(x, y)) return;
        if (!spectatorMode) handleTap(x, y);
        return;
    }

    pointerStartX = x;
    pointerStartY = y;
    pointerStartTime = performance.now();
    pointerState = 'pending';
    swipeDirection = null;
});

canvas.addEventListener('pointermove', e => {
    if (settingsDragging) {
        const volBtn = uiButtons.find(b => b.id === 'volume_slider');
        if (volBtn) {
            settings.volume = Math.max(0, Math.min(1, (e.clientX - volBtn.trackX) / volBtn.trackW));
            applySettings();
        }
        return;
    }
    if (pointerState !== 'pending') return;
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    if (Math.hypot(dx, dy) > SWIPE_THRESHOLD_PX) {
        pointerState = 'swiping';
        swipeDirection = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up');
    }
});

canvas.addEventListener('pointerup', e => {
    if (settingsDragging) { settingsDragging = false; return; }
    const x = e.clientX, y = e.clientY;

    if (pointerState === 'swiping') {
        dispatchSwipe(swipeDirection);
        pointerState = 'idle';
        return;
    }
    if (pointerState === 'pending') {
        pointerState = 'idle';
        if (handleButtonHit(x, y)) return;
        if (!spectatorMode) handleTap(x, y);
        return;
    }
    pointerState = 'idle';
});

canvas.addEventListener('pointercancel', () => { pointerState = 'idle'; settingsDragging = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'W') {
        spectatorMode = !spectatorMode;
        if (spectatorMode) { botTarget = null; botLastScan = 0; }
    }
    if (e.key === 'r' || e.key === 'R') downloadReplay();
    if (e.key === 'Escape' && settingsOpen) settingsOpen = false;
});

// =====================================================================
// GAME LOOP
// =====================================================================

let _lastErrorTime = 0;
function _reportError(e) {
    const now = Date.now();
    if (now - _lastErrorTime < 5000) return;
    _lastErrorTime = now;
    console.error('Game loop error:', e);
    fetch('/api/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: e.message,
            stack: e.stack,
            state: { gameState, gameMode, continuousActive, overflowTriggered, overflowBloomPhase, selectedTier },
        }),
        keepalive: true,
    }).catch(() => {});
}

function loop() {
    try {
        const now = performance.now();
        uiButtons = [];
        updateBot(now);
        update();
        draw();
        drawBotOverlay(ctx);
    } catch (e) {
        _reportError(e);
    }
    requestAnimationFrame(loop);
}

// Boot sequence moved to bot.js (last file loaded, all deps satisfied)
