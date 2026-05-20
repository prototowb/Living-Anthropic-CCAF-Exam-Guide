#!/usr/bin/env bash
# scope-guard.sh — preToolUse hook for Edit / Write
#
# Refuses edits to checked-in generated content and to documentation extraction
# sources owned by Scenario 6. The shell-level deny here is belt-and-braces:
# the same paths are listed under permissions.deny in .claude/settings.json.
#
# Exit 0 = allow. Exit 2 = deny (Claude surfaces the message to the user).

set -euo pipefail

# Claude Code passes the candidate path as $CLAUDE_TOOL_INPUT_PATH on preToolUse
# Edit/Write hooks. Fall back to scanning $@ for compatibility.
candidate="${CLAUDE_TOOL_INPUT_PATH:-${1:-}}"

if [[ -z "$candidate" ]]; then
  exit 0
fi

case "$candidate" in
  src/data/_generated/*)
    echo "scope-guard: src/data/_generated/* is owned by 'npm run extract' (Scenario 6). Edit the source under docs/extraction-sources/ or the schema under scripts/extract/schemas/ instead." >&2
    exit 2
    ;;
  docs/extraction-sources/*)
    echo "scope-guard: docs/extraction-sources/* is read-only for Scenario 2 work — Scenario 6 owns it." >&2
    exit 2
    ;;
  *.lock|package-lock.json)
    echo "scope-guard: lockfiles are produced by package managers, not edited by hand." >&2
    exit 2
    ;;
esac

# --- CI overlay (Scenario 5) -------------------------------------------------
# When running inside the CI review workflow, $CLAUDE_TOUCHED_FILES is set to
# a newline- or colon-separated list of repo-relative paths the current PR
# actually touched. Any Edit/Write whose candidate path is NOT on that list is
# rejected — defence-in-depth against a prompt that tries to "fix up" files
# outside the PR's scope.
#
# Unset / empty $CLAUDE_TOUCHED_FILES means we are NOT in CI; the overlay is
# a no-op and local development is unaffected.

if [[ -n "${CLAUDE_TOUCHED_FILES:-}" ]]; then
  # Normalise: replace ':' separators with newlines, strip leading './'.
  normalised_candidate="${candidate#./}"
  in_scope=0
  while IFS= read -r touched; do
    [[ -z "$touched" ]] && continue
    touched="${touched#./}"
    if [[ "$normalised_candidate" == "$touched" ]]; then
      in_scope=1
      break
    fi
  done < <(printf '%s\n' "$CLAUDE_TOUCHED_FILES" | tr ':' '\n')

  if [[ "$in_scope" -eq 0 ]]; then
    echo "scope-guard (CI): refusing to Edit/Write '$candidate' — not in CLAUDE_TOUCHED_FILES. The CI review prompt may only modify files actually touched by this PR." >&2
    exit 2
  fi
fi

exit 0
