// Granular tool — list indexed source paths matching a glob pattern.
// Architect Scenario 4; TS 2.5 (Glob equivalent over the bundled source index).

import { type ToolResponse, ok, fail } from '../../tools/types';
import { listPaths, matchGlob } from './sourceIndex';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export interface GlobPathsInput {
  /** Glob pattern. Supports `*` (within segment) and `**` (any depth). */
  glob: string;
  /** Max paths to return. Default 200, max 1000. */
  limit?: number;
}

export interface GlobPathsResult {
  paths: string[];
  truncated: boolean;
  totalMatches: number;
}

export function globPaths(input: GlobPathsInput): ToolResponse<GlobPathsResult> {
  if (!input.glob) {
    return fail('validation', '`glob` is required.');
  }
  const limit = Math.max(1, Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT));
  const all = listPaths().filter((p) => matchGlob(input.glob, p));
  return ok({
    paths: all.slice(0, limit),
    truncated: all.length > limit,
    totalMatches: all.length,
  });
}

// ---------------------------------------------------------------------------
// MCP-grade spec (TS 2.1 + SYNTHESIS.md S-2).
// ---------------------------------------------------------------------------
export const globPathsSpec = {
  name: 'glob_paths',
  description:
    'List indexed source paths matching a glob pattern. Use this when you need to enumerate files by name or by directory (e.g. "src/agents/**/*.ts"). Does NOT search content (use grep_source) and does NOT read file bodies (use read_source_file). Returns sorted paths.',
  input_schema: {
    type: 'object',
    required: ['glob'],
    properties: {
      glob: {
        type: 'string',
        description:
          'Pattern with `*` (within segment) and `**` (any depth). Example: "src/agents/**/*.ts".',
      },
      limit: { type: 'integer', minimum: 1, maximum: 1000 },
    },
    additionalProperties: false,
  },
} as const;
