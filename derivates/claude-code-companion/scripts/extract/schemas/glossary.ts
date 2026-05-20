// Glossary schema — Architect TS 4.3 (JSON Schema via tool_use).
//
// Surfaced to a beginner via a future glossary surface; for v0.2 the typed
// output module lives at `src/data/_generated/glossary.ts` and is ready for
// the UI to consume.

import { provenanceSchema, type Provenance } from '../lib/provenance';

/** Bump on shape changes — migration script (v0.4) keys off this. */
export const GLOSSARY_SCHEMA_VERSION = 1;

export interface GlossaryEntry {
  term: string;
  definition: string;
  aliases?: string[];
  /** If the term belongs to a specific stage of the curriculum. */
  stageId?: string;
  rung: 'B' | 'I' | 'A';
  _provenance: Provenance;
}

export const glossarySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'GlossaryEntry',
  type: 'object',
  required: ['term', 'definition', 'rung', '_provenance'],
  properties: {
    term: {
      type: 'string',
      minLength: 1,
      description: 'The headword (e.g. "plan mode"). Case-preserved as in the source.',
    },
    definition: {
      type: 'string',
      minLength: 20,
      description:
        'One-paragraph beginner-facing definition. ≥ 20 chars to prevent thin extractions.',
    },
    aliases: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      description: 'Other words the source uses for the same concept.',
    },
    stageId: {
      type: 'string',
      pattern: '^s[1-8]$',
      description:
        'Curriculum stage this term anchors to. Omit when the term is cross-stage.',
    },
    rung: {
      type: 'string',
      enum: ['B', 'I', 'A'],
      description:
        'Audience rung — Beginner, Intermediate, Advanced. Required to surface in the right ladder.',
    },
    _provenance: provenanceSchema,
  },
  additionalProperties: false,
} as const;

/** Top-level extraction shape — the pipeline emits an array of entries. */
export const glossaryDocumentSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Glossary',
  type: 'object',
  required: ['entries'],
  properties: {
    entries: {
      type: 'array',
      minItems: 1,
      items: glossarySchema,
    },
  },
  additionalProperties: false,
} as const;
