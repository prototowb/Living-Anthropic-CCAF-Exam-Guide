import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useQuizStore } from '@/stores/quiz';
import { useWeakSpotsStore } from '@/stores/weakSpots';

describe('quiz store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('records an answer retrievable via getAnswer', () => {
    const quiz = useQuizStore();
    quiz.recordAnswer('s1', 1, 'B', true);
    const answer = quiz.getAnswer('s1', 1);
    expect(answer?.picked).toBe('B');
    expect(answer?.correct).toBe(true);
  });

  it('enrolls wrong answers into the weak-spots schedule', () => {
    const quiz = useQuizStore();
    const weakSpots = useWeakSpotsStore();
    quiz.recordAnswer('s1', 2, 'A', false);
    expect(weakSpots.totalEnrolled).toBe(1);
    expect(weakSpots.entries['s1:2'].box).toBe(1);
  });

  it('does not auto-enroll never-missed questions on a correct answer', () => {
    const quiz = useQuizStore();
    const weakSpots = useWeakSpotsStore();
    quiz.recordAnswer('s1', 3, 'C', true);
    expect(weakSpots.totalEnrolled).toBe(0);
  });

  it('computes per-section stats from that section only', () => {
    const quiz = useQuizStore();
    quiz.recordAnswer('s1', 1, 'A', true);
    quiz.recordAnswer('s1', 2, 'B', false);
    quiz.recordAnswer('s2', 1, 'C', true);
    expect(quiz.sectionStats('s1', 15)).toEqual({ answered: 2, correct: 1, total: 15 });
    expect(quiz.overallStats()).toEqual({ answered: 3, correct: 2 });
  });

  it('resetSection removes only that section', () => {
    const quiz = useQuizStore();
    quiz.recordAnswer('s1', 1, 'A', true);
    quiz.recordAnswer('s2', 1, 'C', true);
    quiz.resetSection('s1');
    expect(quiz.getAnswer('s1', 1)).toBeUndefined();
    expect(quiz.getAnswer('s2', 1)).toBeDefined();
  });

  it('hydrates from persisted state in a fresh pinia', () => {
    useQuizStore().recordAnswer('s1', 1, 'D', false);
    setActivePinia(createPinia());
    const rehydrated = useQuizStore();
    expect(rehydrated.getAnswer('s1', 1)?.picked).toBe('D');
  });

  it('reset clears answers and the persisted payload', () => {
    const quiz = useQuizStore();
    quiz.recordAnswer('s1', 1, 'A', true);
    quiz.reset();
    expect(quiz.overallStats()).toEqual({ answered: 0, correct: 0 });
    expect(JSON.parse(localStorage.getItem('aip:quiz:v1')!)).toEqual({ answers: {} });
  });
});
