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
      const DOT_R = 0.012;     // base dot radius in game space
      const GLOW_R = DOT_R * 4; // glow radius
      const TRAIL_LEN = 8;

      // ── Background: radial gradient + vignette ──
      draw.clear(0.008, 0.008, 0.06);
      draw.circle(0.5, 0.55, 0.7, {
        gradient: [
          { stop: 0, color: 'rgba(14,14,40,1)' },
          { stop: 0.5, color: 'rgba(8,8,26,1)' },
          { stop: 1, color: 'rgba(4,4,15,1)' },
        ],
      });
      // Vignette
      draw.circle(0.5, 0.5, 0.75, {
        gradient: [
          { stop: 0, color: 'rgba(0,0,0,0)' },
          { stop: 0.6, color: 'rgba(0,0,0,0)' },
          { stop: 1, color: 'rgba(0,0,0,0.45)' },
        ],
      });

      // ── Connections between nearby dots ──
      const eR = game.explosionRadius / REF_W;
      for (let i = 0; i < game.dots.length; i++) {
        const a = game.dots[i];
        if (!a.active) continue;
        const ax = a.x / REF_W, ay = a.y / REF_H;
        for (let j = i + 1; j < game.dots.length; j++) {
          const b = game.dots[j];
          if (!b.active) continue;
          const bx = b.x / REF_W, by = b.y / REF_H;
          const dist = Math.hypot(ax - bx, ay - by);
          if (dist < eR * 2.2) {
            const t = 1 - dist / (eR * 2.2);
            // Connection line
            draw.line(ax, ay, bx, by, {
              color: `rgba(100,180,255,${t * 0.08})`, width: 1,
            });
            // Aura glow at midpoint
            if (t > 0.5) {
              draw.circle((ax + bx) / 2, (ay + by) / 2, eR * 0.3, {
                gradient: [
                  { stop: 0, color: `hsla(200, 60%, 70%, ${t * 0.06})` },
                  { stop: 1, color: 'hsla(200, 60%, 50%, 0)' },
                ], blend: 'lighter',
              });
            }
          }
        }
      }

      // ── Dot trails (additive gradient blobs) ──
      for (let i = 0; i < game.dots.length; i++) {
        const d = game.dots[i];
        const dr = state.dotRender.get(i);
        if (!dr || !d.active) continue;
        const hue = getDotHue(d);
        for (let t = 0; t < dr.trail.length - 1; t++) {
          const pt = dr.trail[t];
          const tp = (t + 1) / dr.trail.length;
          const tr = DOT_R * tp * 0.8;
          draw.circle(pt.x, pt.y, tr * 2, {
            gradient: [
              { stop: 0, color: `hsla(${hue}, 70%, 60%, ${tp * 0.12 * dr.alpha})` },
              { stop: 1, color: `hsla(${hue}, 70%, 60%, 0)` },
            ], blend: 'lighter',
          });
        }
      }

      // ── Explosions ──
      for (const e of game.explosions) {
        if (e.phase === 'done') continue;
        const ex = e.x / REF_W, ey = e.y / REF_H;
        const er = e.radius / REF_W;

        let opacity = 1;
        if (e.phase === 'shrink') {
          const t = (e.age - DEFAULTS.EXPLOSION_GROW_MS - e.holdMs) / DEFAULTS.EXPLOSION_SHRINK_MS;
          opacity = Math.max(0, 1 - t * t);
        }
        const hue = e.generation === 0 ? 200
          : e.dotType === 'gravity' ? 270
          : e.dotType === 'volatile' ? 30 : 195;

        // Ambient glow (gen 1+)
        if (e.generation > 0) {
          draw.circle(ex, ey, er * 2.5, {
            gradient: [
              { stop: 0, color: `hsla(${hue}, 60%, 60%, ${opacity * 0.12})` },
              { stop: 0.4, color: `hsla(${hue}, 50%, 50%, ${opacity * 0.04})` },
              { stop: 1, color: `hsla(${hue}, 50%, 40%, 0)` },
            ], blend: 'lighter',
          });
        }

        // Flash at birth
        if (e.phase === 'grow') {
          const flashT = e.age / DEFAULTS.EXPLOSION_GROW_MS;
          draw.circle(ex, ey, er * 1.2, {
            gradient: [
              { stop: 0, color: `hsla(${hue}, 80%, 95%, ${(1 - flashT) * opacity * 0.4})` },
              { stop: 1, color: `hsla(${hue}, 80%, 80%, 0)` },
            ], blend: 'lighter',
          });
        }

        // Core gradient (unclipped — soft-edged explosion fill)
        draw.circle(ex, ey, er, {
          gradient: [
            { stop: 0, color: `hsla(${hue}, 90%, 85%, ${opacity * 0.35})` },
            { stop: 0.3, color: `hsla(${hue}, 80%, 65%, ${opacity * 0.25})` },
            { stop: 0.6, color: `hsla(${hue}, 70%, 50%, ${opacity * 0.12})` },
            { stop: 1, color: `hsla(${hue}, 60%, 40%, 0)` },
          ], blend: 'lighter',
        });

        // Edge ring
        draw.circle(ex, ey, er, {
          stroke: `hsla(${hue}, 90%, 80%, ${opacity * 0.35})`,
          strokeWidth: 1.5, alpha: opacity,
        });

        // Shockwave ring (expanding outward during grow)
        if (e.phase === 'grow') {
          const t = e.age / DEFAULTS.EXPLOSION_GROW_MS;
          draw.circle(ex, ey, er * (1 + t * 0.5), {
            stroke: `hsla(${hue}, 70%, 75%, ${(1 - t) * opacity * 0.25})`,
            strokeWidth: 2 * (1 - t) + 0.5,
          });
        }
      }

      // ── Dots ──
      for (let i = 0; i < game.dots.length; i++) {
        const d = game.dots[i];

        // Detonation bloom (inactive dots fading out)
        if (!d.active) {
          if (d.bloomTimer > 0) {
            const bt = 1 - d.bloomTimer / 12;
            const dx = d.x / REF_W, dy = d.y / REF_H;
            const hue = getDotHue(d);
            const br = DOT_R * (1 + bt * 5);
            draw.circle(dx, dy, br, {
              gradient: [
                { stop: 0, color: `hsla(${hue}, 70%, 95%, ${(1 - bt) * 0.9})` },
                { stop: 0.3, color: `hsla(${hue}, 80%, 70%, ${(1 - bt) * 0.5})` },
                { stop: 1, color: `hsla(${hue}, 80%, 60%, 0)` },
              ], blend: 'lighter',
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
        const r = DOT_R * pulse * Math.sqrt(massMult);
        const dx = d.x / REF_W, dy = d.y / REF_H;

        // Outer glow (additive, cluster-aware)
        const neighbors = d._neighbors || 0;
        const connectBoost = Math.min(1, neighbors * 0.12);
        const glowA = a * (0.14 + pulse * 0.08 + connectBoost * 0.15);
        draw.circle(dx, dy, GLOW_R * (1 + connectBoost * 0.3), {
          gradient: [
            { stop: 0, color: `hsla(${hue}, 85%, 70%, ${glowA})` },
            { stop: 0.4, color: `hsla(${hue}, 80%, 55%, ${glowA * 0.4})` },
            { stop: 1, color: `hsla(${hue}, 80%, 50%, 0)` },
          ], blend: 'lighter',
        });

        // Core (circle-clipped radial gradient with offset highlight)
        draw.circle(dx, dy, r, {
          gradient: [
            { stop: 0, color: `hsla(${hue}, 60%, 95%, 1)` },
            { stop: 0.4, color: `hsla(${hue}, 85%, ${65 + pulse * 10}%, 1)` },
            { stop: 1, color: `hsla(${hue}, 90%, ${45 + pulse * 10}%, 0.9)` },
          ],
          gradientOffset: { x: -r * 0.15, y: -r * 0.15 },
          clip: true, alpha: a,
        });

        // Gravity: inward spiral lines
        if (d.type === 'gravity') {
          const t = state.time * 2;
          for (let s = 0; s < 3; s++) {
            const angle = t + s * (Math.PI * 2 / 3);
            const outerR = GLOW_R * 1.8;
            const innerR = r * 1.5;
            const oRad = outerR * (0.6 + 0.4 * Math.sin(t * 1.5 + s));
            draw.line(
              dx + Math.cos(angle) * oRad, dy + Math.sin(angle) * oRad,
              dx + Math.cos(angle + 0.3) * innerR, dy + Math.sin(angle + 0.3) * innerR,
              { color: `hsla(270, 60%, 75%, ${a * 0.2})`, width: 1, blend: 'lighter' }
            );
          }
        }

        // Volatile: jittery sparks
        if (d.type === 'volatile') {
          const t = state.time * 4;
          for (let s = 0; s < 4; s++) {
            const sa = t + s * (Math.PI / 2) + Math.sin(t * 3 + s) * 0.5;
            const sr = r * (1.5 + 0.8 * Math.sin(t * 5 + s * 2));
            const sparkA = a * (0.3 + 0.2 * Math.sin(t * 6 + s));
            draw.rect(
              dx + Math.cos(sa) * sr, dy + Math.sin(sa) * sr,
              0.003, 0.003,
              { fill: `hsla(15, 100%, 70%, ${sparkA})`, blend: 'lighter' }
            );
          }
        }
      }

      // ── HUD ──
      draw.text(`${game.score}`, 0.5, 0.04, {
        size: 0.04, align: 'center', color: 'rgba(255,255,255,0.9)', weight: 'bold',
        shadow: 'rgba(0,0,0,0.5)', shadowBlur: 4,
      });

      if (game.gameState === 'resolving' && game.chainCount > 0) {
        const pct = game.totalDots > 0 ? game.chainCount / game.totalDots : 0;
        const chainHue = pct > 0.5 ? 50 : 200;
        draw.text(`${game.chainCount} chain`, 0.5, 0.09, {
          size: 0.025, align: 'center', color: `hsla(${chainHue}, 70%, 75%, 0.8)`,
        });
      }

      if (game.currentMultiplier > 1) {
        draw.text(`x${game.currentMultiplier}`, 0.5, 0.13, {
          size: 0.03, align: 'center', color: 'hsla(50, 90%, 70%, 0.9)', weight: 'bold',
          shadow: 'hsla(50, 80%, 50%, 0.4)', shadowBlur: 12,
        });
      }

      if (game.momentum > 0) {
        draw.text(`MOMENTUM x${game.momentum}`, 0.5, 0.17, {
          size: 0.02, align: 'center', color: 'hsla(30, 90%, 65%, 0.8)',
        });
      }

      // Cooldown bar
      if (game._continuous && !game.canTap()) {
        const elapsed = game.time - game._lastTapTime;
        const pct = Math.min(1, elapsed / game._contCfg.cooldown);
        draw.rect(0.5, 0.97, pct, 0.006, { fill: 'hsla(200, 80%, 60%, 0.5)', radius: 0.003 });
        draw.rect(0.5, 0.97, 1, 0.006, { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, radius: 0.003 });
      }

      // Density meter
      if (game._continuous) {
        const activeDots = game.dots.filter(d => d.active).length;
        const density = game._contCfg.maxDots > 0 ? activeDots / game._contCfg.maxDots : 0;
        const barH = 0.6, barY = 0.2;
        const fillH = barH * Math.min(1, density);
        const dangerHue = density > 0.6 ? 0 : density > 0.4 ? 40 : 120;
        draw.rect(0.02, barY + barH / 2, 0.008, barH, { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, radius: 0.004 });
        if (fillH > 0) {
          draw.rect(0.02, barY + barH - fillH / 2, 0.008, fillH, {
            fill: `hsla(${dangerHue}, 70%, 55%, 0.5)`, radius: 0.004,
          });
        }
      }

      draw.text(state.tier, 0.98, 0.04, {
        size: 0.018, align: 'right', color: 'rgba(255,255,255,0.3)',
      });

      // Game over
      if (game.overflowed) {
        draw.text('OVERFLOW', 0.5, 0.35, {
          size: 0.06, align: 'center', color: '#fff', weight: 'bold',
          shadow: 'rgba(255,255,255,0.6)', shadowBlur: 20,
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

      // Musical chain note — pentatonic scale, beat-quantized, layered harmonics
      if (game.chainCount > prev.lastChainCount) {
        const gen = game.explosions.length > 0
          ? Math.min(game.explosions[game.explosions.length - 1].generation, 4) : 0;
        events.push({
          type: 'note',
          index: Math.min(game.chainCount, 19),
          generation: gen,
        });
      }

      // Process game-core events
      for (const ev of state.pendingEvents) {
        if (ev.type === 'dotCaught') {
          // Tap confirmation on first catch
          if (ev.generation === 0) {
            events.push({ type: 'tap' });
          }
        }
        if (ev.type === 'chainEnd') {
          if (ev.chainLength >= 5) {
            events.push({ type: 'clear' });
          }
          if (ev.momentum >= 3) {
            events.push({ type: 'chord', notes: [8, 10, 12, 14], delay: 0.06 });
          }
        }
        if (ev.type === 'celebration') {
          const level = DEFAULTS.CELEBRATIONS.findIndex(c => c.text === ev.text);
          const baseIdx = Math.min(10, (level >= 0 ? level : 0) * 2);
          events.push({
            type: 'chord',
            notes: [baseIdx, baseIdx + 1, baseIdx + 2, baseIdx + 3],
            delay: 0.08,
            gain: 0.14,
          });
        }
      }

      // Celebration from threshold check
      if (state.lastCelebrationIdx > prev.lastCelebrationIdx) {
        const level = state.lastCelebrationIdx;
        const baseIdx = Math.min(10, level * 2);
        events.push({
          type: 'chord',
          notes: [baseIdx, baseIdx + 1, baseIdx + 2, baseIdx + 3],
          delay: 0.08,
          gain: 0.14,
        });
      }

      // Overflow — game over
      if (game.overflowed && !prevGame.overflowed) {
        events.push({ type: 'gameover' });
        events.push({ type: 'noise', filter: 'lowpass', freq: 200, duration: 0.8, gain: 0.2 });
      }

      // Drain pending events (audio runs after effects, so safe to drain here)
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
