# Settings & Configuration UX Design — Chain Reaction

## Status
- **Created:** 2026-02-21
- **Depends on:** `game-settings-ux.md` (prior art research), `continuous-play.md`, `endless-mode.md`, `DESIGN.md`
- **Scope:** Concrete UI/UX recommendations for mode selection, difficulty presentation, settings access, audio/visual controls, progressive disclosure, and first-time experience

---

## Design Philosophy

Chain Reaction is a one-tap game with generative audio, played primarily on phones. The entire game currently fits on a single screen with zero menus. This is a strength. Every settings surface we add is a decision we ask the player to make instead of playing. The goal is to add the minimum configuration necessary while preserving the feeling that the game IS the interface.

**Guiding principles (derived from prior art):**

1. **The game screen is the settings screen.** No separate settings view unless the player asks for one. Mode and difficulty are chosen in the same space where dots are drifting.
2. **Names evoke experience, not skill.** CALM is not "easy." TRANSCENDENCE is not "hard." They are different experiences, like choosing a song from an album (Rez Infinite, Tetris Effect).
3. **Progressive disclosure, three layers deep.** Layer 1 is always visible. Layer 2 is one tap away. Layer 3 requires deliberate intent.
4. **Everything changes mid-session.** No setting requires restart. Audio changes fade over 500ms. Visual changes interpolate over 300ms (Celeste, Hades).
5. **Default to maximum beauty.** The out-of-box experience has all effects on, volume at a good level, full particles. Settings exist to reduce, not to enable.

---

## A. Mode Selection: Rounds vs. Continuous

### Recommendation: Horizontal swipe between two "worlds" on the start screen

**Not a toggle. Not a menu. Two distinct visual environments the player swipes between.**

The start screen currently shows the title, drifting dots, and "Tap anywhere to begin." The mode selection extends this by making the start screen itself responsive to horizontal swipe:

- **Swipe left (or default): ROUNDS.** The current start screen. Dark background, drifting dots, title reads "CHAIN REACTION" with subtitle "Tap to start a chain reaction." The dots move at the current relaxed pace. The feeling is: structured, goal-oriented, familiar.

- **Swipe right: CONTINUOUS.** The background shifts subtly warmer (deep navy to deep indigo). Dots spawn from the edges and drift across, never stopping. The title still reads "CHAIN REACTION" but the subtitle changes to "Tap to begin." A small epoch label appears at the bottom: "Dawn." The feeling is: flowing, ambient, open-ended.

**Why swipe, not a button or toggle:**
- A toggle implies "pick one." A swipe implies "explore two spaces." The player discovers the second mode through natural touch exploration, which is more engaging than reading a label and choosing.
- The visual transition between modes communicates what each mode FEELS like before the player commits. Rounds mode looks still and structured. Continuous mode looks alive and breathing. The mode explains itself visually.
- This follows the Tetris Effect pattern: Journey Mode and Effect Modes are different screens you navigate between, each with its own visual identity. The mode IS its own advertisement.

**Implementation detail:**
- The two "worlds" are the same canvas with different dot spawning logic and background tint.
- A subtle page indicator (two small dots at bottom center, like iOS home screen pagination) shows which mode is active.
- The currently selected mode persists in localStorage. On return visits, the game opens to whichever mode the player last used.
- Swiping is continuous — the player can see the transition partway through, reinforcing that these are two different experiences sharing one game.

**First-time behavior:** Default to Rounds (left position). The page indicator pulses gently for the first 3 sessions, hinting that there is something to swipe to. After that, it stops pulsing. The player discovers Continuous mode through exploration, not instruction.

**Why not a toggle or button:**
- A toggle says "pick A or B." The player has no information to make that choice on first launch.
- A button labeled "Continuous Mode" requires the player to understand what continuous mode is before experiencing it.
- The swipe lets the player SEE each mode's personality before committing. This is the Journey principle: show, don't tell.

**Prior art:** Tetris Effect (modes as distinct visual environments), Alto's Odyssey (Zen Mode as a fundamentally different experience accessed through the same interface), Rez Infinite (Area selection IS the settings).

---

## B. Difficulty Presentation: CALM / FLOW / SURGE / TRANSCENDENCE

### Recommendation: Vertical scroll within the Continuous mode start screen, with each tier as a distinct visual atmosphere

**The tier names are perfect as-is.** They evoke experience, not skill level:

| Tier | Evocation | Closest prior art analogy |
|------|-----------|--------------------------|
| CALM | Meditative, ambient, unwinding | Alto's Odyssey Zen Mode |
| FLOW | Engaged, musical, in the groove | Tetris Effect Journey (Normal) |
| SURGE | Intense, driving, electric | Super Hexagon "Hard" |
| TRANSCENDENCE | Overwhelming, symphonic, ego-dissolving | Rez Infinite Area X |

**These are not difficulty levels. They are experiences.** The names communicate WHAT IT FEELS LIKE, not how good you need to be. A player who always plays CALM is not playing on "easy" — they are choosing a meditative experience. A player on TRANSCENDENCE is not "better" — they are choosing chaos. This is the Mario Kart CC pattern (diegetic, neutral framing) combined with the Tetris Effect pattern (modes with different FEEL).

### How tiers are presented

When the player swipes to Continuous mode, they see the default tier (FLOW) with its visual atmosphere. Swiping vertically scrolls through tiers:

- **Swipe up:** Higher intensity (FLOW -> SURGE -> TRANSCENDENCE)
- **Swipe down:** Lower intensity (FLOW -> CALM)

Each tier change transitions the start screen's visual atmosphere:

| Tier | Background | Dot speed | Dot density | Ambient sound |
|------|------------|-----------|-------------|---------------|
| CALM | Deep navy, nearly black | Very slow | Sparse (8-10 dots) | Silence, occasional gentle tone |
| FLOW | Warm indigo | Medium | Medium (12-15 dots) | Soft pad, gentle pulse |
| SURGE | Deep purple with faint pulse | Fast | Dense (18-22 dots) | Driving bass hint, energy |
| TRANSCENDENCE | Near-black with bright dot trails | Very fast | Many (25+), types visible | All stems audible, intense |

The tier name appears as a single word centered below the title, in the same typographic style (Inter 300, letter-spaced). It fades in/out as the player scrolls between tiers. A brief one-line description appears below it on first encounter:

| Tier | First-encounter description |
|------|----------------------------|
| CALM | "Breathe. Watch. Let the chains unfold." |
| FLOW | "Find your rhythm. Build your melody." |
| SURGE | "The field is alive. Keep up." |
| TRANSCENDENCE | "Everything. All at once." |

After the player has selected each tier at least once, the description no longer appears — just the name. This follows the progressive disclosure principle: explain on first contact, trust familiarity thereafter.

### Why not auto-adjust (Hades approach)?

Auto-adjustment (Hades God Mode) is the gold standard for difficulty, but it serves a different purpose than what Chain Reaction needs. Hades uses invisible adjustment to help players experience narrative content despite skill barriers. Chain Reaction's continuous mode tiers are not "difficulty" — they are fundamentally different experiences:

- CALM has lower spawn rates and higher maxDots — the field breathes slowly, sessions last longer, the audio is sparse and ambient. This is a DIFFERENT GAME from TRANSCENDENCE.
- TRANSCENDENCE has lower maxDots but requires more precise play. The field overflows fast. Sessions are shorter and more intense.

These cannot be auto-adjusted between because they are qualitatively different, not quantitatively different. It is the Tetris Effect principle: Marathon, Sprint, and Chill Marathon are not auto-adjustable — they serve different player intentions.

However, within each tier, the game DOES auto-adjust via its emergent mechanics: if the player struggles in FLOW, density climbs, which makes even random taps produce decent chains (the field helps you). This is Hades-style invisible mercy, but it is emergent from the physics, not a scripted system.

### What about Rounds mode difficulty?

Rounds mode has no explicit difficulty selection. The auto-escalating round structure IS the difficulty system — the game starts easy (Round 1: hit 1 of 12 dots) and gets harder through the existing formula. The setback progression (-2 rounds on failure) and mercy radius (+5%/fail) already provide adaptive difficulty. Adding an explicit difficulty selector to Rounds mode would undermine the elegant simplicity of "tap to start, difficulty comes to you."

**Prior art:** Dead Cells (difficulty as earned progression, not menu selection), Threes (the game IS the difficulty curve), Wii Sports (invisible ELO-based adjustment).

---

## C. Settings Access

### Recommendation: A single settings icon in the top-right corner of the start screen, invisible during gameplay

**Location:** Top-right corner, 44x44px touch target (Apple HIG minimum), rendered as a thin circle with three horizontal lines inside (hamburger variant, not a gear — the gear icon connotes "technical configuration," which is wrong for a game that wants to feel effortless).

