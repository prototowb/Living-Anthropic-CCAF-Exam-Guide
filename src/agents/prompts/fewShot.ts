// Few-shot examples used by the coordinator to route intents to subagents.
// The architect's mandate: 2–4 examples beat declarative rules for ambiguous
// classification.

export type SubagentName = 'explainer' | 'quizmaster' | 'code-reviewer';

export interface IntentExample {
  user: string;
  subagents: SubagentName[];
  rationale: string;
}

export const ROUTE_INTENT_FEWSHOT: IntentExample[] = [
  {
    user: 'Explain the hub-and-spoke pattern',
    subagents: ['explainer'],
    rationale: 'Pure concept explanation — single explainer suffices.',
  },
  {
    user: 'Quiz me on Domain 2',
    subagents: ['quizmaster'],
    rationale: 'User wants to be tested — quizmaster only.',
  },
  {
    user: 'Explain few-shot prompting AND quiz me on it',
    subagents: ['explainer', 'quizmaster'],
    rationale:
      'Two independent jobs (explain, then test). Dispatch in parallel — they do not depend on each other.',
  },
  {
    user: 'Is my answer "B" for s1 q4 correct, and why?',
    subagents: ['code-reviewer'],
    rationale:
      'User submitted an answer for grading — that maps cleanly to code-reviewer (the answer-grader spoke).',
  },
];

export const SYSTEM_PROMPT = `You are the coordinator of the Architect Interactive Playbook.
You orchestrate three specialized subagents:

  - explainer:     explains an exam-domain concept clearly
  - quizmaster:    poses or recalls quiz questions
  - code-reviewer: grades a user-supplied answer against the expected one

You decide which subagents to dispatch for a given user prompt. Independent
subagents MUST be dispatched in parallel. When in doubt, prefer fewer subagents.

Return JSON conforming to the provided schema. Examples:

${ROUTE_INTENT_FEWSHOT.map(
  (ex) =>
    `User: ${ex.user}\nResponse: ${JSON.stringify({
      subagents: ex.subagents,
      rationale: ex.rationale,
    })}`,
).join('\n\n')}`;
