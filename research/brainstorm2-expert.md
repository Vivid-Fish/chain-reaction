# Reference Expert Analysis: PvP Interaction Through Simple Inputs and Physics Prediction

## Purpose

This document analyzes six real-time competitive games to extract interaction patterns applicable to Chain Reaction's competitive mode. The focus is narrow: how does each game create meaningful player-vs-player interaction using simple inputs, shared physics, and continuous action? What can Chain Reaction steal?

---

## 1. Rocket League

### The Interaction Mechanism

Two or three players per team share a single arena with one ball. Every player has the same car, the same boost, the same tools. Interaction is created through **spatial contestation of a shared object**. The ball is the nexus -- every meaningful action either moves the ball toward the opponent's goal, prevents the ball from reaching your goal, or positions your car to do one of those things in the future.

The critical insight is that most of Rocket League's interaction is *indirect*. Players rarely collide with each other on purpose (demos notwithstanding). They interact through the ball. Player A hits the ball. Player B reads the trajectory and positions to intercept. Player A reads Player B's positioning and adjusts their next hit. The ball is a message passing system -- each touch encodes information about the hitter's intent, skill, and prediction depth.

Rotation -- the practice of cycling between offense, midfield, and defense -- is the team-level interaction pattern. It emerges from the simple constraint that a car that just hit the ball has spent its momentum and is out of position. The "take the shot / fall back" decision is continuous, unscripted, and entirely physics-driven.

### The Skill Axis

**Prediction depth is the entire skill curve.** Bronze players chase where the ball IS. Platinum players predict where it WILL BE in 1-2 seconds and drive to that spot. Grand Champions predict where the ball will be after 2-3 touches (their hit, the opponent's response, and the ball's resultant trajectory off the wall) and are already rotating before the first touch happens.

Mechanical skill (aerials, flip resets, ceiling shots) is the visible differentiator, but the invisible differentiator is read speed -- how quickly a player can look at a ball trajectory, a wall angle, and two opponents' car orientations and compute the next 3 seconds of physics. This is unconscious physics simulation running in the player's motor cortex.

Car control is a secondary skill axis that creates the gap between "I know where the ball will be" and "I can actually get my car there and hit it with the correct part of the bumper at the correct angle." The prediction is useless without execution, but execution without prediction is just chasing.

### The Flow-State Quality

**Continuous action with micro-pauses.** There is no turn structure. Both teams act simultaneously. But the ball creates natural rhythm: a hit produces 1-3 seconds of trajectory during which all players reposition. The hit itself is a punctuation mark in a continuous flow of movement. Expert play feels like surfing -- constant micro-adjustments with occasional explosive moments.

Crucially, there is ALWAYS something to do. Even when the ball is on the other side of the field, you are rotating, collecting boost, reading the play, positioning for a clear or a pass. Dead time is a skill gap indicator -- good players are never idle.

### Input Complexity

Surprisingly high for what feels simple. Gas, brake, steer, boost, jump (double jump), air roll, powerslide. But the effective action space reduces to: "where do I drive, and when do I jump/boost?" The destination is the decision; the inputs are the execution. This is why Rocket League feels intuitive despite complex controls -- the decision is spatial ("go there") even though the execution is mechanical ("hold boost, half-flip, air roll left").

### What Chain Reaction Could Steal

**The ball-as-message-passing concept.** In Rocket League, the ball carries information about what the hitter intended. In Chain Reaction, the blast force IS the message. When Player A taps and the explosion repositions surviving dots, those new dot positions encode information: where A chose to detonate, what A was trying to set up, what A was trying to deny. Player B reads the resulting dot state like a Rocket League player reads a ball trajectory off the wall.

**Rotation as emergent strategy.** Rocket League's offense/defense cycle is not a rule -- it emerges from the physics of "you're out of position after hitting the ball." Chain Reaction's turn-based structure already enforces alternation, but the billiards blast force creates a similar dynamic: your explosion catches dots (offense) but also scatters surviving dots (creates the board state you must defend against on the opponent's turn). The dual consequence of every tap IS rotation compressed into a single action.

**The prediction depth skill axis maps directly.** Novice Chain Reaction player: "where is the biggest cluster NOW?" Intermediate: "where will dots BE after my blast repositions them?" Expert: "where will dots be after my blast AND after my opponent's likely response blast?" This is Rocket League's "read the trajectory after the next 2 touches" applied to dot physics.

