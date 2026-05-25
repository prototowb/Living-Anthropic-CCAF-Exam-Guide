// Sandbox transcripts. Pure data; sandbox components render these and add UI.
// v0.1 shipped one (First-Session REPL). v0.2 adds Plan-Mode Workshop (S3).
//
// Sandboxes form a discriminated union on `kind`; SandboxView dispatches to
// the matching component. New shapes register their types in src/data/types.ts.

import type {
  HeadlessSandbox,
  HierarchySandbox,
  McpHooksSandbox,
  PermissionGateSandbox,
  PlanWorkshopSandbox,
  SessionLifecycleSandbox,
  SubagentDispatcherSandbox,
} from './types';

export type ReplLineKind =
  | 'system'
  | 'prompt'
  | 'user'
  | 'assistant'
  | 'tool-call'
  | 'permission'
  | 'tool-result'
  | 'note';

export type ReplLine =
  | { kind: 'system'; text: string }
  | { kind: 'prompt'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool-call'; tool: string; input: string }
  | { kind: 'permission'; tool: string; input: string }
  | { kind: 'tool-result'; text: string }
  | { kind: 'note'; text: string };

export interface ReplTranscript {
  kind: 'repl';
  id: string;
  title: string;
  description: string;
  /**
   * Permission mode toggle changes which "permission" lines appear and the
   * downstream tool-call lines. v0.1 ships the `default` track.
   */
  modes: Record<'default' | 'acceptEdits' | 'plan' | 'yolo', ReplLine[]>;
}

/** All sandbox shapes. Add a new entry when a new kind lands. */
export type Sandbox =
  | ReplTranscript
  | PlanWorkshopSandbox
  | HierarchySandbox
  | SessionLifecycleSandbox
  | SubagentDispatcherSandbox
  | McpHooksSandbox
  | HeadlessSandbox
  | PermissionGateSandbox;

const DEFAULT_TRACK: ReplLine[] = [
  { kind: 'system', text: 'Claude Code v1.0.0 — interactive session' },
  { kind: 'system', text: 'cwd: ~/projects/sample-app' },
  { kind: 'system', text: 'reading CLAUDE.md' },
  { kind: 'prompt', text: '> ' },
  { kind: 'user', text: 'rename the function `oldName` to `newName` in src/utils.ts' },
  { kind: 'assistant', text: "I'll start by reading the file." },
  { kind: 'tool-call', tool: 'Read', input: 'src/utils.ts' },
  { kind: 'permission', tool: 'Read', input: 'src/utils.ts' },
  { kind: 'note', text: '↳ You approve "Read" for this session.' },
  { kind: 'tool-result', text: '~/projects/sample-app/src/utils.ts (43 lines)' },
  { kind: 'assistant', text: 'Found two occurrences of `oldName`. I\'ll rename both.' },
  { kind: 'tool-call', tool: 'Edit', input: 'src/utils.ts' },
  { kind: 'permission', tool: 'Edit', input: 'src/utils.ts' },
  { kind: 'note', text: '↳ You approve the edit and the diff lands.' },
  { kind: 'tool-result', text: 'edit applied (2 replacements)' },
  { kind: 'assistant', text: 'Done. Want me to run the tests to confirm nothing broke?' },
  { kind: 'prompt', text: '> ' },
];

const PLAN_TRACK: ReplLine[] = [
  { kind: 'system', text: 'Claude Code v1.0.0 — interactive session' },
  { kind: 'system', text: 'cwd: ~/projects/sample-app' },
  { kind: 'system', text: 'reading CLAUDE.md' },
  { kind: 'note', text: '↳ Plan mode is active. Claude can Read/Grep/Glob but cannot edit.' },
  { kind: 'prompt', text: '> ' },
  { kind: 'user', text: 'rename the function `oldName` to `newName` in src/utils.ts' },
  { kind: 'assistant', text: "I'll research first, then propose a plan." },
  { kind: 'tool-call', tool: 'Grep', input: 'oldName' },
  { kind: 'tool-result', text: 'src/utils.ts:12 — `function oldName(…)`\nsrc/utils.ts:31 — `oldName()` call site' },
  { kind: 'assistant', text: 'Plan:\n1. Rename declaration at line 12.\n2. Update call site at line 31.\n3. Run `npm test`.\n\n_(no files have been touched)._' },
  { kind: 'note', text: '↳ You can now exit plan mode (Shift+Tab) and let Claude apply the plan.' },
  { kind: 'prompt', text: '> ' },
];

const ACCEPT_TRACK: ReplLine[] = DEFAULT_TRACK.map((line) =>
  line.kind === 'permission'
    ? ({ kind: 'note', text: `↳ Auto-accepted (${line.tool}).` } as ReplLine)
    : line,
);

const YOLO_TRACK: ReplLine[] = DEFAULT_TRACK.filter(
  (line) => line.kind !== 'permission' && line.kind !== 'note',
);

export const firstSessionTranscript: ReplTranscript = {
  kind: 'repl',
  id: 'first-session-repl',
  title: 'First-Session REPL',
  description:
    'A scripted walkthrough of one Claude Code turn. Use the mode picker to see how `default`, `acceptEdits`, `plan`, and `yolo` change what you see.',
  modes: {
    default: DEFAULT_TRACK,
    acceptEdits: ACCEPT_TRACK,
    plan: PLAN_TRACK,
    yolo: YOLO_TRACK,
  },
};

// ----- S3 — Plan-Mode Workshop -----
// Three prompt/plan variants illustrate the three scope outcomes you actually
// see in practice: tight (ship it), medium (review and ship), bloated
// (stop, re-prompt, shrink).

export const planModeWorkshop: PlanWorkshopSandbox = {
  kind: 'plan-workshop',
  id: 'plan-mode-workshop',
  title: 'Plan-Mode Workshop',
  description:
    'Pick a prompt, read the plan Claude proposes, and notice when scope creeps. The fix is upstream — sharpen the prompt.',
  variants: [
    {
      id: 'tight-rename',
      prompt: 'rename function `parseEvent` to `parseSignal` in `src/parse.ts`',
      plan: [
        { text: 'Rename declaration `parseEvent` → `parseSignal` at src/parse.ts:18.', files: ['src/parse.ts'] },
        { text: 'Update the one call site at src/parse.ts:47.', files: ['src/parse.ts'] },
        { text: 'Run `npm test`.', files: [] },
      ],
      shrinkHint:
        'Tight scope — one file, two edits, one verification. Exit plan mode and apply.',
      scope: 'tight',
    },
    {
      id: 'medium-feature',
      prompt: 'add a CSV export button to the dashboard',
      plan: [
        { text: 'Add `ExportButton.vue` in `src/components/dashboard/`.', files: ['src/components/dashboard/ExportButton.vue'] },
        { text: 'Mount it in `DashboardView.vue` next to the existing filters.', files: ['src/views/DashboardView.vue'] },
        { text: 'Wire the click handler to a new `exportToCsv()` helper in `src/lib/export.ts`.', files: ['src/lib/export.ts'] },
        { text: 'Add a snapshot test for the helper.', files: ['src/lib/__test__/export.spec.ts'] },
      ],
      shrinkHint:
        'Medium scope — touches four files, but they all map to the request. Worth reading each step before exiting plan mode.',
      scope: 'medium',
    },
    {
      id: 'bloated-refactor',
      prompt: 'clean up the auth handling',
      plan: [
        { text: 'Extract `useAuth()` composable from the inline logic in `LoginView.vue`.', files: ['src/composables/useAuth.ts', 'src/views/LoginView.vue'] },
        { text: '**Also** rewrite the session store to use Pinia setup syntax.', files: ['src/stores/session.ts'] },
        { text: '**Also** rename `auth-helpers.ts` to `auth.ts` for consistency.', files: ['src/lib/auth.ts'] },
        { text: '**While I\'m here**, add a logout button to the navbar.', files: ['src/components/Navbar.vue'] },
        { text: 'Update 5 components that import the renamed helper.', files: ['src/**/*.vue'] },
        { text: 'Migrate the legacy `localStorage` keys.', files: ['src/lib/migrations/auth-v2.ts'] },
        { text: 'Add tests across the changed surface.', files: ['src/**/__test__/*.spec.ts'] },
      ],
      shrinkHint:
        'Bloated — the prompt was vague, so Claude branched. Don\'t approve. Exit plan mode and re-prompt with a sharper scope: "Extract `useAuth()` from `LoginView.vue`. Nothing else."',
      scope: 'bloated',
    },
  ],
};

// ----- S4 — CLAUDE.md Hierarchy -----
// Toggle each file on/off; the right pane shows what Claude actually sees
// when a request lands in `src/agents/coordinator.ts`. Closer files extend.

export const claudeMdHierarchy: HierarchySandbox = {
  kind: 'hierarchy',
  id: 'claude-md-hierarchy',
  title: 'CLAUDE.md Hierarchy',
  description:
    'Four CLAUDE.md files at four levels. Toggle any of them and watch the effective config Claude would load change. Closer files extend, never replace.',
  prompt: 'You ask Claude to edit `src/agents/coordinator.ts`.',
  files: [
    {
      level: 'user',
      path: '~/.claude/CLAUDE.md',
      defaultOn: true,
      body:
        '# Personal preferences\n\n' +
        '- Prefer named functions over arrow functions in module scope.\n' +
        '- Always show me the diff before applying an Edit.\n',
    },
    {
      level: 'root',
      path: 'CLAUDE.md',
      defaultOn: true,
      body:
        '# Project root — claude-code-companion\n\n' +
        '- All imports use the `@/` path alias.\n' +
        '- Mock SDK is the default. No view imports `@anthropic-ai/sdk` directly.\n' +
        '- No Bash without an explicit allow entry in `.claude/settings.json`.\n',
    },
    {
      level: 'subdir',
      path: 'src/CLAUDE.md',
      defaultOn: true,
      body:
        '# src/ — layered rules\n\n' +
        '- Stores own mutable state. Views read; agents act.\n' +
        '- Persistence flows through `src/stores/persist.ts` (versioned `:v1`).\n',
    },
    {
      level: 'subdir',
      path: 'src/agents/CLAUDE.md',
      defaultOn: true,
      body:
        '# src/agents/ — tool & subagent rules\n\n' +
        '- Tools never throw. Every tool returns `ToolResponse<T>`.\n' +
        '- Branch on `adapter.capabilities.*`, not on `adapter.kind`.\n' +
        '- Parallel subagents only when `capabilities.parallelSubagents === true`.\n',
    },
  ],
};

// ----- S5 — Session Lifecycle -----
// Bar starts ~78% full from baseline turns. Each action shows what happens to
// the bar afterwards. Numbers are illustrative; the point is the *shape* of
// what /clear, /compact, /resume each do to the running context.

export const sessionLifecycle: SessionLifecycleSandbox = {
  kind: 'session-lifecycle',
  id: 'session-lifecycle',
  title: 'Session Lifecycle',
  description:
    'See what /clear, /compact, and /resume actually do to the context window. The bar shows tokens consumed; the buttons show the after-state.',
  capacity: 200_000,
  baselineTurns: [
    { id: 't1', label: 'You: explain the parser', tokensAdded: 12_000 },
    { id: 't2', label: 'Claude: traces the parser, shows a diff', tokensAdded: 28_000 },
    { id: 't3', label: 'You: add a new token type', tokensAdded: 8_000 },
    { id: 't4', label: 'Claude: edits + runs tests', tokensAdded: 32_000 },
    { id: 't5', label: 'You: fix the failing test', tokensAdded: 18_000 },
    { id: 't6', label: 'Claude: reads, edits, re-tests', tokensAdded: 36_000 },
    { id: 't7', label: 'You: rename the helper', tokensAdded: 6_000 },
    { id: 't8', label: 'Claude: cross-file rename + verify', tokensAdded: 16_000 },
  ],
  actions: [
    {
      id: 'compact',
      label: '/compact',
      resultTokens: 24_000,
      rationale:
        'Compaction summarises the prior 8 turns into a short paragraph. You keep the thread, you free ~75% of the tokens — but specific values can drop. Verify before relying on a remembered detail.',
    },
    {
      id: 'clear',
      label: '/clear',
      resultTokens: 0,
      rationale:
        'Everything gone — fresh session. Use when the next task is unrelated. CLAUDE.md still loads on the next turn; your project conventions don\'t depend on session state.',
    },
    {
      id: 'resume',
      label: '/resume (yesterday\'s session)',
      resultTokens: 168_000,
      rationale:
        '/resume *adds* context — it loads a past session back in. Useful when you walked away and came back. It does not free anything; reach for /compact straight after if you\'re near the edge.',
    },
  ],
};

// ----- S6 — Subagent Dispatcher -----
// A task and a fleet. The learner picks which subagents to spawn and whether
// to run them in parallel. The timeline visualises the wall-clock savings of
// `Promise.all`-style dispatch over a serial waterfall.

export const subagentDispatcher: SubagentDispatcherSandbox = {
  kind: 'subagent-dispatcher',
  id: 'subagent-dispatcher',
  title: 'Subagent Dispatcher',
  description:
    'Delegate a task to a fleet of subagents. Toggle which spokes to spawn, switch parallel vs serial, watch the timeline change.',
  task: 'Audit every React component for accessibility issues. Report findings grouped by component.',
  agents: [
    {
      id: 'explore',
      name: 'Explore',
      role: 'Fast read-only search — finds every component file.',
      estimatedSeconds: 8,
      fit: 'great',
      tools: ['Read', 'Grep', 'Glob'],
    },
    {
      id: 'a11y-researcher',
      name: 'a11y-researcher',
      role: 'Project-specific subagent — knows your design-system rules.',
      estimatedSeconds: 22,
      fit: 'great',
      tools: ['Read', 'Grep', 'Glob'],
    },
    {
      id: 'plan',
      name: 'Plan',
      role: 'Software-architect-style planning — useful for the fix plan, not the audit itself.',
      estimatedSeconds: 14,
      fit: 'ok',
      tools: ['Read', 'Grep', 'Glob'],
    },
    {
      id: 'general-purpose',
      name: 'general-purpose',
      role: 'Open-ended research with full toolset.',
      estimatedSeconds: 28,
      fit: 'ok',
      tools: ['Read', 'Edit', 'Bash', 'Grep', 'Glob', 'WebFetch'],
    },
    {
      id: 'devops-deployer',
      name: 'devops-deployer',
      role: 'Project-specific subagent — wrong tool for this job.',
      estimatedSeconds: 18,
      fit: 'wrong-tool',
      tools: ['Bash', 'Read'],
    },
  ],
};

// ----- S7 — MCP & Hooks Composer -----
// A visual settings.json composer. Toggle MCP servers and hooks on; the
// event stream column shows which active hooks fire on which tool calls
// when Claude works.

export const mcpHooksComposer: McpHooksSandbox = {
  kind: 'mcp-hooks-composer',
  id: 'mcp-hooks-composer',
  title: 'MCP & Hooks Composer',
  description:
    'Toggle MCP servers and hooks. The right pane shows which hooks fire on a synthetic event stream — Claude editing a file, running a test, finishing a turn.',
  servers: [
    {
      id: 'github',
      name: 'github',
      purpose: 'Read PRs, issues, files. Useful for "summarise PR #42".',
      exposes: ['github.get_pr', 'github.list_issues', 'github.get_file'],
    },
    {
      id: 'linear',
      name: 'linear',
      purpose: 'Read and update tickets in your Linear workspace.',
      exposes: ['linear.get_ticket', 'linear.update_status'],
    },
    {
      id: 'postgres',
      name: 'postgres',
      purpose: 'Run read-only queries against your dev database.',
      exposes: ['postgres.query'],
    },
    {
      id: 'internal-docs',
      name: 'internal-docs',
      purpose: 'Search your team\'s internal docs site.',
      exposes: ['docs.search', 'docs.get_page'],
    },
  ],
  hooks: [
    {
      id: 'lint-after-edit',
      event: 'postToolUse',
      toolMatcher: 'Edit',
      command: 'npm run lint -- --fix $TARGET_FILE',
      effect: 'After every Edit, auto-fix lint on the touched file.',
    },
    {
      id: 'deny-rm-rf',
      event: 'preToolUse',
      toolMatcher: 'Bash',
      command: '.claude/hooks/scope-guard.sh',
      effect: 'Block `rm -rf` and other destructive commands before they run.',
    },
    {
      id: 'tests-on-stop',
      event: 'stop',
      command: 'npm test --silent',
      effect: 'Run the test suite when the session ends.',
    },
    {
      id: 'log-prompt',
      event: 'userPromptSubmit',
      command: 'echo "$PROMPT" >> .claude/prompt-log.txt',
      effect: 'Append every prompt you type to a local log file.',
    },
  ],
  eventStream: [
    { id: 'e1', tool: 'userPromptSubmit', description: 'You type "refactor the parser"' },
    { id: 'e2', tool: 'Read', description: 'Claude reads `src/parser.ts`' },
    { id: 'e3', tool: 'Edit', description: 'Claude edits `src/parser.ts:18`' },
    { id: 'e4', tool: 'Bash', description: 'Claude runs `npm test`' },
    { id: 'e5', tool: 'Edit', description: 'Claude edits `src/parser.ts:42`' },
    { id: 'e6', tool: 'stop', description: 'You exit the session' },
  ],
};

// ----- S8 — Headless Composer -----
// Assemble a `claude --output-format json -p "..."` invocation piecewise.
// Toggle parts to see how each one shapes the command.

export const headlessComposer: HeadlessSandbox = {
  kind: 'headless-composer',
  id: 'headless-composer',
  title: 'Headless Composer',
  description:
    'Build a one-shot Claude invocation piece by piece. Each part toggled on appears in the assembled command — and changes what your script gets back.',
  parts: [
    {
      id: 'claude',
      fragment: 'claude',
      explanation: 'The CLI binary. Required.',
      required: true,
    },
    {
      id: 'print',
      fragment: '-p "summarise this repo"',
      explanation:
        '`-p` (or `--print`) runs Claude with a single prompt and exits. Required for headless mode.',
      required: true,
    },
    {
      id: 'output-format',
      fragment: '--output-format json',
      explanation:
        'Returns structured JSON instead of human text. Parseable with `jq`. Use this in any script.',
      required: false,
    },
    {
      id: 'model',
      fragment: '--model claude-haiku-4-5-20251001',
      explanation: 'Pick a specific model. Otherwise the default applies.',
      required: false,
    },
    {
      id: 'allowed-tools',
      fragment: '--allowed-tools Read,Grep,Glob',
      explanation: 'Restrict which tools Claude may call in this run. Useful in CI where Bash should be off.',
      required: false,
    },
    {
      id: 'permission-mode',
      fragment: '--permission-mode plan',
      explanation: 'Run in plan mode — Claude proposes but never edits.',
      required: false,
    },
  ],
  sampleOutput: `{
  "type": "result",
  "subtype": "summary",
  "session_id": "s_a1b2c3",
  "total_cost_usd": 0.0042,
  "duration_ms": 3187,
  "result": "This repo is a Vue 3 + TypeScript + Vite app that teaches Claude Code…",
  "is_error": false
}`,
  jqSnippet: 'claude -p "summarise this repo" --output-format json | jq -r .result',
};

// ----- S2 — Permission Gate -----
// PROJECT_PLAN.md §6: pre-built tool-call queue + editable allow/deny list.
// The anti-pattern foil — over-broad `Bash(*)` — sits next to the team-standard
// preset so the comparison is obvious in one screen.

export const permissionGate: PermissionGateSandbox = {
  kind: 'permission-gate',
  id: 'permission-gate',
  title: 'Permission Gate',
  description:
    'A queue of tool calls and a settings.json allow/deny list. Pick a preset and watch which calls land silently, which prompt you, and which get denied — the gate is more useful when it\'s tight.',
  queue: [
    {
      id: 'read-index',
      tool: 'Read',
      args: 'src/index.ts',
      description: 'Read an existing source file.',
    },
    {
      id: 'edit-auth',
      tool: 'Edit',
      args: 'src/auth.ts',
      description: 'Edit a security-sensitive file.',
    },
    {
      id: 'bash-npm-test',
      tool: 'Bash',
      args: 'npm test',
      description: 'Run the test suite.',
    },
    {
      id: 'bash-git-status',
      tool: 'Bash',
      args: 'git status',
      description: 'Check git working-tree state.',
    },
    {
      id: 'bash-rm-rf',
      tool: 'Bash',
      args: 'rm -rf .',
      description: 'Destructive — never approve this in a real session.',
    },
    {
      id: 'webfetch',
      tool: 'WebFetch',
      args: 'https://example.com',
      description: 'Pull a URL from the public internet.',
    },
  ],
  presets: [
    {
      id: 'empty',
      label: 'No rules (default)',
      description:
        'No `.claude/settings.json` rules. Every tool call prompts you the first time. Safe but noisy.',
      rules: [],
    },
    {
      id: 'minimal',
      label: 'Minimal — read-only is silent',
      description:
        'Allow read-only operations silently; everything else (Edit, Bash, WebFetch) prompts. A reasonable beginner default.',
      rules: [
        { type: 'allow', pattern: 'Read' },
        { type: 'allow', pattern: 'Grep' },
        { type: 'allow', pattern: 'Glob' },
      ],
    },
    {
      id: 'team-standard',
      label: 'Team standard',
      description:
        'Allow common dev commands silently; deny destructive ones; everything else prompts. Production-shaped.',
      rules: [
        { type: 'allow', pattern: 'Read' },
        { type: 'allow', pattern: 'Grep' },
        { type: 'allow', pattern: 'Glob' },
        { type: 'allow', pattern: 'Bash(npm test)' },
        { type: 'allow', pattern: 'Bash(git status)' },
        { type: 'allow', pattern: 'Bash(npm run lint)' },
        { type: 'deny', pattern: 'Bash(rm *)' },
        { type: 'deny', pattern: 'Bash(rm -rf *)' },
        { type: 'deny', pattern: 'Bash(curl * | sh)' },
      ],
    },
    {
      id: 'broken',
      label: 'Anti-pattern — `Bash(*)` allow-all',
      description:
        'Over-broad allow lets EVERY Bash command through, including `rm -rf`. This is the recipe for "Claude deleted my repo." Never ship this.',
      isAntiPattern: true,
      rules: [
        { type: 'allow', pattern: 'Read' },
        { type: 'allow', pattern: 'Bash(*)' },
      ],
    },
  ],
};

export const sandboxes: Sandbox[] = [
  firstSessionTranscript,
  permissionGate,
  planModeWorkshop,
  claudeMdHierarchy,
  sessionLifecycle,
  subagentDispatcher,
  mcpHooksComposer,
  headlessComposer,
];

export function getSandbox(id: string): Sandbox | undefined {
  return sandboxes.find((s) => s.id === id);
}
