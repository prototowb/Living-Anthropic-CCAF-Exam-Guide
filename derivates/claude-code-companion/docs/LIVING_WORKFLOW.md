# Living Workflow — building this repo with Claude Code

> A narrated walkthrough of how a real file in this repo was authored using Claude Code. The point isn't to admire the result; it's to show the *workflow shape* so you can repeat it for your own work.

This document targets engineers who have read the [root `CLAUDE.md`](../CLAUDE.md) and want a concrete trace of plan-mode vs direct execution, slash commands, and the CLAUDE.md hierarchy working together. The file chosen as the subject is **`src/agents/tutor/dispatch.ts`** — small enough to fit in one head, complex enough that the wrong shortcut would have been costly.

---

## Why this file is a good example

`dispatch.ts` is the v0.2 fix for the `Promise.all` anti-pattern called out in [`sprints/SYNTHESIS.md` §S-3](../sprints/SYNTHESIS.md). Before the fix, `tutor/coordinator.ts` did:

```ts
const results = await Promise.all(intent.subagents.map(...))
```

— and a single throwing subagent rejected the whole turn. The user saw nothing when 3 of 4 spokes succeeded. Task Statement 5.3 names this the canonical multi-agent error-propagation bug.

So the work had three constraints, all from existing repo conventions:

- `src/agents/CLAUDE.md` rule 3 — tools never throw; they return `ToolResponse<T>`. But subagents *can* throw, because they're not tools.
- `src/agents/CLAUDE.md` rule 4 — `Promise.all` is allowed only when `adapter.capabilities.parallelSubagents` is true. The capability gate must stay.
- SYNTHESIS.md S-3 — the failure mode must surface as a partial reply plus a footer, not a thrown error.

This is exactly the kind of change where plan mode pays off.

---

## Scope precedence — read this before you start a session

The CLAUDE.md hierarchy resolves closest-wins:

| Scope | File | Versioned? | Loaded when |
|---|---|---|---|
| User-global | `~/.claude/CLAUDE.md` | no | every session, every project |
| Project-root | `<repo>/CLAUDE.md` | **yes** | every session in this repo |
| Per-area | `src/agents/CLAUDE.md`, `src/data/CLAUDE.md`, `src/views/CLAUDE.md`, … | **yes** | when working inside that directory |
| Path-specific | `.claude/rules/*.md` (glob-scoped) | **yes** | when editing a path matched by the file's `paths:` frontmatter |
| Local-only | `.claude/settings.local.json`, `CLAUDE.local.md` | **no** (gitignored) | per-developer overrides |

Closer files **extend** the root, they don't restate it. If you find yourself repeating a rule, lift it to `.claude/rules/voice.md` and `@import` from both places (see [`scenario-2-claude-code-workflow.deepening.md` §"`@import` syntax"](../sprints/scenario-2-claude-code-workflow.deepening.md)).

---

## Phase 1 — Plan mode

The prompt used to start the session:

> *Replace `Promise.all` in `tutor/coordinator.ts` with a helper that does `Promise.allSettled` semantics so a single subagent failure doesn't reject the whole turn. The fix must respect `src/agents/CLAUDE.md` rule 4 (capabilities-aware), and the UI needs to surface failures as a footer, not swallow them. Plan first; do not edit yet.*

Why plan mode here (per root [`CLAUDE.md`](../CLAUDE.md) §"Plan mode vs direct execution"):

- The change touches more than two files (new `dispatch.ts`, edited `coordinator.ts`, eventual UI surface in `TutorView.vue`).
- It introduces a new shape (`DispatchOutcome<T>`) that callers will depend on.
- The capability-gated branching is easy to mis-shape on the first pass.

What plan mode returned (paraphrased — the real output ran ~40 lines):

1. New file `src/agents/tutor/dispatch.ts` exporting `dispatchAllSettled<T>(tasks: Array<() => Promise<T>>): Promise<DispatchOutcome<T>>` and `describeError(e: unknown): string`.
2. `coordinator.ts` keeps the `canParallel` gate. When `canParallel`, call `dispatchAllSettled`. When not, run a serial loop with the same `{ results, errors }` split.
3. Surface `errors: SpokeFailure[]` on the `TutorTurn` return type — empty array on full success.
4. Compose a "[N spoke(s) failed]" footer in the coordinator's reply, not in the view layer (keeps `src/views/CLAUDE.md` rule 2 honest — views don't know coordinator internals).
5. Do *not* widen `ToolResponse` here — that's S-1 work and lands in a separate PR.
6. No tests yet — see open `TESTING.md` ticket.

