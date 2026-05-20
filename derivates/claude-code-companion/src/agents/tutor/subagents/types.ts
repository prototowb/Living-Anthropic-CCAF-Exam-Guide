export interface SubagentInvocation {
  name: string;
  durationMs: number;
  /** Full output for surface rendering. Verbose. */
  output: string;
  /**
   * Short (≤ 240 chars) summary of `output`. Added v0.3 per
   * sprints/scenario-4-developer-productivity.deepening.md task 3 (TS 5.4 —
   * context isolation in large-codebase exploration). Coordinators reading
   * back across turns can prefer this over the full output to keep context
   * flat across long sessions.
   */
  summary?: string;
  toolCalls: { name: string; input: Record<string, unknown> }[];
}
