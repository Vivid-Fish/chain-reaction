# Difficulty Curve Analysis — Root Cause

## The Problem
User reported: "the game actually got easier as rounds went on... I could tap anywhere and clear almost every dot, getting legendary, godlike"

## Root Cause: Percolation Threshold Exceeded

The game's difficulty curve **inverts** because dot density crosses the continuum percolation threshold around round 10-12.

### The Physics

The chain reaction mechanic is a 2D continuum percolation system:
- **Dots** = random points on a bounded plane
- **Explosion radius** = connection radius (two dots are "connected" if within explosion radius)
- **Cascade** = percolation through the connected component

In percolation theory, there's a critical density above which a giant connected component spans the entire system. Below this threshold, clusters are small and disconnected. Above it, nearly everything connects.

### The Numbers

| Round | Dots | Target | Avg Distance | Exp Radius | Coverage | Status |
|-------|------|--------|-------------|------------|----------|--------|
| 1 | 12 | 1 (5%) | 112.8 px | 60 px | 0.28 | Below threshold |
| 5 | 22 | 4 (16%) | 83.3 px | 60 px | 0.52 | Below threshold |
| 10 | 35 | 11 (30%) | 66.1 px | 60 px | 0.82 | Near threshold |
| 12 | 40 | 15 (36%) | 61.8 px | 60 px | 0.94 | Near threshold |
| 15 | 47 | 21 (44%) | 57.0 px | 60 px | 1.11 | Near threshold |
| 17 | 52 | 26 (50%) | 54.2 px | 60 px | 1.23 | ABOVE |
| 20 | 60 | 35 (58%) | 50.5 px | 60 px | 1.41 | ABOVE |

**Coverage** = n * pi * r^2 / screen_area. When coverage approaches ~1.0, the system crosses the percolation threshold. Above this, a single tap cascades through nearly all dots regardless of placement.

### Why It Gets Worse

These factors compound the problem:
1. **CASCADE_RADIUS_GROWTH** (+8% per chain generation): Each successive explosion is larger, increasing effective reach
2. **CASCADE_GEN_CAP** = 4: Up to 32% larger explosions at max depth
3. **Gravity dots** (pullRange: 2.5x, pullForce: 0.012): Pull nearby dots closer, increasing effective density
4. **Volatile dots** (radiusMult: 1.5x): 50% larger explosions
5. **Mercy bonus** (up to +15% radius after failures): Makes it even easier after losing

### The Fundamental Flaw

`getRoundParams(r)`:
```
numDots = min(60, floor(10 + r * 2.5))  // Linear growth
target% = min(80%, 5% + (r-1) * 2.8%)   // Linear growth
```

Dot count increases linearly. Screen area stays fixed. Therefore **dot density increases linearly**. But percolation probability increases **nonlinearly** — it undergoes a phase transition at the critical density. Once crossed, the system flips from "sparse chains" to "everything connects."

The target percentage increases linearly too, but it doesn't matter — when 95%+ of dots cascade automatically, even a 50% target is trivial.

## What Boomshine Does Right

Boomshine (the original chain reaction game):
- Level 1: 1/5 dots (20%)
- Level 12: 55/60 dots (92%)
- **Crucially**: Boomshine has NO cascade growth. Each explosion is the same size. This prevents the percolation amplification effect.
- Boomshine also uses a larger play field relative to dot size, keeping density below threshold longer.

## Proposed Fixes

### Fix 1: Reduce explosion radius at higher rounds (recommended)
```javascript
const radiusDecay = Math.max(0.6, 1.0 - (r - 1) * 0.025);
explosionRadius = baseRadius * radiusDecay;
```
At round 12: radius = 70% of base. At round 17: 60% (floor).
This keeps coverage below threshold even with more dots.

### Fix 2: Remove CASCADE_RADIUS_GROWTH
Set `CASCADE_RADIUS_GROWTH = 0`. Each explosion stays the same size regardless of chain depth. This alone may solve the percolation issue.

### Fix 3: Increase speed more aggressively
Faster dots = less time for overlapping explosions to catch them. Currently speed caps at +0.8 from base (max ~2.2 px/frame). Could increase to 3-4 px/frame at high rounds.

