# Chain Reaction Competitive Design -- Round 4 Convergence

## Previously:

**Round 1 (Diverge):** 15 ideas generated. 10-criterion evaluation framework established with 3 non-negotiables. North Star: "Before you tap, what did you SEE that your opponent missed?"

**Round 2 (Challenge):** 7 ideas cut for non-negotiable failures. Self-critique narrowed to 3 standalone survivors (13, 3, 1) and 3 combinations. All agents converged on Explosion Billiards (13) + Tug-of-War (7) + Counter-Chain (3), turn-based alternation, shared board. Scored 9P/1~.

**Round 3 (Synthesis + Stress Test):** Facilitator resolved 5 structural tensions. Proposer wrote a full implementation spec with 28 parameters. Critic re-scored at 6P/4~ (down from 9P/1~), identifying blast force legibility as the existential risk. Stalemate, turtling, and first-mover effects analyzed. Three remaining questions raised: blast parameterization, momentum streak inclusion, counter-counter rallies.

---

## FACILITATOR -- Round 4 Final Recommendation

### 1. Remaining Disagreements

After three rounds, the Proposer and Critic are aligned on the core architecture (shared board, turn-based, tug-of-war meter, blast force, counter-chains). But three substantive disagreements remain. I will adjudicate each.

---

#### Disagreement 1: Does the Proposer's Spec Adequately Address Stalemate Risk?

**The Proposer's answer:** Escalating stakes (push multiplier grows 5% per turn after turn 20) + 40-turn match limit with tiebreaker + COUNTER_EFFICIENCY at 0.80 (turtles bleed 20% per exchange).

**The Critic's concern:** Equal-skill players produce a zero-sum oscillation where the meter never reaches either end. Center drift actively erases small advantages. The stalemate is structural, not parametric.

**My adjudication: The Proposer's mitigations are sufficient in combination, but each one alone is not.**

Here is why. The Critic is correct that center drift + perfect counters = stalemate. But the Proposer stacked three independent anti-stalemate mechanisms:

1. **COUNTER_EFFICIENCY at 0.80** means pure defense bleeds. Over 10 exchanges, a turtle loses ~15% of the meter. This alone breaks the "wait and counter forever" degenerate strategy. But it does not break the case where both players attack equally -- equal attacks cancel via counters, and the 20% bleed is symmetric, netting zero.

2. **Escalating stakes after turn 20** means late-game chains are amplified. At turn 30, pushes are 1.5x. At turn 40, 2.0x. This converts small skill edges into decisive advantages in the endgame. The Critic asked: "Does escalation help the trailing player or just accelerate whoever is ahead?" The answer is nuanced: escalation helps whichever player reads the board BETTER in the late game, regardless of current meter position. A trailing player with a superior read on a dense late-game board can launch a 7-chain at 2.0x escalation and swing 24% of the meter in one uncountered push. This is the comeback scenario. Conversely, the leading player can extend their lead. Escalation is neutral on meter position and amplifies skill -- which is exactly what a competitive game should do.

3. **40-turn hard cap with tiebreaker** is the honest admission that some matches between equal players will be close. Close games end decisively: whoever pushed the meter further wins. This is how pool handles equal skill -- the break shot and the first small mistake determine the outcome. Acceptable.

The three mechanisms interact: COUNTER_EFFICIENCY ensures defense alone loses. Escalation ensures late-game plays are decisive. The turn cap ensures the match ends. No single mechanism solves stalemate. Together, they make stalemate nearly impossible without making the game feel artificially forced.

**Verdict: Stalemate concern is adequately addressed. Ship with these three mechanisms. Tune COUNTER_EFFICIENCY (sweep 0.60-1.00) and ESCALATION_RATE (sweep 0.03-0.08) in simulation to find the range where matches reliably end by turn 30-35 rather than hitting the cap.**

---

#### Disagreement 2: Is the Critic's "60% of Tetris" Assessment Fair?

**The Critic's claim:** The design achieves roughly 60% of Tetris Zone Battle's offense/defense sophistication, 40% of Rocket League's prediction depth, and 50% of Pool's positional precision.

**The Proposer's implicit position:** The design is novel enough that percentage comparisons to 40-year-old games with decades of metagame refinement are misleading. The design occupies a space none of those games occupy.

**My adjudication: The Critic's percentages are fair as honest humility, but they are the wrong framing for a design decision.**

The percentages are useful as a reality check. They prevent us from deluding ourselves that we have reinvented Tetris on the first try. But they are useless as a go/no-go signal. Here is why:

- Tetris at launch in 1984 was roughly "30% of Tetris" by the Critic's methodology -- it had no garbage system, no T-spins, no Zone mechanic, no back-to-back bonuses, no combo chains. It had a field, 7 pieces, and line clears. The competitive depth came from 40 years of community discovery and iterative refinement. Our design at launch will also be at its simplest form. The question is not "is it as deep as Tetris today?" but "does the core structure PERMIT the depth to emerge?"

- Rocket League at launch was arguably "50% of Rocket League" by current standards -- no ceiling play meta, no flip resets, no wave dashes. The community discovered mechanics the developers did not intend. The physics was rich enough to permit it. Our question is the same: is the blast-force physics rich enough for players to discover techniques we have not imagined?

The answer to both questions is the same: **yes, if blast force is learnable.** The Critic's existential risk (blast legibility) is the real gate, not the percentage comparison.

**Verdict: The "60% of Tetris" framing is fair as humility but should not delay shipping. The design has structural room to grow. The core loop (blast + meter + counter) is rich enough that community-driven depth discovery is plausible. Ship, measure, iterate -- the same path every great competitive game followed.**

---

#### Disagreement 3: Is Momentum Streak Inclusion the Right Call or Scope Creep?

**The Proposer's position:** Momentum streak multiplies meter push, creating risk/reward depth (safe 3-chains maintain streak vs. risky 7-chains that might whiff and break it). Streak also gates Supernova (4 consecutive qualifying chains). The streak is an existing system in the solo game -- porting it to competitive is low-cost.

**The Critic's implicit concern (from Round 3 Uncertainty #5):** Momentum compounding may be too strong. At x8 with escalation, a 5-chain pushes 21% of the meter. The rich-get-richer dynamic could make the game feel like "whoever builds streak first wins."

**My adjudication: Include momentum in the core build, but with a reduced multiplier and a harder reset threshold.**

The momentum streak adds three things the game needs:

1. **Narrative arc.** Without streaks, every turn is an isolated decision: "what is the biggest chain on the board right now?" Streaks add temporal continuity: "I have been building toward this for 5 turns." The player's emotional investment grows with the streak. This is the difference between playing isolated hands of poker and playing a tournament.

2. **Small-chain value.** Without streaks, there is never a reason to fire a 3-chain when a 5-chain is available. With streaks, the 3-chain that maintains your x6 streak (effective push: 3-chain * 1.75 multiplier = equivalent of a raw 5-chain) is sometimes better than the risky 6-chain that might whiff and reset you to x1. This creates the "safe vs. ambitious" tension that makes decision-making interesting.

3. **Supernova gating.** Without streaks, Supernova needs a different charge mechanism. Streaks are the most natural gate: prove you can chain consistently 4 times in a row, and you earn the 3-tap burst. This rewards consistency over variance.

However, the Critic is right about compounding risk. The proposed MOMENTUM_METER_MULT of 0.15 per level means x10 momentum gives a 2.35x multiplier. Combined with escalation at 2.0x (turn 40), that is an effective 4.7x multiplier on raw chain push. A 5-chain under those conditions pushes 34% of the meter. That is too much -- a single good chain at max streak + max escalation wins the game outright.

**The fix: Reduce MOMENTUM_METER_MULT from 0.15 to 0.08, and cap effective momentum for meter push at x6 (even if the streak counter goes higher for Supernova tracking).** At 0.08 per level, x6 momentum gives a 1.40x multiplier. Combined with late-game escalation at 1.5x (turn 30), that is 2.1x -- a 5-chain pushes ~15% of the meter. Significant but not game-ending from a single chain. The streak still rewards consistency, still gates Supernova, still creates narrative arcs, but does not compound into an insurmountable advantage.

**Verdict: Momentum is core, not scope creep. Reduce the multiplier to 0.08/level, cap meter-push momentum at x6. Ship it, sweep the parameter, adjust.**

---

### 2. Final Recommendation: THE Design

This is not a menu. This is the one answer.

---

