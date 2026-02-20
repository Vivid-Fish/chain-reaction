# Player Experience Narrative & Design Critique

## The Ideal Player Experience

### Moment 1: First Open (0-500ms)

The page loads. The screen is nearly black -- `#0a0a1a`, a deep blue-midnight -- and for a beat, nothing. Then, over 400ms, ten small dots fade in, each one gently pulsing like a slow heartbeat. The dots are not all the same color: the ones near the top of the screen glow a soft cyan (`hsl(200, 80%, 60%)`), while the ones toward the bottom are a warm amber (`hsl(40, 80%, 60%)`). They are not moving. They are breathing. Each dot's radius oscillates between 5px and 7px on a slow sinusoidal cycle (period ~2.5 seconds), and because each dot started at a random phase, the field shimmers asynchronously, like lights reflected on water.

In the center of the screen, two lines of text in white, no drop shadow needed against the dark field:

**Chain Reaction**
*Tap to start a chain. Hit 3 to clear.*

No "Play" button. No menu. The game IS the start screen. The dots are already there, waiting. The player's finger is the only missing piece.

The emotional hook is curiosity married to an implied promise: these beautiful quiet dots are about to do something dramatic, and the player's single touch will be the cause.

There is no sound yet. Silence is intentional. The AudioContext has not been created. The first tap will birth both the explosion AND the audio system. The contrast between this held-breath silence and the coming burst of sound is part of the design.

### Moment 2: First Tap (0-2s after tap)

The player taps somewhere on the field. Let us say they tap near a cluster of three dots in the lower-center of the screen, approximately y=480 on a 600px canvas.

**0ms:** The tap registers. The AudioContext initializes (this happens invisibly in under 5ms on modern hardware). A `DynamicsCompressorNode` spins up. The reverb impulse response generates (a 1.5-second tail of exponentially decaying filtered noise). All of this is synchronous setup that completes before the first frame renders.

**0ms (same frame):** A hit-freeze. The game loop still renders but does not advance physics for exactly 3 frames (50ms at 60fps). The screen holds perfectly still. This micro-pause is the game saying "I heard you" -- the Vlambeer technique. During the freeze, the tapped dot instantly turns white (`hsl(0, 0%, 95%)`) and scales up from 6px radius to 10px over 50ms using `easeOutBack` (slight overshoot to 11px, settle at 10px). A white ring begins expanding outward from the tap point.

**50ms:** The freeze ends. Physics resumes. The explosion ring begins its lifecycle. It expands from 0 to `EXPLOSION_RADIUS` (approximately 80px on this canvas size -- NOT the current 120px, which is too large; see critique below) using `easeOutExpo` -- fast initial expansion that decelerates. Over 300ms it reaches 70% of its max radius.

