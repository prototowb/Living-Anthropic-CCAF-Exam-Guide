// Quizmaster subagent — poses a quiz question.
// Single job — picks a relevant question and presents it.

import { getAdapter } from '@/sdk';
import type { SubagentInvocation } from './explainer';

export async function quizmaster(prompt: string): Promise<SubagentInvocation> {
  const start = performance.now();
  const adapter = getAdapter();
  const res = await adapter.createMessage({
    system:
      'You are the quizmaster subagent. Pose one multiple-choice question relevant to the user\'s topic. Do not reveal the answer.',
    messages: [{ role: 'user', content: prompt }],
  });

  const output = res.text.replace(/^\*\*\[quizmaster\]\*\*\s*/, '');
  return {
    name: 'quizmaster',
    durationMs: Math.round(performance.now() - start),
    output,
    toolCalls: [{ name: 'lookup_question', input: { hint: prompt } }],
  };
}
