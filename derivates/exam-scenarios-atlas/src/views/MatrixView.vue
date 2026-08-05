<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SCENARIOS } from '../data/scenarios'
import { DOMAINS } from '../data/domains'
import { scenarioTaskRefs, refsForDomain } from '../data/matrix'
import { TASKREF_TO_PATTERNS, parentPatternUrl } from '../data/parentLinks'
import type { DomainId, Scenario } from '../data/types'

const rows = SCENARIOS.map((s) => ({ scenario: s, refs: scenarioTaskRefs(s) }))

function cell(refs: string[], d: DomainId) {
  return refsForDomain(refs, d).map((r) => ({
    ref: r,
    url: parentPatternUrl(TASKREF_TO_PATTERNS[r]?.[0] ?? ''),
    known: Boolean(TASKREF_TO_PATTERNS[r]),
  }))
}

function isPrimary(s: Scenario, d: DomainId): boolean {
  return s.primaryDomains.includes(d)
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-10 space-y-8">
    <header class="space-y-3">
      <p class="chip">Scenario × domain</p>
      <h1 class="font-serif text-3xl md:text-4xl text-ink-800 leading-tight max-w-3xl">
        The matrix.
      </h1>
      <p class="text-ink-600 max-w-prose leading-relaxed">
        Every task statement a scenario cites — in its flow, its Q&amp;A, or its anti-pattern
        foils — placed at the intersection with the domain that owns it. Shaded cells are the
        scenario's <em>primary</em> domains per the exam guide. Chips open the pattern in the
        parent playbook.
      </p>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm min-w-[720px]">
        <thead>
          <tr>
            <th class="text-left p-3 border-b-2 border-ink-300 text-[11px] uppercase tracking-wider text-ink-400 font-medium">
              Scenario
            </th>
            <th
              v-for="d in DOMAINS"
              :key="d.id"
              class="text-left p-3 border-b-2 border-ink-300 align-bottom"
            >
              <div class="font-mono text-[11px]" :class="`text-domain-${d.id}`">D{{ d.id }} · {{ d.weight }}%</div>
              <div class="text-[11.5px] text-ink-600 font-medium leading-tight">{{ d.title }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="{ scenario: s, refs } in rows" :key="s.id" class="border-b border-ink-200">
            <th class="text-left p-3 align-top w-44">
              <RouterLink
                :to="{ name: 'scenario', params: { id: s.id } }"
                class="no-underline hover:text-accent-ink"
              >
                <div class="font-mono text-[11px] text-ink-400">S{{ s.number }}</div>
                <div class="font-serif text-[13.5px] text-ink-800 leading-snug font-normal">
                  {{ s.title }}
                </div>
              </RouterLink>
            </th>
            <td
              v-for="d in DOMAINS"
              :key="d.id"
              class="p-3 align-top"
              :class="isPrimary(s, d.id as DomainId) ? `bg-domain-${d.id}/10` : ''"
            >
              <div class="flex flex-wrap gap-1">
                <template v-for="c in cell(refs, d.id as DomainId)" :key="c.ref">
                  <a
                    v-if="c.known"
                    :href="c.url"
                    target="_blank"
                    rel="noopener"
                    class="chip no-underline hover:bg-ink-50 font-mono"
                    :title="`TS ${c.ref} — open the pattern in the parent playbook`"
                  >{{ c.ref }}</a>
                  <span v-else class="chip font-mono opacity-60">{{ c.ref }}</span>
                </template>
                <span
                  v-if="!cell(refs, d.id as DomainId).length"
                  class="text-ink-300 text-[12px]"
                >—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-[12px] text-ink-400 max-w-prose">
      Derived live from the scenario data — nothing here is authored separately. A cell chip in
      a non-shaded column means the scenario touches that domain even though the guide doesn't
      list it as primary; those intersections are where the exam's trickier options come from.
    </p>
  </div>
</template>
