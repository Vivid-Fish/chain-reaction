# Conditional Chaining Design Research

## Status: IN PROGRESS

Research into adding a conditional chaining rule (same-type propagation) to Chain Reaction, analyzed through Donella Meadows' leverage points framework.

---

## Meadows Framework Applied to Chain Reaction

The game's board structure problem (homogeneous dot field, chains "just happen," low skill ceiling for tap placement) is a systems problem. Meadows' 12 leverage points (in increasing effectiveness):

| Level | Leverage Point | Chain Reaction Equivalent |
|-------|---------------|--------------------------|
| 12 | Constants, parameters, numbers | Slider tuning (explosion radius, speed, cooldown) — **what the Lab currently does** |
| 11 | Buffer sizes | maxDots, dot pool size |
| 10 | Structure of stocks/flows | How dots enter, move through, and leave the system |
| 9 | Delays | Cooldown timing, chain resolution time |
| 8 | Negative feedback loops | No self-correction exists — difficulty ramps but doesn't respond to player |
| 7 | Positive feedback loops | Chain reactions ARE a positive loop (explosion → more explosions) |
| 6 | **Information flows** | **Player can't see where good chains are. Dots all look the same.** |
| 5 | **Rules of the system** | **"Any explosion catches any nearby dot" — no filtering, no selection** |
| 4 | **Self-organization** | **Dots could form emergent structure (clustering, flocking)** |
| 3 | Goals of the system | Survive / high score |
| 2 | Paradigm | "Dots are interchangeable particles in a physics sim" |
| 1 | Transcend paradigms | Stay flexible about what the game IS |

**Key insight**: The Lab operates at Level 12. The board structure problem requires intervention at Levels 4-6.

---

## Research Agent 1: Same-Type Chaining in Prior Art (COMPLETE)

### Puyo Puyo

**Core rule (minimum viable version):** 4+ cardinally-connected same-color Puyo clear simultaneously. After clearing, gravity pulls everything above downward. If new groups of 4+ same-color form after gravity resolves, they clear too. Repeat until no groups remain.

**Critical design insight: "Clearing is color-specific, but gravity is universal."** The cascade is color-blind at the gravity step — gravity moves ALL colors. The chain emerges from interleaving colors vertically so that removing one color's group causes a different color's group to connect via gravity.

**Color count and difficulty:**

| Colors | Effect | Use Case |
|--------|--------|----------|
| 3 | Very easy, accidental chains happen constantly | Casual, vs AI |
| **4** | **Competitive standard.** Fewer conflicts, forces improvisation | Tournament standard |
| 5 | Rarely used. Harder with no added strategic depth | Hard mode handicap |

Community consensus: 4 is the sweet spot. 3 = too easy (lucky chains). 5 = too hard (no benefit).

**What makes chains feel EARNED:**
1. **Setup time** — 10-30 seconds deliberately layering colors before triggering
2. **Trigger control** — player chooses when to fire by placing the final connecting piece
3. **Pattern recognition** — experts "see" chains in messy board states via memorized structural forms (stairs, sandwiches, transitions)
4. **Deterministic outcome** — same setup = same result, chains feel "solid"
5. **Proportional reward** — exponential garbage scaling (5-chain is game-ending, not just 5/3 of a 3-chain)

**How players learn to read the board:** Memorized structural patterns (forms), not on-the-fly computation:
- **Stairs (3-1 pattern)**: Beginner. 3 same-color stacked vertically, 4th as "key" in adjacent column.
- **Sandwich**: Color sandwiched between two groups of another color.
- **Transitions**: Vertical connectors between bottom chain and top chain.

After practice, pattern recognition becomes procedural memory: "suddenly you will notice that you're using patterns without really thinking about it."

