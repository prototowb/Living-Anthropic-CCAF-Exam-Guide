import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMockExamStore } from '@/stores/mockExam';
import { useQuizStore } from '@/stores/quiz';
import { useWeakSpotsStore } from '@/stores/weakSpots';
import { quizSections, getQuestion, totalQuestionCount, type OptionLetter } from '@/data/quizData';
import type { MockExamConfig } from '@/stores/mockExam';

const T0 = new Date('2026-08-06T12:00:00Z').getTime();
const MIN = 60 * 1000;

const baseConfig: MockExamConfig = { timeBudgetMinutes: 60, shuffle: false, scope: 'all' };

/** A letter that is guaranteed wrong for the given question. */
function wrongLetterFor(sectionId: string, qid: number): OptionLetter {
  const q = getQuestion(sectionId, qid)!;
  return q.options.map((o) => o.letter).find((l) => l !== q.correct)!;
}

describe('mockExam store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('start(scope: all) enrolls every question, unshuffled', () => {
    const store = useMockExamStore();
    const session = store.start(baseConfig);
    expect(session.questionRefs).toHaveLength(totalQuestionCount);
    expect(session.questionRefs[0]).toEqual({
      sectionId: quizSections[0].id,
      questionId: quizSections[0].questions[0].id,
    });
    expect(store.answeredCount).toBe(0);
    expect(store.flaggedCount).toBe(0);
  });

  it('start(scope: weak-spots) uses previously wrong answers, falling back to all', () => {
    const quiz = useQuizStore();
    quiz.recordAnswer('s1', 1, wrongLetterFor('s1', 1), false);
    quiz.recordAnswer('s1', 2, getQuestion('s1', 2)!.correct, true);

    const store = useMockExamStore();
    const session = store.start({ ...baseConfig, scope: 'weak-spots' });
    expect(session.questionRefs).toEqual([{ sectionId: 's1', questionId: 1 }]);

    // With no wrong answers on record, weak-spots scope falls back to the full set.
    quiz.reset();
    const fallback = store.start({ ...baseConfig, scope: 'weak-spots' });
    expect(fallback.questionRefs).toHaveLength(totalQuestionCount);
  });

  it('navigation clamps to bounds and flagging toggles', () => {
    const store = useMockExamStore();
    store.start(baseConfig);
    store.prev();
    expect(store.session!.currentIdx).toBe(0);
    store.next();
    expect(store.session!.currentIdx).toBe(1);
    store.goto(999);
    expect(store.session!.currentIdx).toBe(1);

    const ref = store.currentQuestionRef!;
    store.toggleFlag(ref);
    expect(store.flaggedCount).toBe(1);
    store.toggleFlag(ref);
    expect(store.flaggedCount).toBe(0);
  });

  it('timer getters follow the ticked clock and clamp at zero', () => {
    const store = useMockExamStore();
    store.start(baseConfig);
    vi.setSystemTime(T0 + 61 * MIN);
    store.tickTime();
    expect(store.elapsedMs).toBe(61 * MIN);
    expect(store.remainingMs).toBe(0);
    expect(store.isTimedOut).toBe(true);
  });

  it('submit scores per section, archives to history, and syncs the quiz store', () => {
    const store = useMockExamStore();
    const quiz = useQuizStore();
    const weakSpots = useWeakSpotsStore();
    store.start(baseConfig);

    const [ref1, ref2] = store.session!.questionRefs;
    store.answer(ref1, getQuestion(ref1.sectionId, ref1.questionId)!.correct);
    store.answer(ref2, wrongLetterFor(ref2.sectionId, ref2.questionId));

    const completed = store.submit()!;
    expect(completed.totalQuestions).toBe(totalQuestionCount);
    expect(completed.totalAnswered).toBe(2);
    expect(completed.totalCorrect).toBe(1);

    const s1Stats = completed.perSection.find((s) => s.sectionId === ref1.sectionId)!;
    expect(s1Stats.answered).toBe(2);
    expect(s1Stats.correct).toBe(1);

    // Active session cleared, history archived most-recent-first.
    expect(store.session).toBeNull();
    expect(store.history[0].id).toBe(completed.id);
    expect(store.getCompletedExam(completed.id)).toBeDefined();

    // Answers propagate: quiz store records both, weak-spots enrolls the wrong one.
    expect(quiz.overallStats()).toEqual({ answered: 2, correct: 1 });
    expect(weakSpots.totalEnrolled).toBe(1);
  });

  it('submit clamps duration to the time budget on timeout', () => {
    const store = useMockExamStore();
    store.start(baseConfig);
    vi.setSystemTime(T0 + 90 * MIN);
    const completed = store.submit()!;
    expect(completed.durationMs).toBe(60 * MIN);
  });

  it('history is capped at 10 exams', () => {
    const store = useMockExamStore();
    for (let i = 0; i < 11; i++) {
      store.start(baseConfig);
      store.submit();
    }
    expect(store.history).toHaveLength(10);
  });

  it('abandon clears the active session without archiving', () => {
    const store = useMockExamStore();
    store.start(baseConfig);
    store.abandon();
    expect(store.session).toBeNull();
    expect(store.history).toHaveLength(0);
  });

  it('active session and history hydrate from persisted state', () => {
    const store = useMockExamStore();
    store.start(baseConfig);
    store.submit();
    store.start(baseConfig);

    setActivePinia(createPinia());
    const rehydrated = useMockExamStore();
    expect(rehydrated.session).not.toBeNull();
    expect(rehydrated.history).toHaveLength(1);
  });
});
