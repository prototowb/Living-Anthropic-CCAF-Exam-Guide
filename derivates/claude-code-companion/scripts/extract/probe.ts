// `AdapterCapabilities.schemaMode` honesty probe — Scenario 6 v0.3 task 5.
//
//   $ npm run extract:probe
//
// What it does: walks the set of available adapters and asks each one for a
// *known-shape* extraction. The expected shape is a single-entry glossary;
// any adapter whose response fails strict schema validation while claiming
// `schemaMode: true` is reported as an HONESTY VIOLATION.
//
// Why the probe exists: TS 4.3 + the deepening Gap-task C — capability flags
// must be load-bearing. If an adapter lies (advertises schemaMode but returns
// malformed JSON), every downstream coordinator's `if (caps.schemaMode)` branch
// is silently broken. The probe makes that contract enforceable.
//
// Adapters tested:
//   - `fixture`   — always
//   - `api`       — only if ANTHROPIC_API_KEY is set (skipped otherwise — would
//                   burn credits on every CI run)
//   - `unreliable`— always; advertises schemaMode=false. Included as a positive
//                   control: an adapter that *correctly* declines structured
//                   mode must NOT be flagged. Also, when forced to claim
//                   schemaMode=true, MUST trip the warning (TS 4.4 acceptance).

import { fixtureAdapter } from './lib/fixtureAdapter';
import { createApiAdapter } from './lib/apiAdapter';
import { validate, formatErrors } from './lib/validate';
import { createUnreliableAdapter } from '../../src/sdk/__fixtures__/unreliableAdapter';
import { extractFirstJsonObject } from '../../src/agents/schemas/parse';
import {
  glossaryDocumentSchema,
  GLOSSARY_SCHEMA_VERSION,
} from './schemas/glossary';
import { GLOSSARY_FEWSHOT } from './fewShot/glossary';

// ANSI red — terminal-only, no dep on chalk. Falls back gracefully when stdout
// is not a TTY (e.g. piped into a file): the escape codes are still printed
// but most editors render them harmlessly.
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

interface ProbeTarget {
  /** Adapter identifier as exposed in `extract.ts`'s `EXTRACT_ADAPTER`. */
  name: string;
  /** What the adapter claims about itself. */
  claimedSchemaMode: boolean;
  /** Probe function — returns the raw payload (already JSON when possible). */
  probe(): Promise<unknown>;
}

// The known-shape source we ask every adapter to extract. Tiny by design —
// the probe should be cheap.
const KNOWN_SOURCE = `# Glossary\n\n## CLAUDE.md\n\nA markdown file at your project root telling Claude Code your conventions.\n`;

function buildTargets(): ProbeTarget[] {
  const targets: ProbeTarget[] = [
    {
      name: 'fixture',
      claimedSchemaMode: true, // fixture is deterministic — equivalent to schemaMode=true
      async probe() {
        return fixtureAdapter.extract({
          system: 'extract glossary',
          user: `Source: docs/extraction-sources/glossary.md\n\n${KNOWN_SOURCE}`,
          schema: glossaryDocumentSchema as unknown as Record<string, unknown>,
          fewShot: GLOSSARY_FEWSHOT,
          sourceId: 'glossary',
        });
      },
    },
  ];

  if (process.env.ANTHROPIC_API_KEY) {
    targets.push({
      name: 'api',
      claimedSchemaMode: true,
      async probe() {
        const api = createApiAdapter();
        return api.extract({
          system:
            'You are a structured-data extractor. Emit {entries: GlossaryEntry[]} only.',
          user: `Source: docs/extraction-sources/glossary.md\n\n${KNOWN_SOURCE}`,
          schema: glossaryDocumentSchema as unknown as Record<string, unknown>,
          fewShot: GLOSSARY_FEWSHOT,
          sourceId: 'glossary',
        });
      },
    });
  }

  // Synthetic dishonest adapter — claims schemaMode but returns JSON-in-prose.
  // The probe SHOULD flag this. Acceptance criterion for v0.3 task 5.
  const unreliable = createUnreliableAdapter({
    capabilities: { schemaMode: true, nativeToolUse: false, parallelSubagents: false },
    latencyMs: 0,
  });
  targets.push({
    name: 'unreliable',
    claimedSchemaMode: unreliable.capabilities.schemaMode,
    async probe() {
      // The unreliable adapter returns text-shaped JSON, never `data`. We must
      // parse it the way a real downstream consumer would: extractFirstJsonObject.
      const res = await unreliable.createMessage({
        system: 'extract glossary',
        messages: [{ role: 'user', content: KNOWN_SOURCE }],
        jsonSchema: glossaryDocumentSchema as unknown as Record<string, unknown>,
        fewShot: GLOSSARY_FEWSHOT,
        toolChoice: { type: 'tool', name: 'extract' },
      });
      if (res.data !== undefined) return res.data;
      const parsed = extractFirstJsonObject(res.text);
      // We surface even the unparseable case so the probe registers the
      // violation rather than crashing on null.
      return parsed ?? { __unparseable_text__: res.text };
    },
  });

  return targets;
}

interface ProbeResult {
  name: string;
  claimed: boolean;
  passed: boolean;
  detail: string;
}

async function probeOne(t: ProbeTarget): Promise<ProbeResult> {
  let raw: unknown;
  try {
    raw = await t.probe();
  } catch (e) {
    return {
      name: t.name,
      claimed: t.claimedSchemaMode,
      passed: false,
      detail: `adapter threw: ${(e as Error).message}`,
    };
  }
  const result = validate(
    glossaryDocumentSchema as unknown as Record<string, unknown>,
    raw,
  );
  if (result.ok) {
    return {
      name: t.name,
      claimed: t.claimedSchemaMode,
      passed: true,
      detail: 'schema-valid response',
    };
  }
  return {
    name: t.name,
    claimed: t.claimedSchemaMode,
    passed: false,
    detail: formatErrors(result.errors ?? []),
  };
}

async function main() {
  const targets = buildTargets();
  console.log(`schemaMode honesty probe — testing ${targets.length} adapter(s)`);
  console.log(`(probing for glossary v${GLOSSARY_SCHEMA_VERSION} document shape)`);
  console.log('');

  let violations = 0;
  for (const t of targets) {
    const res = await probeOne(t);
    if (res.passed) {
      console.log(`${GREEN}OK${RESET}     ${res.name}  (claimed schemaMode=${res.claimed})  — ${res.detail}`);
      continue;
    }
    if (res.claimed) {
      violations++;
      console.log(
        `${RED}HONESTY VIOLATION: ${res.name} claimed schemaMode but returned malformed JSON${RESET}`,
      );
      console.log(`   detail:\n${res.detail.split('\n').map((l) => `     ${l}`).join('\n')}`);
    } else {
      // Adapter honestly declined schemaMode — invalid output is expected.
      console.log(`SKIP   ${res.name}  (claimed schemaMode=false; invalid output expected)`);
    }
  }

  console.log('');
  if (violations) {
    console.error(`${RED}! ${violations} adapter(s) violated the schemaMode honesty contract.${RESET}`);
    process.exit(1);
  }
  console.log(`${GREEN}All probed adapters are honest about their schemaMode capability.${RESET}`);
}

main().catch((e) => {
  console.error(`! probe crashed: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
