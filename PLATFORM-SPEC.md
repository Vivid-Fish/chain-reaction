# Game Experimentation Platform -- Specification

**Status:** ACTIVE -- Build this now
**Last Updated:** 2026-02-27
**Purpose:** A workshop for rapidly discovering core game loop mechanics. Presentation and workflow are solved once; mechanics are the creative variable.

---

## 0. Strategic Context (Read This First)

This section exists so that any agent -- subagent, future session, or fresh context -- has complete strategic context without needing to reconstruct it from conversation history. If you are an AI agent working on this project, read this section before doing anything else.

### 0.1 Why This Platform Exists

The hard problem in game design is finding the core game loop -- the mechanics that make a game worth playing. Everything else (rendering, audio, input handling, evaluation, deployment) is incidental. But "incidental" doesn't mean "free" -- each of these takes hours to set up, and that setup is nearly identical across experiments. The platform exists to eliminate that repeated setup cost so that all creative energy goes into mechanics discovery.

The human behind this project has taste and access to AI coding agents (Claude Code) that can generate large amounts of software quickly. The human is the bottleneck. Every hour spent on boilerplate is an hour not spent deciding whether a game concept is worth pursuing. The platform shifts human time from implementation to judgment.

**The investment thesis:** Spend serious upfront time getting the platform right. Amortize across 10-50+ game experiments. The compounding improves as AI models improve. Lessons port to future AI-automated creative work beyond games.

### 0.2 The Core Insight

The platform is opinionated about **presentation** (procedural 2D visuals, synthesized audio, shared UI shell, responsive viewport) and **workflow** (headless-first execution, bot evaluation up to theoretically perfect play, parameter sweeps, AI-agent authoring). It is deliberately flexible about **mechanics** -- the rules, the input-to-action mapping, the game loop itself.

This means the platform must support **completely different games**, not variations on one game. A steering game, a rhythm game, a construction game, a territorial control game, a physics puzzle -- each should feel at home in the platform without fighting its abstractions. Chain Reaction (the existing tap-and-chain game) is one experiment, not the foundation. The platform's architecture must not assume Chain Reaction's shape.

### 0.3 What the Platform IS and IS NOT

**IS:**
- A curated workshop with opinions about how games look, sound, launch, and get evaluated
- A set of solved infrastructure problems that any new game inherits for free
- A framework for automated evaluation via bots of calibrated difficulty (up to theoretically perfect)
- A deployment target: all games launch from the same UI, same URL, maximum reuse
- An input system that provides the highest-throughput motor control available on mobile (thumb rectangle + gyro combined, not just tap)

