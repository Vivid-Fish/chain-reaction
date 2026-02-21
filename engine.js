'use strict';

// =========================================================================
// CHAIN REACTION — Shared Engine
// Used by both index.html (game) and replay.html (viewer)
//
// Architecture (line ranges):
//   Constants .............. ~12-69    All tunables, grouped by system
//   Easing ................ ~73-79    Animation curves
//   Shared State .......... ~83-113   Mutable state set by host page
//   Resize / Radius ....... ~118-135  Screen dimensions + explosion radius
//   Utility ............... ~139-178  getMultiplier(), drawPill()
//   Particle Pool ......... ~182-299  SoA pool with spawn/update/draw/clear
//   Ambient Background .... ~303-349  Twinkling star field
//   Floating Text ......... ~353-414  Score popups + celebration banners
//   Chain Lines ........... ~418-442  Visual links between cascade hits
//   Dot class ............. ~447-614  Physics, rendering (trails, gravity spirals, volatile sparks)
//   Explosion class ....... ~619-810  Lifecycle (grow/hold/shrink), cascade catch logic
//   Connections ........... ~815-882  Soft auras + lines between chainable dots
//   Core Simulation ....... ~886-952  detonateDot(), handleDotCaught() — cascade mechanics
//   Shared Update ......... ~957-998  engineUpdatePhysics() — tick all systems
//   Scene Rendering ....... ~1001-1067 engineDrawScene() — background + composite draw
//   Round Reset ........... ~1070-1084 engineResetRound() — clear state between rounds
// =========================================================================

// =====================================================================
// CONSTANTS
// =====================================================================

const BUILD_VERSION = 'v11';
const BUILD_DATE = '2026-02-21';

// Dot types — physics modifiers
const DOT_TYPES = {
    standard: { label: 'standard', radiusMult: 1.0, speedMult: 1.0 },
    gravity:  { label: 'gravity',  radiusMult: 1.0, speedMult: 0.7, pullRange: 2.5, pullForce: 0.012 },
    volatile: { label: 'volatile', radiusMult: 1.5, speedMult: 1.3 },
};

// Cascade momentum — controls how chain reactions escalate with depth.
// RADIUS_GROWTH=0 (v11): fixed explosion size at all depths prevents
// percolation blowout at high dot densities. See research/difficulty-analysis.md.
const CASCADE_RADIUS_GROWTH = 0;
const CASCADE_HOLD_GROWTH_MS = 80;
const CASCADE_GEN_CAP = 4;
// Stagger + jitter create visual "wave" effect (simultaneous detonations look flat)
const CASCADE_STAGGER_MS = 80;
const CASCADE_JITTER_MS = 25;

// Explosion radius
const EXPLOSION_RADIUS_PCT = 0.10;
const EXPLOSION_RADIUS_MIN_PX = 35;

// Explosion lifecycle (ms)
const EXPLOSION_GROW_MS = 200;
const EXPLOSION_HOLD_MS = 1000;
const EXPLOSION_SHRINK_MS = 500;
const TOTAL_EXPLOSION_MS = EXPLOSION_GROW_MS + EXPLOSION_HOLD_MS + EXPLOSION_SHRINK_MS;

// Dots
let DOT_RADIUS = 5;
let DOT_GLOW_SIZE = 18;
const MIN_DOT_DISTANCE = 25;
const SCREEN_MARGIN = 16;
const DOT_TRAIL_LENGTH = 8;

// Particles
const PARTICLE_POOL_SIZE = 4000;
const AMBIENT_PARTICLE_COUNT = 120;

// Screen shake
const SHAKE_MAX_OFFSET = 14;
const SHAKE_DECAY = 0.90;
const SHAKE_TRAUMA_PER_DOT = 0.06;

// Multiplier thresholds
const MULT_THRESHOLDS = [
    { chain: 0, mult: 1 }, { chain: 5, mult: 2 },
    { chain: 10, mult: 3 }, { chain: 15, mult: 4 },
    { chain: 20, mult: 5 }, { chain: 30, mult: 8 },
];

// Celebration milestones
const CELEBRATIONS = [
    { chain: 5, text: 'NICE!', hue: 50, size: 1.0 },
    { chain: 10, text: 'AMAZING!', hue: 35, size: 1.3 },
    { chain: 15, text: 'INCREDIBLE!', hue: 15, size: 1.6 },
    { chain: 20, text: 'LEGENDARY!', hue: 300, size: 2.0 },
    { chain: 30, text: 'GODLIKE!', hue: 280, size: 2.5 },
];

// =====================================================================
// EASING
// =====================================================================
const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInQuad = t => t * t;
const easeOutQuad = t => 1 - (1 - t) * (1 - t);
const easeOutBack = t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;

// =====================================================================
// TYPES (JSDoc — no build step, provides IDE hints + agent context)
// =====================================================================
/**
 * @typedef {Object} DotTypeDef
 * @property {string} label
 * @property {number} radiusMult - Explosion radius multiplier (volatile = 1.5x)
 * @property {number} speedMult - Movement speed multiplier
 * @property {number} [pullRange] - Gravity pull range as multiple of explosion radius
 * @property {number} [pullForce] - Gravity pull force per tick
 */

