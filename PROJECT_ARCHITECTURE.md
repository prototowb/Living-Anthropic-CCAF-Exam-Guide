# Project Architecture — Architect Interactive Playbook

> Authoritative architecture reference. Extracted from `PROJECT_SPECIFICATIONS.md` and kept in step with the codebase. Supersedes the generic `ARCHITECTURE.md` produced by `pg init`.
>
> **Last refreshed:** v0.4.0 (2026-05-20). When you change architecture, update this file.

---

## 1. High-Level Shape (v0.4.0)

```
+----------------------------------------------------------------------------+
|  Browser (Vue 3 SPA, served by Vite)                                       |
|                                                                            |
|  Views                                                                     |
|   ├── Home                                                                 |
|   ├── Quiz Runner            (59 Qs across 4 sections)                     |
|   ├── Mock Exam              (start / run / result / review)               |
|   ├── Domain Study Pages     (5 domains)                                   |
|   ├── Concept Atlas          (/atlas — SVG flow map)                       |
|   ├── Flow Walkthrough       (/atlas/:flowId — step-by-step tour)          |
|   ├── Claude Tutor           (hub-and-spoke chat, mock SDK)                |
|   ├── Pattern Showcase       (32 patterns, anti-pattern foils, sandboxes)  |
|   └── Micro-Lessons          (reorder / blanks / mcq / flow-builder)       |
|                                                                            |
|  State (Pinia)                                                             |
|   ├── quizStore       — section answers (correct + picked), persisted      |
|   ├── mockExamStore   — active session + history, timer, autosubmit        |
|   ├── tutorStore      — thread, subagent log, scratchpad mirror            |
|   └── lessonStore     — per-lesson progress (attempts, completed)          |
|                                                                            |
|  Agent Layer (src/agents/)                                                 |
|   ├── coordinator.ts   — Hub. allowedTools = [Task, Read, Grep] (asserted) |
|   ├── subagents/       — Spokes (explainer / quizmaster / code-reviewer)   |
|   ├── tools/           — 5 granular tools, all return ToolResponse<T>      |
|   ├── schemas/         — JSON schemas for SDK responses                    |
|   ├── prompts/fewShot  — 4 worked examples for intent routing              |
|   ├── scratchpad.ts    — Append-only key-findings log                      |
|   ├── escalation.ts    — Hard predicates (user request / errors / conf)    |
|   ├── contextPruner.ts — Drop verbose fields before context insertion      |
|   ├── modes.ts         — Plan-vs-Direct predicate                          |
|   ├── batches.ts       — Message Batches API illustration                  |
|   ├── hooks.ts          (illustrative — referenced from D1 patterns)       |
|   ├── prerequisites.ts  (illustrative — referenced from D1 patterns)       |
|   └── decomposition.ts  (illustrative — referenced from D1 patterns)       |
|                                                                            |
|  SDK Adapter                                                               |
|   └── sdk/{index,mockAdapter,realAdapter,types}.ts — mock (default)        |
|                                                  OR real @anthropic-ai/sdk |
|                                                                            |
|  Data Layer (src/data/)                                                    |
|   ├── quizData.ts                  — 4 sections × 59 questions             |
|   ├── domains.ts → domain-content/ — 32 patterns split per-domain          |
|   ├── flows.ts                     — 6 named flows                         |
|   ├── flowHelpers.ts               — flows ↔ patterns derived index        |
|   ├── lessons.ts                   — 23 micro-lessons (4 formats)          |
|   └── reverseLinks.ts              — question → patterns derived index     |
+----------------------------------------------------------------------------+
```

## 2. Module Boundaries

