# Scenario 5 — Claude Code for Continuous Integration

> *Verbatim from the exam guide:* "You are integrating Claude Code into your Continuous Integration/Continuous Deployment (CI/CD) pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimize false positives."
>
> *Primary domains:* Claude Code Configuration & Workflows · Prompt Engineering & Structured Output

## What this scenario teaches the engineer reading the source

The companion's CI is itself a worked example: a real GitHub Actions workflow that runs Claude over each PR with explicit, bounded prompts and hooks-as-safety-gates so destructive operations are denied even if a prompt asks for them. The engineer sees three architect-grade techniques in one runnable artefact: (1) **prompt design for actionable feedback** — scoping to touched files, naming review criteria, hard "do-not-approve" gates; (2) **false-positive minimisation** — structured-output review schemas with confidence thresholds; (3) **defence in depth** — `.claude/settings.json` hooks that the prompt cannot override.

## v0.1 state (already shipped)

Nothing yet. Scenario 5 is v0.4 work per the project plan, but the placeholder card in `/under-the-hood` already names the future file paths.

## v0.2 plan

This scenario is largely deferred to v0.4 by design — but two v0.2 tasks lay groundwork without burning CI budget yet.

1. **Draft `docs/CI_REVIEW_PROMPT.md`.** The actual prompt body Claude will use in CI. Author against three canonical PRs in the repo's history (or three synthetic PRs in `docs/sample-prs/`). Acceptance: a manual run via `claude -p "$(cat docs/CI_REVIEW_PROMPT.md)" --output-format json` against a sample PR produces a structured review with at least three actionable comments and no false positives on the labelled negatives.
2. **Review-output JSON schema.** New file `src/agents/schemas/reviewOutput.ts` defining `ReviewComment = { path; line; severity: 'blocker'|'suggestion'|'nit'; rationale; confidence: 0..1 }` and `ReviewSummary = { comments: ReviewComment[]; verdict: 'approve'|'request_changes'|'comment_only'; confidence: 0..1 }`. Shared with Scenario 6's pipeline. Acceptance: typecheck clean; a draft sample fixture validates.

## v0.3 plan

3. **Local dry-run script.** `scripts/review-pr.ts` that runs `CI_REVIEW_PROMPT.md` against a local branch diff (`git diff main...HEAD --name-only` → loop), emits a structured `ReviewSummary` as JSON. Lets a developer preview Claude's review before push. Acceptance: running it on a hand-prepared "buggy" branch produces the expected blockers; running it on a clean branch produces zero blockers.
4. **`.claude/settings.json` hooks for CI safety.** Pre-commit-class hook denying:
   - `Bash(rm *)`, `Bash(rm -rf *)`, `Bash(git push *)`, `Bash(curl * | bash)`
   - any `WebFetch` outside an allow-list (`raw.githubusercontent.com`, `docs.github.com`)
   - any `Edit`/`Write` outside the PR's touched files (enforced via a `preToolUse` hook script in `.claude/hooks/scope-guard.sh`).
   Acceptance: a prompt that tries `Edit src/main.ts` while the PR only touched `src/views/HomeView.vue` is denied with a clear error.
5. **False-positive corpus.** `docs/sample-prs/` gains 8–12 PR fixtures: half with planted issues (typo, off-by-one, missing await, broken types), half clean. Each fixture is a directory with `diff.patch` + `expected.json` (the canonical review). Acceptance: the v0.3 prompt achieves ≥ 90 % precision on the planted side and ≤ 5 % false-positive rate on the clean side.

## v0.4 plan

6. **`.github/workflows/claude-review.yml`.** Real workflow:
   - Trigger: `pull_request` (opened/synchronize), comment trigger `/claude-review`.
   - Steps: checkout, set up Node, `npm ci`, `git diff origin/main...HEAD --name-only > /tmp/touched`, run `npx claude-code --output-format json -p "$(cat docs/CI_REVIEW_PROMPT.md)"`, parse JSON, post comments via `gh pr review` (blockers → request-changes, suggestions/nits → comment).
   - Concurrency group on PR head, `cancel-in-progress: true`.
   - Required secret `ANTHROPIC_API_KEY`. Honest sandboxing — never run with elevated permissions on PRs from forks.
   - Acceptance: a fresh PR on this repo gets a Claude review within 4 minutes.
7. **Cost ceiling.** `.github/workflows/claude-review.yml` reads a monthly budget from a repo variable and short-circuits with a comment if exceeded. Acceptance: setting the budget to 0 and opening a PR yields a "skipped: monthly budget exhausted" comment, not a billed call.
8. **`/under-the-hood` Scenario 5 card.** Renders the live prompt body, the schema, and the latest run's structured output (read from `.github/last-review.json` published from CI as an artefact and committed to a `_runs` branch for read-only consumption). Acceptance: visitors to `/under-the-hood` see the most recent CI run's review inline.
9. **Prompt-design teaching artefact.** New view `src/views/PromptDissectionView.vue` (or a section on `/under-the-hood`) that annotates each clause of the CI prompt: *"this clause bounds the review to touched files because…"*, *"this clause names the rubric so the model doesn't invent categories…"*. Acceptance: the page renders the prompt with sidebar callouts.

## Risks and open questions

- **CI cost ceiling.** Open question 7 in PROJECT_PLAN.md §10 — needs a real number before v0.4. Without it, an active week could 10x the bill.
- **Fork PRs.** Receiving Claude reviews on fork PRs requires either a write-token escalation (security hazard) or a deferred mode where the workflow runs on `pull_request_target` with hardened sandboxing. Default v0.4 plan: skip forks; revisit in v0.5.
- **Prompt drift.** A six-month-old prompt becomes a liability. Tag the prompt with a version + commit hash in the review output so we can correlate regressions to prompt changes.
- **Schema overlap with the runtime app.** Scenario 5's review schema is similar to Scenario 6's extraction schema. They are different artefacts (one is a CI output, one is build-time content). Keep them in separate files to avoid coupling.

## Cross-cutting notes

- **Scenario 2 (workflows)** — `.claude/settings.json` and the hook scripts live in Scenario 2's directory but their *purpose* (deny destructive ops in CI) is owned by Scenario 5. v0.3 task 4 cross-references.
- **Scenario 6 (structured output)** — the review-output JSON schema (v0.2 task 2) is published through Scenario 6's content pipeline patterns; the *validation* shares utilities.
- **No local-model degradation needed.** Local adapters don't run in CI — GitHub Actions hits the Claude API. `getAdapter().kind` is irrelevant on this path. Document that explicitly in `docs/CI_REVIEW_PROMPT.md`.
