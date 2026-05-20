// Barrel re-export for the shared agent schemas namespace.
//
// Scenario 6 v0.4 task 9. The per-file modules (`source.ts`, `parse.ts`,
// `reviewOutput.ts`) remain canonical — this file is purely a single import
// path so consumers don't need to know which file owns which shape. Adding
// schemas here is additive; the per-file imports stay valid.
//
// Anyone importing `@/agents/schemas/source` (etc.) keeps working; new code
// SHOULD prefer `@/agents/schemas`. The barrel is what Scenario 4's citations
// and Scenario 6's provenance / extraction validators meet at.
//
// Constraint: nothing here may pull Ajv into the SPA bundle. The compiled
// validators live in `scripts/extract/lib/validate.ts` and stay there.

export * from './source';
export * from './parse';
export * from './reviewOutput';