/**
 * @typedef {Object} FloatingText
 * @property {number} x
 * @property {number} y
 * @property {string} text
 * @property {number} hue
 * @property {number} age - Frames since spawn
 * @property {number} maxAge - Frames until removal
 * @property {number} [scale] - Size multiplier (celebrations)
 * @property {boolean} [celebration] - Large centered text vs small score popup
 */

/**
 * @typedef {Object} PendingExplosion
 * @property {number} x
 * @property {number} y
 * @property {number} generation - Cascade depth (0 = player tap, 1+ = chain)
 * @property {number} time - performance.now() timestamp to spawn
 * @property {number} parentX - Origin of the chain (for chain lines)
 * @property {number} parentY
 * @property {string} dotType - Key from DOT_TYPES
 * @property {number} jitter - Random timing offset applied
 */

// =====================================================================
// SHARED STATE (set by host page)
// =====================================================================
// These are set by the host page (index.html or replay.html)
// and referenced by engine classes/functions.
let W, H, refDim;
let explosionRadius;
let roundRadiusScale = 1.0;

// Game/replay state — the host page manages these arrays,
// but engine code reads them for physics (gravity pull, connections, etc.)
let dots = [];
let explosions = [];
let pendingExplosions = [];
let scheduledDetonations = new Set();

let chainCount = 0;
let score = 0;
let currentMultiplier = 1;
let multiplierPulse = 0;
let feverIntensity = 0;
let lastCelebration = -1;

let floatingTexts = [];
let chainLines = [];

let shakeTrauma = 0;
let shakeX = 0, shakeY = 0;
let bgPulse = 0;
let screenFlash = 0;
let beatPulse = 0;
let slowMo = 1.0;
let slowMoTarget = 1.0;

// =====================================================================
// RESIZE
// =====================================================================
// Per-round radius decay — gentle counterpressure against dot density increase
function getRoundRadiusScale(round) {
    return Math.max(0.85, 1.0 - (round - 1) * 0.01);
}

function recalcExplosionRadius() {
    explosionRadius = Math.max(EXPLOSION_RADIUS_MIN_PX, refDim * EXPLOSION_RADIUS_PCT) * roundRadiusScale;
}

function engineResize(canvas) {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    refDim = Math.min(W, H, 800);
    const screenMin = Math.min(W, H);
    recalcExplosionRadius();
    DOT_RADIUS = Math.max(6, screenMin * 0.014);
    DOT_GLOW_SIZE = Math.max(28, screenMin * 0.06);
}

// =====================================================================
// UTILITY
// =====================================================================
function getMultiplier(chain) {
    let m = 1;
    for (const t of MULT_THRESHOLDS) { if (chain >= t.chain) m = t.mult; }
    return m;
}

// Reusable pill button drawer — returns hit rect
function drawPill(ctx, cx, cy, label, active, hue) {
    const s = Math.max(1, Math.min(W, H) / 600);
    const fontSize = Math.round(12 * s);
    ctx.font = `400 ${fontSize}px Inter, system-ui, sans-serif`;
    const textW = ctx.measureText(label).width;
    const pw = textW + 28 * s;
    const ph = 32 * s;
    const px = cx - pw / 2;
    const py = cy - ph / 2;
    const radius = ph / 2;

    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, radius);
    if (active) {
        ctx.fillStyle = `hsla(${hue}, 50%, 45%, 0.35)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${hue}, 50%, 65%, 0.5)`;
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    }
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = active ? `hsla(${hue}, 60%, 80%, 0.9)` : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(label, cx, cy);

    return { x: px, y: py, w: pw, h: ph };
}

// =====================================================================
// PARTICLE POOL — Structure of Arrays for cache-friendly iteration.
// Pool-based: dead particles are swap-removed (no allocation/GC pressure).
// =====================================================================
const particles = {
    x: new Float32Array(PARTICLE_POOL_SIZE),
    y: new Float32Array(PARTICLE_POOL_SIZE),
    vx: new Float32Array(PARTICLE_POOL_SIZE),
    vy: new Float32Array(PARTICLE_POOL_SIZE),
    life: new Float32Array(PARTICLE_POOL_SIZE),
    maxLife: new Float32Array(PARTICLE_POOL_SIZE),
    hue: new Float32Array(PARTICLE_POOL_SIZE),
    size: new Float32Array(PARTICLE_POOL_SIZE),
    friction: new Float32Array(PARTICLE_POOL_SIZE),
    gravity: new Float32Array(PARTICLE_POOL_SIZE),
    count: 0,

    spawn(x, y, vx, vy, life, hue, size, friction, gravity) {
        if (this.count >= PARTICLE_POOL_SIZE) return;
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
            if (s > 3) {
                const gr = s * 2;
                const grd = ctx.createRadialGradient(this.x[i], this.y[i], 0, this.x[i], this.y[i], gr);
                grd.addColorStop(0, `hsla(${h}, 100%, ${70 + a * 20}%, 0.7)`);
                grd.addColorStop(0.5, `hsla(${h}, 90%, ${55 + a * 15}%, 0.15)`);
                grd.addColorStop(1, `hsla(${h}, 80%, 50%, 0)`);
                ctx.fillStyle = grd;
                ctx.fillRect(this.x[i] - gr, this.y[i] - gr, gr * 2, gr * 2);
            } else {
                ctx.fillStyle = `hsl(${h}, 100%, ${60 + a * 25}%)`;
                ctx.fillRect(this.x[i] - s * 0.5, this.y[i] - s * 0.5, s, s);
            }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    },

    clear() { this.count = 0; }
};

