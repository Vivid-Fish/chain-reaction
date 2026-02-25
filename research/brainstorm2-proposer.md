# Chain Reaction: Competitive Mode Brainstorm 2 -- PROPOSER

## Date: 2026-02-23

## Why the Last Brainstorm Failed

The previous five-round brainstorm converged on a turn-based shared-board billiards design with strict A-B-A-B alternation, tug-of-war meter, and counter-chains. It was a good strategy game. It was the wrong game for Chain Reaction.

The failure was subtle: the brainstorm optimized for *decision depth* and ended up designing competitive Go with chain-reaction scoring. The turn-based structure killed the two things that make Chain Reaction special -- the continuous flow state and the constant fast-twitch physics prediction loop. A player sitting there reading the board for 4 seconds between turns is playing a puzzle, not playing racquetball. The "dots are always in motion" principle was acknowledged on paper and violated in spirit.

This time: flow state is sacred. If a player ever stops to think, the design is wrong.

---

## The Constraint Set (Restated for Clarity)

Every proposal must survive ALL of these:
1. **Real-time, simultaneous** -- both players act continuously. No turns, no alternation, no "your move."
2. **Flow state preserved** -- no waiting, no watching, no pausing. The player is always reading, always about to act.
3. **One tap** -- the action space is when and where to tap. Nothing else.
4. **Deterministic physics** -- more predictable, not less. Skill = prediction depth.
5. **Information on the playfield** -- no HUD reading, no meters to check, no UI elements to parse.
6. **Shared space preferred** -- direct interaction like racquetball, not indirect like Tetris-vs-Tetris.

---

## 8 Competitive Mode Concepts

---

### 1. THE COURT

**How it works:** One shared field. Both players tap simultaneously, continuously, in real time. Each player's explosions are color-coded (blue vs orange). When your explosion catches a dot, that dot scores for you. When both explosions reach the same dot simultaneously, neither player scores it (contested). The game ends on overflow -- whoever has more points wins. There is no turn structure. You tap whenever your cooldown expires. Dots spawn from edges continuously, density builds as in solo continuous mode.

**Reference game:** Racquetball. Two players in the same court, the ball is always live, you hit when it comes to you. The shared space means every action by your opponent changes what you see. There is no moment when the game is "not your turn."

**Kill criteria survival:**
- Not turn-based: both players tap freely, simultaneously.
- Flow state: continuous density pressure from spawns forces constant engagement. You cannot stop tapping or the board overflows and you lose.
- One tap: same as solo. Tap to explode.
- Deterministic: same physics. Both explosions resolve deterministically. Contestation (simultaneous reach) is deterministic given the timing.
- No UI reading: score difference is encoded as a subtle background tint -- the winning player's color slowly saturates the background. You feel who is winning without reading a number.
- Shared space: yes, directly.

**Skill axis:** The expert reads not just where dots are converging, but where the *opponent isn't looking*. On a shared board, every cluster is contested. The novice taps the biggest cluster and races the opponent for it. The expert identifies the cluster that forms in 1.5 seconds that the opponent hasn't noticed yet, and taps it at the moment of peak density before the opponent reacts. The skill is spatial awareness across the entire field plus opponent attention modeling -- "they just tapped upper-left, so they're on cooldown for 1.5s. The lower-right cluster peaks in 0.8s. I own that cluster." This is racquetball court vision: you're not watching the ball, you're watching the opponent.

---

### 2. KING OF THE HILL

