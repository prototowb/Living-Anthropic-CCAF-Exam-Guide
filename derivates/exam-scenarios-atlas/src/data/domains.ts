import type { Domain } from './types'

export const DOMAINS: Domain[] = [
  {
    id: 1,
    title: 'Agentic Architecture & Orchestration',
    weight: 27,
    oneLiner: 'Agentic loops, coordinator–subagent patterns, hooks, decomposition, session state.',
  },
  {
    id: 2,
    title: 'Tool Design & MCP Integration',
    weight: 18,
    oneLiner: 'Tool descriptions, structured errors, scoped tool sets, MCP servers, built-ins.',
  },
  {
    id: 3,
    title: 'Claude Code Configuration & Workflows',
    weight: 20,
    oneLiner: 'CLAUDE.md hierarchy, slash commands, skills, .claude/rules/, plan vs direct.',
  },
  {
    id: 4,
    title: 'Prompt Engineering & Structured Output',
    weight: 20,
    oneLiner: 'Explicit criteria, few-shot, tool_use schemas, validation-retry, batch processing.',
  },
  {
    id: 5,
    title: 'Context Management & Reliability',
    weight: 15,
    oneLiner: 'Long-context coherence, escalation, error propagation, provenance, human review.',
  },
]

export function domainById(id: number) {
  return DOMAINS.find((d) => d.id === id)
}
