# Chain Reaction Design Journey — Full Synthesis

## The Story So Far

### Act 1: The Homogeneity Problem

The game works at a surface level — tap, watch chaos, feel good. Juice, particles, screen shake. But underneath: **the board is homogeneous**. Dots move randomly, chains "just happen" from physics, tapping anywhere feels roughly the same. There's no meaningful skill axis. A skilled player and a casual player see the same uniform field and have roughly the same information.

**Key realization**: The skill ceiling isn't limited by the player's one verb (tap). It's limited by the board not presenting enough signal to differentiate good decisions from bad ones.

### Act 2: Meadows Leverage Points

The user read Donella Meadows' "Leverage Points: Places to Intervene in a System" and identified that the Lab panel (parameter sliders) operates at **Level 12 — the lowest leverage point**. Meadows: *"Parameters are the points of least leverage... Diddling with the details, arranging the deck chairs on the Titanic."*

The 12 levels, mapped to Chain Reaction:
- **Level 12 (Parameters)**: Cohesion force 0.01→0.03, wave interval, explosion radius — what the Lab does
- **Level 6 (Information flows)**: Making hidden information visible — density heatmaps, trajectory hints, type-based visual coding
- **Level 5 (Rules)**: "Any explosion catches any nearby dot" → conditional propagation (same-type only). One rule change that transforms the game
- **Level 4 (Self-organization)**: Dots forming emergent neighborhoods through local rules. Geography that arises and dissolves
- **Level 2-3 (Paradigm/Goals)**: The game's fundamental identity. What IS the player doing? What cognitive skill are they exercising?

**The user pushed for Level 2-3 thinking** — not just rule changes, but questioning whether the game's fundamental paradigm is right.

### Act 3: Research Phase

Five research documents committed, covering:

#### Predictable Physics = Unbounded Skill Ceiling
- **Rocket League's physics are deliberately fake.** Corey Davis (Design Director): *"Car/Ball interactions are totally 'fake'! Real physics are too random and unpredictable."*
- Psyonix uses custom impulses that violate Newton's Third Law. Bounce angles feel correct (learnable) but hit power feels intentional (satisfying)
- 120 TPS deterministic simulation. Same inputs = same outputs, always
- All cars standardized into 6 hitbox categories (OBBs — rectangles, not car shapes)
- **The dodge mechanic was a bug** that became the primary skill expression axis
- Skill progression is purely prediction depth: Bronze (0 steps) → Grand Champion (3-4 steps ahead). No theoretical ceiling
- **Counter-Strike recoil patterns are 100% deterministic lookup tables.** Zero randomness → spray control becomes pure muscle memory
- **Quake strafe jumping**: deterministic physics bug → entire game modes (DeFRaG)
- **General principle**: Randomness CAPS skill expression. Determinism enables unbounded depth

#### Conditional Chaining (Puyo/Ikaruga/Lumines)
- Every high-skill-ceiling game has a **conditional rule on what connects to what**
- Puyo: same-color chaining. Ikaruga: matching polarity. Go: same-color adjacency. Tetris: completed rows
- **4 colors** is Puyo's competitive sweet spot. **2 is sufficient** if the choice cascades (Ikaruga, Lumines)
- **Never use probabilistic matching** — every successful game uses deterministic rules
- Puyo's key insight: *"Clearing is type-specific, but gravity is universal"*
- Boomshine Plus added 6 types to a luck-dominant core → 3 Steam reviews. Complexity on broken structure doesn't help

#### Board Readability
- Geometry Wars creates readable zones through behavioral differentiation alone (grunts cluster, wanderers spread)
- Three priority interventions: type-clustered spawning, soft cohesion, wave spawning
- Visual: fix standard dot hue, same-type neighbor glow, double-code everything (colorblind)

#### Strategic Depth + Casual Appeal
- Layered depth architecture from Pokemon, Slay the Spire, Tetris Effect, Hades
- Seven principles: bonus not filter, discoverable not taught, same input different outcome, depth reveals through difficulty, celebrate discovery, measure emergent depth, preserve chaos floor

