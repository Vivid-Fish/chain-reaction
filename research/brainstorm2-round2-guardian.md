# Constraint Guardian: Round 2 Evaluation of 8 Competitive Mode Proposals

## Date: 2026-02-23
## Role: Constraint Guardian (Round 2 — Evaluation)
## Inputs: brainstorm2-guardian.md (my framework), brainstorm2-proposer.md (8 proposals), brainstorm2-expert.md (reference analysis)

---

## Methodology

Each proposal is evaluated against:
1. **Kill criteria (K1-K6)** — binary pass/fail. One fail = DEAD.
2. **Anti-pattern check (AP1-AP8)** — severity rating (none / mild / moderate / severe).
3. **6-dimension scoring** (1-10 each). Below 4 on any dimension = disqualifying.
4. **Central Tension test** — does it resolve "shared board + simultaneous = fastest finger wins"?
5. **Verdict**: KILL, WEAK, STRONG, or PROTOTYPE-NOW.

I am applying these criteria with zero mercy. The prior brainstorm produced a design that scored well on "strategic depth" and was fundamentally unplayable as a flow-state game. I will not repeat that mistake in the other direction — a proposal that flows beautifully but has no interaction or no skill differentiation is equally dead.

---

## PROPOSAL 1: THE COURT

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | PASS | Simultaneous, continuous. |
| K2 (Breaks flow) | PASS | Continuous density pressure forces constant engagement. Cooldown is 1.5s, during which scanning and predicting is the action. |
| K3 (Extra inputs) | PASS | One tap. |
| K4 (Unpredictability) | PASS | Same physics. "Contested" dots (simultaneous reach) are deterministic given timing. |
| K5 (UI reading) | **BORDERLINE** | The "subtle background tint" encoding score is acceptable — it is ambient, not parsed. But if the tint is too subtle, players will need a number somewhere. If it is too strong, it becomes distracting. I'll pass this conditionally. |
| K6 (Separate boards) | PASS | Shared board. |

**Survives kill criteria: YES (conditionally on score encoding).**

### Anti-Pattern Check

| Anti-Pattern | Severity | Notes |
|--------------|----------|-------|
| AP1 (Spectator Trap) | Mild | Cascades take 1-3s. During your cascade, you are watching, not tapping. But you're on cooldown anyway (1.5s), so the cascade viewing overlaps with natural scan time. Problem only if cascades exceed cooldown duration significantly. |
| AP2 (Reaction Speed Ceiling) | **SEVERE** | This is the proposal's critical weakness. On a shared board, both players see the same clusters. The player who taps the big cluster 200ms faster gets the dots. The Proposer acknowledges this and waves at "cooldown" as the fix, but cooldown does not solve it — it just spaces out the races. Every 1.5 seconds, both players race to identify and tap the best cluster. The person with faster pattern recognition wins, not the person with deeper prediction. |
| AP3 (Parallel Solitaire) | None | Shared board creates direct interaction. |
| AP4 (Complexity Cliff) | None | Simplest possible competitive layer. One sentence: "Whoever catches more dots wins." |
| AP5 (Degenerate Strategy) | **Moderate** | Greedy strategy (always tap the biggest visible cluster as fast as possible) is likely near-optimal. The Proposer's argument that "the expert taps where the opponent isn't looking" requires that opportunity density be high enough to support this. If it isn't, greedy-fast beats clever-slow. |
| AP6 (UI Gaze Tax) | None | Background tint is ambient. |
| AP7 (Simultaneity Paradox) | **SEVERE** | Directly applies. Two players, same clusters, same timing. The Proposer argues cooldown creates natural interleaving, but this only means the races happen at 1.5s intervals instead of continuously. Each cooldown expiry is a race. |
| AP8 (Bolt-On) | None | Minimal addition to solo. |

### 6-Dimension Scoring

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Flow Continuity | 8 | Continuous play. Brief cascade viewing during natural cooldown. No waiting for opponent. |
| Interaction Density | 7 | Every tap changes the board both players see. Shared field ensures high interaction. |
| Skill Differentiation | 4 | **Critical weakness.** Prediction depth is undercut by the Reaction Speed Ceiling. The faster reader wins, not the deeper reader. The Proposer's "opponent attention modeling" skill layer is real but thin — you can infer the opponent's cooldown state and recent tap position, but this is a minor advantage compared to "I identified the cluster 100ms faster." |
| Input Simplicity | 10 | Identical to solo. |
| Readability | 9 | One visual addition (color-coded explosions). Clean. |
| Emergent Depth | 5 | The single rule (whoever catches more wins) is elegant but may not produce enough strategic variety. Without asymmetric valuation or persistent effects, the game is "spot the biggest cluster first, repeat." The cooldown creates SOME timing strategy but not enough distinct situations. |

**Composite: Average 7.2, but Skill Differentiation at 4 is borderline disqualifying.**

### Central Tension Test

**Does not resolve it.** The Proposer acknowledges the speed-vs-depth problem and proposes cooldown as the fix. Cooldown reduces the tap rate but does not change the fundamental dynamic: at each decision point, both players see the same clusters and race to the best one. The Central Tension demands structural resolution — making both players' taps valuable even when targeting the same area, or creating enough distributed opportunities that racing is rare. This proposal does neither. It relies on opportunity density being high enough that "there's always a good cluster for both players," but this is an assumption, not a mechanism.

### Verdict: WEAK

The simplicity is genuinely appealing. This could be a valid "minimum viable competitive mode" for testing whether shared-board real-time play works at all. But as a final design, the Reaction Speed Ceiling is a structural flaw that cooldown does not fix. The proposal needs a mechanism that makes prediction depth more valuable than identification speed.

---

