// Granular tool (Architect Scenario 1 v0.3 — Tool Design & MCP Integration).
//
// Final-fallback tool: when the Help Bot has decided to escalate (per
// `shouldEscalate`), it calls `escalateToDocs({ topic })` to resolve a
// curated Claude Code documentation URL. Architect TS 5.2 mandate — every
// escalation path terminates at a named resource (not a generic gesture).
//
// Source of truth: `src/data/docsRegistry.ts` (data layer; no app imports).
//
// Error mapping:
//   - empty topic → validation (caller must provide a hint)
//   - resolver always returns *something* (fallback to the overview page),
//     so business / transient errors are not emitted here.

import { type ToolResponse, ok, fail } from '../../tools/types';
import { resolveDocLink, type DocLink } from '@/data/docsRegistry';

export interface EscalateToDocsInput {
  topic: string;
}

export interface EscalateToDocsResult {
  topic: string;
  url: string;
  title: string;
}

export function escalateToDocs(
  input: EscalateToDocsInput,
): ToolResponse<EscalateToDocsResult> {
  if (!input?.topic || !input.topic.trim()) {
    return fail(
      'validation',
      '`topic` is required so we can resolve the right Claude Code doc.',
    );
  }
  const link: DocLink = resolveDocLink(input.topic);
  return ok({
    topic: input.topic.trim(),
    url: link.url,
    title: link.title,
  });
}

// ---------------------------------------------------------------------------
// MCP-style spec export (Architect TS 2.1 + S-2 in SYNTHESIS.md).
// ---------------------------------------------------------------------------
export const escalateToDocsSpec = {
  name: 'escalate_to_docs',
  description:
    'Resolve a curated Claude Code documentation URL for a topic the Help Bot ' +
    'could not answer in-app. Always returns a link (falls back to the docs ' +
    'overview when no specific topic matches). Use this as the FINAL step when ' +
    'an escalation has been decided — it is not a search tool, it is the ' +
    'terminal "fall through to the docs" affordance.',
  input_schema: {
    type: 'object',
    required: ['topic'],
    properties: {
      topic: {
        type: 'string',
        description:
          'Short topic keyword (e.g. "permission modes", "headless", "mcp"). ' +
          'Free-form — the resolver matches against curated synonyms.',
      },
    },
    additionalProperties: false,
  },
} as const;
