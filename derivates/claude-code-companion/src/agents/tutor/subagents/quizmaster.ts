// Quizmaster subagent (Scenario 3 v0.2 task 1).
//
// Reads `quizSections` directly from the content layer — per `src/data/CLAUDE.md`
// the data layer is pure and importable from anywhere. We do NOT call the SDK
// for quiz selection; the question bank is authoritative content, and routing
// the pick through a model would only add latency and a chance of hallucination.
//
// Stage selection priority (highest wins):
//   1. Explicit stage hint in the prompt: "quiz me on S2" / "quiz me on permissions"
//   2. The learner's weakest stages from the curriculum bridge (< 60 % correct)
//   3. Random across all sections
//
// The reply renders the question + four options + a "Reply with answer: X" cue
// so the surface can grade it later. Returns the question id in `summary` so
// downstream turns can prefer the short form (TS 5.4 — context isolation).

import { quizSections } from '@/data/quizData';
import type { QuizQuestion, QuizSection } from '@/data/types';
import { getWeakStages } from '../curriculum';
import type { SubagentInvocation } from './types';

// Loose lexicon for stage-hint matching. Keep the matches conservative — false
// positives here mean the learner gets quizzed on the wrong stage.
const STAGE_HINT_KEYWORDS: Record<string, string[]> = {
  s1: ['s1', 'first prompt', 'first session', 'getting started', 'launch'],
  s2: ['s2', 'tool', 'permission', 'allow', 'deny', 'plan mode'],
  s3: ['s3'],
  s4: ['s4'],
  s5: ['s5'],
  s6: ['s6'],
  s7: ['s7'],
  s8: ['s8'],
};

function pickStageFromPrompt(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  // Direct match first ("S2", "stage 2") — most specific.
  const direct = /\bs(?:tage\s*)?([1-8])\b/.exec(lower);
  if (direct) return `s${direct[1]}`;

  // Topic hints. First match wins.
  for (const [stageId, words] of Object.entries(STAGE_HINT_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return stageId;
  }
  return null;
}

function pickSection(prompt: string): QuizSection {
  // 1. Explicit hint.
  const hinted = pickStageFromPrompt(prompt);
  if (hinted) {
    const found = quizSections.find((s) => s.stageId === hinted);
    if (found && found.questions.length > 0) return found;
  }
  // 2. Curriculum-aware fallback — weak stages first.
  const weak = getWeakStages();
  for (const stageId of weak) {
    const found = quizSections.find((s) => s.stageId === stageId);
    if (found && found.questions.length > 0) return found;
  }
  // 3. Random across all sections with at least one question.
  const populated = quizSections.filter((s) => s.questions.length > 0);
  return populated[Math.floor(Math.random() * populated.length)];
}

function pickQuestion(section: QuizSection): QuizQuestion {
  return section.questions[Math.floor(Math.random() * section.questions.length)];
}

function formatMcq(section: QuizSection, q: QuizQuestion): string {
  const options = q.options.map((o) => `${o.letter}. ${o.text}`).join('\n');
  return [
    `**Quick check — ${section.title}.**`,
    '',
    q.text,
    '',
    options,
    '',
    `*(Reply with \`answer: <letter>\` to be graded.)*`,
  ].join('\n');
}

export async function quizmaster(prompt: string): Promise<SubagentInvocation> {
  const start = performance.now();
  const section = pickSection(prompt);
  const question = pickQuestion(section);
  const output = formatMcq(section, question);
  const summary = `Posed Q${question.id} from ${section.id}`;

  return {
    name: 'quizmaster',
    durationMs: Math.round(performance.now() - start),
    output,
    summary,
    // The quizmaster reads the data layer directly — no SDK tool calls to log.
    toolCalls: [],
  };
}
