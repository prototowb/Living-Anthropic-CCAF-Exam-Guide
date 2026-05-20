# Claude Code Companion — root rules

> This file is part of the **Scenario 2 — Code Generation with Claude Code** demonstration.
> Root rules apply repo-wide. Subdirectory `CLAUDE.md` files extend them.

## What this project is

A Vue 3 + TypeScript + Vite single-page app that teaches **Claude Code** to beginner users. The codebase is also a reference implementation of all six **Architect — Foundations** exam scenarios — see [`/under-the-hood`](./src/views/UnderTheHoodView.vue) at runtime, or the project plan at [`../derivates/claude-code-companion/PROJECT_PLAN.md`](./PROJECT_PLAN.md).

## Repo-wide conventions

1. **Mock SDK is the default.** No view, store, or agent module assumes a network or an API key. The composition root lives at `src/sdk/index.ts`.
2. **Stores own mutable state.** Views read from stores via `useFooStore()`. Views never mutate `data/` modules.
3. **Tools never throw.** Functions in any `tools/` directory return `ToolResponse<T>` (`src/agents/tools/types.ts`). Calling code branches on `isError`.
4. **Persistence is versioned.** Use `load`/`save` from `src/stores/persist.ts`. Bump the `:v1` suffix on shape changes.
5. **No new top-level CSS files.** All styles flow through `src/styles/main.scss` (Tailwind utilities + a few sandbox utility classes).
6. **Beginner voice on the surface.** Stage bodies, lesson content, sandbox notes never reference the architect exam, the six scenarios, or the word "mandate". That vocabulary belongs only to `/under-the-hood`.
7. **Capabilities-aware code paths.** When dispatching to subagents or constraining outputs by schema, branch on `adapter.capabilities.*` — do not feature-detect per call.

## Plan mode vs direct execution

- **Plan mode** for: adding a new view, a new agent, a new lesson format, a new sandbox, or any change touching more than two files.
- **Direct execution** for: a typo fix, a single-file copy edit, a single-property style change.
- **Explore subagent → then plan mode** for: verbose discovery before a plan — when the change can't be scoped until you map an existing pattern across the repo. Keeps the main turn's context lean (TS 3.4).

When in doubt, prefer plan mode.

### Decision table — concrete examples from this repo

| Change | Why | Mode |
|---|---|---|
| Fix a typo in a stage body (`src/data/stages.ts`, one line) | Single-file copy edit. No type implications. | Direct |
| Replace `Promise.all` with `dispatchAllSettled` (`src/agents/tutor/coordinator.ts` + new `src/agents/tutor/dispatch.ts`) | Cross-file, new exported shape, capability-gated branching. See `docs/LIVING_WORKFLOW.md`. | Plan |
| Widen `ErrorCategory` from 2 to 4 values across every tool (`src/agents/tools/types.ts` + all `*/tools/*.ts`) | Touches every tool. Breaking type change. SYNTHESIS.md S-1. | Plan |
| Add an `argument-hint` key to `.claude/skills/stage-author/SKILL.md` frontmatter | Single-file YAML edit. No behavioural change. | Direct |
| Map every `ToolResponse<T>` consumer before refactoring the type | Discovery first, then the plan emerges from the call-site shape. | Explore subagent → Plan |
| Bump the persistence `:v1` suffix to `:v2` on a shape change (`src/stores/persist.ts` + every consumer) | Cross-store ripple; needs migration story. | Plan |
| Adjust the `grepSource` cardinality guard constant from 5× to 7× (`src/agents/tutor/tools/grepSource.ts`) | One-token change, but benchmark mandated (CLAUDE.md `src/agents/tutor/tools/` rule 3). | Plan (the benchmark is the planning) |
| Add a `<CapabilitiesBadge>` mount to `src/components/AppShell.vue` | New child component; one mount line; shape already defined by SYNTHESIS.md S-7. | Direct |

## What NOT to do

- Don't import `@anthropic-ai/sdk` outside `src/sdk/`.
- Don't write content (quiz items, lessons) for stages S3-S8 until v0.2 — they are stubs by design.
- Don't add a markdown library until `MarkdownBlock.vue` can no longer carry the load.
- Don't promote `/under-the-hood` into primary navigation. The footer link is the canonical access path.
