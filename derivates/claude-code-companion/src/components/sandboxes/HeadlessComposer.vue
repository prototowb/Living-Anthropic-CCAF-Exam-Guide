<script setup lang="ts">
import { computed, ref } from 'vue';
import type { HeadlessPart, HeadlessSandbox } from '@/data/types';

const props = defineProps<{ sandbox: HeadlessSandbox }>();

// Required parts start on; optional parts start off.
const on = ref<Record<string, boolean>>(
  Object.fromEntries(props.sandbox.parts.map((p) => [p.id, p.required])),
);

function toggle(p: HeadlessPart) {
  if (p.required) return;
  on.value[p.id] = !on.value[p.id];
}

const assembled = computed(() =>
  props.sandbox.parts
    .filter((p) => on.value[p.id])
    .map((p) => p.fragment)
    .join(' \\\n  '),
);

const usingJsonOutput = computed(() => on.value['output-format'] ?? false);
const usingPlanMode = computed(() => on.value['permission-mode'] ?? false);
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-ink-200 bg-white p-4">
      <header class="mb-3 flex items-baseline justify-between">
        <span class="text-xs uppercase tracking-wide text-ink-500">Command parts</span>
        <span class="text-[11px] text-ink-500">
          Required parts are pinned on. Toggle the optional ones.
        </span>
      </header>
      <ul class="space-y-2">
        <li
          v-for="p in sandbox.parts"
          :key="p.id"
          class="rounded-md border border-ink-200 p-2"
        >
          <label
            class="flex items-start gap-2"
            :class="p.required ? 'cursor-default' : 'cursor-pointer'"
          >
            <input
              type="checkbox"
              :checked="on[p.id] ?? false"
              @change="toggle(p)"
              :disabled="p.required"
              class="mt-1 accent-ink-900"
            />
            <div class="flex-1 min-w-0">
              <code class="font-mono text-xs text-ink-900">{{ p.fragment }}</code>
              <span
                v-if="p.required"
                class="ml-2 rounded-full border border-ink-300 px-1.5 text-[10px] uppercase tracking-wide text-ink-500"
              >
                required
              </span>
              <p class="mt-1 text-[11px] text-ink-600">{{ p.explanation }}</p>
            </div>
          </label>
        </li>
      </ul>
    </section>

    <section class="rounded-lg border border-ink-200 bg-ink-900 text-ink-100 p-4">
      <header class="mb-2 flex items-baseline justify-between">
        <span class="text-xs uppercase tracking-wide text-ink-400">Assembled command</span>
        <span class="text-[11px] text-ink-400">
          paste this into a shell or CI step
        </span>
      </header>
      <pre class="font-mono text-xs leading-relaxed whitespace-pre-wrap">{{ assembled }}</pre>
    </section>

    <div v-if="usingJsonOutput" class="grid grid-cols-2 gap-4">
      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-2">
          <span class="text-xs uppercase tracking-wide text-ink-500">Sample JSON output</span>
        </header>
        <pre class="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-800">{{ sandbox.sampleOutput }}</pre>
      </section>

      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-2">
          <span class="text-xs uppercase tracking-wide text-ink-500">Pipe through jq</span>
        </header>
        <pre class="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-800">{{ sandbox.jqSnippet }}</pre>
        <p class="mt-2 text-[11px] text-ink-500">
          With <code class="font-mono">--output-format json</code>, the response
          is parseable. <code class="font-mono">jq -r .result</code> pulls just
          the answer text — drop it into a script variable.
        </p>
      </section>
    </div>

    <aside
      v-if="usingPlanMode"
      class="rounded-md border border-stage-s3/40 bg-stage-s3/5 p-3 text-xs text-stage-s3"
    >
      With <code class="font-mono">--permission-mode plan</code> active, Claude
      will research and propose, but cannot edit or run shell commands. Useful
      for "what would you change?" runs in CI that should never modify the
      working tree.
    </aside>

    <aside
      v-if="!usingJsonOutput"
      class="rounded-md border border-ink-200 bg-ink-50 p-3 text-xs text-ink-700"
    >
      Without <code class="font-mono">--output-format json</code> the response
      is free-form text — fine for humans, awkward for scripts. Toggle it on
      to see the parseable shape.
    </aside>
  </div>
</template>
