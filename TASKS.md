# TASKS.md — Active Work Tracker

Tasks organized by project/epic. Review at session start. Update as you go.

## Format
- `[ ]` Todo | `[-]` In Progress | `[x]` Done | `[!]` Blocked
- Dependencies: `(needs: #id)` | Blocking: `(blocks: #id)`
- Each task gets a short ID: `T-001`, `T-002`, etc.
- Priority: `P0` (critical) | `P1` (high) | `P2` (medium) | `P3` (low)

---

## Epic: Gameplay & Difficulty (P0)

### T-001: Root cause analysis — game gets too easy at higher rounds [-]
- Priority: P0
- Started: 2026-02-21
- Notes: User reported "tap anywhere and clear almost every dot, getting legendary, godlike." Need to understand why difficulty curve inverts. Research agent running — percolation theory, coverage density, CHI '24 juicy feedback study.
- Research: `research/difficulty-analysis.md` (pending)

### T-002: Build headless simulation that matches browser gameplay 1:1 [ ]
- Priority: P0
- Depends: (needs: T-001)
- Notes: sim.js exists but may not match browser physics exactly. Goal: run full games in Node.js with bot profiles measuring SCR, chain distribution, clear rates per round.

### T-003: Create bot player profiles for playtesting [ ]
- Priority: P1
- Depends: (needs: T-002)
- Notes: Random bot, cluster-seeking bot, optimal bot, "bad player" bot. Measure player experience gap vs Peggle/Candy Crush.

### T-004: Fix celebration text running off screen [ ]
- Priority: P1
- Notes: LEGENDARY, GODLIKE text extends past canvas bounds on smaller screens. Need to cap font size or wrap.

---

## Epic: Code Quality (P1)

### T-005: Clean code research and overhaul [-]
- Priority: P1
- Started: 2026-02-21
- Notes: Research agent running — AI-friendly code design (Thoughtworks Radar), token efficiency, AGENTS.md best practices, ES modules for vanilla JS. Full overhaul after research completes.
- Research: `research/clean-code.md` (pending)

### T-006: Create CLAUDE.md / AGENTS.md for chain-reaction repo [ ]
- Priority: P1
- Depends: (needs: T-005)
- Notes: Project-specific agent instructions. File paths, code conventions, testing commands, architecture overview.

---

## Epic: Replay & Navigation (P2)

### T-007: Fix replay viewer engine.js path [x]
- Priority: P0
- Completed: 2026-02-21
- Notes: `<script src="engine.js">` resolved to `/replay/engine.js` on replay pages. Fixed to absolute path `/engine.js`.

### T-008: Old replays missing round_start events between rounds [ ]
- Priority: P2
- Notes: Sessions recorded before v10 don't have round_start events between clear and next tap. Replay shows round 1 only for these. Could add graceful fallback or re-record.

---

## Epic: Supernova / Endless Mode (P2)

### T-009: Research Tetris Effect-style endless mode [ ]
- Priority: P2
- Notes: Deep research needed before deciding if separate mode or replacement. Study Tetris Effect Zone mechanic, field-never-resets design. Don't clone — draw inspiration.
- Research: `research/endless-mode.md` (pending)

### T-010: Implement Multi-Tap Supernova [ ]
- Priority: P2
- Notes: From supernova-experiment.js sweep: Multi-Tap scored +11 (winner). 3 taps instead of 1, breaks the ONE-TAP RULE. Charge meter, audio/visual shift. See DESIGN.md "Supernova" section.

---

## Epic: App Store / Distribution (P3)

### T-011: Gap analysis for app store shipping [ ]
- Priority: P3
- Notes: PWA first, native mobile on roadmap. Research what's needed for iOS/Android store submission. Manifest, icons, offline support, etc.
- Research: `research/app-store.md` (pending)

---

## Completed Archive
<!-- Move completed tasks here after 1 week -->
