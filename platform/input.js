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
  let lastTapTime = 0;

  function onTouchStart(e) {
    e.preventDefault();
    const now = performance.now();
    for (const t of e.changedTouches) {
      const pos = normalize(t.clientX, t.clientY);
      if (primaryTouch === null) {
        // Double-tap detection: recalibrate gyro
        if (gyroSupported && now - lastTapTime < 300) {
          calibrateGyro();
        }
        lastTapTime = now;

        primaryTouch = t.identifier;
        thumbStartX = pos.x;
        thumbStartY = pos.y;
        thumbStartTime = now;
        thumb = {
          active: true,
          x: pos.x, y: pos.y,
          vx: 0, vy: 0,
          startX: pos.x, startY: pos.y,
          duration: 0,
        };
      }
      taps.push({ x: pos.x, y: pos.y, time: now });
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
  let gyroEventCount = 0;
  let gyroDiagSent = false;
  let lastCalibrationTime = 0;
  const gyroDiag = { source: null, errors: [] };

  function onDeviceOrientation(e) {
    // Some devices fire the event but with all nulls
    if (e.beta === null && e.gamma === null) return;

    gyroSupported = true;
    gyroEventCount++;
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
    lastCalibrationTime = performance.now();
  }

  // Send gyro diagnostics to server (once per session, after 3s)
  function sendGyroDiag() {
    if (gyroDiagSent) return;
    gyroDiagSent = true;
    const diag = {
      type: 'gyro',
      supported: gyroSupported,
      eventCount: gyroEventCount,
      source: gyroDiag.source,
      errors: gyroDiag.errors,
      apis: {
        DeviceOrientationEvent: !!window.DeviceOrientationEvent,
        requestPermission: typeof DeviceOrientationEvent?.requestPermission === 'function',
        AbsoluteOrientationSensor: !!window.AbsoluteOrientationSensor,
        RelativeOrientationSensor: !!window.RelativeOrientationSensor,
        Gyroscope: !!window.Gyroscope,
        DeviceMotionEvent: !!window.DeviceMotionEvent,
      },
      brave: !!navigator.brave,
      ua: navigator.userAgent.slice(0, 200),
    };
    fetch('/api/diag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diag),
    }).catch(() => {});
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

    // --- Gyro: try multiple approaches ---

    // 1. deviceorientation (standard, works on most devices)
    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+
        DeviceOrientationEvent.requestPermission()
          .then(perm => {
            if (perm === 'granted') {
              gyroDiag.source = 'deviceorientation-ios';
              window.addEventListener('deviceorientation', onDeviceOrientation);
            } else {
              gyroDiag.errors.push('ios-permission-denied:' + perm);
            }
          })
          .catch(e => { gyroDiag.errors.push('ios-permission-error:' + e.message); });
      } else {
        gyroDiag.source = 'deviceorientation';
        window.addEventListener('deviceorientation', onDeviceOrientation);
      }
    } else {
      gyroDiag.errors.push('no-DeviceOrientationEvent');
    }

    // 2. devicemotion fallback (accelerometer-only devices)
    if (window.DeviceMotionEvent) {
      let motionFallbackActive = false;
      const onDeviceMotion = (e) => {
        // Only use as fallback if deviceorientation isn't working
        if (gyroSupported) return;
        const ag = e.accelerationIncludingGravity;
        if (!ag || ag.x === null) return;
        motionFallbackActive = true;
        // Derive tilt from gravity vector
        // x: left-right tilt, y: front-back tilt, z: up-down
        const gamma = Math.atan2(ag.x, ag.z) * (180 / Math.PI);
        const beta = Math.atan2(ag.y, ag.z) * (180 / Math.PI);
        onDeviceOrientation({ alpha: 0, beta, gamma });
        if (!gyroDiag.source || gyroDiag.source === 'deviceorientation') {
          gyroDiag.source = 'devicemotion-fallback';
        }
      };
      window.addEventListener('devicemotion', onDeviceMotion);
    }

    // 3. Generic Sensor API fallback (some Android Chrome)
    if (window.AbsoluteOrientationSensor) {
      try {
        const sensor = new AbsoluteOrientationSensor({ frequency: 60 });
        sensor.addEventListener('reading', () => {
          if (gyroSupported && gyroDiag.source !== 'sensor-api') return;
          const [x, y, z, w] = sensor.quaternion;
          const gamma = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)) * (180 / Math.PI);
          const beta = Math.asin(Math.max(-1, Math.min(1, 2 * (w * y - z * x)))) * (180 / Math.PI);
          gyroDiag.source = 'sensor-api';
          onDeviceOrientation({ alpha: 0, beta, gamma });
        });
        sensor.addEventListener('error', (e) => {
          gyroDiag.errors.push('sensor-error:' + (e.error?.message || 'unknown'));
        });
        sensor.start();
      } catch (e) {
        gyroDiag.errors.push('sensor-catch:' + e.message);
      }
    }

    // Send diagnostics after 3 seconds
    setTimeout(sendGyroDiag, 3000);
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
      calibrated: lastCalibrationTime > 0 && (performance.now() - lastCalibrationTime) < 1500,
    };
    return frame;
  }

  return {
    attach, detach, capture, requestGyro, calibrateGyro,
    get gyroSupported() { return gyroSupported; },
    get gyroEvents() { return gyroEventCount; },
  };
}
