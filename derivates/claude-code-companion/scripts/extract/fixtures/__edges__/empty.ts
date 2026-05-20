// Edge-case fixture: empty source.
//
// The source has no extractable content — either truly blank, or a frontmatter-
// only document, or a heading with no body. Pipeline must emit 0 entries and
// the `empty` classification rather than logging a generic "extraction failed"
// (TS 4.4 + 5.1 — typed errors over verbose prose).

import type { ExtractionError } from '../../lib/types';

export interface EmptyEdgeFixture {
  source: string;
  response: {
    entries: never[];
    extractionError: ExtractionError;
  };
}

export const emptyFixture: EmptyEdgeFixture = {
  source: '',
  response: {
    entries: [],
    extractionError: {
      kind: 'empty',
      reason: 'Source document is empty (0 bytes). Nothing to extract.',
    },
  },
};
