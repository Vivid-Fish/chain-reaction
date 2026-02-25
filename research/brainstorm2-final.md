# Chain Reaction: Competitive Mode -- FINAL SPECIFICATION

## Date: 2026-02-23
## Author: Proposer (Final Round)

---

## 1. Elevator Pitch

Two players share one field of drifting dots, each colored blue or orange. Your explosions score your dots and **convert** the opponent's dots to your color -- and converted dots cascade as yours, flipping more. The field IS the scoreboard: whoever owns more dots when time runs out wins.

---

## 2. Rules

Five rules. Everything else is inherited from solo mode unchanged.

**Rule 1: Ownership.** Every dot on the field is either blue (Player A's) or orange (Player B's). New dots spawn 50/50 randomly colored. A dot's color is visible at all times.

**Rule 2: Scoring.** When your explosion catches a dot of YOUR color, that dot is scored (removed from the field, adds to your score, generates a cascade explosion at its position -- identical to solo).

**Rule 3: Conversion.** When your explosion catches a dot of the OPPONENT's color, that dot is not removed. Instead, it flips to YOUR color and immediately generates a cascade explosion as YOUR color. This cascade explosion can score more of your dots and convert more of theirs, propagating recursively through the normal chain resolution.

**Rule 4: Simultaneous play.** Both players tap the same field in real time, simultaneously. Each player has the same cooldown as solo continuous mode. There is no turn order, no alternation, no waiting.

**Rule 5: Win condition.** The match lasts 90 seconds. The player who has scored more dots wins. If the field overflows (reaches maxDots), the player with more scored dots at that moment wins. Ties are broken by current dot ownership ratio on the field.

---

## 3. Win Condition (Detailed)

**Primary:** Higher score (total dots removed from the field via scoring) at end of 90-second timer.

**Early termination:** If the field overflows, the match ends immediately. Higher score wins.

**Tiebreaker:** If scores are tied, the player who owns more dots currently on the field wins. If that is also tied, the match is a draw.

**Why 90 seconds:** Solo continuous mode sessions last 30-120 seconds. 90 seconds gives both players time to establish territorial patterns, execute multi-tap conversion strategies, and experience the natural density escalation that creates a climax. Shorter matches (60s) would favor aggressive early play. Longer matches (120s+) would dilute the pressure of the escalating spawn rate.

**Why score-based (not ownership-based):** A pure "who owns more dots" win condition incentivizes passive play -- you can win by converting dots and then not tapping (your converted dots stay yours if nobody touches them). Score-based forces active play: you must REMOVE dots to score, which means you are clearing the field, which keeps the game dynamic. Converting dots is a means to create scoring opportunities, not an end in itself.

---

## 4. The 30-Second Experience

Two intermediate players. 40 seconds into a 90-second match.

**0:00** -- The field is roughly 55% blue, 45% orange. Player A (blue) is ahead by about 15 scored dots. Player B (orange) scans the lower half of the field. They see 4 orange dots drifting toward a gravity dot -- but the gravity dot is blue. In 1.5 seconds, those 4 orange dots will cluster tightly around that blue gravity dot. Player B thinks: "If I tap that cluster when it tightens, I convert the gravity dot to orange. Then the gravity dot -- now mine -- keeps pulling. Those 4 orange dots are already mine, so they score. And the conversion cascade from the gravity dot might catch the 2 blue standards drifting nearby."

**0:04** -- Player B taps. The explosion catches 4 orange dots (scored) and 1 blue gravity dot (converted to orange). The gravity dot's conversion cascade explodes at its position as an orange explosion, catching 2 nearby blue standards and converting them. One of those converted standards cascades into a third blue dot. Total: 4 scored, 4 converted. Player B's corner of the field just went from contested to deep orange territory.

