# Readable Board Structure in Real-Time Games

## The Problem Statement

Chain Reaction has a homogeneous field problem: dots move randomly, distribute roughly evenly, and the board lacks spatial differentiation. When everything looks the same everywhere, there is no meaningful decision about WHERE to tap. The player cannot "read" the board because there is nothing to read.

This research examines how other games solve this exact problem -- creating readable structure in continuously-changing, real-time game states -- and identifies the minimum interventions that could work for Chain Reaction.

---

## Part 1: Games With Moving Pieces That Create Readable Patterns

### Geometry Wars: Structure Through Enemy Archetypes

Geometry Wars solves the homogeneity problem by making every entity on screen behave differently. Each enemy type has a distinct visual shape, color, movement pattern, and threat level. The player learns to read a chaotic field by recognizing behavioral archetypes:

- **Wanderers** (blue diamonds): drift randomly, low urgency
- **Rockets** (pink arrows): travel straight at fixed speed, reverse at walls -- creates predictable "lanes" through chaos
- **Grunts** (blue squares): slowly home toward player -- creates a pressure gradient (density increases near player)
- **Spinners** (green): orbit and dodge -- creates local turbulence zones
- **Snakes** (orange chains): follow leader in formation -- creates readable "veins" cutting across the field

The critical insight: **differentiated behavior creates emergent spatial structure even when spawn positions are random.** Wanderers spread out. Grunts cluster around the player. Rockets create linear corridors. The field self-organizes into readable zones not because the designer placed entities in patterns, but because different movement rules produce different spatial distributions.

Geometry Wars: Retro Evolved 2's **Pacifism mode** demonstrates this at its purest: the player cannot shoot, only fly through gates that explode. The entire game becomes about reading the density field of slow-homing blue enemies and finding corridors through them. The enemies ARE the structure. Players plan exits before entering safe zones and position to force enemies to group at predictable points.

**Mechanism:** Behavioral differentiation --> emergent spatial clustering --> readable structure.

