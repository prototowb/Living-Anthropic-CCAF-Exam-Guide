<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMockExamStore } from '@/stores/mockExam';
import { getQuestion, type OptionLetter } from '@/data/quizData';
import PageHeader from '@/components/PageHeader.vue';

const store = useMockExamStore();
const router = useRouter();

if (!store.activeSession) {
  router.replace({ name: 'mock-exam' });
}

const showSubmitConfirm = ref(false);
const autoSubmitted = ref(false);

let timerId: number | undefined;

onMounted(() => {
  timerId = window.setInterval(() => store.tickTime(), 1000);
  store.tickTime();
});

onBeforeUnmount(() => {
  if (timerId !== undefined) window.clearInterval(timerId);
});

watch(
  () => store.isTimedOut,
  (timedOut) => {
    if (timedOut && !autoSubmitted.value && store.activeSession) {
      autoSubmitted.value = true;
      submit();
    }
  },
);

const currentRef = computed(() => store.currentQuestionRef);
const currentQuestion = computed(() => {
  if (!currentRef.value) return null;
  return getQuestion(currentRef.value.sectionId, currentRef.value.questionId);
});

const currentKey = computed(() =>
  currentRef.value ? `${currentRef.value.sectionId}:${currentRef.value.questionId}` : '',
);

const currentAnswer = computed<OptionLetter | null>(() => {
  if (!store.activeSession || !currentKey.value) return null;
  return store.activeSession.answers[currentKey.value] ?? null;
});

const currentFlagged = computed<boolean>(() => {
  if (!store.activeSession || !currentKey.value) return false;
  return !!store.activeSession.flags[currentKey.value];
});

function pick(letter: OptionLetter) {
  if (!currentRef.value) return;
  store.answer(currentRef.value, letter);
}

function clearPick() {
  if (!currentRef.value) return;
  store.answer(currentRef.value, null);
}

function toggleFlag() {
  if (!currentRef.value) return;
  store.toggleFlag(currentRef.value);
}

function next() {
  store.next();
}

function prev() {
  store.prev();
}

function goto(idx: number) {
  store.goto(idx);
}

function submit() {
  const result = store.submit();
  if (result) {
    router.replace({ name: 'mock-exam-result', params: { id: result.id } });
  } else {
    router.replace({ name: 'mock-exam' });
  }
}

// Timer formatting
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
const timeString = computed(() => {
  const ms = Math.max(0, store.remainingMs);
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
});

const timerClass = computed(() => {
  const ms = store.remainingMs;
  if (ms < 60_000) return 'mock-exam__timer--critical';
  if (ms < 5 * 60_000) return 'mock-exam__timer--warning';
  return '';
});

// Question metadata for the header
const positionLabel = computed(() => {
  if (!store.activeSession) return '';
  return `${store.activeSession.currentIdx + 1} / ${store.activeSession.questionRefs.length}`;
});

function tileClass(idx: number) {
  if (!store.activeSession) return '';
  const ref = store.activeSession.questionRefs[idx];
  const key = `${ref.sectionId}:${ref.questionId}`;
  const cls: string[] = ['mock-exam__nav-tile'];
  if (idx === store.activeSession.currentIdx) cls.push('mock-exam__nav-tile--current');
  if (store.activeSession.answers[key]) cls.push('mock-exam__nav-tile--answered');
  if (store.activeSession.flags[key]) cls.push('mock-exam__nav-tile--flagged');
  return cls.join(' ');
}
</script>