| Directory | Owns | Forbidden |
|---|---|---|
| `src/data/` | Typed, immutable content + derived indexes. No side effects. | Mutation; UI imports |
| `src/agents/` | Coordinator, spokes, granular tools, prompts, schemas, hooks, scratchpad, escalation, pruning. Only place that talks to the SDK. | Imports from `src/views` or `src/stores` |
| `src/sdk/` | Adapter pattern. `mockAdapter` is default; `createRealAdapter(apiKey)` wraps `@anthropic-ai/sdk`. | Direct SDK use anywhere else |
| `src/stores/` | Pinia stores. The only owner of mutable runtime state + `localStorage` persistence. | Calling the SDK directly |
| `src/views/` | Route-level pages. Compose components + stores. | Imports from sibling views |
| `src/components/` | Presentational components (BEM-classed). Sandbox components live in `src/components/sandboxes/`; lesson runners in `src/components/lessons/`. | Direct SDK use |
| `src/router/` | Route table. | Imports outside vue-router |
| `src/styles/` | SCSS tokens + BEM component sheets, one partial per block. | Inline styles in components |

## 3. Hub-and-Spoke (Domain 1)

```
                        ┌─────────────┐
   user message ───────▶│ Coordinator │──┐ Task(spawn) ──▶ Explainer
                        │  (hub)      │──┼ Task(spawn) ──▶ Quizmaster
                        │             │──┴ Task(spawn) ──▶ Code-reviewer
                        └─────────────┘                  (Promise.all)
                              │
                              ▼
                       merge + prune
                              │
                              ▼
                       scratchpad + escalation check
                              │
                              ▼
                       assistant reply
```

**Mandates enforced:**
- `ALLOWED_TOOLS = ['Task', 'Read', 'Grep']` in `src/agents/coordinator.ts`. The module asserts `Task` is present at load time — if it's missing, the import throws and the app refuses to boot.
- Independent spokes are dispatched with `Promise.all`. Per-spoke `durationMs` and the `parallel: boolean` flag are returned in `CoordinatorTurn` and visualized in the `HubAndSpokeTimeline` sandbox.

## 4. Granular Tools & Structured Errors (Domain 2)

Every file in `src/agents/tools/` exports one function with one job. The 5 tools wired in v0.1.0:

- `lookupQuestion.ts` — fetch a quiz question by section + id
- `lookupDomain.ts` — fetch a domain study page
- `searchPatterns.ts` — full-text search across pattern docs
- `gradeAnswer.ts` — compare a user answer against expected
- `summarizeProgress.ts` — fold the quiz store into a one-paragraph summary

All tool results conform to:

```ts
type ToolResponse<T> =
  | { isError: false; data: T }
  | { isError: true;
      errorCategory: 'transient' | 'validation' | 'business' | 'permission';
      isRetryable: boolean;
      message: string; };
```

The `StructuredErrorSandbox` (mounted on `/patterns/structured-errors`) lets you call any of these tools live and inspect the response shape.

## 5. Configuration & Workflows (Domain 3)

- Root `CLAUDE.md` — repo-wide standards. **Auto-generated by Proto Gear** (do not hand-edit between the `<!-- begin -->` / `<!-- end -->` markers).
- `src/agents/CLAUDE.md` — agent-layer rules (always include `Task`, views never call the SDK directly).
- `.claude/rules/tests.md` — path-scoped (`**/*.test.ts`) rules.
- `src/agents/modes.ts` — `chooseMode({ files, ambiguous, addsDependency }) → 'plan' | 'direct'`.

## 6. Prompt Engineering & Structured Output (Domain 4)

- Structured responses use a JSON Schema sent to the Messages API (`src/agents/schemas/`).
- Intent routing uses **4 worked few-shot examples** in `src/agents/prompts/fewShot.ts`. The `FewShotRoutingSandbox` (on `/patterns/few-shot`) lets you type a prompt and watch the classifier pick subagents in real time.
- The Message Batches API is illustrated in `src/agents/batches.ts` for latency-tolerant workloads.

## 7. Context Management & Reliability (Domain 5)