## PROPOSAL 2: KING OF THE HILL

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | PASS | Simultaneous. |
| K2 (Breaks flow) | PASS | Continuous play. Hot zone creates pull. |
| K3 (Extra inputs) | PASS | One tap. |
| K4 (Unpredictability) | PASS | Hot zone path is deterministic and visible. |
| K5 (UI reading) | **BORDERLINE** | "Score threshold shown as a thin progress bar at screen edge" — this is a UI element. The hot zone itself is on-field (good), but the progress bar is a HUD element. If optimal play requires checking how close you are to the threshold to decide whether to contest the zone vs. harvest the field, this fails K5. I'll flag it but not kill it — the bar could be ambient enough. |
| K6 (Separate boards) | PASS | Shared board. |

**Survives kill criteria: YES (conditionally).**

### Anti-Pattern Check

| Anti-Pattern | Severity | Notes |
|--------------|----------|-------|
| AP1 (Spectator Trap) | Mild | Same cascade overlap as Proposal 1. |
| AP2 (Reaction Speed Ceiling) | **Moderate** | The hot zone creates a focal point where BOTH players converge. Inside the zone, it is a speed race for the same 3x dots. Outside the zone, it is Proposal 1's speed race for 1x dots. The expected-value argument is interesting but formulaic — once both players learn the math, the zone vs. field decision becomes rote. |
| AP3 (Parallel Solitaire) | None | Shared space with contested focal point. |
| AP4 (Complexity Cliff) | Mild | Two concepts: "catch dots" + "dots in the zone are worth more." Still simple. |
| AP5 (Degenerate Strategy) | **Moderate-to-Severe** | The Proposer identifies this: the expected-value math is solvable. Contested zone taps are worth ~1.5x (3x split by two). Uncontested field taps are worth 1x. Once a player realizes that ignoring the zone and harvesting the field is often correct, the hot zone becomes irrelevant. If BOTH players do this, the game degenerates to Proposal 1. If one player always takes the zone and the other always harvests the field, the field harvester likely wins because they get uncontested 1x while the zone chaser gets contested 1.5x. The strategy "ignore the hot zone" may dominate. |
| AP6 (UI Gaze Tax) | Mild | The hot zone trajectory line is a visual element on the field, which is acceptable. The progress bar at screen edge is a mild tax. |
| AP7 (Simultaneity Paradox) | **Moderate** | The hot zone creates a convergence point that INCREASES the Simultaneity Paradox compared to Proposal 1. Both players want the same zone dots. The hot zone is a speed race with a neon sign pointing to the racing location. |
| AP8 (Bolt-On) | **Moderate** | The hot zone does not exist in solo mode. It is a new game object with new rules (deterministic drift, 3x multiplier, trajectory display). A player who plays solo does not practice reading hot zone paths. This is a bolt-on system. |

### 6-Dimension Scoring

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Flow Continuity | 8 | Same as Proposal 1. Continuous play. |
| Interaction Density | 6 | The hot zone creates one shared focal point, but outside the zone, interaction is the same as Proposal 1. The interaction is concentrated in space (zone) rather than distributed across the field. |
| Skill Differentiation | 5 | Prediction of zone path + dot convergence inside zone. But the EV calculation is solvable, and once solved, the decision becomes "is there a big cluster in the zone right now?" — which is a speed race, not a prediction race. |
| Input Simplicity | 9 | One tap. But the zone trajectory display adds visual information the player must track. |
| Readability | 7 | Hot zone + trajectory line + progress bar. Three new visual elements on a shared board. Parseable but busier than Proposal 1. |
| Emergent Depth | 4 | **Disqualifying.** The hot zone creates a binary decision (zone vs. field) that is solvable via EV math. Once solved, the game degenerates. The zone's interaction with dot types (gravity, volatile) is unexplored and might rescue this, but as proposed, the depth is shallow. |

**Composite: Average 6.5, with Emergent Depth at 4 (borderline disqualifying).**

### Central Tension Test

**Worsens it.** The hot zone CONCENTRATES the Simultaneity Paradox into a smaller area. Instead of both players racing to the best cluster anywhere on the field, they race to the best cluster in the zone. The zone is a spotlight on the problem.

### Verdict: WEAK

The hot zone is a bolt-on system that creates a solvable binary decision and concentrates the Simultaneity Paradox. The Proposer correctly identifies these issues in their own Tier 3 ranking. I agree: this is structurally limited.

---

## PROPOSAL 3: INFECTION

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | PASS | Simultaneous, continuous. |
| K2 (Breaks flow) | PASS | Constant scanning for conversion opportunities. The board state shifts with every explosion from either player. |
| K3 (Extra inputs) | PASS | One tap. Conversion is an automatic consequence. |
| K4 (Unpredictability) | PASS | Same physics. Initial color distribution is random but seeded — equivalent to dot spawning, which is already accepted. Conversion is deterministic. |
| K5 (UI reading) | PASS | The dot colors ARE the score. The field IS the scoreboard. No HUD element needed. This is the strongest K5 performance of any proposal. |
| K6 (Separate boards) | PASS | Shared board. |

**Survives kill criteria: YES.**

### Anti-Pattern Check

