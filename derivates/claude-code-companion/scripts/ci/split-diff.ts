// Per-file diff splitter — Scenario 5 deepening task B (v0.7).
//
//   $ tsx scripts/ci/split-diff.ts <full.diff> <out-dir>
//
// Splits one unified diff into one .patch per touched file so the review
// pipeline can run its PER-FILE pass (scope: one file's local defects) with
// one model call per file, before the single INTEGRATION pass (scope:
// imports / exports / data-flow across the whole diff). Used by
// scripts/review-pr.ts --split (dry mode) and by the CI workflow's
// real-mode loop.
//
// File names are the touched path with '/' → '__' plus '.patch', so
// `src/billing/invoice.ts` lands at `<out-dir>/src__billing__invoice.ts.patch`.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface FileDiff {
  path: string;
  patch: string;
}

export function splitDiffByFile(diff: string): FileDiff[] {
  const out: FileDiff[] = [];
  // Each per-file section starts at a `diff --git` line.
  const sections = diff.split(/^(?=diff --git )/m).filter((s) => s.startsWith('diff --git'));
  for (const section of sections) {
    // Post-image path from `+++ b/<path>` (falls back to the a/ path for
    // deletions, which still deserve a per-file look).
    const path =
      section.match(/^\+\+\+ b\/(.+)$/m)?.[1] ??
      section.match(/^--- a\/(.+)$/m)?.[1];
    if (!path) continue;
    out.push({ path, patch: section });
  }
  return out;
}

function main() {
  const [diffPath, outDir] = process.argv.slice(2);
  if (!diffPath || !outDir) {
    console.error('usage: split-diff.ts <full.diff> <out-dir>');
    process.exit(2);
  }
  const files = splitDiffByFile(readFileSync(diffPath, 'utf8'));
  mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    const name = f.path.replace(/\//g, '__') + '.patch';
    writeFileSync(join(outDir, name), f.patch);
    console.log(`${f.path}\t${join(outDir, name)}`);
  }
  console.error(`[split-diff] ${files.length} file(s)`);
}

if (process.argv[1] && /split-diff\.ts$/.test(process.argv[1])) {
  main();
}
