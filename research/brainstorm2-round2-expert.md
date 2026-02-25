# Reference Expert: Round 2 Stress Test

## Date: 2026-02-23
## Role: Reference Expert
## Purpose: Run every proposal through real-game structural comparisons. Find where each one actually lives in the landscape of competitive games that exist, narrate what play looks like, find the degenerate case, and test the racquetball/flow analogies honestly.

---

## Proposal 1: THE COURT

### 1. Closest Real Game

**Agar.io.**

Not racquetball. The proposer claims racquetball, but racquetball has strict alternation (you hit, I hit) with continuous repositioning between hits. The Court has no alternation. Both players tap freely on the same field, competing for the same dots. This is structurally identical to Agar.io: a shared field with finite resources (pellets/dots), both players consume resources simultaneously, bigger/faster/smarter consumption wins. The interaction is through resource competition, not through acting on a shared object that passes between you.

The second-closest game is **Pac-Man Vs** (the arcade variant where one player is Pac-Man and the other controls ghosts on a shared maze). But even that has asymmetric roles. The Court is symmetric resource racing on a shared board. That is Agar.io's core loop, stripped to its essentials.

### 2. The 30-Second Experience

0:00 -- Both players scan the field. 40 dots drifting. Player A spots a 6-dot convergence forming upper-left, predicts it peaks in 1.2s. Player B spots the same cluster. Both are on cooldown from their last taps.

0:03 -- Player A's cooldown expires. They tap the upper-left cluster. 5 dots caught (blue explosions). Blast scatters 3 survivors. Player B's cooldown expires 0.4s later. The cluster is gone. Player B taps a 3-dot group mid-right instead. 3 dots caught (orange explosions).

0:06 -- Both scan again. New dots have spawned from edges. Player A sees a gravity dot pulling 4 standards into a knot lower-center. Player B sees it too. Race condition: whose cooldown expires first?

0:10 -- Player A taps the gravity cluster. 6 dots caught. Player B, cooldown still 0.3s out, watches their intended target disappear. Taps a 2-dot consolation prize.

0:15-0:30 -- This pattern repeats. Both players scan, both identify the best cluster, one gets there first. The loser takes the second-best option. Occasionally both tap within 200ms in overlapping areas and dots are split between them. Neither player experiences "I outplayed you." Both experience "I tapped faster" or "their cooldown happened to expire at the right moment."

**What are they thinking?** "Where's the biggest cluster? Is my cooldown up yet? Can I get there before they do?" This is not racquetball thinking. This is supermarket checkout thinking -- which line is shorter, can I get there first.

### 3. Where It Breaks

**The degenerate case is convergent strategy.** When both players are experts, they both identify the same optimal tap point (the highest-chain-potential cluster). The game reduces to: whoever's cooldown expires closer to the moment of peak density gets the cluster. This is the Reaction Speed Ceiling (Anti-Pattern 2) wearing a prediction mask. Yes, the expert predicts cluster formation 1.5s ahead -- but so does the other expert. At equal prediction depth, the differentiator is cooldown timing, which is determined by when your previous tap happened, which cascades backward to the start of the match. The match is effectively decided by initial cooldown phase offset.

A secondary degenerate case: if both players are fast enough, they race to every cluster and split it. The game becomes a coin flip per cluster (who taps 50ms faster), with the aggregate of 100 coin flips determining the winner. High skill, low variance in outcomes per action, high variance between action outcomes that cancel out to noise.

**The Agar.io solution** (get bigger, consume the other player) does not apply here. There is no snowball mechanic. The Court has no mechanism for one player's advantage to compound.

### 4. The Racquetball Test

**Fails.** Racquetball's defining quality is that your shot IS the opponent's problem. You hit the ball, and the ball's landing position determines what they must do. In The Court, your tap is NOT the opponent's problem -- it is just a resource you took before they could. The blast force scatters surviving dots, which does reshape the board, but the proposer does not emphasize this as the primary interaction. The primary interaction is racing to clusters. Racquetball is about reading bounces and positioning. The Court is about scanning for the ripest fruit and picking it first.

Honest analogy: **two people picking apples from the same tree.** You are both looking at the same apples. You both reach for the reddest one. The faster hand gets it.

### 5. The Flow Test

**Partial pass.** The player is always scanning, always on cooldown, always about to tap. There is no dead time. But the QUALITY of the flow is wrong. It is vigilance flow (constant monitoring for the next opportunity) rather than prediction flow (reading physics and positioning ahead). Agar.io has excellent vigilance flow. It does not have racquetball flow. The player is in a flow state, but it is the flow state of a day trader watching tickers, not a squash player reading wall bounces.

---

## Proposal 2: KING OF THE HILL

### 1. Closest Real Game

**Crossy Road + Pac-Man Championship Edition's ghost train mechanic.**

The proposer claims Rocket League, but Rocket League's ball is contested -- both teams act ON the ball. King of the Hill's hot zone is not contested. It is a value multiplier that drifts across the board. No one acts on the zone; both players act on dots, some of which happen to be inside the zone. The zone is a spotlight, not a ball.

The closest structural match is **Pac-Man Championship Edition DX**: a pre-determined path of high-value pellets sweeps through the maze, and the player must position to eat them as the path passes through their area. Replace "maze" with "shared dot field," replace "path of pellets" with "drifting hot zone," and you have King of the Hill.

The second-closest match is **Splatoon's Splat Zones mode**: a fixed zone on the map that both teams try to control. But Splat Zones has direct player-vs-player combat for zone control. King of the Hill does not -- both players tap dots independently, and the zone just multiplies the value.

### 2. The 30-Second Experience

0:00 -- Hot zone is center-left, drifting right along its sinusoidal path. Both players see the trajectory line. A cluster of 5 dots is inside the zone. Another cluster of 4 is outside on the right.

0:03 -- Player A taps the in-zone cluster. 5 dots x 3 = 15 points. Player B, on cooldown, taps the out-zone cluster. 4 dots x 1 = 4 points. Player A is up 15 to 4.

