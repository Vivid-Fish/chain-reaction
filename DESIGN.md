# Chain Reaction — Design Evolution

## Status
- **Current version:** v13.3.0+ (2026-02-22)
- **Live at:** chain-reaction.vivid.fish
- **Coolify UUID:** ng4cwsc4csgcs84gssw0o0ww
- **Git:** github.com/Vivid-Fish/chain-reaction (main branch)
- **Versioning:** Conventional commits + semver auto-bump (commit-msg hook)

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
| `continuous-sim.js` | Continuous play simulation. Edge spawning, tap cooldown, overflow detection, 4 continuous bots. |
| `calibrate-continuous.js` | Binary-search calibration per bot for continuous difficulty tiers. |
| `difficulty-regression.js` | Regression test: 12 tests validating difficulty tier invariants (steady-state + margin + lower-bot). |
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

### v6 Results (dot types active, 2026-02-20)

With gravity + volatile types at R5:

| Metric | v5.1 (no types) | v6 (types) | Sweet Spot | Notes |
|--------|-----------------|------------|------------|-------|
| SCR | 3.04 | 3.60 | 2-5x | Better — type awareness raises skill ceiling |
| DHR | 0.19 | 0.21 | 0.30-0.55 | Slight improvement from gravity pull |
| F3 | 49% | 65% | 30-60% | Gravity creates sticky clusters (slightly high) |
| R50 | 73px | 80px | 30-80px | On the edge |
| Chaos | 83% | 90% | 40-85% | Gravity stabilizes clusters (too high) |

Key insight: Gravity dots help DHR but also make clusters too stable (high F3, high chaos retention). May need to reduce gravity pull force or add volatile dots as destabilizers. The tension between gravity (stabilize) and volatile (destabilize) is exactly the design intent.

### v8 Results (cascade momentum, 2026-02-20)

| Metric | v7 (no cascade) | v8 (cascade) | Sweet Spot | Notes |
|--------|-----------------|-------------|------------|-------|
| SCR | 3.61 | 3.68 | 2-5x | Slightly better |
| **DHR** | **0.21** | **0.32** | **0.30-0.55** | **FIXED — in sweet spot for first time** |
| F3 | 54% | 34% | 30-60% | Tighter base means fewer auto-clusters |
| R50 | 80px | 75px | 30-80px | More precise tap required |
| Chaos | 88% | 82% | 40-85% | Faster dots break up stale clusters |

**5/5 at R5 (500 runs).** First time all metrics in sweet spot simultaneously.

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
| v6 | 2026-02-20 | Dot types: gravity (purple, pulls), volatile (orange, 1.5x radius). Property transmission. |
| v7 | 2026-02-20 | Setback progression (-2 rounds), mercy (+5%/fail), spectator bot mode (?watch or W key), replay recording (R key). |
| v7.1 | 2026-02-20 | Mobile touch UI: pill buttons for bot/replay (no more keyboard-only). |
| v8 | 2026-02-20 | **Cascade Momentum**: tighter base radius (0.10), +8% radius/gen, +200ms hold/gen, faster dots (0.7-1.4). First 5/5 metric config. DHR fixed: 0.21→0.31. |
| v8.1 | 2026-02-20 | **Cascade Gen Cap**: cap=4 limits unchecked positive feedback. Fixes R14+ field wipes (47%→5% wipe rate). Meadows-inspired progression test. |
| v9 | 2026-02-20 | **Musical Audio + Supernova + Near-Miss**: Beat quantization (16th-note grid, Rez technique). Multi-Tap Supernova (3 clears → 3-tap round, low-pass filter sweep, golden glow). Near-miss feedback text ("X more dots — So close!"). |

## Playtest Feedback Log

### v4 (wife playtest, phone)
1. Tap explosion looks identical to dot explosion — confusing, looks like 3 things exploded when only 2 did
2. Dashed radius rings invisible on real phone screen (alpha 0.06, sub-pixel stroke)
3. Slow-mo at 0.3x for 2+ seconds makes game feel sluggish, not dramatic
4. Dots too slow, clusters barely shift, every chain looks the same

### v5 (post-fix)
- "game seems fine" — issues resolved, no new complaints
- Radius change to 0.11 noticed as positive (tighter, more intentional)

## v8 Cascade Momentum — Experiment Results

Tested 4 candidate mechanics against baseline (30+ experiments, 300-500 runs each):