| Anti-Pattern | Severity | Notes |
|--------------|----------|-------|
| AP1 (Spectator Trap) | Mild | Same cascade timing as all shared-board proposals. |
| AP2 (Reaction Speed Ceiling) | **Mild-to-Moderate** | Here is where Infection gets interesting. The speed ceiling is REDUCED compared to Proposal 1 because players are not always racing for the same clusters. Player A wants blue-dense clusters; Player B wants orange-dense clusters. The board is color-segmented — each player has "their" targets. The race happens only at the boundary where colors mix. This naturally distributes attention across the field. However, conversion (catching opponent dots to flip them) DOES create contested boundary zones where both players want to tap. At the boundary, speed matters. But the boundary is a subset of the field, not the entire field. |
| AP3 (Parallel Solitaire) | None | Deep interaction. Your conversion changes what your opponent can score. Your cascade through their territory is a direct attack. |
| AP4 (Complexity Cliff) | Mild | Two concepts: "catch your color to score" + "catch their color to convert." But can I say it in one sentence without "and"? "Your explosions score your dots while converting theirs." That has a "while" doing the work of "and." It's two concepts. Mild concern but the visual encoding (color) makes both concepts instantly parseable. |
| AP5 (Degenerate Strategy) | **Mild** | Is "always convert at the boundary" dominant? Probably not, because scoring your own dots is also necessary to win. The tradeoff between "score my dots" and "convert their dots" is situational and depends on local color ratios, cluster sizes, and cascade potential. A greedy player who only taps their biggest cluster ignores conversion. A boundary-only player ignores scoring. Both lose to the player who reads the board and picks the highest-value tap considering both dimensions. This is healthy strategic tension. |
| AP6 (UI Gaze Tax) | None | Zero. The field IS the score. Best in class. |
| AP7 (Simultaneity Paradox) | **Mild** | The paradox is reduced because both players want DIFFERENT dots (their own color). They only compete directly at mixed-color boundaries. With 50/50 color distribution, roughly half the field is "yours" and half is "theirs" — you race at the boundary, not everywhere. If boundary clusters are 20-30% of all clusters, only 20-30% of taps are contested. This is within the acceptable range (<20% is ideal, 20-30% is manageable). |
| AP8 (Bolt-On) | **Mild** | Dot colors exist in solo via the type system, but colored ownership is a new concept. In solo, a red dot and a blue dot behave differently due to type properties (gravity, volatile). In Infection, color means "who owns this dot." This is a semantic overlay on existing visuals, not a new physics system. The conversion mechanic is new but uses existing explosion-catching mechanics. Mild bolt-on. |

### 6-Dimension Scoring

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Flow Continuity | 8 | Continuous play. Same cooldown-cascade overlap as other shared-board designs. |
| Interaction Density | 9 | **Strongest of all proposals.** Every explosion that converts dots changes the opponent's scoring landscape. Your chain through their territory flips dots they were planning to score. Their chain through your territory flips yours. The conversion cascade mechanic (flipped dots explode as YOUR color, catching more of THEIR dots) means a single well-placed tap can ripple across the field, converting a swath. Every tap from either player meaningfully alters what the other player should do. |
| Skill Differentiation | 8 | **The prediction axis is ENRICHED, not diluted.** In solo, you predict "where will dots converge?" In Infection, you predict "where will MY-colored dots converge?" AND "where is a mixed zone where one tap converts 5+ enemy dots?" AND "where is my opponent likely to tap, so I can pre-tap the boundary to deny their conversion cascade?" The conversion cascade adds a prediction layer that is genuinely new: you must predict not just the explosion radius but the CHAIN PROPAGATION COLOR — each generation may flip more dots, and the resulting territory shift depends on the local color ratio at each generation's radius. A player who reads color distribution 2 seconds out beats a player who reads 0.5 seconds out. |
| Input Simplicity | 10 | One tap. Conversion is automatic. Zero new inputs. |
| Readability | 8 | Dot colors encode competitive state directly. A spectator immediately sees "more blue = blue is winning." One new visual concept (color = ownership) that integrates with existing dot rendering. The concern is color-blindness accessibility — the Proposer flags this. Solvable with pattern overlays (stripes vs. solid) or shape differences, but must be designed carefully. |
| Emergent Depth | 9 | **This is where Infection shines.** The conversion mechanic interacts with EVERY existing system: (a) Boid flocking — dots of the same color flock together, creating natural territorial clusters that shift as conversions happen. Wait: do same-colored dots flock, or do same-typed dots flock? If color = type, this is profound. If color is independent of type, flocking is unaffected by conversion. The Proposer does not clarify this. I'll assume color is a new property independent of type. Even so: (b) Cascade momentum — a conversion cascade that chains through mixed territory produces emergent territory shifts that neither player scripted. (c) Gravity dots — a gravity dot that gets converted now pulls enemy dots into YOUR territory, fundamentally reshaping the flow. (d) Wall bounces — dots converted at the edge drift differently than dots converted at center. The number of distinct competitive situations is very large because the color distribution is a high-dimensional state that changes with every tap. |

**Composite: Average 8.7. All dimensions 8+. This is S-tier on the rubric.**

### Central Tension Test

**Resolves it elegantly.** The Central Tension is "shared board + simultaneous = fastest finger wins." Infection resolves it by creating ASYMMETRIC TARGETS. Both players see the same board, but they value different clusters — Player A wants blue-dense areas, Player B wants orange-dense areas. They race only at mixed boundaries, which are a fraction of the field. This structural asymmetry means that prediction depth (reading the color landscape, anticipating conversion cascades, predicting which boundary zones will become profitable) matters more than raw identification speed. The fastest finger wins at the boundary, but the deepest reader wins the match by choosing WHICH boundary to contest and WHEN.

### Verdict: PROTOTYPE-NOW

Infection is the strongest proposal by a significant margin. It satisfies every kill criterion cleanly, triggers no anti-pattern at severe level, scores 8+ on all six dimensions, and resolves the Central Tension through structural asymmetry rather than mechanical patches. The conversion cascade mechanic is genuinely novel — I have not seen this exact pattern in any competitive game I've analyzed. The field-as-scoreboard encoding is the best K5 solution of any proposal.

**Critical questions for prototyping:**
1. How does color interact with the existing type system (gravity, volatile)? Color must be independent of type, or the type system breaks.
2. Color-blindness accessibility requires a non-color encoding channel (pattern, shape, or icon overlay).
3. What is the conversion rate in practice? If one player gets a massive conversion cascade early, is the game effectively over? There may need to be a natural color-rebalancing mechanism (new spawns are 50/50, keeping the total color ratio from becoming too extreme).
4. Does the 50/50 initial distribution create enough mixed boundary zones? If colors spawn in clusters rather than randomly, boundaries may be too sparse initially.

---

## PROPOSAL 4: DENSITY RACE

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | PASS | Simultaneous. |
| K2 (Breaks flow) | PASS | Identical to solo continuous mode. |
| K3 (Extra inputs) | PASS | One tap. |
| K4 (Unpredictability) | PASS | Mirrored seeds. |
| K5 (UI reading) | PASS | Ghost silhouette, not numbers. |
| K6 (Separate boards) | **FAIL** | Each player has their own field. The ghost overlay is purely visual — zero mechanical interaction. The kill criterion says "Default assumption: separate boards fail. Must demonstrate that interaction density is high enough without shared space." The ghost overlay creates ZERO interaction density. Player A's taps have ZERO effect on Player B's physics. This is literally parallel solitaire with a ghost. |

