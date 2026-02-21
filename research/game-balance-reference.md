# Game Balance & Difficulty Curve Reference

Research compiled from prior art analysis of Boomshine, Peggle, Candy Crush, Vampire Survivors, and Rocket League. Includes CHI 2024 "juice" findings and automated balance testing methodologies.

## Key Reference Games

### Boomshine (Direct Ancestor)
- 12 levels: 1/5 dots (20%) at L1 → 55/60 dots (92%) at L12
- Average player needs ~25 tries for level 12
- **Explosion radius is constant** — no cascade growth
- Difficulty comes from **escalating required ratio**, not dot count
- Explosion duration ~3 seconds, fixed regardless of chain depth

### Peggle (Juice Mastery)
- "Extreme Fever" was placeholder programmer art — playtesters loved it
- Gap between input effort and output spectacle creates feeling of grandeur
- Scoring multiplier rises from 1x to 10x as you clear pegs
- Final-ball zoom only triggers when outcome is **uncertain**
- Skill-luck equilibrium: strategic choice + bounce physics

### Candy Crush (Industrial Balance Testing)
- BAIT bot mimics typical human behavior (not optimal play)
- Reduced manual level adjustments by 95%, 50% faster iteration
- "Complexity Staircase": new mechanics get isolation time before combining
- Deliberate breathing rooms after hard levels
- Separate metrics: "time to abandon" (fun), "time to pass" (difficulty), "puzzliness"
- 100 least fun levels identified and fixed continuously
- Human validation remains essential despite bot testing

### Vampire Survivors (Power Fantasy)
- Player AND enemy scaling match — challenge is a moving target
- Endless mode: enemies +100% HP/cycle, +50% spawn, +25% damage/cycle
- 30-minute death timer creates built-in arc
- Challenge is throughput (kill speed) not survival (until late game)

### Rocket League (Infinite Ceiling)
- "Drive car at ball" immediately comprehensible
- Skills emerge organically — 8+ years of technique discovery
- Same car at every skill level — gap is 100% skill
- Deterministic 120Hz physics — every outcome reproducible

## CHI 2024 "Juice" Research (Critical Finding)

Kao et al., n=1,699, pre-registered:
- **Success-dependent feedback (celebrations on success only) enhanced ALL motivational measures** — curiosity, competence, effectance
- **Amplified feedback (bigger particles/shake regardless of outcome) REDUCED motivation** — breaks action-outcome legibility
- **Curiosity was the strongest predictor** of both enjoyment and continued play time
- Curiosity requires UNCERTAINTY — if celebrations fire regardless of quality, motivation degrades

**Implication**: If "legendary" fires on every round because the game is too easy, juice becomes noise. Celebrations must be gated on genuine achievement.

## The Over-Juicing Problem

From Wayline analysis:
- Juice masks weak design ("lacks strategic depth? add more screen shake!")
- Creates false agency ("deluge of visual effects cannot compensate for lack of meaningful decisions")
- Homogenizes outcomes (every outcome triggers same cascade of particles)

**When juice WORKS** (Peggle principle): contingent on success, proportional to achievement quality, triggered when outcome is genuinely uncertain.

## Flow State (Csikszentmihalyi)

- **Boredom**: Skill >> Challenge (our v10 at high rounds)
- **Anxiety**: Challenge >> Skill
- **Flow**: Skill ≈ Challenge — maximum engagement

Dynamic Difficulty Adjustment: invisible is best. Negative feedback loops prevent runaway (Mario Kart blue shell). Our cascade gen cap IS a negative feedback loop, but it wasn't tight enough.

## Automated Balance Testing

### Bot Personas
- **Random/Blind bot**: taps random position. If clear rate >30% at any round >5, difficulty is broken.
- **Greedy bot**: picks position with most nearby dots. Proxy for competent player.
- **Human-sim**: greedy + delay + spatial noise. Closest to real player behavior.
- **Oracle**: theoretical maximum (used for SCR metric)

### Key Metrics
| Metric | Target | Our Equivalent |
|--------|--------|----------------|
| Completion rate <90% at non-tutorial levels | Too easy signal | Greedy bot clear rate per round |
| First-attempt pass rate <70% | Too easy signal | Random bot clear rate |
| Win rate deviation >10% between skill levels | Skill matters | Greedy - Random clear rate gap |
| Celebration frequency <1 per 3 actions | Celebrations feel cheap | Count legendary/godlike per session |

### TACR (Tap-Anywhere Clear Rate)
New metric: BlindBot avg clear / round target. Sweet spot: <30% for R3+.

## Actionable Recommendations (Applied in v11)

1. **Fixed explosion size** — CASCADE_RADIUS_GROWTH = 0 (removed cascade amplification)
2. **Reduced hold growth** — CASCADE_HOLD_GROWTH_MS: 200 → 80 (less drift-catch time)
3. **Faster speeds** — dots move faster at higher rounds (less time in explosion zones)
4. **Gentle radius decay** — 1% per round, floor 0.85 (counterpressure against density)

## Recommendations Not Yet Applied

5. **Gate celebrations on relative performance** — "legendary" should require exceeding expected clear rate by significant margin, not just raw chain count
6. **Breathing rooms** — after a hard round, insert generous-target round for tension-release
7. **Near-miss celebrations** — "47/50 — So close!" potentially more motivating than success (CHI 2024)
8. **Chain-resistant dot types** — armored (2 hits) or phasing (periodic immunity) to break percolation

## Sources
- [Boomshine Walkthrough (JayIsGames)](https://jayisgames.com/review/boomshine.php)
- [Anatomy of Fun: Why Peggle is a Masterpiece](https://trippenbach.org/2009/08/11/anatomy-of-fun-why-peggle-is-a-masterpiece/)
- [How King Uses AI in Candy Crush (InfoQ)](https://www.infoq.com/articles/candy-crush-QA-AI-saga/)
- [How does Juicy Game Feedback Motivate? (CHI 2024)](https://dl.acm.org/doi/10.1145/3613904.3642656)
- [The Juice Problem (Wayline)](https://www.wayline.io/blog/the-juice-problem-how-exaggerated-feedback-is-harming-game-design)
- [Csikszentmihalyi Flow Theory and Games](https://medium.com/@icodewithben/mihaly-csikszentmihalyis-flow-theory-game-design-ideas-9a06306b0fb8)
- [Feedback Loops in Game Design (Machinations)](https://machinations.io/articles/game-systems-feedback-loops-and-how-they-help-craft-player-experiences/)
- [Percolation Threshold (Wikipedia)](https://en.wikipedia.org/wiki/Percolation_threshold)
