# Chain Reaction: Design Spec

## 1. Vision

A one-tap chain reaction game where every cascade composes a unique melody. One tap per level. Dots drift across a dark field; the player watches, reads the density, chooses a moment, and taps. The explosion cascades outward, each detonating dot playing a pentatonic note mapped to its Y position. The chain reaction IS the music. Simple, contemplative, satisfying -- and grounded in research from every chain reaction game, music game, and game-feel talk worth studying.

## 2. Player Experience

*What it feels like to play, second by second. This is the quality bar -- if the finished game doesn't match these moments, something is wrong.*

### First Open (0-500ms)

The screen is near-black (`#0a0a1a`). Over 400ms, ten small dots fade in, each pulsing gently like a slow heartbeat. Dots near the top glow cyan (`hsl(200, 80%, 60%)`); dots near the bottom glow warm amber (`hsl(40, 80%, 60%)`). They drift slowly across the field, bouncing off edges. The field shimmers asynchronously -- each dot's pulse started at a random phase.

Center text, white, no button:

> **Chain Reaction**
> *Tap to start a chain. Hit 3 to clear.*

No menu. The game IS the start screen. No sound yet -- silence is intentional. The AudioContext hasn't been created. The first tap births both the explosion and the audio system.

### First Tap (0-2s after tap)

The player taps near a cluster of dots in the lower-center.

- **0ms:** AudioContext initializes. The tap dot turns white and scales from 6px to 10px (easeOutBack, slight overshoot). A hit-freeze: physics pauses for 3 frames (50ms) while the screen holds still. Audio is NOT frozen -- the first note plays immediately.
- **50ms:** The freeze ends. The explosion ring expands outward using easeOutExpo.
- **50ms:** The note plays. At this Y position, it's G3 (196 Hz) -- a warm triangle-wave tone with a 5ms attack, 80ms decay, 300ms release. Through reverb (1.5s tail) and delay (150ms echo), it acquires a gentle cathedral quality. A quiet sine shimmer at G4 (392 Hz, 12% volume) adds brightness.

The player hears something closer to a marimba with a cathedral echo than a beep. This single reverberating note is the moment they understand: this game makes music.

- **50-300ms:** Twelve burst particles erupt radially. Four drift particles float upward. Two spark particles streak out and vanish. All in additive blend mode, creating bright hotspots where they overlap. Color matches the dot's warm amber pitch-color.

### First Chain Cascade (2-5s)

The tap caught two dots. Those detonate 100ms later (+/-20ms jitter), catching two more, which catch one more. A five-dot chain.

- **Generation 0 (0ms):** G3 (196 Hz)
- **Generation 1 (~100ms):** Two dots at 85ms and 115ms -- A3 (220 Hz) and C4 (261.6 Hz). Perceived as a quick melodic pair, not a chord.
- **Generation 2 (~210ms):** E4 (329.6 Hz). The melody so far: G3, A3-C4, E4 -- an ascending pentatonic run that sounds like a kalimba lullaby.
- **Generation 3 (~320ms):** G4 (392 Hz). The melody has risen into the middle register.
- **Generation 4 (~450ms):** A4 (440 Hz) or C5 (523 Hz). The chain ends on bright high notes.

The release tails overlap, creating a pentatonic chord that rings for 1.5 seconds. Screen shake accumulated to ~1.4px displacement -- visible but gentle. The cascade itself was the reward.

### First Failure

Level 3. Twenty dots, target ten. The player watches for two seconds (no timer), identifies a cluster, taps. The chain cascades through six dots -- a beautiful descending phrase, E5-D5-C5-G4. Then silence. The ring expands through empty space and fades. Fourteen dots remain, pulsing gently.

Two of those dots were *just* outside the explosion radius. The game highlights them with a dim red outline pulse (100ms on, 200ms off) and shows: *Chain: 6 / 10 -- 2 dots were close.*

No "Game Over" modal. The chain counter turns muted orange. Remaining dots dim by 30%. The prompt changes to *Tap to try again*. The player taps anywhere, dots regenerate in a new layout, 300ms fade-out, 400ms fade-in. The barrier between failure and retry is zero.

The emotion: not frustration. The chain sounded beautiful. But those two red-pulsing dots create a specific, actionable thought: "aim more toward the center of that cluster." The finger moves before the thought completes.

### First Level Clear

Level 2. Fifteen dots, target six. A seven-dot chain cascades through, ascending from D3 to A4. Screen shake reaches 2.6px.

