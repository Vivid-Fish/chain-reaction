// platform/input.js — Unified input capture for touch, mouse, gyro, keyboard
// Produces input frames: { thumb, gyro, taps, keys }
// All coordinates normalized to [0,1] in game space

export function createInputCapture(canvas) {
  const rect = () => canvas.getBoundingClientRect();

  // Thumb state (primary continuous control)
  let thumb = null;
  let thumbStartX = 0, thumbStartY = 0, thumbStartTime = 0;

  // Gyro state
  let gyro = null;
  let gyroSupported = false;

  // Tap queue (consumed each frame)
  let taps = [];

  // Key state
  const keys = {};

  // Normalize screen coords to [0,1] game space
  function normalize(clientX, clientY) {
    const r = rect();
    return {
      x: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (clientY - r.top) / r.height)),
    };
  }

  // --- Touch handling ---
  let primaryTouch = null;

  function onTouchStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const pos = normalize(t.clientX, t.clientY);
      if (primaryTouch === null) {
        primaryTouch = t.identifier;
        thumbStartX = pos.x;
        thumbStartY = pos.y;
        thumbStartTime = performance.now();
        thumb = {
          active: true,
          x: pos.x, y: pos.y,
          vx: 0, vy: 0,
          startX: pos.x, startY: pos.y,
          duration: 0,
        };
      }
      taps.push({ x: pos.x, y: pos.y, time: performance.now() });
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === primaryTouch && thumb) {
        const pos = normalize(t.clientX, t.clientY);
        const prevX = thumb.x, prevY = thumb.y;
        thumb.x = pos.x;
        thumb.y = pos.y;
        thumb.vx = pos.x - prevX;
        thumb.vy = pos.y - prevY;
        thumb.duration = (performance.now() - thumbStartTime) / 1000;
      }
    }
  }

  function onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === primaryTouch) {
        primaryTouch = null;
        thumb = null;
      }
    }
  }

  // --- Mouse handling (desktop fallback) ---
  let mouseDown = false;

  function onMouseDown(e) {
    mouseDown = true;
    const pos = normalize(e.clientX, e.clientY);
    thumbStartX = pos.x;
    thumbStartY = pos.y;
    thumbStartTime = performance.now();
    thumb = {
      active: true,
      x: pos.x, y: pos.y,
      vx: 0, vy: 0,
      startX: pos.x, startY: pos.y,
      duration: 0,
    };
    taps.push({ x: pos.x, y: pos.y, time: performance.now() });
  }

  function onMouseMove(e) {
    if (!mouseDown || !thumb) return;
    const pos = normalize(e.clientX, e.clientY);
    const prevX = thumb.x, prevY = thumb.y;
    thumb.x = pos.x;
    thumb.y = pos.y;
    thumb.vx = pos.x - prevX;
    thumb.vy = pos.y - prevY;
    thumb.duration = (performance.now() - thumbStartTime) / 1000;
  }

  function onMouseUp() {
    mouseDown = false;
    thumb = null;
  }

  // --- Keyboard ---
  function onKeyDown(e) {
    keys[e.code] = true;
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  // --- Gyro ---
  let gyroBetaBaseline = null;
  let gyroGammaBaseline = null;
  let gyroCalibrated = false;

  function onDeviceOrientation(e) {
    gyroSupported = true;
    const beta = e.beta || 0;
    const gamma = e.gamma || 0;

    // Calibrate: capture baseline on first reading
    if (!gyroCalibrated) {
      gyroBetaBaseline = beta;
      gyroGammaBaseline = gamma;
      gyroCalibrated = true;
    }

    // Report deltas from baseline, not raw values
    const deltaBeta = beta - gyroBetaBaseline;
    const deltaGamma = gamma - gyroGammaBaseline;

    gyro = {
      alpha: e.alpha || 0,
      beta, gamma,
      tiltX: Math.max(-1, Math.min(1, deltaGamma / 30)),
      tiltY: Math.max(-1, Math.min(1, deltaBeta / 30)),
    };
  }

  function calibrateGyro() {
    gyroCalibrated = false;
    gyroBetaBaseline = null;
    gyroGammaBaseline = null;
  }

  // --- Lifecycle ---
  function attach() {
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires explicit permission from user gesture context
        DeviceOrientationEvent.requestPermission()
          .then(perm => {
            if (perm === 'granted') {
              window.addEventListener('deviceorientation', onDeviceOrientation);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', onDeviceOrientation);
      }
    }
  }

  function detach() {
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('touchcancel', onTouchEnd);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('deviceorientation', onDeviceOrientation);
  }

  async function requestGyro() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm === 'granted') {
        window.addEventListener('deviceorientation', onDeviceOrientation);
        return true;
      }
      return false;
    }
    return gyroSupported;
  }

  function capture() {
    const frame = {
      thumb: thumb ? { ...thumb } : null,
      gyro: gyro ? { ...gyro } : null,
      taps: taps.splice(0),  // drain queue
      keys: { ...keys },
    };
    return frame;
  }

  return { attach, detach, capture, requestGyro, calibrateGyro };
}
