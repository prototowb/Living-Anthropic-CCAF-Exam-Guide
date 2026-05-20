// Architect scenarios schema. Source is the local exam-guide PDF excerpt
// (already extracted to `sprints/_exam-guide.txt`). Output drives the
// `/under-the-hood` page's Scenario cards.

import { provenanceSchema, type Provenance } from '../lib/provenance';

export const ARCHITECT_SCENARIOS_SCHEMA_VERSION = 1;

export interface ArchitectScenario {
  /** 1-6, monotonic. */
  number: 1 | 2 | 3 | 4 | 5 | 6;
  /** Verbatim name from the exam guide. */
  name: string;
  /** Verbatim short description, ≤ 600 chars. */
  description: string;
  /** Verbatim "Primary domains:" line, parsed into a list. */
  primaryDomains: string[];
  _provenance: Provenance;
}

export const architectScenarioSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ArchitectScenario',
  type: 'object',
  required: ['number', 'name', 'description', 'primaryDomains', '_provenance'],
  properties: {
    number: { type: 'integer', minimum: 1, maximum: 6 },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    description: { type: 'string', minLength: 1, maxLength: 1200 },
    primaryDomains: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: { type: 'string', minLength: 1 },
    },
    _provenance: provenanceSchema,
  },
  additionalProperties: false,
} as const;

export const architectScenariosDocumentSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ArchitectScenariosDocument',
  type: 'object',
  required: ['scenarios'],
  properties: {
    scenarios: {
      type: 'array',
      minItems: 6,
      maxItems: 6,
      items: architectScenarioSchema,
    },
  },
  additionalProperties: false,
} as const;
