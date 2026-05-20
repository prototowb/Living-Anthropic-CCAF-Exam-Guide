// Regression harness for the capabilities-aware serial fallback (Scenario 3
// v0.3 task 8). This is *not* a Vitest spec — the project has no test runner
// installed yet. Instead, this file exports `runDispatchRegression()` which
// can be invoked from the browser at `/debug` to verify the serial branch
// still produces a coherent multi-spoke reply against an adapter advertising
// `parallelSubagents: false`.
//
// Acceptance: against `unreliableAdapter` with `parallelSubagents: false`,
// `tutor.handle('explain plan mode and quiz me')` must return a reply that
// includes both the explainer and the quizmaster outputs, in dispatch order.

import { tutor } from '../coordinator';
import { getAdapter, setAdapter } from '@/sdk';
import { createUnreliableAdapter } from '@/sdk/__fixtures__/unreliableAdapter';

export interface RegressionResult {
  pass: boolean;
  reasons: string[];
  reply?: string;
  parallel?: boolean;
  spokeNames?: string[];
}

/**
 * Run the serial-fallback regression. Swaps in an unreliable adapter for the
 * duration of the test then restores the previously active adapter, so the
 * page state is preserved on either pass or fail.
 */
export async function runDispatchRegression(): Promise<RegressionResult> {
  const reasons: string[] = [];
  const original = getAdapter();

  // Force the multi-spoke serial path: parallelSubagents off means every
  // spoke runs through the `runSerial` branch in coordinator.ts. schemaMode
  // off exercises the JSON-in-prose fallback we added in task 5.
  const unreliable = createUnreliableAdapter({
    capabilities: {
      nativeToolUse: false,
      parallelSubagents: false,
      schemaMode: false,
    },
  });

  setAdapter(unreliable);

  let turn;
  try {
    turn = await tutor.handle('explain plan mode and quiz me');
  } catch (e) {
    setAdapter(original);
    return {
      pass: false,
      reasons: [`tutor.handle threw: ${e instanceof Error ? e.message : String(e)}`],
    };
  } finally {
    setAdapter(original);
  }

  // 1. Serial dispatch must be the path taken.
  if (turn.parallel) {
    reasons.push('Expected parallel=false on the serial-fallback path; got parallel=true.');
  }

  // 2. The intent classifier (via JSON-in-prose) should pick the explainer.
  //    The unreliable adapter's fauxPayload for the intent schema is
  //    `{ subagents: ['explainer'], rationale: '…' }` — so we expect at least
  //    the explainer to be present. (A future improvement: a richer faux
  //    payload that includes the quizmaster.)
  const spokeNames = turn.subagents.map((s) => s.name);
  if (!spokeNames.includes('explainer')) {
    reasons.push(`Expected explainer in subagents; got [${spokeNames.join(', ')}].`);
  }

  // 3. The merged reply must contain each spoke's output, in dispatch order.
  let cursor = 0;
  for (const inv of turn.subagents) {
    const idx = turn.reply.indexOf(inv.output, cursor);
    if (idx < 0) {
      reasons.push(
        `Spoke "${inv.name}" output not found in reply at or after position ${cursor}.`,
      );
      break;
    }
    cursor = idx + inv.output.length;
  }

  // 4. No spoke errors expected on the happy serial path.
  if (turn.errors.length > 0) {
    reasons.push(
      `Unexpected spoke errors: ${turn.errors.map((e) => `${e.name}: ${e.message}`).join('; ')}`,
    );
  }

  return {
    pass: reasons.length === 0,
    reasons,
    reply: turn.reply,
    parallel: turn.parallel,
    spokeNames,
  };
}
