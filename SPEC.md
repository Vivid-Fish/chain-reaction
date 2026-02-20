# Chain Reaction: Design Spec

## Vision

A one-tap chain reaction game where every cascade composes a unique melody. Simple, contemplative, satisfying. No complexity — one dot type, one explosion, one input.

## Core Mechanic

50 dots float on screen. Tap anywhere to create an explosion. Dots caught in the radius explode too, creating a chain reaction. Each dot plays a musical note when it detonates. The chain reaction IS the music.

## The Original Twist: Musical Chains

Each dot's Y position determines its pitch (pentatonic scale — top of screen = high, bottom = low). When a dot detonates, it plays its note via Web Audio oscillator.

**This is gameplay, not decoration.** Low-pitched dots (bottom of screen) have wide, slow explosions. High-pitched dots (top) have narrow, fast ones. A cluster of low dots gives an easy chain but a droning bass. Reaching high dots is harder but the melody soars. The player learns to "hear" good chains before they tap.

Pentatonic scale only (e.g., C4, D4, E4, G4, A4 and octaves). Impossible to sound bad — any sequence of pentatonic notes is harmonious.

## Structure: Levels with Targets

Not endless mode. Progressive clear targets per level:

| Level | Dots | Target | Feel |
|-------|------|--------|------|
| 1 | 10 | 3 | Tutorial — almost any tap works |
| 2 | 15 | 6 | Easy — find a cluster |
| 3 | 20 | 10 | First real challenge |
| 4 | 25 | 15 | Need to read the layout |
| 5 | 30 | 20 | Strategic |
| 6 | 35 | 24 | Hard |
| 7 | 40 | 30 | Very hard |
| 8 | 45 | 36 | Expert |
| 9 | 50 | 42 | Near-impossible |
| 10 | 55 | 48 | Perfect play required |
| 11 | 60 | 54 | Mastery |
| 12 | 60 | 58 | Legendary |

Each level is a single tap. You hit the target or you don't. New random layout, try again.

## Juice (Non-Negotiable)

These are not nice-to-haves. Without them the game feels dead.

### Sound
- Each dot: Web Audio oscillator, pentatonic pitch mapped to Y position
- Tone envelope: quick attack, medium sustain, long release (notes ring and overlap)
- Bigger chains = richer chords (many notes overlapping = harmonic wash)
- Background: low ambient drone that shifts key every few levels

### Celebration (Invest Disproportionate Effort Here)
When you clear a level:
- Hold the last note, let it resonate
- All remaining dot positions bloom into particles
- Background swells to match the final chord
- Brief pause before next level (let the moment breathe)
- On "Perfect!" (all dots cleared): extended celebration, screen fills with color

This is the #1 retention mechanic. Peggle proved it — the end-of-level moment is what brings players back.

### Visual Feedback
- Expanding circles with color trails, not instant pops
- Each cascade should take 2-3 seconds to fully play out (watchable, not instant)
- Dots glow subtly with their pitch color (warm low, cool high)
- Screen shake on chains of 5+ (subtle, Vlambeer-style)
- Background color shifts with cascade intensity
- Particle trails connecting chain explosions (show the chain path)

### Timing
- First dot caught must react within 200-400ms of tap (immediate feedback)
- Each subsequent explosion has a slight delay (cascade feels like a wave, not simultaneous)
- The stagger IS what makes it musical — rapid-fire notes vs. slow spread create different melodies

## What to Cut

- No dot types, no multipliers, no power-ups, no special abilities
- No preview/undo — the single irreversible tap IS the design
- No timer — this is contemplative, not frantic
- No settings screen, no tutorial popups — the first level IS the tutorial
- No leaderboard yet — local high score only for MVP

## Simulation Testing

You can and should test this computationally:

```
For each level:
  Generate 10,000 random layouts
  For each layout, find the optimal tap (highest chain count)
  Measure:
    - Median optimal chain length
    - % of layouts where optimal chain >= target
    - % of layouts where random tap >= target

  Tune until:
    - Optimal tap clears target in ~80% of layouts (skill is rewarded)
    - Random tap clears target in ~15% of layouts (luck occasionally works)
    - The gap between optimal and random grows with level number
```

Explosion radius, dot count, and dot speed per level are your tuning knobs.

You CANNOT test whether the music feels good via simulation — but pentatonic guarantees it won't sound bad. Trust the scale.

## Dockerfile

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO /dev/null http://localhost:80/ || exit 1
```

## Reference Games (Study, Don't Copy)

- **Boomshine** — the one-tap-and-watch archetype, pentatonic audio, progressive clear targets
- **Peggle** — celebration design, slow-motion last-peg moment, "Ode to Joy" was a placeholder too perfect to remove
- **Rez / Lumines** — gameplay that generates music, player actions add layers to the soundtrack
- **Desert Golfing** — radical minimalism, permanent progress, no menus, no restart
- **Every Extend Extra** — chain reactions as sole mechanic, music integration where explosions add percussive beats

## Design Principles

1. **One tap must matter.** If decisions don't affect outcomes, it's a slot machine.
2. **The cascade IS the reward.** Even a failed attempt should produce something beautiful.
3. **Sound and visuals are inseparable from gameplay.** Strip the audio and the game should feel broken.
4. **Don't ask Tim which direction to go. Pick one, build it, ship it.** If it's wrong he'll say so.
