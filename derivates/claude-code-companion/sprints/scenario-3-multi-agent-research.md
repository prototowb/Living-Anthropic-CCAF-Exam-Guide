# Scenario 3 — Multi-Agent Research System

> *Verbatim from the exam guide:* "You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialized subagents: one searches the web, one analyzes documents, one synthesizes findings, and one generates reports. The system researches topics and produces comprehensive, cited reports."
>
> *Primary domains:* Agentic Architecture & Orchestration · Tool Design & MCP Integration · Context Management & Reliability

## What this scenario teaches the engineer reading the source

The **Tutor** at `/tutor` is the headline realisation. An engineer reading the source sees the canonical hub-and-spoke shape: a coordinator with `ALLOWED_TOOLS` that asserts `Task` at module load, a registry of specialised subagents, schema-constrained intent classification driving the dispatch, parallel execution gated by an adapter-capabilities flag (so small local models degrade to serial), and post-turn scratchpad + context-pruning hygiene. Every architect mandate for this scenario has a single concrete file to read.

## v0.1 state (already shipped)

- `src/agents/tutor/coordinator.ts` — hub; `ALLOWED_TOOLS = ['Task','Read','Grep']` asserted at load; capabilities-aware dispatch (parallel iff `parallelSubagents`)
- `src/agents/tutor/subagents/explainer.ts` — concept explanation spoke (real)
- `src/agents/tutor/subagents/quizmaster.ts` — quiz-item spoke (stub)
- `src/agents/tutor/subagents/codebaseResearcher.ts` — Scenario-4 spoke (stub)
- `src/agents/tutor/subagents/index.ts` — registry
- `src/agents/tutor/prompts/fewShot.ts` — 4 worked examples + system prompt
- `src/agents/tutor/schemas/intentClassification.ts` — JSON schema for intent (Scenario-6 overlap)
- `src/agents/scratchpad.ts` (`tutorScratchpad`) + `src/agents/contextPruner.ts`
- `src/stores/tutor.ts` + `src/views/TutorView.vue` (shows per-turn `totalMs`, `parallel`, subagents, adapter)

## v0.2 plan

1. **Realise `quizmaster.ts`.** Currently a stub. Read `src/data/quizData.ts`, select questions by stage + weak-spot signal from the progress store (via a thin readonly accessor — no direct store import; agents shouldn't depend on Pinia). Acceptance: "quiz me on permissions" returns a real S2 question, not a stub.
2. **Add `docSynthesiser` subagent.** New file `src/agents/tutor/subagents/docSynthesiser.ts`. Takes other spokes' outputs as input (via the coordinator merging), returns a cited summary with stage/lesson links. Wire it to the intent classifier with a 5th few-shot example.
3. **Per-spoke timings in the TutorView.** Already in `SubagentInvocation.durationMs`; add inline bar chart per turn. Acceptance: visible bars in `/tutor` after a multi-spoke turn.
4. **Persist Tutor thread.** Save `tutorStore.messages` to `localStorage` under `ccc:tutor:v1`. Restore on reload. Acceptance: reload preserves the conversation.
5. **Surface `tutorScratchpad` in the UI.** A small collapsible "memory" panel showing the last 8 findings. Pure read; no writes from the UI.

## v0.3 plan (local-model degradation is the heavy lift)

6. **Serial-fallback regression coverage.** Add a `MockUnreliableAdapter` for tests at `src/sdk/__fixtures__/unreliableAdapter.ts` with `capabilities: { nativeToolUse: false, parallelSubagents: false, schemaMode: false }`. Pipe it through the coordinator and verify single-subagent path produces a coherent reply. Acceptance: a Vitest spec passes against it (or — pre-Vitest — a manual harness page at `/__debug/tutor`).
7. **JSON-in-prose intent classification.** When `capabilities.schemaMode` is false, swap the schema'd intent call for a parser pass over free-form text with `extractFirstJsonObject(text)` and a one-retry escalation. Capture failure as `low_confidence` for downstream escalation.
8. **"Limited" badge in the TutorView.** When the active adapter advertises a degraded capability, show a chip with a one-click explainer linking to `/under-the-hood`. Acceptance: switching to `MockUnreliableAdapter` flips the badge.
9. **Curriculum awareness.** A readonly bridge `src/agents/tutor/curriculum.ts` exposing `getNextStageId()`, `getWeakStages()`, `getRecentMistakes()`. Subagents call it; the store remains the source of truth.

## v0.4 plan

10. **Reverse-link chips.** Every tutor reply gains a chip strip linking to the stages, lessons, and sandboxes referenced in the body (heuristic: regex over `/(learn|lessons|sandboxes)/[\w-]+/`). Acceptance: clicking a chip navigates correctly.
11. **Citations for `docSynthesiser`.** Output a structured `citations: Array<{stageId|lessonId|sandboxId; quote}>` consumed by the Tutor view to render a bibliography under the reply.
12. **`/under-the-hood` deep link.** Clicking the Scenario 3 card runs three live multi-spoke turns end-to-end inline.
13. **Coordinator unit boundary.** Document and enforce that no agent module imports from `src/stores/*` or `src/views/*` — a thin lint script + the existing `src/agents/CLAUDE.md` rule. Acceptance: a deliberately wrong import is caught by the lint script.

## Risks and open questions

- **Schema brittleness on small local models.** Even with grammar-constrained mode (WebLLM JSON-mode), 3B models slip — JSON-in-prose fallback (task 7) must be tested against actual model output, not just synthetic adapters.
- **Codebase-researcher dependency for `/under-the-hood` deep links.** Scenario 4 must land first (v0.2). Sequencing matters.
- **Scratchpad growth.** No eviction policy yet — bound the in-memory list to ~50 entries and persist a rolling window.
- **Adapter swap mid-session.** If the user toggles model source mid-conversation, capabilities change but the existing turns rendered for the old adapter remain valid. Make sure the UI doesn't retroactively re-classify them.

## Cross-cutting notes

- **Scenario 1 (helpBot)** — shares `scratchpad.ts`, `escalation.ts`, `contextPruner.ts`. v0.3 task 8's "limited" badge pattern should reuse a shared component the helpBot also uses.
- **Scenario 4 (codebaseResearcher)** — registered here, body owned there. v0.2 task 2 (`docSynthesiser`) is a different spoke and lives entirely in this scenario.
- **Scenario 6 (structured extraction)** — `intentClassification.ts` is one of three JSON-schema usages; the schema-mode fallback (task 7) is the canonical pattern Scenario 6 should mirror for its content pipeline.
