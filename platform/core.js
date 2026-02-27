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
export function createBrowserRunner(game, canvas, { seed, params = {}, mode = 'play', botDifficulty = 0.5 } = {}) {
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
  let tickCount = 0;

  // Input recording for replays
  const inputLog = [];

  // Bot function (created for bot and pvp modes)
  const botFn = ((mode === 'bot' || mode === 'pvp') && g.bot)
    ? g.bot(botDifficulty, rng.fork('bot'))
    : null;

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
      let input;
      if (mode === 'pvp' && botFn && inputCapture) {
        // PvP: player 1 is human, player 2 is bot
        input = [inputCapture.capture(), botFn(state, dt)];
      } else if (botFn) {
        input = botFn(state, dt);
      } else if (inputCapture) {
        input = inputCapture.capture();
      } else {
        input = emptyInput();
      }
      inputLog.push(compactInput(input));
      tickCount++;
      // Deep copy for audio diffing — games mutate state in place
      prevState = JSON.parse(JSON.stringify(state));
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
    get seed() { return seed; },
    get config() { return config; },
    get ticks() { return tickCount; },
    get mode() { return mode; },

    getSession() {
      return {
        seed,
        config,
        gameId: g.meta.id,
        ticks: tickCount,
        score: g.score(state),
        status: g.status(state),
        inputs: inputLog,
        timestamp: Date.now(),
        botPlay: mode === 'bot' ? botDifficulty : undefined,
      };
    },

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
      inputLog.length = 0;
      tickCount = 0;
      this.start();
    },

    setInput(input) { inputCapture = input; },
    setRenderer(r) { renderer = r; },
    setAudio(a) { audioEngine = a; },
    setOnEnd(fn) { onEnd = fn; },
  };
}

// ---------------------------------------------------------------------------
// Replay runner — replays a recorded session with rendering
// ---------------------------------------------------------------------------
export function createReplayRunner(game, canvas, session) {
  const rng = createRNG(session.seed);
  const config = session.config || {};
  const g = game.createGame(config);
  const dt = 1 / (g.meta.tickRate || 60);
  const tickMs = dt * 1000;
  const inputs = session.inputs || [];

  let state = g.init(config);
  let prevState = state;
  let accumulator = 0;
  let lastTime = 0;
  let running = false;
  let rafId = null;
  let tickCount = 0;

  let renderer = null;
  let audioEngine = null;
  let onEnd = null;

  function tick(timestamp) {
    if (!running) return;

    if (lastTime === 0) lastTime = timestamp;
    accumulator += (timestamp - lastTime);
    lastTime = timestamp;

    if (accumulator > 200) accumulator = 200;

    while (accumulator >= tickMs) {
      if (tickCount >= inputs.length) {
        running = false;
        if (onEnd) onEnd(g.score(state), 'replay_end');
        return;
      }

      const compact = inputs[tickCount];
      const input = (compact && Object.keys(compact).length > 0) ? expandInput(compact) : emptyInput();
      tickCount++;
      prevState = JSON.parse(JSON.stringify(state));
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
    get ticks() { return tickCount; },
    get totalTicks() { return inputs.length; },
    get mode() { return 'replay'; },

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

    setRenderer(r) { renderer = r; },
    setAudio(a) { audioEngine = a; },
    setOnEnd(fn) { onEnd = fn; },
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export function resolveParams(game, overrides) {
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

// Compact input for replay storage — only store non-null fields
function compactInput(input) {
  const c = {};
  if (input.thumb) {
    // Round to 4 decimal places to save space
    c.t = [
      Math.round(input.thumb.x * 10000) / 10000,
      Math.round(input.thumb.y * 10000) / 10000,
    ];
  }
  if (input.gyro) {
    c.g = [
      Math.round(input.gyro.tiltX * 1000) / 1000,
      Math.round(input.gyro.tiltY * 1000) / 1000,
    ];
  }
  if (input.taps && input.taps.length > 0) {
    c.p = input.taps.map(t => [
      Math.round(t.x * 10000) / 10000,
      Math.round(t.y * 10000) / 10000,
    ]);
  }
  if (input.keys) {
    const pressed = Object.keys(input.keys).filter(k => input.keys[k]);
    if (pressed.length > 0) c.k = pressed;
  }
  return c;
}

// Expand compact input back to full format (for replay playback)
export function expandInput(compact) {
  const input = emptyInput();
  if (compact.t) {
    input.thumb = {
      active: true,
      x: compact.t[0], y: compact.t[1],
      vx: 0, vy: 0,
      startX: compact.t[0], startY: compact.t[1],
      duration: 0,
    };
  }
  if (compact.g) {
    input.gyro = {
      tiltX: compact.g[0], tiltY: compact.g[1],
      alpha: 0, beta: 0, gamma: 0,
    };
  }
  if (compact.p) {
    input.taps = compact.p.map(p => ({ x: p[0], y: p[1], time: 0 }));
  }
  if (compact.k) {
    for (const k of compact.k) input.keys[k] = true;
  }
  return input;
}
