# Chain Reaction — Agent Instructions

## Project Overview
Browser-based chain reaction game. One tap triggers cascading explosions. Canvas 2D + Web Audio API, vanilla JS, no build tools. Deployed on Coolify at chain-reaction.vivid.fish.

## Architecture
- `engine.js` — Shared game engine (physics, rendering, particles, Dot/Explosion classes). Loaded by both game and replay viewer.
- `index.html` — Game client (audio, game state, UI, input, replay recording, API calls)
- `replay.html` — Replay viewer (canvas-drawn HUD, transport controls, progress bar)
- `server.js` — Node.js HTTP server (static files, PostgreSQL API: sessions, replays, checkpoints, leaderboard)
- `sim.js` — Headless simulation engine for bot-driven playtesting
- `DESIGN.md` — Design principles, simulation methodology, metrics, sweep results
- `SPEC.md` — Original game spec (vision, rules, audio, visuals, progression)
- `TASKS.md` — Active work tracker (read at session start)

## Key Conventions
- Dot constructor: `new Dot(x, y, vx, vy, type)` — random velocity is generated in `generateDots()`, NOT in the constructor
- Engine globals are shared via `<script>` tag ordering — engine.js first, then page script
- Replay paths: use **absolute** paths for script src (e.g., `/engine.js` not `engine.js`) because replay pages are served under `/replay/`
- Build version: update `BUILD_VERSION` in engine.js and bump on significant changes

## Testing
```bash
# Syntax check
node -e "new Function(require('fs').readFileSync('engine.js','utf8'))"

# Run headless simulation
node sim.js

# Playwright smoke test
npx playwright test

# Check deployed site
curl -s https://chain-reaction.vivid.fish/api/leaderboard | python3 -m json.tool
```

## Deployment
```bash
# Coolify deploy (after push to master)
curl -s -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
  "https://coolify.vivid.fish/api/v1/deploy?uuid=ng4cwsc4csgcs84gssw0o0ww"
```

## Task Management
- **TASKS.md** tracks all active work items. Check it at session start alongside DESIGN.md.
- Before starting non-trivial work (anything taking >10 minutes), create a task entry.
- Update task status as you work: `[ ]` -> `[-]` -> `[x]` or `[!]`.
- When completing a task that blocks others, check if blocked tasks can be unblocked.
- Tasks use IDs (T-001, T-002...). Reference them in commits and notes.
- Archive completed tasks weekly (move to bottom section).
- One task in progress at a time. Finish or block before starting another.

## Design Philosophy
- "Maximum complexity, minimum abstraction" — emergent gameplay from physics, not scripted combos
- Key metrics: SCR (single-round clear rate), DHR (difficulty headroom ratio), F3, R50, Chain Distribution
- CHI '24 finding: success-dependence > amplification for motivation
- Never clone prior art directly — draw inspiration, apply original thinking
