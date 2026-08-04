// Confidence-threshold calibration — Scenario 5 deepening task F (v0.7).
//
//   $ npm run review:calibrate            # sweep + table + chosen threshold
//   $ npm run review:calibrate -- --check # assert published constant + F1 bar
//
// Reconstructs RAW post-pass-2 pipeline predictions for every labelled
// fixture in docs/sample-prs/ (raw = no confidence gate — the gate is what
// we are calibrating), scores them against expected.json by
// (path, line, rationale-hash), sweeps thresholds 0.00–1.00 in 0.05 steps,
// and picks the LOWEST threshold achieving the maximum macro-F1 (lowest,
// because every step higher silences borderline TRUE findings on future
// PRs for zero corpus gain).
//
// Prediction reconstruction per fixture:
//   - draft.json present  → pass 1 = the draft, pass 2 = filterFindings
//     (rules only, threshold OFF). This is where the corpus's planted
//     confident-sounding FALSE blocker survives — pass 2's blocker-keep
//     bias lets it through, and it is the calibration's whole reason to
//     exist.
//   - sample-6-cross-file → split review (per-file + integration) through
//     the same raw filter.
//   - plain fixtures      → the synthetic single-pass review, raw.
//
// Acceptance (deepening task F): the chosen threshold is documented with
// its labelled-set F1 (docs/CI_REVIEW_PROMPT.md §Confidence threshold), and
// the stratified table per severity bucket and file extension shows no
// stratum below F1 0.7. `--check` additionally asserts the published
// CONFIDENCE_THRESHOLD constant equals the sweep's choice, so a corpus
// edit that shifts the optimum fails CI until the constant is re-derived.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFIDENCE_THRESHOLD,
  type ReviewComment,
  type ReviewSummary,
} from '../src/agents/schemas/reviewOutput';
import { filterFindings, parseDiffScope } from './review-filter';
import { runSplitReview, syntheticReviewFor } from './review-pr';
import { findingKey } from './ci/dedupe-findings';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS = resolve(__dirname, '../docs/sample-prs');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

