<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { getQuestion, getQuizSection, type OptionLetter } from '@/data/quizData';
import { useQuizStore } from '@/stores/quiz';
import {
  intervalLabel,
  SCHEDULES,
  useWeakSpotsStore,
  type ScheduleId,
} from '@/stores/weakSpots';
import { getPatternsForQuestion } from '@/data/reverseLinks';
import PageHeader from '@/components/PageHeader.vue';

const quizStore = useQuizStore();
const weakSpots = useWeakSpotsStore();

const dueItems = computed(() => weakSpots.dueItems);
const currentIndex = ref(0);

const currentEntry = computed(() => dueItems.value[currentIndex.value]);
const currentSection = computed(() =>
  currentEntry.value ? getQuizSection(currentEntry.value.sectionId) : undefined,
);
const currentQuestion = computed(() =>
  currentEntry.value
    ? getQuestion(currentEntry.value.sectionId, currentEntry.value.qid)
    : undefined,
);

const selected = ref<OptionLetter | null>(null);
const revealed = ref(false);

watch(
  () => currentEntry.value && `${currentEntry.value.sectionId}:${currentEntry.value.qid}`,
  () => {
    selected.value = null;
    revealed.value = false;
  },
);

const isCorrect = computed(() =>
  selected.value && currentQuestion.value
    ? currentQuestion.value.correct === selected.value
    : false,
);

function pick(letter: OptionLetter) {
  if (revealed.value) return;
  selected.value = letter;
}

function reveal() {
  if (!selected.value || !currentEntry.value || !currentQuestion.value) return;
  revealed.value = true;
  // recordAnswer in the quiz store also calls gradeAnswer on the weak-spots
  // store, so we don't need to call it manually — but we DO need to refresh
  // dueItems by advancing past the just-reviewed entry.
  quizStore.recordAnswer(
    currentEntry.value.sectionId,
    currentEntry.value.qid,
    selected.value,
    currentQuestion.value.correct === selected.value,
  );
}

function next() {
  // The just-reviewed entry is no longer due (its dueAt was pushed forward).
  // dueItems re-computes from the store; index stays at 0 if we always show
  // the head of the list. Reset selection.
  currentIndex.value = 0;
  selected.value = null;
  revealed.value = false;
}

function skip() {
  // Skip without recording — push the index forward; the entry remains due
  // and will reappear on a future visit / when the user clicks "Restart".
  currentIndex.value++;
  selected.value = null;
  revealed.value = false;
}

function restart() {
  currentIndex.value = 0;
  selected.value = null;
  revealed.value = false;
}

function dismiss() {
  if (!currentEntry.value) return;
  weakSpots.dismiss(currentEntry.value.sectionId, currentEntry.value.qid);
  selected.value = null;
  revealed.value = false;
  currentIndex.value = 0;
}

const linkedPatterns = computed(() => {
  if (!currentEntry.value) return [];
  return getPatternsForQuestion(currentEntry.value.sectionId, currentEntry.value.qid);
});

const wrongExplanationOptions = computed(() => {
  if (!revealed.value || !currentQuestion.value?.wrongExplanations) return [];
  return Object.entries(currentQuestion.value.wrongExplanations);
});

const boxCounts = computed(() => weakSpots.boxBreakdown);
const totalEnrolled = computed(() => weakSpots.totalEnrolled);
const dueCount = computed(() => weakSpots.dueCount);
const nextDue = computed(() => weakSpots.nextDueAfter);

const nextDueLabel = computed(() => {
  if (!nextDue.value) return null;
  const ms = nextDue.value.dueAt - Date.now();
  if (ms <= 0) return 'now';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  return `in ${days} d`;
});

function confirmReset() {
  if (window.confirm('Clear all weak-spot entries? This cannot be undone.')) {
    weakSpots.reset();
    restart();
  }
}

// AIP-049 — scheduler tunables. Picking a preset reschedules existing
// entries immediately (see the store's setSchedule).
const scheduleOptions = Object.values(SCHEDULES);
const activeScheduleId = computed(() => weakSpots.scheduleId);

function ladder(id: ScheduleId): string {
  return ([1, 2, 3, 4, 5] as const)
    .map((b) => intervalLabel(SCHEDULES[id].intervals[b]))
    .join(' → ');
}

function pickSchedule(id: ScheduleId) {
  weakSpots.setSchedule(id);
}

const subtitle = computed(
  () =>
    `A Leitner-box scheduler. Wrong-answered questions enter box 1 and resurface in ${intervalLabel(
      weakSpots.schedule.intervals[1],
    )}. Each correct re-answer promotes them — wrong demotes back to box 1.`,
);
</script>

