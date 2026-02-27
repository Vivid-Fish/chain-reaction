// platform/renderer.js — Canvas 2D renderer with normalized [0,1] coordinates
// Games call draw.rect(), draw.circle(), draw.text(), etc.
// Renderer maps from game space [0,1] to physical pixels.

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

    circle(cx, cy, r, opts = {}) {
      const pixR = px(r);
      ctx.beginPath();
      ctx.arc(gx(cx), gy(cy), pixR, 0, Math.PI * 2);

      if (opts.glow && opts.glowColor) {
        ctx.save();
        ctx.shadowBlur = px(opts.glow);
        ctx.shadowColor = opts.glowColor;
        if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
        ctx.restore();
      } else if (opts.fill) {
        ctx.fillStyle = opts.fill;
        ctx.fill();
      }

      if (opts.stroke) {
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth = opts.strokeWidth || 1;
        ctx.stroke();
      }
    },

    line(x1, y1, x2, y2, opts = {}) {
      ctx.beginPath();
      ctx.moveTo(gx(x1), gy(y1));
      ctx.lineTo(gx(x2), gy(y2));
      ctx.strokeStyle = opts.color || '#fff';
      ctx.lineWidth = opts.width || 1;
      ctx.stroke();
    },

    text(str, cx, cy, opts = {}) {
      const size = px(opts.size || 0.03);
      ctx.font = `${opts.weight || 'bold'} ${size}px ${opts.font || 'monospace'}`;
      ctx.fillStyle = opts.color || '#fff';
      ctx.textAlign = opts.align || 'center';
      ctx.textBaseline = opts.baseline || 'middle';
      ctx.fillText(str, gx(cx), gy(cy));
    },

    polygon(points, opts = {}) {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(gx(points[0].x), gy(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(gx(points[i].x), gy(points[i].y));
      }
      ctx.closePath();
      if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
      if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.strokeWidth || 1; ctx.stroke(); }
    },

    arc(cx, cy, r, startAngle, endAngle, opts = {}) {
      ctx.beginPath();
      ctx.arc(gx(cx), gy(cy), px(r), startAngle, endAngle);
      if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
      if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.strokeWidth || 1; ctx.stroke(); }
    },

    // Raw canvas access for games that need it
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
