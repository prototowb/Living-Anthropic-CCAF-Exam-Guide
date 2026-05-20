<script setup lang="ts">
// The recursion seam — the only place the surface explicitly references the
// architect-substrate. Each of the six exam scenarios is realised inside
// this codebase. The surface teaches Claude Code from zero; the source is
// itself a reference implementation for engineers reading the repo.
//
// v0.4 changes:
//   - Canonical scenario metadata (name, description, primaryDomains) now
//     comes from `src/data/_generated/architectScenarios.ts` — the structured
//     extraction pipeline's output, faithful to the exam-guide PDF, with
//     verifiable `_provenance` (line range + sha256). The hand-authored
//     fields below carry the *realisation* prose + file pointers specific
//     to THIS codebase.
//   - Each card mounts a `<ScenarioDemoSlot>` — a lazy-loaded per-scenario
//     LiveDemo component. Runs an actual demo of the scenario's
//     implementation when expanded.

import { computed } from 'vue';
import { architectScenarios } from '@/data/_generated/architectScenarios';
import ScenarioDemoSlot from '@/components/under-the-hood/ScenarioDemoSlot.vue';

/** Hand-authored realisation prose + file pointers for THIS codebase. Merged
 *  with the extracted scenario data by scenario number. */
interface RealisationCard {
  num: number;
  realisation: string;
  files: { path: string; note: string }[];
  notes?: string;
}