**IS NOT:**
- A general game engine (it has opinions; use Unity/Godot if you want generality)
- An art direction tool (shared visual language -- procedural, geometric -- not per-game art styles)
- An audio content pipeline (synthesized audio, no sample files, no music tracks)
- A narrative/text engine (games communicate through physics, sound, and visual feedback)
- A level design tool (games are procedural/generative, not hand-crafted)
- A progression/meta-game system (no unlocks, no currencies, each session stands alone)
- A content management system (no assets to load -- everything generated at runtime)
- A publishing/distribution platform (it's a workshop; games deploy to a single URL for testing)
- 3D (2D Canvas/WebGL -- touch + gyro maps naturally to 2D)

### 0.4 The Human's Role

The human is NOT a passive taste-gater. The human operates at multiple levels:

1. **Strategic direction.** Decides what concepts to explore, what principles matter, when to pivot or kill.
2. **Taste-gating.** Plays the experiments that pass automated screening. Gives verdicts: yes, no, adjust.
3. **Arbitrary-point input.** Intervenes mid-lifecycle whenever judgment has high leverage -- during implementation, after seeing early bot results, while reviewing code.
4. **Platform improvement.** Works with AI agents to improve the platform itself based on lessons learned from each experiment. The platform is a living system.
5. **Design principle refinement.** The design principles evolve as more experiments run.

### 0.5 Rich Input as First-Class Concern

The human's taste runs toward the racquetball/Rocket League/Tetris Effect feel: fast physics reads, immediate action, the player engaged with the simulation through continuous motor control. The five sources of physics satisfaction identified in the design journey are:

1. **Weight and momentum transfer** -- your velocity maps to game response
2. **Timing precision** -- the right action at the right moment
3. **Spatial geometry in real-time** -- unconscious angle/trajectory calculations
4. **Rhythm** -- inputs sync to the game's pulse
5. **Shaping then harvesting** -- setup conditions, then trigger payoff

This means the input system must provide the *highest-throughput motor control available on mobile*. Not just tap. The thumb-rectangle (continuous position + velocity from a slide zone) and gyro (fine spatial precision using wrist muscles) are both first-class input channels. Games choose which channels they use, but the platform provides all of them at maximum fidelity. Games that only need tap get tap. Games that need continuous steering get the full channel set.

### 0.6 PvP via Bots

PvP is important for evaluating game depth -- adversarial play reveals strategy spaces that solo play hides. The platform supports PvP against bots of varying calibrated difficulty, up to theoretically perfect play. Not networked multiplayer. Bot-vs-bot matches are a core evaluation tool: if two bots playing each other produce degenerate or boring dynamics, the mechanics need work.

### 0.7 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Mechanics-flexible, presentation-opinionated** | The hard problem is mechanics discovery. Presentation is solved once. The platform must not constrain what games can BE, only how they LOOK and how they're EVALUATED. |
| **Headless-first** | Automated evaluation is the entire value proposition. If games can't run without pixels, bots can't play them. |
| **Rich input, not minimal input** | The human's taste demands high-throughput motor control. The platform provides the richest input channels available; games choose what they use. |
| **Completely different games, not variants** | The platform's value is tested by how different its games can be, not by how many variations of one game it can run. |
| **Vanilla JS + Canvas 2D** | Validated from requirements: AI-agent-writable, headless-capable, no build step, rich input access. Canvas 2D is the starting renderer; the draw API is designed so WebGL can replace it later without game code changes. |
| **Chain Reaction is one experiment** | CR may or may not be the best first game on the platform. The platform's architecture must not assume CR's shape. |
| **Bot quality is load-bearing** | Human playtesting of every variant is off the table. Bot evaluation must screen out the bottom 80%. |
| **Platform stays small** | If something only benefits one game, it lives in that game's directory. Target: ~1500 lines of platform code. |

### 0.8 Principles for Subagents

If you are an AI agent working on this project:

1. **The game loop is the experiment.** Everything else (rendering, audio, input, evaluation) is infrastructure. Don't spend creative energy on infrastructure -- use what the platform provides.
2. **Run bot evaluation before showing results to the human.** If bots can't play it, it's not ready.
3. **Don't add to the platform for one game.** Platform changes must justify themselves across 5+ future experiments.
4. **Keep files small and obvious.** Clarity beats cleverness.
5. **Determinism is non-negotiable.** Same seed + same config + same inputs = same outputs. All randomness flows through seeded PRNG.
6. **Test headless first, then add visuals.** Headless execution is the foundation of evaluation.
7. **The human may intervene at any point.** Code must be readable and modifiable mid-stream.
8. **Games must be genuinely different from each other.** If your new game is a variant of an existing one (same core loop with different parameters), it's not a new experiment -- it's a tuning exercise.
9. **Rich input is available.** Don't default to tap-only. Consider what input model best serves the game's feel.

---

## 1. The Game Definition Interface (GDI)

This is the most critical design in the document. Everything else serves it.

### 1.1 Principle: The Platform Calls the Game, Not the Other Way Around

The game is a **pure module** that exports factory functions. It never touches the DOM, never calls `requestAnimationFrame`, never creates an `AudioContext`, never reads touch events. The platform owns all I/O and calls into the game at well-defined moments.

This inversion is what makes headless execution trivial: the platform simply never calls the render-related hooks.

### 1.2 The Contract

A game module exports a single factory function:

```js
// games/steer/game.js
export function createGame(config) {
  return {
    meta,       // static metadata
    init,       // (params) -> state
    step,       // (state, input, dt, rng) -> state
    render,     // (state, draw, alpha) -> void
    audio,      // (prevState, state) -> audioEvents[]
    score,      // (state) -> scoreReport
    status,     // (state) -> 'playing' | { ended: true, reason }
    bot,        // (difficulty, rng) -> botFn       (optional)
    configure,  // () -> parameterDefs[]            (optional)
  };
}
```

Nine hooks, two optional. The platform never inspects game state. The game owns its entire simulation. Let's examine each hook.

### 1.3 Hook Details

#### `meta` -- Static Metadata

```js
meta: {
  id: 'steer',
  name: 'Dodgerunner',
  version: '0.1.0',
  players: 1,                    // or 2, or { min: 1, max: 4 }
  inputChannels: ['thumb', 'gyro'],  // declares what input the game reads
  tickRate: 60,                  // simulation ticks per second
  viewport: {
    orientation: 'portrait',     // 'portrait' | 'landscape' | 'any'
    aspect: 9/16,                // preferred; platform adapts
  },
}
```

`meta` is a plain object, not a function. The platform reads it at registration time to configure input capture, viewport, and evaluation harness. `inputChannels` is a **declaration**, not a request. The platform always captures everything; the game declares what it will actually read from the input frame, so the platform can optimize and so bots know what channels to synthesize.

#### `init(params) -> state`

Creates the initial game state. `params` is the resolved parameter set (from `configure()` defaults merged with any sweep overrides or user tweaks).

Returns a **plain serializable object**. No classes, no prototypes, no closures in state. This is enforced by convention and validated in dev mode via `JSON.parse(JSON.stringify(state))` round-trip check.

Why plain objects? Replay, serialization, snapshot diffing, headless transfer. A game's state must survive `structuredClone`.

#### `step(state, input, dt, rng) -> state`

The core simulation tick. Advances game state by `dt` seconds (fixed timestep, always `1 / meta.tickRate`).

Arguments:
- `state` -- the current game state (opaque to platform)
- `input` -- the current input frame (see Section 3)
- `dt` -- time delta in seconds (always fixed, but passed explicitly so games don't hardcode it)
- `rng` -- seeded PRNG instance (see Section 1.5)

Returns the next state. May mutate and return the same object (for performance) or return a new object (for purity). The platform does not care. The only contract: the returned object IS the new state.

**No phases. No sub-steps. No entity iteration protocol.** The game owns its entire simulation. If a steering game wants to do `movePlayer -> spawnObstacles -> checkCollisions -> updateDistance` inside one `step` call, that's the game's business. If a rhythm game wants to do `advanceCursor -> evaluatePendingBeats -> expireMissedBeats`, that's the game's business.

The platform calls `step` at the declared `tickRate`. That is the only contract.

For multiplayer games, `input` becomes `inputs` (array of input frames). The platform determines arity from `meta.players`.

#### `render(state, draw, alpha) -> void`

Produces draw commands for the current state. Called by the platform's render loop (which may run at a different rate than simulation -- e.g., simulation at 60 Hz, render at display refresh rate).

`draw` is the platform's drawing API (see Section 4). The game calls methods on it. `alpha` is the interpolation factor (0-1, how far between previous and current simulation tick this render frame falls). Most simple games ignore alpha.

Coordinates are in **normalized game space** (0-1 on both axes, with aspect ratio declared in `meta.viewport`). The platform maps to physical pixels. Games never think about screen resolution, DPI, or device size.

`render` is never called in headless mode. Games must not put logic in `render`.

#### `audio(prevState, state) -> audioEvents[]`

Compares previous and current state to emit audio events. Called once per simulation tick (not per render frame).

```js
audio(prev, state) {
  const events = [];
  if (!state.alive && prev.alive) {
    events.push({ type: 'noise', filter: 'lowpass', filterFreq: 200, duration: 0.5, gain: 0.4 });
  }
  return events;
}
```

Audio events are **declarative** -- the game says WHAT to play, the platform decides HOW (see Section 5). Never called in headless mode.

#### `score(state) -> scoreReport`

Extracts the current score from state for display and evaluation. Returns a structured report:

```js
// Monotonic score (distance, height)
score(state) {
  return {
    primary: state.distance,          // the main number
    label: 'Distance',                // display label
    unit: 'm',                        // display unit
    breakdown: {},                    // optional sub-scores
    normalized: null,                 // 0-1 if game has a natural ceiling
  };
}

// Bounded score (accuracy %)
score(state) {
  const total = state.hits + state.misses;
  return {
    primary: total > 0 ? state.hits / total : 0,
    label: 'Accuracy',
    unit: '%',
    format: 'percent',
    breakdown: { hits: state.hits, misses: state.misses },
    normalized: total > 0 ? state.hits / total : null,
  };
}

// PvP score (per-player)
score(state) {
  return {
    primary: [state.area[0], state.area[1]],
    label: 'Territory',
    unit: '%',
    format: 'percent',
    winner: state.area[0] > state.area[1] ? 0 : 1,
  };
}
```

The platform uses `primary` for evaluation graphs and `normalized` (when available) for cross-game comparison. `format` tells the UI how to display the number.

#### `status(state) -> statusResult`

Tells the platform whether the game is still running:

```js
status(state) {
  if (!state.alive) return { ended: true, reason: 'collision' };
  return 'playing';
}
```

Returns `'playing'` or an object with `ended: true` and an optional reason. The platform uses this to stop simulation, trigger end-of-game UI, and record results in evaluation runs.

For timed games, the game manages its own clock in state and sets `ended: true` when time expires. The platform does not impose a duration.

#### `bot(difficulty, rng) -> botFn` (optional)

Returns a bot function for a given difficulty level. `difficulty` is a float from 0.0 (random) to 1.0 (best the bot can do).

The returned `botFn` has the signature: `(state, dt) -> input`

It reads the game state and produces an **input frame** -- the same shape the platform provides for humans. This is the key insight: **bots produce synthetic input frames, not game actions**. The platform can pipe bot output through the exact same `step(state, input, dt, rng)` path as human input. No separate bot-action API. The game cannot distinguish bot from human input.

```js
bot(difficulty, rng) {
  return (state, dt) => {
    const nearest = findNearestObstacle(state);
    const dodge = calculateDodge(nearest, state.player, difficulty);
    const noise = (1 - difficulty) * 0.15 * (rng.random() - 0.5);
    return {
      thumb: { active: true, x: dodge.x + noise, y: 0.8, vx: 0, vy: 0,
               startX: dodge.x, startY: 0.8, duration: 1 },
      gyro: null,
      taps: [],
      keys: {},
    };
  };
}
```

The bot function is game-specific because it needs to understand game state. But it produces platform-standard input frames, so the rest of the pipeline is generic.

**On "theoretically perfect play":** Difficulty 1.0 means "the best this bot implementation can do," not "provably optimal." For games with finite action spaces, a search-based bot can approach true optimality. For games with continuous control, the bot uses the best heuristic available. The difficulty gradient from 0.0 to 1.0 is what matters for evaluation -- the absolute ceiling is a useful signal, but the curve shape is more informative than the endpoint.

#### `configure() -> parameterDefs[]` (optional)

Declares tunable parameters for the lab UI and sweep infrastructure:

```js
configure() {
  return [
    { key: 'speed', label: 'Base Speed', type: 'float', min: 0.5, max: 3.0, default: 1.0, step: 0.1 },
    { key: 'spawnRate', label: 'Obstacle Rate', type: 'float', min: 0.5, max: 5.0, default: 2.0 },
    { key: 'difficulty', label: 'Difficulty Curve', type: 'enum',
      options: ['linear', 'exponential', 'step'], default: 'linear' },
  ];
}
```

The platform uses this to auto-generate lab sliders and sweep parameter spaces. Games without this hook get no tuning UI (fine for early prototypes).

### 1.4 Platform Guarantees to Games

Games can rely on:

1. `step` is called at exactly `meta.tickRate` Hz with a fixed `dt`.
2. `input` is always a well-formed input frame with all declared channels populated (null if no data from that channel).
3. `rng` is a seeded PRNG -- same seed produces same sequence across runs.
4. `draw` provides the full drawing API (Section 4).
5. `render` is never called in headless mode.
6. `audio` is never called in headless mode.
7. The platform never reads or modifies game state.

### 1.5 Platform Assumptions About Games

1. `state` is serializable (survives `structuredClone`).
2. `step` is **deterministic given the same input, dt, and rng sequence**. Same inputs -> same outputs. This is what makes deterministic replay possible.
3. `render` has no side effects on game state.
4. `audio` has no side effects on game state.
5. `status` is a pure read of state.
6. `score` is a pure read of state.

### 1.6 Seeded PRNG

The platform provides a PRNG instance (xoshiro128** -- fast, small state, good distribution):

```js
function createRNG(seed) {
  // Returns object with:
  //   .random()       -> float in [0, 1)
  //   .int(min, max)  -> integer in [min, max]
  //   .pick(array)    -> random element
  //   .shuffle(array) -> shuffled copy
  //   .fork(label)    -> child RNG with derived seed
}
```

The `.fork(label)` method is critical: it lets a game create sub-streams (one for obstacle spawning, one for visual variation, etc.) without consumption order coupling. If a spawner consumes 5 random values and then visual sparkles consume 3, adding a 6th spawner value doesn't shift the sparkle sequence -- because they're on different forks.

Seed is set at game start: by the platform (for evaluation reproducibility) or randomly (for normal play).

---

## 2. Tech Stack

### 2.1 Decision

**Vanilla JavaScript (ES2022+) + ES Modules + Canvas 2D.**

This was evaluated from requirements, not assumed from existing code. Five candidates were assessed against seven requirements (AI-agent writability, headless execution, rich input access, no build step, rendering performance, audio synthesis, dual environment). The full evaluation is in `research/r2-research.md`.

Summary of eliminations:
- **LittleJS, Kontra.js:** No headless execution. Deal-breaker.
- **TypeScript:** Browser requires a build step. Violates no-build-step requirement.
- **Vanilla JS + WebGL:** Stronger rendering performance, but WebGL shader code is harder for AI agents to write. Canvas 2D is sufficient for hundreds of entities.

### 2.2 Key Choices

| Choice | Rationale |
|--------|-----------|
| **ES Modules** (not CommonJS) | `import`/`export` works natively in browsers (`<script type="module">`) and Node.js (`"type": "module"` in package.json). One module system for both environments. No `typeof module !== 'undefined'` hacks. |
| **Canvas 2D** (starting point) | Simpler, more AI-writable, sufficient for 200-entity games. The `draw` API is an abstraction layer -- when a game needs 1000+ entities, a WebGL renderer can implement the same `draw` interface without game code changes. |
| **Web Audio API** | The only option for synthesized audio in browsers. Rich enough for oscillators, filters, effects. |
| **No framework** | No React, Vue, Svelte. The shell is ~5 screens with no complex state management. Framework overhead is pure liability. |
| **No TypeScript** | At this codebase size (~2000 lines), the type safety benefit doesn't justify the browser build step. JSDoc annotations provide IDE support without a compiler. |
| **Node.js built-in test runner** (`node:test`) | No Jest/Mocha dependency. Games are testable headlessly: `createGame() -> init() -> step() x N -> assert score`. |

### 2.3 What Was Rejected

- **React/Vue/Svelte:** Framework overhead for a game platform.
- **WebGL/Three.js:** Overkill for procedural 2D. Shader complexity impedes AI authoring.
- **Pixi.js/Phaser:** Game frameworks impose their own entity/scene model, conflicting with "no assumptions about game shape."
- **Rust/WASM:** Compile step, dramatically reduced AI-agent writability.
- **ECS (Entity-Component-System):** Over-engineering for small 2D games with hundreds of entities. The GDI is lower-level than ECS: "here's your state, advance it."

---

## 3. Input Architecture

### 3.1 The Input Frame

Every simulation tick, the platform constructs an input frame -- a snapshot of all channels:

```js
{
  thumb: {
    active: true,         // is a touch/pointer currently down?
    x: 0.63,              // normalized position in game viewport [0, 1]
    y: 0.41,
    vx: 0.02,             // velocity (units per second, normalized)
    vy: -0.15,
    startX: 0.60,         // where the current touch started
    startY: 0.55,
    duration: 0.340,      // how long current touch has been held (seconds)
  },
  gyro: {
    available: true,
    alpha: 0.12,          // rotation around Z (yaw)
    beta: 0.03,           // rotation around X (pitch)
    gamma: -0.08,         // rotation around Y (roll)
    // Calibrated: values are relative to the calibration pose (set when game starts)
  },
  taps: [
    // Completed taps this frame (touch down + up within thresholds)
    { x: 0.63, y: 0.41, time: 0.012 },  // time = seconds since frame start
  ],
  keys: {
    // Keyboard state (for desktop testing / bot spectator)
    left: false, right: false, up: false, down: false, space: false,
  },
}
```

### 3.2 Design Decisions

1. **All channels always present.** Even if the game only declared `['thumb']`, the frame still has `gyro`, `taps`, `keys` -- they're just null/empty. No input-shape polymorphism in game code.

2. **Thumb is continuous, taps are discrete.** A thumb-rect gives position every frame. Taps are only emitted on the frame they complete. A game that needs both gets both in the same frame.

3. **Velocity is platform-computed.** The platform tracks touch positions over time and computes velocity with smoothing. Games don't do their own velocity estimation.

4. **Gyro is calibrated.** The platform captures a reference orientation when the game starts and reports deltas from that reference. Games don't handle calibration. Values are normalized to -1..+1 based on configurable max-tilt angles (default: +/-30 degrees).

5. **Sub-frame tap timing.** `tap.time` records the actual timestamp relative to the frame, for games that need sub-tick accuracy (rhythm games).

6. **Desktop fallback.** Mouse -> thumb position. Arrow keys -> synthetic thumb. Space -> tap. Mouse wheel -> synthetic gyro tilt. Games work on desktop without any game-specific keyboard handling.

7. **Bots produce input frames directly.** Same `{ thumb, gyro, taps, keys }` structure. The platform pipeline is identical for human and bot play.

### 3.3 Gyro: Cross-Device Reality

Gyro support varies enormously across devices:
- iOS requires explicit `DeviceMotionEvent.requestPermission()` from a user gesture. The platform handles this via the settings screen.
- Android has no permission requirement but sensor quality ranges from excellent (Pixel, Samsung flagship) to nearly useless (budget devices).
- Sampling rate varies from 60Hz (iPhone) to 5Hz (cheap Android).
- The "lying-down problem" is real -- significant mobile gaming happens in positions where gyro is uncomfortable or impossible.

The platform's position: **gyro enhances, never required.** Every game must have a non-gyro fallback. The input system provides gyro when available and `{ available: false }` when not. Games that use gyro must check `gyro.available` and degrade gracefully.

### 3.4 The Thumb Rectangle

Research on one-handed thumb interaction shows:
- ~10mm touch targets achieve >95% success rate in the comfortable zone
- Effective precision is ~20px minimum on a 6" phone
- Continuous dragging throughput is ~3 bits/s (Fitts' Law)
- The comfortable reach zone covers roughly the bottom 60% of the screen

The thumb-rect provides coarse-to-medium positioning. Combined with gyro for fine adjustment, this covers the full motor control spectrum. Games designed around the thumb alone should use ~20px minimum effective precision for targets.

---

## 4. Rendering Architecture

### 4.1 The `draw` API

The renderer provides a `draw` object that games call from their `render` hook. All coordinates are in normalized game space (0-1).

```js
draw = {
  // Primitives
  circle(x, y, r, style),
  rect(x, y, w, h, style),
  line(x1, y1, x2, y2, style),
  arc(x, y, r, startAngle, endAngle, style),
  poly(points, style),           // arbitrary polygon

  // Text
  text(str, x, y, style),       // style: { size, align, fill, font, ... }

  // Composed
  ring(x, y, r, style),         // unfilled circle
  bar(x, y, w, h, fill, style), // progress/health bar

  // Transforms
  push(),                        // save transform state
  pop(),                         // restore transform state
  translate(x, y),
  rotate(angle),
  scale(sx, sy),

  // Effects (fire-and-forget, platform manages lifetime)
  particles(x, y, config),      // burst of particles at position
  shake(intensity, duration),    // screen shake
  float(str, x, y, config),     // floating text (rises and fades)
  flash(color, duration),        // full-screen flash

  // State
  alpha(a),                      // set global alpha
  blend(mode),                   // set blend mode

  // Viewport info (read-only)
  width,                         // game viewport width (always 1.0 for normalized)
  height,                        // game viewport height (aspect-dependent)

  // Raw access (escape hatch)
  ctx,                           // the raw CanvasRenderingContext2D
}
```

The `style` parameter on primitives:

```js
{
  fill: '#4af',           // fill color (CSS color string)
  stroke: '#fff',         // stroke color
  lineWidth: 0.002,       // in game units
  opacity: 0.8,           // per-shape opacity
  glow: 0.01,             // glow radius (shadow blur)
  gradient: {             // radial gradient (replaces fill)
    inner: '#fff',
    outer: '#4af',
  },
}
```

### 4.2 Coordinate System

All game rendering uses normalized coordinates:
- X: 0 (left) to 1 (right)
- Y: 0 (top) to `height` (bottom), where `height` = 1/aspect (e.g., 16/9 ~ 1.78 for portrait)

A circle at (0.5, 0.5) with radius 0.05 is always centered and always 5% of viewport width, regardless of device. The renderer handles DPI scaling, letterboxing, and orientation transparently.

### 4.3 Particle System

The platform provides a high-performance particle pool (Structure of Arrays layout for cache efficiency). Games trigger particle bursts via `draw.particles(x, y, config)`:

```js
draw.particles(0.5, 0.5, {
  count: 20,
  speed: { min: 0.1, max: 0.5 },
  angle: { min: 0, max: Math.PI * 2 },
  life: { min: 0.2, max: 0.6 },
  size: { min: 0.005, max: 0.015 },
  color: { r: [200, 255], g: [100, 200], b: [50, 100] },
  gravity: 0.5,
  fade: true,
  shrink: true,
});
```

The platform updates and renders particles independently. Games never track individual particles after spawning.

### 4.4 Screen Effects

- **Shake:** Random per-frame offset to the canvas transform, exponential decay.
- **Flash:** Full-screen color overlay, quick fade.
- **Floating text:** Score popups, damage numbers -- rise and fade out automatically.

### 4.5 Responsive Viewport

The renderer handles:
1. **Device pixel ratio** -- canvas resolution matches physical pixels for sharp rendering
2. **Aspect ratio** -- game declares preferred aspect; renderer letterboxes if device doesn't match
3. **Orientation** -- game declares portrait/landscape/any; shell requests orientation lock when possible
4. **Safe area** -- on notched devices, the game viewport insets from the notch
5. **Resize** -- canvas re-measures on `resize` event, recomputes transform

### 4.6 Renderer Swappability

The `draw` API is an abstraction layer. The current implementation uses Canvas 2D (`ctx.arc()`, `ctx.fillRect()`, etc.). If a future game needs 1000+ entities or heavy particle effects, a WebGL implementation can provide the same `draw` interface. Game code never changes -- only the renderer implementation behind `draw`.

---

## 5. Audio Architecture

### 5.1 Declarative Audio Events

Games emit audio events from their `audio()` hook. The platform plays them. Games never touch `AudioContext` directly.

Audio event types:

```js
// Simple tone
{ type: 'tone', freq: 440, duration: 0.15, gain: 0.3, wave: 'sine', env: 'pluck' }

// Noise burst (impacts, static, wind)
{ type: 'noise', duration: 0.2, gain: 0.4, filter: 'lowpass', filterFreq: 800 }

// Frequency sweep (risers, drops, lasers)
{ type: 'sweep', freqStart: 880, freqEnd: 110, duration: 0.3, gain: 0.3, wave: 'sawtooth' }

// Chord (multiple tones at once)
{ type: 'chord', freqs: [261, 329, 392], duration: 0.4, gain: 0.2, wave: 'triangle' }

// Drum hit (noise + tone layered)
{ type: 'drum', freq: 80, noiseGain: 0.5, toneGain: 0.5, duration: 0.1 }
```

### 5.2 Pre-defined Envelopes

```js
envelopes: {
  pluck:   { a: 0.005, d: 0.1,  s: 0.0, r: 0.1  },
  pad:     { a: 0.2,   d: 0.3,  s: 0.6, r: 0.5  },
  stab:    { a: 0.001, d: 0.05, s: 0.0, r: 0.05 },
  swell:   { a: 0.5,   d: 0.0,  s: 1.0, r: 0.3  },
}
```

Games reference envelopes by name. Custom envelopes can be passed inline as `{ a, d, s, r }`.

### 5.3 Audio Graph

```
Oscillator/Noise -> Gain (envelope) -> Game Bus -> Master Gain -> Compressor -> Destination
                                          |
                                       Delay -> Feedback -> Game Bus
                                       Reverb ------------> Game Bus (wet mix)
```

Voice pool limits concurrent voices (default: 16). When the pool is full, the oldest voice is stopped.

### 5.4 Musical Helpers

Optional helpers for games that want to be musical:

```js
audio.noteFreq('C4')      // -> 261.63
audio.noteFreq('A4')      // -> 440
audio.scale('C', 'minor') // -> [261.63, 293.66, 311.13, ...]
audio.chord('Cm')         // -> [261.63, 311.13, 392.00]
```

### 5.5 Browser Autoplay Policy

The platform handles `AudioContext` resumption. The audio context is created on first user gesture (tap to start game). Games don't manage this.

---

## 6. Evaluation Architecture

### 6.1 Philosophy

Evaluation answers: "Is this game experiment worth pursuing?" It does this via automated measurement, not human playtesting. The platform provides the **runner** (headless execution, sweep infrastructure, comparison tools). Games provide the **metrics** (what constitutes a good score, what the sweet spots are).

This split addresses a real concern: game-agnostic quality metrics are largely impossible. "Mortality 60-90%" is meaningful for an endless survival game and meaningless for a timed score-attack. The platform computes generic statistics (mean, variance, difficulty curve shape, skill discrimination ratio). Each game interprets those statistics according to its own design intent.

### 6.2 Module Decomposition

```
eval/
  runner.js      -- Headless single-game runner (returns score timeline)
  bot-ladder.js  -- Run a game at N difficulty levels, produce difficulty curve
  sweep.js       -- Parameter sweep (parallel headless runs)
  metrics.js     -- Cross-game statistical analysis
```

#### `eval/runner.js` -- Headless Game Runner

Runs a single game instance to completion:

```js
function runGame(game, { seed, params, botDifficulty, maxTicks }) {
  const rng = createRNG(seed);
  const instance = game.createGame(params);
  let state = instance.init(params);
  const botFn = instance.bot(botDifficulty, rng.fork('bot'));
  const simRng = rng.fork('sim');
  const dt = 1 / instance.meta.tickRate;
  const timeline = [];

  for (let tick = 0; tick < maxTicks; tick++) {
    const input = botFn(state, dt);
    state = instance.step(state, input, dt, simRng);

    if (tick % sampleInterval === 0) {
      timeline.push({ tick, score: instance.score(state) });
    }

    const s = instance.status(state);
    if (s !== 'playing' && s.ended) break;
  }

  return { finalScore: instance.score(state), timeline, tickCount: tick, seed, params };
}
```

Runs in Node.js or in a browser Web Worker. No DOM, no canvas, no audio.

#### `eval/bot-ladder.js` -- Difficulty Curve

Runs a game at N evenly-spaced difficulty levels (e.g., 0.0, 0.1, ..., 1.0) with M seeds each. Produces: `difficulty -> { meanScore, stddev, minScore, maxScore }`.

Difficulty curve shapes and what they tell you:
- **Linear rise:** Good skill gradient. Performance improves steadily with skill.
- **Flat:** Game is random. Skill doesn't matter.
- **Step function:** Binary threshold -- below it you fail, above it you succeed.
- **S-curve:** Easy floor, hard ceiling, interesting middle. Often ideal.

For PvP games, the ladder measures bot[i] vs bot[j] win rates, producing a **win-rate matrix** instead of a score curve.

#### `eval/sweep.js` -- Parameter Sweep

Varies game parameters across a grid, runs each configuration through the bot ladder, collects results:

```js
{
  game: 'steer',
  params: {
    speed: { min: 0.5, max: 3.0, steps: 6 },
    spawnRate: { min: 0.5, max: 5.0, steps: 6 },
  },
  fixed: { difficulty: 0.5 },
  seeds: 10,
  maxTicks: 3600,  // 60 seconds at 60Hz
}
```

This produces 6 x 6 x 10 = 360 headless runs. At 3600 ticks each, this completes in seconds on a modern machine. Runs in parallel via Web Workers or Node.js worker threads.

#### `eval/metrics.js` -- Statistical Analysis

Game-agnostic statistics that operate on numbers, not game concepts:

```js
function scoreDistribution(results)     // histogram of final scores
function difficultyCurve(ladderResults) // difficulty -> mean score
function skillCeiling(ladderResults)    // max meaningful difficulty before plateau
function variance(results)              // score variance
function separationIndex(ladderResults) // how well difficulty levels separate
                                        // (0 = can't tell apart, 1 = perfectly ranked)
```

These work identically for distance scores, accuracy percentages, territory ratios, chain lengths, or any other number. The metrics don't know or care what the numbers represent.

### 6.3 Replay

Because simulation is deterministic (seeded PRNG + fixed timestep), any run can be replayed by storing:

```js
{
  gameId: 'steer',
  version: '0.1.0',
  seed: 12345,
  params: { speed: 1.0, spawnRate: 2.0 },
  inputs: [/* one per tick */],
}
```

For bot runs, the replay is even smaller: just `{ seed, params, botDifficulty }` -- the bot is deterministic given the same state and RNG.

---

## 7. Shared UI Shell

### 7.1 Screen Flow

```
[Select Game] -> [Pre-Game] -> [Playing] -> [Results]
      |               |                        |
  [Settings]     [Bot Select]            [Replay]
      |
    [Lab]
```

- **Select Game:** Grid of available games. Name, live preview (1 second of bot play into thumbnail canvas), brief description.
- **Pre-Game:** Optional per-game config (difficulty for bot spectator, parameters if `configure()` exists). "Play" / "Watch Bot" toggle.
- **Playing:** Full-screen canvas with minimal HUD overlay (score, timer if applicable). Touch input goes to the game.
- **Results:** Final score, replay button, "Try Again" / "Back to Menu". For PvP: winner, score comparison.
- **Settings:** Audio volume, gyro calibration, display preferences. Platform-level.
- **Lab:** Auto-generated parameter sliders from `game.configure()`. Live preview. "Run Sweep" button.

### 7.2 Shell Minimalism

The shell handles lifecycle (start, play, end, retry) and games can override lifecycle if needed. The shell is minimal because:

1. Games render their own in-game HUD via `draw` -- the platform doesn't impose HUD structure.
2. The lifecycle model (start -> play -> die -> retry) fits the target genre (physics action games with sessions). Games with different session structures can implement their own lifecycle.
3. The real shared UI value is: canvas setup, resize handling, fullscreen toggle, orientation lock, game registration, and lab mode. These are genuinely reusable across all games.

### 7.3 Game Registration

```js
// index.js
import { Platform } from './platform/core.js';
import { createGame as createSteer } from './games/steer/game.js';

const platform = new Platform({
  canvas: document.getElementById('viewport'),
  shell: document.getElementById('shell'),
});

platform.register(createSteer);
platform.start();
```

Adding a new game: write the game module, import it, call `register()`. No platform code changes.

---

## 8. Module Decomposition

### 8.1 File Structure

```
/
+-- index.html              -- entry point, loads shell
+-- platform/
|   +-- core.js             -- game loop, lifecycle (~200 lines)
|   +-- input.js            -- input capture + frame construction (~250 lines)
|   +-- renderer.js         -- Canvas 2D draw API + effects (~400 lines)
|   +-- audio.js            -- Web Audio synthesis (~300 lines)
|   +-- shell.js            -- launcher UI, settings (~250 lines)
|   +-- rng.js              -- seeded PRNG (~80 lines)
|   +-- eval/
|       +-- runner.js       -- headless single-game runner (~100 lines)
|       +-- bot-ladder.js   -- difficulty curve evaluation (~100 lines)
|       +-- sweep.js        -- parameter sweep (~150 lines)
|       +-- metrics.js      -- statistical analysis (~100 lines)
+-- games/
|   +-- steer/
|   |   +-- game.js
|   +-- rhythm/
|   |   +-- game.js
|   +-- territory/
|   |   +-- game.js
|   +-- stack/
|   |   +-- game.js
|   +-- cascade/
|   |   +-- game.js
|   +-- chain-reaction/
|       +-- game.js         -- CR ported to the GDI
+-- sim.js                  -- Node.js CLI for headless evaluation
+-- package.json            -- { "type": "module" }
```

**Target: ~1500 lines for platform, ~300-600 lines per game.** Platform stays well under 2000. Games have no line limit.

### 8.2 Module Ownership

| Module | Owns | Does NOT Own |
|--------|------|-------------|
| `core.js` | Tick/render split loop, calling game hooks, state reference, accumulator-based fixed timestep | What game state is, input capture, drawing, sound |
| `input.js` | Touch/pointer/gyro/keyboard listeners, input frame construction, thumb tracking, velocity computation, tap detection, gyro calibration | What input means to a game, gesture recognition beyond taps, bot input |
| `renderer.js` | Canvas context, viewport computation, `draw` API, particles, screen effects, coordinate transform | What to draw, game-specific visuals, entity management |
| `audio.js` | Web Audio context lifecycle, voice pool, oscillator synthesis, ADSR envelopes, effects, master bus | When to play sounds, musical composition, game state |
| `shell.js` | Game selection, settings, results, lab mode, viewport setup | In-game HUD, game logic, evaluation |
| `rng.js` | xoshiro128** implementation, fork support | Game-specific randomness patterns |
| `eval/runner.js` | Running one game to completion headlessly, collecting score timeline | Bot logic, multi-run orchestration, statistical analysis |
| `eval/bot-ladder.js` | Running a game at N difficulty levels | Bot implementations, metric interpretation |
| `eval/sweep.js` | Parameter grid generation, parallel execution | Game-specific parameter ranges |
| `eval/metrics.js` | Score distribution, variance, separation index, curve analysis | Game-specific metric interpretation |

### 8.3 The Core Loop

```js
function tick(timestamp) {
  accumulator += (timestamp - lastTime);
  lastTime = timestamp;
  accumulator = Math.min(accumulator, maxAccumulator); // spiral-of-death cap

  while (accumulator >= tickDuration) {
    const inputFrame = input.capture();
    prevState = state;
    state = game.step(state, inputFrame, dt, rng);

    if (!headless) {
      const audioEvents = game.audio(prevState, state);
      audio.play(audioEvents);
    }

    const s = game.status(state);
    if (s !== 'playing' && s.ended) {
      onGameEnd(game.score(state), s.reason);
      return;
    }

    accumulator -= tickDuration;
  }

  if (!headless) {
    const alpha = accumulator / tickDuration;
    renderer.begin();
    game.render(state, renderer.draw, alpha);
    renderer.end();
    requestAnimationFrame(tick);
  }
}
```

For headless mode: a simple `while(playing) step()` without `requestAnimationFrame`.

---

## 9. Five Reference Games

These five games validate the GDI across genuinely different genres. Each uses different input channels, different state shapes, different score types, and different loop structures. If the GDI cannot express all five without friction, the interface is wrong.

### 9.1 STEER -- Obstacle-Dodge Racer

**Genre:** Continuous-control survival. **Input:** Thumb-rect (position) + gyro (fine steering). **Score:** Distance (monotonic, no ceiling).

**Core loop:** Player dodges scrolling obstacles. Thumb position pulls the player laterally; gyro tilt provides fine adjustment. Obstacles spawn from the top with increasing frequency and variety. Speed escalates over time.

**State shape:** `{ player: {x, y, vx}, obstacles: [], distance, alive, nextSpawn, speed }`. Simple: one player entity, an array of obstacles, scalar counters.

**Bot strategy:** Perfect bot identifies the widest gap between obstacles at the player's y-position and steers toward it. Imperfect bot adds positional noise proportional to `(1 - difficulty)`. Difficulty 0.0 = random thumb position. Difficulty 1.0 = always finds the optimal gap.

**Why it validates the GDI:** Tests continuous input (thumb + gyro), monotonic scoring, variable-speed spawning, and collision detection -- all inside a single `step()` call with no imposed phases.

### 9.2 RHYTHM -- Tap-to-Beat

**Genre:** Timing-precision rhythm game. **Input:** Taps (timing-critical). **Score:** Accuracy % (bounded 0-100).

**Core loop:** Beats scroll toward a hit zone. Player taps on-beat to score. Consecutive hits build a combo multiplier. Misses reset the combo. BPM can increase over time. Beat patterns are procedurally generated from the seed.

**State shape:** `{ beats: [{time, x, hit}], cursor, elapsed, hits, misses, combo, maxCombo, lastJudgment }`. No entities with physics -- a timeline of events and counters.

**Bot strategy:** Perfect bot taps at exactly the right moment. Imperfect bot adds timing noise: `(1 - difficulty) * timingWindow * random()`. Difficulty 0.0 = taps randomly, rarely on beat. Difficulty 1.0 = frame-perfect timing.

**Why it validates the GDI:** Tests discrete input (taps only), bounded scoring, a fundamentally different state shape (timeline, not spatial entities), and sub-tick timing via `tap.time`. The `step()` function advances a cursor through a beatmap, not physics.

### 9.3 TERRITORY -- Area-Control PvP

**Genre:** Real-time territorial strategy. **Input:** Thumb (aim cursor) + taps (place claim). **Players:** 2. **Score:** Territory % per player (comparative).

**Core loop:** Two players place claims on a grid. Claims cost energy, which regenerates over time. Claimed cells spread influence to neighbors over time. Contested cells are harder to flip. Game ends when time expires; player with more territory wins.

**State shape:** `{ grid: Uint8Array, gridSize, cursors: [{x,y}, {x,y}], energy: [n, n], timeLeft }`. A flat grid, not a list of entities.

**Bot strategy:** Low difficulty = random cell placement. High difficulty = targets cells that maximize influence spread while contesting opponent territory. The bot function receives the full game state and produces an input frame with cursor position and tap.

**Why it validates the GDI:** Tests 2-player input (array of input frames), PvP scoring (winner field), grid-based state (not entities), time-limited games (game manages its own timer), and fundamentally different evaluation (win-rate matrix, not score curve).

### 9.4 STACK -- Construction / Stacking

**Genre:** Physics-based construction. **Input:** Thumb (horizontal aim) + tap (release piece). **Score:** Height reached (monotonic, with collapse risk).

**Core loop:** Pieces fall one at a time from the top. Player controls horizontal position with thumb, taps to release. Pieces stack on each other with simplified physics (gravity, collision, friction). The goal is maximum tower height. Pieces have varying shapes (rectangles of different aspect ratios) and mass. Poor stacking causes collapse.

**State shape:** `{ tower: [{x, y, w, h, vx, vy, settled}], activePiece: {x, w, h}, height, maxHeight, collapsed }`. A tower of settled pieces plus one active piece.

**Bot strategy:** Perfect bot calculates the center of mass of the tower and places the next piece to minimize instability. Imperfect bot adds horizontal noise to placement. Difficulty scales the noise level and whether the bot accounts for piece shape.

**Why it validates the GDI:** Tests a turn-based-ish rhythm (wait for settle, then next piece), simplified rigid-body physics that the game implements internally, construction-oriented scoring (height with regression on collapse), and a very different feel from the other four games.

### 9.5 CASCADE -- Tap-Chain Reaction

**Genre:** Single-tap physics puzzle. **Input:** Single tap (placement-critical). **Score:** Chain length or score (discrete outcome per round).

**Core loop:** A field of entities drifts in a physics simulation. Player observes, then taps once to trigger a cascade. The cascade propagates through the field based on proximity and game rules. Score depends on how many entities are caught in the chain. Multiple rounds with increasing field complexity.

**State shape:** `{ entities: [{x, y, vx, vy, type, state}], phase: 'observe'|'cascade'|'scoring', cascadeTimer, round, score, totalScore }`. Entities with physics plus a phase state machine.

**Bot strategy:** Search-based. For each candidate tap position on a grid, simulate the cascade headlessly and measure the resulting score. Pick the position that maximizes score. Difficulty scales grid resolution (more candidates = better search = harder bot). This is the one game type where a search-based oracle bot is tractable.

**Why it validates the GDI:** Tests single-shot input (one tap per round), multi-phase game flow managed entirely in `step()` (observe -> cascade -> scoring), search-based bot evaluation, and discrete per-round scoring.

### 9.6 Verification Matrix

| Hook | STEER | RHYTHM | TERRITORY | STACK | CASCADE |
|------|-------|--------|-----------|-------|---------|
| `meta` | 1P, thumb+gyro, 60Hz, portrait | 1P, tap, 60Hz, portrait | 2P, thumb+tap, 30Hz, landscape | 1P, thumb+tap, 60Hz, portrait | 1P, tap, 60Hz, portrait |
| `init` | Player + obstacle list | Beat map + counters | Grid + cursors + energy | Tower array + active piece | Entity field + phase |
| `step` | Move + spawn + collide | Advance cursor + judge | Move cursors + place + spread | Drop + settle + collapse | Observe/cascade/score FSM |
| `render` | Circles + rects | Falling circles + judgment text | Grid cells + cursors | Stacked blocks + active piece | Field + explosion rings |
| `audio` | Milestone tones + crash | Hit/miss feedback tones | Capture plinks | Place thud + collapse noise | Chain crescendo |
| `score` | Distance (monotonic) | Accuracy % (bounded) | Territory % x 2 (PvP) | Height (monotonic, fragile) | Chain length (discrete) |
| `status` | alive/dead | All beats processed | Time expired | Collapsed or topped out | All rounds complete |
| `bot` | Dodge to gap + noise | Tap with timing noise | Strategic cell targeting | Center-of-mass placement | Grid search over tap positions |

Every game fits cleanly. No game needs to work around interface assumptions. No game leaves hooks unused in a way that suggests the hook only exists for other games.

---

## 10. Honest Scope Acknowledgments

The skeptic's review raised valid concerns. Rather than dismiss them, the spec addresses them directly.

### 10.1 The Platform's Sweet Spot

The platform provides the strongest value (~40-50% of game code) for **real-time physics action games** -- games with entities that move, collide, and produce visual/audio feedback. This includes steering games, aim-and-shoot games, physics puzzles, and action hybrids.

It provides moderate value (~25-35%) for **adjacent genres** -- rhythm games, construction games, simple strategy games with real-time elements.

It provides minimal value (~10-15%) for games far from the sweet spot -- turn-based strategy, card games, word games, simulation games with complex non-physics state. The genuinely universal infrastructure (headless runner, parameter sweep, statistical comparison, input normalization, canvas setup) helps any game, but it's a thin layer.

The GDI interface itself does not exclude these outer-ring games -- they can implement `step()` however they want. But they get less free infrastructure. This is acknowledged, not apologized for. The human's taste runs toward physics-action games, and the platform is optimized for what it will actually build.

### 10.2 Quality Metrics Are Game-Specific

The platform provides computation (score distributions, difficulty curves, variance, separation indices). **Games provide interpretation.** There are no platform-wide "sweet spot ranges" -- what constitutes a healthy difficulty curve depends entirely on the game's design intent.

A survival game wants low mortality at low difficulty and high mortality at high difficulty. A timed score-attack wants 0% mortality (every game completes) with wide score spread. A PvP game wants a balanced win-rate matrix. The platform computes all of these. The game decides what "good" looks like.

### 10.3 "Theoretically Perfect Play" Is a Gradient

Difficulty 0.0 to 1.0 is a spectrum, not a binary. At 1.0, the bot plays the best it can given its implementation. For games with small, discretizable action spaces (single-tap placement), search-based bots can approach true optimality. For games with continuous control (steering), the bot uses the best heuristic available -- "best the bot can do" is still useful for establishing an upper bound and measuring skill gradients, even if it isn't provably optimal.

The spec does NOT claim that all games have computable perfect play. It claims that calibrated difficulty gradients are useful evaluation tools. They are.

### 10.4 The Design-to-Implementation Ratio

The skeptic's strongest point: thousands of lines of design documents and zero lines of platform code is an unhealthy ratio. This spec is the **last prose artifact** before implementation begins. The next artifact is code.

---

## 11. Architectural Decisions Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | **Allow state mutation** | Immutable state creates GC pressure at 60Hz. Games MAY mutate and return state. Platform stores `prevState` for `audio()` diffing via shallow copy. |
| D2 | **No Entity-Component System** | ECS assumes entities with components -- too opinionated. Some games have entities; others have grids, timelines, or state machines. The GDI is lower-level: "here's your state, advance it." |
| D3 | **Bots produce input frames, not actions** | Identical pipeline for human and bot play. No separate "action" abstraction. No "action-to-input" translation. |
| D4 | **Declarative audio events** | Games say WHAT to play, platform says HOW. Headless mode: events are discarded. Games never handle AudioContext, autoplay policy, or voice pooling. |
| D5 | **No platform physics module** | "Physics" means different things to different games. Simple AABB for one, rigid body for another, cellular automata for a third. Games bring their own. |
| D6 | **Normalized coordinates [0,1]** | Games never think about pixels, DPI, or device size. Renderer handles mapping. Works identically across screen sizes. |
| D7 | **Fixed timestep with accumulator** | Essential for deterministic simulation. Variable timestep makes determinism impossible. Accumulator handles frame rate jank. |
| D8 | **Input channels declared, not requested** | All channels always present in the input frame. Simplifies shape. Bots always know what to synthesize. Declaration is informational for UI hints and bot guidance. |
| D9 | **No plugin system** | Games are imported directly. No dynamic loading, registry, or manifest. The codebase is small. Adding a game is adding an import. |
| D10 | **Structured score reports** | Different games score differently. `{ primary, label, unit, format, breakdown, normalized }` lets the platform display scores and evaluate across games without game-specific UI code. |

---

## 12. Implementation Plan

Ordered by dependency and value. Each step produces something testable. **The next artifact after this spec is Step 1 code.**

### Step 1: Foundation -- Headless Execution

**Files:** `platform/rng.js`, `platform/core.js`, `platform/eval/runner.js`, `sim.js`

Build the seeded PRNG, the headless game loop, and the headless runner. Write `sim.js` as a Node.js CLI: `node sim.js --game steer --difficulty 0.5 --seed 42`.

**Exit criterion:** A game module can be loaded and run to completion headlessly in Node.js, producing a score timeline. Deterministic: same seed + same bot difficulty = same result.

### Step 2: Minimal Test Game (Not Chain Reaction)

**Files:** `games/dodge/game.js` (a stripped-down STEER variant)

Write a minimal game that implements the GDI -- just enough to validate the interface. Player dot, scrolling obstacles, collision = game over. A trivial bot. ~100 lines.

**Exit criterion:** `node sim.js --game dodge --difficulty 0.5 --seed 42` runs and prints a score. Run it twice, get the same score.

### Step 3: Evaluation Pipeline

**Files:** `platform/eval/bot-ladder.js`, `platform/eval/sweep.js`, `platform/eval/metrics.js`

Build the bot ladder (run at N difficulty levels), the parameter sweep (grid over parameter space), and the metrics module (score distribution, difficulty curve, separation index).

**Exit criterion:** `node sim.js --game dodge --ladder` prints a difficulty curve. `node sim.js --game dodge --sweep` runs a parameter sweep and outputs results as JSON.

### Step 4: Input System

**Files:** `platform/input.js`

Build touch/pointer/gyro/keyboard capture, input frame construction, thumb tracking with velocity, tap detection, gyro calibration, desktop fallback.

**Exit criterion:** Load in a browser, move thumb on a phone, see correct input frames logged. Gyro reports calibrated values. Taps are detected. Desktop keyboard produces synthetic input.

### Step 5: Renderer

**Files:** `platform/renderer.js`

Build the Canvas 2D draw API, viewport management, coordinate transform, particle pool (SoA), screen shake, floating text, flash.

**Exit criterion:** The test game renders in a browser with smooth animation, correct aspect ratio, particles, and screen shake on collision.

### Step 6: Audio

**Files:** `platform/audio.js`

Build Web Audio synthesis: voice pool, oscillator/noise generation, ADSR envelopes, pre-defined envelopes, frequency sweep, chord, drum, master bus with compressor.

**Exit criterion:** The test game plays synthesized audio events. Voice pooling works (no crackling at high event rates). AudioContext resumes correctly after user gesture.

### Step 7: Shell

**Files:** `platform/shell.js`, `index.html`

Build the game selection screen, settings, results, lab mode (auto-generated sliders from `configure()`), viewport setup.

**Exit criterion:** Open `index.html`, see game list, select a game, play it, see results, replay, return to menu. Lab sliders adjust parameters in real-time.

### Step 8: Port Chain Reaction

**Files:** `games/chain-reaction/game.js`

Port the existing Chain Reaction game onto the GDI. Extract the game logic from the current monolithic architecture into the `createGame()` factory pattern. Bots produce input frames, not actions.

**Exit criterion:** Chain Reaction is playable through the platform shell and evaluable through the bot ladder and sweep tools. Results are comparable to the pre-platform evaluation data.

### Step 9: Build 4+ Genuinely Different Games

**Files:** `games/steer/game.js`, `games/rhythm/game.js`, `games/territory/game.js`, `games/stack/game.js`

Build the four remaining reference games. Each validates a different aspect of the GDI (continuous control, timing precision, PvP, construction physics). If any game fights the interface, fix the interface before proceeding.

**Exit criterion:** Five genuinely different games run on the platform. Each passes bot evaluation. The human plays each and provides a taste verdict.

---

## 13. What This Architecture Does NOT Do

Explicit non-goals to prevent scope creep:

1. **No networking.** Games are local-only. Bot-vs-bot PvP runs on one machine.
2. **No persistence.** No high scores, no progression, no save/load. Evaluation results are logged to console or file.
3. **No asset loading.** No images, no audio files, no fonts (use system fonts). Everything is procedural.
4. **No physics engine.** Games bring their own physics.
5. **No scene graph.** Games call draw primitives directly. No retained-mode rendering.
6. **No game-to-game communication.** Games are isolated.
7. **No hot reload.** Change code, refresh browser. The codebase is small enough that this is sub-second.
8. **No analytics/telemetry.** Evaluation is the measurement tool.
9. **No configuration files or plugin registries.** Games are imported directly.
10. **No music/composition system.** Audio is event-based synthesis, not sequenced playback.

---

## 14. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Audio events too limited for musical games | Medium | RHYTHM sounds bad | Audio event types are extensible. Games can pass custom `{ a, d, s, r }` envelopes. If a game needs richer audio, extend the event vocabulary. |
| Normalized coordinates make pixel-precise rendering hard | Low | Visual artifacts at small scales | Renderer snaps to pixel grid for lines and rects. Games can access `draw.ctx` for raw pixel control. |
| State mutation makes replay verification tricky | Low | Replay divergence | Dev-mode assertion: run game twice with same seed/inputs, compare final states. |
| Canvas 2D performance ceiling hit | Medium | Particle-heavy game drops frames on mobile | Design renderer as swappable. WebGL implementation of same `draw` API is the upgrade path. Game code unchanged. |
| Some games need sub-tick timing | Medium | Rhythm game tap accuracy capped at tick resolution | Input frame includes `tap.time` with sub-frame precision. |
| Game state too large for structuredClone | Low | Performance issue on snapshot | Only snapshot when needed. Shallow copy for `prevState`. Games do their own deep comparison if needed. |
| The 1500-line budget is too tight | Medium | Features cut or budget violated | Track line count after each module. Every line beyond budget needs justification: "saves 50+ lines in every game." |
| Platform becomes harder to understand than writing from scratch | Low | Maintenance burden | 1500-line limit is the primary defense. Every platform change tested against all existing games. |

---

## 15. Summary

The Game Experimentation Platform is:

- **A thin runtime** (~1500 lines) that calls game hooks at the right time: `init`, `step`, `render`, `audio`, `score`, `status`
- **A rich input layer** that captures thumb position + velocity, gyro orientation, and taps as per-frame snapshots
- **A declarative rendering API** with procedural primitives, particles, and screen effects in normalized [0,1] coordinates
- **A synthesized audio engine** that plays declarative sound events via Web Audio
- **A headless evaluation framework** that runs games without a browser for bot ladders and parameter sweeps
- **A shared UI shell** that launches any game from one interface with auto-generated tuning controls

The game interface is 7 required hooks and 2 optional hooks. It assumes nothing about what a game simulates, how it scores, or what input it uses. Five completely different game genres were validated against the interface. The platform's sweet spot is real-time physics action games, but the interface does not exclude other types.

**This document is the last prose artifact. The next artifact is code: `platform/rng.js`.**
