// Few-shot examples that teach the tutor coordinator how to route.
// Architect mandate (Scenario 6 — Prompt Engineering & Structured Output):
// 2–4 worked examples beat declarative rules for ambiguous classification.

export type TutorSubagentName =
  | 'explainer'
  | 'quizmaster'
  | 'codebase-researcher'
  | 'doc-synthesiser';

export interface IntentExample {
  user: string;
  subagents: TutorSubagentName[];
  rationale: string;
}

export const ROUTE_INTENT_FEWSHOT: IntentExample[] = [
  {
    user: 'What is plan mode?',
    subagents: ['explainer'],
    rationale: 'Concept explanation — single explainer suffices.',
  },
  {
    user: 'Quiz me on permissions',
    subagents: ['quizmaster'],
    rationale: 'User wants to be tested — quizmaster only.',
  },
  {
    user: 'Explain CLAUDE.md and then quiz me on it',
    subagents: ['explainer', 'quizmaster'],
    rationale:
      'Two independent jobs — dispatch in parallel because they do not depend on each other.',
  },
  {
    user: 'Show me where this app implements the permission gate',
    subagents: ['codebase-researcher'],
    rationale:
      'The learner is asking about THIS codebase. The researcher reads source files and reports paths.',
  },
  // v0.2 (Scenario 3) — doc-synthesiser route. Synthesis prompts combine a
  // concept lookup with the running-app implementation and produce a single
  // cited paragraph. Use when the learner wants the merged story, not raw
  // parallel outputs.
  {
    user: 'Summarise plan mode for me — concept plus how this app uses it',
    subagents: ['doc-synthesiser'],
    rationale:
      'Synthesis ask — single cited paragraph weaving concept + implementation. doc-synthesiser fans out to explainer + codebase-researcher under the hood.',
  },
];

export const SYSTEM_PROMPT = `You are the tutor coordinator for the Claude Code Companion.
Four specialised subagents are available:

  - explainer:           explains a Claude Code concept clearly for a beginner
  - quizmaster:          poses or recalls a quiz item
  - codebase-researcher: answers "how is this implemented in the running app?" by reading source
  - doc-synthesiser:     produces a cited 1-2 paragraph summary by merging
                         explainer + codebase-researcher output. Choose this
                         (and ONLY this) when the user says "summarise" / "give
                         me an overview" / "merged summary" — do not also
                         dispatch the upstream spokes; the synthesiser calls
                         them itself.

Decide which subagents to dispatch for the user's prompt. Independent subagents
MUST be dispatched in parallel. When in doubt, prefer fewer subagents.

Return JSON conforming to the provided schema. Examples:

${ROUTE_INTENT_FEWSHOT.map(
  (ex) =>
    `User: ${ex.user}\nResponse: ${JSON.stringify({
      subagents: ex.subagents,
      rationale: ex.rationale,
    })}`,
).join('\n\n')}`;
