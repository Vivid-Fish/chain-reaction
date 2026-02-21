# Generative Audio in Games — Technical Research

## Date: 2026-02-20

## Goal
Implement a system where chain explosions BUILD the music, not just trigger sound effects.

## Key Games Analyzed

### 1. Rez / Rez Infinite (Mizuguchi, 2001)
**Architecture**: Vertical layering + input quantization.

**Macro level (0-10 layers)**: Destroying data nodes raises layer level. Each level unmutes a pre-composed stem. Layer 0 = kick drum. Layer 10 = full track. All stems are identical-length loops in same key/BPM.

**Micro level (per-action)**: Every shot/impact triggers a pre-recorded sample that is:
- Tonally aligned with the track's key signature
- Quantized to the nearest beat subdivision (likely 16th notes)

**The core innovation — quantization**: When player fires at time T, the sound plays at the nearest beat subdivision, not at T. This is MIDI quantization. Everything sounds rhythmically correct regardless of player timing.

**Music theory**: Same key for all samples. Rhythmic quantization. Call-and-response structure (game provides beat, player provides response).

### 2. Lumines (Mizuguchi/Nakamura, 2004)
**Architecture**: Timeline sweep + skin-specific sample sets.

**The timeline**: Vertical bar moves left-to-right across 16-column playfield, synced to music. One column per eighth note. One full sweep = 2 bars of 4/4 time. Clears happen ONLY when timeline passes — inherently rhythmic.

**Per-action audio**: Block rotation, drop, and clear each trigger skin-specific samples designed to harmonize with the backing track. Different skins = different keys/timbres.

**BPM-locked gameplay**: Drop speed, timeline speed, and music tempo are all the same value. At 90 BPM: ~3 columns/second. At 180 BPM: ~6 columns/second.

### 3. Every Extend Extra (Q Entertainment, 2006) — CLOSEST PRIOR ART
**Architecture**: Chain reaction → ascending pitch.

**Core mechanic**: Player detonates → blast catches enemies → each caught enemy detonates → chain reaction.

**Key innovations**:
- **Ascending pitch per chain link**: Each explosion in a chain plays a note at higher pitch than the previous. A 10-hit chain = ascending scale of explosion sounds. THIS IS THE KEY TECHNIQUE for making chain reactions musical.
- **Beat-synchronized detonation bonus**: Timing detonation to the beat produces bigger explosions. Positive feedback: rhythm-aware play → better gameplay AND better audio.
- **Dynamic tempo via Quickens**: Pickups increase player/enemy/music speed simultaneously.
- **Analog input sonification**: Even stick movement contributes synth sweeps.

### 4. Patatap (Brandel + Lullatone, 2013)
**Architecture**: Web Audio API directly. Two.js for visuals.

**Sound selection**: 26 keys → 26 unique sounds. 13 melodic + 13 percussive (balance prevents muddiness).

