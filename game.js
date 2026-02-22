'use strict';

// =========================================================================
// CHAIN REACTION — Game Logic
//
// State machine, event processing, continuous play, epochs, API.
// Uses Game class from game-core.js. No rendering — see ui.js and engine.js.
//
// Loaded after: game-core.js, engine.js, audio.js
// Loaded before: ui.js, bot.js
// =========================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// =====================================================================
// GAME-SPECIFIC CONSTANTS
// =====================================================================

const SETBACK_ROUNDS = 2;
const MERCY_RADIUS_BONUS = 0.05;
const MERCY_RADIUS_CAP = 0.15;
const SUPERNOVA_CHARGE_NEEDED = 3;
const SUPERNOVA_TAPS = 3;
const HIT_FREEZE_FRAMES = 3;

// =====================================================================
// GAME INSTANCE
// =====================================================================

let game = null;

// =====================================================================
// GAME STATE (browser-level, separate from game.gameState)
// =====================================================================

let round = 0;
let bestRound = parseInt(localStorage.getItem('cr3_bestRound') || '0', 10);
let bestScore = parseInt(localStorage.getItem('cr3_bestScore') || '0', 10);
let gameState = 'start';  // 'start' | 'playing' | 'resolving' | 'gameover' | 'overflow'
let freezeFrames = 0;
let gameOverTimer = 0;
let totalScore = 0;

// Progression
let consecutiveFails = 0;
let mercyBonus = 0;
let peakRound = 0;

// Supernova
let supernovaCharge = 0;
let supernovaActive = false;
let supernovaTapsRemaining = 0;

// Replay
let replayLog = [];
let replayStartTime = 0;

// Persistence
let deviceId = localStorage.getItem('cr_device_id');
if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('cr_device_id', deviceId); }
let playerName = localStorage.getItem('cr_player_name') || null;
let resumeCheckpoint = null;
let leaderboard = null;
let contLeaderboard = null;
let lastSessionId = null;

// Mode & tier selection
let gameMode = localStorage.getItem('cr_game_mode') || 'continuous';
let selectedTier = localStorage.getItem('cr_continuous_tier') || 'FLOW';
const TIER_ORDER = ['CALM', 'FLOW', 'SURGE', 'TRANSCENDENCE', 'IMPOSSIBLE'];
const TIER_LABELS = { CALM: 'Calm', FLOW: 'Flow', SURGE: 'Surge', TRANSCENDENCE: 'Transcendence', IMPOSSIBLE: 'Impossible' };
const TIER_DESCRIPTIONS = {
    CALM: 'Slow pace. No rush. Learn the feel.',
    FLOW: 'Steady rhythm. Time your taps.',
    SURGE: 'Fast and dense. Stay sharp.',
    TRANSCENDENCE: 'Tight space. Every tap counts.',
    IMPOSSIBLE: 'Brutal. Tiny field. Good luck.',
};
let tiersVisited = JSON.parse(localStorage.getItem('cr_tiers_visited') || '{}');
let modeSwipeOffset = 0;
let modeSwipeTarget = 0;
let tierSwipeOffset = 0;
let tierSwipeTarget = 0;
let sessionCount = parseInt(localStorage.getItem('cr_session_count') || '0', 10);

// =====================================================================
// CONTINUOUS PLAY STATE
// =====================================================================

let continuousActive = false;
let currentTier = null;
let contDuration = 0;
let contStartTime = 0;
let overflowTriggered = false;
let peakChainLength = 0;
let contBestScore = parseInt(localStorage.getItem('cr_cont_bestScore') || '0', 10);
let lastTapTime = -Infinity;
let lastTapX = 0, lastTapY = 0;

// Overflow bloom
let overflowBloomTime = 0;
let overflowBloomPhase = null;
let overflowDots = [];
let overflowDetonateIdx = 0;
let overflowWhiteAlpha = 0;
let summaryTimer = 0;

// =====================================================================
// EPOCH SYSTEM
// =====================================================================

