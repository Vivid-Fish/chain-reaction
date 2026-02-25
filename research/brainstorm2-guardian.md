# Constraint Guardian: Competitive Mode Evaluation Framework

## Date: 2026-02-23
## Role: Constraint Guardian for Brainstorm Round 2
## Purpose: Detect failure patterns before they waste design time. Evaluate proposals against the north star with zero mercy.

---

## The North Star (Restated for Enforcement)

The competitive mode must feel like **racquetball/Rocket League/Tetris Effect**: constant fast physics reads, immediate action, under 2 seconds from observation to action, flow state with no waiting or pausing, skill axis is prediction depth, deterministic physics.

The player never stops playing. The opponent's presence adds pressure and interaction, not interruption.

---

## KILL CRITERIA (Binary, Non-Negotiable)

Any proposal that triggers these is dead on arrival. No discussion, no rework.

| # | Kill Criterion | Test |
|---|---------------|------|
| K1 | **Turn-based** | Does a player ever have to wait for the other player's action to complete before they can act? If yes: DEAD. |
| K2 | **Breaks flow state** | Is there any moment during normal play where the optimal action is to wait, pause, or watch something happen without acting? If yes: DEAD. |
| K3 | **Adds inputs beyond one tap** | Does the proposal require any input other than choosing WHERE and WHEN to tap? Buttons, swipes, holds, double-taps, menus, activation triggers? If yes: DEAD. |
| K4 | **Adds unpredictability/noise** | Does the proposal introduce any source of randomness or hidden information that was not already in the physics simulation? Spawn locations are seeded PRNG and acceptable. New dice rolls, hidden opponent state, fog of war, random power-ups? If yes: DEAD. |
| K5 | **Requires reading UI elements** | Must the player divert attention from the dot field to read numbers, meters, timers, resource bars, or text during active play to make good decisions? If yes: DEAD. |
| K6 | **Separate boards** | Does each player have their own field? If yes: SUSPICIOUS. Must demonstrate that interaction density is high enough without shared space, and that the split does not degrade mobile readability on a 390x844 viewport (each half = 195x422). Default assumption: separate boards fail. |

### Applying the Kill Criteria to the Prior Brainstorm

The previous 5-round brainstorm converged on "Explosion Billiards" -- turn-based alternation on a shared board with a tug-of-war meter, counter-chains, and blast force. Under the current kill criteria:

- **K1 (Turn-based):** DEAD. Strict A-B-A-B alternation with a shot clock. One player waits while the other acts.
- **K2 (Breaks flow state):** DEAD. The design explicitly says "most turns take 2-4 seconds" and the defender must watch the push wave travel along the meter before deciding to counter. That is waiting.
- **K5 (Requires reading UI):** DEAD. The tug-of-war meter is a UI element that demands attention. Counter-chain decisions require reading the push wave magnitude and comparing it to available chain options. The danger window is explicitly a UI signal.

That design had genuine strategic depth. It died because it optimized for chess-like reading depth at the expense of flow. This brainstorm optimizes for flow. Different goal, different constraints. The billiards concept (blast force repositioning dots) may survive in a new form, but the turn structure, meter, and counter-window cannot.

---

## ANTI-PATTERNS

These are the traps that competitive mode proposals commonly fall into. Each one describes a failure mode, an example game that fell into it, an explanation of why it violates the north star, and a specific test to detect it.

---

### Anti-Pattern 1: The Spectator Trap

**The trap:** Your action triggers a sequence that you must watch resolve before you can act again. The chain cascade plays out, garbage lands, a meter fills -- and while this spectacle unfolds, you are a spectator, not a player.

