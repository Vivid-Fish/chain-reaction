# Game Settings, Difficulty, and Configuration UX — Prior Art Analysis

Research into how excellent games handle user-facing settings, difficulty selection, and configuration UX. Focused on patterns applicable to game design where the goal is maximum player engagement with minimum friction.

Created: 2026-02-21

---

## 1. Difficulty Selection UX Patterns

### 1.1 Celeste — Assist Mode (Granular, Non-Judgmental Sliders)

**How it works:** Celeste ships at a single intended difficulty. Assist Mode is an opt-in overlay that provides five independent sliders/toggles:

- **Game Speed:** 50% to 100% in 10% increments (a slider, not discrete tiers)
- **Dashes:** Default / 2 / Infinite (infinite allows unlimited air dashes)
- **Stamina:** Normal / Infinite (infinite = grab walls indefinitely)
- **Invincibility:** Off / On (immune to all hazards)
- **Dash Assist:** Off / On (freezes game when dash button held, lets you aim precisely)

**Access:** Pause menu > Assist Mode. Available at any time during gameplay. Can be toggled mid-level, mid-session, no restrictions.

**Communication tone:** Originally called "Cheat Mode" internally; creator Matt Thorson renamed it because "cheat" felt judgmental. The in-game text reads:

> "Celeste is intended to be a challenging and rewarding experience. If the default game is too difficult, you can enable Assist Mode from the pause menu."

The message acknowledges the intended experience but frames Assist Mode as legitimate, not lesser. Default selection is "No" (a gentle nudge to try unassisted first), but "Yes" is always available with zero shaming.

**Key design insight:** The granularity is the innovation. Instead of Easy/Medium/Hard, the player tunes specific mechanics that trouble them. Someone who struggles with timing but not platforming can slow the game to 70% without changing anything else. This respects that "difficulty" is not one axis — it is many axes, and different players struggle with different ones.

**Mid-session changes:** Yes, fully. Any setting can be adjusted from pause at any time.

**What the game does NOT do:** No achievements are disabled. No alternate endings. No "you used Assist Mode" badge of shame. The game treats completion as completion.

