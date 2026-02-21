# Continuous Play — Design Brainstorm

## Date: 2026-02-21

## The Problem

Chain Reaction uses discrete rounds with escalating difficulty. Dots regenerate between rounds, "Round N Clear!" text appears, and the game ends when you fail a target. This creates a start-stop cadence that breaks flow state. The goal: continuous play (Tetris-style) where dots enter/leave continuously, there are no round boundaries, and difficulty is self-regulating.

## 5 Approaches Explored

---

### 1. Breathing Field

**Concept:** The field has a biological rhythm. Dots spawn continuously at a steady rate. Chains destroy dots. The field's density oscillates as the player taps and chains carve through the population, which then replenishes.

- **Inhale:** Dots accumulate, density rises, audio layers in, tension builds
- **Exhale:** Player taps, chain cascades, dots destroyed, audio thins, brief calm
- **Inhale again:** Dots refill, new configurations emerge, audio rebuilds

**Self-regulating difficulty:** If the player is skilled, they maintain medium density. If struggling, density climbs to critical and even random taps produce decent chains (emergent mercy mechanic). If extraordinary, they ride the edge at high density for massive scores.

**Strengths:** Natural tension-release cycle driven by player action (not scripted). Creates the Tetris Effect "breathing" sensation. Emergent difficulty adjustment without explicit mercy mechanics.

**Weaknesses:** Risk of optimal strategy being "tap constantly" (shallow chains, quick recovery). Need exponential chain-length bonus to reward patience. The rhythm might feel monotonous without additional structure.

---

### 2. Tide Pool

**Concept:** Dots arrive in waves every 15-25 seconds, like ocean tides washing new dots onto the field. Between waves, dots drift and cluster. Clearing an entire wave before the next arrives earns a "Tidal Bonus."

- Waves have increasing dot counts and type diversity
- A visible "tide marker" at the screen edge shows the next wave approaching
- Post-wave, the field has a brief turbulence period (dots settle into new patterns)
- Clearing a wave plays a harmonic chord; partial clears play fragments

**Strengths:** Natural pacing structure without numbered rounds. Creates anticipation (watching the wave approach). The wave timing creates a macro-rhythm that gives the session shape. Visual drama of dots flooding in from the edges.

**Weaknesses:** Still has discrete events (waves), which is closer to rounds than true continuous flow. The timing between waves might feel artificial. Risk of dead periods between waves where the player just waits.

---

### 3. Ecosystem

**Concept:** Dots have lifespans and expire naturally (fade out after 20-40 seconds). New dots spawn at a constant rate. The field is an ecosystem: population is balanced between birth rate and death rate. The player's chains are a predator — they remove dots faster than natural death, creating temporary population dips.

- A "population meter" shows the current ecosystem health
- Expired dots leave behind faint ghosts (visual memory)
- Chains that catch dots before they expire are worth more ("fresh catch" bonus)
- Population crashes (too many chains, too fast) reduce spawn variety — the ecosystem needs to recover

**Strengths:** Creates a relationship between the player and the field — you're tending a garden, not fighting an enemy. Natural difficulty via population dynamics. Dot lifespans create urgency without explicit timers. The "ecosystem health" metaphor is unique.

**Weaknesses:** Complex to communicate to the player — what does "ecosystem health" mean in a chain reaction game? Expiring dots might feel like wasted opportunities. The metaphor might make the game feel slower/gentler than intended.

---

### 4. Pressure Cooker (RECOMMENDED)

**Concept:** Dots spawn at an accelerating rate. The player has a tap cooldown (must wait between taps). The field pressure builds relentlessly. The game ends in an "Overflow Bloom" when density exceeds a critical threshold for 10 seconds — all dots detonate in a final spectacular cascade.

**Key mechanics:**
- **Accelerating spawn:** `currentRate = baseRate + accel * (elapsedTime / 30s)`. Starts manageable, becomes overwhelming.
- **Tap cooldown:** Forces the player to choose WHEN to tap, not just WHERE. Creates tension during the cooldown as dots accumulate.
- **Overflow Bloom ending:** Not a game-over — a spectacle. The game ends because the universe collapses. The player watches their creation's final moment. Frame failure as beauty.
- **Density history:** The game tracks density over time, creating a "pressure graph" that shows the session's arc.

**Difficulty tiers:** Each calibrated to a specific bot skill level:
| Tier | Feel | Matched Bot | Spawn Rate | Cooldown | MaxDots |
|------|------|-------------|-----------|----------|---------|
| CALM | Meditative | Random | 0.5/s | 1.5s | 80 |
| FLOW | Engaging | HumanSim | 3.2/s | 2.0s | 90 |
| SURGE | Intense | Greedy | 5.0/s | 2.5s | 100 |
| TRANSCENDENCE | Overwhelming | Oracle | 2.5/s | 2.0s | 60 |

**Key calibration insight:** TRANSCENDENCE uses LOWER maxDots (60) rather than higher spawn rate. At high maxDots (100+), cascade percolation creates a self-regulating equilibrium where ANY bot survives because massive cascades clear most of the field per tap. Lower maxDots = tighter overflow threshold = skill matters more.

