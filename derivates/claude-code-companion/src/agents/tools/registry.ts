// Unified tool spec registry (Architect TS 2.1 + SYNTHESIS.md S-2).
//
// Every tool in the codebase exports a sibling `<name>Spec` carrying its
// MCP-grade shape: `{ name, description, input_schema }`. This registry
// aggregates them so the SDK adapter can hand the whole roster to Claude in
// the v0.3 model-driven dispatch path (when `adapter.capabilities.nativeToolUse`
// is true). v0.1 + v0.2 code paths still call the underlying functions directly;
// the registry is *forward infrastructure*, not currently load-bearing.
//
// Tools are partitioned by *owning agent* because allowedTools is a per-agent
// concept (architect mandate — different agents get different toolboxes).

import {
  getLessonSpec,
  checkProgressSpec,
  lookupQuizAttemptsSpec,
  recordWeakSpotSpec,
  escalateToDocsSpec,
} from '../helpBot/tools';
import { tutorResearcherTools } from '../tutor/tools';

export type ToolSpec = {
  readonly name: string;
  readonly description: string;
  readonly input_schema: Readonly<Record<string, unknown>>;
};

/** Tools allowed to the Help Bot coordinator (Scenario 1).
 *  v0.2 adds quiz-attempt lookup + weak-spot recording.
 *  v0.3 adds the terminal `escalate_to_docs` tool. */
export const HELP_BOT_TOOLS = [
  getLessonSpec,
  checkProgressSpec,
  lookupQuizAttemptsSpec,
  recordWeakSpotSpec,
  escalateToDocsSpec,
] as const;

/** Tools allowed to the Tutor's codebase-researcher subagent (Scenario 4).
 *  Populated in v0.2: read_source_file, grep_source, glob_paths. */
export const TUTOR_RESEARCHER_TOOLS = tutorResearcherTools;

/** Lookup by name. Returns undefined if a name isn't registered. */
export function getToolSpec(name: string): ToolSpec | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}

const ALL_TOOLS: readonly ToolSpec[] = [...HELP_BOT_TOOLS, ...TUTOR_RESEARCHER_TOOLS];

/** Read-only roster of every registered tool. Used by the under-the-hood
 *  surface to enumerate Scenario-1-grade tools, and (v0.3+) by the adapter
 *  composer when building the model-facing tool list. */
export function allToolSpecs(): readonly ToolSpec[] {
  return ALL_TOOLS;
}