0:06 -- The zone drifts further right. New dots are spawning from edges. Player B notices the zone is about to pass over a forming 6-dot convergence in the right half. Player A is watching the zone leave the left side and sees slim pickings there.

0:10 -- Player B taps the 6-dot cluster just as the zone arrives. 6 x 3 = 18. Player B now leads 22 to 15.

0:15-0:30 -- Both players chase the zone. The expert-level insight kicks in: contested zone taps are worth 3x but the opponent is also tapping there, so expected value might be lower than guaranteed 1x taps in empty space. Player B harvests the field while Player A chases the zone. Player B falls behind on zone points but maintains consistent 1x income.

**What are they thinking?** "Is the zone about to pass over a cluster? Should I chase or harvest?" This is a two-option decision repeated every cooldown. Not deep.

### 3. Where It Breaks

**The degenerate case is zone-chasing convergence.** The hot zone's path is fully deterministic and displayed. Both experts know where it will be at every future moment. Both experts calculate the expected dot density along the zone's path and the expected dot density outside it. The optimal strategy is a function of one variable: zone dot density / field dot density. When this ratio exceeds ~2.0 (accounting for opponent contention), tap in the zone. Otherwise, tap the field.

This is a solved problem after 5 minutes of play. The decision becomes mechanical. There is no mixup depth, no deception, no opponent modeling. Both players execute the same algorithm, and the winner is whoever encounters better cluster-zone alignment by luck of spawn timing.

At expert level, both players ignore each other entirely and play the field + zone optimization problem. The opponent is relevant only as a "this cluster might be gone by my cooldown" factor, which is the same problem as Proposal 1 (The Court) with a value multiplier bolted on.

### 4. The Racquetball Test

**Fails.** Racquetball's interaction is through the ball -- your shot creates the problem the opponent solves. In King of the Hill, the zone creates the problem but neither player created it. The zone is the referee, not the ball. Both players respond to the zone independently. There is no "I shaped the board state that you now face." The blast force from your explosions pushes surviving dots, but the proposer does not frame this as the primary interaction. The primary interaction is zone-timing, which is a single-player optimization problem that both players happen to solve simultaneously.

Honest analogy: **two surfers waiting for waves.** The wave (zone) comes on a predictable schedule. Both surfers paddle for it. The better-positioned one catches it. They are not surfing against each other; they are surfing the same ocean side by side.

### 5. The Flow Test

**Pass.** The zone's drift creates a constant pull. You are always either chasing the zone, harvesting the field, or deciding between the two. There is no dead time. The sinusoidal drift creates a breathing rhythm (zone approaches = intensity, zone departs = calm field play). This maps well to the inhale-exhale pattern from continuous mode.

But the flow is self-referential. You are in flow with the ZONE, not with the opponent. The opponent is scenery.

---

## Proposal 3: INFECTION

### 1. Closest Real Game

**Othello/Reversi, played in real time.**

This is a direct structural match. In Othello, you place a disc and all opponent discs between your new disc and your existing discs flip to your color. In Infection, you tap and all opponent-colored dots caught by your explosion convert to your color. The conversion-cascade (caught enemy dots detonate as your color, catching more enemy dots) IS the Othello flanking mechanic, expressed through chain-reaction physics.

The second reference is **Splatoon's Turf War**, but Splatoon uses continuous ink spray. Infection uses discrete tap-and-cascade events. Splatoon's interaction is continuous territory painting. Infection's interaction is discrete territory flipping. Othello is the better structural match because Othello is also discrete (one placement per turn, even though Infection removes the turn structure).

The third reference, and the one the proposer should be worried about, is **Qwirkle** or any territory-flipping game where the dominant strategy is to play at the boundary. More on this in the degenerate case.

### 2. The 30-Second Experience

0:00 -- Field is roughly 50/50 blue and orange. Player A (blue) scans for clusters of orange dots near blue dots. Spots a group: 3 orange dots drifting toward 2 blue dots, forming a mixed cluster lower-right.

0:03 -- Player A taps the mixed cluster. The explosion catches 2 blue dots (scored) and 3 orange dots (converted to blue). The cascade propagates: one converted blue dot detonates, catching 1 more orange dot nearby and converting it. Total: 2 scored, 4 converted. The lower-right region flips from contested to blue territory.

0:06 -- Player B (orange) sees the blue advance. They scan for a counter-conversion opportunity. Upper-left has a cluster of 4 blue dots near 2 orange dots. Player B taps. 2 orange scored, 4 blue converted to orange. Upper-left flips orange.

0:10-0:15 -- The board is in flux. Dots drift and mix. Previously converted dots are now part of new clusters. Player A reads a forming cluster: 5 orange dots being pulled together by a gravity dot. In 1.5s, that cluster will be perfect for conversion. Player A waits for cooldown, then taps. 5 conversions cascade into 3 more. A territory sweep across the center.

0:20-0:30 -- Player B responds with a conversion sweep of their own in the opposite corner. Both players are reading dot drift patterns to predict where mixed-color boundaries will form, and timing taps to maximize conversion cascades. The board oscillates between blue-dominant and orange-dominant regions.

**What are they thinking?** "Where is the conversion cascade potential? How deep will this cascade propagate? If I convert these 5, will the cascade reach that cluster of 3 more? And will my opponent be able to re-convert them before I can score them?" This is prediction depth applied to territory. This is GOOD thinking.

The "I outplayed you" moment: Player A sees a gravity dot pulling 4 orange dots into a tight cluster. Player A does NOT tap the cluster now (only 4 conversions). Instead, Player A taps a small 2-dot blue cluster nearby, scoring 2 but more importantly, the blast force pushes 2 more orange dots INTO the gravity well. 1.5 seconds later, the gravity dot has pulled all 6 orange dots tight. Player A taps again. 6 conversions cascade to 3 more. Player B: "Where did those extra dots come from?" Player A: "I pushed them there two taps ago."

### 3. Where It Breaks

