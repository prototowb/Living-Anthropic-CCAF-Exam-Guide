// Granular tool (Architect Scenario 1 — Tool Design & MCP Integration).
//
// Reads the learner's progress from localStorage and returns a tight summary.
// The Help Bot calls this when the learner asks "how am I doing?" or "what's next?".

import { type ToolResponse, ok } from '../../tools/types';

export interface ProgressSummary {
  stagesCompleted: number;
  stagesTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  nextStageId: string | null;
}

const STORAGE_KEY = 'ccc:stages:v1';
const LESSON_KEY = 'ccc:lessons:v1';
const STAGE_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

export function checkProgress(): ToolResponse<ProgressSummary> {
  const stages = readJson<Record<string, { completed?: boolean }>>(STORAGE_KEY) ?? {};
  const lessons = readJson<Record<string, { completed?: boolean }>>(LESSON_KEY) ?? {};

  const stagesCompleted = Object.values(stages).filter((s) => s.completed).length;
  const lessonsCompleted = Object.values(lessons).filter((l) => l.completed).length;

  const nextStageId =
    STAGE_IDS.find((id) => !stages[id]?.completed) ?? null;

  return ok({
    stagesCompleted,
    stagesTotal: STAGE_IDS.length,
    lessonsCompleted,
    lessonsTotal: Object.keys(lessons).length,
    nextStageId,
  });
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// MCP-style spec export (Architect TS 2.1 + S-2 in SYNTHESIS.md).
// ---------------------------------------------------------------------------
export const checkProgressSpec = {
  name: 'checkProgress',
  description:
    "Read the learner's stage + lesson progress from localStorage. " +
    'Returns counts and the next-stage id. Never errors — empty progress is a valid result.',
  input_schema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
} as const;