**Games that fell in:** Puyo Puyo (watching a 19-chain resolve for 10+ seconds), Bejeweled Blitz (cascading matches freeze input), Hearthstone (watching opponent's turn play out). Even Tetris has brief moments of this when garbage lines rise.

**Why it violates the north star:** Flow state requires continuous agency. The moment the player's hands stop moving and their eyes shift from "scanning for opportunity" to "watching a predetermined animation," flow is broken. Racquetball does not pause while the ball bounces. Rocket League does not pause while the ball rolls. The game continues and you are already positioning for the next play.

**Detection test:** Measure the longest period during normal play where the player has zero meaningful input options. If this exceeds 1.5 seconds at any point during a match, the proposal fails. Chain cascades in Chain Reaction take 1-3 seconds. If the player cannot tap during or immediately after cascade resolution, the design has a Spectator Trap.

**Specific application to Chain Reaction:** The cascade itself is 1-3 seconds of animation. A competitive design must allow the opponent (or both players) to act during cascade resolution, not after it. If the cascade must fully resolve before anyone can tap, every chain of 5+ creates a spectator window. This is the hardest constraint to satisfy because the existing cascade mechanic IS a spectacle sequence.

---

### Anti-Pattern 2: The Reaction Speed Ceiling

**The trap:** The competitive advantage is not prediction depth but raw reaction speed. The player who taps faster wins because opportunities are fleeting and execution speed matters more than reading the board.

**Games that fell in:** Fruit Ninja (speed test), Whac-A-Mole (speed test), Guitar Hero on Expert (mechanical precision test). Even Rocket League at the highest levels has some of this (fast aerial speed matters).

**Why it violates the north star:** The skill axis must be prediction depth, not finger speed. "I saw the convergence point forming 1.5 seconds before my opponent" is prediction. "I tapped the cluster 50ms before my opponent" is reaction speed. Prediction depth creates the Rocket League experience -- bronze sees where the ball IS, Grand Champion sees where it WILL BE. Reaction speed creates the Fruit Ninja experience -- the person who taps faster wins regardless of foresight.

**Detection test:** Simulate two players: one with perfect prediction (always identifies the optimal tap point) but 300ms slower average reaction time, and one with greedy prediction (taps the biggest visible cluster) but 0ms reaction delay. If the greedy-fast player wins more than 40% of the time, the design rewards speed too much.

**Specific application to Chain Reaction:** Shared-board simultaneous play is extremely vulnerable to this. If both players can tap the same cluster, the faster tapper gets the dots. This converts the game from "I saw the convergence point" to "I tapped the convergence point faster." The design must either (a) make both players' taps meaningful even when targeting the same area, (b) create enough simultaneous opportunities that both players always have good options, or (c) structure the interaction so that tapping the obvious cluster is not optimal -- the clever player taps elsewhere to set up something better.

---

### Anti-Pattern 3: The Parallel Solitaire

**The trap:** Both players are technically playing the same game, but their actions do not meaningfully affect each other. They are playing parallel solo games with a comparison function at the end.

**Games that fell in:** Many racing games with separate tracks (Mario Kart without items is essentially parallel driving), Wii Sports bowling (alternate frames, compare scores), most "competitive" mobile puzzle games (match-3 vs. match-3 with shared timers). Boomshine has no competitive mode precisely because the game is pure solitaire -- there is no interaction surface.

**Why it violates the north star:** Competitive games require that "my action affects my opponent's situation." Without interaction, there is no opponent to read, no bluffing, no tactical pressure, no moment where you see something your opponent missed. The north star question "what did you SEE that your opponent missed?" has no meaning if the opponent's play has no bearing on your options.

**Detection test: Interaction Density.** In any 10-second window, how many times does Player A's action change what Player B should do? If this is zero, the design is parallel solitaire. If it is 1-2 times per 10 seconds, interaction is too sparse. Target: at least one meaningful interaction per 3-5 seconds of play.

**Specific application to Chain Reaction:** Split-board designs are highly vulnerable. If my explosions on my board do not affect your board (or only affect it via delayed garbage), we are playing solitaire with mail. Shared-board designs have natural interaction (we compete for the same dots), but simultaneous shared-board play introduces the Reaction Speed Ceiling. The tension between avoiding Parallel Solitaire and avoiding Reaction Speed Ceiling is the central design challenge.

---

### Anti-Pattern 4: The Complexity Cliff

**The trap:** The competitive layer adds so many new concepts (counters, resources, zones, meters, garbage types, special conditions) that the learning curve has a cliff. The player must understand the competitive system before they can play, rather than discovering it through play.

**Games that fell in:** Puyo Puyo Tetris 2 Skill Battle (RPG stats overlaid on puzzle gameplay -- massive cognitive load), Boomshine Plus (6 dot types, 105 levels, hard mode added to a luck-dominant core -- complexity without depth), many fighting games with 30+ character-specific mechanics.

**Why it violates the north star:** The north star demands under 2 seconds from observation to action. If the player must mentally process competitive-specific rules (is this a counter window? what does the meter at 0.73 mean? is this garbage or a normal dot?), observation time expands beyond 2 seconds. Tetris Effect achieves competitive depth with ZERO new concepts beyond "your line clears send garbage." Rocket League achieves competitive depth with ZERO concepts beyond "the same ball, the same car, the other team."

**Detection test:** Can you explain the competitive interaction in one sentence that does not use the word "and"? Examples:
- Tetris: "Your line clears send garbage rows to your opponent." (One concept.)
- Rocket League: "Score goals in the opponent's net." (One concept.)
- If the explanation requires "and" or more than one sentence, the design may be too complex for flow-state competitive play.

**Specific application to Chain Reaction:** The prior brainstorm's design required explaining: tug-of-war meter AND counter-chains AND danger windows AND counter-efficiency AND momentum multipliers AND escalating stakes AND blast force. Seven concepts. A flow-state competitive design should require one, maybe two.

---

### Anti-Pattern 5: The Degenerate Strategy Lock

**The trap:** An optimal strategy exists that is boring, repetitive, and un-counterplayable. The game solves to a single dominant approach that all skilled players converge on, eliminating variety and discovery.

**Games that fell in:** Early competitive Tetris (DAS tapping for speed dominated all other strategies until modern rotation systems), Tic-Tac-Toe (solved), Rock-Paper-Scissors without mixed strategies. In fighting games, "turtling" (blocking and punishing) when there is no chip damage.

**Why it violates the north star:** Flow state requires constant decision-making. If the optimal play is always the same action (tap the biggest cluster, always counter, always turtle), the player enters autopilot, not flow. Prediction depth becomes irrelevant because deeper prediction leads to the same action as shallow prediction.

**Detection test:** Run 1000 bot matches with the Oracle bot. Measure the standard deviation of tap positions across matches. If the Oracle converges to a narrow strategy (always tapping the same type of position, always using the same timing pattern), the game has a degenerate lock. High variance in optimal play = healthy. Low variance = degenerate.

**Specific application to Chain Reaction:** In solo mode, the greedy strategy (tap the biggest cluster) is already close to optimal -- SCR is only 3.5x, meaning the Oracle is only 3.5x better than random. If competitive mode does not create situations where the greedy play is wrong, the game will degenerate to "both players tap the biggest cluster as fast as possible," which is Anti-Pattern 2 (Reaction Speed Ceiling) wearing a different mask.

---

### Anti-Pattern 6: The UI Gaze Tax

**The trap:** Competitive state is represented in UI elements (health bars, meters, resource counts, timers) that the player must look at to make good decisions. Every glance at the UI is a glance away from the playfield. The competitive layer taxes the player's attention.

**Games that fell in:** Many MOBAs (minimap + ability cooldowns + health bars + item shop), complex fighting game UIs (meter management), any game where "I died because I was checking my resources" is a common experience.

**Why it violates the north star:** Rocket League does not have health bars. Racquetball does not have meters. The score exists but you do not look at it during a rally. The north star demands that all decision-relevant information is ON the playfield, readable in the same glance that shows you where the dots are. The moment the player must shift focus from "where are the dots?" to "what does the meter say?", the observation-to-action loop exceeds 2 seconds.

**Detection test:** Can you play the competitive mode optimally while never looking outside the dot field? If the answer is no -- if optimal play requires checking a meter, counter, timer, or resource indicator -- the design has a UI Gaze Tax. The tug-of-war meter from the prior brainstorm explicitly fails this test.

**Specific application to Chain Reaction:** The competitive state must be encoded IN the physics, not alongside it. Examples of physics-encoded state: the density of dots in your region, the color distribution near you, the velocity patterns of nearby schools. Examples of UI-encoded state: a meter, a number, a bar, a timer, a resource count. The former supports flow; the latter breaks it.

---

### Anti-Pattern 7: The Simultaneity Paradox

**The trap:** Two players acting on the same shared board simultaneously creates race conditions where the outcome depends on who tapped first by milliseconds, not who read the board better. This is a specific and pernicious form of the Reaction Speed Ceiling.

**Games that fell in:** Real-time shared-board games are extremely rare precisely because this is so hard to solve. Agar.io handles it via continuous movement (no discrete actions). Splatoon handles it via territory control (your action is persistent, not instantaneous). Most shared-board games are turn-based (Chess, Go, Othello) specifically to avoid this.

**Why it violates the north star:** If both players are trying to tap the same convergence point, the game becomes "who taps first" rather than "who saw it first." Worse: if one player's tap removes the dots that the other player was about to tap, the second player's prediction was correct but worthless. Correct prediction leading to zero reward because of timing destroys the skill axis.

**Detection test:** In a shared-board design, measure how often both players attempt to tap within the same explosion radius within 500ms of each other. If this exceeds 20% of taps, the game has a simultaneity problem -- players are racing to the same spots. The fix is not arbitration rules (who tapped first wins) but structural (make it so both players wanting the same spot is rare because the game creates enough distributed opportunities).

**Specific application to Chain Reaction:** The F3 metric (opportunity density) must be HIGH in competitive mode -- not 30-60% but closer to 60-80%. Both players need good options at all times so they are not racing to the single best cluster. With sufficient opportunity density, the question shifts from "can I get to the best cluster first?" to "which of several good clusters should I choose, given what my opponent is likely to choose?"

---

### Anti-Pattern 8: The Bolt-On

**The trap:** The competitive mechanic is a separate system bolted onto the solo game rather than emerging from the existing physics. It requires new rules, new visual elements, new concepts that have no analog in solo play. The competitive mode feels like a different game.

**Games that fell in:** Many single-player games with tacked-on multiplayer (Assassin's Creed multiplayer, Dead Space 3 co-op). Boomshine Plus added content (levels, dot types) rather than competitive structure. Tetris Effect: Connected's "Connected" co-op mode was somewhat bolt-on (the zone-merge mechanic is unlike anything in solo Tetris).

**Why it violates the north star:** The design principles state that "the core engine is a platform" and that "twenty minutes of zen practice directly improves PvP." If competitive mode introduces mechanics that do not exist in solo mode, the practice pipeline breaks. The player learns one game in solo and a different game in competitive. Rocket League does not have a competitive mode -- it IS the competitive mode. The solo practice (training packs, free play) uses identical physics.

**Detection test:** List every rule in the competitive mode. For each rule, ask: "Does this rule also exist in solo play?" If more than one rule is competitive-only, the design is drifting toward bolt-on territory. Ideally, the ONLY competitive-only element is "there is another player on the field."

**Specific application to Chain Reaction:** The existing game has: dots, explosions, cascades, types, boid flocking, cascade momentum. A competitive mode should use ALL of these and add at most one interaction primitive (how my explosions affect my opponent). Meters, counters, danger windows, momentum multipliers for competitive -- these are all bolt-on systems. The purest competitive design would be: same board, same physics, another player tapping.

---

## POSITIVE PATTERNS

What makes competitive modes in reference games actually work? What is the minimum viable competitive interaction?

---

### Positive Pattern 1: Continuous Contested Space (Rocket League, Racquetball)

**What it is:** Both players occupy the same physical space and interact through the physics of that space -- not through abstract systems (garbage, meters). The ball is the contested resource. Positioning relative to the ball and relative to the opponent is the entire game.

**Why it works for flow:** There is never a moment where you are not engaged. Even when the ball is on the other side of the court, you are positioning. Your body (or car) is your action, and it is always available. No cooldowns. No waiting.

**Minimum viable version for Chain Reaction:** Both players share the same dot field. Both can tap at any time. Dots are the contested resource. The interaction is through the dots themselves, not through abstract pressure systems. This is the simplest possible competitive structure and the highest-fidelity match to the north star.

**The challenge:** Simultaneously tapping the same board creates the Simultaneity Paradox (Anti-Pattern 7). The solution must come from opportunity density and strategic differentiation, not from turn-taking.

---

### Positive Pattern 2: Dual-Use Actions (Tetris, Puyo Puyo)

**What it is:** Every action the player takes simultaneously advances their own position AND imposes disadvantage on the opponent. In Tetris, clearing lines sends garbage AND frees your own board. In Puyo Puyo, chaining clears your field AND sends nuisance to the opponent.

**Why it works for flow:** The player never faces a choice between "play for myself" and "play against my opponent." They are the same action. This eliminates the decision overhead that breaks flow. You do not stop to think "should I attack or defend?" -- you just play, and both happen naturally.

**Minimum viable version for Chain Reaction:** My chain clears dots (good for me) and does something to the opponent's situation (bad for them). The "something" must be intrinsic to the chain physics, not a bolt-on system. The most natural candidate: my explosion's blast force pushes surviving dots, affecting the dot distribution that the opponent is reading. In a shared board, every explosion I create reshapes the field that both of us are playing on.

---

### Positive Pattern 3: Spatial Denial (Splatoon, Bomberman, Windjammers)

**What it is:** Your actions claim or deny physical space on a shared field. In Splatoon, ink covers ground. In Bomberman, bombs create blast zones that deny movement. In Windjammers, throwing the disc occupies a trajectory that the opponent must respect.

**Why it works for flow:** Spatial denial is inherently readable -- you can SEE the denied space. No UI required. The field itself IS the competitive state. And spatial denial creates moment-to-moment micro-decisions: "Do I play in this open area or contest the denied zone?"

**Minimum viable version for Chain Reaction:** Explosions create temporary zones where dots have been cleared. These "dead zones" have lower dot density for several seconds until new dots drift or spawn in. If my chain clears the left side, the opponent has fewer opportunities on the left. This happens naturally from the existing clearing mechanic -- no new system needed. The question is whether the effect is strong enough to create meaningful spatial asymmetry.

---

### Positive Pattern 4: Asymmetric Value Perception (Poker, Fighting Games)

**What it is:** Both players see the same board state but evaluate it differently because of their position, resources, or intent. In poker, both players see the community cards but value them differently based on hole cards. In fighting games, both players see the same distance but value it differently based on their character's range.

**Why it works for flow:** It creates the "what did you SEE that your opponent missed?" moment without adding hidden information. The information is public, but the interpretation is private. This is pure prediction-depth competition.

**Minimum viable version for Chain Reaction:** On a shared board, both players see the same dots. But they value clusters differently because their scoring might depend on different regions, different types, or different patterns. Even without explicit asymmetry, if both players have different positions or different recently-cleared zones, they will naturally evaluate the board differently.

---

### Positive Pattern 5: Escalating Pressure (Tetris, Bomberman)

**What it is:** The game gets harder over time, forcing more frequent and more consequential decisions. In Tetris, pieces fall faster. In Bomberman, the arena shrinks. The escalation creates natural climactic moments without scripting them.

**Why it works for flow:** Escalation prevents stalemate and creates urgency without breaking flow. The player does not feel rushed by a timer -- they feel the game itself intensifying. The action-to-action loop gets tighter, which deepens flow rather than breaking it.

**Minimum viable version for Chain Reaction:** The game already has this -- density pressure. In continuous mode, spawn rate increases, creating more dots, more clusters, more opportunities, and more urgency. In competitive mode, this natural escalation can serve the same function without needing an artificial timer or meter.

---

## SCORING RUBRIC

Each proposal will be scored 1-10 on six dimensions. A proposal must score 6+ on every dimension to be considered viable. A score below 4 on any single dimension is disqualifying.

---

### Dimension 1: Flow Continuity (Does the player ever stop acting?)

| Score | Description |
|-------|-------------|
| 10 | The player is ALWAYS able to act. No cooldowns, no waiting, no animation locks. Like moving your car in Rocket League -- you are always driving. |
| 8-9 | Very brief periods (<0.5s) where action is unavailable (e.g., during tap explosion animation), but the player is already scanning for the next tap. |
| 6-7 | Occasional pauses (0.5-1.5s) where the player watches something resolve but can immediately act after. |
| 4-5 | Regular pauses (1.5-3s) where the player must wait for game state to resolve. Turn-based-adjacent. |
| 2-3 | Frequent significant waits (3-5s). Watching cascades, waiting for opponent, processing UI changes. |
| 1 | Full turn-based. Player waits for opponent's turn to complete. |

**Measurement method:** In a simulated or playtested match, record the timestamp of every player input. Calculate the distribution of inter-input gaps. The 95th percentile gap should be under 3 seconds for a score of 7+. Median gap should be under 1.5 seconds for a score of 8+.

---

### Dimension 2: Interaction Density (How often does my action affect my opponent?)

| Score | Description |
|-------|-------------|
| 10 | Every single action directly and immediately affects the opponent's situation. Every tap changes what the opponent should do. Like every Rocket League touch changes the trajectory both players must react to. |
| 8-9 | Most actions (>70%) have a visible effect on the opponent's options within 2 seconds. |
| 6-7 | Many actions (~50%) have some effect on the opponent. Others are primarily self-serving with indirect opponent impact. |
| 4-5 | Occasional interactions (~30%). Mostly playing your own game with periodic bursts of interaction. |
| 2-3 | Rare interactions (<15%). Parallel solitaire with a thin competitive layer. |
| 1 | Zero interaction. Pure parallel solitaire with score comparison. |

**Measurement method:** For each player tap, ask: "Did this tap change the optimal play for the other player?" Count the percentage. Score is derived from the percentage. On a shared board with blast force, every tap that clears dots or pushes survivors inherently changes the board both players see -- the question is whether the change is SIGNIFICANT enough to alter the opponent's plan.

---

### Dimension 3: Skill Differentiation (Does prediction depth matter?)

| Score | Description |
|-------|-------------|
| 10 | A player who predicts 3 seconds ahead consistently beats a player who only reacts to the current state. The skill gap between prediction depths is large and reliable. SCR equivalent of 5x+ in competitive context. |
| 8-9 | Prediction depth is the primary differentiator. A 2-second lookahead consistently beats a 0.5-second lookahead. SCR equivalent of 3-5x. |
| 6-7 | Prediction matters but other factors (reaction speed, spatial coverage, memorization) also contribute significantly. SCR equivalent of 2-3x. |
| 4-5 | Prediction helps but the game is largely reactive. Fast tapping and pattern recognition dominate. |
| 2-3 | Prediction depth provides minimal advantage. The game is primarily about execution speed or luck. |
| 1 | Luck-dominant. Prediction is irrelevant. Boomshine-level. |

**Measurement method:** Simulate matches between Oracle (2-ply lookahead) and Greedy (tap biggest current cluster) bots in the competitive mode. If Oracle win rate exceeds 75%, prediction depth matters significantly (score 8+). If Oracle win rate is 55-65%, prediction matters but is not dominant (score 5-7). If Oracle win rate is below 55%, the competitive structure is not rewarding prediction.

---

### Dimension 4: Input Simplicity (Still just one tap?)

| Score | Description |
|-------|-------------|
| 10 | Identical to solo mode. The player taps where and when they choose. Zero additional inputs, zero UI elements to interact with, zero mode-specific gestures. |
| 9 | One tap, but the competitive context makes certain tap properties newly meaningful (e.g., tapping near the edge vs. center now matters for spatial control). No new inputs, but existing input has richer consequences. |
| 7-8 | One tap with a minor competitive-only timing constraint (e.g., brief cooldown after each tap that does not exist in solo mode). |
| 5-6 | One tap plus one passive system the player must monitor (e.g., a boundary, a zone, a resource that affects tap behavior). |
| 3-4 | One tap plus one active system (a button, a toggle, a mode switch). |
| 1-2 | Multiple input types required. Fundamentally different from solo. |

**Measurement method:** Count the number of distinct input verbs in the competitive mode. One verb (tap) = 10. Each additional verb subtracts 2-3 points. Each required UI element to monitor (that does not exist in solo) subtracts 1-2 points.

---

### Dimension 5: Readability (Can you see everything on the playfield?)

| Score | Description |
|-------|-------------|
| 10 | All competitive state is encoded in the dot field itself. A spectator who understands solo Chain Reaction immediately understands what is happening competitively. No new visual elements beyond player-colored explosions. |
| 8-9 | One additional visual element (e.g., player-colored explosion trails) that integrates into the field without creating visual noise. |
| 6-7 | Two additional visual elements. The board is busier but still parseable at a glance. A new player can identify who is winning within 3 seconds. |
| 4-5 | Three or more additional visual elements. The board is cluttered. A spectator needs 5+ seconds to understand the state. |
| 2-3 | Significant visual overhead. Garbage dots, zone boundaries, resource indicators. The competitive layer obscures the base game. |
| 1 | Unreadable. Cannot distinguish competitive state from visual noise. |

**Measurement method:** Screenshot test. Take 5 random screenshots from a competitive match. Show them to someone who has played solo Chain Reaction but never competitive. Ask: "What is happening? Who is winning?" If they can answer both correctly within 3 seconds for 4/5 screenshots, score 8+. If they need more than 5 seconds or cannot determine who is winning, score 5 or below.

---

### Dimension 6: Emergent Depth (Few rules, many situations?)

| Score | Description |
|-------|-------------|
| 10 | One new rule creates hundreds of distinct competitive situations. The rule interacts with existing mechanics (dot types, boid flocking, cascade momentum) to produce emergent complexity that neither the designer nor the player can fully enumerate. Go-like elegance ratio. |
| 8-9 | One or two new rules create dozens of recognizable competitive patterns. Players discover new strategies after 50+ matches. The metagame evolves. |
| 6-7 | A small set of rules creates a moderate variety of situations. Players learn the main strategies within 20-30 matches but continue to refine. |
| 4-5 | The competitive mode creates a handful of recognizable situations. Play becomes formulaic after 10-15 matches. |
| 2-3 | The competitive mode has one dominant strategy and few meaningful variations. |
| 1 | Solved or trivially simple. No strategic variety. |

**Measurement method:** After simulation, measure the entropy of optimal tap positions across 1000 matches. High positional entropy = many distinct situations requiring different plays. Low entropy = same positions are always optimal. Also measure: do different dot-type distributions produce qualitatively different competitive dynamics? If gravity-heavy boards play differently from volatile-heavy boards, the emergent depth is high.

---

## COMPOSITE SCORING

| Tier | Requirement | Interpretation |
|------|-------------|---------------|
| **S-tier** (Prototype immediately) | All dimensions 8+ | This IS the design. Build it. |
| **A-tier** (Strong candidate) | All dimensions 6+, average 7.5+ | Worth prototyping if no S-tier exists. |
| **B-tier** (Has merit, needs work) | No dimension below 4, average 6+ | Interesting idea with fixable weaknesses. May be reworkable. |
| **C-tier** (Fundamentally flawed) | Any dimension below 4 | The flaw is structural. Rework is unlikely to save it. |
| **DEAD** | Fails any Kill Criterion | Do not discuss. Move on. |

---

## THE CENTRAL TENSION

Every proposal for competitive Chain Reaction must navigate the same fundamental tension:

**Interaction requires shared space. Shared space with simultaneous play creates the Reaction Speed Ceiling. Removing simultaneity creates turns. Turns break flow.**

The positive patterns from reference games suggest the resolution:

- **Rocket League** solves it with continuous movement in a shared space where positioning IS the action, not discrete taps.
- **Bomberman** solves it with delayed-effect actions (bombs have fuses) so both players act simultaneously but outcomes resolve with a delay that rewards prediction.
- **Splatoon** solves it with spatial persistence (ink stays on the ground) so actions have lasting effects that create asymmetric board states without requiring direct simultaneous competition for the same resource.

Chain Reaction's tap-and-explode mechanic is discrete, not continuous. Each tap creates an instantaneous event. This makes it harder to avoid the Simultaneity Paradox than in a game with continuous positioning.

The most promising resolution direction: **make each player's taps have persistent, physics-based effects on the shared field that outlast the explosion itself** -- so the competitive interaction is not "we race to tap the same cluster" but "my explosions shape the field that you must now read differently." Blast force (from the prior brainstorm) is exactly this kind of persistent effect. The question is whether blast force plus continuous simultaneous play can avoid the Reaction Speed Ceiling while maintaining Interaction Density.

---

## PRE-EVALUATION CHECKLIST

Before scoring any proposal, verify:

1. Does the proposal pass all six Kill Criteria? If not, it is DEAD. Stop.
2. Does the proposal address the Central Tension? If it does not even acknowledge the Simultaneity Paradox, it has not thought hard enough.
3. Can you explain the competitive interaction in one sentence without "and"? If not, it may be too complex.
4. Does the proposal build on existing mechanics (dots, explosions, cascades, types, boid flocking)? If it requires new game objects or new physics rules, it is likely a bolt-on.
5. Would a player who has only played solo Chain Reaction understand the competitive mode within 30 seconds of their first match? If not, the complexity cliff is too steep.

---

## REFERENCE GAMES: WHAT ACTUALLY WORKS

### Rocket League
- **Interaction mechanism:** Shared ball, shared field, continuous positioning.
- **Why it flows:** You are always driving. Even "waiting" is active positioning.
- **Key lesson:** The interaction is THROUGH the physics object (ball), not through abstract systems.
- **Competitive minimum:** Two players, one ball, two goals. Everything else (boost, aerials, demos) is emergent.

### Racquetball / Squash
- **Interaction mechanism:** Shared court, shared ball, alternating hits (but continuous movement).
- **Why it flows:** Between hits, you are positioning. The ball is always in motion. Reading angles is the skill.
- **Key lesson:** "Turn-based" at the action level (you hit, then I hit) but continuous at the movement/positioning level. The key is that movement never stops, even though hitting alternates.
- **Competitive minimum:** Two players, one ball, one court, walls. That is it.

### Tetris vs (Tetris 99, Tetris Effect Zone Battle)
- **Interaction mechanism:** Separate boards, garbage lines sent via line clears.
- **Why it flows:** You never stop placing pieces. Garbage arrives but does not interrupt your placement. The competitive layer is asynchronous -- you do not wait for the opponent's garbage to arrive before you act.
- **Key lesson:** The competitive interaction can be ASYNCHRONOUS with flow. Your clears send garbage that arrives at a slightly later time. You see incoming garbage in your peripheral vision but you do not stop playing to deal with it. Garbage integrates into your existing decision-making -- it changes WHAT you should place, not WHETHER you can act.
- **Competitive minimum:** Two boards, line clears send garbage, garbage rises from the bottom.

### Bomberman
- **Interaction mechanism:** Shared grid, bombs with timed fuses, blast patterns.
- **Why it flows:** Placing bombs is instant. The fuse creates a prediction window. Both players act simultaneously but the outcomes are delayed, creating a "placing bets on the future" dynamic.
- **Key lesson:** Delayed-effect actions in shared space solve the Simultaneity Paradox. You do not race to tap the same spot. You place your bomb and predict where the opponent will be when it detonates. This IS prediction depth.
- **Competitive minimum:** Shared grid, bombs, blast zones, destructible barriers.

### Windjammers
- **Interaction mechanism:** Shared court, disc thrown back and forth.
- **Why it flows:** Rally-based but continuous movement. You are always positioning to receive or to disguise your throw direction.
- **Key lesson:** Alternating discrete actions (throws) combined with continuous positioning creates flow even though the discrete actions have clear "my turn / your turn" structure. The key: you are always doing something between actions. Positioning IS play.
- **Competitive minimum:** Two players, one disc, two goal zones, a net.

---

*Guardian framework complete. Ready to evaluate proposals in Round 2.*
