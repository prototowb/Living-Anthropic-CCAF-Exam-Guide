<script setup lang="ts">
// /debug — dev-only surface for running in-browser regressions. Scenario 3
// v0.3 task 9. Currently just exposes the dispatchAllSettled serial-fallback
// harness defined in `src/agents/tutor/__test__/dispatch.spec.ts`.
//
// Per `src/views/CLAUDE.md` rule 2 (no agent imports from views), this is a
// deliberate exception: the regression harness IS the test surface, and a
// dev-only debug view is the canonical landing pad for it pre-Vitest.

import { ref } from 'vue';
import { runDispatchRegression, type RegressionResult } from '@/agents/tutor/__test__/dispatch.spec';

const running = ref(false);
const result = ref<RegressionResult | null>(null);

async function runRegression() {
  running.value = true;
  result.value = null;
  try {
    result.value = await runDispatchRegression();
  } catch (e) {
    result.value = {
      pass: false,
      reasons: [`Harness threw: ${e instanceof Error ? e.message : String(e)}`],
    };
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <section class="space-y-4 max-w-3xl">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">/debug</h1>
      <p class="text-ink-600 mt-1">
        Dev-only. In-browser regression harness for capabilities-aware fallback
        paths. Not linked from primary navigation.
      </p>
    </header>

    <article class="p-4 rounded-lg border border-ink-200 bg-white space-y-3">
      <div>
        <h2 class="font-medium">Dispatch regression — serial fallback</h2>
        <p class="text-sm text-ink-600 mt-1">
          Swaps in an unreliable adapter with
          <code class="mono text-xs px-1 py-0.5 rounded bg-ink-100">parallelSubagents: false</code>
          and verifies the Tutor still produces a coherent multi-spoke reply
          via the <code class="mono text-xs">runSerial</code> branch.
        </p>
      </div>

      <button
        type="button"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm disabled:opacity-50"
        :disabled="running"
        @click="runRegression"
      >
        {{ running ? 'Running…' : 'Run dispatch regression' }}
      </button>

      <div v-if="result" class="space-y-2">
        <div
          class="rounded p-3 text-sm"
          :class="
            result.pass
              ? 'bg-stage-s3/10 border border-stage-s3/30 text-stage-s3'
              : 'bg-stage-s5/10 border border-stage-s5/30 text-stage-s5'
          "
        >
          <strong>{{ result.pass ? 'PASS' : 'FAIL' }}</strong>
          <span v-if="!result.pass" class="ml-2">— {{ result.reasons.length }} reason{{ result.reasons.length > 1 ? 's' : '' }}</span>
        </div>

        <ul v-if="!result.pass" class="text-sm text-ink-700 list-disc pl-5 space-y-1">
          <li v-for="(r, i) in result.reasons" :key="i">{{ r }}</li>
        </ul>

        <details class="text-xs">
          <summary class="cursor-pointer text-ink-600 hover:text-ink-900">Turn metadata</summary>
          <dl class="mono mt-2 space-y-1">
            <div>parallel: <code>{{ result.parallel }}</code></div>
            <div>spokes: <code>{{ result.spokeNames?.join(', ') ?? '(none)' }}</code></div>
          </dl>
        </details>

        <details v-if="result.reply" class="text-xs">
          <summary class="cursor-pointer text-ink-600 hover:text-ink-900">Reply preview</summary>
          <pre class="mono mt-2 p-3 bg-ink-900 text-ink-100 rounded overflow-auto whitespace-pre-wrap">{{ result.reply }}</pre>
        </details>
      </div>
    </article>
  </section>
</template>