**The degenerate case is boundary hunting.** In Othello, the dominant strategy at high level is to play on edges and corners because those positions cannot be flanked back. In Infection, the analog is: always tap at the color boundary. Dots in the interior of your territory are already yours. Dots deep in enemy territory are unreachable (your explosion catches your own dots, not theirs, if you are surrounded by your color). The only productive tap is at the boundary where both colors mix.

If both experts play boundary-only, the game becomes a boundary tug-of-war. The boundary line oscillates. Neither player can make deep incursions because the opponent immediately re-converts at the boundary. The match devolves into "tap the boundary as fast as cooldown allows," which is the Reaction Speed Ceiling applied to a narrow strip of the field.

**However** -- and this is important -- Chain Reaction's dot physics may rescue this. Unlike Othello's static board, dots MOVE. Boundaries are not stable. A cluster of orange dots drifts away from the boundary into blue territory, creating a conversion opportunity deep behind enemy lines. The gravity/volatile dot types create cluster formation that is not boundary-locked. The degenerate case requires that boundaries are stable and well-defined. Chain Reaction's fluid dot movement means boundaries are fuzzy and constantly shifting. This may prevent the Othello boundary lock.

The second degenerate case: **conversion cascades are too powerful.** If one well-placed tap can flip 15 dots (as the proposer claims), the board can swing wildly on a single tap. The game becomes volatile -- one good tap erases 10 seconds of the opponent's work. This can feel unfair (punishing consistent play) or chaotic (the board state is unreadable because it changes too dramatically per tap). The volatility needs to be tuned so that conversion cascades are powerful but not board-erasing.

### 4. The Racquetball Test

**Partial pass.** In racquetball, your shot repositions the ball and forces the opponent to deal with the new situation. In Infection, your tap converts dots and forces the opponent to deal with the new territory. The conversion IS the shot. The board state after your tap IS the ball landing. The opponent reads the new board and responds. This is closer to racquetball than any other proposal.

Where the analogy breaks: in racquetball, you have one ball and you act on it alternately. In Infection, you both act on the same board simultaneously. There is no alternation. Both players can tap at the same boundary at the same time, creating the simultaneity problem. Racquetball avoids this because only one player hits at a time.

Honest analogy: **real-time Othello on a moving board.** The Othello part is accurate (conversion, territory, boundary play). The "real-time" part is where the problems live.

### 5. The Flow Test

**Strong pass.** The player is always scanning for conversion opportunities, always reading dot drift to predict where mixed clusters will form, always assessing whether to tap now (smaller conversion) or wait (bigger conversion forming). The decision loop is: SCAN for mixed clusters -> PREDICT drift to find forming clusters -> EVALUATE conversion cascade depth -> TAP -> WATCH cascade (but you are already scanning for the next opportunity during the cascade). This maps to the 1.5s observation-to-action loop. The opponent's actions constantly reshape the board, so every cascade from either player creates a new reading challenge. The board is never the same for more than 2 seconds.

---

## Proposal 4: DENSITY RACE

### 1. Closest Real Game

**Tetris 99 with no garbage.** Or more precisely: **SpeedRunners without the screen shrinking** -- a parallel race where you can see the opponent's position but cannot affect it.

Actually, the closest real game is just **a leaderboard.** Two players playing the same game at the same time with a ghost overlay is structurally identical to a time trial with ghost data. F-Zero X ghost mode. Trackmania ghost competitors. The "interaction" is entirely psychological. The ghost does not affect your car. The opponent's play does not affect your dots.

The proposer acknowledges this: "A player who ignores the ghost plays identically to solo mode."

### 2. The 30-Second Experience

0:00 -- Both players see their own field. Same spawn seed. Identical starting conditions. A ghost silhouette of the opponent's field overlays faintly. Player A scans their field. Player B scans theirs. Same field.

0:05 -- Player A taps a 5-dot cluster upper-right. On Player B's screen, they see a faint ghost tap indicator appear upper-right. Player B had been about to tap the same cluster but decided to wait for a forming 7-dot convergence center-left.

0:08 -- Player B taps the 7-dot convergence. Massive cascade, 11 dots cleared. Player A sees the ghost cascade on their overlay. Player A's density is higher (they cleared fewer on their first tap). Player A feels pressure.

0:15-0:30 -- Both players play continuous mode. The ghost tells them whether they are ahead or behind. If behind, they feel urgency. If ahead, they feel confidence. At no point does either player DO anything differently because of the opponent. They play the same solo game they always play, with a psychological weight on their shoulders.

**What are they thinking?** "Same as solo, but with anxiety." The ghost adds stress, not strategy. There is no "I outplayed you" moment because you cannot affect the opponent.

### 3. Where It Breaks

**It is already broken.** There is no competitive interaction. The proposer ranks this in Tier 3 and admits "The design adds no new skill axis." This is correct. Density Race is Chain Reaction solo with a spectator. It is a race in the same way that two people running on adjacent treadmills is a race: the one who runs faster wins, but neither runner affects the other's treadmill.

The ghost overlay could create psychological disruption (choking under observation), but that is a fragile and unpleasant interaction. The player who is better at ignoring the ghost has an advantage -- which means the optimal strategy is to cover the ghost overlay with tape. When the optimal competitive strategy is to disable the competitive feature, the design has failed.

### 4. The Racquetball Test

**Fails completely.** Racquetball requires that your shot creates the opponent's problem. In Density Race, your tap creates nobody's problem but your own. Two players on adjacent courts, each hitting balls against their own wall, comparing scores afterward. That is not racquetball. That is practice.

### 5. The Flow Test

**Perfect pass, vacuously.** Flow is identical to solo mode because this IS solo mode. The competitive layer adds nothing to flow and (if the ghost is distracting) may subtract from it. A flow test that passes by being identical to the baseline is not evidence of good competitive design. It is evidence of no competitive design.

---

## Proposal 5: TUG-OF-FIELD

### 1. Closest Real Game