The last note (A4) gets extended sustain -- 400ms sustain, 1200ms release. It hangs in the air. 200ms after the last detonation, the game enters slow-motion (0.5x speed for 400ms). The remaining eight dots each emit a gentle radial particle burst in their pitch color. The background pulses from `#0a0a1a` to `#1a1a3a`. A final chord -- the last three chain notes replayed as sustained sines at 60% volume, held for 1.5s with long release.

Text fades in: *Level 2 Clear / Chain: 7 / 6*. Below: *Tap for next level*. The chord and reverb decay. Particles float up and fade. The player sits in quiet afterglow.

The celebration is unmistakable but not garish -- appropriate for the contemplative tone.

### Level 5 -- Strategic Play

Thirty dots. Target twenty (67%). The player can no longer succeed by tapping the first cluster they see.

Before tapping, the player studies for 5-15 seconds. They're looking for *bridges* -- not just clusters but connected corridors where each dot is within explosion radius of the next, snaking across the screen. They've learned from Levels 3-4 that tight clusters produce short chords (4-5 simultaneous notes), but long thin chains produce ascending melodies (12+ sequential notes). They chase the melody.

The pitch colors help: warm orange at bottom, teal at top. A bottom-to-top chain path will produce an ascending melody. The player traces the network, identifies a diagonal string with a side branch connected by a bridge dot. They commit.

The chain cascades through 19 dots. An ascending pentatonic phrase with a rhythmic staccato from the side cluster. Target was 20. Near-miss: one dot pulsed red, within 125% of the explosion radius. The player taps to retry. They want to hear what a 20-dot chain sounds like.

### Level 12 -- Mastery

Sixty dots. Target: fifty-eight. The field is a constellation of color. The player has spent 45 minutes across sessions. They understand the system completely.

At this density, almost every dot neighbors at least two others. The player is not looking for a good chain -- they're identifying the TWO most isolated dots that will NOT be caught, then working backward to find the tap position whose chain excludes only those two.

They commit. The cascade plays out over 2.5-3.5 seconds. Generation 0: a single bass note. Generation 1: four notes bloom into a chord. Generations 2-5: the wave fans out in three directions, each producing its own micro-melody. Generations 6-8: 45 dots caught, the screen alive with overlapping rings, hundreds of particles in additive blend, 10px screen shake. The audio is a continuously evolving pentatonic soundscape -- layered oscillators at different decay stages, the compressor keeping it musical. Generations 9-11: the final stragglers, each a single clear note against the fading wash.

58 of 60. Two dots remain, pulsing alone in their corners. Slow-motion at 0.3x speed. A sustained five-note pentatonic chord builds and holds for 2.5 seconds. Particles from all detonation sites float upward in a rising curtain of colored light.

*Level 12 Clear / Chain: 58 / 58 / All levels complete.*

The emotion: quiet satisfaction. Not triumph -- the specific pleasure of understanding a system so deeply that you can produce beauty from it with a single gesture.

## 3. Tech Stack

**Stay with raw Canvas 2D + raw Web Audio API.**

The game draws 60 dots, some expanding rings, and particles. Canvas 2D renders this in under 1ms per frame. Every framework evaluated (Phaser at 980KB, PixiJS at 500KB, p5.js at 1MB) adds CDN latency and parse time for functionality this game doesn't need.

The only gaps in the current code are implementation patterns, not missing infrastructure:
- Particle pooling (Float32Array struct-of-arrays, swap-with-last removal)
- Web Audio synthesis (triangle oscillators, ADSR envelopes, compressor, delay, reverb)
- Screen shake (20-line ctx.translate wrapper with trauma-based decay)
- Juice (easing functions, additive blending, hit-freeze)

If scope grew dramatically, **Kontra.js** (~5KB gzip, designed for js13kGames) would be the first framework to reach for. Otherwise, raw is right.

**Single-file constraint preserved.** No build step, no bundler, no external assets. Everything inlined in index.html. Deployed as static nginx container.

See `research/tech-notes.md` for the full framework comparison, Web Audio implementation blueprint with copy-paste code, and annotated source code references.

## 4. Game Design

### Core Loop

1. Dots drift across a dark field, bouncing off edges
2. Player watches, reads density and chain paths
3. Player taps once -- explosion cascades outward
4. Each detonating dot plays a pentatonic note -- the chain IS the music
5. Chain count evaluated against level target
6. Clear: celebration, advance. Fail: near-miss feedback, instant retry.

### One-Tap Constraint