**How it works:** One shared field. A glowing "hot zone" (roughly 20% of the field area) appears and slowly drifts across the board. Dots caught inside the hot zone are worth 3x. Dots caught outside are worth 1x. Both players tap continuously. The hot zone position is fully deterministic (sinusoidal drift path, visible trajectory line showing where it's heading). First to a score threshold wins. New hot zone spawns when the old one completes its path.

**Reference game:** Rocket League. The ball (hot zone) is the focal point. Everyone knows where it is and where it's going. The skill is arriving at the right position before the opponent and executing. Bronze chases the ball. Grand Champion reads the trajectory and is already there.

**Kill criteria survival:**
- Not turn-based: simultaneous, continuous.
- Flow state: the drifting hot zone creates a constant pull -- you're always deciding whether to chase the zone or harvest the uncontested field outside it. There's always something to do.
- One tap: yes.
- Deterministic: hot zone path is deterministic and displayed. Physics unchanged.
- No UI reading: the hot zone IS the playfield. Score threshold shown as a thin progress bar at screen edge, same as solo mode's density bar.
- Shared space: yes.

**Skill axis:** The novice chases the hot zone and taps inside it. The intermediate reads the hot zone's trajectory and pre-positions their attention. The expert recognizes that contested hot-zone taps are worth 3x but split between two players (expected value: 1.5x), while uncontested field taps outside are worth 1x but guaranteed (expected value: 1x). The expert plays the field while the novice fights over the zone -- until the zone drifts over a massive natural cluster, at which point the expert pivots. The decision space is continuous and changes every second.

---

### 3. INFECTION

**How it works:** One shared field. At game start, half the dots are tinted blue, half orange (randomly distributed, visually subtle -- a gentle hue, not a jarring color). Each player can only score by catching dots of THEIR color. When your explosion catches an opponent's dot, that dot doesn't score -- instead it CONVERTS to your color. Converted dots are now yours to catch on future taps. Both players tap continuously. The win condition: convert all dots to your color, or have more dots of your color when the field overflows.

**Reference game:** Tetris Effect Zone Battle meets Splatoon's turf war. The field is a living canvas of territory. Every tap paints the board. But unlike Splatoon, you don't choose a direction to paint -- you choose a MOMENT to detonate, and the physics determines what gets painted.

**Kill criteria survival:**
- Not turn-based: simultaneous, continuous.
- Flow state: you're always scanning for clusters of enemy-colored dots near your dots, looking for conversion opportunities. The board state shifts with every explosion from either player.
- One tap: yes.
- Deterministic: same physics. Conversion is deterministic (caught by your explosion = converts).
- No UI reading: territory is encoded in the dot colors themselves. The field IS the scoreboard. A glance tells you who's winning -- more blue or more orange on screen.
- Shared space: yes, deeply.

**Skill axis:** The novice taps their own clusters (scoring their existing dots). The intermediate taps at the boundary between their color and the opponent's, converting enemy dots. The expert reads the flow of dots -- because dots move and mix, a cluster of 5 enemy dots drifting toward a gravity dot of yours will, in 2 seconds, become a mixed cluster where one well-placed tap converts all 5. The expert also reads the opponent's likely targets and defends by pre-tapping contested boundaries. Conversion cascades are the deepest layer: catch an enemy dot, it converts, it detonates as YOUR color, catching more enemy dots in the cascade -- each generation propagates your color deeper into enemy territory. A single well-placed tap in a mixed zone can flip 15 dots. The chain IS the territory sweep.

---

### 4. DENSITY RACE

**How it works:** Split screen, each player has their own field. Same dot spawns on both fields (mirrored seeds). Both play the same continuous mode simultaneously in real time. The player who survives longer wins. If both overflow at the same time, higher score wins. No direct interaction -- pure parallel racing. Both players see a thin translucent ghost of the opponent's field overlaid on their own, showing recent tap positions and current density as a faint silhouette.

**Reference game:** Tetris Effect Journey leaderboard + F-Zero time trials. Same track, same conditions, you versus their ghost. The parallel format preserves pure flow state because nothing the opponent does affects your physics. The ghost overlay creates psychological pressure without mechanical disruption.

**Kill criteria survival:**
- Not turn-based: real-time, simultaneous.
- Flow state: identical to solo continuous mode, which is already designed for flow. The ghost overlay adds tension without adding cognitive load.
- One tap: yes.
- Deterministic: mirrored seeds = identical starting conditions. Pure skill comparison.
- No UI reading: opponent state is a ghost silhouette, not numbers. You feel their presence, not read their stats.
- Shared space: separate boards, but consider carefully -- the ghost overlay creates a sense of presence without mechanical interaction. This is the weakest on the "shared space" criterion but survives because the kill criteria say "consider carefully," not "mandatory."

**Skill axis:** Identical to solo, which is already deep (SCR 3.52x). The opponent's ghost creates pressure that degrades weaker players' performance (choking under observation) while stronger players use the ghost to pace themselves. The expert watches the opponent's tap positions in the ghost and adjusts strategy: "they're tapping aggressively in the upper half, leaving lower density to build. I'll maintain full-field coverage." At the highest level, seeing the opponent's strategy through the ghost and counter-adapting (not mechanically, but strategically) creates a meta-game on top of the pure physics game.

---

### 5. TUG-OF-FIELD

**How it works:** One shared field, oriented in landscape. Player A sits on the left, Player B on the right. Dots spawn from both edges and drift toward the center. When you catch dots in a chain, those dots push the "pressure line" (a vertical divider) toward your opponent's side. The pressure line drifts slowly back to center between actions. If the pressure line reaches your edge, you lose. Both players tap continuously in real time. The pressure line's position determines the spawning balance -- the losing player's side gets fewer spawns (they have less field to manage), creating a natural comeback rubber-band.

**Reference game:** Air hockey. The puck (pressure line) slides back and forth. You don't take turns -- you react, you attack, you defend, all in real time. The physical metaphor is immediate: push the line, defend your side. A spectator understands in 2 seconds.

**Kill criteria survival:**
- Not turn-based: real-time, simultaneous, continuous.
- Flow state: the pressure line is always moving. You're always either pushing (chaining on your half) or defending (chaining to prevent overflow on your shrinking side). There is no idle moment.
- One tap: yes.
- Deterministic: same physics. Pressure line movement is deterministic from chain length.
- No UI reading: the pressure line IS the playfield. Its position tells you who's winning. It's a physical object on the board, not a HUD element.
- Shared space: yes. Dots from both players' sides intermingle near the center. Your explosion can catch dots that spawned from the opponent's edge (denial play).

**Skill axis:** The novice taps the biggest cluster they can see on their side. The intermediate reads the pressure line's position and adjusts aggression -- push when ahead, chain efficiently when behind. The expert recognizes that dots near the pressure line are doubly valuable: catching them pushes the line AND denies them from the opponent. The expert also reads the opponent's field through the shared center zone: "Their side is getting dense near the line. If I push the line 20px into their territory, those dense clusters become MY scoring opportunities on my expanded field." The pressure line creates a dynamic territory that the expert manipulates spatially.

---

### 6. STEAL

**How it works:** One shared field. Both players tap continuously. When your explosion catches dots, those dots orbit your "score well" -- a small pulsing circle in your corner of the screen that grows as you accumulate points. Your score well is a physical object on the field. If your opponent's explosion reaches YOUR score well, they STEAL a percentage of your accumulated points (the well shrinks, theirs grows). Score wells are always on screen, always vulnerable. The game ends on a timer or overflow. Highest score wins.

**Reference game:** Capture-the-flag meets basketball. You're simultaneously scoring (catching dots) and raiding (reaching the opponent's well). The wells are on the playfield, so the "flag" is always visible, always contestable. Like basketball: you score AND you play defense on the same court, in the same continuous flow.

