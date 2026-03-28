// platform/renderer.js — Canvas 2D renderer with normalized [0,1] coordinates
// Games call draw.rect(), draw.circle(), draw.text(), etc.
// Renderer maps from game space [0,1] to physical pixels.
// Designed so the backend (Canvas 2D today) can be swapped to WebGL later
// without changing any game code.

export function createRenderer() {
  let ctx = null;
  let w = 0, h = 0;
  let pixelRatio = 1;

  // Convert game coords [0,1] to pixels
  function px(v) { return v * Math.min(w, h); }
  function gx(v) { return v * w; }
  function gy(v) { return v * h; }

  const draw = {
    clear(r, g, b, a = 1) {
      if (typeof r === 'string') {
        ctx.fillStyle = r;
      } else {
        ctx.fillStyle = `rgba(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)},${a})`;
      }
      ctx.fillRect(0, 0, w, h);
    },

    rect(cx, cy, rw, rh, opts = {}) {
      const x = gx(cx) - gx(rw) / 2;
      const y = gy(cy) - gy(rh) / 2;
      const rWidth = gx(rw);
      const rHeight = gy(rh);

      ctx.save();
      if (opts.blend) ctx.globalCompositeOperation = opts.blend;
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
      if (opts.rotation) {
        ctx.translate(gx(cx), gy(cy));
        ctx.rotate(opts.rotation);
        ctx.translate(-gx(cx), -gy(cy));
      }

      if (opts.radius) {
        const r = px(opts.radius);
        roundRect(ctx, x, y, rWidth, rHeight, r);
        if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
        if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.strokeWidth || 1; ctx.stroke(); }
      } else {
        if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fillRect(x, y, rWidth, rHeight); }
        if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.strokeWidth || 1; ctx.strokeRect(x, y, rWidth, rHeight); }
      }
      ctx.restore();
    },

    // circle with optional radial gradient, blend mode, and glow
    //
    // Gradient format: { gradient: [{ stop: 0, color: 'hsla(...)' }, ...] }
    //   Creates a radial gradient from center (stop 0) to edge (stop 1).
    //   Use instead of flat `fill` for glows, cores, auras.
    //
    // Blend modes: { blend: 'lighter' } for additive glow
    //   Maps to ctx.globalCompositeOperation. Common: 'lighter' (additive),
    //   'screen', 'multiply'. Default: 'source-over' (normal).
    //
    // Alpha: { alpha: 0.5 } for overall transparency
    //
    circle(cx, cy, r, opts = {}) {
      const pixX = gx(cx), pixY = gy(cy), pixR = px(r);
      if (pixR < 0.1) return;

      ctx.save();
      if (opts.blend) ctx.globalCompositeOperation = opts.blend;
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

      if (opts.gradient) {
        // Radial gradient from center to edge
        const grad = ctx.createRadialGradient(
          pixX + px(opts.gradientOffset?.x || 0),
          pixY + px(opts.gradientOffset?.y || 0),
          0, pixX, pixY, pixR
        );
        for (const stop of opts.gradient) {
          grad.addColorStop(stop.stop, stop.color);
        }
        ctx.fillStyle = grad;
        if (opts.clip) {
          // Circle-clipped: crisp circular edge with gradient fill inside
          // Use for solid objects (dots, balls, bullets)
          ctx.beginPath();
          ctx.arc(pixX, pixY, pixR, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Unclipped: square gradient blob that fades to transparent
          // Use for glows, auras, ambient effects
          ctx.fillRect(pixX - pixR, pixY - pixR, pixR * 2, pixR * 2);
        }
      } else if (opts.glow && opts.glowColor) {
        ctx.beginPath();
        ctx.arc(pixX, pixY, pixR, 0, Math.PI * 2);
        ctx.shadowBlur = px(opts.glow);
        ctx.shadowColor = opts.glowColor;
        if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
      } else if (opts.fill) {
        ctx.beginPath();
        ctx.arc(pixX, pixY, pixR, 0, Math.PI * 2);
        ctx.fillStyle = opts.fill;
        ctx.fill();
      }

      if (opts.stroke) {
        ctx.beginPath();
        ctx.arc(pixX, pixY, pixR, 0, Math.PI * 2);
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth = opts.strokeWidth || 1;
        ctx.stroke();
      }
      ctx.restore();
    },

    line(x1, y1, x2, y2, opts = {}) {
      ctx.save();
      if (opts.blend) ctx.globalCompositeOperation = opts.blend;
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
      ctx.beginPath();
      ctx.moveTo(gx(x1), gy(y1));
      ctx.lineTo(gx(x2), gy(y2));
      ctx.strokeStyle = opts.color || '#fff';
      ctx.lineWidth = opts.width || 1;
      ctx.stroke();
      ctx.restore();
    },

    text(str, cx, cy, opts = {}) {
      const size = px(opts.size || 0.03);
      ctx.save();
      if (opts.blend) ctx.globalCompositeOperation = opts.blend;
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
      if (opts.shadow) {
        ctx.shadowColor = opts.shadow;
        ctx.shadowBlur = opts.shadowBlur || 8;
      }
      ctx.font = `${opts.weight || 'bold'} ${size}px ${opts.font || 'monospace'}`;
      ctx.fillStyle = opts.color || '#fff';
      ctx.textAlign = opts.align || 'center';
      ctx.textBaseline = opts.baseline || 'middle';
      ctx.fillText(str, gx(cx), gy(cy));
      ctx.restore();
    },

    polygon(points, opts = {}) {
      if (points.length < 2) return;
      ctx.save();
      if (opts.blend) ctx.globalCompositeOperation = opts.blend;
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
      ctx.beginPath();
      ctx.moveTo(gx(points[0].x), gy(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(gx(points[i].x), gy(points[i].y));
      }
      ctx.closePath();
      if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
      if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.strokeWidth || 1; ctx.stroke(); }
      ctx.restore();
    },

    arc(cx, cy, r, startAngle, endAngle, opts = {}) {
      ctx.save();
      if (opts.blend) ctx.globalCompositeOperation = opts.blend;
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
      ctx.beginPath();
      ctx.arc(gx(cx), gy(cy), px(r), startAngle, endAngle);
      if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
      if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.strokeWidth || 1; ctx.stroke(); }
      ctx.restore();
    },

    // Raw canvas access — escape hatch for truly game-specific rendering.
    // Prefer gradient/blend/alpha options on draw primitives over raw ctx.
    get ctx() { return ctx; },
    get width() { return w; },
    get height() { return h; },
    gx, gy, px,
  };

  function begin(canvas) {
    ctx = canvas.getContext('2d');
    pixelRatio = window.devicePixelRatio || 1;
    w = canvas.width / pixelRatio;
    h = canvas.height / pixelRatio;
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
  }

  function end() {
    ctx.restore();
  }

  return { draw, begin, end };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
