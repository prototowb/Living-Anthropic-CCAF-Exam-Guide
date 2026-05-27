<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  allGlossaryEntries,
  glossaryCategories,
  glossaryCategoryLabel,
  type GlossaryCategory,
} from '@/data/glossary';
import { domains } from '@/data/domains';
import PageHeader from '@/components/PageHeader.vue';

const searchInput = ref('');
const activeCategories = ref<Set<GlossaryCategory>>(new Set());

function toggleCategory(cat: GlossaryCategory) {
  const next = new Set(activeCategories.value);
  if (next.has(cat)) next.delete(cat);
  else next.add(cat);
  activeCategories.value = next;
}

// Lookup table for pattern id → title (for the related-pattern chips).
const patternTitleById = new Map<string, { title: string; domainNumber: number }>();
for (const d of domains) {
  for (const p of d.patterns) {
    patternTitleById.set(p.id, { title: p.title, domainNumber: d.number });
  }
}

const filteredEntries = computed(() => {
  const q = searchInput.value.trim().toLowerCase();
  const cats = activeCategories.value;
  return allGlossaryEntries.filter((e) => {
    if (cats.size > 0 && !cats.has(e.category)) return false;
    if (!q) return true;
    if (e.term.toLowerCase().includes(q)) return true;
    if (e.oneLiner.toLowerCase().includes(q)) return true;
    if (e.aliases?.some((a) => a.toLowerCase().includes(q))) return true;
    return false;
  });
});
</script>

<template>
  <PageHeader
    eyebrow="Reference"
    title="Glossary"
    subtitle="One-line definitions for the terms you'll keep running into across the exam — SDK fields, CLI flags, pattern names, and a handful of underlying concepts. Each entry links to the patterns that put it to work."
  />

  <section class="glossary">
    <div class="glossary__controls">
      <input
        v-model="searchInput"
        type="search"
        class="glossary__search"
        placeholder="Search terms, aliases, or definitions…"
      />
      <div class="glossary__categories">
        <button
          v-for="cat in glossaryCategories"
          :key="cat"
          class="glossary__cat"
          :class="{ 'glossary__cat--active': activeCategories.has(cat) }"
          @click="toggleCategory(cat)"
        >
          {{ glossaryCategoryLabel[cat] }}
        </button>
      </div>
      <span class="glossary__count">
        {{ filteredEntries.length }} / {{ allGlossaryEntries.length }}
      </span>
    </div>

    <div v-if="filteredEntries.length === 0" class="glossary__empty">
      No glossary entries match this filter.
    </div>

    <div v-else class="glossary__list">
      <article
        v-for="entry in filteredEntries"
        :key="entry.slug"
        class="glossary__entry"
      >
        <header class="glossary__entry-head">
          <span class="glossary__entry-term">{{ entry.term }}</span>
          <span class="glossary__entry-cat">{{ glossaryCategoryLabel[entry.category] }}</span>
        </header>
        <p class="glossary__entry-line">{{ entry.oneLiner }}</p>
        <div v-if="entry.relatedPatternIds.length" class="glossary__entry-related">
          <RouterLink
            v-for="pid in entry.relatedPatternIds"
            :key="pid"
            :to="{ name: 'pattern', params: { id: pid } }"
            class="glossary__entry-chip"
            :title="patternTitleById.get(pid)?.title ?? pid"
          >
            D{{ patternTitleById.get(pid)?.domainNumber ?? '?' }} · {{ pid }}
          </RouterLink>
        </div>
        <div v-else class="glossary__entry-empty">
          No pattern directly tagged this term yet.
        </div>
      </article>
    </div>
  </section>
</template>
