<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SubagentChoice, SubagentDispatcherSandbox } from '@/data/types';

const props = defineProps<{ sandbox: SubagentDispatcherSandbox }>();

const picked = ref<Record<string, boolean>>({});
const mode = ref<'parallel' | 'serial'>('parallel');

const pickedAgents = computed<SubagentChoice[]>(() =>
  props.sandbox.agents.filter((a) => picked.value[a.id]),
);

const wallClock = computed(() => {
  if (pickedAgents.value.length === 0) return 0;
  if (mode.value === 'serial') {
    return pickedAgents.value.reduce((s, a) => s + a.estimatedSeconds, 0);
  }
  return Math.max(...pickedAgents.value.map((a) => a.estimatedSeconds));
});

const serialSavings = computed(() => {
  if (mode.value === 'parallel' && pickedAgents.value.length > 1) {
    const serial = pickedAgents.value.reduce((s, a) => s + a.estimatedSeconds, 0);
    return serial - wallClock.value;
  }
  return 0;
});

function toggle(id: string) {
  picked.value[id] = !picked.value[id];
}

function fitBadge(fit: SubagentChoice['fit']) {
  if (fit === 'great') return { label: 'great fit', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (fit === 'ok') return { label: 'ok fit', cls: 'bg-amber-100 text-amber-800 border-amber-300' };
  return { label: 'wrong tool', cls: 'bg-rose-100 text-rose-800 border-rose-300' };
}

function barWidth(a: SubagentChoice): string {
  const max = Math.max(...props.sandbox.agents.map((x) => x.estimatedSeconds));
  return `${(a.estimatedSeconds / max) * 100}%`;
}
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-800">
      <span class="text-xs uppercase tracking-wide text-ink-500">Task:</span>
      <p class="mt-1">{{ sandbox.task }}</p>
    </section>

    <div class="grid grid-cols-2 gap-4">
      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3 flex items-center gap-2">
          <span class="text-xs uppercase tracking-wide text-ink-500">Subagent fleet</span>
        </header>

        <ul class="space-y-2">
          <li
            v-for="a in sandbox.agents"
            :key="a.id"
            class="rounded-md border border-ink-200 p-3"
          >
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                :checked="picked[a.id] ?? false"
                @change="toggle(a.id)"
                class="mt-1 accent-ink-900"
              />
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <code class="font-mono text-sm font-semibold">{{ a.name }}</code>
                  <span
                    :class="['rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide', fitBadge(a.fit).cls]"
                  >
                    {{ fitBadge(a.fit).label }}
                  </span>
                  <span class="ml-auto font-mono text-xs text-ink-500">~{{ a.estimatedSeconds }}s</span>
                </div>
                <p class="mt-1 text-xs text-ink-600">{{ a.role }}</p>
                <p class="mt-1 text-[10px] font-mono text-ink-400">
                  tools: {{ a.tools.join(', ') }}
                </p>
              </div>
            </label>
          </li>
        </ul>
      </section>

      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3 flex items-center gap-2">
          <span class="text-xs uppercase tracking-wide text-ink-500">Dispatch</span>
          <div class="ml-auto inline-flex rounded-md border border-ink-200 overflow-hidden">
            <button
              @click="mode = 'parallel'"
              :class="[
                'px-3 py-1 text-xs',
                mode === 'parallel' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-ink-50',
              ]"
            >
              parallel
            </button>
            <button
              @click="mode = 'serial'"
              :class="[
                'px-3 py-1 text-xs',
                mode === 'serial' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-ink-50',
              ]"
            >
              serial
            </button>
          </div>
        </header>

        <p v-if="pickedAgents.length === 0" class="text-xs italic text-ink-400">
          Pick at least one subagent to dispatch.
        </p>

        <template v-else>
          <div class="space-y-2">
            <div
              v-for="(a, i) in pickedAgents"
              :key="a.id"
              class="flex items-center gap-2"
            >
              <code class="font-mono text-xs text-ink-700 w-32 truncate">{{ a.name }}</code>
              <div
                class="h-3 rounded-full bg-stage-s3 transition-all"
                :style="{
                  width: barWidth(a),
                  marginLeft: mode === 'serial' && i > 0 ? barWidth(pickedAgents[i - 1]) : '0',
                  opacity: 0.85,
                }"
              />
              <span class="ml-auto font-mono text-xs text-ink-500">{{ a.estimatedSeconds }}s</span>
            </div>
          </div>

          <div class="mt-4 rounded-md border border-ink-100 bg-canvas p-3 text-sm">
            <p>
              Wall-clock:
              <strong class="font-mono">{{ wallClock }}s</strong>
              <span v-if="mode === 'parallel'" class="text-ink-500">
                (slowest spoke; others finish sooner)
              </span>
              <span v-else class="text-ink-500">(sum of all spokes)</span>
            </p>
            <p v-if="serialSavings > 0" class="mt-1 text-emerald-700">
              Saved {{ serialSavings }}s vs. running them one at a time.
            </p>
          </div>
        </template>
      </section>
    </div>

    <aside class="rounded-md border border-ink-200 bg-ink-50 p-3 text-xs text-ink-700">
      <strong class="text-ink-500 uppercase tracking-wide">Note:</strong>
      Parallel dispatch wins when spokes are independent. If subagent B needs
      subagent A's output, serial is the only honest choice. The wrong-tool
      spoke wastes wall-clock either way — picking the right roster matters
      more than picking the right concurrency.
    </aside>
  </div>
</template>