The plan is the thing I argued with, not the code. Two issues surfaced before any edit:

- The original plan called the helper `runAll`. I rejected the name — too generic; `dispatchAllSettled` carries the `Promise.allSettled` semantics in the name. Worth a five-second naming fight at plan time vs a 20-minute refactor later.
- The plan put the footer composition in `TutorView.vue`. I moved it to the coordinator because *the UI never sees the unmerged subagent invocations* — composing the footer in the view would require leaking the failure list across the agent/view boundary. `src/views/CLAUDE.md` rule 2 (no agent imports) makes this a hard line.

---

## Phase 2 — Direct execution

After plan approval, the work split into three direct edits. None of them needed plan mode — each was scoped to one file with a known shape.

### Edit 1 — `src/agents/tutor/dispatch.ts` (new)

Direct execution. The plan named the export, the shape, and the docstring style. The file ended at 65 lines; the `@example` block in the JSDoc came from the plan's call-site sketch.

### Edit 2 — `src/agents/tutor/coordinator.ts`

Direct execution. Three changes:

- Import `dispatchAllSettled, describeError` from `./dispatch`.
- Replace the `Promise.all(...)` line with the `runParallel` helper that wraps `dispatchAllSettled`.
- Add `runSerial` for the `!canParallel` branch — keeps the per-spoke try/catch local so the merge shape matches.

Direct execution was safe here because the diff was mechanical — the public shape of `tutor.handle` didn't change beyond adding `errors` to the return type.

### Edit 3 — `TutorView.vue` (later, in a separate session)

Render `errors` as a footer ribbon. This was *direct* in isolation but came in its own short session because the styling decision (warning-amber vs muted-grey) was a design call, not a code call.

---

## Phase 3 — Verification

```bash
npm run typecheck
```

— ran clean. The TS compiler caught one issue during Edit 2: the `errors` field on `TutorTurn` was initially typed as `Array<{ name: string; message: string }>`. I extracted `SpokeFailure` so the view layer could type its props against the same symbol. Lesson: **type-first edits in TS surface naming gaps the prompt missed.**

No runtime test yet because the `TESTING.md` ticket is still open. The provenance comment at the top of `dispatch.ts` cites TS 5.3 and SYNTHESIS.md S-3 so the next reader knows why the helper exists.

---

## Slash commands & skills that helped

- **`/explain-this`** (Scenario 2 v0.2) — used once on `coordinator.ts` before planning, to confirm the existing `Promise.all` call site and its dependencies. The codebase-researcher subagent (`src/agents/tutor/subagents/codebaseResearcher.ts`) returned cited matches in ~3 seconds.
- **`/review-component`** — not used here; this isn't a Vue component. Would have applied to Edit 3.
- **`stage-author`** skill — not invoked. This work didn't touch stages.

---

## What this trace shows about the workflow

1. **Plan mode pays off when the change has cross-file consequences or when naming matters.** Plan output is cheap to redirect; code is not.
2. **The CLAUDE.md hierarchy is load-bearing.** Two rules (`src/agents/CLAUDE.md` rule 4 and `src/views/CLAUDE.md` rule 2) shaped the design more than the prompt did.
3. **Slash commands aren't replacements for plan mode — they're context primitives.** `/explain-this` gave me the call-site map; I still had to decide what to do with it.
4. **`npm run typecheck` is a real test.** Until `TESTING.md` lands, type errors are most of the signal.

---

## Replay this workflow

```text
1. claude
2. > Replace Promise.all in tutor/coordinator.ts with a helper that does
     Promise.allSettled semantics... [paste the prompt above]
3. # In plan mode, push back on names and boundaries until the plan is right.
4. > approve
5. # Direct execution proceeds across the three files.
6. npm run typecheck
```

If at any step the model proposes touching a file outside the planned scope, decline and re-plan. The `.claude/settings.json` `Edit` permission allowlist (Scenario 2 v0.3) catches the worst cases, but the cheapest filter is still your "no — replan" reply.
