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

### H6: Density-Scaled Spawn Rate (WINNER)

`effectiveSpawnRate = baseRate * (1 + density * k)`

| k | IMPOSSIBLE mortality | Density slope | Escalation | Skill disc | Flags |
|---|---|---|---|---|---|
| 0 (baseline) | 20% | 4.5 | 25.6% | 3.85x | 1 (LOW_MORTALITY) |
| 0.3 | 80% (FLOW) | 10.5 | 40.5% | 2.48x | 1 |
| **0.4** | **95% (FLOW), 90% (IMP)** | **14-16** | **49-52%** | **1.8-2.3x** | **0** |
| 0.5 | 100% (all) | 15-19 | 52-53% | 1.7-2.3x | 0 |
| 1.0 | 100% | 29-32 | 66-69% | 1.2-1.6x | 1 |

**k=0.4 is the sweet spot.** Zero quality flags at FLOW and IMPOSSIBLE. Mortality jumps from 20% to 90-95%. Density trend slope triples. Skill discrimination preserved at 1.8-2.3x.

SURGE (5.8/s base rate, 2500ms cooldown) is resistant — still 55% mortality at k=0.4 because the enormous chain lengths (41 avg) overcome the positive feedback. SURGE needs a separate fix (likely reduce maxDots or cooldown).

### H1: Dot Aging (FAILED)

`dot.speed *= (1 + agingRate * age/1000)` per step.

All values tested (0.05-1.0) made the game EASIER, not harder. Mortality dropped to 0%. Fast-moving old dots spread out and don't cluster, preventing overflow. The mechanism that makes chains harder (fast dots) is the same mechanism that prevents overflow (dispersed dots).

**Key insight:** The inverse difficulty curve is robust against speed changes. Faster dots = less clustering = lower density = easier survival. Speed is not the right lever.

### H2: Radius Decay Per Tap (PARTIAL)

`radius *= (1 - decayPerTap)` on each tap, regenerates over time.

| Decay | IMPOSSIBLE mortality | Density slope | Skill disc | BE ratio | Flags |
|---|---|---|---|---|---|
| 0.03 | 100% | 23.5 | 1.48x | 1.14x | 1 |
| 0.05 | 100% | 29.1 | 1.33x | 0.87x | 1 |
| 0.08 | 100% | 32.2 | 1.24x | 0.74x | 2 |

Creates mortality but destroys skill discrimination. Everyone dies regardless of skill because radius shrinks to the point where chains can't propagate. Too blunt — the mechanic removes agency rather than creating tradeoffs.

### H3: Poison Dots (FAILED)

Dots that spawn extra dots when caught in a chain. `spawnOnCatch: 3` per poison dot.

| Poison % | IMPOSSIBLE survival | Skill disc (smart vs blind) | Effect |
|----------|--------------------|-----------------------------|--------|
| 10% | 0% | 1.04x | Negligible |
| 15% | 0% | 1.04x | Negligible |
| 20% | 0% | 1.09x | Negligible |

**Why it fails:** Chain cascades are spatially uncontrollable. The player's decision is WHERE to tap, but once the chain starts, it catches everything in range regardless. A "smart" bot that avoids tapping near poison dots performs identically to a "blind" bot (1.03-1.09x discrimination). The penalty (spawning dots at board edges) is too diffuse to create immediate tactical consequences.

**Key insight:** Any mechanic that modifies what happens DURING a cascade doesn't create player choices, because the player has no control over the cascade. Meaningful choices must affect the TAP decision itself — when, where, and what kind of tap.

### H4: Combo Timer (FAILED)

Combo window after each chain end. Score multiplied for rapid successive clears.

| Combo Window | FLOW Score Disc | IMPOSSIBLE Score Disc | Effect |
|-------------|----------------|----------------------|--------|
| none | 1.39x (eager>patient) | 0.81x (patient>eager) | Baseline |
| 3000ms | 1.40x | 0.81x | Negligible |
| 5000ms | 1.41x | 0.82x | Negligible |

**Why it fails:** The strategic difference between eager (tap ASAP) and patient (wait for clusters) play already exists without combo — it's the tap timing. The combo bonus is marginal compared to base chain score. At FLOW, eager play is inherently better (1.39x) because frequent taps keep density controlled. At IMPOSSIBLE, patience wins because you need bigger chains to overcome spawn rate. The combo timer adds <2% on top of these existing dynamics.

