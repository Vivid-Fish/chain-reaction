# Fun Maximization & Validation Strategy

## Part 1: Fun Maximization

### Juice Priority List (Ranked by Impact/Effort)

Ranked by bang-for-the-buck in a single-file Canvas 2D + Web Audio game. Effort is measured in approximate lines of code. Impact is based on research from the "Juice It or Lose It" GDC 2012 talk (Jonasson & Purho), Vlambeer's "Art of Screenshake" (Nijman, INDIGO 2013), and Squirrel Eiserloh's trauma-based camera shake (GDC 2016).

| Rank | Feature | Impact | Effort (LOC) | Ratio |
|------|---------|--------|-------------|-------|
| 1 | Cascade timing (staggered detonations) | 10/10 | ~15 | Highest |
| 2 | Sound - pentatonic oscillators with envelope | 9/10 | ~40 | Very High |
| 3 | Eased explosion scaling (not linear) | 8/10 | ~8 | Very High |
| 4 | Screen shake (trauma-based) | 8/10 | ~25 | High |
| 5 | Additive-blend glow on explosions | 7/10 | ~10 | High |
| 6 | Particle burst per detonation (more + better) | 7/10 | ~30 | High |
| 7 | Dot squash/stretch on detonation | 6/10 | ~15 | High |
| 8 | Chain-depth color progression | 6/10 | ~12 | High |
| 9 | Background color pulse with cascade | 5/10 | ~8 | High |
| 10 | Hit-freeze (2-3 frame pause on detonation) | 7/10 | ~6 | Very High |
| 11 | Score pop-up floaters with easing | 5/10 | ~25 | Medium |
| 12 | Trail lines connecting chain path | 5/10 | ~30 | Medium |
| 13 | Level-clear celebration (Peggle moment) | 9/10 | ~60 | Medium |
| 14 | Dot idle animation (breathing/floating) | 3/10 | ~8 | Medium |
| 15 | Background ambient drone | 4/10 | ~20 | Medium |
| 16 | Particle trails on moving particles | 3/10 | ~15 | Low |

**The critical insight from "Juice It or Lose It":** The breakout clone added features in roughly this order, each building on the last:
1. Tweened motion (eased, not linear) -- paddle movement, ball bounce
2. Squash and stretch on impacts
3. Color flash on collision (ball turns white for 2 frames)
4. Ball rotation to indicate direction
5. Ball wobble post-collision (spring oscillation, ~200ms)
6. Ball stretches along velocity vector (scale x by 1.0 + speed*0.02, y inversely)
7. Block destruction animation: shrink (scale 1.0 to 0.0 over 300ms, easeInBack), spin (random 90-360deg), darken, fall offscreen
8. All blocks nudge slightly on any hit (translate 2-4px toward impact, spring back over 150ms)
9. Wall bounce effect ("gummy" deformation, 4px inward, spring back 200ms)
10. Smoke puff particles at collision point (6-10 particles, radial, 150ms lifetime)
11. Sub-block fragment particles from destroyed blocks (4-8 darker-colored squares, gravity-affected)
12. Ball trail (last 5-8 positions, fading opacity)
13. Sound effects: distinct sounds for paddle hit, wall hit, block hit
14. Pitch variation: successive block hits increase pitch (ascending scale)
15. Background music
16. Screen shake on block destruction (intensity scales with combo count)
17. Eyes on ball and paddle (personality, emotional connection)

**The measured/perceived impact hierarchy:**
- Sound alone made the game feel "50% more real" (audience reaction in the talk)
- Tweening + squash/stretch transformed the game from "dead" to "alive"
- Screen shake + particles made it feel "powerful"
- The combination was described as multiplicative, not additive -- layering 3 techniques feels 10x better, not 3x

### Screen Shake Specification

Based on Squirrel Eiserloh's trauma-based system (GDC 2016) adapted for Canvas 2D.

**Core Model:**
```
trauma: float [0.0, 1.0]
shake = trauma^2          // Quadratic mapping: subtle at low trauma, intense at high
```

**Parameters:**
```javascript
const SHAKE_MAX_OFFSET = 15;      // Maximum pixel displacement (x and y)
const SHAKE_MAX_ROTATION = 0.03;  // Maximum rotation in radians (~1.7 degrees)
const SHAKE_DECAY = 0.92;         // Per-frame multiplier (exponential decay)
const SHAKE_TRAUMA_PER_DOT = 0.06; // Trauma added per detonating dot
const SHAKE_TRAUMA_CAP = 1.0;     // Hard cap
```

**Decay curve:** Exponential via per-frame multiplication.
- trauma *= SHAKE_DECAY each frame (at 60fps)
- A single dot detonation (trauma = 0.06) decays to imperceptible (<0.01) in ~70 frames (~1.2 seconds)
- A 10-dot rapid chain (trauma ~= 0.6) produces shake^2 = 0.36, meaning max_offset * 0.36 = 5.4px displacement
- A 20+ dot chain hits the cap (1.0), producing full 15px displacement that decays over ~4 seconds

**Scaling with chain length:**
- Chain of 1-3: trauma 0.06-0.18, barely perceptible (< 1px offset). Good -- small chains should feel gentle.
- Chain of 5-8: trauma 0.30-0.48, noticeable rumble (1.4-3.5px offset). The "something is happening" threshold.
- Chain of 10-15: trauma 0.60-0.90, strong shake (5.4-12.2px offset). Exciting.
- Chain of 20+: trauma capped at 1.0, full 15px offset. Screen goes wild. This should be rare and thrilling.

**Implementation (Canvas 2D offset, not camera):**
```javascript
let shakeTrauma = 0;
let shakeX = 0, shakeY = 0;

function addTrauma(amount) {
    shakeTrauma = Math.min(1.0, shakeTrauma + amount);
}

function updateShake() {
    if (shakeTrauma > 0.01) {
        const shake = shakeTrauma * shakeTrauma; // Quadratic
        shakeX = SHAKE_MAX_OFFSET * shake * (Math.random() * 2 - 1);
        shakeY = SHAKE_MAX_OFFSET * shake * (Math.random() * 2 - 1);
        shakeTrauma *= SHAKE_DECAY;
    } else {
        shakeX = 0;
        shakeY = 0;
        shakeTrauma = 0;
    }
}

// In draw():
ctx.save();
ctx.translate(shakeX, shakeY);
// ... draw everything ...
ctx.restore();
```

**Why random noise, not Perlin:** Eiserloh recommends Perlin for 3D camera shake (smoother), but for 2D canvas offset in a chain reaction game, the violent randomness of per-frame random values feels more "explosive." Perlin would feel like being on a boat; random feels like being in a blast. This game wants the latter.

### Particle System Specification

The current implementation spawns 8 particles per explosion in a uniform radial pattern. This is underwhelming. Here is the upgraded spec:

**Particles per detonation:** 12-20 (randomized)
- 8 fast radial particles (the "burst")
- 4-8 slow drifting particles (the "aftermath")
- 0-4 spark particles (tiny, fast, short-lived -- the "snap")