function emitParticles(x, y, hue, gen) {
    const depth = Math.min(8, gen);
    const burstN = 8 + depth * 2;
    const driftN = 4 + depth;
    const sparkN = 2 + Math.min(8, depth * 2);
    const emberN = 2 + Math.min(4, Math.floor(depth / 2));

    for (let i = 0; i < burstN; i++) {
        const a = (Math.PI * 2 * i) / burstN + (Math.random() - 0.5) * 0.5;
        const spd = 3.5 + Math.random() * 5;
        particles.spawn(x, y, Math.cos(a)*spd, Math.sin(a)*spd,
            22 + Math.random()*18, hue + (Math.random()-0.5)*30, 2 + Math.random()*3, 0.92, 0.04);
    }
    for (let i = 0; i < driftN; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 0.8 + Math.random() * 1.5;
        particles.spawn(x, y, Math.cos(a)*spd, Math.sin(a)*spd,
            50 + Math.random()*35, hue + (Math.random()-0.5)*20, 3.5 + Math.random()*4, 0.97, -0.025);
    }
    for (let i = 0; i < sparkN; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 7 + Math.random() * 9;
        particles.spawn(x, y, Math.cos(a)*spd, Math.sin(a)*spd,
            8 + Math.random()*8, hue + 30, 1 + Math.random()*0.8, 0.88, 0.12);
    }
    for (let i = 0; i < emberN; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 0.3 + Math.random() * 0.6;
        particles.spawn(x, y, Math.cos(a)*spd, Math.sin(a)*spd,
            100 + Math.random()*60, hue, 1.5 + Math.random(), 0.99, -0.008);
    }
}

function emitCelebrationBurst(x, y, hue, count) {
    for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const spd = 5 + Math.random() * 10;
        const h = hue + (Math.random() - 0.5) * 60;
        particles.spawn(x, y, Math.cos(a)*spd, Math.sin(a)*spd,
            35 + Math.random()*25, h, 3 + Math.random()*5, 0.94, 0.03);
    }
}

// =====================================================================
// AMBIENT BACKGROUND
// =====================================================================
const ambientStars = [];
function initAmbient() {
    ambientStars.length = 0;
    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
        const isBright = Math.random() < 0.15;
        ambientStars.push({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.12,
            size: isBright ? (1.5 + Math.random() * 2) : (0.5 + Math.random() * 1.8),
            alpha: isBright ? (0.15 + Math.random() * 0.2) : (0.04 + Math.random() * 0.12),
            phase: Math.random() * Math.PI * 2,
            hue: isBright ? (180 + Math.random() * 60) : 220,
        });
    }
}

function updateAmbient() {
    for (const s of ambientStars) {
        s.x += s.vx; s.y += s.vy; s.phase += 0.008;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
    }
}

