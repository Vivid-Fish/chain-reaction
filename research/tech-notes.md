# Tech Stack Analysis

## Framework Comparison

### Summary Table

| Framework | CDN Single-File? | Min Size (gzip) | Renderer | Audio Built-in? | Particles? | Maintenance |
|-----------|-----------------|------------------|----------|-----------------|------------|-------------|
| **Raw Canvas 2D** | N/A (native) | 0 KB | Canvas 2D | No (use Web Audio) | Manual | Browser-native |
| **Phaser 3.x** | Yes | ~300 KB gzip (~980 KB min) | Canvas + WebGL | Yes (Web Audio) | Yes | Active (v3.90+, Phaser 4 beta) |
| **PixiJS v8** | Yes | ~200 KB gzip (~500 KB min) | WebGL2 / WebGPU | No | No built-in | Active |
| **Kontra.js** | Yes | ~5-10 KB gzip (modular) | Canvas 2D | No | Pool system | Active (js13k focused) |
| **Kaplay.js** | Yes | ~150 KB min | Canvas + WebGL | Yes (loadSound) | Yes | Active (community fork) |
| **p5.js** | Yes | ~350 KB gzip (~1 MB min) | Canvas 2D (WEBGL mode opt) | Yes (p5.sound addon, +200KB) | No | Active (Processing Foundation) |
| **Tone.js** | Yes | ~150 KB min | N/A (audio only) | Yes (comprehensive) | N/A | Active |
| **ZzFX/ZzFXM** | Yes (inline) | <1 KB / ~3 KB | N/A (audio only) | Yes (procedural) | N/A | Stable |

### Detailed Analysis

#### Raw Canvas 2D (Current Approach)

**Pros:**
- Zero dependencies, zero load time overhead
- Full control over every pixel and every audio node
- Perfect for single-file constraint -- nothing to load, nothing to break
- The game is simple enough that a framework adds more weight than value
- No abstraction tax: you understand every line because you wrote it

**Cons:**
- Must implement everything yourself: particle pooling, screen shake, easing
- No built-in scene management, asset loading, or input normalization
- Easy to write slow particle code without knowing the right patterns

**Assessment for this game:** This is the strongest option. 50 dots, a particle system, and some audio is well within what raw Canvas 2D handles. Frameworks are overkill here.

---

#### Phaser 3.x (v3.90 "Tsugumi")

CDN: `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`

**What you get:** Full game engine with physics (Arcade, Matter.js), tweens, cameras (with built-in shake/flash/fade), particle emitters, tilemaps, scene management, Web Audio integration, input handling across mouse/touch/gamepad.

**Real shipped games:** Vampire Survivors (initial web version), YouTube Playables, Discord Activities, thousands of itch.io games.

**The problem for Simon:** 980 KB minified for a game that needs ~5 KB of logic. The custom build tool can trim to ~400 KB, but that requires a build step (defeats the single-file constraint). Loading from CDN works but adds nearly 1 MB of JavaScript the user downloads to play a game with 50 dots.

**Audio:** Built-in `this.sound.add()` wraps Web Audio. Supports spatial audio, markers, rate control. Overkill but works.

**Verdict:** Pass. Bringing a cannon to a knife fight.

---

#### PixiJS v8

CDN: `https://cdn.jsdelivr.net/npm/pixi.js@8.16.0/dist/pixi.min.js`

**What you get:** Best-in-class 2D WebGL/WebGPU renderer. Scene graph, sprites, filters (blur, glow, color matrix), text rendering, interaction events.

**What you don't get:** Game loop, physics, audio, particles (need @pixi/particle-emitter addon).

**Assessment:** PixiJS shines when you have hundreds of sprites with complex blending, filters, and transformations that would choke Canvas 2D. Simon's game draws 50 circles and some expanding rings. Canvas 2D handles this trivially at 60fps. PixiJS's WebGL pipeline has a per-frame overhead (state machine setup, shader compilation) that actually makes it *slower* than Canvas 2D for very simple scenes.

**Verdict:** Pass. Wrong tool for this scale.

---

#### Kontra.js

CDN: `https://cdn.jsdelivr.net/npm/kontra@9.0.0/kontra.min.js`

**What you get:** Game loop, sprites, input handling, asset loading, object pools, tile engine, scene management. Designed specifically for js13kGames (13 KB zip budget). Modular -- import only what you need.

**Size:** Full library ~25 KB minified. With tree-shaking (requires bundler) or selective includes, can be under 5 KB for core features.