**Survives kill criteria: NO. K6 kills it.**

### Anti-Pattern Check (for completeness)

| Anti-Pattern | Severity | Notes |
|--------------|----------|-------|
| AP3 (Parallel Solitaire) | **SEVERE** | This IS parallel solitaire. The Proposer acknowledges it: "A player who ignores the ghost plays identically to solo mode." The proposal adds "no new skill axis." The ghost is psychological, not mechanical. Two treadmills. |

### Verdict: KILL

The Proposer ranks this last (Tier 3) and correctly identifies the fatal flaw: zero mechanical interaction. The ghost overlay is a nice UI feature for a future spectator mode, but it is not a competitive mode. It fails K6 and is the textbook definition of Anti-Pattern 3 (Parallel Solitaire).

---

## PROPOSAL 5: TUG-OF-FIELD

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | PASS | Simultaneous, continuous. |
| K2 (Breaks flow) | PASS | Pressure line is always moving. Always pushing or defending. |
| K3 (Extra inputs) | PASS | One tap. |
| K4 (Unpredictability) | PASS | Pressure line movement is deterministic from chain length. Rubber-band spawning is deterministic. |
| K5 (UI reading) | **BORDERLINE** | The pressure line IS the score, and it's a physical object on the field — this is good. But does optimal play require reading the pressure line's exact position? Yes: the Proposer describes "reads the pressure line's position and adjusts aggression." The pressure line is not ambient — it is decision-critical. However, it's a spatial element on the playfield, not a HUD element. It's analogous to the net in tennis — you see it in your peripheral vision while watching the ball. I'll pass this, but it's close. |
| K6 (Separate boards) | PASS | Shared board (landscape). |

**Survives kill criteria: YES.**

### Anti-Pattern Check

| Anti-Pattern | Severity | Notes |
|--------------|----------|-------|
| AP1 (Spectator Trap) | Mild | Same cascade timing. |
| AP2 (Reaction Speed Ceiling) | **Moderate** | The shared board near the pressure line is contested. Both players want to chain near the line to push it. Speed matters for contested central dots. However, the territorial asymmetry (you primarily tap YOUR side) reduces the racing compared to Proposal 1. |
| AP3 (Parallel Solitaire) | None | Deep interaction through the pressure line and shared central zone. |
| AP4 (Complexity Cliff) | Mild | One sentence: "Chain on your side to push the divider toward your opponent." One concept. Clean. |
| AP5 (Degenerate Strategy) | **Mild** | "Always chain the biggest cluster on your side" is a strong strategy. But the pressure line's position creates situational variance — when ahead, you have more field (more clusters, easier chains) and the opponent has less. The rubber-band creates some strategic tension. However, the rubber-band (fewer spawns when losing) may actually make comebacks TOO hard if the leading player has more field = more clusters = pushes faster. Positive feedback loop concern. Or it may make comebacks TOO easy if the rubber-band is strong. Needs simulation. |
| AP6 (UI Gaze Tax) | None | Pressure line is on-field, spatial, peripheral-readable. |
| AP7 (Simultaneity Paradox) | **Mild** | Players primarily act on their own side. The contested zone is the center strip near the pressure line. If the line is near center, both players compete for central dots. If the line is pushed to one side, the winning player has the field mostly to themselves. The paradox is present but spatially localized and varies with game state. |
| AP8 (Bolt-On) | **Moderate** | The pressure line, landscape orientation, spawn asymmetry (fewer spawns for the losing side), and push-back mechanic are all competitive-only systems. Solo mode has no pressure line, no landscape orientation, no asymmetric spawning. A solo player enters competitive mode and encounters multiple new concepts. This is more bolt-on than Infection. |

### 6-Dimension Scoring

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Flow Continuity | 8 | Continuous play with constant pressure. The pressure line's slow drift back to center creates urgency to keep pushing. |
| Interaction Density | 7 | Every chain pushes the line, affecting both players' territory. Center-zone chains directly contest shared dots. But interactions are mediated through the pressure line — your tap affects your opponent's SITUATION (territory), not their BOARD STATE directly (unlike Infection where conversion changes specific dots). The interaction is structural, not physical. |
| Skill Differentiation | 7 | Positional awareness (where is the line?), territory management (chain efficiently on your side), and center-zone prediction (contest the shared space). The prediction axis includes reading the opponent's side density to predict when a push is coming. This is richer than Proposal 1 but shallower than Infection. |
| Input Simplicity | 9 | One tap. But the landscape orientation is a mode change from the game's portrait identity, which adds a cognitive adjustment. |
| Readability | 7 | Pressure line + spawn asymmetry + landscape orientation. The pressure line is immediately readable ("my side is shrinking, I'm losing"). But landscape orientation on mobile may halve effective screen estate for dots if players hold the phone in portrait. The Proposer acknowledges this and suggests portrait with a horizontal line, but that is a different proposal than what's described. |
| Emergent Depth | 6 | The pressure line creates a tug-of-war dynamic with moderate variety. The center zone where dots from both sides intermingle creates interesting chain opportunities. But the game state is largely captured by one number (pressure line position), which limits the number of qualitatively different situations. Compare to Infection where the color distribution is high-dimensional. |

**Composite: Average 7.3. All dimensions 6+. This is A-tier.**

### Central Tension Test

**Partially resolves it.** The territorial split (you primarily tap YOUR side) reduces the Simultaneity Paradox compared to Proposal 1. Players are not racing to the same clusters most of the time — they each have their own territory. The contested center zone IS a speed race, but it's a small fraction of the total play area. However, the resolution is spatial (you play on different parts of the board) rather than structural (you want different things from the same parts of the board, as in Infection). This means the interaction density at the boundary is still a speed race, and most play is "solo on your half." The competitive interaction is mediated through the pressure line, not through direct board-state manipulation.