**Sources:**
- [Puyo Nexus - Basic Rules](https://puyonexus.com/wiki/Basic_rules)
- [Puyo Nexus - Patterns 1: Stairs](https://puyonexus.com/wiki/Patterns_1:_Stairs)
- [Puyo Nexus - 3 vs 4 vs 5 Colors Discussion](https://puyonexus.com/forum/viewtopic.php?t=1876)
- [Puyo Nexus - List of Chaining Forms](https://puyonexus.com/wiki/List_of_Chaining_Forms)
- [Puyo Nexus - Introduction to Competitive Puyo](https://puyonexus.com/wiki/Introduction_to_Competitive_Puyo_Puyo)
- [Puyo Camp - Intro to Competitive Puyo](https://puyo-camp.jp/posts/57700)

### Puzzle Bobble / Bust-a-Move

**Connected group detection:** Two-pass flood fill on hex grid:
- Pass 1 (Color match): BFS from attached bubble through same-color hex-adjacent. 3+ cluster = remove.
- Pass 2 (Orphan detection): BFS from ceiling. Anything unreached = orphaned, falls.

**Orphan scoring (the key incentive):** Orphaned bubbles score exponentially (1=20, 2=40, 3=80... doubling). Creates massive incentive to shoot supporting bubbles rather than matching directly.

**Design lesson:** The color matching is the tool; the real game is understanding structural dependencies. Dual-layer design (explicit match rule + emergent structural consequence) creates depth from a simple rule.

**Sources:**
- [Puzzle Bobble - Wikipedia](https://en.wikipedia.org/wiki/Puzzle_Bobble)
- [Nick Maltbie - Bubble Shooter Report](https://nickmaltbie.com/bubble/report)
- [Bust-a-Move is NP-Complete (MIT)](https://erikdemaine.org/papers/BustAMove_JCDCGG2015full/paper.pdf)

### Ikaruga Polarity System

**How it works:** All enemies/bullets are black or white. Player toggles polarity with one button. Same-polarity bullets absorbed (charges super meter). Opposite-polarity bullets kill. Same-polarity shots do half damage; opposite do double. Scoring chain rewards killing 3 same-polarity enemies in sequence.

**Why binary (2 types) works:** Deliberately simplified from predecessor's 3-color system. Developer quote: decision was to "make things as simple as possible." Single binary choice "drives the whole game."

**Cognitive load:** Becomes procedural memory — "your fingers eventually do all of the thinking, allowing your brain to focus on other things happening on screen."

**Risk-reward dynamic:**
- Same polarity = safe (absorb) + slow (half damage) + charge super
- Opposite polarity = dangerous (vulnerable) + fast (double damage) + scoring chains

**Key finding:** 2 types is sufficient for deep gameplay when the type system intersects with multiple mechanics simultaneously (defense, offense, scoring, resource management).

**Sources:**
- [Shmuplations - Ikaruga Developer Interviews](https://shmuplations.com/ikaruga/)
- [Game Developer - Ikaruga: Practicing Faith](https://www.gamedeveloper.com/design/ikaruga-practicing-faith)
- [Ikaruga - Wikipedia](https://en.wikipedia.org/wiki/Ikaruga)

### Lumines

**Core mechanic:** 2x2 blocks fall, each cell one of exactly 2 colors. Form 2x2 same-color squares to mark them. A vertical "Timeline" sweeps left-to-right in sync with music. Marked squares cleared only when Timeline passes.

**Why 2 colors works:** Extreme constraint is deliberate — depth comes from sweep timing, not color complexity. The delayed clearing creates a window between "match formed" and "match cleared" where you can extend groups.

**The greed mechanic:** Tension between safe clearing and greedy extending (building larger groups before sweep arrives, risking stack overflow).

**Sources:**
- [Lumines - Wikipedia](https://en.wikipedia.org/wiki/Lumines)
- [WCCFTech - Interview with Tetsuya Mizuguchi](https://wccftech.com/interview-tetsuya-mizuguchi-synesthesia-tetris-effect-rez-lumines/)

### Cross-Game Design Findings

**How many types/colors is optimal?**

| Game | Types | Reason |
|------|-------|--------|
| Ikaruga | 2 | Binary sufficient when choice cascades through multiple mechanics |
| Lumines | 2 | Depth from temporal structure, not color variety |
| Puyo Puyo | 4 (competitive) | 3=too easy (accidental chains), 5=too hard, 4=improvisation sweet spot |
| Puzzle Bobble | 6-8 | Grid-based static matching tolerates more (deliberate aim) |
| Match-3 mobile | 5-7 | Pre-seeded boards guarantee solvability |

Pattern: Action games with time pressure → fewer types (2-4). Faster decision cycle → fewer types.

**Should partial chains be possible (70% same-type, 30% any-type)?**
NO. Every successful game uses deterministic rules. No game in the research uses probabilistic matching. Determinism is what makes chains feel "earned" — same setup = same result.

**Visual language for instant readability:**
1. Double-code everything (color + shape/motion) — colorblind accessibility
2. Shape processed pre-attentively (<200ms), not affected by color vision
3. Maximum 3-4 distinct visual types before overcoding
4. Chain Reaction already uses motion as secondary code (gravity=pulsing inward, volatile=jittery)

**Cold start problem (empty board, no clusters):**
- Puyo/Tetris: Start empty, opening theory develops. Cold start IS the game.
- Puzzle Bobble/Match-3: Pre-seeded board. Player has targets immediately.
- Chain Reaction: Already handled — dots spawn over time, early rounds have few dots.

**What makes chains feel EARNED vs LUCKY (synthesized):**
1. Setup time (sustained deliberate action before payoff)
2. Trigger control (player chooses WHEN to activate)
3. Visible setup (chain structure readable before triggering)
4. Deterministic outcome (same setup = same result)
5. Proportional reward (exponential payoff for longer chains)
6. Skill ceiling separation (beginner vs expert on same board → vastly different results)

---

## Research Agent 2: Physics Design (PARTIAL — agent stopped early)

### Boomshine Problem

Boomshine reviewer: "Luck is 94% of this game." Single-click mechanic places heavy reliance on dot positioning rather than player skill. Difficulty escalates from "laughably easy" to "formidable" without adding strategic depth.

**Boomshine Plus added 6 special dot types:**
- White = extra shot, Blue = permanent blocker, Orange = permanent exploder
- Green = must-catch, Purple = physics change, Red = must-avoid

**Result: 3 Steam reviews.** Adding complexity (Level 12 parameters) to a luck-dominant core (Level 5 rules unchanged) doesn't work.

**Icy Gifts (Boomshine variant):** Added upgrade path — spend points on radius, magnetic attraction. Level 12 interventions on a Level 5 problem.

### Roundguard (Peggle-like physics)

**Key finding on physics legibility:** "The entire game actually runs at about 90% real time physics" — slowing the simulation was "one of the more effective ways to dial in the right feeling." Side walls given extra horizontal bounce impulse to make it feel like what people expect.

**Legibility problem solved through:** Extra audio cues, screen damage effects, and "something more visually obvious" to distinguish between game elements. Players couldn't tell the difference between similar-looking game objects.

### Puyo Chain Planning (Color Density)

**Efficiency principle:** "To make good color decisions, you must first determine where certain colors will actually work." Players learn to prevent color conflicts that waste pieces and create inefficiencies.

**Pattern density:** Patterns are designed to chain across the board using minimum Puyo per pop. Efficiency comes from recognizing which positions accept which colors.

---

## Detailed Research (separate documents)

| Document | Topic | Status |
|----------|-------|--------|
| [visual-readability.md](visual-readability.md) | Geometry Wars, Vampire Survivors, pre-attentive processing, squint test, 7 concrete techniques | COMPLETE |
| [density-compensation.md](density-compensation.md) | 1/N density problem, Puyo gravity, Puzzle Bobble orphans, radius math, "universal first hit" novel mechanic | COMPLETE |
| [strategic-depth-casual-appeal.md](strategic-depth-casual-appeal.md) | Tetris Effect, Slay the Spire, Hades, Pokemon depth layering, emergent vs explicit, mobile patterns | COMPLETE |
| [readable-structure.md](readable-structure.md) | Prior art on board structure (Geometry Wars behaviors, Ikaruga polarity, Boids, wave spawning) | COMPLETE |

---

## Key Finding: "Universal First Hit, Type-Filtered Propagation"

No game in our research uses this mechanic. It appears genuinely novel. The concept:
- **Tap explosion (gen 0)**: catches ALL dots regardless of type
- **Cascade explosions (gen 1+)**: only catch same-type dots
- Off-type dots caught in initial blast "shatter" (score but don't propagate)

Math (2 types, 30 dots): reduces chain length by ~30-40% vs current. Not catastrophic.

This preserves the casual "tap and boom" feel while making chain LENGTH depend on type-aware positioning.

See [density-compensation.md](density-compensation.md) for full analysis.

---

## Key Finding: Bonus, Not Filter

From the casual-to-depth research, the strongest recommendation is:

> The same-type chaining rule should be a **bonus on top of universal chains**, not a filter.

Seven principles from the research:
1. **Bonus, not filter** (Pokemon): Universal chains still work. Same-type chains get +radius or +hold time.
2. **Discoverable, not taught** (Slay the Spire): No tutorial. Distinct feedback when it happens.
3. **Same input, different outcome** (Alto's Odyssey): No new gestures.
4. **Depth reveals through difficulty** (Ascension): At CALM, types don't matter. At IMPOSSIBLE, decisive.
5. **Celebrate discovery** (Hades): Unique visual/audio for same-type chains.
6. **Measure with simulation**: Target SCR increase from 3.52x to 4.0-4.5x.
7. **Preserve the chaos floor**: Bonus must be additive, NEVER subtractive.

See [strategic-depth-casual-appeal.md](strategic-depth-casual-appeal.md) for case studies.

---

## Key Finding: Visual Readability is Prerequisite

Before implementing any chaining rule, the visual system must be fixed:

1. **BUG**: Standard dot hue varies by Y-position (bottom of screen = same as volatile). Fix to constant hue.
2. Same-type neighbor glow (boost brightness when near same-type, not just any neighbor)
3. Type-specific motion patterns (gravity = smooth curves, volatile = jitter)
4. Connection lines between nearby same-type dots (Gestalt uniform connectedness)

See [visual-readability.md](visual-readability.md) for 7 prioritized techniques.

---

## Open Questions for Design

1. How many types? (2 vs 3 vs 4) — Research says 2 for action games with fast decisions (Ikaruga, Lumines)
2. "Universal first hit + type cascade" vs "bonus multiplier for same-type" vs "full type filter"?
3. How does same-type cohesion interact with same-type chaining? (clusters too easy = trivial?)
4. Should type distribution be equal (50/50) or weighted?
5. How do types interact with existing gravity/volatile dot mechanics?
6. Should types be purely visual (color families) or also affect physics?

## Next Steps

1. Fix visual readability bugs (standard dot hue, same-type neighbor glow)
2. Implement "universal first + type cascade" as a Lab toggle
3. Run simulation sweep comparing variants
4. Playtest on phone