**0:06** -- Player A sees the orange advance. Their lower field is now hostile. But Player A notices something Player B missed: the blast force from Player B's explosion pushed 3 blue dots toward the center, where they are joining 2 more blue dots near a volatile dot (also blue). In about 1 second, that volatile dot will be surrounded by 5 blue dots in a tight formation. Player A thinks: "Volatile gives 1.5x radius on cascade. If I catch the volatile first, its explosion catches all 5. That is 6 scored. And the blast force will scatter the orange dots that Player B just converted, breaking up their new territory before they can score it."

**0:09** -- Player A taps the volatile cluster. 6 blue dots scored. The volatile cascade sends a wide shockwave that pushes Player B's freshly converted orange dots apart. Player B's territorial gain from 5 seconds ago is disrupted. Those 4 converted dots are still orange, but they are scattered -- no longer forming a scorable cluster.

**0:12** -- Player B's cooldown expires. They see their scattered orange dots. Rather than chasing them, Player B reads the field: upper-right has a natural color boundary where 3 orange and 3 blue dots are mixing, pulled together by dot drift. In 1.5 seconds, that mixed cluster will be tight enough for a single tap to convert the 3 blue dots AND score the 3 orange dots. Player B waits.

**0:15** -- Player B taps the mixed cluster. 3 orange scored, 3 blue converted. One of the conversions cascades into a 4th blue dot nearby. The upper-right is now deep orange. Player A, still on cooldown, watches and recalculates.

**0:15-0:30** -- Both players are in a rhythm: scan for mixed clusters, predict drift, time taps for maximum conversion cascade depth, read what the opponent's blast force did to the field. Every explosion from either player reshapes the color landscape. Neither player is idle. Between taps, they are reading dot colors, predicting drift, assessing which boundary zones will ripen into conversion opportunities.

**What they are thinking:** "Where is the color boundary shifting? Where will mixed clusters form? How deep will my conversion cascade propagate? Did their last blast push my dots somewhere useful or scatter them? Should I tap my own cluster to score, or that boundary to convert?"

---

## 5. Skill Progression

**Novice:** Taps their own color clusters to score. Ignores conversion. Ignores the opponent entirely. Plays solo mode with colored dots. Thinks: "I see a cluster of my color, I tap it." Fun factor: they are still playing Chain Reaction. The competitive layer is invisible. Bonus, not filter.

**Intermediate:** Discovers conversion. Begins tapping at color boundaries where both colors mix. Realizes that converting 5 opponent dots creates 5 future scoring opportunities. Starts thinking in two steps: "convert now, score later." Begins noticing when the opponent converts their dots. Thinks: "I want mixed clusters, not pure clusters. The boundary is where the action is."

**Expert:** Reads conversion cascade depth. Before tapping, traces the expected cascade propagation through the local color pattern: "Gen-0 catches 2 orange (convert), gen-1 from those conversions catches 3 more orange (convert), gen-2 catches 1 blue (score). Total: 5 conversions + 1 score." Begins using blast force intentionally: taps in locations that push opponent dots into unfavorable positions or push their own dots toward forming clusters. Reads the opponent's likely targets and pre-taps to deny conversion opportunities. Thinks: "If I convert these 3 now, the cascade will reach that cluster, AND the blast will scatter their forming group."

**Master:** Plays multi-tap sequences. Tap 1 is not optimized for immediate value -- it is optimized for what it sets up. Tap 1 converts 2 dots at the edge of a large orange territory, creating blue "seeds" inside enemy lines. Those seeds drift (predictably, because dots move predictably) toward a gravity dot. 3 seconds later, the seeds have clustered with the gravity dot. Tap 2 detonates the seed cluster, triggering a conversion cascade that sweeps through the surrounding orange territory. The master set this trap two taps ago. Thinks: "Where will these converted dots BE in 3 seconds, and what will they be adjacent to?" Also reads the opponent's tap patterns -- "They always target the lower-left boundary. I will convert a cluster in upper-right where they are not looking. I have 3 seconds before they notice."

---

## 6. How It Resolves the Central Tension

The Central Tension: shared board + simultaneous play + no turn-taking = "fastest finger wins."

Infection resolves this through **asymmetric targets**.