**Burst particles:**
```javascript
{
    count: 8,
    speed: 4 + Math.random() * 6,          // 4-10 px/frame
    angle: (i / 8) * TAU + (Math.random() - 0.5) * 0.4,  // Radial with jitter
    size: 2 + Math.random() * 3,            // 2-5px radius
    lifetime: 20 + Math.random() * 15,      // 20-35 frames (0.33-0.58s)
    friction: 0.93,                         // Deceleration per frame
    gravity: 0.05,                          // Slight downward pull
    fadeStart: 0.6,                         // Start fading at 60% of life
}
```

**Drift particles:**
```javascript
{
    count: 4 + Math.floor(Math.random() * 5),
    speed: 1 + Math.random() * 2,           // 1-3 px/frame
    angle: Math.random() * TAU,             // Fully random direction
    size: 3 + Math.random() * 4,            // 3-7px radius
    lifetime: 40 + Math.random() * 30,      // 40-70 frames (0.67-1.17s)
    friction: 0.97,                         // Slow deceleration
    gravity: -0.02,                         // Slight upward float (heat rise)
    fadeStart: 0.4,                         // Start fading early
}
```

**Spark particles:**
```javascript
{
    count: Math.floor(Math.random() * 5),
    speed: 8 + Math.random() * 8,           // 8-16 px/frame (fast)
    angle: Math.random() * TAU,
    size: 1 + Math.random(),                // 1-2px radius (tiny)
    lifetime: 8 + Math.random() * 8,        // 8-16 frames (very short)
    friction: 0.90,
    gravity: 0.1,                           // Pulled down fast
    fadeStart: 0.3,
}
```

**Total particle budget:** At peak cascade (60 dots all exploding), worst case:
- 60 dots * 20 particles average = 1200 particles
- Each particle is a simple circle draw (fillRect or arc)
- Canvas 2D handles 2000-5000 simple shape draws at 60fps easily
- Use fillRect instead of arc for particles > 3px from camera (cheaper)
- Object pool: pre-allocate 1500 particle objects, recycle via free list

**Rendering technique:**
```javascript
// Set additive blending for all particles
ctx.globalCompositeOperation = 'lighter';
// Draw all particles
particles.forEach(drawParticle);
// Reset
ctx.globalCompositeOperation = 'source-over';
```

This makes overlapping particles create bright hotspots (the "glow" effect) without any blur/shadow overhead.

### Color Design

**Background:** `#0a0a1a` (current -- near-black with blue tint). Keep it.

**Dot pitch-color mapping (Y-position to hue):**

The spec says low pitch = warm, high pitch = cool. Map Y-position to HSL hue:

```javascript
// Y=0 (top, high pitch) -> hue 200 (cool blue-cyan)
// Y=height (bottom, low pitch) -> hue 20 (warm orange-red)
function dotHue(y, canvasHeight) {
    const t = y / canvasHeight;  // 0=top, 1=bottom
    return 200 - t * 180;       // 200 (cyan) -> 20 (orange)
}
// Saturation: 80%, Lightness: 60% for idle dots
// Lightness jumps to 90% on detonation (flash)
```

**Specific palette stops:**

| Y Position | Musical Register | Hue | Example Color | HSL |
|-----------|-----------------|-----|---------------|-----|
| Top (0%) | Highest octave | 200 | Cyan | hsl(200, 80%, 60%) |
| 20% | High | 164 | Teal | hsl(164, 80%, 60%) |
| 40% | Mid-high | 128 | Green | hsl(128, 80%, 60%) |
| 60% | Mid-low | 92 | Yellow-green | hsl(92, 80%, 60%) |
| 80% | Low | 56 | Gold | hsl(56, 80%, 60%) |
| Bottom (100%) | Lowest octave | 20 | Orange-red | hsl(20, 80%, 60%) |

**Chain-depth color progression:**

Each "generation" of the cascade gets a distinct lightness boost and optional hue shift, so the player can visually track wave propagation:

```javascript
// chainDepth: 0 = player-tapped dot, 1 = first cascade, 2 = second, etc.
function explosionColor(baseHue, chainDepth) {
    const lightness = Math.min(90, 60 + chainDepth * 5);  // Gets brighter deeper in chain
    const saturation = Math.max(60, 80 - chainDepth * 3); // Slightly desaturates
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
}
```

**Explosion core vs ring:**
- Core (inner 30% of radius): white to yellow (hsl with lightness 85-95%)
- Ring (outer 70%): dot's pitch color at 40% opacity
- This makes all explosions feel "bright" regardless of pitch color

**Background pulse:**
On cascade events, briefly lighten the background:
```javascript
// bgBrightness: normally 0, pulses to 0.15 on big chains, decays by *0.92/frame
const bgR = 10 + bgBrightness * 30;
const bgG = 10 + bgBrightness * 20;
const bgB = 26 + bgBrightness * 40;
ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
```

### Audio-Visual Synchronization

**Critical timing relationships:**

| Event | Audio | Visual | Timing |
|-------|-------|--------|--------|
| Player tap (miss) | Soft "thud" noise burst, 80ms | Explosion ring expands, particles | Immediate (0ms) |
| Player tap (hit dot) | Dot's pentatonic note, attack 10ms | Dot flash white -> expand -> particles | Immediate (0ms) |
| Cascade dot detonation | Dot's pentatonic note, attack 10ms | Same as above but delayed by wave propagation | 80-150ms after parent |
| Chain of 5+ reached | No extra audio | Screen shake begins | Continuous from chain start |
| Chain of 10+ reached | Background swell (low-pass filter opens) | Background brightens | Gradual over 500ms |
| Level clear | Held chord (last 3-5 notes sustain 2s) | All remaining dots bloom, background swells | On last explosion + 200ms |
| Perfect clear | Ascending arpeggio over 1s | Screen fills with particle shower | On last explosion + 200ms |

**Cascade stagger timing (the most important single parameter):**

Each cascade generation should be delayed, not simultaneous. This is what makes the chain sound musical rather than like a single chord.

```javascript
const CASCADE_DELAY_MS = 100;   // Base delay between generations
const CASCADE_DELAY_JITTER = 40; // +/- random jitter per dot

// When a dot is caught in an explosion:
const delay = CASCADE_DELAY_MS * chainDepth + (Math.random() - 0.5) * CASCADE_DELAY_JITTER;
setTimeout(() => detonateDot(dot, chainDepth + 1), delay);
```

This means:
- Generation 0 (tapped dot): 0ms
- Generation 1 (first cascade): 80-140ms (100 +/- 40 jitter, clamped)
- Generation 2: 160-280ms
- Generation 3: 240-420ms
- A 10-generation chain plays out over roughly 1-1.4 seconds
- The spec says 2-3 seconds for full cascade -- adjust CASCADE_DELAY_MS to 150-200ms if needed

**Pentatonic note frequencies (C major pentatonic across 3 octaves):**