**Particle support:** No dedicated particle emitter, but the `Pool` class is designed exactly for particle-like object recycling:

```javascript
import { Pool, Sprite } from 'kontra';

let particlePool = Pool({
  create: Sprite,
  maxSize: 200
});

// Spawn particle
particlePool.get({
  x: 100, y: 100,
  dx: Math.cos(angle) * 5,
  dy: Math.sin(angle) * 5,
  ttl: 30,
  width: 3, height: 3,
  color: 'orange'
});

// In game loop
particlePool.update();
particlePool.render();
```

**Audio:** No built-in audio. Use Web Audio API directly or ZzFX.

**Assessment:** If Simon wanted a thin framework layer without going fully raw, Kontra is the best fit. But the current game is already working with raw Canvas -- Kontra would just add indirection without solving any current problem.

**Verdict:** Consider only if the game grows significantly in scope. Otherwise, pass.

---

#### Kaplay.js (Kaboom.js successor)

CDN: `https://unpkg.com/kaplay@3001.0.19/dist/kaplay.js`

**Background:** Community fork after Replit abandoned Kaboom.js in May 2024. Active development, but the v3001 numbering scheme is unusual and the API is still stabilizing post-fork.

**What you get:** Declarative game development style (scene/component architecture), built-in audio (`loadSound()`, `play()`), collision detection, tweens, timers, particles.

**Size:** ~150 KB minified.

**Assessment:** Kaplay's declarative style (`add([sprite("player"), pos(100, 200), area()])`) is great for rapid prototyping but adds unnecessary abstraction for a game this simple. The component system would wrap Simon's straightforward Dot/Explosion classes in a layer that doesn't add value.

**Verdict:** Pass. Fun for game jams, overhead for this project.

---

#### p5.js

CDN: `https://cdn.jsdelivr.net/npm/p5@1.11.0/lib/p5.min.js`

**What you get:** Creative coding environment with `setup()` / `draw()` loop, simplified canvas API, mouse/touch input, math helpers. Audio via separate `p5.sound` addon (~200 KB, wraps Tone.js).

**Size:** ~1 MB minified for core library alone. With p5.sound: ~1.2 MB total.

**Assessment:** p5.js is designed for creative coding sketches and art installations, not games. Its `draw()` loop clears and redraws the entire canvas every frame (no dirty-rect optimization). Performance is adequate for 50 particles but the library is absurdly large for what it provides here. The coding style (`fill(255, 0, 0); ellipse(x, y, r)`) is pleasant but no more productive than raw Canvas for someone who already has working Canvas code.

**Shipped examples:** Thousands of creative coding sketches on OpenProcessing, art installations, educational demos. Few shipped games.

**Verdict:** Pass. Great for learning and art, wrong weight class for production games.

---

#### Audio-Only Libraries: Tone.js vs ZzFX

**Tone.js** (CDN: `https://cdn.jsdelivr.net/npm/tone@14.9.17/build/Tone.min.js`, ~150 KB min):
Full-featured music framework. Synths with ADSR, effects (reverb, delay, chorus), transport scheduling, BPM-synced timing. Essentially a DAW in JavaScript. Worth considering if Simon wanted complex musical compositions, but massive overkill for "play a pentatonic note when a dot explodes."

**ZzFX** (inline, <1 KB):
Procedural sound synthesis in ~500 bytes. Perfect for game sound effects. Includes a web-based sound designer (sfxr.me) for tweaking parameters. ZzFXM adds music playback in ~3 KB. Used extensively in js13kGames.

```javascript
// ZzFX explosion sound - tweak at sfxr.me
zzfx(...[,,925,.04,.3,.6,1,.3,,6.27,-184,.09,.17]); // Explosion
zzfx(...[,,537,.02,.02,.22,1,1.59,-6.98,4.97]); // Pickup
```

**Assessment:** For Simon's game, raw Web Audio API is the right choice -- it's the most educational, the most controllable, and adds zero bytes. ZzFX is worth knowing about for future projects or if Simon wants preset-quality sound effects with minimal code.

---

## Recommendation

**Stay with raw Canvas 2D + raw Web Audio API.** Here's why:

1. **The game is 50 dots and some circles.** Canvas 2D renders this in under 1ms per frame. No framework will make this faster.

2. **Single HTML file constraint.** Every framework adds CDN latency and a large script parse. The current game loads instantly.

3. **Learning value.** Building the audio system, particle pooling, and juice effects from scratch teaches more than any framework abstraction.

