# Chain Reaction Competitive Design — 5-Round Brainstorm

## Context

Chain Reaction is a mobile physics puzzle game with one-tap interaction. Dots flow across the board following boid flocking rules, and tapping creates an explosion that catches nearby dots, which then chain-react. The game currently has a solo survival mode. We want to design a competitive mode (PvP-first, then AI, then solo zen) inspired by Tetris Effect: Connected's mode pipeline and Rocket League's predictable-physics skill ceiling.

### Key Research Findings
- **Rocket League**: Deliberately fake, predictable physics = higher skill ceiling. Prediction depth is unbounded.
- **Tetris Effect**: Same core mechanic (line clear / chain) works across PvP (Zone Battle), AI (Connected bosses), and solo zen (Journey). The core engine is a platform; modes are meta-layers.
- **Garbage systems**: Tetris garbage is elegant because cancellation creates counterplay, timing is strategic, and defense is active.
- **Dual-purpose action**: Every action simultaneously serves offense and defense (Tetris line clears both score and free space).

### Current Game Systems Available
- Dot types (standard, gravity, volatile) with type-specific colors
- Schooling/boid flocking (cohesion, alignment, separation)
- Type-filtered cascades (gen 0 universal, gen 1+ same-type only)
- Momentum system (consecutive chains build streak x1-x10)
- Shatter mechanic (off-type dots give half points, no cascade)
- Continuous mode with tiers (CHILL → IMPOSSIBLE)
- Lab panel for live-tuning all parameters

---

# ROUND 1: DIVERGE

---

## PROPOSER — 15 Competitive Ideas

### Safe / Proven Territory

**1. Puyo Garbage (Split Board)**
Split screen, your chains send "dead dots" (grey, non-chainable) to your opponent's board proportional to chain length; opponent must catch dead dots in explosions to convert them back, creating constant pressure/counter-pressure cycles.

**2. Tetris Downstack (Split Board, Overflow Loss)**
Each player has their own board; dots continuously spawn, and the lose condition is board overflow (too many dots). Bigger chains temporarily pause your spawning while accelerating your opponent's spawn rate.

**3. Puyo Counter-Chain (Split Board, Cancel Mechanic)**
When your opponent sends garbage, there's a 2-second "danger window" before it lands; if you fire a chain during that window, your chain cancels incoming garbage dot-for-dot and any surplus becomes your attack.

**4. Puzzle Fighter Gem Crash (Split Board, Type Targeting)**
Your chain's dot types determine WHERE garbage lands on the opponent's board — red chains dump garbage near the opponent's red schools, blue near blue, disrupting their future chains.

