// CI review-output schema — Scenario 5 v0.2 task 2.
//
// The shape Claude must emit when reviewing a pull request in CI. Lives
// alongside Scenario 6's extraction schemas under `src/agents/schemas/` so they
// share a namespace (per SYNTHESIS.md S-5 / Scenario 6 cross-cutting note).
// The two pipelines share *validator utilities* (`scripts/extract/lib/validate.ts`)
// but never share *schema files* — a CI review and a content extraction are
// different artefacts and must not couple.
//
// Architect mandates encoded here:
//   - TS 4.1 — explicit severity buckets (`blocker | suggestion | nit`) rather
//     than vague confidence words. The CI workflow keys post-action behaviour
//     off `severity` (blocker → request-changes, others → comment).
//   - TS 5.5 — `confidence: 0..1` lives on every comment AND on the summary
//     verdict, so v0.3's calibration sweep (deepening task F) can stratify by
//     severity bucket and silence comments below the chosen threshold.
//   - TS 3.6 prompt-drift correlation — `promptVersion` is carried through CI
//     output so a regression in review quality can be correlated to the exact
//     prompt revision that produced it (see deepening Gap-task C / D).
//
// Schema description fields are all >= 40 chars so v0.3's calibration script
// can render a human-readable table per field without aliasing.

/** A single review finding pinned to a path + line in the PR diff. */
export interface ReviewComment {
  /** Repo-relative path of the touched file the comment applies to. */
  path: string;
  /** 1-indexed line number in the file's post-image (the version after the
   *  PR's changes are applied). 0 means file-level / not line-pinned. */
  line: number;
  /** Severity bucket. `blocker` causes the CI workflow to request changes;
   *  `suggestion` and `nit` post as comments only and never block merge. */
  severity: 'blocker' | 'suggestion' | 'nit';
  /** Plain-English explanation of WHY this is a finding. Must reference the
   *  actual code behaviour, not a stylistic preference. Min 16 chars. */
  rationale: string;
  /** Calibrated confidence in [0, 1]. v0.3 task F sweeps thresholds and
   *  silences comments below the chosen value before posting. */
  confidence: number;
}

/** The full structured review for one PR. Emitted as JSON to stdout by
 *  `scripts/review-pr.ts` and consumed by v0.4's CI workflow. */
export interface ReviewSummary {
  /** Zero or more comments. Empty list is valid — a clean PR has no findings. */
  comments: ReviewComment[];
  /** Aggregated verdict. Mirrors the GitHub review event the workflow posts. */
  verdict: 'approve' | 'request_changes' | 'comment_only';
  /** Aggregated confidence in [0, 1] for the verdict itself. v0.3 task F may
   *  use this independently of per-comment confidence for the auto-merge gate. */
  confidence: number;
  /** Identifier of the prompt revision that produced this summary. Format is
   *  free-form but conventionally `"v<major>.<minor>-<YYYY-MM-DD>"`. Carried
   *  end-to-end through CI so a quality regression can be correlated to a
   *  specific docs/CI_REVIEW_PROMPT.md commit. */
  promptVersion: string;
}

/** JSON Schema for `ReviewComment`. Ajv-compiled by the validator utility in
 *  `scripts/extract/lib/validate.ts` (shared, per SYNTHESIS.md S-5). */
export const reviewCommentSchema = {
  type: 'object',
  required: ['path', 'line', 'severity', 'rationale', 'confidence'],
  additionalProperties: false,
  properties: {
    path: {
      type: 'string',
      minLength: 1,
      description:
        'Repo-relative path of the touched file the comment applies to.',
    },
    line: {
      type: 'integer',
      minimum: 0,
      description:
        '1-indexed line number in the file post-image; 0 means file-level.',
    },
    severity: {
      type: 'string',
      enum: ['blocker', 'suggestion', 'nit'],
      description:
        'Severity bucket; blocker forces request-changes, others comment only.',
    },
    rationale: {
      type: 'string',
      minLength: 16,
      description:
        'Plain-English explanation of why this is a finding, referencing code behaviour.',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description:
        'Calibrated confidence in [0, 1]; v0.3 thresholds silence low values.',
    },
  },
} as const;

/** JSON Schema for `ReviewSummary`. */
export const reviewSummarySchema = {
  type: 'object',
  required: ['comments', 'verdict', 'confidence', 'promptVersion'],
  additionalProperties: false,
  properties: {
    comments: {
      type: 'array',
      items: reviewCommentSchema,
      description:
        'Zero or more ReviewComment objects produced by the review pass.',
    },
    verdict: {
      type: 'string',
      enum: ['approve', 'request_changes', 'comment_only'],
      description:
        'Aggregated verdict; mirrors the GitHub review event the workflow posts.',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description:
        'Aggregated confidence in [0, 1] for the verdict, independent of comments.',
    },
    promptVersion: {
      type: 'string',
      minLength: 1,
      description:
        'Prompt revision identifier carried end-to-end for drift correlation.',
    },
  },
} as const;

/** Sentinel for the prompt body currently shipped in `docs/CI_REVIEW_PROMPT.md`.
 *  Bump on every material change to the prompt; v0.4 CI workflow asserts this
 *  value is present in the emitted ReviewSummary so drift is detectable. */
export const CURRENT_PROMPT_VERSION = 'v1.0-2026-05-20';

/** Type-narrowing helper used by the CI workflow's post-action step. */
export function isBlocker(c: ReviewComment): boolean {
  return c.severity === 'blocker';
}

/** Derive the workflow verdict from a list of comments. Used by both the
 *  dry-run script and the v0.4 GitHub Actions step. */
export function deriveVerdict(
  comments: ReviewComment[],
): 'approve' | 'request_changes' | 'comment_only' {
  if (comments.some(isBlocker)) return 'request_changes';
  if (comments.length === 0) return 'approve';
  return 'comment_only';
}
