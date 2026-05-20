# Scenario 5 — Deepening pass

> Addendum to `scenario-5-claude-code-in-ci.md`. Reviewed against Task Statements 3.6, 4.1, 4.6, 5.5.

## Architect mandates we are honouring

- **TS 3.6** — non-interactive `-p` invocation and `--output-format json` for machine-parseable findings (v0.2 task 1, v0.4 task 6).
- **TS 3.6** — `.claude/settings.json` hooks as a safety floor independent of prompt (v0.3 task 4).
- **TS 4.1** — separates "blocker / suggestion / nit" rather than relying on vague confidence words (v0.2 task 2).
- **TS 4.1** — false-positive fixture corpus with planted-vs-clean halves and a ≥ 90 % precision / ≤ 5 % FP target (v0.3 task 5).
- **TS 4.6 (partial)** — multi-pass spirit is present in v0.3 task 3's per-file loop.
- **TS 5.5 (partial)** — `confidence: 0..1` lives on every comment and on the verdict (v0.2 task 2).

## Architect mandates we are NOT yet honouring (gaps)

- **TS 4.6 independent-review instance.** The plan runs one prompt, one Claude. The exam guide is explicit: "a second independent Claude instance" without the generator's reasoning context. We have no second pass. → **new task A**, target v0.3.
- **TS 4.6 per-file vs cross-file split.** v0.3 task 3 loops files but feeds them into the same prompt scope, so cross-file integration findings and per-file local findings compete for attention in one context. The mandate is to *separate* the passes. → **new task B**, target v0.3.
- **TS 3.6 session-context isolation.** The exam guide names this verbatim ("same Claude session that generated code is less effective at reviewing its own changes"). Our prompt does not state that the reviewer was *not* the generator, nor enforce it. The CI workflow (v0.4 task 6) must spawn a fresh process per pass and pass *only* the diff plus CLAUDE.md, never any prior session transcript. → **new task C**, target v0.4.
- **TS 3.6 incremental review continuity.** Re-runs after new commits must include prior findings and instruct Claude to surface only *new or still-unaddressed* issues (verbatim from exam guide). v0.4 task 6 does not do this — every push posts a fresh review and risks duplicate comments. → **new task D**, target v0.4.
- **TS 4.1 explicit-criteria depth.** `CI_REVIEW_PROMPT.md` (v0.2 task 1) currently says "actionable feedback / minimise false positives" but does not name the verbatim "flag only when claimed behaviour contradicts actual code behaviour"-class clauses, nor concrete code examples per severity bucket, nor a hard "do-not-approve" gate list. The mandate is *specific categorical criteria* with worked examples per severity. → **new task E**, target v0.2.
- **TS 5.5 calibration mechanics.** `confidence: 0..1` is declared but the plan does not (a) publish the labelled set used to calibrate the threshold, (b) name the threshold below which comments are silenced, or (c) stratify accuracy by severity bucket and file type. → **new task F**, target v0.3.

## Liftable patterns

There is no Scenario-5 code in v0.1 to lift. Instead, **consume** these from siblings:

- `.claude/settings.json` hook plumbing and `preToolUse` script shape — owned by **Scenario 2** v0.2 task 5. Our v0.3 task 4 must extend that file, not author a parallel one.
- `scripts/extract/validate.ts` (Ajv) — **Scenario 6** v0.2 task 4. Our review-output validator must `import` it, not re-build.
- `extractFirstJsonObject` helper at `src/agents/schemas/parse.ts` — **Scenario 6** cross-cutting. Same helper parses CI JSON responses.

## Efficiency wins (shared with other scenarios)

