// Sandbox transcripts. Pure data; sandbox components render these and add UI.
// v0.1 ships one: First-Session REPL.

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
  id: string;
  title: string;
  description: string;
  /**
   * Permission mode toggle changes which "permission" lines appear and the
   * downstream tool-call lines. v0.1 ships the `default` track.
   */
  modes: Record<'default' | 'acceptEdits' | 'plan' | 'yolo', ReplLine[]>;
}

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

export const sandboxes = [firstSessionTranscript];

export function getSandbox(id: string) {
  return sandboxes.find((s) => s.id === id);
}
