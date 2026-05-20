// Local dry-run script — Scenario 5 v0.3 task 3.
//
//   $ npm run review:dry                                    # default fixture
//   $ npm run review:dry -- docs/sample-prs/sample-3-async/diff.patch
//
// Reads a unified `.patch` from a path argument (default sample-1-typo), runs
// the CI review prompt against a deterministic synthetic adapter, and emits a
// `ReviewSummary` as JSON to stdout. The synthetic adapter mirrors the pattern
// at `scripts/extract/lib/fixtureAdapter.ts` — same idea, separate pipeline.
// We do NOT import the extraction fixture adapter: Scenario 5 owns this path
// and coupling to Scenario 6 would let extraction changes silently break CI.
//
// v0.4 will replace this synthetic adapter with a real `claude -p` invocation
// from inside `.github/workflows/claude-review.yml`. The output JSON contract
// — `ReviewSummary` from `src/agents/schemas/reviewOutput.ts` — is stable
// across that swap, which is the whole point of having a schema.

import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  CURRENT_PROMPT_VERSION,
  type ReviewSummary,
  reviewSummarySchema,
} from '../src/agents/schemas/reviewOutput';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_PATCH = 'docs/sample-prs/sample-1-typo/diff.patch';

/**
 * Synthetic adapter — hand-curated `ReviewSummary` per fixture id. Same
 * pattern as the fixture extraction adapter: the pipeline mechanics
 * (load patch → review → emit JSON) are real; the model call is mocked so
 * v0.3 work can verify the wiring offline and without API credits.
 *
 * Lookup key is the fixture directory name (`sample-1-typo`, etc.). For an
 * unknown fixture we emit a clean-PR baseline so the script still produces
 * valid output and the caller can see what shape to expect.
 */
const SYNTHETIC_REVIEWS: Record<string, () => ReviewSummary> = {
  'sample-1-typo': () => ({
    comments: [
      {
        path: 'src/services/userGreeter.ts',
        line: 10,
        severity: 'blocker',
        rationale:
          'Property typo: reads `user.nmae` but the `User` interface declares `name`. At runtime this is `undefined` and the greeting renders as `Hello, undefined (...)!`.',
        confidence: 0.98,
      },
    ],
    verdict: 'request_changes',
    confidence: 0.97,
    promptVersion: CURRENT_PROMPT_VERSION,
  }),
  'sample-2-clean': () => ({
    comments: [],
    verdict: 'approve',
    confidence: 0.92,
    promptVersion: CURRENT_PROMPT_VERSION,
  }),
  'sample-3-async': () => ({
    comments: [
      {
        path: 'src/services/userFetcher.ts',
        line: 10,
        severity: 'blocker',
        rationale:
          'Missing `await`: `fetchUser(id)` returns Promise<User> but line 11 reads `u.name` and `u.email` on the Promise object, producing `undefined <undefined>` at runtime.',
        confidence: 0.97,
      },
    ],
    verdict: 'request_changes',
    confidence: 0.96,
    promptVersion: CURRENT_PROMPT_VERSION,
  }),
  'sample-4-style-only': () => ({
    comments: [],
    verdict: 'approve',
    confidence: 0.9,
    promptVersion: CURRENT_PROMPT_VERSION,
  }),
};

function fixtureIdFromPatchPath(patchPath: string): string {
  // docs/sample-prs/<fixtureId>/diff.patch → <fixtureId>
  const parent = basename(dirname(patchPath));
  return parent;
}

/** Minimal schema check sufficient for the dry-run path. Avoids depending on
 *  Ajv (which lives under `scripts/extract/`); the v0.4 CI workflow can wire
 *  the full Ajv validator from `scripts/extract/lib/validate.ts`. */
function validateShape(s: unknown): string | null {
  if (!s || typeof s !== 'object') return 'not an object';
  const r = s as Record<string, unknown>;
  for (const key of reviewSummarySchema.required) {
    if (!(key in r)) return `missing required field: ${key}`;
  }
  if (!Array.isArray(r.comments)) return 'comments is not an array';
  if (
    r.verdict !== 'approve' &&
    r.verdict !== 'request_changes' &&
    r.verdict !== 'comment_only'
  ) {
    return `verdict not in enum: ${String(r.verdict)}`;
  }
  if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) {
    return 'confidence out of [0, 1]';
  }
  if (typeof r.promptVersion !== 'string' || r.promptVersion.length === 0) {
    return 'promptVersion empty';
  }
  return null;
}

async function main() {
  const argPath = process.argv[2] ?? DEFAULT_PATCH;
  const patchAbs = resolve(REPO_ROOT, argPath);

  let patchText: string;
  try {
    patchText = readFileSync(patchAbs, 'utf8');
  } catch (e) {
    console.error(`! cannot read patch at ${patchAbs}: ${(e as Error).message}`);
    process.exit(2);
    return;
  }

  // Hash the patch — v0.4 CI will use this for the dedup-on-rerun pass (see
  // scenario-5 deepening task D, "Incremental review continuity").
  const patchHash = createHash('sha256').update(patchText).digest('hex').slice(0, 12);

  const fixtureId = fixtureIdFromPatchPath(argPath);
  const builder = SYNTHETIC_REVIEWS[fixtureId];
  if (!builder) {
    // Unknown fixture: emit a baseline "no comments" review so the caller
    // sees the expected shape. Real v0.4 CI will call Claude here.
    const fallback: ReviewSummary = {
      comments: [],
      verdict: 'approve',
      confidence: 0.5,
      promptVersion: CURRENT_PROMPT_VERSION,
    };
    process.stderr.write(
      `! no synthetic review registered for fixture "${fixtureId}" (patch ${patchHash}); ` +
        `emitting empty baseline. Register one in scripts/review-pr.ts to extend the corpus.\n`,
    );
    process.stdout.write(JSON.stringify(fallback, null, 2) + '\n');
    return;
  }

  const summary = builder();
  const err = validateShape(summary);
  if (err) {
    console.error(`! synthetic review for ${fixtureId} failed shape check: ${err}`);
    process.exit(3);
    return;
  }

  process.stderr.write(
    `[review:dry] fixture=${fixtureId} patch=${patchHash} promptVersion=${summary.promptVersion}\n`,
  );
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main().catch((e) => {
  console.error(`! review-pr crashed: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
