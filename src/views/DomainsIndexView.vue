<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { domains } from '@/data/domains';
import PageHeader from '@/components/PageHeader.vue';

const router = useRouter();

// The card itself is a RouterLink; a nested <a> would be re-parented by the
// HTML parser, so the sheet shortcut navigates programmatically instead.
function openSheet(id: string) {
  router.push({ name: 'domain', params: { id }, query: { print: '1' } });
}
</script>

<template>
  <PageHeader
    eyebrow="Study guide"
    title="The five exam domains"
    subtitle="Each domain is mandated to expose specific patterns. Click into a domain to see how this codebase demonstrates them — the source paths are real and point inside this repo."
  />

  <div class="grid md:grid-cols-2 gap-4">
    <RouterLink
      v-for="d in domains"
      :key="d.id"
      :to="{ name: 'domain', params: { id: d.id } }"
      class="card card--clickable"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="badge" :class="`badge--${d.badgeClass}`">Domain {{ d.number }}</span>
        <span class="flex items-center gap-3 text-xs text-ink-400">
          {{ d.patterns.length }} patterns
          <button
            type="button"
            class="hover:text-ink-200"
            title="Print-friendly study sheet"
            @click.prevent.stop="openSheet(d.id)"
          >
            Study sheet ⎙
          </button>
        </span>
      </div>
      <div class="card__title">{{ d.title }}</div>
      <p class="card__subtitle mt-1">{{ d.subtitle }}</p>
      <p class="card__body mt-3 text-sm">{{ d.description }}</p>
    </RouterLink>
  </div>
</template>