const REALISATIONS: RealisationCard[] = [
  {
    num: 1,
    realisation:
      'The Help Bot sidebar (Need help? button, lower-right). v0.2 + v0.3: granular MCP-shaped tools (getLesson, checkProgress, lookupQuizAttempts, recordWeakSpot, escalateToDocs) returning ToolResponse<T> with widened error categories (transient/validation/business/permission + isRetryable). Capabilities-aware dispatch (native tool_use when supported, JSON-in-prose + retryWithFeedback otherwise). Explicit escalation predicates fall through to the docs on user request, two consecutive business errors, or low confidence.',
    files: [
      { path: 'src/agents/helpBot/coordinator.ts', note: 'Routing + escalation' },
      { path: 'src/agents/helpBot/toolDispatcher.ts', note: 'v0.3 — capabilities-aware tool dispatch' },
      { path: 'src/agents/helpBot/tools/', note: '5 granular MCP-shaped tools' },
      { path: 'src/agents/escalation.ts', note: 'Hard predicates with few-shot exemplars' },
      { path: 'src/agents/tools/types.ts', note: '4-valued ErrorCategory + isRetryable' },
    ],
  },
  {
    num: 2,
    realisation:
      "This project's own developer workflow. Root CLAUDE.md states repo-wide rules; per-area CLAUDE.md files extend them in src/agents/{helpBot,tutor,tutor/tools}/, src/data/, src/views/, scripts/extract/. Glob-scoped rules in .claude/rules/ (TS 3.3). Custom slash commands in .claude/commands/, skills in .claude/skills/, project permissions + a pre-tool-use scope-guard hook in .claude/settings.json. The plan-mode rubric in root CLAUDE.md cites real changes from this repo.",
    files: [
      { path: 'CLAUDE.md', note: 'Root rules + plan-mode decision table' },
      { path: '.claude/commands/', note: 'Custom slash commands' },
      { path: '.claude/skills/', note: 'lesson-quality, sandbox-author, stage-author' },
      { path: '.claude/rules/', note: 'Path-glob-scoped rules (TS 3.3)' },
      { path: '.claude/settings.json', note: 'Permissions + scope-guard hook' },
      { path: 'docs/LIVING_WORKFLOW.md', note: 'Narrated walkthrough' },
    ],
  },
  {
    num: 3,
    realisation:
      'The Tutor (/tutor). Hub-and-spoke coordinator with ALLOWED_TOOLS asserting Task at module load. Four spokes: explainer, quizmaster, codebase-researcher, doc-synthesiser. v0.2 fix: dispatchAllSettled replaces Promise.all (TS 5.3 — partial-failure handling). v0.3: capabilities-aware path with JSON-in-prose fallback when schemaMode is false; CapabilitiesBadge surfaces degradation; curriculum bridge informs quiz selection; /debug route runs the serial-fallback regression harness.',
    files: [
      { path: 'src/agents/tutor/coordinator.ts', note: 'Hub. ALLOWED_TOOLS includes Task.' },
      { path: 'src/agents/tutor/dispatch.ts', note: 'dispatchAllSettled (SYNTHESIS S-3)' },
      { path: 'src/agents/tutor/subagents/', note: 'explainer, quizmaster, codebaseResearcher, docSynthesiser' },
      { path: 'src/agents/tutor/curriculum.ts', note: 'v0.3 — curriculum-awareness bridge' },
      { path: 'src/agents/scratchpad.ts', note: 'Persistent finding log' },
      { path: 'src/agents/contextPruner.ts', note: 'Output trimming' },
      { path: 'src/agents/tutor/__test__/dispatch.spec.ts', note: 'v0.3 — serial-fallback regression' },
    ],
  },
  {
    num: 4,
    realisation:
      'The codebase-researcher spoke. v0.2 — full implementation: keyword grep → top-N read with surrounding context → cited reply (with clickable chips in TutorView). Source-index bundled via Vite import.meta.glob, route-split to /tutor + /debug. v0.3: search_symbol tool for identifier-shaped prompts; SubagentInvocation.summary field for context isolation (TS 5.4); searchSymbol-first then grep fallback.',
    files: [
      { path: 'src/agents/tutor/subagents/codebaseResearcher.ts', note: 'The recursive spoke' },
      { path: 'src/agents/tutor/tools/sourceIndex.ts', note: 'Vite import.meta.glob source bundling' },
      { path: 'src/agents/tutor/tools/searchSymbol.ts', note: 'v0.3 — symbol-anchor lookup' },
      { path: 'src/agents/tutor/tools/grepSource.ts', note: 'Regex over source index with cardinality guard' },
      { path: 'src/agents/tutor/tools/readSourceFile.ts', note: '200-line truncation default (TS 5.4)' },
      { path: 'scripts/check-bundle-size.js', note: '200 KB gzipped budget on the source-index chunk' },
    ],
  },
  {
    num: 5,
    realisation:
      'CI infrastructure. v0.2/v0.3: docs/CI_REVIEW_PROMPT.md (severity buckets, do-not-approve gates, in/out-of-scope categories, prompt version); src/agents/schemas/reviewOutput.ts; scripts/review-pr.ts + npm run review:dry; .claude/hooks/scope-guard.sh with CI overlay; docs/sample-prs/ corpus (typo, clean, async, style-only). v0.4 lands the real GitHub Action.',
    files: [
      { path: 'docs/CI_REVIEW_PROMPT.md', note: 'The actual CI prompt body, versioned' },
      { path: 'src/agents/schemas/reviewOutput.ts', note: 'ReviewComment + ReviewSummary schemas' },
      { path: 'scripts/review-pr.ts', note: 'npm run review:dry — local dry-run' },
      { path: 'docs/sample-prs/', note: 'False-positive corpus' },
      { path: '.claude/hooks/scope-guard.sh', note: 'CI scope-guard hook' },
      { path: '.github/workflows/claude-review.yml', note: 'v0.4 — real CI workflow' },
    ],
  },
  {
    num: 6,
    realisation:
      'The structured-extraction pipeline. v0.1: jsonSchema + parser surface on the SDK adapter. v0.2: scripts/extract/* — orchestrator, source registry, glossary + architectScenarios schemas with 2 few-shot examples each, fixture adapter, Ajv validator, mandatory _provenance (TS 5.6) baked into every record. v0.3: api adapter wrapping realAdapter (forced tool_use + tool_choice); retry-with-feedback on validation failure (TS 4.4); edge-case fixtures (ambiguous/partial/empty/conflict); schemaMode honesty probe.',
    files: [
      { path: 'scripts/extract/extract.ts', note: 'Orchestrator + bounded retry-with-feedback' },
      { path: 'scripts/extract/sources.ts', note: 'Source registry' },
      { path: 'scripts/extract/schemas/', note: 'JSON schemas (glossary, architectScenarios)' },
      { path: 'scripts/extract/lib/', note: 'Pipeline primitives (fixtureAdapter, apiAdapter, validate, provenance)' },
      { path: 'src/sdk/realAdapter.ts', note: 'v0.2 — honest tool_use path for TS 4.3' },
      { path: 'src/agents/schemas/source.ts', note: 'SourceRef discriminated union (S-5 cross-link with S4)' },
    ],
  },
];