### H8: Tap Energy Budget (PARTIAL — different outcome than other failures)

Energy pool: tap costs energy, regenerates over time. Two variants tested:

**H8a: Radius scales with energy (50% at min → 100% at full)**

| Config (IMPOSSIBLE) | Eager | Balanced | Patient | Life Disc | Score Disc |
|---------------------|-------|----------|---------|-----------|------------|
| energy-50-15-20 | 29.9s, 3.2 chain | 34.5s, 4.5 chain | 51.9s, 7.8 chain | 1.74x | 6.77x |
| energy-40-15-20 | 51.4s, 5.9 chain | 55.6s, 6.6 chain | 62.8s, 7.6 chain | 1.22x | 1.53x |

**Why patient dominates:** Full-energy tap = full radius = 2.4x longer chains. No incentive to tap early because the radius advantage overwhelms timing pressure.

**What's interesting:** The 6.77x score discrimination is the highest of any mechanic tested. Energy management MATTERS — a player who taps at the wrong time is severely punished. But it's a lesson (always wait for full energy) not a decision (should I tap now or wait?).

**H8b: Fixed radius, energy enables burst tapping**

All burst sizes (x1, x2, x3) produce nearly identical outcomes (1.00-1.31x). Burst tapping is just a different cooldown pattern — it doesn't change strategy.

### Why H1/H2/H3/H4/H8 All Fail — Root Cause Analysis

Six parameter-level hypotheses tested. One (H6) fixed mortality. Five failed to create depth. The pattern reveals a deep structural constraint:

**The cascade is uncontrollable.** Once the player taps, the chain reaction follows physics. The player has zero agency over which dots get caught, where the cascade spreads, or how long it lasts. This means:

1. **Any mechanic that modifies cascade behavior** (H1: dot speed, H3: poison dots, H2: radius changes) doesn't create player choices because the player can't control the cascade.

2. **Any mechanic that rewards tap timing** (H4: combo, H8: energy) either has marginal effect or creates a dominant strategy rather than a tradeoff.

3. **The only player decision is WHERE to tap.** And the answer is almost always "biggest cluster" because:
   - The cascade amplifies any initial advantage (tap the densest spot → biggest chain)
   - All dots are equivalent from a chain perspective
   - There's no cost to big chains and no benefit to small ones
   - Radius scaling (H8) makes this even MORE true — patient play always dominates

**Conclusion: Parameter-level changes cannot create depth.** The game needs a structural change to its decision space. Possible directions:

1. **Multi-tap placement**: Place 2+ taps before resolution. Creates combinatorial positioning decisions. Each tap can be evaluated for chain interaction, overlap avoidance, and complementary coverage.

2. **Directed explosion**: Tap + drag to set chain propagation direction. Creates aim skill and spatial strategy. Some directions are better than others depending on dot distribution.

3. **PvP mode**: Opponent's chains send dots to your board (like Puyo Puyo / Tetris 99). Creates external pressure, meta-game, and infinite depth through opponent modeling. The user specifically requested this.

4. **Board zones**: Areas with different effects (multiplier zones, speed zones, gravity wells). Creates positional strategy. "Biggest cluster" is no longer always optimal if the zone matters.

5. **Asymmetric dot interaction**: Dots that interact with each other before the player taps (e.g., dots form clusters naturally via attraction, player must break unfavorable clusters). Creates pre-tap board management.

**Recommendation: Focus on PvP.** It's the only direction that creates infinite depth without adding mechanical complexity to the core tap-and-chain mechanic. The core mechanic is fine for competitive play — the depth comes from the opponent, not the ruleset.

### Combination Tests

H6 (k=0.4) alone is sufficient. It achieves the primary goal (games end) while preserving the secondary goals (skill matters, drama exists). Other mechanics failed (H1, H2, H3, H4) because they operate within the single-decision framework.

### Decision: Ship H6 with k=0.4

The `spawnDensityScale` parameter will be added to each tier's config. It creates the missing positive feedback loop: more dots → faster spawning → even more dots → inevitable overflow. This is the Tetris-like crisis curve the game was missing.

---

## PvP Design: Chain Reaction Versus Mode

### Why PvP is the Right Direction

The research above proves that parameter-level single-player changes cannot create meaningful decision depth. The cascade is uncontrollable, the tap decision is greedy-optimal, and no config-driven tweak changes this.

