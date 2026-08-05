<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FlowStep } from '../data/types'

const props = defineProps<{ steps: FlowStep[] }>()

const current = ref(0)

watch(
  () => props.steps,
  () => {
    current.value = 0
  },
)

const step = computed(() => props.steps[current.value])
const isLast = computed(() => current.value === props.steps.length - 1)
const isFirst = computed(() => current.value === 0)

function next() {
  if (!isLast.value) current.value += 1
}
function prev() {
  if (!isFirst.value) current.value -= 1
}
function jump(i: number) {
  current.value = i
}

const stopColour: Record<NonNullable<FlowStep['stopReason']>, string> = {
  tool_use: 'bg-domain-2/15 text-domain-2 border-domain-2/30',
  end_turn: 'bg-domain-3/15 text-domain-3 border-domain-3/30',
  pause_for_human: 'bg-domain-4/15 text-domain-4 border-domain-4/30',
  error: 'bg-accent-soft text-accent-ink border-accent/40',
}
</script>

<template>
  <section class="frame p-5">
    <header class="flex items-center justify-between mb-4">
      <h3 class="section-h mb-0">Living flow</h3>
      <div class="text-xs text-ink-400">
        Step {{ current + 1 }} / {{ steps.length }}
      </div>
    </header>

    <!-- Rail -->
    <div class="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
      <template v-for="(s, i) in steps" :key="i">
        <button
          type="button"
          class="flex flex-col items-center min-w-[64px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          @click="jump(i)"
        >
          <span
            class="rail-dot"
            :class="{ 'is-active': i === current, 'is-done': i < current }"
          ></span>
          <span
            class="text-[10.5px] leading-tight text-center mt-1 max-w-[80px]"
            :class="i === current ? 'text-ink-800 font-medium' : 'text-ink-400'"
          >
            {{ s.label }}
          </span>
        </button>
        <span v-if="i < steps.length - 1" class="flex-1 h-px bg-ink-200 min-w-[20px]"></span>
      </template>
    </div>

    <!-- Active step body -->
    <div class="grid lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-3">
        <div class="text-sm text-ink-700 leading-relaxed max-w-prose">
          {{ step.body }}
        </div>

        <div v-if="step.toolCalls && step.toolCalls.length" class="space-y-2">
          <div class="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
            Tool calls this step
          </div>
          <div
            v-for="(t, i) in step.toolCalls"
            :key="i"
            class="rounded-lg border bg-ink-50"
            :class="t.isError ? 'border-accent/50' : 'border-ink-200'"
          >
            <div class="flex items-center gap-2 px-3 py-1.5 border-b border-ink-200">
              <span
                class="font-mono text-[12px]"
                :class="t.isError ? 'text-accent-ink' : 'text-ink-800'"
              >{{ t.name }}</span>
              <span v-if="t.isError" class="chip border-accent/40 text-accent-ink bg-accent-soft">
                isError
              </span>
            </div>
            <pre class="px-3 py-2 font-mono text-[11.5px] text-ink-700 whitespace-pre-wrap break-all">{{
              t.input
            }}</pre>
            <div
              v-if="t.result"
              class="px-3 py-2 border-t border-ink-200 font-mono text-[11.5px] whitespace-pre-wrap break-all"
              :class="t.isError ? 'text-accent-ink bg-accent-soft/40' : 'text-ink-700'"
            >
              <span class="text-ink-400 mr-2">→</span>{{ t.result }}
            </div>
          </div>
        </div>

        <div v-if="step.mandate" class="text-[11.5px] text-ink-500 italic max-w-prose">
          <span class="text-domain-5 font-medium not-italic">Mandate:</span> {{ step.mandate }}
        </div>
      </div>

      <aside class="space-y-3">
        <div v-if="step.stopReason" class="space-y-1">
          <div class="text-[11px] uppercase tracking-wider text-ink-400 font-medium">stop_reason</div>
          <span
            class="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[12px]"
            :class="stopColour[step.stopReason]"
          >{{ step.stopReason }}</span>
        </div>

        <div class="text-[11px] text-ink-400 leading-relaxed">
          The loop continues while <span class="code-inline">stop_reason</span> is
          <span class="code-inline">tool_use</span>. Tool results are appended to
          <span class="code-inline">messages</span> before the next
          <span class="code-inline">create()</span>.
        </div>
      </aside>
    </div>

    <footer class="mt-5 flex items-center justify-between border-t border-ink-200 pt-3">
      <button
        type="button"
        class="text-sm text-ink-500 hover:text-ink-800 disabled:opacity-30"
        :disabled="isFirst"
        @click="prev"
      >
        ← Prev
      </button>
      <button
        type="button"
        class="text-sm text-ink-500 hover:text-ink-800 disabled:opacity-30"
        :disabled="isLast"
        @click="next"
      >
        Next →
      </button>
    </footer>
  </section>
</template>
