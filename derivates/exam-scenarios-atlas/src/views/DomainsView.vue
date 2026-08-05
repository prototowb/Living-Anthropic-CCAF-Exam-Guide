<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { DOMAINS } from '../data/domains'
import { SCENARIOS } from '../data/scenarios'

function scenariosForDomain(id: number) {
  return SCENARIOS.filter((s) => s.primaryDomains.includes(id as 1 | 2 | 3 | 4 | 5))
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-10 space-y-10">
    <header class="space-y-3">
      <p class="chip">Exam Content · 5 domains</p>
      <h1 class="font-serif text-3xl md:text-4xl text-ink-800 leading-tight">
        Domains × scenarios
      </h1>
      <p class="text-ink-600 max-w-prose leading-relaxed">
        Every scenario primarily exercises 2–3 of these five domains. Pick a domain to see which
        scenarios reinforce it — that's the fastest way to find practice when one domain is your
        weak spot.
      </p>
    </header>

    <ul class="space-y-5">
      <li
        v-for="d in DOMAINS"
        :key="d.id"
        class="frame p-5"
      >
        <header class="flex items-start gap-3 mb-3">
          <span
            class="inline-flex h-9 w-9 items-center justify-center rounded-md font-mono text-sm text-white"
            :class="['bg-domain-' + d.id]"
          >D{{ d.id }}</span>
          <div class="flex-1">
            <div class="flex items-baseline justify-between gap-3">
              <h2 class="font-serif text-lg text-ink-800">{{ d.title }}</h2>
              <span class="text-xs text-ink-400 font-mono">{{ d.weight }}% of scored content</span>
            </div>
            <p class="text-sm text-ink-500 leading-relaxed mt-0.5 max-w-prose">{{ d.oneLiner }}</p>
          </div>
        </header>
        <div class="flex flex-wrap gap-2 pt-2 border-t border-ink-200">
          <RouterLink
            v-for="s in scenariosForDomain(d.id)"
            :key="s.id"
            :to="{ name: 'scenario', params: { id: s.id } }"
            class="px-3 py-1.5 rounded-md bg-ink-50 hover:bg-ink-100 border border-ink-200 text-[12.5px] text-ink-700 no-underline"
          >
            Scenario {{ s.number }} · {{ s.title }}
          </RouterLink>
        </div>
      </li>
    </ul>
  </div>
</template>
