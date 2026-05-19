<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { quizSections } from '@/data/quizData';
import { useQuizStore } from '@/stores/quiz';
import PageHeader from '@/components/PageHeader.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const store = useQuizStore();

const items = computed(() =>
  quizSections.map((s) => ({
    ...s,
    stats: store.sectionStats(s.id, s.questions.length),
  })),
);
</script>

<template>
  <PageHeader
    eyebrow="Quiz"
    title="Four scenarios. 59 questions."
    subtitle="Each section is one of the exam's recurring scenario types — CI/CD, support agents, code generation, and multi-agent research. Read the section context, then drill through the questions."
  />

  <div class="grid md:grid-cols-2 gap-4">
    <RouterLink
      v-for="s in items"
      :key="s.id"
      :to="{ name: 'quiz-section', params: { section: s.id } }"
      class="card card--clickable"
      :style="{ borderColor: s.color }"
    >
      <div class="card__subtitle" :style="{ color: s.color }">{{ s.shortTitle }}</div>
      <div class="card__title text-lg mt-1">{{ s.title }}</div>
      <p class="card__body mt-3 text-sm">{{ s.context }}</p>
      <div class="card__footer">
        <span class="text-xs text-ink-400">
          {{ s.stats.correct }}/{{ s.stats.answered }} correct · {{ s.questions.length }} Qs
        </span>
        <ProgressBar :value="s.stats.answered" :max="s.questions.length" />
      </div>
    </RouterLink>
  </div>
</template>
