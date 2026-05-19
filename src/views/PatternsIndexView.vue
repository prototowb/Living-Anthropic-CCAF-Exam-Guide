<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { domains } from '@/data/domains';
import type { DomainPattern, PatternType } from '@/data/domain-content/types';
import PageHeader from '@/components/PageHeader.vue';

const search = ref('');
const domainFilter = ref<string | null>(null);
const typeFilter = ref<PatternType | null>(null);

interface EnrichedPattern extends DomainPattern {
  domain: typeof domains[number];
}

const allPatterns = computed<EnrichedPattern[]>(() =>
  domains.flatMap((d) => d.patterns.map((p) => ({ ...p, domain: d }))),
);

interface FilteredResult {
  pattern: EnrichedPattern;
  matchSnippet?: { text: string; field: string };
}

const filtered = computed<FilteredResult[]>(() => {
  const q = search.value.trim().toLowerCase();

  return allPatterns.value
    .filter((p) => !domainFilter.value || p.domain.id === domainFilter.value)
    .filter((p) => !typeFilter.value || p.type === typeFilter.value)
    .map<FilteredResult | null>((p) => {
      if (!q) return { pattern: p };
      const candidates: [string, string][] = [
        ['title', p.title],
        ['summary', p.summary],
        ['code', p.codeSnippet],
        ['source', p.source],
        ['tags', p.tags.join(' ')],
        ['taskRef', `task ${p.taskRef}`],
      ];
      for (const [field, text] of candidates) {
        const idx = text.toLowerCase().indexOf(q);
        if (idx !== -1) {
          return {
            pattern: p,
            matchSnippet: { text: makeSnippet(text, idx, q.length), field },
          };
        }
      }
      return null;
    })
    .filter((x): x is FilteredResult => x !== null);
});

function makeSnippet(text: string, matchIdx: number, matchLen: number): string {
  const before = Math.max(0, matchIdx - 40);
  const after = Math.min(text.length, matchIdx + matchLen + 60);
  const prefix = before > 0 ? '…' : '';
  const suffix = after < text.length ? '…' : '';
  const raw = text.slice(before, after);
  // Highlight match — insert <mark> markers; renderer escapes other HTML via v-text on surrounding spans
  const matchInSlice = matchIdx - before;
  return (
    prefix +
    escapeHtml(raw.slice(0, matchInSlice)) +
    '<mark>' +
    escapeHtml(raw.slice(matchInSlice, matchInSlice + matchLen)) +
    '</mark>' +
    escapeHtml(raw.slice(matchInSlice + matchLen)) +
    suffix
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const typeOptions: { value: PatternType; label: string }[] = [
  { value: 'architectural', label: 'architectural' },
  { value: 'tooling', label: 'tooling' },
  { value: 'prompt', label: 'prompt' },
  { value: 'reliability', label: 'reliability' },
  { value: 'config', label: 'config' },
];

function patternTypeBadge(type: PatternType): string {
  const map: Record<PatternType, string> = {
    architectural: 'badge--domain-ci',
    tooling: 'badge--domain-support',
    prompt: 'badge--domain-codegen',
    reliability: 'badge--domain-ops',
    config: 'badge--domain-support',
  };
  return map[type];
}

function clearFilters() {
  search.value = '';
  domainFilter.value = null;
  typeFilter.value = null;
}

const totalPatterns = computed(() => allPatterns.value.length);
const totalTasks = computed(() => new Set(allPatterns.value.map((p) => p.taskRef)).size);
</script>

<template>
  <PageHeader
    eyebrow="Showcase"
    :title="`${totalPatterns} patterns across ${totalTasks} exam tasks`"
    subtitle="Filter by domain or pattern type, search across summary + code + tags. Each pattern detail shows source, anti-pattern foil, live sandbox (when applicable), related patterns, and inline practice questions."
  />

  <div class="card mb-4 !py-3">
    <input
      v-model="search"
      class="w-full bg-transparent outline-none text-ink-50 placeholder:text-ink-400"
      placeholder="Search patterns (try: scratchpad, hooks, task 1.4, custom_id, fork)…"
    />
  </div>

  <div class="space-y-3 mb-6">
    <div class="filter-chips">
      <span class="filter-chips__label">Domain</span>
      <button
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--active': domainFilter === null }"
        @click="domainFilter = null"
      >All</button>
      <button
        v-for="d in domains"
        :key="d.id"
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--active': domainFilter === d.id }"
        @click="domainFilter = domainFilter === d.id ? null : d.id"
      >D{{ d.number }}</button>
    </div>

    <div class="filter-chips">
      <span class="filter-chips__label">Type</span>
      <button
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--active': typeFilter === null }"
        @click="typeFilter = null"
      >All</button>
      <button
        v-for="t in typeOptions"
        :key="t.value"
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--active': typeFilter === t.value }"
        @click="typeFilter = typeFilter === t.value ? null : t.value"
      >{{ t.label }}</button>
    </div>

    <div v-if="search || domainFilter || typeFilter" class="text-xs text-ink-400">
      Showing {{ filtered.length }} of {{ totalPatterns }} patterns.
      <button class="btn btn--ghost btn--sm ml-2" @click="clearFilters">clear filters</button>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <RouterLink
      v-for="r in filtered"
      :key="r.pattern.id"
      :to="{ name: 'pattern', params: { id: r.pattern.id } }"
      class="card card--clickable"
    >
      <div class="flex items-center justify-between mb-2 gap-2">
        <span class="badge" :class="`badge--${r.pattern.domain.badgeClass}`">
          D{{ r.pattern.domain.number }} · Task {{ r.pattern.taskRef }}
        </span>
        <span class="badge" :class="patternTypeBadge(r.pattern.type)">{{ r.pattern.type }}</span>
      </div>
      <div class="card__title">{{ r.pattern.title }}</div>
      <p class="card__body mt-2 text-sm line-clamp-3">{{ r.pattern.summary }}</p>
      <div v-if="r.matchSnippet" class="match-snippet">
        <span class="text-ink-400 mr-1">in {{ r.matchSnippet.field }}:</span>
        <span v-html="r.matchSnippet.text" />
      </div>
      <div class="mt-3 text-xs text-ink-400 font-mono truncate" :title="r.pattern.source">
        {{ r.pattern.source }}
      </div>
    </RouterLink>
  </div>

  <p v-if="!filtered.length" class="text-ink-400 mt-8">
    No patterns match. Try clearing filters or a different search term.
  </p>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
