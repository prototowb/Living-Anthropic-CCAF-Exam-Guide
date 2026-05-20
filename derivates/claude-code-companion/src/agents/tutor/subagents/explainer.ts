// Explainer subagent — answers "what is X?" for a beginner Claude Code user.
// One job, one prompt. The mock SDK returns hand-curated explanations keyed off
// the prompt (see ../../../sdk/mockAdapter.ts → explainConcept).

import { getAdapter } from '@/sdk';
import type { SubagentInvocation } from './types';

export async function explainer(prompt: string): Promise<SubagentInvocation> {
  const start = performance.now();
  const adapter = getAdapter();
  const res = await adapter.createMessage({
    system:
      'You are the explainer subagent for the Claude Code Companion. Explain Claude Code concepts to a beginner in 2-4 short paragraphs. Avoid jargon. Use concrete examples (file paths, commands). Never reference the architect exam or its scenarios — the surface is beginner-facing.',
    messages: [{ role: 'user', content: prompt }],
  });

  const output = res.text.replace(/^\*\*\[explainer\]\*\*\s*/, '');
  return {
    name: 'explainer',
    durationMs: Math.round(performance.now() - start),
    output,
    toolCalls: [],
  };
}