**Kill criteria survival:**
- Not turn-based: simultaneous, continuous.
- Flow state: you're always torn between two activities -- harvesting dots (growing your well) and positioning taps near the opponent's well (threatening a steal). Both happen on the same field with the same tap.
- One tap: yes. The "steal" happens naturally when your explosion's cascade reaches the opponent's well. No special action.
- Deterministic: same physics. Steal radius is deterministic.
- No UI reading: the score wells ARE on the field. Their size IS the score. A bigger well = more points = more to lose.
- Shared space: yes, deeply. The wells create spatial focal points that both players must account for.

**Skill axis:** The novice ignores wells and just catches dots. The intermediate positions taps to grow their well while avoiding chains near their own well (defensive positioning). The expert reads the cascade geometry -- "if I tap HERE, the chain will cascade through 6 dots, and the gen-4 explosion will reach close to their well but not quite. But if I wait 0.5s for that gravity dot to pull two more into the chain path, gen-5 will reach their well and steal 15% of their score." The expert also uses their own dot-catching strategy to create a "buffer zone" of empty space around their well, denying the opponent cascade paths toward it. Territory control emerges from chain positioning.

---

### 7. PHASE SHIFT

**How it works:** One shared field. Both players tap continuously. The field oscillates between two "phases" on a fixed, visible cycle (every 8-10 seconds). In Phase A, blue-tinted dots are active (catchable, chainable) and orange-tinted dots are dormant (visible but ghosted, pass-through). In Phase B, the reverse. Player A scores from blue dots, Player B from orange dots. During your active phase, you're tapping aggressively to catch your dots. During your dormant phase, your dots are ghosts -- but they're still moving, still forming clusters, still being influenced by the opponent's explosions. You're reading the field, predicting where your dots will be when your phase returns.