const EPOCHS = [
    { name: 'Dawn',          maxDensity: 0.20, bg: [2, 2, 16],   padChord: [0, 7] },
    { name: 'Gathering',     maxDensity: 0.40, bg: [8, 6, 24],   padChord: [2, 9] },
    { name: 'Flow',          maxDensity: 0.60, bg: [15, 10, 35], padChord: [4, 11] },
    { name: 'Surge',         maxDensity: 0.80, bg: [25, 12, 40], padChord: [5, 12] },
    { name: 'Transcendence', maxDensity: 1.01, bg: [35, 15, 50], padChord: [7, 14] },
];
let currentEpochIdx = 0;
let epochBlendFrom = EPOCHS[0];
let epochBlendTo = EPOCHS[0];
let epochTransition = 1;
let peakEpochIdx = 0;

// Epoch audio
let epochAudioLayers = { pad: null, melody: null, rhythm: null, bass: null };
let epochMelodyInterval = null;
let epochRhythmInterval = null;

// =====================================================================
// MUSIC SYSTEM
// =====================================================================

const MUSIC_PATTERN = [
    [5,1.0],[7,0.7],[8,0.9],[10,0.6],
    [9,0.8],[8,0.7],[7,0.9],[5,0.6],
    [3,1.0],[4,0.7],[5,0.9],[7,0.6],
    [8,0.8],[7,0.7],[5,0.9],[3,0.5],
];
let musicBeat = 0;
let nextMusicBeat = 0;
const MUSIC_BEAT_MS = 750;

// =====================================================================
// API HELPERS
// =====================================================================

