// Edge-case fixture: ambiguous source.
//
// The source admits two or more equally plausible structurings — the model
// cannot pick one without fabricating intent. Architect TS 4.4 mandates that
// extraction *fails gracefully* in this case: emit 0 entries plus an explicit
// `extractionError` instead of guessing.
//
// Exercised by `scripts/extract/edges.ts` (npm run extract:edges) — NOT
// registered in sources.ts, because it represents a *test* shape, not a
// production source.

import type { ExtractionError } from '../../lib/types';

export interface AmbiguousEdgeFixture {
  /** Synthetic source text. The "source" never hits disk; it's literal. */
  source: string;
  /** What the pipeline would return for this source. */
  response: {
    entries: never[];
    extractionError: ExtractionError;
  };
}

export const ambiguousFixture: AmbiguousEdgeFixture = {
  source:
    '# Glossary\n\n## Plan\n\nA plan. (Could mean "plan mode" the permission setting, "plan" the planning document, or "plan" the verb. The source provides no disambiguating context.)\n',
  response: {
    entries: [],
    extractionError: {
      kind: 'ambiguous',
      reason:
        'The headword "Plan" is used in three senses in the source (permission mode, planning document, verb). No glossary entry can be emitted without picking one — refusing to guess.',
    },
  },
};