### Fix 4: Add chain-resistant dot types
New dot type "armored" that requires 2 hits to detonate, or "phasing" dots that periodically become immune. These break the percolation chain.

### Fix 5: Cap dot count lower
Instead of cap at 60, cap at 35-40. But this feels anti-climactic.

## Recommended Approach

Combine Fix 2 (remove cascade growth) + Fix 3 (faster speeds) + gentle radius decay. Aggressive radius decay over-corrects — at 390px viewport, explosion radius is only 39px, and steep decay drops it below MIN_DOT_DISTANCE (25px), killing cascading entirely.

## v11 Implementation (applied)

- `CASCADE_RADIUS_GROWTH`: 0.08 → 0
- `CASCADE_HOLD_GROWTH_MS`: 200 → 80
- Speed scaling: speedMin cap 0.6 (was 0.4), speedMax cap 1.2 (was 0.8)
- Gentle radius decay: `max(0.85, 1.0 - (r-1) * 0.01)` — 15% max reduction at floor

## Simulation Proof: Random Bot Clear Rates (with dot motion)

A bot that taps at a **completely random position** (no strategy):

| Round | Dots | Target | Avg Caught | Clear Rate | All-Clear |
|-------|------|--------|------------|------------|-----------|
| 1 | 12 | 1 | 0.6 | 41% | 0% |
| 5 | 22 | 4 | 2.3 | 22% | 0% |
| 10 | 35 | 11 | 8.6 | 38% | 0% |
| 13 | 42 | 17 | 18.1 | **56%** | 0% |
| 15 | 47 | 21 | 25.1 | **64%** | 1% |
| 17 | 52 | 26 | 34.6 | **78%** | 2% |
| 20 | 60 | 35 | 48.0 | **87%** | 7% |

The random bot crosses 50% clear rate at round 13 — meaning it's literally easier to succeed than fail by tapping randomly. By round 20, a random tap catches 48 of 60 dots on average.

**Why dot motion matters**: Static simulations (no motion) show random bots catching only 2-5 dots at high rounds. But the explosion hold phase is 1000+ms. During that time, dots bounce around and drift INTO existing explosion zones. At high density, this cascade of drift-hits is what breaks the game. The HOLD duration is the amplifier that pushes the system past the percolation threshold.

## Validation Workflow Failure

The existing sim.js and sweep tools didn't catch this because:
1. **Bot placement was optimized** — bots pick good tap locations, but the issue is that ANY location works at high density
2. **Aggregate metrics** (SCR, DHR) masked the round-by-round collapse
3. **No per-round difficulty measurement** — metrics averaged across all rounds instead of tracking the difficulty gradient
4. **No "random bot" baseline** — a bot that taps randomly should FAIL at higher rounds. If it succeeds, difficulty is broken.

### Fix for validation:
Add a "random bot" that taps at completely random positions. If random bot clear rate exceeds 30% at any round > 5, difficulty curve is broken. This is the simplest canary metric.

## v11 Results (300 trials, 390x844 viewport)

| Round | Dots | Target | Random Caught | Random Clear | Greedy Caught | Greedy Clear |
|-------|------|--------|--------------|--------------|---------------|--------------|
| 1 | 12 | 1 | 0.4 | 30% | 1.2 | 66% |
| 5 | 22 | 4 | 1.2 | 8% | 2.4 | 26% |
| 10 | 35 | 11 | 2.7 | 3% | 4.4 | 6% |
| 13 | 42 | 17 | 4.0 | 0% | 6.1 | 1% |
| 15 | 47 | 21 | 5.5 | 2% | 8.0 | 2% |
| 17 | 52 | 26 | 7.2 | 0% | 10.4 | 2% |
| 20 | 60 | 35 | 10.3 | 0% | 13.6 | 0% |

**Key improvement**: Greedy bot clear rate now monotonically decreases (66% → 0%) instead of the v10 pattern where it stayed flat (25-32%) or increased. Random bot at R20 catches 10/60 instead of 48/60.

**Note**: These simulations don't model gravity/volatile dot types or mercy bonus, so actual gameplay will be somewhat more forgiving than these numbers suggest.
