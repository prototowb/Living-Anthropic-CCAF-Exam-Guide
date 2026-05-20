// Granular tool (Architect Scenario 1 — Tool Design & MCP Integration; TS 2.1).
//
// Reads the learner's recorded quiz answers from localStorage (`ccc:quiz:v1`)
// and returns per-question correctness. The Help Bot calls this when the
// learner asks "how did I do on stage S2?" or "which quiz questions did I get
// wrong?". The quizmaster subagent (Scenario 3) reads the same shape to
// surface drills for weak topics.
//
// Error mapping (v0.2 widening per SYNTHESIS.md S-1):
//   - stageId given but never attempted → business (semantically empty)
//   - quiz store malformed              → transient (caller may retry)
//   - no attempts recorded at all + no stageId → business
//
// Storage shape (compatible with the quiz store's persisted state):
//   ccc:quiz:v1 = {
//     attempts: { [qid: string]: { correct: boolean; stageId?: string; at?: number } }
//   }

import { type ToolResponse, ok, fail } from '../../tools/types';

const STORAGE_KEY = 'ccc:quiz:v1';

export interface LookupQuizAttemptsInput {
  /** Optional stage id (e.g. "s2") to scope the lookup. */
  stageId?: string;
}

export interface QuizAttempt {
  qid: string;
  correct: boolean;
}

interface StoredAttempt {
  correct?: boolean;
  stageId?: string;
  at?: number;
}

interface StoredQuiz {
  attempts?: Record<string, StoredAttempt>;
}

export function lookupQuizAttempts(
  input: LookupQuizAttemptsInput = {},
): ToolResponse<QuizAttempt[]> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return fail(
      'transient',
      `Could not read quiz store: ${(e as Error).message}.`,
    );
  }
  if (!raw) {
    return fail('business', 'No quiz attempts recorded yet.');
  }

  let parsed: StoredQuiz;
  try {
    parsed = JSON.parse(raw) as StoredQuiz;
  } catch (e) {
    return fail(
      'transient',
      `Quiz store is malformed JSON: ${(e as Error).message}.`,
    );
  }

  const attempts = parsed.attempts ?? {};
  const all: QuizAttempt[] = Object.entries(attempts).map(([qid, entry]) => ({
    qid,
    correct: !!entry?.correct,
  }));

  if (input.stageId) {
    const scoped = Object.entries(attempts)
      .filter(([, entry]) => entry?.stageId === input.stageId)
      .map(([qid, entry]) => ({ qid, correct: !!entry?.correct }));
    if (scoped.length === 0) {
      return fail(
        'business',
        `No quiz attempts recorded for stage "${input.stageId}".`,
      );
    }
    return ok(scoped);
  }

  if (all.length === 0) {
    return fail('business', 'No quiz attempts recorded yet.');
  }
  return ok(all);
}

// ---------------------------------------------------------------------------
// MCP-style spec export (Architect TS 2.1 + S-2 in SYNTHESIS.md).
// snake_case `name` per convention; description ≥ 60 chars and disambiguated
// from check_progress (this tool is per-question correctness, not stage counts).
// ---------------------------------------------------------------------------
export const lookupQuizAttemptsSpec = {
  name: 'lookup_quiz_attempts',
  description:
    "Read the learner's recorded quiz attempts (per-question correctness) from " +
    'localStorage. Optionally scope to a single stage via `stageId`. Returns an ' +
    'array of `{ qid, correct }` records. Use this when the learner asks about ' +
    'their quiz performance — distinct from check_progress, which returns stage ' +
    'and lesson completion counts but no per-question detail.',
  input_schema: {
    type: 'object',
    properties: {
      stageId: {
        type: 'string',
        description:
          'Optional stage id (e.g. "s2"). When provided, restricts the result to that stage.',
      },
    },
    additionalProperties: false,
  },
} as const;