| Mechanic | DHR Impact | Why |
|----------|-----------|-----|
| Afterglow (lingering embers) | 0.21 (no change) | Dots don't pass through ember zones |
| Resonance (excited near-miss dots) | 0.23 (+10%) | Faster dots help slightly, but not enough |
| Elastic collisions (dot bouncing) | 0.21 (no change) | Bouncing doesn't direct dots into explosions |
| **Cascade momentum** | **0.31 (+48%)** | Bigger + longer late-chain explosions catch drifters |

Key insight: **longer hold time per generation > bigger radius per generation**. Bigger radius inflates chaos and R50 (too forgiving). Longer hold gives dots more TIME to drift in without covering the whole screen.

Winning config found via focused sweep of cascade variants:
- Base radius: 0.10 (was 0.11) — tighter tap requires precision
- +8% radius per chain generation — visual crescendo
- +200ms hold per chain generation — late explosions linger, catching drifters
- Faster dots (0.7-1.4 base) — dynamic board, more drift opportunities
- No artificial pull forces — pure physics scaling

Cascade scaling on phone viewport (base ~40px):
| Gen | Radius | Hold Time | Feel |
|-----|--------|-----------|------|
| 0 (tap) | 40px | 1.0s | Tight, precise |
| 2 | 46px | 1.4s | Noticeably bigger |
| 4 | 53px | 1.8s | Dramatic |
| 6 | 59px (+48%) | 2.2s | Sustained sweep |

## v8.1 Cascade Gen Cap — Meadows Framework

### The Problem (Detected by Playtest, Not Metrics)
Bot watched to R14 was wiping the entire field. Our metrics only tested R5 — a **Meadows Level 6 failure** (missing information flow). We had "the meter in the basement" — measuring the system at one point while it degraded at another.

### Diagnosis via Leverage Points (Donella Meadows, 1999)
- **Level 12 (parameters)**: What we'd been doing — tuning radius, speed, hold time. Lowest leverage.
- **Level 7 (positive feedback loops)**: Cascade momentum IS an unchecked positive feedback loop. At R14 (45 dots), a deep chain hits gen 8-10+, growing radius to 80px+ and holding 3s+. It catches everything.
- **Level 8 (negative feedback loops)**: What we needed — a cap that limits cascade growth. The system self-corrects.
- **Level 6 (information flows)**: The progression test — "the meter in the front hall." Testing R1-R15 instead of just R5.

### The Fix: CASCADE_GEN_CAP = 4
Cascade scaling stops growing after generation 4. Gen-5+ explosions are the same size as gen-4 (radius ~53px, hold ~1.8s on phone). The crescendo still exists and feels dramatic, but it has a ceiling.

### Progression Test Results (300 runs/round, greedy bot, phone viewport)

| Config | AvgClear | AvgWipe | AvgDHR | Problems | WipeR10+ |
|--------|----------|---------|--------|----------|----------|
| v8 (no cap) | 60.6% | 20.1% | 0.347 | 3 | 46.2% |
| **v8.1 (cap=4)** | **58.3%** | **1.8%** | **0.361** | **1** | **4.6%** |

The cap *improves* DHR (0.347→0.361) because capped explosions don't trivially catch everything — dots still need to drift in. Single problem remaining: R1 trivial (98% clear, 12 dots target 1 — acceptable warm-up).

### Tools Built
| File | Purpose |
|------|---------|
| `progression-test.js` | Tests R1-R15 with greedy bot. Measures per-round clear rate, wipe rate, chain/target ratio, DHR. Flags trivial/wipe/wall rounds. |

### Lesson
Don't test one slice of a dynamic system and assume the whole system works. Progression creates runaway positive feedback — must test the full curve. The simulation harness was necessary but insufficient; the progression test is the real validator.

## Gap Analysis: Chain Reaction vs. Paid Games (2026-02-20)

### Reference Games
Tetris Effect, Doodle Jump, Rocket League, Boomshine (+ Boomshine Plus), Fruit Ninja, Cut the Rope, 2048, Flappy Bird, Threes, Peggle, Geometry Wars, Resogun, Bayonetta, Bejeweled Blitz, Super Meat Boy, Celeste.