```javascript
const PENTATONIC_FREQUENCIES = [
    // Octave 3 (low, bottom of screen)
    130.81,  // C3
    146.83,  // D3
    164.81,  // E3
    196.00,  // G3
    220.00,  // A3
    // Octave 4 (mid)
    261.63,  // C4
    293.66,  // D4
    329.63,  // E4
    392.00,  // G4
    440.00,  // A4
    // Octave 5 (high, top of screen)
    523.25,  // C5
    587.33,  // D5
    659.25,  // E5
    783.99,  // G5
    880.00,  // A5
];

function dotFrequency(y, canvasHeight) {
    const t = 1 - (y / canvasHeight); // 0=bottom(low), 1=top(high)
    const index = Math.floor(t * (PENTATONIC_FREQUENCIES.length - 1));
    return PENTATONIC_FREQUENCIES[Math.min(index, PENTATONIC_FREQUENCIES.length - 1)];
}
```

**Oscillator envelope:**
```javascript
function playNote(frequency, time) {
    const audioCtx = getAudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';  // Or 'triangle' for warmer tone
    osc.frequency.value = frequency;

    // ADSR envelope
    const now = time || audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);   // Attack: 10ms
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);    // Decay to sustain: 90ms
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Release: 1.4s

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
}
```

**Why pentatonic guarantees consonance:** Any two notes in a pentatonic scale are separated by intervals of major 2nd, minor 3rd, perfect 4th, perfect 5th, or major 6th. None of these are dissonant. Even if 10 notes play simultaneously, the result is a rich chord, never a clash. The minimum interval in C major pentatonic is a major 2nd (C-D = ~1.12 ratio), which is perceived as warm and open, not harsh.

**Note onset separation requirement:** For notes to be perceived as distinct melodic events rather than a smeared chord, onsets must be separated by at least 50ms (research on auditory stream segregation). The CASCADE_DELAY_MS of 100ms provides comfortable separation. Within a single generation, if multiple dots detonate, the jitter (40ms range) ensures they don't all fire at exactly the same instant.

### Hit Freeze (Bonus -- Highest Ratio Feature)

From Vlambeer's technique list: pause the game for 2-3 frames on significant impacts. In a chain reaction game, apply this only to the initial player tap, not to cascade detonations (otherwise the chain would stutter).

```javascript
let freezeFrames = 0;

function handleTap(x, y) {
    // ... trigger explosion ...
    freezeFrames = 3; // Pause for 3 frames (50ms at 60fps)
}

function loop() {
    if (freezeFrames > 0) {
        freezeFrames--;
        draw(); // Still render, just don't update physics
        requestAnimationFrame(loop);
        return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
}
```

This creates the "weight" behind the player's tap. The game acknowledges the input by briefly stopping, then the cascade explodes outward. Costs 6 lines of code, massive feel improvement.

---

## Part 2: Validation Test Suite

### Design Philosophy

The game is deterministic given a layout and tap position. The layout is random but can be seeded. This means we can run thousands of simulated games without rendering, purely in JavaScript, and collect statistics. The tests below are designed to run in Node.js or headless Chrome via Playwright/Puppeteer.

**Key insight from Unity Game Simulation research:** Game balance testing requires three elements: metrics (what to measure), test cases (scenarios to measure), and parameters (what to tune). Our metrics are chain length, clear rate, and score distribution. Our test cases are the 12 levels. Our parameters are EXPLOSION_RADIUS, DOT_COUNT, MIN_DOT_DISTANCE, and level targets.

### Test 1: Random Input Simulation

**Purpose:** Measure baseline difficulty -- what happens when a player taps randomly.

**Algorithm:**
```javascript
function testRandomInput(level, iterations = 10000) {
    const results = { chains: [], scores: [], cleared: 0 };

    for (let i = 0; i < iterations; i++) {
        const layout = generateLayout(level.dotCount, canvasWidth, canvasHeight);

        // Pick a random tap position (anywhere on canvas)
        const tapX = Math.random() * canvasWidth;
        const tapY = Math.random() * canvasHeight;

        const chain = simulateChain(layout, tapX, tapY, EXPLOSION_RADIUS);
        results.chains.push(chain.length);
        results.scores.push(chain.score);
        if (chain.length >= level.target) results.cleared++;
    }

    return {
        meanChain: mean(results.chains),
        medianChain: median(results.chains),
        stdChain: stddev(results.chains),
        clearRate: results.cleared / iterations,
        chainHistogram: histogram(results.chains, level.dotCount),
        cv: stddev(results.scores) / mean(results.scores), // Coefficient of variation
    };
}
```

**simulateChain implementation (BFS, matches game logic):**
```javascript
function simulateChain(dots, tapX, tapY, explosionRadius) {
    const exploded = new Set();
    const queue = [];
    let score = 0;
    let depth = 0;

    // Find dots within explosion radius of tap
    dots.forEach((dot, i) => {
        const dist = Math.hypot(dot.x - tapX, dot.y - tapY);
        if (dist < explosionRadius) {
            queue.push({ index: i, depth: 0 });
        }
    });

    // BFS cascade
    while (queue.length > 0) {
        const { index, depth: d } = queue.shift();
        if (exploded.has(index)) continue;
        exploded.add(index);
        depth = Math.max(depth, d);
        score += 10 * (d + 1); // Chain multiplier

        dots.forEach((other, j) => {
            if (exploded.has(j)) return;
            const dist = Math.hypot(other.x - dots[index].x, other.y - dots[index].y);
            if (dist < explosionRadius) {
                queue.push({ index: j, depth: d + 1 });
            }
        });
    }

    return { length: exploded.size, score, maxDepth: depth };
}
```

**Expected distributions per level (pass criteria):**

| Level | Dots | Target | Random Clear Rate (Pass) | Random Clear Rate (Fail) |
|-------|------|--------|-------------------------|-------------------------|
| 1 | 10 | 3 | > 60% | < 40% |
| 2 | 15 | 6 | > 40% | < 20% |
| 3 | 20 | 10 | > 25% | < 10% |
| 4 | 25 | 15 | > 15% | < 5% |
| 5 | 30 | 20 | > 10% | < 3% |
| 6 | 35 | 24 | > 7% | < 2% |
| 7 | 40 | 30 | > 4% | < 1% |
| 8 | 45 | 36 | > 2% | < 0.5% |
| 9 | 50 | 42 | > 1% | < 0.2% |
| 10 | 55 | 48 | > 0.5% | < 0.1% |
| 11 | 60 | 54 | > 0.2% | < 0.05% |
| 12 | 60 | 58 | > 0.05% | < 0.01% |

**Chain shape requirement:** The chain length histogram should NOT be a spike at 1-2. The median random chain should be at least 20% of the dot count (i.e., even random taps usually trigger some cascade).

### Test 2: Optimal Play Computation

**Purpose:** Verify that skill is rewarded -- a player who reads the layout and picks the best spot should succeed much more often than random.

