// Assembled domain index. Re-exported from `src/data/domains.ts` for backwards
// compatibility with existing imports throughout the app.

import type { Domain } from './types';
import { d1Patterns } from './d1';
import { d2Patterns } from './d2';
import { d3Patterns } from './d3';
import { d4Patterns } from './d4';
import { d5Patterns } from './d5';

export const domains: Domain[] = [
  {
    id: 'd1',
    number: 1,
    slug: 'agentic-architecture',
    title: 'Agentic Architecture & Orchestration',
    subtitle: 'Hub-and-Spoke, the Task tool, parallel execution, decomposition',
    description:
      'A central coordinator owns the conversation and dispatches specialized subagents. ' +
      'Independent work runs in parallel. The Task tool is what makes the dispatch possible — ' +
      'it is always part of the coordinator\'s allowedTools. Loops are driven by stop_reason, ' +
      'not by parsing assistant text. When deterministic compliance is needed, programmatic ' +
      'prerequisites and PostToolUse hooks enforce rules that prompts cannot guarantee.',
    badgeClass: 'domain-ci',
    patterns: d1Patterns,
    relatedQuiz: [
      { sectionId: 's2', questionIds: [4, 9, 15] },
      { sectionId: 's4', questionIds: [2, 8, 13, 14] },
    ],
  },
  {
    id: 'd2',
    number: 2,
    slug: 'tool-design-mcp',
    title: 'Tool Design & MCP Integration',
    subtitle: 'Granular tools, structured errors, distribution, MCP scoping',
    description:
      'Many small, single-purpose tools beat one monolithic one — the model picks more ' +
      'reliably. Every tool returns a structured response with isError + errorCategory so ' +
      'the caller can react (retry vs change strategy). Tool distribution follows least ' +
      'privilege; tool_choice controls whether and which tool fires. MCP servers split ' +
      'into team scope (.mcp.json) and personal scope (~/.claude.json).',
    badgeClass: 'domain-support',
    patterns: d2Patterns,
    relatedQuiz: [
      { sectionId: 's2', questionIds: [1, 3, 6, 8, 12] },
      { sectionId: 's3', questionIds: [4] },
      { sectionId: 's4', questionIds: [3, 4, 5, 6, 7, 9] },
    ],
  },
  {
    id: 'd3',
    number: 3,
    slug: 'config-workflows',
    title: 'Claude Code Configuration & Workflows',
    subtitle: 'CLAUDE.md hierarchy, path rules, plan vs direct, skills, CI/CD',
    description:
      'CLAUDE.md is hierarchical: root for repo-wide standards, subdirectory files for ' +
      'area-specific rules. Path-scoped rules in .claude/rules/ load only for matching ' +
      'globs. Skills frontmatter (context: fork, allowed-tools, argument-hint) controls ' +
      'isolation and capability. Plan Mode for architectural changes; Direct Execution for ' +
      'narrow bug fixes. CI uses -p, --output-format json, --json-schema.',
    badgeClass: 'domain-codegen',
    patterns: d3Patterns,
    relatedQuiz: [
      { sectionId: 's1', questionIds: [6, 8, 13] },
      { sectionId: 's3', questionIds: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    ],
  },
  {
    id: 'd4',
    number: 4,
    slug: 'prompt-engineering',
    title: 'Prompt Engineering & Structured Output',
    subtitle: 'Explicit criteria, few-shot, JSON schemas, retries, batches, multi-instance',
    description:
      'Structured output is enforced with tool use + JSON Schema. Few-shot prompts ' +
      '(2–4 worked examples on ambiguous cases) beat declarative rules. Explicit criteria ' +
      'beat vague directives. Validate, retry with specific error feedback, and know when ' +
      'retries cannot help. The Message Batches API trades latency for 50% cost. ' +
      'Multi-instance review uses an independent reviewer for catching subtle issues.',
    badgeClass: 'domain-codegen',
    patterns: d4Patterns,
    relatedQuiz: [
      { sectionId: 's1', questionIds: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 14] },
      { sectionId: 's2', questionIds: [13] },
      { sectionId: 's3', questionIds: [5] },
    ],
  },
  {
    id: 'd5',
    number: 5,
    slug: 'context-reliability',
    title: 'Context Management & Reliability',
    subtitle: 'Pruning, scratchpad, escalation, error propagation, calibration, provenance',
    description:
      'Long sessions decay. Pruning trims verbose tool outputs before they accumulate. The ' +
      'scratchpad persists key findings; the case-facts block keeps transactional details ' +
      'verbatim. Escalation is hard-predicate, not vibes. Errors in multi-agent systems ' +
      'propagate as structured context so the coordinator can recover. Human review is ' +
      'driven by per-segment calibration, stratified sampling, and field-level confidence. ' +
      'Conflicts are annotated with provenance, not arbitrarily resolved.',
    badgeClass: 'domain-ops',
    patterns: d5Patterns,
    relatedQuiz: [
      { sectionId: 's1', questionIds: [7, 15] },
      { sectionId: 's2', questionIds: [10, 11, 14, 15] },
      { sectionId: 's3', questionIds: [15] },
      { sectionId: 's4', questionIds: [1, 2, 5, 7, 10, 11, 12] },
    ],
  },
];

export function getDomain(id: string): Domain | undefined {
  return domains.find((d) => d.id === id || d.slug === id);
}

export type * from './types';