**5. Shared Resource Race (Shared Board)**
Both players tap on the SAME board simultaneously; dots you chain are scored for you and removed, but chain collisions (both players' explosions reaching the same dot) cancel out and score nothing.

### Medium Risk / Hybrid Ideas

**6. Momentum Siege (Split Board, Streak as Weapon)**
Your momentum streak multiplier doesn't just affect scoring — at 3x it sends garbage, at 5x it disables one of your opponent's dot types for 3 seconds, at 8x it shuffles their board.

**7. Tug-of-War Bar (Shared State)**
A central meter sits between both boards. Chains push the meter toward your opponent; if it reaches their side, they lose. Small chains nudge it, big chains shove it, but the meter slowly drifts back to center.

**8. Schooling Invasion (Split Board, Cross-Board Boids)**
When you chain a school of 5+ same-type dots, the "survivors" migrate to your opponent's board as a hostile school that disrupts their existing boid formations.

**9. Territory Hex (Shared Board, Zones)**
The shared board is divided into hex zones. Chaining dots inside a zone claims it for you. You score points per zone owned per second. Opponent can reclaim zones by chaining inside them.

**10. Physics Sabotage (Split Board, Rule Mutation)**
Each chain of 4+ lets you pick a physics modifier to apply to your opponent's board for 5 seconds: increased dot speed, reversed schooling, gravity pull toward a corner, or random velocity injection.

### Wild / Experimental Territory

**11. Shared Board Fog of War**
One shared board, but each player can only see dots within a radius of their last tap point. Chaining dots expands your vision temporarily. Playing blind physics prediction.

**12. Dot Economy (Split Board, Draft Mechanic)**
New dot types appear in a shared "river" flowing between both boards. Each player taps to "draft" incoming dots onto their own board. Physics prediction meets card drafting.

**13. Explosion Billiards (Shared Board, Indirect Combat)**
Your explosion applies blast force to all surviving dots, shoving them across the board. You can intentionally detonate small chains to PUSH dots toward your opponent's clusters, sabotaging their formations, or push dots toward YOUR clusters for bigger future chains.

**14. Asymmetric Ecosystem (Split Board, Predator-Prey)**
Each player's board has different dot type interactions: on your board, red eats blue; on your opponent's board, blue eats red. Chains you send arrive as the opponent's predator type.

**15. Time Rewind Gambit (Split Board, Risk/Reward)**
After tapping, you see a 1-second preview of your chain's propagation. You can "commit" or "rewind" (undo the tap, but opponent gets a small speed boost). Poker-like bluff dynamic.

### Proposer's Dark Horse Pick
**13 (Explosion Billiards) + 7 (Tug-of-War) + 3 (Counter-Chain)** — turns the existing physics engine into a double-edged weapon with zero new mechanics needed beyond force vectors from explosions.

---

## CRITIC — 10-Criterion Evaluation Framework

| # | Criterion | Definition | Non-Negotiable? |
|---|-----------|-----------|-----------------|
| 1 | **One-Tap Fidelity** | Entire action space = choosing when and where to place a single tap | YES |
| 2 | **Deterministic Depth** | Same state + same tap = same outcome, always | YES |
| 3 | **Prediction Ceiling** | Lookahead bot scores 2x+ greedy bot from same state | No |
| 4 | **Dual-Purpose Action** | Every chain simultaneously advances your score AND imposes disadvantage on opponent | YES |
| 5 | **Readable Battlefield** | First-time spectator can identify who's winning and what happened in 2 seconds | No |
| 6 | **Puyo Setup Payoff** | Patient setup strategy consistently beats greedy immediate tapping | No |
| 7 | **Mode Portability** | Same core chain mechanic works across PvP, AI, and solo zen without mode-specific rules | No |
| 8 | **Mobile-Native Ergonomics** | Plays optimally one-handed on a 5.4" phone, no precision target < 12mm | No |
| 9 | **Comeback Mechanics** | Trailing player has structurally sound path to victory (15-45% win rate from 30% deficit) | No |
| 10 | **Spectacle Proportionality** | Visual/audio intensity scales proportionally with competitive impact | No |

**Hard rule:** Fail on criteria 1, 2, or 4 → rejected outright. Fail on 3+ of remaining 7 → needs fundamental rework.

---

## FACILITATOR — Creative Brief

### North Star Question
**"Before you tap, what did you SEE that your opponent missed?"**

### Success Criteria
- Legible physics, deep reads (new player understands in 30s, expert sees 3-4 simultaneous opportunities)
- The chain is both sword and shield (every tap is offense AND defense)
- PvP-AI-zen pipeline is ONE game (zen practice directly improves PvP skill)
- Momentum is a narrative (consecutive chains feel like building a spoken sentence)
- 60-second skill revelation (beginner triggers a surprising chain in first minute)

### The Rocket League Test
Skilled player reads: "Red river converging upper-left → if I wait 1.5s, the pinch tightens to 7-chain AND the scatter sets up blue follow-up → but opponent might take the red early → do I bait them into red and pivot to unnoticed green river?"

**The best tap is not the biggest chain available now. It's the tap that creates the best NEXT tap.**

### The Tetris Test
- Triggering a chain sends pressure (offense) but depletes your dots of that type (cost)
- NOT triggering lets rivers grow denser (investment) but risks opponent triggering first (risk)
- A well-read 5-chain in red sends massive pressure AND clears space for the blue river you've been nurturing

### Analogies
- **Pool/Billiards**: Running the table — each shot positions the cue ball for the next three
- **Racquetball/Squash**: Compact court, fully visible, angles multiply faster than you can track
- **Jazz improvisation**: Dot rivers are the rhythm section; your taps are the solo
- **Speed chess**: Same board, public information, depth of read is the only differentiator

### Anti-Patterns (Must NOT)
1. Become a reaction-speed test (physics tempo must reward patience over frantic tapping)
2. Require reading a tutorial (type rules must be visually self-evident)
3. Reward memorization over adaptation (emergent variation in every board state)
4. Split attention between board and UI (score, health, multiplier all encoded in the simulation)

---

## RESEARCH — Tetris Effect Mode Architecture

### Key Findings

**Zone Battle PvP:** Zone meter charged by line clears. When activated, gravity freezes and lines stack at bottom. On exit, stacked lines convert to massive garbage attack. Zone also used DEFENSIVELY to cancel incoming garbage. This creates resource management: burn Zone early for moderate attack, or save for counter/amplify?

**Garbage system depth:** Cancellation (clear lines to neutralize pending garbage), timing strategy (attack AFTER opponent has no pending garbage to cancel), multiple attack paths (T-Spin Double = 4 lines like Tetris but only clears 2 rows), back-to-back bonuses, combo chains. Defense is ACTIVE, not passive.

**Connected co-op:** Three players, separate fields that MERGE during Zone. Round-robin piece placement on merged field. Bosses have scripted "blitz attacks" (disruptions). Revival via rhythm-tapping.

**Puyo Puyo Tetris cross-game:** Garbage translation between systems required extensive nerfing. Tetris-favored due to speed asymmetry and garbage direction asymmetry. PPT2 added RPG overlay (Skill Battle) as orthogonal balancing lever.

**The invariant core:** 10x20 field, 7 Tetriminos, SRS rotation, 7-bag randomizer, hold piece, lock delay — ALL identical across every mode. Only meta-layer changes. "The core engine is a platform."

**Audio as mode differentiator:** Tetris Effect's reactive music (action → pitched vocal chops, performance → percussion layers, Zone → chord progressions) makes identical mechanics FEEL different across modes without changing rules.

---

*Round 1 complete. All agents have diverged. The table is full. Now we challenge.*

---

# ROUND 2: CHALLENGE

---

## PROPOSER — Round 2 Defense & Revision

### Honest Self-Assessment: All 15 Ideas Against the Critic's Lens

I am going to be ruthless here. The Critic gave us three non-negotiables (One-Tap Fidelity, Deterministic Depth, Dual-Purpose Action) and a hard rule: fail any of those three, rejected outright. Let me hold my own ideas to that fire.

#### Ideas That PASS All Three Non-Negotiables

**1. Puyo Garbage (Split Board)** -- PASS
- One-Tap: Yes, same tap mechanic. You just tap; garbage is a consequence.
- Deterministic: Yes, same physics. Garbage placement could be deterministic (e.g., always lands at lowest-density region).
- Dual-Purpose: Yes -- your chain scores points AND sends garbage. Catching garbage on your side clears your board AND denies the opponent's attack. Clean dual-purpose.
- *Soft criteria concerns:* Mode Portability is decent (solo = garbage spawns on timer). Readable Battlefield is good (grey dots are visually obvious). Comeback via garbage-cancel is structural.

**2. Tetris Downstack** -- PASS
- One-Tap: Yes.
- Deterministic: Yes.
- Dual-Purpose: Yes -- chain pauses your spawns (defense) while accelerating opponent's (offense).
- *Soft criteria concerns:* Readable Battlefield is strong (more dots = losing, fewer = winning). But Setup Payoff (#6) is weak -- the "wait to build bigger" incentive conflicts with overflow pressure. You are incentivized to chain as fast as possible to slow your spawns, which rewards frantic greedy play over patient setup. This is a real problem.

**3. Puyo Counter-Chain** -- PASS
- One-Tap: Yes.
- Deterministic: Yes, if the danger window timing is deterministic.
- Dual-Purpose: Yes -- counter-chain cancels incoming garbage (defense) and any surplus attacks back (offense).
- *Soft criteria concerns:* This is the purest "defense is active" mechanic. Setup Payoff is excellent -- you want to have a big chain READY for when garbage comes, rewarding patience and board reading.

**5. Shared Resource Race** -- PASS (barely)
- One-Tap: Yes.
- Deterministic: Yes.
- Dual-Purpose: Marginal. Your chain scores for you (offense in a race sense) and removes dots the opponent could use (denial). But "denial" is indirect and hard to read -- you are not imposing a disadvantage so much as consuming a shared resource. Weak pass.
- *Soft criteria concerns:* Mobile Ergonomics is a problem -- two players tapping the same phone screen is terrible. Online-only variant works but loses the physical play option entirely. Readable Battlefield fails: a spectator cannot tell whose explosions are whose without color-coding, and even then it is chaotic.

**7. Tug-of-War Bar** -- PASS
- One-Tap: Yes.
- Deterministic: Yes.
- Dual-Purpose: Yes -- every chain pushes the meter toward the opponent (offense) and away from you (defense). The meter IS the game state.
- *Soft criteria concerns:* Readable Battlefield is exceptional (one bar, immediately legible). Comeback is structural (meter drifts to center, so a trailing player always has time). Spectacle Proportionality is natural (bigger chain = bigger meter shove = more dramatic). This might be the cleanest idea I proposed.

**9. Territory Hex** -- PASS (with concerns)
- One-Tap: Yes.
- Deterministic: Yes.
- Dual-Purpose: Yes -- chaining inside a zone claims it (offense) and the act of chaining there means you are clearing dots in a zone near you, making it harder for the opponent to reclaim (soft defense).
- *Soft criteria concerns:* Mobile Ergonomics is dangerous -- hex zones on a 5.4" phone might be too small. Zone boundaries add visual clutter that violates "split attention between board and UI." Setup Payoff is weak -- you are incentivized to chain wherever dots cluster, not to patiently build. The zone mechanic rewards frequency of taps more than quality. Fails 3+ soft criteria: Ergonomics, Setup Payoff, possibly Readable Battlefield (zone ownership is a second layer to track). **Needs rework or cut.**

**13. Explosion Billiards** -- PASS
- One-Tap: Yes -- the blast force is a consequence of the explosion, not a separate action.
- Deterministic: Yes -- force vectors from explosions are pure physics.
- Dual-Purpose: Yes -- the explosion catches dots (scores for you) AND the blast force pushes surviving dots (repositions the board for your next play or disrupts opponent). Every tap simultaneously has a catch outcome and a push outcome.
- *Soft criteria concerns:* Prediction Ceiling is very high (you are predicting not just what you will catch but where you will push survivors). Setup Payoff is excellent (patient play = reading how a small detonation repositions dots for a bigger follow-up). This is the idea I am most excited about.

#### Ideas That FAIL Non-Negotiables

**6. Momentum Siege** -- FAILS Criterion 1 (One-Tap Fidelity)
- At 5x streak, you "disable one of your opponent's dot types for 3 seconds." At 8x, you "shuffle their board." These are effects that happen AUTOMATICALLY based on a threshold -- the player did not choose when or how to deploy them. Worse, "shuffling the board" is an exogenous action that breaks the "entire action space = choosing when and where to place a single tap" contract.
- **Fix:** Remove the automatic threshold effects entirely. Instead, make the momentum streak purely a scoring/garbage multiplier. At 5x, your garbage attack is 5x larger. That is dual-purpose and one-tap-faithful -- the player's only decision is still "where to tap to extend the streak." The streak amplifies the tap; it does not replace it with a separate mechanic.

**8. Schooling Invasion** -- FAILS Criterion 2 (Deterministic Depth), arguably
- "Survivors migrate to your opponent's board as a hostile school." How do you deterministically model boid behavior across two separate physics simulations? The migration path, the disruption pattern on arrival -- these are highly sensitive to the exact state of the opponent's board, which you cannot see. From the attacking player's perspective, the outcome of sending an invasion is unpredictable.
- **Fix:** Make it deterministic by removing the cross-board migration. Instead, when you chain a 5+ school, the opponent receives the EQUIVALENT number of dots spawned in a tight cluster on their board (same type, deterministic placement at the lowest-density region). This is just flavored garbage -- the "invasion" aesthetic without the simulation-coupling problem.

**10. Physics Sabotage** -- FAILS Criterion 1 (One-Tap Fidelity)
- "Each chain of 4+ lets you PICK a physics modifier." This introduces a second action: first you tap (chain mechanic), then you choose a modifier (menu/selection mechanic). That is two actions, and the second one is not a tap on the physics board.
- **Fix:** Remove the selection. Instead, the physics modifier is deterministic based on the chain composition. Chain that starts with a gravity dot? Opponent gets gravity pull toward a corner for 3 seconds. Chain starts volatile? Opponent's dots speed up. The player's decision is entirely about WHERE to tap (which type starts the chain), preserving one-tap fidelity.
- **But even fixed, this is weak on Dual-Purpose** -- the sabotage is pure offense with no defensive component. You do not get safer by sabotaging. **Leaning toward cut.**

**11. Shared Board Fog of War** -- FAILS Criterion 2 (Deterministic Depth)
- If you cannot see the dots, you cannot predict the outcome. "Playing blind physics prediction" sounds cool but it means same-state + same-tap does NOT equal same-outcome from the player's perspective, because the player does not KNOW the state. Determinism requires state visibility.
- **Fix:** This is fundamentally broken. The entire appeal is the fog, and removing the fog removes the idea. **Cut.**

**12. Dot Economy (Draft Mechanic)** -- FAILS Criterion 1 (One-Tap Fidelity)
- "Each player taps to draft incoming dots onto their own board." Now the tap does two different things depending on where you tap: on the river = draft, on the board = chain. Two action types violates one-tap fidelity.
- **Fix:** Remove the drafting. Dots flow automatically; both players see the same incoming stream and plan around it. But then this is just standard play with shared spawns, which is not a distinct idea. **Cut.**

**14. Asymmetric Ecosystem** -- FAILS Criterion 2 (Deterministic Depth) and Criterion 5 (Readable Battlefield)
- Different rules on different boards. "On your board, red eats blue; on your opponent's board, blue eats red." A first-time spectator has zero chance of understanding in 2 seconds. Does "red eats blue" happen automatically or via chains? If automatically (boid predator-prey), it FAILS Criterion 2 because you cannot predict when one type will consume another during your chain resolution -- it adds a complex secondary system. **Cut.**

**15. Time Rewind Gambit** -- FAILS Criterion 1 (One-Tap Fidelity)
- "You can commit or rewind." That is two actions after the tap: a commit button and a rewind button. The action space is now tap + confirm/cancel, not just tap.
- **Fix:** Remove the rewind. Instead, every tap has a 0.5-second "fuse" before detonation (visible to both players), during which dots continue moving. This creates the prediction tension ("will the dots still be there when it goes off?") without adding a second action. But this is just the existing hold mechanic with a delay. Not a distinct idea. **Cut.**

**4. Puzzle Fighter Gem Crash** -- PASS but WEAK
- One-Tap: Yes. Deterministic: Yes (if type-to-placement mapping is fixed). Dual-Purpose: Yes -- your chain scores and sends targeted garbage.
- *But:* Setup Payoff is anti-pattern. The optimal play is to chain whatever is available and hope the type-targeting disrupts the opponent. You are not reading the opponent's board to decide what type to chain -- you are just chaining greedily and the targeting is a bonus. The "strategy" of type-targeting is mostly illusory because you cannot control which types cluster on your board. **Weak, leaning toward cut.**

#### Summary Scorecard

| # | Idea | C1 | C2 | C4 | Soft Fails | Verdict |
|---|------|----|----|----|-----------:|---------|
| 1 | Puyo Garbage | OK | OK | OK | 0 | **KEEP** |
| 2 | Tetris Downstack | OK | OK | OK | 1 (Setup) | **KEEP (with concern)** |
| 3 | Counter-Chain | OK | OK | OK | 0 | **KEEP** |
| 4 | Puzzle Fighter | OK | OK | OK | 2 (Setup, Prediction) | **WEAK -- cut candidate** |
| 5 | Shared Resource Race | OK | OK | Weak | 2 (Ergonomics, Readable) | **WEAK -- cut candidate** |
| 6 | Momentum Siege | FAIL | OK | OK | -- | **REWORK (fix above)** |
| 7 | Tug-of-War | OK | OK | OK | 0 | **KEEP** |
| 8 | Schooling Invasion | OK | FAIL | OK | -- | **REWORK (fix above)** |
| 9 | Territory Hex | OK | OK | OK | 3+ | **REWORK or CUT** |
| 10 | Physics Sabotage | FAIL | OK | Weak | -- | **CUT** |
| 11 | Fog of War | OK | FAIL | OK | -- | **CUT** |
| 12 | Dot Economy | FAIL | OK | OK | -- | **CUT** |
| 13 | Explosion Billiards | OK | OK | OK | 0 | **KEEP** |
| 14 | Asymmetric Ecosystem | OK | FAIL | Weak | 2+ | **CUT** |
| 15 | Time Rewind | FAIL | OK | OK | -- | **CUT** |

---

### Kill Your Darlings: 5 Ideas Eliminated

1. **11. Fog of War** -- The entire premise violates deterministic depth. You cannot have skill-based prediction when the player cannot see the state. No fix preserves the idea's identity.

2. **12. Dot Economy** -- Drafting is a second action type that breaks one-tap fidelity. Without drafting, it collapses to "shared spawns," which is not an idea, it is a parameter.

3. **14. Asymmetric Ecosystem** -- Asymmetric rules per board fail readability, portability, and arguably determinism. The cognitive load of tracking two different rule sets on a phone screen violates Anti-Pattern #2 ("require reading a tutorial") and Anti-Pattern #4 ("split attention between board and UI").

4. **15. Time Rewind Gambit** -- Commit/rewind is a second action. The poker-bluff aesthetic is appealing but fundamentally requires an action vocabulary larger than one tap. Dead on arrival.

5. **10. Physics Sabotage** -- Even with the "deterministic by chain composition" fix, this is pure offense with no defensive component. It also adds invisible rules (why did my dots suddenly speed up?) that violate readable battlefield and the "no wiki" design principle. The sabotage recipient experiences randomness even though it is technically deterministic, because they cannot predict what type the opponent will chain.

---

### Defending the Dark Horse: 13 (Explosion Billiards) + 7 (Tug-of-War) + 3 (Counter-Chain)

#### The Pitch (Restated)

Two players, each on their own board. A central tug-of-war meter between them. Your chains push the meter toward the opponent -- proportional to chain size. The opponent has a counter-window: if they fire a chain during the 2-second window after your attack, their chain cancels yours dot-for-dot and any surplus pushes the meter back. The twist: explosions apply blast force to surviving dots, so every tap repositions the board for your next play. Your tap catches dots (scoring/attack), pushes survivors into better positions (setup), and depletes the opponent's attack window (defense if timed to counter).

#### Criterion-by-Criterion Defense

| Criterion | Assessment | Weakness? |
|-----------|-----------|-----------|
| 1. One-Tap Fidelity | STRONG. Tap = explosion = catch + blast force + meter push. One action, three consequences. | None |
| 2. Deterministic Depth | STRONG. Blast force is physics (F = k/d^2 from explosion center). Same state + same tap = same catch count + same force vectors. | Need to ensure blast force calculation is frame-rate independent |
| 3. Prediction Ceiling | VERY STRONG. Expert reads: "I catch 4 here AND push the blue cluster into a tight formation AND my opponent just tapped so they cannot counter for 1.5s." Three simultaneous prediction layers. | May be TOO deep -- new player overwhelmed? |
| 4. Dual-Purpose Action | STRONG. Every tap is offense (meter push via chain), defense (counter-cancels incoming attack), and setup (blast force repositions board). Triple-purpose, actually. | None |
| 5. Readable Battlefield | MODERATE. Tug-of-war meter is instantly legible. But blast force is invisible -- you cannot see WHY dots moved after an explosion. | **Weakest point.** Need visual language for blast force (radial lines? wind trails?) |
| 6. Setup Payoff | VERY STRONG. The billiards dimension means a small 2-chain that pushes 6 dots into a tight cluster is worth more than a greedy 5-chain that scatters the board. Patience and board-reading are rewarded. | None |
| 7. Mode Portability | STRONG. Solo zen: just the billiards physics (position dots for bigger chains). AI: tug-of-war vs bot. PvP: full system. The blast force mechanic is meaningful even without an opponent. | Tug-of-war meter is PvP-only; solo/zen needs a different scoring frame. Solvable -- meter becomes a "distance" goal in solo. |
| 8. Mobile Ergonomics | STRONG. Split board = each player on their own phone. One tap. No small targets. | None |
| 9. Comeback | STRONG. Meter drifts to center (structural comeback). Counter-chain mechanic means a trailing player who reads the board well can cancel a big attack and counter-push. Deficit is never permanent. | Need to tune drift rate carefully -- too fast and leading is meaningless, too slow and trailing is hopeless. |
| 10. Spectacle Proportionality | STRONG. Big chain = big meter shove = big visual/audio event. Counter-chain = dramatic reversal. | Counter-chains need distinct audio/visual to feel different from normal chains. |

#### Where It Is Weakest

**Readable Battlefield for the blast force component.** A spectator can see the chain (dots exploding) and the meter (bar moving). But the strategic depth of blast force -- HOW the surviving dots repositioned and WHY that matters -- is invisible. This is the Rocket League problem: the ball physics are simple enough that spectators can read trajectories, but our dot physics involves 30+ particles moving simultaneously.

**Proposed Fix -- Three visual layers:**

1. **Blast ring** -- a brief expanding ring from each explosion showing the force radius (like a shockwave ripple). Appears for 0.3s, fades. Immediate visual cue: "the explosion pushed things."
2. **Dot trails** -- dots that were pushed by blast force show a short motion trail for 0.5s in the color of the explosion that pushed them. You can SEE the causal chain: "that red explosion pushed these 4 blue dots into a cluster."
3. **Cluster glow** -- when 3+ same-type dots are pushed into proximity (within chain range of each other), they briefly glow to signal "this is now chainable." Expert reads the glow as opportunity; novice just sees something shiny.

None of these add mechanics. They are pure visual feedback on existing physics, which aligns with design principle #6 (Juice Effects Are Multiplicative).

#### Second Weakness: Complexity Cliff

Three simultaneous layers (catch, push, counter-timing) might overwhelm new players. The Facilitator's "60-second skill revelation" criterion requires that a beginner triggers something surprising in the first minute.

**Proposed Fix:** The beginner does not need to understand blast force to enjoy the game. They tap, dots explode, the meter moves. That is enough. Blast force is the skill ceiling, not the skill floor. The 60-second revelation comes from the tug-of-war meter itself: "I tapped, and the bar MOVED. My opponent tapped, and it moved BACK. Oh, we are fighting over this bar." The billiards layer reveals itself organically when the player notices "wait, after I tapped, those dots moved closer together." That is a level-2 discovery, not a required tutorial.

---

### Answering the North Star: "Before you tap, what did you SEE that your opponent missed?"

The Facilitator's question is about perceptual advantage -- the game should reward seeing the board more deeply than your opponent.

**The best answer is Explosion Billiards (13) because it creates the richest "seeing" vocabulary.**

In a pure garbage system (ideas 1-3), what you "see" is: which cluster is biggest, and when to trigger it. That is one layer of perception. Important, but it is the same read every time -- find the densest cluster, tap it.

In Explosion Billiards, what you see before tapping includes:

- **The direct chain:** "I can catch 5 dots here." (Same as any system.)
- **The blast geometry:** "Catching those 5 will push these 3 blue dots toward that gravity dot, and in 1.5 seconds they will be in chain range of each other." (Second-order read.)
- **The opponent's vulnerability:** "My opponent's board has a volatile cluster forming near their gravity well. If I push the meter now, they will panic-tap to counter, but their counter-tap will scatter that cluster. If I WAIT 2 seconds, their cluster tightens, they counter with a bigger chain, but I have already set up my blue follow-up." (Third-order read, involving opponent modeling.)
- **The counter-timing:** "My opponent tapped 0.8 seconds ago, so they are on cooldown for 0.7 more seconds. If I attack NOW, they cannot counter." (Temporal read.)

This is the Rocket League test from the Facilitator's brief, almost verbatim: "Red river converging upper-left... if I wait 1.5s... but opponent might take the red early... do I bait them into red and pivot to unnoticed green river?"

In Explosion Billiards, the answer to "what did you see?" is: **"I saw that my 3-chain would push the blue cluster into a 7-chain setup, AND that my opponent was on cooldown so they could not counter, AND that the meter was close enough that even a 3-chain push would force them to panic-respond when they come off cooldown, wasting their carefully-built green river on a defensive counter instead of the offensive super-chain they were setting up."**

That is four layers of perception in a single tap decision. No other idea I proposed comes close to that density of "seeing."

---

### Three New Combinations (Inspired by the Critic's Framework and Facilitator's Brief)

#### Combo A: "Billiards Garbage" -- 13 (Explosion Billiards) + 1 (Puyo Garbage) + 7 (Tug-of-War)

Replace the tug-of-war meter with a garbage system, but keep the billiards physics. Your chains send grey dead dots to the opponent's board, but ALSO your blast force pushes surviving dots on YOUR board. The garbage dots arrive on the opponent's board in a tight cluster (deterministic placement), and they need to catch them in explosions to convert them back. But here is the key: the opponent can use THEIR blast force to push garbage dots into their existing clusters, setting up combined chains that convert garbage AND score simultaneously.

**Why this is new:** The original garbage idea (#1) was passive receipt -- garbage lands, you deal with it. Adding billiards means garbage becomes raw material. A skilled defender does not just survive garbage; they USE it. They blast-push garbage dots into their own clusters, converting them in the same chain that builds their counterattack. This directly satisfies the Facilitator's "chain is both sword and shield" criterion.

**North Star test:** "Before you tap, what did you see?" -- "I saw that the incoming garbage cluster will land near my red school. If I do NOT tap the red school now, the garbage arrives and I can catch both the garbage AND the reds in one chain, converting the attack INTO my counterattack. My opponent thought the garbage was offense; I saw it as fuel."

**Concern:** The Facilitator identified Tension B (Garbage Legibility Problem). Grey dots mixed with colored dots on a 195x422 split screen. The fix: garbage dots are not grey. They are the SAME type as the dots that were chained to create them. Red chain on Board A sends red garbage to Board B. On Board B, those red dots are visually distinct (dimmer, pulsing, or outlined) but still red -- they participate in red chains normally. "Garbage" is just dots that your opponent gave you. This preserves the visual language (all red dots look similar) while the pulsing/dim treatment signals "these are new arrivals." Much more legible than grey.

#### Combo B: "Momentum Billiards" -- 13 (Explosion Billiards) + 7 (Tug-of-War) + Momentum Streak (existing system)

Same billiards + tug-of-war core, but the existing momentum streak system (x1 through x10) multiplies your meter push. At x1, a 5-chain nudges the meter. At x5, a 5-chain SHOVES it. Crucially: breaking your streak (missing a chain, or firing a chain that catches zero dots) does not just reset multiplier -- it causes the meter to drift toward YOU momentarily (a stumble). This creates:

- **Risk/reward in streak maintenance:** Do you take the safe 3-chain to keep your streak alive, or go for the risky 6-chain that might whiff and cost you momentum AND meter position?
- **Comeback via streak reset:** A player who breaks the opponent's streak (by forcing them into a panic-counter that whiffs) gains a huge positional advantage as the meter drifts their way.
- **Setup Payoff amplified:** At high streak, even a small chain has huge meter impact. This means a patient player who maintains a x7 streak and fires a precise 3-chain outperforms a greedy player who keeps breaking their streak on risky 8-chain attempts.

**Why this is new:** The original momentum siege (#6) failed because streak thresholds triggered automatic effects. This version keeps momentum as a pure multiplier on the existing tap-chain-meter pipeline. No new actions, no automatic effects. The streak is just a scalar on what was already happening. It also directly addresses the Facilitator's Tension C (Setup-vs-Liveness): "patient setup" in a board-that-never-holds-still means maintaining your streak. You do not need the board to stay still if your investment is in the streak multiplier, not in a specific cluster formation.

#### Combo C: "Counter-Billiards Overflow" -- 13 (Explosion Billiards) + 3 (Counter-Chain) + 2 (Overflow Pressure)

No tug-of-war meter. Instead, both players are on the same continuous-mode survival pressure: dots keep spawning, and you lose if your board overflows. Your chains clear your own board (survival) AND send an equivalent number of dots to the opponent's board (offense). Counter-chains during the danger window cancel incoming dots. The billiards twist: blast force lets you COMPACT your board (push dots into tighter clusters to clear more efficiently) and also push your own dots AWAY from the overflow threshold zones.

**Why this is new:** This is the Tetris analogy made literal. In Tetris, clearing lines is survival AND offense. Here, catching dots is survival AND offense. The downstack dynamic from idea #2 is preserved, but counter-chains from idea #3 add active defense, and billiards from idea #13 add the positional chess layer. The overflow loss condition makes every decision urgent without making it frantic (you control the pace through chain efficiency and blast-force board management).

**North Star test:** "Before you tap, what did you see?" -- "I saw my board was getting full in the upper-left. A greedy player taps the biggest cluster to clear space. But I saw that a 3-chain in the lower-right would push 4 dots into the gravity well, AND the dots I send to my opponent land in their already-crowded corner, AND clearing the lower-right opens space for the incoming volatile cluster that spawns in 1 second. I sacrificed clearing the urgent zone to create a better position everywhere else."

**Mode Portability:** Solo zen = continuous mode (already exists). AI = same rules, bot opponent. PvP = full system. This has the strongest portability of all three combos because the solo version IS the current game.

---

### Revised Rankings After Self-Critique

**Tier 1 -- Core combo candidates (build the game from these):**
1. **13. Explosion Billiards** -- the physics innovation. No new mechanics, just force vectors from existing explosions. Highest prediction ceiling. Best answer to the North Star question.
2. **7. Tug-of-War** -- the win condition and readability layer. Immediately legible, structurally fair, spectacle-proportional.
3. **3. Counter-Chain** -- the active defense layer. Without this, defense is passive and the game is "who chains faster." With this, timing and patience are strategic weapons.

**Tier 2 -- Strong supporting mechanics:**
4. **1. Puyo Garbage** -- proven pattern, clean dual-purpose, but less novel than billiards.
5. **2. Tetris Downstack** -- strong survival pressure, but Setup Payoff concern remains.
6. **Momentum Streak** (existing system, as multiplier) -- not a new idea, but the interaction with tug-of-war creates risk/reward depth.

**Tier 3 -- Reworkable with effort:**
7. **6. Momentum Siege** (reworked to pure multiplier) -- becomes Combo B above.
8. **8. Schooling Invasion** (reworked to flavored garbage) -- loses its identity; just becomes #1 with a skin.
9. **9. Territory Hex** (needs fundamental rework for mobile) -- might work as a larger-format tablet/desktop variant but fails mobile-native.

**Cut:** 4, 5, 10, 11, 12, 14, 15 (seven ideas eliminated total).

---

### Responding to Facilitator Missing Pieces

The Facilitator identified four gaps. Let me address each briefly, as they should shape Round 3:

**Concrete garbage translation:** Combo A above proposes typed garbage (not grey -- same type as the chain that created it, visually dimmed/pulsing). This preserves the visual language, makes garbage legible, and creates the "garbage as fuel" dynamic.

**The async question:** Explosion Billiards + Tug-of-War can work asynchronously if we use a "replay challenge" model. Player A plays a round; their chain results and meter push are recorded. Player B receives the meter push and plays their counter-round. Back and forth, one round at a time. The billiards physics and counter-chain timing would need to be adapted (counter-window becomes "your next round" rather than "2 seconds"), but the core mechanic survives. This is the Letterpress model: same rules, relaxed timing.

**Audio's competitive role:** The musical chain system already exists. In PvP, both players' chains create music simultaneously. A natural extension: your chain's audio is in your key signature, your opponent's is in theirs. When chains overlap, the musical interaction tells you something -- consonance (both firing similar-sized chains), dissonance (one dominating), silence (one player in trouble). The tug-of-war meter position could modulate the harmonic relationship: when the meter is centered, both keys are consonant. As it pushes toward one side, the losing player's key shifts toward dissonance. You HEAR that you are losing.

**Supernova integration:** In the tug-of-war model, Supernova (Multi-Tap) is the comeback mechanic. You earn it through consecutive chain clears (already designed). When activated, you get 3 taps in one round -- which in the PvP context means 3 separate blast-force events and potentially 3 separate meter pushes in rapid succession. The opponent cannot counter all three. This is the "Zone" moment from Tetris Effect: you have been building toward this, you activate it at the critical moment, and the meter SHOVES. Defensive use: activate Supernova when the meter is dangerously close to your side, fire three counter-chains to push it back.

---

### Final Position Entering Round 3

My dark horse combo from Round 1 survives the Critic's framework with one identified weakness (blast force readability) and a proposed fix (visual feedback layers). The three new combos (A, B, C) represent different integration strategies:

- **Combo A (Billiards Garbage)** is the most strategically rich -- garbage as raw material.
- **Combo B (Momentum Billiards)** is the most narratively compelling -- streaks create story arcs.
- **Combo C (Counter-Billiards Overflow)** is the closest to the Tetris analogy -- survival IS offense.

If forced to pick one combination today, I would pick **Combo C (Counter-Billiards Overflow)** because it most directly answers all three of the Facilitator's tests:
- **Rocket League test:** Blast force creates unbounded prediction depth.
- **Tetris test:** Clearing dots = survival + offense; not clearing = investment + risk.
- **Pool/Billiards analogy:** Every tap positions the board for the next three taps.

And it has the strongest mode portability: the solo version is literally the current game.

I look forward to the Critic and Facilitator tearing this apart.

---

## FACILITATOR — Round 2 Tensions & Observations

### 1. The Five Deepest Tensions

**Tension A: The Shared-Board Paradox (One-Tap Fidelity vs. Competitive Interaction)**

Ideas 5, 9, 11, and 13 all use a shared board. The Critic's criterion 1 (One-Tap Fidelity) says the entire action space is "when and where to place a single tap." On a shared board with two players tapping simultaneously, the game becomes a race to tap first. The design document says "physics tempo must reward patience over frantic tapping" (Anti-Pattern #1). But competitive urgency on a shared board structurally punishes patience. A player who waits to read the optimal tap loses the cluster to a faster opponent who taps a good-enough tap.

*Design question for Round 3:* **How can a shared board reward reading depth over reaction speed, when both players can tap the same dots?**

**Tension B: The Garbage Legibility Problem (Readable Battlefield vs. Dual-Purpose Action)**

Ideas 1, 2, 3, 4, 6, and 8 all send some form of "pressure" to the opponent's board. The Critic requires Dual-Purpose Action (criterion 4, non-negotiable) and Readable Battlefield (criterion 5). But garbage systems create a visual legibility problem that is especially severe on mobile: grey dots mixed with colored dots, hostile schools disrupting formations, disabled dot types. On a 5.4-inch phone with split-screen play, each player's board is roughly 195x422 pixels. At that resolution, distinguishing garbage dots from standard dots, hostile schools from friendly schools, and disabled types from active types taxes the eye far beyond the current game's clean visual language. The game's design principle #1 ("Maximum Complexity, Minimum Abstraction") means all this must be readable on the playfield itself, with no HUD overlays to explain what is happening.

*Design question for Round 3:* **How can we make opponent-sent pressure instantly legible on a phone-sized split board without adding UI chrome or breaking the "dots on dark field" visual identity?**

**Tension C: The Setup-vs-Liveness Conflict (Puyo Setup Payoff vs. Dots Always In Motion)**

The Critic's criterion 6 (Puyo Setup Payoff) says patient setup should beat greedy tapping. DESIGN.md principle #5 says "Dots Are Always In Motion." These are in genuine tension. In Puyo Puyo or Tetris, pieces stay where you place them -- you can build a structure and trigger it later. In Chain Reaction, the board state decays every frame. A cluster that exists now may scatter in two seconds. "Patient setup" means something fundamentally different in a physics simulation where nothing holds still. The Proposer's ideas (especially 6, 9, and 12) assume players can plan multi-step strategies, but the game's physics may not provide stable enough structures to plan around.

The game's own data validates this tension: Chaos Decay at 82% means the board retains 82% of its scoring potential after a 200ms delay. That is livable. But at 2-3 second planning horizons (what "setup" implies), the decay compounds. A cluster dense enough to chain-7 at t=0 may only chain-4 at t=2s.

*Design question for Round 3:* **What does "patient setup" mean in a game where the board never holds still? Is the answer slower dot types (gravity dots as "anchors"), player-created formations, or something else entirely?**

**Tension D: The Mode Portability Gap (PvP-AI-Zen Pipeline vs. Mode-Specific Mechanics)**

Criterion 7 (Mode Portability) says the same core chain mechanic should work across PvP, AI, and solo zen without mode-specific rules. But every strong competitive idea introduces mechanics that are meaningless in solo play: garbage (who sends it in zen?), counter-chains (counter what?), territory claiming (against whom?), tug-of-war bars (pulling against what?). The Tetris model solves this by keeping the core absolutely invariant and changing only the meta-layer. But most of the Proposer's ideas change what a chain DOES, not just how it is scored.

The two ideas that naturally port to all three modes are 7 (Tug-of-War, where solo mode = bar drifts toward you automatically) and 13 (Explosion Billiards, where solo mode = you position dots for your own future chains). Everything else needs a solo-mode translation that risks feeling bolted-on.

*Design question for Round 3:* **Which competitive mechanic creates a game where "practice solo zen for 20 minutes" directly improves your PvP skill, with zero mode-specific knowledge?**

**Tension E: The Determinism Dilemma (Deterministic Depth vs. Opponent Interaction)**

Criterion 2 (Deterministic Depth, non-negotiable) says same state + same tap = same outcome, always. This holds perfectly in solo play. But the moment you add an opponent, you add an unpredictable agent whose taps alter the board state. In shared-board modes (5, 9, 11, 13), your opponent's tap literally changes which dots exist when your chain resolves. In split-board modes with garbage (1, 2, 3, 4, 6, 8), incoming garbage changes your board mid-chain.

Strictly speaking, the PHYSICS remains deterministic (same state + same inputs = same outputs). But the PLAYER'S prediction problem becomes stochastic because the opponent's input is unknown. This is acceptable (chess is deterministic but opponent moves are unknown), but the Critic's framing implies the player should be able to predict outcomes from what they see. The North Star question ("what did you SEE that your opponent missed?") requires that prediction be meaningful. If the opponent can invalidate your read by tapping at the wrong moment, the "seeing" skill is devalued.

*Design question for Round 3:* **How much opponent-induced state change per second is acceptable before prediction skill stops mattering? Is the answer "very little" (split boards with delayed garbage) or "a lot" (shared boards where reading the opponent's intent becomes the skill)?**

---

### 2. North Star Scoring: "Before you tap, what did you SEE that your opponent missed?"

Rating each idea 1-5 on how deeply it rewards pre-tap reading.

| # | Idea | Score | Reasoning |
|---|------|-------|-----------|
| 1 | Puyo Garbage | 3 | Reading own board is same as solo. Reading incoming garbage timing adds one layer. But converting grey dots is reactive, not predictive. |
| 2 | Tetris Downstack | 2 | Reading is "where is the densest cluster?" -- identical to solo. Speed pressure reduces reading time. Rewards fast tapping more than deep seeing. |
| 3 | Puyo Counter-Chain | 4 | Must read own board for a chain that fires within the 2-second danger window. Time pressure creates a "see it or lose it" moment. But the reading is still single-board. |
| 4 | Puzzle Fighter Type Targeting | 4 | Must read BOTH boards: your chain's type composition determines WHERE garbage lands on opponent's board. Expert reads: "my red chain sends garbage near their red school, which breaks their planned red cascade." Dual-board reading is genuinely deep. |
| 5 | Shared Resource Race | 2 | Reading is "grab the best cluster before they do." Rewards speed over depth. A fast good-enough tap beats a slow perfect tap. Directly violates anti-pattern #1. |
| 6 | Momentum Siege | 3 | Reading is "which chain continues my streak?" The streak-as-weapon adds meta-reading (what streak level am I at, what disruption does it send). But the core reading per-tap is unchanged. |
| 7 | Tug-of-War Bar | 3 | Reading is "is this chain big enough to matter given the bar position?" Adds one strategic layer (chain sizing relative to bar state) but doesn't fundamentally deepen per-tap physics reading. |
| 8 | Schooling Invasion | 3 | Reading your own board requires understanding disrupted boid formations. Interesting, but the disruption is somewhat random -- hard to read formations that are actively being scrambled. |
| 9 | Territory Hex | 4 | Must read which zones have the densest clusters AND which zones are strategically valuable (contested, about to flip, anchoring your territory). Spatial reasoning + physics reading. This is a deep "seeing" game. |
| 10 | Physics Sabotage | 2 | The sabotage choice after chaining is strategic, but the READING before the tap is unchanged. Choosing "reverse schooling" vs "gravity pull" is a menu decision, not a physics read. Violates design principle #1 (no menus on playfield). |
| 11 | Shared Board Fog of War | 5 | Reading is the entire game. Your vision radius IS your information. Every tap simultaneously reveals information, scores points, and positions your vision for the next read. The skill gap between someone who tracks dot trajectories through fog and someone who taps blindly is enormous. Deep, layered, and unique. |
| 12 | Dot Economy | 3 | Drafting adds a "what do I want?" layer, but the draft decision is separate from the chain-reading decision. Two distinct skills that don't compound -- drafting skill and chaining skill are orthogonal. |
| 13 | Explosion Billiards | 5 | Reading includes not just "what chain do I get?" but "where do the survivors end up?" and "does the blast push dots toward or away from my next opportunity?" Every tap requires reading the NEXT board state, not just the current one. This is the billiards "three shots ahead" skill applied to chain reactions. Directly answers the North Star question at every skill level. |
| 14 | Asymmetric Ecosystem | 3 | Reading requires understanding two different rule sets. Conceptually interesting but the "seeing" is more about remembering rules than reading physics. |
| 15 | Time Rewind Gambit | 3 | The rewind decision happens AFTER the tap, not before. It converts pre-tap reading into post-tap reaction. This inverts the North Star question: it rewards seeing what happened, not seeing what will happen. |

**Flag for elimination (scored 1-2):**
- **2 (Tetris Downstack)** -- pressure-cooker speed reduces reading time; rewards fast tapping over deep seeing
- **5 (Shared Resource Race)** -- race dynamic punishes patience; seeing deeply is a competitive disadvantage
- **10 (Physics Sabotage)** -- sabotage choice is a menu pick, not a physics read; violates principle #1

---

### 3. Skill Progression Analysis

The best competitive game has the deepest ladder from novice to master. For each surviving idea, what does progression look like?

**Tier S: Deepest Progression (novice sees 0 steps, master sees 4+)**

**13 (Explosion Billiards):**
- Novice: taps the biggest cluster. Survivors scatter randomly.
- Intermediate: notices that blast pushes survivors in predictable directions. Starts aiming to push dots toward other clusters.
- Advanced: reads blast → scatter → cluster formation. Plans two-tap sequences: "this tap pushes red dots toward blue school, next tap detonates the combined group."
- Master: reads three taps ahead. Intentionally fires small chains to sculpt the board. Uses opponent's blast physics against them. The entire game becomes cue-ball positioning.
- Ceiling: unbounded. The more steps ahead you can read blast-physics consequences, the better you play.

**11 (Fog of War):**
- Novice: taps near visible dots. Stumbles into chains.
- Intermediate: learns that chaining expands vision. Taps to reveal, then taps to score.
- Advanced: tracks dot trajectories through fog. Predicts where unseen dots are based on last-known velocity vectors. Taps in fog to catch predicted positions.
- Master: maintains a mental map of the entire board. Uses vision expansion strategically to deny opponent information. Reads opponent's visible chains to infer their board state.
- Ceiling: bounded by memory and spatial tracking. Very deep but somewhat different from physics-reading skill.

**Tier A: Strong Progression (novice sees 0, master sees 3)**

**4 (Puzzle Fighter Type Targeting):**
- Novice: chains whatever is available. Garbage lands randomly (from their perspective).
- Intermediate: notices that chain type determines garbage placement. Starts choosing chains by type.
- Advanced: reads opponent's board for type vulnerabilities. Chains red specifically because opponent has a red school they are building toward.
- Master: reads both boards simultaneously. Plans garbage placement to disrupt opponent's future chains while building own board for counter-attack.

**9 (Territory Hex):**
- Novice: taps whatever is dense. Ignores zones.
- Intermediate: learns to tap inside contested zones. Claims territory.
- Advanced: reads which zones will have dot density in 2-3 seconds. Claims zones preemptively.
- Master: controls zone adjacency. Creates territory networks where dots flowing between zones all pass through owned territory.

**3 (Puyo Counter-Chain):**
- Novice: chains reactively. Gets buried by garbage.
- Intermediate: learns to save a chain for the danger window. Basic counter-timing.
- Advanced: reads own board for counter-chain potential BEFORE opponent attacks. Maintains a "counter reserve."
- Master: manipulates opponent into attacking at the wrong time. Baits attacks, counters with surplus, converts defense into overwhelming offense.

**Tier B: Moderate Progression (novice sees 0, master sees 2)**

Ideas 1, 6, 7, 8, 12, 14, 15 fall here. Each adds one or two strategic layers on top of solo chain-reading, but the progression tops out at "I can read my board AND think about one meta-variable (streak level, bar position, predator types, draft picks)."

---

### 4. Most Underrated and Most Overrated

**Most Underrated: 13 (Explosion Billiards)**

The Proposer flagged this as part of their dark horse combo but I think the group is sleeping on the standalone version. Explosion Billiards does something no other idea does: it makes the PHYSICS ENGINE itself the competitive mechanic. Every other idea bolts a meta-game onto the chain system (garbage, territories, streaks, fog). Billiards says: the blast force that already exists in the physics is the entire competitive layer. You don't need garbage systems. You don't need split boards. You don't need counters or meters. You need dots that move when explosions happen near them, and two players who understand that movement.

This idea has the best mode portability (solo = position your own dots; AI = the bot reads blast physics; zen = sculpt patterns with explosions). It has the deepest skill ceiling (reading blast → scatter → regroup is an infinite lookahead problem, like pool). It requires zero new UI elements. And critically, it preserves the game's contemplative quality -- you are not fighting garbage or watching meters, you are reading physics. The North Star question is answered at every level of play.

The concern might be: "Is blast force even enough to create meaningful board-state changes?" This is testable. The simulation harness can measure how far dots travel from a nearby explosion. If the answer is "not far enough to matter," increase the blast force. If it is "too chaotic," reduce it. The parameter exists; the question is only tuning.

**Most Overrated: 9 (Territory Hex)**

Territory Hex sounds exciting. Zones, territory control, spatial strategy, area denial. It evokes Go, Splatoon, and real-time strategy games. But it has three structural problems that the excitement obscures:

First, it violates One-Tap Fidelity in spirit. The tap's purpose splits: am I tapping to score a chain, or to claim a zone? When the best chain crosses a zone boundary, do I take the chain or protect my zone? This is interesting strategically but it means the tap is serving two masters, and neither is the pure physics-reading that the North Star question demands.

Second, hex zones impose a grid onto the continuous physics simulation. The game's identity is "dots flowing across a field." Drawing hex boundaries and coloring zones creates a board-game aesthetic that fights the fluid, organic feel of boid flocking. It is a discrete system imposed on a continuous one.

Third, mode portability is weak. Territory control requires an opponent. Solo territory (claiming zones against a timer?) feels artificial. Zen territory is meaningless. The mechanic does not degrade gracefully into single-player.

Territory Hex is a good game -- it is just a different game. It wants to be Splatoon with chain reactions, not Chain Reaction with competition.

---

### 5. State of the Brainstorm

**Where the energy is converging:**

Three themes keep surfacing across all three agents:

1. **Blast physics as interaction medium.** The Proposer's dark horse (13+7+3), the North Star scoring, and the skill progression analysis all point toward explosion force vectors as the most natural competitive layer. The physics engine already computes blast effects. Making them matter competitively is the smallest delta from solo play to PvP.

2. **Dual-board reading as skill ceiling.** Ideas 4 (type targeting) and 3 (counter-chain) both reward players who can read two boards at once. This is the Tetris vs. Puyo Puyo pattern: the split between "optimize my play" and "disrupt your play" creates the deepest competitive decisions.

3. **The chain-as-resource tension.** Multiple ideas (2, 3, 6, 7) embed the same insight from the Tetris Test: triggering a chain costs you dots. Waiting grows your potential but risks opponent action. This tension -- "fire now for guaranteed small value, or invest for uncertain large value" -- is the beating heart of competitive puzzle games. The best final design must make this tension legible and central.

**What is still missing:**

- **A concrete garbage translation.** How does a chain on Board A become pressure on Board B? The Proposer gave five different answers (dead dots, spawn acceleration, type-targeted dumps, hostile schools, physics mods). Round 3 needs to converge on ONE translation that satisfies Dual-Purpose Action and Readable Battlefield simultaneously.

- **The async question.** Every idea assumes synchronous real-time play. But mobile players get interrupted. Is there an asynchronous mode (like Letterpress or Words With Friends) where the competitive design still works? The brainstorm has not addressed this at all.

- **Audio's competitive role.** The game's identity is musical chain reactions. None of the 15 ideas leverage audio as a competitive mechanic or feedback channel. What if you could HEAR your opponent's chain quality? What if the combined audio of both players' chains creates musical consonance when play is evenly matched and dissonance when one player dominates? The research section notes that Tetris Effect uses audio as a mode differentiator. This brainstorm has treated audio as decoration rather than design.

- **The Supernova integration.** The game already has a Multi-Tap Supernova mechanic (earned through consecutive clears, breaks the one-tap rule). How does Supernova interact with competitive play? Is it an offensive nuke? A defensive shield? A comeback mechanic? This is a powerful existing system that no idea has incorporated.

**The sharpest question for Round 3:**

The Proposer's strongest combo (Explosion Billiards + Tug-of-War + Counter-Chain) needs to be stress-tested against the Critic's framework. If it passes, it may be the answer. If it fails, the failure will reveal what the real answer looks like. Round 3 should build that idea in detail and try to break it.

---

*Round 2 complete. Tensions identified, ideas scored, progression mapped. The field is narrowing. Now we synthesize.*

---

## CRITIC — Round 2 Scoring

### Methodology

Each idea is scored pass / partial / fail against all 10 criteria. Criteria 1, 2, and 4 are non-negotiable: a single FAIL on any of them means outright rejection. Among the remaining 7 criteria (3, 5, 6, 7, 8, 9, 10), failing 3 or more means the idea needs fundamental rework before it can proceed.

I am scoring against what each idea ACTUALLY specifies, not what it could theoretically become with enough rework. Generous interpretation is the enemy of rigorous design.

Note: The Facilitator's Round 2 tensions (A through E) and the Proposer's three new combinations (A, B, C) sharpen several of my assessments. I reference those where they apply.

---

### Individual Scorecards

#### Idea 1: Puyo Garbage (Split Board)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | Tap to chain. No additional inputs. |
| 2 | Deterministic Depth | PASS | Same state + same tap = same chain = same garbage sent. Dead dot placement must be deterministic (spec is silent -- conditional pass). |
| 3 | Prediction Ceiling | PASS | Must predict both your chain AND how dead dots interact with opponent's board. Two-board lookahead. |
| 4 | Dual-Purpose Action | PASS | Chain clears your dots (defense against overflow) AND sends garbage (offense). Textbook dual-purpose. |
| 5 | Readable Battlefield | PARTIAL | Split board is legible. Grey dead dots are visually distinct. But Facilitator's Tension B applies: grey mixed with colored on 195x422px boards taxes readability. The Proposer's Combo A fix (typed garbage, not grey) would resolve this. |
| 6 | Puyo Setup Payoff | PASS | Bigger chains send disproportionately more garbage. Facilitator's Tension C applies: the cluster you are building toward may scatter. But this tension degrades the payoff rather than eliminating it. |
| 7 | Mode Portability | PASS | Solo zen = no garbage. AI = garbage against bot. PvP = garbage against player. Core chain mechanic unchanged. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Split board halves play area to ~195x422px. Tap precision may fall below 12mm threshold. |
| 9 | Comeback Mechanics | PARTIAL | Dead dots create density for bigger chain opportunities. But a cluttered board is harder to parse, not easier. Losing player's board becomes noisy. |
| 10 | Spectacle Proportionality | PASS | Bigger chains = more garbage = bigger visual impact. Natural scaling. |

**Result: 7 pass, 3 partial, 0 fail. SURVIVES.**

**Critical assessment:** Proven competitive framework with 30 years of evidence. The fatal weakness is that it is generic -- does not exploit Chain Reaction's unique physics. The Facilitator's 3/5 North Star score confirms: reading is "same as solo" with one additional layer. It works, but it is ordinary.

---

#### Idea 2: Tetris Downstack (Split Board, Overflow Loss)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | Tap to chain. |
| 2 | Deterministic Depth | PASS | Deterministic chain + deterministic spawn acceleration. |
| 3 | Prediction Ceiling | PARTIAL | Lookahead helps your board, but opponent effect (spawn acceleration) targets a board you cannot control. |
| 4 | Dual-Purpose Action | PARTIAL | Pause your spawns (defense) and accelerate opponent's spawns (offense). But defense is passive -- every tap is automatically defensive. No tension between attack and defend. Always chain big. |
| 5 | Readable Battlefield | PASS | Dot count = health bar. Instantly legible. |
| 6 | Puyo Setup Payoff | PARTIAL | Waiting grows density but brings you closer to overflow. Punishes patience more than it rewards it. |
| 7 | Mode Portability | PASS | Solo = manage overflow (already exists as continuous mode). |
| 8 | Mobile-Native Ergonomics | PARTIAL | Split board. |
| 9 | Comeback Mechanics | FAIL | Death spiral: losing player has MORE dots, FASTER spawning. Board gets objectively harder. No structural escape. In Tetris, garbage rows create new clearing opportunities. Here, incoming dots just increase difficulty. |
| 10 | Spectacle Proportionality | PASS | Board filling = tension. Big chain clearing = relief. |

**Result: 5 pass, 3 partial, 2 fail.** C4 PARTIAL on non-negotiable (borderline). C9 hard FAIL. Facilitator scored 2/5 North Star and flagged for elimination. **NEEDS REWORK.**

**Critical assessment:** Best readability of any overflow-based idea (criterion 5). Fatal weakness is the death spiral (criterion 9) and the pseudo-dual-purpose (criterion 4). The Proposer's Combo C tried to salvage this by adding counter-chains and billiards -- which actually addresses both failures. The standalone idea is weak; the combination is worth examining.

---

#### Idea 3: Puyo Counter-Chain (Split Board, Cancel Mechanic)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | Tap to chain. Cancel is automatic based on timing. |
| 2 | Deterministic Depth | PASS | Chain results deterministic. Cancel math deterministic (dot-for-dot). |
| 3 | Prediction Ceiling | PASS | Attack now, hold for counter, or invest? Timing the danger window adds prediction against opponent behavior. Facilitator scored 4/5 North Star. |
| 4 | Dual-Purpose Action | PASS | Chain during danger window = defense (cancel) + offense (surplus). Chain outside = pure offense. Timing determines the dual-purpose ratio. Cleanest dual-purpose in the split-board category. |
| 5 | Readable Battlefield | PARTIAL | Danger window concept needs visual language. Spectators will not intuitively grasp why garbage disappeared. |
| 6 | Puyo Setup Payoff | PASS | Counter-chain meta rewards patience: hold for danger window, fire bigger counter. Facilitator's Tension C applies (dots move) but the "counter reserve" concept (Facilitator's skill progression) shows patience is rewarded at the meta level, not the cluster level. |
| 7 | Mode Portability | PARTIAL | Solo zen: cancel mechanic is inert without an opponent. Needs a mode-specific garbage source. Facilitator's Tension D applies directly. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Split board. The 2-second danger window is manageable at that duration but could become a reaction-speed test if optimized shorter. |
| 9 | Comeback Mechanics | PASS | Trailing player receives more garbage = more cancel opportunities. Counter-chain converts opponent's attack into your own. Structurally sound. Best standalone comeback mechanics in the set. |
| 10 | Spectacle Proportionality | PASS | Successful counter = dramatic reversal. Incoming garbage shattering mid-flight. Natural crescendo. |

**Result: 7 pass, 3 partial, 0 fail. SURVIVES.**

**Critical assessment:** Richest standalone decision tree in the set. Active defense via cancellation is the gold standard competitive mechanic, proven by 30 years of Puyo Puyo. Fatal weakness is mode portability (C7 partial) and the liveness concern (Tension C). The Proposer correctly identified this as a critical component in all three of their new combinations.

---

#### Idea 4: Puzzle Fighter Gem Crash (Split Board, Type Targeting)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | Tap to chain. Targeting is automatic. |
| 2 | Deterministic Depth | PASS | Type-to-location mapping is deterministic. |
| 3 | Prediction Ceiling | PASS | Facilitator scored 4/5 -- dual-board reading. |
| 4 | Dual-Purpose Action | PARTIAL | Chain scores (offense) and disrupts formations (offense-via-garbage). Where is the defense? Depends on unspecified lose condition. |
| 5 | Readable Battlefield | FAIL | Type-to-location mapping is opaque. Anti-pattern 2. Facilitator's Tension B applies at maximum severity. |
| 6 | Puyo Setup Payoff | PASS | Mono-type chain building is a setup investment. |
| 7 | Mode Portability | PARTIAL | Targeting is opponent-specific. Solo zen has no target. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Split board + type discrimination on tiny screens. |
| 9 | Comeback Mechanics | PARTIAL | Surgical disruption possible but leader has same tools. |
| 10 | Spectacle Proportionality | PARTIAL | Competitive meaning invisible without understanding type system. |

**Result: 4 pass, 5 partial, 1 fail.** C4 PARTIAL on non-negotiable (borderline). C5 hard FAIL. **NEEDS REWORK.**

**Critical assessment:** The type-composition strategy is genuinely novel and deep (Facilitator Tier A progression). Fatal weakness is readability (criterion 5). Super Puzzle Fighter's crash gem system is one of the genre's most opaque mechanics. Replicating that opacity on mobile violates anti-pattern 2.

---

#### Idea 5: Shared Resource Race (Shared Board)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | |
| 2 | Deterministic Depth | FAIL | Simultaneous taps on shared board = race condition. Facilitator's Tension A and E apply at maximum severity. Outcome depends on unpredictable opponent tap timing at sub-100ms resolution. |
| 3 | Prediction Ceiling | FAIL | Prediction becomes opponent-modeling, not physics reading. Facilitator scored 2/5. |
| 4 | Dual-Purpose Action | PARTIAL | Score (offense) + deny (denial). No defense component. |
| 5 | Readable Battlefield | PARTIAL | One board (good). Attribution during simultaneous chains is chaotic. |
| 6 | Puyo Setup Payoff | FAIL | Patience punished. Opponent grabs clusters first. Anti-pattern 1. Facilitator flagged for elimination. |
| 7 | Mode Portability | PARTIAL | Solo = different experience (puzzle vs race). |
| 8 | Mobile-Native Ergonomics | PASS | Full screen, one board. Best ergonomics. |
| 9 | Comeback Mechanics | FAIL | Faster tapper compounds advantage. |
| 10 | Spectacle Proportionality | PARTIAL | |

**Result: 2 pass, 4 partial, 4 fail. FAILS C2 (non-negotiable). REJECTED.**

---

#### Idea 6: Momentum Siege (Split Board, Streak as Weapon)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | |
| 2 | Deterministic Depth | PARTIAL | "Shuffles their board" at 8x is explicitly random. |
| 3 | Prediction Ceiling | PARTIAL | Destroys opponent's prediction ability. Asymmetric, not deep. |
| 4 | Dual-Purpose Action | PARTIAL | Pure escalating offense. No shield component. |
| 5 | Readable Battlefield | PARTIAL | Effects not visually self-evident. Anti-pattern 2+4. |
| 6 | Puyo Setup Payoff | PASS | Streak maintenance rewards sequence planning. |
| 7 | Mode Portability | FAIL | Solo: streak effects meaningless. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Split board + streak UI. Anti-pattern 4. |
| 9 | Comeback Mechanics | FAIL | Rich-get-richer spiral. |
| 10 | Spectacle Proportionality | PASS | Escalating streak = escalating effects. |

**Result: 3 pass, 4 partial, 3 fail.** C2 and C4 both PARTIAL on non-negotiables. Fails 3+ remaining. **NEEDS FUNDAMENTAL REWORK.**

The Proposer's Combo B reworks this into a pure multiplier (no automatic effects, no shuffle). That rework would resolve the C2, C4, and C9 failures. The standalone idea as specified is broken, but the Proposer has already identified the fix.

---

#### Idea 7: Tug-of-War Bar (Shared State)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | |
| 2 | Deterministic Depth | PASS | |
| 3 | Prediction Ceiling | PARTIAL | One-variable optimization. "Chain big" is always optimal. Facilitator scored 3/5. |
| 4 | Dual-Purpose Action | FAIL | Offense and defense are the identical action with zero trade-off. The meter push is single-dimensional. There is no decision between attacking and defending -- every chain does both equally. The Facilitator acknowledged this shallowness indirectly (3/5 North Star: "adds one strategic layer"). |
| 5 | Readable Battlefield | PASS | Best readability in the set. Central meter, instantly legible. |
| 6 | Puyo Setup Payoff | PARTIAL | Bigger chains push more, but meter drifts during setup time. |
| 7 | Mode Portability | PARTIAL | Solo: meter drifts toward you (Facilitator noted this works). But the competitive pressure is artificial -- playing against a timer dressed as a meter. |
| 8 | Mobile-Native Ergonomics | PASS | Meter on board edge. No attention split. |
| 9 | Comeback Mechanics | PASS | Meter drifts to center. Structural rubber-banding. Single massive chain swings dramatically. Best comeback mechanics for a rejected idea. |
| 10 | Spectacle Proportionality | PASS | Meter position = tension. Big swing = drama. |

**Result: 6 pass, 3 partial, 1 fail. FAILS C4 (non-negotiable). REJECTED.**

This is the most painful rejection. The readability (C5) and comeback mechanics (C9) are the best in the set. But the C4 failure is structural: single-dimension strategy. The Proposer implicitly acknowledged this by never proposing the tug-of-war as a standalone game -- it always appears as a scoring layer underneath billiards (dark horse, Combo B). As the Facilitator observed: the meter is not a game, it is a scoreboard. The question is what game sits underneath it. The Proposer and Facilitator converge on "billiards sits underneath it," which is the right answer.

---

#### Idea 8: Schooling Invasion (Split Board, Cross-Board Boids)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | |
| 2 | Deterministic Depth | PARTIAL | Boid disruption is emergent and high-dimensional. |
| 3 | Prediction Ceiling | PARTIAL | Cross-board boid effects are effectively unpredictable. |
| 4 | Dual-Purpose Action | PARTIAL | Offense is indirect and unpredictable. Single-purpose in player agency. |
| 5 | Readable Battlefield | FAIL | Causal chain from chain to disruption is opaque. Anti-pattern 2. |
| 6 | Puyo Setup Payoff | PARTIAL | Payoff (hostile boids) is noise. |
| 7 | Mode Portability | FAIL | No solo analog. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Split board. |
| 9 | Comeback Mechanics | PARTIAL | Uncontrollable. |
| 10 | Spectacle Proportionality | PARTIAL | Impact unclear, so spectacle is disconnected from meaning. |

**Result: 1 pass, 6 partial, 3 fail.** C2 and C4 PARTIAL on non-negotiables. Fails C5 + C7. **NEEDS FUNDAMENTAL REWORK.**

---

#### Idea 9: Territory Hex (Shared Board, Zones)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | |
| 2 | Deterministic Depth | PARTIAL | Shared board simultaneity + zone-cascade ambiguity. |
| 3 | Prediction Ceiling | PARTIAL | Zone control rewards tapping frequency over prediction depth. |
| 4 | Dual-Purpose Action | PASS | Claim (offense) + deny (defense). Genuine trade-off between reclaim vs. extend. |
| 5 | Readable Battlefield | PARTIAL | Hex grid on continuous physics creates aesthetic conflict. Facilitator called this "a discrete system imposed on a continuous one." |
| 6 | Puyo Setup Payoff | FAIL | Frequent tapping to hold zones beats patience. Anti-pattern 1. |
| 7 | Mode Portability | FAIL | Territory control requires opponent. No zen analog. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Hex grid + precision targeting in small hexes. |
| 9 | Comeback Mechanics | PARTIAL | Zones reclaimable but leader has structural advantage. |
| 10 | Spectacle Proportionality | PARTIAL | Points-per-second is invisible action. |

**Result: 2 pass, 5 partial, 3 fail.** C2 PARTIAL on non-negotiable. Fails C6 + C7. The Facilitator's "most overrated" assessment is justified. **NEEDS FUNDAMENTAL REWORK.**

---

#### Idea 10: Physics Sabotage (Split Board, Rule Mutation)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | FAIL | Modifier selection = second input. Facilitator scored 2/5 North Star and flagged for elimination. |
| 2 | Deterministic Depth | PARTIAL | "Random velocity injection" is explicitly non-deterministic. |
| 3 | Prediction Ceiling | PARTIAL | Opponent's physics modifications invalidate predictions. |
| 4 | Dual-Purpose Action | PARTIAL | Two-step combo, not inherent dual-purpose. |
| 5 | Readable Battlefield | FAIL | Cause and effect spatially disconnected. Anti-pattern 2. |
| 6 | Puyo Setup Payoff | PARTIAL | |
| 7 | Mode Portability | FAIL | No solo analog. |
| 8 | Mobile-Native Ergonomics | FAIL | Modifier menu during real-time play. Anti-pattern 4. |
| 9 | Comeback Mechanics | PARTIAL | |
| 10 | Spectacle Proportionality | PARTIAL | |

**Result: 0 pass, 5 partial, 5 fail. FAILS C1 (non-negotiable). REJECTED.**

---

#### Idea 11: Shared Board Fog of War

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | |
| 2 | Deterministic Depth | FAIL | Tapping into invisible areas means outcome depends on unknown dot positions. Determinism without information is indistinguishable from randomness for the player. |
| 3 | Prediction Ceiling | FAIL | Cannot predict what you cannot see. Core physics-prediction skill requires visibility. |
| 4 | Dual-Purpose Action | PARTIAL | Chain scores + expands vision. No trade-off: you always want both. |
| 5 | Readable Battlefield | FAIL | Most action is literally invisible. Least readable design in the set. |
| 6 | Puyo Setup Payoff | FAIL | Cannot set up what you cannot see. Vision shrinks with patience. Anti-pattern 1. |
| 7 | Mode Portability | FAIL | Solo zen with fog is anxiety, not zen. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Single board but tapping invisible areas = guessing. |
| 9 | Comeback Mechanics | PARTIAL | Limited vision = harder comeback. |
| 10 | Spectacle Proportionality | FAIL | Spectacular moments happen in fog. Invisible. |

**Result: 1 pass, 3 partial, 6 fail. FAILS C2 (non-negotiable). REJECTED.**

**Disagreement with the Facilitator:** The Facilitator scored this 5/5 on the North Star and placed it Tier S for skill progression. I respect the reasoning but disagree with the conclusion. The Facilitator defines "reading" as "tracking dot trajectories through fog and maintaining a mental map." That is a valid skill, but it is a MEMORY and INFERENCE skill, not a PHYSICS PREDICTION skill. Chain Reaction's entire simulation harness (SCR, DHR, R50, Chaos Decay), its design philosophy (Rocket League principle: predictable physics = higher skill ceiling), and its core experience (DESIGN.md principle 5: "Dots Are Always In Motion" -- implying they are VISIBLE in motion) are built on the premise that players read VISIBLE physics. Fog of War subverts this foundation. The game's boid flocking with perturbations, wall bounces, and type interactions makes trajectory prediction through fog impractical beyond ~1 second. This is not the Rocket League "three shots ahead" skill -- it is the "guess and hope" skill.

A Fog of War variant might make an excellent standalone game. It is not the right competitive mode for THIS game.

---

#### Idea 12: Dot Economy (Split Board, Draft Mechanic)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | FAIL | Drafting is a second action type. Two interaction zones (river + board). |
| 2 | Deterministic Depth | PASS | |
| 3 | Prediction Ceiling | PARTIAL | Two weakly coupled skill axes. |
| 4 | Dual-Purpose Action | FAIL | Drafting and chaining serve separate single purposes. |
| 5 | Readable Battlefield | PARTIAL | Three visual zones. Anti-pattern 4. |
| 6 | Puyo Setup Payoff | PARTIAL | |
| 7 | Mode Portability | PARTIAL | |
| 8 | Mobile-Native Ergonomics | FAIL | Two tap zones + split board = three attention areas. Anti-pattern 4 maximum. |
| 9 | Comeback Mechanics | PARTIAL | |
| 10 | Spectacle Proportionality | PARTIAL | |

**Result: 1 pass, 5 partial, 4 fail. FAILS C1 AND C4 (both non-negotiable). REJECTED.**

---

#### Idea 13: Explosion Billiards (Shared Board, Indirect Combat)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | Blast force is a physics consequence of the explosion, not a separate action. |
| 2 | Deterministic Depth | PARTIAL | Shared-board simultaneity problem (Facilitator's Tension A). However, blast force on surviving dots is deterministic given explosion location. Force vectors add linearly. The Facilitator's Tension E question ("how much opponent-induced state change is acceptable?") may have a billiards-specific answer: "a lot, because reading the opponent's blast intent becomes the skill." With turn-based alternation: PASS. Without: PARTIAL. |
| 3 | Prediction Ceiling | PASS | Facilitator scored 5/5 North Star and ranked Tier S for skill progression. Expert reads blast -> scatter -> cluster formation -> next tap. Multi-step positional play with unbounded prediction depth. The billiards analogy maps directly. The Proposer's extended North Star test ("I saw that my 3-chain would push the blue cluster into a 7-chain setup, AND that my opponent was on cooldown...") demonstrates 4-layer perception from a single tap decision. |
| 4 | Dual-Purpose Action | PASS | Every explosion simultaneously: (a) catches dots for score (offense), (b) pushes survivors (positional control) -- offensive (disrupt opponent) or defensive (consolidate own). The DIRECTION of push is encoded in tap position. The Facilitator identified this as "the physics engine itself is the competitive mechanic." Most elegant dual-purpose in the set. |
| 5 | Readable Battlefield | PARTIAL | One board (good). Dots flying after explosions is dramatic (good). But attributing whose explosion pushed which dots is hard when both players are active. Causation is hard to parse for spectators. |
| 6 | Puyo Setup Payoff | PASS | Positional investment. Small tap that pushes dots into future cluster = patient setup play that greedy tapping cannot replicate. This RESOLVES the Facilitator's Tension C: "setup" in billiards is positional, not structural. You set up by understanding where motion takes things, not by freezing them in place. The board is always in motion, and that is the point. The Proposer made this same observation, and I agree fully. |
| 7 | Mode Portability | PASS | Solo zen = physics sandbox (blast force + chain = satisfying). AI = bot reads blast physics. PvP = both play billiards. The blast force IS the game. No mode-specific rules. Facilitator identified this as one of only two ideas that naturally port to all three modes. Solo practice of "position dots for next tap" directly improves PvP. This answers Facilitator's Tension D. |
| 8 | Mobile-Native Ergonomics | PASS | One shared board, full screen. No split-screen, no UI panels, no secondary zones. Best ergonomics. |
| 9 | Comeback Mechanics | PARTIAL | Shared board is symmetric. No structural advantage for trailer. The trailing player can disrupt the leader's clusters with targeted blasts, but the leader can do the same. |
| 10 | Spectacle Proportionality | PASS | Big explosions = big displacement = visual drama. Intensity scales with impact. |

**Result: 7 pass, 3 partial, 0 fail. SURVIVES.** Tied for highest pass count. Strongest criterion 3, 6, and 7 scores. The Facilitator and Proposer both converge on this as the core competitive innovation.

**Critical assessment:** The strongest feature is that blast force creates unbounded positional prediction depth using ONLY the existing physics engine. Every tap is simultaneously scoring, positional investment, and disruption -- the richest dual-purpose action in the set without bolted-on mechanics. The fatal weakness is shared-board simultaneity (C2 partial) and comeback mechanics (C9 partial). Both are addressed by combining with Ideas 7 and 3 (as the Proposer's dark horse and all three new combos recognize). The Facilitator's testability observation is important: "Is blast force even enough to create meaningful board-state changes? This is testable." The simulation harness can answer this before any design commitment.

---

#### Idea 14: Asymmetric Ecosystem (Split Board, Predator-Prey)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | |
| 2 | Deterministic Depth | PARTIAL | Predator-prey eating depends on emergent boid behavior. |
| 3 | Prediction Ceiling | PARTIAL | Rule complexity exceeds human prediction capacity. |
| 4 | Dual-Purpose Action | PARTIAL | No defensive component against incoming predators. |
| 5 | Readable Battlefield | FAIL | Same color = different behavior per board. Anti-pattern 2 at maximum. |
| 6 | Puyo Setup Payoff | PARTIAL | Board self-modifies via predator-prey outside player control. |
| 7 | Mode Portability | FAIL | Asymmetry requires two boards. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Cognitive overhead of tracking per-board rules. |
| 9 | Comeback Mechanics | PARTIAL | No structural advantage for trailer. |
| 10 | Spectacle Proportionality | PARTIAL | Competitive meaning invisible without rule understanding. |

**Result: 1 pass, 6 partial, 3 fail.** C2 and C4 PARTIAL on non-negotiables. Fails C5 + C7. **NEEDS FUNDAMENTAL REWORK.**

---

#### Idea 15: Time Rewind Gambit (Split Board, Risk/Reward)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | FAIL | Commit/rewind = two-step action. Second decision dimension beyond position and timing. |
| 2 | Deterministic Depth | PASS | Preview shows deterministic result. |
| 3 | Prediction Ceiling | PARTIAL | Preview ELIMINATES need for prediction. Reveals the answer before commitment. Deprecates the core physics-prediction skill. Facilitator: "inverts the North Star question -- rewards seeing what happened, not what will happen." |
| 4 | Dual-Purpose Action | PARTIAL | Commit (offense) and rewind (information at cost) are two separate decisions, not dual-purpose within one action. |
| 5 | Readable Battlefield | PARTIAL | Ghost chain visible. Commit/rewind decision invisible to spectators. |
| 6 | Puyo Setup Payoff | FAIL | Preview eliminates setup risk. Trial-and-error replaces patience. |
| 7 | Mode Portability | PARTIAL | Solo: rewind has no cost. Becomes infinite undo, removing all challenge. |
| 8 | Mobile-Native Ergonomics | PARTIAL | Commit/rewind needs UI mechanism. |
| 9 | Comeback Mechanics | PARTIAL | Rewind cost (opponent speed boost) hurts trailer more than leader. |
| 10 | Spectacle Proportionality | PARTIAL | Spectacular moments erased by rewind. Anti-spectacle. |

**Result: 1 pass, 6 partial, 3 fail. FAILS C1 (non-negotiable). REJECTED.**

---

### Summary Table

| Idea | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | Non-Neg? | Verdict |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|----------|---------|
| 1. Puyo Garbage | P | P | P | P | ~ | P | P | ~ | ~ | P | clear | **SURVIVES** |
| 2. Tetris Downstack | P | P | ~ | ~ | P | ~ | P | ~ | F | P | C4 borderline | REWORK |
| 3. Counter-Chain | P | P | P | P | ~ | P | ~ | ~ | P | P | clear | **SURVIVES** |
| 4. Gem Crash | P | P | P | ~ | F | P | ~ | ~ | ~ | ~ | C4 borderline | REWORK |
| 5. Shared Race | P | **F** | F | ~ | ~ | F | ~ | P | F | ~ | **C2 FAIL** | **REJECTED** |
| 6. Momentum Siege | P | ~ | ~ | ~ | ~ | P | F | ~ | F | P | C2,C4 brdln | REWORK |
| 7. Tug-of-War | P | P | ~ | **F** | P | ~ | ~ | P | P | P | **C4 FAIL** | **REJECTED** |
| 8. Schooling Invasion | P | ~ | ~ | ~ | F | ~ | F | ~ | ~ | ~ | C2,C4 brdln | REWORK |
| 9. Territory Hex | P | ~ | ~ | P | ~ | F | F | ~ | ~ | ~ | C2 brdln | REWORK |
| 10. Physics Sabotage | **F** | ~ | ~ | ~ | F | ~ | F | F | ~ | ~ | **C1 FAIL** | **REJECTED** |
| 11. Fog of War | P | **F** | F | ~ | F | F | F | ~ | ~ | F | **C2 FAIL** | **REJECTED** |
| 12. Dot Economy | **F** | P | ~ | **F** | ~ | ~ | ~ | F | ~ | ~ | **C1+C4 FAIL** | **REJECTED** |
| 13. Expl. Billiards | P | ~ | P | P | ~ | P | P | P | ~ | P | clear | **SURVIVES** |
| 14. Asymmetric Eco | P | ~ | ~ | ~ | F | ~ | F | ~ | ~ | ~ | C2,C4 brdln | REWORK |
| 15. Time Rewind | **F** | P | ~ | ~ | ~ | F | ~ | ~ | ~ | ~ | **C1 FAIL** | **REJECTED** |

Key: P = pass, ~ = partial, F = fail, **bold** = non-negotiable fail, brdln = borderline

---

### Outright Rejections (Non-Negotiable Failures)

| Idea | Failed Non-Negotiable | Root Cause |
|------|----------------------|------------|
| 5. Shared Race | C2 | Simultaneous taps = race condition. Unpredictable from player's perspective. |
| 7. Tug-of-War | C4 | Offense and defense collapse into identical action. Zero trade-off. |
| 10. Physics Sabotage | C1 | Modifier menu = second input. |
| 11. Fog of War | C2 | Invisible dots = unpredictable outcomes. |
| 12. Dot Economy | C1 + C4 | Drafting = second action type. Two single-purpose actions. |
| 15. Time Rewind | C1 | Commit/rewind = second decision. Deprecates prediction skill. |

---

### Needs Fundamental Rework

| Idea | Key Failures | What Is Broken |
|------|-------------|----------------|
| 2. Tetris Downstack | C4 borderline, C9 fail | Death spiral. Pseudo-dual-purpose. |
| 4. Gem Crash | C4 borderline, C5 fail | Type-targeting is opaque. Anti-pattern 2. |
| 6. Momentum Siege | C2+C4 borderline, C7+C9 fail | Random shuffle. No counter. Rich-get-richer. PvP-only. |
| 8. Schooling Invasion | C2+C4 borderline, C5+C7 fail | Boid disruption is noise. Opaque. No solo mode. |
| 9. Territory Hex | C2 borderline, C6+C7 fail | Speed > depth. Discrete grid on continuous simulation. No zen mode. |
| 14. Asymmetric Eco | C2+C4 borderline, C5+C7 fail | Per-board rules = maximum tutorial dependency. |

---

### Response to the Dark Horse Combination: 13 + 7 + 3

**Original dark horse (from Proposer Round 1): Explosion Billiards + Tug-of-War + Counter-Chain.**

Scoring the combination:

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | One-Tap Fidelity | PASS | All three components preserve one-tap. |
| 2 | Deterministic Depth | PARTIAL | Shared-board simultaneity persists from Idea 13. With turn-based alternation: PASS. |
| 3 | Prediction Ceiling | PASS | 5-dimensional lookahead: chain count + blast geometry + meter push + counter timing + next-tap positioning. |
| 4 | Dual-Purpose Action | PASS | This is the KEY fix for Idea 7's C4 failure. Adding counter-chains means: chain during danger window = cancel (defense) + surplus push (offense) + blast positioning (dual). Chain outside danger window = pure push (offense) + blast positioning (dual). TIMING creates genuine offense/defense trade-off. |
| 5 | Readable Battlefield | PARTIAL | Meter is instantly legible. Blast physics are dramatic. Counter-cancel needs visual language. Solvable. |
| 6 | Puyo Setup Payoff | PASS | Blast force enables positional setup. Counter-chain rewards patience (hold for danger window). |
| 7 | Mode Portability | PARTIAL | Solo zen = billiards sandbox (no meter, no counter). PvP = full system. Solo drops 2/3 components but billiards alone is a complete game. Acceptable per Tetris Effect precedent. |
| 8 | Mobile-Native Ergonomics | PASS | Single board + edge meter. No panels, no menus. |
| 9 | Comeback Mechanics | PASS | Meter drift-to-center + counter-chain conversion. Better comeback than either component alone. |
| 10 | Spectacle Proportionality | PASS | Meter tension + blast drama + counter reversal. |

**Result: 8 pass, 2 partial (C2, C5), 0 fail.**

With turn-based alternation: **9 pass, 1 partial (C5), 0 fail.**

This is the highest score of any idea or combination in the entire brainstorm. The C5 partial (counter-cancel readability) is a visual design task, not a structural problem.

**The gap:** Shared-board simultaneity (C2). Turn-based alternation is the likely solution and was independently suggested by the Facilitator's Tension A design question. Turn-based play adds benefits: deepens positional reading (you see opponent's blast before yours), prevents frantic tapping (anti-pattern 1), creates natural rhythm. The cost -- tempo shift from real-time to turn-based -- is acceptable because dots continue moving between turns, keeping the board dynamic.

---

### Response to the Proposer's Three New Combos

The Proposer proposed three combinations in Round 2. Brief assessments:

**Combo A: Billiards Garbage (13 + 1 + 7)**

The "typed garbage" fix (garbage dots match the type that created them, visually dimmed) is an excellent solution to the Facilitator's Tension B. "Garbage as fuel" (skilled defender pushes garbage into their own clusters for combined chains) creates richer defense than simple garbage conversion. This is a meaningful improvement over Idea 1 alone. My concern: split boards re-introduce the ergonomics problem (C8) that the shared-board billiards avoids. The billiards physics would operate on two separate boards, which weakens the "billiards" analogy (in real pool, both players share the table). Split-board billiards is less elegant than shared-board billiards.

**Combo B: Momentum Billiards (13 + 7 + momentum)**

The momentum-as-pure-multiplier rework resolves all three failures of Idea 6 (C2, C4, C9). Streak multiplier on meter push creates risk/reward depth (safe 3-chain vs risky 6-chain to maintain streak). "Breaking streak causes meter stumble" is a structural comeback mechanic. This is stronger than the dark horse combo IF the streak system adds enough decision complexity to compensate for losing counter-chains. My concern: without counter-chains, defense is still passive. The streak multiplier makes offense more nuanced but does not create active defense. The dark horse (13+7+3) has richer defense.

**Combo C: Counter-Billiards Overflow (13 + 3 + 2)**

The Proposer's pick. Mode portability is the strongest feature: solo = continuous mode (already exists). The overflow lose condition + counter-chains + billiards positioning creates a three-layer decision: (a) clear space to survive, (b) send dots to opponent, (c) position remaining dots for future clears. The North Star test the Proposer wrote is compelling: "I sacrificed clearing the urgent zone to create a better position everywhere else." My concern: this brings back the death spiral from Idea 2. The losing player has more dots, faster spawning, AND must now also read billiards physics on a cluttered board. Counter-chains mitigate this (incoming dots = cancel opportunities), but the base overflow pressure still compounds against the trailer. The tug-of-war meter (from the dark horse) has better comeback mechanics because the meter drifts to center -- the overflow does not drift back.

**My ranking of the four combos:**

1. **Dark Horse (13+7+3)** -- 9P/1~ with turn-based alternation. Best comeback mechanics. Best dual-purpose balance. Only partial is a visual design task.
2. **Combo B (Momentum Billiards)** -- Strong risk/reward from streak. But passive defense.
3. **Combo A (Billiards Garbage)** -- "Garbage as fuel" is rich. But split boards weaken the billiards analogy.
4. **Combo C (Counter-Billiards Overflow)** -- Best portability. But retains the death spiral from Idea 2.

---

### Response to Facilitator Anti-Patterns

| Anti-Pattern | Violating Ideas | Severity | Notes |
|--------------|----------------|----------|-------|
| 1. Reaction-speed test | 5 (race), 9 (zone reclaim), 11 (vision maintenance) | Structural | All three are speed games. |
| 1. Reaction-speed (conditional) | 3 (danger window) | Tunable | At 2 seconds: manageable. If shortened: devolves. Window duration is a parameter. |
| 2. Requires tutorial | 4 (type targeting), 8 (boid disruption), 10 (modifiers), 14 (per-board rules) | Structural | In all four, the cause of what the player sees is invisible or non-obvious. |
| 3. Memorization over adaptation | None | N/A | Chain Reaction's boid physics ensures no two board states repeat. Natural strength. |
| 4. Split attention (board vs UI) | 6 (streak UI), 10 (modifier menu), 12 (river zone) | Structural | All three add attention sources outside the playfield. |

The dark horse combination (13+7+3) violates NONE of the anti-patterns with turn-based alternation. The meter is peripheral (not attention-splitting). The counter-chain is timing-based (not reaction-speed). The blast physics are visible (not tutorial-dependent). The board state is always novel (not memorizable).

---

### TOP 3 (Highest Scoring)

**1. Idea 13: Explosion Billiards** (7P / 3~ / 0F)

The only idea that extends Chain Reaction's existing physics into a competitive dimension. Best prediction ceiling (Facilitator 5/5, Tier S). Best mode portability (solo practice = PvP skill). Best ergonomics (single full-screen board). Resolves Facilitator Tensions C and D. Remaining weaknesses (C2, C9) both addressed by combination with Ideas 7 and 3. All three agents (Proposer, Facilitator, Critic) converge on this as the core innovation.

**2. Idea 3: Puyo Counter-Chain** (7P / 3~ / 0F)

Richest standalone decision tree. Active defense via cancel-to-surplus is the gold standard competitive mechanic. Best standalone comeback mechanics (C9 pass). 30 years of competitive evidence. The Facilitator's Tier A skill progression confirms 4-level depth. Weakness: mode portability (C7 partial). Serves as the defense layer in the dark horse combo, fixing Idea 7's C4 failure.

**3. Idea 1: Puyo Garbage** (7P / 3~ / 0F)

Safest bet. Proven framework, clean dual-purpose, strong mode portability. All three partials are solvable. Weakness: generic. Does not leverage Chain Reaction's unique physics. Facilitator 3/5 North Star confirms: solid but ordinary.

**The dark horse combination (13+7+3) scores 8-9P / 1-2~ / 0F and should be the primary candidate for Round 3.**

---

### BOTTOM 3 (Should Be Eliminated)

**1. Idea 11: Fog of War** (1P / 3~ / 6F)

Six failures. Hiding the physics state removes the game's only skill axis. A memory/inference game, not a physics-prediction game. Deep in its own right but incompatible with Chain Reaction's design foundation.

**2. Idea 10: Physics Sabotage** (0P / 5~ / 5F)

Zero passes. Modifier menu breaks the game's entire interaction model. Facilitator flagged for elimination. No redeeming structural feature.

**3. Idea 12: Dot Economy** (1P / 5~ / 4F)

Fails two non-negotiables simultaneously. Two games wearing one skin. Three-zone attention model is anti-pattern 4 at maximum severity.

---

### Final Assessment Entering Round 3

The three agents have converged on a clear direction:

1. **Explosion Billiards is the core mechanic.** All three agents scored it highest. The Facilitator called it the most underrated. The Proposer built all three new combos around it.

2. **Tug-of-War is the win condition layer.** It failed as a standalone game (C4) but succeeds as a scoreboard. The meter provides readability, comeback rubber-banding, and spectacle proportionality.

3. **Counter-Chain is the defense layer.** It repairs the tug-of-war's C4 failure by making the timing of your chain (danger window vs. open play) a genuine offense/defense trade-off.

4. **Turn-based alternation is the likely tempo model.** It solves the shared-board simultaneity problem, prevents frantic tapping, deepens positional reading, and creates a billiards-native rhythm.

The open questions for Round 3:

- **Blast force parameters.** Is the blast force strong enough to create meaningful board-state changes? Testable via simulation.
- **Turn structure.** Fixed alternation (A-B-A-B) or simultaneous with deterministic resolution? How long is a "turn" when dots are always in motion?
- **Counter-chain on shared board.** In the dark horse, counter-chains need an "incoming pressure" to cancel. The tug-of-war meter push IS the incoming pressure. But if the meter push is instant (no travel time), there is no danger window to counter during. The danger window needs to be the meter push's TRAVEL TIME -- the push happens, the opponent sees it traveling, and has a window to counter before it resolves. This needs specification.
- **Supernova integration.** The Facilitator and Proposer both flagged this gap. In the dark horse, Supernova (3 taps) during a turn would be 3 separate blasts + 3 separate meter pushes. Offensive nuke or defensive shield? Both, depending on timing -- which is consistent with the dual-purpose principle.

*Round 2 Critic scoring complete. 6 rejected, 6 need rework, 3 survive standalone, 1 combination leads. The dark horse (13+7+3) with turn-based alternation is the strongest candidate. Round 3 should specify it in detail and stress-test blast force parameters via simulation.*