Each level is a single tap. This is the defining design decision (inherited from Boomshine). It compresses all player agency into choosing WHERE and WHEN to tap. This makes the decision feel weighty. Enforce strictly -- after tap, disable input until chain resolves and level is evaluated.

**No multiple taps.** The current MVP allows repeated tapping. This must be fixed. Multiple taps destroy the constraint that makes the game a game.

### Dot Movement

Dots drift with slow linear movement, bouncing off walls. This is essential for three reasons:
1. It makes the explosion lifecycle matter -- dots can drift INTO active explosions
2. It creates variable outcomes -- same tap position produces different chains on retry
3. It prevents the game from being "solvable" by pattern recognition on static layouts

Parameters:
- Speed: `0.3 + random() * 0.5` px/frame (0.3-0.8 px/frame)
- Direction: random angle per dot, constant
- Wall bounce: reflect off all four edges with 15px margin

### Explosion Lifecycle

The explosion is NOT an instant check. It has phases:

| Phase | Duration | Behavior |
|-------|----------|----------|
| Grow | 300ms | Radius 0 to max, easeOutExpo. Checks for dots every frame. |
| Hold | 1200ms | Full radius, still catching dots (critical for moving dots). |
| Shrink | 500ms | Radius max to 0, easeInQuad. No longer catches dots. |
| **Total** | **2000ms** | |

The hold phase is where dot movement matters -- a dot that drifts into the explosion zone during hold still chains. The shrink phase is where near-misses happen -- watching dots *almost* reach the fading ring is the game's emotional engine.

**Fix from current MVP:** The current code checks for chain reactions only once (at 70% of explosion life). This must change to per-frame checking during grow and hold phases.

### Explosion Radius (Relative, Not Fixed)

```
EXPLOSION_RADIUS = Math.min(canvas.width, canvas.height) * 0.13
```

This yields ~78px on a 600px phone, ~104px on an 800px tablet, ~140px on 1080px desktop. The current fixed 120px is meaningless across screen sizes and must be replaced.

### Scoring

- Each detonated dot scores `10 * (chainDepth + 1)`. Deeper chains = higher multiplier.
- Tapping empty space scores 0 (fix from current MVP which awards 5 points for misses).
- Score reflects chain quality, not tap count.

### What to Cut

- No dot types, multipliers, power-ups, or special abilities
- No preview/undo -- the single irreversible tap IS the design
- No timer -- this is contemplative, not frantic
- No settings screen, no tutorial popups -- Level 1 IS the tutorial
- No leaderboard yet -- local high score only

## 5. Audio Design

### Signal Chain

```
oscillator -> noteGain (ADSR envelope)
  -> masterGain (0.7)
    -> DynamicsCompressorNode (threshold -20dB, knee 10, ratio 8)
      -> delay (time 0.15s, feedback 0.2, wet 0.15, lowpass 3kHz on feedback)
        -> reverb (convolver, generated IR 1.5s, decay 3.5, wet 0.18)
          -> destination
```

### Oscillator Configuration

- Primary waveform: `'triangle'` (warm, cuts through a mix of simultaneous notes without phase-cancellation artifacts that `'sine'` produces at close frequencies)
- Shimmer layer: `'sine'` one octave up, 12% of primary volume, chain depth 0-1 only
- Voice limit: **24 simultaneous oscillators.** When exceeded, steal the oldest voice (5ms linear ramp to 0.0001, then disconnect). Standard synthesizer voice-stealing.

### ADSR Envelope

| Parameter | Player tap (depth 0) | Cascade (depth 1-3) | Deep cascade (depth 4+) |
|-----------|---------------------|---------------------|------------------------|
| Attack | 5ms | 15ms | 15ms |
| Decay | 80ms | 80ms | 60ms |
| Sustain level | 0.25 | 0.25 | 0.20 |
| Sustain time | 50ms | 50ms | 30ms |
| Release | 300ms | 300ms + depth*40ms | 300ms + depth*40ms |
| Peak volume | 0.18 | 0.18 - depth*0.012 | floor at 0.05 |

The player's tap sounds percussive (5ms attack). Chain reactions sound gentler (15ms attack). Deeper chains get quieter and longer-tailed, evolving from percussive attacks to sustained resonance.

### Pentatonic Scale (C Major, 3 Octaves, 15 Notes)

```
C3=130.81  D3=146.83  E3=164.81  G3=196.00  A3=220.00
C4=261.63  D4=293.66  E4=329.63  G4=392.00  A4=440.00
C5=523.25  D5=587.33  E5=659.25  G5=783.99  A5=880.00
```

