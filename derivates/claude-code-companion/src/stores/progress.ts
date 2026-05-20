import { defineStore } from 'pinia';
import { load, save } from './persist';

interface StageState {
  visited?: boolean;
  completed?: boolean;
}

interface LessonState {
  attempts: number;
  completed: boolean;
}

interface QuizState {
  // per question: last picked letter
  picked: Record<string, 'A' | 'B' | 'C' | 'D'>;
  // per question: correct flag
  correct: Record<string, boolean>;
}

const STAGES_KEY = 'stages:v1';
const LESSONS_KEY = 'lessons:v1';
const QUIZ_KEY = 'quiz:v1';

export const useProgressStore = defineStore('progress', {
  state: () => ({
    stages: load<Record<string, StageState>>(STAGES_KEY, {}),
    lessons: load<Record<string, LessonState>>(LESSONS_KEY, {}),
    quiz: load<QuizState>(QUIZ_KEY, { picked: {}, correct: {} }),
  }),

  actions: {
    visitStage(id: string) {
      this.stages[id] = { ...this.stages[id], visited: true };
      save(STAGES_KEY, this.stages);
    },
    completeStage(id: string) {
      this.stages[id] = { ...this.stages[id], visited: true, completed: true };
      save(STAGES_KEY, this.stages);
    },
    recordLessonAttempt(id: string, completed: boolean) {
      const prev = this.lessons[id] ?? { attempts: 0, completed: false };
      this.lessons[id] = {
        attempts: prev.attempts + 1,
        completed: completed || prev.completed,
      };
      save(LESSONS_KEY, this.lessons);
    },
    recordQuizAnswer(qKey: string, picked: 'A' | 'B' | 'C' | 'D', correct: boolean) {
      this.quiz.picked[qKey] = picked;
      this.quiz.correct[qKey] = correct;
      save(QUIZ_KEY, this.quiz);
    },
  },

  getters: {
    stagesCompleted: (state) =>
      Object.values(state.stages).filter((s) => s.completed).length,
    lessonsCompleted: (state) =>
      Object.values(state.lessons).filter((l) => l.completed).length,
    quizCorrect: (state) =>
      Object.values(state.quiz.correct).filter(Boolean).length,
    quizAnswered: (state) => Object.keys(state.quiz.picked).length,
  },
});
