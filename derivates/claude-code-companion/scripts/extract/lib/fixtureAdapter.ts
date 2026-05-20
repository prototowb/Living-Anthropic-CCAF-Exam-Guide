// Fixture adapter — deterministic v0.2 extractor.
//
// The pipeline architecture is real: `extract.ts` builds a schema-constrained
// request and asks an adapter for a parsed result. The *adapter* picks which
// implementation answers: fixture (here) or api (Claude). For v0.2 we ship the
// fixture path so `npm run extract` works offline and is byte-deterministic.
//
// The fixtures encode the canonical extraction for each source ID. Treating
// these as ground truth lets us verify the pipeline mechanics — schema
// validation, provenance attachment, re-run idempotency — without burning
// API credits or making the v0.2 build depend on network.
//
// The v0.3+ `apiAdapter` will call Claude via `realAdapter.ts`'s tool_use path
// (already wired in v0.2 shared primitives). Same `extract()` signature; the
// fixture is then a *regression baseline* the apiAdapter is graded against.

import type { ExtractAdapter, FewShotExample } from './types';
import { provenanceFor } from './provenance';
import { glossaryFixture } from '../fixtures/glossary';
import { architectScenariosFixture } from '../fixtures/architectScenarios';
import { GLOSSARY_SCHEMA_VERSION } from '../schemas/glossary';
import { ARCHITECT_SCENARIOS_SCHEMA_VERSION } from '../schemas/architectScenarios';

interface FixtureBuilder {
  build(sourcePath: string): unknown;
}

const REGISTRY: Record<string, FixtureBuilder> = {
  glossary: {
    build(sourcePath: string) {
      // Attach real provenance computed from the actual source file so the
      // pipeline's idempotency check (rerun → identical hash) is meaningful.
      const prov = provenanceFor(sourcePath, GLOSSARY_SCHEMA_VERSION);
      return {
        entries: glossaryFixture.map((entry) => ({
          ...entry,
          _provenance: { ...prov },
        })),
      };
    },
  },
  architectScenarios: {
    build(sourcePath: string) {
      return {
        scenarios: architectScenariosFixture.map((s) => {
          const prov = provenanceFor(sourcePath, ARCHITECT_SCENARIOS_SCHEMA_VERSION, {
            start: s.lineStart,
            end: s.lineEnd,
          });
          // strip the lineStart/lineEnd off the fixture; they're now on _provenance
          const { lineStart: _ls, lineEnd: _le, ...rest } = s;
          void _ls;
          void _le;
          return { ...rest, _provenance: prov };
        }),
      };
    },
  },
};

export const fixtureAdapter: ExtractAdapter = {
  kind: 'fixture',
  label: 'fixture (deterministic)',
  async extract(opts: {
    system: string;
    user: string;
    schema: Record<string, unknown>;
    fewShot: FewShotExample[];
    sourceId: string;
  }) {
    const builder = REGISTRY[opts.sourceId];
    if (!builder) {
      throw new Error(
        `fixtureAdapter has no fixture for sourceId="${opts.sourceId}". Add one under scripts/extract/fixtures/.`,
      );
    }
    // The system / user / schema / fewShot args are inputs to a *real* model
    // call. For the fixture adapter we don't use them — we just verify the
    // shape is sensible and return the canonical answer. v0.3 will swap this
    // module for one that ACTUALLY uses these arguments.
    if (!opts.schema || typeof opts.schema !== 'object') {
      throw new Error('extract() called without a schema.');
    }
    if (opts.fewShot.length < 2 || opts.fewShot.length > 4) {
      throw new Error(
        `extract() requires 2-4 few-shot examples (architect TS 4.2); got ${opts.fewShot.length}.`,
      );
    }
    return builder.build(extractSourcePath(opts.user));
  },
};

/** The user prompt embeds the source path on the first line as
 *  `Source: <path>` — this lets the fixture builder compute provenance
 *  against the *actual* file the orchestrator loaded. */
function extractSourcePath(user: string): string {
  const first = user.split('\n', 1)[0];
  const match = /^Source:\s+(\S+)/.exec(first);
  if (!match) {
    throw new Error('extractSourcePath: user prompt must start with `Source: <path>`.');
  }
  return match[1];
}
