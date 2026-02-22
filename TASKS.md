# TASKS.md — Active Work Tracker

Tasks organized by epic. Review at session start. Update as you go.

## Format
- `[ ]` Todo | `[-]` In Progress | `[x]` Done | `[!]` Blocked
- Dependencies: `(needs: #id)` | Blocking: `(blocks: #id)`
- Each task gets a short ID: `T-001`, `T-002`, etc.
- Priority: `P0` (critical) | `P1` (high) | `P2` (medium) | `P3` (low)

---

## Epic: Continuous Play (P0)

### T-012: Design continuous play mode [x]
- Priority: P0
- Completed: 2026-02-21
- Notes: 5 approaches brainstormed (Breathing Field, Tide Pool, Ecosystem, Pressure Cooker, Composer). Recommendation: Pressure Cooker + Composer. Full design in `research/continuous-play.md`. Prior research in `research/endless-mode.md`.

### T-013: Build ContinuousSimulation engine [x]
- Priority: P0
- Started: 2026-02-21
- Completed: 2026-02-21
- Notes: `continuous-sim.js` created. ContinuousSimulation extends Simulation with edge spawning, tap cooldown, density tracking, overflow detection. ContinuousBots adapt all 4 bot types for temporal decisions (when + where to tap). `runContinuous()` helper runs bot sessions.
- Files: `continuous-sim.js`

### T-014: Calibrate difficulty tiers [x]
- Priority: P0
- Started: 2026-02-21
- Completed: 2026-02-21
- Depends: (needs: T-013)
- Notes: Binary-searched spawn rate per bot. 4 tiers calibrated. Key insight: at high maxDots, cascade percolation creates self-regulating equilibrium (any bot survives). TRANSCENDENCE uses low maxDots (60) for tighter overflow threshold. Final: CALM 0.5/s, FLOW 3.2/s, SURGE 5.0/s, TRANSCENDENCE 2.5/s@60cap.
- Files: `difficulty-regression.js` (validates tiers), `game-core.js` (CONTINUOUS_TIERS)

### T-015: Difficulty regression test [x]
- Priority: P0
- Started: 2026-02-21
- Completed: 2026-02-21
- Depends: (needs: T-014)
- Notes: `difficulty-regression.js` validates 12 tests (4 tiers × 3 tests). All pass in fast (20s) and full modes. Tests: steady-state (bot survives), margin (2x rate overwhelms), lower-bot-struggles (weaker bot fails). Uses density-based criteria alongside overflow for robustness.
- Files: `difficulty-regression.js`

### T-016: Implement continuous play in browser [ ]
- Priority: P0
- Depends: (needs: T-015)
- Notes: Port ContinuousSimulation to engine.js. Add mode selector UI. Edge spawning, tap cooldown indicator, density meter, overflow bloom ending animation.

### T-017: Epoch transitions (visual/audio) [ ]
- Priority: P1
- Depends: (needs: T-016)
- Notes: 5 epochs (Dawn → Gathering → Flow → Surge → Transcendence) with smooth crossfade. Background color shifts, particle density scaling, stem layer transitions. See `research/continuous-play.md` §Composer.

### T-018: Continuous play audio coupling [ ]
- Priority: P1
- Depends: (needs: T-017)
- Notes: BPM tracking tied to dot speed, stem layering per epoch, density-to-harmonic-richness mapping. Build on existing generative audio system. Reference: `research/generative-audio.md`.

### T-019: Overflow Bloom ending animation [ ]
- Priority: P2
- Depends: (needs: T-016)
- Notes: When density exceeds Dcrit for 10s, all dots detonate center-outward. Every scale note plays, resolves to sustained chord. Screen goes white → session summary. Death as spectacle, not punishment.

### T-020: Continuous play session persistence [ ]
- Priority: P2
- Depends: (needs: T-016)
- Notes: localStorage high scores (total score, longest chain, highest epoch, duration). Daily seed mode (deterministic PRNG from date). Leaderboard potential.

---

## Epic: Difficulty Calibration (P0)

### T-001: Root cause analysis — game gets too easy at higher rounds [x]
- Priority: P0
- Completed: 2026-02-21
- Notes: Root cause: percolation threshold crossed. Fix (v11): CASCADE_RADIUS_GROWTH=0, CASCADE_HOLD_GROWTH_MS 200→80, faster dots, per-round radius decay. Fix (v12): % field cleared thresholds. Fix (v12.1): Recalibrated celebration thresholds via bot playtest.
- Research: `research/difficulty-analysis.md`

### T-002: Build headless simulation that matches browser gameplay 1:1 [ ]
- Priority: P1
- Notes: sim.js exists but may not match browser physics exactly. Goal: run full games in Node.js matching frame-by-frame behavior. Key diffs to audit: floating-point determinism, wall-bounce edge cases, dot generation overflow.

### T-003: Create bot player profiles for playtesting [ ]
- Priority: P1
- Depends: (needs: T-002)
- Notes: Extend bot ladder with "bad player" bot (random with 500ms reaction delay). Measure experience gap vs Peggle/Candy Crush. Existing bots: random, greedy, humanSim, oracle.