Y-to-frequency mapping: `index = floor((1 - y/canvasHeight) * 14)`, clamped to [0, 14]. Top of screen = A5 (880 Hz), bottom = C3 (130.81 Hz).

**Why pentatonic:** Any two notes are separated by major 2nd, minor 3rd, perfect 4th, perfect 5th, or major 6th. None are dissonant. Even 15 simultaneous notes produce a rich chord, never a clash. Same principle as wind chimes and music boxes.

**Y-position determines pitch, period.** No forced ascending scales overriding spatial mapping. Ascending melodies emerge naturally when chains propagate upward. The player CAN choose ascending melodies by tapping at the bottom of a chain path. This is player agency, not forced escalation.

### Delay Effect

- Delay time: 0.15s (reduced from typical 0.25s to prevent wash buildup during long chains)
- Feedback: 0.2 (with lowpass filter at 3000Hz on feedback loop -- echoes naturally darken)
- Wet mix: 0.15
- Purpose: gives single notes space and character without accumulating during 30+ note cascades

### Reverb

- Algorithmic impulse response (no external files -- preserves single-file constraint)
- Duration: 1.5s, decay rate: 3.5, wet mix: 0.18
- Generated from exponentially decaying filtered noise (stereo, 48kHz)
- **Generate asynchronously** after AudioContext creation using `setTimeout(fn, 0)` to avoid stalling the first tap by 10-30ms on low-end devices. Until ready, bypass convolver in signal chain.

### Miss Sound

When the player taps empty space (no dot within range):
- Source: white noise via `createBufferSource()` (0.1s buffer of random samples)
- Filter: lowpass BiquadFilterNode, frequency 800Hz, Q 1.0
- Envelope: attack 2ms, release 80ms, peak volume 0.08
- No reverb/delay send (dry and flat, contrasting with musical dot notes)
- Acknowledges the tap without rewarding it musically

### Level-Clear Chord

- Notes: last 3 unique frequencies from the chain
- Waveform: `'sine'` (purer for sustained tones)
- Attack 200ms, sustain 1.5s, release 2.0s, volume 0.15
- Plays simultaneously, overlapping with chain's reverb tail
- Perfect clear: 5 notes instead of 3

### AudioContext Initialization

Create and resume inside the same user gesture handler. On iOS Safari, `new AudioContext()` followed immediately by `ctx.resume()` inside the `touchstart`/`click` callback, before any async operations. This is a strict mobile requirement.

### Anti-Click Patterns

- Start gain at `0.0001`, not `0` (exponentialRamp cannot target zero)
- Always call `setValueAtTime()` before any ramp
- Stop oscillator slightly after envelope ends
- Disconnect nodes in `onended` callback to prevent memory leaks

See `research/tech-notes.md` for the complete ChainAudio class implementation with all patterns applied.

## 6. Visual Design

### Dot Appearance

- Base radius: 6px
- Idle animation: sinusoidal oscillation between 5px and 7px, period 2.5s, random phase per dot
- Fill: `hsl(H, 80%, 60%)` where `H = 200 - (y/canvasHeight) * 180` (top=200 cyan, bottom=20 orange-red)
- Outer ring: same hue, alpha `glow * 0.4`, 1px stroke at radius + 3px
- On detonation: flash white (`hsl(0, 0%, 95%)`), scale from 6px to 10px (easeOutBack, 50ms)

### Explosion Appearance

- Ring stroke: `rgba(255, 140, 80, alpha)` where alpha = 1 - progress, width 2px
- Core fill: `rgba(255, 220, 140, alpha)` at inner 25% of radius
- Expansion: easeOutExpo (fast initial, decelerating)
- Chain-depth color progression: `lightness = min(90, 60 + depth * 5)`, `saturation = max(60, 80 - depth * 3)` -- deeper chains glow brighter and slightly desaturate

### Particle System

**Three particle types per detonation:**

| Type | Count | Speed (px/frame) | Lifetime (frames) | Size (px) | Friction | Gravity |
|------|-------|------|----------|------|---------|---------|
| Burst | 8 | 4-10, radial with 0.4rad jitter | 20-35 | 2-5 | 0.93 | 0.05 |
| Drift | 4-8 | 1-3, random direction | 40-70 | 3-7 | 0.97 | -0.02 (rises) |
| Spark | 0-4 | 8-16, random direction | 8-16 | 1-2 | 0.90 | 0.1 |

**Depth scaling:** depth 4-7 reduces to 6 burst, 3-5 drift, 0-2 sparks. Depth 8+ reduces to 4 burst, 2-3 drift, no sparks.

