# Extraction pipeline — local rules

These rules **extend** the root `CLAUDE.md`. They apply only to `scripts/extract/**`.

1. **`scripts/**` may import `ajv` and `node:*`; `src/**` may NOT.** This is the lint guard the bundle stays clean against — Ajv adds ~30 kB and the SPA never imports it.
2. **Every emitted record carries `_provenance`** (TS 5.6). The validator rejects records that don't. Don't fork the provenance shape — extend `scripts/extract/lib/provenance.ts`.
3. **Each schema ships 2–4 few-shot examples** (TS 4.2). Fewer is unreliable; more dilutes attention. Author them in `scripts/extract/fewShot/<schemaName>.ts`.
4. **Re-running with an unchanged source must be byte-identical.** Set `EXTRACT_FROZEN_TIME` to lock `extractedAt`. The fixture adapter computes the real `sourceHash` from the live source so a content change shows up as a hash diff.
5. **`_generated/*` is checked in.** CI runs `npm run extract` and fails on any `git diff src/data/_generated/`. Drift is a silent failure mode; surface it loudly.
6. **The fixture adapter is the default; the `api` adapter ships in v0.3.** Select via `EXTRACT_ADAPTER`:
   - `EXTRACT_ADAPTER=fixture` (default) — deterministic, offline, used by CI's byte-equality check.
   - `EXTRACT_ADAPTER=api` — wraps `src/sdk/realAdapter.ts`'s tool_use path. Requires `ANTHROPIC_API_KEY`. The orchestrator retries up to 2× with Ajv error feedback (TS 4.4) before failing. Output is structurally equivalent to the fixture (not byte-identical — see Risks in `sprints/scenario-6-structured-extraction.md`).
7. **System prompts encode the architect-mandated constraints** (nullable optionals, "unclear"/"other" enums, no fabrication when source lacks info). Audit them when bumping schema versions.
8. **Edge-case fixtures live under `fixtures/__edges__/` and run via `npm run extract:edges`.** They are NOT registered in `sources.ts` — they exist to assert the four `ExtractionError` kinds (`ambiguous` | `partial` | `empty` | `conflict`, defined in `lib/types.ts`). A passing edges run is the v0.3 acceptance for TS 4.4 graceful edge-case handling.
9. **`npm run extract:probe` enforces `AdapterCapabilities.schemaMode` honesty.** The probe asks each adapter for a known-shape extraction and flags any adapter that claims `schemaMode: true` while returning malformed JSON. The `unreliable` synthetic adapter (`src/sdk/__fixtures__/unreliableAdapter.ts`) is included as a regression target — forcing `schemaMode: true` on it must trip the probe.