**Visibility rules:**
- **Start screen:** Visible at 20% opacity. Brightens to 50% on hover/touch proximity. Always in the thumb-reachable zone for right-handed one-handed operation (the primary mobile use case).
- **During gameplay:** Hidden. There is nothing the player should configure mid-chain. The game IS the interface during gameplay.
- **Game over screen:** Visible at 15% opacity. The player's attention should be on their score and the retry prompt, not settings.
- **Continuous mode (between taps):** A small pause icon appears in the top-right (same position) during the tap cooldown. Tapping it pauses the game and reveals the settings icon. Settings are accessible mid-session but require a deliberate pause first.

**Why not a swipe gesture or long-press?**
- Swipe gestures are already used for mode selection (horizontal) and difficulty selection (vertical). Adding a third swipe direction for settings creates gesture conflicts.
- Long-press on mobile creates confusion with the system context menu (copy/paste) and feels uncertain (how long is "long"?).
- A visible icon is discoverable. Hidden gestures are not. The prior art research shows that hidden settings (anti-pattern 5.4) create a two-tier playerbase.

**Why not a gear icon?**
- The gear connotes "advanced configuration," which primes the player to expect complexity. The hamburger/menu icon connotes "there's more here if you want it" — lower cognitive weight.

**Thumb zone consideration (iPhone 15 Pro, 390x844 viewport):**

```
+------------------------------------------+
|                              [=] settings |  <- top-right, reachable
|                                           |
|           CHAIN REACTION                  |
|       Tap to start a chain.               |
|                                           |
|                                           |  <- comfortable thumb zone
|                                           |
|              o  o    o                    |
|         o        o  o   o                 |
|                                           |
|            [CALM]                         |  <- tier label (continuous mode)
|          o  .  o                          |
+------------------------------------------+
```

The settings icon is technically above the "easy reach" thumb zone, but it is tapped rarely (once per many sessions). Frequently-tapped elements (the play area, mode/difficulty selection via swipes) are all in the comfortable zone. This is appropriate — settings should be accessible but not accidentally triggered.

**Prior art:** Alto's Odyssey (gear icon on start screen, invisible during play), Threes (no settings icon at all — but Chain Reaction needs one because it has configurable audio), Crossy Road (minimal settings behind a small icon).

---

## D. Audio/Visual Controls

### What the settings screen contains

The settings screen slides in from the right as a panel (not a full-screen replacement — the game world remains visible behind a 50% opacity dark overlay). This preserves context and makes the settings feel like a layer ON the game, not a departure FROM it.

### D.1 Audio Controls

**Master Volume** — A single horizontal slider, full width of the settings panel.

- Range: 0% to 100%
- Default: 70% (the current `masterGain.gain.value = 0.6` maps to roughly this)
- Visual: A thin line with a circular thumb. The line fills from left to right with a subtle gradient matching the current mode's color palette.
- Behavior: Changes apply immediately. The game plays a quiet test tone (a single pentatonic note with reverb) when the slider is adjusted, so the player can hear the effect without starting a round.
- Label: "Volume" (not "Master Volume" — there is only one volume control)

**Why a single volume control, not separate music/sfx?**

The game's audio is generative. The chain reactions ARE the music. There is no pre-recorded soundtrack to separate from sound effects. The background music loop, the chain notes, the tap sound, and the celebration chords are all part of the same audio system. Separating them would require the player to understand the audio architecture, which violates the "minimum abstraction" principle. One slider controls everything.

If a future version adds pre-composed epoch stems for continuous mode, those stems could be separated. But for now, the audio is unified, and the control should be too.

**Mute toggle:** A speaker icon to the left of the volume slider. Tapping it toggles mute (saves the current volume level and restores it on unmute). This is a faster path than dragging the slider to zero for players who want silence quickly (e.g., in a meeting).

### D.2 Visual Controls

**Screen Shake** — A three-position segmented control: OFF / GENTLE / FULL

- OFF: `shakeTrauma = 0` always (no displacement)
- GENTLE: Trauma multiplier 0.4x (max displacement ~5px instead of ~12px)
- FULL: Current behavior (default)
- Label: "Screen Shake"

**Why three positions, not a slider?**

Screen shake is not a continuous preference — players either want it, want less of it, or want none of it. Three options covers all use cases without requiring the player to find their own value on a slider. This is the God of War Ragnarok pattern: Mini-game styles offer Precision / Single Button / Auto, not a 0-100 slider.

**Particles** — A two-position segmented control: REDUCED / FULL

- REDUCED: Particle count multiplied by 0.3x. Burst particles only (no drift, no spark). Shorter lifetimes (0.5x). This is the accessibility-first option for devices that struggle with particle rendering or players who find particles distracting.
- FULL: Current behavior (default).
- Label: "Particles"