**50ms:** The first note plays. At y=480 on a 600px canvas, this maps to the lower register of the pentatonic scale: approximately G3 (196 Hz). A triangle-wave oscillator fires with an attack of 5ms (nearly instant -- this is the player's own tap, so it needs to feel percussive), decay of 80ms down to sustain level (0.25 of peak), and a release tail of 300ms. Simultaneously, a quiet sine oscillator at 392 Hz (G4, one octave up) plays at 15% of the main volume, adding shimmer. Through the reverb (mix 0.2, duration 1.5s, decay 3.5), the note acquires a gentle tail. Through the delay (250ms, feedback 0.3), a ghost of the note echoes once, then fades.

The player hears a warm, round tone -- not a beep, not a chime, something closer to a marimba with a cathedral echo. It is unmistakably musical. This single note, reverberating into the dark, is the moment the player understands: this game makes music.

**50-100ms:** Twelve burst particles erupt from the tapped dot's position. They fly radially outward at 4-10px per frame, decelerating at 0.93 friction per frame. Their color is the dot's pitch color (warm amber at this Y position: `hsl(40, 100%, 60%)`). Four slower drift particles float upward (negative gravity, -0.02 per frame), lingering for 40-70 frames. Two or three spark particles -- tiny, 1-2px, extremely fast (12+ px/frame) -- streak outward and vanish in 8-16 frames. All particles render in additive blend mode (`globalCompositeOperation: 'lighter'`), so where they overlap they create bright hotspots.

**100-300ms:** The explosion ring continues expanding. Its stroke color is a warm red-orange (`rgba(255, 140, 80, alpha)`) with alpha decaying as it grows. The core (inner 30% of radius) is bright white-yellow. Screen shake is barely perceptible here -- a single dot detonation adds only 0.06 trauma, which at `trauma^2` produces less than 1px of offset. The player might feel it subliminally but cannot consciously identify it.

**300ms-2s:** The explosion ring has reached full radius. If it caught other dots, the cascade begins (see Moment 3). If it caught nothing -- a miss -- the ring fades over another 700ms. The particles settle and disappear. The reverb tail of the single note decays over 1.5 seconds. The screen returns to its quiet breathing state, but now with one fewer dot. The counter at top reads "9 dots" instead of "10."

The player's emotional state: a small "oh!" of recognition. The explosion was satisfying. The sound was unexpected and pleasant. They want to do it again, and now they are looking at the remaining dots with new eyes -- not as targets but as potential notes in a melody they are about to compose.

### Moment 3: First Chain Cascade (2-5s after initial tap)

Assume the player's tap in the lower-center caught two dots within the explosion radius, and those two dots are each within range of one or two more, creating a chain five dots deep. This is Level 1 (10 dots, target 3), so catching five is already a clear. Here is what happens:

**0ms (generation 0):** The player's tap detonates. G3 (196 Hz) plays. Burst particles. The ring expands.

**100ms +/- 20ms jitter (generation 1):** Two dots caught in the first explosion's radius detonate nearly simultaneously, but not exactly -- one at 85ms, the other at 115ms. They are at slightly different Y positions, so they play different notes: A3 (220 Hz) and C4 (261.6 Hz). The two notes, arriving 30ms apart, are perceived as distinct events -- not a chord, but a quick melodic pair. Both notes are triangle waves, but with a slightly gentler attack (20ms instead of 5ms) because these are chain reactions, not player taps. Their volume is lower (0.17 instead of 0.18) to begin the subtle dynamic taper that prevents walls of sound.

The screen shake trauma accumulates: 0.06 + 0.06 + 0.06 = 0.18. At `trauma^2 = 0.032`, displacement is about 0.5px. Still subliminal.

The burst particles from these two new explosions overlap with the still-fading particles from the first. In additive blend mode, the overlapping region glows brighter. The chain-depth color progression kicks in: generation-1 explosions are slightly brighter than generation-0 (lightness 65% vs 60%), giving a visual sense of the chain intensifying.

**200ms +/- 40ms (generation 2):** One more dot detonates. E4 (329.6 Hz). The melody so far is: G3, A3-C4 (quick pair), E4. This is an ascending pentatonic run -- it sounds like the opening of a lullaby played on a kalimba. The reverb tails of the earlier notes are still decaying, so the sound is accumulating into a shimmering wash. The delay effect echoes the G3 at this point, adding a ghost note underneath the E4.

Trauma is now ~0.24. `Shake^2 = 0.058`. Displacement: ~0.9px. The player might just barely notice a slight tremor in the screen.

**320ms +/- 60ms (generation 3):** Another dot, higher up the screen: G4 (392 Hz). The melody has risen from the bass into the middle register. The ascending motion is unmistakable now. The player did not plan this melody -- it emerged from the spatial arrangement of the dots -- but it sounds composed. This is the pentatonic guarantee: any sequence of these notes sounds deliberate.

**450ms +/- 80ms (generation 4):** The final dot in this chain. Near the top of the screen: A4 (440 Hz) or even C5 (523 Hz). The melody has climbed from warm bass to bright treble. The release tails of all five notes overlap, creating a rich pentatonic chord that rings for another 1.5 seconds.

Total chain duration: roughly 450-550ms for the detonation sequence, plus 1.5-2 seconds of audio decay and particle fadeout.

**The emotional peak:** As the fifth dot detonates, the cumulative trauma (0.06 * 5 = 0.30, `shake^2 = 0.09`) produces visible screen movement (~1.4px). This, combined with the crescendo of ascending notes and the expanding glow of overlapping particles, creates a unmistakable feeling of escalation. The chain built to something. It started as one note and became a melody.

**450ms + 200ms = 650ms:** The level target was 3. The player hit 5. A "Level Clear" banner appears (see Moment 5). But even before the banner, the player has already felt the reward -- the cascade itself was the celebration. The banner is just confirmation.

### Moment 4: First Failure

Level 3. Twenty dots, target ten. The player studies the field for two seconds (there is no timer -- this is correct; the SPEC says contemplative, not frantic). They see what looks like a cluster in the upper-right quadrant. They tap.

**The tap detonates.** A bright cyan note (E5, 659 Hz) rings out -- high and clear because they tapped near the top.

**Generation 1:** Two dots chain. D5 and C5. The melody descends: E5 - D5 - C5. It sounds pretty but brief.

**Generation 2:** One more dot. G4. The melody drops an octave. Four dots total.

**Generation 3:** Nothing. The fourth dot's explosion ring expands, passes through empty space, and finds no neighbors. The ring fades. The particles settle. The reverb tail decays.

**Silence.** The field is dark again. Six dots have been consumed (the tapped dot plus five in the chain). But the target was ten. Fourteen dots remain, pulsing gently, unreachable.

**The "almost" moment:** Two of those remaining dots are close to where the chain ended. The player can SEE that they were just barely outside the explosion radius. If they had tapped three pixels to the right, or if one dot had been slightly closer... This is the near-miss that Agent B identified as the most powerful retry driver. The game must communicate this clearly.

**Near-miss feedback (1 second after chain ends):** The game highlights dots that were within 120% of the explosion radius of any detonated dot but were NOT caught. These "almost" dots pulse once with a dim red outline (100ms on, 200ms off), and a small text appears near the chain counter: "Chain: 6 / 10 -- 2 dots were close." This is not a popup or modal -- it is ambient information that the player absorbs while already thinking "I should have tapped more to the right."

**The fail state UI:** After the near-miss highlight fades (400ms), the chain counter changes color from white to a muted orange. The remaining dots slowly (over 800ms) fade their brightness by 30%, but they do not disappear. The level prompt changes to:

*Chain: 6 / 10*
*Tap to try again*

There is no "Game Over" screen. No modal dialog. No button to press. The player taps anywhere on the darkened field, and the dots regenerate in a new random layout. This is Desert Golfing's lesson: the barrier between failure and retry must be zero.

**The emotion:** Not frustration. The chain they did create sounded beautiful. Six ascending notes, a brief melody that emerged and faded. The failure is gentle. But the near-miss information -- those two dots pulsing red, *right there* -- creates a specific, actionable thought: "Next time, aim more toward the center of that cluster." This thought, combined with the zero-friction retry, is what triggers the immediate re-tap. The player does not consciously decide to retry. Their finger moves before the thought completes.

### Moment 5: First Level Clear

Level 2. Fifteen dots, target six. The player taps a dense cluster in the center-left. The chain cascades through seven dots.

**Chain plays out (0-600ms):** Seven notes, ascending from D3 to A4. The melody builds. Screen shake intensifies to visible levels (trauma 0.42, displacement ~2.6px). Particles bloom and overlap, creating a bright band of light tracing the chain path.

**Last dot detonates (generation 5, ~500ms):** The seventh note (A4, 440 Hz) plays. But this note is different. Its sustain time is extended from 50ms to 400ms, and its release from 300ms to 1200ms. The note lingers, hanging in the air. The reverb catches it and spreads it into a resonant tail.

**+200ms after last detonation (700ms total):** The game detects that the chain has ended and the target has been met. A brief time-stretch effect: the game loop runs at 0.5x speed for 400ms (8 frames at half-speed). During this slow-motion window:

- The remaining eight dots (which were NOT part of the chain) each emit a gentle radial particle burst -- not explosions, but celebrations. Four to six particles per dot, drifting upward, in the dot's pitch color. This takes 400ms of real time (200ms of game time).
- The background pulses once from `#0a0a1a` to `#1a1a3a` and back over 300ms -- a subtle but perceptible brightening, as if the screen took a breath.
- A final chord sounds: the last three notes of the chain (E4, G4, A4) replay simultaneously as sustained sine waves at 60% of normal volume, held for 1.5 seconds with a long release. This creates a resolved, complete-sounding chord. Through the reverb, it fills the acoustic space.

**+1100ms (slow-mo ends):** The level-clear text appears, fading in over 200ms:

*Level 2 Clear*
*Chain: 7 / 6*

The text is white, 32px, centered. Below it, in smaller text (16px, 60% opacity): the player's score for this level. Below that, a subtle prompt: *Tap for next level*

**+1100ms to +3000ms:** The chord and reverb decay naturally. The particles float upward and fade. The screen settles back to its dark baseline. The dots from this level are gone. The player sits in the quiet afterglow of the clear.

**The emotion:** Satisfaction without interruption. The game did not shout "LEVEL COMPLETE!" with a fanfare and a star rating. It let the chain BE the celebration, extended the last moment just enough to mark it as special, and then got out of the way. The player feels accomplished -- they read the layout, chose well, and the melody that resulted was beautiful. The Peggle lesson is applied with restraint appropriate to this game's contemplative tone: the celebration is unmistakable but not garish.

**The tap to continue:** When the player taps, the clear text fades out over 150ms. New dots fade in over 400ms -- more of them this time (twenty for Level 3). The colors are the same pitch-mapped spectrum, but the increased count makes the field visibly denser. The implicit message: this will be harder. The player studies the new layout.

### Moment 6: Level 5 -- Strategic Play

Thirty dots. Target: twenty. The required percentage has jumped from 40% (Level 2) to 67%. The player can no longer succeed by tapping the first cluster they see. They must find the deepest chain path on the field.

**Before the tap (5-15 seconds of study):** The player's eyes move across the field, unconsciously tracking density. They are looking for something specific now: not just a cluster, but a *bridge*. A chain of dots where each one is within explosion radius of the next, forming a path that snakes across the screen. The ideal chain is not a tight cluster (which catches many dots in generation 1 but has no depth) -- it is a *connected corridor* that chains deep, catching dots in generations 2, 3, 4, and beyond.

The player has learned this from Levels 3 and 4. In Level 3, they discovered that a tight cluster gives a short burst of 4-5 notes in rapid succession -- a chord, not a melody. In Level 4, they found a long thin chain that played 12 notes in sequence, ascending from bass to treble, and it sounded like a composed musical phrase. They chase that feeling now.

**The dots' pitch colors help:** Looking at the field, the player sees a path: warm orange dots at the bottom, transitioning through yellow-green in the middle, to teal dots near the top. If they tap the lowest dot in this path, the chain will ascend spatially AND musically. They have learned that bottom-to-top chains produce ascending melodies, which feel more satisfying than random pitch sequences.

**The player's internal monologue:** "There's a cluster of five near the bottom-left... but they're isolated, no bridge to the middle. The center has a string of dots running diagonally from (200, 450) up to (400, 150)... if I tap the bottom of that string, it should chain through at least eight or nine. And there's a side branch around (350, 300) that could pick up another four. That's twelve to thirteen from the main chain. I need twenty. Where are the other seven? There's a cluster near the right side at (500, 250)... is there a bridge dot connecting the diagonal string to that cluster? Yes -- there's one dot at (420, 220) that's close enough to both. If the chain reaches that bridge dot, it picks up the whole right cluster."

This is the game's strategic depth. The single tap must be placed to maximize chain propagation through the network of dots. The player is solving a graph connectivity problem through spatial intuition. The decision takes 10 seconds, feels instantaneous, and carries weight because there is no second chance.

**The tap:** Bottom of the diagonal string. The chain cascades through 14 dots, ascending from C3 to A4 over 1.4 seconds. The melody is an ascending pentatonic phrase with variation -- not a straight scale run but a wandering climb, because the dots are not arranged in a straight Y-axis line. The bridge dot at (420, 220) catches. The side cluster detonates. Five more notes, this time descending slightly (the cluster is at a consistent Y height), adding a rhythmic staccato of repeated notes amid the ascending melody. Nineteen dots total.

**The near-miss:** Target was twenty. The chain missed by one. A single dot at (380, 180) pulsed red -- it was within 125% of the explosion radius of the bridge dot but not within 100%. The player sees this and knows: if they had tapped one centimeter further right, the initial explosion's position would have shifted the entire chain path, possibly catching that twentieth dot.

They tap to retry. The melody still rings in their memory. They want to hear what twenty-dot chain sounds like.

### Moment 7: Level 12 -- Mastery

Sixty dots. Target: fifty-eight. This is the legendary tier. The player has cleared Levels 1-11, which took 45 minutes across multiple sessions. They understand the system completely.

**The field:** Sixty dots fill the screen. At this density, almost every dot is within explosion radius of at least two others. The field looks like a constellation. The color spectrum is fully represented: deep red-orange at the bottom, gold and yellow-green in the middle band, teal and cyan at the top. The player sees not dots but a graph -- nodes and implicit edges.

**The study phase (30-60 seconds):** At this level, the player is not looking for a good chain. They are looking for the TWO dots that will NOT be in the chain, because catching 58 of 60 means losing only two. The question is: which two dots are the most isolated? The player identifies a dot in the upper-right corner and one in the lower-left that are furthest from their nearest neighbors. If the chain path avoids those two and catches everything else, the level clears.

The player traces the network backward from the isolated dots to identify which tap positions would create chains that exclude them. They are thinking: "If I tap HERE, the chain propagates through this corridor, across this bridge, through that cluster... it should reach everything except those two corners." This is expert-level spatial reasoning -- a graph traversal problem solved by human intuition trained over twelve levels of increasing complexity.

**The tap:** The player commits. The tap lands at a carefully chosen position near the center-left of the field.

**The cascade (0-3 seconds):** The chain propagates outward in waves. This is no longer a melody -- it is a symphony.

- **Generation 0 (0ms):** The tapped dot detonates. A single warm note: D3 (146.8 Hz). The bass foundation.
- **Generation 1 (100ms):** Four dots catch. E3, G3, C4, D4. A pentatonic chord blooms from the bass up. Screen trauma: 0.30. Displacement visible at ~1.4px.
- **Generation 2 (200ms):** Seven dots. The chain fans out in three directions. Seven notes play within a 60ms jitter window. The sound is thick but consonant -- a pentatonic wash, like wind chimes in a gust. Reverb and delay tails from generation-1 notes overlap with new generation-2 attacks, creating a continuous evolving texture.
- **Generation 3 (310ms):** Nine dots. The wave reaches the mid-screen register. Notes cluster around E4-G4-A4. The delay effect creates ghost echoes of the generation-1 bass notes, adding harmonic depth without new oscillators. Trauma: 0.60+. Screen shakes at 5+ pixels -- visible, exciting, not nauseating.
- **Generation 4-5 (420-550ms):** The wave splits into multiple advancing fronts. Each front produces its own micro-melody based on the Y-positions of the dots it encounters. One front ascends toward the top-right (C5, D5, E5 -- bright, sparkling high notes). Another front curves across the middle band (G4, A4, C5 -- a repeating rhythmic pattern). A third sweeps through a bottom cluster (C3, D3, E3 -- rumbling bass that adds weight).
- **Generation 6-8 (650ms-1.2s):** The chain has caught 45 dots. The screen is alive: overlapping explosion rings in progressive brightness, hundreds of particles in additive blend creating a luminous web, screen shaking at 10+ pixels. The audio is a continuously evolving pentatonic soundscape -- not noise, but a layered choir of oscillators at different decay stages. The compressor is working hard, keeping the output at musical levels despite 20+ simultaneous voices. Notes deeper in the chain have progressively quieter peak volumes (0.18 tapering to 0.05 by generation 8) and longer release tails (0.3s increasing to 0.7s), so the sound evolves from percussive attacks to a sustained resonance.
- **Generation 9-11 (1.3-2.2s):** The remaining reachable dots are picked off by the final wave fronts. Dots 53, 54, 55, 56, 57, 58. Each one adds a single clear note to the fading wash. By now, the early generations' notes have decayed to near-silence, so each new note is heard against a softer backdrop -- like individual raindrops after a downpour eases. The ascending trajectory continues: the last few dots are near the top of the screen, so the chain ends on high, bright notes (G5, A5), a natural resolution.

**The final count: 58 of 60.** Two dots remain, isolated in their corners, pulsing alone in the dark.

**Level Clear triggers (2.4 seconds after tap):**

The slow-motion stretch activates at 0.3x speed for 600ms (real time). During this window:
- The 58 explosion ring remnants shimmer and brighten.
- The two remaining dots do not explode but emit a single gentle pulse of their pitch color, acknowledging their survival.
- A sustained chord builds: the last five unique notes of the chain layer into a held pentatonic chord (E4, G4, A4, C5, E5) sustained for 2.5 seconds with a gradual crescendo to 0.2 peak, then an exponential release over 2 seconds.
- The background color swells from `#0a0a1a` to `#1a1a3a` and holds for the duration of the chord.
- Particles from all 58 detonation sites, some still lingering in their drift phase, float upward in unison, creating a rising curtain of colored light.
- Screen shake decays to stillness during the slow-motion phase, creating a sense of calm settling after violence.

**The text:**

*Level 12 Clear*
*Chain: 58 / 58*

And beneath it, an acknowledgment the player has never seen before:

*All levels complete.*

No fanfare beyond this. The game respects the player enough to let the cascade itself be the crowning achievement. The 3-second chain reaction that just played was the most complex melody the game can produce, and the player composed it with a single tap placed with thirty seconds of deliberation and twelve levels of learned intuition.

The emotion: the quiet satisfaction of mastery. Not triumph (there are no fireworks), not relief (the game was never punishing), but the specific pleasure of understanding a system so deeply that you can produce beauty from it with a single gesture.

---

## Agent Critique

### Agent A (Tech Stack) -- Critique

**Strengths:**
Agent A's recommendation to stay with raw Canvas 2D and Web Audio is correct and well-argued. The framework comparison is thorough, and the dismissal of Phaser, PixiJS, and p5.js for this scale is sound. The ChainAudio class is production-ready code with proper anti-click patterns, GC cleanup, and a complete signal chain (master gain -> compressor -> delay -> reverb -> destination). The particle pool using Float32Arrays and swap-with-last removal is genuinely the right pattern.

**Gaps:**

1. **No guidance on voice limiting.** Agent A mentions "cap the maximum number of simultaneous voices if needed (e.g., stop creating new oscillators past 20 active ones)" but does not specify what to do when the cap is hit. In a 58-dot chain at Level 12, the game will attempt to create 58 oscillators (plus 58 shimmer oscillators = 116 total) within 2.5 seconds. With release tails of 0.3-0.7 seconds, many will overlap. The compressor handles amplitude, but there is a CPU cost per oscillator. The exact cap should be specified: **24 simultaneous oscillators maximum.** When the cap is reached, new notes should pre-empt the oldest active note by fast-fading it (5ms linear ramp to 0.0001, then disconnect). This "voice stealing" is standard in synthesizers.

2. **The octave shimmer should be conditional.** Agent A's code adds a sine oscillator one octave up for chain depths 0-2. In practice, the shimmer should also be limited by the voice cap. At chain depth 3+, the shimmer adds very little perceptible brightness (the mix of notes is already rich) but costs an oscillator. Better rule: shimmer only for chain depth 0-1 (the player's tap and the first cascade wave), never beyond.

