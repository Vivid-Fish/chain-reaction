// platform/effects.js — Shared visual effects: particles, screen shake, floating text
// Games emit declarative effect events; the platform owns all visual state.
// All coordinates in normalized [0,1] game space. Never called in headless mode.

// =========================================================================
// EASING
// =========================================================================
const easeInQuad = t => t * t;
const easeOutQuad = t => t * (2 - t);
const easeOutBack = t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

// =========================================================================
// PARTICLE POOL — struct-of-arrays for cache-friendly iteration
// Coordinates in pixel space (converted from game space on spawn)
// =========================================================================
const POOL_SIZE = 4000;

const pool = {
  x:        new Float32Array(POOL_SIZE),
  y:        new Float32Array(POOL_SIZE),
  vx:       new Float32Array(POOL_SIZE),
  vy:       new Float32Array(POOL_SIZE),
  life:     new Float32Array(POOL_SIZE),
  maxLife:  new Float32Array(POOL_SIZE),
  hue:      new Float32Array(POOL_SIZE),
  size:     new Float32Array(POOL_SIZE),
  friction: new Float32Array(POOL_SIZE),
  gravity:  new Float32Array(POOL_SIZE),
  count: 0,

  spawn(x, y, vx, vy, life, hue, size, friction, gravity) {
    if (this.count >= POOL_SIZE) return;
    const i = this.count;
    this.x[i] = x; this.y[i] = y;
    this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = life; this.maxLife[i] = life;
    this.hue[i] = hue; this.size[i] = size;
    this.friction[i] = friction; this.gravity[i] = gravity;
    this.count++;
  },

  update() {
    let i = 0;
    while (i < this.count) {
      this.vx[i] *= this.friction[i];
      this.vy[i] *= this.friction[i];
      this.vy[i] += this.gravity[i];
      this.x[i] += this.vx[i];
      this.y[i] += this.vy[i];
      this.life[i]--;
      if (this.life[i] <= 0) {
        this.count--;
        if (i < this.count) {
          this.x[i] = this.x[this.count]; this.y[i] = this.y[this.count];
          this.vx[i] = this.vx[this.count]; this.vy[i] = this.vy[this.count];
          this.life[i] = this.life[this.count]; this.maxLife[i] = this.maxLife[this.count];
          this.hue[i] = this.hue[this.count]; this.size[i] = this.size[this.count];
          this.friction[i] = this.friction[this.count]; this.gravity[i] = this.gravity[this.count];
        }
      } else { i++; }
    }
  },

  draw(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.count; i++) {
      const a = this.life[i] / this.maxLife[i];
      const s = this.size[i] * (0.4 + a * 0.6);
      const alpha = a * a;
      if (alpha < 0.01) continue;
      ctx.globalAlpha = alpha;
      const h = this.hue[i];
      const px = this.x[i], py = this.y[i];
      if (s > 2) {
        // Radial gradient glow — soft circular particle
        const gr = s * 2;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, gr);
        grd.addColorStop(0, `hsla(${h}, 100%, ${70 + a * 20}%, 0.7)`);
        grd.addColorStop(0.5, `hsla(${h}, 90%, ${55 + a * 15}%, 0.15)`);
        grd.addColorStop(1, `hsla(${h}, 80%, 50%, 0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(px - gr, py - gr, gr * 2, gr * 2);
      } else {
        // Tiny particles — circle, not square
        ctx.fillStyle = `hsl(${h}, 100%, ${60 + a * 25}%)`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, s * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },

  clear() { this.count = 0; },
};

// =========================================================================
// FLOATING TEXT — score popups, celebrations, labels
// Stored in pixel space
// =========================================================================
let floatingTexts = [];

// =========================================================================
// SCREEN SHAKE — trauma-based with quadratic falloff
// =========================================================================
const SHAKE_MAX_OFFSET = 12;
const SHAKE_DECAY = 0.90;
let shakeTrauma = 0;
let shakeX = 0, shakeY = 0;

// =========================================================================
// SCREEN FLASH
// =========================================================================
let screenFlash = 0;

// =========================================================================
// RING EFFECTS — expanding shockwave circles
// =========================================================================
let rings = [];

// =========================================================================
// CLUSTER GLOWS — soft glow around grouped dots pushed together by blast
// =========================================================================
let clusters = [];

// =========================================================================
// PUBLIC API — createEffectsEngine()
// =========================================================================
export function createEffectsEngine() {
  let w = 0, h = 0;

  // Scale factor: maps normalized particle speed to pixels
  function dim() { return Math.min(w, h); }
  function gx(v) { return v * w; }
  function gy(v) { return v * h; }
  function px(v) { return v * dim(); }

  function resize(width, height) {
    w = width;
    h = height;
  }

  // -----------------------------------------------------------------------
  // Process effect events emitted by a game's effects() hook
  // -----------------------------------------------------------------------
  function process(events) {
    if (!events || events.length === 0) return;
    for (const ev of events) {
      switch (ev.type) {

        // Particle burst — fan of particles from a point
        // { type: 'burst', x, y, hue, count?, intensity?, spread? }
        case 'burst': {
          const cx = gx(ev.x), cy = gy(ev.y);
          const hue = ev.hue || 200;
          const count = ev.count || 12;
          const intensity = ev.intensity || 1;
          const spread = ev.spread || 1;

          // Main burst
          for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const spd = (3.5 + Math.random() * 5) * spread;
            pool.spawn(cx, cy, Math.cos(a) * spd, Math.sin(a) * spd,
              22 + Math.random() * 18, hue + (Math.random() - 0.5) * 30,
              (2 + Math.random() * 3) * intensity, 0.92, 0.04);
          }
          // Drift particles
          const driftN = Math.round(count * 0.4);
          for (let i = 0; i < driftN; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = (0.8 + Math.random() * 1.5) * spread;
            pool.spawn(cx, cy, Math.cos(a) * spd, Math.sin(a) * spd,
              50 + Math.random() * 35, hue + (Math.random() - 0.5) * 20,
              (3.5 + Math.random() * 4) * intensity, 0.97, -0.025);
          }
          // Sparks
          const sparkN = Math.round(count * 0.3);
          for (let i = 0; i < sparkN; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = (7 + Math.random() * 9) * spread;
            pool.spawn(cx, cy, Math.cos(a) * spd, Math.sin(a) * spd,
              8 + Math.random() * 8, hue + 30,
              1 + Math.random() * 0.8, 0.88, 0.12);
          }
          // Embers
          const emberN = Math.round(count * 0.15);
          for (let i = 0; i < emberN; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 0.3 + Math.random() * 0.6;
            pool.spawn(cx, cy, Math.cos(a) * spd, Math.sin(a) * spd,
              100 + Math.random() * 60, hue,
              1.5 + Math.random(), 0.99, -0.008);
          }
          break;
        }

        // Screen shake — additive trauma
        // { type: 'shake', trauma }
        case 'shake':
          shakeTrauma = Math.min(1.0, shakeTrauma + (ev.trauma || 0.2));
          break;

        // Screen flash — white flash overlay
        // { type: 'flash', intensity }
        case 'flash':
          screenFlash = Math.min(0.8, ev.intensity || 0.3);
          break;

        // Floating text — score popups, celebration text
        // { type: 'float', x, y, text, hue, celebration?, scale? }
        case 'float':
          floatingTexts.push({
            x: gx(ev.x), y: gy(ev.y),
            text: ev.text, hue: ev.hue || 200,
            age: 0, maxAge: ev.celebration ? 120 : 50,
            scale: ev.scale || 1,
            celebration: ev.celebration || false,
          });
          if (ev.celebration) {
            // Celebration also gets a burst
            const cx = gx(ev.x), cy = gy(ev.y);
            const cCount = Math.floor(40 * (ev.scale || 1));
            for (let i = 0; i < cCount; i++) {
              const a = (Math.PI * 2 * i) / cCount + (Math.random() - 0.5) * 0.4;
              const spd = 5 + Math.random() * 10;
              const h = (ev.hue || 50) + (Math.random() - 0.5) * 60;
              pool.spawn(cx, cy, Math.cos(a) * spd, Math.sin(a) * spd,
                35 + Math.random() * 25, h, 3 + Math.random() * 5, 0.94, 0.03);
            }
            shakeTrauma = Math.min(1.0, shakeTrauma + 0.3 * (ev.scale || 1));
            screenFlash = Math.min(0.6, 0.4 * (ev.scale || 1));
          }
          break;

        // Ring — expanding shockwave circle
        // { type: 'ring', x, y, radius, hue, duration? }
        case 'ring':
          rings.push({
            x: gx(ev.x), y: gy(ev.y),
            maxR: px(ev.radius || 0.1),
            hue: ev.hue || 210,
            age: 0, maxAge: ev.duration || 18,
          });
          break;

        // Cluster glow — soft glow around nearby grouped dots
        // { type: 'cluster', points: [{x, y}, ...], hue }
        case 'cluster':
          clusters.push({
            points: ev.points.map(p => ({ x: gx(p.x), y: gy(p.y) })),
            hue: ev.hue || 200,
            age: 0, maxAge: 40,
          });
          break;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Update — advance all effect state by one frame
  // -----------------------------------------------------------------------
  function update() {
    pool.update();

    // Floating text
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.age++;
      const drift = ft.celebration ? 0.5 : 1.5;
      ft.y -= drift * (1 - ft.age / ft.maxAge);
      if (ft.age >= ft.maxAge) floatingTexts.splice(i, 1);
    }

    // Rings
    rings = rings.filter(r => { r.age++; return r.age < r.maxAge; });

    // Clusters
    clusters = clusters.filter(c => { c.age++; return c.age < c.maxAge; });

    // Shake decay
    if (shakeTrauma > 0.001) {
      const s = shakeTrauma * shakeTrauma;
      shakeX = SHAKE_MAX_OFFSET * s * (Math.random() * 2 - 1);
      shakeY = SHAKE_MAX_OFFSET * s * (Math.random() * 2 - 1);
      shakeTrauma *= SHAKE_DECAY;
    } else {
      shakeX = 0; shakeY = 0;
    }

    // Flash decay
    if (screenFlash > 0.005) screenFlash *= 0.78; else screenFlash = 0;
  }

  // -----------------------------------------------------------------------
  // Render — draw all effects onto the canvas context
  // Called AFTER the game's render(), so effects layer on top.
  // ctx is the raw Canvas 2D context.
  // -----------------------------------------------------------------------
  function render(ctx) {
    // Screen flash (behind shake transform)
    if (screenFlash > 0.005) {
      ctx.fillStyle = `rgba(255, 255, 255, ${screenFlash})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Apply shake transform
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Rings
    ctx.globalCompositeOperation = 'lighter';
    for (const ring of rings) {
      const t = ring.age / ring.maxAge;
      const r = ring.maxR * easeOutQuad(t);
      const alpha = (1 - t) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.max(1, r), 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${ring.hue}, 60%, 65%, 1)`;
      ctx.lineWidth = 2.5 * (1 - t) + 0.5;
      ctx.stroke();
      if (t < 0.6) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, Math.max(1, r * 0.6), 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${ring.hue}, 50%, 80%, 1)`;
        ctx.lineWidth = 1.5 * (1 - t);
        ctx.stroke();
      }
    }
    // Clusters — soft radial glow per point, fade in then out
    for (const cl of clusters) {
      const t = cl.age / cl.maxAge;
      // Fade in 0-30%, fade out 30-100%
      let alpha;
      if (t < 0.3) {
        alpha = t / 0.3; // 0 -> 1 over first 30%
      } else {
        alpha = 1 - (t - 0.3) / 0.7; // 1 -> 0 over remaining 70%
      }
      alpha *= 0.45; // peak intensity
      ctx.globalCompositeOperation = 'lighter';
      for (const pt of cl.points) {
        const gr = 28 + alpha * 12;
        ctx.globalAlpha = alpha;
        const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, gr);
        grd.addColorStop(0, `hsla(${cl.hue}, 80%, 70%, 0.6)`);
        grd.addColorStop(0.4, `hsla(${cl.hue}, 70%, 55%, 0.2)`);
        grd.addColorStop(1, `hsla(${cl.hue}, 60%, 45%, 0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(pt.x - gr, pt.y - gr, gr * 2, gr * 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Particles
    pool.draw(ctx);

    // Floating text — dark outline for readability against bright effects
    const baseSize = Math.max(16, dim() * 0.028);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const ft of floatingTexts) {
      const a = 1 - easeInQuad(ft.age / ft.maxAge);
      if (ft.celebration) {
        const entryScale = easeOutBack(Math.min(1, ft.age / 12));
        const sz = Math.round(baseSize * 3 * ft.scale * entryScale);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `900 ${sz}px Inter, system-ui, sans-serif`;
        // Dark outline for readability
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = Math.max(3, sz * 0.08);
        ctx.lineJoin = 'round';
        ctx.strokeText(ft.text, ft.x, ft.y);
        // Colored fill with glow
        ctx.shadowColor = `hsla(${ft.hue}, 90%, 60%, 0.8)`;
        ctx.shadowBlur = 20;
        ctx.fillStyle = `hsl(${ft.hue}, 90%, 75%)`;
        ctx.fillText(ft.text, ft.x, ft.y);
        // Extra glow pass
        ctx.shadowBlur = 40;
        ctx.globalAlpha = a * 0.5;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      } else {
        const scale = 0.8 + 0.4 * easeOutBack(Math.min(1, ft.age / 8));
        const sz = Math.round(baseSize * scale * ft.scale);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `600 ${sz}px Inter, system-ui, sans-serif`;
        // Dark outline
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = Math.max(2, sz * 0.07);
        ctx.lineJoin = 'round';
        ctx.strokeText(ft.text, ft.x, ft.y);
        // Colored fill with subtle glow
        ctx.shadowColor = `hsla(${ft.hue}, 80%, 60%, 0.5)`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `hsl(${ft.hue}, 80%, 78%)`;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    ctx.restore(); // undo shake
  }

  // -----------------------------------------------------------------------
  // Reset — clear all visual state (between games)
  // -----------------------------------------------------------------------
  function reset() {
    pool.clear();
    floatingTexts = [];
    rings = [];
    clusters = [];
    shakeTrauma = 0;
    shakeX = 0; shakeY = 0;
    screenFlash = 0;
  }

  return { process, update, render, reset, resize };
}