### Verdict: STRONG

Clean design with a universally understood metaphor (air hockey). The pressure line is a good score encoding. The territorial split partially resolves the Central Tension. Weaknesses: bolt-on complexity (landscape, asymmetric spawning, pressure line mechanics), lower emergent depth than Infection, and the positive feedback loop concern (winning player gets more field = easier chains = wins faster). Would benefit from simulation to test rubber-band calibration.

---

## PROPOSAL 6: STEAL

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | PASS | Simultaneous, continuous. |
| K2 (Breaks flow) | PASS | Constant tension between scoring and raiding. |
| K3 (Extra inputs) | PASS | One tap. Stealing is an automatic consequence of cascade reaching the well. |
| K4 (Unpredictability) | PASS | Same physics. Steal radius is deterministic. |
| K5 (UI reading) | **BORDERLINE** | "Score wells are physical objects on the field. Their size IS the score." This is borderline. The wells are new game objects that must be visually tracked. Optimal play requires assessing both wells' sizes to decide whether to harvest (grow mine) or raid (shrink theirs). This is a spatial assessment, not a number read, but it IS a competitive-only visual element that demands attention. Does the player need to divert attention from dots to wells? Yes — the well positions affect cascade planning. The well is decision-relevant information that is NOT dot physics. I'll pass this because the wells are ON the field, but it's a significant visual addition. |
| K6 (Separate boards) | PASS | Shared board. |

**Survives kill criteria: YES.**

### Anti-Pattern Check

| Anti-Pattern | Severity | Notes |
|--------------|----------|-------|
| AP1 (Spectator Trap) | Mild | Same cascade timing. |
| AP2 (Reaction Speed Ceiling) | **Moderate** | Same shared-board speed race as Proposal 1, with the added wrinkle that cascade paths to the opponent's well add a second optimization dimension. Speed still matters for the base dot-catching. |
| AP3 (Parallel Solitaire) | None | Deep interaction through well-stealing. |
| AP4 (Complexity Cliff) | **Moderate** | "Catch dots to grow your well. Your cascade reaching the opponent's well steals their points." This is two concepts, but the "steal" mechanic is a new concept with non-obvious implications (percentage-based, depends on cascade generation, well size affects steal amount?). The Proposer describes "15% steal" — where does this number come from? How does the player learn this rate? This has cliff potential. |
| AP5 (Degenerate Strategy) | **Moderate** | Is "always raid the opponent's well" dominant? Or is "always harvest" dominant? If raiding requires a cascade that reaches across the field to the opponent's corner, it requires a long chain, which requires a dense cluster on a path toward the well. This may be rare. If it is rare, the game is mostly "harvest" with occasional steal attempts, which means the steal mechanic is infrequent and the game is mostly Proposal 1 with wells. If raiding is easy, the game becomes "always raid" and harvesting is pointless because whatever you accumulate gets stolen. Either extreme degenerates. |
| AP6 (UI Gaze Tax) | **Mild-to-Moderate** | The wells are spatial but they ARE non-dot objects that demand attention. The player must track two wells + the dot field. Three focal areas. This is a gaze tax compared to Infection (where the competitive state IS the dots) or even Proposal 1 (where the competitive state is just dot catching). |
| AP7 (Simultaneity Paradox) | **Moderate** | Same as Proposal 1 for dot catching. The steal mechanic does not worsen or improve the paradox — it's a consequence of cascades, not a direct simultaneous contest. |
| AP8 (Bolt-On) | **SEVERE** | The score wells are entirely new game objects. They do not exist in solo mode. They have no analog in the existing physics (dots, explosions, cascades, types, flocking). They are physical objects with unique visual representation, interaction rules (cascade reaches well = steal), and strategic implications. A solo player entering competitive mode encounters a fundamentally new concept that has zero relationship to their solo practice. This is the Proposer's own critique: "wells are a new word from a different language." I agree entirely. |

