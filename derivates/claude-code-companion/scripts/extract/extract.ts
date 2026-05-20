// Orchestrator — Scenario 6 v0.3 entry point.
//
//   $ npm run extract                                  # fixture adapter (default)
//   $ EXTRACT_ADAPTER=api ANTHROPIC_API_KEY=… npm run extract
//   $ EXTRACT_FROZEN_TIME=… npm run extract            # byte-deterministic re-runs
//
// Loop: for each registered source, build the adapter request, extract, validate
// against the document schema, emit a typed TS module to src/data/_generated/.
//
// v0.3 changes (vs v0.2):
//   1. `EXTRACT_ADAPTER` env var selects `fixture` (default) or `api`.
//   2. On validation failure against the `api` adapter, the orchestrator retries
//      up to 2 times, threading the Ajv error path back as feedback (TS 4.4).
//      The fixture adapter is deterministic — retrying a fixture is pointless,
//      so the retry loop is conditional on `adapter.kind === 'api'`.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureAdapter } from './lib/fixtureAdapter';
import { createApiAdapter } from './lib/apiAdapter';
import { validate, formatErrors } from './lib/validate';
import type { ExtractAdapter } from './lib/types';
import { SOURCES, type SourceConfig } from './sources';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

const MAX_RETRIES = 2; // up to 3 attempts per source (TS 4.4)

function selectAdapter(): ExtractAdapter {
  const kind = process.env.EXTRACT_ADAPTER ?? 'fixture';
  if (kind === 'fixture') return fixtureAdapter;
  if (kind === 'api') return createApiAdapter();
  throw new Error(
    `Unknown EXTRACT_ADAPTER="${kind}". Supported: "fixture" (default), "api".`,
  );
}

async function main() {
  const adapter = selectAdapter();
  console.log(
    `Extracting with adapter=${adapter.kind} (${adapter.label}) from ${REPO_ROOT}`,
  );

  let failed = 0;
  for (const src of SOURCES) {
    const ok = await extractOne(src, adapter);
    if (!ok) failed++;
  }

  if (failed) {
    console.error(`! ${failed} source(s) failed extraction. _generated/ is partially up to date.`);
    process.exit(1);
  }
  console.log(`Done. ${SOURCES.length} source(s) extracted.`);
}

async function extractOne(
  src: SourceConfig,
  adapter: ExtractAdapter,
): Promise<boolean> {
  const sourceAbs = resolve(REPO_ROOT, src.sourcePath);

  const sourceText = safeRead(sourceAbs);
  if (sourceText == null) {
    console.error(`! [${src.id}] source missing at ${src.sourcePath}`);
    return false;
  }

  const userPrompt =
    `Source: ${src.sourcePath}\n\n` + sourceText.slice(0, 60_000);

  // Retry only makes sense against a non-deterministic adapter. The fixture
  // returns the same bytes every call — retrying is just wasted CPU.
  const maxAttempts = adapter.kind === 'api' ? MAX_RETRIES + 1 : 1;
  let feedback: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let raw: unknown;
    try {
      raw = await adapter.extract({
        system: src.systemPrompt,
        user: userPrompt,
        schema: src.documentSchema,
        fewShot: src.fewShot,
        sourceId: src.id,
        feedback,
      });
    } catch (e) {
      console.error(`! [${src.id}] adapter threw: ${(e as Error).message}`);
      return false;
    }

    const result = validate<unknown>(src.documentSchema, raw);
    if (result.ok) {
      const outputAbs = resolve(REPO_ROOT, src.outputPath);
      mkdirSync(dirname(outputAbs), { recursive: true });
      const tsModule = src.emit(result.data);
      writeFileSync(outputAbs, tsModule, 'utf8');
      const attemptNote = attempt > 0 ? ` (after ${attempt} retry/retries)` : '';
      console.log(`✓ [${src.id}] → ${src.outputPath} (${src.label})${attemptNote}`);
      return true;
    }

    const errSummary = formatErrors(result.errors ?? []);
    if (attempt < maxAttempts - 1) {
      console.warn(
        `~ [${src.id}] validation failed on attempt ${attempt + 1}/${maxAttempts}; retrying with feedback.`,
      );
      feedback = `Your previous response failed JSON-schema validation:\n${errSummary}\nReturn ONLY a valid object matching the schema; correct the listed paths.`;
      continue;
    }
    console.error(`! [${src.id}] validation failed after ${maxAttempts} attempt(s):\n${errSummary}`);
    return false;
  }

  return false;
}

function safeRead(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

main().catch((e) => {
  console.error(`! orchestrator crashed: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
