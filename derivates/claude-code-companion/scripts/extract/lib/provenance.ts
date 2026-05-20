// Provenance helpers — Architect TS 5.6, baked into v0.2 per
// sprints/SYNTHESIS.md S-5 + scenario-6 deepening Gap G.
//
// Every record emitted by the extraction pipeline carries a `_provenance` block:
// where the source lived, the SHA-256 of the source at extraction time, the
// ISO-8601 timestamp, and the schema version that produced it. Re-running with
// an unchanged source yields a byte-identical sha256 — the cheapest possible
// regression detector.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export interface Provenance {
  /** Repo-relative path of the source document. */
  sourcePath: string;
  /** Lowercase hex SHA-256 of the source file at extraction time. */
  sourceHash: string;
  /** ISO-8601 timestamp. Authoritative across re-runs only if `EXTRACT_FROZEN_TIME` is set. */
  extractedAt: string;
  /** Version of the schema that produced this record. Bumps trigger migrations. */
  schemaVersion: number;
  /** Optional line span (1-indexed, inclusive) within the source. */
  lineStart?: number;
  lineEnd?: number;
}

/** Compute provenance for a given source file path. */
export function provenanceFor(
  sourcePath: string,
  schemaVersion: number,
  lineRange?: { start: number; end: number },
): Provenance {
  const content = readFileSync(sourcePath);
  const sourceHash = createHash('sha256').update(content).digest('hex');
  return {
    sourcePath,
    sourceHash,
    extractedAt: extractedAt(),
    schemaVersion,
    ...(lineRange
      ? { lineStart: lineRange.start, lineEnd: lineRange.end }
      : {}),
  };
}

/**
 * ISO timestamp. To make `_generated/` byte-deterministic for CI diffing we
 * read EXTRACT_FROZEN_TIME if set — that's how `npm run extract` produces
 * stable output for a given source. Without it we use the wall clock.
 */
export function extractedAt(): string {
  const frozen = process.env.EXTRACT_FROZEN_TIME;
  if (frozen) return frozen;
  return new Date().toISOString();
}

/** JSON-schema fragment for the `_provenance` field — embedded in every record
 *  schema so the validator rejects records lacking provenance. */
export const provenanceSchema = {
  type: 'object',
  required: ['sourcePath', 'sourceHash', 'extractedAt', 'schemaVersion'],
  properties: {
    sourcePath: { type: 'string', minLength: 1 },
    sourceHash: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    extractedAt: { type: 'string', minLength: 1 },
    schemaVersion: { type: 'integer', minimum: 1 },
    lineStart: { type: 'integer', minimum: 1 },
    lineEnd: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
} as const;