PvP solves this by adding an **external, unpredictable pressure source**: your opponent. The core tap-and-chain mechanic stays identical — all the depth comes from the interaction between two players' boards. This is exactly how Puyo Puyo, Tetris Attack, and Puzzle Bobble versus modes work: the single-player game is simple, the versus game is deep.

### Prior Art Analysis

| Game | Attack Mechanic | Defense | What Creates Depth |
|------|----------------|---------|-------------------|
| Puyo Puyo | Chain length → garbage puyos (exponential) | Offset: your chain cancels incoming garbage | Build timing, harassment, counter-building |
| Tetris 99 | Line clears → garbage lines | None (just clear faster) | Targeting strategy, badge snowball |
| Panel de Pon | Chains → garbage blocks | Garbage converts to usable panels | Skill chains, garbage tennis |
| Puzzle Bobble VS | Orphaned bubbles → garbage | None (clear faster) | Shot economy, cascade setup |

**Key insight from Puyo Puyo:** Offsetting (your chain cancels incoming garbage, surplus attacks back) is what makes PvP deep. Without it, versus mode is just parallel single-player with a timer.

### Chain Reaction PvP Design

#### Core Loop

```
Player A taps → chain reaction → dots caught → garbage sent to B
                                               ↕ (offset)
Player B taps → chain reaction → dots caught → garbage sent to A
```

#### Garbage System

**Sending garbage:**
Chains send "garbage dots" to the opponent's board. Formula:

```
garbageSent = floor(chainLength * chainLength / garbageDivisor)
```

Quadratic scaling means bigger chains are disproportionately rewarding:
- 3-chain: 1 garbage dot
- 5-chain: 3 garbage dots
- 10-chain: 11 garbage dots
- 20-chain: 44 garbage dots

`garbageDivisor` is a tuning parameter (start at 9, adjust via bot-vs-bot simulation).