3. **Reverb generation timing.** The `_generateIR` function creates a stereo buffer at the AudioContext's sample rate. At 48000 Hz and 1.5-second duration, this is `48000 * 1.5 * 2 channels * 4 bytes = 576 KB` of buffer allocation. This happens inside `init()`, which is called on the first tap. On a low-end phone, this could cause a 10-30ms stall on the first interaction. Agent A should have specified: generate the IR buffer lazily (first frame after init, not inside init) or asynchronously (on a 0ms setTimeout to yield to the main thread after AudioContext creation).

4. **No mention of mobile AudioContext resume behavior.** The code shows `resume()` but does not address iOS Safari's specific requirement: AudioContext must be resumed inside the same call stack as the user gesture. Agent A's `onFirstInteraction` pattern is correct, but the ChainAudio class's `init()` should also call `resume()` internally, not rely on the caller to do both.

5. **Missing: what does a "miss" sound like?** Agent A's audio engine only plays pentatonic notes. But when the player taps empty space (no dot within 40px), there should be an audio response. The absence of sound on a miss would feel like the game ignored the input. A short noise burst (filtered white noise, 80ms decay, low volume 0.08) would acknowledge the tap without rewarding it musically. Agent A's code has no facility for this.

6. **The delay feedback is too high for rapid chains.** With `feedback = 0.3` and `delayTime = 0.25s`, a chain of 15+ notes will produce overlapping delay echoes that accumulate into a muddy wash. By generation 8, the delay buffer contains ghosts of generations 1 through 5, all still echoing. The delay feedback should be reduced to 0.2, and the wet mix should taper with chain depth (start at 0.25, reduce by 0.02 per generation, floor at 0.10). Alternatively, reduce delay time to 0.15s so echoes die faster.

