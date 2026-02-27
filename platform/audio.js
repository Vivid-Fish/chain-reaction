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
  master.gain.value = 0.3;
  master.connect(audioCtx.destination);

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
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = e.wave || 'sine';
    osc.frequency.value = e.freq || 440;
    gain.gain.setValueAtTime(e.gain || 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (e.duration || 0.1));
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + (e.duration || 0.1) + 0.01);
  }

  function playNoise(now, e) {
    const bufferSize = audioCtx.sampleRate * (e.duration || 0.2);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(e.gain || 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (e.duration || 0.2));

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
  }

  function playDrum(now, e) {
    // Quick pitch-down sine for kick/tom sounds
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(e.freq || 150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + (e.duration || 0.15));
    gain.gain.setValueAtTime(e.gain || 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (e.duration || 0.15));
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + (e.duration || 0.15) + 0.01);
  }

  function playSweep(now, e) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = e.wave || 'sawtooth';
    osc.frequency.setValueAtTime(e.freqStart || 200, now);
    osc.frequency.exponentialRampToValueAtTime(e.freqEnd || 800, now + (e.duration || 0.2));
    gain.gain.setValueAtTime(e.gain || 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (e.duration || 0.2));
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + (e.duration || 0.2) + 0.01);
  }

  function resume() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  return { play, resume, ctx: audioCtx };
}