**Why not a slider?** Particles are either part of the experience or they are not. A slider from 0% to 100% creates a bad middle ground where some particles exist but the effect is incoherent. REDUCED keeps enough particles for visual feedback (you can see that an explosion happened) while removing the decorative layer. FULL is the intended experience.

### D.3 Accessibility Controls

These appear below the audio/visual controls, separated by a subtle divider and the heading "Accessibility."

**Reduced Motion** — A toggle (ON/OFF)

When ON, this is a comprehensive preset that sets:
- Screen shake: OFF
- Particles: REDUCED
- Background pulse: disabled (solid background color, no breathing)
- Celebration slow-motion: disabled (no 0.6x speed moments)
- Dot pulse animation: disabled (dots remain at base radius, no breathing)
- Screen flash (Supernova activation): disabled

This is the TLOU2 preset approach: a single toggle that sets multiple related options for the player who needs it, without requiring them to find and adjust each setting individually.

Label: "Reduced Motion"
Description (shown once, on first encounter): "Reduces animation for motion sensitivity."

**High Contrast** — A toggle (ON/OFF)

When ON:
- Dot base opacity increases from 0.8 to 1.0
- Dot outlines gain a 1px white stroke (always visible, not just on hover)
- Background brightens from #04040f to #0a0a1a (subtle but measurable)
- HUD text opacity increases from current levels to 1.0
- Near-miss dots highlighted with a solid outline instead of a pulsing one
- Explosion rings use solid white instead of warm-tinted colors

Label: "High Contrast"
Description (shown once): "Increases visibility of game elements."

**Why these two accessibility options and not more?**

Chain Reaction is a single-tap game with generative audio, played on a dark background. The accessibility surface is small:

- **Motor accessibility:** Not applicable. The game is one tap per round. There is no timing requirement (no timer). There is no precision requirement beyond "tap roughly near dots." The explosion radius is generous.
- **Hearing accessibility:** The game is playable without sound. Audio is a reward, not a requirement. No game information is audio-only. No subtitles needed (no speech, no text-based audio).
- **Vision accessibility:** Addressed by High Contrast mode. Color is not used to convey critical game information (dot types are differentiated by size, motion pattern, AND color).
- **Cognitive accessibility:** The game has one rule (tap to start a chain) and no text-heavy UI. The round-based mode provides natural stopping points. The continuous mode has no failure state to create anxiety.
- **Vestibular/motion sensitivity:** Addressed by Reduced Motion. This is the most important accessibility feature for this game because screen shake and particles are prominent.

Adding more accessibility options would be responsible to the TLOU2 principle of exhaustive coverage, but Chain Reaction's interaction model is so simple that most accessibility categories do not apply. Two toggles is correct for this game's complexity level.

**Prior art:** Celeste Assist Mode (granular but framed as presets), TLOU2 (preset bundles for vision/hearing/motor), God of War Ragnarok (spectrum approach: Precision/Single Button/Auto).

---

## E. Progressive Disclosure Layers

### Layer 1: Always Visible (the start screen)

What the player sees without any interaction:

```
CHAIN REACTION
Tap to start a chain reaction.

[drifting dots on dark field]

           o  .  o
      o .     o     o  o
         o    o  .  o
                              [=]  (settings icon, 20% opacity)
Best: Round 7

              .  .           (page indicator: Rounds / Continuous)
```

**Information communicated:** Game name, how to play (tap), current mode (via visual atmosphere and page indicator), personal best. That is all. No difficulty, no settings, no configuration. Just the game and an invitation to play.

### Layer 2: One Swipe Away (mode and difficulty)

**Horizontal swipe:** Switches between Rounds and Continuous. The visual atmosphere changes. The subtitle changes. The page indicator updates. No new UI elements appear.

**Vertical swipe (Continuous mode only):** Scrolls through CALM / FLOW / SURGE / TRANSCENDENCE. The tier name fades in center-bottom. The dot behavior on the start screen changes to preview the tier's feel. On first encounter with each tier, a one-line description appears.

**This layer requires zero taps.** The player discovers modes and tiers through the same gesture they use to explore their phone (swiping). The information is spatial, not hierarchical — modes are left/right, tiers are up/down. This maps to the phone's natural interaction vocabulary.

### Layer 3: One Tap Away (settings panel)

**Tapping the settings icon** opens the settings panel:

```
+-- SETTINGS --------------------------------+
|                                             |
|  Volume                                     |
|  [speaker] --------O---------- [100%]       |
|                                             |
|  Screen Shake                               |
|  [ OFF ] [ GENTLE ] [* FULL *]              |
|                                             |
|  Particles                                  |
|  [ REDUCED ] [* FULL *]                     |
|                                             |
|  ----------------------------------------  |
|  Accessibility                              |
|                                             |
|  Reduced Motion               [  OFF  ]     |
|  High Contrast                [  OFF  ]     |
|                                             |
|                           [ Close ]         |
+---------------------------------------------+
```

**This layer requires one deliberate tap on a small icon.** Only players who actively want to adjust settings will reach this. The settings are all on one screen — no sub-menus, no tabs. This is appropriate because there are only 5 controls (volume, shake, particles, reduced motion, high contrast). Progressive disclosure within the settings panel is unnecessary at this quantity.

### Why only three layers, not four?

The prior art research identifies a fourth layer: "Expert" (config files, console commands). Chain Reaction does not need this layer because:

1. There are no "power user" settings. The game's parameters (explosion radius, cascade cap, dot speed) are game-balance values, not user preferences. Exposing them would create the anti-pattern of settings that break game balance (anti-pattern 5.5).
2. The game runs in a browser with no local install. There are no config files to edit.
3. Five settings total does not justify a hidden expert layer.

**Prior art:** iOS Settings (top level shows the most common toggles), Spotify EQ (presets first, manual second), Alto's Odyssey (sound on/off is the entire settings surface).

---

## F. First-Time Experience

### What a new player sees, second by second

**0ms:** The game loads. Dark screen. Dots fade in over 400ms. Title appears:

```
            CHAIN REACTION
       Tap to start a chain reaction.
```

No menu. No "Play" button. No settings visible. Just the game world with dots drifting, and an invitation.

**This IS the Rounds mode start screen.** The player is already in the game. They do not know that Continuous mode exists, and they should not. The first session should be pure: one mode, no choices, tap to play.

**First tap:** The game begins Round 1. The AudioContext initializes. The first chain plays. The player experiences the core loop (tap, cascade, music, celebration or failure) with zero decisions made before it.

**After first game over:** The game over screen appears with the "Tap to try again" prompt. At the bottom, the pill buttons appear (Bot, Set Name). The settings icon appears in the top-right at 15% opacity. These were invisible on the first start screen. They appear only after the player has completed at least one round, because until then, the player does not need to know these options exist.

**After third session:** The page indicator at the bottom of the start screen begins its gentle pulse animation, drawing attention to itself. If the player swipes right, they discover Continuous mode. The pulse stops after 3 sessions regardless of whether the player swipes.

**After reaching Round 5 in Rounds mode:** No change. No unlock gate for Continuous mode. It is always available from the first session — the pulse just draws attention to it. We do NOT gate Continuous mode behind round progression because the two modes serve different player intentions, and a player who wants the meditative CALM experience should not be forced through competitive Rounds first.

### Why this sequence?

The principle: **never show a choice before the player has context to make it.**

- On first launch, the player does not know what "Rounds" means (they have not played a round yet). Showing "Rounds vs. Continuous" is meaningless.
- After one session, the player understands the core mechanic. They can now appreciate what "another way to play" means.
- The page indicator pulse is a curiosity trigger, not a prompt. It says "there's more" without saying "you should go here." The player discovers Continuous mode through exploration, which creates a moment of delight ("oh, there's another mode!") rather than a moment of decision paralysis ("which should I pick?").

**Prior art:** Journey (zero menus, zero choices — the game starts and the player plays), Geometry Wars: Retro Evolved 2 (modes unlock progressively — the player experiences simple before complex), Wii Sports (no difficulty menu — the game adapts to you from the start).

---

## G. Concrete UI Mockups

### G.1 Rounds Mode Start Screen (Default First-Time View)

```
+------------------------------------------+  390px
|                                           |
|                                           |
|                                           |
|           CHAIN REACTION                  |
|       Tap to start a chain reaction.      |
|                                           |
|                                           |
|                                           |
|        o        o                         |
|                       o    o              |
|   o         o                    o        |
|                  o        o               |
|         o              o                  |
|                                           |
|                                           |
|                                           |
|                                           |
|                                           |
|                                           |
|              .  .                         |  page indicator
|                                  v0.9     |  build info
+------------------------------------------+  844px
```

Dots drift. No buttons visible on first launch. After first session:

```
+------------------------------------------+
|                                    [=]    |  settings icon (20% opacity)
|                                           |
|                                           |
|           CHAIN REACTION                  |
|       Tap to start a chain reaction.      |
|                                           |
|    [ Resume Round 4 ]                     |  if checkpoint exists
|                                           |
|        o        o                         |
|                       o    o              |
|   o         o                    o        |
|                  o        o               |
|         o              o                  |
|                                           |
|        Best: Round 7                      |
|                                           |
|                                           |
|         LEADERBOARD                       |  if server available
|   1. Tim - R12 - 4,200                    |
|   2. Bot - R9 - 2,100                     |
|                                           |
|  [Bot]                                    |  pill button
|              .  .                         |  page indicator (pulses gently)
|                                  v0.9     |
+------------------------------------------+
```

### G.2 Continuous Mode Start Screen (After Swiping Right)

```
+------------------------------------------+
|                                    [=]    |
|                                           |
|                                           |
|           CHAIN REACTION                  |
|            Tap to begin.                  |
|                                           |
|                                           |
|      o ->       o ->                      |  dots spawning from edges,
|             o ->       o ->    o ->       |  drifting across field
|   -> o           -> o                     |  (continuous spawn)
|              -> o        -> o             |
|         o ->           o ->               |
|                                           |
|                                           |
|              F L O W                      |  current tier name
|    Find your rhythm. Build your melody.   |  first-encounter description
|                                           |
|                                           |
|                                           |
|                                           |
|  [Bot]                                    |
|              .  .                         |  page indicator (right dot filled)
|                                  v0.9     |
+------------------------------------------+
```

The player can swipe up/down to change tiers. The background tint, dot speed, and dot density change in real time as they swipe:

**Swiping up to SURGE:**

```
+------------------------------------------+
|                                    [=]    |
|                                           |
|                                           |
|           CHAIN REACTION                  |
|            Tap to begin.                  |
|                                           |
|  o-> o->  o->  o->  o->                  |  faster, denser
|    o->  o-> o->    o-> o-> o->            |  dots everywhere
| o-> o->  o->  o->    o->  o->            |
|   o-> o-> o-> o-> o->  o->               |
|  o->   o-> o->  o->    o->               |
|    o->  o-> o->   o->  o->               |
|                                           |
|                                           |
|             S U R G E                     |
|      The field is alive. Keep up.         |
|                                           |
|                                           |
|                                           |
|  [Bot]                                    |
|              .  .                         |
|                                  v0.9     |
+------------------------------------------+
```

**Swiping down to CALM:**

```
+------------------------------------------+
|                                    [=]    |
|                                           |
|                                           |
|           CHAIN REACTION                  |
|            Tap to begin.                  |
|                                           |
|                                           |
|                                           |
|         o                                 |  very sparse, very slow
|                       o                   |
|                                           |
|   o                         o             |
|                                           |
|                                           |
|                                           |
|             C A L M                       |
|    Breathe. Watch. Let the chains unfold. |
|                                           |
|                                           |
|                                           |
|  [Bot]                                    |
|              .  .                         |
|                                  v0.9     |
+------------------------------------------+
```

### G.3 Settings Panel (Slides in from right)

```
+------------------------------------------+
|  [dark overlay, game visible underneath]  |
|                                           |
|  +--------------------------------------+|
|  |                                      ||
|  |  SETTINGS                    [  X  ] ||
|  |                                      ||
|  |  Volume                              ||
|  |  [)) --------O-------------- 70%     ||
|  |                                      ||
|  |  Screen Shake                        ||
|  |  [  OFF  ] [GENTLE] [* FULL *]       ||
|  |                                      ||
|  |  Particles                           ||
|  |  [REDUCED] [* FULL *]               ||
|  |                                      ||
|  |  ------------------------------------||
|  |  Accessibility                       ||
|  |                                      ||
|  |  Reduced Motion          [  OFF  ]   ||
|  |  Reduces animation for              ||
|  |  motion sensitivity.                ||
|  |                                      ||
|  |  High Contrast           [  OFF  ]   ||
|  |  Increases visibility of            ||
|  |  game elements.                     ||
|  |                                      ||
|  +--------------------------------------+|
|                                           |
+------------------------------------------+
```

The panel occupies ~75% of the screen width and the full height. The remaining 25% shows the game world through the dark overlay. Tapping the overlay or the X button closes the panel. The panel slides in from the right (300ms ease-out) and slides out to the right on close.

**Why a panel, not a full-screen view?**

Keeping the game visible maintains context. The player can see their dots still drifting while adjusting settings. This reinforces that settings changes are non-destructive and immediately visible — if they toggle High Contrast, they see it take effect on the actual game world behind the panel, not on a preview. This is the Celeste principle: settings changeable mid-session without breaking the game's presence.