interface Labelled {
  fixture: string;
  predictions: ReviewComment[];
  labels: ReviewComment[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function buildCorpus(): Labelled[] {
  const out: Labelled[] = [];
  for (const fixture of readdirSync(CORPUS).sort()) {
    const dir = join(CORPUS, fixture);
    const diffPath = join(dir, 'diff.patch');
    const expectedPath = join(dir, 'expected.json');
    if (!existsSync(diffPath) || !existsSync(expectedPath)) continue;

    const patch = readFileSync(diffPath, 'utf8');
    const scope = parseDiffScope(patch);
    const labels = readJson<ReviewSummary>(expectedPath).comments;

    let pass1: ReviewSummary;
    const draftPath = join(dir, 'draft.json');
    if (existsSync(draftPath)) {
      pass1 = readJson<ReviewSummary>(draftPath);
    } else if (fixture === 'sample-6-cross-file') {
      pass1 = runSplitReview(fixture, patch).summary;
    } else {
      const synthetic = syntheticReviewFor(fixture);
      if (!synthetic) continue;
      pass1 = synthetic;
    }
    // Pass 2, rules only — the confidence gate stays OFF (it is the subject
    // under calibration).
    const { summary } = filterFindings(pass1, scope, { applyThreshold: false });
    out.push({ fixture, predictions: summary.comments, labels });
  }
  return out;
}

// ── Scoring ────────────────────────────────────────────────────────────────

interface Counts {
  tp: number;
  fp: number;
  fn: number;
}

function f1(c: Counts): number {
  // No labels and no predictions: the stratum is vacuously perfect.
  if (c.tp + c.fp + c.fn === 0) return 1;
  const p = c.tp + c.fp === 0 ? 0 : c.tp / (c.tp + c.fp);
  const r = c.tp + c.fn === 0 ? 0 : c.tp / (c.tp + c.fn);
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}

type StratumOf = (c: ReviewComment) => string;
const bySeverity: StratumOf = (c) => c.severity;
const byExtension: StratumOf = (c) => extname(c.path) || '(none)';

function countsAt(
  corpus: Labelled[],
  threshold: number,
  stratumOf: StratumOf | null,
  stratum: string | null,
): Counts {
  const counts: Counts = { tp: 0, fp: 0, fn: 0 };
  for (const { predictions, labels } of corpus) {
    const inStratum = (c: ReviewComment) =>
      stratumOf === null || stratumOf(c) === stratum;
    const labelKeys = new Set(labels.filter(inStratum).map(findingKey));
    const kept = predictions.filter((c) => c.confidence >= threshold && inStratum(c));
    for (const c of kept) {
      if (labelKeys.has(findingKey(c))) counts.tp++;
      else counts.fp++;
    }
    const keptKeys = new Set(kept.map(findingKey));
    for (const k of labelKeys) if (!keptKeys.has(k)) counts.fn++;
  }
  return counts;
}

function strataOf(corpus: Labelled[], stratumOf: StratumOf): string[] {
  const s = new Set<string>();
  for (const { predictions, labels } of corpus) {
    for (const c of [...predictions, ...labels]) s.add(stratumOf(c));
  }
  return [...s].sort();
}

function macroF1(corpus: Labelled[], threshold: number): number {
  const strata = [
    ...strataOf(corpus, bySeverity).map((s) => [bySeverity, s] as const),
    ...strataOf(corpus, byExtension).map((s) => [byExtension, s] as const),
  ];
  const scores = strata.map(([fn_, s]) => f1(countsAt(corpus, threshold, fn_, s)));
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ── Sweep ──────────────────────────────────────────────────────────────────

function main() {
  const check = process.argv.includes('--check');
  const corpus = buildCorpus();
  const totalPreds = corpus.reduce((n, c) => n + c.predictions.length, 0);
  const totalLabels = corpus.reduce((n, c) => n + c.labels.length, 0);
  console.log(
    `Calibration corpus: ${corpus.length} fixture(s), ${totalPreds} raw prediction(s), ${totalLabels} label(s)\n`,
  );

  console.log('threshold  micro-F1  macro-F1');
  let best = { t: 0, macro: -1 };
  for (let i = 0; i <= 20; i++) {
    const t = i * 0.05;
    const micro = f1(countsAt(corpus, t, null, null));
    const macro = macroF1(corpus, t);
    const tag = macro > best.macro ? '  <- new max' : '';
    console.log(`${t.toFixed(2).padEnd(10)} ${micro.toFixed(3).padEnd(9)} ${macro.toFixed(3)}${tag}`);
    if (macro > best.macro + 1e-9) best = { t, macro };
  }
  const chosen = best.t;

  console.log(`\nChosen threshold: ${chosen.toFixed(2)} (lowest t at max macro-F1 ${best.macro.toFixed(3)})`);
  console.log(`Published constant CONFIDENCE_THRESHOLD = ${CONFIDENCE_THRESHOLD}\n`);

  // Stratified table at the chosen threshold.
  console.log('Stratified F1 at chosen threshold:');
  console.log('stratum              tp  fp  fn  F1');
  let worst = 1;
  for (const [dim, stratumOf] of [
    ['severity', bySeverity],
    ['extension', byExtension],
  ] as const) {
    for (const s of strataOf(corpus, stratumOf)) {
      const c = countsAt(corpus, chosen, stratumOf, s);
      const score = f1(c);
      worst = Math.min(worst, score);
      console.log(
        `${(dim + '=' + s).padEnd(20)} ${String(c.tp).padStart(2)}  ${String(c.fp).padStart(2)}  ${String(c.fn).padStart(2)}  ${score.toFixed(3)}`,
      );
    }
  }

  if (check) {
    let bad = 0;
    if (Math.abs(chosen - CONFIDENCE_THRESHOLD) > 1e-9) {
      console.error(
        `${RED}! sweep chose ${chosen.toFixed(2)} but CONFIDENCE_THRESHOLD is ${CONFIDENCE_THRESHOLD} — re-derive the constant.${RESET}`,
      );
      bad++;
    }
    if (worst < 0.7) {
      console.error(`${RED}! a stratum fell below the F1 0.7 acceptance bar (worst: ${worst.toFixed(3)}).${RESET}`);
      bad++;
    }
    if (bad) process.exit(1);
    console.log(`\n${GREEN}Calibration meets the deepening task F acceptance bar.${RESET}`);
  }
}

main();