**Air hockey.** The proposer nails this one. Air hockey is the correct structural reference.

A shared surface. A pressure object (puck / pressure line) that moves toward one side or the other based on player actions. Both players act in real time. The objective is to push the pressure object past the opponent's edge. The comeback mechanic (losing player gets fewer spawns but also less field to manage) is structurally similar to air hockey's "the puck is deep in your zone, so you have less time to react but also less distance to cover."

The second reference is **Tug of War** (literally). Two teams pull a rope. The rope's position indicates who is winning. The stronger/more coordinated team wins. But tug of war is a pure force contest -- there is no strategy beyond "pull harder." Air hockey is better because it has shot placement, angles, bank shots off walls, and fake-outs.

The third reference is **Pong**, but Pong has a discrete object (ball) that moves between players. Tug-of-Field's pressure line is not a discrete object -- it is a cumulative pressure indicator. Pong's ball creates alternation (you hit, I hit). The pressure line does not alternate -- it is pushed continuously by both players' chains.

### 2. The 30-Second Experience

0:00 -- Landscape field. Pressure line at center. Player A (left) and Player B (right) both see dots spawning from their respective edges, drifting toward the center. Near the pressure line, dots from both sides intermingle.

0:03 -- Player A taps a 4-dot cluster on their half. Pressure line pushes 10px right. Player B's territory shrinks by 10px. A cluster that was on Player B's side is now on Player A's expanded territory.

0:05 -- Player B responds immediately, tapping a 5-dot cluster on their shrinking half. Pressure line pushes 12px left. Line back near center. The dots near the line are churning -- blast forces from both explosions have scattered them into new formations.

0:10 -- Player A reads the scattered dots. A gravity dot near the pressure line is pulling 3 dots from Player B's side into a tight cluster. In 1 second, that cluster will be a 5-chain on Player A's side of the line. Player A waits.

0:12 -- Player A taps the gravity-assisted cluster. 5 dots, big push. Pressure line jumps 15px right. Now Player B is defending -- their field is shrinking, fewer spawns, less room. Player B needs a counter-push.

0:15-0:30 -- Player B scans their compressed field for the best chain. Fewer dots (rubber-band: losing side gets fewer spawns), but higher density (less area). Player B finds a 4-chain in the compressed space and pushes back. The line oscillates. Both players are reading the pressure line position, the dot distribution near the line, and the opponent's likely counter. The line is the narrative: forward means attacking, backward means defending. The story of the match is visible in the line's position.

**What are they thinking?** "Push the line. How far can I push before they counter? Where is the biggest chain near the line? If I push 15px, will that swallow a cluster that gives me another push immediately? Can I chain two pushes without giving them a good counter?" This is spatial, physical, predictive thinking. This is GOOD.

The "I outplayed you" moment: Player A pushes the line 15px with a big chain. The blast scatters dots into Player B's compressed zone, and those scattered dots cluster near the line on Player B's side. Player A planned this -- the blast force pushed dots into a position where Player A's NEXT tap will catch them on their expanded territory. Player B has to deal with a board state that Player A deliberately created. This IS racquetball. Your shot created the opponent's problem.

### 3. Where It Breaks

**The degenerate case is the rubber-band inversion.** The losing player gets fewer spawns (less field, less territory), which means the losing player has fewer dots to chain, which means smaller pushes, which means they lose more territory, which means even fewer dots. The rubber-band is supposed to help the loser (less to manage), but if the loser cannot find big chains in their compressed space, the advantage compounds for the winner. At expert level, a player who gets an early lead pushes the line, gains territory, gains access to more dots (both their own spawns and dots near the line), chains bigger, pushes further. Snowball.

The fix (reducing spawns on the losing side to increase density) may work, but it needs to be tuned carefully. Too much rubber-band and the game punishes winning (why push if the opponent gets higher density?). Too little and it snowballs.

**The second degenerate case: landscape orientation.** This is not a design flaw per se, but the proposer notes it is "a departure from the game's portrait identity." On a 390x844 phone in landscape (844x390), each player's half is 422x390. Dots, explosions, and the pressure line must be legible in this compressed vertical space. The game's entire visual language was designed for portrait. Rotating to landscape may break legibility.

The proposer suggests portrait with a horizontal pressure line instead. This is better for legibility but changes the spatial dynamic: "push up" vs "push down" lacks the intuitive left-right mirror of two players facing each other. It may work, but it is untested.

### 4. The Racquetball Test

**Strongest pass of all proposals.** Your chain pushes the line AND scatters dots, creating the board state your opponent must now read and respond to. The blast force IS the racquetball shot: it goes to a position (line push distance + scattered dot locations) that the opponent must deal with. The pressure line IS the ball: its position tells both players who is winning and determines the spatial constraints of the next exchange. The confined shared space with a physical divider IS the court.

Where the analogy weakens: racquetball has one ball that alternates between players. Tug-of-Field has continuous simultaneous play. Both players can chain at the same time. If both push simultaneously, the line wobbles rather than moving decisively. This is more like a real tug of war (both sides pull simultaneously) than racquetball (alternating shots). But the tug-of-war dynamic still creates the "your push is my problem" interaction that the racquetball test demands.

### 5. The Flow Test

**Strong pass.** The pressure line is always moving (drifts back to center between actions). The field is always changing (spawns, drift, blast scatter). There is always a decision: push aggressively (big chain near the line) or consolidate (clear your backfield to prevent overflow, prepare for the next push). The pressure line creates urgency without interruption -- you see it moving and you need to act, but you are never WAITING for anything.

The breathing rhythm is natural: push (exhale) -> line rebounds slightly (inhale) -> opponent pushes (exhale) -> rebound (inhale). This maps to the inhale-exhale design pattern. The pressure line's oscillation IS the breathing.

---

## Proposal 6: STEAL

### 1. Closest Real Game

**Katamari Damacy's multiplayer mode** (roll a ball to collect objects; your opponent's ball is also on the field; you can steal objects from each other's balls).

