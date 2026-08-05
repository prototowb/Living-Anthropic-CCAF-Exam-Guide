import type { Scenario } from '../types'

const foils: Scenario['foils'] = [
  {
    title: 'Conventions pasted into every prompt',
    ref: 'TS 3.1',
    wrong: {
      label: 'Per-prompt style dump',
      lang: 'md',
      body: `> Refactor the auth module. Remember: we use pnpm not npm,
> 2-space indent, no default exports, snake_case SQL, the
> frontend team forbids barrel files, and… (900 tokens later)`,
    },
    right: {
      label: 'CLAUDE.md hierarchy',
      lang: 'md',
      body: `CLAUDE.md              # repo-wide rules, loaded every session
packages/web/CLAUDE.md # frontend-only rules, loaded on entry
# The prompt stays about the task, not the conventions.`,
    },
    failure:
      'Conventions restated per prompt drift, get truncated, and burn context; a hierarchy loads the right rules at the right scope every time.',
  },
  {
    title: 'Big refactor executed directly',
    ref: 'TS 3.4',
    wrong: {
      label: 'Direct execution',
      lang: 'bash',
      body: `> migrate all 14 API handlers to the new error envelope
· Editing handlers/user.ts …
· Editing handlers/billing.ts …   # 12 files later, review
· Editing handlers/orders.ts …    # surface is unmanageable`,
    },
    right: {
      label: 'Plan mode first',
      lang: 'bash',
      body: `> /plan migrate the handlers to the new error envelope
· Plan: 3 phases, touched files listed, migration order,
  rollback note. Approve? [y/n]
# Edits only start after the plan survives review.`,
    },
    failure:
      'A 14-file direct edit produces a diff no one can review; the plan is the reviewable artifact, and re-scoping is cheap before the first edit.',
  },
]