### G.4 Game Over Screen (With Settings Access)

```
+------------------------------------------+
|                                    [=]    |  settings (15% opacity)
|                                           |
|                                           |
|                                           |
|              Round 7                      |
|                                           |
|           Chain: 18 / 24                  |
|     6 more dots to clear - So close!      |
|                                           |
|         Total Score: 12,400               |
|                                           |
|              New Best!                    |
|                                           |
|       Restart from Round 5               |
|                                           |
|           Tap to try again                |
|                                           |
|                                           |
|                                           |
|  [Set Name]    [Bot]    [Watch Replay]    |
|                                           |
+------------------------------------------+
```

The settings icon is visible but unobtrusive. During gameplay (playing/resolving states), it is hidden — nothing should compete with the game world during active play.

### G.5 During Continuous Mode Gameplay

```
+------------------------------------------+
|  [BOT]                        [  ||  ]    |  pause button (replaces settings)
|                                           |
|           3 / --                          |  chain count (no target)
|              x4                           |  multiplier
|                                           |
|        o        o     o                   |
|   o       [EXPLOSION]     o    o          |
|              o    o                       |
|         o         o      o               |
|   o          o        o                   |
|        o        o                         |
|                    o        o             |
|         o    o          o                 |
|                                           |
|          [... ... ...]                    |  supernova meter
|                                           |
|                                           |
|           FLOW                            |  epoch label (faint)
|                                           |
|   Score: 8,240         2:34               |  score + session timer
|                                  v0.9     |
+------------------------------------------+
```

The pause button replaces the settings icon during continuous gameplay. It is a standard pause icon (two vertical bars). Tapping it:

1. Pauses the game (dots freeze, spawn pauses, timers pause)
2. Shows a pause overlay with: Resume, Settings, End Session
3. "Settings" opens the same settings panel
4. "End Session" triggers a graceful ending (final chord, session summary)

This is the only way to access settings during continuous play. It requires two taps (pause, then settings). This is intentional: settings should never interrupt flow state. The two-tap barrier ensures the player has made a conscious decision to leave gameplay.

---

## H. Implementation Notes

### State Persistence (localStorage)

```javascript
// Keys and defaults
'cr_mode': 'rounds'          // 'rounds' | 'continuous'
'cr_tier': 'flow'            // 'calm' | 'flow' | 'surge' | 'transcendence'
'cr_volume': 0.7             // 0.0 to 1.0
'cr_shake': 'full'           // 'off' | 'gentle' | 'full'
'cr_particles': 'full'       // 'reduced' | 'full'
'cr_reduced_motion': false   // boolean
'cr_high_contrast': false    // boolean
'cr_first_sessions': 0       // counter for first-time pulse behavior
```

All settings changes write to localStorage immediately. On load, settings are read and applied before the first frame renders. No "Save" button — changes are live and persistent.

### CSS/Canvas Architecture

The settings panel should be HTML/CSS overlaid on the canvas, not drawn on the canvas itself. Reasons:

1. HTML form controls (sliders, toggles, segmented controls) are natively accessible — screen readers, keyboard navigation, and system accessibility features work automatically.
2. The panel's scroll behavior, touch handling, and animation are handled by the browser's compositor, not the game loop. No frame drops.
3. Text rendering in HTML is always sharp (subpixel anti-aliasing). Canvas text at small sizes can be blurry.

The game canvas continues to render behind the panel overlay. The dark overlay is a CSS element with `pointer-events: auto` to catch dismissal taps.

### Gesture Detection

The horizontal and vertical swipe detection for mode/tier selection requires care to avoid conflicts:

```
Gesture detection rules:
1. Track pointerdown position
2. On pointermove, compute dx and dy from start
3. If |dx| > 30px AND |dx| > |dy| * 2: horizontal swipe (mode change)
4. If |dy| > 30px AND |dy| > |dx| * 2: vertical swipe (tier change, continuous only)
5. If neither threshold met on pointerup: treat as tap (start game)
6. If in Rounds mode, vertical swipe does nothing (no tier selection)
```

The 30px threshold and 2:1 ratio prevent accidental mode/tier changes during normal taps. This matches standard mobile gesture detection practices.

### Transition Timing