**Things that sound good but would feel bad:**

- The screen shake `maxAngle = 0.05 radians` (2.86 degrees) is too aggressive for a contemplative game. At full trauma (20+ dot chain), the rotation would make the entire playfield visually distorted. Rotation should be capped at `0.015 radians` (0.86 degrees) or removed entirely. Pure translation shake is cleaner for this aesthetic.

### Agent B (Prior Art) -- Critique

**Strengths:**
This is an exceptional research document. The Boomshine level progression table, the Peggle celebration anatomy, and the "Play Again" loop psychology section are exactly what the spec needs. The design insights are ranked correctly: explosion lifecycle timing IS the single most important parameter. The anti-patterns section directly addresses the MVP's core problem (outcomes feel similar regardless of input).

**Gaps:**

1. **Boomshine's explosions persist and dots MOVE. Our dots are static.** Agent B notes this in the validation document's final paragraph but does not reconcile it with the prior art analysis. This is a fundamental difference. In Boomshine, a dot can drift INTO an explosion after it has expanded. In our game, dots are stationary, so the explosion's expanding radius IS the only mechanism for catching new dots. This means our explosion lifecycle cannot work like Boomshine's (3-second grow-persist-shrink). An expanding ring that grows, holds, and shrinks would look wrong against stationary dots: the "hold" phase would catch dots instantly on expansion, and the "shrink" phase would never catch anything new because nothing is moving toward it. Agent B should have recommended: either (a) make dots move (even slowly), or (b) abandon the grow-hold-shrink model and use a simpler expand-and-fade model where chain propagation is checked during expansion only.

2. **The "ascending scale per chain link" recommendation conflicts with the Y-position pitch mapping.** Agent B recommends "each successive explosion plays the next note higher in a pentatonic scale" (Peggle model). But the SPEC says each dot's note is determined by its Y position. These are incompatible. If a chain propagates from the top of the screen downward, should the notes ascend (per Peggle model) or descend (per Y-position mapping)? Agent B does not resolve this. The correct answer: Y-position determines the note, period. The ascending-scale effect happens naturally when chains propagate upward across the screen. The game should NOT override Y-position mapping with forced ascending scales. However, the initial tap's position influences the direction of the chain, so the player CAN choose to create ascending melodies by tapping at the bottom of a chain path. This is player agency, not forced escalation.

