// Reverse index: which patterns does each quiz question test?
//
// Pattern data declares `quizQuestionRefs: { sectionId, questionId }[]`.
// This module inverts that map at module load so the quiz UI can ask
// "for question s2:14, which patterns is it drilling?" in O(1).

import { domains } from '@/data/domains';

export interface ReverseLink {
  patternId: string;
  patternTitle: string;
  domainId: string;
  domainNumber: number;
  taskRef: string;
  badgeClass: string;
}

const index = new Map<string, ReverseLink[]>();

for (const d of domains) {
  for (const p of d.patterns) {
    if (!p.quizQuestionRefs) continue;
    for (const ref of p.quizQuestionRefs) {
      const key = `${ref.sectionId}:${ref.questionId}`;
      const list = index.get(key) ?? [];
      list.push({
        patternId: p.id,
        patternTitle: p.title,
        domainId: d.id,
        domainNumber: d.number,
        taskRef: p.taskRef,
        badgeClass: `badge--${d.badgeClass}`,
      });
      index.set(key, list);
    }
  }
}

export function getPatternsForQuestion(sectionId: string, questionId: number): ReverseLink[] {
  return index.get(`${sectionId}:${questionId}`) ?? [];
}

export function hasPatternsForQuestion(sectionId: string, questionId: number): boolean {
  return index.has(`${sectionId}:${questionId}`);
}
