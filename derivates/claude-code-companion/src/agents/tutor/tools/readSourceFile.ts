// Granular tool — read a slice of a single indexed source file.
// Architect Scenario 4 (Developer Productivity); TS 2.5 "Select and apply built-in
// tools (Read, Write, Edit, Bash, Grep, Glob)". This is the in-browser Read
// equivalent, scoped to the running app's own source.
//
// Auto-truncates beyond 200 lines unless `start`/`end` provided so verbose files
// don't blow up the coordinator's context window (TS 5.4).

import { type ToolResponse, ok, fail } from '../../tools/types';
import { getFile, type SourceFile } from './sourceIndex';

const MAX_DEFAULT_LINES = 200;

export interface ReadSourceFileInput {
  path: string;
  /** 1-indexed start line, inclusive. Defaults to 1. */
  start?: number;
  /** 1-indexed end line, inclusive. Defaults to min(MAX_DEFAULT_LINES, total). */
  end?: number;
}

export interface ReadSourceFileResult {
  path: string;
  lang: SourceFile['lang'];
  /** Returned slice, line by line. */
  lines: string[];
  /** Original 1-indexed start of the slice. */
  startLine: number;
  /** Original 1-indexed end (inclusive) of the slice. */
  endLine: number;
  /** Total lines in the file (so the caller knows if it was truncated). */
  total: number;
  truncated: boolean;
}

export function readSourceFile(
  input: ReadSourceFileInput,
): ToolResponse<ReadSourceFileResult> {
  if (!input.path) {
    return fail('validation', '`path` is required.');
  }
  const file = getFile(input.path);
  if (!file) {
    return fail('business', `No indexed source at "${input.path}".`);
  }
  const allLines = file.content.split('\n');
  const start = clamp(input.start ?? 1, 1, file.lines);
  // Default end: respect MAX_DEFAULT_LINES truncation.
  const requestedEnd = input.end ?? start + MAX_DEFAULT_LINES - 1;
  const end = clamp(requestedEnd, start, file.lines);
  const truncated = end - start + 1 < file.lines && input.end === undefined;
  return ok({
    path: file.path,
    lang: file.lang,
    lines: allLines.slice(start - 1, end),
    startLine: start,
    endLine: end,
    total: file.lines,
    truncated,
  });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// ---------------------------------------------------------------------------
// MCP-grade spec (TS 2.1 + SYNTHESIS.md S-2). snake_case `name` per the
// architect convention for tool definitions exposed to a model.
// Description ≥ 60 chars and disambiguated from grep_source / glob_paths.
// ---------------------------------------------------------------------------
export const readSourceFileSpec = {
  name: 'read_source_file',
  description:
    'Read a slice of a single indexed source file in this project. Use this AFTER grep_source has identified a path — pass the exact path. Auto-truncates to the first 200 lines unless explicit start/end provided. Does NOT search content (use grep_source) and does NOT list files (use glob_paths).',
  input_schema: {
    type: 'object',
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description:
          'Exact source path returned by grep_source or glob_paths, e.g. "src/agents/tutor/coordinator.ts".',
      },
      start: { type: 'integer', minimum: 1, description: '1-indexed first line.' },
      end: { type: 'integer', minimum: 1, description: '1-indexed last line, inclusive.' },
    },
    additionalProperties: false,
  },
} as const;