3. **Quantization (Rez model) would hurt, not help.** Agent B recommends snapping sounds to an 8th-note grid at 120 BPM (250ms intervals). In practice, this would destroy the organic feel of the cascade. A chain of notes arriving at 85ms, 115ms, 210ms, 320ms has a natural, rain-like rhythm. Quantizing these to 0ms, 250ms, 250ms, 500ms would make the chain sound robotic and remove the cascading-wave sensation. Quantization is right for Rez (where the player's actions layer onto a pre-existing beat track) but wrong for a game where the chain itself IS the music. The cascade timing jitter is the musical character. Do not quantize.

4. **The "density heat map" UI suggestion would harm the aesthetic.** Agent B recommends showing "heat map glow where dots are concentrated." On a dark field with colored dots, adding a heat map overlay would be visually noisy and would also reduce the skill ceiling by making the optimal tap position obvious. The dots' own positions are the information the player should read. If the game needs to help players identify clusters, a far subtler approach is better: dots that are within explosion radius of three or more other dots could glow 10% brighter. This is a hint, not an answer.

5. **No discussion of the ONE-TAP constraint's implications.** The SPEC says each level is a single tap. Agent B discusses this in the Boomshine section but does not analyze a critical consequence: the player cannot course-correct. In games with multiple inputs, early mistakes can be recovered from. In a one-tap game, the first frame's result is final. This amplifies the importance of near-miss feedback (Agent B covers this well) but also means the explosion-radius-to-dot-spacing ratio must be carefully tuned so that the "best" tap position is not hyper-specific (requiring pixel-perfect accuracy) but rather a "zone" of good tap positions. Agent B should have recommended a sensitivity analysis: how much does chain length degrade as the tap moves 10px, 20px, 50px from the optimal position? If the degradation is too steep (cliff), the game feels like pixel-hunting. If too shallow (plateau), position does not matter.

**Things that sound good but would feel bad:**

- **Hit pause (0.1-0.2 second per explosion in a chain):** Agent B recommends this from Vlambeer. In Vlambeer's games, hit pauses are applied to individual discrete events (shooting an enemy, landing a hit). In a chain reaction with 20-40 explosions, pausing 0.1-0.2 seconds per explosion would extend a 2-second chain to 4-6 seconds, killing the cascading momentum. Hit-pause should be applied ONLY to the player's initial tap (3 frames / 50ms) and never to cascade detonations.

- **Lucky bounce (manipulated trajectories):** Our dots do not move. This mechanic has no application unless we add dot movement. Agent B includes it without noting this.

### Agent C (Fun & Validation) -- Critique

**Strengths:**
The juice priority ranking is practical and correctly weighted. Cascade timing stagger is ranked #1 as it should be. The screen shake specification is well-parameterized with exact trauma values, decay rates, and displacement calculations per chain size. The validation test suite is thorough; the BFS chain simulation matches the game's actual mechanics, and the pass/fail criteria for each level are reasonable. The color design section provides exact HSL values.

**Gaps:**

1. **The cascade simulation uses BFS, but the game uses time-delayed propagation.** In Agent C's `simulateChain()`, each exploded dot immediately checks all other dots within radius. This is an instant BFS. But the actual game should use time-delayed propagation (Agent C's own CASCADE_DELAY_MS = 100ms). The difference matters: in the time-delayed model, dots move slightly (if we add movement) or other explosions' expanding radii might create chain paths that the instant BFS would not predict. For static dots the BFS is accurate, but the validation suite should note this assumption.

