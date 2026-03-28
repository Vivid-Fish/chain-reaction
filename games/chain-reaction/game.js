// games/chain-reaction/game.js — Chain Reaction adapted to Game Lab GDI
// Wraps the existing game-core.js Game class with a thin coordinate adapter.
// Physics, chain resolution, bots: all from core.js (untouched).

import { Game, Bots, BotRunner, BOT_PROFILES, DEFAULTS, CONTINUOUS_TIERS, DOT_TYPES } from './core.js';

// Reference viewport — game-core.js normalizes physics to this size
const REF_W = 390;
const REF_H = 844;

export function createGame(config) {
  const TICK_RATE = 60;
  const DT_MS = 1000 / TICK_RATE; // game-core.step() expects ms

  return {
    meta: {
      id: 'chain-reaction',
      name: 'Chain Reaction',
      version: '1.0.0',
      players: 1,
      inputChannels: ['taps'],
      tickRate: TICK_RATE,
      viewport: { orientation: 'portrait', aspect: 9 / 16 },
    },

    init(params) {
      const tier = params.tier || 'FLOW';
      const tierCfg = CONTINUOUS_TIERS[tier];
      const game = new Game(REF_W, REF_H, {}, Math.random);
      game.startContinuous(tierCfg);
      return {
        game,
        tier,
        tierCfg,
        // Track events for audio
        lastChainCount: 0,
        lastScore: 0,
        lastCelebrationIdx: -1,
        pendingEvents: [],
        // Visual state
        dotRender: new Map(), // dot index -> { trail, alpha, pulsePhase }
        time: 0,
      };
    },

    step(state, input, dt, rng) {
      const { game } = state;

      // Process taps — convert from normalized [0,1] to pixel coords
      if (input.taps) {
        for (const tap of input.taps) {
          const px = tap.x * REF_W;
          const py = tap.y * REF_H;
          game.tap(px, py);
        }
      }

      // Drain events before step (so we can diff)
      state.lastChainCount = game.chainCount;
      state.lastScore = game.score;

      // game-core step expects dt in milliseconds
      game.step(DT_MS);

      // Collect events emitted by game-core
      if (game.events.length > 0) {
        state.pendingEvents.push(...game.events);
        game.events = [];
      }

      // Update dot visual state
      state.time += dt;
      for (let i = 0; i < game.dots.length; i++) {
        const d = game.dots[i];
        if (!state.dotRender.has(i)) {
          state.dotRender.set(i, { trail: [], alpha: 0, pulsePhase: rng.float(0, Math.PI * 2) });
        }
        const dr = state.dotRender.get(i);
        if (d.active) {
          if (dr.alpha < 1) dr.alpha = Math.min(1, dr.alpha + 0.025);
          dr.pulsePhase += 0.05;
          dr.trail.push({ x: d.x / REF_W, y: d.y / REF_H });
          if (dr.trail.length > 8) dr.trail.shift();
        }
      }

      return state;
    },

    render(state, draw, alpha) {
      const { game } = state;

      // Background
      draw.clear(0.016, 0.016, 0.06);

      // Vignette effect
      const ctx = draw.ctx;
      if (ctx) {
        const cw = ctx.canvas.width, ch = ctx.canvas.height;
        const vg = ctx.createRadialGradient(cw/2, ch/2, cw * 0.2, cw/2, ch/2, cw * 0.7);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, cw, ch);
      }

      // Draw connections between nearby dots (showing chainable pairs)
      const eR = game.explosionRadius / REF_W; // normalized explosion radius
      for (let i = 0; i < game.dots.length; i++) {
        const a = game.dots[i];
        if (!a.active) continue;
        const ax = a.x / REF_W, ay = a.y / REF_H;
        for (let j = i + 1; j < game.dots.length; j++) {
          const b = game.dots[j];
          if (!b.active) continue;
          const bx = b.x / REF_W, by = b.y / REF_H;
          const dist = Math.hypot((ax - bx) * (REF_W / REF_H), ay - by);
          if (dist < eR * 2.2) {
            const opacity = Math.max(0, 1 - dist / (eR * 2.2)) * 0.08;
            draw.line(ax, ay, bx, by, { color: `rgba(100,180,255,${opacity})`, width: 1 });
          }
        }
      }

      // Draw dot trails
      for (let i = 0; i < game.dots.length; i++) {
        const d = game.dots[i];
        const dr = state.dotRender.get(i);
        if (!dr || !d.active) continue;
        for (let t = 0; t < dr.trail.length - 1; t++) {
          const pt = dr.trail[t];
          const tp = (t + 1) / dr.trail.length;
          const hue = getDotHue(d);
          draw.circle(pt.x, pt.y, 0.004 * tp, {
            fill: `hsla(${hue}, 70%, 60%, ${tp * 0.15 * dr.alpha})`,
          });
        }
      }

      // Draw explosions
      for (const e of game.explosions) {
        if (e.phase === 'done') continue;
        const ex = e.x / REF_W, ey = e.y / REF_H;
        const er = e.radius / REF_W;
        const maxR = e.maxRadius / REF_W;

        let opacity = 1;
        if (e.phase === 'shrink') {
          const t = (e.age - DEFAULTS.EXPLOSION_GROW_MS - e.holdMs) / DEFAULTS.EXPLOSION_SHRINK_MS;
          opacity = Math.max(0, 1 - t * t);
        }

        // Outer glow
        if (e.generation > 0) {
          const genHue = e.dotType === 'gravity' ? 270 : e.dotType === 'volatile' ? 15 : 200;
          draw.circle(ex, ey, er * 1.8, {
            fill: `hsla(${genHue}, 60%, 50%, ${opacity * 0.08})`,
          });
        }

        // Core explosion circle
        const coreHue = e.generation === 0 ? 200 : (e.dotType === 'gravity' ? 270 : e.dotType === 'volatile' ? 30 : 195);
        draw.circle(ex, ey, er, {
          fill: `hsla(${coreHue}, 70%, 65%, ${opacity * 0.25})`,
          stroke: `hsla(${coreHue}, 80%, 75%, ${opacity * 0.5})`,
          strokeWidth: 2,
        });

        // Edge ring
        draw.circle(ex, ey, er * 0.95, {
          stroke: `hsla(${coreHue}, 90%, 85%, ${opacity * 0.3})`,
          strokeWidth: 1,
        });
      }

      // Draw dots
      for (let i = 0; i < game.dots.length; i++) {
        const d = game.dots[i];
        if (!d.active) {
          // Bloom flash on detonation
          if (d.bloomTimer > 0) {
            const bt = 1 - d.bloomTimer / 12;
            const dx = d.x / REF_W, dy = d.y / REF_H;
            const hue = getDotHue(d);
            const br = 0.01 * (1 + bt * 5);
            draw.circle(dx, dy, br, {
              fill: `hsla(${hue}, 70%, 95%, ${(1 - bt) * 0.7})`,
              glow: br * 0.5,
              glowColor: `hsla(${hue}, 80%, 70%, ${(1 - bt) * 0.4})`,
            });
            d.bloomTimer--;
          }
          continue;
        }
        const dr = state.dotRender.get(i);
        const a = dr ? dr.alpha : 1;
        const hue = getDotHue(d);
        const pulse = dr ? Math.sin(dr.pulsePhase) * 0.2 + 0.8 : 1;
        const massMult = d._massMult || 1;
        const r = 0.012 * pulse * Math.sqrt(massMult);
        const dx = d.x / REF_W, dy = d.y / REF_H;

        // Outer glow
        draw.circle(dx, dy, r * 3, {
          fill: `hsla(${hue}, 85%, 70%, ${a * 0.12})`,
        });

        // Core dot
        draw.circle(dx, dy, r, {
          fill: `hsla(${hue}, 85%, ${65 + pulse * 10}%, ${a})`,
          glow: r * 0.8,
          glowColor: `hsla(${hue}, 80%, 60%, ${a * 0.3})`,
        });

        // Type indicators
        if (d.type === 'gravity') {
          // Spiral lines toward center
          const t = state.time * 2;
          for (let s = 0; s < 3; s++) {
            const angle = t + s * (Math.PI * 2 / 3);
            const outerR = r * 4;
            const ox = dx + Math.cos(angle) * outerR;
            const oy = dy + Math.sin(angle) * outerR;
            draw.line(ox, oy, dx + Math.cos(angle + 0.3) * r * 1.5, dy + Math.sin(angle + 0.3) * r * 1.5, {
              color: `hsla(270, 60%, 75%, ${a * 0.2})`, width: 1,
            });
          }
        }
        if (d.type === 'volatile') {
          // Jittery sparks
          const t = state.time * 4;
          for (let s = 0; s < 4; s++) {
            const sa = t + s * (Math.PI / 2) + Math.sin(t * 3 + s) * 0.5;
            const sr = r * (1.5 + 0.8 * Math.sin(t * 5 + s * 2));
            draw.circle(dx + Math.cos(sa) * sr, dy + Math.sin(sa) * sr, 0.002, {
              fill: `hsla(15, 100%, 70%, ${a * (0.3 + 0.2 * Math.sin(t * 6 + s))})`,
            });
          }
        }
      }

      // HUD — Score
      draw.text(`${game.score}`, 0.5, 0.04, {
        size: 0.04, align: 'center', color: 'rgba(255,255,255,0.9)', weight: 'bold',
      });

      // Chain count during resolution
      if (game.gameState === 'resolving' && game.chainCount > 0) {
        const pct = game.totalDots > 0 ? game.chainCount / game.totalDots : 0;
        const chainHue = pct > 0.5 ? 50 : 200;
        draw.text(`${game.chainCount} chain`, 0.5, 0.09, {
          size: 0.025, align: 'center', color: `hsla(${chainHue}, 70%, 75%, 0.8)`,
        });
      }

      // Multiplier
      if (game.currentMultiplier > 1) {
        draw.text(`x${game.currentMultiplier}`, 0.5, 0.13, {
          size: 0.03, align: 'center', color: 'hsla(50, 90%, 70%, 0.9)', weight: 'bold',
        });
      }

      // Momentum
      if (game.momentum > 0) {
        draw.text(`MOMENTUM x${game.momentum}`, 0.5, 0.17, {
          size: 0.02, align: 'center', color: 'hsla(30, 90%, 65%, 0.8)',
        });
      }

      // Cooldown indicator
      if (game._continuous && !game.canTap()) {
        const elapsed = game.time - game._lastTapTime;
        const cooldown = game._contCfg.cooldown;
        const pct = Math.min(1, elapsed / cooldown);
        // Cooldown bar at bottom
        draw.rect(0.5, 0.97, pct, 0.006, { fill: 'hsla(200, 80%, 60%, 0.5)', radius: 0.003 });
        draw.rect(0.5, 0.97, 1, 0.006, { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, radius: 0.003 });
      }

      // Density meter (left edge)
      if (game._continuous) {
        const activeDots = game.dots.filter(d => d.active).length;
        const density = game._contCfg.maxDots > 0 ? activeDots / game._contCfg.maxDots : 0;
        const barH = 0.6;
        const barY = 0.2;
        const fillH = barH * Math.min(1, density);
        const dangerHue = density > 0.6 ? 0 : density > 0.4 ? 40 : 120;
        draw.rect(0.02, barY + barH / 2, 0.008, barH, { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, radius: 0.004 });
        if (fillH > 0) {
          draw.rect(0.02, barY + barH - fillH / 2, 0.008, fillH, {
            fill: `hsla(${dangerHue}, 70%, 55%, 0.5)`, radius: 0.004,
          });
        }
      }

      // Tier label
      draw.text(state.tier, 0.98, 0.04, {
        size: 0.018, align: 'right', color: 'rgba(255,255,255,0.3)',
      });

      // Game over
      if (game.overflowed) {
        draw.text('OVERFLOW', 0.5, 0.35, {
          size: 0.06, align: 'center', color: '#fff', weight: 'bold',
        });
        draw.text(`Score: ${game.score}`, 0.5, 0.45, {
          size: 0.03, align: 'center', color: 'rgba(255,255,255,0.7)',
        });
        draw.text(`Chains: ${game.chainLengths.length}`, 0.5, 0.52, {
          size: 0.025, align: 'center', color: 'rgba(255,255,255,0.5)',
        });
        if (game.chainLengths.length > 0) {
          const best = Math.max(...game.chainLengths);
          draw.text(`Best chain: ${best}`, 0.5, 0.58, {
            size: 0.025, align: 'center', color: 'rgba(255,255,255,0.5)',
          });
        }
      }

    },

    // =====================================================================
    // EFFECTS — declarative visual events for the platform effects engine
    // Particles, shake, floating text, rings — all handled by platform
    // =====================================================================
    effects(prev, state) {
      const fx = [];
      const { game } = state;

      // Process game-core events into platform effects
      for (const ev of state.pendingEvents) {
        if (ev.type === 'dotCaught') {
          const hue = ev.dotType === 'gravity' ? 270 : ev.dotType === 'volatile' ? 15 : 195;
          const gen = Math.min(8, ev.generation || 0);
          fx.push({
            type: 'burst',
            x: ev.x / REF_W, y: ev.y / REF_H,
            hue,
            count: 8 + gen * 2,
            intensity: 1 + gen * 0.2,
          });
          fx.push({
            type: 'float',
            x: ev.x / REF_W, y: ev.y / REF_H - 0.02,
            text: `+${ev.points}`, hue,
          });
          fx.push({ type: 'shake', trauma: 0.06 + gen * 0.02 });
        }
        if (ev.type === 'blastForce') {
          const hue = ev.dotType === 'gravity' ? 270 : ev.dotType === 'volatile' ? 30 : 210;
          fx.push({
            type: 'ring',
            x: ev.x / REF_W, y: ev.y / REF_H,
            radius: ev.radius / REF_W,
            hue, duration: 18,
          });
        }
        if (ev.type === 'celebration') {
          fx.push({
            type: 'float',
            x: 0.5, y: 0.35,
            text: ev.text, hue: ev.hue,
            celebration: true, scale: ev.scale,
          });
        }
        if (ev.type === 'multiplierUp') {
          fx.push({
            type: 'float',
            x: 0.5, y: 0.25,
            text: `x${ev.mult}!`, hue: 50,
          });
        }
        if (ev.type === 'chainEnd' && ev.momentum >= 3) {
          fx.push({
            type: 'float',
            x: 0.5, y: 0.20,
            text: `MOMENTUM x${ev.momentum}`, hue: 50,
          });
        }
      }

      // Check celebration thresholds
      if (game.totalDots > 0 && game.chainCount > 0) {
        const pct = game.chainCount / game.totalDots;
        for (let i = 0; i < DEFAULTS.CELEBRATIONS.length; i++) {
          const c = DEFAULTS.CELEBRATIONS[i];
          if (pct >= c.pct && i > state.lastCelebrationIdx) {
            state.lastCelebrationIdx = i;
            fx.push({
              type: 'float',
              x: 0.5, y: 0.35,
              text: c.text, hue: c.hue,
              celebration: true, scale: c.size,
            });
          }
        }
      }

      return fx;
    },

    audio(prev, state) {
      const events = [];
      const { game } = state;
      const prevGame = prev.game;

      // New dot caught
      if (game.chainCount > prev.lastChainCount) {
        const gen = game.explosions.length > 0 ? Math.min(game.explosions[game.explosions.length - 1].generation, 4) : 0;
        const freq = 300 + gen * 80 + game.chainCount * 5;
        events.push({ type: 'tone', freq, duration: 0.06, gain: 0.08, wave: 'triangle' });
      }

      // Chain ended
      for (const ev of state.pendingEvents) {
        if (ev.type === 'chainEnd') {
          if (ev.chainLength >= 5) {
            events.push({ type: 'sweep', freqStart: 400, freqEnd: 800, duration: 0.15, gain: 0.1, wave: 'sine' });
          }
          if (ev.momentum > 1) {
            events.push({ type: 'tone', freq: 600 + ev.momentum * 40, duration: 0.1, gain: 0.06, wave: 'sine' });
          }
        }
      }

      // Celebration
      if (state.lastCelebrationIdx > prev.lastCelebrationIdx) {
        events.push({ type: 'sweep', freqStart: 500, freqEnd: 1200, duration: 0.2, gain: 0.12, wave: 'sine' });
        events.push({ type: 'tone', freq: 800, duration: 0.15, gain: 0.1, wave: 'triangle' });
      }

      // Overflow
      if (game.overflowed && !prevGame.overflowed) {
        events.push({ type: 'noise', filter: 'lowpass', freq: 200, duration: 0.8, gain: 0.3 });
        events.push({ type: 'drum', freq: 40, duration: 0.5, gain: 0.25 });
      }

      // Drain pending events
      state.pendingEvents = [];

      return events;
    },

    score(state) {
      const { game } = state;
      return {
        primary: game.score,
        label: 'Score',
        unit: '',
        breakdown: {
          chains: game.chainLengths.length,
          bestChain: game.chainLengths.length > 0 ? Math.max(...game.chainLengths) : 0,
          taps: game.totalTaps,
          dotsCaught: game.totalDotsCaught,
        },
        normalized: null,
      };
    },

    status(state) {
      if (state.game.overflowed) return { ended: true, reason: 'overflow' };
      return 'playing';
    },

    bot(difficulty, rng) {
      // Map difficulty 0-1 to bot skill keys
      const levels = [0, 0.25, 0.5, 0.75, 1.0];
      const names = ['CALM', 'FLOW', 'SURGE', 'TRANSCENDENCE', 'IMPOSSIBLE'];
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < levels.length; i++) {
        const d = Math.abs(difficulty - levels[i]);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      const skillKey = names[bestIdx];

      let botRunner = null;

      return (state, dt) => {
        const { game } = state;
        if (!botRunner) {
          botRunner = new BotRunner(game, skillKey);
        }
        // BotRunner.update(dt) returns {x, y} in pixel coords or null
        botRunner.game = game;
        const result = botRunner.update(DT_MS);

        const taps = [];
        if (result) {
          taps.push({ x: result.x / REF_W, y: result.y / REF_H, time: 0 });
        }

        return { thumb: null, gyro: null, taps, keys: {} };
      };
    },

    configure() {
      return [
        {
          key: 'tier', label: 'Difficulty', type: 'select',
          options: Object.keys(CONTINUOUS_TIERS),
          default: 'FLOW',
        },
      ];
    },
  };
}

// =====================================================================
// HELPERS
// =====================================================================

function getDotHue(dot) {
  if (dot.type === 'gravity') return 270;
  if (dot.type === 'volatile') return 15;
  // Standard dots: hue shifts by vertical position
  return 195 - (dot.y / REF_H) * 180;
}
