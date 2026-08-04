// Independent-reviewer pass (pass 2) — Scenario 5 deepening task A (v0.6).
//
//   $ npm run review:filter -- --draft <ReviewSummary.json> --diff <diff.patch>
//
// Takes the first pass's draft ReviewSummary plus the PR diff and emits a
// FILTERED ReviewSummary on stdout. In CI's real mode, a second fresh
// `claude -p` runs docs/CI_REVIEW_OF_REVIEW_PROMPT.md and does this job with
// judgement; this script is the deterministic mirror of that prompt's HARD
// rules, used by the dry-run path and by the acceptance harness
// (scripts/ci/eval-filter.ts). Keeping the rules executable means a prompt
// edit that loosens them shows up as a corpus regression, not a vibe.
//
// Rules implemented (numbering matches CI_REVIEW_OF_REVIEW_PROMPT.md):
//   3a. Finding outside the diff (path not touched, or a line-pinned finding
//       whose line was not added) → drop.
//   3b. Preference-shaped rationale (naming / style / idiom / "prefer") →
//       drop, any severity.
//   3c. Hedged rationale ("might", "could potentially", "consider …") with
//       no concrete failure named → drop for suggestion/nit.
//   3d. Duplicate (same path + normalised-rationale hash) → keep first.
//    4. Bias: hedged BLOCKERS are kept — a dropped true blocker costs more
//       than a surviving false one.
//    5. (v0.7, deepening task F) Calibrated confidence gate: comments below
//       CONFIDENCE_THRESHOLD are silenced at this final emission stage.
//       This is the safety valve for rule 4 — a confident-sounding false
//       blocker survives the rules, a low-confidence one dies here.
//       `--raw` skips this gate (used by the calibration sweep, which must
//       see unthresholded pipeline output).
//   1/2. Never adds and never edits findings — kept comments are passed
//       through byte-identical; only the verdict is recomputed.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CONFIDENCE_THRESHOLD } from '../src/agents/schemas/reviewOutput';
import type { ReviewComment, ReviewSummary } from '../src/agents/schemas/reviewOutput';

// ── Diff scope ─────────────────────────────────────────────────────────────

export interface DiffScope {
  /** path → set of post-image line numbers that were ADDED by the diff. */
  addedLines: Map<string, Set<number>>;
}

/** Minimal unified-diff walker. Tracks `+++ b/<path>` targets and `@@` hunks
 *  to record which post-image lines each file gained. */
export function parseDiffScope(patch: string): DiffScope {
  const addedLines = new Map<string, Set<number>>();
  let currentPath: string | null = null;
  let postLine = 0;

  for (const line of patch.split('\n')) {
    const fileHeader = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileHeader) {
      currentPath = fileHeader[1];
      if (!addedLines.has(currentPath)) addedLines.set(currentPath, new Set());
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      postLine = Number(hunk[1]);
      continue;
    }
    if (!currentPath) continue;
    if (line.startsWith('+') && !line.startsWith('+++')) {
      addedLines.get(currentPath)!.add(postLine);
      postLine++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // removed line: post-image line number does not advance
    } else if (line.startsWith(' ') || line === '') {
      postLine++;
    }
  }
  return { addedLines };
}

// ── Filter rules ───────────────────────────────────────────────────────────

const PREFERENCE_RE = /\b(naming|style|idiom|convention|readability|prefer(?:red)?)\b/i;
const HEDGE_RE = /\b(might|could potentially|consider(?:\s+\w+)?)\b/i;

export interface FilterDecision {
  comment: ReviewComment;
  kept: boolean;
  rule: string;
}

export function filterFindings(
  draft: ReviewSummary,
  scope: DiffScope,
  opts: { applyThreshold?: boolean } = {},
): { summary: ReviewSummary; decisions: FilterDecision[] } {
  const applyThreshold = opts.applyThreshold ?? true;
  const decisions: FilterDecision[] = [];
  const seen = new Set<string>();

  for (const c of draft.comments) {
    const added = scope.addedLines.get(c.path);
    if (!added) {
      decisions.push({ comment: c, kept: false, rule: '3a: path not in diff' });
      continue;
    }
    if (c.line > 0 && !added.has(c.line)) {
      decisions.push({ comment: c, kept: false, rule: '3a: line not added by diff' });
      continue;
    }
    if (PREFERENCE_RE.test(c.rationale)) {
      decisions.push({ comment: c, kept: false, rule: '3b: preference, not defect' });
      continue;
    }
    if (HEDGE_RE.test(c.rationale) && c.severity !== 'blocker') {
      decisions.push({ comment: c, kept: false, rule: '3c: hedged non-blocker' });
      continue;
    }
    const key =
      c.path +
      ':' +
      createHash('sha256')
        .update(c.rationale.toLowerCase().replace(/\s+/g, ' ').trim())
        .digest('hex')
        .slice(0, 12);
    if (seen.has(key)) {
      decisions.push({ comment: c, kept: false, rule: '3d: duplicate' });
      continue;
    }
    seen.add(key);
    if (applyThreshold && c.confidence < CONFIDENCE_THRESHOLD) {
      decisions.push({
        comment: c,
        kept: false,
        rule: `5: confidence ${c.confidence} below calibrated threshold ${CONFIDENCE_THRESHOLD}`,
      });
      continue;
    }
    decisions.push({ comment: c, kept: true, rule: c.severity === 'blocker' ? 'kept (blocker bias)' : 'kept' });
  }

  const kept = decisions.filter((d) => d.kept).map((d) => d.comment);
  const verdict: ReviewSummary['verdict'] = kept.some((c) => c.severity === 'blocker')
    ? 'request_changes'
    : kept.length > 0
      ? 'comment_only'
      : 'approve';

  return {
    summary: {
      comments: kept,
      verdict,
      confidence: 0.9,
      promptVersion: draft.promptVersion, // findings stay attributed to pass 1's prompt
    },
    decisions,
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function main() {
  const draftPath = arg('draft');
  const diffPath = arg('diff');
  if (!draftPath || !diffPath) {
    console.error('usage: review-filter.ts --draft <ReviewSummary.json> --diff <diff.patch>');
    process.exit(2);
  }

  const draft = JSON.parse(readFileSync(draftPath, 'utf8')) as ReviewSummary;
  const scope = parseDiffScope(readFileSync(diffPath, 'utf8'));
  const raw = process.argv.includes('--raw');
  const { summary, decisions } = filterFindings(draft, scope, { applyThreshold: !raw });

  for (const d of decisions) {
    console.error(
      `[filter] ${d.kept ? 'KEEP' : 'DROP'} ${d.comment.path}:${d.comment.line} (${d.comment.severity}) — ${d.rule}`,
    );
  }
  console.error(
    `[filter] ${summary.comments.length}/${draft.comments.length} findings survive; verdict=${summary.verdict}`,
  );
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

if (process.argv[1] && /review-filter\.ts$/.test(process.argv[1])) {
  main();
}
