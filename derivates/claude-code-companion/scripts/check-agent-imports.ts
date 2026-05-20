// Scenario 3 v0.4 task 13 — coordinator unit-boundary lint.
//
// Walks `src/agents/**/*.ts` and fails (exit 1) if any file imports from
// `@/stores/*` or `@/views/*` (or reaches into `src/stores/` / `src/views/`
// via a relative path). The architect rule the script enforces:
//
//   "No agent module may import from `src/stores/*` or `src/views/*`."
//
// (See `src/agents/CLAUDE.md` rule 2 and `src/views/CLAUDE.md` rule 2 — same
// invariant, opposite directions. The views→agents wall is checked socially
// by the views' rules file; this script checks the agents→stores+views wall
// in CI so a stray import can't sneak in.)
//
// Usage:
//   $ npm run check:agent-imports
//
// Output:
//   - on success: prints "OK — N agent files scanned, no boundary violations."
//   - on failure: prints each violation as `file:line  →  offending import`
//     and exits non-zero.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const AGENTS_ROOT = resolve(REPO_ROOT, 'src/agents');

interface Violation {
  file: string;
  line: number;
  importPath: string;
}

/** Recursively collect every `.ts` (excluding `.d.ts`) under `dir`. */
function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkTs(full));
    } else if (st.isFile() && entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Resolve a relative import (e.g. `../../stores/tutor`) against the
 * importing file's directory, then normalise to a `src/...`-rooted path so
 * we can spot reaches into `src/stores/` or `src/views/` regardless of how
 * deeply nested the importing file is.
 *
 * Returns the normalised path *or* the original `spec` if resolution fails
 * (we still check `spec` directly so `@/stores/*` aliases are caught).
 */
function normaliseImport(importingFile: string, spec: string): string {
  if (spec.startsWith('@/')) return spec;
  if (spec.startsWith('.')) {
    const resolved = resolve(dirname(importingFile), spec);
    const rel = relative(REPO_ROOT, resolved);
    // `rel` is POSIX-ish on macOS/Linux, but normalise just in case.
    return rel.replace(/\\/g, '/');
  }
  return spec;
}

/** Returns true iff the (normalised) import targets `stores/` or `views/`. */
function isBoundaryViolation(normalised: string): boolean {
  return (
    /^@\/stores(\/|$)/.test(normalised) ||
    /^@\/views(\/|$)/.test(normalised) ||
    /^src\/stores(\/|$)/.test(normalised) ||
    /^src\/views(\/|$)/.test(normalised)
  );
}

/**
 * Extract every `from '...'` import (static + dynamic) and re-export
 * specifier from a TS source. Regex-based — fine for our convention-driven
 * codebase; a real AST parser is overkill for a one-rule guard.
 */
function extractImportSpecs(source: string): Array<{ spec: string; line: number }> {
  const re =
    /(?:import|export)\s*(?:[\s\S]*?)\s*from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  const out: Array<{ spec: string; line: number }> = [];
  for (const match of source.matchAll(re)) {
    const spec = match[1] ?? match[2];
    if (!spec) continue;
    const idx = match.index ?? 0;
    const line = source.slice(0, idx).split('\n').length;
    out.push({ spec, line });
  }
  return out;
}

function main() {
  const files = walkTs(AGENTS_ROOT);
  const violations: Violation[] = [];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const { spec, line } of extractImportSpecs(source)) {
      const normalised = normaliseImport(file, spec);
      if (isBoundaryViolation(normalised)) {
        violations.push({
          file: relative(REPO_ROOT, file),
          line,
          importPath: spec,
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(
      `\n✖ Agent boundary violations: ${violations.length} (no src/agents/** file may import from @/stores or @/views).\n`,
    );
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  →  ${v.importPath}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log(`OK — ${files.length} agent files scanned, no boundary violations.`);
}

main();
