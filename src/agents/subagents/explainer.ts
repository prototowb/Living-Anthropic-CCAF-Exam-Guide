// Explainer subagent — explains an exam-domain concept.
// One job, one prompt. The mock SDK returns a hand-curated reply by topic.

import { getAdapter } from '@/sdk';

export interface SubagentInvocation {
  name: string;
  durationMs: number;
  output: string;
  toolCalls: { name: string; input: Record<string, unknown> }[];
}

export async function explainer(prompt: string): Promise<SubagentInvocation> {
  const start = performance.now();
  const adapter = getAdapter();
  const res = await adapter.createMessage({
    system:
      'You are the explainer subagent. Explain Claude Architect concepts clearly, in 2-4 short paragraphs. Refer to the exam domains by number.',
    messages: [{ role: 'user', content: prompt }],
  });

  // Strip the "[explainer] ... " prefix the mock attaches, if present.
  const output = res.text.replace(/^\*\*\[explainer\]\*\*\s*/, '');
  return {
    name: 'explainer',
    durationMs: Math.round(performance.now() - start),
    output,
    toolCalls: [],
  };
}
