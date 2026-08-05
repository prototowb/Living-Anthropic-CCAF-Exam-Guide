<script setup lang="ts">
import { reactive } from 'vue'
import type { QnA } from '../data/types'
import { mandateRefs } from '../data/parentLinks'

const props = defineProps<{ items: QnA[] }>()

interface State {
  selected: 'A' | 'B' | 'C' | 'D' | null
  revealed: boolean
}

const state = reactive<Record<number, State>>(
  Object.fromEntries(props.items.map((_, i) => [i, { selected: null, revealed: false }])),
)

function select(i: number, key: 'A' | 'B' | 'C' | 'D') {
  if (state[i].revealed) return
  state[i].selected = key
}

function reveal(i: number) {
  state[i].revealed = true
}

function reset(i: number) {
  state[i].revealed = false
  state[i].selected = null
}

function classFor(i: number, key: 'A' | 'B' | 'C' | 'D', correct: 'A' | 'B' | 'C' | 'D') {
  const s = state[i]
  if (!s.revealed) {
    return s.selected === key
      ? 'border-ink-700 bg-ink-100'
      : 'border-ink-200 hover:border-ink-400'
  }
  if (key === correct) return 'border-domain-3 bg-domain-3/10 text-ink-800'
  if (s.selected === key) return 'border-accent bg-accent-soft text-accent-ink'
  return 'border-ink-200 opacity-60'
}
</script>

<template>
  <section class="space-y-6">
    <article
      v-for="(item, i) in items"
      :key="i"
      class="frame p-5"
    >
      <header class="flex items-baseline justify-between gap-3 mb-3">
        <h4 class="font-serif text-base text-ink-800">Q{{ i + 1 }}</h4>
        <span v-if="item.ref" class="text-[11px] text-ink-400 font-mono">{{ item.ref }}</span>
      </header>
      <p class="text-sm text-ink-700 leading-relaxed mb-4 max-w-prose">{{ item.q }}</p>
      <div class="grid sm:grid-cols-2 gap-2 mb-4">
        <button
          v-for="opt in item.options"
          :key="opt.key"
          type="button"
          class="text-left p-3 rounded-lg border text-[13px] leading-relaxed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          :class="classFor(i, opt.key, item.correct)"
          @click="select(i, opt.key)"
        >
          <span class="inline-block w-5 font-mono text-ink-400">{{ opt.key }}.</span>
          <span class="text-ink-700">{{ opt.text }}</span>
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="!state[i].revealed"
          type="button"
          class="px-3 py-1.5 rounded-md bg-ink-800 text-ink-50 text-[12px] font-medium disabled:opacity-30 hover:bg-ink-700"
          :disabled="!state[i].selected"
          @click="reveal(i)"
        >
          Reveal answer
        </button>
        <button
          v-else
          type="button"
          class="px-3 py-1.5 rounded-md border border-ink-200 text-ink-600 text-[12px] hover:bg-ink-50"
          @click="reset(i)"
        >
          Try again
        </button>
        <span v-if="state[i].revealed" class="text-[12px]">
          <template v-if="state[i].selected === item.correct">
            <span class="text-domain-3 font-medium">Correct.</span>
          </template>
          <template v-else>
            <span class="text-accent-ink font-medium">Correct answer is {{ item.correct }}.</span>
          </template>
        </span>
      </div>

      <Transition name="reveal">
        <div
          v-if="state[i].revealed"
          class="mt-4 border-t border-ink-200 pt-3 space-y-2 max-w-prose"
        >
          <p class="text-[13px] text-ink-600 leading-relaxed">{{ item.explain }}</p>
          <div v-if="item.ref && mandateRefs(item.ref).length" class="flex flex-wrap gap-1.5">
            <a
              v-for="r in mandateRefs(item.ref)"
              :key="r.ts"
              :href="r.url"
              target="_blank"
              rel="noopener"
              class="chip no-underline hover:bg-ink-50"
              :title="`Study this mandate in the parent playbook (pattern: ${r.patternId})`"
            >
              <span class="font-mono">{{ r.ts }}</span>
              <span class="text-ink-400 ml-1">{{ r.patternId }} ↗</span>
            </a>
          </div>
        </div>
      </Transition>
    </article>
  </section>
</template>
