// One job: summarize the user's overall quiz progress.

import { quizSections } from '@/data/quizData';
import { ok, type ToolResponse } from './types';

export interface ProgressSnapshot {
  totalAnswered: number;
  totalCorrect: number;
  totalQuestions: number;
  perSection: { sectionId: string; title: string; answered: number; correct: number; total: number }[];
}

export interface SummarizeProgressArgs {
  // Caller supplies the answer map keyed by `${section}:${id}` => { picked, correct }
  answers: Record<string, { picked: string; correct: boolean }>;
}

export async function summarizeProgress(
  args: SummarizeProgressArgs,
): Promise<ToolResponse<ProgressSnapshot>> {
  const perSection = quizSections.map((s) => {
    let answered = 0;
    let correct = 0;
    for (const q of s.questions) {
      const key = `${s.id}:${q.id}`;
      const rec = args.answers[key];
      if (!rec) continue;
      answered += 1;
      if (rec.correct) correct += 1;
    }
    return { sectionId: s.id, title: s.title, answered, correct, total: s.questions.length };
  });

  const totalAnswered = perSection.reduce((a, s) => a + s.answered, 0);
  const totalCorrect = perSection.reduce((a, s) => a + s.correct, 0);
  const totalQuestions = perSection.reduce((a, s) => a + s.total, 0);

  return ok({ totalAnswered, totalCorrect, totalQuestions, perSection });
}

export const summarizeProgressSpec = {
  name: 'summarize_progress',
  description:
    'Summarize the user\'s overall quiz progress: how many answered, how many correct, per-section breakdown.',
  input_schema: {
    type: 'object' as const,
    required: ['answers'] as const,
    properties: {
      answers: { type: 'object' },
    },
  },
};