**Strengths:** Crystal-clear tension mechanism (pressure always builds). The tap cooldown creates genuine decision tension. The Overflow Bloom is emotionally satisfying — death as spectacle. Easy to calibrate via simulation (just tune spawn rate + cooldown). Maps cleanly to difficulty tiers matched to bot profiles.

**Weaknesses:** Linear escalation could feel grinding without additional structure. The accelerating spawn rate means every session follows the same trajectory (unlike Breathing Field's emergent rhythms). Needs audio/visual layering from Composer approach to create a session arc.

---

### 5. Composer

**Concept:** The session is explicitly framed as a musical composition. The player is not "playing a game" — they are "performing a piece." Chains are melodic phrases. The field is the score. The session has movements (epochs) that shift key, tempo, and texture.

- **Movements:** Dawn (sparse, ambient) → Gathering (building) → Flow (full backing) → Surge (driving) → Transcendence (symphonic)
- **Audio coupling:** Dot speed = BPM. Dot density = harmonic richness. Chain length = melodic complexity.
- **Visual painting:** Chains leave afterglow on the background (30-60s decay). Over a session, the background becomes a heat map of the player's history. The field is a canvas.
- **Audio memory:** Last 3-4 chain melodies linger as quiet echo loops, creating an evolving ambient bed unique to each session.
- **Session as artifact:** Each session produces a unique audiovisual composition. The player "signs" their performance with a final intentional chain (or the Overflow Bloom signs it for them).

**Strengths:** Reframes the entire experience — not just a game with sound, but a musical instrument with game mechanics. Creates sessions that feel unique and personal. The "painting" metaphor gives meaning to every chain. Connects to Tetris Effect's core insight: the player should feel like they're making music.

**Weaknesses:** The musical framing might not be obvious to casual players. Requires sophisticated audio architecture (epoch-specific stems, beat quantization, harmonic constraints). The framing is a layer on top of mechanics — it needs one of the other approaches as a base.

---

## Recommendation: Pressure Cooker + Composer

The **Pressure Cooker** provides the mechanical foundation: accelerating spawn, tap cooldown, density overflow, difficulty tiers. It's clean, simulatable, and calibratable.

The **Composer** provides the experiential layer: epoch transitions, audio coupling, visual painting, session-as-composition. It gives meaning and beauty to the mechanical pressure.

Together: the player performs a piece of music that gets increasingly complex and urgent, with their chains as the melody. The piece ends either when they choose to stop (graceful exit) or when the pressure overwhelms them (Overflow Bloom — the final chord).

This combination:
- Serves the contemplative player (Dawn and Gathering epochs are slow and ambient)
- Serves the competitive player (Surge and Transcendence are intense skill tests)
- Creates sessions with natural arcs (quiet → building → intense → overwhelming)
- Is simulatable (calibrate-continuous.js validates difficulty tiers via bot profiles)
- Preserves the one-tap rule (cooldown adds temporal decision, not spatial complexity)

### Implementation Priority

1. **Pressure Cooker mechanics** — continuous spawn, tap cooldown, overflow bloom, difficulty tiers (THIS SESSION)
2. **Epoch transitions** — visual/audio crossfades tied to density and elapsed time
3. **Audio coupling** — BPM tracking, stem layering per epoch
4. **Visual painting** — chain afterglow on background, heat map effect
5. **Audio memory** — echo loops of recent chains, ambient bed evolution
6. **Session persistence** — high scores, daily seed mode

Steps 1 is what the simulation harness validates. Steps 2-6 are browser-side implementation informed by sim data.

## Prior Art That Validates This Approach

| Game | Relevant Pattern | Our Adaptation |
|------|-----------------|----------------|
| Tetris Effect | Zone mechanic (rule inversion) | Supernova (3-tap round) |
| Tetris Effect | Audio stems unmute with performance | Epoch-based stem layering |
| Lumines | Timeline sweep = musical phrasing | Tap cooldown = rhythmic constraint |
| Rez Infinite | Area X (constraint removal = expansion) | Transcendence epoch (overwhelming but transcendent) |
| Geometry Wars | Multiplier as investment | Chain multiplier with time decay |
| Super Hexagon | "60 seconds is forever" | Reaching Transcendence is the achievement |
| Beat Saber | Slight undershoot maintains flow | CALM tier errs on achievable side |
| Audiosurf | Game IS the music visualizer | Composer layer: session IS a composition |

## Simulation Results

Validated via `continuous-sim.js`, `calibrate-continuous.js`, and `difficulty-regression.js`:

- **ContinuousSimulation** engine extends sim.js with edge spawning, tap cooldown, overflow detection
- **ContinuousBots** adapters handle temporal decisions (when to tap, not just where)
- **Calibration** binary-searches spawn rate per bot for steady-state at ~90% capacity
- **Regression test** validates steady-state + margin + lower-bot-fails per tier

The simulation confirms that the tier structure creates meaningful difficulty separation: each tier's matched bot survives where a lower-tier bot fails.
