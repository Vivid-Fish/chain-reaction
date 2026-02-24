'use strict';

// =====================================================================
// CHAIN REACTION — Lab (Live Tuning Panel)
//
// Zero-dependency experiment panel for rapid playtesting.
// Toggle with ` (backtick) on desktop or the ⚗ button on mobile.
//
// Architecture:
//   - EXPERIMENTS define named feature flags with parameters
//   - Each param writes directly to game._contCfg, game.cfg, or DOT_TYPES
//   - Changes take effect on the next frame (no restart)
//   - Presets saved to localStorage, A/B toggle with 1/2 keys
//
// Adding a new experiment:
//   1. Add physics code in game-core.js behind a config flag
//   2. Add an entry to EXPERIMENTS below
//   That's it.
// =====================================================================

const LAB = (() => {

// --- Experiment definitions ---
// target: 'tier' → game._contCfg, 'cfg' → game.cfg, 'dot.TYPE' → DOT_TYPES[TYPE]
const EXPERIMENTS = {
    // === CORE FEEL ===
    'Explosion Radius': {
        key: 'explosionRadiusPct', target: 'custom',
        min: 0.05, max: 0.20, step: 0.005, value: 0.10,
        apply(v) { if (typeof game !== 'undefined' && game) game.explosionRadius = v * Math.min(game.W, game.H); }
    },
    'Hold Duration': {
        key: 'EXPLOSION_HOLD_MS', target: 'cfg',
        min: 200, max: 3000, step: 50, value: 1000,
    },
    'Cascade Stagger': {
        key: 'CASCADE_STAGGER_MS', target: 'cfg',
        min: 20, max: 200, step: 5, value: 80,
    },
    'Cooldown': {
        key: 'cooldown', target: 'tier',
        min: 500, max: 5000, step: 100, value: 2000,
    },

    // === SPAWNING ===
    'Spawn Rate': {
        key: 'spawnRate', target: 'tier',
        min: 0.5, max: 10, step: 0.1, value: 3.6,
    },
    'Max Dots': {
        key: 'maxDots', target: 'tier',
        min: 20, max: 150, step: 5, value: 90,
    },
    'Speed Min': {
        key: 'speedMin', target: 'tier',
        min: 0.1, max: 2.0, step: 0.05, value: 0.5,
    },
    'Speed Max': {
        key: 'speedMax', target: 'tier',
        min: 0.2, max: 3.0, step: 0.05, value: 1.0,
    },
    'Density Feedback': {
        key: 'spawnDensityScale', target: 'tier',
        min: 0, max: 2.0, step: 0.1, value: 0.4,
    },

    // === DOT TYPES ===
    'Gravity Pull Force': {
        key: 'pullForce', target: 'dot.gravity',
        min: 0, max: 0.05, step: 0.001, value: 0.012,
    },
    'Gravity Pull Range': {
        key: 'pullRange', target: 'dot.gravity',
        min: 1.0, max: 6.0, step: 0.1, value: 2.5,
    },
    'Volatile Radius Mult': {
        key: 'radiusMult', target: 'dot.volatile',
        min: 1.0, max: 3.0, step: 0.1, value: 1.5,
    },
    'Volatile Speed Mult': {
        key: 'speedMult', target: 'dot.volatile',
        min: 0.5, max: 2.5, step: 0.1, value: 1.3,
    },

    // === SCHOOLING (Boids flocking) ===
    'Cohesion': {
        key: 'cohesionForce', target: 'tier',
        min: 0, max: 0.03, step: 0.001, value: 0,
    },
    'Alignment': {
        key: 'alignmentForce', target: 'tier',
        min: 0, max: 0.15, step: 0.005, value: 0,
    },
    'Separation': {
        key: 'separationForce', target: 'tier',
        min: 0, max: 0.5, step: 0.01, value: 0,
    },
    'Flock Range': {
        key: 'cohesionRange', target: 'tier',
        min: 30, max: 200, step: 5, value: 80,
    },
    // === TEMPERATURE (spatial speed gradient) ===
    'Temperature': {
        key: 'temperatureStrength', target: 'tier',
        min: 0, max: 1.0, step: 0.05, value: 0,
    },
    // === MASS (dots grow with age) ===
    'Mass Growth': {
        key: 'massGrowth', target: 'tier',
        min: 0, max: 2.0, step: 0.1, value: 0,
    },
    // === WAVE SPAWN ===
    'Wave Spawn': {
        key: 'waveSpawn', target: 'tier',
        min: 0, max: 1, step: 1, value: 0,
    },
    'Wave Size': {
        key: 'waveSize', target: 'tier',
        min: 3, max: 15, step: 1, value: 6,
    },
    'Wave Interval': {
        key: 'waveInterval', target: 'tier',
        min: 1000, max: 8000, step: 500, value: 3000,
    },
};

// --- Groups for tab organization ---
const GROUPS = {
    'Feel':  ['Explosion Radius', 'Hold Duration', 'Cascade Stagger', 'Cooldown'],
    'Spawn': ['Spawn Rate', 'Max Dots', 'Speed Min', 'Speed Max', 'Density Feedback'],
    'Types': ['Gravity Pull Force', 'Gravity Pull Range', 'Volatile Radius Mult', 'Volatile Speed Mult'],
    'School': ['Cohesion', 'Alignment', 'Separation', 'Flock Range'],
    'Lab':   ['Temperature', 'Mass Growth', 'Wave Spawn', 'Wave Size', 'Wave Interval'],
};

let panel = null;
let visible = false;
let activeGroup = 'Lab';
let sliders = {};
let presets = { A: null, B: null };
let activePreset = null;

function getVal(name) {
    return EXPERIMENTS[name]._current ?? EXPERIMENTS[name].value;
}

function applyParam(name, value) {
    const exp = EXPERIMENTS[name];
    exp._current = value;

    if (exp.apply) {
        exp.apply(value);
        return;
    }

    // Auto-apply based on target
    if (typeof game === 'undefined' || !game) return;

    if (exp.target === 'tier' && game._contCfg) {
        game._contCfg[exp.key] = value;
    } else if (exp.target === 'cfg') {
        game.cfg[exp.key] = value;
    } else if (exp.target.startsWith('dot.')) {
        const type = exp.target.split('.')[1];
        if (DOT_TYPES[type]) DOT_TYPES[type][exp.key] = value;
    }
}

function snapshot() {
    const state = {};
    for (const name of Object.keys(EXPERIMENTS)) {
        state[name] = getVal(name);
    }
    return state;
}

function loadSnapshot(state) {
    for (const [name, value] of Object.entries(state)) {
        if (EXPERIMENTS[name]) {
            applyParam(name, value);
            if (sliders[name]) {
                sliders[name].input.value = value;
                sliders[name].readout.textContent = fmtVal(value, EXPERIMENTS[name]);
            }
        }
    }
    save();
}

function fmtVal(v, exp) {
    if (exp.step >= 1) return String(Math.round(v));
    if (exp.step >= 0.01) return v.toFixed(2);
    return v.toFixed(3);
}

function save() {
    try {
        const state = snapshot();
        localStorage.setItem('cr-lab', JSON.stringify(state));
    } catch (e) { /* ignore */ }
}

function restore() {
    try {
        const saved = JSON.parse(localStorage.getItem('cr-lab'));
        if (saved) loadSnapshot(saved);
    } catch (e) { /* ignore */ }
}

// --- Build DOM ---
function build() {
    if (panel) return;

    panel = document.createElement('div');
    panel.id = 'cr-lab';
    panel.innerHTML = `
        <style>
            #cr-lab {
                position: fixed; top: 0; right: 0; z-index: 10000;
                width: 300px; max-height: 100vh; overflow-y: auto;
                background: rgba(4, 4, 15, 0.92); color: #ccc;
                font: 11px/1.5 'Inter', system-ui, monospace;
                padding: 0; display: none;
                border-left: 1px solid rgba(255,255,255,0.1);
                -webkit-overflow-scrolling: touch;
                backdrop-filter: blur(8px);
            }
            #cr-lab * { box-sizing: border-box; }
            .lab-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.08);
            }
            .lab-header span { font-weight: 700; font-size: 12px; color: #fff; letter-spacing: 0.5px; }
            .lab-tabs {
                display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.08);
            }
            .lab-tab {
                flex: 1; padding: 6px 0; text-align: center; cursor: pointer;
                font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
                color: rgba(255,255,255,0.4); border-bottom: 2px solid transparent;
                transition: color 0.15s, border-color 0.15s;
            }
            .lab-tab:hover { color: rgba(255,255,255,0.7); }
            .lab-tab.active { color: #fff; border-bottom-color: rgba(120,180,255,0.6); }
            .lab-group { padding: 8px 10px; }
            .lab-row {
                display: flex; align-items: center; gap: 6px; margin: 3px 0;
            }
            .lab-label { flex: 0 0 100px; font-size: 10px; color: rgba(255,255,255,0.6); }
            .lab-slider {
                flex: 1; height: 20px; -webkit-appearance: none; appearance: none;
                background: rgba(255,255,255,0.08); border-radius: 2px; outline: none;
                touch-action: none;
            }
            .lab-slider::-webkit-slider-thumb {
                -webkit-appearance: none; width: 14px; height: 14px;
                background: rgba(120,180,255,0.8); border-radius: 50%; cursor: grab;
            }
            .lab-readout {
                flex: 0 0 42px; text-align: right; font-size: 10px;
                font-variant-numeric: tabular-nums; color: rgba(255,255,255,0.8);
            }
            .lab-presets {
                display: flex; gap: 4px; padding: 6px 10px;
                border-top: 1px solid rgba(255,255,255,0.08);
            }
            .lab-btn {
                flex: 1; padding: 4px; text-align: center; cursor: pointer;
                font-size: 10px; font-weight: 600; border-radius: 3px;
                background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
                border: 1px solid rgba(255,255,255,0.08);
                transition: background 0.15s, color 0.15s;
            }
            .lab-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
            .lab-btn.active { background: rgba(120,180,255,0.2); color: #fff; border-color: rgba(120,180,255,0.4); }
            .lab-toggle {
                position: fixed; bottom: 12px; right: 12px; z-index: 10001;
                width: 36px; height: 36px; border-radius: 50%;
                background: rgba(4,4,15,0.8); border: 1px solid rgba(255,255,255,0.15);
                color: rgba(255,255,255,0.6); font-size: 18px;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; backdrop-filter: blur(4px);
            }
            .lab-toggle:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
            /* Always visible — backtick also works on desktop */
        </style>
        <div class="lab-header">
            <span>LAB</span>
            <span id="lab-preset-indicator" style="font-size:10px;color:rgba(255,255,255,0.3)"></span>
        </div>
        <div class="lab-tabs" id="lab-tabs"></div>
        <div id="lab-groups"></div>
        <div class="lab-presets">
            <div class="lab-btn" id="lab-save-a">Save A</div>
            <div class="lab-btn" id="lab-save-b">Save B</div>
            <div class="lab-btn" id="lab-toggle-ab">A/B</div>
            <div class="lab-btn" id="lab-reset">Reset</div>
        </div>
    `;

    // Tabs
    const tabsEl = panel.querySelector('#lab-tabs');
    for (const groupName of Object.keys(GROUPS)) {
        const tab = document.createElement('div');
        tab.className = 'lab-tab' + (groupName === activeGroup ? ' active' : '');
        tab.textContent = groupName;
        tab.onclick = () => switchGroup(groupName);
        tabsEl.appendChild(tab);
    }

    // Groups
    const groupsEl = panel.querySelector('#lab-groups');
    for (const [groupName, paramNames] of Object.entries(GROUPS)) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'lab-group';
        groupDiv.id = 'lab-group-' + groupName;
        groupDiv.style.display = groupName === activeGroup ? 'block' : 'none';

        for (const name of paramNames) {
            const exp = EXPERIMENTS[name];
            const row = document.createElement('div');
            row.className = 'lab-row';

            const label = document.createElement('div');
            label.className = 'lab-label';
            label.textContent = name;

            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'lab-slider';
            input.min = exp.min;
            input.max = exp.max;
            input.step = exp.step;
            input.value = getVal(name);

            const readout = document.createElement('div');
            readout.className = 'lab-readout';
            readout.textContent = fmtVal(getVal(name), exp);

            input.addEventListener('input', () => {
                const v = parseFloat(input.value);
                readout.textContent = fmtVal(v, exp);
                applyParam(name, v);
                save();
            });

            sliders[name] = { input, readout };
            row.append(label, input, readout);
            groupDiv.appendChild(row);
        }
        groupsEl.appendChild(groupDiv);
    }

    // Preset buttons
    panel.querySelector('#lab-save-a').onclick = () => savePreset('A');
    panel.querySelector('#lab-save-b').onclick = () => savePreset('B');
    panel.querySelector('#lab-toggle-ab').onclick = toggleAB;
    panel.querySelector('#lab-reset').onclick = resetAll;

    document.body.appendChild(panel);

    // Mobile toggle button
    const toggle = document.createElement('div');
    toggle.className = 'lab-toggle';
    toggle.textContent = '\u2697';  // ⚗
    toggle.onclick = () => setVisible(!visible);
    document.body.appendChild(toggle);

    // Keyboard: backtick toggles, 1/2 save presets, tab toggles A/B
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === '`') { e.preventDefault(); setVisible(!visible); }
    });

    restore();
}

