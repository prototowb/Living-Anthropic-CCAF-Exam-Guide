import type { AtlasEdge, AtlasNode } from './types';

// Concept-atlas nodes per stage. PROJECT_PLAN.md §5 spec: 8 stage columns,
// ~40 nodes once all stages are authored. S1 and S2 contribute 8 nodes each;
// S3-S5 nodes are appended as those stages are authored in v0.2; S6-S8 stay
// stub until v0.3 and contribute zero nodes.
//
// Linking discipline:
//   - Every node has a `primaryLink` that resolves to an existing route.
//   - Cross-stage bridges live in `atlasEdges`. An edge is *only* listed
//     when both endpoint nodes exist — drawing dangling lines lies about
//     coverage. As stages are authored, add the edge here.

export const atlasNodes: AtlasNode[] = [
  // ----- S1 — First prompt -----
  {
    id: 'claude-cli',
    label: 'The `claude` REPL',
    stageId: 's1',
    primaryLink: { kind: 'quiz', sectionId: 's1', questionId: 1 },
  },
  {
    id: 'claude-md-root',
    label: 'Root CLAUDE.md',
    stageId: 's1',
    primaryLink: { kind: 'stage', stageId: 's1' },
  },
  {
    id: 'claude-turn-shape',
    label: 'Anatomy of a turn',
    stageId: 's1',
    primaryLink: { kind: 'lesson', lessonId: 'l-s1-reorder-turn' },
  },
  {
    id: 'permission-prompt-first-touch',
    label: 'First-touch permission',
    stageId: 's1',
    primaryLink: { kind: 'quiz', sectionId: 's1', questionId: 4 },
  },
  {
    id: 'slash-commands-builtin',
    label: 'Built-in slash commands',
    stageId: 's1',
    primaryLink: { kind: 'lesson', lessonId: 'l-s1-mcq-exit' },
  },
  {
    id: 'first-session-flow',
    label: 'Session arc',
    stageId: 's1',
    primaryLink: { kind: 'lesson', lessonId: 'l-s1-flow-first-session' },
  },
  {
    id: 'cwd-binding',
    label: 'Working directory',
    stageId: 's1',
    primaryLink: { kind: 'quiz', sectionId: 's1', questionId: 7 },
  },
  {
    id: 'human-in-the-loop',
    label: 'Read the diff',
    stageId: 's1',
    primaryLink: { kind: 'quiz', sectionId: 's1', questionId: 10 },
  },

  // ----- S2 — Tools & permissions -----
  {
    id: 'tool-roster',
    label: 'The built-in tools',
    stageId: 's2',
    primaryLink: { kind: 'stage', stageId: 's2' },
  },
  {
    id: 'permission-modes',
    label: 'Four permission modes',
    stageId: 's2',
    primaryLink: { kind: 'lesson', lessonId: 'l-s2-mcq-modes' },
  },
  {
    id: 'plan-mode-intro',
    label: 'Plan mode (intro)',
    stageId: 's2',
    primaryLink: { kind: 'quiz', sectionId: 's2', questionId: 19 },
  },
  {
    id: 'settings-json',
    label: '.claude/settings.json',
    stageId: 's2',
    primaryLink: { kind: 'quiz', sectionId: 's2', questionId: 12 },
  },
  {
    id: 'allow-deny-lists',
    label: 'Allow / deny lists',
    stageId: 's2',
    primaryLink: { kind: 'quiz', sectionId: 's2', questionId: 15 },
  },
  {
    id: 'headless-flags',
    label: 'Headless flags',
    stageId: 's2',
    primaryLink: { kind: 'lesson', lessonId: 'l-s2-blanks-headless' },
  },
  {
    id: 'custom-slash-commands',
    label: 'Custom slash commands',
    stageId: 's2',
    primaryLink: { kind: 'lesson', lessonId: 'l-s2-reorder-add-cmd' },
  },
  {
    id: 'mode-toggle-shift-tab',
    label: 'Shift+Tab mode switch',
    stageId: 's2',
    primaryLink: { kind: 'stage', stageId: 's2' },
  },

  // ----- S3 — Steering Claude -----
  {
    id: 'plan-mode',
    label: 'Plan mode',
    stageId: 's3',
    primaryLink: { kind: 'stage', stageId: 's3' },
  },
  {
    id: 'plan-mode-tools-allowed',
    label: 'Read-only tool set',
    stageId: 's3',
    primaryLink: { kind: 'lesson', lessonId: 'l-s3-mcq-plan-mode-tools' },
  },
  {
    id: 'plan-shape',
    label: 'Anatomy of a good plan',
    stageId: 's3',
    primaryLink: { kind: 'quiz', sectionId: 's3', questionId: 6 },
  },
  {
    id: 'rescope-signal',
    label: 'Stop-and-rescope signals',
    stageId: 's3',
    primaryLink: { kind: 'quiz', sectionId: 's3', questionId: 7 },
  },
  {
    id: 'plan-shrink-moves',
    label: 'Shrinking a sprawling plan',
    stageId: 's3',
    primaryLink: { kind: 'lesson', lessonId: 'l-s3-reorder-shrink-plan' },
  },
  {
    id: 'plan-mode-default',
    label: 'Plan mode by default',
    stageId: 's3',
    primaryLink: { kind: 'lesson', lessonId: 'l-s3-blanks-settings-default' },
  },

  // ----- S4 — Customising Claude -----
  {
    id: 'claude-md-hierarchy',
    label: 'CLAUDE.md hierarchy',
    stageId: 's4',
    primaryLink: { kind: 'stage', stageId: 's4' },
  },
  {
    id: 'claude-md-precedence',
    label: 'Files extend, don\'t replace',
    stageId: 's4',
    primaryLink: { kind: 'quiz', sectionId: 's4', questionId: 8 },
  },
  {
    id: 'slash-commands-custom',
    label: 'Custom slash commands',
    stageId: 's4',
    primaryLink: { kind: 'quiz', sectionId: 's4', questionId: 3 },
  },
  {
    id: 'skills',
    label: 'Skills (trigger-based)',
    stageId: 's4',
    primaryLink: { kind: 'lesson', lessonId: 'l-s4-reorder-create-skill' },
  },
  {
    id: 'skill-vs-command',
    label: 'Skill vs slash command',
    stageId: 's4',
    primaryLink: { kind: 'lesson', lessonId: 'l-s4-mcq-skill-vs-command' },
  },
  {
    id: 'output-styles',
    label: 'Output styles',
    stageId: 's4',
    primaryLink: { kind: 'quiz', sectionId: 's4', questionId: 10 },
  },
  {
    id: 'status-line',
    label: 'Status line',
    stageId: 's4',
    primaryLink: { kind: 'quiz', sectionId: 's4', questionId: 5 },
  },

  // ----- S5 — Memory & sessions -----
  {
    id: 'context-window',
    label: 'The context window',
    stageId: 's5',
    primaryLink: { kind: 'stage', stageId: 's5' },
  },
  {
    id: 'clear-cmd',
    label: '/clear — hard reset',
    stageId: 's5',
    primaryLink: { kind: 'quiz', sectionId: 's5', questionId: 1 },
  },
  {
    id: 'compact-cmd',
    label: '/compact — summarise & free',
    stageId: 's5',
    primaryLink: { kind: 'quiz', sectionId: 's5', questionId: 2 },
  },
  {
    id: 'resume-cmd',
    label: '/resume — pick up later',
    stageId: 's5',
    primaryLink: { kind: 'lesson', lessonId: 'l-s5-reorder-resume-flow' },
  },
  {
    id: 'memory-file',
    label: '/memory — persistent notes',
    stageId: 's5',
    primaryLink: { kind: 'lesson', lessonId: 'l-s5-blanks-memory-file' },
  },
  {
    id: 'memory-vs-claude-md',
    label: 'Memory vs. CLAUDE.md',
    stageId: 's5',
    primaryLink: { kind: 'quiz', sectionId: 's5', questionId: 7 },
  },
  {
    id: 'lifecycle-decision-tree',
    label: 'Decision tree at 80% full',
    stageId: 's5',
    primaryLink: { kind: 'lesson', lessonId: 'l-s5-mcq-context-bar' },
  },

  // ----- S6 — Delegating -----
  {
    id: 'subagent',
    label: 'Subagent',
    stageId: 's6',
    primaryLink: { kind: 'stage', stageId: 's6' },
  },
  {
    id: 'task-tool',
    label: 'The Task tool',
    stageId: 's6',
    primaryLink: { kind: 'lesson', lessonId: 'l-s6-blanks-task-tool' },
  },
  {
    id: 'subagent-isolation',
    label: 'Context isolation',
    stageId: 's6',
    primaryLink: { kind: 'lesson', lessonId: 'l-s6-mcq-subagent-isolation' },
  },
  {
    id: 'subagent-types',
    label: 'Explore / Plan / general-purpose',
    stageId: 's6',
    primaryLink: { kind: 'lesson', lessonId: 'l-s6-mcq-which-subagent' },
  },
  {
    id: 'parallel-dispatch',
    label: 'Parallel dispatch',
    stageId: 's6',
    primaryLink: { kind: 'quiz', sectionId: 's6', questionId: 4 },
  },
  {
    id: 'settled-style',
    label: 'Settled-style dispatch',
    stageId: 's6',
    primaryLink: { kind: 'quiz', sectionId: 's6', questionId: 5 },
  },
  {
    id: 'background-task',
    label: 'Background tasks',
    stageId: 's6',
    primaryLink: { kind: 'quiz', sectionId: 's6', questionId: 10 },
  },

  // ----- S7 — Extending -----
  {
    id: 'mcp-servers',
    label: 'MCP servers',
    stageId: 's7',
    primaryLink: { kind: 'stage', stageId: 's7' },
  },
  {
    id: 'mcp-scoping',
    label: 'Project vs user MCP',
    stageId: 's7',
    primaryLink: { kind: 'quiz', sectionId: 's7', questionId: 9 },
  },
  {
    id: 'mcp-when-not',
    label: 'When NOT to add MCP',
    stageId: 's7',
    primaryLink: { kind: 'lesson', lessonId: 'l-s7-mcq-when-not-mcp' },
  },
  {
    id: 'hooks',
    label: 'Hooks',
    stageId: 's7',
    primaryLink: { kind: 'lesson', lessonId: 'l-s7-blanks-hook-event' },
  },
  {
    id: 'hook-events',
    label: 'Four hook events',
    stageId: 's7',
    primaryLink: { kind: 'lesson', lessonId: 'l-s7-flow-hook-firing-order' },
  },
  {
    id: 'hook-vs-rule',
    label: 'Hook enforces; CLAUDE.md asks',
    stageId: 's7',
    primaryLink: { kind: 'lesson', lessonId: 'l-s7-mcq-hook-vs-rule' },
  },
  {
    id: 'ide-integrations',
    label: 'IDE integrations',
    stageId: 's7',
    primaryLink: { kind: 'quiz', sectionId: 's7', questionId: 10 },
  },

  // ----- S8 — Beyond the REPL -----
  {
    id: 'headless-mode',
    label: 'Headless mode',
    stageId: 's8',
    primaryLink: { kind: 'stage', stageId: 's8' },
  },
  {
    id: 'print-flag',
    label: '`-p` / `--print`',
    stageId: 's8',
    primaryLink: { kind: 'lesson', lessonId: 'l-s8-mcq-print-flag' },
  },
  {
    id: 'json-output',
    label: '`--output-format json`',
    stageId: 's8',
    primaryLink: { kind: 'quiz', sectionId: 's8', questionId: 2 },
  },
  {
    id: 'jq-pipeline',
    label: 'Piping through `jq`',
    stageId: 's8',
    primaryLink: { kind: 'lesson', lessonId: 'l-s8-blanks-jq-snippet' },
  },
  {
    id: 'allowed-tools',
    label: '`--allowed-tools` whitelist',
    stageId: 's8',
    primaryLink: { kind: 'quiz', sectionId: 's8', questionId: 6 },
  },
  {
    id: 'github-action',
    label: 'GitHub Action wrapper',
    stageId: 's8',
    primaryLink: { kind: 'quiz', sectionId: 's8', questionId: 4 },
  },
  {
    id: 'headless-vs-repl',
    label: 'Headless vs REPL',
    stageId: 's8',
    primaryLink: { kind: 'lesson', lessonId: 'l-s8-mcq-headless-vs-repl' },
  },
];

