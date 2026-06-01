<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { quizSections, totalQuestionCount } from '@/data/quizData';
import { domains } from '@/data/domains';
import { lessons } from '@/data/lessons';
import { flows } from '@/data/flows';
import { useQuizStore } from '@/stores/quiz';
import { useLessonStore } from '@/stores/lesson';
import { useMockExamStore } from '@/stores/mockExam';
import { useWeakSpotsStore } from '@/stores/weakSpots';
import PageHeader from '@/components/PageHeader.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const quizStore = useQuizStore();
const lessonStore = useLessonStore();
const mockExamStore = useMockExamStore();
const weakSpots = useWeakSpotsStore();

const weakSpotsDue = computed(() => weakSpots.dueCount);
const weakSpotsTotal = computed(() => weakSpots.totalEnrolled);
const weakSpotsBoxes = computed(() => weakSpots.boxBreakdown);

const overall = computed(() => quizStore.overallStats());
const lessonsCompleted = computed(() => lessonStore.completedCount);
const lastExam = computed(() => mockExamStore.bestRecentScore);
const lastExamPct = computed(() => {
  if (!lastExam.value) return null;
  return Math.round((lastExam.value.totalCorrect / lastExam.value.totalQuestions) * 100);
});

const sectionsWithStats = computed(() =>
  quizSections.map((s) => ({
    ...s,
    stats: quizStore.sectionStats(s.id, s.questions.length),
  })),
);
</script>

<template>
  <PageHeader
    eyebrow="Claude Certified Architect — Foundations"
    title="Architect Interactive Playbook"
    subtitle="The codebase you're reading IS the study guide. Every directory mirrors one of the five exam domains. Drill questions, study the patterns, and chat with the tutor."
  />

  <section class="grid md:grid-cols-3 gap-4 mb-10">
    <div class="card">
      <div class="card__subtitle">Quiz progress</div>
      <div class="text-2xl font-semibold mb-2">
        {{ overall.correct }} / {{ overall.answered }} correct
      </div>
      <div class="text-xs text-ink-400 mb-3">of {{ totalQuestionCount }} total</div>
      <ProgressBar :value="overall.answered" :max="totalQuestionCount" />
    </div>

    <div class="card">
      <div class="card__subtitle">Micro-lessons</div>
      <div class="text-2xl font-semibold mb-2">
        {{ lessonsCompleted }} / {{ lessons.length }} completed
      </div>
      <div class="text-xs text-ink-400 mb-3">reorder · fill-in-blanks · flash-cards</div>
      <ProgressBar :value="lessonsCompleted" :max="lessons.length" />
    </div>

    <div class="card">
      <div class="card__subtitle">Exam domains</div>
      <div class="text-2xl font-semibold mb-2">{{ domains.length }} mapped</div>
      <div class="text-xs text-ink-400 mb-3">
        Each domain points to live code in this repo.
      </div>
      <RouterLink :to="{ name: 'domains' }" class="btn btn--sm">Open domain index →</RouterLink>
    </div>
  </section>

  <section class="card card--accent mb-10 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
    <div>
      <div class="card__subtitle">Mock exam</div>
      <div class="text-lg font-semibold mt-1">
        <template v-if="mockExamStore.activeSession">
          Active session — {{ mockExamStore.answeredCount }} / {{ mockExamStore.session!.questionRefs.length }} answered, resume any time.
        </template>
        <template v-else-if="lastExam">
          Last attempt: <span class="text-emerald-400 font-mono">{{ lastExamPct }}%</span>
          ({{ lastExam.totalCorrect }} / {{ lastExam.totalQuestions }})
        </template>
        <template v-else>
          Take the exam under timed conditions — 59 Qs, configurable budget.
        </template>
      </div>
      <div class="text-xs text-ink-400 mt-1">
        One question at a time, no reveal until you submit. Reverse-link walkthrough on review.
      </div>
    </div>
    <div class="flex gap-2 flex-wrap">
      <RouterLink
        v-if="mockExamStore.activeSession"
        :to="{ name: 'mock-exam-run' }"
        class="btn btn--primary"
      >Resume exam →</RouterLink>
      <RouterLink
        v-else
        :to="{ name: 'mock-exam' }"
        class="btn btn--primary"
      >Take mock exam →</RouterLink>
      <RouterLink
        v-if="lastExam"
        :to="{ name: 'mock-exam-result', params: { id: lastExam.id } }"
        class="btn"
      >View last result</RouterLink>
    </div>
  </section>

  <section
    v-if="weakSpotsTotal > 0"
    class="card mb-10 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between"
    style="border-left: 3px solid #d4a550;"
  >
    <div>
      <div class="card__subtitle" style="color: #f0c878;">Spaced repetition · Practice your weak spots</div>
      <div class="text-lg font-semibold mt-1">
        <template v-if="weakSpotsDue > 0">
          <span class="text-amber-300 font-mono">{{ weakSpotsDue }}</span>
          due now · {{ weakSpotsTotal }} enrolled
        </template>
        <template v-else>
          Nothing due — {{ weakSpotsTotal }} enrolled, all caught up for now.
        </template>
      </div>
      <div class="text-xs text-ink-400 mt-1 font-mono">
        Box 1: {{ weakSpotsBoxes[1] }} ·
        Box 2: {{ weakSpotsBoxes[2] }} ·
        Box 3: {{ weakSpotsBoxes[3] }} ·
        Box 4: {{ weakSpotsBoxes[4] }} ·
        Box 5: {{ weakSpotsBoxes[5] }}
      </div>
    </div>
    <div class="flex gap-2 flex-wrap">
      <RouterLink :to="{ name: 'practice' }" class="btn btn--primary">
        {{ weakSpotsDue > 0 ? 'Practice now →' : 'Open practice' }}
      </RouterLink>
    </div>
  </section>

  <section class="card mb-10 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between" style="border-left: 3px solid #2f9d6a;">
    <div>
      <div class="card__subtitle" style="color: #8edcb6;">Macro view · Concept Atlas</div>
      <div class="text-lg font-semibold mt-1">
        The whole architecture on one page — {{ flows.length }} named flows · {{ domains.length }} domains
      </div>
      <div class="text-xs text-ink-400 mt-1">
        Pick a flow to see how patterns chain together. Click a node to open the pattern detail.
      </div>
    </div>
    <div class="flex gap-2 flex-wrap">
      <RouterLink :to="{ name: 'atlas' }" class="btn btn--primary">Open atlas →</RouterLink>
      <RouterLink :to="{ name: 'flow', params: { flowId: 'coordinator-turn' } }" class="btn">
        Walk a flow
      </RouterLink>
    </div>
  </section>

  <section class="mb-10">
    <h2 class="text-xl font-semibold mb-4">Quiz sections</h2>
    <div class="grid md:grid-cols-2 gap-4">
      <RouterLink
        v-for="s in sectionsWithStats"
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
            {{ s.stats.correct }} / {{ s.stats.answered }} correct ·
            {{ s.questions.length }} questions
          </span>
          <ProgressBar :value="s.stats.answered" :max="s.questions.length" />
        </div>
      </RouterLink>
    </div>
  </section>

  <section class="mb-10">
    <h2 class="text-xl font-semibold mb-4">Jump in</h2>
    <div class="flex flex-wrap gap-3">
      <RouterLink :to="{ name: 'tutor' }" class="btn btn--primary">Open the tutor →</RouterLink>
      <RouterLink :to="{ name: 'lessons' }" class="btn">Start a micro-lesson</RouterLink>
      <RouterLink :to="{ name: 'patterns' }" class="btn">Browse the patterns</RouterLink>
    </div>
  </section>
</template>
