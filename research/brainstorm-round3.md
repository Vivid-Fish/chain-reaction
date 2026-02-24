# Chain Reaction Competitive Design — Round 3 Synthesis

## Previously:

**Round 1 (Diverge):** The Proposer generated 15 competitive ideas across safe, medium, and wild tiers. The Critic established a 10-criterion evaluation framework with 3 non-negotiables (One-Tap Fidelity, Deterministic Depth, Dual-Purpose Action). The Facilitator set the North Star question -- "Before you tap, what did you SEE that your opponent missed?" -- and defined success criteria emphasizing legible physics, the chain as both sword and shield, and a PvP-AI-zen pipeline that is ONE game.

**Round 2 (Challenge):** The Proposer self-critiqued all 15 ideas, cutting 7 and proposing 3 new combinations. The Critic scored all 15 individually and ranked combinations. The Facilitator identified 5 structural tensions (A-E). Six ideas were rejected outright for non-negotiable failures. Six need fundamental rework. Three survived standalone: 13 (Explosion Billiards), 3 (Counter-Chain), and 1 (Puyo Garbage). All three agents converged on the same direction: **Explosion Billiards (13) + Tug-of-War (7) + Counter-Chain (3)** with turn-based alternation. The Critic scored this combination 9 pass / 1 partial / 0 fail -- the highest in the entire brainstorm.

---

## FACILITATOR -- Round 3 Synthesis

### 1. Resolving the Five Tensions

---

**Tension A: The Shared-Board Paradox**
*Does turn-based alternation fully resolve this?*

Yes, but with a nuance.

Turn-based alternation eliminates the race condition entirely. When it is your turn, you are the only person tapping. You read the board state that your opponent's previous turn created, and you have all the time you need to read it deeply. This directly satisfies Anti-Pattern #1 ("physics tempo must reward patience over frantic tapping") because there is no one grabbing dots while you think.