- `.claude/settings.json` hooks: Scenario 2 owns the file, Scenario 5 owns the CI-specific deny-list. Coordinate via a single PR that touches both scenarios' acceptance lists — avoids merge conflicts in v0.3.
- Schemas: `src/agents/schemas/reviewOutput.ts` (this scenario) and Scenario 6's extraction schemas live under the same `src/agents/schemas/` namespace. Shared **validator utility**, **separate schema files** — confirmed by Scenario 6 cross-cutting note 59.
- False-positive corpus (v0.3 task 5): tempting to reuse as bug-pattern training data for Scenario 4's codebase researcher. **Defer** — fixtures are too small and CI-shaped to generalise. Flag and revisit in v0.5.

## Re-prioritised tasks

- **Promote v0.2 task 1 acceptance** to require the explicit-criteria rewrite (new task E) before v0.3 work begins — without it, the v0.3 false-positive corpus measures the wrong prompt.

## New tasks to add

- **Task A — Independent-reviewer pass (TS 4.6).** Sprint v0.3. Files: `scripts/review-pr.ts`, new `docs/CI_REVIEW_OF_REVIEW_PROMPT.md`. Architecture: pass 1 emits `ReviewSummary` draft; pass 2 spawns a **second `claude -p`** with the diff plus the draft and only the question "which of these findings are false positives or low-signal?", returning a filtered `ReviewSummary`. Acceptance: on the v0.3 task 5 corpus, pass-2 strips ≥ 80 % of planted false positives the planted-clean half tries to provoke, without dropping > 5 % of true blockers.
- **Task B — Per-file vs cross-file split (TS 4.6).** Sprint v0.3. Files: `scripts/review-pr.ts`. Run one `claude -p` per touched file (local pass, scope = that file's diff only) and one final `claude -p` over the *list of file summaries* (integration pass, scope = imports/exports/data-flow only). Acceptance: a planted cross-file bug (caller-callee signature mismatch) is caught only by the integration pass; per-file pass produces zero findings on it.
- **Task C — Generator-isolation guarantee (TS 3.6).** Sprint v0.4. Files: `.github/workflows/claude-review.yml`, `docs/CI_REVIEW_PROMPT.md`. The workflow asserts a fresh working directory and a fresh Claude process per pass, with no `--resume` flag and no shared session id. The prompt explicitly states "you did not write this code." Acceptance: a workflow run logged in CI shows distinct process IDs per pass and no `--resume` flag in any `claude` invocation.
- **Task D — Incremental review continuity (TS 3.6).** Sprint v0.4. Files: `.github/workflows/claude-review.yml`. On re-runs, fetch prior `ReviewSummary` from the PR's last bot comment (or the `_runs` branch artefact), pass it into the prompt with a "report only new or still-unaddressed issues" clause, and dedupe by `(path, line, rationale-hash)`. Acceptance: pushing a no-op commit produces zero new comments; pushing a fix for a prior blocker marks it `resolved` instead of repeating it.
- **Task E — Explicit-criteria prompt rewrite (TS 4.1).** Sprint v0.2 (before v0.2 task 1 closes). Files: `docs/CI_REVIEW_PROMPT.md`. Add a `## Severity rubric` section with one code example per bucket; a `## Do-not-approve gates` list naming the four verbatim blockers (security-sensitive `eval`, secret leakage, unawaited promises, broken types); a `## Out of scope` list (style, naming preferences, local idiom). Acceptance: the prompt names ≥ 5 specific categorical criteria and zero of the strings "be conservative" or "high-confidence findings".
- **Task F — Calibrate the confidence threshold (TS 5.5).** Sprint v0.3. Files: `docs/sample-prs/`, new `scripts/calibrate-threshold.ts`. Score every fixture comment against the labelled `expected.json`, sweep thresholds 0.0–1.0 in 0.05 steps, pick the threshold that maximises F1 stratified by severity bucket *and* by file extension. Publish the chosen threshold in `docs/CI_REVIEW_PROMPT.md` and silence comments below it in `scripts/review-pr.ts`. Acceptance: chosen threshold is documented with its labelled-set F1; a stratified table per `(severity, extension)` shows no segment below F1 0.7.
