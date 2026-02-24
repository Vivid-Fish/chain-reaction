# Board Structure Brainstorm

## Date: 2026-02-23
## Method: 3-agent team (Proposer, Critic, Facilitator), 2 rounds

---

## Creative Brief (Facilitator)

### North Star Question
**"What makes THIS moment, in THIS spot, the right time to tap?"**

### Success Criteria
- New player watches 2-3 seconds, feels pull toward a region
- Intermediate reads "sentences" — clusters forming, tensions building
- Expert sees competing opportunities, picks higher ceiling, timing matters
- The feeling is seeing the angle in pool — clever, not lucky

### Boomshine Plus Test
"If you take a screenshot of the board, can a skilled player point to the right place to tap AND explain why — without needing to know any rules beyond 'dots near explosions explode'?"

### Analogies
1. **Murmuration** (starling flocks) — local rules, globally readable structure
2. **Ocean surfing** — read the wave, timing + position inseparable
3. **Jam sessions** — musicians converging on a groove, tension → resolution
4. **Nucleation** — metastable system, one perturbation triggers phase transition

---

## Critic's Framework (10 criteria, all mandatory)

1. **One-Tap Invariant** — No new input verbs
2. **Readability** — Parseable in <500ms at a glance
3. **Single Rule** — One sentence, no conjunctions
4. **Casual Floor / Expert Ceiling** — Fun without understanding, exploitable with mastery
5. **Casual Floor / Expert Ceiling** — 1.5x+ score difference between casual and expert on same seed
6. **Determinism** — Same inputs = same outputs
7. **Physics Identity** — Operates through position/velocity/radius, not abstract logic
8. **Initial Boom Preservation** — Tap-BOOM remains the peak moment
9. **Measurability** — Quantifiable via simulation metrics (SCR, F3, Chaos)
10. **Structure Generation** — Creates non-uniform spatial regions worth choosing between
11. **Discoverability** — Teaches itself through visible consequences

---

## 15 Ideas Proposed

| # | Name | One-liner |
|---|------|-----------|
| 1 | MAGNETISM | Same-color dots weakly attract, forming loose clusters |
| 2 | WAKE | Dots leave fading trails; explosions propagate faster along trails |
| 3 | MASS | Longer-surviving dots grow larger/heavier, anchor neighborhoods |
| 4 | HEARTBEAT | Global pulse rhythm, dots only explosive when bright |
| 5 | DEBT | Explosions leave cold zones: faster spawns but chain-immune |
| 6 | BONDING | Dots near each other form visible threads; bonded dots chain at distance |
| 7 | POLARITY | CW/CCW spin; explosions propagate between opposite spins |
| 8 | ECHO | Explosion radius stretches toward previous tap location |
| 9 | TEMPERATURE | Edges cold (slow, dense), center hot (fast, sparse) |
| 10 | ANCESTRY | Chain-spawned dots brighter, chain at larger radius |
| 11 | LOAD-BEARING | ~15% keystone dots; popping one avalanches nearby dots |
| 12 | GRUDGE | Survived-explosion dots darken, need 2 hits |
| 13 | SCHOOLING | Same-color nearby dots flock/align velocity, forming rivers |
| 14 | SHADOW | Tap casts directional freeze zone for next tap setup |
| 15 | FERMENTATION | Untouched dots age/shift color; aged clusters = high value |

---

## Critic's Evaluation