export const atlasEdges: AtlasEdge[] = [
  // First-touch permission prompt in S1 deepens into the four-mode model in S2.
  { from: 'permission-prompt-first-touch', to: 'permission-modes', kind: 'bridge' },
  // Built-in slash commands in S1 set up the custom-command authoring in S2.
  { from: 'slash-commands-builtin', to: 'custom-slash-commands', kind: 'bridge' },
  // Plan mode in S2 is introduced as one of four; S3 makes it the focus.
  { from: 'plan-mode-intro', to: 'plan-mode', kind: 'bridge' },
  // Root CLAUDE.md from S1 deepens into the full hierarchy story in S4.
  { from: 'claude-md-root', to: 'claude-md-hierarchy', kind: 'bridge' },
  // S1's built-in slash commands; S2 introduces custom; S4 makes them a workflow primitive.
  { from: 'custom-slash-commands', to: 'slash-commands-custom', kind: 'bridge' },
  // S1's built-in slash commands (/clear, /help, /exit) introduce the lifecycle commands explored in S5.
  { from: 'slash-commands-builtin', to: 'clear-cmd', kind: 'bridge' },
  // S4's CLAUDE.md hierarchy and S5's memory file are the two persistent surfaces — paired in the body.
  { from: 'claude-md-hierarchy', to: 'memory-vs-claude-md', kind: 'bridge' },
  // S2's `Task` tool entry deepens into the subagent story in S6.
  { from: 'tool-roster', to: 'task-tool', kind: 'bridge' },
  // S4's custom slash commands and skills set up the ".claude/agents/" idea in S6.
  { from: 'skills', to: 'subagent-types', kind: 'bridge' },
  // S2's settings.json and S7's hooks both live in the same file.
  { from: 'settings-json', to: 'hooks', kind: 'bridge' },
  // S2's headless flags introduction (lesson) and S8's headless deep-dive.
  { from: 'headless-flags', to: 'headless-mode', kind: 'bridge' },
  // S4's slash commands and S8's headless mode — both ways to invoke without the REPL pause.
  { from: 'slash-commands-custom', to: 'print-flag', kind: 'bridge' },
];

export function getNodesForStage(stageId: string): AtlasNode[] {
  return atlasNodes.filter((n) => n.stageId === stageId);
}