Sources: [Geometry Wars Comprehensive Enemy Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2553017498), [Creating a New Enemy in Geometry Wars 3](https://blog.playstation.com/2015/04/03/creating-a-new-enemy-in-geometry-wars-3-dimensions-evolved/), [Pacifism Mode](https://geometry-wars.fandom.com/wiki/Pacifism)

### Fruit Ninja: Trajectory Arcs as Timing Windows

Fruit Ninja creates readability from a chaotic field through **predictable trajectories with apex points**. Fruit follows parabolic arcs with known physics. The player reads:

1. **Apex moments** -- fruit hangs briefly at the top of its arc (slowest speed, easiest to track)
2. **Spawn lanes** -- fruit emerges from the bottom edge at predictable x-positions
3. **Clustering** -- multiple fruits launched together create a group with a shared timing window

The design creates natural "now!" moments. Not every frame is equal -- arcs create temporal differentiation where some moments are clearly better for swiping than others. The player learns to wait for apex clusters.

**Mechanism:** Predictable physics + arc peaks = temporal hotspots the player can anticipate.

Source: [Mechanics, Dynamics, and Aesthetics of Fruit Ninja](https://elena-berman.medium.com/mechanics-dynamics-and-aesthetics-of-fruit-ninja-23aaa72fd6c7)

### Missile Command: Trajectory Creates Priority

Missile Command transforms a field of incoming missiles into a readable decision space through **visible trajectories that create urgency gradients**. The player sees:

- Where each missile is going (which city it threatens)
- How fast it's traveling (time until impact)
- How many counter-missiles remain per battery (resource scarcity)

The readability comes from trajectories themselves being visible on screen as lines. The player doesn't have to predict -- they can SEE the future state. This transforms chaos into a triage problem: which threats matter most, given limited resources?

**Mechanism:** Visible trajectories + resource scarcity = priority-based reading.

Source: [Missile Command: Bitvint](https://bitvint.com/pages/missile-command), [Gaming Conceptz: Missile Command Design Class](http://gamingconceptz.blogspot.com/2016/05/missile-command-game-design-class-in.html)

### Asteroids: Size/Speed Inversion Creates Threat Hierarchy

Asteroids creates a simple but effective visual hierarchy through a size-speed inversion:

| Size | Speed | Points | Collision Area | Threat |
|------|-------|--------|---------------|--------|
| Large | Slow (4 ship-lengths/s) | Low (20) | 2.4x ship | Low -- visible, predictable |
| Medium | Medium | Medium (50) | 1.2x ship | Medium |
| Small | Fast (6.5 ship-lengths/s, 63% faster) | High (100) | 0.6x ship | High -- fast, hard to track |

The player learns: big = safe to ignore temporarily, small = immediate danger. The field becomes readable because different sizes telegraph different urgency levels. The scoring system reinforces this: small asteroids are worth 5x more than large ones because they're harder.

Four small asteroids have the same total collision area as one large asteroid, but their higher speed makes them more dangerous. The designer balanced this so splitting asteroids doesn't trivially simplify the field.

**Mechanism:** Size-speed inversion creates visual priority hierarchy without adding rules.

Source: [Asteroids: By the Numbers](https://www.retrogamedeconstructionzone.com/2019/10/asteroids-by-numbers.html)

### Ikaruga: Binary Filter Cuts Chaos in Half

Ikaruga's polarity system is the most elegant solution to visual chaos in any shmup. One rule: everything is either black or white. The player's ship switches polarity at will. Same-color bullets are absorbed (safe). Opposite-color bullets kill.

This single binary distinction transforms an overwhelming bullet screen into a readable pattern. At any moment, the player filters the entire screen into "safe" and "dangerous" -- cutting the cognitive load roughly in half. The pattern IS the structure: clusters of same-color bullets become safe corridors, while opposite-color clusters become walls.

The scoring system (chains of same-color kills in groups of 3) adds a SECOND reading layer. The player must read not just safety but also scoring opportunity, creating a tension between conservative play (absorb everything) and aggressive play (rapidly switch to chain kills).

Director Hiroshi Iuchi achieved this structure from a single rule. The polarity mechanism informs everything: stage layouts, enemy firing patterns, bullet density. All complexity emerges from one binary toggle.

**Mechanism:** A single binary property applied to all entities creates instant visual filtering of the entire field.

Source: [Ikaruga Mechanics Analysis](https://jonmillymiles.wordpress.com/2013/02/19/mechanics-ikaruga/), [PC Gamer: Ikaruga's Rule of Threes](https://www.pcgamer.com/ikarugas-rule-of-threes/), [Shmups Wiki: Ikaruga](https://shmups.wiki/library/Ikaruga)

### Bullet Hell Games: Readable Chaos Through Pattern Discipline

Bullet hell (danmaku) games routinely display hundreds of projectiles on screen while remaining readable. The specific techniques:

1. **Directional bullet graphics**: Bullets that visually indicate their travel direction (elongated shapes, vector indicators) let players instantly parse trajectory without tracking movement over time.

2. **Mental filtering through spatial relevance**: Most bullets on screen are moving AWAY from the player. Designers know players naturally filter irrelevant threats. Dense screens feel intense but are cognitively manageable because only nearby threats require active tracking.

3. **Distinct visuals per pattern layer**: When multiple attack patterns overlap, each uses a different bullet shape/color. Players parse composite attacks as separate layers, not one undifferentiated mass.

4. **Static vs. aimed patterns**: Static patterns (fixed trajectories) create predictable obstacles. Aimed patterns (tracking player position) create dynamic tension. Layering both creates readable complexity: the static pattern is the "terrain" and the aimed pattern is the "threat."

5. **Bullet visibility priority**: Enemy bullets are ALWAYS rendered on top of explosions, power-ups, and other visual effects. This hard rendering priority ensures threat information is never obscured by decoration.

**Mechanism:** Consistent visual language per threat type + rendering priority + directional indicators = readable density.

Sources: [Sparen's Danmaku Design Guide A2](https://sparen.github.io/ph3tutorials/ddsga2.html), [The Anatomy of a Shmup](https://www.gamedeveloper.com/design/the-anatomy-of-a-shmup), [Boghog's Bullet Hell 101](https://shmups.wiki/library/Boghog's_bullet_hell_shmup_101)

### Resogun: Wave Patterns as Temporal Structure

Housemarque's Resogun spawns enemies in strict wave patterns with distinct formations. Despite individual enemies moving and the cylinder scrolling, waves create temporal readability: players know "a wave is arriving from the left" or "enemies are surrounding me." The wave IS the structure -- it tells the player where to focus attention and when.

Enemies are visually distinct (organic voxel shapes designed to be clearly recognizable as gameplay elements, not decoration), and each type has predictable AI routines.

**Mechanism:** Temporal wave structure + enemy archetype recognition = predictable spatial patterns over time.

Source: [Resogun Postmortem](https://www.gamedeveloper.com/business/the-game-is-the-boss-a-i-resogun-i-postmortem)

---

## Part 2: How Color/Type Differentiation Creates Structure

### Puyo Puyo: Color Adjacency as the Entire Game

Puyo Puyo demonstrates that color alone, combined with spatial rules, creates extraordinary strategic depth. The rules: 4+ same-color puyos connected orthogonally disappear. Pieces fall in pairs. That's it.

The board becomes readable because:
- **Color clusters are visually obvious** -- a group of 3 red puyos is a "nearly complete chain link"
- **Color conflicts are spatially meaningful** -- placing the wrong color breaks a chain path
- **Chain architecture is visible** -- experienced players see the chain structure embedded in the board state

Key design principle: Puyo Puyo players identify weaknesses in chains as "places where you need several color-specific pieces in order for it to function." The board is heterogeneous BECAUSE colors create local structure. Even two colors on a field would create readable patterns; four colors create rich decision space.

Players can be identified solely by how they build their chains. The simple rule of "same-color adjacency" creates enough differentiation that individual playstyles are recognizable.

**Mechanism:** Color adjacency rule + gravity = self-organizing visual clusters with strategic meaning.

Source: [Puyo Nexus: Color Decisions](https://puyonexus.com/wiki/Efficiency_1:_Color_Decisions), [How to Play Puyo Puyo](https://puyonexus.com/wiki/How_to_Play_Puyo_Puyo)

### Puzzle Bobble / Bust-a-Move: Fixed Clusters as Readable Terrain

Puzzle Bobble creates structure by having bubbles ACCUMULATE rather than just move. The top of the screen forms an increasingly complex topology of color clusters. The player reads this like terrain:

- "There's a big red cluster on the left connected to the ceiling by only two blue bubbles"
- "If I can reach that connection point with a blue shot, the whole cluster drops"

The critical mechanic: **dropped bubbles** (detached from the ceiling) score far more than popped bubbles (2 dropped = 40 pts, 3 = 80, 4 = 160, doubling each). This makes structural reading essential -- the smart play is identifying load-bearing connections and breaking them.

Wall bank shots add spatial reasoning: the player must plan ricochet angles to reach specific structural weak points.

**Mechanism:** Accumulated color clusters + structural weak points + cascading detachment = readable topology.

Source: [Puzzle Bobble Wikipedia](https://en.wikipedia.org/wiki/Puzzle_Bobble)

### Osmos: Size AS the Visual Language

Osmos solves the homogeneity problem through a single visual property: SIZE. All motes are the same type, but their size relative to the player determines everything:

- **Smaller motes (blue)**: safe to absorb, prey
- **Larger motes (red)**: dangerous, predator
- **Equal-sized motes**: neutral

The color coding is a direct function of relative size. The entire field becomes immediately readable: blue = opportunity, red = threat. But size changes continuously as motes absorb each other, so the map is always shifting. A former blue mote that has been absorbing neighbors might turn red.

The movement mechanic reinforces reading: propulsion costs mass (you shrink to move). So the player reads distance + size together: "that blue mote is close enough to reach without shrinking below the red mote behind me."

**Mechanism:** A single continuous variable (relative size) mapped to color creates instant field-wide readability.

Source: [Osmos Wikipedia](https://en.wikipedia.org/wiki/Osmos)

### Tetris: The 7-Bag and Structured Randomness

Tetris's 7-bag randomizer is a masterclass in creating readable structure from randomness. Instead of pure random piece selection, the game places all 7 pieces in a "bag," shuffles them, and deals them in order. Then refills.

This ensures:
- Maximum 12 pieces between any two I-pieces (vs. unbounded drought in pure random)
- Maximum 4 consecutive S/Z pieces (vs. unbounded runs)
- Every 7 pieces, you know you've seen everything once

The player can plan because the randomness has STRUCTURE. Not predictable, but bounded. The sequence has rhythm -- you know an I-piece is coming "soon" even if you don't know exactly when.

**Mechanism:** Bounded randomness (bag system) creates plannable structure without predictability.

Source: [Tetris Wiki: Random Generator](https://tetris.wiki/Random_Generator)

---

## Part 3: Speed/Trajectory Differentiation Creates Lanes

### Tower Defense (Defender's Quest): Paths as Readable Structure

The Defender's Quest designer articulated two core principles: **Let the player FOCUS** and **Test the player's THINKING.**

Key mechanisms for readability:
- **No scrolling**: The entire map fits in viewport. Off-screen information fragments attention.
- **Total information**: All game state visible at all times. Clickable readouts for health, damage, status effects.
- **2D aesthetics**: Deliberately chose 2D over 3D because top-down 2D is more naturally readable.
- **Time control**: Pausable with 0.25x-4x speed. Converts reaction tests into thinking tests.

Plants vs. Zombies simplified tower defense to horizontal lanes specifically to reduce cognitive burden -- "the player can still focus" when threats move in one dimension, not two.

**Mechanism:** Constrained movement paths + complete information visibility = readable decision space.

Source: [Optimizing Tower Defense for Focus and Thinking](https://www.fortressofdoors.com/optimizing-tower-defense-for-focus-and-thinking-defenders-quest/)

### Peggle: Trajectory Preview as Readable Physics

Peggle solved the "random physics" problem by making the FIRST bounce predictable. The player aims and sees a trajectory line showing where the ball will go. After the first bounce, physics takes over and outcomes become increasingly uncertain.

This creates a gradient of readability:
- First bounce: fully predicted (skill)
- Second bounce: roughly predicted (pattern recognition)
- Third+ bounce: unpredictable (excitement/luck)

The static peg field is critical: pegs don't move, so the environment IS the readable structure. Predictable ball paths through a knowable field. The designer explicitly noted that static pegs created "a more enjoyable experience" than moving ones because "the path of the ball would be more predictable."

Orange pegs (targets) are visually distinct from blue pegs (regular), creating an immediate spatial hierarchy: the player's eye goes to orange first, then plans a path through blue.

**Mechanism:** Trajectory preview + static environment + color-coded objectives = predictable near-term, exciting far-term.

Source: [Peggle Wikipedia](https://en.wikipedia.org/wiki/Peggle), [PopCap Peggle Case Study](https://sbgames.org/papers/sbgames09/artanddesign/60345.pdf)

### Pinball: Physics Zones as Readable Geography

Pinball tables are designed around the principle that different REGIONS of the table have different physics properties:

- **Lanes**: Constrained corridors that guarantee ball direction
- **Bumpers**: Active zones that accelerate and redirect
- **Flippers**: Player control points
- **Ramps**: Elevated paths that loop the ball back
- **Outlanes**: Danger zones leading to drain

The ball's behavior is chaotic in bumper zones but predictable in lanes. The table's GEOGRAPHY creates readable structure. A player who sees the ball enter a ramp knows approximately where it will exit. A ball near an outlane is in danger regardless of its exact trajectory.

Key design principle: "Flow machines" keep the ball moving with minimal full stops. The structure is spatial (zones) not temporal (pauses).

**Mechanism:** Fixed environmental zones with distinct physics properties = spatial structure overlaid on chaotic ball movement.

Source: [Pinball Design Theory: Flow](https://pinside.com/pinball/forum/topic/design-theory-discussion-1-flow), [Pinball Makers: Design](https://pinballmakers.com/wiki/index.php?title=Design)

---

## Part 4: Boids, Flocking, and Emergent Spatial Structure

Craig Reynolds' Boids algorithm demonstrates that three simple rules create visible, readable group structure from individual agents:

1. **Separation**: Avoid crowding neighbors
2. **Alignment**: Steer toward average heading of neighbors
3. **Cohesion**: Move toward center of mass of nearby agents

The result: emergent flocks, schools, herds -- visually coherent groups that move together. The structure is not designed; it's a mathematical inevitability of the rules.

For Chain Reaction, this is directly relevant. Currently, dots have NO inter-dot forces. They move independently. Adding even ONE boid rule (cohesion) would cause dots to spontaneously cluster, creating the heterogeneous field the game lacks.

The elegance: the rule is simple (steer toward nearby dots), the parameter is tunable (cohesion radius and strength), and the result is visually dramatic (dots clump into readable groups instead of spreading uniformly).

**Mechanism:** Simple local interaction rules create emergent global structure.

Source: [Boids - Wikipedia](https://en.wikipedia.org/wiki/Boids), [3 Simple Rules of Flocking Behaviors](https://gamedevelopment.tutsplus.com/tutorials/3-simple-rules-of-flocking-behaviors-alignment-cohesion-and-separation--gamedev-3444)

---

## Part 5: The Minimum Intervention Analysis

### What Chain Reaction Currently Has

- Dots move randomly (uniform speed, random direction, wall bounce)
- Three types exist (standard, gravity, volatile) but are randomly distributed
- No inter-dot forces
- No spawn structure
- No environmental features
- No trajectory prediction

### The Homogeneity Cascade

The root cause of board homogeneity is that **independent random walkers converge to a uniform spatial distribution over time.** This is a mathematical inevitability: without forces that create heterogeneity, the system equilibrates to maximum entropy (uniformity). Every intervention below must break this equilibrium.

### Ranked Interventions (Minimum to Maximum Complexity)

#### Intervention 1: Type-Clustered Spawning ("Salad Not Soup")
**Complexity to learn:** Zero (player sees it; doesn't need to understand it)
**Complexity to implement:** Low

Instead of spawning dot types randomly across the field, spawn them in spatial clusters. A group of 3-4 gravity dots appears together. A streak of volatile dots enters from one edge.

This is already in your Next Steps as item 1. It's the single highest-leverage change because:
- It creates VISIBLE heterogeneity without adding any new rules
- Players naturally read color clusters ("the purple zone" vs "the orange zone")
- It creates spatial decisions: "do I tap in the gravity cluster to pull volatile dots in, or tap the volatile cluster for radius?"
- It's the Tetris 7-bag principle: structured spawning, not random spawning

The Puyo Puyo lesson: color clusters ARE the strategy. The moment dots are spatially grouped by type, the board has readable geography.

#### Intervention 2: Lightweight Cohesion Force (Soft Boids)
**Complexity to learn:** Zero (dots just look like they clump sometimes)
**Complexity to implement:** Low-Medium

Add a weak cohesion force: each dot steers slightly toward the nearest 2-3 dots of the same type. Not strong enough to form permanent clusters, but enough to break the uniform distribution.

This creates spontaneous micro-clusters that form, drift, and dissolve. The field becomes "lumpy" instead of uniform. Players see density variations and learn to tap in high-density moments.

The key tuning parameter is cohesion strength vs. base movement speed. Too strong = permanent blobs (boring). Too weak = no visible effect. The sweet spot creates readable density fluctuations on a 2-4 second cycle.

This is the Geometry Wars principle: differentiated movement rules create emergent spatial structure. Gravity dots already do this (they pull neighbors). Extending soft cohesion to same-type affinity generalizes it.

#### Intervention 3: Speed Differentiation with Visual Encoding
**Complexity to learn:** Low (Asteroids-level intuitive -- small/fast, big/slow)
**Complexity to implement:** Low

This already exists partially (volatile = fast, gravity = slow). The intervention is making the speed difference MORE visible and MORE extreme:

- Slow dots: larger, pulsing, trail effect showing recent path
- Fast dots: smaller, jittery, motion blur
- The speed difference itself creates structure: slow dots form dense regions (they stay in areas longer), fast dots create sparse regions (they transit through areas quickly)

The Asteroids lesson: the size-speed inversion is instantly readable. Big = slow = low urgency. Small = fast = high urgency. No tutorial needed.

#### Intervention 4: Directional Spawning (Wave Structure)
**Complexity to learn:** Low (player sees groups arriving from edges)
**Complexity to implement:** Low

Instead of spawning dots at random edge positions, spawn them in WAVES from specific directions. A group of 5 dots enters from the left. 3 seconds later, a group enters from the top-right.

This creates temporal-spatial structure: the player sees a wave arriving and can anticipate where it will create a density spike. The Resogun and Geometry Wars principle: waves create readable temporal rhythm overlaid on spatial chaos.

Combined with type-clustered spawning, waves become even more readable: "a volatile wave is coming from the left while a gravity cluster sits in the center."

#### Intervention 5: Environmental Attractors (Fixed Hot Zones)
**Complexity to learn:** Medium (player must learn what zones do)
**Complexity to implement:** Medium

Add 2-3 fixed points on the field that weakly attract nearby dots (gravity wells). Dots drift toward these points, creating persistent density hotspots. The field is no longer uniform because the ENVIRONMENT has structure.

This is the Pinball principle: fixed geography overlaid on dynamic ball movement. The hot zones create predictable density without making dots static.

Visual encoding: subtle radial gradient or glow at attractor points. The player reads "dots are thicker near the glow" and learns to time taps for when clusters drift through hot zones.

Osmos uses a version of this with its "Attractor" levels where special motes create gravitational fields that warp movement patterns.

Risk: could conflict with Design Principle 5 (Dots Are Always In Motion) if attractors create static clumps. Must be weak enough that dots orbit/drift through rather than settling permanently.

#### Intervention 6: Binary Property (Ikaruga Approach)
**Complexity to learn:** Medium (one new concept)
**Complexity to implement:** Medium

Add a single binary property to dots (e.g., "charged" vs "neutral"). Charged dots glow brighter. A tap on a charged dot creates a larger/longer explosion. A tap on a neutral dot creates a standard explosion. But charged dots convert neutral neighbors when caught in an explosion (property transmission, which you already have).

This creates an Ikaruga-style binary filter: the player reads the field as "charged zones" and "neutral zones" and decides where the best tap point is to maximize chain propagation. The binary nature makes it instantly readable -- the field becomes a two-tone map rather than uniform.

This may already be partially served by gravity/volatile types, but the Ikaruga lesson is that a BINARY distinction is more readable than a three-way or four-way one. Two types = instant reading. More types = requires more cognitive effort.

---

## Part 6: Synthesis -- The Key Design Principle

### The Readability Hierarchy

From this research, readable board structure comes from a hierarchy of mechanisms:

1. **Behavioral differentiation** (entities move differently) --> emergent spatial patterns
2. **Visual encoding** (different things look different) --> instant type recognition
3. **Spatial clustering** (similar things group together) --> readable "zones"
4. **Temporal structure** (things arrive in waves/rhythms) --> predictable density changes
5. **Environmental geography** (fixed spatial features) --> persistent structure

Each layer adds structure but also adds complexity to learn. The principle from Ikaruga and Go: elegance = maximum depth from minimum rules.

### The Most Elegant Solutions for Chain Reaction

Based on the research, ranked by elegance (depth created / complexity added):

1. **Type-clustered spawning** -- Adds zero new rules. Changes only WHERE existing types appear. Creates instant visual geography. This is the single most elegant change.

2. **Soft same-type cohesion** -- Adds one invisible rule (dots drift toward same-type neighbors). Creates spontaneous clustering that players see but never need to understand mechanically. The field becomes "alive" with visible density fluctuations.

3. **Wave spawning** -- Adds temporal rhythm. Groups of dots enter from edges in pulses rather than individually. Creates anticipation ("here comes the next wave"). Combined with type-clustering, waves carry type-identity ("the purple wave from the left").

These three interventions combined -- clustered types, soft cohesion, wave spawning -- would transform a uniform random field into one with visible zones, temporal rhythm, and density fluctuations. None adds complexity to the player's decision model. They all make the existing type system more readable by giving it spatial structure.

### What NOT to Do (Boomshine Plus Lesson)

Boomshine Plus added 6 dot types, 105 levels, and hard mode to a luck-dominant core. Result: 3 Steam reviews. The lesson: adding content to a structureless base doesn't create structure. The differentiation must emerge from the system's physics, not from bolted-on features.

Chain Reaction already has the right foundation (dot types with physics-based properties, property transmission, cascade momentum). The gap is not in the rules but in the spatial distribution of those rules. The board has the right ingredients but is mixed into soup instead of arranged as a salad.

---

## Summary Table: Mechanisms by Game

| Game | Mechanism | What Creates Readability | Applicable to Chain Reaction? |
|------|-----------|------------------------|------------------------------|
| Geometry Wars | Enemy archetypes | Different behaviors create different spatial distributions | Yes -- dot types should move differently enough to cluster differently |
| Fruit Ninja | Arc trajectories | Apex moments create temporal hotspots | Partially -- wave spawning could create similar "now!" moments |
| Missile Command | Visible trajectories | Player sees future state directly | No -- dots have no fixed destination |
| Asteroids | Size-speed inversion | Visual hierarchy without new rules | Yes -- speed/size differentiation already in dot types |
| Ikaruga | Binary polarity | Single property filters entire field | Partially -- two dominant types could create binary reading |
| Bullet hell | Pattern discipline | Consistent visual language per threat type | Yes -- each dot type needs distinct visual treatment |
| Puyo Puyo | Color adjacency | Color clusters ARE the strategy | Yes -- type clusters should be the strategy |
| Puzzle Bobble | Accumulation | Clusters form readable topology | Partially -- cohesion could create temporary accumulations |
| Osmos | Relative size | One variable mapped to color = instant field readability | Partially -- could map relative dot density to visual intensity |
| Tetris 7-bag | Bounded randomness | Structured spawning prevents droughts | Yes -- spawn system should guarantee type variety per wave |
| Peggle | Trajectory preview | Predictable near-term, chaotic far-term | Partially -- near-term chain prediction could be shown |
| Pinball | Physics zones | Fixed geography on dynamic movement | Maybe -- environmental attractors, but risks conflicting with motion principle |
| Boids/Flocking | Local interaction rules | Emergent group structure | Yes -- soft cohesion is high leverage |
| Lumines | Timeline sweep | Temporal structure divides spatial field | No -- Chain Reaction has no sweep mechanic |
| Defender's Quest | Full information visibility | Player can read everything at once | Yes -- ensure all game state is always visible |
| Resogun | Wave formations | Temporal rhythm creates anticipation | Yes -- wave spawning with type identity |

---

## Recommended Implementation Order

1. **Type-clustered spawning** (the "Salad not Soup" change already identified in Next Steps)
2. **Soft same-type cohesion** (weak boid-like attraction between same-type dots)
3. **Wave spawning** (groups enter from edges in pulses, not individually)
4. **Validate with simulation** -- measure F3 (opportunity density) before and after each change to ensure clusters form but don't become permanent

All three are simulatable. Run the sweep before implementing in the browser.
