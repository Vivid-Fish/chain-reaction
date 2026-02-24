# Strategic Depth Without Losing Casual Appeal

Research on how successful games add strategic depth while preserving the "tap and watch chaos" experience. Conducted 2026-02-23 for Chain Reaction's same-type chaining rule decision.

---

## 1. Tetris Effect — Spectacle as Stealth Depth

### The Insight
Tetris is the most casual-friendly puzzle game ever made. Tetris Effect doesn't add complexity to the rules. It adds a *sensory layer* that makes the existing depth feel new, then sneaks in ONE new mechanic (Zone) that transforms strategic play without touching the casual experience.

### How It Works

**The 1:1:1 ratio.** Mizuguchi's team discovered through prototyping that gameplay, visuals, and sound needed a 1:1:1 balance. Early prototypes felt overwhelming because gameplay dominated. They deliberately pulled back game intensity and invested equally in audiovisual response. The result: casual players experience a meditative sound-and-light show. They don't realize they're getting better at Tetris because the sensory reward masks the learning curve.

**Zone: The "one new rule."** The Zone mechanic fills a meter through line clears. When activated, gravity stops. Lines cleared stack at the bottom instead of disappearing. Time freezes. This is a single addition that:
- **For casual players**: A panic button. "I messed up, let me freeze time and fix my board." Zone is a *safety net* that reduces frustration.
- **For competitive players**: A scoring multiplier requiring setup. Clearing 20+ lines in Zone (a "Perfectris" or "Ultimatris") demands building a specific board state BEFORE activating. The same mechanic is simultaneously a crutch and a skill ceiling.

**Key design detail**: All synesthetic effects (particles, audio triggers, haptics) occur OUTSIDE the playfield. The team explicitly kept the playfield clean. The spectacle surrounds the game without interfering with it.

### Application to Chain Reaction
Chain Reaction already has the spectacle layer (particles, screen shake, audio). The Zone parallel is the Multi-Tap Supernova (already designed). The lesson for the same-type chaining rule: it should function like Zone -- casual players can ignore it entirely and still enjoy the chaos. Experts exploit it for dramatically higher scores.

