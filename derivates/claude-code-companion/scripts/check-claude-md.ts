#!/usr/bin/env tsx
// CLAUDE.md hygiene check — Scenario 2 v0.4 task 11.
//
// Walks every CLAUDE.md in the repo (root + per-area). Detects:
//   (a) Direct contradiction — a sub-rule states the opposite verb on the
//       same keyword as a root rule. Heuristic; v0.5 can refine.
//   (b) Verbatim restatement — a rule line appears identically in ≥ 2 files.
//       Subdirectory files should extend the root, not duplicate it.
//
// Exit codes: 0 clean or warnings only; 1 contradictions present.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'dist', '.git', '.proto-gear']);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry === 'CLAUDE.md') acc.push(full);
  }
  return acc;
}

interface RuleLine { file: string; lineNo: number; text: string; norm: string; }

const normalise = (s: string) =>
  s.toLowerCase().replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();

function rulesIn(path: string): RuleLine[] {
  const out: RuleLine[] = [];
  readFileSync(path, 'utf8').split('\n').forEach((raw, idx) => {
    if (!/^\s*(?:\d+\.|-|\*)\s+\S/.test(raw)) return;
    const stripped = raw.replace(/^\s*(?:\d+\.|-|\*)\s+/, '').trim();
    if (stripped.length < 20) return;
    out.push({ file: path, lineNo: idx + 1, text: stripped, norm: normalise(stripped) });
  });
  return out;
}

// Polar verb pairs — opposite intent on the same keyword. Kept narrow so a
// shared word like "must" in one rule and "do not" in another don't trip the
// check unless they sit close to the same keyword.
const POLARITY: Array<[RegExp, RegExp]> = [
  [/\bnever\b/, /\balways\b/],
  [/\bforbidden\b/, /\brequired\b|\bmandatory\b/],
  [/\bdisallow(?:ed)?\b/, /\ballow(?:ed)?\b/],
  [/\bdo not\b|\bdon[''']t\b/, /\b(?:must|always|should)\b/],
];

const KEYWORDS =
  /\b(promise\.all|tool|view|store|markdown|persistence|localstorage|scenario|mandate|subagent|beginner voice|generated|test|mock|cache)\b/g;

// Require the polar verb and the shared keyword within ~6 words of each other
// so structurally independent rules in the same line don't false-positive.
function nearKeyword(norm: string, verb: RegExp, kw: string): boolean {
  const verbMatch = norm.match(verb);
  const kwIdx = norm.indexOf(kw);
  if (!verbMatch || kwIdx < 0 || verbMatch.index === undefined) return false;
  const distance = Math.abs(verbMatch.index - kwIdx);
  return distance <= 60; // ~6 words at ~10 chars each.
}

const kwOf = (line: string) =>
  Array.from(new Set(Array.from(line.toLowerCase().matchAll(KEYWORDS), (m) => m[1])));

function contradicts(a: RuleLine, b: RuleLine): boolean {
  const shared = kwOf(a.text).filter((k) => kwOf(b.text).includes(k));
  if (shared.length === 0) return false;
  for (const [neg, pos] of POLARITY) {
    for (const kw of shared) {
      const aNegNear = nearKeyword(a.norm, neg, kw);
      const bPosNear = nearKeyword(b.norm, pos, kw);
      const aPosNear = nearKeyword(a.norm, pos, kw);
      const bNegNear = nearKeyword(b.norm, neg, kw);
      if ((aNegNear && bPosNear) || (aPosNear && bNegNear)) return true;
    }
  }
  return false;
}

const files = walk(REPO_ROOT);
console.log(`Scanning ${files.length} CLAUDE.md file(s)…`);

const rootPath = files.find((f) => f === join(REPO_ROOT, 'CLAUDE.md'));
if (!rootPath) {
  console.error('! No root CLAUDE.md found at repo root.');
  process.exit(1);
}

const rootRules = rulesIn(rootPath);
const subRules: RuleLine[] = files
  .filter((f) => f !== rootPath)
  .flatMap(rulesIn);

const contradictions: Array<[RuleLine, RuleLine]> = [];
for (const sub of subRules) {
  for (const root of rootRules) {
    if (contradicts(sub, root)) contradictions.push([sub, root]);
  }
}

const byNorm = new Map<string, RuleLine[]>();
for (const r of [...rootRules, ...subRules]) {
  (byNorm.get(r.norm) ?? byNorm.set(r.norm, []).get(r.norm)!).push(r);
}
const restatements = Array.from(byNorm.values()).filter(
  (g) => g.length > 1 && new Set(g.map((r) => r.file)).size > 1,
);

if (restatements.length > 0) {
  console.log(`\n[warn] ${restatements.length} verbatim restatement(s):`);
  for (const g of restatements) {
    const head = g[0].text.slice(0, 70);
    console.log(`  • "${head}${g[0].text.length > 70 ? '…' : ''}"`);
    for (const r of g) console.log(`      ${relative(REPO_ROOT, r.file)}:${r.lineNo}`);
  }
}

if (contradictions.length > 0) {
  console.log(`\n[FAIL] ${contradictions.length} direct contradiction(s):`);
  for (const [sub, root] of contradictions) {
    console.log(`  • sub:  ${relative(REPO_ROOT, sub.file)}:${sub.lineNo}`);
    console.log(`         "${sub.text.slice(0, 80)}"`);
    console.log(`    root: ${relative(REPO_ROOT, root.file)}:${root.lineNo}`);
    console.log(`         "${root.text.slice(0, 80)}"`);
  }
  process.exit(1);
}

console.log(
  contradictions.length + restatements.length === 0
    ? '\n[ok] No contradictions, no verbatim restatements.'
    : '\n[ok] No contradictions. Warnings do not fail the check.',
);
process.exit(0);
