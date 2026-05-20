// Edge-case fixture: partial source.
//
// The source is on-topic and unambiguous, but missing one or more *required*
// schema fields (TS 4.4). Architect skill bullet: "retries are ineffective
// when info is absent" — pipeline marks the record `partial` and refuses to
// fabricate the missing field rather than looping until tokens run out.

import type { ExtractionError } from '../../lib/types';

export interface PartialEdgeFixture {
  source: string;
  response: {
    entries: never[];
    extractionError: ExtractionError;
  };
}

export const partialFixture: PartialEdgeFixture = {
  source:
    '# Glossary\n\n## Hooks\n\n(Definition forthcoming.)\n',
  response: {
    entries: [],
    extractionError: {
      kind: 'partial',
      reason:
        'Term "Hooks" present but the required `definition` field is absent in the source ("(Definition forthcoming.)" is a placeholder, not a definition). No fabrication.',
    },
  },
};