**Harmonic guarantee**: Nested pentatonic scales across registers:
- Low register: A pentatonic (A-B-D-E-F#)
- Mid register: E pentatonic (E-F#-A-B-C#)
- High register: B pentatonic (B-C#-E-F#-G#)
- Combined = all notes of A major
- Any subset of pentatonic is consonant → any key combination sounds good

**Space bar** switches palette sets (different timbres, same harmonic compatibility).

### 5. Incredibox (So Far So Good, 2009)
**Architecture**: Pre-composed loop stems of identical length/tempo/key.

**Structure**: 20 sound icons in 4 categories (Beats, Effects, Melodies, Voices). Up to 7 layers simultaneously. All loops within a version share same BPM, key, loop length.

**Technical**: Dragging icon starts loop synced to master clock. Swapping mutes one/starts another at loop boundary. Phase-locked looping.

### 6. 140 (Jeppe Carlsen, 2013)
**Architecture**: Audio-clock-driven game logic (not gameplay-driven audio).

**Key insight**: `AudioSettings.dspTime` (sample-accurate audio clock) drives ALL game events, not the frame clock. Platforms, enemies, obstacles are visualizations of the audio.

**Progression**: Collecting orbs transitions between musical sections, each adding instrumentation. The world is a musical visualization you navigate through.

### 7. Electroplankton (Toshio Iwai, 2005)
**10 distinct interaction-to-sound mappings**:
- **Tracy**: Drawn path = melody (gestural sequencer)
- **Hanenbow**: Bounce angle = pitch, velocity = volume (physics-mapped)
- **Luminaria**: Grid positions = scale degrees, 4 playheads at different speeds (polyrhythm)
- **Nanocarp**: Ripple-based triggering (distance from tap = delay)
- **Marine-Snow**: Permutation sequencer (shuffling grid positions)

## Synthesis: Architecture for Chain-Explosion Music

### Technique 1: Pentatonic Scale Lock
Constrain ALL generated pitches to pentatonic. Any random subset is consonant.
```javascript
const SCALE = [220, 261.6, 293.7, 329.6, 392.0]; // A minor pentatonic
const ALL_NOTES = [];
for (let octave = 0; octave < 4; octave++)
    SCALE.forEach(f => ALL_NOTES.push(f * Math.pow(2, octave)));
```
**We already do this.** Our SCALE_NOTES is C pentatonic across 4 octaves.

### Technique 2: Beat-Grid Quantization (from Rez)
Snap explosion sounds to nearest 16th-note subdivision.
```javascript
const BPM = 80; // our current tempo
const SIXTEENTH = (60 / BPM) / 4; // = 187.5ms

function quantize(time) {
    return Math.round(time / SIXTEENTH) * SIXTEENTH;
}
// Schedule sound at quantized time, not raw explosion time
```
**We DON'T do this.** Sounds play at raw explosion time. This is the single biggest upgrade.

### Technique 3: Ascending Pitch Per Chain Depth (from Every Extend Extra)
Each successive explosion plays next note up in scale. Chain = melodic arpeggio.
**We already do this.** `chainIndex` maps to `SCALE_NOTES[noteIdx]`.

### Technique 4: Vertical Layering (from Rez, Incredibox)
Background stems unmuted by chain length / round number.
```javascript
const stems = {
    kick:    { threshold: 0 },   // always playing
    bass:    { threshold: 3 },   // chain >= 3
    chords:  { threshold: 6 },
    lead:    { threshold: 10 },
    vocals:  { threshold: 15 },
};
```
**We DON'T do this.** We have a single 16-beat arpeggio that ducks during chains. No layered stems.

### Technique 5: Position-to-Pitch Mapping (from Electroplankton)
Y position on screen → note in scale. Higher explosions = higher pitch. Visual chain has melodic contour.
```javascript
function freqFromPosition(y, screenHeight) {
    const idx = Math.floor((1 - y / screenHeight) * ALL_NOTES.length);
    return ALL_NOTES[Math.min(idx, ALL_NOTES.length - 1)];
}
```
**We partially do this** (via chainIndex which correlates with spatial spread, but not directly mapped to Y).

### Technique 6: Ripple-Based Delay (from Electroplankton Nanocarp)
Sound from each chain hit delayed by physical distance from parent explosion. Creates natural arpeggiation.
**We DON'T do this.** All chain sounds play at stagger time (80ms ± 25ms jitter), not distance-based.

## Recommended Combined Architecture for Chain Reaction

```
[Master Clock] ─── 80 BPM transport (AudioContext.currentTime)
       │
       ├── [Background Stems] ─── Looping AudioBufferSourceNodes
       │     └── GainNodes controlled by round number / chain-length thresholds
       │
       ├── [Chain Sound Engine]
       │     ├── Scale: C pentatonic (already have)
       │     ├── Pitch: ascending by chain depth (already have)
       │     ├── Position: Y-mapped for melodic contour (ADD)
       │     ├── Timing: quantized to 16th notes at 80 BPM (ADD)
       │     └── Propagation delay: distance-based (ADD)
       │
       └── [Effects Bus]
             ├── ConvolverNode reverb (already have, 2.0s IR)
             ├── DynamicsCompressor (already have, -18dB threshold)
             ├── Delay (already have, 180ms, 0.25 feedback)
             └── BiquadFilterNode low-pass sweep (ADD — for Supernova activation)
```

## Priority Upgrades

1. **Beat quantization** — highest leverage, easiest to add. Snap chain note timing to 16th-note grid.
2. **Low-pass filter for Supernova** — dramatic audio shift on activation.
3. **Position-to-pitch mapping** — gives visual chain a melodic contour.
4. **Stem layering across rounds** — ambient → beat → full track as player progresses.
5. **Distance-based propagation delay** — natural arpeggiation from spatial chain spread.

## What We Already Have (Strengths)

- Pentatonic scale (consonance guaranteed)
- Ascending pitch per chain depth
- Layered harmonics (main + transient + shimmer + sub + fifth)
- Generation-dependent ADSR envelopes
- 48-voice polyphony with voice stealing
- Delay + reverb processing chain
- Music ducking during chain resolution
- Dynamics compression

The foundation is solid. The gap is: sounds are informational (triggered by events), not musical (quantized to a grid and building a composition). Beat quantization is the bridge.