---

## 2. Racquetball / Squash

### The Interaction Mechanism

Two players share a confined court. One ball. Both players act on the same ball in strict alternation (you hit it, I hit it). The walls are not boundaries -- they are **tools**. Every surface is in play. The ball can reach any point on the court via multiple wall-bounce paths, each arriving at a different speed and angle.

The interaction mechanism is **positional denial through shot selection**. When you hit the ball, you are choosing (a) where the ball goes and (b) where your opponent must be to return it. The best shots are ones where the ball arrives at a location that is physically distant from where the opponent currently stands. A kill shot is simply a shot whose return position is unreachable in the time available.

But the deeper interaction is **the T position**. The center of the court (the T) is the most valuable real estate because it minimizes maximum distance to any return point. After hitting, the expert immediately moves to the T. The novice stays near the wall where they just hit. The fight for the T is the meta-game: every shot is simultaneously a ball placement AND a positional contest for court center.

### The Skill Axis

**Shot reading speed.** The expert reads the opponent's racket face angle, shoulder rotation, and footwork 100-200ms BEFORE the ball is struck and begins moving to the predicted return zone. The novice waits to see where the ball goes, then reacts. At the professional level, this pre-read is the entire difference -- the ball travels too fast to react to after contact.

The secondary axis is **shot variety from identical setups.** An expert can hit three different shots (cross-court, down-the-line, boast) from the same body position. The opponent cannot pre-commit to one because they look identical until the racket face contacts the ball. This is the deception layer that sits on top of physics prediction.

The tertiary axis is **the wall game** -- using multiple wall bounces to create angles that are geometrically impossible with direct shots. A ball that hits the side wall, then the front wall, then dies in the opposite corner has traveled a longer path at a higher speed than a direct shot to that corner. The player who "sees" wall-bounce paths that are invisible to the opponent has an information advantage.

### The Flow-State Quality

**Rally-based continuous flow.** Each rally is a micro-game of 5-30 shots with increasing urgency. The pace accelerates naturally as players trade shots from more awkward positions. Flow state emerges from the rhythm: hit-move-read-hit-move-read. The cycle time is 1-2 seconds per shot. There is no time to think consciously -- the motor cortex runs the physics simulation.

Between rallies (3-10 seconds), there is a brief reset. But even between points, positioning and readiness communicate intent. The match-level rhythm is: build rally intensity, reach a breaking point, reset, repeat at slightly higher tension.

### Input Complexity

One input: hit the ball with the racket. The "complexity" is entirely in WHERE and WHEN and HOW HARD. The racket face angle, contact point, and swing speed create an enormous outcome space from a single action. This is the purest example of "one action, infinite expression" in competitive sports.

### What Chain Reaction Could Steal

**The T position concept.** In racquetball, there is a privileged position (court center) that minimizes worst-case response time. In Chain Reaction's shared board, there may be analogous "privileged states" -- board configurations where the active player has many high-chain-potential clusters available regardless of where dots drift. A blast that leaves the board in a "your T" state (many options for you, few for opponent) is the equivalent of moving to the T after a shot.

**The wall-bounce path-reading skill.** Racquetball experts "see" multi-bounce trajectories that novices cannot. Chain Reaction's wall bounces for dots are the same mechanic. A player who can trace where a dot will be after 2-3 bounces has an information advantage identical to the squash player who reads a boast shot.

**Shot selection from identical setups.** In squash, the deception layer is "three possible shots from one stance." In Chain Reaction, the deception layer could be: "the opponent sees I have a 5-chain available in the upper-left, but I take a 3-chain in the lower-right that repositions dots to deny their best cluster." The opponent expected you to take the obvious big chain. You read deeper. This is the billiards "leave" translated through racquetball's lens.

**The rally-as-narrative.** Each racquetball rally builds tension through escalating awkwardness -- players are forced into worse positions until someone breaks. In Chain Reaction, the tug-of-war meter is the rally. Each exchange pushes one player closer to the edge. The meter drift back to center IS the rally rhythm -- you score, they counter, the meter oscillates with increasing amplitude until someone breaks through.

---