2. **Agent C specifies `osc.type = 'sine'` in the audio section but Agent A recommends `'triangle'` and the ChainAudio class uses `'triangle'`.** This is a direct conflict. Sine waves sound pure and bell-like. Triangle waves sound warmer and cut through better in a mix of many simultaneous notes. For a chain reaction game where 10+ notes might overlap, triangle is the correct choice (sine waves at close frequencies produce audible beating/phasing artifacts; triangle waves' richer harmonic content masks this). Agent C's audio code should use triangle.

3. **The hit-freeze specification (3 frames = 50ms) needs more precision.** Agent C says "pause for 3 frames (50ms at 60fps)." At 60fps, 3 frames is actually 49.95ms, but more importantly: during the freeze, should audio still play? If the player taps, the note should sound immediately (0ms delay), but physics should freeze for 50ms. If audio is also frozen, the note is delayed by 50ms, which feels sluggish. The correct behavior: audio fires immediately on tap (before the freeze even starts), visual physics freezes for 3 frames, then visual physics catches up.

4. **Particle budget is underspecified for the cascade scenario.** Agent C says "worst case 60 dots * 20 particles = 1200 particles" and the pool pre-allocates 1500. But particles from early detonations are still alive when later detonations spawn new ones. With burst particle lifetimes of 20-35 frames and drift particles of 40-70 frames, and a 58-dot chain playing out over 150 frames (2.5 seconds), the peak particle count could exceed 1500 if the chain's later detonations happen before early particles have died. The pool should be 2000, or the per-detonation particle count should drop with chain depth (20 particles for depth 0-3, 12 for depth 4-7, 8 for depth 8+).

5. **The background pulse spec creates a GC issue.** Agent C's background color uses template literals: `` `rgb(${bgR}, ${bgG}, ${bgB})` `` called every frame. Creating a new string every frame for the background fill is wasteful. For the 95% of frames where `bgBrightness = 0`, this should short-circuit to a cached constant string `'#0a0a1a'`. Only pulse frames need the dynamic string.

6. **Missing: what happens between levels?** Agent C specifies audio-visual sync for detonations, chain milestones, level clear, and perfect clear. But there is no spec for the transition between levels. How long is the gap? What fades in, what fades out? When do the new dots appear? This inter-level moment is where the player's anticipation builds. A 1.5-second gap with the clear text visible, followed by 400ms of new dots fading in, is the right rhythm.

7. **The level target table differs from the SPEC.** Agent C's Level 1 has 10 dots with target 3; the SPEC also says Level 1 is 10 dots with target 3. But Agent C uses `EXPLOSION_RADIUS = 120` and `CANVAS_W = 800, CANVAS_H = 600` for simulation, while the current MVP code uses full-screen canvas (`window.innerWidth x window.innerHeight`). On a 1920x1080 screen, an explosion radius of 120px is 6.25% of the width; on an 800x600 test canvas, it is 15% of the width. The simulation results are only valid for the simulated canvas size, and real gameplay on larger screens will produce very different chain statistics. The explosion radius should be specified as a percentage of the canvas's smaller dimension (e.g., 12-15% of `Math.min(width, height)`), not as a fixed pixel value.

### Cross-Agent Conflicts

**Conflict 1: Oscillator waveform type**
- Agent A: `'triangle'` (recommended for warmth and mix clarity)
- Agent C: `'sine'` (in the playNote code example)
- Resolution: Use `'triangle'`. Agent A's reasoning is correct. Sine waves phase-cancel at close frequencies; triangle waves don't.

**Conflict 2: Explosion radius**
- Current MVP: `EXPLOSION_RADIUS = 120` (fixed pixels)
- Agent C simulation: 120px on an 800x600 canvas
- Actual gameplay: 120px on 1920x1080 or 390x844 (iPhone) screens
- Resolution: Explosion radius must be relative: `EXPLOSION_RADIUS = Math.min(canvas.width, canvas.height) * 0.13`. This produces ~78px on a 600px-tall phone screen and ~140px on a 1080px desktop. The simulation must use the same formula.

**Conflict 3: Whether to add dot movement**
- SPEC: "50 dots float on screen" (implies floating, but current code has static dots)
- Agent B: References Boomshine's moving dots and Suika's physics, recommends "slight physics variation"
- Agent C: Simulation assumes static dots (BFS with no time component)
- Resolution: Add slow linear movement with wall-bouncing (speed: 0.3-0.8 px/frame, random direction). This is essential for three reasons: (1) it makes the explosion lifecycle matter (dots can drift INTO explosions), (2) it creates the variable outcomes the SPEC demands (same tap position produces different chains on retry because dots have moved), (3) it prevents the game from being "solvable" by pattern recognition on static layouts. The simulation test suite must be updated to account for movement.

**Conflict 4: Hit-pause scope**
- Agent B: "0.1-0.2 second micro-pause on each explosion in a chain" (from Vlambeer)
- Agent C: "pause for 3 frames on significant impacts... only to the initial player tap, not to cascade detonations"
- Resolution: Agent C is correct. Hit-pause on every cascade detonation would stutter a 30-dot chain into a 6-second slog. Hit-pause on the player's tap only (3 frames = 50ms).

**Conflict 5: Ascending scale vs Y-position mapping**
- SPEC: Y position determines pitch
- Agent B: "Each successive explosion plays the next note higher in a pentatonic scale" (Peggle model)
- Agent A: Y-position to frequency mapping function
- Resolution: Y-position mapping only. No forced ascending override. The ascending effect should emerge naturally from chain topology, not be imposed.

**Conflict 6: Note attack timing for chain reactions**
- Agent A: chain depth > 0 gets attack = 0.02 (20ms)
- Agent C: attack = 0.01 (10ms) for all notes
- Resolution: Agent A's approach is better. The player's tap should sound percussive (5ms attack). Chain reactions should sound slightly softer (15ms attack, not 20ms -- 20ms is perceptible as sluggish on short notes). The difference in attack time between the tap and the cascade gives the player's action a distinct character.

**Conflict 7: Delay effect parameters**
- Agent A: delayTime = 0.25s, feedback = 0.3, wet = 0.25
- Agent C: No delay specification (uses raw audio without effects in the playNote example)
- Resolution: Include delay, but with reduced feedback (0.2) and wet (0.15) to prevent wash buildup during long chains. The delay is important for single notes (gives them space and character) but must not accumulate during cascades.

---

## Revised Consolidated Recommendations

### Audio Design (Exact Parameters)

**Oscillator configuration:**
- Waveform: `'triangle'` (primary), `'sine'` (shimmer, depth 0-1 only)
- Voice limit: 24 simultaneous oscillators. When exceeded, steal the oldest voice (5ms linear ramp to 0.0001, then disconnect).
- Shimmer: one octave up from primary note, volume at 12% of primary, only for chain depth 0 and 1.

**ADSR envelope (per note):**

| Parameter | Player tap (depth 0) | Cascade (depth 1-3) | Deep cascade (depth 4+) |
|-----------|---------------------|---------------------|------------------------|
| Attack | 5ms | 15ms | 15ms |
| Decay | 80ms | 80ms | 60ms |
| Sustain level | 0.25 | 0.25 | 0.20 |
| Sustain time | 50ms | 50ms | 30ms |
| Release | 300ms | 300ms + depth*40ms | 300ms + depth*40ms |
| Peak volume | 0.18 | 0.18 - depth*0.012 | 0.18 - depth*0.012, floor 0.05 |

**Level-clear held chord:**
- Notes: last 3 unique frequencies from the chain
- Waveform: `'sine'` (purer for sustained tones)
- Attack: 200ms
- Sustain: 1.5 seconds
- Release: 2.0 seconds
- Volume: 0.15
- Play simultaneously, overlapping with the chain's reverb tail

**Miss sound (tap on empty space):**
- Source: white noise via `createBufferSource()` with a 0.1-second buffer of random samples
- Filter: lowpass `BiquadFilterNode`, frequency 800 Hz, Q 1.0
- Envelope: attack 2ms, release 80ms, peak volume 0.08
- No reverb/delay send (keep it dry and flat to contrast with the musical dot notes)

**Pentatonic scale (C major pentatonic, 3 octaves, 15 notes):**
```
C3=130.81, D3=146.83, E3=164.81, G3=196.00, A3=220.00
C4=261.63, D4=293.66, E4=329.63, G4=392.00, A4=440.00
C5=523.25, D5=587.33, E5=659.25, G5=783.99, A5=880.00
```

**Y-to-frequency mapping:**
```
index = floor((1 - y/canvasHeight) * 14)
clamped to [0, 14]
frequency = SCALE[index]
```
Top of screen (y=0) = A5 (880 Hz). Bottom of screen (y=canvasHeight) = C3 (130.81 Hz).

**Signal chain:**
```
oscillator -> noteGain (ADSR envelope)
  -> masterGain (0.7)
    -> DynamicsCompressorNode (threshold -20dB, knee 10, ratio 8)
      -> delay (time 0.15s, feedback 0.2, wet 0.15, lowpass filter 3000Hz on feedback loop)
        -> reverb (convolver, IR duration 1.5s, decay 3.5, wet mix 0.18)
          -> destination
```

**Reverb IR generation:** Call `_generateIR()` asynchronously after AudioContext creation, using `setTimeout(fn, 0)` to yield to the main thread. Cache the buffer. Until the IR is ready, skip the convolver in the signal chain (direct connect delay output to destination).

**AudioContext initialization:** Create and resume inside the same user gesture handler. On iOS Safari, this means `new AudioContext()` followed immediately by `ctx.resume()` inside the `touchstart` or `click` callback, before any async operations.

### Visual Design (Exact Parameters)

**Dot appearance:**
- Base radius: 6px
- Idle animation: radius oscillates sinusoidally between 5px and 7px, period 2.5 seconds, random phase offset per dot
- Fill color: `hsl(H, 80%, 60%)` where H is mapped from Y position (top=200 cyan, bottom=20 orange-red; formula: `H = 200 - (y/canvasHeight) * 180`)
- Outer ring: same hue, alpha `glow * 0.4`, 1px stroke at radius + 3px

**Dot movement (new, not in current MVP):**
- Speed: 0.3 + random() * 0.5 px/frame (0.3-0.8 px/frame)
- Direction: random angle, constant per dot
- Wall bounce: reflect off all four canvas edges with a 15px margin
- Purpose: prevents static solvability, enables Boomshine-style drift-into-explosion moments

**Explosion appearance:**
- Ring stroke: `rgba(255, 140, 80, alpha)` where alpha = 1 - progress
- Ring stroke width: 2px
- Core fill: `rgba(255, 220, 140, alpha)` at radius * 0.25 (inner 25%)
- Expansion: 0 to `EXPLOSION_RADIUS` over 300ms using `easeOutExpo`
- Hold at full radius: 1200ms
- Shrink from full to 0 over 500ms using `easeInQuad`
- Total lifecycle: 2000ms (300ms grow + 1200ms hold + 500ms shrink)
- Chain detection: check for new dots entering the radius EVERY FRAME during the grow and hold phases (not just once at 70% of life as in the current MVP)

**Explosion radius (relative, not fixed):**
- `EXPLOSION_RADIUS = Math.min(canvas.width, canvas.height) * 0.13`
- This yields ~78px on a 600px phone, ~104px on an 800px tablet, ~140px on a 1080px desktop
- All balance testing must use this formula, not a fixed pixel value

**Particle specification:**

Per detonation (chain depth 0-3):
- Burst: 8 particles, speed 4-10 px/frame, radial with 0.4 radian jitter, size 2-5px, lifetime 20-35 frames, friction 0.93, gravity 0.05
- Drift: 4-8 particles, speed 1-3 px/frame, random direction, size 3-7px, lifetime 40-70 frames, friction 0.97, gravity -0.02
- Spark: 0-4 particles, speed 8-16 px/frame, random direction, size 1-2px, lifetime 8-16 frames, friction 0.90, gravity 0.1
- Color: dot's pitch-color hue, saturation 100%, lightness 60%

Per detonation (chain depth 4-7): reduce burst to 6, drift to 3-5, spark to 0-2.
Per detonation (chain depth 8+): reduce burst to 4, drift to 2-3, no sparks.

Pool size: 2000 particles. Use Float32Array struct-of-arrays. Swap-with-last removal.

Rendering: `globalCompositeOperation = 'lighter'` for all particles. Use `fillRect` (not arc) for particles under 3px radius.

**Chain-depth color progression:**
```
lightness = min(90, 60 + chainDepth * 5)
saturation = max(60, 80 - chainDepth * 3)
```

**Background:**
- Default: `#0a0a1a`
- Pulse: on cascade events, lighten to `rgb(10 + bgBright*30, 10 + bgBright*20, 26 + bgBright*40)` where bgBright decays at *0.92/frame
- Cache the default fill string. Only compute the dynamic string when bgBright > 0.001.

**Screen shake:**
- Trauma per detonation: 0.06
- Trauma cap: 1.0
- Decay: 0.92 per frame (exponential)
- Max translation offset: 12px (reduced from Agent A's 15px)
- Max rotation: 0 radians. No rotation. Translation only. Rotation looks wrong on a dark field with precise dot positions.
- Displacement formula: `offset = maxOffset * trauma^2 * (random() * 2 - 1)`
- Implementation: `ctx.save(); ctx.translate(shakeX, shakeY); ... ctx.restore();`

**Level-clear celebration:**
- Slow-motion: game loop at 0.5x speed for 400ms (800ms subjective)
- Remaining (uncaught) dots: single gentle pulse of their pitch color (radius 6px to 9px and back over 300ms)
- Background swell: `#0a0a1a` to `#1a1a3a` over 300ms, hold 500ms, fade back over 500ms
- Held chord: see Audio Design above
- Text: "Level N Clear" in white, 32px, centered, fade-in 200ms. Chain count below in 16px, 60% opacity.
- Tap prompt: "Tap for next level" in 14px, 40% opacity, appears 1 second after clear text

**Perfect clear (all dots caught):**
- Same as level clear, plus:
- All dot positions emit a secondary burst of 6 rising particles each (total up to 360 particles)
- Background swell reaches `#2a2a4a` (brighter)
- Text: "Perfect!" replaces "Level N Clear"
- Held chord uses 5 notes instead of 3

### Timing Design (Exact Parameters)

| Event | Timing | Notes |
|-------|--------|-------|
| Tap to audio response | 0ms | Audio fires before hit-freeze starts |
| Hit-freeze (player tap only) | 50ms (3 frames at 60fps) | Render continues, physics paused |
| Explosion grow phase | 300ms | easeOutExpo |
| Explosion hold phase | 1200ms | Full radius, still catching dots |
| Explosion shrink phase | 500ms | easeInQuad |
| Cascade delay per generation | 100ms base + random(-20, +20)ms jitter | Gives each generation 60-140ms spacing |
| Within-generation jitter | random(-20, +20)ms per dot | Prevents simultaneous detonations within a wave |
| Minimum note onset separation | 40ms (enforced) | If two notes would play within 40ms, delay the second by 40ms - gap |
| Full cascade duration (10 dots) | 1.0-1.4 seconds | Plus 1.5s audio decay tail |
| Full cascade duration (30 dots) | 1.8-2.5 seconds | Plus 2.0s audio decay tail |
| Full cascade duration (58 dots) | 2.5-3.5 seconds | Plus 2.5s audio decay tail |
| Level-clear slow-motion | 400ms real time at 0.5x speed | Starts 200ms after last detonation |
| Level-clear text fade-in | 200ms | After slow-motion begins |
| Level-clear to next-level prompt | 1000ms | "Tap for next level" appears |
| Inter-level transition (new dots) | 400ms fade-in | After player taps to continue |
| Fail state (chain ends below target) | 500ms pause, then near-miss highlight 300ms | Then "Tap to retry" prompt |
| Retry transition (dots regenerate) | 300ms old dots fade out, 400ms new dots fade in | 700ms total |
| Dot idle pulse period | 2500ms | Sinusoidal, random phase |

### What NOT to Do

1. **DO NOT quantize note timing to a beat grid.** The organic cascade timing IS the musical character. Quantization would make every chain sound like a metronome exercise instead of a wind-chime moment.

2. **DO NOT use rotation in screen shake.** On a dark field where the player is reading precise dot positions, rotation distorts the spatial information they need. Translation-only shake preserves readability while still communicating impact.

3. **DO NOT apply hit-freeze to cascade detonations.** Only the player's initial tap gets the 50ms freeze. Freezing every cascade explosion would stretch a 30-dot chain from 2 seconds to 3.5+ seconds, destroying the cascading momentum that makes chains exciting.

4. **DO NOT override Y-position pitch mapping with forced ascending scales.** Let the melody emerge from the spatial arrangement of dots. Ascending melodies happen naturally when chains propagate upward. Forced ascending scales would sound identical for every chain regardless of topology, killing the musical variety that makes each chain unique.

5. **DO NOT show a density heat map overlay.** It makes the optimal tap position obvious, removes the spatial reasoning skill, and clutters the clean dark aesthetic. The dots themselves are all the information the player should need.

6. **DO NOT use `shadowBlur` for glow effects.** It is extremely expensive on Canvas 2D, especially on mobile. Use additive blending (`globalCompositeOperation: 'lighter'`) for particle glow, and radial gradients for explosion cores. Both are GPU-accelerated and produce better-looking results.

7. **DO NOT play a "failure" sound when the player misses the target.** The chain they DID create sounded beautiful. Punctuating it with a negative buzzer contradicts the SPEC's principle that "even a failed attempt should produce something beautiful." Use visual-only failure communication (counter color change, near-miss highlight).

8. **DO NOT use a fixed-pixel explosion radius.** 120px means completely different things on a 390px phone screen and a 2560px monitor. Use a percentage of `Math.min(canvas.width, canvas.height)`.

9. **DO NOT generate the reverb impulse response synchronously on first tap.** It allocates 576KB and runs a loop over 72,000 samples. On a low-end phone, this stalls the first interaction by 10-30ms, making the tap feel sluggish. Generate it asynchronously or lazily after AudioContext creation.

10. **DO NOT let the explosion check for chain reactions only once (at 70% of life as in the current MVP).** The explosion should check for new dots entering its radius every frame during the grow and hold phases. The current "check once at 70% life" means a dot that enters the radius during the last 30% of the explosion's life is missed, creating invisible unfairness.

11. **DO NOT award points for tapping empty space (current MVP gives 5 points for a miss).** This makes scoring unreliable as a feedback signal. Tapping a dot should score. Tapping empty space should produce the miss-sound and no score. The score must reflect chain quality, not tap count.

12. **DO NOT allow multiple taps per level.** The current MVP lets the player tap repeatedly. The SPEC says "each level is a single tap." This is the core design constraint that creates tension and makes the decision meaningful. Enforce one tap per level. After the chain resolves, evaluate against the target.

### Implementation Priority (Revised)

Priority is ordered by player experience impact, accounting for dependencies. Each item lists its prerequisite (if any) and the agents whose work it draws from.

**Phase 1: Fix the Core (makes the game a game)**

1. **Enforce one-tap-per-level constraint.** After the player taps, disable further input until the chain resolves and the level is evaluated. (Prerequisite: none. Sources: SPEC, Agent B anti-pattern #1.)

2. **Add dot movement.** Speed 0.3-0.8 px/frame, linear, wall-bouncing. This is the single most impactful change for gameplay variety. Without movement, static layouts are solvable and outcomes feel similar. (Prerequisite: none. Sources: Agent B on Boomshine, SPEC "dots float.")

3. **Implement proper explosion lifecycle** (300ms grow, 1200ms hold, 500ms shrink). Check for chain reactions every frame during grow and hold phases, not once at 70% life. (Prerequisite: none. Sources: Agent B insight #1, SPEC timing requirements.)

4. **Make explosion radius relative** to canvas size (13% of smaller dimension). (Prerequisite: none. Sources: Agent C conflict analysis.)

5. **Add cascade timing stagger** (100ms base delay per generation, +/-20ms jitter per dot, 40ms minimum note separation). This transforms simultaneous-feeling chains into musical cascades. (Prerequisite: #3. Sources: Agent C rank #1, Agent B insight #2.)

**Phase 2: Add Sound (makes the game musical)**

6. **Implement ChainAudio class** with triangle oscillators, ADSR envelopes, DynamicsCompressor, and voice limiting at 24 voices. Initialize on first tap. (Prerequisite: none. Sources: Agent A complete audio engine.)

7. **Add pentatonic Y-position-to-frequency mapping** (15-note C major pentatonic, 3 octaves). (Prerequisite: #6. Sources: Agent A, Agent C frequency table.)

8. **Add delay effect** (0.15s, feedback 0.2, wet 0.15, lowpass 3000Hz on feedback loop). (Prerequisite: #6. Sources: Agent A, revised parameters.)

9. **Add reverb** (convolver, generated IR, 1.5s duration, decay 3.5, wet 0.18). Generate IR asynchronously. (Prerequisite: #6. Sources: Agent A.)

10. **Add miss sound** (filtered white noise burst, 80ms, volume 0.08). (Prerequisite: #6. Sources: this critique, gap in Agent A.)

**Phase 3: Add Juice (makes the game feel alive)**

11. **Eased explosion scaling** using `easeOutExpo` for grow and `easeInQuad` for shrink. (Prerequisite: #3. Sources: Agent A easing functions, Agent C rank #3.)

12. **Screen shake** (translation only, trauma-based, 0.06 per dot, decay 0.92, max 12px). (Prerequisite: none. Sources: Agent A, Agent C specification, revised to remove rotation.)

13. **Hit-freeze** on player tap (3 frames, physics pause, audio plays immediately). (Prerequisite: none. Sources: Agent C rank #10.)

14. **Upgraded particle system** with burst/drift/spark layers, additive blending, Float32Array pool of 2000. Depth-scaled particle count. (Prerequisite: none. Sources: Agent A particle pool, Agent C particle spec.)

15. **Chain-depth color progression** and pitch-mapped dot colors (HSL hue from Y position). (Prerequisite: none. Sources: Agent C color design.)

16. **Background color pulse** on cascade events. (Prerequisite: none. Sources: Agent C.)

**Phase 4: Add Celebration (makes the player come back)**

17. **Level-clear celebration sequence:** slow-motion, held chord, background swell, remaining dot pulses, text overlay. (Prerequisite: #6, #11, #16. Sources: Agent B insight #3, SPEC celebration section.)

18. **Perfect-clear extended celebration:** additional particle shower, brighter background, 5-note chord. (Prerequisite: #17. Sources: SPEC.)

19. **Near-miss feedback:** highlight dots within 120% of explosion radius that were not caught, show count. (Prerequisite: #3. Sources: Agent B anti-pattern #2, insight #4.)

20. **Instant retry with zero-friction transition:** tap to regenerate dots, 300ms fade out, 400ms fade in, no modal. (Prerequisite: none. Sources: Agent B on Desert Golfing, SPEC "no menus.")

**Phase 5: Balance & Validate**

21. **Run balance test suite** (Agent C's Tests 1-5) against the updated simulation (with movement, relative radius). Tune explosion radius percentage, dot count per level, and targets until all quality gates pass. (Prerequisite: #2, #4. Sources: Agent C complete test suite.)

22. **Run audio validation tests** (Agent C's Test 6) to verify pentatonic correctness and cascade timing. (Prerequisite: #5, #7. Sources: Agent C.)

23. **Run performance stress test** (Agent C's Test 7) with all juice effects active, 60 dots, full cascade. Verify p95 frame time under 16.67ms. (Prerequisite: all Phase 3 items. Sources: Agent C.)

24. **Sensitivity analysis** (new): for each level, measure how chain length degrades as the tap moves 10px, 20px, 50px from the optimal position. Verify that the "good zone" around optimal is at least 30px wide (the game should reward good positioning, not pixel-perfect precision). (Prerequisite: #21. Sources: this critique, Agent B gap #5.)
