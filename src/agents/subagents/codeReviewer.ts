// Code-reviewer subagent — grades a user-supplied answer.
// Uses the grade_answer tool internally (Domain 2 granular-tool pattern).

import { getAdapter } from '@/sdk';
import { gradeAnswer } from '@/agents/tools/gradeAnswer';
import type { OptionLetter } from '@/data/quizData';
import type { SubagentInvocation } from './explainer';

export async function codeReviewer(prompt: string): Promise<SubagentInvocation> {
  const start = performance.now();
  const toolCalls: { name: string; input: Record<string, unknown> }[] = [];

  const m = prompt.match(/answer\s+(s\d+)\s*q(\d+)\s*:\s*([A-Da-d])/i);
  if (m) {
    const [, section, idStr, letter] = m;
    const input = { section, id: Number(idStr), answer: letter.toUpperCase() as OptionLetter };
    toolCalls.push({ name: 'grade_answer', input });
    const res = await gradeAnswer(input);
    const output = res.isError
      ? `⚠ ${res.message} (errorCategory: ${res.errorCategory})`
      : res.data.correct
        ? `✅ Correct — **${input.answer}**.\n\n${res.data.rationale}`
        : `❌ Not quite — expected **${res.data.expected}**.\n\n${res.data.rationale}`;
    return {
      name: 'code-reviewer',
      durationMs: Math.round(performance.now() - start),
      output,
      toolCalls,
    };
  }

  // Fall back to a hint via the SDK.
  const adapter = getAdapter();
  const res = await adapter.createMessage({
    system: 'You are the code-reviewer subagent. Help the user format their answer for grading.',
    messages: [{ role: 'user', content: prompt }],
  });
  return {
    name: 'code-reviewer',
    durationMs: Math.round(performance.now() - start),
    output: res.text.replace(/^\*\*\[code-reviewer\]\*\*\s*/, ''),
    toolCalls,
  };
}