## 3. Tetris vs Tetris (Puyo Puyo Tetris / Tetris 99)

### The Interaction Mechanism

**Garbage pressure across separate boards.** Each player has their own playfield. They cannot directly touch the opponent's board. Interaction is mediated entirely through the garbage system: line clears on your board send garbage lines to the opponent's board, pushing their stack upward and reducing their margin for error.

The genius of Tetris garbage is **cancellation**. When garbage is pending (displayed as a warning bar), clearing lines BEFORE the garbage lands cancels it line-for-line. Any surplus becomes YOUR attack. This transforms defense into a dual-purpose action: clearing lines to survive simultaneously generates your counterattack. A player who perfectly counters a 4-line attack with a Tetris (4-line clear) neutralizes the attack AND sends nothing -- a neutral exchange. A player who counters with a T-Spin Triple (6 garbage equivalent) neutralizes the 4 incoming AND sends 2 back. Defense is not passive absorption; it is active counterplay.

**Timing is the strategic layer.** Garbage does not land instantly -- there is a delay window. The attacker must decide: send garbage now (forcing the opponent to deal with it immediately, possibly mid-build) or hold it and stack a bigger attack (risking the opponent completing their own setup). The defender must decide: counter now (safe but sends less) or absorb the garbage and build a bigger counter (risky but sends more). This timing tension creates a poker-like dynamic that is entirely absent in solo Tetris.

