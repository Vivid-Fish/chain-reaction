'use strict';

// =========================================================================
// CHAIN REACTION — Audio Engine
//
// Web Audio API synthesis: chain notes (pentatonic scale), celebrations,
// round clear, game over, tap/miss sounds, music system, supernova filter.
// Self-contained — no dependencies on other game files.
// =========================================================================

// Ascending pentatonic scale
const SCALE_NOTES = [
    130.81, 146.83, 164.81, 196.00, 220.00,
    261.63, 293.66, 329.63, 392.00, 440.00,
    523.25, 587.33, 659.25, 783.99, 880.00,
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00,
];

const MAX_VOICES = 48;
const SIXTEENTH_NOTE_SEC = (60 / 80) / 4;

const audio = {
    ctx: null,
    masterGain: null,
    compressor: null,
    delayNode: null,
    voices: [],
    initialized: false,

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.ctx.resume();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 12;
        this.compressor.ratio.value = 6;
        this.delayNode = this._createDelay(0.18, 0.25, 0.18);
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.delayNode.input);
        this.delayNode.output.connect(this.ctx.destination);
        setTimeout(() => {
            const reverb = this._createReverb(2.0, 3.0, 0.22);
            this.delayNode.output.disconnect();
            this.delayNode.output.connect(reverb.input);
            reverb.output.connect(this.ctx.destination);
        }, 0);
        this.initialized = true;
        this.gridOrigin = this.ctx.currentTime;
    },

    playChainNote(chainIndex, generation) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const elapsed = now - this.gridOrigin;
        const gridPos = Math.round(elapsed / SIXTEENTH_NOTE_SEC);
        let at = this.gridOrigin + gridPos * SIXTEENTH_NOTE_SEC;
        if (at < now) at += SIXTEENTH_NOTE_SEC;
        const noteIdx = Math.min(chainIndex, SCALE_NOTES.length - 1);
        const baseFreq = SCALE_NOTES[noteIdx];
        const detune = (Math.random() - 0.5) * 12;
        const freq = baseFreq * Math.pow(2, detune / 1200);
        const chainBoost = Math.min(1.8, 1 + chainIndex * 0.03);
        let attack, decay, susLvl, susTime, release, vol;
        if (generation === 0) {
            attack = 0.001; decay = 0.04; susLvl = 0.4;
            susTime = 0.12; release = 0.6; vol = 0.24 * chainBoost;
        } else {
            attack = 0.003; decay = 0.03; susLvl = 0.35;
            susTime = 0.08; release = 0.5 + Math.min(0.3, generation * 0.02);
            vol = Math.max(0.08, 0.22 * chainBoost - generation * 0.005);
        }
        this._voicePlay(freq, 'triangle', vol, attack, decay, susLvl, susTime, release, at);
        this._voicePlay(freq, 'sine', vol * 0.5, 0.001, 0.01, 0, 0, 0.03, at);
        if (chainIndex >= 2) this._voicePlay(freq * 2, 'sine', vol * 0.12, 0.003, 0.03, 0.15, 0.03, 0.4, at);
        if (chainIndex < 4) this._voicePlay(freq * 0.5, 'sine', vol * 0.1, 0.01, 0.06, 0.2, 0.06, 0.5, at);
        if (chainIndex >= 6) this._voicePlay(freq * 1.5, 'sine', vol * 0.08, 0.005, 0.04, 0.12, 0.04, 0.4, at);
    },

    playMusicNote(noteIdx, vol) {
        if (!this.initialized) return;
        this._voicePlay(SCALE_NOTES[noteIdx], 'triangle', vol, 0.01, 0.08, 0.5, 0.4, 1.0);
    },

    playMusicBass(noteIdx) {
        if (!this.initialized) return;
        this._voicePlay(SCALE_NOTES[noteIdx], 'sine', 0.12, 0.05, 0.1, 0.3, 0.5, 1.0);
    },

    playMiss() {
        if (!this.initialized) return;
        const c = this.ctx; const now = c.currentTime;
        const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.08), c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.02));
        const src = c.createBufferSource(); src.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.06, now + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        src.connect(f); f.connect(g); g.connect(this.ctx.destination);
        src.start(now); src.stop(now + 0.08);
        src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect(); };
    },

    playTap() {
        if (!this.initialized) return;
        const c = this.ctx; const now = c.currentTime;
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        const g = c.createGain();
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(now); osc.stop(now + 0.2);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
    },

    playCelebration(level) {
        if (!this.initialized) return;
        const baseIdx = Math.min(10, level * 2);
        for (let i = 0; i < 4; i++) {
            const idx = Math.min(SCALE_NOTES.length - 1, baseIdx + i);
            setTimeout(() => {
                this._voicePlay(SCALE_NOTES[idx], 'sine', 0.14, 0.01, 0.08, 0.6, 0.15, 1.2);
                this._voicePlay(SCALE_NOTES[idx] * 2, 'sine', 0.04, 0.02, 0.05, 0.3, 0.1, 0.8);
            }, i * 80);
        }
    },

    playRoundClear() {
        if (!this.initialized) return;
        const chord = [
            SCALE_NOTES[5], SCALE_NOTES[7], SCALE_NOTES[8],
            SCALE_NOTES[10], SCALE_NOTES[12],
        ];
        chord.forEach((f, i) => {
            setTimeout(() => {
                this._voicePlay(f, 'sine', 0.12, 0.15, 0.1, 0.7, 1.0, 2.0);
                this._voicePlay(f * 2, 'sine', 0.03, 0.2, 0.08, 0.4, 0.8, 1.5);
            }, i * 60);
        });
    },

    playGameOver() {
        if (!this.initialized) return;
        [220, 196, 164.81].forEach((f, i) => {
            setTimeout(() => {
                this._voicePlay(f, 'triangle', 0.10, 0.1, 0.15, 0.5, 0.3, 1.5);
            }, i * 150);
        });
    },

    _voicePlay(freq, type, vol, attack, decay, susLvl, susTime, release, at) {
        while (this.voices.length >= MAX_VOICES) {
            const old = this.voices.shift();
            try {
                old.gain.gain.setValueAtTime(old.gain.gain.value, this.ctx.currentTime);
                old.gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.005);
                old.osc.stop(this.ctx.currentTime + 0.01);
            } catch(e) {}
        }
        const c = this.ctx; const now = at !== undefined ? at : c.currentTime;
        const osc = c.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        const env = c.createGain();
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(vol, now + attack);
        env.gain.linearRampToValueAtTime(vol * susLvl, now + attack + decay);
        const relStart = now + attack + decay + susTime;
        env.gain.setValueAtTime(vol * susLvl, relStart);
        env.gain.exponentialRampToValueAtTime(0.0001, relStart + release);
        osc.connect(env); env.connect(this.masterGain);
        osc.start(now); osc.stop(relStart + release + 0.05);
        const voice = { osc, gain: env };
        this.voices.push(voice);
        osc.onended = () => {
            osc.disconnect(); env.disconnect();
            const idx = this.voices.indexOf(voice);
            if (idx !== -1) this.voices.splice(idx, 1);
        };
    },

    _createDelay(time, feedback, wet) {
        const c = this.ctx;
        const input = c.createGain(), output = c.createGain();
        const delay = c.createDelay(2.0), fb = c.createGain();
        const wetG = c.createGain(), dryG = c.createGain();
        const filt = c.createBiquadFilter();
        delay.delayTime.value = time; fb.gain.value = feedback;
        wetG.gain.value = wet; dryG.gain.value = 1.0;
        filt.type = 'lowpass'; filt.frequency.value = 2500;
        input.connect(dryG); dryG.connect(output);
        input.connect(delay); delay.connect(filt); filt.connect(fb); fb.connect(delay);
        delay.connect(wetG); wetG.connect(output);
        return { input, output };
    },

    _createReverb(dur, dec, mix) {
        const c = this.ctx;
        const len = Math.floor(c.sampleRate * dur);
        const buf = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-dec * (i / c.sampleRate));
        }
        const conv = c.createConvolver(); conv.buffer = buf;
        const input = c.createGain(), output = c.createGain();
        const wetG = c.createGain(), dryG = c.createGain();
        wetG.gain.value = mix; dryG.gain.value = 1.0;
        input.connect(dryG); dryG.connect(output);
        input.connect(conv); conv.connect(wetG); wetG.connect(output);
        return { input, output };
    },

    activateSupernova() {
        if (!this.initialized) return;
        const c = this.ctx; const now = c.currentTime;
        this._snFilter = c.createBiquadFilter();
        this._snFilter.type = 'lowpass';
        this._snFilter.frequency.setValueAtTime(20000, now);
        this._snFilter.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        this._snFilter.Q.value = 1.5;
        this.masterGain.disconnect();
        this.masterGain.connect(this._snFilter);
        this._snFilter.connect(this.compressor);
    },

    deactivateSupernova() {
        if (!this.initialized || !this._snFilter) return;
        const c = this.ctx; const now = c.currentTime;
        this._snFilter.frequency.setValueAtTime(this._snFilter.frequency.value, now);
        this._snFilter.frequency.exponentialRampToValueAtTime(20000, now + 0.3);
        const filter = this._snFilter;
        this._snFilter = null;
        setTimeout(() => {
            try {
                this.masterGain.disconnect();
                this.masterGain.connect(this.compressor);
                filter.disconnect();
            } catch(e) {}
        }, 400);
    }
};