---

## Epic: Gameplay Features (P1)

### T-010: Implement Multi-Tap Supernova [ ]
- Priority: P1
- Notes: From supernova-experiment.js sweep: Multi-Tap scored +11 (winner). 3 taps instead of 1, breaks the ONE-TAP RULE. Charge meter (3 consecutive clears or 2 with high chain ratio), audio/visual shift (low-pass filter sweep), tap counter ("2 taps remaining"). See DESIGN.md "Supernova" section.

### T-021: Musical audio upgrade [ ]
- Priority: P1
- Notes: Gap #1 from gap analysis. Beat quantization (16th-note grid, Rez technique), position-to-pitch mapping (Y axis = scale degree), stem layering across rounds, chain = melodic phrase. Reference: `research/generative-audio.md`.

### T-022: Near-miss feedback [ ]
- Priority: P2
- Notes: Gap #3 from gap analysis. Ghost tap position showing "best possible" spot. "47/50 — so close!" text. Slow-mo on chain break point. Frame failure as achievement. Reference: `research/near-miss-feedback.md`.

### T-023: Structured spawning ("Salad not Soup") [ ]
- Priority: P2
- Notes: Dot types in clusters/veins rather than uniform random. Gravity dots in small groups, volatile dots scattered. Creates readable field patterns. Applies to both round mode and continuous mode.

### T-024: Meta-persistence [ ]
- Priority: P2
- Notes: Gap #5 from gap analysis. localStorage high scores, daily challenge (fixed seed), personal best chain display. Ship free first, no unlockable upgrades (pure skill expression).

---

## Epic: Visual & UI (P1)

### T-004: Fix celebration text running off screen [ ]
- Priority: P1
- Notes: LEGENDARY, GODLIKE text extends past canvas bounds on smaller screens. Need to cap font size or wrap. Reproducible on 320px wide viewports.

### T-025: Replay navigation improvements [ ]
- Priority: P2
- Notes: Replay viewer needs scrub bar, speed controls, round jump buttons. Current: play-only, no navigation.

### T-026: Leaderboard UI (tappable entries) [ ]
- Priority: P3
- Notes: High score list should show tap-to-replay links. Requires replay persistence + score tracking.

---

## Epic: Replay System (P2)

### T-007: Fix replay viewer engine.js path [x]
- Priority: P0
- Completed: 2026-02-21
- Notes: Fixed `<script src="engine.js">` to absolute path `/engine.js`.

### T-008: Old replays missing round_start events between rounds [ ]
- Priority: P2
- Notes: Sessions recorded before v10 lack round_start events between clear and next tap. Replay shows round 1 only. Could add graceful fallback (infer round from tap index) or re-record.

### T-027: Replay DELETE endpoint [ ]
- Priority: P3
- Notes: Server has no endpoint to delete old replays. Need DELETE /replay/:id with admin auth or session ownership check.

---

## Epic: Code Quality (P1)

### T-005: Clean code research and overhaul [x]
- Priority: P1
- Completed: 2026-02-21
- Notes: Research complete — `research/clean-code.md`. Applied: TOC headers, JSDoc typedefs, intent comments, code style in CLAUDE.md.

### T-006: Create CLAUDE.md / AGENTS.md for chain-reaction repo [x]
- Priority: P1
- Completed: 2026-02-21

### T-028: State consolidation rename (deferred) [ ]
- Priority: P3
- Notes: 160+ refs use inconsistent state naming. Rename to unified convention. Deferred because it touches every file and is purely cosmetic. Track but don't prioritize.

---

## Epic: App Store / Distribution (P3)

### T-011: Gap analysis for app store shipping [x]
- Priority: P3
- Completed: 2026-02-21
- Notes: Two-track: Android TWA ($25), iOS Capacitor ($99/yr). See `research/app-store.md`.

### T-029: manifest.json + service worker for PWA [ ]
- Priority: P3
- Notes: Required for TWA wrapping and iOS "Add to Home Screen." Need: icons (192px, 512px), manifest.json, offline-capable service worker.

### T-030: DPR-aware canvas rendering for iOS [ ]
- Priority: P3
- Notes: iOS devices have 2x/3x DPR. Canvas needs to render at physical resolution for crisp visuals. Currently renders at CSS pixels only.

---

## Epic: Research (Completed)

### T-009: Research Tetris Effect-style endless mode [x]
- Priority: P2
- Completed: 2026-02-21
- Research: `research/endless-mode.md`

---

## Simulation Tools Reference

| File | Purpose |
|------|---------|
| `game-core.js` | Single source of truth: physics, bots, BotRunner, constants, tiers. |
| `sim.js` | Headless round simulation. Metrics, bot ladder, 6-metric dashboard. |
| `continuous-sim.js` | Headless continuous play simulation. |
| `difficulty-regression.js` | Regression test: 15 tests (steady-state + margin + lower-bot per tier). |
| `sweep.js` | Parallel parameter sweep via worker threads. |
| `capture-screenshots.js` | Playwright visual verification. |

---

## Completed Archive
<!-- Move completed tasks here after 1 week -->