**Algorithm (grid search with refinement):**
```javascript
function findOptimalTap(dots, canvasWidth, canvasHeight, explosionRadius) {
    let bestChain = 0;
    let bestTap = { x: 0, y: 0 };

    // Phase 1: Coarse grid (20x20 = 400 samples)
    const gridSize = 20;
    for (let gx = 0; gx < gridSize; gx++) {
        for (let gy = 0; gy < gridSize; gy++) {
            const x = (gx + 0.5) * canvasWidth / gridSize;
            const y = (gy + 0.5) * canvasHeight / gridSize;
            const chain = simulateChain(dots, x, y, explosionRadius);
            if (chain.length > bestChain) {
                bestChain = chain.length;
                bestTap = { x, y };
            }
        }
    }

    // Phase 2: Fine search around best (9x9 grid within one coarse cell)
    const cellW = canvasWidth / gridSize;
    const cellH = canvasHeight / gridSize;
    for (let fx = -4; fx <= 4; fx++) {
        for (let fy = -4; fy <= 4; fy++) {
            const x = bestTap.x + fx * cellW / 9;
            const y = bestTap.y + fy * cellH / 9;
            const chain = simulateChain(dots, x, y, explosionRadius);
            if (chain.length > bestChain) {
                bestChain = chain.length;
                bestTap = { x, y };
            }
        }
    }

    // Phase 3: Also test tapping each dot directly (N samples)
    dots.forEach(dot => {
        const chain = simulateChain(dots, dot.x, dot.y, explosionRadius);
        if (chain.length > bestChain) {
            bestChain = chain.length;
            bestTap = { x: dot.x, y: dot.y };
        }
    });

    return { tap: bestTap, chainLength: bestChain };
}

function testOptimalPlay(level, iterations = 10000) {
    const results = { chains: [], cleared: 0 };

    for (let i = 0; i < iterations; i++) {
        const layout = generateLayout(level.dotCount, canvasWidth, canvasHeight);
        const optimal = findOptimalTap(layout, canvasWidth, canvasHeight, EXPLOSION_RADIUS);
        results.chains.push(optimal.chainLength);
        if (optimal.chainLength >= level.target) results.cleared++;
    }

    return {
        meanOptimalChain: mean(results.chains),
        medianOptimalChain: median(results.chains),
        optimalClearRate: results.cleared / iterations,
        chainHistogram: histogram(results.chains, level.dotCount),
    };
}
```

**Expected results per level (pass criteria):**

| Level | Dots | Target | Optimal Clear Rate (Pass) | Optimal Clear Rate (Fail) |
|-------|------|--------|--------------------------|--------------------------|
| 1 | 10 | 3 | > 95% | < 80% |
| 2 | 15 | 6 | > 90% | < 75% |
| 3 | 20 | 10 | > 85% | < 65% |
| 4 | 25 | 15 | > 80% | < 60% |
| 5 | 30 | 20 | > 75% | < 55% |
| 6 | 35 | 24 | > 70% | < 50% |
| 7 | 40 | 30 | > 65% | < 45% |
| 8 | 45 | 36 | > 55% | < 35% |
| 9 | 50 | 42 | > 45% | < 25% |
| 10 | 55 | 48 | > 35% | < 15% |
| 11 | 60 | 54 | > 25% | < 10% |
| 12 | 60 | 58 | > 10% | < 3% |

**Skill gap requirement:** For each level, optimal clear rate must be at least 3x the random clear rate. This ensures the game rewards reading the layout. If optimal is only 1.5x random, the game is too luck-dependent.

### Test 3: Score Distribution Analysis

**Purpose:** Ensure outcomes feel varied. If scores cluster tightly, every game feels the same regardless of input.

**Algorithm:**
```javascript
function testScoreDistribution(level, iterations = 10000) {
    const randomScores = [];
    const optimalScores = [];

    for (let i = 0; i < iterations; i++) {
        const layout = generateLayout(level.dotCount, canvasWidth, canvasHeight);

        // Random tap
        const rx = Math.random() * canvasWidth;
        const ry = Math.random() * canvasHeight;
        const randomResult = simulateChain(layout, rx, ry, EXPLOSION_RADIUS);
        randomScores.push(randomResult.score);

        // Optimal tap (expensive -- reduce iterations or use sampling)
        if (i < 1000) { // Only first 1000 for optimal
            const optimal = findOptimalTap(layout, canvasWidth, canvasHeight, EXPLOSION_RADIUS);
            optimalScores.push(optimal.chainLength * 10); // Simplified scoring
        }
    }

    const cv = stddev(randomScores) / mean(randomScores);

    return {
        randomScoreMean: mean(randomScores),
        randomScoreStd: stddev(randomScores),
        coefficientOfVariation: cv,
        optimalScoreMean: mean(optimalScores),
        scoreRatio: mean(optimalScores) / mean(randomScores),
        distribution: histogram(randomScores, 20), // 20 bins
    };
}
```

**Pass criteria:**

| Metric | Pass | Fail |
|--------|------|------|
| Coefficient of Variation (random scores) | CV > 0.30 | CV < 0.15 |
| Optimal/Random score ratio | > 2.0 | < 1.3 |
| Score histogram shape | Spread across 5+ bins | 80%+ in 2 bins |

**What the histogram should look like:**
- NOT a normal distribution (that would mean every game feels average)
- IDEALLY bimodal or wide-spread: some games chain badly (low scores), some chain well (high scores)
- The player's decision (tap location) should shift them from the low peak to the high peak

### Test 4: Difficulty Curve Validation

**Purpose:** Ensure levels get progressively harder with no sudden cliffs or plateaus.

**Algorithm:**
```javascript
function testDifficultyCurve(levels, iterations = 5000) {
    const results = levels.map((level, i) => {
        const random = testRandomInput(level, iterations);
        const optimal = testOptimalPlay(level, Math.min(iterations, 2000));

        return {
            level: i + 1,
            randomClearRate: random.clearRate,
            optimalClearRate: optimal.optimalClearRate,
            skillGap: optimal.optimalClearRate / Math.max(random.clearRate, 0.001),
            medianRandomChain: random.medianChain,
            medianOptimalChain: optimal.medianOptimalChain,
        };
    });

    // Validate monotonic decrease
    let monotonic = true;
    for (let i = 1; i < results.length; i++) {
        if (results[i].optimalClearRate > results[i-1].optimalClearRate * 1.05) {
            // Allow 5% tolerance for statistical noise
            monotonic = false;
        }
    }

    // Validate no cliffs (each level should be within 20% relative of previous)
    let noCliffs = true;
    for (let i = 1; i < results.length; i++) {
        const ratio = results[i].optimalClearRate / results[i-1].optimalClearRate;
        if (ratio < 0.5) { // More than 2x harder than previous = cliff
            noCliffs = false;
        }
    }

    return {
        levelResults: results,
        isMonotonic: monotonic,
        hasNoCliffs: noCliffs,
    };
}
```

**Pass criteria:**

| Metric | Pass | Fail |
|--------|------|------|
| Optimal clear rate monotonically decreasing | Yes (with 5% tolerance) | Non-monotonic |
| No cliff between adjacent levels | Each level's clear rate > 50% of previous | Any level < 50% of previous |
| Level 1 random clear rate | > 60% | < 40% |
| Level 12 optimal clear rate | 10-50% | < 3% or > 80% |
| Skill gap increases with level | Correlation > 0.7 | Correlation < 0.3 |

