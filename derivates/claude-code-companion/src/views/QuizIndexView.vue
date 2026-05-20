<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { quizSections } from '@/data/quizData';
import { useProgressStore } from '@/stores/progress';

const progress = useProgressStore();

function correctIn(sectionId: string) {
  return Object.entries(progress.quiz.correct).filter(
    ([k, v]) => k.startsWith(`${sectionId}:`) && v,
  ).length;
}
</script>

<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Quiz</h1>
      <p class="text-ink-600 mt-1">{{ quizSections.length }} sections — pick one to drill.</p>
    </header>

    <ul class="grid grid-cols-2 gap-3">
      <li v-for="s in quizSections" :key="s.id">
        <RouterLink
          :to="`/quiz/${s.id}`"
          class="block p-4 rounded-lg border border-ink-200 bg-white hover:border-ink-400"
        >
          <div class="font-medium">{{ s.title }}</div>
          <p class="text-sm text-ink-500 mt-1">
            {{ s.questions.length }} questions ·
            {{ correctIn(s.id) }} correct so far
          </p>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