**Implementation:**
- Pool: 2000 particles, pre-allocated Float32Array struct-of-arrays (x, y, vx, vy, life, maxLife, hue)
- Removal: swap-with-last (O(1), no GC pressure)
- Rendering: `globalCompositeOperation = 'lighter'` (additive blending). Use `fillRect` instead of `arc` for particles under 3px (cheaper, no path computation).
- Color: dot's pitch-color hue, saturation 100%, lightness 60%

**Peak budget:** 60 dots * 20 particles = 1200 at worst case. Canvas 2D handles 2000-5000 simple shapes at 60fps easily.

### Screen Shake

Trauma-based system (Squirrel Eiserloh GDC 2016):

- Trauma per detonation: 0.06
- Trauma cap: 1.0
- Decay: `trauma *= 0.92` per frame (exponential)
- Displacement: `offset = 12 * trauma^2 * (random() * 2 - 1)` pixels
- **Translation only, NO rotation.** Rotation distorts spatial information the player needs to read dot positions.

| Chain size | Trauma | Shake^2 | Displacement | Feel |
|------------|--------|---------|-------------|------|
| 1-3 | 0.06-0.18 | <0.03 | <1px | Barely perceptible |
| 5-8 | 0.30-0.48 | 0.09-0.23 | 1-3px | "Something is happening" |
| 10-15 | 0.60-0.90 | 0.36-0.81 | 4-10px | Exciting |
| 20+ | 1.0 (capped) | 1.0 | 12px | Screen goes wild (rare, thrilling) |

Implementation: `ctx.save(); ctx.translate(shakeX, shakeY); /* draw everything */ ctx.restore();`

### Background

- Default: `#0a0a1a`
- Pulse: on cascade events, lighten via `bgBrightness` (0 to 0.15, decays at `*0.92/frame`)
- `rgb(10 + bgBright*30, 10 + bgBright*20, 26 + bgBright*40)`
- Cache default fill string. Only compute dynamic string when bgBright > 0.001.

### Glow Effects

**DO NOT use `shadowBlur`.** It's extremely expensive on Canvas 2D, especially mobile. Instead:
- Particle glow: additive blending (`'lighter'`) creates bright hotspots at overlaps for free
- Explosion glow: radial gradient from white-yellow center to transparent at radius (GPU-accelerated)

### Easing Functions

```javascript
outExpo:  t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)     // explosion growth
outBack:  t => 1 + 2.70158 * Math.pow(t-1, 3) + 1.70158 * Math.pow(t-1, 2)  // dot detonation scale
outCubic: t => 1 - Math.pow(1 - t, 3)                       // general deceleration
inQuad:   t => t * t                                         // explosion shrink
```

## 7. Level Design

### Progression Table

Based on Boomshine's proven curve (escalating required percentage from 30% to 97%):

| Level | Dots | Target | Required % | Feel |
|-------|------|--------|-----------|------|
| 1 | 10 | 3 | 30% | Tutorial -- almost any tap works |
| 2 | 15 | 6 | 40% | Easy -- find a cluster |
| 3 | 20 | 10 | 50% | First real challenge |
| 4 | 25 | 15 | 60% | Need to read the layout |
| 5 | 30 | 20 | 67% | Strategic -- looking for chain paths |
| 6 | 35 | 24 | 69% | Hard |
| 7 | 40 | 30 | 75% | Very hard |
| 8 | 45 | 36 | 80% | Expert |
| 9 | 50 | 42 | 84% | Near-impossible |
| 10 | 55 | 48 | 87% | Perfect play required |
| 11 | 60 | 54 | 90% | Mastery |
| 12 | 60 | 58 | 97% | Legendary |

### Difficulty Curve Principles

- **Levels 1-2:** Almost impossible to fail. Establish the pattern (tap -> cascade -> celebration) that the player will chase. Peggle applies extra "luck" in early levels for exactly this reason.
- **Levels 3-5:** First real decisions. The player learns to read density, wait for good moments, and trace chain paths.
- **Levels 6-9:** Strategic depth. The player thinks in terms of graph connectivity -- bridges, corridors, isolated nodes.
- **Levels 10-12:** Mastery. The player inverts the problem -- instead of finding which dots to catch, they identify which 2-6 dots they're willing to lose.
- **No sudden cliffs.** Each level's clear rate should be > 50% of the previous level's clear rate.

### Tuning Knobs

The game has three tuning parameters per level:
1. **Dot count** (set per level table above)
2. **Target count** (set per level table above)
3. **Explosion radius** (global: 13% of min canvas dimension)

