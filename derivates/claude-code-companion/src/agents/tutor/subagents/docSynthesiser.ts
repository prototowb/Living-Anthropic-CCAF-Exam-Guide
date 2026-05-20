// DocSynthesiser subagent (Scenario 3 v0.2 task 2).
//
// Calls the explainer for the concept and the codebase-researcher for the
// implementation, then merges them into a 1-2 paragraph cited summary.
//
// Architectural notes:
//   - This spoke calls the other spokes directly (no SDK round-trip of its
//     own). The hub-and-spoke purist would route this through the coordinator
//     to keep all inter-subagent communication in one place — but the deepening
//     pass's `dependsOn` DAG (a future task) lands that pattern properly. For
//     now, the docSynthesiser composes its prerequisites itself, surfacing each
//     downstream call in its own `toolCalls` log so the trace is honest.
//   - Citations are lifted from the codebase-researcher's `cite` tool calls
//     and woven into the prose with backtick-formatted paths.
//   - The merged `summary` is capped at ≤ 200 chars per the sprint spec.

import { explainer } from './explainer';
import { codebaseResearcher } from './codebaseResearcher';
import type { SubagentInvocation } from './types';
import type { SourceCitation } from '@/agents/schemas';

function extractCitations(inv: SubagentInvocation): SourceCitation[] {
  const out: SourceCitation[] = [];
  for (const tc of inv.toolCalls) {
    if (tc.name !== 'cite') continue;
    const i = tc.input as Record<string, unknown>;
    if (
      typeof i.path === 'string' &&
      typeof i.line === 'number' &&
      typeof i.preview === 'string'
    ) {
      out.push({
        kind: 'citation',
        path: i.path,
        line: i.line,
        preview: i.preview,
      });
    }
  }
  return out;
}

function formatCitations(citations: SourceCitation[]): string {
  if (citations.length === 0) return '_(no citations available — the researcher did not find a strong match)_';
  return citations
    .slice(0, 4)
    .map((c) => `\`${c.path}:${c.line}\``)
    .join(', ');
}

/**
 * v0.4 task 11 — bibliography section at the bottom of the synthesised reply.
 *
 * Prose already lifts the citations inline via `formatCitations`. The architect
 * mandate for a *cited* paragraph also calls for a proper bibliography readers
 * can scan — same data, structured layout, max 5 entries (anything more is
 * noise on a 1-2 paragraph synthesis).
 *
 * Format per line: `- {path}:{line} — {preview-first-80-chars}`.
 */
function formatBibliography(citations: SourceCitation[]): string {
  if (citations.length === 0) return '';
  const lines = citations.slice(0, 5).map((c) => {
    const preview = c.preview.trim().replace(/\s+/g, ' ').slice(0, 80);
    return `- \`${c.path}:${c.line}\` — ${preview}`;
  });
  return ['## See:', ...lines].join('\n');
}

function makeSummary(prompt: string, citationCount: number): string {
  const base = `Synthesised concept + impl for "${prompt.slice(0, 60)}"`;
  const tail = citationCount > 0 ? ` (${citationCount} citation${citationCount > 1 ? 's' : ''})` : '';
  const full = base + tail;
  return full.length > 200 ? full.slice(0, 197) + '...' : full;
}

export async function docSynthesiser(prompt: string): Promise<SubagentInvocation> {
  const start = performance.now();

  // Fan out the two prerequisite spokes. Order doesn't matter — they're
  // independent — and even if one rejects, the other still gives us partial
  // coverage. We catch each independently rather than rejecting the synthesiser.
  const [conceptOutcome, implOutcome] = await Promise.allSettled([
    explainer(prompt),
    codebaseResearcher(prompt),
  ]);

  const concept =
    conceptOutcome.status === 'fulfilled'
      ? conceptOutcome.value
      : null;
  const impl =
    implOutcome.status === 'fulfilled' ? implOutcome.value : null;

  const conceptText = concept?.output ?? '_(concept lookup failed)_';
  const implText = impl?.output ?? '_(codebase lookup failed)_';
  const citations = impl ? extractCitations(impl) : [];

  // Template merge — deliberately minimal. The architect mandate is that the
  // synthesiser produces a *cited* paragraph, not a model-generated essay.
  //
  // v0.4 task 11: the prose ends with a `## See:` bibliography section listing
  // up to 5 of the lifted citations with an 80-char preview each. The inline
  // `_See:_` line stays for at-a-glance scanning; the bibliography is the
  // structured form the TutorView (and any downstream consumer) can render or
  // strip without re-parsing the body.
  const bibliography = formatBibliography(citations);
  const sections = [
    `**Concept.** ${conceptText}`,
    '',
    `**In this app.** ${implText}`,
    '',
    `_See:_ ${formatCitations(citations)}`,
  ];
  if (bibliography) {
    sections.push('', bibliography);
  }
  const output = sections.join('\n');

  const summary = makeSummary(prompt, citations.length);

  // Surface downstream spoke calls in our tool log so the trace stays honest.
  const toolCalls = [
    {
      name: 'invoke_explainer',
      input: { durationMs: concept?.durationMs ?? -1, ok: concept !== null },
    },
    {
      name: 'invoke_codebase_researcher',
      input: { durationMs: impl?.durationMs ?? -1, ok: impl !== null, citationCount: citations.length },
    },
    // Carry the citations forward so TutorView's existing `cite` chip path
    // continues to work for synthesised replies.
    ...citations.map((c) => ({
      name: 'cite' as const,
      input: c as unknown as Record<string, unknown>,
    })),
  ];

  return {
    name: 'doc-synthesiser',
    durationMs: Math.round(performance.now() - start),
    output,
    summary,
    toolCalls,
  };
}
