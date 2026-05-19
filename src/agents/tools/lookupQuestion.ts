// One job: fetch a quiz question by section + id.

import { getQuestion, type QuizQuestion } from '@/data/quizData';
import { fail, ok, type ToolResponse } from './types';

export interface LookupQuestionArgs {
  section: string;
  id: number;
}

export async function lookupQuestion(
  args: LookupQuestionArgs,
): Promise<ToolResponse<QuizQuestion>> {
  const q = getQuestion(args.section, args.id);
  if (!q) return fail('business', `Question ${args.section}#${args.id} not found`);
  return ok(q);
}

export const lookupQuestionSpec = {
  name: 'lookup_question',
  description:
    'Retrieve a single quiz question by its section id (e.g. "s1") and question id (1-based integer). Use when the user asks about a specific question.',
  input_schema: {
    type: 'object' as const,
    required: ['section', 'id'] as const,
    properties: {
      section: { type: 'string', description: 'Section id like s1, s2, s3, s4' },
      id: { type: 'integer', minimum: 1 },
    },
  },
};
