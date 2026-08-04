// CI review budget accumulator — Scenario 5 v0.6 (replaces the v0.4
// honest-stub short-circuit that only recognised an exact "0").
//
//   $ tsx scripts/ci/budget.ts check  --ledger <path> --budget <usd> [--month YYYY-MM]
//   $ tsx scripts/ci/budget.ts record --ledger <path> --cost <usd>   [--month YYYY-MM]
//
// The ledger is a month-stamped JSON file persisted on the repo's `_runs`
// branch (never a code branch) by .github/workflows/claude-review.yml:
//
//   { "2026-08": { "spentUsd": 3.75, "runs": 14 }, ... }
//
// `check` prints GitHub-Actions-style output lines to stdout:
//   skip=true|false
//   remaining_usd=<n>
//   spent_usd=<n>
// and exits 0 either way — "over budget" is a routing decision for the
// workflow, not an error. `record` rewrites the ledger file in place and
// prints the new month totals.
//
// Contract notes (architect TS 3.6 cost-control):
//   - Budget unset / empty  → no ceiling; check prints skip=false.
//   - Budget "0"            → hard off-switch; skip=true before any spend
//     (this preserves the v0.4 acceptance test verbatim).
//   - Budget > 0            → skip=true once the month's spend >= budget.
//   - A missing or unparseable ledger file counts as zero spend — a broken
//     ledger must never block reviews (fail-open on read, loud on write).
//   - `--month` exists so the harness can pin the month; CI omits it and
//     the current UTC month is used.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface MonthEntry {
  spentUsd: number;
  runs: number;
}

export type Ledger = Record<string, MonthEntry>;

export function currentUtcMonth(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function readLedger(path: string): Ledger {
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Ledger = {};
    for (const [month, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        entry &&
        typeof entry === 'object' &&
        typeof (entry as MonthEntry).spentUsd === 'number' &&
        typeof (entry as MonthEntry).runs === 'number'
      ) {
        out[month] = {
          spentUsd: (entry as MonthEntry).spentUsd,
          runs: (entry as MonthEntry).runs,
        };
      }
    }
    return out;
  } catch {
    return {}; // fail-open: absent/corrupt ledger = zero spend
  }
}

export interface CheckResult {
  skip: boolean;
  spentUsd: number;
  remainingUsd: number | null; // null = no ceiling configured
  reason: string;
}

export function checkBudget(
  ledger: Ledger,
  month: string,
  budgetRaw: string | undefined,
): CheckResult {
  const spent = ledger[month]?.spentUsd ?? 0;
  const trimmed = (budgetRaw ?? '').trim();
  if (trimmed === '') {
    return { skip: false, spentUsd: spent, remainingUsd: null, reason: 'no budget configured' };
  }
  const budget = Number(trimmed);
  if (!Number.isFinite(budget) || budget < 0) {
    // Misconfigured budget must not silently disable reviews.
    return {
      skip: false,
      spentUsd: spent,
      remainingUsd: null,
      reason: `unparseable budget "${trimmed}" — treating as no ceiling`,
    };
  }
  if (budget === 0) {
    return { skip: true, spentUsd: spent, remainingUsd: 0, reason: 'budget is 0 (hard off-switch)' };
  }
  const remaining = Math.max(0, budget - spent);
  if (spent >= budget) {
    return {
      skip: true,
      spentUsd: spent,
      remainingUsd: remaining,
      reason: `monthly spend $${spent.toFixed(2)} >= budget $${budget.toFixed(2)}`,
    };
  }
  return {
    skip: false,
    spentUsd: spent,
    remainingUsd: remaining,
    reason: `$${remaining.toFixed(2)} of $${budget.toFixed(2)} remaining`,
  };
}

export function recordSpend(ledger: Ledger, month: string, costUsd: number): Ledger {
  const prev = ledger[month] ?? { spentUsd: 0, runs: 0 };
  return {
    ...ledger,
    [month]: {
      // Round to cents so the ledger never accumulates float dust.
      spentUsd: Math.round((prev.spentUsd + costUsd) * 100) / 100,
      runs: prev.runs + 1,
    },
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function main() {
  const cmd = process.argv[2];
  const ledgerPath = arg('ledger');
  if (!ledgerPath) {
    console.error('! --ledger <path> is required');
    process.exit(2);
  }
  const month = arg('month') ?? currentUtcMonth();
  const ledger = readLedger(ledgerPath);

  if (cmd === 'check') {
    const res = checkBudget(ledger, month, arg('budget'));
    console.error(`[budget] ${month}: ${res.reason}`);
    console.log(`skip=${res.skip}`);
    console.log(`spent_usd=${res.spentUsd}`);
    console.log(`remaining_usd=${res.remainingUsd ?? ''}`);
    return;
  }

  if (cmd === 'record') {
    const cost = Number(arg('cost'));
    if (!Number.isFinite(cost) || cost < 0) {
      console.error(`! --cost must be a non-negative number, got "${arg('cost')}"`);
      process.exit(2);
    }
    const next = recordSpend(ledger, month, cost);
    mkdirSync(dirname(ledgerPath), { recursive: true });
    writeFileSync(ledgerPath, JSON.stringify(next, null, 2) + '\n');
    const entry = next[month];
    console.error(`[budget] ${month}: recorded $${cost.toFixed(2)} → $${entry.spentUsd.toFixed(2)} over ${entry.runs} run(s)`);
    console.log(`spent_usd=${entry.spentUsd}`);
    console.log(`runs=${entry.runs}`);
    return;
  }

  console.error('usage: budget.ts <check|record> --ledger <path> [--budget <usd>] [--cost <usd>] [--month YYYY-MM]');
  process.exit(2);
}

// Only run the CLI when executed directly (tsx scripts/ci/budget.ts), not
// when imported by the harness.
if (process.argv[1] && /budget\.ts$/.test(process.argv[1])) {
  main();
}