### Where We Stand
- **Skill ceiling**: SCR 3.52x (oracle/random). We are NOT Boomshine (luck-dominant). Cascade momentum + dot types create genuine skill expression.
- **Determinism**: Seeded PRNG, pure physics. Player can develop intuition (Rocket League principle).
- **Session length**: 30s-2min per round. Natural pick-up-put-down pattern (Doodle Jump principle).

### The 8 Gaps (Ranked by Leverage)

| # | Gap | Leverage | Status |
|---|-----|----------|--------|
| 1 | **Musical audio** — chains should BE the music, not trigger sound effects | Very High | Current: pentatonic ascending notes. Need: beat quantization, stem layering, position-to-pitch, chain=melodic phrase |
| 2 | **Session arc** — emotional peaks and valleys across rounds | Very High | Current: flat. Need: audio layers build across rounds, visual environment shifts, reward mechanic for peak moments |
| 3 | **Near-miss feedback** — show WHY you failed and HOW CLOSE you were | Medium | Current: none. Need: ghost tap position, "47/50 — so close!", slow-mo on chain break point |
| 4 | **Skill ceiling visibility** — show what expert play looks like | Medium | Current: score only. Need: optimal tap ghost, personal best chain display, "best possible: 14, you got: 7" |
| 5 | **Meta-progression** — reason to return tomorrow | High | Current: nothing persists. Need: local storage scores, daily challenge (fixed seed), unlockable dot types, collection tracking |
| 6 | **Zone/Supernova mechanic** — break your own rules as reward | High | **Simulated — Multi-Tap wins** (see below) |
| 7 | **Social currency** — shareable moments | Low-Med | Current: none. Need: share button after big chains, leaderboards |
| 8 | **Determinism** (protect) | Critical | Already good. Don't add randomness to explosions. |

### Key Insights from Research

**Tetris Effect**: Player actions should produce *music*, not sound effects. Every rotation/drop triggers a note quantized to the beat, harmonically locked to the current key. The player unconsciously composes a melody. The Zone mechanic (gravity stops, lines stack) is earned through line clears and breaks the fundamental rules of Tetris.

**Every Extend Extra** (closest prior art to chain-reaction music): Ascending pitch per chain link. Beat-synchronized detonation (bigger explosion if you tap on the beat). Chains literally build a melodic arpeggio.

**Doodle Jump**: <1 second restart. Failure feels correctable because you saw the platform you missed. Continuous implicit difficulty ramp — no level breaks.

**Rocket League**: Same tools at every skill level. Emergent complexity from simple rules interacting multiplicatively. 120Hz deterministic physics means every outcome feels like your fault or your achievement.

**Boomshine Plus (cautionary tale)**: Miller added 6 dot types, 105 levels, hard mode to the original. 3 Steam reviews. Adding content to a luck-dominant core doesn't work. The depth must come from the mechanic itself, not layers bolted on.

**Peggle Extreme Fever**: Disproportionate celebration. Slow-mo zoom on final peg. Ode to Joy. The response is wildly out of proportion to the input — that gap creates the feeling of grandeur.

**Near-miss psychology**: Near-misses activate the same reward systems as actual wins. The effect is strongest when (a) the player has agency, (b) feedback is immediate, and (c) the near-miss is visually obvious. Frame failure as achievement: "47/50!" not "you failed by 3."

### The Boomshine Test
> "When a skilled player and a new player each play 10 rounds, does the skilled player reliably win?"
> - Boomshine: barely. Our game: **yes** (SCR 3.52x). This is the foundation everything else builds on.

## Supernova Mechanic — Experiment Results (2026-02-20)

### Design Requirements (from prior art)
1. **Earned, not given** (Bayonetta Witch Time: frame-perfect dodge triggers it)
2. **Rule inversion, not "more power"** (Tetris Effect Zone: gravity stops — changes HOW the game works)
3. **Preserved agency** (Peggle scoring holes: player still makes decisions during celebration)
4. **Dramatic contrast** (Bejeweled Blazing Speed: AoE mode feels fundamentally different)
5. **Audio submersion** (Tetris Effect: low-pass filter sweep on activation, music shifts)

### Variants Tested (300 runs × 3 rounds each, greedy bot, phone viewport)

