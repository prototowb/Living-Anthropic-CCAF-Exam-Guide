// Curriculum-awareness bridge (Scenario 3 v0.3 task 9).
//
// Readonly accessor over the progress store's localStorage payload, used by
// the Tutor's spokes (quizmaster, docSynthesiser) to bias their picks toward
// stages the learner is currently weakest on.
//
// Per `src/agents/CLAUDE.md` rule 2 ("views NEVER call SDK directly"; corollary
// — agents NEVER import Pinia stores), this module reads localStorage *directly*
// rather than going through `useProgressStore`. The store is the source of truth
// on writes; this bridge is the read-side abstraction for the agent layer.
//
// The store persists under these keys (see `src/stores/progress.ts`):
//   ccc:stages:v1  — Record<stageId, { visited?, completed? }>
//   ccc:quiz:v1    — { picked: { [qKey]: letter }, correct: { [qKey]: boolean } }
//
// Quiz keys are formatted by `QuizQuestionView` as `${sectionId}:${qid}` — we
// reverse that to recover stage + question id below.

import { quizSections } from '@/data/quizData';

const STAGES_KEY = 'ccc:stages:v1';
const QUIZ_KEY = 'ccc:quiz:v1';

interface StageState {
  visited?: boolean;
  completed?: boolean;
}

interface QuizState {
  picked: Record<string, 'A' | 'B' | 'C' | 'D'>;
  correct: Record<string, boolean>;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Best-guess "what should the learner do next?". Returns the first stage that
 * is not yet `completed`, in canonical S1 → S8 order. Returns `null` when the
 * learner has finished everything we have stages for.
 */
export function getNextStageId(): string | null {
  const stages = readJson<Record<string, StageState>>(STAGES_KEY, {});
  // Stage ids follow `s1`..`s8` — order matters for "next".
  const ids = quizSections.map((s) => s.stageId);
  for (const id of ids) {
    if (!stages[id]?.completed) return id;
  }
  return null;
}

/**
 * Stages whose quiz correctness is < 60 %. Used by the quizmaster to bias its
 * question pick. Stages with zero attempts are NOT considered weak — the
 * learner hasn't tried yet.
 */
export function getWeakStages(): string[] {
  const quiz = readJson<QuizState>(QUIZ_KEY, { picked: {}, correct: {} });

  // Bucket answers by stage. The qKey format is `${sectionId}:${qid}`, and
  // sectionId === stageId for every section in our data.
  const totals = new Map<string, { attempted: number; correct: number }>();
  for (const [qKey, picked] of Object.entries(quiz.picked)) {
    if (!picked) continue;
    const [stageId] = qKey.split(':');
    if (!stageId) continue;
    const bucket = totals.get(stageId) ?? { attempted: 0, correct: 0 };
    bucket.attempted += 1;
    if (quiz.correct[qKey]) bucket.correct += 1;
    totals.set(stageId, bucket);
  }

  const out: string[] = [];
  for (const [stageId, { attempted, correct }] of totals) {
    if (attempted === 0) continue;
    if (correct / attempted < 0.6) out.push(stageId);
  }
  return out;
}

export interface RecentMistake {
  qid: string;
  section: string;
}

/**
 * Last 5 incorrect answers, newest first. Used by docSynthesiser to surface
 * "you got these wrong recently" remediation suggestions. Order is best-effort
 * — localStorage doesn't preserve insertion order across writes — but for our
 * purposes the bag of recent mistakes is what matters.
 */
export function getRecentMistakes(): RecentMistake[] {
  const quiz = readJson<QuizState>(QUIZ_KEY, { picked: {}, correct: {} });
  const out: RecentMistake[] = [];
  for (const [qKey, isCorrect] of Object.entries(quiz.correct)) {
    if (isCorrect) continue;
    if (!quiz.picked[qKey]) continue; // skipped — not a mistake
    const [section, qid] = qKey.split(':');
    if (!section || !qid) continue;
    out.push({ qid, section });
  }
  return out.slice(-5).reverse();
}