But more precisely: **Mario Kart's coin system** (collect coins to go faster; getting hit makes you drop coins; opponents can collect your dropped coins). The score well is the coin count. Getting your well "stolen" is getting hit and dropping coins. The dual objective (collect + protect) is identical.

The proposer claims "capture-the-flag meets basketball," which is partially right. Capture-the-flag has spatial objectives (flags at fixed positions) that both teams raid. The score wells are fixed-position spatial objectives. But capture-the-flag has discrete flag captures (grab and carry back), while STEAL has continuous accumulation and percentage-based theft. Basketball is a better match for the continuous scoring, but basketball does not have a "steal your opponent's points" mechanic.

The most structurally honest reference is **King of Fighters / Power Stone**: fighting games where hitting the opponent causes them to drop collectible resources that you can pick up. Your offense simultaneously damages the opponent AND generates resources for you.

### 2. The 30-Second Experience

0:00 -- Player A's well (lower-left corner) is medium-sized (50 points). Player B's well (upper-right corner) is smaller (30 points). Dots fill the field. Both players scan.

0:03 -- Player A taps a 4-dot cluster near center. 4 dots scored, well grows slightly. The cascade propagates... gen-2 explosion reaches near Player B's well but falls short. No steal.

0:06 -- Player B taps a 3-dot cluster near Player A's well. 3 dots scored, but the cascade extends... gen-3 explosion grazes Player A's well. Steal! Player A's well shrinks 8%, Player B's grows. Player A feels the sting.

0:10 -- Player A now faces a choice: tap the 5-dot cluster mid-field (safe, grows well) or tap the 3-dot cluster near Player B's well (fewer points, but the cascade might reach their well for a steal). Player A goes for the steal attempt. Taps near Player B's well. 3 dots caught, cascade reaches gen-4 -- and the gen-4 explosion hits Player B's well. 15% steal. Massive swing.

0:15-0:30 -- Both players are now playing a dual game: score dots (grow well) and position chains to reach the opponent's well (steal). The expert reads cascade geometry: "If I tap HERE, gen-0 catches 3 dots, gen-1 catches 2, gen-2 detonates near their well, gen-3's explosion radius with cascade momentum JUST reaches the well." This is a spatial geometry problem that uses the cascade momentum system in a novel way.

**What are they thinking?** "Grow my well or raid theirs? Can I find a tap that does both? What cascade path reaches their well?" This is interesting multi-objective thinking. The cascade geometry reading is genuinely novel -- you are not just maximizing dots caught, you are tracing the chain path to see if it reaches the target.

### 3. Where It Breaks

**The degenerate case is turtling.** If your well is worth protecting, the optimal strategy is to clear all dots near your own well (deny the opponent cascade paths to it) and only score from safe positions far from the opponent's well. This is defensive play that prioritizes denial over scoring. Two turtling experts produce a boring game: both clear near their own wells, both score small chains in safe zones, neither attempts steals because the defensive clearing prevents cascade paths.

**The second degenerate case is well camping.** The opponent's well is a fixed position. The expert learns to chain-path toward that position every tap. If the well is in a corner, the expert taps clusters along a corridor leading to the corner, using cascade momentum to extend the chain toward the well. Every tap is aimed at the same corner. The game becomes "can I chain toward that corner" on repeat. Spatial variety collapses.

**The third problem: wells are alien objects.** The Guardian's Anti-Pattern 8 (Bolt-On) is directly relevant. Score wells are not dots. They are new objects with new rules (percentage-based theft, size represents score, fixed position). The visual grammar of Chain Reaction is dots-and-explosions. Wells are a foreign vocabulary word. The player must learn "what is that pulsing circle in the corner?" This violates the one-sentence explanation test.

### 4. The Racquetball Test