#### BUILD (the core that must ship)

**1. Blast Force Physics.**
This is the design's identity. Without it, the game is "tug-of-war with chains" -- a dressed-up version of rejected Idea 7. Blast force is what makes every tap simultaneously an attack (meter push), a defensive setup (repositioning your future chains), and a disruption (scattering the opponent's formations). The Proposer's spec (Section 1.4) is the implementation target: radial impulse, inverse-power falloff (BLAST_N = 1.5), type-specific resistance (gravity heavy, volatile light), per-dot displacement cap (120px).

**Minimum for blast to work:** Dots near an explosion must visibly relocate 30-60px on a phone screen. The player must be able to say "the explosion pushed those dots over there" within 2 games. If this does not happen, increase BLAST_K until it does.

**2. Tug-of-War Meter.**
The win condition. Thin vertical bar on the left edge. Push proportional to chain size. Center drift between turns. Danger zone glow near the extremes. Match ends when the meter reaches either end or after 40 turns (tiebreaker: meter position).

Ship with: METER_BASE = 0.008, METER_EXPONENT = 1.4, METER_DRIFT_PER_SEC = 0.005, FIRST_TURN_OFFSET = 0.05.

**3. Turn-Based Alternation.**
Strict A-B-A-B. One tap per turn. Dots keep moving between turns (the board is never frozen). Shot clock: 10 seconds in ranked, no limit in casual. This resolves the shared-board paradox, preserves deterministic depth, and prevents the game from becoming a reaction-speed test.

**4. Counter-Chain System.**
When a chain produces a push above COUNTER_THRESHOLD (0.015), a push wave animates on the meter over WAVE_TRAVEL_MS (1500ms). During this window, the opponent can fire a counter-chain. Counter-tap consumes the opponent's turn. COUNTER_EFFICIENCY = 0.80 (counters cancel 80%, not 100%). No counter-counter rallies -- one exchange per cycle, then turns alternate normally. Small pushes (below threshold) resolve instantly with no counter window.

**5. Escalating Stakes.**
After turn 20 (halfway), all meter pushes are multiplied by `1.0 + (turn - 20) * 0.05`. This ensures matches converge toward a decisive outcome in the final third. Combined with COUNTER_EFFICIENCY < 1.0 and the 40-turn cap, this eliminates stalemate.

**6. Momentum Streak (reduced).**
Existing streak system, ported to competitive. Consecutive chains of 3+ build momentum (x1 to x10). Meter push multiplied by `1 + (min(momentum, 6) - 1) * 0.08`. Chain < 3 resets momentum. Chain == 0 (whiff) incurs a 0.02 meter penalty toward the whiffing player. This creates the risk/reward tension and gates Supernova.

**7. Visual Feedback: Three Layers.**
- Blast ring: expanding shockwave ripple from each explosion, 0.3s duration. Shows force radius.
- Dot trails: pushed dots show a short motion trail (0.5s) in the pushing player's color. Causal link visible.
- Cluster glow: 3+ same-type dots pushed into chain proximity pulse briefly. Signals "this is now chainable."

These are pure feedback, not new mechanics. They make blast force legible without adding rules.

---

#### DEFER (add after the core proves fun)

**1. Supernova in Competitive.**
Supernova (3-tap burst after 4 consecutive qualifying chains) is the most exciting mechanic in the spec, but it is also the most complex. It introduces a resource to manage, a burst turn with different rhythm, and potential balance issues (the Kael vs. Zara scenario shows a Supernova swing of 38% from a trailing position -- exciting but potentially feels unfair). Defer Supernova until the core loop (blast + meter + counter) has been validated as fun in isolation. If the core is too flat without Supernova, add it. If the core is compelling, Supernova becomes the first post-launch depth expansion.

**Why defer and not cut:** Supernova is the Tetris Effect Zone analog -- the "save your ultimate for the right moment" mechanic that creates climactic peaks. The design NEEDS it eventually. But it should not be in the first playtest because it obscures whether the core loop works.

**2. Competitive Tiers (CASUAL / FLOW / SURGE / MASTER).**
The Proposer spec defines 4 tiers with different spawn rates, dot type distributions, and boid schooling parameters. Ship with one tier (CASUAL: standard dots only, no schooling, slow speed). Add FLOW when matchmaking has enough players to split the pool. Add SURGE and MASTER as ranked progression gates.

**Why defer:** Tier differences are tuning, not design. The core mechanics are identical across tiers. Getting one tier right is hard enough. Four tiers at launch quadruples the testing surface.

**3. AI Opponents.**
The Proposer spec defines three AI difficulty levels (Greedy, Counter-Aware, Oracle). Defer AI until the core PvP loop is validated. For initial playtesting, use human vs. human (or human vs. replay ghost). AI opponents are important for the PvP-AI-zen pipeline but are an engineering investment (especially the Oracle bot that models blast trajectories).

**4. Async / Pass-and-Play.**
Turn-based alternation naturally supports asynchronous play (take your turn, opponent takes theirs later). But async introduces a notification system, persistence layer, and "board state changed while you were away" UX challenges. Defer until real-time PvP proves the game is fun.

**5. Audio as Competitive Feedback.**
The Facilitator's Round 2 observation that audio has been treated as decoration, not design, still stands. The idea of musical consonance when evenly matched and dissonance when dominated is compelling. But it is a polish layer that requires the core game to exist first. Defer until the visual game works.

---

#### CUT (elements that seemed good but do not belong)

**1. Garbage Systems (Ideas 1, 2, 3 as standalone, 4, 8; Combo A).**
The shared board eliminates the need for garbage entirely. Pressure transfer is the meter push. Disruption is blast force. Defense is the counter-chain. Three functions, zero new dot types, zero readability overhead. Every garbage variant adds visual noise, mode-specific rules, and split-board requirements that fight the billiards identity.

The counter-chain borrows Idea 3's timing-window mechanic, so the best part of garbage-based defense is already absorbed into the core design. The rest of the garbage infrastructure is dead weight.

**2. Territory / Zones (Idea 9).**
The Facilitator flagged this in Round 2: it imposes a discrete grid onto a continuous physics simulation. It fights the game's fluid identity. It requires an opponent (weak mode portability). It was the most overrated idea in the brainstorm. Cut with no regret.

**3. Counter-Counter Rallies.**
The Proposer already declined this in the spec ("No counter-counter rallies"). I confirm: one exchange per cycle. Rallies would extend match length unpredictably, reward reaction speed over reading depth, and make the game incomprehensible to spectators. The drama of a single counter moment -- "do I counter or eat the push?" -- is more legible and more tense than a back-and-forth volley where both players counter reflexively.

**4. Player-Colored Dots / Dot Ownership.**
All dots on the shared board are unowned. There are no "my dots" and "your dots." Player identity is expressed only through explosion color, trail color, and meter position. This is critical: dot ownership would require a second visual encoding on every dot (outline? glow? hue shift?), which competes with type-encoding (standard/gravity/volatile) and state-encoding (cluster glow, trail). The board's visual language is already at capacity. Adding ownership would break it.

**5. Manual Supernova Activation.**
If Supernova is eventually added (per DEFER), it should activate automatically when the 4th charge fills. Manual activation introduces a second input type (a button press that is not a board tap), violating One-Tap Fidelity. The strategic depth of "when to activate" is already embedded in streak management: you choose when to maintain vs. break your streak, and the Supernova fires as a consequence of your consistency. No button needed.

---

### 3. The Elevator Pitch

**Chain Reaction: Billiards Mode** is a turn-based competitive game where two players share one board full of drifting, flocking dots. On your turn, you tap once -- your explosion catches nearby dots for points and pushes surviving dots across the board, reshaping the battlefield for your opponent's next move. You win by pushing a tug-of-war meter to the opponent's end, but every push opens a counter-window where your opponent can fire back -- so the deepest skill is not finding the biggest chain, but finding the tap that scores AND leaves the board in the worst possible state for the other player.

---

### 4. Minimum Viable Playtest: The Blast Legibility Experiment

The Critic identified the ONE thing that could kill this design: **players cannot learn to read blast outcomes.** Everything depends on this. The smallest possible experiment to test it:

---

#### What to Build

A single-screen test mode layered onto the existing solo continuous engine. No meter. No turns. No opponent. No counter-chains. Just:

1. The existing continuous mode board (dots spawning, flocking, drifting).
2. Blast force enabled (BLAST_K = 0.8, BLAST_N = 1.5, BLAST_RANGE_MULT = 2.0).
3. The three visual feedback layers (blast ring, dot trails, cluster glow).
4. A "prediction prompt" overlay.

#### The Test Protocol

1. Board runs for 5 seconds to reach a natural state (~20 dots, some clusters forming).
2. The game pauses. A crosshair appears at a specific position (the proposed tap point). A nearby cluster of 3-5 dots is highlighted.
3. The player is asked: **"After the explosion, will the highlighted cluster be TIGHTER or MORE SPREAD OUT?"** Two buttons: TIGHTER / SPREAD OUT. (Binary choice -- simplest possible prediction task.)
4. The player taps their answer. The game unpauses. The explosion fires. The blast resolves. The cluster's post-blast state is shown with a brief highlight.
5. Result: CORRECT or INCORRECT. Shown for 1 second.
6. Repeat 20 times. Plot accuracy per trial.

#### What Success Looks Like

- **Trials 1-5:** Accuracy near 50% (random guessing). The player has no model of blast physics yet.
- **Trials 6-10:** Accuracy rises to 55-60%. The player is forming a rough intuition ("close dots spread, far dots barely move").
- **Trials 11-20:** Accuracy reaches 65-75%. The player can reliably predict simple blast outcomes.

**Pass threshold: 65% accuracy on trials 11-20.** This means the physics is learnable. The intuition improves with exposure. The billiards design is viable.

**Fail threshold: Accuracy stays below 55% across all 20 trials.** This means the physics is too chaotic or too subtle for humans to read. If this happens, the response is:

1. Reduce dot count (15 instead of 20) to lower cognitive load.
2. Weaken boid flocking (halve cohesion and alignment forces) so post-blast behavior is more ballistic, less flock-mediated.
3. Increase BLAST_K so displacement is more dramatic and more visible.
4. Re-run the test. If it still fails, the blast-billiards design is not viable for human play, and we pivot to the Proposer's fallback: Combo C (Counter-Billiards Overflow), which relies on survival management rather than positional prediction.

#### What NOT to Build for This Test

- No meter. The meter tests whether the win condition works, not whether blast is readable.
- No turns. Turn alternation tests competitive flow, not blast legibility.
- No opponent. Opponent interaction tests strategic depth, not perceptual skill.
- No momentum, no Supernova, no counter-chains. All of these are meta-layers on top of blast physics. Test the foundation first.

#### Engineering Cost

This is approximately 3 additions to the existing solo continuous mode:

1. `applyBlastForce()` function in the physics loop (the Proposer's Section 1.4 code, ~30 lines).
2. Three visual effects (blast ring = CSS radial animation, dot trails = per-dot position history buffer, cluster glow = proximity detection + opacity pulse).
3. The prediction prompt overlay (pause, crosshair, binary question, result display, accuracy tracking).

Estimated effort: 4-8 hours. This is the cheapest possible experiment that answers the most important question in the design.

---

### 5. Summary: The Path Forward

| Step | Action | Duration | Gate |
|------|--------|----------|------|
| 1 | Build blast force + visual feedback in solo mode | 4-8 hours | -- |
| 2 | Run blast legibility test (20 trials, 3-5 humans) | 1-2 hours | 65% accuracy on trials 11-20 |
| 3 | If PASS: Build tug-of-war meter + turn alternation | 8-16 hours | -- |
| 4 | If PASS: Build counter-chain system | 4-8 hours | -- |
| 5 | Playtest full competitive loop (human vs. human) | Ongoing | Fun? Stalemate rare? Matches < 3 min? |
| 6 | Tune: sweep BLAST_K, COUNTER_EFFICIENCY, METER_BASE, ESCALATION_RATE | Ongoing | Parameter convergence |
| 7 | If core loop validated: Add momentum streak | 2-4 hours | Does streak improve decision depth? |
| 8 | If streak validated: Add Supernova | 4-8 hours | Does Supernova create climactic moments without feeling unfair? |
| 9 | If full system validated: Add AI opponents, tiers, async | Weeks | Market readiness |

The gate between steps 2 and 3 is the only binary go/no-go in the entire plan. Everything after step 2 is iterative tuning. The design is right or wrong based on one empirical question: **can humans learn to read blast-scatter patterns?**

Build the test. Run it. Then we know.

---

*Round 4 Facilitator recommendation complete. One design. One gate. One test. Round 5 is implementation planning -- or pivot, depending on the test result.*

---

## CRITIC -- Round 4 Final Verdict

---

### 1. GO or NO-GO?

**Conditional GO.**

The design is ready for implementation -- of a prototype, not a product. The distinction matters. Three rounds of brainstorming have produced a design with zero structural failures against all three non-negotiable criteria, a clear competitive identity that no other game occupies ("physics billiards with chain reactions on a shared board"), and a specification detailed enough to code from (the Proposer's Round 3 spec includes literal JavaScript for the blast force function and parameter tables with sweep ranges). Further brainstorming will not resolve the remaining uncertainties because those uncertainties are empirical. They require building and testing, not designing and debating.

The Facilitator's Round 4 recommendation aligns with my assessment: build the blast physics, run the human prediction test, and let the data decide. I endorse the Facilitator's implementation path (Steps 1-9) and the binary gate between Steps 2 and 3. I will add my own conditions, risk register, and honest comparisons below.

**The three conditions that must be true for this design to succeed:**

**Condition 1: Blast force must produce learnable patterns in under 10 matches.**

The entire design's competitive identity depends on players developing intuition for how blast force repositions surviving dots. If this intuition does not form, the game is "Tug-of-War with chains" -- which is Idea 7, the idea that every agent rated as clean but shallow. The billiards layer IS the game. Without it, there is no positional play, no "setup payoff," no multi-turn planning, no answer to the North Star question beyond "I see the biggest cluster."

The Facilitator's blast legibility test (20-trial binary prediction task) is the right experiment. My pass threshold is 65% accuracy on trials 11-20, consistent with what I stated in Round 3. The Proposer asked whether 60% would be sufficient. My answer: 60% means the player is right 3 out of 5 times. That is not intuition -- it is a coin flip with a slight bias. At 60%, the player will attribute correct predictions to luck and incorrect ones to randomness. At 65%, the player starts to feel "I knew that would happen." At 70%, the player starts making decisions based on blast prediction. The difference between 60% and 65% is the difference between a decorative mechanic and a strategic one.

If accuracy reaches 70%+ on simple blasts (single explosion, 5 nearby dots) but only 55% on cascade blasts (multiple explosion sources from gen-4 chains): implement the single-blast-per-dot simplification the Critic proposed in Round 3. Only the closest explosion applies force to each surviving dot. This reduces cascade blasts to effectively simple blasts, preserving the learnable layer while sacrificing theoretical multi-blast richness. The richness can be restored later if players demonstrate they can handle it.

**Condition 2: The counter-chain decision must be genuinely marginal at least 40% of the time.**

The Proposer's decision tree (Round 3, Section 1.6) is the heart of the competitive game. When a push wave arrives, the defender chooses: (a) counter now with available chain, (b) absorb and use turn proactively, or (c) counter with something bigger. If the right choice is always obvious -- always counter because it is free, or never counter because it is futile -- the game degenerates.

COUNTER_EFFICIENCY at 0.80 is calibrated to make this decision marginal. Countering cancels 80% of the incoming push but costs your turn (you react to the board instead of choosing your optimal play). The Proposer calculated that a 3-chain counter against a 5-chain attack cancels 0.030 of 0.073 (41% of the attack). Is that worth spending your turn? It depends on what else you could have done -- which is a board-dependent judgment, not a formulaic answer. This is exactly the kind of uncertainty that creates interesting decisions.

The test: in playtested matches, measure the "counter rate" -- what percentage of danger windows produce a counter-tap? Target: 30-60%. Below 30% means countering is seen as futile. Above 60% means countering is reflexive (no real decision). At 30-60%, players are making genuine choices based on board state, meter position, and opportunity cost.

The Proposer asked whether 0.80 is sufficient to discourage turtling. My analysis: over 10 exchanges against average 5-chain attacks, a pure turtle bleeds 14.6% of the meter. Over 10 exchanges against average 3-chain attacks, a pure turtle bleeds 7.4%. Combined with escalating stakes (which amplify the bleed in the second half), pure turtling is structurally losing. But "structurally losing" and "obviously losing" are different. A turtle might bleed slowly enough to feel viable for 20 turns before the escalation catches up. If playtesting shows turtling is stubbornly persistent, add a passivity penalty: no proactive attack for 3 consecutive turns triggers a 2x drift rate toward the passive player. This punishes turtling directly without affecting normal play. But try 0.80 first -- the math suggests it is sufficient.

**Condition 3: Matches between similarly skilled players must resolve in 60-150 seconds.**

The stalemate concern (Round 3, failure mode 1A) is the most serious structural risk after blast legibility. The escalating stakes mechanic is the primary defense. The Facilitator's adjudication is sound: three independent anti-stalemate mechanisms (COUNTER_EFFICIENCY < 1.0, escalating stakes, turn cap with tiebreaker) interact to make stalemate nearly impossible. But "nearly impossible" is a claim about parameter interactions that have not been simulated.

The 60-150 second window is non-negotiable for mobile. Under 60 seconds: the game feels trivial, strategy is shallow, matchmaking is harder than the match. Over 150 seconds: players will not start matches in idle moments, which is the primary use case for a mobile game. The Proposer's target of 30-60 turns (60-120 seconds at 2-4 seconds per turn) is reasonable. The simulation harness can validate this by running thousands of bot matches and measuring the turn-at-which-match-ends distribution. If more than 30% of matches hit the 40-turn cap between equal-skill bots, the parameters need adjustment. Increase METER_BASE, increase ESCALATION_RATE, or decrease COUNTER_EFFICIENCY until the distribution shifts earlier.

---

### 2. The Honest Comparison: 6P/4~ vs. Tetris From Scratch

In Round 3, I scored the converged design 6 Pass / 4 Partial / 0 Fail and noted this was "significantly more uncertainty than Round 2 suggested." The Facilitator asked whether this is fair and whether it should delay shipping. Let me answer by applying the same framework to Tetris -- not modern Tetris Effect, but the original 1984 game evaluated as a new proposal.

**Tetris (1984, evaluated from scratch against the 10-criterion framework):**

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | N/A | Tetris has 4+ inputs (left, right, rotate, drop). This criterion is Chain Reaction-specific. Excluding from comparison. |
| 2 | Deterministic Depth | PASS | Piece sequence determined by RNG seed. Same sequence + same placements = same board state. |
| 3 | Prediction Ceiling | PASS | Expert reads: "place I-piece to clear 4 lines, then T-piece tucks under the overhang, then..." Multi-step planning with deterministic outcomes. Unbounded ceiling in principle. |
| 4 | Dual-Purpose Action | PASS (1989+) / FAIL (1984) | In 1984 solo Tetris, line clearing is pure survival. Dual-purpose (defense + garbage offense) arrived with competitive modes in the late 1980s. The original game would FAIL this non-negotiable criterion as a competitive proposal. |
| 5 | Readable Battlefield | PASS | 10x20 grid. Filled cells visible. Stack height = danger level. Immediately legible. One of the most readable game states ever designed. |
| 6 | Puyo Setup Payoff | PARTIAL (1984) / PASS (modern) | Original Tetris had no T-spins, no back-to-back bonuses, no combo system. "Setup" was limited to leaving a well for I-pieces. The deep setup payoff that modern Tetris is famous for was community-discovered over decades. A 1984 evaluator would score this PARTIAL: some setup exists but the space is shallow. |
| 7 | Mode Portability | PASS | Marathon, Sprint, versus -- the core (field + pieces + gravity + line clear) is identical across all modes. Meta-layers change. This was true from day one. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Tetris was designed for physical buttons. Touch Tetris requires compromises (swipe controls, virtual d-pad). Adequate but not native. |
| 9 | Comeback Mechanics | PARTIAL (1984) | Original Tetris had no garbage cancellation, no Zone, no T-spin counter. Competitive comeback was limited to "clear lines faster than your opponent sends garbage." Structural comeback mechanics were added in later versions. |
| 10 | Spectacle Proportionality | PARTIAL (1984) / PASS (modern) | Original Tetris: line clear = rows flash and disappear. Effective but modest. Tetris Effect: line clear = musical crescendo + particle explosion + haptic feedback. The spectacle was built over 40 years. |

**1984 Tetris score (excluding C1): 4 Pass / 4 Partial / 1 Fail.**

Read that again. **Original Tetris, the most successful puzzle game ever made, would score 4P/4~/1F against this framework.** It would FAIL the dual-purpose non-negotiable because competitive modes did not exist yet. It would earn 4 partials because the deep mechanics (T-spin setup, combo chains, Zone, spectacle layers) had not been discovered or invented.

**Our design scores 6P/4~/0F.** No failures. Two more passes than 1984 Tetris. And our four partials are empirical questions (blast legibility, visual load, human prediction bandwidth, stalemate tendency), not missing features.

This does not mean our design is better than Tetris. It means that evaluating an unbuilt design against mature reference games is inherently conservative. Every game starts incomplete. The question is not "does it match the gold standard today?" but "does the core structure permit the depth to emerge with iteration?" Tetris's core (field + pieces + gravity + line clear) was rich enough that 40 years of community discovery and developer refinement turned 4P/4~/1F into one of the greatest competitive games ever made.

Is our core (shared board + blast force + tug-of-war + counter-chain) rich enough for analogous growth? I believe yes, contingent on blast legibility. The blast physics creates second-order, third-order, and nth-order consequences from every tap. The shared board means those consequences affect both players. The counter-chain creates timing decisions. The momentum streak creates narrative arcs. Each layer compounds the others. This is the "emergent complexity from simple rules" pattern that characterizes great game systems.

**6P/4~ is good enough to build a prototype. It is not good enough to ship a product.** The prototype's job is to resolve the four partials. If they resolve as passes, the design is at 10P/0~/0F and ready for production. If one or two resolve as fails, we know exactly what to fix. If all four resolve as fails, we pivot. The brainstorm has done its job: it produced a testable hypothesis with a clear falsification criterion.

---

### 3. The One Thing I Changed My Mind About

**In Round 1, I believed that split boards were necessary for competitive Chain Reaction.**

My evaluation framework was built on the assumption that competitive puzzle games require separate playfields. Criteria 5 (Readable Battlefield) and 8 (Mobile-Native Ergonomics) both implicitly assumed split screens. Every gold standard I referenced -- Tetris, Puyo Puyo, Puzzle Fighter -- uses split boards. My non-negotiable criterion 4 (Dual-Purpose Action) was conceived as "action on your board affects their board," which presupposes two boards.

The Facilitator's resolution of Tension A in Round 3 changed my mind. The key insight: turn-based alternation eliminates the simultaneity problem that makes shared boards degenerate into reaction-speed contests. When it is your turn, you are the only person tapping. The shared board is not just acceptable; it is ESSENTIAL. The entire billiards analogy depends on both players interacting with the same dots. Your blast reshapes the table your opponent must play. Their blast reshapes the table you must read. Split-board billiards (Combo A) would feel like two people playing pool on separate tables and mailing each other disruption packages. The competitive soul of this design lives in the shared board.

What surprised me most was that the shared board actually IMPROVES readability (criterion 5) rather than degrading it. One board, full screen, all dots visible, no split-screen compression from 390x844 to 195x422. The Facilitator's Tension B (garbage legibility) evaporated entirely because shared-board billiards needs no garbage system. The tug-of-war meter and blast force handle pressure transfer without adding any new visual elements to the playfield. The shared board is simultaneously simpler, more legible, and more strategically rich than split boards.

I was reasoning from precedent rather than from the specific physics of this game. Chain Reaction is not Tetris. Its continuous physics, one-tap interaction, and boid flocking create a game that is more like pool than like puzzle fighters. And pool does not need split tables.

---

### 4. Answering the Proposer's Questions

The Proposer asked three direct questions for the Critic in Round 3. I address each.

**Q1: Is COUNTER_EFFICIENCY at 0.80 sufficient to structurally discourage turtling?**

Addressed in Condition 2 above. Short answer: yes, in combination with escalating stakes and the natural disadvantage of reactive play on a moving board. The turtle bleeds 20% per exchange, faces escalating stakes in the second half, and plays on a board that was sculpted by their opponent's blast. If simulation shows turtling is still viable, lower to 0.75 or add a passivity penalty. But 0.80 is a sound starting point.

**Q2: What is the minimum acceptable accuracy improvement in the blast prediction test? Would 60% be sufficient? What about 70% on simple blasts but 55% on cascades?**

Addressed in Condition 1 above. Short answer: 65% overall is the floor, not 60%. At 60%, players are slightly better than chance -- that is not intuition, it is noise. At 65%, the signal is real. For the split scenario (70% simple / 55% cascade): acceptable only if cascades are rare (less than 30% of blast events). Implement single-blast-per-dot simplification to collapse cascade blasts to simple ones if needed.

**Q3: Does escalation actually help the trailing player, or does it just accelerate whoever is ahead?**

Escalation is neutral on meter position. It amplifies the consequences of every chain, regardless of who is leading. A trailing player benefits because fewer successful exchanges are needed to close the gap. A leading player benefits because their lead becomes harder to overturn. The net effect: escalation rewards the player who reads the board BETTER in the late game, not the player who happens to be ahead. This is desirable -- competitive games should reward skill, not punish the leader or the trailer.

The actual comeback mechanism is the counter-chain, not escalation. A trailing player who reads the board well and fires a strong counter during the escalation phase can swing 15-20% of the meter in a single exchange. Escalation amplifies that swing. The comeback path is: absorb early disadvantage, find a strong counter opportunity in the escalated endgame, swing the meter. This is structurally sound.

I recommend one additional anti-snowball mechanism: progressive drift. Instead of flat drift (0.005/s toward center regardless of meter position), make drift proportional to distance from center. The further the meter is from center, the faster it drifts back. Formula: `drift_rate = METER_DRIFT_PER_SEC * (1 + |meter_value| * 2)`. At center (meter = 0), drift is 0.005/s. At danger zone (meter = 0.80), drift is 0.013/s. This makes large leads expensive to maintain: the leader must keep attacking to overcome the drift. The trailer gets more breathing room as the deficit grows. Combined with escalation, this creates a game where large leads are possible but unstable, and comebacks are always structurally viable.

---

### 5. Risk Register

The top 5 risks for the converged design, ranked by severity (probability x impact).

---

#### Risk 1: Blast-Scatter Patterns Are Not Human-Learnable

**Description:** Players cannot develop intuitive predictions for how blast force repositions surviving dots. The interaction of radial impulse, boid flocking forces, multiple simultaneous dots, and cascade accumulation creates outcomes that appear random to human perception. The billiards layer -- the design's core innovation and competitive identity -- does not exist in practice.

**Probability:** Medium. Analogies to pool, Angry Birds, and bowling suggest humans can learn radial-force prediction. But those games involve 1-3 objects. Our game involves 10-40 objects with flocking interactions. The cognitive load scaling from 1 object to 15+ is the unknown. Boid flocking adds a non-ballistic post-blast behavior that has no analog in pool or Angry Birds.

**Impact:** Critical. If this fails, the design collapses to "Tug-of-War with chains" (Idea 7 standalone), which scored 3/5 on the North Star question and failed to distinguish itself from generic competitive puzzle games. The game loses all three advantages (prediction ceiling, setup payoff, multi-layer reading) that justify building competitive mode at all.

**Mitigation:** (1) Simplify: reduce dot count (cap at 20), weaken boid flocking (halve cohesion/alignment), increase blast force for more dramatic and readable displacement. (2) Single-blast-per-dot: only the closest explosion pushes each surviving dot, eliminating cascade accumulation chaos. (3) Blast preview: 0.3s ghost trajectory overlay. Last resort due to visual noise. (4) If all simplifications fail: pivot to Combo C (Counter-Billiards Overflow).

**Test:** The Facilitator's 20-trial binary prediction protocol. 5 playtesters, no prior exposure. Pass: 65%+ accuracy on trials 11-20.

---

#### Risk 2: Stalemate Between Equal Players

**Description:** Two similarly skilled players produce matches that consistently go to the 40-turn limit and are decided by tiebreaker rather than decisive meter push. The meter oscillates near center because counter-chains cancel pushes, center drift erases small advantages, and neither player builds a decisive lead. Matches feel inconclusive.

**Probability:** Medium-High. Three anti-stalemate mechanisms are in place (COUNTER_EFFICIENCY < 1.0, escalating stakes, turn cap). But their interaction is nonlinear and untested. The combination SHOULD prevent stalemate, but "should" is not "does."

**Impact:** High. Stalemate kills competitive engagement. If matches between equal players feel like coin flips resolved by tiebreaker, ranked play is meaningless. Players will stop caring about individual matches. The game cannot sustain a competitive community.

**Mitigation:** (1) Progressive drift (drift rate proportional to distance from center). (2) Counter efficiency degradation under escalation (drop from 0.80 to 0.70 after turn 20). (3) Sudden death at turn 36: no counter windows, all pushes instantaneous. (4) Parameter sweep: simulate 1000 equal-bot matches, measure turn-at-match-end distribution. Target: 70%+ decisive before cap.

**Test:** Bot simulation. Equal-skill bots (greedy vs. greedy; oracle vs. oracle). 1000 matches per parameter set. Measure percentage ending by turn limit. Sweep COUNTER_EFFICIENCY (0.60-1.00), ESCALATION_RATE (0.03-0.08), METER_BASE (0.004-0.016). Find the parameter region where less than 30% of matches reach the 40-turn limit.

---

#### Risk 3: Blast Force Sweet Spot Does Not Exist

**Description:** There is no value of BLAST_K where blast force is simultaneously strong enough to create meaningful repositioning AND weak enough to preserve board structure between turns. Low BLAST_K: billiards is decorative, dots barely move, the game collapses to Idea 7. High BLAST_K: every chain scatters dots to near-uniform distribution, board resets after every turn, no positional continuity, no "running the table."

**Probability:** Low-Medium. The inverse-square falloff creates a natural gradient (close dots move far, distant dots barely move). This should produce a viable range. But boid flocking may compress or expand that range unpredictably. Cohesion forces might pull blast-pushed dots back to their original positions within 1 second (negating blast), or amplify the displacement by triggering flocking cascades (making blast chaotic).

**Impact:** High. Without a sweet spot, the core mechanic does not function. The design cannot be "physics billiards" if the physics does not admit controllable, predictable repositioning.

**Mitigation:** (1) Blast damping period: reduce boid flocking forces to 50% for 0.5s after a blast, allowing dots to reach their blast-determined positions before flocking reasserts. This widens the sweet spot. (2) Sweep BLAST_K x BLAST_N x boid_cohesion simultaneously in the simulation harness. Measure "positional retention" -- what percentage of blast displacement survives after 2 seconds of flocking? Target: 40-70%.

**Test:** Add blast force to solo mode. Sweep BLAST_K from 0.3 to 2.0 in 0.1 increments. For each value, run 100 simulated turns. Measure mean dot displacement at t=0 (immediate), t=1s (post-flocking), t=2s (steady state). Plot retention ratio (t=2s / t=0). The sweet spot is the BLAST_K range where retention is 40-70% and mean displacement at t=0 is 30-80px on phone viewport. If no range satisfies both criteria, add blast damping and re-sweep.

---

#### Risk 4: First Impression Is "Boring Tug-of-War"

**Description:** The blast physics -- the feature that makes this design special -- is invisible to new players for 5-10 matches. During that period, the game presents as "tap clusters, watch meter move, take turns." This is the rejected Idea 7. If player retention drops below 20% before match 5, the majority of players never discover the billiards layer. The game has a "depth discovery" problem: the surface experience does not communicate the depths below.

**Probability:** Medium. The Proposer's Scenario 1 acknowledges this openly. The novice experience is the weakest part of the design. The 60-second skill revelation is "I tapped, the bar moved" -- not "I saw that my blast repositioned dots for a future chain." The billiards revelation is a level-2 discovery.

**Impact:** Medium-High for commercial viability, Low for competitive viability. Players who persist past 5-10 matches will discover the billiards layer and the game deepens dramatically. But mobile games are unforgiving: if the first session is not compelling, most players do not return. This risk does not kill the competitive design; it kills the player pipeline that feeds the competitive design.

**Mitigation:** (1) Solo zen as default onboarding: first experience is solo continuous mode with blast force, zero competitive pressure. Let players discover blast positioning organically. (2) A scripted 15-second tutorial: "Watch this" -- one blast that visibly creates a chain opportunity, then the player taps it. Two taps, one lesson: "blasts create new opportunities." (3) Prominent blast visual feedback from turn 1: the blast ring and dot trails must be visually striking enough that even inattentive players notice something happened after the explosion. The trails should be the visual signature of the game.

**Test:** 10-player first-time playtest. 5 with no tutorial (jump straight to competitive), 5 with tutorial + solo zen warm-up. Measure turns-until-first-intentional-blast-positioning (the player fires a small chain specifically to push dots, not to catch dots). If the tutorial group reaches this milestone 3x faster, ship the tutorial.

---

#### Risk 5: Counter-Chain Window Degenerates to Reaction Speed

**Description:** The 1.5-second danger window becomes a reflex test rather than a reading challenge. Optimal counter play is "find any 3+ chain within 1.5 seconds and tap it" rather than "evaluate whether countering here is better than absorbing the push and playing proactively." The nuanced decision (counter/absorb/counter-big) collapses to a binary (counter immediately / miss the window). This violates Anti-Pattern #1 ("physics tempo must reward patience over frantic tapping").

**Probability:** Low-Medium. The 1.5-second window is generous (fighting game counter windows are 83-250ms). But finding a 3+ chain on a board with 25-35 moving dots within 1.5 seconds requires rapid visual search. If the search itself consumes most of the window, there is no time left for the strategic evaluation (is this counter WORTH firing?).

**Impact:** Medium. If countering becomes reflexive, the mechanic still functions (defense exists, turtling is punished). But the strategic depth is reduced. The counter decision -- the "heart of the competitive game" per the Proposer -- becomes automatic rather than thoughtful. The game is shallower than designed.

**Mitigation:** (1) Increase WAVE_TRAVEL_MS to 2000-2500ms. More time means more reading, less reflex. (2) Slow-motion during danger window: dots move at 25% speed, giving the defender more time to read a quasi-static board while preserving the "dots in motion" principle at reduced tempo. This also creates a satisfying dramatic effect (the world slows down during the counter moment). (3) Pre-read time: the chain resolution phase (attacker's cascade + blast) takes 1-2 seconds before the wave formally starts. The defender can begin reading the post-blast board during this phase, effectively extending the read window to 3-4 seconds.

**Test:** Measure correlation between counter-tap speed and match win rate. If players who counter in under 0.5 seconds win significantly more than players who counter in 1.0-1.4 seconds, the window rewards speed over accuracy. Target: win rate should correlate with counter-chain SIZE (quality of the counter), not counter-chain LATENCY (speed of the counter).

---

### 6. Final Assessment

This is the most honest assessment I can give after four rounds of increasingly rigorous examination.

The converged design -- Explosion Billiards with Tug-of-War meter and Counter-Chains, turn-based alternation on a shared board -- is a strong hypothesis for a competitive game that would occupy a space no other game currently fills. It satisfies all three non-negotiable criteria with no structural concerns. Its four partial scores are empirical questions that can only be resolved by building and testing. Its five identified risks each have concrete mitigations and falsifiable test protocols.

The design is not guaranteed to work. The existential risk (blast legibility) is real and the probability is not trivial. But the cost of the test is low (4-8 hours of engineering per the Facilitator's estimate) and the information value is decisive. Either humans can learn to read blast patterns (the design works) or they cannot (the design pivots). There is no ambiguous middle ground that would require further brainstorming.

The brainstorm has done its job. It started with 15 ideas, killed 12, combined the surviving 3 into a coherent system, stress-tested that system against 5 failure modes, scored it against 10 criteria, compared it honestly to 4 gold-standard reference games, specified it to parameter-level precision, and produced a falsifiable experiment to validate the one thing that theory cannot answer.

Build the prototype. Run the blast legibility test. If it passes, build the competitive mode. If it fails, pivot to Combo C. Either way, the next step is code, not conversation.

---

*Round 4 Critic verdict complete. Conditional GO. Five risks registered. One existential test. The design is as mature as theory permits. Now build it.*

---

## PROPOSER -- Round 4 Final Defense

### 1. Responding to the Critic's Five Failure Modes

---

#### 1A. Equal Skill Stalemate -- ACCEPT. Fix: progressive drift reduction.

The Critic is right. Two equally skilled players with perfect counters and center drift produce a game that cannot end. This is the most serious structural flaw the Critic identified.

I accept the Critic's recommendation of time limit + escalating stakes, both already in my Round 3 spec (40-turn cap, escalation post-turn-20). The Facilitator confirmed these are sufficient in combination. The Critic's Round 4 added a further refinement I want to adopt: **positional drift** (drift rate proportional to distance from center). But I also want to formalize something neither the Facilitator nor the Critic explicitly specified: **progressive drift reduction over the course of the match.**

The center drift is the stalemate engine. It erases advantages. It is also the comeback mechanic. We need it strong early (prevent runaway leads in the exploratory phase) and gone late (let small advantages decide the match). The formula:

```
base_drift = METER_DRIFT_PER_SEC * (1 + |meter_value| * POSITIONAL_DRIFT_MULT)
effective_drift = base_drift * max(0, 1.0 - (turn / MATCH_TURN_LIMIT))
```

This combines the Critic's positional drift (larger leads experience stronger pull toward center) with temporal decay (drift fades as the match progresses). The result is a natural three-act structure:

- **Act 1 (turns 1-15):** Strong drift. Small leads evaporate. Exploratory. Both players build streaks, probe the board. The chess opening.
- **Act 2 (turns 16-30):** Weakening drift, escalating pushes. Advantages start to stick. A 10% lead at turn 25 no longer vanishes. The middlegame.
- **Act 3 (turns 31-40):** Near-zero drift, 2x push multiplier. Every chain is decisive. A single deep read decides the match. The endgame.

**Concrete parameters:** `POSITIONAL_DRIFT_MULT = 2.0` (Critic's recommendation), `DRIFT_DECAY_RATE = 1.0 / MATCH_TURN_LIMIT` (linear temporal reduction). Sweep both: POSITIONAL_DRIFT_MULT 1.0-3.0, DRIFT_DECAY_RATE 0.5x-2.0x of the linear value.

**Verdict: ACCEPT with compound fix (positional drift + temporal decay + escalation + cap). Simulation must validate that 80%+ of equal-bot matches produce a decisive winner before turn 35.**

---

#### 1B. Turtling -- ACCEPT. The 80% efficiency bleeds turtles; rope-a-dope is a feature, not a bug.

The Critic confirmed in Round 4 that COUNTER_EFFICIENCY = 0.80 is sufficient, citing the math: a pure turtle bleeds 14.6% over 10 exchanges against average 5-chain attacks, 7.4% against 3-chain attacks. Combined with escalation (which amplifies the bleed in Act 2-3) and progressive drift reduction (which stops restoring the turtle's meter), pure turtling is structurally losing.

The Critic added a contingency: if turtling persists in playtesting, add a passivity penalty (no proactive attack for 3 consecutive turns triggers 2x drift toward the passive player). I agree this is a reasonable backstop, but I do not expect it will be needed. Here is why:

The smart turtle (rope-a-dope) is actually a GOOD outcome for the design. A player who:
1. Counters defensively through Act 1, building momentum from counter-chains
2. Charges Supernova from consecutive qualifying counters
3. Absorbs 8-10% meter bleed
4. Flips to offense in Act 2 with x5 streak and Supernova ready

...is executing a sophisticated multi-phase strategy that requires board reading, discipline, and timing. This is Ali vs. Foreman. It should be permitted. The pure turtle (never attacks, just counters reflexively) loses because the 20% bleed accumulates. The strategic turtle (counters intentionally to build resources, then flips) can win -- but only if their read of the transition moment is better than the opponent's read of the turtling pattern.

The attacker's counterplay against the turtle: fire small pushes below COUNTER_THRESHOLD (0.015). These resolve instantly with no counter window, denying the turtle counter opportunities and preventing streak building. A 2-chain push (0.021) squeaks above the threshold, but a 1-chain (0.008) does not. If the attacker recognizes the turtle and switches to rapid 1-chain pokes, the turtle cannot build momentum, cannot charge Supernova, and bleeds from accumulated small pushes that drift cannot fully restore.

**Verdict: ACCEPT. 0.80 counter efficiency + progressive drift reduction + FORFEIT_PENALTY = pure turtling loses. Rope-a-dope is a valid emergent strategy with clear counterplay (small pokes that deny counter windows). The Critic's passivity penalty is a sound backstop if needed; shelve it for post-playtest consideration.**

---

#### 1C. Extreme Board States -- ACCEPT that density extremes are handled; DISAGREE on severity for the other two.

**Too few dots:** Continuous edge spawning at 1.5-2.5/s repopulates within 2-3 turns. The brief barren period after a massive chain is a natural valley, not a failure state. No spec change needed.

**Too many dots:** The dot cap (35-45 per tier) prevents this. Cascade gen cap (4) prevents single chains from clearing the board. The sweet spot (F3 30-60%) is maintained by the interaction of spawn rate, dot cap, and chain clearing. No spec change needed.

**All one type:** Not a failure. CASUAL tier is deliberately 100% standard. Types are a ranked-play skill layer. All-standard matches are shallower but not broken -- blast geometry, counter-timing, and meter management provide independent depth.

**All spread out (no clusters):** Boid flocking prevents persistence. When it occurs transiently, it creates the most interesting positional play in the game: the player who sculpts clusters from scattered dots through precise small blasts gains a massive advantage. This is the snooker safety game -- unglamorous but deeply skillful. I would argue this is one of the board states that most separates experts from novices.

**Verdict: All four states are handled by existing systems or are interesting rather than problematic. No spec changes needed.**

---

#### 1D. Parameter Sensitivity -- FLAG: needs simulation testing. The test design is ready.

The Critic rated this the existential parameter concern. The Facilitator designed the playtest. The Critic's Round 4 added Risk 3 (sweet spot may not exist) and Risk 1 (blast may not be learnable). I accept both risks as real and addressable.

I want to add clarity to what "addressable" means. There are three layers of mitigation, each progressively more aggressive:

**Layer 1 (tuning):** Sweep BLAST_K and BLAST_N in the simulation harness. Measure BDR (blast displacement ratio, target 0.5-1.5) and CPR (cluster preservation ratio, target 0.3-0.7). Find the parameter region where both are satisfied and existing metrics (SCR, F3, Chaos Decay) remain in their sweet spots. This is cheap, fast, and should be the first step before any human testing.

**Layer 2 (simplification):** If the sweet spot is narrow or nonexistent:
- **Blast damping:** Reduce boid flocking forces to 50% for 0.5s after a blast, allowing dots to reach their blast-determined positions before flocking reasserts. This widens the sweet spot by decoupling blast and flocking.
- **Single-blast-per-dot:** Only the closest explosion pushes each surviving dot. Eliminates cascade accumulation chaos. Reduces multi-blast interactions to simple single-source predictions.
- **Dot count reduction:** Cap at 20 instead of 35. Fewer objects to track. Larger spacing between dots. Simpler blast geometry.

**Layer 3 (pivot):** If no simplification produces learnable blast patterns, the billiards design is not viable for human play. Pivot to Combo C (Counter-Billiards Overflow), which uses survival management as its core skill rather than positional prediction. The tug-of-war meter, counter-chain timing, and momentum streak can be ported to Combo C unchanged. Only the blast-as-positioning mechanic is lost.

The simulation sweep design (Layer 1):

```
Test: Blast Force Sweet Spot
  Mode: Solo continuous, 25 dots, FLOW tier, blast enabled
  Bot: Oracle (optimal placement + timing)
  Sweep: BLAST_K 0.3-2.0 in 0.1 steps (18 values)
  Cross-sweep: BLAST_N 1.0-2.0 in 0.25 steps (5 values)
  Total: 18 * 5 * 3 seeds = 270 runs
  Measure: BDR, CPR, SCR, F3, Chaos Decay
  Time: ~5 minutes on parallel sweep harness
  Success: region where BDR [0.5, 1.5] AND CPR [0.3, 0.7] exists
           with width >= 0.3 in BLAST_K dimension (robust, not fragile)
```

The Critic also proposed a "positional retention" metric (what percentage of blast displacement survives after 2 seconds of flocking). I adopt this: target 40-70%. Below 40%, flocking undoes the blast (billiards is decorative). Above 70%, flocking does not matter (game is just ballistic physics, which might be fine but loses the organic feel of living dots).

**Verdict: FLAG as needs simulation testing. Three mitigation layers defined. The sweep is the first step. Human testing (Facilitator's 20-trial protocol) is the gate. Both can run within a day of implementing blast force.**

---

#### 1E. First-Mover Advantage/Disadvantage -- DISAGREE. Non-issue.

The Critic rated this LOW-MEDIUM and said alternation naturally balances it. I agree and go further: the FIRST_TURN_OFFSET should default to 0.0.

In our game, the first tap's effect is ephemeral:

1. **Blast overwrites itself.** Each subsequent blast reshapes the board. There is no persistent first-mover structure.
2. **Counter-chain neutralizes strong openings.** A big first push gets countered.
3. **Information advantage alternates every turn.** Player B reads the post-blast board on turn 2; Player A reads it on turn 3.

The Critic proposed testing this with 1000 bot matches. I endorse that test with a specific threshold: if first-mover win rate is 48-52%, FIRST_TURN_OFFSET = 0.0 (no compensation needed). If 53-57%, set offset to 0.03-0.05. If 58%+, structural problem requiring deeper investigation.

I predict 49-51%. The alternation, counter-chains, and board volatility (every blast erases prior structure) should produce near-perfect symmetry.

**Verdict: DISAGREE that this is a real risk. Ship with FIRST_TURN_OFFSET = 0.0. Test with bots. Adjust only if data warrants.**

---

### 2. Responding to the Gold Standard Comparison

The Critic scored: 60% Tetris, 40% Rocket League, 50% Pool. The Critic's Round 4 then compared our 6P/4~ against 1984 Tetris evaluated on the same framework: **4P/4~/1F.** Original Tetris fails the dual-purpose non-negotiable because competitive modes did not exist. Original Tetris earns 4 partials because T-spins, combos, and Zone were decades away.

This reframe is the most important analytical contribution of Round 4. It demolishes the anxiety around "only 60% of Tetris." Here is what it reveals:

**The percentage comparison measures a design against its mature form, not its launch form.** Every game starts incomplete. The question is whether the core structure has room for community-discovered depth. Our core (shared board + blast force + tug-of-war + counter-chain) has that room because:

- Blast physics creates nth-order consequences from every tap (prediction depth can grow with player skill indefinitely).
- Dot type interactions (gravity compression, volatile expansion) are specified but their competitive metagame is unexplored. Players will discover type-specific strategies we have not imagined.
- Counter-chain timing creates opponent modeling, bluffing, and baiting -- social layers that emerge from competitive communities, not design documents.
- The momentum streak creates narrative arcs and risk/reward calculations that deepen as players learn to manipulate streak flow against opponents.

The Critic said "6P/4~ is good enough to build a prototype, not a product." I agree. The prototype's job is to resolve the four partials. But I want to add: **even if two of the four partials resolve as fails, the design may still be worth shipping** -- because the remaining passes may constitute a game that is fun despite being less deep than designed. The Facilitator's elevator pitch ("find the tap that scores AND leaves the board in the worst state for the other player") works even if blast legibility is only 60% (slightly below the Critic's 65% threshold) and even if counter decisions are somewhat formulaic. A game that is 80% of what we designed is still a game no one else has built.

**The target stands: ~65% Pool / ~70% Tetris (with Supernova) / ~55% Rocket League.** These are aspirational, and the percentages will only be measurable after months of community play. What matters now is that the core structure permits growth. I believe it does.

---

### 3. What Keeps Me Up at Night

The Critic named blast legibility. The Facilitator designed the gate test. The Critic's Round 4 added Risk 4 (first impression is "boring tug-of-war") and Risk 5 (counter window degenerates to reaction speed). All valid. But after four rounds of rigorous scrutiny, the thing that most worries me is none of these.

**The counter-chain decision might be trivially solvable.**

Here is the nightmare. After 50 games, experienced players discover a heuristic: *"Always counter if my best available chain is >= 60% of the incoming push. Never counter otherwise."* This heuristic turns out to be near-optimal across all board states, meter positions, and momentum levels. The rich decision tree from my Round 3 Section 1.6 -- weighing defense vs. positional investment vs. blast geometry vs. opponent modeling -- collapses to a single ratio comparison.

Why this could happen: COUNTER_EFFICIENCY is a fixed constant (0.80). If the board's chain quality is roughly uniform over time (because boid flocking constantly regenerates clusters at a steady rate), then the opportunity cost of reactive tapping is roughly constant regardless of board state. The decision degenerates: "chain big enough? counter. not big enough? pass."

This would not break the game mechanically. It would still produce winners. But it would kill the *depth*. The counter-chain is supposed to be the decision that separates masters from intermediates, the choice that creates clutch narratives and post-match analysis. If it is a reflex calculation, the game's competitive soul is a 1-line conditional instead of a multi-variable judgment.

**The saving grace is blast geometry.** If the counter-chain's blast has significant positional consequences, the decision is never just "is my chain big enough?" It is also: "will the blast from my counter leave the board better or worse than if I ate the damage and tapped the optimal position proactively?" A reactive counter fires wherever a chain happens to be available during the 1.5s window -- not at the location that creates the best blast geometry. If WHERE you tap matters as much as WHAT you catch (the billiards premise), then counter-taps carry a hidden positional cost that the ratio heuristic cannot capture.

**This means the two biggest risks in this design are actually the same risk wearing different hats.** Blast force legibility and counter-chain decision depth are both downstream of one question: **does blast geometry matter enough to make tap position as important as chain size?**

If yes:
- Players learn to read blast patterns (legibility PASS).
- Counter decisions are complex because positional cost varies (depth PASS).
- Positional play is real because each blast sets up the next (Pool axis 60%+).
- Setup payoff exists because patient positioning beats greedy chaining (Puyo criterion PASS).

If no:
- Blast prediction is random (legibility FAIL).
- Counter decisions reduce to ratio math (depth FAIL).
- Positional play is illusory (Pool axis 30%).
- Setup payoff equals luck (Puyo criterion FAIL).

**Everything stands or falls on one thing: the blast force parameter range.** BLAST_K and BLAST_N determine whether this is a game with a genuine competitive identity or a dressed-up tug-of-war. The good news is that this is a single empirical question with a clear test. The bad news is that all of the design's ambition concentrates into a single point of failure.

I take comfort in the Critic's 1984 Tetris comparison. Tetris's equivalent bet was: "can players develop spatial intuition for rotating tetrominoes into gaps?" That was also an empirical question with no theoretical guarantee. It passed. I believe our bet passes too -- but I cannot prove it from this document. The next step is code.

**Specific test for counter-chain depth:**

```
Phase 2 Test: Counter Decision Complexity
  (Run after blast legibility passes)
  Setup: Billiards mode, two Oracle bots, 500 matches
  For each danger window:
    - optimal_action: counter or pass (exhaustive search,
      optimizing expected meter position at match end)
    - heuristic_action: counter iff best_chain >= 0.6 * incoming_push
    - Record agreement (optimal == heuristic)

  Pass: agreement_rate < 70% (heuristic wrong 30%+ of the time,
    meaning blast positioning makes the full decision complex).
  Fail: agreement_rate > 85% (decision is trivially captured).

  If fail: increase BLAST_K until positional consequences widen
  the gap between the heuristic and optimal play. If that pushes
  CPR below 0.2 (board resets every blast), accept simpler counter
  depth and find richness elsewhere (Supernova resource management,
  type-specific blast tools, streak manipulation as mind-game).
```

---

### 4. Final Specification Summary

This is the clean conceptual summary for DESIGN.md. Parameter tables live in brainstorm-round3.md Section 1.9.

---

#### Billiards Mode -- Competitive Chain Reaction

**What it is.** Two players share one board full of drifting, flocking dots. You take turns tapping. Your explosion catches nearby dots -- pushing a tug-of-war meter toward the opponent -- and blasts surviving dots across the board, reshaping the battlefield for the opponent's next move. The deepest skill is not finding the biggest chain. It is finding the tap that scores AND leaves the board in the worst possible state for the other player.

**Three pillars.**

1. **Explosion Billiards.** Every tap has two consequences: what you caught (chain size, meter push) and where you pushed (blast force repositions surviving dots). This is the game's unique identity -- no other competitive game uses physics-based board sculpting as its core skill expression. The billiards analogy is literal: each shot sets up the next. Running the table means each blast positions dots for a bigger chain on your next turn while scattering the opponent's formations. The skill ceiling is reading blast trajectories 2-3 taps ahead. Dot types serve as blast modifiers: gravity dots resist push and pull close dots inward (compressive blast), volatile dots fly further and create wide-radius blasts (expansive scatter), standard dots are the neutral baseline. Same cluster, different tap target, different blast outcome -- this is the player's control dimension beyond tap position.

2. **Tug-of-War Meter.** A thin bar encodes the entire game state. Push proportional to chain size. Progressive drift (proportional to distance from center) and temporal decay (drift fades over the match) create a three-act narrative: exploration (Act 1, strong drift, leads evaporate), escalation (Act 2, drift weakens, pushes amplify), endgame (Act 3, no drift, every chain decisive). Matches end when the meter reaches either end or after 40 turns (tiebreaker: meter position). Target match length: 60-120 seconds.

3. **Counter-Chains.** When the opponent fires a chain above a minimum threshold, the meter push animates over 1.5 seconds. During that window, you can fire a counter-chain that cancels 80% of the incoming push -- but your counter consumes your turn. This creates the core competitive fork: defend now (reduce damage, but your blast fires at a reactive position you did not choose) or absorb the hit (take meter damage, but use your turn to sculpt the board at the optimal location). No counter-counter rallies -- one exchange per cycle. The counter decision is the heart of the game: it forces players to weigh immediate survival against positional investment on every exchange.

**Why these choices.**

- **Shared board** because both players sculpt the same dots. Your blast creates the puzzle your opponent must solve. Split boards make it parallel solitaire. The shared board IS the billiards table.

- **Turn-based** because the game rewards reading, not reaction speed. Time pressure comes from dots-in-motion (clusters scatter while you deliberate), not from the opponent's finger.

- **No garbage** because on a shared board, the meter and blast force replace all three functions of garbage (pressure transfer, disruption, defense). Zero visual overhead. The board stays clean.

- **80% counter efficiency** because full cancellation enables turtling. At 80%, a pure turtle bleeds ~15% of the meter over 20 turns and loses. A rope-a-dope strategy (defensive early, build streak, flip offensive in Act 2) is a valid but risky emergent playstyle with clear counterplay (small pokes below counter threshold deny streak building).

- **Progressive drift + temporal decay** because the game needs comeback rubber-banding in Act 1 (encourage exploration, prevent runaway leads) and decisive outcomes in Act 3 (every chain matters, stalemate impossible). The three-act structure emerges from two continuous functions, not from scripted phase transitions.

- **Momentum streak** adds narrative continuity (building toward something over multiple turns), small-chain value (a 3-chain at x6 streak hits harder than a greedy 5-chain at x1), risk/reward tension (maintain the safe streak or gamble on a risky big chain), and Supernova gating (4 consecutive qualifying chains earn a 3-tap burst).

**Mode pipeline.** The billiards skill -- reading blast trajectories and positioning survivors -- is the invariant core across all modes. Solo zen trains it without pressure. AI matches add counter-timing and opponent adaptation. PvP adds reading human intent.

| Mode | What it adds | What it trains |
|------|-------------|----------------|
| Solo Zen | Blast force in continuous mode. No meter, no turns. | Blast trajectory reading. Positional setup. |
| AI | Tug-of-war. Turn alternation. Bot opponent (3 tiers). | Counter-timing. Meter management. Board reading after opponent blasts. |
| PvP | Human opponent. Ranked progression. | Everything + reading intent, baiting, multi-turn planning. |

**The North Star at every skill level.**

*"Before you tap, what did you SEE that your opponent missed?"*

- **Novice** sees the biggest cluster. Taps it. The bar moves.
- **Intermediate** sees the chain AND the blast leave (where survivors end up).
- **Advanced** sees chain + blast trajectory + counter-timing + opponent's next opportunity.
- **Master** sees multi-turn sequences, baits, and the quiet 2-chain that dismantles the opponent's plan while maintaining streak.

**The existential bet and the gate test.** The design depends on one empirical claim: humans can learn to intuitively predict blast-scatter patterns. The test is cheap (4-8 hours to build), fast (20 trials per player), and binary (65% prediction accuracy on trials 11-20 = pass). Build the test first. Everything else follows -- or pivots.

---

*Round 4 Proposer defense complete. Five failure modes addressed (three accepted with fixes, one flagged for simulation, one disagreed). Gold standard comparison reframed as a launch-vs-mature measurement that favors no game at its first iteration. The deepest remaining concern identified: counter-chain decision triviality, which is the hidden second face of the blast legibility risk. Both risks resolve on a single empirical axis -- whether blast geometry makes tap position matter as much as chain size. The spec is ready for Round 5.*
