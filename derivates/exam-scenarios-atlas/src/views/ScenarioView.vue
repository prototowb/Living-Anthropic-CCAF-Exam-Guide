<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { scenarioById, SCENARIOS } from '../data/scenarios'
import Infographic from '../components/Infographic.vue'
import LivingFlow from '../components/LivingFlow.vue'
import CodeExample from '../components/CodeExample.vue'
import QandA from '../components/QandA.vue'
import DomainBadge from '../components/DomainBadge.vue'

const route = useRoute()
const id = computed(() => String(route.params.id))
const scenario = computed(() => scenarioById(id.value))

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
  <div v-if="scenario" class="max-w-6xl mx-auto px-6 py-10 space-y-10">
    <header class="space-y-3">
      <div class="flex items-center gap-3 text-xs text-ink-400">
        <RouterLink to="/" class="no-underline hover:text-ink-700">All scenarios</RouterLink>
        <span>·</span>
        <span class="font-mono">Scenario {{ scenario.number }} of 6</span>
      </div>
      <h1 class="font-serif text-3xl md:text-4xl text-ink-800 leading-tight max-w-3xl">
        {{ scenario.title }}
      </h1>
      <p class="text-ink-600 max-w-prose leading-relaxed">{{ scenario.hook }}</p>
      <div class="flex flex-wrap gap-2 pt-1">
        <DomainBadge v-for="d in scenario.primaryDomains" :key="d" :id="d" />
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
