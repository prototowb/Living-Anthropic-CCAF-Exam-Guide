// Granular tool — full-text regex search over the in-browser source index.
// Architect Scenario 4 (Developer Productivity); TS 2.5 + TS 5.4.
//
// Returns matches as `SourceCitation` records so the TutorView can render them
// uniformly with Scenario 6's provenance (via the `SourceRef` discriminated
// union in `src/agents/schemas/source.ts`).
//
// Cardinality guard:
//   - default `limit` 12; max 50
//   - regex producing > limit*5 raw matches → `errorCategory: 'validation'`
//     so the caller knows to narrow the pattern (NOT a transient error per
//     SYNTHESIS.md S-1 / Scenario 4 deepening task 6).
//
// Comment down-weighting (deepening note): single-line `//` or block `/* */`
// matches are pushed to the bottom of results. We do not exclude them — code
// pointers inside JSDoc are often the most useful.

import { type ToolResponse, ok, fail } from '../../tools/types';
import type { SourceCitation } from '@/agents/schemas';
import { listPaths, getFile, matchGlob } from './sourceIndex';

export interface GrepSourceInput {
  /** A regex pattern. JavaScript flavour, case-insensitive by default. */
  pattern: string;
  /** Restrict to paths matching this glob. Optional. */
  glob?: string;
  /** Max citations to return. Default 12, max 50. */
  limit?: number;
  /** Case-sensitive mode. Default false. */
  caseSensitive?: boolean;
}

export interface GrepSourceResult {
  matches: SourceCitation[];
  /** True if results were truncated to `limit`. Caller may narrow. */
  truncated: boolean;
  /** Raw match count BEFORE truncation. Useful for the cardinality-guard UI. */
  totalMatches: number;
}

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const BROAD_RATIO = 5;

export function grepSource(input: GrepSourceInput): ToolResponse<GrepSourceResult> {
  if (!input.pattern) {
    return fail('validation', '`pattern` is required.');
  }
  const limit = clamp(input.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);

  let re: RegExp;
  try {
    re = new RegExp(input.pattern, input.caseSensitive ? '' : 'i');
  } catch (e) {
    return fail(
      'validation',
      `Pattern is not a valid regex: ${(e as Error).message}.`,
    );
  }

  const paths = input.glob
    ? listPaths().filter((p) => matchGlob(input.glob!, p))
    : listPaths();

  // Two-pass scan: collect raw matches, classify comment matches, sort.
  const raw: Array<SourceCitation & { isComment: boolean }> = [];
  for (const path of paths) {
    const file = getFile(path);
    if (!file) continue;
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        const isComment = looksLikeComment(lines[i]);
        raw.push({
          kind: 'citation',
          path,
          line: i + 1,
          preview: lines[i].slice(0, 200),
          isComment,
        });
        // Cardinality guard short-circuit.
        if (raw.length > limit * BROAD_RATIO) {
          return fail(
            'validation',
            `Pattern "${input.pattern}" matched too many lines (>${
              limit * BROAD_RATIO
            } so far). Narrow the regex or pass a "glob" filter.`,
          );
        }
      }
    }
  }

  // Comment down-weighting — code lines first, comment lines after.
  const sorted = [...raw].sort((a, b) => {
    if (a.isComment === b.isComment) return 0;
    return a.isComment ? 1 : -1;
  });
  const matches: SourceCitation[] = sorted
    .slice(0, limit)
    .map(({ isComment: _ignored, ...c }) => c);

  return ok({
    matches,
    truncated: raw.length > limit,
    totalMatches: raw.length,
  });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function looksLikeComment(line: string): boolean {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('<!--')
  );
}

// ---------------------------------------------------------------------------
// MCP-grade spec (TS 2.1 + SYNTHESIS.md S-2).
// ---------------------------------------------------------------------------
export const grepSourceSpec = {
  name: 'grep_source',
  description:
    "Regex-search the line contents of every indexed source file. Use this FIRST when looking for where a symbol, term, or concept appears. Returns SourceCitation records (path + line + preview). Does NOT read whole files (use read_source_file for that) and does NOT list files by name (use glob_paths). A too-broad pattern returns errorCategory='validation' — narrow the regex or pass a glob filter.",
  input_schema: {
    type: 'object',
    required: ['pattern'],
    properties: {
      pattern: {
        type: 'string',
        description:
          'A JavaScript-flavoured regex. Case-insensitive by default. Use anchors and word boundaries to keep cardinality manageable.',
      },
      glob: {
        type: 'string',
        description:
          'Optional path glob (** for any depth, * within segment). Restricts the search to matching paths only.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'Max number of citations to return. Default 12.',
      },
      caseSensitive: { type: 'boolean', description: 'Default false.' },
    },
    additionalProperties: false,
  },
} as const;