- **Scratchpad** — `src/agents/scratchpad.ts` is a process-local singleton; `tutorStore.scratchpad` mirrors its entries into `localStorage` so they survive reloads.
- **Escalation** — `src/agents/escalation.ts#shouldEscalate({ userAsked, consecutiveBusinessErrors, confidence })` returns `{ escalate, reason }` for hard predicates: user request, repeated business errors, low confidence. Few-shot examples in the same file.
- **Context pruning** — every tool output passes through `contextPruner.prune(obj, { budget })` before merging into the model's context. The `ContextPrunerSandbox` (on `/patterns/context-pruning`) lets you paste JSON and watch fields get trimmed against a slider.

## 8. Pattern Showcase (v0.2.0)

`src/data/domain-content/` splits the 32 patterns one file per domain:

- `types.ts` — `DomainPattern { id, title, summary, source, codeSnippet, language, taskRef, type, tags, related, antiPattern?, sandbox?, quizQuestionRefs? }`.
- `d1.ts` … `d5.ts` — pattern arrays per domain.
- `index.ts` — assembled `domains` and `getDomain()`.

Each pattern detail page (`/patterns/:id`) renders, in order:
- task-ref pill · type badge · tag chips
- source path + code snippet
- **flow strip** (v0.4.0): "↑ comes after" / "↓ followed by" chips, "part of these flows" pills
- **anti-pattern foil** (when present): red-bordered "don't do this" panel
- **live sandbox** (when `sandbox` is set): one of 4 components in `src/components/sandboxes/`
- **related-pattern chips** linking to siblings across domains
- **inline quiz drill** — reuses the quiz answer-reveal UI on the 1–4 `quizQuestionRefs`

The 4 sandboxes are registered in `src/components/sandboxes/index.ts` and mounted by key (`context-pruner`, `structured-errors`, `few-shot-routing`, `hub-and-spoke-timeline`).

## 9. Mock Exam Loop (v0.3.0)

`src/stores/mockExam.ts` owns the exam state machine:

- **Active session** — `{ id, startedAt, timeBudgetMs, config, questionRefs, answers, flags, currentIdx, submittedAt }`. Persisted to `aip:mock-exam:active:v1`.
- **History** — completed exams (capped at 10). Persisted to `aip:mock-exam:history:v1`.
- **Time budgets** — 60 / 90 / 120 min (radio at start screen).
- **Scope** — `all` or `weak-spots` (derived from `quizStore.answers` for incorrect entries). Disabled in UI when no wrong answers exist.
- **Shuffle** — Fisher-Yates, toggleable.
- **Timer** — `tickTime()` called every 1s from the runner. Auto-submit when `remainingMs ≤ 0`.

Four routes:
- `/mock-exam` — start screen (resume an in-progress session if any; history list).
- `/mock-exam/run` — runner: sticky timer, nav grid, flag toggle, prev/next, submit confirm.
- `/mock-exam/result/:id` — score ring, per-section bars, list of wrong + unanswered + flagged items.
- `/mock-exam/review/:id` — step-through review with reverse-link chips to the patterns each question tests.

On submit, answers are merged back into `quizStore` so the regular quiz UI reflects the mock attempt.

## 10. Flow of Concepts (v0.4.0)

`src/data/flows.ts` defines 6 named flows. Each `FlowStep` carries `{ patternId, role, why }` — the `why` is a paragraph explaining the step's role in this specific flow.

```
Flow id                   Domains touched   Steps
─────────────────────────────────────────────────
coordinator-turn          d1·d2·d4·d5       7
tool-call-lifecycle       d1·d2·d5          5
support-resolution        d1·d2·d5          5
multi-agent-research      d1·d2·d5          5
extraction-pipeline       d4·d5             5
ci-pr-review              d2·d3·d4          6
```

`src/data/flowHelpers.ts` builds three lookup maps at module load (no per-pattern authoring):
- `getFlowsForPattern(patternId)` → which flows the pattern appears in, with step indices.
- `getFollowsFor(patternId)` → patterns that come BEFORE it in any flow.
- `getPrecedesFor(patternId)` → patterns that come AFTER it in any flow.

