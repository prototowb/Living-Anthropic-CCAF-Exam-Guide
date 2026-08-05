<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useDrillStore } from '../stores/drill'
import { SCENARIOS, scenarioByNumber } from '../data/scenarios'
import { DOMAINS, domainById } from '../data/domains'
import { DRILL_ITEMS } from '../data/drill'

const drill = useDrillStore()

const kindLabel: Record<string, string> = {
  requirement: 'Requirement fragment',
  log: 'Log excerpt',
  quote: 'Stakeholder quote',
}

const options = computed(() => {
  if (!drill.current) return []
  return drill.current.ask === 'scenario'
    ? SCENARIOS.map((s) => ({ value: s.number as number, label: s.title, tag: `S${s.number}` }))
    : DOMAINS.map((d) => ({ value: d.id as number, label: d.title, tag: `D${d.id}` }))
})

function optionClass(value: number) {
  if (!drill.revealed) return 'border-ink-200 hover:border-ink-400'
  if (value === drill.current?.answer) return 'border-domain-3 bg-domain-3/10 text-ink-800'
  if (value === drill.picked) return 'border-accent bg-accent-soft text-accent-ink'
  return 'border-ink-200 opacity-60'
}

function answerLabel(item: { ask: string; answer: number }): string {
  return item.ask === 'scenario'
    ? `S${item.answer} · ${scenarioByNumber(item.answer)?.title ?? ''}`
    : `D${item.answer} · ${domainById(item.answer)?.title ?? ''}`
}

const reviewRows = computed(() =>
  drill.answers.map((a) => {
    const item = DRILL_ITEMS.find((i) => i.id === a.itemId)!
    return { ...a, item, answerLabel: answerLabel(item) }
  }),
)
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10 space-y-8">
    <!-- Idle: intro + aggregate stats -->
    <template v-if="drill.phase === 'idle'">
      <header class="space-y-3">
        <p class="chip">Recognition drill</p>
        <h1 class="font-serif text-3xl md:text-4xl text-ink-800 leading-tight">
          Place the fragment.
        </h1>
        <p class="text-ink-600 max-w-prose leading-relaxed">
          The exam hands you a scenario and the skill under test is recognising it. Each round
          shows a requirement fragment, a log excerpt, or a stakeholder quote — none of them
          verbatim from the briefs — and asks: which scenario is this from, or which domain owns
          this decision?
        </p>
      </header>

      <section class="frame p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <div class="text-[11px] uppercase tracking-wider text-ink-400 font-medium">Items</div>
          <div class="font-mono text-lg text-ink-800">{{ DRILL_ITEMS.length }}</div>
        </div>
        <div>
          <div class="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
            Lifetime accuracy
          </div>
          <div class="font-mono text-lg text-ink-800">
            {{ drill.accuracy === null ? '—' : drill.accuracy + '%' }}
          </div>
        </div>
        <div v-if="drill.stats.runs.length">
          <div class="text-[11px] uppercase tracking-wider text-ink-400 font-medium">Last run</div>
          <div class="font-mono text-lg text-ink-800">
            {{ drill.stats.runs[0].correct }}/{{ drill.stats.runs[0].total }}
          </div>
        </div>
        <button
          type="button"
          class="ml-auto px-4 py-2 rounded-md bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700"
          @click="drill.startRun()"
        >
          Start a run
        </button>
      </section>

      <p class="text-[12px] text-ink-400 max-w-prose">
        Only aggregate accuracy persists on this device (<span class="code-inline"
          >esa:drill:v1</span
        >) — individual runs reset so items stay fresh.
      </p>
    </template>

    <!-- Running: one item -->
    <template v-else-if="drill.phase === 'running' && drill.current">
      <header class="flex items-center justify-between">
        <span class="chip">{{ kindLabel[drill.current.kind] }}</span>
        <span class="text-xs text-ink-400 font-mono">
          {{ drill.index + 1 }} / {{ drill.order.length }} · {{ drill.runCorrect }} correct
        </span>
      </header>

      <blockquote
        class="frame p-5 text-[15px] text-ink-800 leading-relaxed whitespace-pre-line font-serif"
      >
        {{ drill.current.prompt }}
      </blockquote>

      <div class="space-y-2">
        <div class="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
          {{ drill.current.ask === 'scenario' ? 'Which scenario is this?' : 'Which domain owns this decision?' }}
        </div>
        <div class="grid sm:grid-cols-2 gap-2">
          <button
            v-for="o in options"
            :key="o.value"
            type="button"
            class="text-left p-3 rounded-lg border text-[13px] leading-relaxed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            :class="optionClass(o.value)"
            @click="drill.answer(o.value)"
          >
            <span class="inline-block w-7 font-mono text-ink-400">{{ o.tag }}</span>
            <span class="text-ink-700">{{ o.label }}</span>
          </button>
        </div>
      </div>

      <Transition name="reveal">
        <div v-if="drill.revealed" class="frame p-5 space-y-3">
          <div class="text-[13px]">
            <span
              v-if="drill.picked === drill.current.answer"
              class="text-domain-3 font-medium"
              >Correct.</span
            >
            <span v-else class="text-accent-ink font-medium">
              This one is {{ answerLabel(drill.current) }}.
            </span>
          </div>
          <p class="text-[13px] text-ink-600 leading-relaxed max-w-prose">
            {{ drill.current.explain }}
          </p>
          <button
            type="button"
            class="px-4 py-2 rounded-md bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700"
            @click="drill.next()"
          >
            {{ drill.index + 1 >= drill.order.length ? 'Finish' : 'Next →' }}
          </button>
        </div>
      </Transition>
    </template>

    <!-- Done: run summary -->
    <template v-else-if="drill.phase === 'done'">
      <header class="space-y-2">
        <p class="chip">Run complete</p>
        <h1 class="font-serif text-3xl text-ink-800">
          {{ drill.runCorrect }} / {{ drill.order.length }}
        </h1>
        <p class="text-ink-600 max-w-prose text-sm leading-relaxed">
          Lifetime accuracy across {{ drill.stats.attempts }} answers:
          <span class="font-mono">{{ drill.accuracy }}%</span>.
        </p>
      </header>

      <section class="space-y-2">
        <div
          v-for="row in reviewRows"
          :key="row.itemId"
          class="frame p-4 flex items-start gap-3"
        >
          <span
            class="mt-0.5 font-mono text-[12px]"
            :class="row.correct ? 'text-domain-3' : 'text-accent-ink'"
            >{{ row.correct ? '✓' : '✗' }}</span
          >
          <div class="flex-1 space-y-1">
            <p class="text-[13px] text-ink-700 leading-relaxed">{{ row.item.prompt }}</p>
            <p class="text-[12px] text-ink-400">{{ row.answerLabel }}</p>
          </div>
        </div>
      </section>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-md bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700"
          @click="drill.startRun()"
        >
          Run again
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-md border border-ink-200 text-ink-600 text-sm hover:bg-ink-50"
          @click="drill.reset()"
        >
          Back to stats
        </button>
        <RouterLink to="/" class="text-sm text-ink-500 hover:text-ink-800 no-underline ml-auto">
          All scenarios →
        </RouterLink>
      </div>
    </template>
  </div>
</template>
