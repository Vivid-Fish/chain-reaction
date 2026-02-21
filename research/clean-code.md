# Clean Code for Agent-Maintained Codebases

Research compiled from 40+ sources including Thoughtworks Radar, Anthropic engineering, CodeScene, Addy Osmani, Martin Fowler's team, and community CLAUDE.md/AGENTS.md conventions.

## Executive Summary

Uncle Bob's Clean Code principles remain the foundation, but key adjustments matter when agents are primary readers/writers. The surprising finding: the best "agent-optimized" code is essentially the best human code, with a few amplifications.

## Core Principles (Still Apply)

- Meaningful, expressive names (agents rely heavily on names for semantic understanding)
- Single Responsibility Principle (agents work best on isolated, focused modules)
- Small functions (10-40 lines; agents reason about 20-line functions more reliably than 200-line ones)
- No magic numbers (named constants give agents semantic handles)
- DRY at the knowledge level (one authoritative place for business logic)

## What Changes for Agents

### Comments Become More Valuable
Uncle Bob's "comments are deodorant" stance softens. Section headers and intent-documenting comments help agents navigate large files and understand *why*. The agent cannot ask a colleague "what does this section do?"

### File Size Guidance Shifts
Uncle Bob favored many tiny files. For agents, the ideal is moderate files (200-600 lines) that are self-contained enough to fit in context. Splitting engine.js into physics.js + rendering.js + particles.js would force loading 4 files to understand one detonation cascade.

### Abstraction Tax Increases
Deep inheritance hierarchies and heavy indirection cost agents more than humans. Agents pay the full cost of resolving every abstraction every session — no institutional memory.

### Functional Style Has Clear Edge
- Pure functions easier to reason about
- Explicit data flow (dependencies visible in signatures)
- Composability over inheritance
- Agents struggle with implicit state, shared mutables, `this`-binding

## Comparison Table

| Dimension | Uncle Bob Classic | Agent-Optimized | Recommended |
|-----------|-----------------|-----------------|-------------|
| Function length | 5-15 lines | 10-40 lines | 10-40; longer OK for sequential pipelines with section comments |
| File count | Many small files | Fewer self-contained files | Feature-scoped, 200-600 lines each |
| Comments | Minimal | Liberal section headers + intent | Section headers always; intent on non-obvious logic |
| DRY | Always extract | DRY for knowledge; tolerate code duplication | DRY for business rules; avoid premature abstraction |
| Abstractions | Deep hierarchies OK | Shallow, explicit, minimal indirection | Max 2 levels of indirection |
| Types | Language-dependent | Always | JSDoc for vanilla JS; TypeScript if build tools acceptable |
| State | Encapsulated in objects | Explicit state containers | Consolidated state objects with documented shapes |

## Concrete Recommendations for Chain Reaction

### Already Working Well
- Section headers (`// =================== SECTION ===================`)
- Named constants at top of engine.js
- Flat functional style (no class hierarchies)
- Shared engine loaded by both game and replay
- `'use strict'`

### Recommended Changes

**1. JSDoc type annotations on key data structures (High Impact, Low Effort)**
```javascript
/** @typedef {{ x: number, y: number, vx: number, vy: number, radius: number, hue: number, type: string, active: boolean }} DotState */
```

**2. Consolidate scattered state into explicit objects (High Impact, Medium Effort)**
Instead of 15+ separate `let` declarations, group into `gameState = { round, score, ... }`.

**3. Architecture comment at top of each file**
Table of contents with line ranges for agent navigation.

**4. Intent comments on non-obvious algorithms**
Where clever physics exists (cascade stagger timing, gravity wells), explain *why*.

### What NOT to Do
- Do not split into 15 tiny files (game is a physics simulation, needs holistic reasoning)
- Do not add a build system (zero-config deployment is a feature)
- Do not over-abstract ("maximum complexity, minimum abstraction" aligns with agent-friendliness)
- Do not remove section headers (most valuable navigation aid)
- Do not adopt ES modules (requires dev server or build tooling)
- Do not adopt TypeScript (build step not worth it for ~4000 line vanilla JS game)

## Token Efficiency

From arxiv research: formatting tokens consume ~24.5% of tokens across languages. But Claude shows <1.6% performance variation when formatting removed. **Don't sacrifice readability for token savings.**

## CLAUDE.md Best Practices

From Builder.io, HumanLayer, Anthropic:
- Keep under 300 lines total
- Focus on WHAT/WHY/HOW, not style rules that linters handle
- Include concrete file paths and testing commands
- Reference example files in codebase
- Clear permission boundaries

## Sources
- [Thoughtworks: AI-friendly code design](https://www.thoughtworks.com/radar/techniques/ai-friendly-code-design)
- [Martin Fowler: Context Engineering for Coding Agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Addy Osmani: My LLM Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/)
- [CodeScene: Agentic AI Best Practice Patterns](https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality)
- [Builder.io: AGENTS.md](https://www.builder.io/blog/agents-md)
- [Atlassian: Code Readability in the Age of LLMs](https://www.atlassian.com/blog/artificial-intelligence/atlassian-research-developers-on-code-readibility-llm)
- [Making Context Explicit: Why AI Agents Force Better Architecture](https://medium.com/@gthea/making-context-explicit-e2a172e0c80f)
- [The Hidden Cost of Readability (arxiv)](https://arxiv.org/html/2508.13666v1)
