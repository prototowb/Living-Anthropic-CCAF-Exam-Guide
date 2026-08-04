# CI hooks overlay — Scenario 5 v0.3

> Scenario 2 owns `.claude/settings.json`. Scenario 5 owns this overlay file.
> When the GitHub Actions workflow (v0.4 `.github/workflows/claude-review.yml`)
> sets up the working directory, it writes the JSON below to
> `.claude/settings.local.json`. Claude Code merges `settings.json` and
> `settings.local.json`, with `settings.local.json` winning on conflicts.
>
> This file is a SPEC. It is read by the v0.4 workflow author. It is not itself
> loaded by Claude Code. Keep the JSON below copy-pasteable.

## What this overlay adds vs. the base `settings.json`

The base file (Scenario 2) already denies `Bash(rm *)`, `Bash(git push *)`,
`Bash(curl * | bash)`, and `WebFetch(*)`. The overlay adds:

1. A narrow `WebFetch` allow-list (overriding the base's blanket deny) so the
   CI review can fetch its own PR diff and the prompt body.
2. A `Bash` deny for additional dangerous tokens that don't appear in the
   base file (`shutdown`, `format`, `dd`, `sudo`).
3. A scope-guard hook that consumes `$CLAUDE_TOUCHED_FILES` to refuse edits
   outside the PR's touched-files set. The script already exists at
   `.claude/hooks/scope-guard.sh` with both Scenario 2 and Scenario 5 logic.
4. Environment hint vars the hook reads (`CLAUDE_TOUCHED_FILES`, set by the
   workflow from `git diff origin/main...HEAD --name-only`).

## Generated `.claude/settings.local.json` (write this in CI)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "WebFetch(https://raw.githubusercontent.com/**)",
      "WebFetch(https://docs.github.com/**)",
      "WebFetch(https://api.github.com/**)"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(rm -rf *)",
      "Bash(rmdir *)",
      "Bash(git push *)",
      "Bash(git push:*)",
      "Bash(git reset --hard *)",
      "Bash(git checkout -- *)",
      "Bash(git clean -fd *)",
      "Bash(curl * | bash)",
      "Bash(curl * | sh)",
      "Bash(wget * | bash)",
      "Bash(wget * | sh)",
      "Bash(npm publish *)",
      "Bash(npm run extract:api *)",
      "Bash(sudo *)",
      "Bash(shutdown *)",
      "Bash(dd if=*)",
      "Bash(mkfs *)",
      "Bash(:(){ :|:& };:)",
      "WebFetch(*)"
    ]
  },
  "hooks": {
    "preToolUse": [
      {
        "matcher": { "tool": "Edit" },
        "command": ".claude/hooks/scope-guard.sh"
      },
      {
        "matcher": { "tool": "Write" },
        "command": ".claude/hooks/scope-guard.sh"
      }
    ]
  }
}
```

Notes:

- `WebFetch(*)` appears in BOTH `allow` and `deny`. Claude Code resolves
  most-specific-pattern wins, so the three allow-listed hosts pass and
  everything else is denied. This is the documented pattern — confirm against
  the workflow's smoke test before relying on it.
- The `WebFetch(https://api.github.com/**)` entry is for incremental review
  continuity (deepening task D, landed v0.6) — fetching the prior review
  comment. The workflow itself fetches it with `gh api` before invoking
  claude; the allow-list entry lets the model re-check a finding's status
  mid-review if it needs to.
- All four mandatory deny families from the v0.3 plan are present
  (`Bash(rm *)`, `Bash(git push *)`, `Bash(curl * | bash)`, `WebFetch` outside
  the allow-list). The `sudo`, `shutdown`, `mkfs`, fork-bomb entries are CI-
  hardening on top — cheap to add, expensive to omit.

## Required environment variables (workflow → hook)

The workflow must export these BEFORE invoking `claude -p`:

| Env var | Source | Purpose |
|---|---|---|
| `CLAUDE_TOUCHED_FILES` | `gh api repos/…/pulls/N/files --jq '.[].filename' \| tr '\n' ':'` (v0.6: API-derived — fork code is never checked out) | Colon-separated list read by `scope-guard.sh`. |
| `CLAUDE_PR_NUMBER` | `${{ github.event.pull_request.number }}` | Prior-review fetch (incremental continuity, landed v0.6). |
| `CLAUDE_PROMPT_VERSION` | `grep -oE 'v[0-9]+\\.[0-9]+-[0-9-]+' docs/CI_REVIEW_PROMPT.md \| head -1` | Asserted to equal `ReviewSummary.promptVersion` for drift detection. |

## Manual verification (before v0.4 wires this into Actions)

```bash
# Simulate a CI invocation locally.
export CLAUDE_TOUCHED_FILES="src/views/HomeView.vue:docs/sample-prs/sample-1-typo/diff.patch"
export CLAUDE_TOOL_INPUT_PATH="src/main.ts"   # path NOT in touched set
.claude/hooks/scope-guard.sh
# expect: exit 2 with "scope-guard (CI): refusing to Edit/Write 'src/main.ts'..."
echo "exit=$?"

# Same hook, in-scope path should pass.
export CLAUDE_TOOL_INPUT_PATH="src/views/HomeView.vue"
.claude/hooks/scope-guard.sh
# expect: exit 0
echo "exit=$?"
```

## Cross-references

- Base settings.json: owned by Scenario 2 v0.2 task 5.
- Scope-guard script: `.claude/hooks/scope-guard.sh` (Scenario 2 + Scenario 5
  CI overlay both live in that file).
- Generator-isolation requirement (no `--resume`, fresh process per pass):
  see `sprints/scenario-5-claude-code-in-ci.deepening.md` task C.
- Touched-files derivation: matches the same `git diff origin/main...HEAD`
  pattern that v0.4's review workflow uses to limit the prompt's review scope.