Additional tuning via:
- **Dot speed** per level (faster dots = harder to read, more variable outcomes)
- **MIN_DOT_DISTANCE** (currently 30px -- controls minimum spacing, affects cluster density)

### Sensitivity Requirement

For each level, the "good zone" around the optimal tap position should be at least 30px wide. If chain length degrades steeply within 10px of optimal, the game feels like pixel-hunting. If it degrades too slowly within 50px, position doesn't matter. Test this during balance validation.

## 8. Validation Suite

*Simon uses these automated tests to verify game quality without human playtesting. All tests run in Node.js (balance) or headless Chrome via Playwright (performance/audio).*

### Test 1: Random Input Simulation

10,000 random taps per level. Measure chain length distribution and clear rate.

| Level | Random Clear Rate PASS | Random Clear Rate FAIL |
|-------|----------------------|----------------------|
| 1 | > 60% | < 40% |
| 2 | > 40% | < 20% |
| 3 | > 25% | < 10% |
| 4 | > 15% | < 5% |
| 5 | > 10% | < 3% |
| 6 | > 7% | < 2% |
| 7 | > 4% | < 1% |
| 8 | > 2% | < 0.5% |
| 9 | > 1% | < 0.2% |
| 10 | > 0.5% | < 0.1% |
| 11 | > 0.2% | < 0.05% |
| 12 | > 0.05% | < 0.01% |

### Test 2: Optimal Play Computation

Grid search (20x20 coarse + 9x9 refinement + test each dot position) to find best tap per layout. 1,000-2,000 iterations per level.

| Level | Optimal Clear Rate PASS | Optimal Clear Rate FAIL |
|-------|------------------------|------------------------|
| 1 | > 95% | < 80% |
| 2 | > 90% | < 75% |
| 3 | > 85% | < 65% |
| 4 | > 80% | < 60% |
| 5 | > 75% | < 55% |
| 6 | > 70% | < 50% |
| 7 | > 65% | < 45% |
| 8 | > 55% | < 35% |
| 9 | > 45% | < 25% |
| 10 | > 35% | < 15% |
| 11 | > 25% | < 10% |
| 12 | > 10% | < 3% |

**Skill gap:** For each level, optimal clear rate must be at least 3x the random clear rate.

### Test 3: Score Distribution

- Coefficient of variation (random scores): CV > 0.30 (outcomes feel varied, not identical)
- Optimal/random score ratio: > 2.0x (skill is rewarded)
- Histogram shape: spread across 5+ bins (not spiked into 2)

### Test 4: Difficulty Curve

- Clear rates monotonically decreasing (5% tolerance for noise)
- No cliff between adjacent levels (each > 50% of previous)
- Skill gap (optimal/random ratio) increases with level (correlation r > 0.7)

### Test 5: Audio Validation

- All dot frequencies are exactly in the pentatonic scale (100%)
- No dissonant interval pairs exist (0 pairs)
- Y-to-frequency mapping is monotonically decreasing (top = high)
- Cascade duration for 10+ chains: 0.5-5.0 seconds

### Test 6: Performance

Headless Chrome (Playwright), peak cascade with all juice effects:

| Metric | PASS | FAIL |
|--------|------|------|
| Average frame time | < 12ms | > 16.67ms |
| Max frame time | < 25ms | > 33ms |
| P95 frame time | < 16.67ms | > 20ms |
| Dropped frames (>20ms) in 5s | < 10 | > 30 |
| Stress test (60 dots simultaneous) | < 14ms avg | > 20ms avg |

### Test 7: Sensitivity Analysis (New)

For each level, measure chain length as tap moves 10px, 20px, 50px from optimal position. The "good zone" must be at least 30px wide. Pixel-hunting games are not fun.

### Quality Gate Summary

