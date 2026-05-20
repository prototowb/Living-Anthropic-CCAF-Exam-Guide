// Ajv-backed validator — Architect TS 4.4 (validation step of the
// validation/retry/feedback loop).
//
// v0.2: on validation failure, log the Ajv errors and abort (exit 1). The
// caller never writes a partial `_generated/` file.
// v0.3 will replace this fail-fast with a bounded retry that re-prompts the
// model with the Ajv error path appended.

import Ajv, { type ErrorObject } from 'ajv';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  errors?: ErrorObject[];
}

export function validate<T>(
  schema: Record<string, unknown>,
  payload: unknown,
): ValidationResult<T> {
  const validateFn = ajv.compile(schema);
  if (validateFn(payload)) {
    return { ok: true, data: payload as T };
  }
  return { ok: false, errors: validateFn.errors ?? [] };
}

/** Render Ajv errors as a short multi-line string for the orchestrator log. */
export function formatErrors(errs: ErrorObject[]): string {
  return errs
    .slice(0, 12)
    .map((e) => `  - ${e.instancePath || '<root>'} ${e.message}`)
    .join('\n');
}