### 6-Dimension Scoring

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Flow Continuity | 7 | Continuous, but the need to track wells in addition to dots splits attention. The player is managing two tasks (dot catching + well defense/raiding) which may create micro-pauses as they switch focus. |
| Interaction Density | 7 | Well-stealing creates interaction, but it's infrequent (requires long cascade reaching the corner). Most taps are normal dot-catching with no steal consequence. Interaction is bursty, not continuous. |
| Skill Differentiation | 6 | Cascade geometry reading (can this chain reach the opponent's well?) is a genuine prediction skill. But the difficulty of manufacturing a steal (must create a chain that physically reaches across the field to the corner) may make steals feel lucky rather than skillful. |
| Input Simplicity | 8 | One tap, but two new passive objects (wells) to monitor. |
| Readability | 5 | Two wells (pulsing circles of different sizes) + color-coded explosions + the full dot field. Visual grammar is polluted. The Proposer's own critique applies: "wells are a new word from a different language." A spectator who knows solo Chain Reaction would be confused by the pulsing circles in the corners. |
| Emergent Depth | 5 | The well-steal mechanic adds one dimension (offense/defense split) but the interaction with existing systems is limited. Wells don't flock, don't participate in cascades, don't respond to dot types. They are inert objects that receive cascade energy. The emergent depth comes from cascade geometry, which already exists in solo. |

**Composite: Average 6.3. Readability at 5 is concerning but not disqualifying.**

### Central Tension Test

**Does not resolve it.** The well-stealing mechanic adds a new objective (raid the opponent's well) but does not change the fundamental shared-board speed race for dots. Two players still race to catch the same clusters. The wells add strategic depth at the macro level (harvest vs. raid) but do not address the micro-level Simultaneity Paradox.

### Verdict: WEAK

The score wells are a creative spatial encoding, but they are a bolt-on system that breaks the game's visual grammar, adds complexity without proportional depth, and does not resolve the Central Tension. The Proposer's self-critique is accurate.

---

## PROPOSAL 7: PHASE SHIFT

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | **BORDERLINE-TO-FAIL** | This requires careful examination. During your "dormant" phase, your dots are ghosts — "visible but ghosted, pass-through." You cannot score them. You cannot catch them. The Proposer says you're "actively reading the board to prepare." But reading is not acting. The question is: CAN you tap during your dormant phase? If your dots are ghosts, tapping them does nothing. Can you tap the opponent's active dots? The proposal does not say. If you cannot meaningfully tap during your dormant phase, you are WAITING for 4-5 seconds (half the 8-10 second cycle) with zero meaningful input. This is K2 (flow break), not K1, but it borders on K1's spirit — you are functionally locked out of play for half the game. |
| K2 (Breaks flow) | **FAIL** | During your dormant phase (4-5 seconds every 8-10 seconds), you cannot score. Your dots are pass-through ghosts. The Proposer argues you're "reading" and "preparing." But K2 asks: "Is there any moment where the optimal action is to WAIT?" During your dormant phase, the optimal action IS to wait and read. You are not acting. You are spectating your opponent's active phase while tracking your ghost dots. This is a 4-5 second spectator window every 8-10 seconds. That is a 50% spectator rate. The Ikaruga comparison is misleading — in Ikaruga, you are always shooting and dodging regardless of polarity. You switch WHAT you absorb, not WHETHER you act. Phase Shift switches whether you can act. |
| K3 (Extra inputs) | PASS | One tap. |
| K4 (Unpredictability) | PASS | Phase cycle is fixed and displayed. |
| K5 (UI reading) | **BORDERLINE** | "A color gradient across the screen edge shows phase timing." This is a HUD element. If the player must check the phase timer to know when to act vs. when to read, that's a gaze tax. The dot colors themselves show phase state (glowing vs. ghosted), which is on-field. But the precise timing of the transition requires checking the edge gradient. |
| K6 (Separate boards) | PASS | Shared board. |

**Survives kill criteria: NO. K2 kills it.**

### Detailed K2 Analysis

The Proposer compares Phase Shift to the game's "inhale-exhale" breathing pattern. But in solo continuous mode, the "inhale" (dots accumulating) is not a passive phase — the player is actively scanning, predicting, and choosing when to exhale (tap). The player CAN tap at any time during the inhale. They CHOOSE to wait for peak density. In Phase Shift, during your dormant phase, you CANNOT meaningfully act. Your dots are ghosts. Tapping accomplishes nothing for you. The phase forces you into spectating.

The Proposer could rescue this by saying "during your dormant phase, you can tap the opponent's active dots to deny them." But the proposal does not say this — it says "Player A scores from blue dots, Player B from orange dots." If each player can only interact with their own dots, dormant phases are dead time. If each player can also DENY opponent dots during the opponent's active phase, the game becomes "you're always acting" — but then the proposal needs to explain: does denying opponent dots score for you? Does it cost you? This changes the design significantly.

As proposed: DEAD on K2.

### Verdict: KILL

Phase Shift is killed by K2 (flow break). The 4-5 second dormant phase is a Spectator Trap (AP1) that occurs every 8-10 seconds, consuming 50% of match time. The dual-purpose insight (score in your phase + disrupt in opponent's phase) is good, but the forced rhythm of "can act / cannot act" is turn-based in disguise. It's A-B-A-B alternation with a sinusoidal envelope instead of a discrete switch. The clock ticks differently, but the waiting is the same.

**Could it be rescued?** Yes, if during your dormant phase you can meaningfully act — either by tapping opponent dots to deny/steal them, or by tapping your ghost dots to "pre-charge" them so they detonate immediately when your phase activates. Either rescue requires significant redesign. As written: DEAD.

---

## PROPOSAL 8: ECHO

### Kill Criteria

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| K1 (Turn-based) | PASS | Both players play their own field continuously. |
| K2 (Breaks flow) | PASS | Continuous management of own field + incoming echoes. |
| K3 (Extra inputs) | PASS | One tap. Echoes are automatic. |
| K4 (Unpredictability) | PASS | Echoes are deterministic (3s delay, same coordinates, 50% radius). |
| K5 (UI reading) | **BORDERLINE** | "Incoming echoes are displayed as a growing grey circle on your field (ghost preview)." This is a new visual element — a predictive overlay showing where the opponent's echo will land. It's on-field (good) but it's a competitive-only visual that adds clutter. Optimal play requires tracking echo previews, which is additional visual processing not present in solo. |
| K6 (Separate boards) | **BORDERLINE** | Split screen. The echo system creates interaction, but each player has their own field. The kill criterion says "must demonstrate interaction density is high enough without shared space." The echo creates one interaction per opponent tap (every 1.5s, an echo arrives). But the echo is a 50% radius explosion — how much does it actually disrupt? If the opponent is tapping every 1.5s, echoes arrive every 1.5s with a 3s delay and 50% radius. The question is whether these small echoes meaningfully change your board state. At 50% radius, they catch fewer dots, create smaller cascades, and push less. The disruption may be marginal. I'll pass this conditionally but flag interaction density as the critical concern. |

**Survives kill criteria: YES (conditionally on K6 — must demonstrate sufficient interaction density).**

### Anti-Pattern Check

| Anti-Pattern | Severity | Notes |
|--------------|----------|-------|
| AP1 (Spectator Trap) | None | You're always playing your own field. Echoes arrive asynchronously and don't pause your game. |
| AP2 (Reaction Speed Ceiling) | None | Separate boards eliminate the speed race. You're competing on prediction depth, not tap speed. |
| AP3 (Parallel Solitaire) | **Mild-to-Moderate** | The echo system creates interaction, but the interaction may be too weak. A 50% radius echo catches fewer dots, creates weaker cascades, and may be ignorable. If the optimal response to most echoes is "ignore it, it's too small to matter," the game is parallel solitaire with a mild inconvenience. The Proposer claims the expert "weaponizes" echoes by choosing tap positions that disrupt the opponent's formations. But if echoes are only 50% radius, the disruption is small, and the positional sacrifice on YOUR field (tapping suboptimally to send a better echo) may not be worth it. The tradeoff "slightly worse for me, slightly annoying for them" does not create deep interaction. |
| AP4 (Complexity Cliff) | **Mild** | "Your taps echo onto their board after 3 seconds at half strength." One sentence, but the implications (should I dodge? exploit? ignore? weaponize?) take time to discover. The echo preview adds a new visual element to learn. |
| AP5 (Degenerate Strategy) | **Mild** | "Play your own field optimally, ignore echoes" might be near-optimal if echoes are weak enough. This degenerates to Proposal 4 (Density Race) with minor disruptions. |
| AP6 (UI Gaze Tax) | **Mild** | Echo previews (growing grey circles) add visual noise. Each incoming echo is a new element to track. With taps every 1.5s, echoes arrive every 1.5s — at any given time, there are ~2 echo previews visible on your field (each preview visible for ~1-2s before detonation). This is manageable but adds clutter. |
| AP7 (Simultaneity Paradox) | None | Separate boards. No simultaneity issues. |
| AP8 (Bolt-On) | **Moderate** | Echoes do not exist in solo. The grey ghost preview circles are new visual elements. The 3s delay, 50% radius, and "same coordinates" mechanics are all competitive-only rules. A solo player's practice does not prepare them for echoes. However, the echo IS an explosion — it uses existing explosion physics, just weaker. This is more integrated than Steal's wells but less integrated than Infection's conversion. |

### 6-Dimension Scoring

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Flow Continuity | 9 | **Best in class.** Each player has their own continuous field with zero interruption from the opponent. Echoes arrive asynchronously and integrate into your existing decision-making. You never stop playing. |
| Interaction Density | 5 | **Critical weakness.** The echo interaction is one-way with delay. Your tap affects the opponent's board 3 seconds later via a weakened explosion. The opponent's response to your echo does not directly affect you (it only affects you via THEIR echo 3 seconds after that — a 6-second round trip). This is the Tetris garbage model, but weaker: Tetris garbage is 4 lines that immediately threaten death. A 50% radius echo might catch 0-3 dots. The interaction is too slow and too weak to create the "every action changes what my opponent should do" density that the north star demands. Compare to Infection where every tap directly flips dots on the shared board. |
| Skill Differentiation | 7 | The dual-read (optimize local field + weaponize echoes) is a genuine skill axis. The 3-second lookahead for echo impact is within the prediction horizon. But the skill axis is weakened if echoes are too weak to matter — if ignoring echoes is viable, the skill axis reduces to solo play skill. |
| Input Simplicity | 9 | One tap. Echo previews are passive information. |
| Readability | 6 | Split screen halves the viewport (195x422 on a 390x844 phone). Each half has dot field + echo previews (grey circles). Parseable but cramped. A spectator must understand two separate fields + the echo relationship between them. This is significantly harder to read than Infection or Tug-of-Field. |
| Emergent Depth | 6 | The echo mechanic creates some interesting situations (weaponized echoes, echo-dodge, echo-exploit). But the interaction with existing systems is limited — echoes are just smaller explosions. They don't interact with dot types in special ways, don't create conversion or territory, don't push a pressure line. The depth comes from the dual-board planning, which is a cognitive challenge more than an emergent one. |

**Composite: Average 7.0. Interaction Density at 5 is the critical concern.**

### Central Tension Test

**Sidesteps it entirely.** Separate boards eliminate the Simultaneity Paradox but also eliminate the shared-space interaction that creates the racquetball/Rocket League feel. The echo system creates interaction, but it is asynchronous, delayed, weakened, and indirect. The Central Tension asks for shared-space interaction without speed racing. Echo provides no-space interaction with no speed racing. That is a different tradeoff, not the requested resolution.

### Verdict: WEAK

Flow Continuity is excellent (best of all proposals). But Interaction Density is too low for the north star. The echo mechanic is conceptually interesting but practically too weak to create the "my action directly changes what my opponent should do" density that distinguishes competitive play from parallel solitaire. The tennis analogy is apt but misleading — in tennis, the ball's arrival demands an immediate, high-stakes response. In Echo, the echo's arrival is a minor disruption that may be ignorable.

**Could it be rescued?** If echo strength were increased to 80-100% radius (not 50%), echoes would be more disruptive, creating situations where the opponent MUST respond. But this creates a new problem: your optimal tap on your own field is now compromised by sending a full-strength explosion to a random position on the opponent's field, which may help them (catching their dots into a chain that scores for them). The Proposer's "exploit" strategy (position dots so the echo catches them beneficially) would become the default, inverting the interaction from "attack" to "gift." The echo strength parameter is a delicate balance that would need simulation.

---

## SUMMARY TABLE

| # | Name | Kill Criteria | Worst Anti-Pattern | Avg Score | Lowest Dim | Central Tension | Verdict |
|---|------|--------------|-------------------|-----------|------------|-----------------|---------|
| 1 | The Court | PASS | AP2/AP7 (Severe) | 7.2 | Skill Diff (4) | Not resolved | WEAK |
| 2 | King of the Hill | PASS | AP5/AP7 (Mod-Severe) | 6.5 | Emergent Depth (4) | Worsened | WEAK |
| 3 | **Infection** | **PASS** | **AP2 (Mild-Mod)** | **8.7** | **Skill Diff (8)** | **Resolved** | **PROTOTYPE-NOW** |
| 4 | Density Race | FAIL (K6) | AP3 (Severe) | N/A | N/A | N/A | KILL |
| 5 | Tug-of-Field | PASS | AP8 (Moderate) | 7.3 | Emergent Depth (6) | Partially resolved | STRONG |
| 6 | Steal | PASS | AP8 (Severe) | 6.3 | Readability (5) | Not resolved | WEAK |
| 7 | Phase Shift | FAIL (K2) | AP1 (Severe) | N/A | N/A | N/A | KILL |
| 8 | Echo | PASS (conditional) | AP3 (Mild-Mod) | 7.0 | Interaction Density (5) | Sidestepped | WEAK |

---

## TOP 2

### #1: INFECTION (Proposal 3) — PROTOTYPE-NOW

Infection best embodies the racquetball/Rocket League/Tetris Effect feel because:

1. **Continuous contested space (Rocket League).** Both players share the same field and interact through the dots themselves. The dots ARE the contested resource. Your explosion physically changes which dots belong to whom. This is the ball-as-message-passing pattern from the Expert's analysis, realized through color conversion rather than blast force.

2. **Dual-use actions (Tetris/Splatoon).** Every tap simultaneously scores (catches your dots), attacks (converts opponent dots), and disrupts (the cascade propagates your color into enemy territory). This is the triple-purpose action the Expert identifies in Splatoon. The player never faces a "should I attack or defend?" decision — every tap does both.

3. **Asymmetric value perception (Poker/Fighting Games).** Both players see the same board but value different clusters because they own different colors. This structural asymmetry resolves the Central Tension: you are not racing to the same clusters because you want different things from the field. The prediction axis is ENRICHED: "where will the blue-orange boundary shift in 2 seconds?" is a richer question than "where is the biggest cluster?"

4. **Emergent depth from minimal rules.** One new rule (your explosion converts opponent dots to your color) interacting with existing systems (cascades, flocking, types, wall bounces) produces an enormous state space. The conversion cascade mechanic — where a converted dot explodes as your color, catching more opponent dots — is an emergent chain reaction WITHIN the chain reaction. This is maximum complexity from minimum abstraction.

5. **The field IS the score.** Zero UI elements. The ratio of blue to orange dots on screen tells you who is winning. A spectator understands in 2 seconds. This is the purest K5 performance possible.

### #2: TUG-OF-FIELD (Proposal 5) — STRONG

Tug-of-Field is the second strongest because:

1. **Universally understood metaphor.** "Push the line toward the opponent" requires zero explanation. Air hockey, tug of war, sumo — the metaphor is cross-cultural and instantly legible.

2. **Spatial score encoding.** The pressure line IS the score, on the field, always visible. Second-best K5 performance after Infection.

3. **Natural territorial split.** You primarily play your own side, reducing the Simultaneity Paradox. The contested center zone creates interaction without full-field speed racing.

4. **Flow continuity.** The pressure line's constant drift creates urgency. You're always pushing or defending.

**Why it's #2, not #1:** The pressure line is a one-dimensional reduction of the competitive state. In Infection, the competitive state is high-dimensional (color distribution across hundreds of dots). In Tug-of-Field, the competitive state is one number (line position). This means fewer qualitatively distinct situations, less emergent depth, and faster convergence on dominant strategies. Also, the bolt-on complexity (landscape, asymmetric spawning, pressure line physics) is higher than Infection's (one new rule: conversion).

---

## MISSING INTERACTION PATTERN: THE PROGRESSIVE TRAP

The Reference Expert identifies a pattern that NONE of the 8 proposals explicitly capture: **The Progressive Trap** (from Bomberman).

> "The skilled player does not win with a single brilliant tap. They win with a sequence of 2-3 taps that progressively worsen the opponent's position."

This pattern requires that the player's taps have PERSISTENT, CUMULATIVE effects on the board state — not just immediate scoring or conversion, but a multi-tap setup that constrains the opponent's future options.

In the 8 proposals:
- **The Court / King of the Hill:** No persistent effects. Each tap scores and is done.
- **Infection:** Conversion IS persistent (flipped dots stay flipped), but the Proposer does not describe multi-tap trap sequences. The conversion cascade is a single-tap event with persistent consequences, not a deliberate 2-3 tap setup. However, a skilled player COULD use conversion strategically across multiple taps: "Tap 1 converts 3 dots at the boundary, creating a blue cluster inside orange territory. Tap 2, those converted dots have drifted into a dense orange zone. Tap 2 detonates the converted cluster, triggering a deep conversion cascade." This is a progressive trap that Infection's rules support but the Proposer does not articulate.
- **Tug-of-Field:** The pressure line position persists between taps, but the line's slow drift back to center erases the trap over time.
- **Echo:** The 3-second delay creates a form of delayed effect, but each echo is independent — there is no multi-echo trap sequence.

**Recommendation for Infection prototype:** Explicitly test whether progressive traps emerge naturally from the conversion mechanic. If they do, this is additional evidence that Infection has the deepest emergent strategic layer. The test: can a simulated Oracle player that plans 2 taps ahead consistently beat an Oracle player that only optimizes each tap independently? If yes, the progressive trap exists and the multi-tap skill axis is real.

---

## MISSING INTERACTION PATTERN: THE SELF-DANGER DYNAMIC

The Expert also emphasizes the Bomberman pattern of **self-danger from your own actions**:

> "Your bombs kill you. In Chain Reaction, your blast repositions dots that your OPPONENT then gets to chain."

In Infection, conversion cascades could backfire: if your conversion cascade propagates into a zone where the opponent has strong chain potential, you've just handed them a cluster of their color in a dense region. "I converted those dots, but now they're MY color in HIS territory, and his next tap catches them all." This self-danger is implicit in Infection's mechanics but not articulated by the Proposer. It is another source of emergent depth that should be explicitly tested in the prototype.

---

## FINAL RECOMMENDATION

**Prototype Infection (Proposal 3) immediately.** It is the only proposal that scored S-tier on the evaluation framework, resolved the Central Tension through structural asymmetry, and captured the most interaction patterns from the reference analysis.

**Keep Tug-of-Field (Proposal 5) as the backup** in case Infection's color encoding proves problematic (accessibility, visual confusion with existing type colors, runaway conversion dynamics).

**Use The Court (Proposal 1) as a minimal testbed** for shared-board real-time play mechanics (cooldown calibration, cascade timing, network sync) before investing in the more complex Infection system.

Everything else is either dead (Proposals 4, 7) or structurally limited (Proposals 2, 6, 8).

---

*Guardian evaluation complete. Infection is the design. Build it.*
