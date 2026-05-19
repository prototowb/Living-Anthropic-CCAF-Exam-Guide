import { defineStore } from 'pinia';
import { quizSections, getQuestion, type OptionLetter } from '@/data/quizData';
import { useQuizStore } from './quiz';
import { load, save } from './persist';

const ACTIVE_KEY = 'mock-exam:active:v1';
const HISTORY_KEY = 'mock-exam:history:v1';
const HISTORY_MAX = 10;

export type TimeBudgetMinutes = 60 | 90 | 120;
export type ExamScope = 'all' | 'weak-spots';

export interface QuestionRef {
  sectionId: string;
  questionId: number;
}

export interface MockExamConfig {
  timeBudgetMinutes: TimeBudgetMinutes;
  shuffle: boolean;
  scope: ExamScope;
}

export interface MockExamSession {
  id: string;
  startedAt: number;
  timeBudgetMs: number;
  config: MockExamConfig;
  questionRefs: QuestionRef[];
  answers: Record<string, OptionLetter | null>;
  flags: Record<string, boolean>;
  currentIdx: number;
  submittedAt: number | null;
}

export interface PerSectionStat {
  sectionId: string;
  title: string;
  shortTitle: string;
  color: string;
  correct: number;
  answered: number;
  total: number;
}

export interface CompletedExam extends MockExamSession {
  submittedAt: number;
  durationMs: number;
  totalQuestions: number;
  totalAnswered: number;
  totalCorrect: number;
  perSection: PerSectionStat[];
}

interface PersistedActive {
  session: MockExamSession | null;
}

interface PersistedHistory {
  exams: CompletedExam[];
}

