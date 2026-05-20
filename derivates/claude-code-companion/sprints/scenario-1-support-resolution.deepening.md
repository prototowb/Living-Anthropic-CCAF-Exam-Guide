# Scenario 1 — Deepening pass

> Addendum to scenario-1-support-resolution.md. Reviewed against Task Statements 2.1, 2.2, 2.3, 5.2, 5.3, 5.5.

## Architect mandates we are honouring

- **TS 2.2 — `errorCategory` discrimination.** `src/agents/tools/types.ts` splits `transient` vs `business`; `getLesson` returns `business` on miss; the coordinator counts `consecutiveBusinessErrors` distinctly from transients. Uniform "Operation failed" is avoided.
- **TS 5.2 — Explicit escalation criteria with few-shot.** `escalation.ts` ships hard-coded predicates (`user_request`, `repeated_business_errors`, `low_confidence`) plus `ESCALATION_FEWSHOT` with four exemplars including the "single transient → don't escalate" case. Honors the mandate that confidence be coordinator-computed, not self-reported (see `coordinator.ts:85` — confidence derived from which tools fired).
- **TS 5.2 — Explicit user request honoured first.** `userAskedHuman` regex check short-circuits before any tool invocation (`coordinator.ts:47`). Matches the "honour explicit human requests immediately" skill.
- **TS 2.3 (partial) — Scoped tool set.** Help Bot's roster is two tools (`toolNames` in `coordinator.ts:43`), well inside the 4–5 ceiling the architect calls out.

## Architect mandates we are NOT yet honouring (gaps)

