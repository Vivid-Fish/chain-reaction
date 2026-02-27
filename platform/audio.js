// platform/audio.js — Declarative audio engine
// Games emit events: { type: 'tone'|'noise'|'drum', freq, duration, gain, ... }
// Platform handles Web Audio synthesis. No samples, no assets.

export function createAudioEngine(audioCtx) {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return { play() {}, resume() {}, ctx: null };
    }
  }

  const master = audioCtx.createGain();
  master.gain.value = 0.7;
  master.connect(audioCtx.destination);

  // Voice pool: limit concurrent voices to prevent resource leaks
  const MAX_VOICES = 16;
  let activeVoices = 0;

  function voiceStart() {
    if (activeVoices >= MAX_VOICES) return false;
    activeVoices++;
    return true;
  }
  function voiceEnd() { activeVoices = Math.max(0, activeVoices - 1); }

  function play(events) {
    if (!events || audioCtx.state === 'closed') return;
    const now = audioCtx.currentTime;

    for (const e of events) {
      switch (e.type) {
        case 'tone': playTone(now, e); break;
        case 'noise': playNoise(now, e); break;
        case 'drum': playDrum(now, e); break;
        case 'sweep': playSweep(now, e); break;
      }
    }
  }

  function playTone(now, e) {
    if (!voiceStart()) return;
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
    osc.onended = voiceEnd;
  }

  function playNoise(now, e) {
    if (!voiceStart()) return;
    const dur = e.duration || 0.2;
    const bufferSize = audioCtx.sampleRate * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(e.gain || 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    if (e.filter) {
      const filter = audioCtx.createBiquadFilter();
      filter.type = e.filter;
      filter.frequency.value = e.freq || 1000;
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(master);
    source.start(now);
    source.onended = voiceEnd;
  }

  function playDrum(now, e) {
    if (!voiceStart()) return;
    const dur = e.duration || 0.15;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(e.freq || 150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);
    gain.gain.setValueAtTime(e.gain || 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.01);
    osc.onended = voiceEnd;
  }

  function playSweep(now, e) {
    if (!voiceStart()) return;
    const dur = e.duration || 0.2;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = e.wave || 'sawtooth';
    osc.frequency.setValueAtTime(e.freqStart || 200, now);
    osc.frequency.exponentialRampToValueAtTime(e.freqEnd || 800, now + dur);
    gain.gain.setValueAtTime(e.gain || 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.01);
    osc.onended = voiceEnd;
  }

  function resume() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function setVolume(v) {
    master.gain.value = Math.max(0, Math.min(1, v));
  }

  return { play, resume, setVolume, ctx: audioCtx };
}
