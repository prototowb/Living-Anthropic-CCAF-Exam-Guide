<script setup lang="ts">
// Scenario 3 live demo (v0.4 task 12).
//
// Three canned prompts exercise the Tutor coordinator end-to-end, inline on
// the /under-the-hood card. Each renders per-spoke timings (bar viz), a
// `parallel: true/false` chip, citation count, and any spoke errors.
//
// `UnderTheHoodView` is the documented exception to the
// `views NEVER import from src/agents/**` rule — this surface is precisely
// where engineers inspect agent internals. The chat surface (`/tutor`) still
// goes through the store. See `src/views/CLAUDE.md` rule 5 + the
// "recursion-seam" note in the v0.4 sprint spec.

import { ref, computed } from 'vue';
import { tutor, type TutorTurn } from '@/agents/tutor/coordinator';

interface DemoPrompt {
  id: string;
  label: string;
  text: string;
  /** One-line rationale shown next to the prompt; tells readers why each
   *  example was picked — single-spoke, parallel dispatch, synthesis fan-out. */
  why: string;
}

const PROMPTS: DemoPrompt[] = [
  {
    id: 'single',
    label: 'Single-spoke explainer',
    text: 'Explain plan mode',
    why: 'One spoke — classifier routes to the explainer alone.',
  },
  {
    id: 'parallel',
    label: 'Parallel dispatch',
    text: 'Explain plan mode AND quiz me on permissions',
    why: 'Two independent spokes — fans out via dispatchAllSettled.',
  },
  {
    id: 'synthesiser',
    label: 'docSynthesiser fan-out',
    text: 'Summarise the hub-and-spoke coordinator',
    why: 'Synthesiser spoke composes explainer + codebase-researcher.',
  },
];

interface DemoResult {
  status: 'idle' | 'running' | 'done' | 'error';
  turn?: TutorTurn;
  error?: string;
}

const results = ref<Record<string, DemoResult>>({
  single: { status: 'idle' },
  parallel: { status: 'idle' },
  synthesiser: { status: 'idle' },
});

const anyRunning = computed(() =>
  Object.values(results.value).some((r) => r.status === 'running'),
);

async function runOne(p: DemoPrompt) {
  results.value = { ...results.value, [p.id]: { status: 'running' } };
  try {
    const turn = await tutor.handle(p.text);
    results.value = { ...results.value, [p.id]: { status: 'done', turn } };
  } catch (e) {
    results.value = {
      ...results.value,
      [p.id]: {
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

async function runAll() {
  // Sequentially so the bar widths stay comparable — running three turns
  // concurrently against the mock adapter would mush the timings into the
  // event-loop tick noise.
  for (const p of PROMPTS) {
    await runOne(p);
  }
}

/** Width % for the per-spoke timing bar, normalised against the slowest spoke
 *  in THIS turn so the widest bar is always 100%. Guards against a 0ms turn. */
function barWidth(spokeMs: number, turn: TutorTurn): string {
  const max = Math.max(1, ...turn.subagents.map((s) => s.durationMs));
  return `${Math.max(2, Math.round((spokeMs / max) * 100))}%`;
}

function citationCount(turn: TutorTurn): number {
  let n = 0;
  for (const s of turn.subagents) {
    for (const tc of s.toolCalls) {
      if (tc.name === 'cite') n++;
    }
  }
  return n;
}
</script>

<template>
  <div class="space-y-3 text-sm">
    <header class="flex items-baseline justify-between gap-2 flex-wrap">
      <div>
        <p class="text-ink-700">
          Three canned prompts run end-to-end through the Tutor coordinator
          (<code class="mono text-xs">src/agents/tutor/coordinator.ts</code>).
        </p>
        <p class="text-xs text-ink-500">
          Per-turn metrics: per-spoke timing bars, parallel-vs-serial chip,
          citation count, and any failed spokes.
        </p>
      </div>
      <button
        type="button"
        class="px-3 py-1.5 text-xs rounded border border-ink-900 bg-ink-900 text-white disabled:opacity-50"
        :disabled="anyRunning"
        @click="runAll"
      >
        Run all demos
      </button>
    </header>

    <ul class="space-y-3">
      <li
        v-for="p in PROMPTS"
        :key="p.id"
        class="border border-ink-200 rounded-lg p-3 bg-white space-y-2"
      >
        <div class="flex items-baseline justify-between gap-2 flex-wrap">
          <div class="min-w-0">
            <div class="text-xs uppercase tracking-wide text-ink-400">
              {{ p.label }}
            </div>
            <div class="mono text-sm text-ink-900">{{ p.text }}</div>
            <div class="text-xs text-ink-500 mt-0.5">{{ p.why }}</div>
          </div>
          <button
            type="button"
            class="px-2.5 py-1 text-xs rounded border border-ink-300 hover:border-ink-900 disabled:opacity-50"
            :disabled="results[p.id].status === 'running'"
            @click="runOne(p)"
          >
            {{ results[p.id].status === 'running' ? 'running…' : 'Run' }}
          </button>
        </div>

        <!-- Result panel — collapses cleanly when idle. -->
        <div v-if="results[p.id].status === 'running'" class="text-xs text-ink-500 italic">
          dispatching subagents…
        </div>

        <div
          v-else-if="results[p.id].status === 'error'"
          class="text-xs text-stage-s5"
        >
          Demo failed: {{ results[p.id].error }}
        </div>

        <div v-else-if="results[p.id].turn" class="space-y-2">
          <!-- Meta row — parallel chip, total time, citation count, errors. -->
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            <span
              class="mono px-1.5 py-0.5 rounded border"
              :class="
                results[p.id].turn!.parallel
                  ? 'border-stage-s3/40 bg-stage-s3/10 text-stage-s3'
                  : 'border-ink-300 bg-ink-100 text-ink-700'
              "
            >
              {{ results[p.id].turn!.parallel ? 'parallel' : 'serial' }}
            </span>
            <span class="mono text-ink-600">{{ results[p.id].turn!.totalMs }}ms</span>
            <span class="mono text-ink-600">
              {{ citationCount(results[p.id].turn!) }} citation{{ citationCount(results[p.id].turn!) === 1 ? '' : 's' }}
            </span>
            <span class="mono text-ink-500">adapter: {{ results[p.id].turn!.adapterKind }}</span>
            <span
              v-if="results[p.id].turn!.errors.length"
              class="mono text-stage-s5"
              :title="results[p.id].turn!.errors.map((e) => `${e.name}: ${e.message}`).join('\n')"
            >
              ⚠ {{ results[p.id].turn!.errors.length }} spoke error{{ results[p.id].turn!.errors.length === 1 ? '' : 's' }}
            </span>
          </div>

          <!-- Per-spoke timing bars. -->
          <ul class="space-y-1">
            <li
              v-for="sub in results[p.id].turn!.subagents"
              :key="sub.name"
              class="flex items-center gap-2 text-xs"
            >
              <span class="mono w-44 shrink-0 text-ink-700">{{ sub.name }}</span>
              <div class="flex-1 h-2 bg-ink-100 rounded overflow-hidden">
                <div
                  class="h-full bg-stage-s3"
                  :style="{ width: barWidth(sub.durationMs, results[p.id].turn!) }"
                />
              </div>
              <span class="mono text-ink-600 w-14 text-right">{{ sub.durationMs }}ms</span>
            </li>
          </ul>

          <!-- Rationale from the classifier — surfaces the decomposition strategy. -->
          <div class="text-xs text-ink-500">
            <span class="font-medium text-ink-700">rationale:</span>
            <span class="ml-1">{{ results[p.id].turn!.rationale }}</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
