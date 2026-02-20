# Chain Reaction — Design Evolution

## Status
- **Current version:** v5.1 (2026-02-20)
- **Live at:** chain-reaction.vivid.fish
- **Coolify UUID:** ng4cwsc4csgcs84gssw0o0ww
- **Git:** github.com/simonswims/chain-reaction (master branch)

## Design Principles

These emerged from collaborative design sessions (Tim + Gemini + Claude).

### 1. Maximum Complexity, Minimum Abstraction
The best version has 3 rules that create 1000 outcomes, not 1000 rules. Complexity must exist entirely on the playfield — no shop screens, no upgrade menus, no XP bars. If the player needs to read a wiki to understand a rule, it's wrong.

### 2. Lateral Progression (The Mewgenics Principle)
No loot is objectively better — just different. Players discover "broken" combinations through creativity, not grinding. A gravity dot isn't stronger than a volatile dot; they serve different strategic purposes. The feeling of power comes from recognizing how to exploit interactions, not from stat bumps.

### 3. Property Transmission (The Virus Model)
**The one rule:** An explosion inherits the properties of the dot that caused it, and imparts them to the dots it catches. This creates a genetic algorithm on screen — tap once, watch a "trait" evolve across the chain. The ORDER in which you trigger the chain changes the outcome entirely (Heavy→Volatile = supernova; Volatile→Heavy = scattered pops).

### 4. Emergent, Not Scripted
No hard-coded synergies (`if (fire && ice) playSteam()`). Instead: systemic interactions. Fire adds heat. Ice removes heat. Steam is what happens when heat meets water. The game engine shouldn't "know" a combo happened; the combo should be a mathematical inevitability.

### 5. Dots Are Always In Motion
This is NOT a puzzle game — it's action-strategy. The temporal dimension (timing windows, prediction, interception) is fundamental. Any new mechanic must interact with movement. Static analysis fails because the board is never static.

### 6. Juice Effects Are Multiplicative, Not Additive
(From the build-app skill.) Each juice layer compounds the previous ones. Screen shake alone = +10%. Screen shake + particles = +30%. Screen shake + particles + sound = +80%. Order of implementation matters.

### 7. Simulation Before Design
Don't guess. Measure. Before committing to any new mechanic, run headless simulations to understand how it affects the core metrics. The data tells us whether the game needs stabilizers, aggregators, or amplifiers.

## Core Meta-Questions

### A. Horizon of Predictability (Chaos vs. Chess)
Players can predict linear movement for ~1-2 seconds. They cannot predict the 5th wall bounce 4 seconds out. If outcome relies on physics 5s in the future → Luck. If 1s → Skill. We need to find the "Event Horizon" where skill becomes luck.

### B. The Drift Factor
In Boomshine, the explosion lingers. Skill isn't just hitting a dot — it's placing a "net" where dots WILL BE. Design question: do we focus on prediction (leading the target) or manipulation (herding)?

### C. Density of Opportunity
In any 10-second window, how many "God Moments" exist? Too few = frustrating. Too many = trivial. Must measure how often high-potential clusters form naturally.

## Simulation Harness

### Tools Built
| File | Purpose |
|------|---------|
| `sim.js` | Headless simulation engine. Seeded PRNG, bot ladder, 6-metric dashboard. |
| `sweep.js` | Parallel parameter sweep via worker threads. Tests configs + mechanic variants. |
| `capture-screenshots.js` | Playwright visual verification (phone + desktop viewports). |

### Bot Ladder
1. **Random** — taps random positions. Establishes floor.
2. **Greedy** — grid-searches for position catching most dots. Fast, decent.
3. **Human-sim** — greedy + 200ms reaction delay + spatial noise. Realistic.
4. **Oracle** — searches positions AND timing (ghost simulation). Establishes ceiling.

### 6 Game-Feel Metrics

| Metric | What It Measures | Sweet Spot | Why |
|--------|-----------------|------------|-----|
| **SCR** (Skill Ceiling Ratio) | Oracle score / Random score | 2–5x | <2 = luck-based, >5 = frustrating |
| **DHR** (Drift Hit Ratio) | % of chain hits from dots drifting into active explosions | 30–55% | Measures whether "net placement" matters |
| **F3** (Opportunity Density) | % of frames with 3+ chainable dot clusters | 30–60% | Too low = frustrating, too high = trivial |
| **R50** (Input Sensitivity) | Pixels from optimal before losing 50% score | 30–80px | <30 = pixel-hunt, >80 = tap anywhere |
| **Chaos Decay** | Score retention after 200ms delay | 40–85% | <40 = twitch-only, >85 = static |
| **Chain Distribution** | Histogram of chain lengths | Long tail | Want occasional big chains, not uniform |

### Sweep Results (2026-02-20, phone viewport 390x844, R5)

