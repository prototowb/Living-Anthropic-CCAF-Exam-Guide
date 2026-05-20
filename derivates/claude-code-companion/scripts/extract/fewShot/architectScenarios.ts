// Few-shot examples for the architect-scenarios extraction (TS 4.2).
// Two examples spanning a short scenario and a long one — teaches the model
// the verbatim-name + parsed-primary-domains shape.

import type { FewShotExample } from '../lib/types';
import { ARCHITECT_SCENARIOS_SCHEMA_VERSION } from '../schemas/architectScenarios';

const PROV = (lineStart: number, lineEnd: number) => ({
  sourcePath: 'sprints/_exam-guide.txt',
  sourceHash: 'a'.repeat(64),
  extractedAt: '2026-01-01T00:00:00.000Z',
  schemaVersion: ARCHITECT_SCENARIOS_SCHEMA_VERSION,
  lineStart,
  lineEnd,
});

export const ARCHITECT_SCENARIOS_FEWSHOT: FewShotExample[] = [
  {
    user:
      'Scenario 1: Customer Support Resolution Agent\nYou are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues.\n\nPrimary domains: Agentic Architecture & Orchestration, Tool Design & MCP Integration, Context Management & Reliability\n',
    assistant: JSON.stringify({
      scenarios: [
        {
          number: 1,
          name: 'Customer Support Resolution Agent',
          description:
            'You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues.',
          primaryDomains: [
            'Agentic Architecture & Orchestration',
            'Tool Design & MCP Integration',
            'Context Management & Reliability',
          ],
          _provenance: PROV(91, 99),
        },
      ],
    }),
  },
  {
    user:
      'Scenario 2: Code Generation with Claude Code\nYou are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation.\n\nPrimary domains: Claude Code Configuration & Workflows, Context Management & Reliability\n',
    assistant: JSON.stringify({
      scenarios: [
        {
          number: 2,
          name: 'Code Generation with Claude Code',
          description:
            'You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation.',
          primaryDomains: [
            'Claude Code Configuration & Workflows',
            'Context Management & Reliability',
          ],
          _provenance: PROV(101, 107),
        },
      ],
    }),
  },
];