- **TS 2.1 — Tool *descriptions* as the LLM's selection mechanism.** Our tools have no `description`, no `input_schema`, no `*Spec` export. They are TS functions, not MCP-shaped specs. Today's coordinator regex-routes; v0.3 task 6 promises model dispatch, but without specs the model has nothing to read. **New task (v0.2):** export `getLessonSpec`, `checkProgressSpec` next to each tool (see parent project's `searchPatterns.ts` for the shape) and a `toolSpecs` array from `tools/index.ts`. Target: v0.2.
- **TS 2.2 — Four categories, not two.** Exam guide explicitly enumerates `transient | validation | business | permission`, and an `isRetryable: boolean` flag. We collapse validation into business and have no permission concept. **New task (v0.3):** widen `ErrorCategory` to the full four and add `isRetryable` + `attempted` fields (see Efficiency wins below — this is shared with Scenarios 4 + 6).
- **TS 2.3 — `tool_choice` configuration is absent.** The plan never mentions `tool_choice: "auto" | "any" | { type: "tool", name }`. v0.3 task 6's "capabilities-aware dispatch" should expose this. **New task (v0.3):** thread a `toolChoice` parameter through `getAdapter().createMessage` and use it to force `checkProgress` first on progress-shaped prompts.
- **TS 5.2 — Multiple-match clarification, not business error.** Today `getLesson` with an ambiguous query returns a `business` error (`getLesson.ts:31-36`). Exam guide skill explicitly requires asking the user for additional identifiers in this case. **New task (v0.2):** add an `ambiguous` discriminator (or a third `ToolResponse` shape `{ isError: false; clarify: { candidates: ... } }`) so the coordinator can render a chip list instead of a dead-end error.
- **TS 5.3 — Structured error context for coordinator recovery.** Our `fail()` carries only `category` + `message`. Mandate names `attempted`, `partialResults`, `alternatives`. **New task (v0.3):** widen the error branch — see Efficiency wins.
- **TS 5.5 — Confidence calibration against labelled data.** v0.4 task 9 measures FCR but never *calibrates the confidence threshold* against the fixture set. The 0.4 cut-off in `shouldEscalate` is arbitrary. **New task (v0.4):** add a calibration step to `eval:helpBot` that sweeps thresholds and reports the operating point.
- **TS 5.5 — Stratified sampling of high-confidence escalations.** Not addressed anywhere. **New task (v0.4):** stratify the 30-prompt fixture set by intent (`nav | progress | lesson | escalation`) and report per-stratum FCR, not just aggregate.

## Liftable patterns from the parent project

Worth lifting:

- **`*Spec` export pattern** (`searchPatterns.ts:45-57`, `gradeAnswer.ts:39-52`). Every tool exports both the function and a sibling `*Spec` with `name`, `description`, `input_schema`. `index.ts` aggregates them into a `toolSpecs` array. This is the missing piece for TS 2.1 and for v0.3 task 6's model dispatch.
- **`name` style** — parent uses `snake_case` MCP-canonical names (`search_patterns`, `lookup_domain`) while exporting `camelCase` TS functions. Our v0.1 lacks the rename layer; if we ever publish over a real MCP transport we'll regret it. Adopt the dual-name convention.
- **Async signatures** — parent tools are `async` even when the body is sync. Cheap future-proofing; our `checkProgress` is sync and would need a signature change later. Switch on first touch.

Not worth lifting:

- Parent's `lookupQuestion` and `gradeAnswer` are quiz-domain and don't map onto Help Bot's navigation purpose; don't copy their bodies.
- Parent's `summarizeProgress` takes an `answers` map as input; our `checkProgress` reads localStorage directly. Parent's shape is purer (no I/O in the tool) but ours is honest about being in-browser. Leave it alone.

## Efficiency wins (shared with other scenarios)

- **Widened `ToolResponse` is a Scenarios-1+4+6 joint move.** Scenarios 4 (`readSourceFile`, `grepSource`, `globPaths`) and 6 (extraction errors) both reuse this shape. Adding `validation` and `permission` categories, `isRetryable`, and a `context: { attempted; partial; alternatives }` field must land in *one* PR in `src/agents/tools/types.ts` with all three scenarios' tools updated together. Scenario 6's plan already calls out reusing `ErrorCategory`; confirm it; flag that the widening is not free.
- **Scratchpad / escalation / contextPruner sharing is correctly called out** in the existing plan (Cross-cutting note, line 49). Confirmed. No change.
- **Clarification-response shape** (this scenario's TS 5.2 gap) is the same shape Scenario 6 needs for ambiguous extractions. Coordinate: define the `{ clarify: { question; candidates } }` discriminator once in `src/agents/tools/types.ts`, not per scenario.
- **Tool-spec registry** (this scenario's TS 2.1 gap) is also Scenario 4's need (v0.3 task 6 "model dispatches three researcher tools"). Define the `ToolSpec` type and the `toolSpecs` aggregation pattern once; both scenarios consume it.
- **`tool_choice` parameter** belongs on the adapter (`src/sdk/types.ts`'s `CreateMessageOptions`). Single landing point; Scenario 3 also benefits (force `intent_classification` first on Tutor turns).

## Re-prioritised tasks

- **Task 6 (capabilities-aware tool dispatch) cannot land in v0.3 without specs.** Move the prerequisite spec exports earlier — into v0.2 — so v0.3 task 6 has something to hand the model. The original task 6 itself stays in v0.3 but is now unblocked.
- **Task 7 (structured-error UI states) should move from v0.3 to v0.2.** It's a small UI change and the underlying `errorCategory` already exists. Decoupling it from task 6 makes v0.2 visibly richer and surfaces the gap that motivates the `validation` + `permission` widening in v0.3.
- No other re-ordering recommended.

## New tasks to add

1. **Export `*Spec` for every Help Bot tool.** Sprint: **v0.2**. Files: `src/agents/helpBot/tools/getLesson.ts`, `.../checkProgress.ts`, `.../index.ts` (add `toolSpecs`). Acceptance: `toolSpecs` typechecks; each spec has a description ≥ 60 chars differentiating it from the other; coordinator imports `toolSpecs` and the regex router survives unchanged.

2. **Introduce an `ambiguous` / `clarify` response branch.** Sprint: **v0.2**. Files: `src/agents/tools/types.ts` (new branch), `src/agents/helpBot/tools/getLesson.ts` (return clarify on multi-match), `src/components/HelpBotSidebar.vue` (render candidate chips). Acceptance: "lesson about agents" yields a chip list of matching lesson ids, not a dead-end error.

3. **Widen `ErrorCategory` to four categories + `isRetryable` + `context`.** Sprint: **v0.3** (joint with Scenarios 4 + 6). Files: `src/agents/tools/types.ts`, every tool in `src/agents/**/tools/*`. Acceptance: every existing `fail(...)` call site compiles after migration; coordinator switch covers all four cases; a `permission`-category fixture exists (e.g., simulated locked stage).

4. **`tool_choice` plumbing through the adapter.** Sprint: **v0.3** (joint with Scenario 3). Files: `src/sdk/types.ts` (`CreateMessageOptions.toolChoice`), `src/agents/helpBot/toolDispatcher.ts` (forced selection on progress prompts). Acceptance: a debug toggle in `/under-the-hood` flips between `"auto"` and `{ type: "tool", name: "check_progress" }` and the tool roster reflects the choice.

5. **Stratified FCR + threshold calibration.** Sprint: **v0.4** (extends existing task 9). Files: `src/data/_fixtures/helpBotEval.ts` (tag each prompt by `intent`), `scripts/eval/helpBot.ts` (per-stratum report + threshold sweep). Acceptance: report prints per-intent FCR and recommends the confidence cut-off that maximises FCR without raising over-escalation past 10 %.

6. **MCP-name dual export.** Sprint: **v0.2** (rolled into new task 1). Each spec uses `snake_case` (`get_lesson`, `check_progress`) while the TS export stays `camelCase`. Acceptance: spec names match the parent project's convention; a single registry maps spec name → function reference.
