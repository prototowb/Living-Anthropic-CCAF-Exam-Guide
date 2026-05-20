// Generated-data types — hand-authored *types* for the pipeline-generated
// *content* in this directory. The schemas live in `scripts/extract/schemas/*`;
// these mirror them as TS interfaces for the SPA (since the SPA must not
// import Ajv).
//
// Bump `_provenance.schemaVersion` in lockstep with the corresponding schema
// version constants in `scripts/extract/schemas/`. The migration script
// (v0.4) reads `_provenance.schemaVersion` and regenerates outdated records.

export interface Provenance {
  sourcePath: string;
  sourceHash: string;
  extractedAt: string;
  schemaVersion: number;
  lineStart?: number;
  lineEnd?: number;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  aliases?: string[];
  stageId?: string;
  rung: 'B' | 'I' | 'A';
  _provenance: Provenance;
}

export interface ArchitectScenario {
  number: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  description: string;
  primaryDomains: string[];
  _provenance: Provenance;
}

/**
 * Edge-case classification surfaced by the extraction pipeline when a source
 * does not admit a clean structuring (TS 4.4 graceful edge-case handling).
 * Mirrors `scripts/extract/lib/types.ts#ExtractionError` so the UI can render
 * the same taxonomy without re-importing pipeline types.
 */
export interface ExtractionError {
  kind: 'ambiguous' | 'partial' | 'empty' | 'conflict';
  reason: string;
}
