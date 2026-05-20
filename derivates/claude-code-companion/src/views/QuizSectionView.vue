<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getQuizSection } from '@/data/quizData';
import { useProgressStore } from '@/stores/progress';

const props = defineProps<{ section: string }>();
const section = computed(() => getQuizSection(props.section));
const progress = useProgressStore();

function state(qid: number) {
  const key = `${props.section}:${qid}`;
  if (progress.quiz.correct[key] === true) return 'correct';
  if (progress.quiz.correct[key] === false) return 'wrong';
  return 'unanswered';
}
</script>

<template>
  <section v-if="section" class="space-y-4">
    <header>
      <RouterLink to="/quiz" class="text-xs text-ink-500 hover:underline">← all sections</RouterLink>
      <h1 class="text-2xl font-semibold tracking-tight mt-2">{{ section.title }}</h1>
    </header>

    <ol class="space-y-1">
      <li v-for="q in section.questions" :key="q.id">
        <RouterLink
          :to="`/quiz/${section.id}/${q.id}`"
          class="flex items-center gap-3 p-2 rounded border border-ink-200 bg-white hover:border-ink-400"
        >
          <span class="mono text-xs text-ink-500 w-10">Q{{ q.id }}</span>
          <span class="flex-1 text-sm">{{ q.text }}</span>
          <span
            class="text-xs mono"
            :class="{
              'text-stage-s4': state(q.id) === 'correct',
              'text-stage-s5': state(q.id) === 'wrong',
              'text-ink-400': state(q.id) === 'unanswered',
            }"
          >{{ state(q.id) }}</span>
        </RouterLink>
      </li>
    </ol>
  </section>
</template>
