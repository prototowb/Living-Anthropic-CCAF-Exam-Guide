<script setup lang="ts">
// Scenario 6 v0.4 task 10 — in-browser structured-extraction demo.
//
// Goal: show the architect-mandated pieces of the extraction pipeline on the
// /under-the-hood card without leaving the browser. The visible architecture
// surface is:
//
//   1. A JSON schema (TS 4.3 — JSON-Schema-as-extraction-shape).
//   2. Few-shot exemplars (TS 4.2 — 2–4 worked examples for varied source
//      shapes; the spec calls for 2-of-the-bundle previewed).
//   3. A typed extraction call via the active adapter (TS 4.3 — tool_use /
//      jsonSchema surface).
//   4. Inline syntactic validation of the returned shape (TS 4.4).
//   5. A typed result the page renders without re-parsing prose (TS 5.1).
//
// Workaround documented in the v0.4 sprint spec: the mock adapter's
// classifyIntent only handles the Tutor intent-classification shape — it does
// NOT actually extract glossary records. We still issue the createMessage
// call (so the schema + few-shot + toolChoice surface is exercised end to
// end), then bypass the mock's returned `data` and parse the textarea with a
// tiny in-component regex extractor. The educational pieces (schema, few-shot,
// validation) remain visible; the model is not the system under test on this
// card. A real adapter against the same call shape returns parsed data via
// tool_use without the workaround.
//
// Constraint: NO Ajv in the SPA bundle. The validator below is a manual
// property-check pass. The pipeline-side validator (scripts/extract/lib/
// validate.ts) is the one that uses Ajv — that file is scripts-only.

import { computed, ref } from 'vue';
import { getAdapter } from '@/sdk';

// ─── Demo schema ──────────────────────────────────────────────────────────
// Mirrors `scripts/extract/schemas/glossary.ts` but drops the `_provenance`
// block (the pipeline injects provenance; the in-browser demo doesn't have a
// source path / sha256 to attach). This schema lives inline so the page can
// render it as-is without pulling in any scripts/* code path. The shape we
// validate is the per-entry record; the demo emits an array of these.

const glossarySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'GlossaryEntry',
  type: 'object',
  required: ['term', 'definition', 'rung'],
  additionalProperties: false,
  properties: {
    term: { type: 'string', minLength: 1 },
    definition: { type: 'string', minLength: 20 },
    aliases: { type: 'array', items: { type: 'string', minLength: 1 } },
    stageId: { type: 'string', pattern: '^s[1-8]$' },
    rung: { type: 'string', enum: ['B', 'I', 'A'] },
  },
} as const;

// 2 few-shot examples (TS 4.2). We mirror the *intent* of the bundle at
// scripts/extract/fewShot/glossary.ts. The `.user` halves are surfaced on
// the card per the v0.4 spec; the `.assistant` halves are sent to the
// adapter as paired few-shot turns.
const FEW_SHOT: { user: string; assistant: string }[] = [
  {
    user:
      '# Glossary\n\n## Permission prompt\n\nThe dialog Claude Code shows the first time it wants to use a tool in your project — Read, Edit, Bash, etc.',
    assistant: JSON.stringify({
      entries: [
        {
          term: 'Permission prompt',
          definition:
            'The dialog Claude Code shows the first time it wants to use a tool in your project — Read, Edit, Bash, etc. You answer once and your choice persists for the session.',
          rung: 'B',
          stageId: 's2',
        },
      ],
    }),
  },
  {
    user:
      '# Glossary\n\n## Plan mode\n\nA permission mode (also: "plan" mode) that lets Claude only read and search the codebase — no edits or shell.',
    assistant: JSON.stringify({
      entries: [
        {
          term: 'Plan mode',
          definition:
            'A permission mode that lets Claude only read and search the codebase — no edits or shell. Good for scoping a multi-file change before touching anything.',
          aliases: ['plan'],
          rung: 'I',
          stageId: 's3',
        },
      ],
    }),
  },
];

// ─── Pre-populated example sources ────────────────────────────────────────
interface DemoSource {
  id: string;
  label: string;
  body: string;
}

