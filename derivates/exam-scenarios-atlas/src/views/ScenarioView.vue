<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { scenarioById, SCENARIOS } from '../data/scenarios'
import Infographic from '../components/Infographic.vue'
import LivingFlow from '../components/LivingFlow.vue'
import CodeExample from '../components/CodeExample.vue'
import QandA from '../components/QandA.vue'
import DomainBadge from '../components/DomainBadge.vue'
import AntiPatternFoil from '../components/AntiPatternFoil.vue'

const route = useRoute()
const id = computed(() => String(route.params.id))
const scenario = computed(() => scenarioById(id.value))
const printMode = computed(() => route.query.print === '1')

function printPage() {
  window.print()
}

const next = computed(() => {
  if (!scenario.value) return null
  const idx = SCENARIOS.findIndex((s) => s.id === scenario.value!.id)
  return SCENARIOS[(idx + 1) % SCENARIOS.length]
})

const prev = computed(() => {
  if (!scenario.value) return null
  const idx = SCENARIOS.findIndex((s) => s.id === scenario.value!.id)
  return SCENARIOS[(idx - 1 + SCENARIOS.length) % SCENARIOS.length]
})
</script>

<template>
  <!-- ── Print study sheet (?print=1) ─────────────────────────────── -->
  <div v-if="scenario && printMode" class="max-w-4xl mx-auto px-6 py-8 print-sheet">
    <div class="no-print flex items-center justify-between mb-6 pb-4 border-b border-ink-200">
      <RouterLink
        :to="{ name: 'scenario', params: { id: scenario.id } }"
        class="text-sm text-ink-500 hover:text-ink-800 no-underline"
      >
        ← Back to interactive view
      </RouterLink>
      <button
        type="button"
        class="px-4 py-2 rounded-md bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700"
        @click="printPage"
      >
        Print
      </button>
    </div>

    <header class="mb-6">
      <div class="text-[11px] font-mono text-ink-400 mb-1">
        Exam Scenarios Atlas · Study sheet · Scenario {{ scenario.number }} of 6
      </div>
      <h1 class="font-serif text-2xl text-ink-800 leading-tight">{{ scenario.title }}</h1>
      <p class="text-[13px] text-ink-600 mt-2 leading-relaxed">{{ scenario.brief }}</p>
      <div class="flex flex-wrap gap-2 mt-3">
        <DomainBadge v-for="d in scenario.primaryDomains" :key="d" :id="d" compact />
      </div>
    </header>

    <section class="mb-6 avoid-break">
      <h2 class="section-h">Takeaways</h2>
      <ul class="text-[13px] text-ink-700 space-y-1 list-disc pl-5">
        <li v-for="(t, i) in scenario.takeaways" :key="i">{{ t }}</li>
      </ul>
    </section>

    <section class="mb-6">
      <h2 class="section-h">Flow ({{ scenario.flow.length }} steps)</h2>
      <ol class="space-y-3">
        <li v-for="(s, i) in scenario.flow" :key="i" class="text-[12.5px] avoid-break">
          <div class="font-medium text-ink-800">
            {{ i + 1 }}. {{ s.label }}
            <span v-if="s.stopReason" class="font-mono text-[11px] text-ink-400">
              → {{ s.stopReason }}</span
            >
          </div>
          <p class="text-ink-600 leading-relaxed">{{ s.body }}</p>
          <p v-if="s.mandate" class="text-[11.5px] text-ink-500 italic">{{ s.mandate }}</p>
        </li>
      </ol>
    </section>

    <section class="mb-6">
      <h2 class="section-h">Anti-patterns</h2>
      <div v-for="(f, i) in scenario.foils" :key="i" class="mb-3 avoid-break">
        <div class="text-[13px] font-medium text-ink-800">
          ✗ {{ f.title }}
          <span v-if="f.ref" class="font-mono text-[11px] text-ink-400">({{ f.ref }})</span>
        </div>
        <p class="text-[12.5px] text-ink-600 leading-relaxed">
          {{ f.failure }} <span class="text-ink-800">Instead: {{ f.right.label }}.</span>
        </p>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="section-h">Sample questions (answers marked)</h2>
      <div v-for="(q, i) in scenario.qna" :key="i" class="mb-4 avoid-break">
        <p class="text-[12.5px] text-ink-800 font-medium leading-relaxed">
          Q{{ i + 1 }}. {{ q.q }}
        </p>
        <ul class="text-[12px] text-ink-600 mt-1 space-y-0.5">
          <li
            v-for="o in q.options"
            :key="o.key"
            :class="o.key === q.correct ? 'font-medium text-ink-800' : ''"
          >
            <span class="font-mono">{{ o.key === q.correct ? '✓' : '·' }} {{ o.key }}.</span>
            {{ o.text }}
          </li>
        </ul>
        <p class="text-[11.5px] text-ink-500 mt-1 leading-relaxed">{{ q.explain }}</p>
      </div>
    </section>
  </div>

  <!-- ── Interactive view ─────────────────────────────────────────── -->
  <div v-else-if="scenario" class="max-w-6xl mx-auto px-6 py-10 space-y-10">
    <header class="space-y-3">
      <div class="flex items-center gap-3 text-xs text-ink-400">
        <RouterLink to="/" class="no-underline hover:text-ink-700">All scenarios</RouterLink>
        <span>·</span>
        <span class="font-mono">Scenario {{ scenario.number }} of 6</span>
        <span class="flex-1"></span>
        <RouterLink
          :to="{ name: 'drill', query: { scenario: String(scenario.number) } }"
          class="no-underline hover:text-ink-700"
        >
          Drill this scenario
        </RouterLink>
        <span>·</span>
        <RouterLink
          :to="{ name: 'scenario', params: { id: scenario.id }, query: { print: '1' } }"
          class="no-underline hover:text-ink-700"
        >
          Study sheet ⎙
        </RouterLink>
      </div>
      <h1 class="font-serif text-3xl md:text-4xl text-ink-800 leading-tight max-w-3xl">
        {{ scenario.title }}
      </h1>
      <p class="text-ink-600 max-w-prose leading-relaxed">{{ scenario.hook }}</p>
      <div class="flex flex-wrap gap-2 pt-1">
        <DomainBadge v-for="d in scenario.primaryDomains" :key="d" :id="d" linked />
      </div>
    </header>

    <section class="frame p-5">
      <h2 class="section-h">Brief</h2>
      <p class="text-sm text-ink-700 leading-relaxed max-w-prose">{{ scenario.brief }}</p>
    </section>

    <section class="space-y-3">
      <h2 class="section-h">Infographic</h2>
      <Infographic :spec="scenario.infographic" />
    </section>

    <section class="space-y-3">
      <h2 class="section-h">Example</h2>
      <div class="frame p-5 max-w-prose">
        <h3 class="font-serif text-lg text-ink-800 mb-2">{{ scenario.example.title }}</h3>
        <p class="text-sm text-ink-700 leading-relaxed">{{ scenario.example.body }}</p>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="section-h">Living flow</h2>
      <LivingFlow :steps="scenario.flow" />
    </section>

    <section class="space-y-3">
      <h2 class="section-h">Worked code</h2>
      <CodeExample :blocks="scenario.code" />
    </section>

    <section class="space-y-3">
      <h2 class="section-h">Anti-pattern foils</h2>
      <p class="text-sm text-ink-500 max-w-prose">
        The plausible-sounding wrong way beside the mandated way — the exam's wrong options are
        built from exactly these.
      </p>
      <AntiPatternFoil :foils="scenario.foils" />
    </section>

    <section class="space-y-3">
      <h2 class="section-h">Sample questions</h2>
      <QandA :items="scenario.qna" />
    </section>

    <section class="frame p-5 bg-ink-100/40">
      <h2 class="section-h">Takeaways</h2>
      <ul class="space-y-1.5 text-sm text-ink-700 max-w-prose">
        <li v-for="(t, i) in scenario.takeaways" :key="i" class="flex gap-2">
          <span class="text-accent">▸</span><span>{{ t }}</span>
        </li>
      </ul>
    </section>

    <nav class="flex items-center justify-between border-t border-ink-200 pt-6 mt-10 text-sm">
      <RouterLink
        v-if="prev"
        :to="{ name: 'scenario', params: { id: prev.id } }"
        class="text-ink-500 hover:text-ink-800 no-underline"
      >
        ← {{ prev.title }}
      </RouterLink>
      <span v-else></span>
      <RouterLink
        v-if="next"
        :to="{ name: 'scenario', params: { id: next.id } }"
        class="text-ink-500 hover:text-ink-800 no-underline"
      >
        {{ next.title }} →
      </RouterLink>
    </nav>
  </div>
  <div v-else class="max-w-2xl mx-auto px-6 py-20 text-center">
    <p class="text-ink-500">No scenario with id <code class="code-inline">{{ id }}</code>.</p>
    <RouterLink to="/" class="text-accent-ink">Back to atlas</RouterLink>
  </div>
</template>
