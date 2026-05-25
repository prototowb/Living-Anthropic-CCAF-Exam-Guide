<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PlanWorkshopSandbox, PlanWorkshopVariant } from '@/data/types';

const props = defineProps<{ sandbox: PlanWorkshopSandbox }>();

const activeId = ref<string>(props.sandbox.variants[0]?.id ?? '');

const active = computed<PlanWorkshopVariant | undefined>(() =>
  props.sandbox.variants.find((v) => v.id === activeId.value),
);

function pick(id: string) {
  activeId.value = id;
}

function scopeBadgeClass(scope: PlanWorkshopVariant['scope']) {
  if (scope === 'tight') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (scope === 'medium') return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-rose-100 text-rose-800 border-rose-300';
}

function scopeLabel(scope: PlanWorkshopVariant['scope']) {
  if (scope === 'tight') return 'tight scope';
  if (scope === 'medium') return 'medium scope';
  return 'bloated — re-prompt';
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="v in sandbox.variants"
        :key="v.id"
        @click="pick(v.id)"
        :class="[
          'rounded-md border px-3 py-1.5 text-xs transition',
          activeId === v.id
            ? 'bg-ink-900 text-white border-ink-900'
            : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50',
        ]"
      >
        {{ v.id }}
      </button>
    </div>

    <div v-if="active" class="grid grid-cols-2 gap-4">
      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-2 flex items-center gap-2">
          <span class="text-xs uppercase tracking-wide text-ink-500">Your prompt</span>
        </header>
        <pre class="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink-900">{{ active.prompt }}</pre>
      </section>

      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3 flex items-center gap-2">
          <span class="text-xs uppercase tracking-wide text-ink-500">Claude's plan</span>
          <span
            :class="[
              'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide',
              scopeBadgeClass(active.scope),
            ]"
          >
            {{ scopeLabel(active.scope) }}
          </span>
        </header>
        <ol class="space-y-2 text-sm">
          <li
            v-for="(step, i) in active.plan"
            :key="i"
            class="rounded border border-ink-100 bg-canvas px-3 py-2"
          >
            <div class="text-ink-900">{{ i + 1 }}. {{ step.text }}</div>
            <div v-if="step.files.length" class="mt-1 flex flex-wrap gap-1">
              <code
                v-for="f in step.files"
                :key="f"
                class="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-700"
                >{{ f }}</code
              >
            </div>
          </li>
        </ol>
      </section>
    </div>

    <aside
      v-if="active"
      class="rounded-md border border-ink-200 bg-ink-50 p-3 text-sm text-ink-800"
    >
      <strong class="text-xs uppercase tracking-wide text-ink-500">Read this next:</strong>
      <p class="mt-1">{{ active.shrinkHint }}</p>
    </aside>
  </div>
</template>