| Transition | Duration | Easing | What changes |
|-----------|----------|--------|--------------|
| Mode swipe (Rounds <-> Continuous) | 400ms | ease-out | Background tint, dot spawning behavior, subtitle text, page indicator |
| Tier scroll (vertical) | 300ms | ease-out | Background tint, dot speed, dot density, tier label |
| Settings panel open | 300ms | ease-out | Panel slides in from right, overlay fades in |
| Settings panel close | 200ms | ease-in | Panel slides out to right, overlay fades out |
| Setting change (volume) | 0ms | immediate | Audio gain adjusts instantly |
| Setting change (shake/particles) | 0ms | immediate | Takes effect on next frame |
| Setting change (reduced motion) | 300ms | linear | All affected animations fade to disabled state |
| Setting change (high contrast) | 200ms | linear | Colors interpolate to high-contrast values |

---

## I. What This Design Does NOT Include (And Why)

**No tutorial screens.** The game teaches itself. Round 1 requires hitting 1 dot out of 12 — that IS the tutorial. Showing a "How to Play" screen before the player has tapped wastes their time and delays the moment of delight.

**No difficulty selection for Rounds mode.** The auto-escalating formula, setback progression, and mercy radius create an adaptive difficulty system that serves all skill levels. Adding an explicit difficulty selector would create the paradox of choice where one currently does not exist.

**No separate music/sfx volume controls.** The audio is generative and unified. Separating it requires the player to understand the audio architecture.

**No haptic feedback settings.** The game does not currently use haptics. If haptics are added (e.g., vibration on chain hits for mobile), a haptics toggle should be added to the settings panel at that time.

**No colorblind mode.** Chain Reaction does not use color to convey critical game information. Dot types are differentiated by motion pattern (gravity dots pulse inward, volatile dots jitter) and visual form (size, brightness), not solely by color. The High Contrast toggle addresses the vision accessibility needs that exist.

**No "reset progress" button.** High scores and best rounds are stored in localStorage. A player who wants to reset can clear their browser data. Adding a reset button in the settings creates the risk of accidental data loss and adds a UI element that 99% of players will never use.

**No online/account settings.** The leaderboard uses deviceId and an optional player name. There is no account system, no login, no profile. If accounts are added later, those settings belong in a separate system, not in the game settings panel.

---

## J. Summary of Key Decisions

| Decision | Choice | Primary Prior Art |
|----------|--------|-------------------|
| Mode selection | Horizontal swipe between visual environments | Tetris Effect (modes as spaces) |
| Difficulty presentation | Vertical swipe through atmospheric previews | Rez Infinite (areas as experiences) |
| Tier naming | CALM / FLOW / SURGE / TRANSCENDENCE | Mario Kart CC (diegetic, non-judgmental) |
| Settings access | Small icon on start screen, hidden during play | Alto's Odyssey (invisible until needed) |
| Settings surface | Slide-in panel over game world | Celeste (mid-session, non-destructive) |
| Volume control | Single slider | Alto's Odyssey (one toggle = one control) |
| Screen shake | Three-position segmented control | God of War Ragnarok (spectrum, not slider) |
| Accessibility | Two toggles: Reduced Motion, High Contrast | TLOU2 (presets over granularity) |
| Progressive disclosure | 3 layers (screen / swipe / tap) | iOS Settings (common first, detail deeper) |
| First-time experience | Zero choices. Rounds mode. Tap to play. | Journey (no settings, no menu, just play) |
| Difficulty in Rounds | No selection — auto-escalating + mercy | Hades God Mode (invisible adjustment) |
| Difficulty in Continuous | Tier selection via atmosphere preview | Tetris Effect (feel, not number) |
| Mid-session settings | Via pause button (continuous) or game over (rounds) | Celeste Assist Mode (pause menu access) |

---

## Sources

All prior art citations reference `research/game-settings-ux.md` for detailed analysis. Key sources:

- Celeste Assist Mode — non-judgmental, granular, mid-session changeable
- Hades God Mode — invisible auto-adjustment, single toggle, zero shame
- Tetris Effect — modes as distinct experiences, not difficulty tiers
- Rez Infinite — area selection as the settings interface
- Mario Kart — diegetic difficulty naming (CC = engine size, not skill level)
- Super Hexagon — naming that reframes difficulty as identity (Hard/Harder/Hardest)
- Alto's Odyssey — minimal settings, Zen Mode as a binary toggle that changes the game's purpose
- Journey — zero settings as a design goal, not a limitation
- TLOU2 — accessibility presets as progressive disclosure entry points
- God of War Ragnarok — spectrum controls (3 options per axis)
- Geometry Wars: Retro Evolved 2 — mode selection replaces difficulty selection
- Dead Cells — difficulty as earned progression, not shameful admission