#### Gap Analysis vs Paid Games
- Chain Reaction has the strategy but not the Tetris Effect
- Highest leverage gaps: musical audio, session arc, near-miss feedback, skill visibility

### Act 4: Brainstorm v1 — Board Structure

15 ideas → 10-criterion evaluation → 3 survivors:

**Advanced (prototype-worthy):**
- **SCHOOLING** — Same-color dots flock into rivers with velocity alignment. Creates visible geography
- **TEMPERATURE** — Dots heat up near others, cool down when alone. Hot dots chain further
- **MAGNETISM** — Dots attract same-type neighbors, creating clusters

**Killed (8):** HEARTBEAT, DEBT, POLARITY, ECHO, LOAD-BEARING, GRUDGE, SHADOW, FERMENTATION — fatal flaws including added complexity, breaking physics identity, or destroying the tap-BOOM moment

**Evaluation criteria included "One-Tap Fidelity"**: *"The entire player action space consists of choosing when and where to place a single tap — no menus, no drag, no hold, no second input."*

### Act 5: Brainstorm v1 — Competitive Mode (Failed)

Produced **Explosion Billiards** — turn-based, shared board, tug-of-war meter. **KILLED** because:
- Turn-based violates the core feel
- Agents didn't have design principles as constraints
- 5 autonomous rounds with no human checkpoint
- Optimized for convergence, not correctness
- Never touched the game — pure theory

### Act 6: Design Principles Written

The user insisted on writing down everything that had been discussed. Split into:

**14 Universal Principles** (applicable to any game):
1. Predictable physics = unbounded skill ceiling
2. Easy to learn, hard to master
3. Maximum complexity, minimum abstraction (few rules, many outcomes)
4. Layered depth (invisible until sought)
5. Discoverable, not taught
6. Advanced mechanics: bonus, not filter
7. Emergent, not scripted
8. The experience is what you sell
9. Player actions are music
10. Near-miss engagement hooks
11. Multiplicative juice
12. Session tells a story
13. Lateral progression (breadth, not power)
14. Simulate before you design

**6 Chain Reaction-Specific Principles:**
1. Board is never static
2. Properties transmit through chains
3. The field breathes (density oscillates)
4. Prediction depth is the skill axis
5. Chains are musical phrases
6. Epochs, not levels

### Act 7: "The Feel We're Chasing"

Added to DESIGN.md as the north star:

> The game should feel like making fast physics calculations in racquetball — read the bounce angle, predict where the ball will be, move there before it arrives. Like Rocket League — read the trajectory, predict the contact, position yourself for the intercept. Like Tetris Effect — enter flow state where prediction becomes unconscious.
>
> Fast physics reads → immediate action → tight loop → flow state.

### Act 8: Brainstorm v2 — Competitive Mode (With Kill Criteria)

New agent roles: **Constraint Guardian** (enforces kill criteria), **Reference Expert** (stress-tests against real games), **Proposer** (generates within constraints).

**Kill criteria (binary, non-negotiable):**
- K1: Turn-based = instant fail
- K2: Breaks flow state = instant fail
- K3: Adds inputs beyond one tap = instant fail
- K4: Adds unpredictability/noise = instant fail
- K5: Requires UI reading = instant fail
- K6: Separate boards = suspicious

**8 proposals evaluated. Winner: INFECTION**
- Shared field, dots colored per player (blue/orange)
- Catch own color = score. Catch opponent color = convert (flip to yours, cascade as yours)
- Field IS the scoreboard — glance at color ratio, know who's winning
- 3 new rules only. One tap input. Real-time simultaneous
- 90-second matches, score-based to prevent passive play

**Guardian score: 8.7/10** — S-tier, resolves "Central Tension" (asymmetric targets prevent fastest-finger-wins)