### Sources
- [Interview with Tetsuya Mizuguchi on Synesthesia, Tetris Effect, Rez, Lumines](https://wccftech.com/interview-tetsuya-mizuguchi-synesthesia-tetris-effect-rez-lumines/)
- [Tetris Effect Development Was Anything But Zen-Like](https://variety.com/2019/gaming/features/tetris-effects-development-was-anything-but-zen-like-1203169014/)
- [Tetris Effect Adds A New Strategic Layer](https://blog.playstation.com/2018/06/25/tetris-effect-adds-a-new-strategic-layer-to-the-decades-old-game-and-it-works/)
- [Tetris Effect Enhancing Gameplay with Synesthesia](https://www.nicholassinger.com/blog/tetriseffect)
- [Tetris Effect Zone Mode Allows Players to Freeze Time](https://www.playstationlifestyle.net/2018/06/25/tetris-effect-zone-mode-detailed-allows-players-to-freeze-time/)

---

## 2. Slay the Spire — Ascension as Invisible Depth Ladder

### The Insight
Slay the Spire doesn't present all its depth at once. It uses a structural trick: the same game becomes a different game at different difficulty levels. Casual players never see the depth because they never need it. The depth reveals itself only to players who choose to seek it.

### How It Works

**No tutorial.** There is no explicit tutorial. The Ironclad (first character) has straightforward RPG-style cards: "Deal 6 damage," "Block 5." Players beat the game on their first run using intuition. The game never explains its depth -- it just works.

**Character gating as complexity ramp.** The Ironclad is available first (simple mechanics). The Silent unlocks next (combos, discard synergies). The Defect third (orbs, focus, complex interactions). By the time a player reaches the Defect, they've played for hours and are ready for complexity they would have rejected at the start.

**Ascension: 20 levels of invisible difficulty.** After beating the game, Ascension 1 adds one modifier (elites deal more damage). Ascension 2 adds another. Each modifier stacks. The critical design principle: **each difficulty level forces the player to re-evaluate previously dismissed cards.** A card that seemed useless at Ascension 0 becomes essential at Ascension 10, because the modifier set makes the old strategy nonviable.

The player discovers the game's depth not by reading about it, but by being forced to find new strategies by new constraints. The depth was always there; the difficulty progression just makes it visible one layer at a time.

**Imperfect solutions.** The design philosophy explicitly avoids "obviously correct" choices. Every card is a tradeoff. Frontloaded damage solves the immediate problem but weakens you for scaling enemies. Scaling cards are weak early but dominate late. The game presents problems with multiple valid solutions, ensuring that both casual and expert play feel correct.

### Application to Chain Reaction
The same-type chaining rule should NOT be explained in a tutorial. It should be discoverable. When a player taps a cluster of same-colored dots and gets a bigger chain than expected, they learn by observation. The Ascension principle suggests that the continuous mode tiers (CALM through IMPOSSIBLE) serve a similar purpose: at CALM, type-matching doesn't matter. At SURGE, type-awareness becomes the difference between surviving and not. The depth reveals itself through difficulty, not instruction.

### Sources
- [Game Design Tips from Slay the Spire - Cloudfall Studios](https://www.cloudfallstudios.com/blog/2020/11/2/game-design-tips-reverse-engineering-slay-the-spires-decisions)
- [More Games Should Handle Difficulty Like Slay the Spire - Frostilyte](https://frostilyte.ca/2020/04/16/more-games-should-handle-difficulty-like-slay-the-spire/)
- [Road to the IGF: Mega Crit Games' Slay the Spire](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-)
- [Slay the Spire Ascension - Fandom Wiki](https://slay-the-spire.fandom.com/wiki/Ascension)

---

## 3. Hades — Death as Content, Not Failure

### The Insight
Hades makes failure feel like progress by ensuring that dying produces unique content (dialogue, story, upgrades) that winning does not. Casual players are motivated by the story. Hardcore players are motivated by mastery. Both play the same game and both feel rewarded every session.

### How It Works

**Narrative death rewards.** Hades has approximately 300,000 words of dialogue. Critically, much of this dialogue is gated behind death. When you die:
- Hypnos comments on your specific cause of death (75 unique lines for different enemies/methods)
- Characters react to your recent run specifics ("I see you made it past Meg this time")
- New story beats unlock based on run count, not victory count
- The game exhausts ALL unused dialogue options before repeating any

This means casual players who die frequently see MORE story content than skilled players who win quickly. Death literally produces more game than victory.

**God Mode: The most elegant difficulty toggle ever designed.** God Mode grants 20% damage resistance on activation, then increases by 2% per death, capping at 80%. This is brilliant for several reasons:
1. The initial 20% is immediately noticeable -- it doesn't feel like a placebo
2. The 2% increments are almost imperceptible individually, but compound dramatically over 20-30 deaths
3. It's personalized: a player who dies 30 times gets 80% resistance. A player who dies 10 times gets 40%. The game adapts to each player's skill level automatically
4. There is NO penalty for using it: all achievements, all content, all story remain accessible
5. It can be toggled ON or OFF at any time, meaning players can try without God Mode, fail, turn it on, succeed, then turn it off to challenge themselves

Greg Kasavin: "Our big focus from the start was to take the sting of failure and reduce that as much as possible." And: "I don't think roguelikes are appealing simply because they're hard. The part that's interesting about roguelikes is that it's different every time you play."

**Reactivity.** Kasavin describes "reactivity" as a core narrative goal: "moments where you feel the game is paying attention." The game tracks what you did, how you died, who you fought, what boons you took, and comments on all of it. This creates a sense of a living world that casual players find emotionally engaging and hardcore players find impressively thorough.

### Application to Chain Reaction
Chain Reaction already has the near-miss feedback system ("47/50 -- so close!"). The Hades lesson extends this: every failed round should produce something the player values. In continuous mode, the "death" moment (overflow) could trigger a recap showing the player's longest chain, best moment, and what the oracle would have done differently. The Boomshine problem (failure feels like "bad luck") is solved by making failure informative and entertaining.

For the same-type rule specifically: if a player accidentally triggers a same-type chain, the celebration should be slightly different (unique sound, different particle color) so they learn "something special happened" without being told what. Discovery is the reward.

### Sources
- [How Supergiant Weaves Narrative Rewards into Hades' Cycle of Death](https://www.gamedeveloper.com/design/how-supergiant-weaves-narrative-rewards-into-i-hades-i-cycle-of-perpetual-death)
- [How the Dialogue System in Hades Rewards Failure](https://www.christi-kerr.com/post/how-the-dialogue-system-in-hades-rewards-failure)
- [Hades Devs Reveal How God Mode Solves the Worst Thing About the Genre](https://www.inverse.com/gaming/hades-god-mode-interview)
- [Hades God Mode Origins Explained by Supergiant Games](https://caniplaythat.com/2021/08/11/hades-god-mode-explained-by-supergiant-games/)
- [How Hades Made a Genre Known For Being Impossibly Hard Accessible](https://www.vice.com/en/article/how-hades-made-a-genre-known-for-being-impossibly-hard-accessible/)

---

## 4. Pokemon — The Layered Depth Architecture

### The Insight
Pokemon is the most commercially successful entertainment franchise in history. Its core design achieves something remarkable: a 7-year-old and a tournament player can both play the same game, enjoy it fully, and never encounter each other's experience. The depth is not "hidden" -- it's *structurally invisible* to anyone who doesn't seek it.

### How It Works

**Layer 1 (Universal): Type matchups.** Water beats Fire. Fire beats Grass. Grass beats Water. Every player learns this. It's visual, intuitive, and sufficient to beat the entire single-player campaign. A child who only knows type matchups will finish the game.

**Layer 2 (Discoverable): Abilities, held items, move coverage.** Players who want to be more effective learn that Pokemon have abilities that modify combat, that held items provide passive effects, and that move coverage (having moves of different types) creates flexibility. This layer is visible in the UI but never required. A player who ignores abilities entirely can still beat the Elite Four.

**Layer 3 (Hidden): EVs and IVs.** Individual Values (IVs) are hidden stat modifiers assigned at birth (0-31 per stat). Effort Values (EVs) are hidden stat bonuses earned from specific enemy types. These numbers are NEVER displayed in the base game UI. They are invisible. A casual player has no idea their Pikachu's speed is 12% lower than the theoretical maximum. It doesn't matter for single-player.

**Layer 4 (Community): Competitive metagame.** Natures (25 options, each boosting one stat and reducing another), EV training routes, IV breeding chains, moveset optimization, team composition theory. This layer exists ENTIRELY outside the game. Players learn it from wikis, forums, YouTube. The game itself never teaches it, never references it, and never requires it.

**The structural principle**: Each layer ONLY matters when competing against someone who uses it. Against NPCs, Layer 1 is sufficient. Against casual online opponents, Layer 2 helps. Against tournament players, Layers 3-4 are mandatory. The game doesn't add difficulty modes -- it adds *opponents of varying sophistication*.

**The invisibility technique**: The game never shows a "you could be doing better" indicator. There's no efficiency meter. No "your Pokemon's IVs are suboptimal" warning. The casual player's experience is complete and satisfying without ever encountering the depth. The depth doesn't make the surface worse -- it's a parallel universe that coexists invisibly.

### Application to Chain Reaction
The same-type chaining rule should follow the Pokemon layering model:

- **Layer 1 (universal)**: Tap dots. Watch explosions. Enjoy chaos. This MUST remain fully satisfying.
- **Layer 2 (discoverable)**: "Hey, same-colored dots seem to chain better." The visual feedback (color-matched chain particles, slightly different sound) makes this noticeable but never explained.
- **Layer 3 (mastery)**: Planning tap positions to exploit same-type clusters. Knowing that tapping a gravity dot near volatile dots of the same color produces the supernova. This emerges from repetition.
- **Layer 4 (community)**: Optimal tap positioning for type-aware cascade exploitation. This is for leaderboard chasers.

The key constraint: Layer 1 must NEVER feel diminished by the existence of Layer 2+. If a casual player taps randomly and gets a smaller chain than a type-aware player, that's fine. If a casual player taps randomly and gets ZERO chain because same-type filtering blocks cross-type explosions, that's a design failure.

### Sources
- [Hidden Depth: Different Levels of Play in Pokemon - Lyonfaced Blog](https://lyonfacedblog.wordpress.com/2015/05/05/hidden-depth-in-pokemon/)
- [Pokemon: 7 Hidden Mechanics In The Games - Game Rant](https://gamerant.com/pokemon-hidden-game-mechanics/)
- [Pokemon: 10 Mechanics That Go Unnoticed By The Average Player - CBR](https://www.cbr.com/pokemon-hidden-mechanics-go-unnoticed/)
- [Why Game Freak Should Never Eliminate IVs or EVs - HubPages](https://discover.hubpages.com/games-hobbies/Why-Game-Freak-Should-Never-Eliminate-IVs-or-EVs-from-Pokemon)

---

## 5. Emergent Depth vs. Explicit Difficulty Modes

### The Core Distinction

**Explicit difficulty** adds a toggle: Easy/Normal/Hard. The player chooses their experience. Examples: most AAA games, Celeste's Assist Mode, Hades' God Mode.

**Emergent depth** creates difficulty from rule interaction, not difficulty settings. The game has one mode. Simple rules interact to create complex situations. The player's skill determines their experience. Examples: Go, Chess, Tetris, Rocket League.

### The Elegance Ratio (Keith Burgun)

Keith Burgun formalized this as the **elegance ratio**: the ratio of emergent complexity to inherent complexity (rules). The ideal game maximizes this ratio -- the fewest possible rules producing the most possible interesting decisions.

Burgun's key insight: "A game should be easy to learn, yet hard to master. The 'easy to learn' refers to the rules themselves and also an initial idea of what a 'good action' means."

He distinguishes elegance from minimalism: a minimalist game might have few rules but also few interesting decisions. An elegant game has few rules but MANY interesting decisions. Go has ~4 rules and creates more game states than atoms in the universe.

### Three Types of Complexity (Pine Island Games Framework)

1. **Mechanical complexity**: How many rules must you learn to play? (Low barrier = accessible)
2. **Emergent complexity**: How many situations can arise from those rules? (High = deep)
3. **Strategic complexity**: How many meaningful decisions exist in each situation? (High = engaging)

The sweet spot for a casual-appealing deep game: LOW mechanical, HIGH emergent, MODERATE strategic.

Go achieves this perfectly: ~4 rules (low mechanical), 2.08 x 10^170 legal positions (extreme emergent), and 361 legal opening moves creating manageable decision spaces (moderate strategic that scales with skill).

### Which Approach for Chain Reaction?

**Emergent depth wins for mobile arcade games.** Here's why:

1. Explicit difficulty modes split the player base and create the "which mode am I supposed to play?" problem
2. Mobile players make snap decisions about apps in 3 seconds. A difficulty selector adds friction
3. The Chain Reaction continuous mode already provides implicit difficulty scaling (spawn rate increases naturally)
4. The same-type chaining rule IS emergent depth: it arises from the interaction of dot colors and explosion physics, not from a difficulty toggle

**The Go model applied to Chain Reaction:**
- Rules: Tap to explode. Explosions catch nearby dots. Caught dots explode. Same-type chains are stronger.
- Emergent situations: Thousands of possible dot configurations, timing windows, cascade paths
- Strategic decisions: Where to tap, when to tap, whether to target a same-type cluster or a mixed high-density area

This is exactly the "maximum complexity, minimum abstraction" principle already in DESIGN.md.

### Sources
- [GameDev Protips: How To Design Games With Emergent Depth](https://medium.com/@doandaniel/gamedev-protips-how-to-design-games-with-emergent-depth-and-complexity-f51fe1f52fc2)
- [Managing Complexity: Mechanical, Emergent & Strategic - Pine Island Games](https://www.pineislandgames.com/blog/managing-the-trifecta-of-complexity)
- [The Complexity of Depth - Giant Brain](https://giantbrain.co.uk/2022/07/14/the-complexity-of-depth/)
- [Keith Burgun - Why Elegance Matters](http://keithburgun.net/why-elegance-matters-the-lifecycle-of-games/)
- [Emergent Gameplay - Wikipedia](https://en.wikipedia.org/wiki/Emergent_gameplay)

---

## 6. The "One More Rule" Principle

### The Academic Framework

Nealen, Saltsman & Boxerman's 2011 paper "Towards Minimalist Game Design" (FDG 2011) formalized minimalist game design. Their definition: minimalist games have "small rulesets, narrow decision spaces, and abstract audiovisual representations, yet do not compromise on depth of play or possibility space."

Key properties of a minimalist game:
- Small set of rules
- Only one (macro) core mechanic
- Tightly coupled elements/subsystems
- Simple controls that blend with underlying systems
- Systemically and visually abstract
- Low perceived complexity but (possibly) deep systemic complexity

This describes Chain Reaction precisely: tap to explode (one core mechanic), physics simulation (tightly coupled), touch input (simple controls), abstract dots (visually abstract).

### Keith Burgun's Incremental Complexity

Burgun proposes an alternative to tutorials: design the full game, then introduce it one rule at a time across multiple play sessions. His recommendation: **6-8 sessions to reach full complexity**. Each session adds one rule or component.

This differs from tutorials because:
- Tutorials explain within a single session (information overload)
- Incremental complexity lets players fully digest each layer before adding the next
- Players build genuine mastery, not temporary recall

### The Puyo Puyo Case Study: One Rule Creates Infinite Depth

Puyo Puyo's entire depth comes from one rule: four same-colored blobs touching = pop. That's it. From this single rule emerges:
- **Chains**: Popping one group causes others to fall, triggering cascading pops
- **Patterns**: Named formations (Stairs, Sandwich, GTR) that reliably produce long chains
- **Floors**: Building chains in layers, with transitions connecting upper and lower floors
- **Gestalt vision**: Expert players see the entire chain structure simultaneously instead of building link by link

The progression from "match 4 colors" to "Gestalt chain vision" is entirely emergent. No rule changes between a beginner and a world champion. The same rule just reveals deeper implications over time.

**Critical parallel to Chain Reaction**: Puyo Puyo's "same-color matching" rule is EXACTLY analogous to Chain Reaction's proposed "same-type chaining" rule. The difference: in Puyo Puyo, same-color matching is the ONLY rule (non-matching blobs don't pop at all). In Chain Reaction, same-type matching would be a BONUS on top of the existing universal chain mechanic. This is important -- Puyo Puyo demonstrates that same-color matching creates enormous depth, but Chain Reaction doesn't need to make it mandatory. Making it a bonus preserves the casual "tap and watch chaos" while adding the Puyo Puyo depth layer for those who discover it.

### The Boomshine-to-Puyo-Puyo Spectrum

Consider three games on a spectrum:
1. **Boomshine**: Tap. Dots explode. No color matching. Depth ceiling is low (SCR ~1.5x). Pure chaos.
2. **Chain Reaction (current)**: Tap. Dots explode with cascade momentum. Dot types exist but chains are universal. Depth ceiling is moderate (SCR 3.52x).
3. **Puyo Puyo**: Only same-color matches. No universal chains. Depth ceiling is extreme but accessibility is low (many new players find chain-building impenetrable).

The optimal position for Chain Reaction is between 2 and 3: **universal chains still work (preserving Boomshine-like chaos), but same-type chains get a bonus (adding Puyo Puyo-like depth)**. This is the "one more rule" that transforms the game without breaking it.

### Sources
- [Towards Minimalist Game Design - Nealen, Saltsman, Boxerman (FDG 2011)](http://www.nealen.net/papers/tmgd.pdf)
- [Incremental Complexity - Keith Burgun](http://keithburgun.net/incremental-complexity/)
- [How to Chain in Puyo Puyo (Beginners Guide)](https://www.chueq.com/puyo/learn/how-to-chain/)
- [Stairs in Puyo Puyo: The In-Depth Guide](https://www.chueq.com/puyo/learn/stairs/)
- [Transitions: The Second Floor - Puyo Nexus](https://puyonexus.com/wiki/Transitions_1:_The_Second_Floor)

---

## 7. Mobile Games: Accessibility-Depth Patterns

### Monument Valley: Depth Through Perception, Not Rules

Monument Valley has no fail state. You cannot die, lose, or be set back. Every puzzle has exactly one solution that reveals itself through spatial exploration. Its depth is perceptual: understanding impossible geometry requires a mental model shift, not mechanical skill.

Design principles:
- No time pressure or complex inputs
- Colorblind-friendly palettes and clear visual hierarchies
- Depth comes from the player's changing perception, not from adding rules
- The "aha" moment IS the gameplay

**Relevance**: Chain Reaction is an action game, so Monument Valley's "no fail state" doesn't apply. But the principle of "depth through perception" does. A player who perceives same-type clusters has more options than one who doesn't -- but the non-perceiving player still has a complete, enjoyable experience.

### Alto's Odyssey: Adding Depth Without Adding Inputs

Alto's Odyssey added wallriding, moving grind rails, multi-tiered grinds, tornados, and rushing water to its sequel -- all without adding a single new control input. The game remains one-touch. New complexity comes from new situations, not new actions.

Ryan Cash (Snowman): "The biggest challenge was making sure the game was just as accessible as the first one to someone who hasn't played an Alto game before."

**Design principle**: Depth comes from combinatorial situations using existing inputs, not from new buttons/gestures. Alto's Odyssey is deeper than Alto's Adventure despite having identical controls.

**Relevance**: The same-type chaining rule adds depth without adding inputs. The player still taps. The tap still creates an explosion. The explosion still catches dots. The new rule changes the OUTCOME of the same action based on the situation, not the action itself.

### Threes!: 14 Months to Find Elegance

Asher Vollmer prototyped Threes in 10 hours but spent 14 months refining it. Early designs were intentionally complex because "they felt the game needed to appear more complex so as to interest players." Fellow designer Zach Gage gave them a "wake-up call" to return to simplicity.

The final design has one rule: slide tiles, matching ones combine. But the depth reveals over months of play. Vollmer designed Threes to "stick around a really really long time, taking months or years to master."

**Vollmer's GDC 2014 talk on tutorials** identified four ingredients:
1. Tell the player what to do (briefly)
2. Give them space to learn without interference
3. Make goals into puzzles (not instructions)
4. Use scaffolding hints (show, don't tell)

Players spend 3-4 minutes becoming comfortable with the UI before encountering any puzzle elements. One UI element at a time.

**Relevance**: Chain Reaction's same-type rule should follow Vollmer's scaffolding approach. Don't explain same-type chaining. Let the player discover it through the visual/audio feedback difference when it happens. The first time a same-type chain fires, the celebration should be just distinct enough to notice, just mysterious enough to investigate.

### Mini Metro: "Predictable Chaos" and Relatable Concepts

Dinosaur Polo Club describes Mini Metro's gameplay as "predictable chaos" -- players have limited agency over the simulation, so they focus on creating robust systems rather than micromanaging outcomes.

Key design decisions:
- **Relatable concept**: Anchoring to subway maps (not abstract game genres) made the game instantly communicable
- **Procedural generation**: No hand-built levels, meaning infinite variety from simple rules
- **Scope constraints**: No hand-built art, no audio reliance. Restrictions forced clarity

The result: "An easy, zen experience to get into, yet ramps up gently into a challenging strategy experience."

**Relevance**: "Predictable chaos" is the ideal description for Chain Reaction WITH same-type chaining. The player has limited agency (one tap), but can learn to predict how type-aware tapping changes the cascade outcome. The chaos is real but not random -- it's deterministic physics responding to a deliberate input.

### Sources
- [Game Design Inspiration: Monument Valley - Krasamo](https://www.krasamo.com/game-design-inspiration-monument-valley-i-and-ii/)
- [Interview: A Closer Look at Alto's Odyssey - Pocket Gamer](https://www.pocketgamer.com/articles/076944/interview-a-closer-look-at-team-altos-stunning-sequel-altos-odyssey/)
- [Interview with Alto's Odyssey Developer Snowman - Android Authority](https://www.androidauthority.com/interview-altos-snowman-ryan-cash-891232/)
- [Threes Creator Shares Tips on Making Great Game Tutorials - Gamasutra](https://www.gamedeveloper.com/design/video-i-threes-i-creator-shares-tips-on-making-great-game-tutorials)
- [THREES Development Emails - Asher Vollmer](https://asherv.com/threes/threemails/)
- [Postmortem: Dinosaur Polo Club's Mini Metro](https://www.gamedeveloper.com/audio/postmortem-dinosaur-polo-club-s-i-mini-metro-i-)
- [GDC 2023: Creating Predictable Chaos with Dinosaur Polo Club](https://www.pockettactics.com/dinosaur-polo-club/interview)

---

## Synthesis: How Chain Reaction Should Add Same-Type Chaining

Based on all seven case studies, here are the concrete design principles for implementing same-type chaining without alienating casual players:

### Principle 1: Bonus, Not Filter (Pokemon Model)
Same-type chains should provide a BONUS (larger explosion, longer hold, more points), not a FILTER (only same-type dots can chain). Universal chains must continue to work exactly as they do now. The same-type bonus is Layer 2 in the Pokemon depth architecture. Layer 1 ("tap and watch chaos") remains fully functional and fully satisfying.

**Implementation**: When a cascade explosion catches a same-type dot, the resulting explosion gets +15-25% radius or +200ms hold (needs simulation sweep). When it catches a different-type dot, the resulting explosion is standard. The cascade still happens either way.

### Principle 2: Discoverable, Not Taught (Slay the Spire / Threes Model)
Do NOT add a tutorial for same-type chaining. Do NOT add text explaining the mechanic. Instead:
- Same-type chain explosions should have a subtly different visual (color-matched particles instead of white, a brief color flash)
- Same-type chains should produce a subtly different sound (harmonically related notes instead of random pentatonic)
- The first time a 3+ same-type chain occurs, a very brief celebration overlay could appear (once, not every time)

The player learns by noticing the difference, not by reading about it.

### Principle 3: Same Input, Different Outcome (Alto's Odyssey Model)
The same-type rule adds zero new inputs. The player still taps. The game still explodes. But WHERE the player taps now has a richer decision space. A same-type cluster rewards type-aware tapping with a more spectacular cascade. A mixed cluster rewards position-aware tapping with higher raw count. The optimal play depends on the board state, creating genuine strategic decisions from the same one-touch input.

### Principle 4: The Depth Reveals Through Difficulty (Slay the Spire Ascension Model)
At CALM tier, same-type bonuses are irrelevant because everything dies anyway. At SURGE tier, a player who targets same-type clusters survives longer. At IMPOSSIBLE, type-awareness is the difference between survival and overflow. The rule exists at all levels but only MATTERS at higher levels. Casual players at CALM never need to think about types.

### Principle 5: Celebrate Discovery (Hades Model)
When a player accidentally triggers a big same-type chain, make it unmistakably special:
- Unique explosion visual (the supernova already planned, but color-keyed)
- Unique audio sting (a musical resolution, not just a sound effect)
- Score multiplier text that's different from standard ("TYPE CHAIN x5!" vs "x5!")

This creates the Hades "reactive" feeling -- the game noticed what you did and responded. The player feels clever. They try to repeat it. Learning happens through reward, not instruction.

### Principle 6: Measure Emergent Depth (Go / Elegance Ratio Model)
After implementing same-type bonuses, re-run the simulation sweep. The key metric: does SCR increase? If the oracle (which can exploit type-awareness) scores significantly higher than random (which cannot), the rule adds genuine depth. Target: SCR from 3.52x to 4.0-4.5x. Higher than 5x risks the rule being too dominant (casual play becomes frustrating).

Also measure: does the greedy bot (position-only) vs a type-aware greedy bot show a gap? This measures whether type-awareness is a learnable skill, not just theoretical depth.

### Principle 7: Preserve the Chaos Floor (Boomshine Legacy)
The most important constraint: a casual player tapping randomly must still get satisfying chains. The same-type bonus should be multiplicative on top of the existing cascade, not a replacement for it. If universal chains still cascade via the momentum system, and same-type chains cascade HARDER, then casual play gets everything it always got, and skilled play gets more.

**The worst possible outcome**: A player taps a dot, the explosion reaches three nearby dots of different types, and they fizzle instead of cascading. This would make the game LESS fun for casuals. The same-type rule must be additive, never subtractive.

---

## The Bottom Line

Every successful game that serves both casual and hardcore audiences follows one pattern: **the casual experience is complete and satisfying on its own, and the depth is invisible until the player is ready for it.**

The same-type chaining rule should be implemented as:
1. A bonus on top of universal chains (not a replacement)
2. Visually/aurally distinct but never text-explained
3. Irrelevant at easy difficulty, decisive at hard difficulty
4. Measurably deepening the skill ceiling (simulate and measure SCR)
5. Never diminishing the "tap and watch chaos" floor

This is the Tetris Effect pattern: the same game, experienced differently by different players, without either player knowing the other's experience exists.