| # | Metric | PASS | FAIL |
|---|--------|------|------|
| 1 | L1 random clear | > 60% | < 40% |
| 2 | L6 random clear | > 7% | < 2% |
| 3 | L12 random clear | > 0.05% | < 0.01% |
| 4 | L1 optimal clear | > 95% | < 80% |
| 5 | L6 optimal clear | > 70% | < 50% |
| 6 | L12 optimal clear | 10-50% | < 3% or > 80% |
| 7 | Skill gap increases with level | r > 0.7 | r < 0.3 |
| 8 | Score CV (any level) | > 0.30 | < 0.15 |
| 9 | Score ratio (optimal/random) | > 2.0x | < 1.3x |
| 10 | Difficulty monotonically decreasing | Yes (5% tol.) | No |
| 11 | No cliff between levels | Each > 50% prev | Any < 50% |
| 12 | All frequencies pentatonic | 100% | Any off-scale |
| 13 | No dissonant intervals | 0 pairs | Any pair |
| 14 | Cascade duration (10+ chain) | 0.5-5.0s | < 0.3s or > 8s |
| 15 | Avg frame time at peak | < 12ms | > 16.67ms |
| 16 | Max frame time | < 25ms | > 33ms |
| 17 | P95 frame time | < 16.67ms | > 20ms |
| 18 | Worst-case whiff rate (L7+) | < 2% | > 5% |
| 19 | Optimal chain > 2x target (L1-6) | Yes | No |
| 20 | Tap sensitivity zone width | >= 30px | < 15px |

See `research/validation.md` for the complete test harness implementation (Node.js), Playwright performance tests, simulation algorithms, and utility functions.

## 9. Implementation Order

Ordered by player experience impact with dependencies noted.

### Phase 1: Fix the Core

1. **Enforce one-tap-per-level.** Disable input after tap until chain resolves.
2. **Add dot movement.** 0.3-0.8 px/frame, linear, wall-bouncing.
3. **Implement explosion lifecycle.** 300ms grow + 1200ms hold + 500ms shrink. Per-frame chain detection during grow and hold.
4. **Make explosion radius relative.** 13% of `Math.min(width, height)`.
5. **Add cascade timing stagger.** 100ms base per generation, +/-20ms jitter, 40ms minimum note separation.

### Phase 2: Add Sound

6. **Implement audio engine.** Triangle oscillators, ADSR envelopes, compressor, 24-voice limit with voice stealing.
7. **Add pentatonic Y-position mapping.** 15-note scale, 3 octaves.
8. **Add delay effect.** 0.15s, feedback 0.2, wet 0.15.
9. **Add reverb.** Generated IR, 1.5s duration, async creation.
10. **Add miss sound.** Filtered white noise burst, 80ms.

### Phase 3: Add Juice

11. **Eased explosion scaling.** easeOutExpo grow, easeInQuad shrink.
12. **Screen shake.** Translation only, trauma-based, 0.06/dot, max 12px.
13. **Hit-freeze.** 3 frames on player tap only. Audio fires before freeze.
14. **Upgraded particle system.** Burst/drift/spark, additive blend, Float32Array pool of 2000.
15. **Pitch-mapped dot colors.** HSL hue from Y position, chain-depth progression.
16. **Background color pulse.** Lightens on cascade events, decays at *0.92/frame.

### Phase 4: Add Celebration

17. **Level-clear sequence.** Slow-motion, held chord, background swell, remaining-dot pulses, text overlay.
18. **Perfect-clear celebration.** Additional particle shower, brighter background, 5-note chord.
19. **Near-miss feedback.** Highlight dots within 120% of explosion radius, show count.
20. **Zero-friction retry.** Tap to regenerate, 300ms fade-out, 400ms fade-in, no modal.

### Phase 5: Balance & Validate

21. **Run balance test suite** (Tests 1-5) with updated simulation (movement + relative radius). Tune until all quality gates pass.
22. **Run audio validation** (Test 5). Verify pentatonic correctness and cascade timing.
23. **Run performance stress test** (Test 6). Verify p95 < 16.67ms with all juice active.
24. **Run sensitivity analysis** (Test 7). Verify good-zone width >= 30px per level.

## 10. Anti-Patterns

*Specific things NOT to do, sourced from prior art failures and agent critique.*

1. **Outcomes identical regardless of input.** This is the MVP's #1 problem. The explosion radius and dot spacing must create clear density variation. Good-click chain length should be at least 3x random-click chain length.

2. **No near-miss communication.** Don't just show "Level Failed." Show which dots were *almost* caught and how close they were. Without this, failure feels arbitrary.

3. **Explosion radius too large.** If every tap produces a full chain, there's no game. The radius should be 5-8% of screen width at most (our 13% of min dimension is on the generous side -- tune downward if testing shows low skill gap).

4. **Quantizing note timing to a beat grid.** The organic cascade timing IS the musical character. Quantization (Rez-style) makes sense for layering onto a pre-existing beat track but would make this game's chains sound robotic.

5. **Hit-pause on cascade detonations.** Only freeze on the player's initial tap. Freezing every cascade explosion stretches a 30-dot chain from 2 seconds to 5+ seconds, destroying momentum.

6. **Forced ascending scales.** Let Y-position determine pitch. Let melody emerge from chain topology. Forced ascending sounds identical for every chain.

