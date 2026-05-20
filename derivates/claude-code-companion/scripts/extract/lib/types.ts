// Shared types for the extraction pipeline.

export interface FewShotExample {
  user: string;
  assistant: string;
}

/** What an extractor adapter needs to satisfy. Mirrors `src/sdk/types.ts` but
 *  scoped to extraction (no chat history, no tool use, no streaming). */
export interface ExtractAdapter {
  readonly kind: 'fixture' | 'api';
  readonly label: string;
  extract(opts: {
    system: string;
    user: string;
    schema: Record<string, unknown>;
    fewShot: FewShotExample[];
    sourceId: string;
    /** Feedback appended to the user prompt on a retry attempt (Ajv error path).
     *  Set by the orchestrator's retry-with-feedback loop (TS 4.4). */
    feedback?: string;
  }): Promise<unknown>;
}

/**
 * Edge-case classification for extractions that don't yield a full record set.
 * Architect TS 4.4 — "handle edge cases gracefully" — pipeline emits these
 * instead of fabricating data. The schema and the fixture builders both speak
 * the same `kind` taxonomy; the UI can surface a typed banner per category.
 *
 *  - `ambiguous` — source admits two or more equally plausible structurings
 *  - `partial`   — source is on-topic but missing required fields
 *  - `empty`     — source has no extractable content at all
 *  - `conflict`  — source contains internally contradictory information
 */
export interface ExtractionError {
  kind: 'ambiguous' | 'partial' | 'empty' | 'conflict';
  reason: string;
}

export interface SourceDefinition {
  id: string;
  /** Repo-relative path of the authored source. */
  sourcePath: string;
  /** Output path under `src/data/_generated/`. */
  outputPath: string;
  /** Schema version for provenance + migration. */
  schemaVersion: number;
  /** Human-readable label for the orchestrator's log line. */
  label: string;
}