4. **The only real gaps in the current code are implementation patterns, not missing infrastructure.** The game needs:
   - Better particle pooling (object pool instead of array push/filter)
   - Web Audio integration (see blueprint below)
   - Screen shake (a 20-line `ctx.translate()` wrapper)
   - Visual juice (easing functions, glow effects)

None of these require a framework.

**If the game scope grew dramatically** (multiple levels, sprite-based enemies, complex UI), the first framework to reach for would be **Kontra.js** for its minimal footprint, or **Phaser** if it became a full-featured game.

---

## Web Audio Implementation Blueprint

### Architecture Overview

```
AudioContext
  |
  +-- masterGain (volume control)
       |
       +-- compressor (DynamicsCompressorNode, prevents clipping)
            |
            +-- dry signal --> destination
            |
            +-- wet signal --> delayNode --> feedbackGain --> destination
            |
            +-- wet signal --> convolverNode (reverb) --> reverbGain --> destination
```

### Oscillator & Envelope Design

#### Which Oscillator Type?

For musical game feedback, each waveform has a character:

| Type | Character | Best For |
|------|-----------|----------|
| `sine` | Pure, clean, bell-like | Gentle melodic tones, meditation games |
| `triangle` | Warm, slightly hollow | Retro/chiptune melodies, soft game feedback |
| `square` | Bright, hollow, buzzy | 8-bit game sounds, prominent melodies |
| `sawtooth` | Rich, harsh, full harmonics | Lead synth sounds, aggressive feedback |

**Recommendation for chain reaction:** Use `triangle` as the primary oscillator. It's warm enough to sound musical but clean enough that 10+ simultaneous notes don't turn to mush. Layer a quiet `sine` one octave up for shimmer.

#### ADSR Envelope Implementation

```javascript
class NotePlayer {
  constructor(audioCtx, destination) {
    this.ctx = audioCtx;
    this.dest = destination;
  }

  /**
   * Play a note with full ADSR envelope.
   * @param {number} freq - Frequency in Hz
   * @param {object} opts - Envelope and sound options
   */
  play(freq, opts = {}) {
    const {
      attack = 0.01,   // seconds to reach peak
      decay = 0.1,     // seconds to fall to sustain
      sustain = 0.3,   // gain level (0-1) during sustain
      release = 0.3,   // seconds to fade to silence
      sustainTime = 0.1, // how long to hold sustain
      volume = 0.15,   // peak gain
      type = 'triangle' // oscillator type
    } = opts;

    const now = this.ctx.currentTime;

    // Create oscillator
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    // Create gain for envelope
    const env = this.ctx.createGain();

    // CRITICAL: Start at 0 to avoid click
    env.gain.setValueAtTime(0.0001, now);

    // Attack: ramp to peak
    env.gain.linearRampToValueAtTime(volume, now + attack);

    // Decay: fall to sustain level
    env.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

    // Sustain: hold level (implicit -- the value stays)

    // Release: fade to silence
    const releaseStart = now + attack + decay + sustainTime;
    env.gain.setValueAtTime(volume * sustain, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    // Connect and play
    osc.connect(env);
    env.connect(this.dest);
    osc.start(now);
    osc.stop(releaseStart + release + 0.01);

    // Clean up when done
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };

    return { osc, env, endTime: releaseStart + release };
  }
}
```

**Key anti-click patterns used above:**
- Start gain at `0.0001` not `0` (exponentialRamp cannot target 0)
- Use `setValueAtTime()` before any ramp (establishes the "from" value)
- Stop the oscillator slightly after the envelope ends
- Clean up nodes in `onended` to prevent memory leaks

---

### Pentatonic Scale Generation

The pentatonic scale uses 5 notes per octave. The intervals (in semitones from root) are: 0, 2, 4, 7, 9.

```javascript
/**
 * Generate a pentatonic scale frequency table.
 * Maps any continuous value (like Y position) to a musical note.
 *
 * @param {string} root - Root note, e.g. 'C4', 'A3'
 * @param {number} octaves - How many octaves to span
 * @returns {number[]} Array of frequencies in Hz
 */
function generatePentatonicScale(rootFreq = 261.63, octaves = 3) {
  // Pentatonic intervals in semitones: 0, 2, 4, 7, 9
  const intervals = [0, 2, 4, 7, 9];
  const frequencies = [];

  for (let oct = 0; oct < octaves; oct++) {
    for (const semitone of intervals) {
      // Equal temperament: freq = root * 2^(semitone/12)
      const totalSemitones = semitone + (oct * 12);
      frequencies.push(rootFreq * Math.pow(2, totalSemitones / 12));
    }
  }

  return frequencies;
}

// Common root frequencies
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
};

// Generate scale: C pentatonic across 3 octaves (15 notes)
const scale = generatePentatonicScale(NOTES.C3, 3);
// [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, ...]

/**
 * Map a Y position on screen to a frequency.
 * Top of screen = high note, bottom = low note.
 */
function yToFrequency(y, canvasHeight, scale) {
  // Invert: y=0 (top) should be highest note
  const normalized = 1 - (y / canvasHeight);
  const index = Math.floor(normalized * (scale.length - 1));
  return scale[Math.max(0, Math.min(scale.length - 1, index))];
}
```

