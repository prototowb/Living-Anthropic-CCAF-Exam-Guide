// JSON Schema for the coordinator's intent classifier output.
// The model returns a list of subagents to dispatch — nothing else.

export const intentSchema = {
  type: 'object',
  required: ['subagents', 'rationale'],
  properties: {
    subagents: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', enum: ['explainer', 'quizmaster', 'code-reviewer'] },
    },
    rationale: { type: 'string' },
  },
  additionalProperties: false,
} as const;