**Expected difficulty curve shape:**

```
Clear Rate (%)
100 |X
 90 | X
 80 |  X
 70 |   X
 60 |    X         <- Level 1 random should be here
 50 |     X
 40 |      X
 30 |       X
 20 |        X     <- Level 12 optimal should be around here
 10 |         X X
  0 |            X
    +--+--+--+--+--+--+--+--+--+--+--+--
      1  2  3  4  5  6  7  8  9 10 11 12
                    Level
```

The curve should be sigmoid-ish (gentle start, steeper middle, flattening at the end) rather than linear.

### Test 5: Chain Length Analysis

**Purpose:** Verify that the gap between random play and optimal play grows with level number, confirming that higher levels reward skill more.

**Algorithm:**
```javascript
function testChainLengthGap(levels, iterations = 5000) {
    return levels.map((level, i) => {
        const randomChains = [];
        const optimalChains = [];

        for (let j = 0; j < iterations; j++) {
            const layout = generateLayout(level.dotCount, canvasWidth, canvasHeight);

            // Random
            const rx = Math.random() * canvasWidth;
            const ry = Math.random() * canvasHeight;
            randomChains.push(simulateChain(layout, rx, ry, EXPLOSION_RADIUS).length);

            // Optimal (sampled subset for speed)
            if (j < 1000) {
                const opt = findOptimalTap(layout, canvasWidth, canvasHeight, EXPLOSION_RADIUS);
                optimalChains.push(opt.chainLength);
            }
        }

        const gap = mean(optimalChains) - mean(randomChains);
        const gapRatio = mean(optimalChains) / Math.max(mean(randomChains), 1);

        return {
            level: i + 1,
            dotCount: level.dotCount,
            target: level.target,
            meanRandomChain: mean(randomChains),
            meanOptimalChain: mean(optimalChains),
            absoluteGap: gap,
            relativeGap: gapRatio,
        };
    });
}
```

**Pass criteria:**

| Metric | Pass | Fail |
|--------|------|------|
| Optimal chain / random chain ratio | Increases with level (r > 0.5) | Decreases or flat |
| Level 1 gap ratio | 1.2-2.0x | < 1.1x (no skill reward) |
| Level 12 gap ratio | > 3.0x | < 1.5x |
| Optimal chain median | > 2x level target for levels 1-6 | < 1.5x target |
| Worst-case chain (any random tap) | > 1 for 95% of taps | > 50% of taps chain 0 |

### Test 6: Audio Validation

**Purpose:** Programmatically verify the musical system produces correct, consonant results.

**Algorithm:**
```javascript
function testAudioFrequencies() {
    const PENTATONIC = [
        130.81, 146.83, 164.81, 196.00, 220.00,  // Octave 3
        261.63, 293.66, 329.63, 392.00, 440.00,  // Octave 4
        523.25, 587.33, 659.25, 783.99, 880.00,  // Octave 5
    ];

    const results = { correct: true, errors: [] };

    // Test 1: Verify all frequencies are in pentatonic scale
    // Generate dots at various Y positions and check their frequencies
    for (let y = 0; y <= 1000; y += 10) {
        const freq = dotFrequency(y, 1000);
        const closest = PENTATONIC.reduce((a, b) =>
            Math.abs(a - freq) < Math.abs(b - freq) ? a : b
        );
        if (Math.abs(freq - closest) > 0.01) {
            results.correct = false;
            results.errors.push(`Y=${y}: freq ${freq} not in pentatonic (closest: ${closest})`);
        }
    }

    // Test 2: Verify no dissonant intervals in simultaneous notes
    // Check all pairs of pentatonic frequencies
    for (let i = 0; i < PENTATONIC.length; i++) {
        for (let j = i + 1; j < PENTATONIC.length; j++) {
            const ratio = PENTATONIC[j] / PENTATONIC[i];
            // Dissonant intervals: minor 2nd (1.059), tritone (1.414)
            // None of these exist in pentatonic, but verify
            const semitones = 12 * Math.log2(ratio);
            const roundedSemitones = Math.round(semitones) % 12;
            const dissonant = [1, 6, 11]; // Minor 2nd, tritone, major 7th
            if (dissonant.includes(roundedSemitones)) {
                results.correct = false;
                results.errors.push(
                    `Dissonant interval: ${PENTATONIC[i]}Hz + ${PENTATONIC[j]}Hz = ${roundedSemitones} semitones`
                );
            }
        }
    }

    // Test 3: Verify Y-to-frequency mapping is monotonically decreasing
    // (top of screen = high frequency, bottom = low)
    let prevFreq = Infinity;
    for (let y = 0; y <= 1000; y += 1) {
        const freq = dotFrequency(y, 1000);
        if (freq > prevFreq + 0.01) {
            results.correct = false;
            results.errors.push(`Non-monotonic at Y=${y}: ${freq} > ${prevFreq}`);
            break;
        }
        prevFreq = freq;
    }

    return results;
}

function testCascadeTiming() {
    const results = { correct: true, errors: [] };

    // Simulate a cascade and collect note onset times
    const layout = generateLayout(30, 800, 600);
    // Find a tap that creates a decent chain
    const optimal = findOptimalTap(layout, 800, 600, EXPLOSION_RADIUS);
    const onsets = simulateChainWithTiming(layout, optimal.tap.x, optimal.tap.y, EXPLOSION_RADIUS);

    // Verify minimum onset separation within each generation
    for (let gen = 0; gen < onsets.length; gen++) {
        const genOnsets = onsets[gen].sort((a, b) => a - b);
        for (let i = 1; i < genOnsets.length; i++) {
            const gap = genOnsets[i] - genOnsets[i - 1];
            // Within a generation, jitter should keep notes at least ~30ms apart
            // Across generations, CASCADE_DELAY_MS ensures 60ms+ separation
        }
    }

    // Verify total cascade duration is in 1-4 second range for chains of 10+
    if (onsets.length >= 10) {
        const totalDuration = Math.max(...onsets.flat()) - Math.min(...onsets.flat());
        if (totalDuration < 500) {
            results.errors.push(`Cascade too fast: ${totalDuration}ms for ${onsets.length} generations`);
            results.correct = false;
        }
        if (totalDuration > 5000) {
            results.errors.push(`Cascade too slow: ${totalDuration}ms for ${onsets.length} generations`);
            results.correct = false;
        }
    }

    return results;
}
```

**Pass criteria:**

| Metric | Pass | Fail |
|--------|------|------|
| All dot frequencies in pentatonic scale | 100% | Any frequency off-scale |
| No dissonant intervals possible | 0 dissonant pairs | Any dissonant pair |
| Y-to-frequency monotonically decreasing | Yes | Any inversion |
| Cascade duration for 10+ chain | 0.5-5.0 seconds | < 0.3s or > 8s |
| Minimum note onset separation | > 30ms within generation | < 20ms |

### Test 7: Performance Validation

