// searchSymbol — symbol-level lookup over the source index.
// Architect Scenario 4 v0.3 (developer productivity).
//
// Faster than free-text grep for "where is X defined?" queries: scans for
// declaration anchors in indexed source and returns one citation per
// declaration. Recognises export forms first, falls back to local forms.

import { type ToolResponse, ok, fail } from '../../tools/types';
import type { SourceCitation } from '@/agents/schemas';
import { listPaths, getFile } from './sourceIndex';

export type SymbolKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'const'
  | 'unknown';

export interface SymbolMatch extends SourceCitation {
  /** Best-effort declaration kind. */
  symbolKind: SymbolKind;
}

export interface SearchSymbolInput {
  /** Exact symbol name (case-sensitive). */
  name: string;
  /** Restrict to a glob — optional. */
  glob?: string;
}

export interface SearchSymbolResult {
  matches: SymbolMatch[];
  totalMatches: number;
}

interface Anchor {
  build: (name: string) => RegExp;
  kind: SymbolKind;
}

const ANCHORS: Anchor[] = [
  { build: (n) => new RegExp(`^\\s*export\\s+function\\s+${escapeName(n)}\\s*[<(]`), kind: 'function' },
  { build: (n) => new RegExp(`^\\s*export\\s+default\\s+function\\s+${escapeName(n)}\\s*[<(]`), kind: 'function' },
  { build: (n) => new RegExp(`^\\s*export\\s+const\\s+${escapeName(n)}\\s*[=:]`), kind: 'const' },
  { build: (n) => new RegExp(`^\\s*export\\s+class\\s+${escapeName(n)}\\b`), kind: 'class' },
  { build: (n) => new RegExp(`^\\s*export\\s+interface\\s+${escapeName(n)}\\b`), kind: 'interface' },
  { build: (n) => new RegExp(`^\\s*export\\s+type\\s+${escapeName(n)}\\b`), kind: 'type' },
  // Non-export forms — lower priority, scanned only if no export anchor matched on this line.
  { build: (n) => new RegExp(`^\\s*function\\s+${escapeName(n)}\\s*[<(]`), kind: 'function' },
  { build: (n) => new RegExp(`^\\s*class\\s+${escapeName(n)}\\b`), kind: 'class' },
];

function escapeName(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function searchSymbol(input: SearchSymbolInput): ToolResponse<SearchSymbolResult> {
  if (!input.name) return fail('validation', '`name` is required.');
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(input.name)) {
    return fail(
      'validation',
      `"${input.name}" is not a valid JS/TS identifier. searchSymbol expects an exact symbol name; for prose, use grep_source.`,
    );
  }

  const matches: SymbolMatch[] = [];
  for (const path of listPaths()) {
    if (input.glob && !matchesGlob(path, input.glob)) continue;
    const file = getFile(path);
    if (!file) continue;
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const hit = classify(lines[i], input.name);
      if (hit) {
        matches.push({
          kind: 'citation',
          path,
          line: i + 1,
          preview: lines[i].slice(0, 200),
          symbolKind: hit,
        });
      }
    }
  }

  return ok({ matches, totalMatches: matches.length });
}

function classify(line: string, name: string): SymbolKind | null {
  for (const anchor of ANCHORS) {
    if (anchor.build(name).test(line)) return anchor.kind;
  }
  return null;
}

function matchesGlob(path: string, glob: string): boolean {
  const pattern =
    '^' +
    glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*\//g, 'DSDS')
      .replace(/\*\*/g, 'DSDS')
      .replace(/\*/g, '[^/]*')
      .replace(/DSDS/g, '(?:.*/)?') +
    '$';
  return new RegExp(pattern).test(path);
}

// ---------------------------------------------------------------------------
// MCP-grade spec.
// ---------------------------------------------------------------------------
export const searchSymbolSpec = {
  name: 'search_symbol',
  description:
    'Find symbol declarations by exact name across indexed TS / Vue files. Faster than grep_source for "where is X defined" queries because it scans only declaration anchors. Use this when you have a valid JS/TS identifier; use grep_source for free-text or punctuation patterns.',
  input_schema: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        description:
          'Exact symbol name — case-sensitive. Must match `[A-Za-z_$][A-Za-z0-9_$]*`.',
      },
      glob: {
        type: 'string',
        description: 'Optional path glob to restrict the search. Same syntax as glob_paths.',
      },
    },
    additionalProperties: false,
  },
} as const;
