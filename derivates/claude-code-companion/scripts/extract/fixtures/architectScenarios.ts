// Architect scenarios fixture — verbatim from the exam-guide PDF
// (`sprints/_exam-guide.txt`, lines 91-148). The fixture adapter attaches
// _provenance with the live source hash + line ranges at extract time.

interface ArchitectScenarioFixture {
  number: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  description: string;
  primaryDomains: string[];
  /** Source line range (passed through to provenance). */
  lineStart: number;
  lineEnd: number;
}

export const architectScenariosFixture: ArchitectScenarioFixture[] = [
  {
    number: 1,
    name: 'Customer Support Resolution Agent',
    description:
      'You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom Model Context Protocol (MCP) tools (get_customer, lookup_order, process_refund, escalate_to_human). Your target is 80%+ first-contact resolution while knowing when to escalate.',
    primaryDomains: [
      'Agentic Architecture & Orchestration',
      'Tool Design & MCP Integration',
      'Context Management & Reliability',
    ],
    lineStart: 91,
    lineEnd: 99,
  },
  {
    number: 2,
    name: 'Code Generation with Claude Code',
    description:
      'You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution.',
    primaryDomains: [
      'Claude Code Configuration & Workflows',
      'Context Management & Reliability',
    ],
    lineStart: 101,
    lineEnd: 107,
  },
  {
    number: 3,
    name: 'Multi-Agent Research System',
    description:
      'You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialized subagents: one searches the web, one analyzes documents, one synthesizes findings, and one generates reports. The system researches topics and produces comprehensive, cited reports.',
    primaryDomains: [
      'Agentic Architecture & Orchestration',
      'Tool Design & MCP Integration',
      'Context Management & Reliability',
    ],
    lineStart: 109,
    lineEnd: 120,
  },
  {
    number: 4,
    name: 'Developer Productivity with Claude',
    description:
      'You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate code, and automate repetitive tasks. It uses the built-in tools (Read, Write, Bash, Grep, Glob) and integrates with Model Context Protocol (MCP) servers.',
    primaryDomains: [
      'Tool Design & MCP Integration',
      'Claude Code Configuration & Workflows',
      'Agentic Architecture & Orchestration',
    ],
    lineStart: 122,
    lineEnd: 129,
  },
  {
    number: 5,
    name: 'Claude Code for Continuous Integration',
    description:
      'You are integrating Claude Code into your Continuous Integration/Continuous Deployment (CI/CD) pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimize false positives.',
    primaryDomains: [
      'Claude Code Configuration & Workflows',
      'Prompt Engineering & Structured Output',
    ],
    lineStart: 131,
    lineEnd: 138,
  },
  {
    number: 6,
    name: 'Structured Data Extraction',
    description:
      'You are building a structured data extraction system using Claude. The system extracts information from unstructured documents, validates the output using JavaScript Object Notation (JSON) schemas, and maintains high accuracy. It must handle edge cases gracefully and integrate with downstream systems.',
    primaryDomains: [
      'Prompt Engineering & Structured Output',
      'Context Management & Reliability',
    ],
    lineStart: 140,
    lineEnd: 146,
  },
];