const SOURCES: DemoSource[] = [
  {
    id: 'single',
    label: 'Single term',
    body:
      '# Glossary\n\n' +
      '## CLAUDE.md\n\n' +
      'A markdown file at the root of your project that tells Claude Code your conventions — your package manager, your test command, which files to leave alone. Claude reads it at session start.\n',
  },
  {
    id: 'multi',
    label: 'Multiple terms',
    body:
      '# Glossary\n\n' +
      '## Subagent\n\n' +
      'A separate Claude session Claude itself spawns via the Task tool. Useful for parallel research or for keeping the main context window clean.\n\n' +
      '## Slash command\n\n' +
      'A reusable prompt you invoke with /<name> in the Claude Code REPL. Built-ins include /clear, /compact, /resume, /help.\n\n' +
      '## Headless mode\n\n' +
      'Running Claude Code without the REPL — one prompt, one response. `claude -p "your prompt" --output-format json` returns a parseable result.\n',
  },
];

const selectedId = ref<string>(SOURCES[0].id);
const sourceText = ref<string>(SOURCES[0].body);

function loadExample(id: string) {
  const next = SOURCES.find((s) => s.id === id);
  if (!next) return;
  selectedId.value = id;
  sourceText.value = next.body;
  clearResult();
}

// ─── In-component regex extractor (the demo workaround) ───────────────────
// Matches `## Term\n\nDefinition…` markdown blocks. The mock adapter does
// NOT do this — it's a tiny educational shim. The demo still issues a
// real createMessage call so learners see the schema + few-shot wire shape.

interface GlossaryRecord {
  term: string;
  definition: string;
  aliases?: string[];
  stageId?: string;
  rung: 'B' | 'I' | 'A';
}

function parseGlossaryMarkdown(md: string): GlossaryRecord[] {
  const out: GlossaryRecord[] = [];
  // Split on `## ` headings keeping the heading text.
  const re = /^##\s+(.+?)\s*\n+([^\n][\s\S]*?)(?=\n##\s|\s*$)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const term = m[1].trim();
    const definition = m[2].trim().replace(/\s+/g, ' ');
    if (!term || definition.length < 1) continue;
    out.push({ term, definition, rung: guessRung(definition) });
  }
  return out;
}

// Cheap heuristic so the demo populates `rung` (a required field). Real
// extraction would have the model decide; this is the workaround stand-in.
function guessRung(definition: string): 'B' | 'I' | 'A' {
  const lower = definition.toLowerCase();
  if (/ci|headless|grammar|json mode|webllm|ollama/.test(lower)) return 'A';
  if (/subagent|skill|mcp|hook|plan mode/.test(lower)) return 'I';
  return 'B';
}

// ─── Manual validator (Ajv-free) ──────────────────────────────────────────
// Walks the demo schema's `required` / `enum` / `pattern` / `minLength`
// rules. NOT a general JSON-Schema validator — just enough to cover the
// shape on screen. The full validator lives at scripts/extract/lib/validate.ts.

interface ValidationIssue {
  path: string;
  message: string;
}

function validateRecord(rec: unknown, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const at = (p: string) => `entries[${index}].${p}`;
  if (typeof rec !== 'object' || rec === null) {
    issues.push({ path: `entries[${index}]`, message: 'expected an object' });
    return issues;
  }
  const r = rec as Record<string, unknown>;

  // `term` — required, non-empty string.
  if (typeof r.term !== 'string' || r.term.length < 1) {
    issues.push({ path: at('term'), message: 'required non-empty string' });
  }
  // `definition` — required, ≥ 20 chars (thin-extraction guard).
  if (typeof r.definition !== 'string') {
    issues.push({ path: at('definition'), message: 'required string' });
  } else if (r.definition.length < 20) {
    issues.push({
      path: at('definition'),
      message: `minLength 20 (got ${r.definition.length})`,
    });
  }
  // `rung` — required enum.
  if (r.rung !== 'B' && r.rung !== 'I' && r.rung !== 'A') {
    issues.push({
      path: at('rung'),
      message: 'must be one of "B" | "I" | "A"',
    });
  }
  // `aliases` — optional array of non-empty strings.
  if (r.aliases !== undefined) {
    if (!Array.isArray(r.aliases)) {
      issues.push({ path: at('aliases'), message: 'must be an array' });
    } else {
      r.aliases.forEach((a, ai) => {
        if (typeof a !== 'string' || a.length < 1) {
          issues.push({
            path: at(`aliases[${ai}]`),
            message: 'non-empty string',
          });
        }
      });
    }
  }
  // `stageId` — optional `^s[1-8]$`.
  if (r.stageId !== undefined) {
    if (typeof r.stageId !== 'string' || !/^s[1-8]$/.test(r.stageId)) {
      issues.push({
        path: at('stageId'),
        message: 'must match /^s[1-8]$/',
      });
    }
  }
  // `additionalProperties: false` — flag stray keys.
  const allowed = new Set(['term', 'definition', 'aliases', 'stageId', 'rung']);
  for (const k of Object.keys(r)) {
    if (!allowed.has(k)) {
      issues.push({ path: at(k), message: 'unknown property' });
    }
  }
  return issues;
}

