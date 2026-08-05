<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SCENARIOS } from '../data/scenarios'
import { DOMAINS } from '../data/domains'
import { DRILL_ITEMS } from '../data/drill'
import DomainBadge from '../components/DomainBadge.vue'
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-10 space-y-12">
    <section class="space-y-4">
      <p class="chip">Claude Certified Architect · Foundations</p>
      <h1 class="font-serif text-4xl md:text-5xl text-ink-800 leading-tight max-w-3xl">
        Six scenarios. One atlas.
      </h1>
      <p class="text-ink-600 max-w-prose leading-relaxed">
        The exam draws four scenarios at random from the six below. Each card opens a page with
        an infographic of the architecture, a steppable walkthrough of the flow, a worked code
        example, and the sample Q&amp;A — answers revealed on demand.
      </p>
    </section>

    <section class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      <RouterLink
        v-for="s in SCENARIOS"
        :key="s.id"
        :to="{ name: 'scenario', params: { id: s.id } }"
        class="group frame p-5 no-underline hover:shadow-md transition-shadow flex flex-col gap-3"
      >
        <header class="flex items-center justify-between">
          <span class="font-mono text-[11px] text-ink-400">Scenario {{ s.number }}</span>
          <span class="text-[11px] text-ink-400">{{ s.qna.length }} Q&amp;A</span>
        </header>
        <h3 class="font-serif text-lg text-ink-800 leading-snug group-hover:text-accent-ink">
          {{ s.title }}
        </h3>
        <p class="text-[13.5px] text-ink-600 leading-relaxed">{{ s.hook }}</p>
        <div class="mt-auto pt-2 flex flex-wrap gap-1.5">
          <DomainBadge
            v-for="d in s.primaryDomains"
            :key="d"
            :id="d"
            compact
          />
        </div>
      </RouterLink>
    </section>

    <section class="frame p-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[260px] space-y-1">
        <h2 class="section-h mb-1">Recognition drill</h2>
        <p class="text-sm text-ink-500 max-w-prose">
          Reading a fragment and naming the scenario is the actual exam skill. Drill it against
          {{ DRILL_ITEMS.length }} authored fragments — requirements, log excerpts, stakeholder quotes.
        </p>
      </div>
      <RouterLink
        to="/drill"
        class="px-4 py-2 rounded-md bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700 no-underline"
      >
        Start drilling →
      </RouterLink>
    </section>

    <section class="frame p-6 space-y-4">
      <h2 class="section-h mb-1">Domain weighting</h2>
      <p class="text-sm text-ink-500 max-w-prose">
        Each scenario primarily exercises 2–3 of the five exam domains. The percentages are the
        share of scored content on the exam, per the v0.1 guide.
      </p>
      <ul class="grid md:grid-cols-2 gap-3 mt-3">
        <li
          v-for="d in DOMAINS"
          :key="d.id"
          class="flex items-start gap-3 rounded-lg border border-ink-200 p-3 bg-white"
        >
          <span
            class="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs text-white"
            :style="{ background: `var(--tw-shadow, currentColor)` }"
            :class="['bg-domain-' + d.id]"
          >D{{ d.id }}</span>
          <div class="flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <h3 class="text-sm font-serif text-ink-800">{{ d.title }}</h3>
              <span class="text-xs text-ink-400 font-mono">{{ d.weight }}%</span>
            </div>
            <p class="text-[12.5px] text-ink-500 leading-relaxed mt-0.5">{{ d.oneLiner }}</p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