**Why pentatonic?** Any two notes in a pentatonic scale sound consonant together. This means chain reactions -- where many notes fire simultaneously -- always sound musical, never dissonant. This is the same principle used in wind chimes and music boxes.

**Extended: Minor pentatonic** for a moodier feel, use intervals [0, 3, 5, 7, 10]:

```javascript
function generateMinorPentatonic(rootFreq = 261.63, octaves = 3) {
  const intervals = [0, 3, 5, 7, 10]; // minor pentatonic
  const frequencies = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (const semitone of intervals) {
      frequencies.push(rootFreq * Math.pow(2, (semitone + oct * 12) / 12));
    }
  }
  return frequencies;
}
```

---

### Scheduling & Timing

For a chain reaction game, precise timing matters. Explosions cascade over multiple frames, and each should trigger a note at exactly the right moment.

#### The Lookahead Scheduling Pattern

Don't rely on `setTimeout` or `requestAnimationFrame` for audio timing. They're too imprecise (can jitter by 16ms+). Instead, schedule audio events ahead of time using the AudioContext's high-resolution clock.

```javascript
class AudioScheduler {
  constructor(audioCtx) {
    this.ctx = audioCtx;
    this.scheduled = [];
  }

  /**
   * Schedule a note to play at a specific AudioContext time.
   * Call this from your game loop.
   */
  scheduleNote(freq, time, opts = {}) {
    const { volume = 0.15, attack = 0.005, decay = 0.08,
            sustain = 0.3, release = 0.2, sustainTime = 0.05 } = opts;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(volume, time + attack);
    env.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

    const releaseStart = time + attack + decay + sustainTime;
    env.gain.setValueAtTime(volume * sustain, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    osc.connect(env);
    env.connect(this.dest);
    osc.start(time);
    osc.stop(releaseStart + release + 0.01);

    osc.onended = () => { osc.disconnect(); env.disconnect(); };
  }
}
```

In practice, for Simon's game, the simplest approach is fine: just call `notePlayer.play(freq)` in the explosion callback. The `currentTime` property of AudioContext provides sub-millisecond precision, and since notes are triggered by game events (not a rhythmic sequence), there's no need for lookahead scheduling. The lookahead pattern becomes important if you add a musical sequencer or rhythm game elements.

---

### Effects (Reverb, Delay)

#### Simple Delay (Echo) Effect

A delay creates a spacious, ethereal feel that complements chain reactions beautifully -- each explosion's note echoes and fades.

```javascript
function createDelayEffect(audioCtx, delayTime = 0.3, feedback = 0.4, wetLevel = 0.3) {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const delay = audioCtx.createDelay(2.0); // max 2 seconds
  const feedbackGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();
  const dryGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  delay.delayTime.value = delayTime;
  feedbackGain.gain.value = feedback;
  wetGain.gain.value = wetLevel;
  dryGain.gain.value = 1.0;

  // High-cut filter on feedback loop (delays naturally darken)
  filter.type = 'lowpass';
  filter.frequency.value = 3000;

  // Dry path
  input.connect(dryGain);
  dryGain.connect(output);

  // Wet path (delay with filtered feedback)
  input.connect(delay);
  delay.connect(filter);
  filter.connect(feedbackGain);
  feedbackGain.connect(delay); // feedback loop
  delay.connect(wetGain);
  wetGain.connect(output);

  return { input, output };
}
```

#### Algorithmic Reverb (No Impulse Response File Needed)

Loading an impulse response file breaks the single-file constraint. Instead, generate one programmatically:

