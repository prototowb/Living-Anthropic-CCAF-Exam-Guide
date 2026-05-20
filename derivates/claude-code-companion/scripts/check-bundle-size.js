#!/usr/bin/env node
// Bundle-size guardrail — Scenario 4 v0.2 task 5 + deepening re-prioritisation
// (day-1 budget).
//
// The codebase-researcher (Scenario 4) embeds the project's own source into the
// /tutor route chunk via Vite's `import.meta.glob` with `?raw`. That's powerful
// but the weight scales with `src/**` — bound it explicitly so future authoring
// doesn't silently double the bundle.
//
// Budget: TutorView chunk gzipped ≤ 200 KB. Exits non-zero on regression so CI
// catches it. Run after `vite build`.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST_ASSETS = 'dist/assets';
const BUDGET_BYTES = 200 * 1024;

// We watch the chunk that bundles `tutor/tools/sourceIndex.ts` — the inlined
// `src/**` content. Vite's code-splitter routes that into different chunks
// depending on which route imports first; in v0.3 it landed in the
// `coordinator-*.js` async chunk (lazy-loaded behind /tutor + /debug).
//
// Identify it by content: grep each JS asset for a marker string that the
// source-index module always contains. This is more robust than a name-
// pattern that breaks every time the chunk graph reshuffles.
const SOURCE_INDEX_MARKER = 'codebase-researcher subagent';

function findChunk() {
  let entries;
  try {
    entries = readdirSync(DIST_ASSETS);
  } catch {
    console.error(`! ${DIST_ASSETS} does not exist — did vite build run?`);
    process.exit(1);
  }
  const candidates = entries
    .filter((n) => n.endsWith('.js'))
    .map((n) => join(DIST_ASSETS, n));
  const carrying = candidates.filter((p) => {
    try {
      return readFileSync(p, 'utf8').includes(SOURCE_INDEX_MARKER);
    } catch {
      return false;
    }
  });
  if (carrying.length === 0) {
    console.error(
      `! No chunk found carrying the source-index marker "${SOURCE_INDEX_MARKER}".`,
    );
    console.error(`  Did the codebase-researcher subagent get removed?`);
    process.exit(1);
  }
  // If multiple chunks carry the marker (shouldn't happen with Vite's default
  // splitter), measure the biggest one as the canonical source-index chunk.
  carrying.sort((a, b) => statSync(b).size - statSync(a).size);
  return carrying[0];
}

const chunkPath = findChunk();
const raw = readFileSync(chunkPath);
const gz = gzipSync(raw);

const rawKb = (raw.length / 1024).toFixed(2);
const gzKb = (gz.length / 1024).toFixed(2);
const pct = ((gz.length / BUDGET_BYTES) * 100).toFixed(1);

console.log(`Source-index chunk: ${chunkPath}`);
console.log(`  raw:     ${rawKb} KB`);
console.log(`  gzipped: ${gzKb} KB  (${pct}% of ${BUDGET_BYTES / 1024} KB budget)`);

if (gz.length > BUDGET_BYTES) {
  console.error(
    `! Bundle budget exceeded — gzipped size ${gzKb} KB > ${BUDGET_BYTES / 1024} KB.`,
  );
  console.error(
    '  Likely cause: noisy file added to the source index (src/**). Filter it in src/agents/tutor/tools/sourceIndex.ts.',
  );
  process.exit(1);
}

// Defensive — make sure we're still actually indexing source. A zero-or-near-
// zero TutorView chunk would mean the import.meta.glob path silently produced
// an empty index.
if (raw.length < 5 * 1024) {
  console.warn(
    `? TutorView chunk is suspiciously small (${rawKb} KB raw). Did the source index get filtered out entirely?`,
  );
}

// Surface the file count too, when statSync is convenient.
try {
  const sizes = readdirSync(DIST_ASSETS)
    .map((n) => statSync(join(DIST_ASSETS, n)).size)
    .reduce((a, b) => a + b, 0);
  console.log(`  total assets: ${(sizes / 1024).toFixed(2)} KB`);
} catch {
  /* not load-bearing */
}
