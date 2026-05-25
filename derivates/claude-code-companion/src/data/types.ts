// Shared types for the content layer. No side effects, no imports from other
// app modules — pure data shapes. Mirrors the parent's `src/data/types.ts`
// philosophy: stable, typed content; views read; nothing mutates.

export type Rung = 'B' | 'I' | 'A';

/** One of the 8 beginner-curriculum stages. See PROJECT_PLAN.md §3. */
export interface Stage {
  id: string;
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  /** One-sentence pitch shown on the index card. */
  pitch: string;
  /** The anchor question this stage teaches the learner to answer. */
  anchorQuestion: string;
  /** Rungs covered. */
  rungs: Rung[];
  /** Markdown body of the stage page. */
  body: string;
  /** Ids of lessons that anchor to this stage. */
  lessonIds: string[];
  /** Quiz section id for this stage (mirrors stage id). */
  quizSectionId: string;
  /** Optional sandbox id. */
  sandboxId?: string;
}

export type LessonFormat = 'reorder' | 'blanks' | 'mcq' | 'flow-builder';

export interface LessonBase {
  id: string;
  title: string;
  summary: string;
  stageId: string;
  rung: Rung;
  format: LessonFormat;
}

export interface ReorderLesson extends LessonBase {
  format: 'reorder';
  /** Canonical order. The runner shuffles. */
  steps: { id: string; label: string; rationale: string }[];
}

export interface BlanksLesson extends LessonBase {
  format: 'blanks';
  prompt: string;
  /** `{0}`, `{1}`, … placeholders in `prompt`. Each blank has options. */
  blanks: { options: string[]; correctIndex: number; explanation: string }[];
}