Both players see the same board. But they value DIFFERENT clusters. Player A wants blue-dense regions to score and blue-orange boundaries to convert. Player B wants orange-dense regions to score and the same boundaries to convert in the opposite direction. Only at the mixed boundary do both players compete for the exact same dots. Pure-color regions are uncontested -- your opponent cannot profitably tap deep inside your territory (they would score YOUR dots, not theirs -- wait, no: under the rules, their explosion only scores THEIR color. If they tap deep in your territory, their explosion catches your dots and converts them, but conversion requires the dots to be the opponent's color from the tapper's perspective).

Let me be precise. Player A (blue) taps a cluster deep in blue territory. The explosion catches blue dots -- those are Player A's color, so they score. If Player B (orange) taps that same cluster, the explosion catches blue dots -- those are the OPPONENT's color from Player B's perspective, so they convert to orange. Player B CAN profitably tap in blue territory (to convert), but the conversion yield depends on the cascade propagating through blue dots -- and deep in blue territory, all the cascading dots are blue, which means each cascade generation catches more blue dots to convert. So deep territory taps ARE valuable for conversion.

This means the Central Tension is resolved NOT by spatial separation (each player has "their side") but by **strategic asymmetry**: Player A tapping a blue cluster SCORES (removes dots, gains points). Player B tapping the same cluster CONVERTS (flips dots, gains territory but not immediate points). These are different value propositions from the same board state. The fastest finger does not win because both players are optimizing for different things at the same location.

Furthermore: conversion cascades propagate differently depending on the local color distribution. A tap at a 50/50 boundary cascades differently (alternating score and convert) than a tap in 90% enemy territory (deep conversion chain). The player who reads the color distribution more deeply gets more value from each tap, regardless of speed.

The cooldown (1.5-2.5 seconds between taps) further reduces speed advantages. With cooldowns offset by typical timing, both players have good tapping opportunities without racing to the same dot within milliseconds. The race is not "who taps this cluster first" but "which cluster does each player choose to tap, given that the opponent will also tap something."

---

## 7. Degenerate Strategy Defense

**What stops turtling (only tapping your own pure clusters, avoiding the boundary)?**

Turtling scores your dots but cedes territory. If you only score blue dots and never convert orange dots, the field gradually becomes more orange (new spawns are 50/50, but you are only removing blue dots). Over 90 seconds, a turtling player removes their own color from the field while the opponent's color accumulates. The opponent has increasing conversion cascade potential because your remaining dots are surrounded by their color. The turtler runs out of pure clusters to score because their territory shrinks. Turtling is self-defeating on a 90-second timescale.

**What stops pure aggression (only tapping deep in enemy territory to convert, never scoring)?**

You win by scoring dots, not by owning them. Conversion flips dots but does not remove them or add to your score. A pure converter owns the whole field but has zero points. You must SCORE (tap your own dots) to win. Conversion creates scoring OPPORTUNITIES (your freshly converted dots become your clusters), but you must follow up with scoring taps. Pure conversion without scoring loses.

**What stops "just tap as fast as possible" (greedy speed)?**

Cooldown enforces a minimum 1.5 seconds between taps. During that window, the board state evolves (dots drift, opponent taps, colors shift). The value of each tap depends on WHEN you tap within the cooldown window -- tapping the instant cooldown expires catches the current board state, but waiting 0.3 seconds might let a forming cluster tighten, increasing chain length by 2-3 dots. The greedy tapper who fires at cooldown expiry catches smaller chains than the patient tapper who waits for peak cluster formation. Additionally, the conversion cascade rewards positional reading over speed: a tap at the exact right spot in a mixed cluster might trigger a 10-deep conversion cascade, while a tap 30px away (the greedy "biggest visible cluster" position) only converts 3. Cascade depth rewards prediction precision, not tap speed.

**What stops boundary-hunting (always tapping the color boundary, ignoring everything else)?**

This is the most dangerous degenerate case (identified by the Expert as "real-time Othello boundary lock"). Three defenses:

1. **Dots move.** Unlike Othello's static board, dots drift continuously. Boundaries are fuzzy, shifting, and impermanent. A "boundary" at time T is a scattered mix at time T+2. There is no stable front line to camp.

2. **Blast force disrupts boundaries.** Every tap scatters surviving dots via blast force. A boundary tap breaks up the boundary itself, pushing dots into pure-color regions. The boundary re-forms elsewhere as dots drift and mix. You cannot camp a position that your own taps destroy.

3. **Scoring requires pure clusters.** Boundary taps produce a mix of scores and conversions. But points come from scoring (removing your dots), which is most efficient in pure clusters of your color. A boundary-only player converts efficiently but scores inefficiently. The balanced player alternates: convert at boundaries, then score the resulting pure clusters before they drift apart.

---

## 8. What Changes in the Engine

**Minimal changes to game-core.js:**

1. **Dot ownership property.** Each dot gets a `.owner` field: `'a'` or `'b'`. Visually rendered as blue hue or orange hue, applied as a tint over the existing dot type visual (a gravity dot owned by Player A is purple with a blue tint; owned by Player B, purple with an orange tint). The hue must be distinguishable from the existing type colors. Accessibility: add a secondary encoding (subtle pattern overlay or shape indicator) for color-blind players.

2. **Explosion ownership.** Each explosion inherits the owner of the player who tapped (for gen-0) or the owner of the dot that was caught (for cascade). This determines whether caught dots are scored or converted.

3. **Conversion logic in chain resolution.** In `resolveChain()`, when an explosion owned by Player A catches a dot owned by Player B: instead of removing the dot and scoring, flip the dot's `.owner` to `'a'` and generate the cascade explosion as Player A's. The dot remains on the field. If the explosion catches a dot of the SAME owner, normal scoring occurs (remove dot, add to score, generate cascade). This is the single mechanical change: one branch in the catch logic.

4. **Spawn coloring.** New dots spawned from edges are assigned randomly to Player A or Player B with 50/50 probability. Spawning rate, position, and physics are unchanged from continuous mode.

5. **Second tap input.** The field must accept taps from two players. On a single device: split the field vertically -- left half taps are Player A, right half taps are Player B. (Or use separate devices via network sync, but the first prototype should be same-device.) Each player has an independent cooldown timer.

6. **Match timer.** 90-second countdown. Display as a thin bar at the screen edge (same visual language as the density bar in continuous mode). At match end, compare scores.

**What does NOT need to change:** Dot physics, boid flocking, wall bounces, cascade momentum, gen cap, explosion radius, hold time, dot types (gravity, volatile), spawn patterns, blast force, the entire rendering pipeline, audio system, particle effects.

---

## 9. What Does NOT Change

Everything from solo mode, specifically:

- Dot physics: movement, drift, wall bouncing, velocity, boid-like flocking behavior
- Explosion mechanics: radius (0.10 base), hold time, grow/shrink animation
- Cascade mechanics: momentum (+8% radius/gen, +200ms hold/gen), gen cap at 4
- Dot types: standard, gravity (pull), volatile (1.5x radius) -- these interact with ownership naturally (a converted gravity dot now pulls for the new owner's benefit)
- Blast force: surviving dots pushed away from explosion center, inverse-power falloff
- Spawn mechanics: edge spawning, density pressure, continuous mode spawn rate escalation
- Input model: one tap per cooldown, tap position and timing are the only decisions
- Visual language: dot rendering, explosion rings, cascade trails, particle effects, connection lines
- Audio: chain-as-music system, position-to-pitch, generation-to-instrument
- The core loop: scan -> predict -> tap -> watch cascade -> scan again

The competitive layer is a PROPERTY (ownership) added to existing objects (dots) with a single new BEHAVIOR (conversion instead of scoring when catching an opponent's dot). Everything else is inherited.

---

## 10. First Prototype Test

**The one thing to build first:** A same-device two-player mode where the left half of the field is Player A's tap zone and the right half is Player B's tap zone. Both players share one phone held in landscape, each tapping their half.

**Minimal implementation:**
1. Add `.owner` to dots (random 50/50 at spawn). Render as blue or orange tint.
2. Add `.owner` to taps (left half = A, right half = B).
3. In chain resolution: if explosion owner != dot owner, flip dot owner and cascade as new owner instead of removing.
4. Display score for each player as a small number at their screen edge. (Yes, this is a UI element. For the prototype, readability trumps purity. The field-as-scoreboard is validated by glancing at the blue/orange ratio, but the prototype needs explicit scores to verify the mechanic works.)
5. 90-second timer.

**What to validate:**
- Do conversion cascades FEEL good? Does flipping 5 enemy dots in one chain produce a satisfying visual sweep of color change?
- Do both players have interesting decisions throughout the match, or does one player run away early?
- How often do both players target the same cluster within 500ms? (Simultaneity Paradox measurement. Target: <20%.)
- Does the color ratio swing wildly (too volatile) or stagnate (too stable)? Target: the field should oscillate between 40/60 and 60/40, with occasional swings to 30/70 from a well-placed conversion cascade.
- Does boundary hunting dominate, or do players naturally mix boundary and interior taps?
- Is the conversion cascade depth readable? Can the player trace why 8 dots flipped from one tap?

**What to defer:** Network multiplayer, accessibility patterns, audio for conversion events, visual polish for ownership tints, matchmaking, ranking. All of these matter. None of them matter until the core interaction -- "my explosion flips your dots" -- feels right.

---

## Kill Criteria Survival Check

| Criterion | Status | Evidence |
|-----------|--------|----------|
| K1: Not turn-based | PASS | Both players tap simultaneously in real time. No alternation, no waiting. |
| K2: Flow state preserved | PASS | Player is always scanning for mixed clusters, predicting drift, timing taps for peak cascade depth. Between taps (cooldown), the player is reading the color landscape that the opponent's last tap reshaped. No idle moment. |
| K3: One tap input only | PASS | Identical to solo. Tap where and when. Conversion is an automatic consequence of catching opponent dots. |
| K4: No added unpredictability | PASS | Conversion is deterministic (caught by your explosion = converts). Initial color assignment is seeded PRNG (same as spawn positions). Cascade propagation is deterministic. |
| K5: No UI reading required | PASS | The dot colors ARE the competitive state. Blue/orange ratio visible at a glance. No meters, no bars, no numbers needed during play. (Timer at screen edge is ambient, like a clock on the wall -- you feel time pressure from density escalation, not from reading the timer.) |
| K6: Shared board | PASS | One field. Both players see and act on the same dots. |

---

## Constraint Checklist

- Total new rules: **3** (ownership, conversion, scoring). Rules 4 and 5 (simultaneous play, win condition) are structural, not mechanical. Under the 5-rule budget.
- One tap input: **yes**. No new inputs.
- All competitive state visible on playfield: **yes**. Dot colors encode ownership. Score is approximated by visual color ratio. Timer is ambient.
- Survives the racquetball test: **yes**. Your tap reshapes the color landscape that the opponent must now read and respond to. The conversion cascade IS your shot. The resulting board state IS where the ball landed.
- Survives the flow test: **yes**. The scan-predict-tap loop is identical to solo, enriched by color reading. No dead time, no waiting, no spectating.
- New rules <= 5: **yes** (3 mechanical rules).

---

## Summary

Infection adds one concept to Chain Reaction -- dot ownership -- and derives the entire competitive interaction from how that concept interacts with the existing cascade mechanics. Your explosion flips their dots. Flipped dots cascade as yours. The field IS the score. The depth comes from reading color patterns, predicting conversion cascade propagation, and using blast force to reshape territory. The feel is real-time Othello on a moving board, with Splatoon's "the field IS the scoreboard" legibility and Tetris's "every action is simultaneously offense and defense."

Build the prototype. Validate the core interaction. Everything else follows.
