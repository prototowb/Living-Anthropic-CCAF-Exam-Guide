// Acceptance harness for the per-file vs cross-file split — Scenario 5
// deepening task B (v0.7).
//
//   $ tsx scripts/ci/eval-split.ts   (part of `npm run review:eval`)
//
// Acceptance, verbatim from the deepening spec: "a planted cross-file bug
// (caller-callee signature mismatch) is caught only by the integration
// pass; per-file pass produces zero findings on it."
//
// Also regression-guards the inverse: a single-file local defect
// (sample-1-typo) must be caught by its per-file pass with an EMPTY
// integration pass — the split must not shuffle local findings into the
// cross-file scope.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReviewSummary } from '../../src/agents/schemas/reviewOutput';
import { runSplitReview } from '../review-pr';
import { findingKey } from './dedupe-findings';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS = resolve(__dirname, '../../docs/sample-prs');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`${GREEN}OK${RESET}     ${label}`);
  } else {
    failures++;
    console.log(`${RED}FAIL${RESET}   ${label}`);
  }
}

// ── Cross-file fixture: only the integration pass may see the bug ─────────
{
  const dir = join(CORPUS, 'sample-6-cross-file');
  const patch = readFileSync(join(dir, 'diff.patch'), 'utf8');
  const expected = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8')) as ReviewSummary;
  const result = runSplitReview('sample-6-cross-file', patch);

  const perFileTotal = result.perFile.reduce((n, f) => n + f.comments.length, 0);
  assert(perFileTotal === 0, `sample-6: per-file pass produces zero findings (got ${perFileTotal})`);
  assert(result.perFile.length === 2, `sample-6: both touched files got a per-file pass (got ${result.perFile.length})`);

  const integrationKeys = new Set(result.integration.map(findingKey));
  const expectedKeys = new Set(expected.comments.map(findingKey));
  assert(
    integrationKeys.size === expectedKeys.size && [...expectedKeys].every((k) => integrationKeys.has(k)),
    'sample-6: integration pass catches exactly the planted cross-file bug',
  );
  assert(
    result.summary.verdict === 'request_changes',
    `sample-6: merged verdict is request_changes (got ${result.summary.verdict})`,
  );
}

// ── Local-defect fixture: per-file pass owns it, integration stays empty ──
{
  const dir = join(CORPUS, 'sample-1-typo');
  const patch = readFileSync(join(dir, 'diff.patch'), 'utf8');
  const expected = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8')) as ReviewSummary;
  const result = runSplitReview('sample-1-typo', patch);

  const perFileKeys = new Set(result.perFile.flatMap((f) => f.comments.map(findingKey)));
  assert(
    expected.comments.every((c) => perFileKeys.has(findingKey(c))),
    'sample-1: local defect is caught by its per-file pass',
  );
  assert(
    result.integration.length === 0,
    `sample-1: integration pass has no findings (got ${result.integration.length})`,
  );
}

console.log('');
if (failures) {
  console.error(`${RED}! ${failures} split acceptance check(s) failed.${RESET}`);
  process.exit(1);
}
console.log(`${GREEN}Per-file/cross-file split meets the deepening task B acceptance bar.${RESET}`);
