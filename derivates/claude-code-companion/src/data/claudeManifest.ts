// Hand-authored manifest of every file under `.claude/**` in this repo.
//
// Why hand-authored: `import.meta.glob` only walks paths under `/src/**`. The
// `.claude/` directory lives at the repo root, so the Scenario 2 inspector
// cannot materialise its listing automatically. The trade-off: a maintainer
// adding a new `.claude/**` file must append one entry here. The CLAUDE.md
// hygiene check (`scripts/check-claude-md.ts`) is the closest live-binding we
// have; the inspector is intentionally a "frozen at v0.4" snapshot.
//
// Naming note: this file would semantically live at
// `src/data/_generated/claudeManifest.ts`, but the `_generated/` directory is
// owned by the Scenario 6 extraction pipeline (and the scope-guard hook denies
// hand edits there). Living at `src/data/claudeManifest.ts` keeps the file
// editable without bypassing the guard.

export type ClaudeManifestKind =
  | 'command'
  | 'skill'
  | 'rule'
  | 'output-style'
  | 'hook'
  | 'settings';

export interface ClaudeManifestEntry {
  /** Repo-relative path, e.g. `.claude/commands/author-lesson.md`. */
  path: string;
  /** Bucket the file belongs to. Drives the chip colour in the inspector. */
  kind: ClaudeManifestKind;
  /** One-line purpose (≤ 80 chars). Shown next to the path. */
  purpose: string;
  /** First ~12 lines of the file, kept as a static preview. Optional. */
  bodyPreview?: string;
}

