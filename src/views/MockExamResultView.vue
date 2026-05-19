<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useMockExamStore } from '@/stores/mockExam';
import { getQuestion } from '@/data/quizData';
import PageHeader from '@/components/PageHeader.vue';

const props = defineProps<{ id: string }>();
const store = useMockExamStore();
const router = useRouter();

const exam = computed(() => store.getCompletedExam(props.id));

if (!exam.value) router.replace({ name: 'mock-exam' });

const scorePct = computed(() => {
  if (!exam.value) return 0;
  return Math.round((exam.value.totalCorrect / exam.value.totalQuestions) * 100);
});

const RING_CIRCUMFERENCE = 2 * Math.PI * 50;
const ringOffset = computed(() => RING_CIRCUMFERENCE * (1 - scorePct.value / 100));

function pct(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function fmtDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

// Wrong + flagged for review breakdown.
const reviewItems = computed(() => {
  if (!exam.value) return [];
  const rows: { ref: { sectionId: string; questionId: number }; picked: string | null; correct: string; isWrong: boolean; isUnanswered: boolean; isFlagged: boolean }[] = [];
  for (const ref of exam.value.questionRefs) {
    const key = `${ref.sectionId}:${ref.questionId}`;
    const picked = exam.value.answers[key];
    const q = getQuestion(ref.sectionId, ref.questionId);
    if (!q) continue;
    const isUnanswered = !picked;
    const isWrong = !!picked && picked !== q.correct;
    const isFlagged = !!exam.value.flags[key];
    if (isUnanswered || isWrong || isFlagged) {
      rows.push({
        ref,
        picked: picked ?? null,
        correct: q.correct,
        isWrong,
        isUnanswered,
        isFlagged,
      });
    }
  }
  return rows;
});

const stats = computed(() => {
  if (!exam.value) return null;
  const total = exam.value.totalQuestions;
  const correct = exam.value.totalCorrect;
  const answered = exam.value.totalAnswered;
  const wrong = answered - correct;
  const unanswered = total - answered;
  return { total, correct, answered, wrong, unanswered };
});

function takeAgain() {
  router.push({ name: 'mock-exam' });
}
</script>

<template>
  <template v-if="exam && stats">
    <PageHeader
      eyebrow="Mock exam · Result"
      :title="`${stats.correct} / ${stats.total} correct (${scorePct}%)`"
      :subtitle="`Submitted in ${fmtDuration(exam.durationMs)} of ${exam.config.timeBudgetMinutes} min budget.`"
    />

    <div class="mock-exam__score-hero mb-5">
      <div class="mock-exam__score-ring">
        <svg viewBox="0 0 120 120">
          <circle class="mock-exam__score-ring-track" cx="60" cy="60" r="50" />
          <circle
            class="mock-exam__score-ring-fill"
            cx="60"
            cy="60"
            r="50"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="ringOffset"
          />
        </svg>
        <div class="mock-exam__score-ring-label">{{ scorePct }}%</div>
      </div>
      <div class="mock-exam__score-stats">
        <h2>Score breakdown</h2>
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div class="text-ink-400 text-xs uppercase tracking-wider">Correct</div>
            <div class="text-emerald-400 font-mono text-lg">{{ stats.correct }}</div>
          </div>
          <div>
            <div class="text-ink-400 text-xs uppercase tracking-wider">Wrong</div>
            <div class="text-rose-400 font-mono text-lg">{{ stats.wrong }}</div>
          </div>
          <div>
            <div class="text-ink-400 text-xs uppercase tracking-wider">Unanswered</div>
            <div class="text-amber-400 font-mono text-lg">{{ stats.unanswered }}</div>
          </div>
        </div>
      </div>
    </div>

    <section class="card mb-5">
      <h2 class="card__title text-base mb-3">Per-section breakdown</h2>
      <div>
        <div v-for="s in exam.perSection" :key="s.sectionId" class="mock-exam__section-bar">
          <div>
            <div class="text-sm font-medium" :style="{ color: s.color }">{{ s.shortTitle }}</div>
            <div class="mock-exam__section-bar-track mt-1">
              <div
                class="mock-exam__section-bar-fill"
                :style="{ width: pct(s.correct, s.total) + '%', background: s.color }"
              />
            </div>
          </div>
          <div class="mock-exam__section-bar-meta">
            {{ s.correct }} / {{ s.total }}
            <br />
            {{ pct(s.correct, s.total) }}%
          </div>
        </div>
      </div>
    </section>

    <section class="card mb-5">
      <div class="card__header">
        <div>
          <div class="card__subtitle">{{ reviewItems.length }} item(s) to review</div>
          <h2 class="card__title text-base mt-1">Wrong · unanswered · flagged</h2>
        </div>
        <RouterLink
          v-if="reviewItems.length"
          :to="{ name: 'mock-exam-review', params: { id: exam.id } }"
          class="btn btn--primary btn--sm"
        >Walk through review →</RouterLink>
      </div>

      <div v-if="reviewItems.length === 0" class="text-sm text-ink-400">
        Nothing to review here — perfect run. 🎉
      </div>

      <div v-else>
        <RouterLink
          v-for="item in reviewItems"
          :key="`${item.ref.sectionId}:${item.ref.questionId}`"
          :to="{ name: 'quiz-question', params: { section: item.ref.sectionId, qid: item.ref.questionId } }"
          class="mock-exam__answer-row"
          :class="{
            'mock-exam__answer-row--wrong': item.isWrong,
            'mock-exam__answer-row--unanswered': item.isUnanswered,
          }"
        >
          <div class="mock-exam__answer-letter">
            {{ item.ref.sectionId.toUpperCase() }} Q{{ item.ref.questionId }}
          </div>
          <div class="text-sm">
            <template v-if="item.isUnanswered">
              <span class="text-amber-400">Unanswered.</span>
              Correct answer was
              <span class="mock-exam__answer-letter-tag mock-exam__answer-letter-tag--correct">{{ item.correct }}</span>
            </template>
            <template v-else>
              You picked
              <span class="mock-exam__answer-letter-tag mock-exam__answer-letter-tag--wrong">{{ item.picked }}</span>
              ; correct was
              <span class="mock-exam__answer-letter-tag mock-exam__answer-letter-tag--correct">{{ item.correct }}</span>
            </template>
            <span v-if="item.isFlagged" class="ml-2 text-amber-400">⚑ flagged</span>
          </div>
          <div class="text-ink-400 text-xs self-center">→</div>
        </RouterLink>
      </div>
    </section>

    <div class="flex gap-2">
      <button class="btn btn--primary" @click="takeAgain">Take another exam →</button>
      <RouterLink :to="{ name: 'quiz' }" class="btn">Back to quiz</RouterLink>
    </div>
  </template>
</template>
