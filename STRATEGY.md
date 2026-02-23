# STRATEGY.md — Chain Reaction Game Design Strategy

Living document. Updated by autonomous iteration cycles.

---

## The Core Design Problem

Chain Reaction has an **inverse difficulty curve**. In Tetris, a full board is a crisis (less space, less time, mistakes compound). In Chain Reaction, a full board is an opportunity (more dots = bigger chains = easier to clear). The game has a negative feedback loop that self-stabilizes instead of escalating.

This means:
- A skilled player who understands the fill-then-clear cycle can survive indefinitely
- The greedy bot hovers at 60% density forever, never clearing the field, never dying
- "IMPOSSIBLE" isn't impossible — it's a steady-state management exercise
- The game lacks the positive feedback that creates tension and inevitable death

### Evidence

Greedy bot at IMPOSSIBLE (2.2 spawns/s, 1500ms cooldown):
- Survives 77% of 2-minute runs (should be ~0% if truly impossible)
- Never clears below 20 dots — hovers at 55-70% density
- Average chain length 7.1, but break-even is only 3.3 dots/tap
- Clearing capacity far exceeds spawn rate

A human player reported clearing the field in ~60 seconds, resetting the pressure cycle entirely. If you can clear to zero, you survive indefinitely.

### What Great Endless Games Do Differently

From analysis of Tetris, Geometry Wars, Rocket League, Balatro, Smash Bros, Vampire Survivors, Peggle:

**Five properties shared by timeless games:**

1. **Simple inputs, complex outcomes** — rules learnable in 5 minutes, mastery takes years
2. **Compounding mastery** — always a higher level of play to discover
3. **Meaningful decisions under pressure** — real tradeoffs, not obvious best moves
4. **Positive feedback loops** — mistakes create more pressure, not less
5. **"One more game" loop** — sessions short enough that losing invites retry

Chain Reaction currently has #1 (tap to chain) and partially #5. It's missing #3 (always tap biggest cluster, no tradeoff) and #4 (more dots = easier, not harder).

---

## What Makes a Decision "Meaningful"

From Sid Meier: "A game is a series of interesting decisions."

A decision is meaningful when:
1. **The outcome matters** — it affects game state in ways the player cares about
2. **The player can reason about options** — not blind guessing
3. **No dominant strategy exists** — if one option is always best, it's execution, not decision

**Current state:** The player's only real decision is where to tap, and the answer is always "near the biggest cluster." There's no tradeoff between options. There's no cost to big chains. There's no reason to tap small clusters strategically.

**What would create tradeoffs:**
- A cost or risk to big chains (poison dots, score penalties, explosion cooldown scaling)
- Different tap types (small precise vs large weak)
- Board regions that matter differently
- Resources spent per tap (limited energy, shrinking radius)
- Dots that become harder to catch over time (aging)

---

## The Measurement Platform

### Philosophy

> "If you have to ask me to play the game to validate your work, you have already failed."

The game must be fully playable by the AI agent. This means:
- A correct optimal player (oracle) that represents the theoretical ceiling
- Metrics that capture "fun" and "tension" without human feedback
- A/B testing infrastructure for comparing design iterations
- Failure detection: if a perfect player survives indefinitely, that's a design bug

### The Oracle Problem

The current oracle bot is broken:
- `waitMs` feature is incompatible with BotRunner's re-evaluation pattern
- The oracle was never actually tested (profile fallback bug sent it to humanSim)
- The DESIGN.md "proof of convergence" was validating the wrong bot
- Greedy (77% survival) outperforms oracle (40% survival) at IMPOSSIBLE

**Status:** Oracle needs to be rebuilt. See "Autonomous Work Plan" below.

### Quality Metric Framework

The framework defines a universal interface. Each design iteration provides game-specific implementations of these axes:

```
GameQuality {
  // Does pressure build over time regardless of skill?
  tension(trajectory) → TensionCurve

  // Do player choices matter? Are there real tradeoffs?
  agency(bot_decisions) → AgencyScore

  // Do games play out differently across seeds/strategies?
  variance(outcomes) → VarianceProfile

  // Does better play produce measurably better outcomes?
  skillCeiling(bot_ladder) → SkillProfile

  // Does the game eventually end? Is death inevitable?
  mortality(survival_distribution) → MortalityProfile
}
```

### Concrete Metrics (Prioritized)

**Tier 1 — Implement First:**

