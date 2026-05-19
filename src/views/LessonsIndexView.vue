<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { lessons } from '@/data/lessons';
import { domains } from '@/data/domains';
import { useLessonStore } from '@/stores/lesson';
import PageHeader from '@/components/PageHeader.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const store = useLessonStore();

const lessonsWithDomain = computed(() =>
  lessons.map((l) => ({
    ...l,
    domain: domains.find((d) => d.id === l.domainId)!,
    attempt: store.getAttempt(l.id),
  })),
);

const formatLabel: Record<string, string> = {
  reorder: 'Reorder',
  blanks: 'Fill blanks',
  mcq: 'Flashcard',
  flow: 'Build the flow',
};
</script>

<template>
  <PageHeader
    eyebrow="Micro-lessons"
    title="Bite-size practice"
    subtitle="Three formats: reorder code blocks, fill in the blanks, or pick the right answer. Ten lessons cover the five exam domains."
  />

  <div class="card mb-6">
    <div class="card__subtitle">Overall progress</div>
    <div class="text-xl font-semibold mt-1 mb-3">
      {{ store.completedCount }} / {{ lessons.length }} completed
    </div>
    <ProgressBar :value="store.completedCount" :max="lessons.length" large />
  </div>

  <div class="grid md:grid-cols-2 gap-3">
    <RouterLink
      v-for="l in lessonsWithDomain"
      :key="l.id"
      :to="{ name: 'lesson', params: { id: l.id } }"
      class="card card--clickable"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="badge" :class="`badge--${l.domain.badgeClass}`">
          D{{ l.domain.number }}
        </span>
        <span class="text-xs text-ink-400 font-mono">{{ formatLabel[l.format] }}</span>
      </div>
      <div class="card__title text-base">{{ l.title }}</div>
      <p class="card__body mt-2 text-sm">{{ l.prompt }}</p>
      <footer class="card__footer">
        <span class="text-xs text-ink-400">
          <template v-if="l.attempt">
            {{ l.attempt.completed ? '✓ completed' : `${l.attempt.attempts} attempt(s)` }}
          </template>
          <template v-else>Not started</template>
        </span>
      </footer>
    </RouterLink>
  </div>
</template>