export const claudeManifest: ClaudeManifestEntry[] = [
  // --- settings -----------------------------------------------------------
  {
    path: '.claude/settings.json',
    kind: 'settings',
    purpose: 'Project permissions allow/deny + preToolUse hooks for Edit/Write.',
    bodyPreview: [
      '{',
      '  "$schema": "https://json.schemastore.org/claude-code-settings.json",',
      '  "permissions": {',
      '    "allow": [',
      '      "Read(**)",',
      '      "Grep(**)",',
      '      "Edit(src/**)",',
      '      "Edit(scripts/**)",',
      '      "Bash(npm run typecheck)",',
      '      "Bash(git status)",',
      '      …',
      '    ],',
    ].join('\n'),
  },

  // --- commands -----------------------------------------------------------
  {
    path: '.claude/commands/author-lesson.md',
    kind: 'command',
    purpose: 'Author a new micro-lesson tied to a stage, in beginner voice.',
    bodyPreview: [
      '---',
      'description: Author a new micro-lesson tied to a stage, in the project\'s beginner voice.',
      '---',
      '',
      'You are about to add a new lesson to `src/data/lessons.ts`. Follow this contract:',
      '',
      '1. Ask which stage (`s1` … `s8`) the lesson anchors to.',
      '2. Ask which format: `reorder`, `blanks`, `mcq`, `flow-builder`.',
      '3. Read `src/data/types.ts` to confirm the lesson shape.',
      '4. Generate an id of the form `l-<stageId>-<format>-<slug>`.',
      '5. Add the lesson object to the `lessons` array.',
      '6. Append the new id to `stages.lessonIds`.',
    ].join('\n'),
  },
  {
    path: '.claude/commands/explain-this.md',
    kind: 'command',
    purpose: 'Run the codebase researcher against a focused file and report findings.',
    bodyPreview: [
      '---',
      'description: Run the codebase researcher against the currently focused file and report findings.',
      '---',
      '',
      '1. Identify the focused file. If unclear, ask for an absolute path.',
      '2. Use `grep_source` to find references to the file\'s primary export.',
      '3. Use `read_source_file` to read the focused file — first 200 lines.',
      '4. Summarise: what it does, who calls it, deps, surface contract.',
      '5. Cite every claim with `path:line`.',
      '6. Beginner-voice rule does NOT apply here.',
    ].join('\n'),
  },
  {
    path: '.claude/commands/extract-content.md',
    kind: 'command',
    purpose: 'Run the Scenario 6 extraction pipeline and report _generated changes.',
    bodyPreview: [
      '---',
      'description: Run the Scenario 6 extraction pipeline and report new or changed _generated/* files.',
      '---',
      '',
      '1. Run `npm run extract` from the repo root.',
      '2. Run `git status --short src/data/_generated/` to list changes.',
      '3. For each changed file, run `git diff --stat` — stats only.',
      '4. On non-zero exit, surface the validator\'s structured error.',
      '5. Report: adapter used, files added/changed, warnings.',
      '6. Do NOT edit `_generated/*` by hand.',
    ].join('\n'),
  },
  {
    path: '.claude/commands/review-component.md',
    kind: 'command',
    purpose: 'Review one Vue component with the Scenario 5 CI review rubric.',
    bodyPreview: [
      '---',
      'description: Review one Vue component file with the Scenario 5 CI review rubric, narrowed to that file.',
      '---',
      '',
      '1. Identify the component file. Must end in `.vue`.',
      '2. Read the file in full.',
      '3. Score: store boundary, markdown funnel, beginner voice, props, persistence.',
      '4. Output one section per finding with `path:line`.',
      '5. STATUS: changes-required if any must-fix.',
      '',
      'This prompt body is shared with `.github/workflows/claude-review.yml`.',
    ].join('\n'),
  },

  // --- skills -------------------------------------------------------------
  {
    path: '.claude/skills/lesson-quality/SKILL.md',
    kind: 'skill',
    purpose: 'Gate edits to `src/data/lessons.ts` against three quality bars.',
    bodyPreview: [
      '---',
      'name: lesson-quality',
      'description: Gate edits to lessons in src/data/lessons.ts. Use whenever the user edits, adds, or reviews a lesson.',
      'allowed-tools: Read, Grep, Edit, Bash(npm run typecheck)',
      'argument-hint: <lesson-id-or-path>',
      '---',
      '',
      '# lesson-quality',
      '',
      'Verifies every change to `src/data/lessons.ts` upholds the three quality bars.',
      '',
      '## Checks',
    ].join('\n'),
  },
  {
    path: '.claude/skills/sandbox-author/SKILL.md',
    kind: 'skill',
    purpose: 'Scaffold a new sandbox: transcript JSON + component + index registration.',
    bodyPreview: [
      '---',
      'name: sandbox-author',
      'description: Scaffold a new interactive sandbox.',
      'allowed-tools: Read, Edit, Write, Bash(npm run typecheck)',
      'argument-hint: <sandbox-slug> <stage-id>',
      '---',
      '',
      '# sandbox-author',
      '',
      'Scaffolds the three files a sandbox needs and registers it.',
      '',
      '## Contract',
    ].join('\n'),
  },
  {
    path: '.claude/skills/stage-author/SKILL.md',
    kind: 'skill',
    purpose: 'Author or extend a beginner-curriculum stage (S1–S8).',
    bodyPreview: [
      '---',
      'name: stage-author',
      'description: Author or extend a beginner-curriculum stage (S1–S8).',
      'allowed-tools: Read, Edit, Write, Bash(npm run typecheck)',
      'argument-hint: <stage-id>',
      '---',
      '',
      '# stage-author',
      '',
      'Helps Claude author a stage of the beginner curriculum without drifting.',
      '',
      '## Contract',
    ].join('\n'),
  },

  // --- rules --------------------------------------------------------------
  {
    path: '.claude/rules/data.md',
    kind: 'rule',
    purpose: 'Path-specific rules for the data layer (glob: src/data/**).',
    bodyPreview: [
      '---',
      'description: Path-specific rules for the data layer. Glob-scoped per TS 3.3.',
      'paths:',
      '  - "src/data/**"',
      '---',
      '',
      '# Data layer rules (glob-scoped)',
      '',
      'These rules are activated by path glob `src/data/**`.',
      '',
      '1. Pure data, no side effects.',
      '2. Types live in `src/data/types.ts`.',
    ].join('\n'),
  },
  {
    path: '.claude/rules/tests.md',
    kind: 'rule',
    purpose: 'Path-specific rules for test files (glob: **/*.test.ts, **/*.spec.ts).',
    bodyPreview: [
      '---',
      'description: Path-specific rules for test files. Glob-scoped per TS 3.3.',
      'paths:',
      '  - "**/*.test.ts"',
      '  - "**/*.spec.ts"',
      '---',
      '',
      '# Test rules (glob-scoped)',
      '',
      'Placeholder: no tests in the repo yet.',
      '',
      '1. `vi.mock` for SDK adapters.',
    ].join('\n'),
  },
  {
    path: '.claude/rules/views.md',
    kind: 'rule',
    purpose: 'Path-specific rules for Vue views (glob: src/views/**).',
    bodyPreview: [
      '---',
      'description: Path-specific rules for Vue views. Glob-scoped per TS 3.3.',
      'paths:',
      '  - "src/views/**"',
      '---',
      '',
      '# Views rules (glob-scoped)',
      '',
      '1. One concept per view.',
      '2. No agent imports.',
      '3. Stores only via composition API helpers.',
    ].join('\n'),
  },

  // --- output-style -------------------------------------------------------
  {
    path: '.claude/output-styles/companion.md',
    kind: 'output-style',
    purpose: 'Response shape: terse, citations, no trailing summaries, status reports.',
    bodyPreview: [
      '---',
      'name: companion',
      'description: Response shape for the Claude Code Companion repo — terse, file-paths-with-line-numbers, no trailing summaries.',
      '---',
      '',
      '# companion output style',
      '',
      'Locks how Claude replies while working in this repo.',
      '',
      '## Shape',
      '',
      '- Lead with the answer. No preamble.',
      '- Announce intent before any multi-step action.',
    ].join('\n'),
  },

  // --- hooks --------------------------------------------------------------
  {
    path: '.claude/hooks/scope-guard.sh',
    kind: 'hook',
    purpose: 'preToolUse hook: deny Edit/Write to _generated, extraction sources, lockfiles.',
    bodyPreview: [
      '#!/usr/bin/env bash',
      '# scope-guard.sh — preToolUse hook for Edit / Write',
      '#',
      '# Refuses edits to checked-in generated content and to documentation',
      '# extraction sources owned by Scenario 6.',
      '',
      'set -euo pipefail',
      '',
      'candidate="${CLAUDE_TOOL_INPUT_PATH:-${1:-}}"',
      '',
      'case "$candidate" in',
      '  src/data/_generated/*) exit 2 ;;',
      '  docs/extraction-sources/*) exit 2 ;;',
    ].join('\n'),
  },
];
