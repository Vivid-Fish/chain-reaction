# Progression, Loss, and Restart Mechanics — Research

## The Problem

Chain Reaction currently: die on any round → restart at Round 1. If you've mastered R1-R4 but die on R5, replaying R1-R4 is tedious. One mistake erases all progress. The "one more try" impulse competes with "I don't want to replay the boring parts."

## Key Frameworks

### 1. Prospect Theory (Tversky & Kahneman, 1992)

Loss aversion coefficient **λ = 2.25**: losses feel 2.25x worse than equivalent gains.

```
v(x) = x^0.88              if x >= 0  (gains)
v(x) = -2.25 * (-x)^0.88   if x < 0   (losses)
```

**Implication:** Losing 5 rounds of progress feels as bad as gaining ~11 rounds feels good. Any progress lost on restart must be compensated by 2-2.5x perceived value.

### 2. Endowed Progress Effect (Nunes & Dreze, 2006)

Players given a head start are **1.8x more likely** to complete a goal vs. those starting from zero (even when actual effort is identical). Stamp card experiment: 8-stamp card with 0 pre-stamped → 19% completion. 10-stamp card with 2 pre-stamped → 34% completion.

**Implication:** After restart, giving the player SOME progress (even cosmetic) dramatically reduces quit rate.

### 3. Jesper Juul's Failure Cost Framework

**Failure cost = Time lost + Psychological cost**

Psychological cost amplified by:
- Repetition of mastered content (boredom)
- Attribution: "I messed up" (recoverable) vs. "game is unfair" (quit)
- Near-miss: dying at 95% completion is far more frustrating than dying at 10%

**Key insight from Flywrench:** Death every few seconds is fine when setback = 1-2 seconds. Failure frequency matters less than failure COST.

### 4. Flow Channel (Csikszentmihalyi / Jenova Chen)

Sweet spot: challenge ~4% above current skill level. Too low → boredom. Too high → anxiety. Replaying mastered content violates this by dropping challenge far below skill.

### 5. Raph Koster's Theory of Fun

Fun = pattern recognition at the right difficulty. Replaying solved patterns → below boredom threshold → actively harms experience.

## Quantifiable Metrics for Simulation

### Time-to-Meaningful-Play (TTMP)
```
TTMP = time from restart to first novel decision point
```
If player dies on R5 and restarts at R1, TTMP ≈ time to clear R1-R4 again. Target: **< 30 seconds**.

### Mastered Content Replay Ratio (MCRR)
```
MCRR = time_replaying_mastered_content / total_session_time
```
Target: **< 0.20** (less than 20% of session replaying beaten content). Above 0.30 → boredom-driven churn.

### Frustration Index
```
frustration_index = chain_count_at_death / target_needed
```
Values > 0.80 trigger the near-miss effect (strong "one more try" impulse but also high rage-quit risk).

### Recovery Time
```
recovery_time = time_to_reach_previous_peak - time_of_death
```
- < 2 sec: excellent (twitch games — Celeste, Super Meat Boy)
- < 30 sec: good (action games)
- < 2 min: acceptable
- \> 2 min: high churn risk

### Session Satisfaction Score
```
satisfaction = perceived_gain(levels_cleared)
            + perceived_loss(progress_lost) * -2.25
            + near_miss_bonus
            + novelty_ratio * weight
```

### Expected Session Length
```
E[session] = E[rounds_per_attempt] * time_per_round * E[attempts_before_quit]
```
Current game: ~3-5 rounds per attempt, ~15-20s per round, ~3-5 attempts = 3-8 minutes. Mobile session median is 4:45.

### Clear Rate Target
Research on mobile puzzle games: **60-70% level completion rate** retains users **50% longer** than harder settings. Current R1-R4 clear rate likely >90%, R5+ drops sharply.

## How Comparable Games Handle It

