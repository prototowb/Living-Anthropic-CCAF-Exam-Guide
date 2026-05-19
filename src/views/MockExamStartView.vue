<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useMockExamStore, type TimeBudgetMinutes, type ExamScope } from '@/stores/mockExam';
import { useQuizStore } from '@/stores/quiz';
import { totalQuestionCount } from '@/data/quizData';
import PageHeader from '@/components/PageHeader.vue';

const store = useMockExamStore();
const quizStore = useQuizStore();
const router = useRouter();

const timeBudget = ref<TimeBudgetMinutes>(90);
const scope = ref<ExamScope>('all');
const shuffle = ref(true);

const weakSpotCount = computed(() =>
  Object.values(quizStore.answers).filter((a) => !a.correct).length,
);

const confirmStartingOver = ref(false);

function start() {
  if (store.activeSession && !confirmStartingOver.value) {
    confirmStartingOver.value = true;
    return;
  }
  store.start({
    timeBudgetMinutes: timeBudget.value,
    scope: scope.value,
    shuffle: shuffle.value,
  });
  router.push({ name: 'mock-exam-run' });
}

function resume() {
  router.push({ name: 'mock-exam-run' });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

const examQuestionCount = computed(() => {
  if (scope.value === 'weak-spots' && weakSpotCount.value > 0) return weakSpotCount.value;
  return totalQuestionCount;
});
</script>

<template>
  <PageHeader
    eyebrow="Mock exam"
    title="Take the full exam under timed conditions"
    subtitle="One question at a time, no reveal until you submit. Pick a time budget, choose to drill all questions or just the ones you got wrong before. Your time keeps elapsing even if you switch tabs — like the real thing."
  />

  <div v-if="store.activeSession" class="card card--accent mb-6">
    <div class="card__header">
      <div>
        <div class="card__subtitle">Active session in progress</div>
        <div class="card__title text-lg mt-1">
          {{ store.session!.config.timeBudgetMinutes }}-minute exam ·
          {{ store.answeredCount }} / {{ store.session!.questionRefs.length }} answered ·
          {{ Math.floor(store.remainingMs / 60_000) }}m remaining
        </div>
      </div>
    </div>
    <div class="card__footer">
      <button class="btn btn--primary" @click="resume">Resume exam →</button>
      <button class="btn btn--ghost" @click="store.abandon()">Abandon</button>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4 mb-6">
    <section class="card">
      <h2 class="card__title text-base mb-3">Time budget</h2>
      <div class="flex flex-col gap-2">
        <label
          v-for="m in ([60, 90, 120] as const)"
          :key="m"
          class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-ink-800"
        >
          <input v-model.number="timeBudget" type="radio" :value="m" name="timebudget" />
          <span class="font-mono text-sm">{{ m }} min</span>
          <span class="text-xs text-ink-400">
            ≈ {{ Math.round((m * 60) / examQuestionCount) }}s per question
          </span>
        </label>
      </div>
    </section>

    <section class="card">
      <h2 class="card__title text-base mb-3">Scope</h2>
      <div class="flex flex-col gap-2">
        <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-ink-800">
          <input v-model="scope" type="radio" value="all" name="scope" />
          <div>
            <div class="font-medium text-sm">All questions</div>
            <div class="text-xs text-ink-400">All {{ totalQuestionCount }} questions across 4 sections.</div>
          </div>
        </label>
        <label
          class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-ink-800"
          :class="{ 'opacity-60': weakSpotCount === 0 }"
        >
          <input
            v-model="scope"
            type="radio"
            value="weak-spots"
            name="scope"
            :disabled="weakSpotCount === 0"
          />
          <div>
            <div class="font-medium text-sm">Weak spots only</div>
            <div class="text-xs text-ink-400">
              <template v-if="weakSpotCount > 0">
                {{ weakSpotCount }} questions you got wrong previously.
              </template>
              <template v-else>
                No wrong answers recorded yet. Take the quiz first.
              </template>
            </div>
          </div>
        </label>

        <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-ink-800 mt-1">
          <input v-model="shuffle" type="checkbox" />
          <span class="text-sm">Shuffle question order</span>
        </label>
      </div>
    </section>
  </div>

  <div class="card mb-6 flex items-center justify-between">
    <div>
      <div class="card__subtitle">Ready</div>
      <div class="text-lg font-semibold mt-1">
        {{ examQuestionCount }} questions · {{ timeBudget }} min ·
        {{ scope === 'weak-spots' && weakSpotCount > 0 ? 'weak spots' : 'all sections' }}
      </div>
    </div>
    <div class="flex gap-2">
      <button
        v-if="!confirmStartingOver"
        class="btn btn--primary"
        @click="start"
      >
        {{ store.activeSession ? 'Start new exam' : 'Start exam' }} →
      </button>
      <template v-else>
        <span class="text-xs text-rose-400 self-center">
          Active exam will be abandoned.
        </span>
        <button class="btn btn--ghost" @click="confirmStartingOver = false">Cancel</button>
        <button class="btn btn--primary" @click="start">Confirm & start →</button>
      </template>
    </div>
  </div>

  <section v-if="store.history.length" class="mb-6">
    <h2 class="text-lg font-semibold mb-3">Previous attempts</h2>
    <div class="card">
      <div class="space-y-1">
        <RouterLink
          v-for="exam in store.history"
          :key="exam.id"
          :to="{ name: 'mock-exam-result', params: { id: exam.id } }"
          class="flex items-center justify-between p-3 rounded hover:bg-ink-800 transition"
        >
          <div class="flex-1">
            <div class="text-sm font-medium">
              {{ exam.totalCorrect }} / {{ exam.totalQuestions }}
              <span class="text-ink-400 font-normal">
                ({{ Math.round((exam.totalCorrect / exam.totalQuestions) * 100) }}%)
              </span>
            </div>
            <div class="text-xs text-ink-400 mt-0.5">
              {{ formatDate(exam.submittedAt) }} ·
              {{ formatDuration(exam.durationMs) }} ·
              {{ exam.config.timeBudgetMinutes }}-min budget
            </div>
          </div>
          <span class="text-ink-400">→</span>
        </RouterLink>
      </div>
      <div class="card__footer">
        <button class="btn btn--ghost btn--sm ml-auto" @click="store.clearHistory()">Clear history</button>
      </div>
    </div>
  </section>
</template>
