// Local dry-run script — Scenario 5 v0.3 task 3; --split + threshold v0.7.
//
//   $ npm run review:dry                                    # default fixture
//   $ npm run review:dry -- docs/sample-prs/sample-3-async/diff.patch
//   $ npm run review:dry -- docs/sample-prs/sample-6-cross-file/diff.patch --split
//   $ npm run review:dry -- <patch> --raw     # skip the calibrated threshold
//
// --split (deepening task B, TS 4.6): runs the review as N per-file passes
// (scope: one file's local defects each) plus ONE integration pass (scope:
// imports / exports / data-flow across the whole diff), then merges. The
// synthetic registries mirror what two real prompt scopes produce; the
// acceptance fixture is sample-6-cross-file, whose caller-callee signature
// mismatch is INVISIBLE to every per-file pass by construction.
//
// --raw (deepening task F, TS 5.5): emit comments below CONFIDENCE_THRESHOLD
// instead of silencing them. Default output applies the calibrated gate;
// raw output feeds pass 2 (which must see the full draft) and the
// calibration sweep (which must measure unthresholded pipeline output).
//
// Reads a unified `.patch` from a path argument (default sample-1-typo), runs
// the CI review prompt against a deterministic synthetic adapter, and emits a
// `ReviewSummary` as JSON to stdout. The synthetic adapter mirrors the pattern
// at `scripts/extract/lib/fixtureAdapter.ts` — same idea, separate pipeline.
// We do NOT import the extraction fixture adapter: Scenario 5 owns this path
// and coupling to Scenario 6 would let extraction changes silently break CI.
//
// Since v0.6 this script is the CI workflow's PASS-1 dry-run: when no
// ANTHROPIC_API_KEY secret is configured, `.github/workflows/claude-review.yml`
// feeds it the real PR diff (an unknown fixture → clean baseline) instead of
// a `claude -p` call, then runs scripts/review-filter.ts as pass 2. The
// output JSON contract — `ReviewSummary` from
// `src/agents/schemas/reviewOutput.ts` — is identical across dry and real
// modes, which is the whole point of having a schema.

import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  CONFIDENCE_THRESHOLD,
  CURRENT_PROMPT_VERSION,
  deriveVerdict,
  type ReviewComment,
  type ReviewSummary,
  reviewSummarySchema,
} from '../src/agents/schemas/reviewOutput';
import { splitDiffByFile } from './ci/split-diff';

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
  // v0.6 — pass-1 draft WITH planted false positives, for the two-pass demo
  // (use --raw so pass 2 sees the full draft — thresholding happens at the
  // FINAL emission, inside review-filter.ts):
  //   npm run -s review:dry -- docs/sample-prs/sample-5-planted-fp/diff.patch --raw \
  //     | tee /tmp/draft.json >/dev/null && npm run -s review:filter -- \
  //     --draft /tmp/draft.json --diff docs/sample-prs/sample-5-planted-fp/diff.patch
  // The draft is authored in the fixture dir (draft.json) because the
  // acceptance harness (scripts/ci/eval-filter.ts) scores against it too.
  'sample-5-planted-fp': () =>
    JSON.parse(
      readFileSync(resolve(REPO_ROOT, 'docs/sample-prs/sample-5-planted-fp/draft.json'), 'utf8'),
    ) as ReviewSummary,
};

function fixtureIdFromPatchPath(patchPath: string): string {
  // docs/sample-prs/<fixtureId>/diff.patch → <fixtureId>
  const parent = basename(dirname(patchPath));
  return parent;
}

/** Pass-1 synthetic output for a fixture, or null when unregistered. Used by
 *  the calibration sweep (scripts/calibrate-threshold.ts) to reconstruct raw
 *  pipeline predictions without shelling out. */
export function syntheticReviewFor(fixtureId: string): ReviewSummary | null {
  return SYNTHETIC_REVIEWS[fixtureId]?.() ?? null;
}