function validateAll(records: GlossaryRecord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (records.length === 0) {
    issues.push({ path: 'entries', message: 'no entries extracted' });
    return issues;
  }
  records.forEach((r, i) => issues.push(...validateRecord(r, i)));
  return issues;
}

// ─── Run state ────────────────────────────────────────────────────────────
interface RunResult {
  records: GlossaryRecord[];
  issues: ValidationIssue[];
  adapterKind: string;
  adapterUsedJsonSchema: boolean;
}

const running = ref(false);
const result = ref<RunResult | null>(null);
const runError = ref<string | null>(null);

function clearResult() {
  result.value = null;
  runError.value = null;
}

async function runExtraction() {
  running.value = true;
  runError.value = null;
  const adapter = getAdapter();
  try {
    // Issue the real createMessage call so the schema + few-shot + toolChoice
    // surface is exercised end to end. We don't *use* the mock's returned
    // data (its classifyIntent path is for the Tutor, not for glossary) —
    // see the file header for the workaround rationale.
    await adapter.createMessage({
      system:
        'Extract glossary entries from the supplied markdown. Each `## Term` heading is an entry; the paragraph beneath is its definition. Return an object `{ entries: GlossaryEntry[] }` matching the schema.',
      messages: [{ role: 'user', content: sourceText.value }],
      jsonSchema: glossarySchema as unknown as Record<string, unknown>,
      fewShot: FEW_SHOT,
      toolChoice: { type: 'tool', name: 'extract' },
    });

    // Workaround extractor (regex over the textarea). On a real adapter we
    // would consume `response.data` / `response.toolUses[0].input` directly.
    const records = parseGlossaryMarkdown(sourceText.value);
    const issues = validateAll(records);

    result.value = {
      records,
      issues,
      adapterKind: adapter.kind,
      adapterUsedJsonSchema: adapter.capabilities.schemaMode,
    };
  } catch (e) {
    runError.value = e instanceof Error ? e.message : String(e);
  } finally {
    running.value = false;
  }
}

const validates = computed(
  () => result.value !== null && result.value.issues.length === 0,
);

// Pretty-printed schema for the read-only preview.
const schemaPreview = computed(() => JSON.stringify(glossarySchema, null, 2));
</script>