```javascript
/**
 * Generate a synthetic impulse response for convolution reverb.
 * Based on the reverbGen approach: exponentially decaying filtered noise.
 *
 * @param {AudioContext} audioCtx
 * @param {number} duration - Reverb tail length in seconds
 * @param {number} decay - Decay rate (higher = faster decay)
 * @param {number} lpFreq - Lowpass filter cutoff frequency
 * @returns {AudioBuffer}
 */
function generateReverbIR(audioCtx, duration = 2, decay = 3, lpFreq = 5000) {
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioCtx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Exponentially decaying white noise
      data[i] = (Math.random() * 2 - 1) * Math.exp(-decay * t);
    }
  }

  return buffer;
}

/**
 * Create a convolution reverb node with generated IR.
 */
function createReverb(audioCtx, opts = {}) {
  const { duration = 1.5, decay = 3.5, mix = 0.2 } = opts;

  const convolver = audioCtx.createConvolver();
  convolver.buffer = generateReverbIR(audioCtx, duration, decay);

  const wetGain = audioCtx.createGain();
  const dryGain = audioCtx.createGain();
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();

  wetGain.gain.value = mix;
  dryGain.gain.value = 1.0;

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(output);

  return { input, output, convolver, wetGain, dryGain };
}
```

**Tuning guide for the reverb:**
- `duration: 0.5, decay: 6` = tight room, subtle ambience
- `duration: 1.5, decay: 3.5` = medium hall, good for game (recommended starting point)
- `duration: 3, decay: 1.5` = cathedral, very spacious (may wash out rapid chains)
- `mix: 0.15-0.25` keeps reverb as ambience without drowning the dry signal

---

### Complete Audio Engine for the Game

Putting it all together into a single class that Simon can drop into index.html:

```javascript
class ChainAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.delay = null;
    this.reverb = null;
    this.scale = [];
    this.initialized = false;
  }

  /**
   * Must be called from a user gesture (click/touch).
   */
  init() {
    if (this.initialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;

    // Compressor to prevent clipping during chain reactions
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 8;

    // Delay effect
    this.delay = this._createDelay(0.25, 0.3, 0.25);

    // Reverb effect
    this.reverb = this._createReverb(1.5, 3.5, 0.2);

    // Signal chain: masterGain -> compressor -> effects -> destination
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.delay.input);
    this.delay.output.connect(this.reverb.input);
    this.reverb.output.connect(this.ctx.destination);

    // Generate pentatonic scale (C major pentatonic, 3 octaves)
    this.scale = this._generateScale(130.81, 3); // C3 root

    this.initialized = true;
  }

  /**
   * Resume AudioContext if suspended (call on user interaction).
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play a note based on Y position.
   * @param {number} y - Y coordinate of explosion
   * @param {number} canvasHeight - Canvas height for normalization
   * @param {number} chainDepth - How deep in the chain (affects volume/character)
   */
  playNote(y, canvasHeight, chainDepth = 0) {
    if (!this.initialized) return;

    const freq = this._yToFreq(y, canvasHeight);

    // Deeper chains get slightly quieter to prevent wall of sound
    const volume = Math.max(0.05, 0.18 - chainDepth * 0.01);

    // Faster attack for initial tap, gentler for chain reactions
    const attack = chainDepth === 0 ? 0.005 : 0.02;

    this._playNote(freq, {
      volume,
      attack,
      decay: 0.08,
      sustain: 0.25,
      sustainTime: 0.05,
      release: 0.3 + chainDepth * 0.05, // longer tail for deeper chains
      type: 'triangle'
    });

    // Optional: add a quiet octave shimmer
    if (chainDepth < 3) {
      this._playNote(freq * 2, {
        volume: volume * 0.15,
        attack: 0.01,
        decay: 0.05,
        sustain: 0.1,
        sustainTime: 0.02,
        release: 0.2,
        type: 'sine'
      });
    }
  }

  _playNote(freq, opts) {
    const now = this.ctx.currentTime;
    const { volume, attack, decay, sustain, sustainTime, release, type } = opts;

    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(volume, now + attack);
    env.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

    const releaseStart = now + attack + decay + sustainTime;
    env.gain.setValueAtTime(volume * sustain, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(releaseStart + release + 0.05);

    osc.onended = () => { osc.disconnect(); env.disconnect(); };
  }

  _yToFreq(y, height) {
    const normalized = 1 - (y / height); // top = high, bottom = low
    const index = Math.floor(normalized * (this.scale.length - 1));
    return this.scale[Math.max(0, Math.min(this.scale.length - 1, index))];
  }

  _generateScale(rootFreq, octaves) {
    const intervals = [0, 2, 4, 7, 9]; // major pentatonic
    const freqs = [];
    for (let oct = 0; oct < octaves; oct++) {
      for (const semi of intervals) {
        freqs.push(rootFreq * Math.pow(2, (semi + oct * 12) / 12));
      }
    }
    return freqs;
  }

  _createDelay(time, feedback, wet) {
    const input = this.ctx.createGain();
    const output = this.ctx.createGain();
    const delay = this.ctx.createDelay(2.0);
    const fb = this.ctx.createGain();
    const wetGain = this.ctx.createGain();
    const dryGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    delay.delayTime.value = time;
    fb.gain.value = feedback;
    wetGain.gain.value = wet;
    dryGain.gain.value = 1.0;
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    input.connect(dryGain).connect(output);
    input.connect(delay).connect(filter).connect(fb).connect(delay);
    delay.connect(wetGain).connect(output);

    return { input, output };
  }

  _createReverb(duration, decay, mix) {
    const ir = this._generateIR(duration, decay);
    const convolver = this.ctx.createConvolver();
    convolver.buffer = ir;

    const input = this.ctx.createGain();
    const output = this.ctx.createGain();
    const wetGain = this.ctx.createGain();
    const dryGain = this.ctx.createGain();

    wetGain.gain.value = mix;
    dryGain.gain.value = 1.0;

    input.connect(dryGain).connect(output);
    input.connect(convolver).connect(wetGain).connect(output);

    return { input, output };
  }

  _generateIR(duration, decay) {
    const rate = this.ctx.sampleRate;
    const len = rate * duration;
    const buf = this.ctx.createBuffer(2, len, rate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-decay * (i / rate));
      }
    }
    return buf;
  }
}
```