// ── Split mode (deepening task B) ──────────────────────────────────────────
// Two synthetic registries mirror the two prompt scopes:
//   PER_FILE — what a reviewer scoped to ONE file's diff can see. Keyed
//     `<fixtureId>#<path>`. Unregistered keys fall back to routing the
//     whole-diff synthetic's comments by path (samples 1–5 are all local
//     defects, so their findings ARE per-file findings).
//   INTEGRATION — what only the cross-file pass can see (imports/exports/
//     data-flow). sample-6-cross-file's signature mismatch lives ONLY here:
//     formatPrice.ts's diff is a valid change in isolation and invoice.ts's
//     diff calls a function whose new arity is not visible in that file.

const PER_FILE_REVIEWS: Record<string, ReviewComment[]> = {
  'sample-6-cross-file#src/billing/formatPrice.ts': [],
  'sample-6-cross-file#src/billing/invoice.ts': [],
};

const INTEGRATION_REVIEWS: Record<string, ReviewComment[]> = {
  'sample-6-cross-file': [
    {
      path: 'src/billing/invoice.ts',
      line: 11,
      severity: 'blocker',
      rationale:
        'Caller-callee signature mismatch across files in this PR: `formatPrice` gains a required second `currency` parameter in src/billing/formatPrice.ts, but invoice.ts still calls `formatPrice(discounted)` with one argument (and `formatPrice(i.cents)` on the line above), so the build fails with TS2554 (expected 2 arguments, got 1). Neither file\'s diff shows the defect in isolation.',
      confidence: 0.9,
    },
  ],
};

export interface SplitReview {
  perFile: { path: string; comments: ReviewComment[] }[];
  integration: ReviewComment[];
  summary: ReviewSummary;
}

export function runSplitReview(fixtureId: string, patchText: string): SplitReview {
  const wholeDiff = SYNTHETIC_REVIEWS[fixtureId]?.().comments ?? [];
  const perFile = splitDiffByFile(patchText).map((f) => ({
    path: f.path,
    comments:
      PER_FILE_REVIEWS[`${fixtureId}#${f.path}`] ??
      wholeDiff.filter((c) => c.path === f.path),
  }));
  const integration = INTEGRATION_REVIEWS[fixtureId] ?? [];
  const comments = [...perFile.flatMap((f) => f.comments), ...integration];
  return {
    perFile,
    integration,
    summary: {
      comments,
      verdict: deriveVerdict(comments),
      confidence: 0.9,
      promptVersion: CURRENT_PROMPT_VERSION,
    },
  };
}

/** Calibrated confidence gate (deepening task F) — final-emission silencing.
 *  See CONFIDENCE_THRESHOLD in src/agents/schemas/reviewOutput.ts. */
export function applyConfidenceThreshold(summary: ReviewSummary): ReviewSummary {
  const kept = summary.comments.filter((c) => c.confidence >= CONFIDENCE_THRESHOLD);
  if (kept.length === summary.comments.length) return summary;
  return { ...summary, comments: kept, verdict: deriveVerdict(kept) };
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
  const args = process.argv.slice(2);
  const split = args.includes('--split');
  const raw = args.includes('--raw');
  const argPath = args.find((a) => !a.startsWith('--')) ?? DEFAULT_PATCH;
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

  if (split) {
    const result = runSplitReview(fixtureId, patchText);
    for (const f of result.perFile) {
      process.stderr.write(`[review:dry --split] per-file ${f.path}: ${f.comments.length} finding(s)\n`);
    }
    process.stderr.write(`[review:dry --split] integration: ${result.integration.length} finding(s)\n`);
    const summary = raw ? result.summary : applyConfidenceThreshold(result.summary);
    const splitErr = validateShape(summary);
    if (splitErr) {
      console.error(`! split review for ${fixtureId} failed shape check: ${splitErr}`);
      process.exit(3);
      return;
    }
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    return;
  }

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

  const summary = raw ? builder() : applyConfidenceThreshold(builder());
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

// Only run the CLI when executed directly — eval-split.ts and
// calibrate-threshold.ts import runSplitReview/syntheticReviewFor from here.
if (process.argv[1] && /review-pr\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(`! review-pr crashed: ${(e as Error).stack ?? e}`);
    process.exit(2);
  });
}
