<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  SessionLifecycleAction,
  SessionLifecycleSandbox,
  SessionTurn,
} from '@/data/types';

const props = defineProps<{ sandbox: SessionLifecycleSandbox }>();

const baselineTokens = computed(() =>
  props.sandbox.baselineTurns.reduce((sum, t) => sum + t.tokensAdded, 0),
);

// `current` is the active token total. Starts at baseline; mutates as actions fire.
const current = ref(baselineTokens.value);
const lastAction = ref<SessionLifecycleAction | null>(null);

function applyAction(a: SessionLifecycleAction) {
  current.value = a.resultTokens;
  lastAction.value = a;
}

function reset() {
  current.value = baselineTokens.value;
  lastAction.value = null;
}

function fmtPct(tokens: number) {
  const pct = (tokens / props.sandbox.capacity) * 100;
  return `${pct.toFixed(0)}%`;
}

function fmtK(tokens: number) {
  return `${(tokens / 1000).toFixed(0)}k`;
}

function barWidth(tokens: number): string {
  const pct = Math.min(100, (tokens / props.sandbox.capacity) * 100);
  return `${pct}%`;
}

function turnWidth(turn: SessionTurn): string {
  return `${(turn.tokensAdded / props.sandbox.capacity) * 100}%`;
}

function actionVariant(id: SessionLifecycleAction['id']) {
  if (id === 'clear') return 'border-rose-300 hover:bg-rose-50 text-rose-800';
  if (id === 'compact') return 'border-emerald-300 hover:bg-emerald-50 text-emerald-800';
  return 'border-sky-300 hover:bg-sky-50 text-sky-800';
}
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-ink-200 bg-white p-4">
      <header class="mb-3 flex items-baseline gap-2">
        <span class="text-xs uppercase tracking-wide text-ink-500">Context window</span>
        <span class="text-sm font-mono text-ink-700">
          {{ fmtK(current) }} / {{ fmtK(sandbox.capacity) }}
        </span>
        <span class="text-xs text-ink-500">({{ fmtPct(current) }} full)</span>
      </header>

      <div class="h-3 w-full rounded-full bg-ink-100 overflow-hidden">
        <div
          class="h-full bg-ink-700 transition-all duration-300"
          :style="{ width: barWidth(current) }"
        />
      </div>

      <p
        v-if="lastAction"
        class="mt-3 text-xs italic text-ink-600"
      >
        After <code class="font-mono">{{ lastAction.label }}</code>: {{ lastAction.rationale }}
      </p>
      <p v-else class="mt-3 text-xs italic text-ink-600">
        Baseline — eight turns of mid-task work. Pick an action below to see
        what each one does to the running context.
      </p>
    </section>

    <section class="grid grid-cols-3 gap-3">
      <button
        v-for="a in sandbox.actions"
        :key="a.id"
        @click="applyAction(a)"
        :class="[
          'rounded-lg border bg-white p-3 text-left transition',
          actionVariant(a.id),
          lastAction?.id === a.id ? 'ring-2 ring-offset-1' : '',
        ]"
      >
        <div class="font-mono text-sm font-semibold">{{ a.label }}</div>
        <div class="mt-1 text-xs text-ink-500">
          → {{ fmtK(a.resultTokens) }} ({{ fmtPct(a.resultTokens) }})
        </div>
      </button>
    </section>

    <button
      @click="reset"
      class="text-xs text-ink-500 hover:text-ink-900 underline"
    >
      Reset to baseline
    </button>

    <section class="rounded-lg border border-ink-200 bg-white p-4">
      <header class="mb-2 text-xs uppercase tracking-wide text-ink-500">
        Baseline turns
      </header>
      <ul class="space-y-1.5 text-xs">
        <li
          v-for="turn in sandbox.baselineTurns"
          :key="turn.id"
          class="flex items-center gap-2"
        >
          <div class="flex-1 truncate text-ink-700">{{ turn.label }}</div>
          <div class="h-2 rounded-full bg-ink-200" :style="{ width: turnWidth(turn) }" />
          <div class="w-12 text-right font-mono text-ink-500">{{ fmtK(turn.tokensAdded) }}</div>
        </li>
      </ul>
    </section>
  </div>
</template>