**Purpose:** Ensure the game maintains 60fps during peak cascade with all juice effects.

**Algorithm (requires headless browser with requestAnimationFrame):**
```javascript
async function testPerformance() {
    // This test must run in a real browser context (Playwright/Puppeteer)
    const page = await browser.newPage();
    await page.goto('file:///path/to/index.html');

    // Inject performance measurement
    const results = await page.evaluate(() => {
        return new Promise(resolve => {
            // Override loop to measure frame times
            const frameTimes = [];
            let frameCount = 0;
            const maxFrames = 300; // Measure 5 seconds at 60fps

            // Start game
            startGame();

            // Trigger worst-case: tap center to start chain, measure during cascade
            const event = new MouseEvent('mousedown', {
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2
            });
            document.getElementById('game').dispatchEvent(event);

            // Measure frame times
            let lastTime = performance.now();
            function measureFrame() {
                const now = performance.now();
                frameTimes.push(now - lastTime);
                lastTime = now;
                frameCount++;
                if (frameCount < maxFrames) {
                    requestAnimationFrame(measureFrame);
                } else {
                    resolve({
                        frameTimes,
                        avgFrameTime: frameTimes.reduce((a, b) => a + b) / frameTimes.length,
                        maxFrameTime: Math.max(...frameTimes),
                        p95FrameTime: frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length * 0.95)],
                        p99FrameTime: frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length * 0.99)],
                        droppedFrames: frameTimes.filter(t => t > 20).length,
                    });
                }
            }
            requestAnimationFrame(measureFrame);
        });
    });

    return results;
}

// Stress test: force worst case
async function testPerformanceStress() {
    const page = await browser.newPage();
    await page.goto('file:///path/to/index.html');

    const results = await page.evaluate(() => {
        return new Promise(resolve => {
            // Override DOT_COUNT to 60 and trigger all dots simultaneously
            // This simulates the absolute worst case
            generateDots(); // 60 dots

            // Explode everything at once
            dots.forEach(dot => {
                dot.active = false;
                explosions.push(new Explosion(dot.x, dot.y));
                createParticles(dot.x, dot.y);
            });

            // Measure frame times during the explosion aftermath
            const frameTimes = [];
            let frameCount = 0;
            let lastTime = performance.now();

            function measureFrame() {
                const now = performance.now();
                frameTimes.push(now - lastTime);
                lastTime = now;
                frameCount++;
                if (frameCount < 120) { // 2 seconds
                    requestAnimationFrame(measureFrame);
                } else {
                    resolve({
                        avgFrameTime: frameTimes.reduce((a, b) => a + b) / frameTimes.length,
                        maxFrameTime: Math.max(...frameTimes),
                        p95FrameTime: frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length * 0.95)],
                        particleCount: particles.length,
                        explosionCount: explosions.length,
                    });
                }
            }
            requestAnimationFrame(measureFrame);
        });
    });

    return results;
}
```

**Pass criteria:**

| Metric | Pass | Fail |
|--------|------|------|
| Average frame time | < 12ms | > 16.67ms (below 60fps) |
| Max frame time (single worst frame) | < 25ms | > 33ms (below 30fps) |
| P95 frame time | < 16.67ms | > 20ms |
| P99 frame time | < 20ms | > 25ms |
| Dropped frames (>20ms) during 5s test | < 10 | > 30 |
| Stress test (all 60 dots simultaneous) avg | < 14ms | > 20ms |
| Peak particle count during stress | < 1500 | N/A (info only) |

### Worst-Case Analysis (Supplementary)

**Purpose:** Even the worst random tap should produce *something* -- at least 1-2 dots should chain. A total whiff (0 chains) feels like the game is broken.

```javascript
function testWorstCase(level, iterations = 5000) {
    let totalWhiffs = 0; // Taps that chain 0 additional dots

    for (let i = 0; i < iterations; i++) {
        const layout = generateLayout(level.dotCount, canvasWidth, canvasHeight);

        // Find the WORST tap position (grid search for minimum chain)
        let worstChain = Infinity;
        for (let gx = 0; gx < 15; gx++) {
            for (let gy = 0; gy < 15; gy++) {
                const x = (gx + 0.5) * canvasWidth / 15;
                const y = (gy + 0.5) * canvasHeight / 15;
                const chain = simulateChain(layout, x, y, EXPLOSION_RADIUS);
                worstChain = Math.min(worstChain, chain.length);
            }
        }

        if (worstChain <= 1) totalWhiffs++;
    }

    return {
        whiffRate: totalWhiffs / iterations,
        // The "whiff rate" is the % of layouts where the worst possible
        // tap still catches 0 or 1 dots
    };
}
```

**Pass criteria:**

| Level Range | Worst-case chain >= 2 in >= X% of layouts |
|-------------|-------------------------------------------|
| Levels 1-3 | >= 90% |
| Levels 4-6 | >= 95% |
| Levels 7-9 | >= 98% |
| Levels 10-12 | >= 99% |

Higher dot counts should make it nearly impossible to find a tap that catches zero dots. If it happens, EXPLOSION_RADIUS is too small relative to the spacing.

### Quality Gate Summary Table

| # | Metric | Pass | Fail | Test |
|---|--------|------|------|------|
| 1 | Level 1 random clear rate | > 60% | < 40% | Test 1 |
| 2 | Level 6 random clear rate | > 7% | < 2% | Test 1 |
| 3 | Level 12 random clear rate | > 0.05% | < 0.01% | Test 1 |
| 4 | Level 1 optimal clear rate | > 95% | < 80% | Test 2 |
| 5 | Level 6 optimal clear rate | > 70% | < 50% | Test 2 |
| 6 | Level 12 optimal clear rate | 10-50% | < 3% or > 80% | Test 2 |
| 7 | Skill gap (optimal/random) increases with level | Correlation r > 0.7 | r < 0.3 | Test 5 |
| 8 | Score CV (random play, any level) | > 0.30 | < 0.15 | Test 3 |
| 9 | Optimal/Random score ratio (mid levels) | > 2.0x | < 1.3x | Test 3 |
| 10 | Difficulty curve monotonically decreasing | Yes (5% tolerance) | Non-monotonic | Test 4 |
| 11 | No difficulty cliff between adjacent levels | Each > 50% of previous | Any < 50% | Test 4 |
| 12 | All frequencies pentatonic | 100% | Any off-scale | Test 6 |
| 13 | No dissonant intervals possible | 0 pairs | Any pair | Test 6 |
| 14 | Cascade duration (10+ chain) | 0.5-5.0s | < 0.3s or > 8s | Test 6 |
| 15 | Average frame time at peak | < 12ms | > 16.67ms | Test 7 |
| 16 | Max frame time (single frame) | < 25ms | > 33ms | Test 7 |
| 17 | P95 frame time | < 16.67ms | > 20ms | Test 7 |
| 18 | Worst-case whiff rate (levels 7+) | < 2% | > 5% | Worst-Case |
| 19 | Median optimal chain > 2x target (levels 1-6) | Yes | No | Test 5 |
| 20 | Level 12 optimal chain median | > 1.2x target | < 1.0x target | Test 5 |

