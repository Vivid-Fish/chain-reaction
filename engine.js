'use strict';

// =========================================================================
// CHAIN REACTION — Renderer
//
// Visual effects only — no physics, no game logic. Reads state from a
// Game instance (game-core.js). Handles particles, floating text, chain
// lines, ambient stars, screen shake, and composite scene rendering.
//
// Loaded after game-core.js via <script> tag. All game-core exports
// (Game, Bots, DEFAULTS, DOT_TYPES, easeOutExpo, easeInQuad, etc.)
// are available in global scope.
// =========================================================================

// =====================================================================
// RENDERING CONSTANTS
// =====================================================================

const BUILD_VERSION = 'v17.2.0';
const BUILD_DATE = '2026-02-23';

// Dot rendering
let DOT_RADIUS = 5;
let DOT_GLOW_SIZE = 18;
const DOT_TRAIL_LENGTH = 8;

// Particles
const PARTICLE_POOL_SIZE = 4000;
const AMBIENT_PARTICLE_COUNT = 120;

// Screen shake
const SHAKE_MAX_OFFSET = 14;
const SHAKE_DECAY = 0.90;
const SHAKE_TRAUMA_PER_DOT = 0.06;

// =====================================================================
// EASING (rendering-only — easeOutExpo, easeInQuad are in game-core.js)
// =====================================================================
const easeOutQuad = t => 1 - (1 - t) * (1 - t);
const easeOutBack = t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;

// =====================================================================
// VISUAL STATE
// =====================================================================
let W, H, refDim;
let explosionRadius;

let floatingTexts = [];
let chainLines = [];

let shakeTrauma = 0;
let shakeX = 0, shakeY = 0;
let bgPulse = 0;
let screenFlash = 0;
let beatPulse = 0;
let feverIntensity = 0;
let multiplierPulse = 0;

// Settings overrides (set by host page settings panel)
let bgOverride = null;       // [r, g, b] or null for default
let shakeEnabled = true;     // false disables screen shake
let shakeMultiplier = 1.0;   // 0.4 for GENTLE, 1.0 for FULL
let particleMultiplier = 1.0; // 0.3 for REDUCED

// =====================================================================
// RESIZE
// =====================================================================
function engineResize(canvas) {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    refDim = Math.min(W, H, 800);
    const screenMin = Math.min(W, H);
    DOT_RADIUS = Math.max(6, screenMin * 0.014);
    DOT_GLOW_SIZE = Math.max(28, screenMin * 0.06);
}

// =====================================================================
// UTILITY
// =====================================================================
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
    const pm = particleMultiplier;
    const burstN = Math.round((8 + depth * 2) * pm);
    const driftN = Math.round((4 + depth) * pm);
    const sparkN = Math.round((2 + Math.min(8, depth * 2)) * pm);
    const emberN = Math.round((2 + Math.min(4, Math.floor(depth / 2))) * pm);

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
// DOT RENDERING — standalone functions for plain game-core dot objects.
// Visual state (_trail, _alpha, etc.) added on first encounter.
// =====================================================================

function getDotHue(dot) {
    if (dot.type === 'gravity') return 270;
    if (dot.type === 'volatile') return 15;
    return 195 - (dot.y / H) * 180;
}

function ensureDotRenderState(dot) {
    if (dot._trail !== undefined) return;
    dot._trail = [];
    dot._alpha = 0;
    dot._pulsePhase = Math.random() * Math.PI * 2;
    dot._nearMiss = 0;
    dot._neighbors = 0;
}

function updateDotVisuals(dot) {
    ensureDotRenderState(dot);
    // Bloom timer (visual countdown after detonation — game-core sets it, renderer ticks it)
    if (dot.bloomTimer > 0) {
        dot.bloomTimer--;
        return;
    }
    if (!dot.active) return;
    if (dot._alpha < 1) dot._alpha = Math.min(1, dot._alpha + 0.025);
    dot._pulsePhase += 0.05;
    dot._trail.push({ x: dot.x, y: dot.y });
    if (dot._trail.length > DOT_TRAIL_LENGTH) dot._trail.shift();
    if (dot._nearMiss > 0) dot._nearMiss = Math.max(0, dot._nearMiss - 0.012);
}