Sources:
- [Celeste Wiki — Assist Mode](https://celeste.ink/wiki/Assist_Mode)
- [Gamasutra — Check Out Celeste's Remarkably Granular Assist Options](https://www.gamedeveloper.com/design/check-out-i-celeste-s-i-remarkably-granular-assist-options)
- [UX Collective — Hidden Lessons of Trust and Transparency from Celeste's Assist Mode](https://uxdesign.cc/the-hidden-lessons-of-trust-and-transparency-from-celestes-assist-mode-5b49928ea69a)
- [Vice — Why the Very Hard Celeste is Perfectly Fine With You Breaking Its Rules](https://www.vice.com/en/article/celeste-difficulty-assist-mode/)

---

### 1.2 Hades — God Mode (Auto-Adjusting, Invisible Ramp)

**How it works:** A single toggle in the settings menu. When enabled:

- Grants 20% damage resistance immediately
- Each time you die on a run, resistance increases by 2%
- Caps at 80% damage resistance
- Can be toggled on/off at any time; progress (accumulated %) is preserved even when off

**Hades II improvement:** Players can manually adjust the damage reduction percentage after unlocking the feature, adding even more flexibility.

**Access:** Options menu, toggleable at any point. No restart required.

**Communication tone:** Supergiant explicitly stated: "We want anyone invested in our story to be able to see it through." God Mode is framed as a way to experience the narrative, not as a concession for "bad" players. The label "God Mode" is clever — it connotes power fantasy, not weakness.

**Key design insight:** The auto-adjusting mechanic is the breakthrough. The initial 20% boost is immediately noticeable ("palpable" in Supergiant's words). The per-death 2% increases are individually imperceptible but compound over time. A player who dies 30 times has gone from 20% to 80% resistance — the game has quietly adapted to their skill level without them ever seeing a difficulty menu. This means:

1. No decision paralysis about which difficulty to pick
2. No shame — the system adjusts invisibly
3. Players improve alongside the assist, so many turn it off later as they learn
4. The difficulty curve is personalized to each player's death rate

**What the game does NOT do:** No content is locked. No achievements are blocked. No narrative changes. The trophy/achievement list is fully completable with God Mode active.

Sources:
- [Hades Wiki — God Mode](https://hades.fandom.com/wiki/God_Mode)
- [Phenixx Gaming — Hades God Mode Is an Incredible Choice in Game Design](https://web.phenixxgaming.com/2021/02/15/hades-god-mode-is-an-incredible-choice-in-game-design/)
- [Inverse — Hades Devs Reveal How God Mode Solves the Worst Thing About the Genre](https://www.inverse.com/gaming/hades-god-mode-interview)

---

### 1.3 The Last of Us Part II — Per-System Granularity

**How it works:** Five independent difficulty axes, each with six tiers (Very Light / Light / Moderate / Hard / Survivor / Grounded):

| Axis | What it controls |
|------|-----------------|
| **Player** | Base health, checkpoint frequency during combat |
| **Enemies** | AI aggression, accuracy, flanking behavior |
| **Allies** | Companion combat effectiveness |
| **Stealth** | Detection distance, detection speed, awareness persistence |
| **Resources** | Scavenging yield, crafting output, melee durability |

**Access:** Pause menu > Options. Changeable at any point mid-game. The game also offers five preset tiers (Very Light through Grounded) that set all axes simultaneously, plus a "Custom" option for per-axis control.

**Communication tone:** Neutral. Each axis has a brief description of what changes. No judgment language.

**Key design insight:** This acknowledges that "difficulty" is a composite of unrelated systems. A player who loves combat tension but hates stealth detection can set Enemies to Hard and Stealth to Light. A player with motor accessibility needs might set Player to Very Light while keeping everything else at Moderate. The preset tiers serve as sensible defaults; the per-axis sliders serve experts and accessibility needs.

**Number of options presented:** Five sliders on one screen with the Custom option. The preset mode shows just one selector. This is progressive disclosure — simple default, complexity available on request.

**Mid-session changes:** Yes, fully, at any time via pause menu.

Sources:
- [The Gamer — The Last Of Us Part II Does Difficulty Settings Perfectly](https://www.thegamer.com/the-last-of-us-part-ii-difficulty-settings-perfect/)
- [GameSpot — The Last of Us 2 Accessibility / Difficulty Options: A Detailed Overview](https://www.gamespot.com/articles/the-last-of-us-2-accessibility-difficulty-options-/1100-6478756/)

---

### 1.4 Sifu — Difficulty as Narrative Mechanic (Post-Launch Addition)

**How it works (original launch):** No difficulty selection. The aging mechanic IS the difficulty: each death ages your character. More deaths = older = more damage dealt but less health. Die too old and it is permanent death, restarting the level. The game shipped with this as the only option — the difficulty was the narrative.

**Post-launch update:** Added three modes:
- **Student:** Aging is slower (1 year per death instead of escalating), enemies are less aggressive and have less health
- **Disciple:** The original experience, unchanged
- **Master:** More vulnerability, enemies more aggressive, bosses have new attack patterns

**Access:** Mode selection at game start. Changeable between runs.

**Communication tone:** The naming is important. "Student" (learning), "Disciple" (practicing), "Master" (mastered). The progression implies a journey, not a hierarchy of skill/shame.

**Key design insight:** The initial launch decision (no difficulty options) was deliberate — the developers wanted the aging mechanic to be inseparable from the experience. But post-launch, after accessibility feedback, they added options that modified the aging system itself rather than bolting on a generic easy/hard toggle. The difficulty options modify the core mechanic rather than bypassing it, preserving design intent while expanding access.

**Controversy lesson:** The launch sparked debate. Some praised the purity; others felt excluded. The post-launch addition satisfied both camps because it was done through the lens of the game's own systems, not as a generic difficulty slider.

Sources:
- [Push Square — Sifu's New Difficulty Settings Are a Superb Addition](https://www.pushsquare.com/features/hands-on-sifus-new-difficulty-settings-are-a-superb-addition)
- [Screen Rant — Sifu Won't Have Difficulty Options at Launch](https://screenrant.com/sifu-game-difficulty-options-not-available-launch/)
- [Can I Play That — Sifu Difficulty Options Implemented](https://caniplaythat.com/2022/05/03/sifu-difficulty-options-implemented-today-through-spring-2022-update/)

---

### 1.5 Dead Cells — Difficulty as Progression Reward (Boss Cells)

**How it works:** The game starts at base difficulty (0 Boss Cells). Beating the final boss on current difficulty awards a Boss Stem Cell. Each active Boss Cell increases difficulty. Maximum: 5 Boss Cells (5BC).

**What changes per Boss Cell level:**
- Enemy tier, density, and variety increase
- Healing is progressively removed (Health Fountains break, potion charges vanish)
- At 5BC, there are zero free healing stations
- New enemies, items, and areas exclusive to higher BC levels unlock
- Cell (currency) drops increase, better gear becomes available

**Access:** Boss Cells are injected/removed at the starting area (the Tube) before each run begins. You must be on the highest unlocked difficulty to earn the next cell.

**Communication tone:** No shaming in either direction. Higher BC is positioned as "more content" and "new challenges," not as the "real" game. The base game (0BC) has a complete narrative arc and final boss.

**Key design insight:** Difficulty progression IS content progression. This solves the "what do I do after I beat the game?" problem while simultaneously creating a natural difficulty ladder. Players don't choose difficulty from a menu — they earn it. This means:

1. Players are never overmatched (you can only reach a difficulty by beating the one below it)
2. Higher difficulty is aspirational, not shameful
3. The reward loop (new items, new areas, new enemies) makes difficulty increases feel like content expansion, not punishment
4. It creates long-term retention through difficulty-gated content

Sources:
- [Dead Cells Wiki — Boss Stem Cell](https://deadcells.fandom.com/wiki/Boss_Stem_Cell)
- [Medium — Difficulty as Design: Dead Cells' Progressive Challenge](https://medium.com/@tunganh0806/difficulty-as-design-dead-cells-progressive-challenge-and-player-engagement-74f086064bf6)

---

### 1.6 Tetris Effect — Mode Selection as Difficulty Framework

**How it works:** Multiple distinct game modes serve as the primary difficulty axis:

| Mode | Challenge Type |
|------|---------------|
| **Journey Mode** | Story progression, 3 difficulty tiers (Beginner/Normal/Expert with different line goals) |
| **Marathon** | Endurance, selectable starting level (1-15), adjustable line goals (150-600) |
| **Sprint** | Speed (clear 40 lines fastest) |
| **Ultra** | Score attack (3 minutes) |
| **Chill Marathon** | No game-overs, relaxed mode, customizable line goals |
| **Mystery** | Random modifiers (giant pieces, bombs, etc.) |

**Access:** Mode selection from main menu. Within each mode, parameters (starting level, line goal) are adjustable before starting.

**Key design insight:** The mode IS the difficulty choice, but the framing never uses the word "difficulty." Chill Marathon is not "easy mode" — it is a different mode with different goals. Sprint is not "hard mode" — it is a different challenge. This reframing removes the hierarchy. A player can be a Sprint expert and a Marathon beginner, with no shame in either direction.

The Zone mechanic (Journey Mode) adds a strategic layer that skilled players can exploit but beginners can ignore, creating a natural skill ceiling within a single mode.

Sources:
- [TetrisWiki — Tetris Effect](https://tetris.wiki/Tetris_Effect)
- [Tetris Effect Beginners Community Guide](https://www.tetriseffect.game/2021/05/28/tetris-effect-community-guide/)

---

### 1.7 Super Hexagon — Difficulty as Brand Identity

**How it works:** Three levels: Hexagon (Hard), Hexagoner (Harder), Hexagonest (Hardest). Surviving 60 seconds on any level unlocks its Hyper variant: Hyper Hexagon (Hardester), Hyper Hexagoner (Hardestest), Hyper Hexagonest (Hardestestest).

**Access:** Level selection from main menu. Hyper variants unlock after 60-second survival.

**Communication tone:** The naming is the design. By labeling the easiest mode "Hard," the game:
1. Sets expectations (everything will be hard)
2. Removes the shame of playing "easy" (there is no easy)
3. Creates humor and personality
4. Makes the difficulty part of the brand identity

Terry Cavanagh joked that "the first two modes are just practice."

**Key design insight:** When the entire game is hard, difficulty selection becomes flavor selection rather than skill admission. Each level has different visual patterns and music, making them feel like distinct experiences rather than easier/harder versions of the same thing. The absurd difficulty naming (Hardestestest) turns what could be intimidating into something playful.

Sources:
- [Wikipedia — Super Hexagon](https://en.wikipedia.org/wiki/Super_Hexagon)
- [Game Developer — Terry Cavanagh and the Heart of Super Hexagon](https://www.gamedeveloper.com/design/terry-cavanagh-and-the-heart-of-i-super-hexagon-i-)

---

### 1.8 Geometry Wars: Retro Evolved 2 — Mode Selection IS Difficulty

**How it works:** Six game modes (Deadline, King, Evolved, Pacifism, Waves, Sequence), unlocked progressively by scoring well in each mode as it becomes available.

| Mode | Core Mechanic |
|------|--------------|
| **Deadline** | Time-limited, score attack |
| **King** | Can only shoot inside designated zones |
| **Evolved** | Classic survival with lives and bombs |
| **Pacifism** | Cannot shoot; survive by flying through gates |
| **Waves** | One life, directional enemy waves |
| **Sequence** | 20 preset levels, 30 seconds each |

**Access:** Progressive unlock from main menu. You start with Deadline only.

**Key design insight:** There is no "difficulty setting." Each mode is a completely different game with different rules, different strategies, and different skill requirements. A player who excels at Pacifism (spatial awareness, no shooting) may struggle at King (zone management). The difficulty is embedded in the mode design itself, and the progressive unlock ensures players experience simpler modes before complex ones. The game teaches itself through its structure.

Sources:
- [Wikipedia — Geometry Wars: Retro Evolved 2](https://en.wikipedia.org/wiki/Geometry_Wars:_Retro_Evolved_2)
- [Geometry Wars Wiki — Retro Evolved 2](https://geometry-wars.fandom.com/wiki/Geometry_Wars:_Retro_Evolved_2)

---

## 2. Mobile Game Settings Patterns

### 2.1 Alto's Odyssey / Monument Valley — Minimal Settings, Maximum Atmosphere

**Settings available in Alto's Odyssey:**
- Sound on/off
- Music on/off
- Zen Mode toggle (removes score, objectives, and failure — infinite play)
- That is essentially it

**Monument Valley:** Similarly minimal. Sound, maybe a language option.

**How difficulty is handled:** Implicitly. Alto's Odyssey has a goal system (combos, distance challenges) that progresses naturally. The game never presents difficulty as a choice — it ramps organically. If you fail, you restart the run instantly (no loading screen, no menu, no "try again?" confirmation). Monument Valley's puzzles increase in complexity through level design, with zero difficulty selection.

**Zen Mode — the anti-setting setting:** When players reported using Alto's Adventure to destress, the developers created Zen Mode, which strips out everything game-like (score, objectives, crashes) and leaves pure sandboarding in a beautiful environment. This is a binary toggle, but it fundamentally changes the game's purpose. It is not easier — it is a different product.

**Key design insight:** One-touch input means there is nothing to configure. The game's controls are so simple that control settings are unnecessary. The atmospheric design (dynamic weather, day/night cycle) means visual settings are unnecessary — the art direction handles it. The lesson: **if your game is simple enough, the best settings menu is no settings menu.**

Sources:
- [Game Developer — For Alto's Odyssey's Devs, A Healthy Mind Is Important](https://www.gamedeveloper.com/production/for-alto-s-odyssey-s-devs-a-healthy-mind-is-as-important-for-players-as-it-is-themselves)
- [Krasamo — Game Design Inspiration: Monument Valley](https://www.krasamo.com/game-design-inspiration-monument-valley-i-and-ii/)

---

### 2.2 Threes / 2048 — Zero Settings, One Mode

**Settings in Threes:** None related to gameplay. The game is the game.

**Settings in 2048:** None. A 4x4 grid, swipe in four directions, tiles merge. There is no settings menu to speak of.

**How difficulty is handled:** The game's rules create the difficulty. In Threes, the number system (1s merge with 2s to make 3s, then matching pairs from 3 onward) creates natural escalation. In 2048, the board fills up as you make moves, and higher tiles become harder to merge. The difficulty curve is the game mechanic itself.

**Key design insight:** When the core loop is inherently self-balancing (gets harder as you progress, resets when you fail), difficulty settings are unnecessary. The game IS the difficulty setting. Threes' 14-month development process was largely about tuning this single mechanic until it felt right — the depth comes from the rules, not from configurable parameters.

Sources:
- [Wikipedia — Threes](https://en.wikipedia.org/wiki/Threes)
- [Hacker News — Design Is Why 2048 Sucks, and Threes Is a Masterpiece](https://news.ycombinator.com/item?id=8030413)

---

### 2.3 Crossy Road — Unlockables as the Only "Settings"

**Actual settings:** Minimal (sound on/off).

**What feels like settings:** Character selection. Over 100 unlockable characters, obtainable through gameplay coins, watching ads, or IAP. Characters are cosmetic — they do not change gameplay mechanics. But they change the visual experience significantly (different themes, sounds, environments).

**Monetization as non-intrusive configuration:**
- Free coins accumulate during gameplay
- Optional video ads for bonus coins
- 100 coins = one random character from gacha machine
- No character affects gameplay balance
- Watching ads is always optional, never forced

**Key design insight:** The "configuration" is collecting characters, but the collection has zero mechanical impact. This means there are no balance-breaking settings, no pay-to-win concerns, and no decision paralysis. The game always plays identically regardless of your character. The unlock system creates engagement and personalization without creating complexity. The lesson: **cosmetic configuration can satisfy the desire to customize without touching game balance.**

Sources:
- [Mobile Dev Memo — Crossy Road: A Case Study in Mobile Ad Monetization](https://mobiledevmemo.com/crossy-road-a-case-study-in-mobile-ad-monetization/)
- [Game Developer — How Crossy Road Made $1 Million from Video Ads](https://www.gamedeveloper.com/business/how-i-crossy-road-i-made-1-million-from-video-ads)

---

### 2.4 Clash Royale / Brawl Stars — Settings Buried, Gameplay IS Configuration

**Actual settings menus:** Minimal. Sound, notifications, language, graphics quality (Low/Medium/High), frame rate. Buried in a small gear icon.

**Where the real "configuration" lives:** Deck building (Clash Royale) and Brawler selection (Brawl Stars) ARE the settings. In Clash Royale, choosing 8 cards from hundreds is the primary configuration decision, and it happens in the gameplay loop, not a settings menu. In Brawl Stars, picking a single Brawler for a match determines your entire playstyle.

**Design principles from Clash Royale (Steemit analysis):**
- Clean, readable UI — nothing ambiguous on screen
- No landscape mode required — plays in portrait, one-handed
- The game screen does not scroll during battle
- Configuration decisions (deck building) feel like gameplay, not setup

**Key design insight:** In competitive mobile games, the configuration that matters (loadout, character selection, strategy) is part of the core gameplay loop. The settings menu is intentionally boring because it should be — all the interesting decisions happen in-game. This avoids the anti-pattern of having important configuration in a non-game menu.

Sources:
- [Steemit — 10 Design Principles That Make Clash Royale Great](https://steemit.com/game/@clasre/breaking-down-designs-is-clash-royale-the-most-perfect-mobile-f2p-game-yet)
- [Mobile Free to Play — Brawl Stars vs Clash Royale: Designing a Strong Gacha](https://mobilefreetoplay.com/brawl-stars-vs-clash-royale-designing-gacha/)

---

### 2.5 Among Us — Host Configures, Others Just Play

**How it works:** One player (the host) creates a lobby. The host alone can modify game settings via the "Customize" laptop in the lobby:

- **Game Presets:** Pre-configured setting bundles
- **Game Settings:** Player speed, kill cooldown, kill distance, vision range, number of emergency meetings, discussion time, voting time, visual tasks
- **Role Settings:** Number of impostors, engineer, scientist, guardian angel, shapeshifter roles and their sub-parameters

**For non-host players:** There are zero game settings. You join, you see what map you are on, you wait for the host to press Start. A 5-second countdown begins, and the game starts.

**Key design insight:** By centralizing all configuration in the host role, Among Us solves the "multiplayer settings problem" — in most multiplayer games, every player configuring their own settings creates inconsistency or unfairness. Among Us makes one person the curator and everyone else a participant. This also means the vast majority of players (non-hosts) experience zero configuration friction. They just play.

The Game Presets feature is notable — it provides sensible defaults so even hosts do not need to understand every parameter. This is progressive disclosure within the host experience.

Sources:
- [Among Us Wiki — Settings](https://among-us.fandom.com/wiki/Settings)
- [Among Us Wiki — Host](https://among-us.fandom.com/wiki/Host)

---

## 3. Settings That Feel Like Part of the Game

### 3.1 Rez Infinite — Area Selection IS the Settings

**How it works:** The game has five Areas (levels), each with distinct music, visual themes, and enemy patterns. Area selection from the main menu is the only meaningful "setting." Within each area, gameplay is on-rails — you shoot targets to add layers to the music, creating a synesthetic experience.

Area X (added for Rez Infinite) breaks the rails entirely — free-flight movement in a particle-effect environment. It is accessed as another area from the same menu, despite being a fundamentally different gameplay experience.

**Key design insight:** By making each area a self-contained audiovisual experience with its own identity, "choosing an area" does not feel like "choosing a difficulty" — it feels like choosing a song from an album. The difficulty naturally varies between areas, but the player's primary motivation for choosing is aesthetic preference, not skill assessment.

Sources:
- [PlayStation Blog — Classic Levels Deconstructed: Rez Infinite](https://blog.playstation.com/archive/2017/10/20/classic-levels-deconstructed-tetsuya-mizuguchi-musician-adam-freeland-dissect-rez-infinites-area-5)
- [Wikipedia — Rez](https://en.wikipedia.org/wiki/Rez_(video_game))

---

### 3.2 Wii Sports — Player Identity as Implicit Settings

**How it works:** Before playing Wii Sports, you create a Mii (avatar). The Mii is cosmetic, but the Mii system serves as the game's implicit configuration:

- You are always matched against CPU Miis near your skill level
- Skill level starts at 0 and adjusts based on wins/losses
- The game adapts to you without ever showing a difficulty menu
- New CPU opponents appear as your skill rises, creating a sense of progression

**Design for universal access:** Nintendo explicitly designed Wii Sports so that "both long time and first time players to interact together in a fun way." Sports were chosen as the theme because of universal familiarity. Controls were designed to be simple enough for anyone.

**Key design insight:** The ELO-like skill rating system IS the difficulty setting, but it is completely invisible. The player never sees a number, never makes a choice about difficulty. The game just gets harder as you get better, and easier if you struggle. This is the "Journey" approach to difficulty — the game adapts to you, not the other way around.

Sources:
- [Wikipedia — Wii Sports](https://en.wikipedia.org/wiki/Wii_Sports)
- [Wii Sports Wiki — Skill Level](https://wiisports.fandom.com/wiki/Skill_Level)

---

### 3.3 Mario Kart — CC Selection as Difficulty (With Diegetic Framing)

**How it works:** Before each race or Grand Prix, you select an engine class:

| Engine Class | Speed | AI Behavior | Framing |
|-------------|-------|-------------|---------|
| 50cc | Slow | Passive, bad at items | "Small engine" |
| 100cc | Medium | Moderate aggression | "Medium engine" |
| 150cc | Fast | Aggressive, good driving | "Large engine" |
| 200cc | Very fast | Very aggressive | "Maximum engine" |
| Mirror | 150cc reversed | Same as 150cc | "Mirrored tracks" |

**Access:** Pre-race menu. You pick your character, kart, and CC class all in the same flow — CC selection is not separated into a "difficulty" submenu.

**Communication tone:** "cc" (cubic centimeters) is a diegetic framing. It refers to engine displacement, not player skill. You are not choosing "Easy/Hard" — you are choosing what kind of engine to race with. This subtle reframing removes the psychological weight of admitting "I need Easy mode."

**Key design insight:** The diegetic difficulty label matters. "50cc" does not feel like "Easy." It feels like a choice about the type of racing experience you want. Kids naturally gravitate to 50cc because the karts are slower and more controllable; experienced players choose 150cc/200cc for speed and challenge. Neither group feels like they are making a "difficulty" admission.

Higher CCs award more Grand Stars (points), creating an incentive to move up without punishing those who stay at lower classes. Unlockable content (Mirror mode, some karts) is gated behind higher CC completion, providing soft progression pressure.

Sources:
- [Game8 — Difficulty Settings: 50cc, 100cc, and 150cc Explained](https://game8.co/games/Mario-Kart-World/archives/524035)
- [Mario Kart Racing Wiki — Engine Class](https://mariokart.fandom.com/wiki/Engine_Class)

---

### 3.4 Journey — No Settings At All

**How it works:** Journey has essentially no player-facing settings. No difficulty. No multiplayer lobby. No chat. No player names. No HUD customization.

The game silently pairs you with another player going through the same area. You see their character; they see yours. Communication is limited to a single "chirp" button. You cannot text, voice chat, or see their username (you learn their PSN ID only at the credits). If you lose connection or one player moves ahead, the game seamlessly pairs you with someone else — you may not even notice the switch.

**Key design insight:** Journey proves that a game can be multiplayer, emotionally resonant, and deeply engaging with zero configuration. Every design decision removes friction:

- No lobby = no waiting, no coordination
- No chat = no toxicity, no language barrier
- No difficulty = no decision paralysis
- No names = no reputation, no performance anxiety
- Seamless partner swapping = no "finding a group" problem

The game adapts entirely to the player. The pacing, the partner matching, the environmental storytelling — everything is designed so that the player's only job is to move forward. The game handles everything else.

This is the theoretical end-state of settings design: **a game so well-designed that settings are unnecessary.**

Sources:
- [Wikipedia — Journey](https://en.wikipedia.org/wiki/Journey_(2012_video_game))
- [Game Developer — Cutting Corners: Networking Design in Journey](https://www.gamedeveloper.com/design/cutting-corners-networking-design-in-journey)
- [Game Developer — Reimagining Co-op: A Case Study of Journey's Multiplayer Gameplay](https://www.gamedeveloper.com/programming/reimagining-co-op-a-case-study-of-journey-s-multiplayer-gameplay)

---

## 4. Accessibility-First Design

### 4.1 Celeste Assist Mode (see Section 1.1)

Key addition: Celeste's approach influenced the entire industry's conversation about accessible difficulty. The insight that "assist" is better than "easy" (implies helping rather than lowering) became a design principle widely adopted after 2018.

---

### 4.2 The Last of Us Part II — 60+ Accessibility Options

**Scope:** Over 60 accessibility features, categorized into:

**Three preset bundles (progressive disclosure):**
- Vision preset (for blind/low-vision players)
- Hearing preset (for deaf/hard-of-hearing players)
- Motor preset (for physical/mobility disabilities)

Each preset has a "Some" and "Full" variant, providing two levels of assistance per category.

**Specific features by category:**

| Category | Notable Features |
|----------|-----------------|
| **Vision** | Screen reader/TTS for all UI, high contrast mode, HUD scale, text size, colorblind modes, enhanced listen mode (audio pings for items/enemies) |
| **Motor** | Full button remapping, one-handed control schemes (left or right), hold-to-toggle conversion (every hold becomes a toggle), rapid-press-to-hold conversion, auto-aim, lock-on aim, auto weapon swap |
| **Hearing** | Subtitles with speaker names and directional indicators, awareness indicators, guitar accessibility (visual feedback for guitar minigame) |
| **Combat** | Slow motion toggle, infinite breath, skip puzzles (!) |

**Key design insights:**

1. **Presets as entry point, granularity as depth.** The three-preset system means a blind player can enable "Vision: Full" and immediately start playing. They can later fine-tune individual settings. This is textbook progressive disclosure.

2. **Full button remapping was a first for Naughty Dog.** Every command can be mapped to any input, including touchpad swipes and controller shake. This seems obvious but was not standard in AAA games until TLOU2 proved it was feasible.

3. **The "skip puzzle" option** is revolutionary. Instead of just making puzzles easier, the game acknowledges that some players cannot solve spatial puzzles regardless of time allowed (cognitive disabilities, vision impairments) and lets them skip entirely. This is the Celeste philosophy taken further.

4. **A blind player completed the entire game.** This was a design goal, and it was achieved. The screen reader, enhanced audio cues, and navigation assistance made a third-person action game playable without sight.

Sources:
- [PlayStation — The Last of Us Part II Accessibility](https://www.playstation.com/en-us/games/the-last-of-us-part-ii/accessibility/)
- [Naughty Dog Blog — Accessibility Features Detailed](https://www.naughtydog.com/blog/the_last_of_us_part_ii_accessibility_features_detailed)
- [PlayStation Blog — TLOU2 Accessibility Features](https://blog.playstation.com/2020/06/09/the-last-of-us-part-ii-accessibility-features-detailed/)

---

### 4.3 Forza Horizon 5 — Sign Language and Representation

**Key features:**
- **ASL and BSL interpreters** in picture-in-picture during cutscenes (first AAA game to do this)
- Interpreter position and background color are configurable
- **Color blind mode** for UI
- **High contrast mode** for menus and text (not in-game visuals)
- **Game speed modification** for motor accessibility
- **Customizable subtitles** with size, background, and speaker indicators

**Key design insight:** The sign language interpreter feature demonstrates accessibility as a content delivery mechanism, not just a control/input accommodation. Deaf players did not just need subtitles — they needed the expressiveness that sign language provides for narrative comprehension. This expanded the definition of "accessibility" beyond motor/visual/audio input to include communication modality preferences.

The feature was post-launch (Series 5 Update), not day-one. This is notable: accessibility can be iteratively improved after release.

Sources:
- [Xbox Wire — Gaming for Everyone: Forza Horizon 5 Accessibility Features](https://news.xbox.com/en-us/2021/11/04/gaming-for-everyone-the-accessibility-features-of-forza-horizon-5/)
- [Kotaku — Forza Horizon 5's Sign Language Interpreters Are a Huge Step](https://kotaku.com/forza-horizon-5s-sign-language-interpreters-are-a-huge-1848005282)

---

### 4.4 God of War Ragnarok — 70+ Accessibility Features

**Standout features:**

| Feature | What it does |
|---------|-------------|
| **Mini-game styles** | Precision (normal), Single Button (simplified), Auto (auto-completes) |
| **Auto pick-up** | Three tiers: Essentials / Economy / Full |
| **Combat audio cues** | Directional sounds and spoken indicators for attack type and direction |
| **One-button combat** | Companion attacks, parry assists, auto-combos |
| **Traversal assistance** | Audio and visual navigation cues |
| **Four preset bundles** | Each with "Some" and "Full" variants |

**Key design insight:** The three mini-game modes (Precision / Single Button / Auto) demonstrate a spectrum approach to accessibility. Instead of binary (on/off), each system offers three levels of assistance. This lets players choose exactly how much help they need for each specific interaction type.

The Auto Pick-up tiers are particularly clever: players with motor difficulties can use "Full" to never worry about item collection, while players who enjoy looting but struggle with combat can use "Essentials" (automatic health/rage only).

Sources:
- [PlayStation — God of War Ragnarok Accessibility](https://www.playstation.com/en-us/games/god-of-war-ragnarok/accessibility/)

---

## 5. Anti-Patterns — Settings UX That Fails

### 5.1 Difficulty Shaming / Easy Mode Mockery

**The pattern:** Games that mock, punish, or visually degrade the experience when players choose easier difficulties.

**Notorious examples:**

| Game | Shame Mechanism |
|------|----------------|
| **Wolfenstein 3D** | Easiest mode labeled "Can I Play, Daddy?" with protagonist BJ in a baby bonnet sucking a pacifier. Continued in modern Wolfenstein games with updated art. |
| **Ninja Gaiden Black** | "Ninja Dog" mode unlocks only after dying 3 times on level 1. Requires confirming 3 times that you want to "abandon the way of the ninja." Protagonist wears a purple ribbon for the entire game while sidekick Ayane constantly mocks you. |
| **DOOM (original)** | Easiest: "I'm Too Young to Die." Easy: "Hey, Not Too Rough." The naming hierarchy implies character judgment. |
| **Myth (Bungie)** | Easy mode description promises your "taste of success will turn to ashes in your mouth." |
| **Civilization** | Easy difficulty gives you insulting historical leader comparisons (Warren G. Harding) regardless of how thoroughly you win. |
| **Shin Megami Tensei IV** | To unlock easy mode, you must die, watch a mocking cutscene, pay half your money, die again, get another verbal lashing, and then easy mode becomes available. |
| **Streets of Rage 3** | Easy mode ends the game halfway through with a mocking Non-Standard Game Over. You literally cannot see the ending. |

**Why this is an anti-pattern:**
1. It punishes players with disabilities who have no choice but to play on easier settings
2. It creates anxiety about difficulty selection (better to not know than to be mocked)
3. It is now recognized as a "Discredited Trope" (TV Tropes) — the industry has largely moved away from it
4. It conflates "easy" with "bad" when easy mode may indicate motor disability, time constraints, or simply different play preferences

**The fix:** Celeste's approach (non-judgmental language, "Assist" not "Easy"), Hades' approach (invisible adjustment), or Dead Cells' approach (difficulty as earned progression, not shameful admission).

Sources:
- [TV Tropes — Easy-Mode Mockery](https://tvtropes.org/pmwiki/pmwiki.php/Main/EasyModeMockery)
- [The Gamer — 13 Games With Jokes About Playing On Easy Mode](https://www.thegamer.com/video-game-easy-mode-jokes/)
- [GamesRadar — Games That Treat You Like Dirt for Playing on Easy Mode](https://www.gamesradar.com/10-games-treat-you-dirt-playing-easy-mode/)

---

### 5.2 Settings Dumps (50+ Options on One Screen)

**The pattern:** Presenting every configurable parameter on a single scrolling page with no hierarchy, grouping, or indication of importance.

**Why it fails:**
- Decision paralysis — too many choices leads to no choice (or blindly accepting defaults)
- Important settings get buried alongside irrelevant ones
- New players cannot distinguish "you probably want to change this" from "only change this if you know what you are doing"
- No indication of what settings interact with each other

**Where it is common:** PC game graphics settings (resolution, texture quality, shadow quality, anti-aliasing type, anti-aliasing quality, ambient occlusion, screen-space reflections, volumetric fog, draw distance, LOD bias, anisotropic filtering...), audio menus (master, music, SFX, voice, ambient, UI sounds, reverb...).

**The fix:** Progressive disclosure. Show defaults/presets first (Low/Medium/High/Ultra), let users drill into individual settings. Group related settings. Indicate which settings have the most performance impact.

---

### 5.3 Settings That Require Restart

**The pattern:** Changing a setting forces the user to restart the game/application before it takes effect. Sometimes with no warning until after the change. Sometimes with confusing "apply" vs "OK" vs "save" buttons.

**Why it fails:**
- Breaks flow — the player wanted to adjust something and continue playing, not restart
- Creates fear of experimentation ("if I change this, I lose my current session")
- Especially harmful on consoles where restart times can be long
- Often technically unnecessary (many "requires restart" settings could hot-reload with more engineering effort)

**Where it is common:** Resolution changes, graphics API changes (DX11 vs DX12), some audio backend settings, language changes.

**The fix:** Hot-reload where possible. When restart is truly required, warn BEFORE the user commits, not after. Show a preview if possible. Games like Forza Horizon and most modern titles now apply resolution/graphics changes live with a "keep these settings?" confirmation timer.

---

### 5.4 Hidden Settings Only Discoverable via Forums

**The pattern:** Important configuration options that exist but are not in the settings menu — found only in config files, console commands, registry entries, or community forums.

**Examples:**
- FOV (field of view) sliders missing from many console ports
- Frame rate caps that can only be changed in INI files
- Mouse acceleration that can only be disabled via launch parameters
- Subtitles that exist but are not in the settings menu
- Colorblind modes buried in config files

**Why it fails:**
- Creates a two-tier playerbase (those who know the forums, those who do not)
- Accessibility features that are hidden are accessibility features that do not exist for most users
- Punishes casual players and rewards internet research
- Often indicates that the feature was added as an afterthought

**The fix:** If a setting exists, put it in the settings menu. If it is advanced, use progressive disclosure (Advanced section, not hidden entirely). Never require file editing for something that should be a UI toggle.

---

### 5.5 Settings That Break Game Balance

**The pattern:** Configuration options that, when changed, make the game trivially easy, unplayable, or undermine the core design intent without clearly communicating the consequences.

**Examples:**
- Auto-aim settings that eliminate all combat challenge without the player understanding why the game feels "boring"
- Speed/timescale settings that make physics-based gameplay glitch
- AI behavior settings that create degenerate strategies
- Multiplayer settings that create unfair advantages

**Why it fails:**
- Players change settings, have a bad experience, and blame the game
- The "optimal" setting is to turn on every advantage, which may hollow out the experience
- Players do not have enough information to predict the consequences of their choices

**The fix:** Celeste-style communication (explain what each setting does and how it affects the experience). Curated presets that are tested and balanced. Warning labels on settings that significantly alter the experience. Or the Hades approach: remove the granularity entirely and let the system auto-adjust.

---

## 6. Progressive Disclosure in Settings

### 6.1 Core Principle

Progressive disclosure means initially showing users only the most important options, with more specialized options available on request. Applied to game settings, this means:

**Layer 1 — Essential:** The 2-3 decisions that matter most (usually: difficulty preset, audio volume, controls sensitivity). Shown immediately.

**Layer 2 — Recommended:** Settings that many players will want to adjust but can be ignored by most (subtitles, colorblind mode, invert Y-axis). Available one tap/click deeper.

**Layer 3 — Advanced:** Fine-grained control for power users (per-axis difficulty, specific accessibility toggles, graphics details). Available but requires deliberate navigation.

**Layer 4 — Expert:** Config files, console commands, developer options. Not in the menu at all for most users.

### 6.2 Examples From Non-Game Software

**iOS Settings:**
- Top level: Airplane Mode, Wi-Fi, Bluetooth, Cellular (the most common toggles)
- One level deep: Individual app settings
- Deeper: Developer options, advanced network settings
- Each level shows only what is relevant to that context

**VS Code Settings:**
- Default: A searchable settings UI with categories (Editor, Workbench, Extensions)
- Search narrows results instantly (type "font" and see only font-related settings)
- Each setting has inline documentation
- Advanced: settings.json for direct JSON editing
- Expert: keybindings.json, launch.json, workspace settings

**Spotify Equalizer:**
- Default playback: No EQ, sounds fine for most people
- One level in: Preset EQ curves (Bass Boost, Acoustic, Classical, etc.) — pick a name, done
- One level deeper: Manual frequency band sliders for custom EQ
- The presets serve as both shortcuts and education (they show you what "Bass Boost" looks like on the frequency curve)

### 6.3 Progressive Disclosure Applied to Game Difficulty

**The pattern that works (derived from the research above):**

1. **First-time launch:** Offer 3 presets maximum with clear, non-judgmental names and one-sentence descriptions of the experience (not the mechanics). Example: "Relaxed — Focus on the story" / "Standard — The intended experience" / "Intense — For players who want a real challenge"

2. **In-game, discoverable:** A "Customize" option that opens per-system sliders (a la TLOU2) for players who want fine-grained control. Accessible from pause menu. Changes apply immediately.

3. **Auto-adjustment as safety net:** A Hades-style system that invisibly adjusts certain parameters based on player behavior (death rate, completion time, retry count). Never tell the player it is happening. Just make the game quietly more or less forgiving.

4. **Never lock content behind difficulty.** If story, endings, or meaningful gameplay is inaccessible on easier settings, the difficulty system is punitive, not assistive.

---

## 7. Synthesis — Design Principles for Game Settings UX

### Principle 1: Difficulty Is Not One Axis

Games that get difficulty right recognize that "difficulty" decomposes into many independent dimensions: timing, spatial awareness, resource management, AI behavior, puzzle complexity, input precision. The best systems (Celeste, TLOU2) let players tune these independently.

### Principle 2: Naming Matters More Than You Think

| Bad | Better | Best |
|-----|--------|------|
| Easy / Normal / Hard | Story / Action / Challenge | Celeste: "Assist Mode" (implies help, not weakness) |
| "Can I Play, Daddy?" | Beginner / Standard / Expert | Mario Kart: 50cc / 100cc / 150cc (diegetic, neutral) |
| "Are you sure?" confirmation on Easy | No confirmation needed | Hades: Single toggle, zero friction |

### Principle 3: The Best Settings Menu Is No Settings Menu

Journey has zero settings and is one of the most emotionally resonant games ever made. Threes has zero settings and is a masterpiece of game design. Alto's Odyssey has nearly zero settings and is a beloved relaxation experience. When a game is well-designed enough, settings become unnecessary.

### Principle 4: If You Must Have Settings, Use Progressive Disclosure

Show presets first. Hide granularity behind a "Customize" option. Group related settings. Never dump 50 options on one screen. Let the player's curiosity drive them deeper into configuration rather than forcing them to wade through it upfront.

### Principle 5: Settings Should Be Changeable Without Friction

Mid-session changes (Celeste, TLOU2, Hades) are vastly superior to requiring restart. If a player realizes mid-level that they need help, making them restart to get it is hostile design.

### Principle 6: Never Shame the Player

Easy Mode Mockery is a discredited trope. Celeste's language, Hades' invisible adjustment, and Sifu's journey-framed naming (Student/Disciple/Master) all demonstrate that difficulty accommodation can be done with dignity.

### Principle 7: Mode Selection Can Replace Difficulty Selection

Tetris Effect, Geometry Wars, and Super Hexagon demonstrate that offering different modes (with different rules, goals, and pacing) is often better than offering the same mode at different difficulty levels. Players choose based on what sounds fun, not based on self-assessment of skill.

### Principle 8: Auto-Adjustment Is the Gold Standard

Hades' God Mode, Wii Sports' hidden ELO, and Journey's seamless partner matching all demonstrate that the best difficulty system is one the player never interacts with directly. The game observes, adapts, and maintains flow without requiring the player to self-diagnose their skill level.

### Principle 9: Mobile Games Prove Simplicity Works

The most successful mobile games (Threes, Crossy Road, Alto's Odyssey) have essentially zero settings. The lesson for all platforms: every setting you add is a decision you are asking the player to make instead of playing your game. Add settings only when their absence would harm the experience.

### Principle 10: Accessibility Is Not a Feature — It Is a Design Constraint

TLOU2's 60+ options, God of War Ragnarok's 70+ features, and Forza Horizon 5's sign language interpreters demonstrate that accessibility should be designed from the start, not bolted on. But even these games show that accessibility options can be delivered through progressive disclosure (presets first, granularity second) so they do not overwhelm players who do not need them.
