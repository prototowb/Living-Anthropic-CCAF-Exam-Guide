# Scenario 1 — Customer Support Resolution Agent

> *Verbatim from the exam guide:* "You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom Model Context Protocol (MCP) tools (`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`). Your target is 80%+ first-contact resolution while knowing when to escalate."
>
> *Primary domains:* Agentic Architecture & Orchestration · Tool Design & MCP Integration · Context Management & Reliability

## What this scenario teaches the engineer reading the source

A support-resolution agent is the canonical pattern for "narrow domain + structured backend access + must know when to give up." In our codebase the **Help Bot** sidebar is the same pattern reshaped: the domain is *navigating the companion app*, the backend is the in-app data stores, and "escalate to human" maps to "fall through to the docs." Engineers reading the source see granular MCP-shaped tools, `ToolResponse<T>` with `transient`/`business` error categories, and *hard-coded* escalation predicates with few-shot exemplars — all faithful to the architect mandates, no soft prompt phrases pretending to be policy.

## v0.1 state (already shipped)

- `src/agents/helpBot/coordinator.ts` — routing + escalation + scratchpad write
- `src/agents/helpBot/tools/getLesson.ts` — MCP-shaped granular tool, `ToolResponse<Lesson>`
- `src/agents/helpBot/tools/checkProgress.ts` — second granular tool
- `src/agents/escalation.ts` — `shouldEscalate` + `ESCALATION_FEWSHOT` (4 exemplars)
- `src/agents/tools/types.ts` — `ToolResponse<T>` + `ok` / `fail` helpers
- `src/agents/scratchpad.ts` — `helpBotScratchpad` instance
- `src/stores/helpBot.ts` + `src/components/HelpBotSidebar.vue` — UI

## v0.2 plan

1. **Add `lookupQuizAttempts({ stageId? })`** at `src/agents/helpBot/tools/lookupQuizAttempts.ts`. Returns `ToolResponse<{ qid: string; correct: boolean; pickedAt: number }[]>`. Accept: 90 % of "how did I do on S2?" prompts return a non-empty array; "how did I do on stage Z?" returns `business` error.
2. **Add `recordWeakSpot({ topic, qid? })`** at `src/agents/helpBot/tools/recordWeakSpot.ts`. Mutates the progress store via a dedicated action. Acceptance: the Tutor's quizmaster (Scenario 3) reads these and surfaces drills.
3. **Surface scratchpad in the sidebar** — collapsible "recent findings" panel reads `helpBotScratchpad.summarize(6)`. Acceptance: manual walkthrough shows the last few classified intents.
4. **`HelpBotSidebar` tool-call timeline** — each turn renders the tool roster with badges (ok / business-error / transient). Acceptance: a deliberate "lesson about quantum cryptography" prompt yields a visible `getLesson` business-error chip.

## v0.3 plan (main sprint, per PROJECT_PLAN.md §9)

5. **Add `escalateToDocs({ topic })`** at `src/agents/helpBot/tools/escalateToDocs.ts`. Returns a curated URL from a small in-repo registry (`src/data/docsRegistry.ts`). Acceptance: every escalation path now resolves to a clickable docs link in the UI.
6. **Capabilities-aware tool dispatch.** Today the helpBot uses regex routing — adapter-agnostic. v0.3 introduces an SDK-mediated path: when `getAdapter().capabilities.nativeToolUse === true`, the coordinator hands the prompt to the model with the tool roster and lets it choose. When `false` (small local models), fall back to today's regex + JSON-in-prose parser with one retry. New file `src/agents/helpBot/toolDispatcher.ts` houses the branch.
7. **Structured-error UI states.** Distinguish `transient` (retry button) vs `business` (alternative-question chip) in the sidebar. Acceptance: simulate a transient via a debug toggle and see the retry affordance.
8. **Three-strikes telemetry.** Wire `_consecutiveBusinessErrors` into the progress store so we can graph it on `/under-the-hood`. Acceptance: a contrived three-fail prompt sequence triggers `repeated_business_errors` escalation and the graph shows the spike.

## v0.4 plan

9. **First-contact-resolution metric** — author a 30-prompt fixture set at `src/data/_fixtures/helpBotEval.ts`; a `npm run eval:helpBot` script scores resolution rate against it. Acceptance: ≥ 80 % FCR on the fixture set (the architect target).
10. **`/under-the-hood` deep links** — clicking the Scenario 1 card runs three live helpBot queries with visible tool calls and renders the result inline.
11. **Cross-link with Tutor (Scenario 3)** — when the helpBot can't resolve and escalation is `low_confidence`, offer a "ask the Tutor" handoff button that pre-fills `/tutor` with the prompt. Acceptance: manual flow works end-to-end.

## Risks and open questions

- **Tool-name collision with parent project.** Parent uses `gradeAnswer`, `lookupQuestion`. Ours are differently named — don't accidentally copy parent tool implementations.
- **Fixture maintenance.** v0.4's `helpBotEval.ts` will drift as the curriculum grows; tag fixtures by stage so they self-prune.
- **Local-model false confidences.** Small models may pass a low-confidence question with high stated confidence. Mitigation: the confidence value is set by the helpBot itself based on which tools fired, not self-reported by the model — keep it that way.

## Cross-cutting notes

- **Scenario 3** — helpBot and Tutor share `scratchpad.ts`, `escalation.ts`, `contextPruner.ts`. Any change to those primitives must consider both agents.
- **Scenario 4** — `recordWeakSpot` is consumed by the Tutor's quizmaster (Scenario 3) but the underlying source-grep mechanism is Scenario 4's responsibility.
- **Scenario 6** — if v0.3 switches to native tool use, the tool roster is a JSON schema; that schema is owned by us but published through Scenario 6's pipeline.