export interface McqLesson extends LessonBase {
  format: 'mcq';
  question: string;
  options: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface FlowBuilderLesson extends LessonBase {
  format: 'flow-builder';
  /** Cards the learner places into ordered slots. */
  cards: { id: string; label: string }[];
  /** Canonical order. */
  canonical: string[];
  rationale: string;
}

export type Lesson = ReorderLesson | BlanksLesson | McqLesson | FlowBuilderLesson;

export interface QuizOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: QuizOption[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  /** Optional explanation per wrong answer. */
  wrongExplanations?: Partial<Record<'A' | 'B' | 'C' | 'D', string>>;
  /** Stage this question anchors to. */
  stageId: string;
  rung: Rung;
}

export interface QuizSection {
  id: string;
  title: string;
  stageId: string;
  questions: QuizQuestion[];
}

// Sandbox shapes — discriminated union so the dispatcher can switch on kind.
// ReplTranscript is the original v0.1 shape (lives in sandboxes.ts for legacy
// reasons); new shapes land here so rule 2 holds for net-new authoring.

export interface PlanWorkshopVariant {
  id: string;
  /** What the learner would type as a prompt. */
  prompt: string;
  /** The plan Claude would propose. */
  plan: { text: string; files: string[] }[];
  /** Short note read after the plan — flags scope creep or affirms tight scope. */
  shrinkHint: string;
  /** Tag the variant as cleanly scoped, slightly bloated, or badly bloated. */
  scope: 'tight' | 'medium' | 'bloated';
}

export interface PlanWorkshopSandbox {
  kind: 'plan-workshop';
  id: string;
  title: string;
  description: string;
  variants: PlanWorkshopVariant[];
}

export interface HierarchyFile {
  path: string;
  /** Markdown content. Rendered into the merged config when toggled on. */
  body: string;
  defaultOn: boolean;
  /** Where in the precedence chain this file sits. */
  level: 'user' | 'root' | 'subdir';
}

export interface HierarchySandbox {
  kind: 'hierarchy';
  id: string;
  title: string;
  description: string;
  /** Fixed prompt the learner sees — the change Claude would be asked to make. */
  prompt: string;
  /** Hierarchy files, ordered broad → narrow (load order). */
  files: HierarchyFile[];
}

export interface SessionTurn {
  id: string;
  label: string;
  /** Token count this turn contributes to the running context. */
  tokensAdded: number;
}

export interface SessionLifecycleAction {
  id: 'clear' | 'compact' | 'resume';
  label: string;
  /** Resulting token count after the action lands. */
  resultTokens: number;
  rationale: string;
}

export interface SessionLifecycleSandbox {
  kind: 'session-lifecycle';
  id: string;
  title: string;
  description: string;
  /** Hypothetical context-window capacity (in tokens) used for the bar. */
  capacity: number;
  /** Pre-populated turns showing context growth before any lifecycle action. */
  baselineTurns: SessionTurn[];
  /** Lifecycle actions the learner can fire. */
  actions: SessionLifecycleAction[];
}

export interface SubagentChoice {
  id: string;
  /** Display name (e.g. "Explore", "Plan", "general-purpose"). */
  name: string;
  /** One-line role description. */
  role: string;
  /** Estimated wall-clock seconds for THIS task if run alone. */
  estimatedSeconds: number;
  /** How well this subagent fits the task. */
  fit: 'great' | 'ok' | 'wrong-tool';
  /** Tools available to this subagent. */
  tools: string[];
}

export interface SubagentDispatcherSandbox {
  kind: 'subagent-dispatcher';
  id: string;
  title: string;
  description: string;
  /** The task the learner is delegating. */
  task: string;
  /** Available subagent fleet. */
  agents: SubagentChoice[];
}

export interface McpServerEntry {
  id: string;
  /** Display name (e.g. "github", "linear"). */
  name: string;
  /** One-line description of what it provides. */
  purpose: string;
  /** Tools the server exposes (e.g. ['github.get_pr', 'github.list_issues']). */
  exposes: string[];
}

export interface HookEntry {
  id: string;
  /** Event the hook fires on. */
  event: 'preToolUse' | 'postToolUse' | 'stop' | 'userPromptSubmit';
  /** Optional tool matcher (e.g. 'Edit', 'Bash'). */
  toolMatcher?: string;
  /** Display label for the command run. */
  command: string;
  /** What this hook actually does, in plain English. */
  effect: string;
}

export interface McpHooksSandbox {
  kind: 'mcp-hooks-composer';
  id: string;
  title: string;
  description: string;
  /** MCP servers available to toggle on. */
  servers: McpServerEntry[];
  /** Hooks available to toggle on. */
  hooks: HookEntry[];
  /** A short synthetic event stream — each line names a tool call that would
   *  occur if the learner asks Claude to do something. The composer highlights
   *  which active hooks would fire on each event. */
  eventStream: { id: string; tool: string; description: string }[];
}

export interface HeadlessPart {
  id: string;
  /** What goes into the command on the command line. */
  fragment: string;
  /** What this fragment does, in plain English. */
  explanation: string;
  /** Whether this fragment is required for a valid headless invocation. */
  required: boolean;
}

export interface HeadlessSandbox {
  kind: 'headless-composer';
  id: string;
  title: string;
  description: string;
  /** Parts the learner toggles in / out to build a command. */
  parts: HeadlessPart[];
  /** Sample of what the JSON output would look like (string blob, rendered
   *  in a `<pre>`). */
  sampleOutput: string;
  /** A short `jq` snippet the learner can copy to extract the useful bit. */
  jqSnippet: string;
}

export interface PermissionRule {
  type: 'allow' | 'deny';
  /** Pattern: `Tool` (any args) or `Tool(specific arg)` or `Tool(*)` (wildcard). */
  pattern: string;
}

export interface PermissionToolCall {
  id: string;
  tool: string;
  /** Args (e.g. command for Bash, path for Read). Omitted means "no arg". */
  args?: string;
  /** Short description shown in the queue. */
  description: string;
}

export interface PermissionPreset {
  id: string;
  label: string;
  description: string;
  rules: PermissionRule[];
  /** Marks the teaching foil — over-broad rules that let bad calls through. */
  isAntiPattern?: boolean;
}

export interface PermissionGateSandbox {
  kind: 'permission-gate';
  id: string;
  title: string;
  description: string;
  /** Pre-built tool-call queue the learner simulates against. */
  queue: PermissionToolCall[];
  /** Rule-set presets the learner can apply. */
  presets: PermissionPreset[];
}

// Concept atlas — PROJECT_PLAN.md §5. Surfaced at /atlas.
// Nodes are authored alongside each stage; cross-stage bridges express
// how a concept resurfaces deeper later (e.g. first-touch permission → modes).

export type AtlasNodeLink =
  | { kind: 'stage'; stageId: string }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'quiz'; sectionId: string; questionId?: number };

export interface AtlasNode {
  id: string;
  /** Short label shown on the card. Beginner voice. */
  label: string;
  stageId: string;
  /** Where clicking the node navigates. */
  primaryLink: AtlasNodeLink;
}

export interface AtlasEdge {
  /** Source node id. */
  from: string;
  /** Target node id. Only edges whose endpoints both exist are drawn. */
  to: string;
  kind: 'bridge';
}
