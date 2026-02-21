# Supernova Mechanic — Prior Art Research

## Date: 2026-02-20

## Design Patterns Across 15+ Games

### Pattern 1: Earned Activation (Not Given)
Every great super mode charges through skilled play, not time passing.
- **Tetris Effect Zone**: Line clears fill meter. T-Spins and Tetrises charge faster.
- **Bayonetta Witch Time**: Frame-perfect dodge (last few frames before damage).
- **Bejeweled Blazing Speed**: 16 consecutive rapid matches to fill ignition meter.
- **Geometry Wars**: Collecting Geoms (physical risk — fly over pickups while enemies attack).

### Pattern 2: Rule Inversion (Not "More Power")
The best super modes change HOW the game works, not just boost stats.
- **Tetris Effect Zone**: Gravity stops. Cleared lines stack at bottom instead of disappearing. Clear 20+ lines at once.
- **Bayonetta Witch Time**: Enemies freeze. Player attacks faster. Power relationship inverts.
- **Bejeweled Blazing Speed**: Every match becomes AoE (3x3 explosion). Matches chain automatically.
- **Superhot**: Time only moves when you move. FPS becomes chess.

### Pattern 3: Audio Submersion
The audio shift is what makes the brain register "something different is happening."
- **Tetris Effect**: Low-pass filter sweeps on. Vocals removed. Piano becomes prominent. Filter lifts when Zone ends = "breaking the surface."
- **Peggle Extreme Fever**: Beethoven's "Ode to Joy." Fireworks. Rainbow trail. Disproportionate to the input.
- **Bejeweled**: Fire crackling sounds. Voice announces "BLAZING SPEED."

### Pattern 4: Disproportionate Celebration
The response should be wildly out of proportion to the input.
- **Peggle**: Ball hits final peg → slow-mo zoom, drum roll, fireworks, Ode to Joy, rainbow trail, 5 scoring holes. The action is trivial; the celebration is epic.
- **Tetris Effect**: 20-line Ultimatris clear → all lines explode simultaneously, filter lifts, full music returns.

### Pattern 5: Preserved Agency
The worst thing a super mode can do is take control away during the player's triumph.
- **Bayonetta Witch Time**: Full combo freedom during slow-mo. Player choreographs the violence.
- **Tetris Effect Zone**: Player still places pieces. Must strategize which lines to stack.
- **Peggle scoring holes**: Ball drops into variable-value holes. Player watches with hope.
- **Anti-example**: Automated cutscene attacks in some JRPGs. Player watches, doesn't participate.

## Detailed Game Analysis

### Tetris Effect Zone
- **Charge rate**: 8 line clears = 25% meter. Full charge = 20 seconds duration.
- **Audio transition**: Low-pass filter sweep (removes highs, cuts vocals). Piano/mallet synth foregrounded. Line-clear stingers change from single notes to full chords.
- **Visual shift**: Monochrome/reduced-color palette. Particles emphasize compressed lines at bottom.
- **Naming escalation**: Octoris (8), Dodecatris (12), Decahexatris (16), Perfectris (18-19), Ultimatris (20), Impossibilitris (22).
- **Dual purpose**: Beginners = panic button (clear messy board). Experts = score multiplier weapon.

### Bayonetta Witch Time
- **Trigger window**: Last few frames before enemy attack connects. Bat Within (frame-late dodge) triggers shorter version.
- **Duration**: 2-4 seconds base (varies by attack dodged). Extendable by hitting enemies during Witch Time.
- **Rules changed**: Enemies near-frozen. Player attacks faster. Enemy parry/counter disabled. Increased knockback.
- **Audio/visual**: Screen desaturates toward blue/purple. Clock-tick sound layers over audio. Attack sounds remain full-speed (auditory contrast).
- **Key difference from generic slow-mo**: Earned through risk (must almost get hit). Full player agency (not a canned animation).

### Peggle Extreme Fever
- **Trigger**: Clear all orange pegs (level completion).
- **Sequence**: Slow-mo zoom → drum roll → peg struck → fireworks → rainbow trail ball → Ode to Joy → 5 scoring holes (10K/50K/100K/50K/10K) → bonus points.
- **Why it works**: Disproportionate celebration. The gap between trivial input (ball hits peg) and epic response (Beethoven, fireworks) creates feeling of unearned grandeur. Scoring holes preserve agency during celebration.

### Bejeweled Blazing Speed
- **Stage 1 (Speed Bonus)**: 3 matches within 3 seconds → +200 points. Each subsequent match within 3s adds +100, cap +1000.
- **Stage 2 (Ignition Meter)**: At +1000 speed bonus, meter appears. 16 consecutive matches with <1s gap fills it.
- **Stage 3 (Blazing Speed)**: Every match explodes in 3x3 AoE. Chain reactions everywhere. ~10 seconds duration.
- **Audio/visual**: Board pulses orange. Fire crackling. Voice callout. Screen-filling explosions.
- **Three-stage rocket**: You feel each stage engaging. The requirement for 16 rapid matches forces flow state.

### Geometry Wars — Multiplier as Super-Mode
- **No discrete activation**: The multiplier IS the super mode, always active.
- **Charge**: Collect green Geoms dropped by destroyed enemies (physical risk — fly into danger zones).
- **Scale**: No practical cap. Skilled players reach 10,000x+. An enemy worth 200 at 1x is worth 2,000,000 at 10,000x.
- **Reset on death**: Total loss. Creates intense loss aversion at high multipliers.
- **Why it works**: Exponential curve has a "tipping point" where identical actions produce dramatically different results.

### Resogun — Boost + Overdrive
- **Boost**: Recharges automatically. Full invincibility. Destroy enemies by ramming. Terminal explosion scales with enemies killed during boost.
- **Overdrive**: Charges via green particle collection (slower). Massive energy beam across entire playfield. Invincible during beam. Positioning matters (beam is directional).
- **Why it works**: Boost rewards aggression (compound interest on violence). Overdrive is the "ultimate weapon" fantasy.

### Pac-Man Championship Edition DX — Ghost Train
- **Build phase**: Moving past sleeping ghosts wakes them. They join a conga line behind Pac-Man (up to 30).
- **Payoff**: Eat Power Pellet → consume entire train for massive points.
- **Rule inversion**: Ghosts (the threat) become a resource you deliberately cultivate.
- **Sound design**: Rapid sequential ghost consumption is percussive and escalating.

### Devil May Cry — Style Meter
- **Always active**: D → C → B → A → S → SS → SSS. Drains constantly (faster at higher ranks).
- **What fills it**: Varied combos without repeating moves. Getting hit drops 2 ranks.
- **Why it works**: Real-time performance rating. Transforms combat from "did I win?" to "did I win beautifully?"

### Crypt of the NecroDancer — Groove Chain
- **Charge**: Kill enemies without missing a beat. Chain rises 1x → 3x.
- **Reset**: Missing a beat or taking damage.
- **Why it works**: Makes rhythm mechanically consequential, not just aesthetic.

## Experiment Results

See DESIGN.md "Supernova Mechanic — Experiment Results" for the full data.

**Winner: Multi-Tap (3 taps per round)** — scored +11 on dramatic-but-earned scale.
- Breaks the one-tap rule (rule inversion, like Tetris Effect breaking gravity)
- 3 taps = 3 decisions (preserved agency)
- +40-60% clear rate boost across all difficulties
- Only 18% wipe rate at R12 (not trivially easy)
