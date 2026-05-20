# Cross-scenario synthesis

> Findings that appeared in **two or more** of the six deepening passes. Each becomes a *shared-primitive* task that doesn't belong to any one scenario but blocks several. Landing them once is much cheaper than letting each scenario reinvent.
>
> Read alongside the six `scenario-N-*.deepening.md` files. This file is the cross-cut.

## Shared primitives — v0.2 (land first, unblock everything)

### S-1. Widen `ToolResponse` / `ErrorCategory` (Scenarios 1, 4, 6)

The current `ErrorCategory = 'transient' | 'business'` is too narrow vs the exam guide. Widen to four values plus an `isRetryable` flag:

```ts
export type ErrorCategory =
  | 'transient'    // network blip, rate limit — retry safe
  | 'validation'   // input shape wrong / regex too broad — caller can adjust
  | 'business'     // semantic miss (not found, ambiguous source) — caller changes strategy
  | 'permission';  // tool denied — surface to user

export type ToolResponse<T> =
  | { isError: false; data: T }
  | { isError: true; errorCategory: ErrorCategory; isRetryable: boolean; message: string };
```

**Owner:** none — coordinated change. Lands in *one* PR touching `src/agents/tools/types.ts`, all `helpBot/tools/*`, all forthcoming `tutor/tools/*`, plus `scripts/extract/validate.ts`.
**Acceptance:** every tool returns the new shape; `getLesson` multi-match becomes `validation`, `grepSource` too-broad-regex becomes `validation`, extraction `partial`/`ambiguous` becomes `business`. Typecheck clean.

### S-2. `ToolSpec` exports (Scenarios 1, 4)

Every tool should export a sibling `Spec` with `name`, `description`, `input_schema` so v0.3's model-driven dispatch (`adapter.capabilities.nativeToolUse === true` path) can hand the roster to Claude as native tool definitions. Currently missing across every tool file.

```ts
export const getLessonSpec = {
  name: 'getLesson',
  description: 'Look up a single lesson by id OR by free-text title query…',
  input_schema: { /* JSON Schema for GetLessonInput */ },
} as const;
```

**Owner:** Scenarios 1 + 4 co-author the registry pattern. **Lands in:** `src/agents/tools/registry.ts` (new — aggregates all `*Spec` exports).
**Acceptance:** the registry compiles; the SDK adapter's tool-roster path consumes it (stub in v0.2, wired in v0.3).

### S-3. `dispatchAllSettled` helper — fix the `Promise.all` anti-pattern (Scenario 3, blocks others)

`tutor/coordinator.ts:81` currently does `Promise.all(intent.subagents.map(...))`. Per **Task Statement 5.3**, this is the canonical anti-pattern: a single failing spoke rejects the whole turn. Replace with a shared helper:

```ts
// src/agents/tutor/dispatch.ts (new)
export async function dispatchAllSettled<T>(
  invocations: Array<() => Promise<T>>,
): Promise<{ results: T[]; errors: Array<{ index: number; error: unknown }> }>;
```

Coordinator merges successes and surfaces errors as escalation signal. **Acceptance:** a synthetic spoke that throws no longer breaks the turn; the user sees the partial reply + a "[N spoke(s) failed]" footer.

### S-4. `tool_choice` field on `CreateMessageOptions` (Scenarios 1, 4, 6)

Per **Task Statement 2.3 + 4.3**, the API path is `tool_use` + a deliberate `tool_choice`:

```ts
toolChoice?: 'auto' | 'any' | { type: 'tool'; name: string };
```

Add to `CreateMessageOptions`. Mock adapter ignores; real adapter passes through; WebLLM / Ollama best-effort. **Acceptance:** Scenario 6's extraction pipeline can force a specific tool (`extract_metadata` before enrichment); Scenario 1's helpBot can request `any` to guarantee structured output.

### S-5. Provenance fields on extracted records (Scenario 6, parallels Scenario 4)

Every record in `src/data/_generated/*` carries:

```ts
_provenance: { sourcePath: string; sourceHash: string; lineStart: number; lineEnd: number; extractedAt: string; schemaVersion: number };
```

Scenario 4's citation shape is the same idea at snippet granularity; make them a **discriminated union** in `src/agents/schemas/source.ts`:

```ts
export type SourceRef =
  | { kind: 'citation'; path: string; line: number; preview: string }
  | { kind: 'provenance'; sourcePath: string; sourceHash: string; lineStart: number; lineEnd: number };
```

**Owner:** co-authored. **Acceptance:** Scenario 4's `cite` tool calls and Scenario 6's `_generated/*` output both type-check against `SourceRef`.

## Shared primitives — v0.3 (after the adapter capabilities work lands)

### S-6. `src/agents/schemas/parse.ts` — JSON-in-prose parser (Scenarios 1, 3, 4, 6)