| # | Idea | Criteria Failed | Verdict |
|---|------|----------------|---------|
| 1 | MAGNETISM | 0 | **ADVANCE** |
| 2 | WAKE | 2 (readability, discoverability) | REWORK |
| 3 | MASS | 1 (single rule — fixable) | REWORK |
| 4 | HEARTBEAT | 3 (physics, boom, structure) | KILL |
| 5 | DEBT | 4 | KILL |
| 6 | BONDING | 1 (readability — spaghetti threads) | REWORK |
| 7 | POLARITY | 3 (readability, boom, discoverability) | KILL |
| 8 | ECHO | 3 (readability, structure, discoverability) | KILL |
| 9 | TEMPERATURE | 0 | **ADVANCE** |
| 10 | ANCESTRY | 2 (single rule, physics identity) | REWORK |
| 11 | LOAD-BEARING | 3 (single rule, physics, boom) | KILL |
| 12 | GRUDGE | 2, fatal (physics = HP) | KILL |
| 13 | SCHOOLING | 0 | **ADVANCE** |
| 14 | SHADOW | 3 (one-tap, single rule, boom) | KILL |
| 15 | FERMENTATION | 4 | KILL |

**3 Advanced, 4 Rework, 8 Killed**

---

## Facilitator's Ranking (against North Star)

1. **SCHOOLING** — Rivers of same-color dots. Fleeting crossing points. Strongest spatial + temporal signal.
2. **BONDING** — Visible threads = visible structure. Dense webs = tap here.
3. **MASS** — Large dots as anchors. Overlapping satellite clouds = opportunity.
4. **FERMENTATION** — Aged clusters as accumulated value. (Passive, less dynamic.)
5. **MAGNETISM** — Good spatial signal but weak temporal signal. Clusters persist.

### Boomshine Plus Test Results
- SCHOOLING: **PASS** — rivers, crossing points, flow direction all readable
- BONDING: **PASS** — thread density is spatial signal
- MASS: **PASS** — large dots + satellite overlap readable
- MAGNETISM: **MARGINAL** — clusters visible but no temporal urgency
- TEMPERATURE: **PASS** — edge density vs center speed is clear tradeoff

---

## Top Combinations

### Combination A: "Rivers with Bridges" (SCHOOLING + BONDING)
Dots flock into same-color streams. Dots traveling near each other develop visible threads. Rivers have internal cohesion. Cross-school bridges form when schools pass near each other — fleeting structural opportunity. Expert reads: both schools bonded, bridge forming, tap the bridge point before schools diverge.

### Combination B: "Whales in the Current" (SCHOOLING + MASS)
Dots flock into rivers. Long-surviving dots grow large, become anchors that bend nearby flow. Whales make streams predictable (anchored trajectory). Two whales in same stream = heavy, dense, high-value. Surfing analogy realized.

---

## Consensus: Prototype SCHOOLING First

### Why
1. Highest-signal mechanic. Creates spatial AND temporal structure.
2. Lowest implementation risk — Boids flocking is well-understood, applies to existing velocity system.
3. Foundation for both top combinations (Bonding and Mass layer on top).
4. Definitive test: pause at random frame, can you point to best tap? Yes = working. No = tune or discard.

### Implementation
Already partially exists: `cohesionForce` in game-core.js. Need to add velocity alignment (the key Boids force that creates rivers, not just clusters).

### Key risk
Too-strong flocking → all same-color dots collapse into one ball → board becomes trivial ("tap the biggest ball"). Need sweet spot: coherent enough to read, loose enough for interesting crossings/near-misses.

### What to measure
- River coherence (alignment metric)
- SCR variance across tap positions (should increase — some spots genuinely better)
- F3 (should stay in 40-60% sweet spot)
- Visual: pause random frames, screenshot test

---

## Prototype Order
1. **SCHOOLING** (solo, first)
2. **SCHOOLING + MASS** ("Whales in the Current")
3. **SCHOOLING + BONDING** ("Rivers with Bridges")
4. **TEMPERATURE** (independent test — static spatial gradient)

## Parked
- MAGNETISM (subsumed by Schooling — Schooling does everything Magnetism does plus velocity alignment)
- FERMENTATION (revisit for slower-paced mode)

## Cut
- HEARTBEAT, POLARITY, ECHO, SHADOW, DEBT, GRUDGE, LOAD-BEARING, WAKE (fatal flaws identified)