**Receiving garbage:**
Garbage dots spawn at random board edges (same as normal dots) but are visually distinct (gray/dark). They:
- Move at normal speed
- CAN be caught in chains (actionable, not just punitive)
- DO propagate chain explosions (so they're useful if clustered)
- Have reduced explosion radius (0.7x) when cascading
- Do NOT trigger garbage sending when caught (prevents infinite loops)

**Offsetting:**
When garbage is queued against you (pending, not yet spawned), your chain's generated garbage first **cancels** incoming garbage 1:1. Only the surplus is actually sent/received.

```
Example:
- Player A's chain would send 8 garbage to B
- Player B has 5 pending garbage about to arrive
- Offset: B's 5 incoming is cancelled. A receives 3 net garbage.
Wait no — B's chain cancels B's incoming:
- A sends 8 garbage (queued for B)
- B fires a chain that would send 5 garbage
- Offset: B's 5 cancels 5 of the 8 queued. Only 3 garbage actually spawns on B.
- B's surplus (0) means nothing sent to A.
```

If B's chain exceeds the incoming: surplus goes to A as garbage.

**Garbage timing:**
Garbage doesn't spawn immediately. There's a 1-2 second delay (visual warning: pending garbage shown as a bar/counter). This gives the defender time to fire a counter-chain to offset.

#### New Decisions Created

1. **When to fire**: Small chain now (harass, reduce opponent's clean space) vs build toward bigger chain (exponential garbage)
2. **Defense timing**: See incoming garbage → rush to fire any available chain to offset it
3. **Board management**: Garbage dots clutter the board. Player must decide: chain them away (they're catchable) or work around them
4. **Risk/reward**: More dots on your board → easier chains → more garbage sent. But also closer to overflow. This is the positive feedback the single-player game was missing.
5. **Opponent reading**: Watch their density. If they're at 70% density, they're about to fire a big chain or die. If they're at 30%, they're building.

#### Architecture

```
┌─────────┐    WebSocket    ┌──────────┐    WebSocket    ┌─────────┐
│ Client A │ ◄────────────► │  Server  │ ◄────────────► │ Client B │
│ (Game)   │                │ (Match)  │                │ (Game)   │
└─────────┘                 └──────────┘                └─────────┘
```

**Server responsibilities:**
- Match creation (lobby/queue)
- Validate tap events (anti-cheat: check cooldown, position bounds)
- Compute garbage from chain events
- Manage offset queue
- Broadcast garbage spawn events
- Detect overflow (game over)

**Client responsibilities:**
- Full local Game instance (responsive gameplay)
- Send tap events to server
- Receive garbage spawn events, apply to local game
- Render opponent's board (minimap or side-by-side)
- Display pending garbage indicator

**State sync:**
- NOT full state sync (too expensive for 60fps physics)
- Event-based: only taps and garbage spawns are synced
- Each player's physics runs independently
- Deterministic RNG per player ensures consistent replay

**Bot-vs-bot simulation:**
The existing sim infrastructure works for PvP:
```javascript
// Two Game instances, same DT loop
while (!gameA.overflowed && !gameB.overflowed) {
    gameA.step(DT); gameB.step(DT);

    const tapA = botA.update(DT);
    if (tapA) {
        gameA.tap(tapA.x, tapA.y);
        const chain = gameA.chainLengths[gameA.chainLengths.length - 1];
        queueGarbage(gameB, chain, offsetQueueB);
    }

    // Same for B → A
}
```

This means we can tune garbage parameters autonomously before building the real-time server.

#### Implementation Plan

**Phase 1: Headless PvP simulation** (no server, no UI)
- `pvp-sim.js`: Two Game instances + BotRunners in a shared loop
- Garbage system: send, queue, offset, spawn
- Metrics: who wins, game length, garbage sent/received, offset rate
- Bot ladder: greedy-vs-greedy, greedy-vs-humanSim, etc.

**Phase 2: Tune garbage parameters**
- Sweep `garbageDivisor` for balanced games
- Test asymmetric skill (good vs bad bot) for fairness
- Verify offset rate (should be 30-50% — too high means stalemate, too low means steamroll)

**Phase 3: Browser PvP (local 2P)**
- Split-screen or side-by-side rendering
- Two touch zones (or keyboard + touch)
- No server needed — both games in same browser

**Phase 4: Online PvP**
- WebSocket server (Node.js)
- Matchmaking queue
- Spectator mode (replay viewer already exists)

#### Metrics for PvP Quality

| Metric | Formula | Target |
|--------|---------|--------|
| Game length | Duration until one player overflows | 60-180s |
| Offset rate | Garbage cancelled / garbage sent | 30-50% |
| Comeback rate | % of games where losing player wins | 15-30% |
| Skill discrimination | Win rate of better bot | 65-80% |
| Garbage efficiency | Garbage sent per chain | Increases with chain length |
| First-blood advantage | Win rate of first attacker | <65% |

### PvP Simulation Results (Phase 1)

**Implemented:** `pvp-sim.js` — headless PvP with garbage system, offset, bot ladder.

#### Bot Ladder (garbageDivisor=9, garbageDelay=3000ms, tier=FLOW, 40 games/matchup)

```
             CALM    FLOW    SURGE   TRANS   IMPOSSIBLE
CALM          ---     8%     10%      3%       5%
FLOW          83%     ---    40%     33%      50%
SURGE         90%    60%      ---    35%      48%
TRANS         93%    57%     55%      ---     50%
IMPOSSIBLE    95%    65%     63%     57%       ---
```

**Skill ordering is correct and monotonic.** Avg win rates: CALM 6.5% → FLOW 51.5% → SURGE 58.3% → TRANS 63.8% → IMPOSSIBLE 70.0%.

#### Garbage Divisor Sweep (IMPOSSIBLE vs FLOW, delay=3000ms)

| Divisor | IMPOSSIBLE WR | Game Length | Garbage/game | Offset% |
|---------|--------------|------------|-------------|---------|
| 3 | 70% | 40.8s | 216 | 44% |
| 5 | 60% | 41.5s | 193 | 41% |
| **7** | **63%** | **48.0s** | **204** | **35%** |
| 9 | 77% | 46.4s | 175 | 34% |
| 12 | 67% | 46.4s | 148 | 36% |
| 15 | 60% | 49.3s | 161 | 31% |

**Recommended: divisor 7, delay 3000ms.** Balanced game length (48s), healthy garbage economy (204/game), meaningful offset rate (35%).

#### Close Match Dynamics (IMPOSSIBLE vs TRANSCENDENCE, divisor 9, delay 3000ms)

- Win rate: 57% vs 43% (close, competitive)
- Avg game length: 52.8s
- **Offset rate: 41%** (significant counter-play between matched players)
- Garbage sent nearly equal (114 vs 111)

This confirms the garbage system creates the desired dynamics: close matches feature active offset play, while skill mismatches are decisive.

---

*Last updated: 2026-02-23*
