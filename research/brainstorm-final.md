# Chain Reaction: Competitive Mode Design
## Brainstorm Consensus -- 5 Rounds, 3 Agents

---

### Elevator Pitch

Chain Reaction: Billiards Mode is a turn-based competitive game where two players share one board of drifting, flocking dots. On your turn, you tap once -- your explosion catches nearby dots for a meter push AND blasts surviving dots across the board, reshaping the battlefield your opponent must deal with next. The deepest skill is not finding the biggest chain available now, but finding the tap that scores AND leaves the board in the worst possible state for the other player.

### North Star

**"Before you tap, what did you SEE that your opponent missed?"**

Every design decision in this document serves that question. The game rewards perceptual depth -- seeing further into the physics simulation's future than your opponent. The gap between players is always "I saw further than you did."

---

### The Game

#### Core Mechanic

You tap the screen. An explosion blooms at the tap point. Dots within the blast radius are caught and chain-react through cascade mechanics (gen 0 catches all types; gen 1+ catches same type only). Simultaneously, every surviving dot near the explosion receives a radial blast impulse that pushes it away from the detonation point. The caught dots push a tug-of-war meter toward your opponent. The pushed dots reshape the board for the next turn.

One tap. Three consequences: score (meter push), disruption (blast repositions opponent's formations), and setup (blast positions dots for your future chains). Every tap is offense, defense, and investment at once.

#### Board & Visuals

**One shared board.** Full screen. Same viewport as solo play (390x844 phone portrait, scales to desktop). Dark background with colored dots. No split screen, no panels, no secondary zones. Both players play billiards on the same table.

**Tug-of-war meter:** A thin vertical bar (8px wide) on the left edge of the board, full height. A fill indicator moves above or below a center marker. Player A (blue) pushes upward; Player B (orange) pushes downward. The meter value is a float in [-1.0, +1.0]. Three visual zones:

- Center 60% (-0.30 to +0.30): Neutral, white/grey fill.
- Outer 20% each side (0.70 to 1.00 and -1.00 to -0.70): Danger zone, glowing in the threatening player's color with increasing intensity.

The meter is peripheral -- you glance at it, not stare at it. Score is encoded in the simulation, not in a HUD.

**Player identity:** Player A's explosions, dot trails, and push waves are blue. Player B's are orange. Dots themselves are NOT colored by ownership -- all dots are shared. Color coding applies only to explosion effects and the meter.

**Turn indicator:** Active player's color as a subtle 3px glow along the bottom edge. In ranked mode, a thin arc timer sweeps in the active player's color.

**Three visual feedback layers for blast force:**

1. **Blast ring:** An expanding shockwave ripple from each explosion, visible for 0.3s. Shows the force radius. Communicates "the explosion pushed things."
2. **Dot trails:** Dots that received significant blast force show a short motion trail (0.5s) in the pushing player's color. The trail is the causal link: "that red explosion pushed these blue dots."
3. **Cluster glow:** When 3+ same-type dots are pushed into chain proximity, they briefly pulse. Signals "this group is now chainable." Experts read the glow as opportunity; novices see something inviting.

These are pure feedback on existing physics. They make blast force legible without adding rules.

#### Turn Structure

**Strict alternation: Player A taps, then Player B taps, then A, then B.**

Each turn:

1. **Observe.** The active player reads the board. Dots are always moving -- boid flocking, drift, gravity wells all continue. The board is never frozen. The player reads: where are clusters forming? Where did the opponent's last blast push things? What is the meter position? Is there incoming pressure to counter?

2. **Tap.** One tap. The explosion resolves: chain cascades per existing mechanics, and surviving dots receive blast force (inverse-power falloff from explosion center).

3. **Meter push calculation.**
   ```
   raw_push = METER_BASE * chainLength ^ METER_EXPONENT
   streak_mult = 1 + (min(momentum, 6) - 1) * MOMENTUM_METER_MULT
   escalation_mult = 1.0 + max(0, (turn - ESCALATION_START_TURN)) * ESCALATION_RATE
   total_push = raw_push * streak_mult * escalation_mult
   ```

4. **Push wave or instant resolve.** If `total_push < COUNTER_THRESHOLD`: meter moves immediately, no counter window, turn passes. If `total_push >= COUNTER_THRESHOLD`: a colored push wave animates on the meter over WAVE_TRAVEL_MS. The opponent enters a danger window.

5. **Danger window (if wave active).** The opponent can tap to counter (consuming their turn) or wait and let the push resolve (then take their normal turn). See Counter-Chain section below.

6. **Turn passes.** Dots continue moving. Physics never pauses.

**Shot clock:** 10 seconds in ranked (no limit in casual). This is a safety net against griefing, not the primary time pressure. The natural urgency comes from dots-in-motion: the cluster you are reading changes as you deliberate. Most turns take 2-4 seconds. The game feels like a rally in table tennis: tap-respond-tap-respond.

**Match length target:** 30-60 turns total (15-30 per player), lasting 60-120 seconds. Mobile-native session length.

#### Blast Force (The Innovation)

This is the design's identity. Without it, the game is "tug-of-war with chains" -- functional but generic. Blast force is what makes Chain Reaction's competitive mode unlike any other puzzle game.

**When blast fires:** Once per explosion, at the moment the explosion transitions from grow phase to hold phase. The impulse is instantaneous -- it modifies dot velocities in a single physics step.

**Which dots are affected:** All active, uncaught dots within blast range (explosion radius * BLAST_RANGE_MULT).

**Force formula:**
```javascript
function applyBlastForce(explosion, dots, spatialScale) {
  const blastRange = explosion.maxRadius * BLAST_RANGE_MULT;
  for (const dot of dots) {
    if (!dot.active || explosion.caught.has(dot.index)) continue;
    const dx = dot.x - explosion.x;
    const dy = dot.y - explosion.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= blastRange || dist < 0.5) continue;

    const nx = dx / dist;
    const ny = dy / dist;
    const normalizedDist = Math.max(dist / explosion.maxRadius, 0.1);
    const rawForce = BLAST_K / Math.pow(normalizedDist, BLAST_N);
    const cappedForce = Math.min(rawForce, BLAST_MAX_FORCE);
    const resistance = DOT_BLAST_RESIST[dot.type] || 1.0;

    dot.vx += nx * cappedForce * resistance * spatialScale;
    dot.vy += ny * cappedForce * resistance * spatialScale;
  }
}
```

**Type-specific blast resistance:**
- Standard: 1.0 (baseline)
- Gravity: 0.6 (heavy, resists push -- positional anchors)
- Volatile: 1.2 (light, pushed further -- chaos agents)

**Cascade blast accumulation:** Each cascade generation creates new explosions at caught-dot positions, each applying its own blast impulse. A gen-4 chain creates multiple blast events. A surviving dot near the chain center may receive impulses from several directions. Per-dot per-turn displacement is capped at BLAST_DISPLACEMENT_CAP (120px) to prevent screen-clearing chaos while preserving multi-source blast geometry.

**Gravity explosion interaction:** Gravity explosions pull nearby dots inward during hold phase while the initial blast impulse pushes outward. This creates a "shell" effect: close dots get compressed back (gravity pull overcomes blast), mid-range dots get ejected (blast overcomes gravity). The boundary between compress and eject is a learnable physics pattern.

**Volatile explosion interaction:** Volatile explosions have 1.5x radius, so their blast range extends to 3.0R. They reshape a wider area of the board. Volatile dots are high-energy: they cause bigger blasts and travel further when blasted.

**The sweet spot (target behavior):** Dots near an explosion should visibly relocate 30-60px on a phone screen (roughly 0.75-1.5 explosion radii). Less than 20px is imperceptible; more than 80px is chaotic. The inverse-power falloff ensures close dots move far (dramatic), distant dots move little (predictable).

**Blast force parameters:**

| Parameter | Symbol | Proposed | Sweep Range | Target |
|-----------|--------|----------|-------------|--------|
| Force scalar | BLAST_K | 0.8 | 0.3-2.0 | 30-80px displacement for nearby dots |
| Distance falloff | BLAST_N | 1.5 | 1.0-2.5 | Moderate gradient: close=dramatic, far=subtle |
| Blast range multiplier | BLAST_RANGE_MULT | 2.0 | 1.5-3.0 | How far beyond visible explosion blast reaches |
| Force cap | BLAST_MAX_FORCE | 3.0 | 1.5-5.0 | Prevents point-blank extremes |
| Displacement cap | BLAST_DISPLACEMENT_CAP | 120px | TBD -- sweep required | Limits cumulative cascade blast |
| Gravity resistance | DOT_BLAST_RESIST.gravity | 0.6 | 0.3-1.0 | Gravity dots as anchors |
| Volatile susceptibility | DOT_BLAST_RESIST.volatile | 1.2 | 1.0-1.5 | Volatile dots fly further |

#### Tug-of-War Meter (Win Condition)

The meter is a float in [-1.0, +1.0]. At -1.0, Player A loses. At +1.0, Player B loses.

**Push formula:**
```
raw_push = METER_BASE * chainLength ^ METER_EXPONENT
```

At momentum x1, no escalation:

| Chain Length | Push | % of Meter | Meaning |
|-------------|------|-----------|---------|
| 1 | 0.008 | 0.8% | Negligible. Below counter threshold. |
| 2 | 0.021 | 2.1% | Barely above threshold. |
| 3 | 0.037 | 3.7% | First "real" push. Opens counter window. |
| 5 | 0.073 | 7.3% | Significant. Board-changing if uncountered. |
| 7 | 0.118 | 11.8% | Big. Opponent must decide: counter or absorb. |
| 10 | 0.189 | 18.9% | Huge. Game-shifting. |
| 15 | 0.306 | 30.6% | Near-lethal from center. |

**Center drift:** Between turns, the meter drifts toward 0.0 at METER_DRIFT_PER_SEC * elapsed seconds. Drift pauses during chain resolution and wave travel. This provides structural comeback rubber-banding without being so strong that it erases a leading player's advantage.

**Escalating stakes:** After turn 20 (halfway), all meter pushes are multiplied by `1.0 + (turn - 20) * ESCALATION_RATE`. At turn 30: 1.5x. At turn 40: 2.0x. Late-game chains push dramatically harder, converting small skill edges into decisive outcomes. This breaks stalemate between equal-skill players.

**Match end conditions:**
1. Meter reaches -1.0 or +1.0: that player loses.
2. Turn 40 reached: player with meter on opponent's side wins. Ties broken by total chain length.

**First-turn compensation:** Meter starts at FIRST_TURN_OFFSET (0.05) toward the first player's losing side, compensating their move advantage. Exact value is TBD -- sweep required after simulation reveals actual first-mover advantage magnitude and direction.

**Meter parameters:**

| Parameter | Proposed | Sweep Range |
|-----------|----------|-------------|
| METER_BASE | 0.008 | 0.004-0.016 |
| METER_EXPONENT | 1.4 | 1.0-2.0 |
| METER_DRIFT_PER_SEC | 0.005 | 0.002-0.010 |
| COUNTER_THRESHOLD | 0.015 | 0.010-0.030 |
| FIRST_TURN_OFFSET | 0.05 | 0.0-0.10 |
| MATCH_TURN_LIMIT | 40 | 30-50 |
| ESCALATION_START_TURN | 20 | 15-25 |
| ESCALATION_RATE | 0.05/turn | 0.03-0.08 |

#### Counter-Chain (Active Defense)

When a chain produces a push above COUNTER_THRESHOLD, a push wave animates on the meter over WAVE_TRAVEL_MS (1500ms). During this window, the opponent faces a choice:

**Option A: Counter.** Tap to fire a chain. The counter-chain's push is multiplied by COUNTER_EFFICIENCY (0.80) and subtracted from the incoming push:
```
effective_counter = counter_push * COUNTER_EFFICIENCY
net = attack_push - effective_counter
```
If net > 0: reduced push still hits the defender. If net < 0: surplus pushes back toward the attacker. If net == 0: perfect cancel (both waves shatter, no meter movement, audio sting). **The counter-tap consumes the defender's turn.** This is the critical trade-off: you spent your turn reactively on whatever chain was available, not on the best positional play you could have found.

**Option B: Absorb.** Let the wave resolve. Take the full push. Then take your normal turn and choose the best chain on the board proactively. You ate damage but you chose your moment.

**No counter-counter rallies.** After one exchange (attack + counter), the net push resolves and turns alternate normally. One exchange per cycle. Rallies would extend match length unpredictably, reward reaction speed over reading, and make the game incomprehensible to spectators.

**Small pushes auto-resolve.** Pushes below COUNTER_THRESHOLD resolve instantly with no counter window. Tiny pokes do not deserve dramatic counter-windows.

**COUNTER_EFFICIENCY at 0.80 means pure defense bleeds.** Over 10 exchanges, a turtle absorbs roughly 15% of cumulative meter push that it could not cancel. This structurally prevents turtling (only countering, never attacking proactively) from being a viable strategy. At 1.00, turtling dominates. At 0.60, countering feels futile. Sweep range: 0.60-1.00.

**Visual/audio for danger windows:**
- A colored push wave (attacker's color) slides along the meter.
- A rising audio tone begins with pitch proportional to push magnitude. Big push = high pitch = alarm.
- Both waves visible when counter fires -- they meet at the current position, the winning wave continues, the losing wave shatters with particles.

**Counter parameters:**

| Parameter | Proposed | Sweep Range |
|-----------|----------|-------------|
| COUNTER_EFFICIENCY | 0.80 | 0.60-1.00 |
| WAVE_TRAVEL_MS | 1500 | 800-2500 |
| COUNTER_THRESHOLD | 0.015 | 0.010-0.030 |

#### Momentum Streak

The existing solo-mode momentum system, ported to competitive with a reduced multiplier.

Consecutive chains of 3+ dots build momentum from x1 to x10. The streak multiplies meter push:
```
streak_mult = 1 + (min(momentum, 6) - 1) * MOMENTUM_METER_MULT
```

Momentum is capped at x6 for meter-push purposes (even if the streak counter continues for Supernova tracking). At MOMENTUM_METER_MULT of 0.08, x6 momentum gives a 1.40x multiplier.

**Streak break:** A chain of fewer than 3 dots resets momentum to x1. A chain of 0 (whiff) also incurs a STREAK_BREAK_PENALTY of 0.02, pushing the meter toward the whiffing player.

**Why momentum is core, not scope creep:**

1. **Narrative arc.** Without streaks, every turn is an isolated decision. Streaks add temporal continuity: "I have been building toward this for 5 turns."
2. **Small-chain value.** Without streaks, there is never a reason to fire a 3-chain when a 5-chain is available. With streaks, the 3-chain that maintains your x6 streak (effective push equivalent to a raw 5-chain) is sometimes better than the risky 6-chain that might whiff and reset you to x1.
3. **Supernova gating.** Four consecutive qualifying chains (3+) charge Supernova. The streak is the natural gate.

**Momentum parameters:**

| Parameter | Proposed | Sweep Range |
|-----------|----------|-------------|
| MOMENTUM_METER_MULT | 0.08/level | 0.05-0.15 |
| Meter-push momentum cap | x6 | x4-x8 |
| Minimum qualifying chain | 3 | 2-4 |
| STREAK_BREAK_PENALTY | 0.02 | 0.01-0.04 |

---

### Mode Pipeline

The same blast-force physics engine is the invariant core across all three modes. The perceptual skill -- reading where dots will end up after a blast -- transfers directly from zen practice to PvP competition.

#### Solo Zen

The current continuous mode with one addition: blast force is active. Every explosion pushes surviving dots. No meter. No turns. No opponent. No counter-chains. Score is the only measure. The player learns to read blast trajectories and position dots for future chains.

**What it teaches:** The billiards skill. "This small tap sets up a bigger chain." You learn to read blast trajectories, predict where dots will settle after an explosion, and plan positional sequences. This is "hitting balls in the practice room."

**What it does not teach:** Counter-timing, meter management, opponent modeling. Those are PvP-specific skills built on top of the billiards foundation.

#### AI Opponent

Same rules as PvP. Shared board, tug-of-war meter, turn-based alternation, counter-chains, blast force. The AI's turn is visually displayed -- you see where the bot tapped and how dots moved. This teaches the player to read opponent-shaped board states.

**Difficulty tiers:**
- **Easy (Greedy):** Taps the biggest cluster. Ignores blast positioning. Counters randomly.
- **Medium (Counter-Aware):** Taps the biggest cluster. Counters when able. Does not model blast geometry.
- **Hard (Oracle):** Models blast trajectories. Plans 2-tap sequences. Chooses chains for positional value, not just size. Exploits counter-timing.

**What it teaches:** Reading a board that someone else has blasted. Counter-timing decisions (when to counter vs. absorb). The AI provides predictable but escalating challenge.

#### PvP

The full competitive experience. Everything in this document. Online matchmaking or local pass-and-play. The only new skill beyond AI practice is reading a human opponent's intent from their tap choices -- the "poker read" layer.

**Training pipeline summary:**
1. Solo zen: learn blast trajectories (20 minutes directly improves PvP).
2. AI: learn counter-timing and reading opponent-shaped boards.
3. PvP: learn opponent modeling and multi-turn strategic planning.

---

### Skill Progression

**Novice (first 5 games):**
"I see a big cluster of dots. I tap it. Dots explode. The bar moves. Cool."

The novice does not read blast trajectories, does not think about countering, does not consider board positioning. They tap the biggest cluster and enjoy the chain reaction. The meter gives feedback ("I pushed the bar!"). The 60-second skill revelation: "I tapped, the bar moved. My opponent tapped, it moved back. Wait -- I tapped during their push and it CANCELLED. I can fight back!"

The novice sees: the biggest cluster on the board.
What they missed: everything about positioning, blast force, and opponent timing.

**Intermediate (20-30 games):**
"I see a 5-dot red cluster, but I also notice that detonating it will push those 3 blue dots toward the gravity well. If I tap the red cluster, I get a 5-push AND I set up a blue chain for next turn."

The intermediate has discovered blast force. They notice dots move after explosions and start aiming for taps that have good "leave" -- billiards terminology for where the cue ball ends up after a shot. Two layers of reading: the immediate chain and the resulting board state.

The intermediate sees: the chain AND the blast trajectory of survivors.
What they missed: counter-timing, opponent intent, and 3-tap-ahead sequences.

**Advanced (100+ games):**
"The meter is slightly toward me. My opponent just fired a 4-chain that scattered my green school. I see their push coming. I have a 3-chain counter available that would cancel most of the push AND reassemble my scattered green dots via blast force. But if I DON'T counter, I can fire a 5-chain on the other side that my opponent hasn't noticed. The 5-chain push is bigger than the 4 I'm eating. Do I defend or attack?"

Three simultaneous layers: counter-timing (should I cancel?), blast positioning (where does my counter leave the board?), and opponent modeling (did they scatter my greens on purpose?).

The advanced sees: counter-timing, blast positioning, AND opponent intent.
What they missed: the 4-tap-ahead sequence where defending now leads to a streak-amplified attack in 3 turns.

**Master (tournament level):**
"I have x4 streak. My opponent fired a suspiciously modest 3-chain -- I can see a 6-chain they deliberately didn't take. They used the 3-chain to push volatile dots toward my gravity well, creating a bait cluster. They WANT me to tap it -- because if I miss the timing window, my streak breaks. Then they fire their loaded 6-chain when my streak is gone. I see the bait. I ignore the super-cluster. Instead, I fire a small 2-chain that (a) counters their push, (b) scatters their loaded 6-chain via blast force, and (c) maintains my x5 streak. I sacrificed a flashy opportunity to dismantle their entire plan with a quiet 2-chain."

The master sees: the opponent's multi-turn strategy, the bait, the loaded weapon, AND the precise small tap that dismantles it all.

Prediction depth is unbounded because blast force creates second-order, third-order, and nth-order consequences from every tap.

---

### What We Deferred

**1. Supernova in Competitive.**
Three-tap burst after 4 consecutive qualifying chains. The most exciting mechanic in the spec -- and the most complex. It introduces resource management, a burst turn with different rhythm, and potential balance concerns (a well-executed Supernova can swing 35-45% of the meter). Deferred until the core loop (blast + meter + counter + momentum) has been validated as fun in isolation. If the core is too flat, Supernova becomes the first post-launch depth expansion. If the core is already compelling, Supernova adds climactic peaks without being load-bearing.

**Rationale:** Supernova is the Tetris Effect Zone analog -- the "save your ultimate for the right moment" mechanic. The design needs it eventually. But it must not be in the first playtest because it obscures whether the core loop works. Build up, not out.

**2. Competitive Tiers (CASUAL / FLOW / SURGE / MASTER).**
Four tiers with different spawn rates, dot type distributions, and boid schooling parameters. Ship with one tier (CASUAL: standard dots only, no schooling, slow speed). Add tiers as the player base grows.

**Rationale:** Tier differences are tuning, not design. Getting one tier right is hard enough. Four tiers at launch quadruples the testing surface.

**3. AI Opponents.**
Three difficulty levels require significant engineering (especially the Oracle bot). Defer until PvP loop is validated. Initial playtesting uses human vs. human.

**Rationale:** AI is important for the mode pipeline but is an engineering investment, not a design question.

**4. Async / Pass-and-Play.**
Turn-based alternation naturally supports asynchronous play. But async introduces notification systems, persistence, and "board state changed while you were away" UX challenges.

**Rationale:** Validate real-time fun first. Async is a distribution feature, not a core design feature.

**5. Audio as Competitive Feedback.**
Musical consonance when evenly matched, dissonance when one player dominates. The tug-of-war meter position could modulate harmonic relationships. Compelling but requires the visual game to exist first.

**Rationale:** Audio is a polish layer. Ship the physics first.

---

### What We Cut

| Idea | Reason |
|------|--------|
| **Garbage systems** (Ideas 1, 2, 3 standalone, 4, 8; Combo A) | The shared board eliminates the need for garbage entirely. Pressure is the meter push. Disruption is blast force. Defense is the counter-chain. Zero new dot types, zero readability overhead. |
| **Territory / Zones** (Idea 9) | Imposes a discrete grid onto a continuous physics simulation. Fights the game's fluid identity. Weak mode portability. |
| **Fog of War** (Idea 11) | Fundamentally violates deterministic depth. Cannot have skill-based prediction when the player cannot see the state. |
| **Dot Economy / Draft** (Idea 12) | Drafting is a second action type that breaks one-tap fidelity. Without drafting, collapses to "shared spawns." |
| **Asymmetric Ecosystem** (Idea 14) | Different rules per board fail readability, portability, and determinism. Cognitive load of tracking two rule sets on a phone violates "no tutorial required." |
| **Time Rewind Gambit** (Idea 15) | Commit/rewind is a second action. Breaks one-tap fidelity. |
| **Physics Sabotage** (Idea 10) | Even with fixes, pure offense with no defensive component. Sabotage recipient experiences effective randomness. |
| **Momentum Siege thresholds** (Idea 6 as-is) | Automatic effects at streak thresholds break one-tap fidelity. The streak-as-multiplier concept was salvaged and absorbed into the core design. |
| **Counter-counter rallies** | Would extend match length unpredictably, reward reaction speed over reading, and make the game incomprehensible to spectators. One exchange per cycle. |
| **Player-colored dots / dot ownership** | Board's visual language is already at capacity with type-encoding and blast feedback layers. Adding ownership would break readability. |
| **Manual Supernova activation** | Introduces a second input type (button press), violating one-tap fidelity. If Supernova ships, it activates automatically. |
| **Shared Resource Race** (Idea 5) | Race dynamic punishes patience. Two players tapping same screen is ergonomically terrible. Seeing deeply becomes a competitive disadvantage. |
| **Puzzle Fighter Type Targeting** (Idea 4) | Type-targeting strategy is mostly illusory -- you cannot control which types cluster on your board. Weak setup payoff. |

---

### Risk Register

**Risk 1: Blast force legibility (CRITICAL)**
Players cannot learn to read blast-scatter patterns. The entire design -- positional play, setup payoff, prediction ceiling, the North Star -- depends on players developing intuition for how blast force repositions dots. If this intuition does not form (physics too high-dimensional, boid flocking makes post-blast behavior chaotic, 10+ simultaneous dots exceed human perceptual bandwidth), the design collapses to "tug-of-war with chains," which is generic and was rejected as standalone Idea 7.

*Mitigation:* The blast legibility experiment (see Validation Gate). Build it first, test with humans, measure whether prediction accuracy improves with exposure. If it fails: reduce dot count, weaken boid flocking, increase BLAST_K for more dramatic displacement, or add a brief "blast preview" (ghost trajectories). If all mitigations fail: pivot to Combo C (Counter-Billiards Overflow), which relies on survival management rather than positional prediction.

**Risk 2: Stalemate between equal-skill players (HIGH)**
Two equally skilled players produce zero-sum meter oscillation. Center drift erases small advantages. Perfect counters cancel every push.

*Mitigation:* Three stacked anti-stalemate mechanisms: (1) COUNTER_EFFICIENCY at 0.80 means pure defense bleeds 20% per exchange, (2) escalating stakes after turn 20 amplify late-game skill edges, (3) 40-turn hard cap with tiebreaker. No single mechanism solves stalemate; together they make it nearly impossible. Sweep COUNTER_EFFICIENCY (0.60-1.00) and ESCALATION_RATE (0.03-0.08) to find the range where matches reliably end by turn 30-35.

**Risk 3: Cascade blast complexity exceeds human cognition (HIGH)**
A gen-4 chain creates ~9 blast events. Multi-blast interactions may produce chaotic rather than readable dot displacement. Players track 3-5 relevant dots (not all 40), but cumulative impulses from multiple directions may be unpredictable even for the relevant subset.

*Mitigation:* Per-dot displacement cap (120px/turn) limits extreme outcomes. If simulation shows multi-blast is chaotic: simplify to 1 blast impulse per dot per turn (only the closest explosion applies). This reduces pattern richness but makes prediction feasible.

**Risk 4: First-time appeal gap (MEDIUM)**
The billiards layer -- the core innovation -- is invisible on first play. The novice experience is "tug-of-war with chains," which must be fun enough to sustain 5-10 matches before the deeper layer reveals itself. If the basic layer is not engaging enough, players quit before discovering the real game.

*Mitigation:* The tug-of-war meter provides immediate competitive feedback. Accidental counter-chains create surprise moments. The three visual feedback layers (blast ring, dot trails, cluster glow) hint at blast physics even before the player understands it strategically. The game must be satisfying at the novice level and deepening at the intermediate level.

**Risk 5: Momentum compounding creates rich-get-richer dynamic (MEDIUM)**
A player who builds a high streak early dominates through amplified pushes. At x6 momentum with late-game escalation, pushes become very large.

*Mitigation:* Momentum meter-push cap at x6. Reduced MOMENTUM_METER_MULT (0.08 instead of originally proposed 0.15). Counter-chains do not reset the counter's momentum. Center drift. The opponent can deliberately force streak-breaking situations (blast-scatter the streaking player's formations to deny qualifying chains). Sweep required to validate.

---

### Validation Gate

**The Blast Legibility Experiment**

This is the one binary go/no-go gate in the entire plan. Everything after it is iterative tuning. The design is right or wrong based on one empirical question: **can humans learn to read blast-scatter patterns?**

#### What to Build

A single-screen test mode layered onto the existing solo continuous engine. No meter. No turns. No opponent. No counter-chains. Just:

1. The existing continuous mode board (dots spawning, flocking, drifting).
2. Blast force enabled (BLAST_K = 0.8, BLAST_N = 1.5, BLAST_RANGE_MULT = 2.0).
3. The three visual feedback layers (blast ring, dot trails, cluster glow).
4. A "prediction prompt" overlay.

#### The Test Protocol

1. Board runs for 5 seconds to reach a natural state (~20 dots, some clusters forming).
2. The game pauses. A crosshair appears at a specific position (the proposed tap point). A nearby cluster of 3-5 dots is highlighted.
3. The player is asked: **"After the explosion, will the highlighted cluster be TIGHTER or MORE SPREAD OUT?"** Two buttons: TIGHTER / SPREAD OUT.
4. The player taps their answer. The game unpauses. The explosion fires. The blast resolves. The cluster's post-blast state is shown with a brief highlight.
5. Result: CORRECT or INCORRECT. Shown for 1 second.
6. Repeat 20 times. Plot accuracy per trial.

#### Success Criteria

- **Trials 1-5:** Accuracy near 50% (random guessing). No model yet.
- **Trials 6-10:** Accuracy rises to 55-60%. Rough intuition forming.
- **Trials 11-20:** Accuracy reaches 65-75%. Reliable simple prediction.

**Pass threshold: 65% accuracy on trials 11-20.** The physics is learnable. The billiards design is viable.

**Fail threshold: Accuracy stays below 55% across all 20 trials.** The physics is too chaotic or too subtle. Response sequence:
1. Reduce dot count (15 instead of 20).
2. Weaken boid flocking (halve cohesion and alignment forces).
3. Increase BLAST_K for more dramatic displacement.
4. Re-run test.
5. If still fails: pivot to Combo C (Counter-Billiards Overflow).

#### Engineering Cost

Three additions to the existing solo continuous mode:
1. `applyBlastForce()` function in the physics loop (~30 lines).
2. Three visual effects (blast ring = CSS radial animation, dot trails = position history buffer, cluster glow = proximity detection + opacity pulse).
3. Prediction prompt overlay (pause, crosshair, binary question, result display, accuracy tracking).

**Estimated effort: 4-8 hours.** The cheapest possible experiment that answers the most important question.

---

### Implementation Path

| Step | Action | Duration | Gate |
|------|--------|----------|------|
| 1 | Build blast force + visual feedback in solo mode | 4-8 hours | -- |
| 2 | Run blast legibility test (20 trials, 3-5 humans) | 1-2 hours | 65% accuracy on trials 11-20 |
| 3 | If PASS: Build tug-of-war meter + turn alternation | 8-16 hours | -- |
| 4 | Build counter-chain system | 4-8 hours | -- |
| 5 | Playtest full competitive loop (human vs. human) | Ongoing | Fun? Stalemate rare? Matches < 3 min? |
| 6 | Tune: sweep BLAST_K, COUNTER_EFFICIENCY, METER_BASE, ESCALATION_RATE | Ongoing | Parameter convergence |
| 7 | If core loop validated: Add momentum streak | 2-4 hours | Does streak improve decision depth? |
| 8 | If streak validated: Add Supernova | 4-8 hours | Climactic without feeling unfair? |
| 9 | If full system validated: Add AI opponents, tiers, async | Weeks | Market readiness |

---

### Design Principles (inherited + new)

**Inherited from DESIGN.md:**
1. **Maximum Complexity, Minimum Abstraction.** All competitive state is readable from the board itself. No HUD overlays, no menus, no hidden systems. The meter is on the board. The blast force is visible physics.
2. **Dots Are Always In Motion.** The board is never frozen. Even between turns, dots flock, drift, and obey gravity. Time pressure comes from the physics, not from a clock.
3. **One-Tap Interaction.** The entire action space is choosing when and where to place a single tap. No secondary inputs, no ability selection, no activation buttons.
4. **Juice Effects Are Multiplicative.** Visual feedback (blast ring, dot trails, cluster glow) amplifies existing physics without adding new mechanics.

**New from the brainstorm:**
5. **Every Tap Is Sword AND Shield.** The chain is both offense (meter push) and defense (counter-cancel) and investment (blast repositioning). If a tap only serves one purpose, the design has failed.
6. **The Best Tap Is Not the Biggest Chain.** It is the tap that creates the best NEXT tap. Positional play over greedy play. The patient 2-chain that sculpts the board beats the flashy 6-chain that scatters it.
7. **Defense Must Cost Something.** COUNTER_EFFICIENCY < 1.0 means purely defensive play slowly loses. Aggression is structurally rewarded. Turtling is structurally punished.
8. **The Core Engine Is a Platform.** Blast physics is the invariant skill that transfers across solo zen, AI, and PvP. Modes are meta-layers on top of one physics engine, not separate games with shared branding.
9. **Deterministic but Not Solved.** Same state + same tap = same outcome, always. But boid flocking, continuous dot motion, and opponent interaction ensure no two board states are alike. The game is deterministic in mechanics and emergent in states.
10. **Ship, Measure, Iterate.** Tetris at launch was 30% of what Tetris is today. Rocket League at launch lacked ceiling play, flip resets, and wave dashes. The design's structural richness -- blast force creating nth-order consequences -- permits community-driven depth discovery. Ship the core, trust the physics.

---

### Full Parameter Reference

| Category | Parameter | Value | Sweep Range | Type |
|----------|-----------|-------|-------------|------|
| **Blast Force** | BLAST_K | 0.8 | 0.3-2.0 | float |
| | BLAST_N | 1.5 | 1.0-2.5 | float |
| | BLAST_RANGE_MULT | 2.0 | 1.5-3.0 | float |
| | BLAST_MAX_FORCE | 3.0 | 1.5-5.0 | float |
| | BLAST_DISPLACEMENT_CAP | 120 | TBD | px |
| | DOT_BLAST_RESIST.standard | 1.0 | -- | float |
| | DOT_BLAST_RESIST.gravity | 0.6 | 0.3-1.0 | float |
| | DOT_BLAST_RESIST.volatile | 1.2 | 1.0-1.5 | float |
| **Meter** | METER_BASE | 0.008 | 0.004-0.016 | float |
| | METER_EXPONENT | 1.4 | 1.0-2.0 | float |
| | METER_DRIFT_PER_SEC | 0.005 | 0.002-0.010 | float/sec |
| | FIRST_TURN_OFFSET | 0.05 | 0.0-0.10 | float |
| | COUNTER_THRESHOLD | 0.015 | 0.010-0.030 | float |
| | COUNTER_EFFICIENCY | 0.80 | 0.60-1.00 | float |
| | FORFEIT_PENALTY | 0.015 | 0.01-0.03 | float |
| | STREAK_BREAK_PENALTY | 0.02 | 0.01-0.04 | float |
| **Momentum** | MOMENTUM_METER_MULT | 0.08 | 0.05-0.15 | float/level |
| | Meter-push momentum cap | x6 | x4-x8 | int |
| | MOMENTUM_MIN_CHAIN | 3 | 2-4 | int |
| | MOMENTUM_MAX | 10 | -- | int |
| **Turn** | WAVE_TRAVEL_MS | 1500 | 800-2500 | ms |
| | SHOT_CLOCK_MS | 10000 | -- | ms |
| | MATCH_TURN_LIMIT | 40 | 30-50 | int |
| **Escalation** | ESCALATION_START_TURN | 20 | 15-25 | int |
| | ESCALATION_RATE | 0.05 | 0.03-0.08 | float/turn |
| **Spawn (CASUAL)** | Spawn rate | 0.8/s | -- | float |
| | Max dots | 35 | -- | int |
| | Dot types (std/grav/vol) | 100/0/0 | -- | % |
| | Speed range | 0.4-0.8 | -- | float |
| | Boid schooling | Off | -- | bool |
| **Cascade (existing)** | CASCADE_GEN_CAP | 4 | -- | int |
| | CASCADE_RADIUS_GROWTH | 0.08 | -- | float/gen |
| | CASCADE_HOLD_GROWTH | 200 | -- | ms/gen |

---

### Brainstorm Provenance

- 5 rounds (Diverge, Challenge, Combine, Converge, Commit)
- 3 agents (Proposer, Critic, Facilitator)
- 15 initial ideas generated across safe, medium, and wild tiers
- 7 rejected outright for non-negotiable failures (Fog of War, Dot Economy, Asymmetric Ecosystem, Time Rewind, Physics Sabotage, Shared Resource Race, Puzzle Fighter)
- 6 reworked (Momentum Siege salvaged as multiplier, Schooling Invasion declined, Territory Hex cut, Puyo Garbage absorbed then replaced, Tetris Downstack superseded, Counter-Chain absorbed into core)
- 3 survived standalone evaluation: Explosion Billiards (13), Counter-Chain (3), Tug-of-War (7)
- 1 combined design: the Dark Horse (13 + 7 + 3), which absorbed Combo B's momentum mechanic
- Key disagreements resolved:
  1. **Shared board vs. split board.** The Proposer initially favored Combo C (split boards, overflow). The Facilitator argued shared boards are essential to the billiards identity. The Critic validated that turn-based alternation resolves all shared-board concerns (determinism, simultaneity, reaction-speed tests). Resolved: shared board, unanimously.
  2. **Garbage systems vs. no garbage.** The Proposer proposed three garbage variants (Combos A, B, C). The Facilitator demonstrated that the shared board makes garbage unnecessary -- the meter push is pressure, blast force is disruption, counter-chain is defense. Three functions, zero new dot types. Resolved: no garbage, unanimously.
  3. **Momentum multiplier strength.** The Proposer proposed MOMENTUM_METER_MULT at 0.15. The Critic demonstrated compounding risk (x10 at 0.15 with escalation produces 4.7x effective multiplier, making single chains game-ending). The Facilitator adjudicated: reduce to 0.08/level, cap meter-push momentum at x6. This preserves narrative arcs and small-chain value while preventing insurmountable advantage. Resolved: 0.08 with x6 cap.
- Unanimous verdict: **Conditional GO.** The condition is the blast legibility experiment (65% accuracy on trials 11-20). If blast force is learnable, the design occupies a competitive space no other game occupies. If not, pivot to Combo C.
