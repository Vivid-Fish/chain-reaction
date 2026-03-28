// platform/audio.js — Declarative audio engine with musical synthesis
// Games emit events: { type: 'tone'|'noise'|'drum'|'sweep'|'note'|'chord', ... }
// Platform handles Web Audio synthesis with delay, reverb, beat quantization.
// No samples, no assets — everything synthesized at runtime.

// Ascending pentatonic scale (C3 to C6, 20 notes)
const SCALE = [
  130.81, 146.83, 164.81, 196.00, 220.00,
  261.63, 293.66, 329.63, 392.00, 440.00,
  523.25, 587.33, 659.25, 783.99, 880.00,
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00,
];

const BPM = 80;
const SIXTEENTH = (60 / BPM) / 4;

export function createAudioEngine(audioCtx) {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return { play() {}, resume() {}, setVolume() {}, ctx: null };
    }
  }

  // Signal chain: masterGain → compressor → delay → reverb → destination
  const master = audioCtx.createGain();
  master.gain.value = 0.6;

  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 6;

  master.connect(compressor);

  // Delay with feedback and lowpass filter
  const delay = audioCtx.createDelay(2.0);
  const delayFb = audioCtx.createGain();
  const delayWet = audioCtx.createGain();
  const delayDry = audioCtx.createGain();
  const delayFilter = audioCtx.createBiquadFilter();
  delay.delayTime.value = 0.18;
  delayFb.gain.value = 0.25;
  delayWet.gain.value = 0.18;
  delayDry.gain.value = 1.0;
  delayFilter.type = 'lowpass';
  delayFilter.frequency.value = 2500;

  const delayOut = audioCtx.createGain();
  compressor.connect(delayDry); delayDry.connect(delayOut);
  compressor.connect(delay); delay.connect(delayFilter);
  delayFilter.connect(delayFb); delayFb.connect(delay);
  delay.connect(delayWet); delayWet.connect(delayOut);

  // Reverb (algorithmic, created asynchronously)
  const reverbDry = audioCtx.createGain();
  const reverbWet = audioCtx.createGain();
  const finalOut = audioCtx.createGain();
  reverbDry.gain.value = 1.0;
  reverbWet.gain.value = 0.22;

  delayOut.connect(reverbDry);
  reverbDry.connect(finalOut);
  finalOut.connect(audioCtx.destination);

  // Build reverb IR asynchronously to avoid blocking
  setTimeout(() => {
    const len = Math.floor(audioCtx.sampleRate * 2.0);
    const buf = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-3.0 * (i / audioCtx.sampleRate));
      }
    }
    const conv = audioCtx.createConvolver();
    conv.buffer = buf;
    delayOut.connect(conv);
    conv.connect(reverbWet);
    reverbWet.connect(finalOut);
  }, 0);

  // Beat grid origin for quantization
  let gridOrigin = audioCtx.currentTime;

  // Voice pool
  const MAX_VOICES = 48;
  const voices = [];

  function voicePlay(freq, type, vol, attack, decay, susLvl, susTime, release, at) {
    // Evict oldest voice if at capacity
    while (voices.length >= MAX_VOICES) {
      const old = voices.shift();
      try {
        old.gain.gain.setValueAtTime(old.gain.gain.value, audioCtx.currentTime);
        old.gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.005);
        old.osc.stop(audioCtx.currentTime + 0.01);
      } catch (e) {}
    }
    const now = at !== undefined ? at : audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(vol, now + attack);
    env.gain.linearRampToValueAtTime(vol * susLvl, now + attack + decay);
    const relStart = now + attack + decay + susTime;
    env.gain.setValueAtTime(vol * susLvl, relStart);
    env.gain.exponentialRampToValueAtTime(0.0001, relStart + release);
    osc.connect(env);
    env.connect(master);
    osc.start(now);
    osc.stop(relStart + release + 0.05);
    const voice = { osc, gain: env };
    voices.push(voice);
    osc.onended = () => {
      osc.disconnect(); env.disconnect();
      const idx = voices.indexOf(voice);
      if (idx !== -1) voices.splice(idx, 1);
    };
  }

  // Snap a time to the nearest 16th-note grid position
  function quantize(time) {
    const elapsed = time - gridOrigin;
    const gridPos = Math.round(elapsed / SIXTEENTH);
    let at = gridOrigin + gridPos * SIXTEENTH;
    if (at < time) at += SIXTEENTH;
    return at;
  }

  function play(events) {
    if (!events || audioCtx.state === 'closed') return;
    const now = audioCtx.currentTime;

    for (const e of events) {
      switch (e.type) {

        // Basic tone with exponential decay
        case 'tone': {
          const dur = e.duration || 0.1;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = e.wave || 'sine';
          osc.frequency.value = e.freq || 440;
          gain.gain.setValueAtTime(e.gain || 0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + dur + 0.01);
          break;
        }

        // White noise with optional filter
        case 'noise': {
          const dur = e.duration || 0.2;
          const bufSize = Math.floor(audioCtx.sampleRate * dur);
          const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          const gain = audioCtx.createGain();
          gain.gain.setValueAtTime(e.gain || 0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
          if (e.filter) {
            const filt = audioCtx.createBiquadFilter();
            filt.type = e.filter;
            filt.frequency.value = e.freq || 1000;
            src.connect(filt); filt.connect(gain);
          } else {
            src.connect(gain);
          }
          gain.connect(master);
          src.start(now);
          break;
        }

        // Pitch-dropping drum hit
        case 'drum': {
          const dur = e.duration || 0.15;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(e.freq || 150, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + dur);
          gain.gain.setValueAtTime(e.gain || 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
          osc.connect(gain); gain.connect(master);
          osc.start(now); osc.stop(now + dur + 0.01);
          break;
        }

        // Frequency sweep
        case 'sweep': {
          const dur = e.duration || 0.2;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = e.wave || 'sawtooth';
          osc.frequency.setValueAtTime(e.freqStart || 200, now);
          osc.frequency.exponentialRampToValueAtTime(e.freqEnd || 800, now + dur);
          gain.gain.setValueAtTime(e.gain || 0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
          osc.connect(gain); gain.connect(master);
          osc.start(now); osc.stop(now + dur + 0.01);
          break;
        }

        // Musical note — pentatonic scale, beat-quantized, ADSR envelope, harmonics
        // { type: 'note', index, generation?, gain?, quantize? }
        case 'note': {
          const noteIdx = Math.min(e.index || 0, SCALE.length - 1);
          const baseFreq = SCALE[noteIdx];
          const detune = (Math.random() - 0.5) * 12;
          const freq = baseFreq * Math.pow(2, detune / 1200);
          const gen = e.generation || 0;
          const chainBoost = Math.min(1.8, 1 + (e.index || 0) * 0.03);
          const at = e.quantize !== false ? quantize(now) : now;

          // ADSR params vary by generation
          let attack, decay, susLvl, susTime, release, vol;
          if (gen === 0) {
            attack = 0.001; decay = 0.04; susLvl = 0.4;
            susTime = 0.12; release = 0.6; vol = (e.gain || 0.24) * chainBoost;
          } else {
            attack = 0.003; decay = 0.03; susLvl = 0.35;
            susTime = 0.08; release = 0.5 + Math.min(0.3, gen * 0.02);
            vol = Math.max(0.08, (e.gain || 0.22) * chainBoost - gen * 0.005);
          }

          // Main voice + harmonics
          voicePlay(freq, 'triangle', vol, attack, decay, susLvl, susTime, release, at);
          voicePlay(freq, 'sine', vol * 0.5, 0.001, 0.01, 0, 0, 0.03, at);
          if ((e.index || 0) >= 2) voicePlay(freq * 2, 'sine', vol * 0.12, 0.003, 0.03, 0.15, 0.03, 0.4, at);
          if ((e.index || 0) < 4) voicePlay(freq * 0.5, 'sine', vol * 0.1, 0.01, 0.06, 0.2, 0.06, 0.5, at);
          if ((e.index || 0) >= 6) voicePlay(freq * 1.5, 'sine', vol * 0.08, 0.005, 0.04, 0.12, 0.04, 0.4, at);
          break;
        }

        // Arpeggiated chord — celebration fanfare
        // { type: 'chord', notes: [idx, ...], delay?, gain? }
        case 'chord': {
          const notes = e.notes || [5, 7, 8, 10];
          const stepDelay = e.delay || 0.08;
          const vol = e.gain || 0.14;
          notes.forEach((idx, i) => {
            const noteIdx = Math.min(idx, SCALE.length - 1);
            const at = now + i * stepDelay;
            voicePlay(SCALE[noteIdx], 'sine', vol, 0.01, 0.08, 0.6, 0.15, 1.2, at);
            voicePlay(SCALE[noteIdx] * 2, 'sine', vol * 0.3, 0.02, 0.05, 0.3, 0.1, 0.8, at);
          });
          break;
        }

        // Tap confirmation sound
        // { type: 'tap' }
        case 'tap': {
          const osc = audioCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
          const gain = audioCtx.createGain();
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
          osc.connect(gain); gain.connect(master);
          osc.start(now); osc.stop(now + 0.2);
          break;
        }

        // Descending game-over tone
        // { type: 'gameover' }
        case 'gameover': {
          [220, 196, 164.81].forEach((f, i) => {
            const at = now + i * 0.15;
            voicePlay(f, 'triangle', 0.10, 0.1, 0.15, 0.5, 0.3, 1.5, at);
          });
          break;
        }

        // Round clear — ascending chord
        // { type: 'clear' }
        case 'clear': {
          [5, 7, 8, 10, 12].forEach((idx, i) => {
            const at = now + i * 0.06;
            voicePlay(SCALE[idx], 'sine', 0.12, 0.15, 0.1, 0.7, 1.0, 2.0, at);
            voicePlay(SCALE[idx] * 2, 'sine', 0.03, 0.2, 0.08, 0.4, 0.8, 1.5, at);
          });
          break;
        }

        // Miss — soft filtered noise pop
        // { type: 'miss' }
        case 'miss': {
          const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.08), audioCtx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
          const src = audioCtx.createBufferSource(); src.buffer = buf;
          const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
          const gain = audioCtx.createGain();
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.06, now + 0.002);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
          src.connect(filt); filt.connect(gain); gain.connect(master);
          src.start(now); src.stop(now + 0.08);
          break;
        }
      }
    }
  }

  function resume() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    gridOrigin = audioCtx.currentTime;
  }

  function setVolume(v) {
    master.gain.value = Math.max(0, Math.min(1, v));
  }

  return { play, resume, setVolume, ctx: audioCtx };
}
