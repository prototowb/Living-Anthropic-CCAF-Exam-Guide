<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { lessons } from '@/data/lessons';
import { useProgressStore } from '@/stores/progress';

const progress = useProgressStore();
</script>

<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Lessons</h1>
      <p class="text-ink-600 mt-1">
        {{ lessons.length }} micro-lessons across 4 formats: reorder, fill-in-the-blanks, MCQ, build-the-flow.
      </p>
    </header>

    <ul class="grid grid-cols-2 gap-3">
      <li v-for="l in lessons" :key="l.id">
        <RouterLink
          :to="`/lessons/${l.id}`"
          class="block p-3 rounded border border-ink-200 bg-white hover:border-ink-400"
        >
          <div class="flex items-baseline gap-2">
            <span class="mono text-xs text-ink-500">{{ l.format }}</span>
            <span class="font-medium text-sm">{{ l.title }}</span>
            <span v-if="progress.lessons[l.id]?.completed" class="ml-auto text-xs text-stage-s4">✓</span>
          </div>
          <p class="text-sm text-ink-600 mt-1">{{ l.summary }}</p>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
