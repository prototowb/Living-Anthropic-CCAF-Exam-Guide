// One job: grade a user's answer against a quiz question.

import { getQuestion, type OptionLetter } from '@/data/quizData';
import { fail, ok, type ToolResponse } from './types';

export interface GradeAnswerArgs {
  section: string;
  id: number;
  answer: OptionLetter;
}

export interface GradeResult {
  correct: boolean;
  verdict: 'correct' | 'incorrect';
  rationale: string;
  expected: OptionLetter;
}

export async function gradeAnswer(
  args: GradeAnswerArgs,
): Promise<ToolResponse<GradeResult>> {
  const q = getQuestion(args.section, args.id);
  if (!q) return fail('business', `Question ${args.section}#${args.id} not found`);

  const correct = q.correct === args.answer;
  const rationale = correct
    ? q.explanation
    : q.wrongExplanations?.[args.answer] ??
      `The correct answer is ${q.correct}. ${q.explanation}`;

  return ok({
    correct,
    verdict: correct ? 'correct' : 'incorrect',
    rationale,
    expected: q.correct,
  });
}

export const gradeAnswerSpec = {
  name: 'grade_answer',
  description:
    'Grade a user-supplied multiple-choice answer (A|B|C|D) against the correct option. Returns the verdict, the expected letter, and a rationale.',
  input_schema: {
    type: 'object' as const,
    required: ['section', 'id', 'answer'] as const,
    properties: {
      section: { type: 'string' },
      id: { type: 'integer', minimum: 1 },
      answer: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
    },
  },
};
