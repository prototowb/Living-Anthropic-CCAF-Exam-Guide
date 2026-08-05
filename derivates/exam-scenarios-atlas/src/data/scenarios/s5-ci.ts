import type { Scenario } from '../types'

export const scenario5: Scenario = {
  id: 'continuous-integration',
  number: 5,
  title: 'Claude Code for Continuous Integration',
  hook: 'Run claude -p in pipelines; emit JSON-schema findings; pick sync vs Message Batches by latency tolerance.',
  brief:
    'You are integrating Claude Code into your Continuous Integration/Continuous Deployment (CI/CD) pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimise false positives.',
  primaryDomains: [3, 4],
  example: {
    title: 'A 14-file PR that confused the reviewer',
    body:
      'A pull request touches 14 files across the stock-tracking module. A single-pass review produced inconsistent feedback — some files got deep analysis, others a sentence. The fix is multi-pass: per-file local passes plus a separate cross-file integration pass. Attention dilutes when 14 files ride in one prompt.',
  },
  infographic: {
    kind: 'ci-pipeline',
    caption:
      'Sync API for blocking pre-merge checks. Message Batches API for overnight reports (50% cheaper, ≤24h SLA, no multi-turn tools). Use custom_id to correlate batch responses.',
  },
  flow: [
    {
      label: 'Pipeline step: claude -p',
      body: 'CI runs Claude Code in non-interactive headless mode with the -p flag. No stdin hangs, no interactive prompts.',
      toolCalls: [
        { name: 'bash', input: 'claude -p "Review PR #482 against checklist" --output-format json --json-schema review.json' },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 3.6 · -p / --print for CI; --output-format json for machine parseable.',
    },
    {
      label: 'CLAUDE.md provides project context',
      body: 'Same CLAUDE.md humans see is loaded by the CI invocation — testing standards, fixtures, review criteria. CI is not a second-class environment.',
      mandate: 'TS 3.6 · Project context flows to CI via CLAUDE.md.',
    },
    {
      label: 'Multi-pass review',
      body: 'For a 14-file PR, two passes are emitted: a per-file local-issue pass (find bugs within each file) and a cross-file integration pass (data flow, contracts). Single-pass would dilute attention.',
      mandate: 'TS 4.6 · Multi-pass review beats one giant pass.',
    },
    {
      label: 'Independent reviewer for self-generated code',
      body: 'If Claude generated the change, an independent instance reviews it — separate session, no reasoning context. Same-session self-review keeps blind spots.',
      mandate: 'TS 4.6 · Independent review > extended-thinking self-review.',
    },
    {
      label: 'Structured output as PR comments',
      body: 'The JSON schema enforces { location, issue, severity, suggested_fix, detected_pattern }. The pipeline parses and posts each as an inline PR comment. detected_pattern enables false-positive analysis later.',
      mandate: 'TS 4.4 · detected_pattern enables systematic false-positive review.',
    },
    {
      label: 'Sync vs Batch by latency',
      body: 'Pre-merge check (blocks developer) → sync API. Overnight tech-debt report (non-blocking) → Message Batches API (50% cheaper, ≤24h, no multi-turn tools).',
      mandate: 'TS 4.5 · Latency tolerance picks the API, not cost alone.',
      stopReason: 'end_turn',
    },
    {
      label: 'Re-running on new commits',
      body: 'Subsequent runs include prior findings in context so the agent reports only NEW or still-unaddressed issues — no duplicate noise.',
      mandate: 'TS 3.6 · Include prior findings; report deltas only.',
    },
  ],
  code: [
    {
      lang: 'bash',
      label: 'CI script',
      body: `#!/usr/bin/env bash
set -euo pipefail

# Headless. Structured output. Same CLAUDE.md as humans.
claude -p "Review PR #\${PR_NUMBER} against /review-checklist" \\
  --output-format json \\
  --json-schema .ci/review-schema.json \\
  > .ci/review.json

# Parse + post as inline PR comments.
node .ci/post-findings.mjs .ci/review.json`,
    },
    {
      lang: 'json',
      label: 'review-schema.json',
      body: `{
  "type": "object",
  "required": ["findings"],
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["location", "severity", "issue", "suggested_fix"],
        "properties": {
          "location":        { "type": "string", "description": "file:line" },
          "severity":        { "enum": ["BLOCKING", "WARNING", "NIT"] },
          "issue":           { "type": "string" },
          "suggested_fix":   { "type": "string" },
          "detected_pattern":{ "type": "string", "description": "category of code that triggered the finding" }
        }
      }
    }
  }
}`,
    },
    {
      lang: 'ts',
      label: 'Multi-pass review strategy',
      body: `// Single pass on 14 files → attention dilution.
// Two passes: per-file local + one cross-file integration.

async function reviewLargePr(files: PrFile[]) {
  const local = await Promise.all(
    files.map((f) =>
      claudeReview({
        prompt: \`Review ONLY \${f.path} for local issues (logic, naming, tests).
Do not comment on cross-file concerns.\`,
        files: [f],
      }),
    ),
  );

  const integration = await claudeReview({
    prompt: \`Review the PR for cross-file concerns ONLY: contracts between files,
data flow, breaking changes. Ignore single-file issues already reported.\`,
    files,
    priorFindings: local.flat(),
  });

  return [...local.flat(), ...integration];
}`,
    },
    {
      lang: 'ts',
      label: 'Batches vs sync — match latency to use case',
      body: `// Pre-merge: blocks developer — synchronous.
async function preMergeCheck(prDiff: string) {
  return client.messages.create({ /* sync */ });
}

// Overnight tech-debt report: latency tolerant — Message Batches API (50% cheaper).
async function overnightTechDebtReport(modules: string[]) {
  const requests = modules.map((m, i) => ({
    custom_id: \`debt-\${m}-\${i}\`, // ← correlation
    params: { /* messages */ },
  }));
  const batch = await client.messages.batches.create({ requests });
  // Poll for completion (≤24h SLA). No multi-turn tool use within a request.
  return batch;
}`,
    },
  ],
  qna: [
    {
      q: 'Your pipeline script runs claude "Analyze this pull request for security issues" but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What is the correct approach to run Claude Code in an automated pipeline?',
      options: [
        { key: 'A', text: 'Add the -p flag: claude -p "Analyze this pull request for security issues".' },
        { key: 'B', text: 'Set the environment variable CLAUDE_HEADLESS=true before running the command.' },
        { key: 'C', text: 'Redirect stdin from /dev/null: claude "Analyze this pull request for security issues" < /dev/null.' },
        { key: 'D', text: 'Add the --batch flag: claude --batch "Analyze this pull request for security issues".' },
      ],
      correct: 'A',
      explain:
        'The -p (or --print) flag is the documented way to run Claude Code in non-interactive mode. It processes the prompt, outputs the result to stdout, and exits without waiting for user input — exactly what CI/CD pipelines require. The other options reference non-existent features (CLAUDE_HEADLESS env var, --batch flag) or use Unix workarounds that don\'t properly address Claude Code\'s command syntax.',
      ref: 'Sample Q10 · TS 3.6',
    },
    {
      q: 'Your team wants to reduce API costs for automated analysis. Currently, real-time Claude calls power two workflows: (1) a blocking pre-merge check that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. Your manager proposes switching both to the Message Batches API for its 50% cost savings. How should you evaluate this proposal?',
      options: [
        { key: 'A', text: 'Use batch processing for the technical debt reports only; keep real-time calls for pre-merge checks.' },
        { key: 'B', text: 'Switch both workflows to batch processing with status polling to check for completion.' },
        { key: 'C', text: 'Keep real-time calls for both workflows to avoid batch result ordering issues.' },
        { key: 'D', text: 'Switch both to batch processing with a timeout fallback to real-time if batches take too long.' },
      ],
      correct: 'A',
      explain:
        'The Message Batches API offers 50% cost savings but has processing times up to 24 hours with no guaranteed latency SLA. This makes it unsuitable for blocking pre-merge checks where developers wait for results, but ideal for overnight batch jobs like technical debt reports. Option B is wrong because relying on "often faster" completion isn\'t acceptable for blocking workflows. Option C reflects a misconception — batch results can be correlated using custom_id fields. Option D adds unnecessary complexity when the simpler solution is matching each API to its appropriate use case.',
      ref: 'Sample Q11 · TS 4.5',
    },
    {
      q: 'A pull request modifies 14 files across the stock tracking module. Your single-pass review analysing all files together produces inconsistent results: detailed feedback for some files but superficial comments for others, obvious bugs missed, and contradictory feedback — flagging a pattern as problematic in one file while approving identical code elsewhere in the same PR. How should you restructure the review?',
      options: [
        { key: 'A', text: 'Split into focused passes: analyse each file individually for local issues, then run a separate integration-focused pass examining cross-file data flow.' },
        { key: 'B', text: 'Require developers to split large PRs into smaller submissions of 3-4 files before the automated review runs.' },
        { key: 'C', text: 'Switch to a higher-tier model with a larger context window to give all 14 files adequate attention in one pass.' },
        { key: 'D', text: 'Run three independent review passes on the full PR and only flag issues that appear in at least two of the three runs.' },
      ],
      correct: 'A',
      explain:
        'Splitting reviews into focused passes directly addresses the root cause: attention dilution when processing many files at once. File-by-file analysis ensures consistent depth, while a separate integration pass catches cross-file issues. Option B shifts burden to developers without improving the system. Option C misunderstands that larger context windows don\'t solve attention quality issues. Option D would actually suppress detection of real bugs by requiring consensus on issues that may only be caught intermittently.',
      ref: 'Sample Q12 · TS 4.6',
    },
  ],
  takeaways: [
    '-p flag is the bridge from interactive Claude Code to CI/CD.',
    'Pick sync vs Message Batches by latency tolerance, not cost in isolation.',
    'On large PRs, multi-pass (per-file + integration) beats single-pass.',
  ],
}