function drawAmbient(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    for (const s of ambientStars) {
        const a = s.alpha * (0.5 + 0.5 * Math.sin(s.phase));
        if (a < 0.01) continue;
        ctx.globalAlpha = a;
        if (s.size > 2) {
            const gr = s.size * 3;
            const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, gr);
            grd.addColorStop(0, `hsla(${s.hue}, 40%, 80%, 0.6)`);
            grd.addColorStop(0.3, `hsla(${s.hue}, 30%, 70%, 0.15)`);
            grd.addColorStop(1, `hsla(${s.hue}, 30%, 60%, 0)`);
            ctx.fillStyle = grd;
            ctx.fillRect(s.x - gr, s.y - gr, gr * 2, gr * 2);
        }
        ctx.fillStyle = `hsla(${s.hue}, 30%, 85%, 1)`;
        ctx.fillRect(s.x - s.size * 0.5, s.y - s.size * 0.5, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// =====================================================================
// FLOATING TEXT
// =====================================================================
function spawnFloatingText(x, y, text, hue) {
    floatingTexts.push({ x, y, text, hue, age: 0, maxAge: 50 });
}

function spawnCelebration(text, hue, scale) {
    floatingTexts.push({
        x: W/2, y: H * 0.35, text, hue,
        age: 0, maxAge: 120, scale: scale || 1, celebration: true
    });
    emitCelebrationBurst(W/2, H/2, hue, Math.floor(40 * (scale || 1)));
    shakeTrauma = Math.min(1.0, shakeTrauma + 0.3 * (scale || 1));
    bgPulse = Math.min(0.4, bgPulse + 0.12 * (scale || 1));
    screenFlash = Math.min(0.6, 0.40 * (scale || 1));
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.age++;
        const drift = ft.celebration ? 0.5 : 1.5;
        ft.y -= drift * (1 - ft.age / ft.maxAge);
        if (ft.age >= ft.maxAge) floatingTexts.splice(i, 1);
    }
}

function drawFloatingTexts(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const baseSize = Math.max(14, Math.min(W, H) * 0.022);
    for (const ft of floatingTexts) {
        const a = 1 - easeInQuad(ft.age / ft.maxAge);

        if (ft.celebration) {
            const entryScale = easeOutBack(Math.min(1, ft.age / 12));
            const sz = Math.round(baseSize * 3 * (ft.scale || 1) * entryScale);
            ctx.save();
            ctx.globalAlpha = a;
            ctx.shadowColor = `hsla(${ft.hue}, 90%, 60%, 0.8)`;
            ctx.shadowBlur = 20;
            ctx.font = `900 ${sz}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `hsl(${ft.hue}, 90%, 75%)`;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.shadowBlur = 40;
            ctx.globalAlpha = a * 0.5;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        } else {
            const scale = 0.8 + 0.4 * easeOutBack(Math.min(1, ft.age / 8));
            const sz = Math.round(baseSize * scale);
            ctx.save();
            ctx.globalAlpha = a;
            ctx.shadowColor = `hsla(${ft.hue}, 80%, 60%, 0.5)`;
            ctx.shadowBlur = 8;
            ctx.font = `600 ${sz}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `hsl(${ft.hue}, 80%, 78%)`;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }
    ctx.globalAlpha = 1;
}

// =====================================================================
// CHAIN LINES
// =====================================================================
function spawnChainLine(x1, y1, x2, y2) {
    chainLines.push({ x1, y1, x2, y2, age: 0, maxAge: 40 });
}
function updateChainLines() {
    for (let i = chainLines.length - 1; i >= 0; i--) {
        chainLines[i].age++;
        if (chainLines[i].age >= chainLines[i].maxAge) chainLines.splice(i, 1);
    }
}
function drawChainLines(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    for (const cl of chainLines) {
        const a = 0.15 * (1 - cl.age / cl.maxAge);
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cl.x1, cl.y1);
        ctx.lineTo(cl.x2, cl.y2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// =====================================================================
// DOT — unified constructor takes (x, y, vx, vy, type).
// Random velocity is generated in generateDots() (index.html), NOT here.
// This lets replay.html inject recorded velocities using the same class.
// =====================================================================
class Dot {
    constructor(x, y, vx, vy, type) {
        this.type = type || 'standard';
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.active = true;
        this.alpha = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
        this.bloomTimer = 0;
        this.nearMiss = 0;
        this._neighbors = 0;
    }

    getHue() {
        if (this.type === 'gravity') return 270;
        if (this.type === 'volatile') return 15;
        return 195 - (this.y / H) * 180;
    }

    update() {
        if (!this.active && this.bloomTimer <= 0) return;
        if (this.bloomTimer > 0) { this.bloomTimer--; return; }
        if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + 0.025);

        this.x += this.vx * slowMo;
        this.y += this.vy * slowMo;
        this.pulsePhase += 0.05;

        // Gravity dots pull nearby dots toward themselves
        if (this.type === 'gravity' && this.active) {
            const td = DOT_TYPES.gravity;
            const pullR = explosionRadius * td.pullRange;
            for (const o of dots) {
                if (o === this || !o.active) continue;
                const dist = Math.hypot(o.x - this.x, o.y - this.y);
                if (dist < pullR && dist > 5) {
                    const f = td.pullForce * slowMo / (dist / explosionRadius);
                    o.vx += (this.x - o.x) / dist * f;
                    o.vy += (this.y - o.y) / dist * f;
                }
            }
        }

        if (this.x < SCREEN_MARGIN) { this.vx = Math.abs(this.vx); this.x = SCREEN_MARGIN; }
        if (this.x > W - SCREEN_MARGIN) { this.vx = -Math.abs(this.vx); this.x = W - SCREEN_MARGIN; }
        if (this.y < SCREEN_MARGIN) { this.vy = Math.abs(this.vy); this.y = SCREEN_MARGIN; }
        if (this.y > H - SCREEN_MARGIN) { this.vy = -Math.abs(this.vy); this.y = H - SCREEN_MARGIN; }

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > DOT_TRAIL_LENGTH) this.trail.shift();

        if (this.nearMiss > 0) this.nearMiss = Math.max(0, this.nearMiss - 0.012);
    }

    draw(ctx) {
        if (!this.active && this.bloomTimer <= 0) return;
        const hue = this.getHue();
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
        const r = DOT_RADIUS * pulse;
        const a = this.alpha;

        if (this.bloomTimer > 0) {
            const bt = 1 - this.bloomTimer / 12;
            const br = r * (1 + bt * 5);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = (1 - bt) * 0.9;
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, br);
            g.addColorStop(0, `hsla(${hue}, 70%, 95%, 1)`);
            g.addColorStop(0.3, `hsla(${hue}, 80%, 70%, 0.6)`);
            g.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
            ctx.fillStyle = g;
            ctx.fillRect(this.x - br, this.y - br, br * 2, br * 2);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            return;
        }

        // Trail
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.trail.length - 1; i++) {
            const t = this.trail[i];
            const tp = (i + 1) / this.trail.length;
            ctx.globalAlpha = a * tp * 0.12;
            const ts = r * tp * 0.8;
            const tg = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, ts * 2);
            tg.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.5)`);
            tg.addColorStop(1, `hsla(${hue}, 70%, 60%, 0)`);
            ctx.fillStyle = tg;
            ctx.fillRect(t.x - ts * 2, t.y - ts * 2, ts * 4, ts * 4);
        }

        // Outer glow — brighter when near other dots (shows clusters)
        const connectBoost = Math.min(1, (this._neighbors || 0) * 0.12);
        const glowR = DOT_GLOW_SIZE * (1 + connectBoost * 0.3);
        const glowA = a * (0.14 + pulse * 0.08 + connectBoost * 0.15);
        const gg = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
        gg.addColorStop(0, `hsla(${hue}, 85%, 70%, ${glowA})`);
        gg.addColorStop(0.4, `hsla(${hue}, 80%, 55%, ${glowA * 0.4})`);
        gg.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = gg;
        ctx.fillRect(this.x - glowR, this.y - glowR, glowR * 2, glowR * 2);
        ctx.globalCompositeOperation = 'source-over';

        // Core
        ctx.globalAlpha = a;
        const cg = ctx.createRadialGradient(this.x - r * 0.2, this.y - r * 0.2, 0, this.x, this.y, r);
        cg.addColorStop(0, `hsla(${hue}, 60%, 95%, 1)`);
        cg.addColorStop(0.4, `hsla(${hue}, 85%, ${65 + pulse * 10}%, 1)`);
        cg.addColorStop(1, `hsla(${hue}, 90%, ${45 + pulse * 10}%, 0.9)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = cg;
        ctx.fill();

        // Gravity dot: inward spiral lines
        if (this.type === 'gravity') {
            ctx.globalCompositeOperation = 'lighter';
            const spiralT = performance.now() * 0.002;
            const pullR = DOT_GLOW_SIZE * 1.8;
            for (let i = 0; i < 3; i++) {
                const angle = spiralT + i * (Math.PI * 2 / 3);
                const outerR = pullR * (0.6 + 0.4 * Math.sin(spiralT * 1.5 + i));
                const innerR = r * 1.5;
                ctx.globalAlpha = a * 0.2;
                ctx.strokeStyle = 'hsla(270, 60%, 75%, 1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x + Math.cos(angle) * outerR, this.y + Math.sin(angle) * outerR);
                ctx.lineTo(this.x + Math.cos(angle + 0.3) * innerR, this.y + Math.sin(angle + 0.3) * innerR);
                ctx.stroke();
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        // Volatile dot: jittery outer sparks
        if (this.type === 'volatile') {
            ctx.globalCompositeOperation = 'lighter';
            const sparkT = performance.now() * 0.004;
            for (let i = 0; i < 4; i++) {
                const sa = sparkT + i * (Math.PI / 2) + Math.sin(sparkT * 3 + i) * 0.5;
                const sr = r * (1.5 + 0.8 * Math.sin(sparkT * 5 + i * 2));
                const ss = 1.5;
                ctx.globalAlpha = a * (0.3 + 0.2 * Math.sin(sparkT * 6 + i));
                ctx.fillStyle = 'hsla(15, 100%, 70%, 1)';
                ctx.fillRect(this.x + Math.cos(sa) * sr - ss/2, this.y + Math.sin(sa) * sr - ss/2, ss, ss);
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        // Near-miss red pulse
        if (this.nearMiss > 0) {
            const nmP = Math.sin(performance.now() * 0.012) * 0.3 + 0.7;
            const nmR = DOT_GLOW_SIZE * 1.2;
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = this.nearMiss * nmP * 0.25;
            const ng = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, nmR);
            ng.addColorStop(0, 'hsla(0, 90%, 60%, 0.6)');
            ng.addColorStop(0.5, 'hsla(0, 80%, 50%, 0.15)');
            ng.addColorStop(1, 'hsla(0, 70%, 40%, 0)');
            ctx.fillStyle = ng;
            ctx.fillRect(this.x - nmR, this.y - nmR, nmR * 2, nmR * 2);
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = 1;
    }
}

// =====================================================================
// EXPLOSION
// =====================================================================
class Explosion {
    constructor(x, y, generation, radius, onCaught, parentX, parentY, dotType) {
        this.x = x; this.y = y;
        this.generation = generation;
        this.dotType = dotType || 'standard';
        const typeDef = DOT_TYPES[this.dotType] || DOT_TYPES.standard;
        let baseRadius = radius * typeDef.radiusMult;
        const effectiveGen = Math.min(generation, CASCADE_GEN_CAP);
        if (effectiveGen > 0) {
            baseRadius *= (1 + CASCADE_RADIUS_GROWTH * effectiveGen);
        }
        this.explosionRadius = baseRadius;
        this.holdMs = EXPLOSION_HOLD_MS + (effectiveGen > 0 ? CASCADE_HOLD_GROWTH_MS * effectiveGen : 0);
        this.onCaught = onCaught;
        this.createdAt = performance.now();
        this.phase = 'grow';
        this.radius = 0;
        this.caught = new Set();
        this.hue = this.dotType === 'gravity' ? 270
                 : this.dotType === 'volatile' ? 15
                 : 195 - (y / H) * 180;
        this.parentX = parentX;
        this.parentY = parentY;
        this.shockwaveRadius = 0;
        this.flashAlpha = 1;
    }

    // Virtual age tracks time adjusted for slow-motion, so explosions
    // expand/hold/shrink at perceived speed regardless of slowMo factor.
    update(now) {
        if (!this._virtualAge) this._virtualAge = 0;
        const realDelta = now - (this._lastNow || this.createdAt);
        this._lastNow = now;
        this._virtualAge += realDelta * slowMo;
        const age = this._virtualAge;

        this.flashAlpha = Math.max(0, 1 - age / 80);
        this.shockwaveRadius = Math.min(this.explosionRadius * 1.6, age * 0.8);

        const holdMs = this.holdMs;
        if (this.phase === 'grow') {
            if (age >= EXPLOSION_GROW_MS) this.phase = 'hold';
            this.radius = this.explosionRadius * easeOutExpo(Math.min(age / EXPLOSION_GROW_MS, 1));
        } else if (this.phase === 'hold') {
            if (age >= EXPLOSION_GROW_MS + holdMs) this.phase = 'shrink';
            this.radius = this.explosionRadius;
        } else if (this.phase === 'shrink') {
            const t = (age - EXPLOSION_GROW_MS - holdMs) / EXPLOSION_SHRINK_MS;
            if (t >= 1) { this.phase = 'done'; return false; }
            this.radius = this.explosionRadius * (1 - easeInQuad(t));
        }

        if (this.phase === 'grow' || this.phase === 'hold') {
            // Gravity-type explosions pull nearby dots inward
            if (this.dotType === 'gravity') {
                const pullR = this.explosionRadius * 2.5;
                for (let i = 0; i < dots.length; i++) {
                    const dot = dots[i];
                    if (!dot.active || this.caught.has(i)) continue;
                    const dist = Math.hypot(dot.x - this.x, dot.y - this.y);
                    if (dist < pullR && dist > 5) {
                        const f = 0.025 * slowMo / (dist / this.explosionRadius);
                        dot.vx += (this.x - dot.x) / dist * f;
                        dot.vy += (this.y - dot.y) / dist * f;
                    }
                }
            }

            for (let i = 0; i < dots.length; i++) {
                const dot = dots[i];
                if (!dot.active || this.caught.has(i)) continue;
                if (Math.hypot(dot.x - this.x, dot.y - this.y) <= this.radius) {
                    this.caught.add(i);
                    if (this.onCaught) this.onCaught(dot, i, this.generation, this.x, this.y);
                }
            }
        }
        return true;
    }

    draw(ctx) {
        if (this.phase === 'done') return;
        const r = Math.max(0.1, this.radius);
        const age = this._virtualAge || 0;
        let alpha = 1;
        if (this.phase === 'shrink') {
            const t = (age - EXPLOSION_GROW_MS - this.holdMs) / EXPLOSION_SHRINK_MS;
            alpha = 1 - easeInQuad(Math.min(t, 1));
        }

        ctx.globalCompositeOperation = 'lighter';

        // Gen-0 (player tap) = ripple only
        if (this.generation === 0) {
            if (age < 500 && this.shockwaveRadius > 0) {
                ctx.globalAlpha = 0.5 * (1 - age / 500) * alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.max(0.1, this.shockwaveRadius), 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(0, 0%, 90%, 1)`;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
            if (age < 350) {
                ctx.globalAlpha = 0.35 * (1 - age / 350) * alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.max(0.1, this.shockwaveRadius * 0.65), 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(0, 0%, 80%, 1)`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            if (this.flashAlpha > 0) {
                ctx.globalAlpha = this.flashAlpha * 0.4;
                const fr = 8;
                const fg = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, fr);
                fg.addColorStop(0, 'rgba(255,255,255,0.8)');
                fg.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = fg;
                ctx.fillRect(this.x - fr, this.y - fr, fr * 2, fr * 2);
            }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            return;
        }

        // Dot detonation (gen 1+) — escalating with chain depth
        const genBoost = Math.min(0.5, this.generation * 0.08);
        const hue = this.hue + this.generation * 3;

        // Ambient glow
        const ambR = r * (2.5 + genBoost);
        ctx.globalAlpha = alpha * (0.12 + genBoost * 0.15);
        const ag = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, ambR);
        ag.addColorStop(0, `hsla(${hue + 10}, 60%, 70%, 1)`);
        ag.addColorStop(0.5, `hsla(${hue}, 50%, 50%, 0.3)`);
        ag.addColorStop(1, `hsla(${hue}, 50%, 40%, 0)`);
        ctx.fillStyle = ag;
        ctx.fillRect(this.x - ambR, this.y - ambR, ambR * 2, ambR * 2);

        // Flash
        if (this.flashAlpha > 0) {
            ctx.globalAlpha = this.flashAlpha * (0.7 + genBoost);
            const fr = r * 0.6 * (1 + (1 - this.flashAlpha) * 0.8);
            const fg = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, fr);
            fg.addColorStop(0, '#ffffffee');
            fg.addColorStop(0.5, `hsla(50, 100%, 90%, 0.5)`);
            fg.addColorStop(1, `hsla(50, 100%, 80%, 0)`);
            ctx.fillStyle = fg;
            ctx.fillRect(this.x - fr, this.y - fr, fr * 2, fr * 2);
        }

        // Shockwave (scales with chain depth)
        const swScale = 1.6 + Math.min(1.0, this.generation * 0.15);
        this.shockwaveRadius = Math.min(this.explosionRadius * swScale, age * 0.8);
        if (age < 400 && this.shockwaveRadius > 0) {
            ctx.globalAlpha = (0.45 + genBoost * 0.3) * (1 - age / 400);
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.1, this.shockwaveRadius), 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${hue}, 70%, 85%, 1)`;
            ctx.lineWidth = 2.5 + genBoost * 2;
            ctx.stroke();
        }

        // Core
        ctx.globalAlpha = alpha * (0.75 + genBoost * 0.2);
        const cg = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
        cg.addColorStop(0, `hsla(45, 100%, 95%, 0.9)`);
        cg.addColorStop(0.15, `hsla(40, 95%, 80%, 0.6)`);
        cg.addColorStop(0.4, `hsla(${hue + 15}, 80%, 65%, 0.3)`);
        cg.addColorStop(0.7, `hsla(${hue}, 70%, 55%, 0.1)`);
        cg.addColorStop(1, `hsla(${hue}, 60%, 45%, 0)`);
        ctx.fillStyle = cg;
        ctx.fillRect(this.x - r, this.y - r, r * 2, r * 2);

        // Edge ring
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, r), 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(30, 95%, 65%, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner core
        ctx.globalAlpha = alpha * 0.8;
        const cr = r * 0.2;
        const ig = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, cr);
        ig.addColorStop(0, `hsla(50, 100%, 97%, 1)`);
        ig.addColorStop(1, `hsla(45, 90%, 80%, 0)`);
        ctx.fillStyle = ig;
        ctx.fillRect(this.x - cr, this.y - cr, cr * 2, cr * 2);

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
}

// =====================================================================
// CONNECTIONS — soft auras + lines between chainable dots
// =====================================================================
function drawConnections(ctx, gameState) {
    if (gameState !== 'playing' && gameState !== 'resolving') return;
    const now = performance.now();
    const pulse = Math.sin(now * 0.003) * 0.12 + 0.88;
    const r = explosionRadius;

    for (let i = 0; i < dots.length; i++) {
        if (dots[i].active) dots[i]._neighbors = 0;
    }
    const pairs = [];
    for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        if (!a.active) continue;
        for (let j = i + 1; j < dots.length; j++) {
            const b = dots[j];
            if (!b.active) continue;
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist <= r) {
                a._neighbors++;
                b._neighbors++;
                pairs.push(a, b, dist);
            }
        }
    }

    ctx.globalCompositeOperation = 'lighter';

    // Soft gradient auras around every active dot
    for (const d of dots) {
        if (!d.active) continue;
        const hue = d.getHue();
        const n = d._neighbors;
        const auraAlpha = (n > 0
            ? 0.06 + Math.min(0.14, n * 0.04)
            : 0.025) * pulse * d.alpha;

        ctx.globalAlpha = auraAlpha;
        const ag = ctx.createRadialGradient(d.x, d.y, DOT_GLOW_SIZE, d.x, d.y, r);
        ag.addColorStop(0, `hsla(${hue}, 50%, 55%, 0.6)`);
        ag.addColorStop(0.6, `hsla(${hue}, 40%, 45%, 0.2)`);
        ag.addColorStop(1, `hsla(${hue}, 30%, 40%, 0)`);
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Connection lines between chainable pairs
    for (let k = 0; k < pairs.length; k += 3) {
        const a = pairs[k], b = pairs[k+1], dist = pairs[k+2];
        const proximity = 1 - dist / r;
        const hue = (a.getHue() + b.getHue()) / 2;
        const alpha = proximity * 0.40 * pulse;

        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = `hsla(${hue}, 50%, 65%, 1)`;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `hsla(${hue}, 40%, 88%, 1)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// =====================================================================
// CORE SIMULATION — detonation + cascade
// =====================================================================
// Callback for audio — set by host page. Null in replay.
let onDetonateAudio = null;
// Callback for replay recording — set by host page. Null in replay.
let onDetonateRecord = null;

function detonateDot(dot, dotIndex, generation, parentX, parentY) {
    dot.active = false;
    dot.bloomTimer = 12;
    chainCount++;

    const newMult = getMultiplier(chainCount);
    if (newMult > currentMultiplier) {
        currentMultiplier = newMult;
        multiplierPulse = 1.0;
        spawnFloatingText(W/2, H * 0.25, `x${newMult}!`, 50);
    }

    const basePoints = 10 * (generation + 1);
    const points = basePoints * currentMultiplier;
    score += points;

    if (onDetonateAudio) onDetonateAudio(chainCount, generation);

    spawnFloatingText(dot.x, dot.y - 15, `+${points}`, dot.getHue());
    emitParticles(dot.x, dot.y, dot.getHue(), generation);
    if (chainCount >= 8) {
        emitParticles(dot.x, dot.y, dot.getHue() + 20, Math.max(0, generation - 2));
    }

    if (parentX !== undefined && parentY !== undefined) {
        spawnChainLine(parentX, parentY, dot.x, dot.y);
    }

    shakeTrauma = Math.min(1.0, shakeTrauma + SHAKE_TRAUMA_PER_DOT);
    bgPulse = Math.min(0.3, bgPulse + 0.03);

    if (chainCount >= 15) feverIntensity = Math.min(1.0, feverIntensity + 0.15);
    else if (chainCount >= 10) feverIntensity = Math.min(0.6, feverIntensity + 0.1);
    else if (chainCount >= 5) feverIntensity = Math.min(0.3, feverIntensity + 0.05);

    for (const cel of CELEBRATIONS) {
        if (chainCount === cel.chain && lastCelebration < cel.chain) {
            lastCelebration = cel.chain;
            spawnCelebration(cel.text, cel.hue, cel.size);
            if (onDetonateAudio) onDetonateAudio('celebration', CELEBRATIONS.indexOf(cel));
            break;
        }
    }

    const jitter = (Math.random() - 0.5) * 2 * CASCADE_JITTER_MS;
    const delay = CASCADE_STAGGER_MS + jitter;
    pendingExplosions.push({
        x: dot.x, y: dot.y,
        generation: generation + 1,
        time: performance.now() + delay,
        parentX: dot.x, parentY: dot.y,
        dotType: dot.type,
        jitter,
    });
}

function handleDotCaught(dot, dotIndex, generation, expX, expY) {
    if (scheduledDetonations.has(dotIndex)) return;
    scheduledDetonations.add(dotIndex);
    detonateDot(dot, dotIndex, generation, expX, expY);
}

// =====================================================================
// SHARED UPDATE HELPERS
// =====================================================================
function engineUpdatePhysics() {
    updateAmbient();
    updateFloatingTexts();
    updateChainLines();
    particles.update();

    // Dot neighbor count (for connectivity glow)
    for (const d of dots) {
        if (!d.active) continue;
        d._neighbors = 0;
        for (const o of dots) {
            if (o === d || !o.active) continue;
            if (Math.hypot(d.x - o.x, d.y - o.y) <= explosionRadius * 2) d._neighbors++;
        }
    }

    // Process pending explosions
    const now = performance.now();
    for (let i = pendingExplosions.length - 1; i >= 0; i--) {
        if (now >= pendingExplosions[i].time) {
            const p = pendingExplosions[i];
            explosions.push(new Explosion(p.x, p.y, p.generation, explosionRadius, handleDotCaught, p.parentX, p.parentY, p.dotType));
            pendingExplosions.splice(i, 1);
        }
    }

    for (const d of dots) d.update();
    explosions = explosions.filter(e => e.update(now));

    // Screen shake
    if (shakeTrauma > 0.001) {
        const s = shakeTrauma * shakeTrauma;
        shakeX = SHAKE_MAX_OFFSET * s * (Math.random() * 2 - 1);
        shakeY = SHAKE_MAX_OFFSET * s * (Math.random() * 2 - 1);
        shakeTrauma *= SHAKE_DECAY;
    } else { shakeX = 0; shakeY = 0; shakeTrauma = 0; }

    if (bgPulse > 0.001) bgPulse *= 0.93; else bgPulse = 0;
    if (multiplierPulse > 0) multiplierPulse = Math.max(0, multiplierPulse - 0.04);
    if (screenFlash > 0.005) screenFlash *= 0.78; else screenFlash = 0;
    if (beatPulse > 0.001) beatPulse *= 0.86; else beatPulse = 0;
}

// Shared background + scene draw (everything except HUD)
function engineDrawScene(ctx, gameState, supernovaActive) {
    ctx.fillStyle = '#020210';
    ctx.fillRect(0, 0, W, H);

    const bp = bgPulse + beatPulse;
    const bgGrad = ctx.createRadialGradient(W/2, H * 0.55, 0, W/2, H * 0.55, Math.max(W, H) * 0.7);
    bgGrad.addColorStop(0, `rgba(${12 + bp * 80|0}, ${8 + bp * 40|0}, ${25 + bp * 100|0}, 1)`);
    bgGrad.addColorStop(0.5, `rgba(${5 + bp * 40|0}, ${4 + bp * 20|0}, ${18 + bp * 50|0}, 1)`);
    bgGrad.addColorStop(1, 'rgba(2, 2, 12, 1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vigGrad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.25, W/2, H/2, Math.max(W,H)*0.75);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, W, H);

    // Fever glow
    if (feverIntensity > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = feverIntensity * 0.04;
        const fh = (performance.now() * 0.05) % 360;
        const fg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.5);
        fg.addColorStop(0, `hsla(${fh}, 80%, 50%, 1)`);
        fg.addColorStop(1, `hsla(${fh + 30}, 60%, 30%, 0)`);
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    // Supernova ambient glow
    if (supernovaActive) {
        ctx.globalCompositeOperation = 'lighter';
        const snPulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004);
        ctx.globalAlpha = 0.03 + snPulse * 0.02;
        const sg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.5);
        sg.addColorStop(0, 'hsla(45, 80%, 60%, 1)');
        sg.addColorStop(1, 'hsla(30, 60%, 40%, 0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    // Screen flash
    if (screenFlash > 0.005) {
        ctx.fillStyle = `rgba(255, 255, 255, ${screenFlash})`;
        ctx.fillRect(0, 0, W, H);
    }

    drawAmbient(ctx);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawConnections(ctx, gameState);
    drawChainLines(ctx);
    for (const e of explosions) e.draw(ctx);
    particles.draw(ctx);
    for (const d of dots) d.draw(ctx);
    drawFloatingTexts(ctx);

    ctx.restore();
}

// Reset round state (shared between game and replay)
function engineResetRound() {
    explosions = [];
    scheduledDetonations = new Set();
    pendingExplosions = [];
    chainLines = [];
    floatingTexts = [];
    particles.clear();
    chainCount = 0;
    score = 0;
    currentMultiplier = 1;
    multiplierPulse = 0;
    feverIntensity = 0;
    lastCelebration = -1;
}