| Metric | Formula | What it tells you | Target |
|--------|---------|-------------------|--------|
| Survival time CV | `std(times) / mean(times)` | Drama variance | 0.3-0.6 |
| Mortality rate | % of games ending in death (any skill) | Is death inevitable? | >95% at all tiers |
| Density trend slope | Linear regression of density over time | Does pressure build? | Positive slope |
| Skill discrimination | `survival(expert) / survival(novice)` | Does skill matter? | 2x-5x |
| Break-even chain length | `spawnRate / tapRate` | Theoretical minimum skill | Should exceed avg chain |

**Tier 2 — Decision Quality:**

| Metric | Formula | What it tells you | Target |
|--------|---------|-------------------|--------|
| Decision entropy | Entropy of MCTS action distribution | Are choices meaningful? | 1.5-3.0 bits |
| Strategy diversity | Shannon entropy of winning strategies | Multiple viable approaches? | >2 effective strategies |
| Game Excitement Index | `(K/t) * SUM(\|p_i - p_{i-1}\|)` | Per-game drama | Sustained, not flat |
| Tension curve shape | Peak timing + final-third intensity | Good pacing? | Peaks late, builds |

**Tier 3 — Advanced:**

| Metric | Formula | What it tells you | Target |
|--------|---------|-------------------|--------|
| Mutual information I(M;E) | `H(actions) - H(actions\|outcomes)` | Do actions affect outcomes? | >0.5 |
| Learning curve slope | Win rate improvement per N episodes | Pattern depth | Sustained positive |
| Compression progress | Rate of model improvement for learning agent | Schmidhuber "interestingness" | Positive, not plateauing |

### The Key Insight

From the research: **a good game is one where a learning agent's performance improves steadily over time, plateauing neither too quickly nor too slowly, while the game state entropy follows a satisfying arc from moderate uncertainty to resolution.**

For Chain Reaction specifically: **the game is good when density trends upward over time regardless of player skill, creating inevitable death, but better players delay death significantly longer through meaningful decisions.**

---

## Design Hypotheses to Test

### H1: Dot Aging (Speed Increase Over Time)

Dots accelerate the longer they're alive. "Let it fill up" becomes dangerous because old dots move fast, break clusters, and are harder to catch.

- **Tradeoff created:** Clear early (small chains, frequent taps) vs wait for clusters (bigger chains, but faster dots)
- **Implementation:** `dot.speed *= (1 + age * agingRate)` per frame
- **Prediction:** Density trend slope becomes positive; survival time CV increases
- **Risk:** May make the game feel unfair if dots become uncatchable

### H2: Explosion Radius Decay

Each tap shrinks your explosion radius slightly. Radius regenerates slowly over time (or when NOT tapping). Creates a resource management layer.

- **Tradeoff created:** Tap now (smaller future radius) vs wait (radius recovers, but dots accumulate)
- **Implementation:** `radius *= (1 - decayPerTap); radius += regenRate * dt`
- **Prediction:** Forces strategic tap timing; creates meaningful cooldown beyond the fixed timer
- **Risk:** May feel punishing; tuning the regen rate is critical

### H3: Poison/Skull Dots

Some dots are harmful — catching them in a chain reduces your score, shrinks radius, or adds cooldown. Big indiscriminate chains become risky.

- **Tradeoff created:** Big chain (catches everything including poison) vs surgical small chain (avoids poison)
- **Implementation:** New dot type with negative chain effect
- **Prediction:** Decision entropy increases; greedy "tap biggest cluster" is no longer dominant
- **Risk:** Visual clutter; player frustration from unavoidable poison in dense areas

### H4: Combo Timer / Momentum System

Clearing dots starts a combo timer. Subsequent clears within the window get multiplied score. But: the timer is tight, forcing aggressive play that risks overflow.

- **Tradeoff created:** Play safe (low score, long survival) vs chase combos (high score, risky)
- **Implementation:** `comboTimer` that starts on chain, resets on expiry, multiplies next chain score
- **Prediction:** Creates the "one more tap" tension; score becomes meaningful vs survival
- **Risk:** May not affect the core survival problem (still no positive feedback on density)

### H5: Gravity Wells as Board Hazards

Instead of gravity dots being helpful (pulling dots together for easy chains), make gravity wells dangerous — they pull YOUR explosion radius smaller, or they're indestructible obstacles, or they absorb chain energy.

- **Tradeoff created:** Spatial navigation around hazards; some board positions are dangerous
- **Implementation:** Modify gravity dot behavior to create avoidance zones
- **Prediction:** Creates positional strategy; not all taps are equal based on proximity to wells
- **Risk:** May conflict with the existing gravity dot mechanic that players expect