### Implementation Notes

**Running the test suite:**

The balance tests (Tests 1-5) are pure computation -- they do not need a browser. They can run in Node.js directly by extracting the game constants and simulation logic into a standalone module.

```bash
# Option 1: Node.js (fastest, no rendering needed)
node test-balance.js

# Option 2: Headless Chrome via Playwright (needed for Tests 6-7)
npx playwright test test-performance.spec.js
```

**Standalone test harness (Node.js):**

```javascript
// test-balance.js
// Extract these from index.html or import as shared constants:
const LEVELS = [
    { dotCount: 10,  target: 3 },
    { dotCount: 15,  target: 6 },
    { dotCount: 20,  target: 10 },
    { dotCount: 25,  target: 15 },
    { dotCount: 30,  target: 20 },
    { dotCount: 35,  target: 24 },
    { dotCount: 40,  target: 30 },
    { dotCount: 45,  target: 36 },
    { dotCount: 50,  target: 42 },
    { dotCount: 55,  target: 48 },
    { dotCount: 60,  target: 54 },
    { dotCount: 60,  target: 58 },
];

const EXPLOSION_RADIUS = 120;
const MIN_DOT_DISTANCE = 30;
const CANVAS_W = 800;  // Simulated canvas size
const CANVAS_H = 600;

// --- Utility functions ---
function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function stddev(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}
function histogram(arr, bins) {
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const binWidth = (max - min) / bins || 1;
    const hist = new Array(bins).fill(0);
    arr.forEach(v => {
        const bin = Math.min(Math.floor((v - min) / binWidth), bins - 1);
        hist[bin]++;
    });
    return hist;
}

// --- Layout generation ---
function generateLayout(dotCount, w, h) {
    const dots = [];
    let attempts = 0;
    while (dots.length < dotCount && attempts < 5000) {
        const x = Math.random() * (w - 40) + 20;
        const y = Math.random() * (h - 100) + 80;
        let valid = true;
        for (const dot of dots) {
            if (Math.hypot(dot.x - x, dot.y - y) < MIN_DOT_DISTANCE) {
                valid = false;
                break;
            }
        }
        if (valid) dots.push({ x, y });
        attempts++;
    }
    return dots;
}

// --- Chain simulation (BFS) ---
function simulateChain(dots, tapX, tapY, radius) {
    const exploded = new Set();
    const queue = [];

    dots.forEach((dot, i) => {
        if (Math.hypot(dot.x - tapX, dot.y - tapY) < radius) {
            queue.push({ index: i, depth: 0 });
        }
    });

    let maxDepth = 0;
    while (queue.length > 0) {
        const { index, depth } = queue.shift();
        if (exploded.has(index)) continue;
        exploded.add(index);
        maxDepth = Math.max(maxDepth, depth);

        dots.forEach((other, j) => {
            if (!exploded.has(j) && Math.hypot(other.x - dots[index].x, other.y - dots[index].y) < radius) {
                queue.push({ index: j, depth: depth + 1 });
            }
        });
    }

    return { length: exploded.size, maxDepth };
}

// --- Optimal tap finder ---
function findOptimalTap(dots, w, h, radius) {
    let best = 0, bestTap = { x: w/2, y: h/2 };

    // Grid search
    for (let gx = 0; gx < 20; gx++) {
        for (let gy = 0; gy < 20; gy++) {
            const x = (gx + 0.5) * w / 20;
            const y = (gy + 0.5) * h / 20;
            const r = simulateChain(dots, x, y, radius);
            if (r.length > best) { best = r.length; bestTap = { x, y }; }
        }
    }

    // Refine
    const cellW = w / 20, cellH = h / 20;
    for (let fx = -4; fx <= 4; fx++) {
        for (let fy = -4; fy <= 4; fy++) {
            const x = bestTap.x + fx * cellW / 9;
            const y = bestTap.y + fy * cellH / 9;
            const r = simulateChain(dots, x, y, radius);
            if (r.length > best) { best = r.length; bestTap = { x, y }; }
        }
    }

    // Also test each dot position
    dots.forEach(dot => {
        const r = simulateChain(dots, dot.x, dot.y, radius);
        if (r.length > best) { best = r.length; bestTap = { x: dot.x, y: dot.y }; }
    });

    return { chainLength: best, tap: bestTap };
}

// --- Run all tests ---
console.log('=== Chain Reaction Balance Test Suite ===\n');

let allPass = true;

LEVELS.forEach((level, i) => {
    const N_RANDOM = 5000;
    const N_OPTIMAL = 1000;
    const levelNum = i + 1;

    // Test 1: Random input
    let randomChains = [], randomCleared = 0;
    for (let j = 0; j < N_RANDOM; j++) {
        const layout = generateLayout(level.dotCount, CANVAS_W, CANVAS_H);
        const rx = Math.random() * CANVAS_W;
        const ry = Math.random() * CANVAS_H;
        const r = simulateChain(layout, rx, ry, EXPLOSION_RADIUS);
        randomChains.push(r.length);
        if (r.length >= level.target) randomCleared++;
    }
    const randomClearRate = randomCleared / N_RANDOM;

    // Test 2: Optimal play
    let optimalChains = [], optimalCleared = 0;
    for (let j = 0; j < N_OPTIMAL; j++) {
        const layout = generateLayout(level.dotCount, CANVAS_W, CANVAS_H);
        const opt = findOptimalTap(layout, CANVAS_W, CANVAS_H, EXPLOSION_RADIUS);
        optimalChains.push(opt.chainLength);
        if (opt.chainLength >= level.target) optimalCleared++;
    }
    const optimalClearRate = optimalCleared / N_OPTIMAL;

    const cv = stddev(randomChains) / mean(randomChains);
    const skillGap = optimalClearRate / Math.max(randomClearRate, 0.0001);

    console.log(`Level ${levelNum}: dots=${level.dotCount} target=${level.target}`);
    console.log(`  Random:  clear=${(randomClearRate*100).toFixed(1)}% median_chain=${median(randomChains)} cv=${cv.toFixed(3)}`);
    console.log(`  Optimal: clear=${(optimalClearRate*100).toFixed(1)}% median_chain=${median(optimalChains)}`);
    console.log(`  Skill gap: ${skillGap.toFixed(1)}x`);
    console.log();
});

console.log(allPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
```

**Playwright test for performance (test-performance.spec.js):**