### Act 9: Does INFECTION Satisfy the North Star?

**Honest assessment: partially.**

Pacing matches (real-time, simultaneous, flow state). But the **skill axis diverges**:
- Racquetball/Rocket League skill = **physics prediction** (where will the ball be?)
- Infection skill = **color topology** (trace conversion cascade through the color graph)
- That's closer to reading an Othello board than reading a racquetball bounce

The physics prediction is still present (dots are moving, you predict convergence) but becomes secondary to the color reading layer.

### Act 10: Input Model Exploration

The user proposed: **thumb sliding left/right in a rectangle at bottom of screen.** Continuous control, not discrete taps.

This gives 4 channels from one finger:
- X position (primary, fast, precise)
- Y position (secondary — could modulate intensity/reach)
- X velocity (swipe speed → force/aim)
- Touch down vs up (engaged vs not)

Three proposals for connecting this to explosion chains:
1. **Aim and Release** — thumb tracks cursor, lift = fire
2. **Continuous Attractor** — thumb creates gravity well, herding dots
3. **Sweep** — thumb drags trail of small detonations

**User rejected all three**: "none of them have the satisfying physics of racquetball rocket league"

### Act 11: Five Sources of Physics Satisfaction

The AI identified that the racquetball feel has multiple distinct sources:

1. **Weight and momentum transfer** — Your velocity → game's response proportionally. Rocket League: car speed → ball speed
2. **Timing precision** — The right action at the right MOMENT. Anticipation + execution, not just placement
3. **Spatial geometry in real-time** — Unconscious angle calculations. "That dot bounces off that wall, arrives here in 1 second"
4. **Rhythm** — The game has a pulse. Your inputs sync to it. Physics satisfaction = musical satisfaction
5. **Shaping then harvesting** — 3 seconds sculpting conditions, one action triggers payoff. Setup, not just hit

**Racquetball has all five simultaneously.**

### Act 12: The Rocket League Insight

**You ARE a physics object.** Not outside the simulation pointing at things. IN it.

- Your car has mass, inertia, momentum. You obey the same rules as the ball
- **Contact is emergent, not commanded.** You don't press "hit ball." You navigate into the ball's path
- **Your momentum IS your power.** Slow car = nudge. Supersonic car = launch. Speed-precision tradeoff
- **The ball doesn't wait.** Two trajectories converging. You must intercept a moving thing while you yourself are a moving thing

The fundamental gap: every proposal so far has the player **above the physics, looking down**. Placing effects from god-view. Not inside it.

---

## Where It Was Cut Off

The final question before the conversation compacted:

> **"What if the player controls something that's IN the dot field — something with mass and momentum that interacts with dots through physics contact, not through placed effects?"**

Combined with the thumb-rectangle input: the player is a puck/body with inertia, controlled by sliding thumb at the bottom. It accelerates, doesn't teleport. Contact with dots is emergent — your speed and angle determine the explosion. Your momentum transfers into the chain.

**This was never resolved.** The user switched to requesting a flicker animation, and the conversation compacted shortly after.

---

## Open Questions

1. **Does the "player as physics object" concept work with explosion chains?** Or does it fundamentally change the game's identity from "tap to explode" to "steer through the field"?
2. **Can all five satisfaction sources coexist?** Weight transfer + timing + geometry + rhythm + shaping?
3. **How does INFECTION (competitive mode) interact with continuous control?** If players steer pucks instead of tapping, conversion cascades work differently
4. **Is the "Rocket League inside the physics" feel achievable on mobile?** Thumb rectangle gives position + velocity, but is that enough degrees of freedom?
5. **What IS the player's puck/body?** How big? How fast? Does it explode on contact or trigger explosions nearby?
6. **Does the board homogeneity problem still exist if the player is navigating through it?** Moving through the field gives you spatial information that tapping from above doesn't
7. **Same-type chaining + continuous control + INFECTION**: do these three directions compose or conflict?
