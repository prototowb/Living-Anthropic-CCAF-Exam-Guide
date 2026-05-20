// JSON Schema for the tutor coordinator's intent classifier.
// Demonstrates Architect Scenario 6 — Structured Data Extraction.
//
// The model returns the list of subagents to dispatch and a one-line rationale.
// Schema mode (when the adapter supports it) guarantees a parseable response.

export const intentSchema = {
  type: 'object',
  required: ['subagents', 'rationale'],
  properties: {
    subagents: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        enum: ['explainer', 'quizmaster', 'codebase-researcher', 'doc-synthesiser'],
      },
    },
    rationale: { type: 'string' },
  },
  additionalProperties: false,
} as const;

export interface IntentResult {
  subagents: ('explainer' | 'quizmaster' | 'codebase-researcher' | 'doc-synthesiser')[];
  rationale: string;
}