interface ResolvedCard {
  num: number;
  name: string;
  description: string;
  primaryDomains: string[];
  provenance: {
    sourcePath: string;
    sourceHash: string;
    lineStart?: number;
    lineEnd?: number;
  };
  realisation: string;
  files: { path: string; note: string }[];
  notes?: string;
}

const cards = computed<ResolvedCard[]>(() => {
  return REALISATIONS.map((r) => {
    const canonical = architectScenarios.find((s) => s.number === r.num);
    if (!canonical) {
      return {
        num: r.num,
        name: `Scenario ${r.num}`,
        description: '',
        primaryDomains: [],
        provenance: { sourcePath: 'unknown', sourceHash: '' },
        realisation: r.realisation,
        files: r.files,
        notes: r.notes,
      };
    }
    return {
      num: canonical.number,
      name: canonical.name,
      description: canonical.description,
      primaryDomains: canonical.primaryDomains,
      provenance: {
        sourcePath: canonical._provenance.sourcePath,
        sourceHash: canonical._provenance.sourceHash,
        lineStart: canonical._provenance.lineStart,
        lineEnd: canonical._provenance.lineEnd,
      },
      realisation: r.realisation,
      files: r.files,
      notes: r.notes,
    };
  });
});
</script>

<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">/under-the-hood</h1>
      <p class="text-ink-600 mt-1 max-w-3xl">
        The recursion seam. This page is the only place the beginner surface
        references the architect substrate. Each of the six exam scenarios from the
        <strong>Claude Certified Architect — Foundations</strong> exam is realised inside
        this codebase. Scenario metadata below is extracted from the exam-guide PDF
        by the Scenario 6 pipeline (<code class="mono text-xs">scripts/extract</code>) —
        every card carries source provenance.
      </p>
    </header>

    <ol class="space-y-3">
      <li
        v-for="s in cards"
        :key="s.num"
        class="p-4 rounded-lg border border-ink-200 bg-white"
      >
        <div class="flex items-baseline gap-3">
          <span class="mono text-xs text-ink-500">Scenario {{ s.num }}</span>
          <span class="font-medium">{{ s.name }}</span>
        </div>
        <p v-if="s.primaryDomains.length" class="text-xs text-ink-500 mt-1 italic">
          Primary domains: {{ s.primaryDomains.join(' · ') }}
        </p>
        <p v-if="s.description" class="text-sm text-ink-700 mt-2">
          <em>"{{ s.description }}"</em>
        </p>
        <p class="text-sm text-ink-700 mt-2">{{ s.realisation }}</p>
        <ul class="mt-2 text-sm space-y-1">
          <li v-for="f in s.files" :key="f.path" class="flex items-baseline gap-2">
            <code class="mono text-xs px-1 py-0.5 rounded bg-ink-100">{{ f.path }}</code>
            <span class="text-ink-600">— {{ f.note }}</span>
          </li>
        </ul>
        <p
          v-if="s.provenance.sourceHash"
          class="text-[0.7rem] text-ink-400 mono mt-2"
          :title="`SHA-256: ${s.provenance.sourceHash}`"
        >
          provenance: {{ s.provenance.sourcePath }}<span v-if="s.provenance.lineStart">:{{ s.provenance.lineStart }}-{{ s.provenance.lineEnd }}</span>
          · sha {{ s.provenance.sourceHash.slice(0, 12) }}…
        </p>
        <p v-if="s.notes" class="text-xs text-ink-500 italic mt-2">{{ s.notes }}</p>

        <!-- Live demo slot — lazy-loaded per scenario. -->
        <div class="mt-3 pt-3 border-t border-ink-100">
          <ScenarioDemoSlot :scenario-num="s.num" />
        </div>
      </li>
    </ol>
  </section>
</template>