Single helper file consumed by every coordinator that has a non-`schemaMode` fallback path:

```ts
export function extractFirstJsonObject(text: string): unknown | null;
export function extractToolRequest(text: string): { name: string; input: Record<string, unknown> } | null;
export async function retryWithFeedback<T>(call: (feedback?: string) => Promise<string>, validate: (s: string) => T | Error, maxRetries?: number): Promise<T | Error>;
```

`retryWithFeedback` covers **Task Statement 4.4** ("validation, retry, feedback loops") which the current Scenario 6 plan implements only as fail-exit. **Acceptance:** all four scenarios' fallback paths import from this one file; one Vitest spec covers the helpers.

### S-7. "Limited mode" badge (Scenarios 1, 3, 4, 6)

When `getAdapter().capabilities.nativeToolUse === false` OR `.parallelSubagents === false` OR `.schemaMode === false`, every coordinator should surface a "limited" affordance. Currently each scenario plans its own badge. Factor to one component:

```vue
<!-- src/components/CapabilitiesBadge.vue -->
<CapabilitiesBadge :hide="adapter.capabilities.nativeToolUse && adapter.capabilities.parallelSubagents && adapter.capabilities.schemaMode" :reasons="…" />
```

**Owner:** none — shared UI. **Acceptance:** mounted once in `AppShell.vue`; switching to a `MockUnreliableAdapter` makes it visible everywhere.

### S-8. `.claude/settings.json` owned once (Scenarios 2, 5)

Scenario 2's v0.3 task 5 spec's the hooks; Scenario 5's v0.3 task 4 currently restates them. **Resolution:** Scenario 2 owns the file. Scenario 5 imports + adds CI-specific hooks via `settings.local.json` overlay rather than forking. Avoids duplicated allow/deny lists drifting.

## Shared primitives — v0.4

### S-9. Independent second-pass review (Scenario 5, pattern from TS 4.6)

Scenario 5's v0.4 work currently has one Claude pass. **Task Statement 4.6** mandates a second independent instance. Adds modest cost (~2x review tokens), large precision win on planted-bug fixtures. This is *not* shared with other scenarios but is the most architect-significant gap surfaced.

### S-10. Message Batches API for bulk extraction (Scenario 6, TS 4.5)

Add a `--batch` flag to `scripts/extract/extract.ts` that uses the Anthropic Message Batches API for bulk content (latency-tolerant; 50 % cheaper). Each request carries a `custom_id` matching the source path so we can correlate results.

## What this means for v0.2

The original v0.2 plan was already busy (Scenario 4's full codebase researcher, Scenario 6's content pipeline). Adding S-1 / S-2 / S-3 / S-4 / S-5 makes v0.2 the **"shared primitives" sprint** as well. Concretely:

| Task | Files touched | Owner |
|---|---|---|
| S-1 widen `ToolResponse` | `agents/tools/types.ts`, all tool files | joint |
| S-2 `ToolSpec` registry | `agents/tools/registry.ts` + every tool | joint |
| S-3 `dispatchAllSettled` | `agents/tutor/dispatch.ts`, `tutor/coordinator.ts` | Scenario 3 |
| S-4 `toolChoice` | `sdk/types.ts`, both adapters | Scenario 6 |
| S-5 `SourceRef` discriminated union | `agents/schemas/source.ts` | joint (4 + 6) |

A v0.2 typecheck-clean PR labelled "shared primitives" lands these together before any of the scenario-specific v0.2 work.

## Re-prioritisation summary (from individual deepenings)

- **Scenario 2** — pull CLAUDE.md hygiene check forward from v0.4 → v0.3 (lands with per-scenario CLAUDE.md). Push local-model conventions v0.3 → v0.4.
- **Scenario 4** — bundle-size check moves to day 1 of v0.2. v0.4 task 11 (lesson cross-links) moves below the v0.3 context-isolation work.
- **Scenario 5** — `CI_REVIEW_PROMPT.md` severity-bucket examples + verbatim do-not-approve gates promoted into v0.2 (was v0.4).
- **Scenario 6** — `realAdapter.ts` honest `tool_use` path **promoted to v0.2** (currently ignores `jsonSchema` — TS 4.3 violation). Provenance fields promoted to v0.2 (retrofitting is costly).

## Method note

Six general-purpose subagents reviewed the existing scenario plans against the exam-guide Task Statements relevant to each scenario's primary domains, scanned adjacent scenario plans, and read the parent project for liftable patterns. Each wrote an addendum at `scenario-N-*.deepening.md`. The cross-cutting items above are the findings that appeared in two or more reports independently — the strongest signal we have for shared-primitive work. Where only one report raised a concern, it's filed in that scenario's deepening file, not promoted here.

Per-scenario reports also contain re-prioritisation calls and new tasks that don't appear above because they don't cross scenarios. Read both this file and the six addenda before planning v0.2.
