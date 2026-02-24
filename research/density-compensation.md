# The 1/N Density Problem: Compensating for Type-Filtered Chains

## Research Date: 2026-02-23

When you add N types and require same-type matching, effective target density drops to 1/N. This document analyzes compensation mechanisms from prior art.

---

## The Problem, Precisely

With 30 dots on screen (phone viewport 329,160 px²), explosion radius 43px:

| Types | Valid targets | Expected in radius | Chain viability |
|-------|-------------|-------------------|----------------|
| 1 (current) | 30 | ~2.3 | Chains work |
| 2 | 15 | ~1.15 | Marginal |
| 3 | 10 | ~0.77 | Chains die immediately |

**Critical threshold:** Expected valid targets per explosion must stay above ~1.5 for chains to continue meaningfully. Below 1.0, chains are effectively impossible.

---

## 1. Puyo Puyo: "Gravity Is Universal, Matching Is Local"

### The Mechanism
4+ same-color Puyo connected orthogonally clear. When they disappear, ALL Puyo above — of every color — fall due to gravity. The type filter applies only to matching; physics consequences are universal.

### How a Stairs chain works:
1. Player triggers 4-match of Red at bottom
2. Gravity drops Blue, Green, Yellow above the cleared Red
3. Fallen Blue Puyo form new 4-group (pre-positioned for this)
4. Blue clears, gravity drops more pieces
5. Chain continues across colors via gravity

### The Math
With 4 colors, type density is 1/4. Yet competitive chains average 10+ links. Compensation:
1. **Universal physics** (gravity affects all colors): multiplies adjacency opportunities by column height
2. **Pre-positioning** (player skill): board is NOT random — engineered over 30-60 seconds
3. **Grid constraints**: positions are discrete, making adjacency far more likely than continuous 2D

### Key insight
**100% of chain links after the first come from gravity-induced secondary matches.** Player skill is in pre-positioning pieces so gravity creates the next match. First match is the only one directly constructed.

### Relevance to Chain Reaction
Dots are in continuous 2D space, not a grid. No "column above" to cascade. But the principle translates: **make physics consequences of a type-specific match universal.** When type-A dots explode, the gravity pull/momentum affects ALL dots.