| Game | Failure Model | Restart Point | Mercy Mechanics |
|------|--------------|---------------|-----------------|
| **Boomshine** (our inspiration) | Infinite retries per level | Same level | Zero penalty. Just retry. |
| **Peggle** | 10 balls, fail = retry level | Same level | Free ball bucket, score-based free balls, weighted coin flip on miss |
| **Tetris Effect** | Top out = game over | Start (marathon) or reset board (chill) | Chill mode can't lose at all |
| **Geometry Wars** | 3 lives + bombs | Continue from current state | Extra life at 75K, then exponential thresholds (100K→1M→10M) |
| **Hades** | Death = return to hub | Start of run, keep meta-currency | God Mode: 20% DR + 2% per death (guarantees eventual success) |
| **Dead Cells** | Death = lose run progress | Start of run, keep cells/blueprints | Boss Stem Cells (voluntary difficulty) |
| **Candy Crush** | 5 lives, regen 1/30min | Same level | "5 extra moves" purchase (monetization driver) |
| **Celeste** | Infinite lives | Last screen (instant) | Assist Mode: adjustable speed, stamina, dashes, invincibility |

### Key Patterns:
1. **No successful casual game restarts from the very beginning.** Even pure roguelikes carry SOMETHING forward (player skill at minimum, usually meta-currency too).
2. **Near-miss mechanics drive retention:** Peggle's free ball bucket, Geometry Wars' extra lives, Hades' God Mode.
3. **The fastest-feeling games have the shortest recovery times:** Celeste = instant respawn, same screen. Boomshine = same level, instant.

## Hades God Mode Formula
```
resistance = min(0.20 + consecutive_deaths * 0.02, 0.80)
```
Starts at 20%, +2% per death, caps at 80%. After 30 deaths → 80% resistance. Mathematically guarantees eventual success while preserving challenge feel.

## Reinforcement Schedules

Variable ratio (VR) schedules produce highest engagement and most resistance to quitting:
- Don't reward on fixed intervals (predictable → "post-reinforcement pause")
- Reward unpredictably but with consistent average frequency
- This applies to when big chains happen, when mercy mechanics trigger, etc.

## The Near-Miss Effect

- Near-misses at 80-95% completion produce the strongest "one more try" effect
- They activate the same dopamine pathways as actual wins
- BUT: repeated near-misses without eventual success → rage quit
- Ideal: ~30% of failures should be near-misses

---

## Brainstorm: Solutions for Chain Reaction

### Option A: Lives System (Geometry Wars Model)
- Start with 3 lives. Lose a life when you fail a round.
- Earn extra lives at score thresholds (variable ratio schedule).
- When all lives gone → game over, restart from R1.
- **Pro:** Familiar, adds strategic layer (risk/reward with lives remaining). Reduces penalty per failure by ~3x.
- **Con:** Still restarts from R1 eventually. Doesn't solve the "boring early rounds" problem.
- **MCRR impact:** Moderate improvement. Delays the full restart.

### Option B: Checkpoint System (Boomshine-like)
- Never restart from R1. Failed a round? Retry THAT round.
- Track "best run" separately (unbroken streak).
- Optional: limit retries per round (3 attempts, then game over).
- **Pro:** Zero MCRR. Always playing at the challenge frontier. Matches Boomshine.
- **Con:** No stakes. Feels more like a puzzle than a game. Where's the tension?
- **MCRR impact:** 0.0 (perfect). Recovery time: instant.

### Option C: Setback (Partial Reset)
- Die on R7 → restart from R5 (setback of 2 rounds, never below R1).
- Formula: `restart_round = max(1, death_round - 2)`
- Or: restart from last "milestone" (every 3 rounds: R1, R4, R7, R10...)
- **Pro:** Preserves stakes while capping tedium. Recovery time = 2 rounds (~30-40s).
- **Con:** Replaying R5-R6 when you've already beaten them feels mildly tedious.
- **MCRR impact:** Low (~0.10-0.15).