### Avoiding Common Pitfalls

**1. The Click/Pop Problem**

Clicks happen when gain changes instantaneously. Always ramp:

```javascript
// BAD: instant gain change = click
gainNode.gain.value = 0;

// GOOD: ramp to silence over ~5ms
gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.005);
```

**2. The `exponentialRampToValueAtTime(0)` Crash**

Exponential ramps cannot target 0 (mathematically, you can never reach 0 by multiplying). Use `0.0001` instead. For linear ramps, 0 is fine.

**3. The "ramp from nothing" Bug**

Ramps interpolate from the *last scheduled* value. If no value is scheduled, behavior is undefined. Always call `setValueAtTime()` before any ramp:

```javascript
// BAD: where does the ramp start?
gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);

// GOOD: explicit start point
gain.setValueAtTime(0, ctx.currentTime);
gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
```

**4. Node Garbage Collection**

Disconnected nodes are garbage collected. Connected nodes are not, even if they're "done" playing. Always disconnect in `onended`:

```javascript
osc.onended = () => {
  osc.disconnect();
  gainNode.disconnect();
};
```

**5. Too Many Simultaneous Oscillators**

A big chain reaction might trigger 30+ notes in rapid succession. Use a `DynamicsCompressorNode` at the end of your signal chain to prevent clipping, and reduce volume for deeper chain levels. Cap the maximum number of simultaneous voices if needed (e.g., stop creating new oscillators past 20 active ones).

**6. AudioContext State on Mobile**

Mobile browsers are stricter about user gestures. The safest pattern:

```javascript
// Create context early (will be suspended)
const audio = new ChainAudio();

// Resume on FIRST user interaction
function onFirstInteraction() {
  audio.init();
  audio.resume();
  document.removeEventListener('touchstart', onFirstInteraction);
  document.removeEventListener('click', onFirstInteraction);
}
document.addEventListener('touchstart', onFirstInteraction);
document.addEventListener('click', onFirstInteraction);
```

---

## Canvas 2D Performance Patterns

### Object Pooling for Particles

The current game creates and filters particles every frame, causing GC pressure. Use a pool:

```javascript
class ParticlePool {
  constructor(maxSize = 500) {
    // Pre-allocate all particles as a flat typed structure
    this.x = new Float32Array(maxSize);
    this.y = new Float32Array(maxSize);
    this.vx = new Float32Array(maxSize);
    this.vy = new Float32Array(maxSize);
    this.life = new Float32Array(maxSize);
    this.maxLife = new Float32Array(maxSize);
    this.hue = new Float32Array(maxSize);
    this.count = 0;
    this.maxSize = maxSize;
  }

  spawn(x, y, vx, vy, life, hue) {
    if (this.count >= this.maxSize) return;
    const i = this.count;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.hue[i] = hue;
    this.count++;
  }

  update() {
    let i = 0;
    while (i < this.count) {
      this.x[i] += this.vx[i];
      this.y[i] += this.vy[i];
      this.vx[i] *= 0.95;
      this.vy[i] *= 0.95;
      this.life[i]--;

      if (this.life[i] <= 0) {
        // Swap with last and shrink (no splice, no filter, no GC)
        this.count--;
        this.x[i] = this.x[this.count];
        this.y[i] = this.y[this.count];
        this.vx[i] = this.vx[this.count];
        this.vy[i] = this.vy[this.count];
        this.life[i] = this.life[this.count];
        this.maxLife[i] = this.maxLife[this.count];
        this.hue[i] = this.hue[this.count];
        // Don't increment i -- re-check swapped particle
      } else {
        i++;
      }
    }
  }

  draw(ctx) {
    // Batch by approximate color to minimize fillStyle changes
    for (let i = 0; i < this.count; i++) {
      const alpha = this.life[i] / this.maxLife[i];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${this.hue[i]}, 100%, 60%)`;
      ctx.fillRect(this.x[i] - 1.5, this.y[i] - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}
