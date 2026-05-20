# Sprint plans — by scenario

Specialist plans for how each of the six **Architect — Foundations** exam scenarios evolves across v0.2, v0.3, and v0.4 of Claude Code Companion. One file per scenario; each is self-contained.

## Index

| # | Scenario | Main sprint | Plan | Deepening |
|---|---|---|---|---|
| 1 | Customer Support Resolution Agent | **v0.3** | [plan](./scenario-1-support-resolution.md) | [deepening](./scenario-1-support-resolution.deepening.md) |
| 2 | Code Generation with Claude Code | v0.2–v0.4 (frame for everything) | [plan](./scenario-2-claude-code-workflow.md) | [deepening](./scenario-2-claude-code-workflow.deepening.md) |
| 3 | Multi-Agent Research System | **v0.3** (local-model degradation) | [plan](./scenario-3-multi-agent-research.md) | [deepening](./scenario-3-multi-agent-research.deepening.md) |
| 4 | Developer Productivity with Claude | **v0.2** (codebase researcher) | [plan](./scenario-4-developer-productivity.md) | [deepening](./scenario-4-developer-productivity.deepening.md) |
| 5 | Claude Code for Continuous Integration | **v0.4** | [plan](./scenario-5-claude-code-in-ci.md) | [deepening](./scenario-5-claude-code-in-ci.deepening.md) |
| 6 | Structured Data Extraction | **v0.2** (content pipeline) | [plan](./scenario-6-structured-extraction.md) | [deepening](./scenario-6-structured-extraction.deepening.md) |

**Cross-scenario synthesis:** [`SYNTHESIS.md`](./SYNTHESIS.md) — findings that appeared in two or more deepening passes, promoted to shared-primitive tasks (v0.2 "shared primitives" PR before any scenario-specific work).

## Cross-scenario dependencies (top of mind)

```
v0.2:
  Scenario 4 (codebaseResearcher real impl)  ←  blocks  ←  Scenario 3 v0.4 (live /under-the-hood demos)
  Scenario 6 (content pipeline)              ←  shares schema utilities with  →  Scenarios 4 (citation), 5 (review)
  Scenario 2 (slash commands)                ←  drives  →  Scenarios 4 (/explain-this), 5 (/review-component), 6 (/extract-content)

v0.3:
  Scenarios 1 + 3 + 4 all gain capabilities-aware fallback paths.
  Scenario 6 demonstrates schemaMode honesty (probe adapters that lie).
  Scenario 5 ships hooks-as-safety-gates that depend on Scenario 2's .claude/settings.json plumbing.

v0.4:
  /under-the-hood becomes runnable — every scenario card demos live behaviour.
  Scenario 5 ships the GitHub Action; Scenario 6 ships versioned schemas + migration; Scenario 2 ships output-style + status-line.
```

## Shared primitives (don't fork them)

These are owned at the agent layer and consumed by multiple scenarios. Any change here must be planned with the scenarios that depend on it:

- `src/agents/scratchpad.ts` — used by Scenarios 1 (helpBot) and 3 (tutor)
- `src/agents/escalation.ts` — used by Scenario 1, pattern referenced by Scenario 3
- `src/agents/contextPruner.ts` — used by both coordinators
- `src/agents/tools/types.ts` — `ToolResponse<T>`. Used by Scenarios 1, 4, and (in v0.2+) 6
- `src/sdk/types.ts` — `AdapterCapabilities`. Read by Scenarios 1, 3, 4, 6
- `src/agents/schemas/` — (introduced in v0.2) shared JSON schemas. Used by 3, 4, 5, 6

## Sprint planning notes

These plans assume the **mock SDK is the default** through v0.4 (per PROJECT_PLAN.md). Real-SDK and local-model adapters arrive in v0.3 and v0.4 respectively. Acceptance criteria for v0.3 tasks that require local models are written against the synthetic `MockUnreliableAdapter` fixture so the work isn't blocked on WebLLM bundle availability.

## How these plans were produced

Sprint plans were originally fanned out to six parallel `general-purpose` subagents — one per scenario. The first four hit consecutive **HTTP 529 Overloaded** responses on subagent allocation (the API was capacity-throttled at the time). The remaining two were not dispatched. The plans were then written in the main session sequentially. The specialisation (one focused plan per scenario) is preserved; the parallelism is not. Re-running this fan-out when the API is healthy would produce slightly different plans for the same scope.
