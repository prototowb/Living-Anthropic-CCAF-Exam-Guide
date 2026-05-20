// First-Contact Resolution (FCR) evaluation harness for the Help Bot
// (Architect Scenario 1 — Customer Support Resolution Agent, v0.4 task 9).
//
// Usage:
//   npm run eval:helpbot
//
// Exits 0 when the aggregate resolution rate is ≥ 80 % (the architect target).
// Exits 1 otherwise.
//
// Notes:
//   - Runs against the default adapter (mockAdapter — no API key, no network).
//   - `localStorage` is undefined in Node; every helpBot tool that touches it
//     wraps the access in try/catch and degrades to an empty state. The
//     coordinator survives that gracefully (checkProgress returns zeroed
//     counts; lookupQuizAttempts returns a business error).
//   - Each fixture is preceded by a `noop reset` prompt that fires the
//     coordinator's natural counter-reset path so the module-level
//     `_consecutiveBusinessErrors` doesn't leak across fixtures.

import { helpBot } from '../src/agents/helpBot/coordinator';
import {
  helpBotFixtures,
  type HelpBotFixture,
  type FixtureTopic,
} from '../src/data/_fixtures/helpBotEval';

const PASS_RATE = 0.8;

interface FixtureResult {
  fixture: HelpBotFixture;
  /** "Resolved" = non-escalated AND non-empty reply text. */
  resolved: boolean;
  /** Whether the actual outcome matches the fixture's expectation. */
  pass: boolean;
  /** Names of every tool call the coordinator recorded (camelCase). */
  toolCalls: string[];
  /** Actual escalation reason if any. */
  escalationReason: string | null;
  /** First ~120 chars of the reply for the per-fixture line. */
  textPreview: string;
  /** Free-form reason for a failure, if any (helps triage). */
  failureNote?: string;
}

function preview(text: string, max = 120): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length <= max ? oneLine : oneLine.slice(0, max - 1) + '…';
}

async function resetCoordinatorCounters(): Promise<void> {
  // Any prompt that does NOT trigger the lessonMatch regex resets the
  // module-level `_consecutiveBusinessErrors` counter to 0 inside the
  // coordinator. We use a deliberately bland prompt for this — it will
  // produce a low_confidence escalation, but the only side effect we care
  // about is the counter reset.
  await helpBot.handle('reset-noop-fixture-prelude');
}

async function runFixture(f: HelpBotFixture): Promise<FixtureResult> {
  await resetCoordinatorCounters();
  const reply = await helpBot.handle(f.prompt);

  const escalated = reply.escalated !== null;
  const nonEmpty = reply.text.trim().length > 0;
  const resolved = !escalated && nonEmpty;
  const toolCalls = reply.toolCalls.map((t) => t.name);
  const escalationReason = reply.escalated?.reason ?? null;

  let pass = resolved === f.expectedResolve;
  let failureNote: string | undefined;

  if (!pass) {
    failureNote = f.expectedResolve
      ? `expected resolve; got ${escalated ? `escalation(${escalationReason})` : 'empty reply'}`
      : `expected escalation; got resolved reply`;
  }

  // Optional checks — these only DOWNGRADE a pass, never flip a fail to pass.
  if (pass && f.expectedTool && !toolCalls.includes(f.expectedTool)) {
    pass = false;
    failureNote = `expected tool "${f.expectedTool}" not fired; got [${toolCalls.join(', ') || 'none'}]`;
  }
  if (
    pass &&
    !f.expectedResolve &&
    f.expectedEscalationReason &&
    escalationReason !== f.expectedEscalationReason
  ) {
    pass = false;
    failureNote = `expected escalation reason "${f.expectedEscalationReason}"; got "${escalationReason ?? 'none'}"`;
  }

  return {
    fixture: f,
    resolved,
    pass,
    toolCalls,
    escalationReason,
    textPreview: preview(reply.text),
    failureNote,
  };
}

function formatStratumLine(
  topic: FixtureTopic,
  results: FixtureResult[],
): string {
  const subset = results.filter((r) => r.fixture.topic === topic);
  if (subset.length === 0) return `  ${topic.padEnd(12)} — n/a`;
  const passes = subset.filter((r) => r.pass).length;
  const rate = (passes / subset.length) * 100;
  return `  ${topic.padEnd(12)} ${passes}/${subset.length}  (${rate.toFixed(1)}%)`;
}

async function main(): Promise<void> {
  console.log(`Help Bot FCR eval — ${helpBotFixtures.length} fixtures\n`);
  console.log(`Target: ≥ ${PASS_RATE * 100}% (architect Scenario 1)`);
  console.log('---');

  const results: FixtureResult[] = [];
  for (const f of helpBotFixtures) {
    const r = await runFixture(f);
    results.push(r);
    const marker = r.pass ? 'PASS' : 'FAIL';
    const expect = f.expectedResolve ? 'resolve' : 'escalate';
    const got = r.resolved
      ? 'resolved'
      : `escalated(${r.escalationReason ?? 'n/a'})`;
    const tools = r.toolCalls.length ? ` tools=[${r.toolCalls.join(',')}]` : '';
    console.log(
      `  [${marker}] ${f.id.padEnd(34)} expect=${expect.padEnd(9)} got=${got.padEnd(28)}${tools}`,
    );
    if (r.failureNote) {
      console.log(`         note: ${r.failureNote}`);
      console.log(`         text: ${r.textPreview}`);
    }
  }

  const total = results.length;
  const passes = results.filter((r) => r.pass).length;
  const resolveExpected = results.filter((r) => r.fixture.expectedResolve);
  const resolveActual = resolveExpected.filter((r) => r.resolved).length;
  const fcr = resolveExpected.length > 0
    ? resolveActual / resolveExpected.length
    : 0;
  const overallPassRate = total > 0 ? passes / total : 0;

  console.log('---');
  console.log('Per-stratum pass rate:');
  console.log(formatStratumLine('navigation', results));
  console.log(formatStratumLine('progress', results));
  console.log(formatStratumLine('lesson', results));
  console.log(formatStratumLine('escalation', results));
  console.log('---');
  console.log(
    `Total fixtures            : ${total}`,
  );
  console.log(
    `Total passes              : ${passes} (${(overallPassRate * 100).toFixed(1)}%)`,
  );
  console.log(
    `First-contact resolution  : ${resolveActual}/${resolveExpected.length} (${(fcr * 100).toFixed(1)}%)`,
  );
  console.log(`Target FCR                : ${(PASS_RATE * 100).toFixed(0)}%`);

  if (fcr >= PASS_RATE) {
    console.log(`\nPASS — FCR meets the architect target.`);
    process.exit(0);
  } else {
    console.log(
      `\nFAIL — FCR ${(fcr * 100).toFixed(1)}% below target ${(PASS_RATE * 100).toFixed(0)}%.`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('eval-helpbot crashed:', err);
  process.exit(2);
});