**Reference game:** Ikaruga meets Lumines. Ikaruga's polarity switching (absorb white bullets / dodge black bullets, or vice versa) creates two simultaneous games on one screen. Lumines' timeline sweeps across the board, activating and clearing in a rhythm. Phase Shift creates alternating attack windows that keep both players perpetually active -- you're either tapping or reading, never idle.

**Kill criteria survival:**
- Not turn-based: both players are active simultaneously. During your "dormant" phase, you're actively reading the board to prepare. Your opponent's explosions push your dormant dots around, changing the formations you'll face when your phase activates. You're tracking those changes in real time.
- Flow state: the phase cycle creates a breathing rhythm (attack-read-attack-read) that maps directly to the "inhale-exhale" design pattern from continuous mode. You never stop -- you just shift between acting and preparing.
- One tap: yes.
- Deterministic: phase cycle is fixed and displayed (a color gradient across the screen edge shows phase timing). Dot physics identical.
- No UI reading: phase state is encoded in the dot colors themselves. Blue dots glow = Phase A. Orange dots glow = Phase B. The transition is a smooth color shift across all dots, not a UI element.
- Shared space: yes. Both players' dots coexist and interact physically. Your opponent's explosions during their active phase push your dormant dots -- this is the competitive interaction. A skilled player in Phase A detonates in a way that scatters the orange (opponent's) dots that are about to activate.

**Skill axis:** The novice taps their active dots and ignores dormant ones. The intermediate starts reading where their dormant dots will be when the phase shifts, pre-identifying clusters. The expert plays BOTH phases simultaneously: during their active phase, they position taps to score AND scatter the opponent's dormant dots, disrupting the formations the opponent is counting on. The expert reads the phase timer and the opponent's dormant dot positions: "Phase shifts in 2 seconds. My opponent has a beautiful 8-dot cluster forming at center-right. If I detonate this 3-dot chain near it now, the blast pushes three of their dormant dots out of range, and their cluster drops to 5. I sacrificed optimal scoring to disrupt their incoming phase." This is the dual-purpose action the previous brainstorm demanded: your tap scores for you AND disrupts the opponent, on the same board, in real time.

---

### 8. ECHO

**How it works:** Split screen, each player has their own field. Same spawn seed. Both play continuous mode simultaneously. Every tap you make is "echoed" onto your opponent's field after a 3-second delay -- a ghost explosion appears at the same coordinates on their board. The echo explosion is weaker (50% radius) and a different color (grey). Your opponent must read the incoming echo and decide: avoid it (don't build clusters where the echo will hit), exploit it (position dots so the echo catches them into a chain that benefits them), or ignore it (if the echo lands in empty space). Conversely, every one of YOUR taps, you're thinking about what echo you're sending.