The nuance: dots are always in motion (Design Principle #5). The board is NOT frozen between turns. Boid flocking, drift, gravity wells -- all continue during your think time. So "patience" has a cost: the cluster you are reading may scatter while you deliberate. But this is the GOOD kind of time pressure -- it comes from the physics, not from the opponent's finger. You are racing the simulation, not a human reaction time. This is fundamentally different from the simultaneity problem and is exactly the Rocket League pattern: the ball keeps rolling whether or not you have decided where to hit it.

The shared board also has a critical advantage over split boards: you and your opponent are playing billiards on the SAME table. Your blast pushes dots into positions that your opponent must now deal with. Their blast creates the board you must read. This is the pool analogy made literal -- running the table means leaving the cue ball in a terrible position for the other player. Split-board billiards (Combo A) loses this entirely.

**Resolution: Turn-based alternation on a shared board. Dots continue moving between turns. The shared board is essential to the billiards identity.**

---

**Tension B: The Garbage Legibility Problem**
*Does the dark horse even HAVE garbage? What is the pressure transfer mechanic?*

No. The dark horse does not need garbage.

This is the most important simplification in the synthesis. Traditional competitive puzzle games (Puyo, Tetris) need garbage because the boards are separate -- you need a MESSENGER to carry pressure from Board A to Board B. But in Explosion Billiards on a shared board, your tap IS the pressure. When you detonate a chain, the blast force repositions surviving dots. Those dots are now in new positions that your opponent must deal with. You did not send garbage; you reshaped the battlefield.

The tug-of-war meter absorbs the "scoring" function of garbage. Your chain pushes the meter toward the opponent. The blast force absorbs the "disruption" function of garbage. Your explosion scattered the opponent's carefully-nurtured cluster. The counter-chain absorbs the "defense" function of garbage cancellation. When the meter is being pushed toward you, firing a chain during the danger window cancels the push and sends the surplus back.

No grey dots. No typed garbage. No dimmed/pulsing arrivals. No split-screen readability problem. The entire Tension B problem evaporates because there is nothing to "translate" between boards. There is one board. Everything on it is legible because everything on it is the same physics the player already understands.

**Resolution: No garbage system. Pressure transfer is the meter push from chains. Disruption is the blast force that repositions dots. Defense is the counter-chain that cancels incoming meter push. All three are consequences of the one-tap explosion on the shared board.**

---

**Tension C: The Setup-vs-Liveness Conflict**
*Does positional billiards resolve the "setup on a moving board" problem?*

Yes. This is the tension's cleanest resolution.

In traditional puzzle games, "setup" means building a structure: a Tetris well, a Puyo tower. The structure holds still until you trigger it. In Chain Reaction, nothing holds still. Clusters form and scatter. The "structure" decays every frame.

Billiards redefines setup as POSITIONAL INVESTMENT. You do not build a structure. You read a trajectory. You see that the red river is converging upper-left, and you predict that in 1.5 seconds those dots will be in chain range. That prediction IS your setup. A small tap now that pushes 3 blue dots toward the gravity well is setup -- not because those dots will stay put, but because you read where the gravity well will pull them.

The critical insight is that patience in billiards is not "waiting for a structure to complete." It is "reading deeper into the simulation's future." The patient player sees that the current board state leads to a better board state in 2 seconds if they do NOT tap now. The greedy player taps the biggest current cluster and destroys the future position. This is exactly the pool player who sinks the easy shot but leaves the cue ball against the rail versus the player who takes a harder shot that leaves the cue ball in the center of the table.

The momentum streak (from Combo B) reinforces this. Maintaining your streak through precise small chains -- rather than breaking it on risky big attempts -- is a form of patience that does not require the board to hold still. Your investment is in the streak multiplier, which persists regardless of board state.

**Resolution: "Patient setup" means reading deeper into the simulation's future trajectory, not building static structures. Blast-force positioning (using taps to push dots toward future clusters) is the billiards-native version of "building a Puyo tower." The board's liveness is a feature, not a problem.**

---

**Tension D: The Mode Portability Gap**
*What does solo zen look like? AI? How does practice transfer to PvP?*

Solo zen is the billiards sandbox. No meter. No opponent. No counter-chains. You tap, dots chain, survivors get pushed by blast force. Your goal is the same as the current continuous mode: survive, clear dots, build chains. But now blast force matters. You are not just clearing dots -- you are positioning survivors for your next tap.

This is the key portability insight: **the billiards skill transfers perfectly to PvP because the board-reading is identical.** In solo zen, you read blast trajectories to set up your own future chains. In PvP, you read the same blast trajectories but now you ALSO consider how they affect your opponent's options. The perceptual skill (reading where dots will end up after a blast) is the same. PvP adds a strategic layer (opponent modeling) on top of the same perceptual foundation.

The training pipeline:

1. **Solo zen (continuous mode + blast force):** Learn to read blast trajectories. Practice positional play. Develop intuition for "this small tap sets up a bigger chain." No meter, no opponent, no pressure beyond spawn rate. This is the "hitting balls in the practice room" phase.

2. **AI opponent (tug-of-war + turn-based):** Same blast physics, but now the meter adds stakes and the AI's turns reshape the board between yours. Learn to read the board AFTER someone else has blasted it. Learn counter-timing. The AI provides predictable but escalating challenge.

3. **PvP (full system):** Same physics, same meter, same counter-timing, but the opponent is unpredictable. The perceptual skills from zen transfer directly. The strategic skills from AI transfer directly. The only new skill is reading a human opponent's intent from their tap choices -- the "poker read" layer.

Compare this to a garbage-based system where solo zen has no garbage, AI has scripted garbage patterns, and PvP has reactive garbage. Each mode teaches different skills. The billiards pipeline teaches ONE skill (blast-trajectory reading) that deepens across modes.

**Resolution: Solo zen = continuous mode with blast force (no meter, no turns, no opponent). AI = tug-of-war on shared board vs. bot. PvP = same. The billiards skill (reading blast trajectories and positioning survivors) is the invariant core that transfers across all three modes. Twenty minutes of zen practice directly improves PvP because you are training the same perceptual muscle.**

---

**Tension E: The Determinism Dilemma**
*Does turn-based play resolve opponent-induced unpredictability?*

Yes, completely.

In turn-based play, when it is your turn, the board state is fully visible and no one else is modifying it. Same state + same tap = same outcome. The physics is deterministic. Your prediction problem is deterministic (modulo the continuous drift of dots, which is deterministic given current velocities and boid parameters).

The opponent's PREVIOUS turn changed the board state, but that change is already resolved before your turn begins. You see the result. You read it. You plan. This is exactly the chess analogy: the opponent's last move was "unpredictable" in the sense that you did not know what they would choose, but once they moved, the board state is fully determined and you can plan with perfect information.

The deeper question the Critic raised -- "how much opponent-induced state change per second is acceptable?" -- has a clean answer in turn-based play: ALL of it, but SEQUENTIALLY, not simultaneously. Each player's turn creates a large state change (blast force repositions many dots). But the opponent sees the complete result before acting. The "seeing" skill is not devalued by opponent action; it is ENRICHED by it, because now you must read a board that your opponent deliberately shaped against you.

**Resolution: Turn-based alternation makes the game fully deterministic from the active player's perspective. The opponent's turn creates state change, but that change is fully resolved and visible before your turn begins. Prediction skill is preserved and enriched by reading opponent-shaped board states.**

---

### 2. The Game: Explosion Billiards

#### Board Layout

**One shared board.** Full screen. Same dimensions as current solo play (390x844 phone viewport, scales to desktop). Dark background with colored dots. No split screen, no panels, no secondary zones.

A **tug-of-war meter** runs along one edge of the board (left edge on portrait phone, top edge on landscape). The meter is a thin bar (8-10px wide) with a center marker. It fills from the center outward: leftward/upward when Player 1 is winning, rightward/downward when Player 2 is winning. Player 1's color on their side, Player 2's color on their side. The meter is peripheral -- you glance at it, not stare at it. It encodes the score in the simulation, not in a HUD.

Dots spawn at edges (same as continuous mode), flow via boid flocking, obey gravity/volatile type rules. The dot population is tuned to the same parameters as solo continuous mode -- the board should feel alive, not sparse, with consistent opportunity density (F3 30-60%).

#### Turn Structure

**Strict alternation: Player A taps, then Player B taps, then A, then B.**

Each "turn" works as follows:

1. **The active player observes.** Dots are moving. The player reads the board: where are clusters forming? Where did the opponent's last blast push things? What is the meter position? Is there incoming pressure to counter?

2. **The active player taps.** One tap. The explosion resolves: dots are caught (chain cascades per existing mechanics), and surviving dots receive blast force proportional to proximity (inverse-square falloff from explosion center). The caught-dot count determines the meter push.

3. **Meter push animates.** The meter moves toward the opponent. The push amount is proportional to chain size (linear, with possible momentum-streak multiplier). The push is NOT instant -- it travels over 1.5-2 seconds. During this travel time, the opponent can see the incoming push.

4. **Danger window opens.** During the meter push's travel time, the opponent has a **counter window**. If it is now the opponent's turn and they fire a chain during this window, their chain CANCELS the incoming push dot-for-dot. Any surplus reverses direction and pushes the meter back toward the original attacker. If the opponent's chain is smaller than the incoming push, the difference still resolves as a smaller push toward the opponent.

5. **Turn passes.** The opponent is now the active player. Dots continue moving throughout. There is no pause. The board is always live.

**Timing:** There is a soft time limit per turn (8-10 seconds) to prevent indefinite stalling. If the timer expires, the turn passes without a tap. The timer is generous enough that it never triggers during normal play -- it exists only to prevent griefing in PvP.

**The rhythm:** This is NOT chess-clock deliberate. It is snappy. Most turns take 2-4 seconds. The game feels like a rally in table tennis: tap-respond-tap-respond. But the option to slow down and read deeply is always available.

#### Win Condition

The meter has a fixed length. If the meter reaches either end, that player loses. The meter drifts slowly toward center between turns (drift rate: ~2% of total meter length per turn, tunable). This drift provides:

- **Comeback rubber-banding:** A trailing player is never permanently behind. The meter slowly comes back toward them.
- **Decisive endgame:** Near the edges, even a small chain can push the meter to the end. This creates natural tension as the game progresses.
- **Draw prevention:** If the meter is near center after N turns (time limit), the player with positional advantage (meter on opponent's side) wins.

A game lasts roughly 30-60 seconds (15-30 turns per player). This matches the session-length design goal (pick up, play a round, put down).

#### Pressure Mechanic

The **counter-chain** is the active defense system. It works as follows:

- When your opponent's chain pushes the meter toward you, the push takes 1.5-2 seconds to fully resolve (visual: the meter bar animates smoothly).
- During this animation, it becomes your turn. You can tap anywhere on the board.
- If you fire a chain during this window, your chain's dot count CANCELS the incoming push dot-for-dot. A 5-dot push incoming, you counter with a 3-dot chain: net 2-dot push still comes toward you, but you survived most of it. You counter with a 7-dot chain: net 5-dot push goes BACK at the opponent. You effectively converted their attack into your offense.
- If you choose NOT to counter (because you see a better positional play), the full push resolves. This is a deliberate sacrifice: you ate the pressure to invest in board positioning.

**Danger windows create the offense/defense trade-off.** Every turn, you choose: (a) counter the incoming push (defense, possibly with surplus offense), (b) ignore the push and play for position (investment), or (c) there is no incoming push, so your chain is pure offense. This is the decision that makes the game deeper than "chain big every time."

#### Blast Force Behavior

When an explosion detonates (tap or cascade), all surviving dots within a blast radius receive a force vector pointing away from the explosion center. The force magnitude follows inverse-square falloff:

```
F = k / (distance^2 + epsilon)
```

Where:
- `k` is the blast force constant (tunable -- simulation harness should sweep this)
- `distance` is the distance from dot to explosion center
- `epsilon` prevents division by zero and limits close-range force

**Visual feedback (three layers, from Proposer Round 2):**

1. **Blast ring:** A brief expanding ring (shockwave ripple) from each explosion, visible for 0.3s. Shows the force radius. Communicates "something pushed things."

2. **Dot trails:** Dots that received significant blast force show a short motion trail (0.5s) in the color of the explosion that pushed them. The trail is the causal link: "that red explosion pushed these blue dots."

3. **Cluster glow:** When 3+ same-type dots are pushed into chain proximity (within R of each other), they briefly glow/pulse. This signals "this group is now chainable." Experts read the glow as opportunity; novices just see something inviting.

**Design parameters for simulation sweep:**
- Blast force constant `k`: Dots should move 20-60px from a nearby explosion (roughly 0.5-1.5 explosion radii). Less than 20px is imperceptible; more than 60px is chaotic.
- Falloff shape: Inverse-square ensures close dots move far (dramatic), distant dots move little (predictable).
- Cap: Maximum displacement per blast event to prevent screen-clearing pushes.

#### Mode Variants

**PvP (core):**
Full system as described. Turn-based alternation, shared board, tug-of-war meter, counter-chains, blast force. Online matchmaking or local pass-and-play.

**AI:**
Same rules. Bot opponent with tiered difficulty:
- Easy: Greedy bot (taps biggest cluster, ignores blast positioning)
- Medium: Greedy + counter-awareness (counters when able, otherwise greedy)
- Hard: Oracle bot with blast-force modeling (reads where blasts push dots, plans 2-tap sequences)

AI games use the same shared board, same turn structure, same meter. The AI's "turn" is visually displayed -- you see where the bot tapped and how dots moved. This teaches the player to read opponent-shaped board states.

**Solo zen (continuous mode + blast force):**
No meter. No turns. No opponent. Continuous spawning, same as current game. The only addition: blast force is active. Every explosion pushes surviving dots. The player learns to read blast trajectories and position dots for future chains. Score is the only measure. This is the practice mode that directly trains the PvP perceptual skill.

Supernova (Multi-Tap) works identically across all three modes. In PvP, a Supernova turn gives you 3 taps instead of 1. Three blast events in one turn can create dramatic meter pushes AND dramatic board repositioning. The opponent cannot counter all three pushes individually -- they resolve as one combined push with one counter window. Supernova is both an offensive nuke (huge meter push) and a board-sculpting tool (three blasts reshape the entire field).

---

### 3. Three Remaining Design Questions for Round 4

**Question 1: Blast Force Parameterization**

The entire design hinges on blast force being "strong enough to matter, weak enough to read." If dots barely move after an explosion, the billiards layer is decorative. If dots scatter wildly, the board becomes unpredictable between turns. The simulation harness needs a new metric: **Blast Displacement Distribution** -- how far do surviving dots move after a typical chain? The sweet spot is likely 30-50px (0.75-1.25 explosion radii on phone viewport), meaning a dot near an explosion moves about one explosion-width. This makes the displacement visually obvious but geometrically trackable.

This is testable before any competitive code exists. Add blast force to the solo simulation, measure displacement distribution, and sweep the force constant `k`. The question is not "should we do this?" but "what value of k puts us in the sweet spot?"

**Question 2: Momentum Streak Integration**

The Proposer's Combo B introduced the momentum streak as a meter-push multiplier. The Critic noted it creates risk/reward depth but leaves defense passive. In the current design, counter-chains provide active defense, so the passive-defense concern is addressed. But should the streak multiply the meter push?

Arguments for: A x5 streak making a 3-chain push as hard as a raw 5-chain push rewards consistent play and creates narrative arcs (building toward a streak-amplified attack). The "break the streak" counter-play is rich (force the opponent into a bad counter-tap that whiffs and resets their streak).

Arguments against: The streak is already in the solo game. Adding it to PvP might create a rich-get-richer dynamic where the player who chains first builds a streak advantage that compounds. The center-drift on the meter mitigates this, but the interaction needs simulation testing.

Round 4 should decide: Does the momentum streak multiply meter push, or is the meter push purely proportional to chain size?

**Question 3: Counter-Chain Depth -- Can You Counter a Counter?**

The current design says: Player A chains (pushes meter toward B), Player B counters during danger window (cancels push, surplus pushes back toward A). What happens next? Does A get a counter-counter window?

If yes: rallies. A attacks, B counters, A counter-counters. Each exchange sends a smaller net push (because each counter partially cancels). This creates exciting back-and-forth rallies but might feel chaotic and extend games.

If no: one attack, one counter window, done. The net push resolves and turns alternate normally. Simpler, faster, more predictable. But the "rally" drama is lost.

There is a middle ground: the counter window only opens when the incoming push exceeds a minimum threshold (e.g., net 3+ dots). Small pushes resolve instantly (no counter possible). Large pushes open the window. Counter-counters are possible but each exchange reduces the push, so rallies naturally dampen. This creates escalating drama only for big plays.

Round 4 should decide: Is the counter a single exchange or a dampened rally?

---

### 4. North Star Final Test

**"Before you tap, what did you SEE that your opponent missed?"**

The game is Explosion Billiards with tug-of-war meter and counter-chains, turn-based alternation on a shared board.

---

**Novice read (first 5 games):**

"I see a big cluster of dots. I tap it. Dots explode. The bar moves. Cool."

The novice does not read blast trajectories, does not think about countering, does not consider board positioning. They tap the biggest cluster they can see and enjoy the chain reaction. The meter gives them feedback ("I pushed the bar!") and the counter-chain happens naturally if they tap during the danger window without even knowing what the danger window is. The 60-second skill revelation: "I tapped, the bar moved. My opponent tapped, it moved back. Wait -- I just tapped during their push and it CANCELLED. I can fight back!"

The novice sees: the biggest cluster on the board.
What they missed: everything about positioning, blast force, and opponent timing.

---

**Intermediate read (after 20-30 games):**

"I see a 5-dot red cluster, but I also notice that detonating it will push those 3 blue dots toward the gravity well in the lower-left. If I tap the red cluster, I get a 5-push on the meter AND I set up a blue chain for next turn. My opponent probably sees the same red cluster. But do they see the blue setup?"

The intermediate player has discovered blast force. They notice that dots move after explosions and they start aiming for taps that have good "leave" -- billiards terminology for where the cue ball ends up after a shot. They begin to see two layers: the immediate chain and the resulting board state.

The intermediate sees: the chain AND the blast trajectory of survivors.
What they missed: the opponent's position, counter-timing, and 3-tap-ahead sequences.

---

**Advanced read (after 100+ games):**

"The meter is slightly toward me. My opponent just fired a 4-chain that scattered my green school. I see their push coming (4 dots traveling on the meter). I have a 3-chain available that would cancel 3 of those 4 dots. But I ALSO see that the blast from my counter-tap would push the scattered green dots back into proximity -- and my opponent clearly scattered them on purpose to deny my green chain. If I counter now with 3, I eat almost all the push AND I reassemble my green cluster via blast force. Net: I eat 3 of their 4 push, take 1 dot of damage, but set up a green 6-chain for next turn. If I DON'T counter, I take the full 4 push (bad) but I can use my turn for a 5-chain in the upper-right that my opponent has not noticed yet. The 5-chain push is bigger than the 4 I am eating. Do I defend or attack?"

The advanced player is reading three layers simultaneously: counter-timing (should I cancel?), blast positioning (where does my counter leave the board?), and opponent modeling (did they scatter my greens on purpose? what are they setting up?).

The advanced sees: counter-timing, blast positioning, AND opponent intent.
What they missed: the 4-tap-ahead sequence where defending now leads to a streak-amplified attack in 3 turns.

---

**Master read (tournament level):**

"I have been maintaining a x4 streak. The meter is near center. My opponent just fired a modest 3-chain -- suspiciously modest, because I can see a 6-chain they deliberately did NOT take. Why? They used the 3-chain to push 4 volatile dots toward my gravity well. In 2 seconds, the volatile cluster will be IN the gravity well, creating an unstable super-cluster that will either be a massive chain (if I tap it at the right moment) or a trap (if the volatile dots scatter before I can tap). My opponent WANTS me to go for that super-cluster -- because if I tap it and miss the timing window, my streak breaks. And they have a 6-chain loaded on the other side of the board, ready to fire next turn when my streak is broken and I cannot counter with multiplied force. They are sacrificing 3 dots of meter push to bait me into breaking my streak.

I see the bait. I ignore the volatile super-cluster entirely. Instead, I fire a small 2-chain on the far side that does three things: (a) counters their 3-push (net 0 after cancel, I eat 1 dot of push), (b) pushes the 6-chain cluster they were saving -- the blast scatters their loaded weapon, (c) maintains my x5 streak. Next turn, they have no 6-chain left, my streak is intact, and the volatile super-cluster (which I never touched) has drifted away from the gravity well. I sacrificed a flashy 8-chain opportunity to dismantle my opponent's entire plan with a quiet 2-chain."

The master sees: the opponent's multi-turn strategy, the bait, the loaded weapon, AND the precise small tap that dismantles it all while maintaining their own strategic position.
What they missed: nothing. The opponent missed that the master would see through the bait.

---

This is the full North Star test. At every skill level, the answer to "what did you SEE?" gets richer. The novice sees dots. The intermediate sees blast trajectories. The advanced sees counter-timing and opponent intent. The master sees multi-turn strategy and reads baits.

The prediction depth is unbounded because blast force creates second-order, third-order, and nth-order consequences from every tap. The game never stops rewarding deeper reading. This is the Rocket League principle applied to chain reactions: deterministic physics, infinite skill ceiling, and the gap between players is always "I saw further than you did."

---

*Round 3 Facilitator section complete. Critic stress test follows.*

---

## CRITIC -- Round 3 Stress Test

### 1. Failure Modes

I am going to try to break this design. The converged candidate is: shared board, turn-based alternation, explosion blast force repositions surviving dots, tug-of-war meter pushed by chain size, counter-chain cancels incoming meter push during a danger window. Let me find every way it degenerates.

---

#### 1A. Equal Skill -- Does the Game Draw?

**The scenario:** Two players of identical skill. Both read the board equally well, both understand blast geometry, both time counters perfectly.

**The problem is real.** The tug-of-war meter drifts to center between turns. If both players consistently fire chains of equal size, the meter oscillates around center and never reaches either side. The counter-chain mechanic makes this worse: a perfectly-timed counter cancels the incoming push dot-for-dot. Two equally skilled players who both counter perfectly produce a zero-sum stalemate where the meter never moves.

This is not hypothetical. In Puyo Puyo at the highest level, games between equally matched players often come down to whoever builds the slightly bigger chain first -- a slight asymmetry that cascades. But in our design, the meter DRIFTS BACK TO CENTER, which actively erases any small advantage. The drift is a comeback mechanic for the trailing player, but it is a stalemate engine for equal players.

**Severity: HIGH.** A game that cannot produce a winner between equal players is fundamentally broken as a competitive design.

**Potential mitigations:**

- **Board asymmetry over time.** After each turn, new dots spawn. If the spawning is seeded but not symmetric (different dot positions per player's turn), the board gradually diverges, creating opportunities that favor one player's read over the other. The asymmetry is not in the rules but in the specific board states each player faces.

- **Meter drift is asymmetric.** Instead of drifting to center, the meter drifts toward a random (but deterministic, seeded) "tide" position that shifts every N turns. This means "center" is a moving target. Players must adapt to a shifting baseline. This adds strategic depth (push harder when the tide favors you, conserve when it does not) but introduces a variable that feels arbitrary.

- **Time limit with tiebreaker.** The match has a fixed number of turns (or a time limit). If the meter is not at either end, the player closer to their opponent's side wins. This converts the stalemate into a marginal advantage contest: the player who pushed slightly harder overall wins. This is the simplest fix and the most honest about the problem -- sometimes equal players produce close games, and close games need a tiebreaker. Pool solves this: if both players are perfect, the break shot determines the game. That is acceptable.

- **Escalating stakes.** As the match progresses, each chain's meter push is multiplied by a slowly increasing factor (1.0x at turn 1, 1.5x at turn 20, 2.0x at turn 40). Late-game chains move the meter dramatically. This means any small skill edge in the endgame decides the match. Similar to sudden death in fighting games (chip damage increases over time).

**My recommendation:** Time limit with tiebreaker + escalating stakes. The simplest, most honest solution. Do not fight the stalemate with artificial asymmetry; let the game be close when players are close, but ensure it always produces a winner.

---

#### 1B. Turtling -- Can a Player Just Not Lose?

**The degenerate strategy:** A player who fires only counter-chains, never attacking proactively. They wait for the opponent to push the meter, counter it, and let the drift bring the meter back to center. Repeat indefinitely.

**This is viable and it is boring.** The pure turtle never pushes the meter into danger. They absorb every attack, counter it, and wait. If the counter-chain cancels dot-for-dot with surplus converting to a counter-push, the turtle breaks even on defense and occasionally scores surplus when their counter is bigger than the incoming attack. But they never take risk.

**Why it matters:** If turtling is optimal, the game becomes a waiting contest. Both players wait for the other to attack first, because attacking first exposes you to a counter. This is the Street Fighter "fireball wars" problem: if blocking is free and attacking is risky, both players block.

**Is it actually optimal?** Only if there is no cost to waiting. In our design:

- **Dots are in motion.** While the turtle waits, the board changes. Clusters form and dissolve. A cluster that was a 5-chain at t=0 might be a 2-chain at t=3. If the turtle always waits for the opponent to act first, they are reacting to a board that has changed since their opponent's turn -- their counter-chain fires on a less favorable board than the one the attacker chose.

- **The opponent gets to act on a fresh read.** The attacker chooses their optimal moment. The turtle must react on the CURRENT board, which may not have a strong chain available.

- **Blast force acts against the turtle.** The attacker's blast force repositions dots on the shared board. After the attack, the board state has changed -- potentially scattering the turtle's carefully watched clusters.

**But there is a deeper problem.** If the turn structure is A-B-A-B and both players tap on the SAME board, the first player's blast reshapes the board before the second player acts. The second player is ALWAYS reacting to the first player's board sculpture. In this model, "turtling" does not mean "doing nothing" -- it means "taking the second action," which is actually advantageous (you see the post-blast board before acting). This means the design might have a second-mover advantage rather than a turtling problem. See section 1E.

**Severity: MEDIUM.** The liveness of the board (dots always moving) and blast force disruption probably prevent pure turtling, but this needs simulation validation. If counter-chains are too strong (canceling more than they cost), turtling becomes dominant.

**Mitigation:** Counter-chains should cancel at a LESS than 1:1 ratio. For example, your counter-chain cancels 75% of the incoming meter push, not 100%. This means pure defense slowly loses ground. The turtle bleeds meter position over many turns. Attacking becomes necessary. The 75% ratio (or whatever the tuned value is) becomes a critical parameter -- too low and countering feels futile, too high and turtling dominates.

---

#### 1C. Extreme Board States

**Very few dots (early game / post-wipe):**
- Board has 5-8 dots scattered widely. No clusters. Both players face a barren landscape.
- **Problem:** No meaningful chains are possible. A 1-chain or 2-chain nudges the meter trivially. Blast force scatters already-sparse dots further apart. The game stalls until more dots spawn.
- **How bad is it?** Depends entirely on spawn rate. If dots spawn between turns, the board recovers quickly. If dots spawn only at match start, post-wipe barren boards are game-killing dead zones.
- **Mitigation:** Continuous spawning (dots enter from edges, matching continuous mode). Spawn rate tuned so that the board always has enough dots for meaningful chains. The current game already has edge spawning in continuous mode -- this ports directly.

**Very many dots (late game / high spawn):**
- Board has 60+ dots in a dense field. Every tap triggers a massive chain.
- **Problem:** Prediction depth collapses. When everything is close together, any tap catches 8+ dots. The skill of "reading which tap creates the best blast geometry" degrades because ALL taps create big chains. The game becomes "tap anywhere, chain big." This is the R14 field-wipe problem from v8.1, now in competitive context.
- **How bad is it?** Very bad. Dense boards erase the skill ceiling. The simulation data confirms: at 45+ dots on a phone viewport, chains become trivially large.
- **Mitigation:** Dot cap. The board never exceeds N dots (tunable, probably 30-40 for phone viewport). When the cap is reached, spawning pauses. Chains clear dots, spawning resumes. The cascade gen cap (v8.1, cap=4) already prevents individual chains from clearing the entire board. Combined with a dot cap, the board stays in the density sweet spot (F3 30-60%) throughout the match.

**All one type:**
- Board is entirely standard dots. No gravity, no volatile.
- **Problem:** This removes the type-awareness skill layer. But it does NOT remove the core billiards skill (blast geometry is type-independent). The game is shallower but not broken.
- **How bad is it?** Acceptable as a floor. The competitive mode could start with all-standard dots (teaching blast physics) and introduce types as a ranked-play layer.

**All spread out (no clusters):**
- Dots are uniformly distributed. No natural clusters.
- **Problem:** Every chain is a 1-chain (only the directly-tapped dot). No cascade. Blast force is the only meaningful action: push dots toward each other to CREATE clusters.
- **How bad is it?** Actually interesting. This forces pure positional play -- the billiards layer without the chain layer. The player who best sculpts the board through sequential blasts wins. But it is slow and might frustrate players expecting explosive chains.
- **Mitigation:** Boid flocking prevents this. The existing schooling behavior naturally creates clusters over time. A uniformly distributed board is an unstable equilibrium that the boid simulation will break within seconds.

---

#### 1D. Parameter Sensitivity

**Blast force too weak:**
- Explosions catch dots but barely move survivors. The board state is essentially unchanged after a chain.
- **Impact:** The entire billiards layer evaporates. The game collapses to "tug-of-war with chains" -- which is Idea 7 standalone, which FAILED criterion 4 (dual-purpose action). Without meaningful blast force, the "positional play" that all three agents praised does not exist. The design loses its core innovation.
- **Severity: CRITICAL.** This is the existential parameter. If blast force is too weak, the design is a dressed-up version of the rejected Idea 7.
- **Signal to watch for in testing:** Dots move less than 10% of screen width from a nearby explosion. If survivors do not visibly relocate, the parameter is too low.

**Blast force too strong:**
- Explosions scatter dots to the edges of the board. Every chain creates a near-uniform distribution.
- **Impact:** Prediction depth collapses in the other direction. After each chain, the board "resets" to a roughly uniform state. There is no positional continuity between turns -- each turn is independent, because your previous blast erased all structure. The game becomes a series of disconnected single-turn optimization problems.
- **Severity: HIGH.** The billiards analogy depends on positional continuity -- your shot sets up the next shot. If every shot scatters the table, there is no "running the table."
- **Signal to watch for:** Dot distribution after a chain is statistically indistinguishable from random. Clusters do not survive adjacent explosions.

**The sweet spot:** Blast force moves dots meaningfully (20-40% of screen width for dots near the explosion) but does not scatter them uniformly. Dots far from the explosion are barely affected. The inverse-square falloff (F = k/d^2 from explosion center, per the Proposer's Round 2 spec) naturally creates this gradient, but the constant k needs careful tuning. The simulation harness can measure this: sweep k values, measure post-blast cluster preservation, find the range where blast creates repositioning without destruction.

**Turn length too short:**
- Player has 2 seconds to read the board and tap.
- **Impact:** Becomes a reaction-speed test. Violates anti-pattern #1. Shallow reads rewarded because deep reads take time.
- **Severity: HIGH.** The Facilitator's North Star ("what did you SEE?") requires time to see.

**Turn length too long:**
- Player has 15 seconds to read the board and tap.
- **Impact:** Dots move significantly during the turn. The board the player reads at t=0 is different from the board at t=14. Players learn to wait until the last second, reading the final board state before committing. This makes the first 14 seconds of every turn dead time.
- **Impact 2:** Pace destruction. 15-second turns in a mobile game make matches agonizingly slow. A 30-turn match takes 15 minutes. Mobile sessions should be 2-3 minutes.
- **Severity: HIGH.** Too long kills pace; too short kills depth. The tension is fundamental.

**The sweet spot:** 5-8 seconds. Enough time for a 2-3 layer read (chain + blast + opponent's next opportunity), short enough that the board does not change drastically, fast enough that a 30-turn match fits in 3-4 minutes. The dots-in-motion nature of the board creates natural urgency without an artificial timer: the cluster you see is dissolving while you think. The timer should be a safety net, not the primary time pressure.

---

#### 1E. First-Mover Advantage or Disadvantage

**The question:** In A-B-A-B turn alternation on a shared board, does Player A (who goes first) have an advantage or disadvantage?

**Case for first-mover advantage:**
- Player A acts on the initial board state, which may have the best clusters (formed by boid flocking without interference).
- Player A's blast reshapes the board. If their blast is strong, they have sculpted the board to THEIR advantage before Player B acts.
- Player A gets to "set the tone" -- their chain size determines the counter-chain pressure on Player B.

**Case for second-mover advantage:**
- Player B sees the post-blast board. They have strictly more information: they know what Player A did and what the board looks like after.
- Player B can counter Player A's push during the danger window, converting Player A's offense into neutral or even counter-push.
- Player B's blast is the last to affect the board before Player A's next turn. Player A must act on Player B's sculpture.

**Assessment:** Second-mover advantage is likely dominant, for the same reason that in chess, having the last move before a position is evaluated gives you the "last word." But this alternates every turn, so the advantage switches. Over a match, it should wash out statistically. The real concern is whether the first turn of the match (Player A's very first move) creates a lasting structural advantage. In pool, the break shot matters enormously. Here, the first blast on a fresh board sets the table.

**Severity: LOW-MEDIUM.** Alternation naturally balances first/second mover effects across the match. The only concern is the opening move, which can be addressed by having Player A start with a slight meter deficit (meter starts at 52% toward Player A's side) or by having a "break" turn where both players simultaneously tap and the board is set by the combined blast. But these feel like patches. The cleaner answer: test it. Simulate 1000 matches where one bot always goes first. Measure win rate. If it is 52-55%, acceptable asymmetry. If it is 60%+, needs structural correction.

---

### 2. Re-Scoring Against All 10 Criteria (Harsh Pass)

Round 2 scored the dark horse (13+7+3 with turns) at 9 pass / 1 partial. That was a conceptual assessment. Now I am scoring against the full specification -- including every failure mode identified above, every unresolved parameter question, and every assumption that has not been validated.

| # | Criterion | Round 2 | Round 3 | Change | Justification |
|---|-----------|---------|---------|--------|---------------|
| 1 | One-Tap Fidelity | PASS | PASS | -- | Unchanged. Tap = explosion = catch + blast. One action. Turn-based structure does not introduce additional inputs. |
| 2 | Deterministic Depth | PASS (with turns) | PASS | -- | Turn-based eliminates simultaneity. Dots move deterministically between turns. Same state + same tap = same outcome. The only uncertainty is the opponent's future action, which is the same uncertainty as chess. |
| 3 | Prediction Ceiling | PASS | PARTIAL | DOWN | Round 2 claimed "5-dimensional lookahead." In practice, the prediction ceiling depends entirely on blast force magnitude. If blast force is in the sweet spot (section 1D), prediction depth is 2-3 taps ahead for an expert. If blast force is too weak, prediction collapses to 1 tap (no positional consequence). If too strong, prediction also collapses (board resets after each blast). The criterion PASSES contingent on blast force tuning. But "contingent on a parameter we have not measured" is a PARTIAL, not a PASS. The Proposer and Facilitator both flagged blast force as testable. It has not been tested. Until it has, this is partial. |
| 4 | Dual-Purpose Action | PASS | PASS | -- | Every tap catches dots (scoring/meter push) + repositions survivors (positional investment/disruption). Counter-chain timing adds offense/defense trade-off. The turtling concern (1B) threatens this if counter-chains are too strong, but the 75% cancellation ratio mitigation preserves the trade-off. |
| 5 | Readable Battlefield | PARTIAL | PARTIAL | -- | The Proposer's three visual layers (blast ring, dot trails, cluster glow) solve blast force legibility. The meter is instantly legible. Counter-chain cancel needs visual language (incoming push indicator + cancellation animation). The remaining concern: on a shared board with dots moving continuously, can a spectator tell whose turn it is and what just happened? Turn-based helps (clear delineation). But the combined visual load of blast effects + trail + glow + meter + counter animation is a lot for a phone screen. This needs playtest validation, not theory. Holding at PARTIAL. |
| 6 | Puyo Setup Payoff | PASS | PARTIAL | DOWN | Round 2's argument: "small 2-chain that pushes 6 dots into a tight cluster is worth more than a greedy 5-chain that scatters the board." This is the billiards ideal. But is it TRUE? In pool, you can predict where the cue ball will rest after a shot because there is ONE ball and it rolls on a flat surface with simple friction. In our game, an explosion pushes 5-15 dots in different directions, each with different velocities and boid flocking behaviors. Can a human actually read where 10 dots will settle after a blast? The boid simulation is deterministic but high-dimensional. A pool player tracks 1 ball, 6 degrees of freedom. Our player tracks 10+ dots, each with position + velocity + type + flocking forces. The "setup" read may exceed human cognitive bandwidth. If players CANNOT reliably predict blast outcomes 2+ steps ahead, then "patient setup" is indistinguishable from guessing, and this criterion fails. This is the deepest unresolved question in the design. Downgraded to PARTIAL until simulation or playtest demonstrates that human-readable blast prediction is feasible. |
| 7 | Mode Portability | PARTIAL | PARTIAL | -- | Solo zen = billiards sandbox (blast force + chain, no meter, no counter). This is a complete game. PvP = full system. AI = bot plays tug-of-war. The portability is genuine for billiards. Counter-chain and tug-of-war are PvP-only layers that disappear in solo. Acceptable per Tetris Effect precedent (Zone mechanic is mode-specific). But the Facilitator's question remains: does 20 minutes of solo zen practice directly improve PvP skill? Answer: YES for blast reading, NO for counter-timing and meter management. Two of three competitive layers are not practiced in solo. Holding at PARTIAL. |
| 8 | Mobile-Native Ergonomics | PASS | PASS | -- | Single board, full screen. Turn-based means no split attention between your board and your opponent's actions (you watch, then act). One tap per turn. No precision targets below 12mm (explosions have a blast radius, not a pixel target). |
| 9 | Comeback Mechanics | PASS | PARTIAL | DOWN | Round 2: "Meter drift-to-center + counter-chain conversion. Better comeback than either component alone." Round 3 reassessment: the stalemate problem (1A) reveals that the drift-to-center is TOO STRONG as a comeback mechanic. It does not just help trailing players -- it erases leading players' advantages. An escalating-stakes model (1A mitigation) helps the trailing player by making late-game chains worth more, but it also helps the leading player equally. The counter-chain is the real comeback mechanic: a trailing player who reads the board well can cancel a big push and counter. But if both players counter equally well, we are back to stalemate. The comeback is structurally sound but overtuned toward equilibrium. Downgraded to PARTIAL. |
| 10 | Spectacle Proportionality | PASS | PASS | -- | Big chain = big blast = dots flying dramatically + big meter shove. Counter-chain = reversal drama. Escalating stakes in late game = climactic finish. The visual hierarchy is natural: small chain = subtle, big chain = explosive, counter = dramatic shift. |

**Round 3 Total: 6 PASS, 4 PARTIAL, 0 FAIL.**

Down from 9P/1~ to 6P/4~. No failures, but significantly more uncertainty than Round 2 suggested. The four partials are:

1. **C3 (Prediction Ceiling)** -- contingent on blast force magnitude, untested.
2. **C5 (Readable Battlefield)** -- visual load on phone screen needs playtest.
3. **C6 (Puyo Setup Payoff)** -- human cognitive bandwidth for multi-dot blast prediction unvalidated.
4. **C9 (Comeback Mechanics)** -- drift-to-center overtuned toward stalemate.

None of these are structural failures. All are solvable through parameter tuning and playtest iteration. But Round 2 was flattering itself by scoring them as passes. They are open questions that COULD fail.

---

### 3. Comparison to Gold Standards

This is the most important section. I am going to be honest about where this design actually stands relative to the games we keep name-dropping.

#### vs. Tetris Zone Battle (Offense/Defense Duality)

**Tetris's genius:** Every line clear simultaneously clears your board (defense) and sends garbage (offense). The Zone meter adds a RESOURCE MANAGEMENT layer: burn Zone early for moderate attack, or save it for a massive counter? Zone is both sword and shield, and the TIMING of activation is the strategic decision.

**Our design:** Every chain simultaneously pushes the meter (offense) and repositions dots (positional investment). Counter-chain timing adds the offense/defense trade-off. This is structurally similar. But there is a critical difference: **Tetris has two distinct defensive actions (clearing garbage rows AND activating Zone), while our design has one (counter-chain).** Our defense is one-dimensional. In Tetris, you can clear garbage WITHOUT using Zone, or activate Zone to cancel garbage AND build a massive counter-attack. Two defensive tools with different costs and different payoffs. We have one tool (counter) with one payoff (cancel + surplus).

**The gap:** We need a second defensive axis. The Supernova mechanic (Multi-Tap) could fill this role -- save Supernova for defensive emergency (3 counter-chains in rapid succession) or offensive nuke (3 blasts to sculpture the board). This gives players two resources to manage: their chain potential (always available, varies by board state) and their Supernova charge (earned over time, one-shot). That is closer to Tetris's line-clear + Zone duality.

**Honest assessment:** We are at about 60% of Tetris's offense/defense sophistication. Supernova integration could bring us to 80%. We will probably never reach 100% because Tetris has 40 years of metagame refinement.

#### vs. Puyo Puyo (Chain-Building Patience)

**Puyo's genius:** The board is stable. Pieces stay where you place them. You can build a 5-chain scaffold over 30 seconds, knowing it will fire exactly as planned when you trigger it. The patience is rewarded because the board remembers your investment. The opponent can see your scaffold building and must decide: attack now to disrupt, or keep building their own bigger scaffold?

**Our design:** The board is NOT stable. Dots are always in motion. A cluster at t=0 is a different cluster at t=3. You cannot "build a scaffold" because the scaffold dissolves. The Proposer and Facilitator both identified this tension (Tension C). The proposed answer -- "setup in billiards is positional, not structural" -- is elegant in theory. But the practical question remains: can players actually execute positional setup across multiple turns when boid flocking constantly reshapes the board?

**The gap:** Our "patience" is fundamentally different from Puyo's patience. Puyo patience = "I built this, and I will trigger it when the time is right." Our patience = "I read that this blast will push dots into a favorable state, and I trust the physics to deliver a good board next turn." The first is concrete investment with deterministic payoff. The second is probabilistic investment with physics-mediated payoff. Ours is more like poker patience (reading odds) than Puyo patience (constructing certainty).

**Honest assessment:** We do not achieve Puyo-level setup payoff and probably cannot, because our board lacks persistence. What we achieve is a DIFFERENT kind of patience -- reading physics trajectories rather than building structures. This is valid and can be deep, but it is not the same thing. We should stop claiming we satisfy the "Puyo Setup Payoff" criterion in the same way Puyo does. We satisfy it in a physics-prediction sense, which is novel but unproven.

#### vs. Rocket League (Physics Prediction)

**Rocket League's genius:** The physics is simple (ball + car + boost), visible (you can see the entire field), and predictable (you KNOW where the ball will go after a hit). The skill ceiling comes from execution precision and multi-step prediction: "I hit the ball here, it bounces there, I boost to meet it, aerial redirect into the goal." Each step is individually predictable; chaining them is the skill.

**Our design:** The physics is more complex (10-40 dots, each with position + velocity + type + flocking forces), partially visible (you can see all dots but predicting their collective behavior is harder than predicting one ball), and deterministic but high-dimensional. The skill ceiling comes from blast-geometry prediction: "I blast here, these dots scatter there, they flock back together around the gravity dot, next turn I blast that cluster."

**The gap:** Rocket League's physics is SIMPLE enough that a human can predict it multiple steps ahead. Our physics may be TOO COMPLEX for multi-step prediction. This is the C6 concern restated. In Rocket League, you track 1 ball. In our game, you track N dots. The cognitive load scales linearly with dot count. At 10 dots, multi-step prediction might be feasible. At 40 dots, it almost certainly is not -- humans cannot track 40 independent trajectories plus flocking interactions.

**The counter-argument:** Players do not need to track ALL dots. They need to track the cluster they care about (3-5 dots) and predict the blast's effect on THAT cluster. The rest is noise. This is how pool players think -- you track the cue ball and the target ball, not all 15 balls. If our visual design highlights the relevant cluster (the "cluster glow" from the Proposer's fix), players can focus their prediction on the subset that matters.

**Honest assessment:** We are at about 40% of Rocket League's prediction depth in theory. The gap is in EXECUTION -- Rocket League's prediction is validated by millions of hours of player behavior. Ours is hypothetical. The key question: can players learn to intuitively read blast-scatter patterns the way Rocket League players learn to read ball trajectories? This is an empirical question that theory cannot answer. The simulation harness can measure whether blast outcomes are consistent enough to build intuition around, but only playtesting can confirm that humans actually develop that intuition.

#### vs. Pool/Billiards (Positional Play)

**Pool's genius:** Every shot has TWO objectives: pocket the target ball AND position the cue ball for the next shot. Expert players plan 3-4 shots ahead, using angles, spin, and rail cushions to navigate the cue ball through a predetermined sequence. The entire game is positional.

**Our design:** Every blast has TWO consequences: catch dots for the chain AND reposition survivors for the next blast. This is the most direct analogy. But the crucial difference: in pool, you have CONTROL over cue ball positioning through angle, speed, and spin. Three input dimensions. In our game, you have ONE input dimension: tap position. The blast direction is radial from the tap point. You cannot apply "spin" to the blast. You cannot choose blast strength (it is determined by the chain result). The positional control is MUCH coarser than pool.

**The gap:** Pool players have fine-grained control over cue ball position. Our players have coarse-grained influence over dot redistribution. The positional play is real but blunt. A pool player can place the cue ball within a 2-inch circle. Our players can influence the GENERAL direction of dot movement but cannot precisely predict where individual dots will settle (due to flocking interactions and dot-dot collisions). This means "planning 3 shots ahead" in our game is fuzzier than in pool -- you can plan the general shape of the board but not the exact positions.

**Honest assessment:** We achieve about 50% of pool's positional precision. The blast geometry is real, the repositioning matters, but the control is coarse and the prediction is fuzzy. This is enough to create meaningful positional play but not enough to create the precise "run the table" sequences that make pool beautiful. We should embrace the fuzziness rather than fight it -- our game's positional play is more like bowling (influence trajectory, accept variance) than pool (precise control, demand precision).

---

### 4. The Fun Question

**Is this design actually FUN?**

I am going to answer this by imagining two specific moments: the first time I play, and the 100th time.

#### First Time Playing

I see dots flowing across my phone screen. A meter bar sits along one edge. It is my turn. I tap a cluster of dots. They explode. Other dots near the explosion fly outward. The meter bar nudges toward my opponent. Cool. My opponent taps. Dots explode on the board. The meter nudges back. We go back and forth.

**What I feel:** Mild satisfaction from the explosion. Curiosity about the meter. Confusion about why some dots moved after the explosion and what that means. I do not understand blast force yet. I do not understand counter-chains yet. The 60-second skill revelation the Facilitator demanded is: "I tapped, the bar moved, my opponent tapped, it moved back." That is enough to understand the stakes. But the billiards layer -- the core innovation -- is invisible to me. I will discover it organically over multiple games, maybe 5-10 matches in. That is acceptable.

**Risk:** First impression is "Tug-of-War with chains" -- which is the REJECTED Idea 7. The blast physics, which make this design special, are invisible on first play. This means the game must survive on its basic appeal (explosions + meter competition) long enough for the deeper layer to reveal itself. If the basic layer is not fun enough to sustain 5-10 matches of exploration, players quit before discovering the real game.

#### 100th Time Playing

I see a board with 25 dots. Three clusters: a tight red group upper-left, a loose blue spread mid-right, and a gravity dot pulling two volatile dots in the lower-center. It is my turn. The meter is slightly toward my opponent's side -- I am winning by a thin margin.

I see: if I tap the red cluster, I catch 5, push the meter significantly, and the blast will scatter the blue dots further apart (bad for my next turn). If I tap between the red and blue clusters (catching only 2 reds), the blast pushes 3 blue dots toward the gravity dot, which will pull them into a tight cluster by my next turn. My opponent will face a board with a massive blue-gravity cluster that I can detonate for a 7-chain.

But: my opponent might tap that blue-gravity cluster on THEIR turn. Do they see it forming? If they do, they will preemptively detonate it for a smaller chain and deny me. If they do not, I get the 7-chain next turn.

I tap between the clusters. 2-chain. Small meter nudge. My opponent looks at the board. They see the blue dots drifting toward gravity. They counter by tapping the gravity dot itself -- catching 2 and blasting the blues AWAY from the gravity well, denying my setup.

**What I feel:** I feel outsmarted. My opponent read my positional play and countered it. This is the feeling of being outplayed in a fair game. I want to play again because I see what I should have done differently -- I should have tapped the red cluster (bigger chain, bigger push) instead of trying to be clever with the setup. The greedy play was better this time because my opponent was good enough to read my positional play.

**This is the feeling of a good competitive game.** The question is not "is the optimal play always interesting?" The question is "does the game produce situations where I feel outsmarted and want to learn?" The answer to that is YES, IF blast force is meaningful enough to create readable positional consequences. That is the same conditional that appears in every section of this analysis.

#### What Keeps You Coming Back at Game 100+

- **Board diversity.** Boid flocking + spawn randomness + dot types ensure no two boards are alike. This is not a game you can "solve."
- **Opponent reads.** The meta-game of "do they see what I see?" creates social depth. Each opponent plays differently. Learning an opponent's read depth is a skill in itself.
- **Blast sculpting.** If the blast physics are in the sweet spot, the satisfaction of a well-executed 2-3 turn positional sequence -- set up, read, execute -- is the same satisfaction as sinking a difficult pool shot. This is the Rocket League "I meant to do that" feeling.
- **Counter-chain drama.** The danger window creates clutch moments: "they pushed the meter hard, I NEED a counter, I scan the board, I find a 4-chain, I fire, the meter swings back." These moments are inherently exciting.

#### What Would Make You Put It Down

- **Blast physics too subtle.** If I cannot see or feel the blast repositioning, every turn feels identical: "find cluster, tap cluster, meter nudges." The game has no texture.
- **Stalemates.** If most games between decent players end in draws or go to time, the competitive stakes evaporate. "It doesn't matter because we'll tie anyway."
- **Long matches.** If a match takes more than 3-4 minutes on mobile, I will not start one during a bus ride. Session length is a hard constraint for mobile.
- **Opaque losses.** If I lose and do not understand why -- if my opponent's winning play looked the same as any other tap to me -- I learn nothing and have no reason to improve.

---

### 5. The ONE Thing That Could Kill This Design

**Blast force legibility.**

Not blast force magnitude (that is a tunable parameter). Not the tug-of-war mechanic (that is proven). Not the counter-chain system (that is borrowed from 30 years of Puyo). The killer risk is:

**Players cannot learn to read blast outcomes.**

The entire design -- the billiards positional play, the setup payoff, the prediction ceiling, the "what did you SEE?" North Star -- depends on players developing intuition for how blast force repositions dots. If this intuition does not form -- because the physics is too high-dimensional, or because boid flocking makes post-blast behavior chaotic, or because 10+ dots moving simultaneously exceeds human perceptual bandwidth -- then the design collapses to "Tug-of-War with chains," which is Idea 7, which failed criterion 4.

The design is betting everything on one claim: **humans can learn to intuitively predict blast-scatter patterns in a boid simulation.**

This claim is plausible (humans learn to predict ball trajectories in pool, puck behavior in hockey, ball flight in baseball -- all physics-prediction skills). But it is unproven for THIS specific physics system (boid flocking + radial blast force + multiple simultaneous objects).

**The mitigation is straightforward but non-negotiable:** Before committing to this design, build a prototype of the blast physics and put it in front of 5 human playtesters. Give them 10 minutes. Ask them to predict where dots will end up after a blast. Measure whether prediction accuracy improves over the 10 minutes. If it does, the design works. If it does not, the blast physics need to be simplified (fewer dots, weaker flocking, stronger blast) until the prediction is learnable, or the design needs to be abandoned.

The simulation harness cannot answer this question. The harness measures what a BOT can predict, not what a HUMAN can perceive. This requires human testing. Specifically:

1. Show a board state with 15-20 dots.
2. Mark a tap position.
3. Ask the player: "After the blast, will the blue cluster be tighter or more spread out?"
4. Blast. Compare prediction to outcome.
5. Repeat 20 trials. Plot accuracy over time.

If accuracy rises from 50% (random) to 70%+ over 20 trials, humans CAN learn this. If accuracy stays at 50-55%, humans CANNOT learn this, and the design's core innovation is an illusion.

**This is the test the design must pass. Everything else is refinement.**

---

### Summary

The dark horse combination (Explosion Billiards + Tug-of-War + Counter-Chain with turn-based alternation) is a strong design with no structural failures. Its score drops from Round 2's 9P/1~ to a more honest 6P/4~ under scrutiny, but all four partials are solvable through parameter tuning and playtest validation. The design does NOT match the gold standards it aspires to -- it achieves roughly 40-60% of Tetris, Puyo, Rocket League, and Pool's competitive sophistication -- but that is an honest starting point for a game that has not been built or tested yet. Those reference games have decades of iteration. This design has the right STRUCTURE to approach their quality with sufficient iteration.

The existential risk is blast force legibility: can humans learn to read blast-scatter patterns? If yes, the design has a genuine competitive identity -- "physics billiards with chain reactions" -- that no other game occupies. If no, the design is a dressed-up tug-of-war, and we should pivot to Combo C (Counter-Billiards Overflow), which does not depend on blast prediction because its core skill loop is survival management rather than positional chess.

**Recommended next step:** Build the blast physics prototype. Test with humans. Measure prediction learnability. Then decide.

---

## PROPOSER -- Round 3 Full Specification

The Facilitator resolved the five tensions and painted the game in broad strokes. The Critic stress-tested the design, identified five failure modes, re-scored at 6P/4P, and named blast force legibility as the existential risk. My job now is to specify the game to parameter-level precision -- concrete enough that a programmer can implement it from this section alone. I will also write three game scenarios, identify remaining uncertainties, and respond to the Critic's combo rankings from Round 2.

---

### 1. Complete Game Specification

This spec describes **Billiards Mode** -- the primary competitive mode for Chain Reaction. It builds on the existing `game-core.js` engine (which already implements dots, boid flocking, gravity/volatile types, cascade momentum with gen cap=4, and Supernova multi-tap). Implementation requires three additions: (a) blast force in the physics loop, (b) tug-of-war meter with push waves, (c) turn alternation with counter-chain logic.

---

#### 1.1 Board Layout

One shared board, full screen. Same viewport as solo continuous mode (390x844 phone, scales proportionally to desktop). Dark background. Dots rendered identically to solo mode -- no new dot types, no ownership markers.

**Tug-of-war meter:** Vertical bar on the left edge, 8px wide, full board height (844px on phone). Center line at y=422. A fill indicator moves above or below center:

- Fill above center = Player A (blue) is pushing B toward danger.
- Fill below center = Player B (orange) is pushing A toward danger.

The meter value is a float in [-1.0, +1.0]. At -1.0, Player A loses (meter filled to the bottom). At +1.0, Player B loses (meter filled to the top). Start value: 0.0 (or +0.05 with first-turn compensation -- see Section 1.2).

Three visual zones:
- Center 60% (meter value -0.30 to +0.30): Neutral, white/grey fill.
- Outer 20% on each side (meter value 0.70 to 1.00 and -1.00 to -0.70): Danger zone, glowing in the threatening player's color with increasing intensity.

**Player color coding:**
- Player A: Blue explosions, blue dot trails from blast (0.5s fade), blue push waves on meter.
- Player B: Orange explosions, orange dot trails, orange push waves.
- Dots are NOT colored by ownership. All dots are shared. Color coding applies only to explosion effects and meter.

**Turn indicator:** Active player's color as a subtle 3px glow along the bottom edge. No text, no timer bar in casual mode. In ranked mode, a thin arc timer (like a clock hand sweeping) appears in the active player's color.

---

#### 1.2 Turn Structure: Action-Based Alternation

Players alternate taps. Each turn = one tap, fully resolved, then control passes.

**Detailed flow:**

```
MATCH START:
  Seed PRNG from match ID. Spawn initial dots (same spawn logic as
  continuous mode, ~20 dots at CASUAL, ~30 at FLOW).
  Coin flip (from PRNG) determines first player.
  Meter starts at 0.0 + FIRST_TURN_OFFSET (proposed: 0.05 toward
  first player's losing side, compensating their move advantage).

TURN LOOP (repeats until win condition):
  1. OBSERVE: Active player reads the board. Dots are moving.
     Physics runs at 60fps. No freeze, no pause.
     Shot clock: 10s in ranked mode (no limit in casual).
     Clock starts when the previous chain finishes resolving.

  2. TAP: Active player taps (x, y).
     Engine creates explosion at (x, y), gen=0.

  3. RESOLVE: Chain resolves per existing cascade mechanics.
     Gen 0: universal catch (all types within radius R).
     Gen 1+: type-filtered catch (same type as triggering dot).
     Radius per gen: R * (1 + 0.08 * min(gen, 4)).
     Hold per gen: BASE_HOLD + 200ms * min(gen, 4).
     During each explosion's hold phase, BLAST FORCE is applied
     to all active uncaught dots in blast range (Section 1.4).

  4. CHAIN END: Engine emits chainEnd event.
     chainLength = total dots caught.

  5. METER PUSH CALCULATION:
     raw_push = METER_BASE * chainLength^METER_EXPONENT
     streak_mult = 1 + (momentum - 1) * MOMENTUM_METER_MULT
     total_push = raw_push * streak_mult

  6. PUSH WAVE or INSTANT RESOLVE:
     if total_push < COUNTER_THRESHOLD:
       Meter moves immediately. No counter window.
       Turn passes to opponent. Opponent takes normal turn.
     else:
       Push wave animates on meter (active player's color).
       Wave travel time: WAVE_TRAVEL_MS.
       Control passes to opponent with DANGER WINDOW open.

  7. DANGER WINDOW (if wave is active):
     Opponent has WAVE_TRAVEL_MS to decide:
     (a) TAP to counter: their chain resolves, generates counter-push.
         net = attack_push - counter_push.
         Meter moves by net (positive = toward defender,
         negative = toward attacker -- surplus counter-attack).
         Counter-tap IS their turn. Turn passes back.
     (b) WAIT (do not tap before wave resolves):
         Full attack_push applies to meter.
         Opponent then takes their normal turn (one tap).
         This normal turn generates its own push wave / instant resolve.

  8. MOMENTUM UPDATE:
     If chainLength >= 3: momentum++ (cap at 10).
     If chainLength < 3: momentum resets to 1.
     If chainLength == 0: STREAK_BREAK_PENALTY applied to meter
       (meter drifts toward the whiffing player by 0.02).

  9. WIN CHECK: if meter <= -1.0: Player A loses.
                if meter >= +1.0: Player B loses.

  10. BETWEEN TURNS:
      Physics continues (dots move, flock, gravity pulls).
      Dots spawn from edges per tier config.
      Meter drifts toward 0.0 at METER_DRIFT_PER_SEC * elapsed_sec.
      Drift pauses during chain resolution and wave travel.
```

**Key design decisions and their rationale:**

**Counter-tap consumes your turn.** If you counter, you do not get an additional proactive tap. Your counter IS your contribution to that exchange. This creates the Critic's C4-satisfying trade-off: counter now (cancel push, but spend your turn reactively on whatever chain is available) vs. eat the push (take meter damage, but use your turn proactively on the best chain you can find). This is the single most important competitive decision in the game.

**No counter-counter rallies.** After waves collide and net push resolves, the turn passes. The original attacker does NOT get a window to counter the defender's surplus. One exchange per cycle. This keeps matches comprehensible, prevents reaction-speed degeneracy (anti-pattern #1), and bounds match length.

**Small pushes auto-resolve.** Pushes below COUNTER_THRESHOLD (0.015, roughly a 1-2 chain) resolve instantly with no counter window. This keeps the rhythm snappy -- tiny pokes do not deserve dramatic counter-windows.

**Shot clock is a safety net.** 10 seconds in ranked is generous. Most turns take 2-5 seconds. The clock exists to prevent griefing, not to create time pressure. The natural time pressure comes from dots-in-motion: the cluster you are reading changes as you deliberate.

---

#### 1.3 Dot Spawning

Edge spawning, continuous, same system as solo continuous mode. Spawn rate tuned per competitive tier.

**Competitive tier config:**

| Tier | Spawn Rate | Max Dots | Dot Types (std/grav/vol) | Speed Range | Boid Schooling |
|------|-----------|---------|--------------------------|------------|----------------|
| CASUAL | 0.8/s | 35 | 100/0/0 | 0.4--0.8 | Off |
| FLOW | 1.5/s | 40 | 80/20/0 | 0.5--1.0 | On (cohesion 0.008, alignment 0.03) |
| SURGE | 2.5/s | 45 | 65/20/15 | 0.6--1.2 | On |
| MASTER | 2.0/s | 40 | 50/25/25 | 0.7--1.4 | On (stronger: cohesion 0.010, alignment 0.04) |

Spawn rates are lower than solo continuous because competitive turns are slower (each player taps every ~4-6 seconds vs. solo's ~1.5s cooldown). Target equilibrium: 20-35 active dots on board at any time. The dot cap (Max Dots) prevents the "dense board skill collapse" the Critic identified in failure mode 1C.

**PRNG seeding:** Match seed determines all spawning (positions, types, timing). Both players see the same spawns. Replays are deterministic. The seed is the match's "course" -- just like a fixed seed in a daily challenge.

---

#### 1.4 Blast Force: Physics Specification

**The single largest engine addition. Currently, explosions do NOT push surviving dots. This section specifies the new mechanic.**

**When blast force fires:** Once per explosion, at the moment the explosion transitions from grow phase to hold phase (same frame that catch detection starts). The impulse is instantaneous -- it modifies dot velocities in a single physics step.

**Which dots are affected:** All active, uncaught dots within blast range. Dots already caught by this explosion or any earlier explosion in the same chain are excluded.

**Force formula:**

```javascript
// Called once per explosion, at hold-phase start
function applyBlastForce(explosion, dots, spatialScale) {
  const blastRange = explosion.maxRadius * BLAST_RANGE_MULT;

  for (const dot of dots) {
    if (!dot.active || explosion.caught.has(dot.index)) continue;

    const dx = dot.x - explosion.x;
    const dy = dot.y - explosion.y;
    const dist = Math.hypot(dx, dy);

    if (dist >= blastRange || dist < 0.5) continue;

    // Direction: radially outward from explosion center
    const nx = dx / dist;
    const ny = dy / dist;

    // Magnitude: inverse power law
    // normalizedDist = 1.0 when dot is at explosion.maxRadius distance
    const normalizedDist = Math.max(dist / explosion.maxRadius, 0.1);
    const rawForce = BLAST_K / Math.pow(normalizedDist, BLAST_N);
    const cappedForce = Math.min(rawForce, BLAST_MAX_FORCE);

    // Type-specific resistance (gravity dots are heavy)
    const resistance = DOT_BLAST_RESIST[dot.type] || 1.0;

    // Apply velocity impulse
    dot.vx += nx * cappedForce * resistance * spatialScale;
    dot.vy += ny * cappedForce * resistance * spatialScale;
  }
}

const DOT_BLAST_RESIST = {
  standard: 1.0,
  gravity:  0.6,   // heavy, resists push
  volatile: 1.2    // light, pushed further
};
```

**Parameter table with sweep ranges:**

| Parameter | Symbol | Proposed | Sweep Range | Target Behavior |
|-----------|--------|----------|-------------|-----------------|
| Force scalar | `BLAST_K` | 0.8 | 0.3--2.0 | Controls mean displacement. Target: 30-80px displacement for dots near (within 1R of) explosion. |
| Distance falloff | `BLAST_N` | 1.5 | 1.0--2.5 | 1.0 = gentle, uniform push. 2.0 = sharp, close-range-only. 1.5 = moderate: close dots move far, mid-range dots move meaningfully, far dots barely affected. |
| Blast range | `BLAST_RANGE_MULT` | 2.0 | 1.5--3.0 | How far beyond the visible explosion the blast reaches. At 2.0, a dot at 2x the explosion radius still receives blast force. |
| Force cap | `BLAST_MAX_FORCE` | 3.0 | 1.5--5.0 | Prevents point-blank dots from gaining extreme velocity. Without this, a dot at dist=0.5px gets pushed off-screen. |
| Gravity resistance | `DOT_BLAST_RESIST.gravity` | 0.6 | 0.3--1.0 | Gravity dots as "anchors." At 0.6, they move 40% less than standards from the same blast. |
| Volatile susceptibility | `DOT_BLAST_RESIST.volatile` | 1.2 | 1.0--1.5 | Volatile dots are "light," travel further. At 1.2, they move 20% more than standards. |

**Displacement estimates (at proposed values, phone viewport, explosion radius ~40px):**

| Dot distance from explosion | Normalized dist | Raw force | Capped | Displacement estimate |
|---------------------------|----------------|-----------|--------|----------------------|
| 20px (inside explosion) | 0.5 | 2.26 | 2.26 | ~55px (dot caught anyway, blast is redundant) |
| 40px (at explosion edge) | 1.0 | 0.80 | 0.80 | ~45px |
| 60px (1.5x radius) | 1.5 | 0.44 | 0.44 | ~25px |
| 80px (2x radius, blast edge) | 2.0 | 0.28 | 0.28 | ~15px |
| 100px+ (beyond blast range) | 2.5+ | 0 | 0 | 0px (outside range) |

These estimates assume displacement is roughly proportional to impulse velocity divided by the dot's subsequent deceleration from flocking forces. The actual values will differ because boid cohesion/alignment/separation modify the trajectory post-impulse. The simulation sweep must measure actual displacement, not theoretical.

**Cascade blast accumulation:**

Each cascade generation creates new explosions at the positions of caught dots. Each of these cascade explosions applies its own blast impulse. A gen-4 chain with 8 caught dots creates ~8 separate blast events (plus the original tap explosion = 9 total). A surviving dot near the chain's center might be within blast range of 3-4 of these explosions and receive multiple impulses from different directions.

The cumulative displacement of such a dot is the vector sum of all impulse contributions. This can be large. **Per-dot per-turn displacement cap:** `BLAST_DISPLACEMENT_CAP = 120px` (approximately 3 explosion radii). If a dot's accumulated blast displacement in a single turn exceeds this cap, excess impulse is discarded. This prevents cascade blast tunnels from sending dots off-screen while preserving the multi-source blast geometry that creates the interesting billiards patterns.

**Gravity explosion interaction:**

Gravity-type explosions already pull nearby dots inward during hold phase (existing mechanic: `pullForce 0.025, pullRange 2.5 * maxRadius`). Blast force is applied at hold-phase START as an instantaneous outward impulse. Gravity pull operates CONTINUOUSLY during the entire hold phase (1.0-1.8s depending on generation). The temporal difference matters:

- At t=0 (hold start): blast pushes dot outward.
- At t=0 to t=1.8s (hold duration): gravity pulls dot inward.

For a dot close to a gravity explosion:
- Blast pushes it outward by ~45px instantaneously.
- Gravity pull decelerates and then reverses the dot over 1.8s.
- Net result: dot oscillates and ends up CLOSER to the explosion center than it started.

For a dot at mid-range:
- Blast pushes it outward by ~25px.
- Gravity pull is weaker at this distance (falls off with distance).
- Net result: dot ends up further away. The blast overcomes the pull.

This creates the "shell" effect: gravity explosions compress close dots, eject mid-range dots. The boundary between "compress" and "eject" depends on the exact force balance and is a learnable physics pattern -- exactly the kind of intuition we need players to develop.

**Volatile explosion interaction:**

Volatile explosions have `radiusMult: 1.5`, so their maxRadius is 1.5x base. Their blast range is `1.5R * BLAST_RANGE_MULT = 3.0R`. They push dots in a wider area. Additionally, volatile dots themselves have `DOT_BLAST_RESIST.volatile = 1.2`, meaning they travel 20% further when pushed by someone else's blast. Volatile dots are high-energy: they cause bigger blasts and they travel further when blasted. This makes them both powerful tools and unpredictable elements on the board.

---

#### 1.5 Meter Push: Formula and Tables

**Push formula:**

```javascript
function calcMeterPush(chainLength, momentum) {
  if (chainLength < 1) return 0;
  const rawPush = METER_BASE * Math.pow(chainLength, METER_EXPONENT);
  const streakMult = 1 + (momentum - 1) * MOMENTUM_METER_MULT;
  return rawPush * streakMult;
}
```

**Parameters:**

| Parameter | Value | Sweep Range | Notes |
|-----------|-------|-------------|-------|
| `METER_BASE` | 0.008 | 0.004--0.016 | Primary match-length control |
| `METER_EXPONENT` | 1.4 | 1.0--2.0 | Big-chain vs consistency balance |
| `MOMENTUM_METER_MULT` | 0.15 | 0.05--0.25 | Streak value per level |
| `METER_DRIFT_PER_SEC` | 0.005 | 0.002--0.010 | Comeback speed |
| `COUNTER_THRESHOLD` | 0.015 | 0.010--0.030 | Minimum push for counter window |
| `STREAK_BREAK_PENALTY` | 0.02 | 0.01--0.04 | Whiff penalty |
| `WAVE_TRAVEL_MS` | 1500 | 800--2500 | Counter-chain read time |
| `FIRST_TURN_OFFSET` | 0.05 | 0.0--0.10 | Player 2 compensation |
| `FORFEIT_PENALTY` | 0.015 | 0.01--0.03 | Shot clock expiry |

**Push table at momentum x1:**

| Chain | Push | % of Meter | Intuition |
|-------|------|-----------|-----------|
| 1 | 0.008 | 0.8% | Negligible. Below counter threshold. |
| 2 | 0.021 | 2.1% | Above threshold but barely. |
| 3 | 0.037 | 3.7% | First "real" push. Opens counter window. |
| 5 | 0.073 | 7.3% | Significant. Board-changing if uncountered. |
| 7 | 0.118 | 11.8% | Big. Opponent must decide: counter or absorb? |
| 10 | 0.189 | 18.9% | Huge. Game-shifting. |
| 12 | 0.234 | 23.4% | Devastating. Near-lethal from center. |
| 15 | 0.306 | 30.6% | Almost always wins if uncountered from center. |

**Push table at momentum x5 (streak multiplier 1.60x):**

| Chain | Effective Push | % of Meter | Equivalent raw chain |
|-------|---------------|-----------|---------------------|
| 3 | 0.059 | 5.9% | ~raw 4-chain |
| 5 | 0.117 | 11.7% | ~raw 7-chain |
| 7 | 0.189 | 18.9% | ~raw 10-chain |
| 10 | 0.302 | 30.2% | ~raw 15-chain |

**Addressing the Critic's stalemate concern (failure mode 1A):**

The Critic identified that equal-skill players could stalemate via perfect counters + center drift. The Critic recommended "time limit with tiebreaker + escalating stakes." I integrate both:

- **Match turn limit:** 40 turns total (20 per player). If neither player has lost, the player whose meter is further toward the opponent's side wins. Ties broken by total chain length.

- **Escalating stakes:** After turn 20 (halfway point), all meter pushes are multiplied by `ESCALATION_MULT`:

  ```
  ESCALATION_MULT = 1.0 + max(0, (turn - 20)) * 0.05
  ```

  At turn 20: 1.0x (no change). At turn 30: 1.5x. At turn 40: 2.0x. Late-game chains push twice as hard. This naturally breaks stalemates -- any small edge in the final turns becomes decisive.

**Addressing the Critic's turtling concern (failure mode 1B):**

The Critic recommended counter-chains cancel at less than 1:1. I implement this with a **counter efficiency** parameter:

```
effective_counter = counter_push * COUNTER_EFFICIENCY
net = attack_push - effective_counter
```

`COUNTER_EFFICIENCY = 0.80` (proposed). A 5-chain counter against a 5-chain attack cancels only 80% of the push. The turtle bleeds 20% of every push they counter. Over 10 exchanges, the turtle has absorbed `10 * 0.20 * avg_push` = significant meter damage. Pure turtling is structurally losing.

The sweep range for COUNTER_EFFICIENCY is 0.60--1.00. At 0.60, countering is weak (barely worth it -- players stop countering and just attack). At 1.00, countering is free (turtling dominates). At 0.80, countering is valuable (cancels most of the push) but imperfect (you still bleed). The right value will emerge from simulation -- specifically, measuring the Counter Rate metric (target 30-60% of danger windows result in counter-taps) across efficiency values.

---

#### 1.6 Counter-Chain: The Danger Window (Full Specification)

**Visual specification for push waves:**

When a chain ends with push >= COUNTER_THRESHOLD, a colored bar segment (attacker's color) appears on the meter at the current meter position and begins sliding toward the defender's end over WAVE_TRAVEL_MS (1500ms). The wave's width on the meter is proportional to the push magnitude (larger push = thicker wave). This gives the defender a visual read on how threatening the incoming push is.

**Audio cue:** A rising tone begins when the wave starts, with pitch proportional to push magnitude. A big push = high pitch = alarm. A small push = low pitch = minor. The defender HEARS the threat level before they have time to read the wave visually.

**Counter-chain resolution:**

```
When defender taps during danger window:
  1. Defender's chain resolves (full cascade + blast force).
  2. Counter push calculated: counter_raw = calcMeterPush(defenderChain, defenderMomentum)
  3. Effective counter: counter_eff = counter_raw * COUNTER_EFFICIENCY
  4. Net push: net = attack_push - counter_eff
  5. Visual: both waves shown on meter, meeting at current position.
     Winning wave continues; losing wave shatters. Particles.
  6. If net > 0: meter moves toward defender by net.
     If net < 0: meter moves toward attacker by |net|.
     If net == 0: both waves shatter. No meter movement. Perfect cancel audio sting.
  7. Defender's turn is consumed. Turn passes to attacker.
```

**What happens when the defender passes (does not counter):**

```
When WAVE_TRAVEL_MS expires without defender tap:
  1. Full attack_push applies to meter.
  2. Meter moves toward defender.
  3. Defender's turn begins (normal turn, one tap).
  4. Defender's tap generates its own push wave or instant resolve per normal rules.
```

**The decision tree for the defender, explicitly:**

```
INCOMING PUSH WAVE (e.g., 0.073 from a 5-chain):

  Option A: Counter.
    I fire a chain. My chain's push * 0.80 cancels part of the wave.
    Best available chain is a 3 (push 0.037, effective 0.030).
    Net: 0.073 - 0.030 = 0.043 toward me. I eat 4.3%.
    Benefit: reduced damage (7.3% -> 4.3%).
    Cost: I used my turn on a 3-chain (maybe not my best option).
    My blast from the counter repositioned dots -- maybe favorably, maybe not.
    My momentum builds if chain >= 3.

  Option B: Pass.
    Full 7.3% push hits me.
    But I take my turn proactively. I see a 7-chain setup from the blast scatter.
    I fire the 7-chain: push 0.118 toward my opponent.
    Net exchange: they pushed 0.073 at me, I pushed 0.118 at them.
    If they counter my 7-chain: their counter is limited to 0.80x.
    Likely net positive for me.
    Cost: I ate 7.3% damage.
    Benefit: I chose the best possible chain instead of a reactive counter.

  Option C: Counter with something huge.
    I have a 7-chain available as a counter.
    Counter push: 0.118 * 0.80 = 0.094.
    Net: 0.073 - 0.094 = -0.021 toward THEM.
    I fully cancelled and pushed back 2.1%.
    Benefit: damage avoided AND surplus damage dealt.
    Cost: I used the 7-chain reactively. The blast from MY 7-chain
    happened at a location dictated by what was available during the
    1.5s window, not at the optimal positional play I might have found
    with more time.
```

This decision tree is the heart of the competitive game. Every danger window forces the defender to weigh immediate defense vs. positional investment. The answer changes based on: push magnitude, available chains, current momentum, meter position, and blast geometry of the counter-chain. This is the multi-variable decision-making that creates the skill ceiling.

---

#### 1.7 Supernova in Competitive Mode

**Charge: 4 consecutive qualifying chains (chain >= 3).**

Supernova meter is a separate indicator -- 4 small pips near the player's color zone on the tug-of-war meter. Each qualifying chain fills one pip. A chain < 3 resets all pips to empty (same trigger as momentum reset).

The Supernova charge is tied to momentum streak: you cannot charge Supernova without also building momentum. At the moment Supernova activates (4th pip fills), the player's momentum is at least x4. This means Supernova turns are always streak-amplified.

**Activation: Automatic. When 4th pip fills, your next turn is a Supernova turn.**

No activation button. No player choice of when to pop. The Supernova IS the reward for maintaining a 4-chain streak. This preserves one-tap fidelity (Criterion 1). The strategic layer exists in streak management: do you risk a 5-chain attempt (might whiff and reset streak) or play safe with a 3-chain to lock in the Supernova charge?

**Supernova turn: 3 taps, sequential resolution.**

```
Supernova Turn:
  1. Visual/audio activation: golden glow on all dots, low-pass filter
     sweep, particle density increase. "SUPERNOVA" text flash.
     Both players see and hear the activation.

  2. Tap 1: Player taps. Chain resolves. Blast force applied.
     Physics continues briefly (~200ms for dots to settle).

  3. Tap 2: Player taps again. Chain resolves. Blast force applied.
     Physics continues briefly.

  4. Tap 3: Player taps a third time. Chain resolves. Blast force applied.

  5. Combined push: sum of all three chains' pushes.
     push_total = push(chain1) + push(chain2) + push(chain3)
     All three are affected by the player's current momentum
     (which is at least x4).

  6. ONE push wave generated with push_total. ONE counter window.
     Opponent must counter the combined push with a single chain.

  7. Supernova meter resets to 0 pips. Momentum continues normally
     (if all three Supernova chains were >= 3, momentum increments
     for each, so a x4 player who fires three 3+ chains ends at x7).
```

**Supernova push estimates (at momentum x4, streak mult 1.45x):**

| Three chains | Combined push | % Meter | Comparable to |
|-------------|--------------|---------|---------------|
| 3 + 3 + 3 | 0.161 | 16.1% | Raw 10-chain |
| 4 + 5 + 3 | 0.236 | 23.6% | Raw 12-chain |
| 5 + 7 + 4 | 0.353 | 35.3% | Near-lethal |
| 7 + 8 + 5 | 0.463 | 46.3% | Match-ending |

A well-executed Supernova is a bomb. The opponent must counter with a big chain or eat potentially 35-45% meter push. The 3-tap sequential format also means the Supernova player sculpts the board three times -- each tap's blast sets up the next tap's catch. This is the "run the table" moment.

**Defensive Supernova:** If the opponent fires a massive push and you have Supernova charged, your Supernova turn generates a 3-chain counter. The combined counter-push is multiplied by COUNTER_EFFICIENCY (0.80). Even at 80%, three well-placed chains generate substantial counter-push. Defensive Supernova is less dramatic but equally valid -- you convert a crisis into a comeback.

---

#### 1.8 Type System and Schooling in Competitive

No new type rules. All competitive interactions emerge from existing physics.

**Standard dots:** Baseline in all respects. Blast resistance 1.0x. Schools reliably due to moderate speed. Competitive role: bread-and-butter chains. Predictable, buildable, readable.

**Gravity dots:** Slow (0.7x speed), resist blast (0.6x impulse), pull nearby dots continuously. Gravity explosions pull during hold. Competitive role: **positional anchors.** A gravity dot accumulates a cluster over time. Both players can see it growing. The question is timing: tap it at the right moment for a big chain, or let it grow for a bigger chain but risk the opponent tapping it first. Gravity dots also resist being pushed by the opponent's blasts -- they "hold position" while standards scatter around them. A gravity dot in the center of the board is a persistent strategic landmark.

**Volatile dots:** Fast (1.3x speed), extra-susceptible to blast (1.2x impulse), 1.5x explosion radius. Volatile explosions have huge blast zones. Competitive role: **power shots and chaos agents.** A volatile chain sends a shockwave across a wide area, dramatically reshaping the board. Volatile dots are hard to predict (fast movement) and create hard-to-predict blast patterns (large radius). Aggressive players seek volatile chains for maximum disruption; precise players avoid them for maximum control.

**Type-filtered cascades:** Gen 0 catches everything; gen 1+ catches same type only. This means the TYPE of the first dot you tap determines the cascade's character:
- Tap a standard dot in a mixed cluster: gen 0 catches everything nearby, gen 1 cascades through standards only. Blast comes from standard-position explosions.
- Tap a gravity dot in the same cluster: gen 0 still catches everything nearby, but gen 1 cascades through gravity dots only -- and gravity cascades PULL rather than push. Completely different blast geometry from the same cluster.

This is the deepest skill expression layer: same cluster, different tap target, different chain behavior, different blast pattern, different resulting board state. The expert asks not just "where should I tap?" but "which dot in this cluster should I tap, given how the cascade type affects blast geometry?"

**Schooling (boid flocking):** Same-type dots flock together via cohesion + alignment forces. Blast scatters schools. Boid forces re-cohere them over 1-3 seconds (depending on how far dots were pushed vs. cohesion range of ~80px). The expert reads: "my blast scattered this school, but flocking will reconverge them near (x, y) in ~2 seconds. My opponent can exploit that convergence, or I can -- whoever has the right turn timing." Schools are the "formations" on the board, and blast force is the tool that breaks and reforms them.

---

#### 1.9 Full Parameter Reference

For the implementer, all tunable parameters in one table:

| Category | Parameter | Value | Type |
|----------|-----------|-------|------|
| **Blast Force** | BLAST_K | 0.8 | float |
| | BLAST_N | 1.5 | float |
| | BLAST_RANGE_MULT | 2.0 | float |
| | BLAST_MAX_FORCE | 3.0 | float |
| | BLAST_DISPLACEMENT_CAP | 120 | px |
| | DOT_BLAST_RESIST.standard | 1.0 | float |
| | DOT_BLAST_RESIST.gravity | 0.6 | float |
| | DOT_BLAST_RESIST.volatile | 1.2 | float |
| **Meter** | METER_BASE | 0.008 | float |
| | METER_EXPONENT | 1.4 | float |
| | METER_DRIFT_PER_SEC | 0.005 | float/sec |
| | FIRST_TURN_OFFSET | 0.05 | float |
| | COUNTER_THRESHOLD | 0.015 | float |
| | COUNTER_EFFICIENCY | 0.80 | float |
| | FORFEIT_PENALTY | 0.015 | float |
| | STREAK_BREAK_PENALTY | 0.02 | float |
| **Momentum** | MOMENTUM_METER_MULT | 0.15 | float/level |
| | MOMENTUM_MAX | 10 | int |
| | MOMENTUM_MIN_CHAIN | 3 | int |
| **Supernova** | SUPERNOVA_CHARGES | 4 | int |
| | SUPERNOVA_MIN_CHAIN | 3 | int |
| | SUPERNOVA_TAPS | 3 | int |
| **Turn** | WAVE_TRAVEL_MS | 1500 | ms |
| | SHOT_CLOCK_MS | 10000 | ms |
| | MATCH_TURN_LIMIT | 40 | int |
| **Escalation** | ESCALATION_START_TURN | 20 | int |
| | ESCALATION_RATE | 0.05 | float/turn |
| **Spawn (per tier)** | (see Section 1.3) | | |
| **Cascade (existing)** | CASCADE_GEN_CAP | 4 | int |
| | CASCADE_RADIUS_GROWTH | 0.08 | float/gen |
| | CASCADE_HOLD_GROWTH | 200 | ms/gen |

---

### 2. Three Concrete Game Scenarios

---

#### Scenario 1: Novice Stumbles Into a Satisfying Chain (First Match)

**Context:** CASUAL tier vs. Easy AI. 22 standard dots, no gravity, no volatile, no boid schooling. Slow dot speed (0.4-0.8).

Mika has played 10 minutes of solo mode. She knows: tap near dots, they chain, score goes up. She starts her first PvP match.

The board fills with white dots drifting gently. A thin bar on the left has a small marker in the center. The bottom of her screen glows blue -- it is her turn.

She spots a group of 5 dots near the upper-right, loosely clustered. She taps. The explosion blooms. Three dots pop into it -- a 3-chain. She notices something: two dots that were just outside the explosion sort of... jumped. They scooted away from where she tapped, moving maybe 40 pixels to the right. It looks like the explosion pushed them. She does not think about it strategically.

A blue pulse appears on the meter bar and slides upward. It is small. Then it is the AI's turn. The AI taps a cluster near the left. 2-chain. An orange pulse slides downward. The pulses meet on the bar, the blue one was bigger, and the bar marker nudges upward. Mika sees: she is "winning" the bar.

Four turns later, Mika taps a 4-cluster. The blast pushes three dots down and to the left. One of those pushed dots ends up near two other dots that were already drifting from the left edge. Without planning it, Mika has created a new 3-cluster where none existed before. She does not notice -- she is watching the meter.

The AI's next push wave is a 3-chain. The blue pulse was traveling from Mika's last turn. Wait -- the wave animation overlaps with the AI's response. Mika taps on reflex during the AI's wave, catching a 2-cluster near the center. She did not mean to counter; she just tapped. But the 2-chain generates a small counter-push. The incoming wave partially cancels. The meter nudges less than it would have.

Mika blinks. Something happened. The AI's push was smaller than expected. She replays the moment in her mind and half-understands: "My tap ate some of their attack?"

Six turns later, she fires a lucky 6-chain (a cluster that the blast from her previous turn had accidentally assembled). The push wave is big. The AI manages a weak 2-chain counter. The net push shoves the meter deep into the AI's danger zone. One more 3-chain and the meter crosses. **"YOU WIN."**

**What Mika learned:**
- Bigger chains push the meter more.
- Something happened when she tapped during the AI's wave (accidental counter discovery).
- Dots moved after explosions (observed, not yet strategic).
- The 6-chain that won the game happened because of blast-pushed dots from a previous turn (she does not know this yet -- she will connect the dots around game 5-8).

---

#### Scenario 2: Intermediate Reads Blast Physics (Ranked FLOW, 2 Weeks In)

**Context:** FLOW tier. 32 dots, 80% standard, 20% gravity, schooling active.

Dev (momentum x3, Supernova 2/4) vs. Riya (momentum x2, Supernova 0/4). Meter at +0.08 (Dev slightly leads). Dev's turn.

Dev scans the board. He sees:

**Top half:** A school of 5 standard (blue) dots flowing rightward in a line near y=200. Clean, tight, predictable.

**Center:** A gravity dot (purple) at (300, 450) with 2 standard dots orbiting it. The gravity is slowly pulling a third standard in from the left.

**Bottom-left:** A scattered group of 4 dots, no school formation, spread across a 100px area.

Dev considers his options:

*Option A: Tap the 5-dot school.* 4-5 chain. Push: ~0.053-0.073 at x4 momentum = 0.077-0.106. Solid push. But the blast scatters survivors into the empty right side of the board. No setup value.

*Option B: Tap the gravity cluster.* 2-3 chain (the gravity dot + 2 orbiting standards). Push: 0.021-0.037 at x4. Small. But the gravity explosion COMPRESSES nearby dots during hold. The 3rd standard being pulled in will accelerate into the cluster during hold and likely get caught. And the blast from this explosion pushes the bottom-left scattered dots UPWARD (toward where the gravity cluster was), creating a new formation in the post-explosion space.

Dev chooses Option B. He taps the gravity dot. The gravity explosion catches 4 dots (the gravity dot + 2 orbiting + the 1 being pulled in). Gen-0 catch. Gen-1 cascade through gravity type -- but only one gravity dot was caught, so the gen-1 gravity cascade at the gravity dot's position catches nothing new. Chain: 4.

Blast effect: The gravity explosion's hold phase pulls nearby dots inward. Two standards from the bottom-left cluster are pulled 15px toward the explosion center. Simultaneously, the blast impulse pushes dots further away outward. Net: close dots compressed, far dots scattered. The two bottom-left standards that were pulled in are now at (285, 430) and (310, 465) -- close to each other and close to where the gravity cluster was.

Push: `0.053 * (1 + 3*0.15) = 0.077`. Decent -- 7.7% of the meter.

**Riya's danger window.** She sees a 7.7% wave heading her way. She reads the board. The school of 5 standards is still intact in the upper half (Dev did not touch it). She could counter with that school: probably a 4-chain, effective counter `0.053 * 0.80 = 0.042`. Net: `0.077 - 0.042 = 0.035`. She eats 3.5% instead of 7.7%.

But Riya thinks further: "If I use the school to counter, the blast from my counter-tap scatters those school dots. Dev compressed dots in the center with his gravity play. If I DON'T counter, I eat 7.7%, but I keep the school intact for a bigger play next turn. Dev's compressed center-dots plus the school equals potential for a 7+ chain if I can maneuver them together."

Riya decides: eat the damage. She passes. The wave resolves. Meter moves from +0.08 to +0.157 toward Dev.

**Riya's turn (non-counter).** She taps a lone standard dot at (200, 350) -- between the upper school and Dev's compressed center-dots. Chain: 1 (just the one dot). Momentum breaks. Streak penalty: +0.02 toward Riya. Meter now at +0.177.

But the blast from (200, 350) pushes the school dots (above her tap) UPWARD and the center-dots (below her tap) DOWNWARD AND RIGHT. Wait -- she made a mistake. She pushed them APART. The school went up, the center went down. She did not achieve convergence.

Or did she? The dots she pushed "downward" from center are now near a gravity dot that spawned from the edge 5 seconds ago at (350, 550). That gravity dot is pulling. In 2 seconds, those pushed dots will be in gravity range and start converging.

Dev's turn. He reads the board. He sees Riya's sacrifice play (1-chain, streak break, meter penalty). He sees the school intact at the top and the center dots drifting toward the new gravity dot. He wants to deny her setup. He taps the gravity dot at (350, 550) -- catching just the gravity dot and 1 nearby standard. Chain: 2. The gravity explosion pulls center-drifting dots TOWARD the explosion during hold -- which means they arrive closer to where the gravity dot was. But the dot was just caught and is gone. The pull accelerated them into an empty zone.

Riya's turn. The dots that were accelerated toward the gravity dot's (now-empty) former position are clustered at (340, 530). Three standards, tight formation. Plus two more drifting in from edge spawns. She taps them. Chain: 5. Push: `0.073 * 1.0` (her momentum is at x1 since it reset). The push is 7.3% -- enough to reclaim some ground.

Dev has a counter available. He fires a 3-chain. Effective counter: `0.037 * 0.80 = 0.030`. Net: `0.073 - 0.030 = 0.043` toward Dev. Meter moves from +0.177 to +0.134.

Riya has clawed back from +0.177 to +0.134 -- a 4.3% recovery. More importantly, she has re-established momentum (her 5-chain restarts her streak at x1). Dev's counter-chain of 3 maintains his momentum at x5. The strategic landscape is uneven but the game continues.

**What this scenario demonstrates:**
- Dev chose a smaller chain for better blast geometry (gravity compression).
- Riya chose to absorb damage rather than waste a valuable school on a defensive counter.
- Riya then fired a 1-chain sacrifice to try to push dots toward each other (it partially worked via a gravity dot she had not initially targeted).
- Dev read Riya's setup and tried to deny it (tapping the gravity anchor).
- The interplay of blast force, gravity pull, and strategic denial created a 4-turn exchange with genuine reads and counter-reads.

---

#### Scenario 3: Master-Level 4-Move Plan (Diamond, MASTER Tier)

**Context:** MASTER tier. 35 dots: 50% standard, 25% gravity, 25% volatile. Full schooling. Both players Diamond rank.

Kael (meter: -0.06, trailing slightly. Momentum x5. Supernova 3/4 charged) vs. Zara (meter: +0.06, leading. Momentum x3. Supernova 1/4). Turn 24 of 40. Escalation multiplier: `1 + (24-20)*0.05 = 1.20`. Late game. Stakes are rising.

**Board state:**
- Upper-left: A volatile school of 4 dots moving fast rightward (heading toward the center).
- Center: Two gravity dots at (200, 420) and (230, 440), creating a dual gravity well. 5 standard dots orbiting, slowly compressing.
- Lower-right: A mixed cluster -- 3 standards + 1 volatile -- near (320, 650). Loose formation.
- Scattered: 8 more dots (mix of types) spread across the board, mostly in the bottom half.

**Kael's 4-move plan:**

He reads this: the dual gravity well in the center is the most valuable formation on the board. If he can chain it at peak compression, he might get 9-10 dots and the biggest push of the game. But it is not ripe yet -- 5 orbiting dots, needing 2-3 more to reach critical mass. The volatile school heading rightward from the upper-left will pass near the gravity well in about 3 seconds if undisturbed.

Here is what he sees 4 moves ahead:

*Move 1 (this turn):* He taps the lower-right cluster (3 standards + 1 volatile). Chain: 4. The volatile dot's cascade at gen-1 creates a 1.5x radius explosion. The volatile blast pushes nearby scattered dots UPWARD and LEFT -- toward the gravity well. Specifically, he reads that 2 scattered standards at (280, 580) and (310, 600) will receive blast impulse directed roughly toward (230, 440). The gravity well will begin pulling them once they enter range.

Push: `0.053 * 1.20 (escalation) * (1 + 4*0.15) (momentum x5) = 0.053 * 1.20 * 1.60 = 0.102`. 10.2% push. His Supernova fills: 4/4 -- his chain was 4 (>= 3). **Next turn is Supernova.**

*Move 1 execution:* He taps the volatile dot at (335, 640) to start the chain on volatile type. Gen-0 catches all 4. Gen-1 volatile cascade at (335, 640): volatile explosion with 1.5x radius. The blast zone extends 3.0R (= 120px). The two scattered standards at (280, 580) and (310, 600) are within this zone. They receive a blast impulse pushing them toward upper-left -- roughly toward (200, 450). The gravity well at (200, 420)/(230, 440) will start pulling them once they cross into the 100px pull range.

Push wave: 10.2% toward Zara. This is above the counter threshold.

*Zara's response:* She sees a 10.2% wave. She checks the board. The volatile school from upper-left is about to enter the gravity well's influence zone. She recognizes Kael's plan: he is feeding dots to the gravity well for a monster chain. She needs to disrupt.

She could counter the wave (use the volatile school or the gravity well itself to cancel). But if she chains the volatile school, she removes the dots Kael was going to feed to the gravity well. If she chains the gravity well, she detonates it early (only 5 dots) and denies the super-cluster. Both are strategically strong counters.

Zara decides: tap the gravity well NOW. She chains the dual gravity well with its 5 orbiters. Chain: 7 (2 gravity + 5 standard). Counter push: `0.118 * 0.80 (efficiency) * 1.20 (escalation) * (1 + 2*0.15) (momentum x3) = 0.118 * 0.80 * 1.20 * 1.30 = 0.147`. Her counter exceeds the attack. Net: `0.102 - 0.147 = -0.045`. The meter pushes 4.5% toward KAEL. Zara's counter wins the exchange.

But she paid a price: the gravity well is gone. The center of the board is now a blast crater. The gravity dots are consumed. The 5 orbiters are consumed. The gravity pull that was accumulating dots no longer exists.

*Kael adjusts:* His original plan was to Supernova the gravity well. Zara destroyed it. But Kael's blast-pushed dots (the 2 standards heading upper-left from his volatile chain) are still in motion. They are heading toward where the gravity well WAS. Without the gravity pull, they will drift through the center and continue moving.

*Move 2 (Kael's Supernova turn):* The meter is at -0.015 (slightly against Kael after Zara's counter). Kael has 3 taps.

He re-reads the board. The volatile school from upper-left has arrived at center, moving rightward. The 2 blast-pushed standards are arriving at center from the lower-right. A new gravity dot spawned from the top edge and is at (180, 150), heading downward. Scattered dots in the bottom half.

**Tap 1:** He taps the volatile school as it passes through center. 3 volatile + 1 standard caught. Chain: 4. The volatile blasts send a shockwave across the center -- pushing the 2 arriving standards DOWNWARD toward the bottom-half scattered dots. Blast range 120px reaches far.

**Tap 2:** He waits 200ms (physics continues -- the pushed standards travel ~30px downward). He taps the converging group in the bottom-center: 2 pushed standards + 2 scattered standards + 1 scattered gravity. Chain: 5. The gravity explosion at gen-1 pulls 1 more dot in during hold. Chain: 6. Blast pushes remaining dots toward edges.

**Tap 3:** He spots the new gravity dot at (180, 200) (it has been drifting down from spawn). Two edge-spawned standards are near it. He taps the gravity dot. Chain: 3 (gravity + 2 standards). Small but qualifying.

**Combined Supernova push:**
```
chain1 (4): 0.053
chain2 (6): 0.091
chain3 (3): 0.037
total: 0.181
with escalation (1.20x): 0.217
with momentum (x6, streak_mult 1.75): 0.380
```

38% of the meter in one turn. From Kael's position of -0.015 (slightly behind), the meter jumps to +0.365 toward Zara. She was leading by 1.5%. Now she is losing by 36.5%.

**Zara's counter:** She must counter a 38% wave with a single chain. The board is cratered -- Kael's three blasts scattered everything. She finds a 4-chain near the right edge (dots that were pushed there by Tap 1's blast). Counter: `0.053 * 0.80 * 1.20 * (1 + 3*0.15) = 0.053 * 0.80 * 1.20 * 1.45 = 0.074`. Net: `0.380 - 0.074 = 0.306` toward Zara.

Meter: from -0.015 to +0.291. Zara is now losing by 29%. With escalating stakes and 16 turns remaining, she needs to recover ~29% -- roughly 3-4 winning exchanges with no counters from Kael. Possible but difficult.

**What Kael demonstrated across 4 moves:**

1. **Move 1 (feed):** Chained a cluster to use volatile blast as a "push" -- feeding dots toward the gravity well. Simultaneously filled his Supernova meter (4th qualifying chain). The chain was chosen for three purposes: meter push, blast-force feeding, and Supernova charge.

2. **Adaptation:** When Zara countered by destroying the gravity well (a strong defensive play that cost her the biggest formation on the board), Kael pivoted. His blast-pushed dots were still in motion. He re-planned his Supernova around the new board state.

3. **Supernova (Taps 1-2-3):** Each tap's blast set up the next tap's catch zone. Tap 1 pushed dots downward; Tap 2 caught the pushed dots (plus nearby strays); Tap 3 caught a newly spawned gravity cluster. The 3-tap choreography was a real-time adaptation, not a pre-planned sequence -- the exact positions depended on how far Tap 1's blast pushed dots, which depended on the volatile explosion's 1.5x radius.

4. **Net result:** 38% meter push in a single turn, from a trailing position, despite the opponent destroying his primary target. The comeback was possible because Supernova + high momentum + escalation multiplied a sequence of moderate chains (4+6+3) into a game-changing push.

---

### 3. What Is STILL Uncertain

Ranked by how likely each uncertainty is to break the design.

**CRITICAL (design fails if wrong):**

1. **Blast force legibility (the Critic's existential risk).** Can humans learn to intuitively predict blast-scatter patterns? I believe yes, for two reasons:
   - Players only need to predict the behavior of the cluster they care about (3-5 dots), not all 40 dots. The visual "cluster glow" directs attention to the relevant subset.
   - The blast is RADIAL and follows inverse-power falloff -- this is the simplest possible force model. "Stuff near the explosion flies away from it" is intuitive. The subtlety is in the magnitude and interaction with boid flocking, which is where learned intuition enters.

   But I cannot prove this from theory. The Critic is right: this needs a playtest. Specifically, the "20-trial prediction accuracy test" the Critic proposed. I am 65% confident humans can learn this (based on analogies to pool, bowling, Angry Birds trajectory prediction). If they cannot, we simplify: reduce dot count per board, weaken boid flocking to reduce post-blast complexity, or add a "blast preview" (ghost trajectories showing where dots will travel, visible for 0.5s before the blast fires). The preview is a last resort because it adds visual noise.

2. **Cascade blast accumulation.** A gen-4 chain with 8 caught dots creates ~9 blast events. A surviving dot in the middle of the chain might receive 3-4 impulses from different directions. I proposed a per-dot displacement cap (120px/turn) to prevent chaos. But I have not simulated whether multi-blast interactions create READABLE patterns (expert can predict the cumulative displacement direction) or CHAOTIC noise (displacement direction is effectively random because small changes in dot position alter which blasts it receives). This MUST be simulated. If chaotic: cap at 1 blast impulse per dot per turn (only the closest explosion applies blast force, all others ignored for that dot). This simplifies prediction at the cost of blast pattern richness. I am 45% confident multi-blast is readable.

**HIGH (design works but may need significant tuning):**

3. **Match length at proposed parameters.** Target: 60-120 seconds. The push formula, counter efficiency (0.80), drift rate (0.005/s), and escalation (post-turn-20) all interact to determine match length. I have not simulated this. If matches are too short (under 30s): reduce METER_BASE. If too long (over 180s): increase METER_BASE and/or escalation rate. I am 50% confident the proposed values land in the target range.

4. **Counter rate equilibrium.** Target: 30-60% of danger windows produce counter-taps. If COUNTER_EFFICIENCY is too low (e.g., 0.60), nobody counters -- it is not worth it, you eat the push and use your turn proactively. If too high (e.g., 1.00), everyone counters -- turtling dominates. At 0.80, the math says: countering a 5-chain with a 3-chain cancels 0.030 of a 0.073 push (41% of the attack). Is that worth spending your turn? Depends on what else you could have done. The decision is marginal -- which is exactly what we want (not obvious, requires board-reading). I am 60% confident 0.80 is in the right range.

5. **Momentum compounding.** At x8 momentum with escalation 1.40x (turn 28), a 5-chain pushes `0.073 * 1.40 * 2.05 = 0.210`. That is 21% from a 5-chain. This might be too much -- a player who builds a high streak dominates. Mitigation: the counter mechanic (countering cancels 80% and does not reset the counter's momentum), center drift, and the fact that maintaining a streak at x8 requires 8 consecutive 3+ chains (hard to do while the opponent is blasting your board). But if simulation shows momentum compounding is too strong, reduce MOMENTUM_METER_MULT from 0.15 to 0.10 (x8 becomes 2.05 -> 1.70, and the 5-chain at x8 pushes 17.3% instead of 21.0%). I am 55% confident 0.15 is correct.

**MEDIUM (probably fine, might need adjustment):**

6. **Automatic Supernova vs. player choice.** I chose automatic for one-tap fidelity. The Facilitator raised this as a design question. I am now 70% confident automatic is correct. The streak management IS the choice: you decide when to maintain vs. break your streak, and the Supernova charge is a direct consequence. Adding a manual activation button would give more control but introduce a second input type. The Tetris Effect Zone analog is the strongest argument for manual -- but Zone in Tetris Effect is activated via a dedicated button that does not appear on the playfield. On mobile, that button eats screen space and creates a target smaller than 12mm. Automatic avoids both problems.

7. **First-turn offset (0.05).** This is a guess to compensate first-mover advantage. The actual first-mover advantage (or disadvantage) will only be known from simulation. If simulation shows second-mover advantage, the offset should favor Player A instead. Or it should be zero. I am 40% confident the direction is correct (first-mover advantage exists and Player B needs compensation), but the magnitude is pure guesswork.

8. **Streak break on chain < 3 vs. chain == 0.** The current spec resets momentum on any chain below 3, which is harsh. A 2-chain is still a positive action (you caught 2 dots, pushed the meter slightly). Penalizing it feels wrong. But the Supernova charge threshold is also 3, and aligning the two thresholds creates a clean "qualifying chain" standard. If playtesting shows the <3 penalty is frustrating, change to: momentum and Supernova reset only on chain == 0 (whiff). The streak-break meter penalty (0.02) would then also only apply to whiffs. I am 55% confident the <3 threshold is correct.

**LOW (confident these are right):**

9. **Shared board, turn-based.** 95% confidence. All three agents converged.
10. **Tug-of-war as win condition with drift.** 90% confidence.
11. **No counter-counter rallies.** 85% confidence.
12. **Blast force as core innovation.** 90% confidence that the CONCEPT is right. The parameter values are uncertain (see above), but the idea of using explosion blast to reposition dots is the design's identity.

---

### 4. Response to the Proposer's Three Combos from Round 2 (Critic's Ranking)

The Critic ranked: **Dark Horse (13+7+3) > Combo B > Combo A > Combo C.**

**I agree with the ordering. Here is what happened to each:**

**Dark Horse (13+7+3): This IS the specification above.**

Billiards physics as the core competitive innovation. Tug-of-war meter as the win condition. Counter-chains as the defense layer. Turn-based alternation to preserve determinism. Everything else (blast force parameters, push formula, wave travel, escalation) is the connective tissue that makes these three ideas into a playable game.

**Combo B (Momentum Billiards): Absorbed into the dark horse.**

Combo B's key idea -- the momentum streak as a meter-push multiplier with streak-break penalties -- is now Section 1.5's `MOMENTUM_METER_MULT` parameter. The streak creates the risk/reward tension Combo B was designed for: safe chains maintain the streak, risky chains might break it. The streak-break penalty (0.02 meter + momentum reset) makes whiffs hurt.

Combo B lacked active defense (the Critic's note). The dark horse adds counter-chains (from Idea 3). Combo B's momentum + the dark horse's counters = the complete system. The absorption is seamless because momentum and counter-chains operate on orthogonal axes (momentum affects push magnitude; counters affect push cancellation).

**Combo A (Billiards Garbage): Declined.**

The Critic was right: split boards weaken the billiards analogy. The shared board is the design's defining feature. Adding garbage to a shared board would require distinguishing "my dots" from "opponent's dots" on a 5.4" phone screen -- exactly the readability problem (Tension B) that the Facilitator showed the dark horse avoids entirely.

The shared board makes garbage unnecessary. Your blast IS the disruption. Your chain IS the pressure (via meter push). The tug-of-war meter replaces the "garbage queue" with a simpler, more legible scoreboard. Combo A's best insight ("garbage as fuel" -- use incoming pressure as raw material) is spiritually preserved in the counter-chain: the opponent's push wave IS the "incoming garbage," and your counter converts it to your own attack.

**Combo C (Counter-Billiards Overflow): Declined.**

The Critic identified the death spiral: overflow systems punish the losing player with a harder board. The tug-of-war meter has the opposite property: the losing player gets center drift (passive comeback) and counter-windows (active comeback). The tug-of-war is a more competitive win condition.

Combo C's strongest argument was mode portability ("solo mode IS the current game"). The dark horse's solo zen mode is close: continuous mode with blast force, no meter, no turns, no counter. The only difference from the current game is the addition of blast force -- which enriches solo play (positional chain planning) without adding competitive-specific mechanics. The portability is not as perfect as Combo C's, but it is sufficient.

I also considered Combo C's overflow mechanic as a secondary pressure layer (meter penalty for dot count > threshold). I decline this: the tug-of-war meter should be the SOLE loss condition to avoid splitting attention (anti-pattern #4). One threat axis, not two.

**Elements I would fold in from other combos if the dark horse needs revision:**

- From Combo B: Already folded (momentum multiplier).
- From Combo A: If playtest reveals the shared board is too hard to read (the Critic's C5 concern), Combo A's split-board variant is the fallback. Split boards sacrifice the billiards aesthetic but gain readability. This is a last-resort pivot.
- From Combo C: If the tug-of-war meter + counter system fails to produce decisive matches (the Critic's stalemate concern), Combo C's overflow pressure could be added as a secondary loss condition: meter OR overflow, whichever triggers first. This adds urgency and breaks stalemates. But it also adds complexity. Only if needed.

---

### 5. Questions for Round 4 Respondents

**For the Critic:**

1. The COUNTER_EFFICIENCY parameter (0.80) is my answer to your turtling concern. At 0.80, a pure turtle bleeds 20% of every incoming push. Over 10 exchanges against a 5-chain attacker, the turtle absorbs `10 * 0.20 * 0.073 = 0.146` net push -- 14.6% of the meter. Is this enough to structurally discourage turtling, or do you need a stronger disincentive?

2. You identified blast force legibility as the existential risk and proposed a 20-trial human prediction accuracy test. I agree this is essential. What is the minimum acceptable accuracy improvement? You said "50% (random) to 70%+ over 20 trials." Would 60% be sufficient? What if accuracy reaches 70% for simple blasts (single explosion, 5 dots nearby) but only 55% for cascade blasts (gen-4 chain, multiple blast sources)?

3. The escalation mechanic (push multiplier grows after turn 20) addresses your stalemate concern. But it also benefits the leading player equally: their late-game pushes are amplified too. Does escalation actually help the trailing player, or does it just accelerate whoever is already ahead?

**For the Facilitator:**

1. My Scenario 3 (master-level, Kael vs Zara) involves Zara making a strategically brilliant defensive play (destroying the gravity well to deny Kael's setup). But Zara still loses the exchange massively because Kael adapts and fires a Supernova. Is this outcome satisfying for Zara? Does "I made the right read but my opponent had Supernova and adapted" feel like a fair loss, or does it feel like a resource imbalance (Supernova is overpowered)?

2. The visual language for the danger window and counter-chain needs to communicate urgency without creating panic. My spec proposes: rising tone with pitch proportional to push magnitude + visible push wave animation on meter. Is this sufficient? Should there be an on-board visual cue as well (e.g., the board edges glow the attacker's color during the danger window)?

3. The 1.5-second wave travel time determines the pace of the game. It is long enough for a read but short enough for tension. Your "60-second skill revelation" criterion requires that new players discover core mechanics organically. Does the 1.5-second danger window give a novice enough time to accidentally stumble into their first counter-chain, or is it too fast for someone who does not know what is happening?

**For the Research agent:**

1. The COUNTER_EFFICIENCY parameter (less than 1:1 cancellation) is inspired by competitive Puyo Puyo, where garbage cancellation is exact (1:1). Tetris garbage delay allows full cancellation but has timing windows. Are there any competitive puzzle games that use partial cancellation (less than 1:1)? What were the results?

2. The escalating stakes mechanic (push multiplier grows over time) is used in several fighting games (chip damage scaling, sudden death modes). What is the typical timing for escalation onset in successful competitive games? Our turn 20 of 40 (halfway point) -- is that too early, too late, or about right?

---

*Round 3 Proposer specification complete. Twenty-eight tunable parameters specified with proposed values, sweep ranges, and target behaviors. Three scenarios demonstrate novice, intermediate, and master-level play. Twelve uncertainty items ranked by risk. Combo B absorbed; Combos A and C declined with fallback plans identified. The existential question remains: can humans read blast-scatter patterns? Build the prototype. Test with humans. Then decide.*
