<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { getQuizSection } from '@/data/quizData';
import { useQuizStore } from '@/stores/quiz';
import PageHeader from '@/components/PageHeader.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const props = defineProps<{ section: string }>();
const store = useQuizStore();
const router = useRouter();

const section = computed(() => getQuizSection(props.section));

if (!section.value) router.replace({ name: 'quiz' });

const stats = computed(() =>
  section.value ? store.sectionStats(section.value.id, section.value.questions.length) : { answered: 0, correct: 0, total: 0 },
);
</script>

<template>
  <template v-if="section">
    <PageHeader
      :eyebrow="section.shortTitle"
      :title="section.title"
      :subtitle="section.context"
    />

    <div class="card mb-6">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="card__subtitle">Your progress</div>
          <div class="text-lg font-semibold">
            {{ stats.correct }} / {{ stats.answered }} correct
            <span class="text-ink-400 font-normal">(of {{ section.questions.length }} questions)</span>
          </div>
        </div>
        <button class="btn btn--ghost" @click="store.resetSection(section.id)">Reset section</button>
      </div>
      <ProgressBar :value="stats.answered" :max="section.questions.length" large />
    </div>

    <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      <RouterLink
        v-for="q in section.questions"
        :key="q.id"
        :to="{ name: 'quiz-question', params: { section: section.id, qid: q.id } }"
        class="card card--clickable !p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-mono text-xs text-ink-400">Q{{ q.id }}</span>
          <span
            v-if="store.getAnswer(section.id, q.id)"
            class="badge"
            :class="store.getAnswer(section.id, q.id)?.correct ? 'badge--domain-ops' : 'badge--domain-ci'"
          >
            {{ store.getAnswer(section.id, q.id)?.correct ? 'correct' : 'wrong' }}
          </span>
        </div>
        <p class="text-sm leading-snug line-clamp-3">{{ q.text.split('\n')[0] }}</p>
      </RouterLink>
    </div>
  </template>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