const API = {
    async saveSession(events, contData) {
        try {
            const payload = {
                device_id: deviceId,
                player_name: playerName,
                peak_round: contData ? 0 : peakRound,
                total_score: contData ? contData.score : totalScore + game.score,
                is_bot: spectatorMode,
                viewport_w: W,
                viewport_h: H,
                build_ver: BUILD_VERSION,
                events,
            };
            if (contData) {
                payload.game_mode = 'continuous';
                payload.continuous_tier = contData.tier;
                payload.duration_ms = contData.duration;
                payload.final_density = contData.finalDensity;
                payload.mean_density = contData.meanDensity;
                payload.total_taps = contData.totalTaps;
            }
            const res = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true,
            });
            const data = await res.json();
            if (data.id) lastSessionId = data.id;
            return data;
        } catch (e) { console.warn('saveSession failed:', e); }
    },
    saveCheckpoint() {
        fetch('/api/checkpoint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_id: deviceId,
                round, total_score: totalScore,
                consecutive_fails: consecutiveFails,
                mercy_bonus: mercyBonus,
                supernova_charge: supernovaCharge,
            }),
            keepalive: true,
        }).catch(() => {});
    },
    clearCheckpoint() {
        fetch(`/api/checkpoint/${encodeURIComponent(deviceId)}`, {
            method: 'DELETE', keepalive: true,
        }).catch(() => {});
    },
    async fetchLeaderboard(mode, tier) {
        try {
            let url = '/api/leaderboard';
            if (mode) {
                url += `?mode=${mode}`;
                if (tier) url += `&tier=${tier}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (mode === 'continuous') {
                contLeaderboard = data;
            } else {
                leaderboard = data;
            }
        } catch (e) { console.warn('fetchLeaderboard failed:', e); }
    },
    async fetchCheckpoint() {
        try {
            const res = await fetch(`/api/checkpoint/${encodeURIComponent(deviceId)}`);
            const data = await res.json();
            resumeCheckpoint = data;
        } catch (e) { console.warn('fetchCheckpoint failed:', e); }
    },
};

Promise.all([
    API.fetchLeaderboard('rounds'),
    API.fetchLeaderboard('continuous', selectedTier),
    API.fetchCheckpoint(),
]).catch(() => {});

// =====================================================================
// RESIZE
// =====================================================================

function resize() {
    engineResize(canvas);
    if (game) {
        game.W = W;
        game.H = H;
        // Recalculate explosion radius
        const refDim = Math.min(W, H, 800);
        let radius = Math.max(DEFAULTS.EXPLOSION_RADIUS_MIN_PX, refDim * DEFAULTS.EXPLOSION_RADIUS_PCT);
        if (!continuousActive && round > 0) {
            const radiusScale = Math.max(0.85, 1.0 - (round - 1) * 0.01);
            radius *= radiusScale * (1 + mercyBonus);
        }
        game.explosionRadius = radius;
    }
}
window.addEventListener('resize', resize);
resize();

// =====================================================================
// EPOCH FUNCTIONS
// =====================================================================

function detectEpoch() {
    if (!currentTier || game.densityHistory.length < 2) return;
    const recent = game.densityHistory.slice(-20);
    const meanDensity = recent.reduce((s, h) => s + h.density, 0) / recent.length;

    let newIdx = 0;
    for (let i = 0; i < EPOCHS.length; i++) {
        if (meanDensity < EPOCHS[i].maxDensity) { newIdx = i; break; }
    }

    if (newIdx !== currentEpochIdx) {
        epochBlendFrom = { bg: [...getCurrentBg()] };
        epochBlendTo = EPOCHS[newIdx];
        epochTransition = 0;
        currentEpochIdx = newIdx;
        if (newIdx > peakEpochIdx) peakEpochIdx = newIdx;
        spawnCelebration(EPOCHS[newIdx].name, 220, 0.8);
        setEpochAudio(newIdx);
    }
}

function getCurrentBg() {
    if (epochTransition >= 1) return epochBlendTo.bg || EPOCHS[currentEpochIdx].bg;
    const f = epochBlendFrom.bg || [2, 2, 16];
    const t = epochBlendTo.bg || EPOCHS[currentEpochIdx].bg;
    const p = epochTransition;
    return [
        Math.round(f[0] + (t[0] - f[0]) * p),
        Math.round(f[1] + (t[1] - f[1]) * p),
        Math.round(f[2] + (t[2] - f[2]) * p),
    ];
}

function updateEpochVisuals() {
    if (!continuousActive) return;
    if (epochTransition < 1) {
        epochTransition = Math.min(1, epochTransition + 0.006);
    }
    bgOverride = getCurrentBg();
}

function setEpochAudio(epochIdx) {
    if (!audio.initialized || !audio.ctx) return;
    const c = audio.ctx;
    const now = c.currentTime;
    const fadeTime = 2.5;

    // Pad layer
    stopEpochLayer('pad');
    const epoch = EPOCHS[epochIdx];
    const padGain = c.createGain();
    padGain.gain.setValueAtTime(0, now);
    padGain.gain.linearRampToValueAtTime(0.04, now + fadeTime);
    padGain.connect(audio.masterGain);
    const padOscs = epoch.padChord.map(noteIdx => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = SCALE_NOTES[noteIdx] * 0.5;
        osc.connect(padGain);
        osc.start(now);
        return osc;
    });
    epochAudioLayers.pad = { gain: padGain, oscs: padOscs };

    // Melody layer: Gathering+
    stopEpochLayer('melody');
    if (epochIdx >= 1) {
        const melGain = c.createGain();
        melGain.gain.setValueAtTime(0, now);
        melGain.gain.linearRampToValueAtTime(0.025, now + fadeTime);
        melGain.connect(audio.masterGain);
        epochAudioLayers.melody = { gain: melGain, oscs: [] };
        let melBeat = 0;
        epochMelodyInterval = setInterval(() => {
            if (!audio.ctx || !continuousActive) { clearInterval(epochMelodyInterval); return; }
            const t = audio.ctx.currentTime;
            const noteIdx = epoch.padChord[melBeat % epoch.padChord.length] + (melBeat % 3 === 0 ? 0 : 5);
            const safeIdx = Math.min(noteIdx, SCALE_NOTES.length - 1);
            audio._voicePlay(SCALE_NOTES[safeIdx], 'triangle', 0.03, 0.01, 0.08, 0.3, 0.3, 0.8, t);
            melBeat++;
        }, MUSIC_BEAT_MS * 2);
    }

    // Rhythm layer: Flow+
    stopEpochLayer('rhythm');
    if (epochIdx >= 2) {
        const rhyGain = c.createGain();
        rhyGain.gain.setValueAtTime(0, now);
        rhyGain.gain.linearRampToValueAtTime(0.02, now + fadeTime);
        rhyGain.connect(audio.masterGain);
        epochAudioLayers.rhythm = { gain: rhyGain };
        epochRhythmInterval = setInterval(() => {
            if (!audio.ctx || !continuousActive) { clearInterval(epochRhythmInterval); return; }
            const t = audio.ctx.currentTime;
            const buf = audio.ctx.createBuffer(1, Math.floor(audio.ctx.sampleRate * 0.03), audio.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.ctx.sampleRate * 0.008));
            const src = audio.ctx.createBufferSource();
            src.buffer = buf;
            const bp = audio.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 800 + epochIdx * 200;
            bp.Q.value = 3;
            src.connect(bp);
            bp.connect(rhyGain);
            src.start(t);
        }, MUSIC_BEAT_MS / 2);
    }

    // Bass layer: Surge+
    stopEpochLayer('bass');
    if (epochIdx >= 3) {
        const bassGain = c.createGain();
        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.06, now + fadeTime);
        bassGain.connect(audio.masterGain);
        const bassOsc = c.createOscillator();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = 65.41;
        bassOsc.connect(bassGain);
        bassOsc.start(now);
        epochAudioLayers.bass = { gain: bassGain, oscs: [bassOsc] };
    }
}

function stopEpochLayer(name) {
    const layer = epochAudioLayers[name];
    if (!layer) return;
    try {
        if (layer.gain && audio.ctx) {
            layer.gain.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + 0.5);
            setTimeout(() => {
                try {
                    if (layer.oscs) layer.oscs.forEach(o => { try { o.stop(); } catch(e) {} });
                    layer.gain.disconnect();
                } catch(e) {}
            }, 600);
        }
    } catch(e) {}
    epochAudioLayers[name] = null;
}

function stopAllEpochAudio() {
    stopEpochLayer('pad');
    stopEpochLayer('melody');
    stopEpochLayer('rhythm');
    stopEpochLayer('bass');
    if (epochMelodyInterval) { clearInterval(epochMelodyInterval); epochMelodyInterval = null; }
    if (epochRhythmInterval) { clearInterval(epochRhythmInterval); epochRhythmInterval = null; }
}

// =====================================================================
// GAME STATE MANAGEMENT
// =====================================================================

function startRound() {
    game.setupRound(round);
    game.explosionRadius *= (1 + mercyBonus);

    engineResetVisuals();
    replayLog.push({ t: performance.now() - replayStartTime, type: 'round_start', data: {
        round,
        dots: game.dots.map(d => ({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, type: d.type })),
    }});
    shakeTrauma = 0;
    bgPulse = 0;
    gameState = 'playing';
}

function startContinuous() {
    tiersVisited[selectedTier] = true;
    localStorage.setItem('cr_tiers_visited', JSON.stringify(tiersVisited));

    currentTier = CONTINUOUS_TIERS[selectedTier];
    continuousActive = true;
    contStartTime = performance.now();
    contDuration = 0;
    overflowTriggered = false;
    peakChainLength = 0;
    lastTapTime = -Infinity;
    lastTapX = 0;
    lastTapY = 0;
    currentEpochIdx = 0;
    epochBlendFrom = EPOCHS[0];
    epochBlendTo = EPOCHS[0];
    epochTransition = 1;
    peakEpochIdx = 0;
    bgOverride = EPOCHS[0].bg;
    stopAllEpochAudio();

    game = new Game(W, H, {}, Math.random);
    game.startContinuous(currentTier);

    lastSessionId = null;
    replayLog = [];
    replayStartTime = performance.now();
    engineResetVisuals();
    shakeTrauma = 0;
    bgPulse = 0;
    gameState = 'playing';
}

function handleTap(x, y) {
    if (gameState === 'start') {
        audio.init();
        sessionCount++;
        localStorage.setItem('cr_session_count', sessionCount);

        if (gameMode === 'continuous') {
            startContinuous();
            return;
        }

        // Rounds mode
        round = 1;
        totalScore = 0;
        consecutiveFails = 0;
        mercyBonus = 0;
        supernovaCharge = 0;
        supernovaActive = false;
        supernovaTapsRemaining = 0;
        peakRound = 1;
        lastSessionId = null;
        replayLog = [];
        replayStartTime = performance.now();
        game = new Game(W, H, {}, Math.random);
        API.clearCheckpoint();
        startRound();
        return;
    }

    // Continuous bloom: ignore taps during animation
    if (continuousActive && gameState === 'overflow' && overflowBloomPhase !== 'summary') return;

    // Continuous summary: only button hits
    if (continuousActive && overflowBloomPhase === 'summary') {
        if (handleButtonHit(x, y)) return;
        return;
    }

    if (gameState === 'gameover') {
        round = Math.max(1, round - SETBACK_ROUNDS);
        totalScore = Math.max(0, totalScore - game.score);
        consecutiveFails++;
        mercyBonus = Math.min(MERCY_RADIUS_CAP, consecutiveFails * MERCY_RADIUS_BONUS);
        startRound();
        return;
    }

    // Supernova: extra taps during resolving
    if (game.gameState === 'resolving' && supernovaActive && supernovaTapsRemaining > 0) {
        audio.playTap();
        supernovaTapsRemaining--;
        freezeFrames = HIT_FREEZE_FRAMES;
        replayLog.push({ t: performance.now() - replayStartTime, type: 'tap', data: { x, y, round, chainCount: game.chainCount, supernova: true } });
        game.explosions.push(game._createExplosion(x, y, 0));
        if (game.countInRadius(x, y, game.explosionRadius) === 0) audio.playMiss();
        return;
    }

    // Continuous mode tap
    if (continuousActive && (gameState === 'playing' || game.gameState === 'resolving')) {
        if (!game.canTap()) return;
        audio.init();
        audio.playTap();

        const hitCount = game.countInRadius(x, y, game.explosionRadius);
        lastTapTime = performance.now();
        lastTapX = x;
        lastTapY = y;

        replayLog.push({ t: performance.now() - replayStartTime, type: 'tap', data: {
            x, y, density: game.density(), taps: game.totalTaps + 1,
        }});

        game.tap(x, y);
        freezeFrames = HIT_FREEZE_FRAMES;
        gameState = 'resolving';
        if (hitCount === 0) audio.playMiss();
        return;
    }

    if (gameState !== 'playing') return;

    audio.init();
    audio.playTap();

    replayLog.push({ t: performance.now() - replayStartTime, type: 'tap', data: { x, y, round, chainCount: game.chainCount } });

    freezeFrames = HIT_FREEZE_FRAMES;
    if (supernovaActive) supernovaTapsRemaining--;

    const hitCount = game.countInRadius(x, y, game.explosionRadius);
    game.tap(x, y);
    gameState = 'resolving';
    if (hitCount === 0) audio.playMiss();
}

function checkRoundEnd() {
    if (game.explosions.length > 0 || game.pendingExplosions.length > 0) return;

    if (supernovaActive && supernovaTapsRemaining > 0) {
        game.gameState = 'playing';
        gameState = 'playing';
        return;
    }

    const params = getRoundParams(round);
    if (game.chainCount >= params.target) {
        totalScore += game.score;
        if (round > bestRound) {
            bestRound = round;
            localStorage.setItem('cr3_bestRound', bestRound);
        }
        if (totalScore > bestScore) {
            bestScore = totalScore;
            localStorage.setItem('cr3_bestScore', bestScore);
        }

        consecutiveFails = 0;
        mercyBonus = 0;

        if (supernovaActive) {
            supernovaActive = false;
            audio.deactivateSupernova();
        } else {
            supernovaCharge++;
        }

        replayLog.push({ t: performance.now() - replayStartTime, type: 'clear', data: {
            round, chainCount: game.chainCount, score: game.score, target: params.target,
        }});

        spawnCelebration(`Round ${round} Clear!`, 200, 1.4);
        audio.playRoundClear();
        game.slowMoTarget = 0.6;

        round++;
        if (round > peakRound) peakRound = round;
        API.saveCheckpoint();

        startRound();

        if (supernovaCharge >= SUPERNOVA_CHARGE_NEEDED) {
            supernovaActive = true;
            supernovaTapsRemaining = SUPERNOVA_TAPS;
            supernovaCharge = 0;
            audio.activateSupernova();
            spawnCelebration('SUPERNOVA!', 45, 2.2);
            screenFlash = 0.5;
        }
    } else {
        supernovaCharge = 0;
        if (supernovaActive) {
            supernovaActive = false;
            audio.deactivateSupernova();
        }
        markNearMissDots();
        gameState = 'gameover';
        gameOverTimer = 0;
        audio.playGameOver();
        const frustration = params.target > 0 ? game.chainCount / params.target : 0;
        replayLog.push({ t: performance.now() - replayStartTime, type: 'fail', data: {
            round, chainCount: game.chainCount, target: params.target, frustration: +frustration.toFixed(2),
        }});
        API.saveSession([...replayLog]);
    }
}

function markNearMissDots() {
    const nmRadius = game.explosionRadius * 1.2;
    for (const dot of game.dots) {
        if (!dot.active) continue;
        for (const other of game.dots) {
            if (other.active || other === dot) continue;
            if (Math.hypot(dot.x - other.x, dot.y - other.y) <= nmRadius) {
                dot._nearMiss = 1.0;
                break;
            }
        }
    }
}

function updateOverflowBloom() {
    if (!overflowTriggered || overflowBloomPhase === 'summary') return;
    const dt = 16.67;
    overflowBloomTime += dt;

    if (overflowBloomPhase === 'detonating') {
        if (!overflowDots || overflowDots.length === 0) {
            overflowBloomPhase = 'hold';
            overflowBloomTime = 0;
            stopAllEpochAudio();
            return;
        }

        const dotsPerTick = 3;
        const tickInterval = 50;
        const dotsToDetonate = Math.min(
            overflowDots.length,
            Math.floor(overflowBloomTime / tickInterval) * dotsPerTick
        );

        while (overflowDetonateIdx < dotsToDetonate && overflowDetonateIdx < overflowDots.length) {
            const entry = overflowDots[overflowDetonateIdx];
            const dot = entry && entry.dot;
            if (dot && dot.active) {
                dot.active = false;
                dot.bloomTimer = 30;
                game.chainCount++;
                emitParticles(dot.x, dot.y, getDotHue(dot), 1);
                if (audio.initialized) {
                    const noteIdx = Math.min(overflowDetonateIdx % 20, SCALE_NOTES.length - 1);
                    audio.playChainNote(noteIdx, 1);
                }
            }
            overflowDetonateIdx++;
        }

        if (overflowDetonateIdx >= overflowDots.length) {
            overflowBloomPhase = 'hold';
            overflowBloomTime = 0;
            screenFlash = 0.6;
            if (audio.initialized) {
                const chordNotes = [0, 4, 7, 9, 12];
                chordNotes.forEach((n, i) => {
                    const safeIdx = Math.min(n, SCALE_NOTES.length - 1);
                    audio._voicePlay(SCALE_NOTES[safeIdx], 'sine', 0.08, 0.1, 0.3, 0.6, 2.0, 1.5, audio.ctx.currentTime + i * 0.06);
                });
            }
            emitCelebrationBurst(W / 2, H / 2, 200, 60);
            stopAllEpochAudio();
        }
    } else if (overflowBloomPhase === 'hold') {
        if (overflowBloomTime >= 1500) {
            overflowBloomPhase = 'fade';
            overflowBloomTime = 0;
        }
    } else if (overflowBloomPhase === 'fade') {
        overflowWhiteAlpha = Math.min(1, overflowBloomTime / 1500);
        if (overflowBloomTime >= 2000) {
            overflowBloomPhase = 'summary';
            summaryTimer = 0;
            const recent = game.densityHistory.slice(-20);
            const md = recent.length > 0 ? recent.reduce((s, h) => s + h.density, 0) / recent.length : 0;
            API.saveSession([...replayLog], {
                score: game.score,
                tier: selectedTier,
                duration: contDuration,
                finalDensity: game.density(),
                meanDensity: md,
                totalTaps: game.totalTaps,
            });
            API.fetchLeaderboard('continuous', selectedTier);
        }
    }
}

// =====================================================================
// EVENT PROCESSING — Audio hooks for game-core events
// =====================================================================

function processGameEvents(events) {
    for (const ev of events) {
        switch (ev.type) {
            case 'dotCaught':
                audio.playChainNote(ev.chainCount - 1, ev.generation);
                break;
            case 'celebration':
                audio.playCelebration(Math.round(ev.scale));
                break;
            case 'chainEnd':
                if (continuousActive && ev.chainLength > peakChainLength) {
                    peakChainLength = ev.chainLength;
                }
                break;
        }
    }
}

// =====================================================================
// UPDATE
// =====================================================================

let lastFrame = performance.now();

function update() {
    const now = performance.now();
    lastFrame = now;

    if (freezeFrames > 0) { freezeFrames--; return; }

    // Music system
    if (audio.initialized && gameState !== 'start' && now >= nextMusicBeat) {
        nextMusicBeat = now + MUSIC_BEAT_MS;
        const idx = musicBeat % MUSIC_PATTERN.length;
        const [noteIdx, volMult] = MUSIC_PATTERN[idx];
        const musicVol = gameState === 'resolving' ? 0.08 : 0.20;
        audio.playMusicNote(noteIdx, musicVol * volMult);
        if (idx % 4 === 0) audio.playMusicBass(0);
        beatPulse = Math.max(beatPulse, idx % 4 === 0 ? 0.08 : 0.04);
        musicBeat++;
    }

    // Physics step (single source of truth)
    game.step(16.67);

    // Process events: visual effects + audio
    engineProcessEvents(game.events, game);
    processGameEvents(game.events);
    game.events = [];

    // Visual updates
    engineUpdateVisuals(game);

    // Fever decay
    if (game.gameState !== 'resolving' && feverIntensity > 0) {
        feverIntensity = Math.max(0, feverIntensity - 0.008);
    }

    if (gameState === 'gameover') {
        gameOverTimer = Math.min(1, gameOverTimer + 0.015);
    }

    // Mode-specific updates
    if (continuousActive) {
        contDuration = now - contStartTime;
        detectEpoch();
        updateEpochVisuals();

        // Check if game-core detected overflow
        if (game.overflowed && !overflowTriggered) {
            overflowTriggered = true;
            gameState = 'overflow';
            overflowBloomTime = 0;
            overflowBloomPhase = 'detonating';
            overflowDots = game.dots.filter(d => d.active).map(d => ({
                dot: d,
                dist: Math.hypot(d.x - W / 2, d.y - H / 2),
            })).sort((a, b) => a.dist - b.dist);
            overflowDetonateIdx = 0;
            overflowWhiteAlpha = 0;
        }

        if (overflowTriggered) {
            updateOverflowBloom();
        }

        // Sync browser gameState with game-core
        if (!overflowTriggered) {
            if (game.gameState === 'playing') gameState = 'playing';
            else if (game.gameState === 'resolving') gameState = 'resolving';
        }
    } else if (game.gameState === 'done') {
        checkRoundEnd();
    }
}

// =====================================================================
// REPLAY DOWNLOAD
// =====================================================================

function downloadReplay() {
    if (replayLog.length === 0) return;
    const data = JSON.stringify({
        version: BUILD_VERSION, date: BUILD_DATE,
        viewport: { w: W, h: H },
        peakRound, bestRound, totalScore,
        events: replayLog,
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replay-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// =====================================================================
// INIT
// =====================================================================

function initGame() {
    game = new Game(W, H, {}, Math.random);
    game._generateDots(10, 0.5, 1.0);
    gameState = 'start';
    lastFrame = performance.now();
}
