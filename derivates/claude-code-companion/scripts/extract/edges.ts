// Edge-case runner — exercises the four `ExtractionError` shapes the pipeline
// must produce when a source can't be cleanly structured (TS 4.4, scenario-6
// v0.3 task 4).
//
//   $ npm run extract:edges
//
// We don't go through `extract.ts` here because edge fixtures aren't production
// sources — they are *expected-shape* assertions on the pipeline's edge-case
// taxonomy. The runner iterates the four fixtures, prints a small report, and
// fails loudly if any fixture violates its declared `kind`.
//
// Why a separate entry point: keeping these out of `SOURCES` prevents them from
// being committed to `src/data/_generated/` on a normal `npm run extract`, while
// still giving content authors a single command to validate the edge shape.

import { ambiguousFixture } from './fixtures/__edges__/ambiguous';
import { partialFixture } from './fixtures/__edges__/partial';
import { emptyFixture } from './fixtures/__edges__/empty';
import { conflictFixture } from './fixtures/__edges__/conflict';
import type { ExtractionError } from './lib/types';

interface EdgeCase {
  id: string;
  expectedKind: ExtractionError['kind'];
  fixture: {
    source: string;
    response: { entries: never[]; extractionError: ExtractionError };
  };
}

const EDGES: EdgeCase[] = [
  { id: 'ambiguous', expectedKind: 'ambiguous', fixture: ambiguousFixture },
  { id: 'partial', expectedKind: 'partial', fixture: partialFixture },
  { id: 'empty', expectedKind: 'empty', fixture: emptyFixture },
  { id: 'conflict', expectedKind: 'conflict', fixture: conflictFixture },
];

function main() {
  console.log('Edge-case fixture report');
  console.log('========================');
  let mismatches = 0;
  for (const edge of EDGES) {
    const { entries, extractionError } = edge.fixture.response;
    const okKind = extractionError.kind === edge.expectedKind;
    const okEntries = Array.isArray(entries) && entries.length === 0;
    const okReason = typeof extractionError.reason === 'string' && extractionError.reason.length > 0;
    const status = okKind && okEntries && okReason ? 'PASS' : 'FAIL';
    if (status === 'FAIL') mismatches++;

    const sourcePreview = edge.fixture.source.length
      ? edge.fixture.source.slice(0, 60).replace(/\n/g, ' ⏎ ')
      : '<empty>';
    console.log(`\n[${status}] ${edge.id}`);
    console.log(`  expected kind:   ${edge.expectedKind}`);
    console.log(`  actual kind:     ${extractionError.kind}`);
    console.log(`  entries length:  ${entries.length} (expected 0)`);
    console.log(`  reason:          ${extractionError.reason}`);
    console.log(`  source preview:  ${sourcePreview}`);
  }
  console.log('\n========================');
  if (mismatches) {
    console.error(`! ${mismatches}/${EDGES.length} edge fixture(s) failed.`);
    process.exit(1);
  }
  console.log(`All ${EDGES.length} edge fixtures match their declared kind.`);
}

main();
