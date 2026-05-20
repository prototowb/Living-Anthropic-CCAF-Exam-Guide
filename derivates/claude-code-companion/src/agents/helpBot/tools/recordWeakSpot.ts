// Granular tool (Architect Scenario 1 — Tool Design & MCP Integration; TS 2.1).
//
// Persists a "weak spot" — a topic (and optionally a specific quiz id) the
// learner is struggling with — to localStorage under `ccc:weakSpots:v1`. The
// Tutor's quizmaster subagent (Scenario 3) reads from this key to surface
// targeted drills.
//
// This tool mutates persistent state. Architect mandate: mutations stay
// scoped (one key, append-only with light dedupe), return a typed
// ToolResponse, never throw.
//
// Error mapping:
//   - empty `topic` → validation
//   - localStorage write fails (quota, disabled) → transient

import { type ToolResponse, ok, fail } from '../../tools/types';

const STORAGE_KEY = 'ccc:weakSpots:v1';
const MAX_ENTRIES = 50;

export interface RecordWeakSpotInput {
  /** Free-form short topic label, e.g. "permission modes" or "headless flags". */
  topic: string;
  /** Optional anchor — a quiz question id (or lesson id) that exposed the gap. */
  qid?: string;
}

export interface WeakSpot {
  topic: string;
  qid?: string;
  at: number;
  count: number;
}

interface StoredWeakSpots {
  entries: WeakSpot[];
}

export function recordWeakSpot(
  input: RecordWeakSpotInput,
): ToolResponse<{ topic: string; count: number }> {
  if (!input?.topic || !input.topic.trim()) {
    return fail('validation', '`topic` is required and must be non-empty.');
  }
  const topic = input.topic.trim();

  let existing: StoredWeakSpots = { entries: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) existing = (JSON.parse(raw) as StoredWeakSpots) ?? { entries: [] };
    if (!Array.isArray(existing.entries)) existing.entries = [];
  } catch {
    // Soft reset — a malformed store should not block writing a new entry.
    existing = { entries: [] };
  }

  // Dedupe: same topic + qid bumps the count rather than appending.
  const match = existing.entries.find(
    (e) => e.topic === topic && e.qid === input.qid,
  );
  let count: number;
  if (match) {
    match.count += 1;
    match.at = Date.now();
    count = match.count;
  } else {
    existing.entries.push({ topic, qid: input.qid, at: Date.now(), count: 1 });
    count = 1;
  }

  // Bound storage growth — keep the MAX_ENTRIES most-recent rows.
  if (existing.entries.length > MAX_ENTRIES) {
    existing.entries = existing.entries
      .slice()
      .sort((a, b) => b.at - a.at)
      .slice(0, MAX_ENTRIES);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    return fail(
      'transient',
      `Could not persist weak spot (storage may be full or disabled): ${(e as Error).message}.`,
    );
  }

  return ok({ topic, count });
}

// ---------------------------------------------------------------------------
// MCP-style spec export (Architect TS 2.1 + S-2 in SYNTHESIS.md).
// ---------------------------------------------------------------------------
export const recordWeakSpotSpec = {
  name: 'record_weak_spot',
  description:
    "Record that the learner is struggling with a particular topic (and " +
    'optionally a specific quiz id) by appending to the `ccc:weakSpots:v1` ' +
    'localStorage key. Returns the topic and the running count for that ' +
    'topic. Use this after the learner confirms they got a question wrong ' +
    'or asks for more practice on a topic — the Tutor quizmaster reads from ' +
    'the same key to surface drills.',
  input_schema: {
    type: 'object',
    required: ['topic'],
    properties: {
      topic: {
        type: 'string',
        description:
          'Short free-form topic label (e.g. "permission modes"). Must be non-empty.',
      },
      qid: {
        type: 'string',
        description:
          'Optional anchor — quiz question id or lesson id that exposed the gap.',
      },
    },
    additionalProperties: false,
  },
} as const;
