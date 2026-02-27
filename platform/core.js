// platform/core.js — Game loop, lifecycle, headless/rendered execution
// The platform calls the game, not the other way around.
// Games are pure modules: init/step/render/audio/score/status

import { createRNG } from './rng.js';

// ---------------------------------------------------------------------------
// Headless runner — runs a game to completion without rendering
// Used by eval/ for bot evaluation, sweeps, experiments
// ---------------------------------------------------------------------------
export function runHeadless(game, { seed = 1, params = {}, botDifficulty = null, maxTicks = 60000 } = {}) {
  const rng = createRNG(seed);
  const config = resolveParams(game, params);
  const g = game.createGame(config);
  let state = g.init(config);
  const dt = 1 / (g.meta.tickRate || 60);

  const botFn = (botDifficulty !== null && g.bot)
    ? g.bot(botDifficulty, rng.fork('bot'))
    : null;

  const scores = [];
  let tick = 0;

  while (tick < maxTicks) {
    const input = botFn ? botFn(state, dt) : emptyInput();
    state = g.step(state, input, dt, rng);
    tick++;

    const s = g.status(state);
    if (s !== 'playing') {
      scores.push(g.score(state));
      return {
        state,
        score: g.score(state),
        ticks: tick,
        time: tick * dt,
        endReason: s.reason || 'ended',
      };
    }
  }

  // Hit tick limit
  return {
    state,
    score: g.score(state),
    ticks: tick,
    time: tick * dt,
    endReason: 'timeout',
  };
}

// ---------------------------------------------------------------------------
// Browser runner — runs a game with rendering and real input
// ---------------------------------------------------------------------------
export function createBrowserRunner(game, canvas, { seed, params = {}, audioCtx = null } = {}) {
  seed = seed || Math.floor(Math.random() * 2147483647);
  const rng = createRNG(seed);
  const config = resolveParams(game, params);
  const g = game.createGame(config);
  const dt = 1 / (g.meta.tickRate || 60);
  const tickMs = dt * 1000;

  let state = g.init(config);
  let prevState = state;
  let accumulator = 0;
  let lastTime = 0;
  let running = false;
  let rafId = null;

  // These are injected by the shell/platform
  let inputCapture = null;
  let renderer = null;
  let audioEngine = null;
  let onEnd = null;

  function tick(timestamp) {
    if (!running) return;

    if (lastTime === 0) lastTime = timestamp;
    accumulator += (timestamp - lastTime);
    lastTime = timestamp;

    // Spiral-of-death cap: never accumulate more than 200ms
    if (accumulator > 200) accumulator = 200;

    while (accumulator >= tickMs) {
      const input = inputCapture ? inputCapture.capture() : emptyInput();
      prevState = state;
      state = g.step(state, input, dt, rng);

      if (audioEngine && g.audio) {
        const events = g.audio(prevState, state);
        if (events && events.length > 0) {
          audioEngine.play(events);
        }
      }

      const s = g.status(state);
      if (s !== 'playing') {
        running = false;
        if (onEnd) onEnd(g.score(state), s.reason || 'ended');
        return;
      }

      accumulator -= tickMs;
    }

    if (renderer && g.render) {
      const alpha = accumulator / tickMs;
      renderer.begin(canvas);
      g.render(state, renderer.draw, alpha);
      renderer.end();
    }

    rafId = requestAnimationFrame(tick);
  }

  return {
    get state() { return state; },
    get game() { return g; },
    get meta() { return g.meta; },

    start() {
      running = true;
      lastTime = 0;
      accumulator = 0;
      rafId = requestAnimationFrame(tick);
    },

    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },

    restart() {
      this.stop();
      state = g.init(config);
      prevState = state;
      this.start();
    },

    setInput(input) { inputCapture = input; },
    setRenderer(r) { renderer = r; },
    setAudio(a) { audioEngine = a; },
    setOnEnd(fn) { onEnd = fn; },
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function resolveParams(game, overrides) {
  const g = game.createGame({});
  const defs = g.configure ? g.configure() : [];
  const defaults = {};
  for (const def of defs) {
    defaults[def.key] = def.default;
  }
  return { ...defaults, ...overrides };
}

export function emptyInput() {
  return {
    thumb: null,
    gyro: null,
    taps: [],
    keys: {},
  };
}