export const scenario2: Scenario = {
  id: 'code-generation',
  number: 2,
  title: 'Code Generation with Claude Code',
  hook: 'Configure CLAUDE.md, slash commands, path rules, and plan mode for a real team workflow.',
  brief:
    'You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution.',
  primaryDomains: [3, 5],
  example: {
    title: 'Restructuring the monolith',
    body:
      'Engineering wants to split the billing module out of the monolith into a service. That touches dozens of files and is full of judgement calls about boundaries. Plan mode is the right tool: explore, understand dependencies, decide, then execute. Compare with adding a date-validation conditional to one function — that is a direct-execution change.',
  },
  infographic: {
    kind: 'plan-vs-direct',
    caption:
      'Plan mode for architectural change. Direct execution for well-scoped fixes. The Explore subagent isolates verbose discovery output so the main turn keeps its context.',
  },
  flow: [
    {
      label: 'Project loads CLAUDE.md',
      body: 'At session start, Claude Code loads ~/.claude/CLAUDE.md, then ./CLAUDE.md, then subdirectory CLAUDE.md files — most-specific wins.',
      mandate: 'TS 3.1 · CLAUDE.md hierarchy — user/project/directory.',
    },
    {
      label: 'Path-scoped rules activate',
      body: 'Editing src/api/handlers/orders.ts triggers .claude/rules/api.md (matched via paths: ["src/api/**/*"]). Editing Button.test.tsx triggers .claude/rules/testing.md via paths: ["**/*.test.tsx"]. No always-loaded bulk.',
      mandate: 'TS 3.3 · Glob-pattern rules win when conventions span directories.',
    },
    {
      label: 'Engineer runs /review',
      body: 'Project-scoped slash command at .claude/commands/review.md is version-controlled and available to every developer who pulls the repo.',
      mandate: 'TS 3.2 · Project commands in .claude/commands/, personal in ~/.claude/commands/.',
    },
    {
      label: 'Big task arrives — enter plan mode',
      body: '"Restructure monolith into microservices." Multiple valid approaches, dozens of files, architectural decisions → plan mode. The Explore subagent maps the dependency graph and returns a summary, preserving the main session\'s context.',
      stopReason: 'tool_use',
      mandate: 'TS 3.4 · Plan mode for architectural scope; Explore subagent for verbose discovery.',
    },
    {
      label: 'Plan reviewed, approved',
      body: 'Plan presented for human approval. ExitPlanMode is the only completion signal the runtime watches for. Implementation switches to direct execution.',
      stopReason: 'pause_for_human',
    },
    {
      label: 'Direct-execution path (contrast)',
      body: '"Add a null check to formatPrice()." Single file, clear stack trace, one valid approach → direct execution. No plan mode overhead.',
      stopReason: 'end_turn',
      mandate: 'TS 3.4 · Direct execution for well-scoped, single-file changes.',
    },
    {
      label: 'Verify memory with /memory',
      body: 'Engineer suspects a rule isn\'t loading. /memory lists which CLAUDE.md files are active and confirms the hierarchy.',
      mandate: 'TS 3.1 · /memory is the diagnostic for "why isn\'t the agent following X?".',
    },
  ],
  code: [
    {
      lang: 'md',
      label: 'Project CLAUDE.md (root)',
      body: `# Repo standards

- TypeScript strict. No \`any\` without a written justification.
- React: functional components + hooks only.
- Database access goes through the repository pattern in \`src/db/repos/\`.

@import ./docs/standards/error-handling.md

## Plan mode vs direct execution

| Change | Mode |
|---|---|
| Multi-file refactor, architectural decisions | Plan |
| Single-file fix with clear stack trace | Direct |
| Codebase-spanning library migration | Plan |
`,
    },
    {
      lang: 'md',
      label: '.claude/rules/testing.md (path-scoped)',
      body: `---
paths: ["**/*.test.ts", "**/*.test.tsx"]
---

# Test conventions

- Co-located with source: \`Button.test.tsx\` next to \`Button.tsx\`.
- Use \`describe(ComponentName, …)\` at the top level.
- Database tests hit a real Postgres (\`TEST_DATABASE_URL\`), never mocks. Mocks once masked a broken migration in prod.
- Each test resets fixtures via \`beforeEach\` — no test leaks state.
`,
    },
    {
      lang: 'md',
      label: '.claude/commands/review.md (project-scoped slash command)',
      body: `---
argument-hint: <pr-number>
allowed-tools: Read, Grep, Glob, Bash(git diff:*, gh pr view:*)
description: Run the team's review checklist on a PR.
---

Run the team's standard review checklist on the PR \`$1\` (or HEAD if absent):

1. Diff scope vs. PR title — flag if the diff exceeds the title's claim.
2. Public API surface: any new exports? Are they in the index barrels?
3. Tests: does every changed module have a passing test in the same commit?
4. Side effects: any console.log, debugger, or commented-out code?
5. Migration safety: any schema changes? Confirm reversibility.

Report findings inline as bullets, each prefixed \`[BLOCKING]\` or \`[NIT]\`.
`,
    },
    {
      lang: 'md',
      label: '.claude/skills/codebase-tour/SKILL.md',
      body: `---
context: fork
allowed-tools: Read, Grep, Glob
argument-hint: <package-or-directory>
description: Produce a 1-page tour of an unfamiliar package and return only the summary.
---

You are a codebase tour guide. Survey \`$1\`. Return ONLY a 1-page summary with:

- Purpose (3 sentences)
- Public API (exported symbols)
- 3 critical files to read first
- 2 questions the new engineer should ask the maintainer

\`context: fork\` isolates the verbose discovery so the main session's context window stays clean.
`,
    },
  ],
  qna: [
    {
      q: 'You want to create a custom /review slash command that runs your team\'s standard code review checklist. This command should be available to every developer when they clone or pull the repository. Where should you create this command file?',
      options: [
        { key: 'A', text: 'In the .claude/commands/ directory in the project repository.' },
        { key: 'B', text: 'In ~/.claude/commands/ in each developer\'s home directory.' },
        { key: 'C', text: 'In the CLAUDE.md file at the project root.' },
        { key: 'D', text: 'In a .claude/config.json file with a commands array.' },
      ],
      correct: 'A',
      explain:
        'Project-scoped custom slash commands belong in .claude/commands/ within the repository. They are version-controlled and automatically available to all developers who pull the repo. Option B is for personal commands that aren\'t shared via version control. Option C is for project instructions and context, not command definitions. Option D describes a configuration mechanism that doesn\'t exist in Claude Code.',
      ref: 'Sample Q4 · TS 3.2',
    },
    {
      q: 'You\'ve been assigned to restructure the team\'s monolithic application into microservices. This involves changes across dozens of files and requires decisions about service boundaries and module dependencies. Which approach should you take?',
      options: [
        { key: 'A', text: 'Enter plan mode to explore the codebase, understand dependencies, and design an implementation approach before making changes.' },
        { key: 'B', text: 'Start with direct execution and make changes incrementally, letting the implementation reveal the natural service boundaries.' },
        { key: 'C', text: 'Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured.' },
        { key: 'D', text: 'Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity during implementation.' },
      ],
      correct: 'A',
      explain:
        'Plan mode is designed for complex tasks involving large-scale changes, multiple valid approaches, and architectural decisions — exactly what monolith-to-microservices restructuring requires. It enables safe codebase exploration and design before committing to changes. B risks costly rework when dependencies are discovered late. C assumes you already know the right structure without exploring the code. D ignores that the complexity is already stated in the requirements, not something that might emerge later.',
      ref: 'Sample Q5 · TS 3.4',
    },
    {
      q: 'Your codebase has distinct areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow a repository pattern. Test files are spread throughout the codebase alongside the code they test (e.g., Button.test.tsx next to Button.tsx), and you want all tests to follow the same conventions regardless of location. What is the most maintainable way to ensure Claude automatically applies the correct conventions when generating code?',
      options: [
        { key: 'A', text: 'Create rule files in .claude/rules/ with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths.' },
        { key: 'B', text: 'Consolidate all conventions in the root CLAUDE.md file under headers for each area, relying on Claude to infer which section applies.' },
        { key: 'C', text: 'Create skills in .claude/skills/ for each code type that include the relevant conventions in their SKILL.md files.' },
        { key: 'D', text: 'Place a separate CLAUDE.md file in each subdirectory containing that area\'s specific conventions.' },
      ],
      correct: 'A',
      explain:
        '.claude/rules/ with glob patterns (e.g., **/*.test.tsx) lets conventions be applied automatically based on file paths regardless of directory location — essential for test files spread throughout the codebase. Option B relies on inference rather than explicit matching, making it unreliable. Option C requires manual skill invocation or relies on Claude choosing to load them, contradicting the need for deterministic "automatic" application. Option D can\'t easily handle files spread across many directories since CLAUDE.md files are directory-bound.',
      ref: 'Sample Q6 · TS 3.3',
    },
  ],
  foils,
  takeaways: [
    'Use .claude/rules/ with glob paths when a convention spans the tree; use a subdirectory CLAUDE.md when a convention is local.',
    'Plan mode is for architectural scope. Direct execution is for well-scoped single-file work. When in doubt, plan.',
    'Project-scoped (.claude/commands/, .claude/skills/) versus user-scoped (~/.claude/) decides "is this for the team or just me?".',
  ],
}