**Partial fail.** In racquetball, your shot creates the opponent's movement problem (they must get to where the ball lands). In STEAL, your chain MIGHT reach the opponent's well, creating a score problem (they lose points). But the "might" is the issue. Most taps do not reach the well. Most taps are just dot collection. The racquetball interaction (every shot is the opponent's problem) happens only on the ~20% of taps where a cascade reaches or threatens the well. The remaining 80% is solo dot collection with no opponent interaction.

Honest analogy: **basketball with a money jar.** You play basketball (score dots) but occasionally you can reach over and grab money from the opponent's jar (steal from their well). The basketball is the game. The jar raid is the competitive layer. It is a bolt-on.

### 5. The Flow Test

**Partial pass.** The player is always scoring dots (flow maintained). The steal mechanic adds a secondary scanning layer (is my cascade path near their well?) that enriches the decision without interrupting the action. But the well-protection scanning (is the opponent's cascade approaching MY well?) is a defensive check that pulls attention away from dot prediction. Every few seconds, the player glances at their well corner to check for incoming cascade threats. This is the UI Gaze Tax (Anti-Pattern 6) applied to a game object rather than a UI element -- but the cognitive cost is the same. You are not reading dots; you are checking your well. That is interruption.

---

## Proposal 7: PHASE SHIFT

### 1. Closest Real Game

**Ikaruga.**

The proposer nails this reference. Ikaruga is the structural twin. In Ikaruga:
- There are two polarities (black and white).
- Your ship has a polarity (switchable).
- Bullets of your polarity are absorbed (benefit you). Bullets of the opposite polarity kill you.
- Enemies of both polarities appear simultaneously.
- The game is about managing two overlapping systems in one visual field.

Phase Shift maps directly:
- Two dot colors (blue and orange).
- Your active phase determines which color you can catch.
- During your active phase, you catch your dots. During dormant phase, your dots are ghosts.
- Both colors coexist on the same field.

The critical difference from Ikaruga: in Ikaruga, polarity switches are player-controlled and instantaneous. In Phase Shift, phase changes are on a fixed cycle (8-10 seconds) and affect both players simultaneously. This is closer to **Lumines' timeline sweep**: a bar sweeps across the board, and when it reaches matched blocks, they clear. The timeline is on a fixed rhythm, not player-controlled. The player must build structures before the sweep arrives.

So the most accurate reference is: **Ikaruga's polarity system on Lumines' fixed-rhythm timeline.**

### 2. The 30-Second Experience

0:00 -- Phase A active. Player A (blue) is in attack mode. Blue dots glow, orange dots are ghosted. Player A scans for blue clusters. A 5-dot blue cluster is forming center-right.

0:03 -- Player A taps the blue cluster. 5 blue dots caught, scored. The explosion's blast force pushes nearby ghosted orange dots (Player B's dormant dots) outward, scattering a forming orange cluster. Player B sees their dormant dots scatter and recalculates: "My 6-dot cluster that was forming is now a 3-dot cluster because their blast pushed 3 of my dots away."

0:06 -- Player B (orange) is in dormant phase but actively reading. They track their orange dots, predict where the scattered ones will drift, assess what clusters will exist when Phase B activates in 4 seconds. Player B identifies a new cluster forming upper-left where two of the scattered dots are converging with three others.

0:08 -- Phase shift. Orange dots glow, blue dots ghost. Player B immediately taps the upper-left cluster they pre-identified. 5 orange dots caught. Player B's blast scatters Player A's ghosted blue dots. Player A, now in dormant phase, reads the new blue dot positions and begins planning.

0:15-0:30 -- The rhythm is clear: 4-5 seconds of aggressive tapping (catch your dots), 4-5 seconds of active reading (predict where your dots will be when phase returns + watch opponent's blasts scatter your dots). During active phase, you are both scoring AND disrupting (blast force pushes opponent's dormant dots). During dormant phase, you are reading the board, tracking scattered dots, pre-identifying clusters.

**What are they thinking?** During active phase: "Score my dots, but ALSO position my blasts to scatter their dormant dots." During dormant phase: "Track my dots. Their blast just pushed 3 of mine. Where will those 3 end up? Will they form a cluster with the 4 already converging upper-left? If yes, I have a 7-chain when my phase activates." The prediction during dormant phase is entirely physics-based: reading dot trajectories, wall bounces, gravity dot pulls. This is the game's core skill axis applied to a competitive context.

The "I outplayed you" moment: Player A is in active phase. They see a mediocre 3-dot blue cluster near center. But they also see 6 orange dots (Player B's dormant dots) forming a beautiful cluster at lower-right. Player A ignores the 3-dot blue cluster and instead taps a 2-dot blue cluster at lower-right, sacrificing 1 blue dot but scattering the 6 orange dots with the blast force. When Phase B activates, Player B's "beautiful cluster" is gone. Player A sacrificed 1 point to deny Player B 6. This is the racquetball "sacrifice shot" -- take a weak shot that puts the opponent in a terrible position.

### 3. Where It Breaks

**The degenerate case is passive dormant phases.** The proposer claims dormant phase is "active reading," but the kill criterion K2 says: "Is there any moment during normal play where the optimal action is to wait?" During dormant phase, you CANNOT TAP (your dots are ghosts, tapping does nothing useful). You are waiting. You are reading, yes, but your hands are idle. For 4-5 seconds of every 8-10 second cycle, you have zero meaningful input options. This is the Spectator Trap (Anti-Pattern 1).

The Guardian's scoring rubric for Flow Continuity says: "Measure the longest period during normal play where the player has zero meaningful input options. If this exceeds 1.5 seconds at any point during a match, the proposal fails." Phase Shift has 4-5 second dormant windows. This fails the 1.5-second test by 3x.

**The fix** would be to let players tap during dormant phase for some purpose (minor scoring, dot-pushing-without-catching, positioning). But the proposer does not include this, and adding it would change the proposal fundamentally.

**The second degenerate case is phase-edge burst.** Both experts will hold their taps until 0.5 seconds before their phase ends, then burst-fire their remaining cooldowns. Why? Because tapping early in your phase gives the opponent maximum time to watch the results and plan their phase. Tapping at the last moment gives the opponent minimum reading time before their phase activates. Both experts converge on the same timing pattern: read for 70% of active phase, burst-tap for 30%. This is suboptimal for scoring (less time tapping = fewer chains) but optimal for disruption (late taps scatter opponent's dots right before their phase starts, giving them no time to re-read).

This creates a degenerate rhythm: 7 seconds of watching, 3 seconds of frantic tapping, repeat. The watching is the Spectator Trap. The frantic tapping is the Reaction Speed Ceiling. The design falls between two anti-patterns.

### 4. The Racquetball Test

**Mixed.** During active phase, the blast-force disruption of opponent's dormant dots IS the racquetball shot (your action creates the opponent's problem). This is the strongest competitive interaction of any proposal except Tug-of-Field. The opponent must read the scattered dots and adapt their plan.

But racquetball has continuous alternation (you hit, I hit, you hit). Phase Shift has batch alternation (you tap for 5 seconds, I tap for 5 seconds). The rhythm is wrong. Racquetball's rhythm is: shot-reaction-shot-reaction, sub-2-second cycle. Phase Shift's rhythm is: burst-wait-burst-wait, 8-10-second cycle. This is closer to baseball (pitch-bat-field-pitch) than racquetball.

Honest analogy: **two boxers in alternating rounds -- one attacks while the other has their hands tied, then they switch.** The punches land (interaction), but the hands-tied phase (dormant phase) is anti-flow.

### 5. The Flow Test

**Fails.** The dormant phase breaks flow. 4-5 seconds of zero input is an eternity in a game designed around sub-2-second action loops. The proposer frames dormant phase as "active reading," and it IS mentally active. But flow requires agency -- the feeling that your actions matter NOW. Reading without acting is preparation, not play. A racquetball player between rallies is reading the opponent's body language, but that 3-second pause between rallies is the MINIMUM dead time. Phase Shift creates 4-5 second mandatory dead times DURING THE RALLY.

---

## Proposal 8: ECHO

### 1. Closest Real Game

**Tetris vs. Tetris (garbage system).**

The proposer claims "tennis with heavy topspin," but tennis has one ball that alternates between players. Echo has separate boards with delayed effects sent between them. This is structurally the garbage system from competitive Tetris: your actions on your board send disruption to the opponent's board after a delay. Tetris sends garbage lines. Echo sends ghost explosions.

The specific innovation is the positional mapping: your echo lands at the SAME COORDINATES on the opponent's board. In Tetris, garbage is generic (lines rise from the bottom regardless of what you cleared). In Echo, the disruption is spatially correlated to your tap position. This means your tap position on your board matters for the opponent's board -- creating the "dual optimization" the proposer describes.

The closest game with positional garbage: **Panel de Pon / Puzzle League**, where garbage blocks land at the top of the opponent's board in the same column pattern as your clears. Your clear pattern is echoed spatially onto the opponent.

### 2. The 30-Second Experience

0:00 -- Both players have their own field. Same spawn seed. Player A taps a 5-dot cluster center-right. On Player A's board, 5 dots caught, cascade resolves. Simultaneously, a grey ghost circle appears on Player B's board at center-right, growing slowly for 3 seconds: "echo incoming at these coordinates."

0:03 -- Player B sees the echo preview. Center-right on their board has a forming 4-dot cluster. Player B has a choice: (a) tap that cluster now before the echo arrives and score 4 dots, (b) wait for the echo to detonate and ride the disruption, or (c) ignore the echo and tap a different cluster.

0:04 -- Player B decides to tap center-right before the echo arrives. 4 dots cleared. When the echo detonates 1 second later at center-right, it hits empty space -- Player B evacuated the zone. Player B played defense: deny the echo's disruption.

0:06 -- Player B's tap from 0:04 sends an echo to Player A's board at center-right. Player A sees the preview. Center-right on Player A's board is now sparse (they already cleared there). The echo will hit nothing. Player A ignores it and taps a cluster upper-left.

0:10-0:30 -- The echo pattern creates a delayed conversation. Each tap is simultaneously a local play AND a 3-second-delayed probe of the opponent's board. The expert player begins reading the opponent's board through the echo previews: "I tap center-right on my board. My echo will land on their center-right. What is on their center-right? If they have a cluster there, my echo disrupts it. If not, the echo is wasted."

But wait -- the expert CANNOT see the opponent's board. Each player sees only their own field plus incoming echo previews. The "reading the opponent's board" is done indirectly through two signals: (a) where the opponent taps (visible as echo previews on your board, which tells you what coordinates they chose on their board) and (b) the opponent's behavior over time (if they keep tapping upper-left, their upper-left must be productive, which means dot density is high there, which means YOUR echo to upper-left would be disruptive).

**What are they thinking?** "Clear my dots, but also: where should I tap to disrupt them? I see their echoes arriving at my position (3, 7) -- so they tapped (3, 7) on their board 3 seconds ago. That means (3, 7) on their board was a productive spot. Should I aim my taps at (3, 7) to echo-disrupt their productive zone? But my (3, 7) might not be a good tap locally..." The dual optimization is real but complex. The player must hold two spatial maps in their head: their own board state and a MENTAL MODEL of the opponent's board state inferred from echo positions.

### 3. Where It Breaks

**The degenerate case is echo irrelevance.** The echo is 50% radius and arrives 3 seconds late. In 3 seconds on a board with continuous spawns and active play, the board state changes dramatically. The cluster that was at center-right when the opponent tapped is probably not there anymore -- the opponent already caught it. The echo arrives at coordinates that are no longer relevant.

If echoes routinely hit empty space (because the opponent already cleared the area they tapped), the echo system adds visual noise without meaningful interaction. The player learns to ignore echoes. The game reverts to Density Race (Proposal 4) with annoying grey explosions.

**The fix would be stronger echoes** (bigger radius, longer delay, or added blast force that scatters the opponent's dots). But stronger echoes risk the Spectator Trap: if an echo disrupts your board significantly, you must react to it, and the 3-second cycle of echoes arriving continuously means you are always partly in reactive mode rather than proactive flow.

**The second degenerate case is split-screen legibility.** The Guardian's K6 criterion notes: each half of a split screen on a 390x844 viewport is 195x422. Chain Reaction's explosions, cascade momentum, dot types, and connection lines were designed for a 390x844 field. Halving the width to 195px makes dots, explosions, and especially the subtle ghost echo previews extremely difficult to read. The game's visual language collapses at half resolution.

### 4. The Racquetball Test

**Fails.** In racquetball, your shot arrives in the opponent's space 0.5-1 second after you hit it, at a specific position that the opponent must read and react to in real time. In Echo, your ghost arrives 3 seconds later at coordinates that may no longer be relevant. The delay is too long and the spatial correlation is too weak (same coordinates, but different board states). A racquetball shot is precisely targeted at the opponent's current position. An echo is a postcard from 3 seconds ago sent to a place the opponent has already left.

Honest analogy: **correspondence chess.** You send a move. It arrives 3 seconds later. The opponent's board has changed. Your move might be relevant or might be irrelevant. There is no real-time reading of the opponent's situation -- only a delayed, imprecise projection.

The proposer's "tennis with heavy topspin" analogy requires that the echo is meaningful when it arrives. In tennis, the ball arrives at a specific point and the opponent MUST return it. In Echo, the ghost arrives and might hit nothing. Tennis forces a response. Echo does not.

### 5. The Flow Test

**Pass with caveats.** Each player is playing continuous mode on their own board, which is a proven flow state. The echoes add periodic disruptions that the player must absorb (like Tetris garbage). If echoes are weak enough to be absorbed without breaking flow, this works. If echoes are strong enough to meaningfully disrupt, they break flow. The design sits on a knife edge between "irrelevant" and "disruptive" with no stable middle ground.

---

## Cross-Proposal Analysis

### The Central Pattern

The 8 proposals reveal a spectrum:

| Proposal | Interaction Type | Interaction Density | Flow Quality |
|----------|-----------------|-------------------|-------------|
| 1. THE COURT | Resource racing | High (every tap contests) | Vigilance flow (wrong kind) |
| 2. KING OF THE HILL | Parallel optimization | Low (zone is shared, play is parallel) | Good but self-referential |
| 3. INFECTION | Territory conversion | High (every tap converts) | Strong |
| 4. DENSITY RACE | Psychological only | Zero | Solo flow (no competitive flow) |
| 5. TUG-OF-FIELD | Pressure exchange | Very high (every push is opponent's problem) | Strongest |
| 6. STEAL | Occasional raids | Medium (20% steals, 80% solo) | Partial |
| 7. PHASE SHIFT | Alternating disruption | High during active, zero during dormant | Broken by dormant phase |
| 8. ECHO | Delayed probes | Low-medium (echoes may be irrelevant) | Solo flow + interruptions |

### The Proposals I Would Want to PLAY

**If I had 10 minutes and a friend sitting next to me, which of these would I choose?**

---

**First choice: 5. TUG-OF-FIELD.**

This is the proposal I would play for 10 minutes straight and then play again. The pressure line gives you a physical, spatial, intuitive sense of winning and losing at every moment. The push-counterpush rhythm creates natural rallies. The blast force scattering dots into the opponent's space IS the racquetball shot -- your action creates the board state they face. The comeback rubber-band (smaller field = higher density = bigger chains possible) prevents hopeless situations. The landscape-vs-portrait question is solvable (horizontal line in portrait mode works). The one-sentence explanation: "Chain dots to push the line past your opponent's edge." Seven words. No "and."

What sells it: the pressure line creates stakes for EVERY TAP. Every chain either pushes you forward or lets you slide back. There is no neutral action. In The Court, catching dots is just accumulation -- one more point, who cares. In Tug-of-Field, every push of the line is visible, spatial, and threatening. You SEE your territory expanding. You SEE your opponent's territory shrinking. The board IS the score, and the score IS the board. Splatoon's ink-as-territory principle, reduced to one dimension (the pressure line), executed on a phone screen.

The flow is continuous. Both players tap in real time. The line's position determines who has initiative. The blast force ensures your tap reshapes the field for both players. The rubber-band prevents snowball. The density escalation (continuous spawning) creates natural climax. It has everything.

---

**Second choice: 3. INFECTION.**

This is the proposal I would play for 10 minutes and then think about for an hour afterward. The conversion cascade is genuinely novel -- the chain IS the territorial sweep, and the depth of the cascade (how many enemy dots can you flip in one chain) is a new skill axis that layers onto the existing prediction depth. The field-as-score (ratio of blue to orange) is the best score encoding of any proposal. The Othello-in-real-time analogy is accurate and exciting.

What sells it: the conversion cascade creates the deepest prediction problem. You are not just predicting where dots will be -- you are predicting what COLOR cascade you can create, how deep the conversion will propagate, and whether the opponent can re-convert before you score the flipped dots. The decision to tap a small conversion now vs. wait for a bigger one later is the same timing tension as Tetris's "send garbage now or hold for a bigger attack." And the blast force disruption works beautifully here: your blast pushes enemy dots into your territory, setting up future conversions. Every tap has three consequences (score your dots, convert enemy dots, push survivors for future converts). This is Splatoon's triple-purpose action achieved with zero new input complexity.

The risk is the boundary-hunting degenerate case. If boundaries stabilize, the game narrows. But Chain Reaction's fluid dot movement may prevent this. Worth prototyping to find out.

---

**Third choice: 7. PHASE SHIFT (with a fix).**

I would NOT play the proposal as written because the dormant phase breaks flow. But if the dormant phase allowed tapping for a reduced purpose (e.g., dormant-phase taps push dots with blast force but do not catch or score them -- pure board manipulation), then Phase Shift becomes a two-mode game: aggressive scoring during active phase, strategic positioning during dormant phase. Both modes have agency. Both modes use the same one-tap input. The phase cycle creates the breathing rhythm that the game already values.

With the fix, Phase Shift's dual-purpose active-phase play (score my dots AND scatter their dormant dots) is the second-deepest competitive interaction after Infection's conversion cascades. The "sacrifice scoring to disrupt" decision is the purest form of the racquetball "sacrifice shot" in any proposal. But without the fix, the 4-5 second dormant window is a dealbreaker.

---

### What I Would NOT Play

**4. DENSITY RACE.** Not a competitive game. A parallel solo experience. No.

**2. KING OF THE HILL.** Interesting for 2 minutes, formulaic by minute 5. The zone-vs-field expected value calculation gets solved quickly and the game becomes rote.

**1. THE COURT.** I would play this once and then say "it is just racing to clusters." The competitive interaction is too thin. Scanning for the biggest cluster and tapping it before my opponent does is exciting for 30 seconds and boring by minute 3.

**6. STEAL.** The well-camping and turtling degenerate cases are too obvious. The wells-as-foreign-objects problem breaks the visual grammar. I would spend half my time worrying about my well instead of reading dot physics. The competitive layer distracts from the core game rather than deepening it.

**8. ECHO.** The 3-second delay is too long for the echoes to feel connected to the opponent's play. I would learn to ignore the echoes and play solo. If the echoes were strong enough to matter, they would disrupt my flow. The sweet spot does not exist.

---

### Final Ranking (Fun in My Hands for 10 Minutes)

1. **TUG-OF-FIELD** -- Push-counterpush. Pressure line as physical score. Every tap matters. Racquetball rhythm. Build this first.
2. **INFECTION** -- Conversion cascades as territory sweeps. Deepest prediction problem. Field-as-score. Othello-meets-Splatoon. Build this second.
3. **PHASE SHIFT (with dormant-phase agency fix)** -- Breathing rhythm. Dual-purpose disruption. Sacrifice shots. Build this third, only if the fix works.

Everything else is either too thin (Court, King of the Hill), too disconnected (Density Race, Echo), or too bolted-on (Steal) to sustain 10 minutes of engaged competitive play.
