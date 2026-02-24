# Visual Readability in Chaotic Game States

## Research Date: 2026-02-23

How to make constantly-moving dot fields readable to players, with concrete techniques for Chain Reaction.

---

## 1. Geometry Wars: The Triple-Redundancy Rule

Every enemy in Geometry Wars is identifiable through **three simultaneous channels**: color, shape, and motion pattern. No two enemies share more than one channel.

| Enemy | Color | Shape | Motion |
|-------|-------|-------|--------|
| Grunt | Blue | Diamond/rhombus | Beeline to player, accelerates |
| Wanderer | Purple | Spinning pinwheel | Random wander, constant rotation |
| Weaver | Green | Square | Chases player, dodges bullets |
| Spinner | Pink/magenta | Octahedron/box | Fast approach, spawns children |
| Rocket | Orange trail | Arrow/airplane | Straight line, bounces off walls |

### Specific Visual Techniques

1. **Selective depth via shadows.** "Significant game objects a distinctive shadow, while the rest was left flat." Subtle depth cue helps subconscious focus.

2. **Grid as visual anchor.** The warping background grid replaced a starfield (too noisy). Provides stable reference frame. Gravity wells warp it = pre-attentive threat communication.

3. **Particle fade speed.** Effects "rain outward in showers of sparks that look spectacular yet fade quickly enough to let you plan your next move." Key word: "quickly" — decorative particles have aggressive fade-out.

4. **Audio as redundant channel.** "Individual enemies had unique spawning sounds, and experienced players were able to use these as cues."

5. **Neon bloom with white-hot centers.** White core, colored halo (how neon lights actually work). Creates natural figure-ground separation against dark playfield.

**Key insight for Chain Reaction:** GeoWars has ~12 enemy types, each with unique behavior. Visual design communicates behavior. Chain Reaction's dots currently all behave identically (random bounce) — lacking the behavioral differentiation that makes GeoWars readable.