<template>
  <template v-if="store.activeSession && currentRef && currentQuestion">
    <header class="mock-exam__header">
      <div>
        <div class="mock-exam__timer-label">Time remaining</div>
        <div class="mock-exam__timer" :class="timerClass">
          {{ timeString }}
        </div>
      </div>
      <div class="mock-exam__header-stats">
        <div>Question <strong>{{ positionLabel }}</strong></div>
        <div>Answered <strong>{{ store.answeredCount }}</strong></div>
        <div>Flagged <strong>{{ store.flaggedCount }}</strong></div>
      </div>
      <div class="mock-exam__header-actions">
        <button
          v-if="!showSubmitConfirm"
          class="btn btn--primary"
          @click="showSubmitConfirm = true"
        >Submit exam</button>
        <template v-else>
          <span class="text-xs text-ink-400 self-center mr-1">
            {{ store.activeSession.questionRefs.length - store.answeredCount }} unanswered.
            Submit?
          </span>
          <button class="btn btn--ghost btn--sm" @click="showSubmitConfirm = false">Cancel</button>
          <button class="btn btn--primary btn--sm" @click="submit">Confirm submit</button>
        </template>
      </div>
    </header>

    <div
      v-if="store.remainingMs < 60_000 && !autoSubmitted"
      class="mock-exam__time-warning"
    >
      ⚠ Less than a minute remaining. The exam will auto-submit when the timer hits zero.
    </div>

    <div class="mock-exam__layout">
      <div class="mock-exam__body">
        <PageHeader
          :eyebrow="`Question ${positionLabel}`"
          :title="`${currentRef.sectionId.toUpperCase()} · Q${currentRef.questionId}`"
        />

        <div class="quiz-question">
          <p class="quiz-question__prompt">{{ currentQuestion.text }}</p>

          <div class="quiz-question__options">
            <button
              v-for="opt in currentQuestion.options"
              :key="opt.letter"
              class="quiz-question__option"
              :class="{
                'quiz-question__option--selected': currentAnswer === opt.letter,
              }"
              @click="pick(opt.letter)"
            >
              <span class="quiz-question__option-letter">{{ opt.letter }}</span>
              <span>{{ opt.text }}</span>
            </button>
          </div>

          <div class="quiz-question__footer">
            <div class="flex gap-2">
              <button
                class="btn"
                :disabled="store.session!.currentIdx === 0"
                @click="prev"
              >← Prev</button>
              <button class="btn btn--ghost btn--sm" :disabled="!currentAnswer" @click="clearPick">
                Clear
              </button>
              <button
                class="mock-exam__flag-toggle"
                :class="{ 'mock-exam__flag-toggle--on': currentFlagged }"
                @click="toggleFlag"
              >
                {{ currentFlagged ? '⚑ Flagged' : '⚑ Flag for review' }}
              </button>
            </div>
            <button
              class="btn btn--primary"
              :disabled="store.session!.currentIdx >= store.session!.questionRefs.length - 1"
              @click="next"
            >Next →</button>
          </div>
        </div>
      </div>

      <aside class="mock-exam__sidebar">
        <div class="mock-exam__sidebar-label">Questions</div>
        <div class="mock-exam__nav-grid">
          <button
            v-for="(ref, idx) in store.activeSession.questionRefs"
            :key="`${ref.sectionId}:${ref.questionId}`"
            :class="tileClass(idx)"
            :title="`${ref.sectionId.toUpperCase()} Q${ref.questionId}`"
            @click="goto(idx)"
          >{{ idx + 1 }}</button>
        </div>

        <div class="mock-exam__sidebar-label">Legend</div>
        <div class="mock-exam__sidebar-legend">
          <div class="mock-exam__legend-item">
            <span class="mock-exam__legend-swatch" />
            <span>Unanswered</span>
          </div>
          <div class="mock-exam__legend-item">
            <span class="mock-exam__legend-swatch mock-exam__legend-swatch--answered" />
            <span>Answered</span>
          </div>
          <div class="mock-exam__legend-item">
            <span class="mock-exam__legend-swatch mock-exam__legend-swatch--current" />
            <span>Current</span>
          </div>
          <div class="mock-exam__legend-item">
            <span class="mock-exam__legend-swatch mock-exam__legend-swatch--flagged" />
            <span>Flagged</span>
          </div>
        </div>
      </aside>
    </div>
  </template>
</template>
