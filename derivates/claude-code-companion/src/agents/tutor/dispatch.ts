// dispatchAllSettled — replaces `Promise.all` for hub-and-spoke subagent dispatch
// (Architect TS 5.3 — Error propagation across multi-agent; SYNTHESIS.md S-3).
//
// The TS 5.3 anti-pattern is using `Promise.all` to fan out subagent calls:
// a single spoke rejection rejects the whole turn, so the user sees nothing
// when 3 of 4 spokes succeeded. `Promise.allSettled` solves the propagation;
// this helper wraps it so callers get a typed `{ results, errors }` split and
// the error list is well-formed for downstream escalation logic.
//
// Parallel vs serial dispatch is the caller's decision (capabilities-aware in
// `coordinator.ts`). This helper is parallel — for serial, just await in a loop.

export interface DispatchOutcome<T> {
  results: T[];
  errors: Array<{
    /** Position in the *input* array — preserves the caller's intended order. */
    index: number;
    /** Thrown value (typically `Error`, but `unknown` per spec). */
    error: unknown;
  }>;
}

/**
 * Run all the given task factories in parallel and split successes from
 * failures. Order of `results` mirrors the order of the successful inputs;
 * `errors` carries `{index, error}` per failed input.
 *
 * @example
 *   const outcome = await dispatchAllSettled(
 *     intent.subagents.map((name) => () => subagentRegistry[name](prompt)),
 *   );
 *   if (outcome.results.length === 0) {
 *     // every spoke failed — escalate
 *   } else {
 *     // merge what we have; surface outcome.errors in the UI footer
 *   }
 */
export async function dispatchAllSettled<T>(
  tasks: Array<() => Promise<T>>,
): Promise<DispatchOutcome<T>> {
  const settled = await Promise.allSettled(tasks.map((t) => t()));
  const results: T[] = [];
  const errors: DispatchOutcome<T>['errors'] = [];
  settled.forEach((s, index) => {
    if (s.status === 'fulfilled') {
      results.push(s.value);
    } else {
      errors.push({ index, error: s.reason });
    }
  });
  return { results, errors };
}

/** Human-readable one-liner for an error from `dispatchAllSettled`. Used by
 *  the Tutor coordinator's "[N spoke(s) failed]" footer. */
export function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return 'unknown error';
  }
}