```

**Performance notes:**
- `Float32Array` avoids object overhead; data is contiguous in memory
- Swap-with-last removal is O(1) instead of Array.filter()'s O(n)
- `fillRect` is faster than `arc()` + `fill()` for tiny particles (no path computation)
- Grouping by color reduces `fillStyle` changes (expensive canvas state change)

### Minimize Canvas State Changes

```javascript
// BAD: sets fillStyle 50 times
dots.forEach(dot => {
  ctx.fillStyle = `rgba(100, 181, 246, ${dot.glow})`;
  ctx.beginPath();
  ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
  ctx.fill();
});

// BETTER: batch all dots, one path, if same color
ctx.fillStyle = 'rgba(100, 181, 246, 0.8)';
ctx.beginPath();
dots.forEach(dot => {
  if (!dot.active) return;
  ctx.moveTo(dot.x + 6, dot.y);
  ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
});
ctx.fill();
```

Using `moveTo` before each `arc` prevents unintended lines between circles. A single `fill()` call for all dots is significantly faster than 50 individual `fill()` calls.

### Screen Shake

Minimal implementation using canvas transform:

```javascript
class ScreenShake {
  constructor() {
    this.trauma = 0;  // 0 to 1
    this.decay = 0.92; // trauma reduces per frame
    this.maxOffset = 15;
    this.maxAngle = 0.05; // radians
  }

