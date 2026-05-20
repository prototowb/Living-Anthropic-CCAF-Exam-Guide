// Granular tool (Architect Scenario 1 — Tool Design & MCP Integration; TS 2.1).
//
// Looks up a lesson by id OR by free-text title query. Returns a
// ToolResponse<Lesson> — never throws.
//
// Error mapping (v0.2 widening per SYNTHESIS.md S-1):
//   - neither id nor query     → validation (caller can re-call with an arg)
//   - id given but missing     → business   (the semantics are wrong)
//   - query with 0 matches     → business   (semantically not present)
//   - query with > 1 matches   → validation (clarify — re-call with id)

import { type ToolResponse, ok, fail } from '../../tools/types';
import { lessons, type Lesson } from '@/data/lessons';

export interface GetLessonInput {
  id?: string;
  query?: string;
}

export function getLesson(input: GetLessonInput): ToolResponse<Lesson> {
  if (!input.id && !input.query) {
    return fail('validation', 'Provide either `id` or `query` to look up a lesson.');
  }
  if (input.id) {
    const hit = lessons.find((l) => l.id === input.id);
    if (!hit) return fail('business', `No lesson with id "${input.id}".`);
    return ok(hit);
  }
  const q = input.query!.toLowerCase();
  const matches = lessons.filter(
    (l) => l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q),
  );
  if (matches.length === 0) {
    return fail('business', `No lesson matched "${input.query}".`);
  }
  if (matches.length > 1) {
    return fail(
      'validation',
      `Multiple lessons matched "${input.query}": ${matches.map((m) => m.id).join(', ')}. Re-call with a specific id.`,
    );
  }
  return ok(matches[0]);
}

// ---------------------------------------------------------------------------
// MCP-style spec export (Architect TS 2.1 + S-2 in SYNTHESIS.md).
// ---------------------------------------------------------------------------
export const getLessonSpec = {
  name: 'getLesson',
  description:
    'Look up a single lesson by id or by free-text title/summary query. ' +
    'Returns the lesson record or a typed error: validation (input missing/ambiguous) or business (no match).',
  input_schema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description:
          'Exact lesson id (e.g. "l-s1-mcq-exit"). Preferred when known.',
      },
      query: {
        type: 'string',
        description:
          'Free-text query matched against lesson title and summary. Use only when id is unknown.',
      },
    },
    additionalProperties: false,
  },
} as const;