**Best config: `EXPLOSION_RADIUS_PCT = 0.11`** — 4/5 metrics in sweet spot.

| Config | SCR | DHR | F3 | R50 | Chaos | Score |
|--------|-----|-----|-----|-----|-------|-------|
| r=0.11 (APPLIED) | 3.04 | 0.19 | 49% | 73px | 83% | 4/5 |
| r=0.11+spd=1.0+hold=750 | 3.1 | 0.21 | 52% | 68px | 79% | 4/5 |
| r=0.11+spd=0.8 | 2.9 | 0.18 | 45% | 77px | 85% | 4/5 |
| r=0.09 | 4.2 | 0.24 | 22% | 41px | 71% | 3/5 |
| r=0.13 (previous) | 2.1 | 0.15 | 72% | 98px | 95% | 1/5 |

**Stubborn metric: DHR** — drift hits consistently below 30% sweet spot across all configs. Dots don't drift into active explosions enough. Potential fixes: shorter hold duration, faster dots, gravity mechanics.

**Mechanic variants tested** (in simulation only, not in game):
- Gravity dots (pull neighbors) — didn't improve metrics alone
- Volatile dots (1.5x explosion radius) — slightly higher max chains
- Heavy dots (0.4x speed) — no clear benefit
- Combined gravity+volatile — promising but needs better base params

### Trust Level
The metrics are a **broken-detector and A/B comparator**, not a fun-detector. They narrow infinite search space to a region where fun is possible. Then human playtesting does the final 15%. A config with 0/5 metrics in sweet spot is almost certainly not fun. A config with 5/5 might still not be fun — but it's worth testing.

## Proposed Dot Types (Property Transmission)

From the Gemini conversation, refined by simulation data:

| Type | Visual | Behavior | Explosion Effect |
|------|--------|----------|-----------------|
| **Standard** | White/neutral | Normal movement | Normal explosion |
| **Heavy/Gravity** | Dark core, pulsing inward | Moves slowly | Pulls nearby dots toward center (gravity well) |
| **Volatile** | Bright, jittery | Moves fast | 1.5x explosion radius, shorter hold |
| **Prism** (future) | Jagged, bright white | Normal | Doubles expansion speed of triggered explosions |

**The key insight:** These aren't "elements" with scripted interactions. They're physics modifiers. Gravity changes velocity vectors. Volatile changes radius. Prism changes timing. The "combos" emerge from physics, not from code that checks for specific combinations.

**The "Smart Play" scenario:** Tap a Heavy dot → gravity explosion sucks 5 Volatile dots into center → Volatile dots detonate with 1.5x radius while clustered → screen-clearing supernova. Player feels like a genius. No special combo code needed.

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v1 | 2026-02-19 | Core mechanic, basic visuals |
| v2 | 2026-02-19 | Music, particles, screen shake, juice pass |
| v3 | 2026-02-19 | Dopamine edition: bigger radius, multipliers, celebrations |
| v4 | 2026-02-20 | Connection lines, radius rings, 3x louder music, slow-mo |
| v5 | 2026-02-20 | Fix tap vs dot visual confusion (ripple), soft auras, remove slow-mo, faster dots, escalating explosions |
| v5.1 | 2026-02-20 | Radius tuned to 0.11 via sweep data, build info in UI |

## Playtest Feedback Log

### v4 (wife playtest, phone)
1. Tap explosion looks identical to dot explosion — confusing, looks like 3 things exploded when only 2 did
2. Dashed radius rings invisible on real phone screen (alpha 0.06, sub-pixel stroke)
3. Slow-mo at 0.3x for 2+ seconds makes game feel sluggish, not dramatic
4. Dots too slow, clusters barely shift, every chain looks the same

### v5 (post-fix)
- "game seems fine" — issues resolved, no new complaints
- Radius change to 0.11 noticed as positive (tighter, more intentional)

## Next Steps (Pending)

1. **Fix DHR** — the one metric still out of sweet spot. Likely needs mechanics, not just parameter tuning.
2. **Implement dot types in actual game** — start with Standard + Gravity + Volatile (they exist in sim, not in game).
3. **Validate with simulation** — run sweep with dot types in game-equivalent config.
4. **Playtest dot types** — does property transmission feel intuitive without explanation?
5. **Structured spawning** — "Salad not Soup": spawn dot types in clusters/veins (gravity clusters, volatile veins) so players can read the board.

## Reference Docs
- `SPEC.md` — Original game spec (vision, rules, audio, visuals, progression)
- `research/validation.md` — Juice priorities, test suite, quality gates
- `research/prior-art.md` — Boomshine, Rez, Lumines, game feel research
- `research/tech-notes.md` — Canvas 2D, Web Audio, performance patterns
- `research/experience.md` — Player experience narrative, cross-agent critique
- `~/clawd/research/game-simulation-framework.md` — Monte Carlo methodology research