**Reference game:** Tennis with heavy topspin. Your shot (tap) serves your immediate purpose (clear dots, score) AND sends a difficult return to the opponent (echo). The 3-second delay is the ball's flight time -- you see it coming, you prepare, you respond. The echo chain creates a rally rhythm: tap-echo-respond-echo-respond.

**Kill criteria survival:**
- Not turn-based: both players play their own field continuously in real time. Echoes arrive asynchronously.
- Flow state: you're managing your own continuous field AND watching for incoming echoes. The 3-second delay means echoes are always "incoming" -- there's always something arriving soon. The rhythm is continuous, not turn-based.
- One tap: yes. Echoes are automatic consequences of taps.
- Deterministic: echo position and timing are deterministic (3s delay, same coordinates, 50% radius). The effect on the opponent's board is deterministic given their dot positions at echo arrival time.
- No UI reading: incoming echoes are displayed as a growing grey circle on your field (ghost preview). You see where it will land 1-2 seconds before it detonates. It's on the playfield, not in a HUD.
- Shared space: separate boards, but the echo system creates deep interaction. Your tap decisions are entangled -- every tap you make is both a local decision (your field) and a remote attack (their field). This is the strongest case for split-screen: you interact mechanically through echoes while maintaining individual flow states.

**Skill axis:** The novice ignores echoes and plays solo. The intermediate starts dodging echoes (avoiding clusters where echoes will land). The expert starts WEAPONIZING echoes: they tap at coordinates that will disrupt the opponent's formations, even if that tap position is suboptimal for their own field. The master plays at the intersection: finding tap positions that are strong locally AND disruptive remotely. "This tap catches 4 dots on my field AND the echo will land right on their gravity-dot cluster in 3 seconds." The 3-second lookahead window for echo impact is within the game's prediction horizon (1-2s for dot physics + 3s echo delay = the expert models their opponent's field state 3 seconds out, which is the Rocket League prediction depth).

---

## Proposer's Rankings

### Tier 1: Boldest and Most Promising

**3. INFECTION** -- Territory encoded in dot colors. Zero HUD. The cascade-as-territory-sweep mechanic is genuinely novel. Every tap is simultaneously scoring, converting, and disrupting. The deepest dual-purpose action of any proposal. The field tells you who's winning at a glance (ratio of blue to orange). It transforms the existing dot-type visual language into competitive information. Risk: color-blindness accessibility requires careful palette choice.

**7. PHASE SHIFT** -- The breathing rhythm (attack-read-attack-read) maps perfectly to the game's existing inhale-exhale design pattern. The dual-purpose of "score in your phase AND disrupt their upcoming phase" is clean and deep. The phase cycle is predictable and visible, creating deterministic timing windows that reward lookahead. Risk: the "dormant dots are ghosts" concept might be visually confusing on first play.

### Tier 2: Strong and Clean

**1. THE COURT** -- The simplest design. Shared field, simultaneous play, color-coded explosions, whoever catches more wins. The simplicity is the feature -- it adds the minimum possible competitive layer to the existing game. Risk: may reduce to a speed contest ("who taps faster") rather than a depth contest ("who taps smarter"). Needs the tap cooldown from continuous mode to prevent spam.

**5. TUG-OF-FIELD** -- The pressure line creates a physical, spatial competitive dynamic that requires zero explanation. Air hockey is universally understood. The comeback rubber-band (fewer spawns when losing) is structurally elegant. Risk: landscape orientation is a departure from the game's portrait identity. Could work in portrait with a horizontal pressure line instead.

**8. ECHO** -- The only split-screen proposal that creates deep, continuous interaction without breaking individual flow states. The 3-second delay is the key innovation: it converts split-screen from "parallel solo" into "asynchronous tennis." Risk: split-screen halves the play area. The echo preview (ghost circle) might create visual noise.

### Tier 3: Solid but Narrower

**2. KING OF THE HILL** -- Clean focal point mechanic. The hot zone creates a shared objective that both players can see and predict. But the "contest the zone vs harvest the field" decision might be too binary. Once a player realizes the expected-value math, the strategy becomes formulaic: harvest outside when the zone is contested, grab the zone when the opponent is on cooldown.

**6. STEAL** -- The score wells as physical objects on the field is a fun idea, and the offense/defense split is natural. But the wells add objects to the playfield that aren't dots, which breaks the game's visual grammar. Dots are the vocabulary; wells are a new word from a different language.

**4. DENSITY RACE** -- The safest proposal. Pure parallel play preserves flow perfectly. But the ghost overlay is the only competitive interaction, and it's purely psychological. A player who ignores the ghost plays identically to solo mode. The design adds no new skill axis. It's competitive Chain Reaction in the same way that two people running on adjacent treadmills is a "race."

---

## Cross-Cutting Observations

### The Speed-vs-Depth Problem

The single biggest risk for any real-time shared-board design is degenerating into a tapping speed contest. If the optimal strategy is "tap as fast as your cooldown allows, wherever the biggest cluster is," then prediction depth doesn't matter and the game rewards fast fingers, not fast thinking.

The solution exists in the game already: **tap cooldown**. In continuous mode, the cooldown (1500-2500ms depending on tier) forces the player to choose their moment. In competitive mode, the cooldown creates decision windows: you have 1.5 seconds between taps, and in that time you must read the entire field, predict dot movement, assess the opponent's likely action, and choose the tap that maximizes your position. The cooldown converts the game from a speed test into a prediction test, which is the entire design intent.

The cooldown also solves the "contested dot" problem in shared-board designs. With 1.5s cooldowns, two players will rarely tap simultaneously. The typical pattern is: Player A taps, 0.7s later Player B taps, 0.8s later Player A taps again. This interleaving happens naturally without turn structure, creating a rhythmic rally without ever asking a player to wait.

### Flow State and the 2-Second Loop

The kill criteria demand that the player is always in a sub-2-second read-predict-act loop. In solo continuous mode, this loop is: SCAN field (200ms) -> IDENTIFY convergence (300ms) -> PREDICT peak density moment (500ms) -> TAP (instant) -> WATCH cascade (500ms) -> repeat. Total: ~1.5 seconds.

In competitive mode, the loop becomes: SCAN field (200ms) -> IDENTIFY convergence (200ms) -> READ opponent state (200ms, where did they just tap? are they on cooldown?) -> PREDICT (300ms) -> TAP (instant) -> WATCH + SCAN (500ms) -> repeat. Total: ~1.5 seconds. The competitive layer FITS inside the existing loop by replacing "predict dot physics" with "predict dot physics + opponent intent." It does not ADD a new loop; it enriches the existing one.

### Score Encoding on the Playfield

The kill criterion "no UI reading" requires that competitive state be visible WITHOUT reading numbers or meters. Each proposal handles this differently:

- **INFECTION**: Dot colors ARE the score. Brilliant. No encoding needed.
- **TUG-OF-FIELD**: Pressure line IS the score. Physical, spatial, immediate.
- **THE COURT**: Background tint. Subtle but may be too subtle. Might need a secondary channel (audio?).
- **PHASE SHIFT**: Neither player "scores" in a traditional sense -- the game is about maximizing your phase and disrupting theirs. Win condition needs careful thought.
- **ECHO**: Split screen, score per player. Traditional, but scoreboard-free encoding is harder with split screens.

The strongest score encodings are INFECTION (color ratio) and TUG-OF-FIELD (physical line). Both are on the playfield, both are glanceable, both require zero learning.

---

## What I'd Build First

If forced to prototype one concept this week: **INFECTION**. It requires the least new code (dot colors already exist via type system, explosions already catch dots, cascade already propagates), creates the deepest skill axis (conversion cascades are genuinely novel), has the best score encoding (the field IS the score), and preserves flow state perfectly (same continuous mode loop, just with colored dots and an opponent).

Second choice: **PHASE SHIFT**. More novel, potentially deeper, but harder to prototype and riskier on first impression.

Third choice: **THE COURT** as a minimal viable competitive mode that validates whether real-time shared-board play works at all, before investing in more complex variants.
