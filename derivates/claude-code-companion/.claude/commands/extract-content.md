---
description: Run the Scenario 6 extraction pipeline and report new or changed _generated/* files.
---

You are about to run the project's content extraction pipeline. Follow this contract:

1. Run `npm run extract` from the repo root. Capture stdout and stderr.
2. After the script exits, run `git status --short src/data/_generated/` to list new and changed files.
3. For each changed file in `src/data/_generated/`, run `git diff --stat` against it. Do NOT paste full diffs — only the per-file stats.
4. If `npm run extract` exits non-zero, surface the validator's structured error (it prints `errorCategory: 'validation'` or `'business'` per SYNTHESIS.md S-1). Quote the relevant lines verbatim.
5. Report:
   - Adapter used (fixture vs api — read from `scripts/extract/CLAUDE.md` rule 6).
   - Files added / changed / unchanged.
   - Any extraction warnings (`partial`, `ambiguous`).
6. **Do not** edit `_generated/*` by hand. If a record needs fixing, fix the source under `docs/extraction-sources/` or the schema under `scripts/extract/schemas/` and re-run.

See `scripts/extract/extract.ts` for the canonical implementation.