7. **Density heat map overlay.** Makes optimal tap position obvious, removes spatial reasoning skill, clutters the aesthetic.

8. **`shadowBlur` for glow.** Expensive on Canvas 2D, especially mobile. Use additive blending and radial gradients.

9. **Failure buzzer.** The chain they DID create sounded beautiful. A negative buzzer contradicts "even a failed attempt should produce something beautiful." Visual-only failure communication.

10. **Fixed-pixel explosion radius.** 120px means completely different things on 390px phone and 2560px monitor. Must be relative.

11. **Synchronous reverb IR generation.** 576KB allocation on first tap stalls interaction by 10-30ms on low-end devices. Generate async.

12. **Points for tapping empty space.** Current MVP awards 5 points for misses. Score must reflect chain quality, not tap count.

## 11. References

### Games Studied

| Game | Year | Creator | Key Insight |
|------|------|---------|-------------|
| Boomshine | 2007 | Danny Miller | One-tap constraint, 3s explosion lifecycle, progressive % targets |
| Peggle | 2007 | PopCap Games | Celebration design, ascending audio scales, luck engineering |
| Rez | 2001 | Tetsuya Mizuguchi | Quantization makes anyone feel like a musician |
| Lumines | 2004 | Tetsuya Mizuguchi | Timeline-synced audio, gameplay pacing through music |
| Every Extend Extra | 2006 | Q Entertainment | Chain reactions as music, synesthetic audio treatment |
| Electroplankton | 2005 | Toshio Iwai | Position-based melody (Hanenbow), immediate non-looping response |
| Desert Golfing | 2014 | Justin Smith | Radical minimalism, zero-friction retry, 10-second sessions |
| Osmos | 2009 | Hemisphere Games | One mechanic with cost/benefit trade-off |
| Suika Game | 2023 | Aladdin X | Physics-emergent chains, near-miss tension, viral through spectacle |
| Boomshine Plus | 2022 | Bixense | Special dot types add depth without destroying simplicity |
| Patatap | 2014 | Jono Brandel | 1:1 input-to-audiovisual mapping, pre-designed consonance |
| Incredibox | 2012 | So Far So Good | No failure state, discovery rewards, all outputs valid |
| Otocky | 1987 | Toshio Iwai | Spatial mapping = musical output (the first music game) |

### Talks & Postmortems

- **"Juice It or Lose It"** -- Martin Jonasson & Petri Purho, GDC Europe 2012. 24 juice techniques demonstrated on a breakout clone. Sound alone made the game feel "50% more real."
- **"The Art of Screenshake"** -- Jan Willem Nijman / Vlambeer, INDIGO 2013. Hit-pause (50-200ms per impact), bigger bullets, permanence.
- **"Math for Game Programmers: Juicing Cameras"** -- Squirrel Eiserloh, GDC 2016. Trauma-based shake system (trauma^2 displacement).
- **Peggle Audio** -- PopCap Team, GDC 2015 + Audiokinetic blog. Ascending diatonic scales on peg hits, 48 key/scale combos, RTPC tracking.
- **"Minimalist Game Design: Growing Osmos"** -- Eddy Boxerman, GDC 2010. Connecting player's life/size to propulsion.
- **Peggle "Making Of"** -- PC Gamer. Ode to Joy, the unicorn, and the rainbow were ALL placeholders that stuck. Over-the-top celebration works better than tasteful restraint.
- **Desert Golfing interviews** -- Game Developer. "A game that didn't ruin the mechanic's transcendent pleasure with annoying game-y junk."

### Research References

See `research/prior-art.md` for the full annotated catalog (534 lines), `research/tech-notes.md` for the tech analysis and code blueprints (1066 lines), `research/validation.md` for the complete test suite with implementation code (1339 lines), and `research/experience.md` for the player experience narrative and agent critique (555 lines).

## Design Principles

1. **One tap must matter.** If decisions don't affect outcomes, it's a slot machine.
2. **The cascade IS the reward.** Even a failed attempt should produce something beautiful.
3. **Sound and visuals are inseparable from gameplay.** Strip the audio and the game should feel broken.
4. **The near-miss drives retry.** Players come back because they can SEE what they almost achieved.
5. **Celebrate disproportionately.** The end-of-level moment is the #1 retention mechanic.
6. **Don't ask Tim which direction to go. Pick one, build it, ship it.** If it's wrong he'll say so.

## Dockerfile

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO /dev/null http://localhost:80/ || exit 1
```