<template>
  <PageHeader
    eyebrow="Spaced repetition"
    title="Practice your weak spots"
    :subtitle="subtitle"
  />

  <section class="weak-spots">
    <div class="weak-spots__summary">
      <div class="weak-spots__stat weak-spots__stat--accent">
        <span class="weak-spots__stat-label">Due now</span>
        <span class="weak-spots__stat-value">{{ dueCount }}</span>
      </div>
      <div class="weak-spots__stat">
        <span class="weak-spots__stat-label">Total enrolled</span>
        <span class="weak-spots__stat-value">{{ totalEnrolled }}</span>
      </div>
      <div class="weak-spots__stat">
        <span class="weak-spots__stat-label">Next surfacing</span>
        <span class="weak-spots__stat-value">{{ nextDueLabel ?? '—' }}</span>
      </div>
    </div>

    <div v-if="totalEnrolled > 0" class="weak-spots__boxes">
      <span v-for="b in [1, 2, 3, 4, 5] as const" :key="b" class="weak-spots__box">
        Box {{ b }}: <strong>{{ boxCounts[b] }}</strong>
      </span>
    </div>

    <details class="weak-spots__scheduler">
      <summary>
        Scheduler: <strong>{{ weakSpots.schedule.label }}</strong>
        <span class="weak-spots__scheduler-ladder">{{ ladder(activeScheduleId) }}</span>
      </summary>
      <div class="weak-spots__scheduler-options">
        <button
          v-for="s in scheduleOptions"
          :key="s.id"
          type="button"
          class="weak-spots__scheduler-option"
          :class="{ 'weak-spots__scheduler-option--active': s.id === activeScheduleId }"
          @click="pickSchedule(s.id)"
        >
          <span class="weak-spots__scheduler-option-label">{{ s.label }}</span>
          <span class="weak-spots__scheduler-option-ladder">{{ ladder(s.id) }}</span>
          <span class="weak-spots__scheduler-option-blurb">{{ s.blurb }}</span>
        </button>
      </div>
      <p class="weak-spots__scheduler-note">
        Switching reschedules everything already enrolled — due dates recompute
        from each question's last review. Boxes and streaks are untouched.
      </p>
    </details>

    <div v-if="totalEnrolled === 0" class="weak-spots__empty">
      No weak spots yet — every wrong quiz answer enrolls automatically.
      <br />
      <RouterLink :to="{ name: 'quiz' }">Open the quiz to get started →</RouterLink>
    </div>

    <div v-else-if="dueCount === 0" class="weak-spots__empty">
      Nothing due right now — come back {{ nextDueLabel ?? 'later' }} to keep grinding.
      <br />
      <button class="btn btn--ghost btn--sm mt-3" @click="restart">
        Show all due items again
      </button>
    </div>

    <template v-else-if="currentSection && currentQuestion && currentEntry">
      <div class="weak-spots__runner-meta">
        <span>{{ currentSection.shortTitle }} · Q{{ currentQuestion.id }}</span>
        <span>box {{ currentEntry.box }}</span>
        <span>wrong x{{ currentEntry.wrongCount }}</span>
        <span>streak: {{ currentEntry.correctStreak }}</span>
      </div>

      <div class="quiz-question">
        <div class="quiz-question__context" v-if="currentSection.context">
          {{ currentSection.context }}
        </div>

        <p class="quiz-question__prompt">{{ currentQuestion.text }}</p>

        <div class="quiz-question__options">
          <button
            v-for="opt in currentQuestion.options"
            :key="opt.letter"
            class="quiz-question__option"
            :class="{
              'quiz-question__option--selected': selected === opt.letter && !revealed,
              'quiz-question__option--correct': revealed && currentQuestion.correct === opt.letter,
              'quiz-question__option--incorrect': revealed && selected === opt.letter && currentQuestion.correct !== opt.letter,
            }"
            :disabled="revealed"
            @click="pick(opt.letter)"
          >
            <span class="quiz-question__option-letter">{{ opt.letter }}</span>
            <span>{{ opt.text }}</span>
          </button>
        </div>

        <div v-if="revealed" class="quiz-question__explanation">
          <div class="font-semibold mb-1" :class="isCorrect ? 'text-emerald-400' : 'text-rose-400'">
            {{ isCorrect ? '✓ Correct — promoted' : `✗ Expected ${currentQuestion.correct} — back to box 1` }}
          </div>
          <p>{{ currentQuestion.explanation }}</p>

          <dl v-if="wrongExplanationOptions.length" class="quiz-question__wrong-explanations">
            <template v-for="[letter, expl] in wrongExplanationOptions" :key="letter">
              <dt>Why {{ letter }} is incorrect</dt>
              <dd>{{ expl }}</dd>
            </template>
          </dl>

          <section v-if="linkedPatterns.length" class="reverse-links">
            <div class="reverse-links__label">This question tests</div>
            <div class="reverse-links__list">
              <RouterLink
                v-for="p in linkedPatterns"
                :key="p.patternId"
                :to="{ name: 'pattern', params: { id: p.patternId } }"
                class="reverse-links__chip"
              >
                <strong>D{{ p.domainNumber }}·{{ p.taskRef }}</strong>
                <span>{{ p.patternTitle }}</span>
              </RouterLink>
            </div>
          </section>
        </div>

        <div class="quiz-question__footer">
          <button class="btn btn--ghost" @click="skip">Skip</button>

          <button v-if="!revealed" class="btn btn--primary" :disabled="!selected" @click="reveal">
            Reveal answer
          </button>
          <button v-else class="btn btn--primary" @click="next">
            Next due →
          </button>
        </div>
      </div>

      <div class="weak-spots__footer-actions">
        <button @click="dismiss">Dismiss this question from practice</button>
        <button @click="confirmReset">Reset all weak spots</button>
      </div>
    </template>
  </section>
</template>
