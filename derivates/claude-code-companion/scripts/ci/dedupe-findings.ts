// Incremental-review continuity — Scenario 5 deepening task D (v0.6).
//
//   $ tsx scripts/ci/dedupe-findings.ts --prior <prior.json> --current <current.json>
//
// Compares the current pass's ReviewSummary against the prior run's (fetched
// from the last bot comment on the PR) and splits findings three ways:
//
//   - `new`        — in current, not in prior. The only ones worth a fresh
//                    comment; everything else is noise on a re-run.
//   - `stillOpen`  — in both. Re-reported once with a "still unaddressed"
//                    prefix rather than duplicated verbatim.
//   - `resolved`   — in prior, absent from current. Reported as "✓ resolved"
//                    so the author sees the fix landed.
//
// Identity key is (path, line, rationale-hash) per the deepening spec. The
// rationale is normalised (lowercase, whitespace collapsed) before hashing so
// harmless re-phrasings by the model don't resurrect a finding, while a
// genuinely different rationale at the same location correctly counts as new.
//
// Output is a single JSON object on stdout:
//   { new, stillOpen, resolved, summary }
// where `summary` is a posting-ready ReviewSummary containing only
// new + stillOpen comments and a verdict recomputed from them (a re-run whose
// blockers were all fixed must not keep requesting changes — acceptance:
// "pushing a fix for a prior blocker marks it resolved instead of repeating
// it"; a no-op push produces zero new comments).

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { ReviewComment, ReviewSummary } from '../../src/agents/schemas/reviewOutput';

export function findingKey(c: ReviewComment): string {
  const normalised = c.rationale.toLowerCase().replace(/\s+/g, ' ').trim();
  const hash = createHash('sha256').update(normalised).digest('hex').slice(0, 12);
  return `${c.path}:${c.line}:${hash}`;
}

export interface DedupeResult {
  new: ReviewComment[];
  stillOpen: ReviewComment[];
  resolved: ReviewComment[];
  summary: ReviewSummary;
}

export function verdictFor(comments: ReviewComment[], confidence: number): ReviewSummary['verdict'] {
  if (comments.some((c) => c.severity === 'blocker')) return 'request_changes';
  if (comments.length > 0) return 'comment_only';
  return confidence >= 0.5 ? 'approve' : 'comment_only';
}

export function dedupeFindings(
  prior: ReviewSummary | null,
  current: ReviewSummary,
): DedupeResult {
  const priorByKey = new Map<string, ReviewComment>(
    (prior?.comments ?? []).map((c) => [findingKey(c), c]),
  );
  const currentKeys = new Set(current.comments.map((c) => findingKey(c)));

  const fresh = current.comments.filter((c) => !priorByKey.has(findingKey(c)));
  const stillOpen = current.comments.filter((c) => priorByKey.has(findingKey(c)));
  const resolved = [...priorByKey.values()].filter((c) => !currentKeys.has(findingKey(c)));

  const kept = [...fresh, ...stillOpen];
  return {
    new: fresh,
    stillOpen,
    resolved,
    summary: {
      comments: kept,
      verdict: verdictFor(kept, current.confidence),
      confidence: current.confidence,
      promptVersion: current.promptVersion,
    },
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function readSummary(path: string): ReviewSummary {
  return JSON.parse(readFileSync(path, 'utf8')) as ReviewSummary;
}

function main() {
  const currentPath = arg('current');
  if (!currentPath) {
    console.error('usage: dedupe-findings.ts --current <current.json> [--prior <prior.json>]');
    process.exit(2);
  }
  const current = readSummary(currentPath);

  const priorPath = arg('prior');
  let prior: ReviewSummary | null = null;
  if (priorPath) {
    try {
      prior = readSummary(priorPath);
    } catch (e) {
      // A malformed prior comment must not block the review — treat as a
      // first run and say so loudly.
      console.error(`! could not parse prior summary at ${priorPath}: ${(e as Error).message} — treating as first run`);
    }
  }

  const result = dedupeFindings(prior, current);
  console.error(
    `[dedupe] new=${result.new.length} stillOpen=${result.stillOpen.length} resolved=${result.resolved.length}`,
  );
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

if (process.argv[1] && /dedupe-findings\.ts$/.test(process.argv[1])) {
  main();
}