function switchGroup(name) {
    activeGroup = name;
    panel.querySelectorAll('.lab-tab').forEach(t => {
        t.classList.toggle('active', t.textContent === name);
    });
    for (const g of Object.keys(GROUPS)) {
        const el = document.getElementById('lab-group-' + g);
        if (el) el.style.display = g === name ? 'block' : 'none';
    }
}

function setVisible(v) {
    visible = v;
    if (panel) panel.style.display = visible ? 'block' : 'none';
}

function savePreset(slot) {
    presets[slot] = snapshot();
    activePreset = slot;
    try { localStorage.setItem('cr-lab-presets', JSON.stringify(presets)); } catch (e) {}
    updatePresetIndicator();
}

function toggleAB() {
    if (!presets.A && !presets.B) return;
    if (activePreset === 'A' && presets.B) {
        loadSnapshot(presets.B);
        activePreset = 'B';
    } else if (presets.A) {
        loadSnapshot(presets.A);
        activePreset = 'A';
    }
    updatePresetIndicator();
}

function updatePresetIndicator() {
    const el = document.getElementById('lab-preset-indicator');
    if (el) el.textContent = activePreset ? `Preset ${activePreset}` : '';
    panel.querySelectorAll('.lab-btn').forEach(b => b.classList.remove('active'));
    if (activePreset === 'A') panel.querySelector('#lab-save-a')?.classList.add('active');
    if (activePreset === 'B') panel.querySelector('#lab-save-b')?.classList.add('active');
}

function resetAll() {
    for (const [name, exp] of Object.entries(EXPERIMENTS)) {
        applyParam(name, exp.value);
        if (sliders[name]) {
            sliders[name].input.value = exp.value;
            sliders[name].readout.textContent = fmtVal(exp.value, exp);
        }
    }
    activePreset = null;
    updatePresetIndicator();
    save();
}

// --- Init ---
function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
}

return { init, setVisible, snapshot, loadSnapshot, EXPERIMENTS, GROUPS };

})();

// Auto-init
LAB.init();