### Option D: Mercy Rounds (Hades-inspired)
- After failing a round, the NEXT attempt is slightly easier:
  - +1 extra dot in your favor (target stays same, but 1 more dot on screen)
  - Or: explosion radius +5% per consecutive failure on same round
  - Caps after 3 failures (max +15% radius boost)
  - Resets when you clear the round
- **Pro:** Guarantees eventual progress. Doesn't feel like charity (subtle).
- **Con:** Skilled players never see it. Doesn't address MCRR if restart is still from R1.
- **Synergy:** Combines well with Options A or C.

### Option E: Fast-Forward Mastered Rounds
- After dying on R5+, R1-R(death-2) play at 2x speed with auto-tap (bot plays).
- Player watches a fast replay of easy rounds, takes over at the challenge frontier.
- Or: skip directly to `death_round - 1` with appropriate dot count/speed.
- **Pro:** MCRR near zero. Player always at the frontier. Full game-over stakes preserved.
- **Con:** Skipping content feels weird. Missing the "warm-up" benefit of easy rounds.
- **MCRR impact:** Near 0.

### Option F: Persistent High Score + Round Select (Unlock Model)
- Beating a round permanently unlocks it as a starting point.
- "Start from Round 1" (full score potential) vs. "Start from Round 5" (reduced score multiplier).
- High score leaderboard incentivizes starting from R1, but R5+ start available for practice.
- **Pro:** Player choice. Practice without tedium. Stakes for score chasers.
- **Con:** Two modes add complexity. Score comparison is muddied.

### Option G: The "Streak" Model (Hybrid)
- Always retry current round on failure (like Boomshine).
- BUT: track an unbroken "streak" counter (rounds cleared without failing).
- Streak multiplies score. Breaking the streak resets multiplier, not round.
- High streak = leaderboard bragging rights.
- **Pro:** Zero restart tedium. Stakes come from the streak, not round loss. Near-miss on streak is exciting.
- **Con:** Less dramatic than "game over." May reduce urgency.

---

## Recommendation

**Option C (Setback) + Option D (Mercy) is the strongest combination for Chain Reaction.**

Rationale:
- Setback of 2 rounds keeps recovery time at ~30-40s (within the "good" threshold)
- MCRR stays around 0.10-0.15 (well within target)
- Mercy mechanic (+5% radius per consecutive fail, capped at +15%) prevents stuck-forever scenarios
- Preserves stakes: you CAN lose progress, it just doesn't feel catastrophic
- The near-miss effect still works: failing on R7 and dropping to R5 is frustrating but recoverable
- Prospect theory: losing 2 rounds (not 7) reduces loss magnitude by ~70%, bringing perceived loss closer to perceived gains

**Alternative strong option: Option G (Streak Model)** if we want to go fully casual.

## Simulation Metrics to Add

To model progression feel, add these to the sim:

1. **Multi-round session simulation** — run a "session" of N rounds, model failure probability per round, compute E[peak_round], E[session_length], E[restarts]
2. **MCRR** — given a restart policy, how much time is spent below the challenge frontier?
3. **Frustration index distribution** — across many sessions, what % of failures are near-misses?
4. **Recovery time** — given setback distance, how long to reach previous peak?
5. **Session satisfaction** — composite score using prospect theory weighting
6. **Clear rate per round** — what % of attempts succeed at each round? Should be 60-70%.

---

## References

- Tversky & Kahneman (1992). Cumulative Prospect Theory. Journal of Risk and Uncertainty.
- Nunes & Dreze (2006). The Endowed Progress Effect. SSRN.
- Juul, J. (2010). In Search of Lost Time: On Game Goals and Failure Costs. FDG.
- Koster, R. (2004). A Theory of Fun for Game Design.
- Chen, J. (2007). Flow in Games. MFA Thesis.
- Cuerdo et al. Fail and Retry. UC Santa Cruz.
- Supergiant Games. Hades God Mode: 20% + 2%/death.
- King. Candy Crush: 5 lives, 30min regen.
- PopCap. Peggle: 10 balls + free ball mechanics.
- Mobile Gaming Benchmarks 2025. GameAnalytics.