function drawDot(ctx, dot) {
    ensureDotRenderState(dot);
    if (!dot.active && dot.bloomTimer <= 0) return;
    const hue = getDotHue(dot);
    const pulse = Math.sin(dot._pulsePhase) * 0.2 + 0.8;
    const massMult = dot._massMult || 1;
    const r = DOT_RADIUS * pulse * Math.sqrt(massMult);
    const a = dot._alpha;

    // Bloom (detonation flash)
    if (dot.bloomTimer > 0) {
        const bt = 1 - dot.bloomTimer / 12;
        const br = r * (1 + bt * 5);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - bt) * 0.9;
        const g = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, br);
        g.addColorStop(0, `hsla(${hue}, 70%, 95%, 1)`);
        g.addColorStop(0.3, `hsla(${hue}, 80%, 70%, 0.6)`);
        g.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(dot.x - br, dot.y - br, br * 2, br * 2);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        return;
    }

    // Trail
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < dot._trail.length - 1; i++) {
        const t = dot._trail[i];
        const tp = (i + 1) / dot._trail.length;
        ctx.globalAlpha = a * tp * 0.12;
        const ts = r * tp * 0.8;
        const tg = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, ts * 2);
        tg.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.5)`);
        tg.addColorStop(1, `hsla(${hue}, 70%, 60%, 0)`);
        ctx.fillStyle = tg;
        ctx.fillRect(t.x - ts * 2, t.y - ts * 2, ts * 4, ts * 4);
    }

    // Outer glow — brighter when near other dots (shows clusters)
    const connectBoost = Math.min(1, (dot._neighbors || 0) * 0.12);
    const glowR = DOT_GLOW_SIZE * (1 + connectBoost * 0.3);
    const glowA = a * (0.14 + pulse * 0.08 + connectBoost * 0.15);
    const gg = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, glowR);
    gg.addColorStop(0, `hsla(${hue}, 85%, 70%, ${glowA})`);
    gg.addColorStop(0.4, `hsla(${hue}, 80%, 55%, ${glowA * 0.4})`);
    gg.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = gg;
    ctx.fillRect(dot.x - glowR, dot.y - glowR, glowR * 2, glowR * 2);
    ctx.globalCompositeOperation = 'source-over';

    // Core
    ctx.globalAlpha = a;
    const cg = ctx.createRadialGradient(dot.x - r * 0.2, dot.y - r * 0.2, 0, dot.x, dot.y, r);
    cg.addColorStop(0, `hsla(${hue}, 60%, 95%, 1)`);
    cg.addColorStop(0.4, `hsla(${hue}, 85%, ${65 + pulse * 10}%, 1)`);
    cg.addColorStop(1, `hsla(${hue}, 90%, ${45 + pulse * 10}%, 0.9)`);
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    // Gravity dot: inward spiral lines
    if (dot.type === 'gravity') {
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
            ctx.moveTo(dot.x + Math.cos(angle) * outerR, dot.y + Math.sin(angle) * outerR);
            ctx.lineTo(dot.x + Math.cos(angle + 0.3) * innerR, dot.y + Math.sin(angle + 0.3) * innerR);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    // Volatile dot: jittery outer sparks
    if (dot.type === 'volatile') {
        ctx.globalCompositeOperation = 'lighter';
        const sparkT = performance.now() * 0.004;
        for (let i = 0; i < 4; i++) {
            const sa = sparkT + i * (Math.PI / 2) + Math.sin(sparkT * 3 + i) * 0.5;
            const sr = r * (1.5 + 0.8 * Math.sin(sparkT * 5 + i * 2));
            const ss = 1.5;
            ctx.globalAlpha = a * (0.3 + 0.2 * Math.sin(sparkT * 6 + i));
            ctx.fillStyle = 'hsla(15, 100%, 70%, 1)';
            ctx.fillRect(dot.x + Math.cos(sa) * sr - ss/2, dot.y + Math.sin(sa) * sr - ss/2, ss, ss);
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    // Near-miss red pulse
    if (dot._nearMiss > 0) {
        const nmP = Math.sin(performance.now() * 0.012) * 0.3 + 0.7;
        const nmR = DOT_GLOW_SIZE * 1.2;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = dot._nearMiss * nmP * 0.25;
        const ng = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, nmR);
        ng.addColorStop(0, 'hsla(0, 90%, 60%, 0.6)');
        ng.addColorStop(0.5, 'hsla(0, 80%, 50%, 0.15)');
        ng.addColorStop(1, 'hsla(0, 70%, 40%, 0)');
        ctx.fillStyle = ng;
        ctx.fillRect(dot.x - nmR, dot.y - nmR, nmR * 2, nmR * 2);
        ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
}

// =====================================================================
// EXPLOSION RENDERING — standalone function for game-core explosion objects.
// Game-core explosion: { x, y, radius, maxRadius, phase, age, generation,
//                        dotType, holdMs, caught, createdAt }
// =====================================================================

function drawExplosion(ctx, e) {
    if (e.phase === 'done' || (e.phase === 'shrink' && e.radius < 0.1)) return;
    const r = Math.max(0.1, e.radius);
    const age = e.age;
    const GROW_MS = DEFAULTS.EXPLOSION_GROW_MS;
    const SHRINK_MS = DEFAULTS.EXPLOSION_SHRINK_MS;

    let alpha = 1;
    if (e.phase === 'shrink') {
        const t = (age - GROW_MS - e.holdMs) / SHRINK_MS;
        alpha = 1 - easeInQuad(Math.min(t, 1));
    }

    const flashAlpha = Math.max(0, 1 - age / 80);

    ctx.globalCompositeOperation = 'lighter';

    // Gen-0 (player tap) = ripple only
    if (e.generation === 0) {
        const shockR = Math.min(e.maxRadius * 1.6, age * 0.8);
        if (age < 500 && shockR > 0) {
            ctx.globalAlpha = 0.5 * (1 - age / 500) * alpha;
            ctx.beginPath();
            ctx.arc(e.x, e.y, Math.max(0.1, shockR), 0, Math.PI * 2);
            ctx.strokeStyle = 'hsla(0, 0%, 90%, 1)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
        if (age < 350) {
            ctx.globalAlpha = 0.35 * (1 - age / 350) * alpha;
            ctx.beginPath();
            ctx.arc(e.x, e.y, Math.max(0.1, shockR * 0.65), 0, Math.PI * 2);
            ctx.strokeStyle = 'hsla(0, 0%, 80%, 1)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        if (flashAlpha > 0) {
            ctx.globalAlpha = flashAlpha * 0.4;
            const fr = 8;
            const fg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, fr);
            fg.addColorStop(0, 'rgba(255,255,255,0.8)');
            fg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = fg;
            ctx.fillRect(e.x - fr, e.y - fr, fr * 2, fr * 2);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        return;
    }

    // Dot detonation (gen 1+) — escalating with chain depth
    const hue = e.dotType === 'gravity' ? 270
              : e.dotType === 'volatile' ? 15
              : 195 - (e.y / H) * 180;
    const genBoost = Math.min(0.5, e.generation * 0.08);

    // Ambient glow
    const ambR = r * (2.5 + genBoost);
    ctx.globalAlpha = alpha * (0.12 + genBoost * 0.15);
    const ag = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, ambR);
    ag.addColorStop(0, `hsla(${hue + 10}, 60%, 70%, 1)`);
    ag.addColorStop(0.5, `hsla(${hue}, 50%, 50%, 0.3)`);
    ag.addColorStop(1, `hsla(${hue}, 50%, 40%, 0)`);
    ctx.fillStyle = ag;
    ctx.fillRect(e.x - ambR, e.y - ambR, ambR * 2, ambR * 2);

    // Flash
    if (flashAlpha > 0) {
        ctx.globalAlpha = flashAlpha * (0.7 + genBoost);
        const fr = r * 0.6 * (1 + (1 - flashAlpha) * 0.8);
        const fg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, fr);
        fg.addColorStop(0, '#ffffffee');
        fg.addColorStop(0.5, 'hsla(50, 100%, 90%, 0.5)');
        fg.addColorStop(1, 'hsla(50, 100%, 80%, 0)');
        ctx.fillStyle = fg;
        ctx.fillRect(e.x - fr, e.y - fr, fr * 2, fr * 2);
    }

    // Shockwave (scales with chain depth)
    const swScale = 1.6 + Math.min(1.0, e.generation * 0.15);
    const shockR = Math.min(e.maxRadius * swScale, age * 0.8);
    if (age < 400 && shockR > 0) {
        ctx.globalAlpha = (0.45 + genBoost * 0.3) * (1 - age / 400);
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(0.1, shockR), 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 70%, 85%, 1)`;
        ctx.lineWidth = 2.5 + genBoost * 2;
        ctx.stroke();
    }

    // Core
    ctx.globalAlpha = alpha * (0.75 + genBoost * 0.2);
    const cg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
    cg.addColorStop(0, 'hsla(45, 100%, 95%, 0.9)');
    cg.addColorStop(0.15, 'hsla(40, 95%, 80%, 0.6)');
    cg.addColorStop(0.4, `hsla(${hue + 15}, 80%, 65%, 0.3)`);
    cg.addColorStop(0.7, `hsla(${hue}, 70%, 55%, 0.1)`);
    cg.addColorStop(1, `hsla(${hue}, 60%, 45%, 0)`);
    ctx.fillStyle = cg;
    ctx.fillRect(e.x - r, e.y - r, r * 2, r * 2);

    // Edge ring
    ctx.globalAlpha = alpha * 0.85;
    ctx.beginPath();
    ctx.arc(e.x, e.y, Math.max(0.1, r), 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(30, 95%, 65%, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner core
    ctx.globalAlpha = alpha * 0.8;
    const cr = r * 0.2;
    const ig = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, cr);
    ig.addColorStop(0, 'hsla(50, 100%, 97%, 1)');
    ig.addColorStop(1, 'hsla(45, 90%, 80%, 0)');
    ctx.fillStyle = ig;
    ctx.fillRect(e.x - cr, e.y - cr, cr * 2, cr * 2);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// =====================================================================
// CONNECTIONS — soft auras + lines between chainable dots
// =====================================================================
function drawConnections(ctx, gameDots, gameState) {
    if (gameState !== 'playing' && gameState !== 'resolving') return;
    const now = performance.now();
    const pulse = Math.sin(now * 0.003) * 0.12 + 0.88;
    const r = explosionRadius;

    for (let i = 0; i < gameDots.length; i++) {
        if (gameDots[i].active) {
            ensureDotRenderState(gameDots[i]);
            gameDots[i]._neighbors = 0;
        }
    }
    const pairs = [];
    for (let i = 0; i < gameDots.length; i++) {
        const a = gameDots[i];
        if (!a.active) continue;
        for (let j = i + 1; j < gameDots.length; j++) {
            const b = gameDots[j];
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
    for (const d of gameDots) {
        if (!d.active) continue;
        ensureDotRenderState(d);
        const hue = getDotHue(d);
        const n = d._neighbors;
        const auraAlpha = (n > 0
            ? 0.06 + Math.min(0.14, n * 0.04)
            : 0.025) * pulse * d._alpha;

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
        const hue = (getDotHue(a) + getDotHue(b)) / 2;
        const al = proximity * 0.40 * pulse;

        ctx.globalAlpha = al * 0.4;
        ctx.strokeStyle = `hsla(${hue}, 50%, 65%, 1)`;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        ctx.globalAlpha = al;
        ctx.strokeStyle = `hsla(${hue}, 40%, 88%, 1)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// =====================================================================
// EVENT PROCESSING — Convert game-core events to visual effects.
// Called by host page after game.step(), before draining game.events.
// =====================================================================

function engineProcessEvents(events, game) {
    for (const ev of events) {
        switch (ev.type) {
            case 'dotCaught':
                emitParticles(ev.x, ev.y, ev.hue, ev.generation);
                spawnFloatingText(ev.x, ev.y - 15, `+${ev.points}`, ev.hue);
                if (ev.parentX !== undefined) {
                    spawnChainLine(ev.parentX, ev.parentY, ev.x, ev.y);
                }
                shakeTrauma = Math.min(1.0, shakeTrauma + SHAKE_TRAUMA_PER_DOT);
                bgPulse = Math.min(0.3, bgPulse + 0.03);
                // Extra particles when chain clears 20%+ of the field
                if (game.totalDots > 0 && ev.chainCount / game.totalDots >= 0.20) {
                    emitParticles(ev.x, ev.y, ev.hue + 20, Math.max(0, ev.generation - 2));
                }
                // Fever intensity
                if (game.totalDots > 0) {
                    const feverPct = ev.chainCount / game.totalDots;
                    if (feverPct >= 0.45) feverIntensity = Math.min(1.0, feverIntensity + 0.15);
                    else if (feverPct >= 0.25) feverIntensity = Math.min(0.6, feverIntensity + 0.1);
                    else if (feverPct >= 0.12) feverIntensity = Math.min(0.3, feverIntensity + 0.05);
                }
                break;

            case 'multiplierUp':
                multiplierPulse = 1.0;
                spawnFloatingText(W/2, H * 0.25, `x${ev.mult}!`, 50);
                break;

            case 'celebration':
                spawnCelebration(ev.text, ev.hue, ev.scale);
                break;
        }
        // Other event types (chainEnd, overflow, roundDone) are handled by game.js
    }
}

// =====================================================================
// VISUAL UPDATE — Tick all visual systems. No physics.
// =====================================================================

function engineUpdateVisuals(game) {
    // Sync explosion radius from game
    explosionRadius = game.explosionRadius;

    updateAmbient();
    updateFloatingTexts();
    updateChainLines();
    particles.update();

    // Update dot visual state
    for (const d of game.dots) {
        updateDotVisuals(d);
    }

    // Screen shake
    if (shakeEnabled && shakeTrauma > 0.001) {
        const s = shakeTrauma * shakeTrauma * shakeMultiplier;
        shakeX = SHAKE_MAX_OFFSET * s * (Math.random() * 2 - 1);
        shakeY = SHAKE_MAX_OFFSET * s * (Math.random() * 2 - 1);
        shakeTrauma *= SHAKE_DECAY;
    } else { shakeX = 0; shakeY = 0; if (!shakeEnabled) shakeTrauma = 0; }

    if (bgPulse > 0.001) bgPulse *= 0.93; else bgPulse = 0;
    if (multiplierPulse > 0) multiplierPulse = Math.max(0, multiplierPulse - 0.04);
    if (screenFlash > 0.005) screenFlash *= 0.78; else screenFlash = 0;
    if (beatPulse > 0.001) beatPulse *= 0.86; else beatPulse = 0;
}

// =====================================================================
// SCENE RENDERING — background + composite draw
// =====================================================================

function engineDrawScene(ctx, game, gameState, supernovaActive) {
    const bgR = bgOverride ? bgOverride[0] : 2;
    const bgG = bgOverride ? bgOverride[1] : 2;
    const bgB = bgOverride ? bgOverride[2] : 16;
    ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
    ctx.fillRect(0, 0, W, H);

    const bp = bgPulse + beatPulse;
    const bgGrad = ctx.createRadialGradient(W/2, H * 0.55, 0, W/2, H * 0.55, Math.max(W, H) * 0.7);
    bgGrad.addColorStop(0, `rgba(${bgR + 10 + bp * 80|0}, ${bgG + 6 + bp * 40|0}, ${bgB + 9 + bp * 100|0}, 1)`);
    bgGrad.addColorStop(0.5, `rgba(${bgR + 3 + bp * 40|0}, ${bgG + 2 + bp * 20|0}, ${bgB + 2 + bp * 50|0}, 1)`);
    bgGrad.addColorStop(1, `rgba(${bgR}, ${bgG}, ${Math.max(bgB - 4, 0)}, 1)`);
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

    drawConnections(ctx, game.dots, gameState);
    drawChainLines(ctx);
    for (const e of game.explosions) drawExplosion(ctx, e);
    particles.draw(ctx);
    for (const d of game.dots) drawDot(ctx, d);
    drawFloatingTexts(ctx);

    ctx.restore();
}

// =====================================================================
// VISUAL RESET — Clear visual state between rounds/games
// =====================================================================
function engineResetVisuals() {
    chainLines = [];
    floatingTexts = [];
    particles.clear();
    multiplierPulse = 0;
    feverIntensity = 0;
}
