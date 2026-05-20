// Shared source-reference shapes.
// Introduced v0.2 per SYNTHESIS.md S-5 (Scenarios 4 + 6 coordination).
//
// Scenario 4's `codebaseResearcher` returns *citations* — snippet-grain pointers
// into source files. Scenario 6's content pipeline emits *provenance* — record-
// grain pointers from `_generated/*` back to the authored markdown / PDF page.
//
// Both are "where did this come from?" pointers, with the same surface (path +
// line span). Modelling them as a discriminated union lets the two scenarios
// share renderers, validators, and downstream consumers without coupling.

/** Snippet-grain pointer — Scenario 4. One per highlighted span. */
export interface SourceCitation {
  kind: 'citation';
  path: string;
  line: number;
  /** ~120 chars max; the matched line plus a hint of context. */
  preview: string;
  /** Optional column for tooltip placement. */
  column?: number;
}

/** Record-grain pointer — Scenario 6. Carried on every extracted record. */
export interface SourceProvenance {
  kind: 'provenance';
  sourcePath: string;
  /** SHA-256 of the source file at extraction time. */
  sourceHash: string;
  lineStart: number;
  lineEnd: number;
  /** ISO-8601 of when extraction ran. */
  extractedAt: string;
  /** Schema version of the producing extractor. Lets migrations target records
   *  produced by a known schema shape. */
  schemaVersion: number;
}

export type SourceRef = SourceCitation | SourceProvenance;

/** JSON Schema fragment for the union. Scripts/* validators compile this with
 *  Ajv; the SPA does not. */
export const sourceRefSchema = {
  oneOf: [
    {
      type: 'object',
      required: ['kind', 'path', 'line', 'preview'],
      properties: {
        kind: { const: 'citation' },
        path: { type: 'string', minLength: 1 },
        line: { type: 'integer', minimum: 1 },
        preview: { type: 'string', maxLength: 240 },
        column: { type: 'integer', minimum: 0 },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: [
        'kind',
        'sourcePath',
        'sourceHash',
        'lineStart',
        'lineEnd',
        'extractedAt',
        'schemaVersion',
      ],
      properties: {
        kind: { const: 'provenance' },
        sourcePath: { type: 'string', minLength: 1 },
        sourceHash: { type: 'string', pattern: '^[a-f0-9]{64}$' },
        lineStart: { type: 'integer', minimum: 1 },
        lineEnd: { type: 'integer', minimum: 1 },
        extractedAt: { type: 'string', format: 'date-time' },
        schemaVersion: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    },
  ],
} as const;

/** Type-narrowing helper for renderers — Vue component templates use this. */
export function isCitation(ref: SourceRef): ref is SourceCitation {
  return ref.kind === 'citation';
}

/** Type-narrowing helper for the pipeline — used in scripts/extract/*. */
export function isProvenance(ref: SourceRef): ref is SourceProvenance {
  return ref.kind === 'provenance';
}