In Tetris 99, the interaction is simpler but scaled: you choose attack targets (badges for KO'd players increase your attack power). The interaction is less about reading a specific opponent and more about managing aggression across a chaotic field. Targeting strategy (attack leaders, attack those close to death, counterattack whoever is attacking you) adds a meta-layer to the basic garbage system.

### The Skill Axis

Three distinct skill axes, layered:

1. **Placement speed and accuracy** (mechanical). How quickly can you identify the optimal placement for the current piece? This is the baseline skill that separates casual from intermediate.

2. **Garbage management** (tactical). When to absorb, when to counter, when to attack. This is the skill that separates intermediate from advanced. It requires reading the opponent's board (or in Tetris 99, reading the target indicators) to time attacks for maximum disruption.

3. **Downstack reading** (strategic). After absorbing garbage, can you find clean lines to clear through the mess? The opponent's garbage pattern creates a puzzle-within-a-puzzle that demands different perception than clean-board play. Experts intentionally absorb garbage to build counter-attacks; novices panic.

### The Flow-State Quality

**Continuous with escalating urgency.** Pieces fall at an accelerating rate. The player is never idle -- there is always a piece to place. The garbage system adds punctuation: a garbage warning creates a spike of urgency ("I must clear NOW or absorb a 4-line push"), followed by relief when it is countered.

The rhythm is individual (each player's piece sequence creates its own tempo) but the garbage exchanges create a shared rhythm between opponents. A well-timed garbage dump during the opponent's misplace creates a resonant disruption -- the timing matters as much as the amount.

Flow state in competitive Tetris is unique because it is flow state under pressure. The solo Tetris flow (calm, meditative, one piece at a time) is disrupted by garbage arrivals that demand immediate context-switching. Learning to maintain flow WHILE absorbing disruption is the meta-skill.

### Input Complexity

Four actions: move left, move right, rotate, drop. The decision space is "where does this piece go?" -- a combinatorial search that the expert performs unconsciously through pattern recognition. The garbage system adds no new inputs; it adds new consequences to the same inputs.

### What Chain Reaction Could Steal

**The cancellation mechanic is the most powerful interaction pattern in competitive puzzle games.** It transforms defense from "absorb damage and hope" into "absorb damage, convert it into my attack." Chain Reaction's counter-chain system (from the existing brainstorm) is exactly this pattern: when the opponent pushes the meter, your counter-chain during the danger window cancels the push and sends surplus back. This is correct. Protect it.

**The timing tension (send now vs. hold for bigger attack).** In Chain Reaction, this maps to: "tap this 3-chain now to push the meter and maintain my streak, or wait 2 seconds for the 6-chain that is forming?" The waiting has a cost (dots may scatter, opponent's turn comes, the opportunity may evaporate) and a reward (bigger meter push, potentially uncounterable). This tension already exists in the design. The key learning from Tetris is that the tension must be FELT -- the player must consciously experience the "now or later?" dilemma, not just have it exist mechanically.

**Garbage as disruption of existing plans.** In Tetris, garbage pushes your stack up and forces you to solve a new puzzle you did not create. In Chain Reaction, the opponent's blast force IS the garbage -- it repositions dots and destroys the cluster you were nurturing. The emotional effect is the same: "my plan was disrupted, now I must adapt." The billiards blast force is more elegant than Tetris garbage because it uses the same physics the player already understands, rather than a separate "garbage lines" system.

**Tetris 99's targeting meta.** In a hypothetical Battle Royale mode (many players, shared or adjacent boards), the targeting decision ("who do I attack?") adds a strategic layer with zero additional input complexity. The player still just plays Tetris -- but their line clears go to the chosen target. Chain Reaction could explore this for 3+ player modes, but it is outside the scope of the 1v1 design.

---

## 4. Windjammers / Lethal League

### The Interaction Mechanism

**Shared arena, one projectile, escalating speed.** Both games feature a single object (disc/ball) that players hit back and forth with increasing velocity. The interaction is the most direct of any game analyzed here: you hit the thing at me, I hit it back at you. Miss it, I score.

**Windjammers** adds lane control (the disc slides along the ground in a specific lane) and special throws (curved tosses, lobs) that create mixup situations. The scoring zones have different point values, creating risk/reward: aim for the 5-point corner (small, easy to defend) or the 3-point center (wide, harder to defend). Defensive slides have commitment -- if you commit to one lane, the opponent can redirect to another.

**Lethal League** escalates speed exponentially. Each hit increases the ball's velocity. After 5-6 volleys, the ball moves faster than human reaction time. At that point, the game transitions from "react to the ball" to "predict the opponent's hit direction based on their character position and timing." The speed escalation forces this transition mechanically -- there is no choice but to predict because reacting is physically impossible.

The interaction mechanism in both games is **commitment and punishment.** You commit to a direction (defensive slide, swing timing). If you commit wrong, you are punished (scored on). If you commit right, the rally continues and the next volley is harder. The escalation ensures that every rally eventually reaches a breaking point where someone commits wrong.

### The Skill Axis

**Mixup depth.** At novice level, both games are reaction tests: see ball, hit ball. At intermediate level, they become prediction games: read the opponent's body language and pre-commit to a direction. At expert level, they become meta-games: "I know they expect me to go cross-court, so I go down-the-line, but they know I know, so they cover down-the-line, so I go cross-court..." This infinite regress is the Nash equilibrium mixup that emerges from simple "hit the thing" mechanics.

**Timing precision.** In Lethal League especially, WHEN you swing matters as much as WHERE. An early swing at a slow ball sends it at a specific angle. A late swing at a fast ball sends it differently. The timing creates the variety that prevents the game from being solvable.

### The Flow-State Quality

**Rally-based with escalating intensity.** Each rally starts slow and accelerates. The acceleration is not gradual -- it is exponential (Lethal League) or punctuated by special moves (Windjammers). This creates a natural dramatic arc within each point: calm setup, rising tension, explosive resolution. Between points, there is a 2-3 second reset. The match-level rhythm is a series of these crescendos.

Flow state in these games feels like a fast conversation. Hit. Response. Counter. Each exchange is a complete thought. The speed escalation forces the conversation to accelerate until someone stumbles.

### Input Complexity

**Extremely low.** Windjammers: move (stick), throw/slide (one button), special (one button). Lethal League: move, jump, swing. The entire depth comes from timing and direction, not from a large action set. These are the purest examples of "one verb, deep game" in the competitive space.

### What Chain Reaction Could Steal

**Escalation as a forcing function.** Both games use speed escalation to prevent stalemates. The rally MUST end because the ball eventually moves too fast to react to. Chain Reaction's escalating meter multiplier (from the existing design) serves the same purpose: later turns have amplified consequences, forcing resolution. The learning is that escalation must feel NATURAL (the ball gets faster because you hit it harder) rather than artificial (a timer counts down). In Chain Reaction, the escalation should feel like "the board is getting denser and stakes are getting higher" rather than "a multiplier number went up."

**The commitment/punishment loop.** In Windjammers, you commit to a defensive lane and are punished if wrong. In Chain Reaction, you commit to a tap position and are "punished" if the blast force leaves the board in a state your opponent can exploit. The commitment is the tap; the punishment is the resulting board state. The key insight is that the punishment must be IMMEDIATE and VISIBLE -- the opponent chains off the cluster your blast accidentally created. "I pushed those dots right into their sweet spot" is the Chain Reaction equivalent of "I slid left and they threw right."

**The mixup escalation from simple mechanics.** Windjammers proves that "throw disc left or right" becomes infinitely deep through mixup layers. Chain Reaction's analogous mixup is: "do I take the obvious big chain, or the smaller chain that denies the opponent's setup?" If the opponent can read your tendency (always go for biggest chain), they can predict your tap position and pre-read the resulting board state. The meta-game is: am I the kind of player who taps greedy, or the kind who taps positional? And can I mix between the two to be unreadable?

---

## 5. Splatoon

### The Interaction Mechanism

**Territory control through persistent area coverage.** Players spray ink on the ground. Ink in your color is your territory: you move faster through it, you refill your ink tank by submerging in it, you can hide in it. Ink in the opponent's color is hostile territory: you move slower, you are visible, you are vulnerable.

The interaction is **spatial denial and spatial advantage simultaneously.** Every shot of ink serves offense (covering opponent's territory), defense (maintaining your own territory), and mobility (creating paths for yourself). This triple-purpose action is the heart of Splatoon's depth: there is no "attack button" and "defense button" -- there is one action (spray ink) that does all three depending on where you aim.

The turf war scoring (most territory covered wins) creates a second interaction layer: **marginal territory is more valuable than central territory.** The front line -- where your ink borders the opponent's ink -- is the contested zone. Pushing the front line forward requires sustained presence and ink investment. Pulling it back requires only a single opponent's incursion. This asymmetry (offense is expensive, defense is cheap) creates natural tension between pushing forward and consolidating.

Kills in Splatoon are a means, not an end. Killing an opponent removes them from the contested zone for ~8 seconds, during which you can push the front line forward unopposed. The kill does not directly score points -- the territory gained during the opponent's respawn does. This means aggression is a tool for territorial advantage, not a goal in itself.

### The Skill Axis

**Map awareness and ink economy.** The novice shoots at opponents. The intermediate player paints territory. The expert reads the entire map as a flowing system: "if I paint this flank corridor, I create a stealth path that lets me ambush the opponent's backline painter, which removes their territorial pressure for 8 seconds, which lets my team push the front line 30% forward." The skill is seeing the entire ink-flow system, not just the opponent in front of you.

**Weapon matchup knowledge.** Different weapons paint at different rates, ranges, and patterns. Understanding which weapons control which zones -- and where your weapon is advantaged vs. disadvantaged -- is a knowledge axis that develops over hundreds of hours.

### The Flow-State Quality

**Continuous, chaotic, high-energy.** Splatoon has no pauses during a match. The 3-minute timer is relentless. There is always territory to paint, always an opponent encroaching, always a flank to check. The flow state is closer to a team sport (basketball, soccer) than a puzzle game -- constant movement, constant awareness, frequent micro-decisions.

The "super jump" mechanic (teleport to a teammate's position) creates punctuation: a sudden relocation that resets your spatial context. Expert players use super jumps to switch from defense to offense instantly, creating a rhythm of "hold, hold, hold, JUMP, push, push."

### Input Complexity

Standard shooter controls: move, aim, shoot, sub-weapon, special weapon. Moderate complexity. But the relevant decision is always spatial: "where do I point my ink?" The weapon fires continuously while the trigger is held -- the skill is directing the stream, not timing individual shots.

### What Chain Reaction Could Steal

**The triple-purpose action.** Splatoon's genius is that one action (spray ink) is simultaneously offense, defense, and mobility. Chain Reaction's tap-and-blast already has this structure: catching dots pushes the meter (offense), the blast repositions surviving dots (disruption/defense), and the resulting board state determines your future options (setup/mobility). The design should lean into this explicitly -- help players understand that every tap has three consequences, not just "score points."

**Territory as a visible, persistent state.** In Splatoon, you can see who controls what. The ink map IS the score. In Chain Reaction, the tug-of-war meter is the score, but the BOARD STATE is the territory. A board full of dense clusters near your tap reach is "your territory" -- you have options. A board where all clusters were scattered by the opponent's blast is "their territory" -- you have nothing to chain. Making this implicit territory more visible (perhaps through subtle coloring of board regions based on who last blasted there, or density heat mapping) could add the same legibility that Splatoon's ink provides.

**The "kills are means, not ends" principle.** In Splatoon, you kill to create time to paint, not to score directly. In Chain Reaction, big chains are means (they push the meter and reposition dots) not ends (the meter reaching 1.0 is the end). The design should frame big chains as "creating an opening" rather than "scoring points." The language matters: a 7-chain is not "7 points" -- it is "a massive board reshaping that your opponent must deal with."

---

## 6. Bomberman

### The Interaction Mechanism

**Shared grid, chain explosions, area denial, one action.** Each player places bombs that explode in cross-shaped patterns after a timer. The explosions destroy blocks, kill players, and trigger other bombs (chain detonation). The interaction is **area denial through timed placement** -- you place a bomb not to hit the opponent directly (they will move), but to restrict their movement options so that your NEXT bomb, or the chain reaction from this bomb triggering adjacent bombs, catches them in an unavoidable kill zone.

The critical interaction pattern is **corridor control.** Bomberman's grid creates corridors between destructible and indestructible blocks. A bomb at a corridor junction denies multiple paths simultaneously. The opponent must commit to one escape route, and a well-placed second bomb can deny that route too. The "trap" is not one bomb -- it is a sequence of placements that progressively restrict the opponent's movement until they have zero safe squares.

**Self-danger is the balancing mechanism.** Your own bombs kill you. Every placement creates risk for both players. The novice places a bomb and then cannot escape the blast zone. The intermediate player places and retreats. The expert places, retreats to a specific square that is safe from their bomb but threatening to the opponent, and immediately places a second bomb to seal the escape route.

The chain reaction mechanic (bomb triggers bomb) creates emergent complexity: placing bombs near each other creates cascading explosions with timing determined by the chain length. A deliberate chain of 3 bombs covers a massive area with a 3-second sequence of explosions. The opponent must predict the entire chain's spatial coverage, not just the first bomb's blast.

### The Skill Axis

**Spatial reasoning about timed events.** The novice thinks: "where do I place a bomb?" The intermediate thinks: "where do I place a bomb, and where do I stand after?" The expert thinks: "where do I place a sequence of 3 bombs, each triggered by the previous, such that the cascade covers every escape route the opponent has, and I am standing in the one square that is safe from all three blasts?"

This is combinatorial prediction -- the same skill as chess, but under real-time pressure and with spatial rather than abstract reasoning. The time-delay on bombs (typically 2-3 seconds) creates a prediction window that is short enough to demand quick thinking but long enough to permit deliberate play.

**Powerup management** is a secondary axis. More bombs, longer blast range, kick/throw -- each powerup changes the spatial reasoning problem. An opponent with kick (can push bombs) changes the entire threat model because placed bombs are no longer stationary.

### The Flow-State Quality

**Stop-and-go within continuous action.** Bomberman has a distinctive rhythm: place (commitment), retreat (repositioning), wait (tension), explosion (resolution), survey (reading), place (next commitment). This cycle takes 3-5 seconds and repeats throughout the match. Between cycles, both players are moving constantly, jockeying for position.

The flow is less "continuous surfing" (Rocket League) and more "rhythmic pulsing" (each bomb placement is a heartbeat). Multiple bombs in play create overlapping rhythms -- two players each placing bombs at different times creates a polyrhythmic pattern of explosions.

### Input Complexity

**Minimal.** Move (4 directions), place bomb (one button). The entire depth comes from WHERE and WHEN you place, not from a complex action set. Bomberman is perhaps the purest example of "one verb produces infinite outcomes" in the competitive game space. You place bombs. That is all you do. The game is 30 years old and still has competitive tournaments.

### What Chain Reaction Could Steal

**The trap-as-sequence concept.** In Bomberman, one bomb is not a threat. A sequence of bombs that progressively restricts escape routes IS a threat. In Chain Reaction, one tap is a meter push. A SEQUENCE of taps where each blast repositions dots into a worse state for the opponent is the analogous trap. The design should reward sequential thinking: "my tap this turn pushes 3 dots toward a wall, where on my next turn they will be clustered with the dots already bouncing in that corner, and that 6-chain will push the meter past the danger threshold." The patient player who sees two turns ahead should consistently beat the greedy player who maximizes each turn independently.

**Self-danger from your own actions.** In Bomberman, your bombs kill you. In Chain Reaction, your blast repositions dots that your OPPONENT then gets to chain. Every tap creates opportunity for the opponent. This is the billiards "leave" problem: a pool player who sinks a ball but leaves the cue ball in a terrible position has hurt themselves. Chain Reaction should make this consequence viscerally felt -- when your blast accidentally creates a perfect cluster for the opponent, and they chain it for a massive meter push, you should feel the same "I did that to myself" that a Bomberman player feels when they walk into their own bomb.

**The polyrhythmic explosion pattern.** Bomberman's overlapping bomb timers create a rhythmic texture. Chain Reaction's cascade already has rhythmic qualities (each generation detonates with timing jitter). In competitive mode, alternating players' cascades create a call-and-response rhythm. Player A's cascade plays a melodic phrase. Player B's response cascade plays a counter-phrase. The match is a musical dialogue.

---

## Extracted Interaction Patterns for Chain Reaction

### Pattern 1: The Blast as Message (from Rocket League)

**Concept.** Every tap communicates. The resulting board state after a blast is a message to the opponent: "I chose to detonate HERE, which means I valued catching THESE dots over THOSE dots, and I am willing to leave the board in THIS state for your turn." An expert opponent reads this message and infers your strategy -- are you playing greedy (always biggest chain), positional (setting up future chains), aggressive (pushing dots toward the opponent's weak zones), or defensive (scattering clusters to deny the opponent)?

**Implementation.** No mechanical change needed. This is an emergent property of the blast force system. But the design should SUPPORT message-reading by making blast consequences highly visible (dot trail effects showing where blast pushed things) and by ensuring that different strategies produce DIFFERENT board states. If every strategy produces the same scattered result, there is no message to read.

**Depth test.** After watching 5 turns of an expert match, can a spectator identify each player's strategy from the board state alone? If yes, the messages are legible.

### Pattern 2: The Progressive Trap (from Bomberman)

**Concept.** The skilled player does not win with a single brilliant tap. They win with a sequence of 2-3 taps that progressively worsen the opponent's position. Turn 1: small chain that pushes 4 dots toward the upper-right corner. Turn 2 (opponent's turn): opponent deals with a suboptimal board, takes a modest chain. Turn 3: the 4 dots from Turn 1 have now merged with corner-bounce traffic, creating a 7-chain cluster that the opponent could not have prevented. The trap was set two turns ago.

**Implementation.** Requires that blast force is strong enough to meaningfully reposition dots (30-60px displacement as specified in the existing design) and that wall bounces are predictable enough to exploit. The trap player must be able to predict where blasted dots will end up after 1-2 wall bounces. This is the multi-bounce path-reading skill from racquetball.

**Design requirement.** Blast force must be DIRECTIONAL and PREDICTABLE. If blast scatters dots randomly, traps are impossible. The inverse-power falloff in the existing spec ensures that close dots are pushed far (predictable: they go directly away from the explosion) and distant dots are pushed little (predictable: they barely move). This is correct. Protect this physics.

### Pattern 3: The Counter-Rhythm (from Tetris Garbage + Lethal League)

**Concept.** The match has a pulse: attack, counter, attack, counter. Each exchange escalates tension. The counter-chain system (from the existing design) is the mechanism, but the FEEL should be like a Lethal League rally -- each volley is faster and harder until someone breaks.

**Implementation.** The existing design has counter-chains during danger windows. The enhancement is to make the escalation FELT through audio and visuals. Each successive counter in a rally should increase in visual intensity and audio density. The first counter is a quiet deflection. The second is a sharp crack. The third is a thunderclap. If a rally reaches 4+ counters, the game enters a heightened state (screen edge glow, audio layer added) that creates the same "this rally is going to break someone" tension as a Lethal League ball at maximum speed.

**The key learning from Tetris:** The counter must be ACTIVE, not passive. Absorbing a meter push without countering should feel worse than countering, even if the counter is imperfect. The COUNTER_EFFICIENCY of 0.80 ensures that pure defense bleeds, but the design should also reward the QUALITY of the counter-chain. A counter that chains 5+ should feel dramatically different from a counter that chains 2.

### Pattern 4: The Board-State-as-Territory (from Splatoon)

**Concept.** At any moment, the board state favors one player. Regions with dense, chainable clusters near positions where the active player can reach them are "that player's territory." The board is never neutral -- it always leans toward one player based on where the opponent's last blast pushed things.

**Implementation.** This is already implicit in the blast force system. But making it MORE LEGIBLE could deepen the strategic layer. Possibilities:
- Subtle board-region tinting based on cluster density and proximity to each player's likely tap zones
- Heat-map glow showing where high-chain-potential zones exist (already mentioned in DESIGN.md as background heat map painting from solo mode)
- The tug-of-war meter reflects board advantage, but the board itself should LOOK like it favors someone

**The Splatoon lesson:** Territory must be CONTESTED, not static. If Player A's blast creates a favorable board state, Player B's response blast must be able to reclaim it. The blast force system inherently does this: every explosion reshapes the board, so territory is fluid. The flow should feel like Splatoon's ink front: push, counter-push, push, counter-push.

### Pattern 5: The Dual Read (from Racquetball + Rocket League)

**Concept.** The expert makes TWO reads simultaneously: (1) the physics read ("where will dots be in 1-2 seconds?") and (2) the opponent read ("what will my opponent do on their turn given this board state?"). The physics read is the foundation (shared with solo play). The opponent read is the competitive layer that makes PvP irreducible to solo skill.

**Implementation.** This emerges from turn-based alternation on a shared board -- no mechanical change needed. But the design should ensure that the opponent read is MEANINGFUL by ensuring that:
- Different players make meaningfully different choices from the same board state (the action space must be wide enough that "obvious best move" is rare)
- The consequence of the opponent's likely choice is PREDICTABLE if you read them correctly (blast force + chain resolution must be deterministic)
- The time between turns is long enough to make the read (2-4 seconds, as specified)
- But short enough that reading deeper is rewarded (the 10-second shot clock prevents over-analysis)

**The racquetball lesson:** The best competitive moments are when you READ the opponent's intent, PRE-POSITION (in Chain Reaction: choose your tap to exploit their likely response), and are CORRECT. The opponent taps where you predicted, and you already planned a chain off the resulting board state. This "I saw three moves ahead" feeling is the peak competitive experience -- the racquetball player who is already moving to the return zone before the opponent hits the ball.

---

## Summary: What Separates These Games from Parallel Solitaire

Every game analyzed here creates PvP interaction through one or more of these mechanisms:

1. **Shared object/space** -- players act on the same thing (Rocket League's ball, racquetball's ball, Windjammers' disc, Bomberman's grid, Splatoon's map). Chain Reaction's shared board with blast force is this.

2. **Dual-consequence actions** -- every action simultaneously helps you and hurts the opponent (Splatoon's ink is both your territory and their denial; Tetris's line clear is both your survival and their garbage; Bomberman's bomb is both a threat to them and a risk to you). Chain Reaction's tap is both your meter push and the blast that reshapes the opponent's board.

3. **Escalation forcing resolution** -- the game prevents stalemate by making exchanges progressively higher-stakes (Lethal League's speed increase, Tetris's garbage acceleration, Rocket League's clock). Chain Reaction's escalating meter multiplier and turn cap serve this.

4. **Prediction as the skill differentiator** -- in every game, the gap between novice and expert is how far ahead they can predict (Rocket League: ball trajectory, racquetball: shot reading, Tetris: garbage timing, Bomberman: blast chain coverage). Chain Reaction's prediction axis (where dots will be after blast + drift + bounce) is this.

5. **Active defense** -- defense is never just "survive." It is "survive AND create opportunity" (Tetris: counter-cancel, racquetball: the return is also an attack, Splatoon: painting your territory is also denying theirs). Chain Reaction's counter-chain system provides this.

The existing competitive design (Explosion Billiards + Tug-of-War + Counter-Chain, turn-based, shared board) already implements all five mechanisms. The patterns extracted above are refinements of HOW to implement them, not proposals to add new ones. The architecture is sound. The execution -- particularly blast force legibility, counter-chain feel, and progressive trap enablement -- is where the design will succeed or fail.