<template>
  <div class="space-y-3 text-sm">
    <header class="space-y-1">
      <p class="text-ink-700">
        Run the structured-extraction pipeline against a tiny synthetic
        source, in-browser, via the active adapter
        (<code class="mono text-xs">src/sdk/index.ts</code>).
      </p>
      <p class="text-xs text-ink-500">
        The three architect-mandated pieces — JSON schema, few-shot exemplars,
        and syntactic validation — render side-by-side. Edit the source or
        pick another example, then click <em>Run extraction</em>.
      </p>
    </header>

    <!-- Example picker. -->
    <div class="flex items-center gap-2 text-xs">
      <label for="s6-example" class="text-ink-600">Example:</label>
      <select
        id="s6-example"
        class="border border-ink-300 rounded px-2 py-1 text-xs bg-white"
        :value="selectedId"
        @change="loadExample(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="s in SOURCES" :key="s.id" :value="s.id">
          {{ s.label }}
        </option>
      </select>
    </div>

    <!-- Three-pane layout: Source, Schema + few-shot, Result. -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- ── Source ──────────────────────────────────────────────────── -->
      <section class="border border-ink-200 rounded-lg p-3 bg-white space-y-2 min-w-0">
        <h3 class="text-xs uppercase tracking-wide text-ink-400">
          Source markdown
        </h3>
        <textarea
          v-model="sourceText"
          rows="10"
          spellcheck="false"
          class="w-full mono text-xs border border-ink-200 rounded p-2 bg-ink-50 focus:outline-none focus:border-ink-900 resize-y"
          @input="clearResult"
        />
        <p class="text-xs text-ink-500">
          Each <code class="mono">## Term</code> heading becomes one record.
        </p>
      </section>

      <!-- ── Schema + few-shot ───────────────────────────────────────── -->
      <section class="border border-ink-200 rounded-lg p-3 bg-white space-y-3 min-w-0">
        <div class="space-y-1">
          <h3 class="text-xs uppercase tracking-wide text-ink-400">
            JSON schema
          </h3>
          <pre
            class="mono text-[11px] leading-snug bg-ink-50 border border-ink-200 rounded p-2 overflow-auto max-h-48"
          >{{ schemaPreview }}</pre>
        </div>
        <div class="space-y-1">
          <h3 class="text-xs uppercase tracking-wide text-ink-400">
            Few-shot exemplars ({{ FEW_SHOT.length }})
          </h3>
          <ul class="space-y-1.5">
            <li
              v-for="(ex, i) in FEW_SHOT"
              :key="i"
              class="bg-ink-50 border border-ink-200 rounded p-2"
            >
              <div class="text-[10px] uppercase tracking-wide text-ink-400 mb-1">
                user #{{ i + 1 }}
              </div>
              <pre class="mono text-[11px] leading-snug whitespace-pre-wrap">{{ ex.user }}</pre>
            </li>
          </ul>
        </div>
      </section>

      <!-- ── Result ──────────────────────────────────────────────────── -->
      <section class="border border-ink-200 rounded-lg p-3 bg-white space-y-2 min-w-0">
        <div class="flex items-baseline justify-between gap-2">
          <h3 class="text-xs uppercase tracking-wide text-ink-400">Result</h3>
          <button
            type="button"
            class="px-3 py-1.5 text-xs rounded border border-ink-900 bg-ink-900 text-white disabled:opacity-50"
            :disabled="running"
            @click="runExtraction"
          >
            {{ running ? 'running…' : 'Run extraction' }}
          </button>
        </div>

        <div v-if="runError" class="text-xs text-stage-s5">
          Demo failed: {{ runError }}
        </div>

        <div v-else-if="!result && !running" class="text-xs text-ink-500 italic">
          Click <em>Run extraction</em> to extract + validate the source.
        </div>

        <div v-else-if="result" class="space-y-2">
          <!-- Validation banner. -->
          <div
            v-if="validates"
            class="mono text-[11px] px-2 py-1 rounded border border-stage-s3/40 bg-stage-s3/10 text-stage-s3"
          >
            ✓ validates against glossary schema
            ({{ result.records.length }} record{{ result.records.length === 1 ? '' : 's' }})
          </div>
          <div
            v-else
            class="mono text-[11px] px-2 py-1 rounded border border-stage-s5/40 bg-stage-s5/10 text-stage-s5"
          >
            ✗ validation failed:
            <ul class="mt-1 ml-3 list-disc">
              <li v-for="(iss, i) in result.issues" :key="i">
                <code class="mono">{{ iss.path }}</code> — {{ iss.message }}
              </li>
            </ul>
          </div>

          <!-- Adapter chip. -->
          <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span class="mono px-1.5 py-0.5 rounded border border-ink-300 bg-ink-100 text-ink-700">
              adapter: {{ result.adapterKind }}
            </span>
            <span
              v-if="result.adapterUsedJsonSchema"
              class="mono px-1.5 py-0.5 rounded border border-ink-300 bg-ink-100 text-ink-700"
              title="adapter.capabilities.schemaMode === true"
            >
              schemaMode
            </span>
          </div>

          <!-- Per-record cards. -->
          <ul v-if="result.records.length" class="space-y-1.5">
            <li
              v-for="(rec, i) in result.records"
              :key="i"
              class="border border-ink-200 rounded p-2 bg-ink-50"
            >
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="mono text-xs font-medium text-ink-900">{{ rec.term }}</span>
                <span
                  class="mono text-[10px] px-1 py-0.5 rounded border border-ink-300 bg-white text-ink-700"
                >
                  rung: {{ rec.rung }}
                </span>
                <span
                  v-if="rec.stageId"
                  class="mono text-[10px] px-1 py-0.5 rounded border border-ink-300 bg-white text-ink-700"
                >
                  {{ rec.stageId }}
                </span>
              </div>
              <p class="text-xs text-ink-700 mt-1">{{ rec.definition }}</p>
            </li>
          </ul>

          <!-- Raw JSON. -->
          <details class="text-xs">
            <summary class="cursor-pointer text-ink-600 select-none">
              Raw JSON
            </summary>
            <pre
              class="mono text-[11px] leading-snug bg-ink-50 border border-ink-200 rounded p-2 mt-1 overflow-auto max-h-48"
            >{{ JSON.stringify({ entries: result.records }, null, 2) }}</pre>
          </details>
        </div>
      </section>
    </div>
  </div>
</template>