interface MockExamState {
  session: MockExamSession | null;
  history: CompletedExam[];
  nowMs: number; // ticked by the runner for live timer rendering
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function questionKey(ref: QuestionRef): string {
  return `${ref.sectionId}:${ref.questionId}`;
}

function buildAllQuestionRefs(): QuestionRef[] {
  return quizSections.flatMap((s) =>
    s.questions.map((q) => ({ sectionId: s.id, questionId: q.id })),
  );
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const useMockExamStore = defineStore('mockExam', {
  state: (): MockExamState => {
    const active = load<PersistedActive>(ACTIVE_KEY, { session: null });
    const history = load<PersistedHistory>(HISTORY_KEY, { exams: [] });
    return {
      session: active.session,
      history: history.exams,
      nowMs: Date.now(),
    };
  },

  getters: {
    activeSession: (state): MockExamSession | null => state.session,

    elapsedMs: (state): number => {
      if (!state.session) return 0;
      if (state.session.submittedAt) return state.session.submittedAt - state.session.startedAt;
      return state.nowMs - state.session.startedAt;
    },

    remainingMs(): number {
      if (!this.session) return 0;
      return Math.max(0, this.session.timeBudgetMs - this.elapsedMs);
    },

    isTimedOut(): boolean {
      if (!this.session || this.session.submittedAt) return false;
      return this.elapsedMs >= this.session.timeBudgetMs;
    },

    currentQuestionRef(): QuestionRef | null {
      if (!this.session) return null;
      return this.session.questionRefs[this.session.currentIdx] ?? null;
    },

    answeredCount(): number {
      if (!this.session) return 0;
      return Object.values(this.session.answers).filter((v) => v !== null && v !== undefined).length;
    },

    flaggedCount(): number {
      if (!this.session) return 0;
      return Object.values(this.session.flags).filter(Boolean).length;
    },

    getCompletedExam: (state) => (id: string): CompletedExam | undefined =>
      state.history.find((e) => e.id === id),

    bestRecentScore: (state): CompletedExam | undefined => {
      if (state.history.length === 0) return undefined;
      // Most recent
      return [...state.history].sort((a, b) => b.submittedAt - a.submittedAt)[0];
    },
  },

  actions: {
    /**
     * Start a new mock exam session, abandoning any active one.
     * Returns the new session.
     */
    start(config: MockExamConfig): MockExamSession {
      const quizStore = useQuizStore();

      let refs: QuestionRef[];
      if (config.scope === 'weak-spots') {
        const wrong = Object.entries(quizStore.answers)
          .filter(([, a]) => !a.correct)
          .map(([k]) => {
            const [sectionId, qidStr] = k.split(':');
            return { sectionId, questionId: Number(qidStr) };
          });
        refs = wrong.length > 0 ? wrong : buildAllQuestionRefs();
      } else {
        refs = buildAllQuestionRefs();
      }

      if (config.shuffle) refs = fisherYates(refs);

      const session: MockExamSession = {
        id: uid(),
        startedAt: Date.now(),
        timeBudgetMs: config.timeBudgetMinutes * 60 * 1000,
        config,
        questionRefs: refs,
        answers: Object.fromEntries(refs.map((r) => [questionKey(r), null])),
        flags: Object.fromEntries(refs.map((r) => [questionKey(r), false])),
        currentIdx: 0,
        submittedAt: null,
      };

      this.session = session;
      this.persistActive();
      return session;
    },

    answer(ref: QuestionRef, letter: OptionLetter | null) {
      if (!this.session) return;
      this.session.answers[questionKey(ref)] = letter;
      this.persistActive();
    },

    toggleFlag(ref: QuestionRef) {
      if (!this.session) return;
      const key = questionKey(ref);
      this.session.flags[key] = !this.session.flags[key];
      this.persistActive();
    },

    goto(idx: number) {
      if (!this.session) return;
      if (idx < 0 || idx >= this.session.questionRefs.length) return;
      this.session.currentIdx = idx;
      this.persistActive();
    },

    next() {
      if (!this.session) return;
      this.goto(this.session.currentIdx + 1);
    },

    prev() {
      if (!this.session) return;
      this.goto(this.session.currentIdx - 1);
    },

    /** Refresh the "now" reference used by elapsedMs/remainingMs. Called by the runner on an interval. */
    tickTime() {
      this.nowMs = Date.now();
    },

    /**
     * Submit the active session. Computes scoring, archives to history, clears active.
     * Returns the completed exam record.
     */
    submit(): CompletedExam | null {
      if (!this.session) return null;
      const submittedAt = Math.min(
        Date.now(),
        this.session.startedAt + this.session.timeBudgetMs,
      );
      const durationMs = submittedAt - this.session.startedAt;

      // Score by section
      const perSection: PerSectionStat[] = quizSections.map((s) => {
        const sectionRefs = this.session!.questionRefs.filter((r) => r.sectionId === s.id);
        let correct = 0;
        let answered = 0;
        for (const ref of sectionRefs) {
          const picked = this.session!.answers[questionKey(ref)];
          if (!picked) continue;
          answered += 1;
          const q = getQuestion(ref.sectionId, ref.questionId);
          if (q && q.correct === picked) correct += 1;
        }
        return {
          sectionId: s.id,
          title: s.title,
          shortTitle: s.shortTitle,
          color: s.color,
          correct,
          answered,
          total: sectionRefs.length,
        };
      }).filter((s) => s.total > 0);

      const completed: CompletedExam = {
        ...this.session,
        submittedAt,
        durationMs,
        totalQuestions: this.session.questionRefs.length,
        totalAnswered: perSection.reduce((a, s) => a + s.answered, 0),
        totalCorrect: perSection.reduce((a, s) => a + s.correct, 0),
        perSection,
      };

      // Archive (most recent first, capped)
      this.history = [completed, ...this.history].slice(0, HISTORY_MAX);

      // Also write each answer into the regular quiz store so the rest of the
      // app reflects what the user got right/wrong here.
      const quizStore = useQuizStore();
      for (const ref of this.session.questionRefs) {
        const picked = this.session.answers[questionKey(ref)];
        if (!picked) continue;
        const q = getQuestion(ref.sectionId, ref.questionId);
        if (!q) continue;
        quizStore.recordAnswer(ref.sectionId, ref.questionId, picked, q.correct === picked);
      }

      this.session = null;
      save<PersistedActive>(ACTIVE_KEY, { session: null });
      save<PersistedHistory>(HISTORY_KEY, { exams: this.history });

      return completed;
    },

    abandon() {
      this.session = null;
      save<PersistedActive>(ACTIVE_KEY, { session: null });
    },

    clearHistory() {
      this.history = [];
      save<PersistedHistory>(HISTORY_KEY, { exams: [] });
    },

    persistActive() {
      save<PersistedActive>(ACTIVE_KEY, { session: this.session });
    },
  },
});
