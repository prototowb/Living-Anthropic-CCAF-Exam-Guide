// JSON Schema for grade_answer responses — sent to the Messages API for
// guaranteed schema-compliant extraction (Domain 4 mandate).

export const gradeAnswerSchema = {
  type: 'object',
  required: ['correct', 'verdict', 'rationale', 'expected'],
  properties: {
    correct: { type: 'boolean' },
    verdict: { type: 'string', enum: ['correct', 'incorrect'] },
    rationale: { type: 'string', minLength: 20 },
    expected: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
  },
  additionalProperties: false,
} as const;