```javascript
// test-performance.spec.js
const { test, expect } = require('@playwright/test');

test('maintains 60fps during peak cascade', async ({ page }) => {
    await page.goto('file:///path/to/index.html');

    const results = await page.evaluate(() => {
        return new Promise(resolve => {
            startGame();

            // Trigger explosion at center
            const event = new MouseEvent('mousedown', {
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2
            });
            document.getElementById('game').dispatchEvent(event);

            const frameTimes = [];
            let count = 0;
            let last = performance.now();

            function measure() {
                const now = performance.now();
                frameTimes.push(now - last);
                last = now;
                if (++count < 180) {
                    requestAnimationFrame(measure);
                } else {
                    const sorted = [...frameTimes].sort((a, b) => a - b);
                    resolve({
                        avg: frameTimes.reduce((a, b) => a + b) / frameTimes.length,
                        max: Math.max(...frameTimes),
                        p95: sorted[Math.floor(sorted.length * 0.95)],
                        p99: sorted[Math.floor(sorted.length * 0.99)],
                        dropped: frameTimes.filter(t => t > 20).length,
                    });
                }
            }
            requestAnimationFrame(measure);
        });
    });

    expect(results.avg).toBeLessThan(16.67);
    expect(results.max).toBeLessThan(33);
    expect(results.p95).toBeLessThan(20);
    expect(results.dropped).toBeLessThan(15);
});
```

### Metrics That Correlate With Player Retention

Based on research from GameAnalytics, Unity Game Simulation, and mobile game retention studies:

**Directly measurable in-game (programmatic):**
1. **Decision quality gap** (optimal vs random outcome): The wider the gap, the more the game rewards skill, which correlates with Day-7 retention in casual games. Target: optimal play should yield 2-5x the score of random play.
2. **Score improvement curve**: Players should improve over sessions. Measurable as: does the player's clear rate increase over their first 10 attempts? If the game has high variance but no learnable patterns, improvement stalls and players quit.
3. **Session attempt count before first clear per level**: Should be 1-3 for early levels (instant gratification), 5-15 for mid levels (flow state), 15-50 for late levels (mastery pursuit). If it exceeds 50, frustration sets in.
4. **Cascade chain length variance**: High variance means surprising outcomes, which is engaging. Low variance means predictable, boring games. CV > 0.3 is the threshold.

**Measurable via analytics (post-deploy):**
5. **Session length**: Casual games average 3-7 minutes. Chain reaction games should target 5-10 minutes (3-8 level attempts).
6. **Sessions per DAU**: Target 1.5-2.0 for a casual game. Below 1.2 indicates low replayability.
7. **Day-1 retention**: Casual game benchmark is 35-40%. The Peggle-style celebration is the #1 driver.
8. **Level completion funnel**: Track what % of players reach each level. Expect exponential dropoff. A healthy game retains 50%+ to level 3, 20%+ to level 6, 5%+ to level 9.

**Boomshine reference data (the closest comparable game):**
- 12 levels, dot counts from 5 (level 1) to 60 (level 12)
- Targets from 1 (level 1) to 55 (level 12)
- Level 12 has a 3.97% win rate
- Over 30 million games played (high replayability)
- Average 25 attempts to clear level 12
- One-click mechanic (same as our one-tap)
- Explosions persist ~3 seconds then shrink (time-based, not instant)

The key Boomshine insight: their explosion radius is time-based (grows, persists, shrinks over ~3s), not instant. This means dot *movement* matters -- dots drift into explosion zones. Our game has static dots, which means our explosion radius must be larger relative to dot spacing to compensate, because there is no "lucky drift" factor.

## References

### GDC Talks and Primary Sources
- Martin Jonasson & Petri Purho, "Juice It or Lose It," GDC Europe 2012. [GDC Vault](https://www.gdcvault.com/play/1016487/Juice-It-or-Lose)
- Jan Willem Nijman (Vlambeer), "The Art of Screenshake," INDIGO Classes 2013. [Gamedev.city summary](https://gamedev.city/s/cmos2d/jan_willem_nijman_vlambeer_art)
- Squirrel Eiserloh, "Math for Game Programmers: Juicing Your Cameras With Math," GDC 2016. [Internet Archive transcript](https://archive.org/stream/GDC2016Eiserloh/GDC2016-Eiserloh_djvu.txt)
- Juicy Breakout source code: [GitHub - grapefrukt/juicy-breakout](https://github.com/grapefrukt/juicy-breakout)

### Screen Shake Implementations
- Jonny Morrill, "How to Implement a Camera Shake Effect." [Blog post](https://jonny.morrill.me/en/blog/gamedev-how-to-implement-a-camera-shake-effect/) -- Duration: 2000ms, Frequency: 40Hz, Amplitude: 32px, linear decay
- A. Petersen, "For the Sake of Screen Shake." [Blog post](https://anpetersen.me/2015/01/16/for-the-sake-of-screen-shake.html) -- Strength: 90, Damper: 5/frame, Verlet integration, drag: 0.81
- Colin Bellino, screenshake recreation: [GitHub](https://github.com/colinbellino/screenshake)

### Game Juice and Feel
- Arzola's Dev Blog, "GDCR: Juice It Or Lose It" [detailed feature list](https://devblog.heisarzola.com/gdcr-juice-it-or-lose-it/)
- GameAnalytics, "Squeezing More Juice Out of Your Game Design." [Article](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design)
- Robert Penner's Easing Functions. [Original site](https://robertpenner.com/easing/)

### Audio Research
- Gormanley, "Audio immersion in games: a case study using an online game with background music and sound effects." The Computer Games Journal, 2017. [Springer](https://link.springer.com/article/10.1007/BF03392344)
- Pentatonic scale theory: [Wikipedia](https://en.wikipedia.org/wiki/Pentatonic_scale)
- Note frequencies reference: [Seventh String](https://www.seventhstring.com/resources/notefrequencies.html)

### Game Balance and Automated Testing
- Unity Blog, "How Metric Validation Can Help You Finetune Your Game," 2020. [Unity Blog](https://blogs.unity3d.com/2020/11/13/over-the-past-year-unity-game-simulation-has-enabled-developers-to-balance-their-games-during-development-by-running-multiple-playthroughs-in-parallel-in-the-cloud/)
- Politowski, "Assessing Video Game Balance using Autonomous Agents," arXiv 2023. [Paper](https://arxiv.org/pdf/2304.08699)
- Roohi, "Predicting Game Difficulty and Churn Without Players," arXiv 2020. [Paper](https://arxiv.org/pdf/2008.12937)

### Color Theory
- Pav Creations, "Color Theory for Game Art Design." [Article](https://pavcreations.com/color-theory-for-game-art-design-the-basics/)
- MDN, Canvas globalCompositeOperation (additive blending). [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)

### Chain Reaction Game Design
- Boomshine by Danny Miller. [Play](https://k2xl.com/games/boomshine/) -- 12 levels, 1/5 to 55/60, ~4% win rate on level 12
- JayIsGames Boomshine review. [Review](https://jayisgames.com/review/boomshine.php)

### Retention Metrics
- Mistplay, "The Big List of Mobile Game Retention Benchmarks." [Article](https://business.mistplay.com/resources/mobile-game-retention-benchmarks)
- Business of Apps, "Mobile Game Retention Rates." [Data](https://www.businessofapps.com/data/mobile-game-retention-rates/)

### Particle Systems
- Build New Games, "Particle Systems From the Ground Up." [Article](http://buildnewgames.com/particle-systems/)
- Canvas 2D performance: Canvas can render 10,000+ simple shapes at 60fps on modern hardware.