| Variant | Description | R5 Δclear | R8 Δclear | R12 Δclear | R12 wipe | Score |
|---------|-------------|-----------|-----------|------------|----------|-------|
| **Multi-Tap (3 taps)** | Break the one-tap rule | **+60%** | **+57%** | **+40%** | **18%** | **+11** |
| Time-Freeze | Dots freeze (oracle mode) | +38% | +22% | -5% | 0% | +5 |
| Volatile Burst | All dots become volatile | +22% | +22% | +27% | 35% | +5 |
| Mega-Radius (2x) | Double explosion size | +17% | +1% | -2% | 3% | +2 |
| Gravity Well | Pull dots inward 500ms | +11% | +11% | +5% | 4% | +2 |
| Chain-Starter (3 free) | Auto-catch 3 nearest | +19% | +2% | +3% | 4% | +2 |
| Uncapped Cascade | Remove gen cap | +0% | +1% | +3% | 45% | -1 |

### Winner: Multi-Tap (+11)

Multi-Tap breaks the ONE-TAP RULE — the fundamental constraint of the game. This is exactly the Tetris Effect Zone pattern: the super mode breaks the core rule (gravity → no gravity; one tap → three taps).

**Why it works:**
- **Rule inversion**: The entire game is designed around one tap. Three taps is a fundamentally different experience.
- **Agency preserved**: 3 taps = 3 decisions. Player must choose where to place each. A smart player chains them (tap 1 catches dots near tap 2's zone). A naive player just taps randomly and still gets a boost.
- **Wipe rate controlled**: 18% at R12 (not trivially easy — player still works for it).
- **Dramatic at all difficulties**: +60% at R5 (easy rounds become guaranteed), +40% at R12 (hard rounds become beatable).

**Why others lost:**
- Time-Freeze: *Degrades* at R12 (-5%). Frozen dots cluster less than moving ones. Also 292 seconds per oracle search — fun concept but static boards are less interesting.
- Volatile Burst: 35% wipe at R12. "Watch everything explode" — no agency.
- Uncapped Cascade: 45% wipe at R12. Confirms our cascade cap was correct.
- Mega-Radius/Gravity Well/Chain-Starter: Marginal improvements. Just "more power," not rule inversion.

### Proposed Implementation
- **Charge**: Meter fills through consecutive round clears (3 clears = full charge, or 2 clears with high chain/target ratio)
- **Activation**: Tap the meter icon (preserved agency — player chooses when)
- **Effect**: 3 taps instead of 1 for one round. Each tap creates a normal explosion + cascade chain.
- **Audio shift**: Low-pass filter sweep on activation (Tetris Effect pattern). New musical layer during Multi-Tap round. Filter lifts when round ends.
- **Visual shift**: Color palette shifts (warmer/brighter). Particle density increases. Tap counter shows "2 taps remaining."
- **After Supernova**: Meter resets. Normal play resumes. The contrast between Supernova and normal makes normal feel tighter and more focused.

### Tools Built
| File | Purpose |
|------|---------|
| `supernova-experiment.js` | Tests 7 Supernova variants at R5/R8/R12. Measures contrast (clear rate delta, wipe rate). Scores variants on dramatic-but-earned scale. |

## Oracle Bot v2 — Chain-Resolving 2-Ply Lookahead (2026-02-22)

### The Problem
The original oracle bot was "greedy with 600ms lookahead" — it counted dots within initial explosion radius at 4 time offsets and picked the best. It completely ignored:
- Cascade momentum (later-gen explosions are bigger + longer)
- Chain resolution (the ACTUAL dots caught, not just initial radius)
- Density-aware scoring (should clear more aggressively when near overflow)
- Multi-tap planning (what's the best follow-up after cooldown?)

A skilled human player survived 4 minutes on "Impossible" tier — a tier calibrated against this weak oracle.

### The Fix
New oracle bot in `continuous-sim.js`:
1. **12 time offsets** (0-1100ms in 100ms steps, not 4 × 200ms)
2. **30x30 grid + refinement + dot-position candidates** (not just 20x20 grid)
3. **Full chain resolution** — clones the sim, taps, resolves cascade, counts ACTUAL caught dots
4. **Density pressure bonus** — `score = caught + caught * max(0, density - 0.5) * 2`
5. **2-ply lookahead** — for top 3 candidates, simulates: tap → resolve → advance by cooldown → find best 2nd tap → sum both chains

### Results
Recalibrated all tiers. Spawn rate thresholds shifted significantly:

| Tier | Old Oracle Rate | New Oracle Rate | Change |
|------|----------------|----------------|--------|
| CALM (random) | 0.50/s | 0.72/s | +44% |
| FLOW (humanSim) | 3.20/s | 4.01/s | +25% |
| SURGE (greedy) | 5.10/s | 6.40/s | +25% |
| TRANSCENDENCE (oracle) | 3.20/s | 3.33/s | +4% |
| IMPOSSIBLE (oracle) | 2.00/s | 2.12/s | +6% |

Browser rates set at ~90% of bot threshold for human challenge.

### If This Still Isn't Enough

The new oracle is 2-ply with grid search — significantly better than v1 but NOT theoretically optimal. If a skilled human still finds it too easy, the next steps (in order of increasing complexity and diminishing returns):

1. **N-ply lookahead (N=3-4)** — chain 3-4 tap decisions forward. Diminishing returns: the board changes so much between taps (spawning, bouncing) that ply-3+ predictions are noisy. Estimated improvement: ~10-15%.

2. **Monte Carlo rollouts** — for each candidate tap, simulate 50-100 random futures (different spawn positions/timing) and average the outcomes. This handles spawn uncertainty and gives more robust evaluation. Estimated improvement: ~15-20%. Computational cost: 50-100x current.

3. **Spawn-aware chain resolution** — current oracle ignores new dots spawning during chain resolution. In the real game, dots spawn continuously during the 1-3 seconds a chain takes to resolve. Adding spawning to the clone sim during resolution would make evaluation more accurate. Estimated improvement: ~5-10%.

4. **MCTS (Monte Carlo Tree Search)** — full game tree search with random playouts. Each node is a tap decision. This is how AlphaGo works, adapted for continuous action space. Would need discretization of tap positions and timing. This would be near-optimal but very expensive (minutes per decision in headless sim). Only worth it for definitive calibration runs, not real-time play.

5. **Manual empirical tuning** — ultimately, the sim is a proxy for human play. If the gap between sim-optimal and human-optimal persists, just adjust rates based on playtest data. The simulation narrows the search space from infinite to a small region; human testing does the final 15%.

### Key Insight
The skill gap between bots was narrower than expected because cascade momentum is an equalizer — even random taps that hit 2-3 dots can cascade to 10+ via the growing-radius mechanic. The bot hierarchy still holds (random < humanSim < greedy < oracle) but the gaps are smaller than in rounds mode where there's no cascade.

## Next Steps (Pending)

1. **Structured spawning** — "Salad not Soup": dot types in clusters/veins, not randomly mixed.
2. **Daily challenge** — fixed seed, everyone plays the same round, compare scores.
3. **Musical audio for rounds mode** — beat quantization, position-to-pitch, stem layering.
4. **Meta-persistence** — localStorage high scores, personal bests per tier.
5. **Clean code pass** — eliminate duplication between modes in index.html.

## Reference Docs
- `SPEC.md` — Original game spec (vision, rules, audio, visuals, progression)
- `research/validation.md` — Juice priorities, test suite, quality gates
- `research/prior-art.md` — Boomshine, Rez, Lumines, game feel research
- `research/tech-notes.md` — Canvas 2D, Web Audio, performance patterns
- `research/experience.md` — Player experience narrative, cross-agent critique
- `research/progression-loss.md` — Loss aversion, restart mechanics, session arc research
- `research/gap-analysis.md` — **Full gap analysis: Chain Reaction vs paid games**
- `research/supernova-prior-art.md` — **Zone/flow-state mechanics across 15+ games**
- `research/generative-audio.md` — **Rez, Lumines, Every Extend, Patatap, Electroplankton audio architecture**
- `research/near-miss-feedback.md` — **Post-failure UX: Peggle, Angry Birds, Super Meat Boy, Celeste**
- `research/leverage-points-meadows.pdf` — Donella Meadows, Places to Intervene in a System
- `~/clawd/research/game-simulation-framework.md` — Monte Carlo methodology research
- `SPEC.md` — Original game spec (vision, rules, audio, visuals, progression)
- `research/validation.md` — Juice priorities, test suite, quality gates
- `research/prior-art.md` — Boomshine, Rez, Lumines, game feel research
- `research/tech-notes.md` — Canvas 2D, Web Audio, performance patterns
- `research/experience.md` — Player experience narrative, cross-agent critique
- `research/progression-loss.md` — **Loss aversion, restart mechanics, session arc research + brainstormed solutions**
- `~/clawd/research/game-simulation-framework.md` — Monte Carlo methodology research