Sources:
- [Puyo Nexus: Stairs Pattern](https://puyonexus.com/wiki/Patterns_1:_Stairs)
- [Puyo Nexus: Competitive Introduction](https://puyonexus.com/wiki/Introduction_to_Competitive_Puyo_Puyo)
- [Puyo Nexus: Chaining Forms](https://puyonexus.com/wiki/List_of_Chaining_Forms)

---

## 2. Puzzle Bobble: Exponential Orphan Scoring

### The Mechanism
Match 3+ same-color bubbles → pop. Any bubbles structurally dependent on the popped group (connected to ceiling only through it) become orphans and fall. **Orphan drops are color-blind.**

### Scoring incentive (exponential):
| Orphans | Score |
|---------|-------|
| 1 | 20 |
| 2 | 40 |
| 3 | 80 |
| 5 | 320 |
| 10 | 10,240 |
| 17+ | 1,310,720 |

Direct pops = 10 pts each. Orphaning 5 bubbles = 10.7x the direct match score.

### Design lesson
**Type filter determines WHAT you match. CONSEQUENCES affect ALL types.** Color matching is the tool; structural exploitation is the real game. A single 3-match of red can eliminate 15+ mixed-color bubbles through structural collapse.

Sources:
- [Puzzle Bobble Scoring](https://gamicus.fandom.com/wiki/Puzzle_Bobble)
- [Bust-a-Move is NP-Complete (MIT)](https://erikdemaine.org/papers/BustAMove_JCDCGG2015full/paper.pdf)

---

## 3. Match-3: Type-Blind Refill After Type-Specific Clear

### The Mechanism
Clear same-color group → gravity drops → random-color pieces fill from top → check for new matches → loop.

The refill step is type-blind (random colors). Each clear removes type-specific group but replaces with random pieces, creating nonzero cascade probability.

### The Math (simplified)
With C=6 colors, k=5 new pieces entering:
- P(cascade from new pieces alone) ≈ 8%
- In practice, cascades occur on ~15-25% of moves (2D grid + existing piece adjacencies)

### Relevance to Chain Reaction
No grid or refill. But continuous mode already has edge spawning. If type-filtered chains reduce chain length, spawn rate is the equivalent of match-3 refill. Don't spawn near explosions (too artificial) — existing spawn rate is the natural "refill."

---

## 4. Same-Type Attraction (Clustering)

### The Math
Random distribution: same-type neighbors in radius R ∝ total_dots/N.
Clustered distribution with factor f: same-type density in cluster cores = f × D/N.
To restore original density: need f = N. (2 types → 2x concentration; 3 types → 3x)

### The Design Tension
Clustering makes game more predictable. v6 sim data showed: gravity dots increased F3 to 65% (above sweet spot) and Chaos Decay to 90% (too stable). Clusters that form and stay = removed temporal dimension.

### Fix: Weak attraction + noise
- Dots drift toward same-type but base velocity + wall bounces constantly disrupt
- Goal: statistical clustering (more same-type neighbors than random) without visual clumping
- Alternative: **attraction only activates near explosions** — shockwave causes brief same-type acceleration, creating momentary density windows

### Already implemented
`cohesionForce` parameter exists in game-core.js (line 351). Range and force scale with spatialScale.

---

## 5. Radius Scaling

### The Formula
To maintain same expected targets: R_new = R_old × sqrt(N)

| Types | Radius multiplier | New radius (phone) | As % of screen |
|-------|------------------|-------------------|----------------|
| 1 | 1.00x | 43px | 11.0% |
| 2 | 1.41x | 61px | 15.5% |
| 3 | 1.73x | 74px | 19.0% |

### Why pure radius scaling fails
Sweep data shows r=0.13 (previous) scored 1/5 metrics. r=0.11 (current) scores 4/5. Going to 0.155 is WORSE than going back to 0.13. Bigger explosions destroy skill expression — SCR collapses because random taps catch enough.

### When it works
- **Cascade-specific scaling** (already have +8% per generation): doesn't help gen 0 but helps propagation
- **Per-type radius**: volatile already does 1.5x. Different types = different effective densities
- **Conditional scaling**: radius grows only when hitting same-type (resonance mechanic)

---

## 6. "Universal First Hit, Type-Filtered Propagation" (NOVEL)

### The Concept
- **Tap explosion** (gen 0): catches ALL dots regardless of type — big satisfying boom
- **Cascade explosions** (gen 1+): each only catches **same-type** dots
- Chain splits into N parallel type-specific sub-chains
- Chain length depends on how well each type is clustered near initial blast

### Closest precedents
- **Peggle**: Ball bounces off ALL pegs (universal physics) but only orange pegs count toward objective (type-specific goals). Blue pegs are the physics medium.
- **Columns (Sega 1990)**: Same-color groups of 3+ clear, then ALL colors cascade via gravity. Diagonal matching creates more novel adjacencies.

**No game uses exactly "universal initial explosion + type-filtered cascade."** This appears genuinely novel.

### The Math (2 types, 30 dots)
- Initial tap (universal): catches 3-6 dots (unchanged from current)
- ~50% type A, ~50% type B
- Type A cascade: 1.5-3 dots, each spawns type-filtered explosion
- Each cascade explosion catches ~0.6-1.0 additional type A
- Total chain: 3-6 initial + 2-6 cascade = **5-12 total**
- Compare without types: 7-16 total
- **Reduction: ~30-40%** — significant but not catastrophic

### Advantages
1. Preserves initial boom (most satisfying moment unchanged)
2. Type skill = positioning (chain LENGTH depends on cluster quality)
3. Graceful degradation (even with 3+ types, initial catch still works)

### Disadvantages
1. Visual confusion: initial catches all colors, cascades don't. Why do some chain further?
2. Strategic depth only in chain LENGTH, not whether chain starts
3. Cascade gen cap (4) reached sooner with fewer catches

### Mitigating visual confusion
Off-type dots caught in initial explosion **"shatter" without spawning cascade explosions.** They count for score but don't propagate. Visually obvious: colored explosions spread to own color, off-color dots just pop.

---

## Recommended Approach (from research)

### Tier 1: Best Fit
**"Universal first hit + type-filtered propagation" + weak same-type cohesion**
- Preserves core tap feel
- Adds chain-length strategy
- Both are pure physics modifiers (no scripted rules)
- Testable via simulation

### Tier 2: Complementary
- Cascade radius scaling (+8%/gen, already exists)
- Exponential scoring for same-type chains (incentive compensation)

### Tier 3: Use Sparingly
- Static radius increase (destroys tuned metrics)
- Spawn-near-explosion refill (too artificial)

### What to Simulate First
1. Baseline: current (no type filtering)
2. Full type filter: cascade only catches same-type
3. Universal first + type cascade: gen 0 catches all, gen 1+ type-filtered
4. Universal first + type cascade + cohesion: add cohesion 0.01-0.03

Measure 6 metrics × 500 runs × R5 and R10.

Sources:
- [Peggle Scoring System](https://peggle.fandom.com/wiki/Scoring_System)
- [Peggle Wikipedia](https://en.wikipedia.org/wiki/Peggle)
- [Why Peggle Works](https://kalebnek.medium.com/why-peggle-works-a-game-analysis-7899d1716bdf)
- [Columns Wikipedia](https://en.wikipedia.org/wiki/Columns_(video_game))
- [Match-3 NP-Hard Paper](https://ar5iv.labs.arxiv.org/html/1403.5830)
- [Match-3 Design Analysis](https://snoukdesignnotes.blog/2018/06/21/design-analysis-match-3/)
- [Boomshine Plus (Steam)](https://store.steampowered.com/app/2139030)