These power the flow strip on `PatternView` and the highlight logic in the atlas.

`/atlas` — pure-SVG concept map (`src/components/FlowGraph.vue`). 5 vertical domain columns, 32 pattern nodes. Selecting a flow chip lights up its patterns, dims the rest, draws bezier-arrow paths through them, and renders step-number bubbles. No graph library — laid out from a fixed column geometry.

`/atlas/:flowId` — `FlowWalkthroughView.vue`. Linear step-through tour: progress bar, "why this step is here" panel, the pattern's code snippet, prev/next + jump-to-step buttons.

## 11. Micro-Lessons (4 formats, 23 lessons)

`src/data/lessons.ts` declares a discriminated union over four lesson formats:

| Format | Component | Count |
|---|---|---|
| `reorder` | `src/components/lessons/ReorderLesson.vue` | 11 |
| `blanks` | `src/components/lessons/BlanksLesson.vue` | 2 |
| `mcq` | `src/components/lessons/McqLesson.vue` | 5 |
| `flow` | `src/components/lessons/FlowBuilderLesson.vue` | 5 |

`flow` lessons reference a `flowId` from `flows.ts` and a list of `distractorPatternIds`. The component shuffles canonical-pattern cards with distractors into a pool, presents numbered slots, click-to-place / click-×-to-clear, and on submit shows ✓/✗ + the canonical "why" rationale per slot (distractors marked red).

## 12. Reverse-Link Index

`src/data/reverseLinks.ts` inverts `pattern.quizQuestionRefs[]` once at module load:

```ts
getPatternsForQuestion(sectionId, questionId): ReverseLink[]
```

Used by `QuizQuestionView` (reveal panel) and `MockExamReviewView` (per-step) to show "**this question tests** D1·1.4 programmatic-prerequisites" chips that link to the pattern detail.

## 13. Persistence

`src/stores/persist.ts` is a thin wrapper around `localStorage` with versioned namespacing (`aip:`).

| Key | Owner | Shape |
|---|---|---|
| `aip:quiz:v1` | quizStore | `{ answers: { [sectionId:qid]: { picked, correct, answeredAt } } }` |
| `aip:tutor:v1` | tutorStore | `{ thread: ChatMessage[], scratchpad: ScratchpadEntry[] }` |
| `aip:lesson:v1` | lessonStore | `{ progress: { [lessonId]: { attempts, completed, lastAttemptAt } } }` |
| `aip:mock-exam:active:v1` | mockExamStore | `{ session: MockExamSession \| null }` |
| `aip:mock-exam:history:v1` | mockExamStore | `{ exams: CompletedExam[] }` (max 10) |

Bumping the version suffix is the migration mechanism — old keys are ignored and re-initialized.

## 14. Build & Run

| Command | Effect |
|---|---|
| `npm run dev` | Vite dev server on `:5173` (hash routing) |
| `npm run build` | `vue-tsc -b && vite build` → `dist/` |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run preview` | Serve `dist/` locally on `:4173` |

**Bundle (v0.4.0):** ≈ 35 kB CSS gzipped, ≈ 95 kB main JS gzipped, all routes lazy-chunked.

## 15. Composition Root for the SDK

```ts
// src/sdk/index.ts
import { mockAdapter } from './mockAdapter';
import type { SdkAdapter } from './types';

let current: SdkAdapter = mockAdapter;  // default

export function getAdapter(): SdkAdapter { return current; }
export function setAdapter(next: SdkAdapter) { current = next; }
```

To enable live SDK calls (browser-side dev only — production should proxy through a backend):

```ts
import { setAdapter, createRealAdapter } from '@/sdk';
setAdapter(createRealAdapter(apiKey, 'claude-haiku-4-5-20251001'));
```

The real adapter uses `dangerouslyAllowBrowser: true` and is explicitly tagged as dev-only in `realAdapter.ts`.
