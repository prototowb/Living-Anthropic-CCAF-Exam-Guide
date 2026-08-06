<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import {
  getQuestion,
  getQuizSection,
  type OptionLetter,
  type QuizQuestion,
  type QuizSection,
} from '@/data/quizData';
import { useQuizStore } from '@/stores/quiz';
import {
  intervalLabel,
  SCHEDULES,
  useWeakSpotsStore,
  type ScheduleId,
  type WeakSpotEntry,
} from '@/stores/weakSpots';
import { getPatternsForQuestion } from '@/data/reverseLinks';
import PageHeader from '@/components/PageHeader.vue';

const quizStore = useQuizStore();
const weakSpots = useWeakSpotsStore();
const route = useRoute();

// AIP-053 — printable cram sheet (`/practice?print=1`). Same print system as
// the AIP-052 domain sheets (print-sheet / no-print / avoid-break + the
// @media print block in main.scss); the content here is the learner's own
// Leitner entries instead of static domain data.
const printMode = computed(() => route.query.print === '1');

function printPage() {
  window.print();
}

interface SheetItem {
  entry: WeakSpotEntry;
  section: QuizSection;
  q: QuizQuestion;
}

// Snapshot of "now" for the due/scheduled split — a print sheet is a moment
// in time, so one timestamp at mount keeps the two lists consistent.
const sheetNow = Date.now();

// Weakest first: low box before high box, then most-often-wrong first.
const sheetItems = computed<SheetItem[]>(() =>
  Object.values(weakSpots.entries)
    .slice()
    .sort((a, b) => a.box - b.box || b.wrongCount - a.wrongCount)
    .flatMap((entry) => {
      const section = getQuizSection(entry.sectionId);
      const q = getQuestion(entry.sectionId, entry.qid);
      return section && q ? [{ entry, section, q }] : [];
    }),
);

const sheetDueItems = computed(() => sheetItems.value.filter((i) => i.entry.dueAt <= sheetNow));
const sheetScheduledItems = computed(() =>
  sheetItems.value.filter((i) => i.entry.dueAt > sheetNow),
);

function dueInLabel(dueAt: number): string {
  const ms = dueAt - sheetNow;
  if (ms <= 0) return 'now';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `in ${hours} h`;
  return `in ${Math.round(hours / 24)} d`;
}

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
  <!-- ── Print cram sheet (?print=1) ──────────────────────────────── -->
  <div v-if="printMode" class="print-sheet bg-white text-ink-800 rounded-lg p-8">
    <div class="no-print flex items-center justify-between mb-6 pb-4 border-b border-ink-200">
      <RouterLink
        :to="{ name: 'practice' }"
        class="text-sm text-ink-500 hover:text-ink-800"
      >
        ← Back to practice
      </RouterLink>
      <button
        type="button"
        class="px-4 py-2 rounded-md bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700"
        @click="printPage"
      >
        Print
      </button>
    </div>

    <header class="mb-6">
      <div class="sheet-h mb-1">Architect Playbook · Cram sheet · Personal weak spots</div>
      <h1 class="text-2xl font-bold text-ink-900 leading-tight">Weak-spots cram sheet</h1>
      <p class="text-[13px] text-ink-500 mt-1">
        {{ totalEnrolled }} enrolled · {{ sheetDueItems.length }} due now ·
        {{ weakSpots.schedule.label }} schedule · weakest first (box, then times wrong)
      </p>
    </header>

    <p v-if="totalEnrolled === 0" class="text-[13px] text-ink-600 leading-relaxed">
      Nothing enrolled yet — every wrong quiz answer enrolls automatically. Answer some
      quiz questions, then come back for a sheet of exactly what you keep getting wrong.
    </p>

    <template v-else>
      <section
        v-for="group in [
          { title: 'Due now', items: sheetDueItems },
          { title: 'Scheduled', items: sheetScheduledItems },
        ]"
        :key="group.title"
        class="mb-6"
      >
        <template v-if="group.items.length">
          <h2 class="sheet-h mb-2">{{ group.title }} ({{ group.items.length }})</h2>
          <div v-for="item in group.items" :key="`${item.entry.sectionId}:${item.entry.qid}`" class="mb-4 avoid-break">
            <div class="font-mono text-[11px] text-ink-400 mb-0.5">
              {{ item.section.shortTitle }} · Q{{ item.q.id }} · box {{ item.entry.box }} ·
              wrong ×{{ item.entry.wrongCount
              }}<template v-if="item.entry.dueAt > sheetNow">
                · due {{ dueInLabel(item.entry.dueAt) }}</template
              >
            </div>
            <p class="text-[12.5px] text-ink-800 font-medium leading-relaxed whitespace-pre-line">
              {{ item.q.text }}
            </p>
            <ul class="text-[12px] text-ink-600 mt-1 space-y-0.5">
              <li
                v-for="o in item.q.options"
                :key="o.letter"
                :class="o.letter === item.q.correct ? 'font-medium text-ink-800' : ''"
              >
                <span class="font-mono">{{ o.letter === item.q.correct ? '✓' : '·' }} {{ o.letter }}.</span>
                {{ o.text }}
              </li>
            </ul>
            <p class="text-[11.5px] text-ink-500 mt-1 leading-relaxed">{{ item.q.explanation }}</p>
          </div>
        </template>
      </section>
    </template>
  </div>

  <!-- ── Interactive view ─────────────────────────────────────────── -->
  <template v-else>
  <div v-if="totalEnrolled > 0" class="flex items-center gap-3 text-xs text-ink-400 mb-2">
    <span class="flex-1"></span>
    <RouterLink
      :to="{ name: 'practice', query: { print: '1' } }"
      class="hover:text-ink-200"
    >
      Cram sheet ⎙
    </RouterLink>
  </div>

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
</template>

<style scoped>
.sheet-h {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c8699; /* ink-400 */
}
</style>