### H6: Density-Scaled Spawn Rate (Positive Feedback)

Spawn rate increases as density increases. More dots → faster spawning → even more dots. This directly creates the positive feedback loop that's missing.

- **Tradeoff created:** Must clear aggressively to keep spawn rate manageable
- **Implementation:** `effectiveSpawnRate = baseRate * (1 + density * k)`
- **Prediction:** Density trend slope becomes strongly positive; creates the Tetris-like crisis curve
- **Risk:** May feel unfair; needs careful tuning so it's not instant death

---

## Prior Art Reference

### Mechanical Analysis of Reference Games

| Game | Core Tradeoff | Positive Feedback | Skill Ceiling Mechanism |
|------|---------------|-------------------|------------------------|
| Tetris | Speed vs clean board | Full board → less think time → more mistakes | PPS, T-spins, openers, downstacking |
| Geometry Wars | Geom collection vs survival | Multiplier grows but death resets it to 1x | Crowd management, bomb timing |
| Rocket League | Challenge ball vs rotate back | Lost possession → chase → more gaps | Aerials, flip resets, boost mgmt |
| Balatro | Spend now vs earn interest | Score grows polynomially; bad builds stall | Mental math, synergy recognition |
| Smash Bros | Aggression vs safety | Higher % = more knockback = closer to death | Spacing, DI reads, edgeguarding |
| Vampire Survivors | New weapon vs upgrade existing | Power scaling vs enemy scaling | Build optimization, kiting |
| Peggle | Risky angle vs safe shot | Fewer balls remaining → less margin | Trajectory prediction, bucket timing |

### Key Theoretical References

- **Schmidhuber's Compression Progress**: Fun = first derivative of compression. Game is interesting when a learning agent is actively improving its model.
- **Wojtowicz et al. (Nature Communications, 2022)**: Flow = mutual information between actions and outcomes. High I(M;E) = actions matter.
- **Game Excitement Index (sports analytics)**: `GEI = (K/t) * SUM(|p_i - p_{i-1}|)`. Measures drama per game.
- **Koster's Theory of Fun**: Games die when the player has fully absorbed the pattern space. Depth = time-to-strategy-convergence.
- **Zook et al. (FDG 2015)**: Vary MCTS computation budget to simulate different skill levels. Balance must hold across the skill spectrum.

### Juice vs Depth

Juice (screen shake, particles, sound) makes a game FEEL good. Depth (meaningful decisions, skill ceiling) makes a game BE good over hundreds of hours. Chain Reaction has decent juice. It needs depth. Do not add more juice to compensate for missing depth.

---

## Autonomous Work Plan

### Phase 0: Build the Measurement Platform
1. Fix the oracle bot (remove waitMs, use immediate evaluation with board-state heuristic)
2. Implement Tier 1 metrics as a `quality.js` module
3. Build `experiment.js` — runs a design variant through the full bot ladder + metrics pipeline
4. Validate: current game should score poorly on density trend slope and mortality rate

### Phase 1: Test Design Hypotheses
For each hypothesis (H1-H6):
1. Implement as a config-driven variant (no permanent code changes)
2. Run through `experiment.js`
3. Record results in this document
4. Compare metrics against baseline and against each other

### Phase 2: Combine Winners
Best-performing hypotheses get combined and tested together. Interaction effects may change individual results.

### Phase 3: Full Calibration
Re-run the difficulty tier calibration with the new mechanics. Re-derive spawn rates, cooldowns, and tier parameters from the (now-correct) oracle threshold.

### Phase 4: Browser Integration + Deploy
Apply winning design to game.js, test in browser, deploy.

---

## Experiment Log

*Results from autonomous iteration cycles go here.*

### Baseline (v16.2.0, current)

| Metric | Phone (390x844) | Desktop (1920x1080) |
|--------|-----------------|---------------------|
| Greedy survival @ IMPOSSIBLE | 77% (2min) | 80% (2min) |
| Oracle survival @ IMPOSSIBLE | 40% (broken) | 40% (broken) |
| Density trend slope | ~0 (flat equilibrium) | ~0 (flat equilibrium) |
| Mortality @ IMPOSSIBLE | ~23% | ~20% |
| Break-even chain | 3.3 | 3.3 |
| Avg chain (greedy) | 7.1 | 7.1 |
| Decision entropy | Not measured | Not measured |

**Assessment:** Game self-stabilizes. No positive feedback. Skilled player survives indefinitely. Oracle is broken. IMPOSSIBLE is mislabeled.

---

*Last updated: 2026-02-23*