  add(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update() {
    this.trauma *= this.decay;
    if (this.trauma < 0.001) this.trauma = 0;
  }

  apply(ctx) {
    if (this.trauma === 0) return;

    // Use trauma^2 for a more natural feel (Squirrel Eiserloh GDC talk)
    const shake = this.trauma * this.trauma;

    const offsetX = (Math.random() * 2 - 1) * this.maxOffset * shake;
    const offsetY = (Math.random() * 2 - 1) * this.maxOffset * shake;
    const angle = (Math.random() * 2 - 1) * this.maxAngle * shake;

    ctx.translate(offsetX, offsetY);
    ctx.rotate(angle);
  }

  reset(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to identity matrix
  }
}

// Usage in game loop:
function draw() {
  shake.update();

  ctx.save();
  shake.apply(ctx);

  // ... draw everything ...

  ctx.restore();
  shake.reset(ctx); // belt and suspenders
}

// Trigger on explosion:
function onExplosion(chainDepth) {
  shake.add(0.15 + chainDepth * 0.05);
}
```

### Glow / Bloom Effect

Canvas 2D has `shadowBlur` which creates a glow effect. It's expensive, so use it sparingly:

```javascript
// Draw explosion with glow
function drawExplosionGlow(ctx, x, y, radius, alpha) {
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = `rgba(255, 107, 107, ${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
  ctx.fill();
  ctx.restore();
}
```

For a cheaper glow, use radial gradients:

```javascript
function drawCheapGlow(ctx, x, y, radius, color, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
  gradient.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
```

### Easing Functions for Juice

```javascript
const ease = {
  // Smooth deceleration
  outCubic: t => 1 - Math.pow(1 - t, 3),
  // Overshoot then settle
  outBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  // Elastic bounce
  outElastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
  },
  // Exponential deceleration (good for explosion radius)
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};

// Usage: explosion radius expands with easing
const progress = 1 - (explosion.life / explosion.maxLife);
const easedProgress = ease.outExpo(progress);
const radius = EXPLOSION_RADIUS * easedProgress;
```

---

## Code References

### Chain Reaction Game Implementations

- **aolde/chain-reaction** (https://github.com/aolde/chain-reaction) -- HTML5 Canvas chain reaction game. MIT licensed. Basic implementation with bouncing balls and explosion chaining. Good reference for the core mechanic.

- **grayyeargin/Chain-Reaction** (https://github.com/grayyeargin/Chain-Reaction) -- Another Canvas-based implementation. Bouncing balls model where you place one explosion and watch the chain propagate.

- **yvoschaap.com/chainrxn** (https://yvoschaap.com/chainrxn/) -- The original Chain Rxn browser game that inspired many clones. The canonical reference for this game genre.

### Generative Audio in Browser Games

- **Red Blob Games WebAudio Experiments** (https://www.redblobgames.com/x/1618-webaudio/) -- Amit Patel's experiments with oscillators, ADSR envelopes, tremolo, vibrato, and custom waveforms. Excellent annotated code. The source covers the exact patterns needed for game audio synthesis.

- **ZzFX** (https://github.com/KilledByAPixel/ZzFX) -- Tiny (<1KB) procedural sound effect generator. The sound designer at https://sfxr.me lets you design sounds visually, then export as a single function call. Ideal for adding quick explosion/pickup/impact sounds.

- **ZzFXM** (https://github.com/keithclark/ZzFXM) -- Companion music renderer (~3KB). Tracker-style music composition for size-limited games.

- **jsfxr** (https://github.com/chr15m/jsfxr) -- JavaScript port of sfxr. Generates retro 8-bit sound effects. Web interface at https://sfxr.me for designing sounds.

- **Tone.js** (https://tonejs.github.io/) -- Full Web Audio framework. Overkill for this game but excellent documentation on synthesis patterns that can be adapted to raw Web Audio.

### Particle Systems and Visual Effects

- **sparticles** (https://github.com/simeydotme/sparticles) -- Lightweight Canvas particle system. Good reference for efficient particle rendering patterns.

- **Particle Engine by Jason Mayes** (https://github.com/jasonmayes/Particle-Engine) -- Configurable Canvas 2D particle engine. Works on desktop and mobile. Study the rendering loop for optimization patterns.

- **screen-shake** (https://github.com/sajmoni/screen-shake) -- 700-byte screen shake library using Perlin noise and trauma-based decay (from the Squirrel Eiserloh GDC talk on game feel). The implementation in this document is based on the same principles.

### Canvas Performance

- **MDN: Optimizing Canvas** (https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- Official guide covering offscreen canvas, batched rendering, integer coordinates, and avoiding unnecessary state changes.

- **web.dev: Improving Canvas Performance** (https://web.dev/canvas-performance/) -- Google's guide to canvas optimization. Covers pre-rendering to offscreen canvas, batch draw calls, and avoiding `shadowBlur`.

- **Game Programming Patterns: Object Pool** (https://gameprogrammingpatterns.com/object-pool.html) -- Robert Nystrom's definitive explanation of the object pool pattern. The particle pool implementation in this document follows these principles.

### Web Audio Deep Dives

- **ADSR Envelopes tutorial** (https://dobrian.github.io/cmp/topics/building-a-synthesizer-with-web-audio-api/4.envelopes.html) -- Complete walkthrough of envelope implementation with `linearRampToValueAtTime`.

- **MDN Web Audio Best Practices** (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- Official guide covering AudioContext creation, autoplay policy, gain ramping, and the scheduling model.

- **reverbGen** (https://github.com/adelespinasse/reverbGen) -- Generates synthetic impulse responses algorithmically. The approach in this document's reverb section is based on the same exponentially-decaying-noise technique from Moorer's "About This Reverberation Business" paper.

- **IRCAM Web Audio Scheduling Tutorial** (https://ircam-ismm.github.io/webaudio-tutorials/scheduling/timing-and-scheduling.html) -- Deep dive on the lookahead scheduling pattern for precise audio timing.

### js13kGames Resources (Size-Optimized Browser Games)

- **js13kGames Resources** (https://js13kgames.github.io/resources/) -- Curated tools, libraries, and tutorials for building games in under 13KB. Includes links to Kontra.js, ZzFX, Tiny-Canvas (2KB WebGL renderer), and other micro-libraries.

- **2024 Winners** (https://js13kgames.com/2024/blog/winners-announced) -- All entries include source code on GitHub. Study winners like "13th Floor" and "Coup Ahoo" for audio synthesis, canvas rendering, and compression techniques that fit entire games into 13KB.

- **2025 Winners** (https://js13kgames.com/2025/blog/winners-announced) -- "CLAWSTRIKE" and "Cat Survivors" for modern techniques. Source code available on GitHub for all 197 entries.
