# Near-Miss Feedback & Post-Failure UX Research

## Date: 2026-02-20

## Key Insight
Near-misses activate the same reward systems as actual wins (ventral striatum). The effect is strongest when: (a) player has agency, (b) feedback is immediate, (c) the near-miss is visually obvious.

## Game-by-Game Analysis

### Angry Birds — Trajectory as Teacher
- Previous shot's dotted trajectory stays visible during next aim
- Ball flight deliberately paced at leisure arc speed (not instant) → player observes cause and effect
- In Angry Birds Space: switched to predicted trajectory (physics changed, need forward-looking guidance)
- **Key principle**: Turn each attempt into a calibration instrument. Wordless, immediate, spatial.

### Peggle — Manufactured Anticipation
- **The Zoom**: When ball approaches final orange peg, time slows dramatically and camera zooms in
- **Free Ball Bucket**: Moves back and forth at bottom. Creates constant near-miss tension.
- **Lucky Bounce (25K pts)**: Awarded when ball hits bucket edge, bounces to hit another peg, falls back in. Game literally rewards almost-missing.
- **Key principle**: Slow down and zoom in at the moment of greatest uncertainty. Passive observation becomes cinematic.

### Racing Games — Ghost Laps
- Translucent recording of best run races alongside you in real-time
- You see WHERE you're faster/slower, not just a number
- Delta timing shows running +/- time difference
- **Key insight**: Players who observe the ghost (as reference frame) improve more than players who chase it (as target)
- **Key principle**: Comparative spatial feedback > abstract numerical feedback

### Super Meat Boy — Death as Spectacle
- After completing a level, ALL attempts replay simultaneously
- Dozens of Meat Boys run through, dying one by one at various obstacles, until successful run remains
- Developer philosophy: "the art of not punishing" — removing lives, short levels, visual reward for failing
- **Key principle**: Transform death into a form of reward. You WANT to see the chaotic replay.

### Celeste — Failure as Pride
- Death counter displayed prominently at end of each chapter
- Game explicitly says: "Be proud of your death count! The more you die, the more you're learning."
- Research confirmed: players showed high self-efficacy and did NOT report negative affect when failure held perceived function
- Instant respawn at nearby checkpoints (beginning of current screen, not level)
- Narrative mirrors failure loop: Madeline's anxiety = accepting failure as growth
- **Key principle**: Make failure thematically coherent, not punishing.

### Zachtronics (Opus Magnum, SpaceChem) — Population Comparison
- After completing puzzle, three histograms show your solution vs. all players: cost, cycles, area
- Does NOT reveal optimal solution — shows where you stand relative to population
- Optimizing for one metric hurts others → tension and replayability
- **Key principle**: Show the player there's headroom without giving away the answer.

### Candy Crush — "So Close!" Psychology
- When player fails near completion: "You only need 1 more jelly!" with character reaction
- Paired with continue offer (ad/payment) → exploits near-miss psychology directly
- **Key principle**: The goal-gradient effect — motivation spikes as you get closer to target.

## Psychology of Near-Misses

### The Near-Miss Effect
- Near-misses activate same reward pathways as wins (Neuron, 2009)
- Dopamine from reward prediction error (brain expected to win)
- Heart rate and arousal increase → physiological drive to retry
- Effect is strongest with minimal delay between action and feedback

### In Skill Games (Not Gambling)
- Near-miss genuinely IS informative (you were close, your approach was correct)
- Increases self-efficacy: "I was doing the right thing, just need to be more precise"
- This is distinct from gambling near-miss (which is misleading)

### Loss Aversion in Game Design
- Even virtual losses trigger real loss aversion
- More experienced players tolerate losses better (decreases with familiarity)
- **Framing matters enormously**: "You cleared 47 pegs!" vs "You missed 3 pegs" = completely different emotional response
- Endowment effect: objects gain value once "owned" (Portal's Companion Cube)

### Information on Demand
- Players rarely seek external info — post-round screen must be self-contained
- Unclear visualizations (radial graphs) are ignored entirely, not investigated
- **Goal-gradient effect** (Clark Hull, 1932): "7/10 collected" more motivating than "30% remaining"
- Two player archetypes: Strategists (use stats to fine-tune) and Rookies (look for signs of improvement)

## Recommended Post-Round Feedback for Chain Reaction

### Layer 1: The Headline (for everyone)
- **"You triggered 47 of 50 reactions!"** — frame as achievement, not deficit
- Nearly-full progress ring/bar makes near-miss viscerally obvious
- "3 more and you would have cleared it" (goal-gradient framing)

### Layer 2: The Spatial Replay (Peggle/Angry Birds model)
- Replay chain reaction with tap point highlighted
- Show propagation wavefront — where chain spread and where it STOPPED
- Mark the gap: highlight unreached dots that would have been triggered with slightly different placement
- Slow-mo zoom on the moment the chain breaks (Peggle principle)

### Layer 3: The "What If" (Ghost/Zachtronics model)
- After 2-3 failed attempts: show heatmap of where successful taps cluster
- Show "closest attempt" overlay from player's history (Super Meat Boy ghost model)
- Delta info: "Your tap was 12 pixels from the sweet spot"

### Layer 4: Emotional Design (Celeste model)
- Never mock failure. Frame deaths as learning.
- Make failed chain reactions visually interesting to watch
- Count attempts as persistence badge, not shame counter

### Anti-Patterns
- Do NOT show wall of numbers or radial graphs
- Do NOT require external info to understand feedback
- Do NOT frame results purely in terms of loss
- Do NOT reveal optimal solution on first failure (progressive after 2-3 attempts)
- Do NOT add long delay between failure and feedback