Sources:
- [Bizarre Creations on GeoWars' Sensible Aesthetic](https://www.gamedeveloper.com/pc/the-color-and-the-shape-bizarre-creations-on-i-geowars-i-sensible-aesthetic)
- [Geometry Wars 3 Enemy Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2553017498)
- [Neon Vector Shooter Bloom Tutorial](https://gamedevelopment.tutsplus.com/tutorials/make-a-neon-vector-shooter-in-xna-bloom-and-black-holes--gamedev-9877)

---

## 2. Vampire Survivors: Density as Information

VS solves a different problem: not "what type?" but "where are the dense clusters?"

1. **Silhouette uniformity is a feature.** Enemies function as a fluid. Player reads **density gradients**, not individual entities.

2. **Player character is the visual anchor.** Everything else is a sea. Players read by negative space — "where are the gaps?"

3. **Pixel art compression as readability.** Small, simple sprites reduce visual noise per entity.

4. **Color coding for categories, not individuals.** Reds = aggressive, blues/greens = passive. Works because decision is "go left or right" not "shoot the blue one first."

5. **Performance IS clarity.** Cap at 300 active enemies prevents visual overload.

**Failure mode:** Late-game VS becomes unreadable. Players request particle reduction. Modders created "Super Performance Mode" stripping particles entirely.

**Key insight for Chain Reaction:** When entities function as a fluid, players read DENSITY not identity. Instead of "identify which dots are gravity type," ask "can you see where clusters of same-type dots have formed?"

Sources:
- [KokuTech: Power Fantasy in Vampire Survivors](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors)
- [Steam Discussion: VS Visibility](https://steamcommunity.com/app/1794680/discussions/0/4631482569784862180/)

---

## 3. Pre-Attentive Visual Processing (Treisman's Feature Integration Theory)

### Features processed in parallel, <200ms, no focused attention required:
- Color (hue)
- Orientation (angle)
- Size (area)
- Motion direction and speed
- Luminance (brightness)
- Curvature
- Closure (enclosed vs open)

### The pop-out effect
A target defined by a single unique feature (one red dot among blue) is detected in **constant time regardless of display size**. "Feature search."

### Conjunction search (NOT pre-attentive)
A target defined by combination of features (red SQUARE among red triangles and blue squares) requires serial, attention-driven examination. Time increases linearly with display size.

### Chain Reaction's Current Problems

1. **Standard dot hue varies with Y-position** (`return 195 - (dot.y / H) * 180`). A standard dot at the top has different hue than at the bottom. This ACTIVELY FIGHTS pre-attentive processing. A standard dot near the bottom looks like a volatile dot (both approach hue 15).

2. **Hue alone is one channel.** With three types, distinguishing CLUSTERS of same-type requires counting/grouping, which is a conjunction task (same hue AND near each other) = serial, not parallel.

3. **Motion direction is pre-attentive but unused.** All dots move randomly. If gravity dots moved smoothly while volatile dots moved erratically, motion pattern would become a second pre-attentive channel.

**Critical finding:** To make same-type clusters pre-attentively visible, need cluster-level cues on a single channel. Most powerful: **luminance/brightness** — same-type clusters literally brighter than mixed regions.

Sources:
- [Feature Integration Theory - CUNY](https://pressbooks.cuny.edu/sensationandperception/chapter/feature-integration-theory/)
- [IxDF: Preattentive Visual Properties](https://www.interaction-design.org/literature/article/preattentive-visual-properties-and-how-to-use-them-in-information-visualization)

---

## 4. The Squint Test

Physically squint (or apply Gaussian blur) until all detail disappears. If you can still read the game state, the game passes.

### Games that pass:
- **Diablo III**: Single dominant background hue per area, distinctive character/enemy silhouettes
- **Overwatch**: Silhouette primacy — "Was their silhouette too similar to an existing character?"
- **Link's Awakening**: Black outlines on interactive elements, none on scenery

### Does Chain Reaction pass?
**Almost certainly no.** With blur: standard/gravity/volatile dots blur into "glowing points on dark background." Y-position hue gradient creates misleading structure. Same-type clusters NOT visible because 5px dots are too small for color to register at blur resolution.

Sources:
- [GB Studio Central: Readability](https://gbstudiocentral.com/tips/dwf-chapter-6-readability-part-1/)
- [GDC 2012: The Art of Diablo III](https://ewdasq.t-lautner.com/features/id/5666/article/gdc-2012-the-art-of-diablo-iii/)
- [Designing Overwatch](https://www.coolandbecker.com/en/article/378/designing-overwatch.html)

---

## 5. Concrete Techniques for Chain Reaction (Priority Order)

### Technique 1: Fix Standard Dot Color (1 line change, HIGH impact)
Give standard dots a **fixed hue** (195 cyan) instead of Y-position gradient. Currently `getDotHue()` returns `195 - (dot.y / H) * 180` — standard dots at screen bottom are literally the same hue as volatile dots. This is a readability bug.

### Technique 2: Same-Type Neighbor Glow (~20 lines, HIGH impact)
Compute `_sameTypeNeighbors` instead of `_neighbors`. Make glow boost respond only to nearby same-type dots. When 3 gravity dots are near each other, purple glow intensifies and merges. Isolated dots stay dim. Creates real-time density heatmap filtered by type.

**The science:** Luminance is pre-attentive. Same-type clusters become brighter = pop-out without focused attention. Gestalt proximity + similarity reinforced along the gameplay-relevant dimension.

### Technique 3: Type-Specific Motion Patterns (~10 lines, ZERO render cost)
- **Gravity**: Slow sinusoidal perturbation to velocity angle. Creates gentle curving paths — looks "heavy."
- **Volatile**: Per-frame random jitter on position. Creates visible vibration — looks "unstable."

**The science:** Gestalt law of common fate — elements moving same way perceived as group. Pre-attentive channel at zero rendering cost.

### Technique 4: Connection Lines Between Same-Type Neighbors (~30 lines, HIGH impact)
Draw faint lines (alpha 0.05-0.12) between same-type dots within 2x explosion radius. Gestalt law of uniform connectedness: "elements connected by lines perceived as single unit" — stronger than proximity or similarity alone.

### Technique 5: Enlarge Type Decorations (~15 lines, MEDIUM impact)
Current decorations (spiral lines for gravity, sparks for volatile) at 1px lineWidth/alpha 0.2 are invisible on mobile. Increase to visible levels. Goal: volatile dots look "spiky," gravity dots look "heavy" even at a glance.

### Technique 6: Low-Resolution Type Density Heatmap (~60 lines, HIGHEST impact)
20x20 grid, count dots of each type per cell, Gaussian blur, render as faint colored glow. Passes the squint test — even unfocused, player sees "purple cloud here, orange cloud there."

### Technique 7: Metaball Rendering for Clusters (~100+ lines, VISUAL POLISH)
When 3+ same-type dots are within 3x DOT_RADIUS, render merged glow blob. Beautiful but expensive. Render at 1/4 resolution and upscale.

### The Bullet Hell Color Lesson
Cave (shmup developer) found optimal bullet colors through years: **pink and bright blue on dark backgrounds**. Maximally distinguishable. For Chain Reaction's three types:
- **Standard**: Cool blue/cyan (hue ~195) — recedes, reads as "neutral"
- **Gravity**: Deep purple/magenta (hue ~270) — reads as "heavy/dark"
- **Volatile**: Warm orange/amber (hue ~30) — reads as "hot/energetic"

These are ~90 degrees apart on color wheel — minimum for reliable pre-attentive discrimination. Current assignments are close but standard dots don't use hue 195 consistently.

---

## Additional Sources
- [SHMUPtheory: Anatomy of a Shmup](http://shmuptheory.blogspot.com/2010/02/anatomy-of-shmup.html)
- [Sparen's Danmaku Design Guide](https://sparen.github.io/ph3tutorials/ddsga2.html)
- [Dan Fornace: The Power of Silhouettes](https://fornace.medium.com/fighting-game-design-with-dan-fornace-the-power-of-silhouettes-915fde48318f)
- [IxDF: Law of Uniform Connectedness](https://www.interaction-design.org/literature/topics/law-of-uniform-connectedness)
- [Kenneth Moreland: Color Map Advice](https://www.kennethmoreland.com/color-advice/)
- [Gestalt Principles in Computer Games (PDF)](https://www.thinkmind.org/articles/icds_2022_2_40_10021.pdf)
