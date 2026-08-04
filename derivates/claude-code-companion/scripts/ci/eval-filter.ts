// Acceptance harness for the independent-reviewer pass — Scenario 5
// deepening task A (v0.6).
//
//   $ npm run review:eval
//
// Walks every fixture under docs/sample-prs/ that ships a `draft.json`
// (a pass-1 ReviewSummary with PLANTED false positives) alongside the usual
// `expected.json` (ground truth) and `diff.patch`, runs the pass-2 filter,
// and scores it:
//
//   - FP strip rate: planted false positives (draft − expected) that the
//     filter dropped. Acceptance: ≥ 80 %.
//   - Blocker retention: true blockers (in expected) that survive.
//     Acceptance: ≤ 5 % dropped (on this corpus size: zero).
//
// Also regression-guards the plain fixtures (no draft.json): their expected
// findings run through the filter and must ALL survive — the filter may
// never eat a ground-truth finding.
//
// Exit 0 on pass, 1 on any acceptance failure — CI-friendly.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReviewSummary } from '../../src/agents/schemas/reviewOutput';
import { filterFindings, parseDiffScope } from '../review-filter';
import { findingKey } from './dedupe-findings';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS = resolve(__dirname, '../../docs/sample-prs');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

let failures = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`${GREEN}OK${RESET}     ${label}`);
  } else {
    failures++;
    console.log(`${RED}FAIL${RESET}   ${label}`);
  }
}

for (const fixture of readdirSync(CORPUS).sort()) {
  const dir = join(CORPUS, fixture);
  const diffPath = join(dir, 'diff.patch');
  const expectedPath = join(dir, 'expected.json');
  const draftPath = join(dir, 'draft.json');
  if (!existsSync(diffPath) || !existsSync(expectedPath)) continue;

  const scope = parseDiffScope(readFileSync(diffPath, 'utf8'));
  const expected = readJson<ReviewSummary>(expectedPath);
  const expectedKeys = new Set(expected.comments.map(findingKey));

  if (existsSync(draftPath)) {
    // Planted-FP fixture: score strip rate + blocker retention.
    const draft = readJson<ReviewSummary>(draftPath);
    const { summary } = filterFindings(draft, scope);
    const keptKeys = new Set(summary.comments.map(findingKey));

    const planted = draft.comments.filter((c) => !expectedKeys.has(findingKey(c)));
    const strippedPlanted = planted.filter((c) => !keptKeys.has(findingKey(c)));
    const stripRate = planted.length ? strippedPlanted.length / planted.length : 1;

    const trueBlockers = expected.comments.filter((c) => c.severity === 'blocker');
    const droppedBlockers = trueBlockers.filter((c) => !keptKeys.has(findingKey(c)));
    const dropRate = trueBlockers.length ? droppedBlockers.length / trueBlockers.length : 0;

    console.log(
      `\n${fixture}: ${planted.length} planted FP, ${trueBlockers.length} true blocker(s) — ` +
        `stripped ${strippedPlanted.length}/${planted.length} FPs, dropped ${droppedBlockers.length} blocker(s)`,
    );
    assert(stripRate >= 0.8, `  FP strip rate ${(stripRate * 100).toFixed(0)}% >= 80%`);
    assert(dropRate <= 0.05, `  true-blocker drop rate ${(dropRate * 100).toFixed(0)}% <= 5%`);
    assert(
      summary.verdict === expected.verdict,
      `  verdict ${summary.verdict} matches expected ${expected.verdict}`,
    );
  } else {
    // Plain fixture: ground truth must pass through the filter untouched.
    const { summary } = filterFindings(expected, scope);
    assert(
      summary.comments.length === expected.comments.length,
      `${fixture}: filter preserves all ${expected.comments.length} ground-truth finding(s)`,
    );
  }
}

console.log('');
if (failures) {
  console.error(`${RED}! ${failures} acceptance check(s) failed.${RESET}`);
  process.exit(1);
}
console.log(`${GREEN}Independent-reviewer pass meets the deepening task A acceptance bar.${RESET}`);
