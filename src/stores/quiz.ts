import { defineStore } from 'pinia';
import type { OptionLetter } from '@/data/quizData';
import { load, save } from './persist';

const STORAGE_KEY = 'quiz:v1';

export interface QuizAnswer {
  picked: OptionLetter;
  correct: boolean;
  answeredAt: number;
}

interface PersistedQuizState {
  answers: Record<string, QuizAnswer>;
}

interface QuizState {
  answers: Record<string, QuizAnswer>;
}

function answerKey(sectionId: string, qid: number) {
  return `${sectionId}:${qid}`;
}

export const useQuizStore = defineStore('quiz', {
  state: (): QuizState => {
    const persisted = load<PersistedQuizState>(STORAGE_KEY, { answers: {} });
    return { answers: persisted.answers };
  },

  getters: {
    getAnswer: (state) => (sectionId: string, qid: number): QuizAnswer | undefined => {
      return state.answers[answerKey(sectionId, qid)];
    },
    sectionStats: (state) => (sectionId: string, totalQuestions: number) => {
      let answered = 0;
      let correct = 0;
      for (const q of Object.keys(state.answers)) {
        if (q.startsWith(sectionId + ':')) {
          answered++;
          if (state.answers[q].correct) correct++;
        }
      }
      return { answered, correct, total: totalQuestions };
    },
    overallStats: (state) => () => {
      const total = Object.keys(state.answers).length;
      const correct = Object.values(state.answers).filter((a) => a.correct).length;
      return { answered: total, correct };
    },
  },

  actions: {
    recordAnswer(sectionId: string, qid: number, picked: OptionLetter, correct: boolean) {
      this.answers[answerKey(sectionId, qid)] = {
        picked,
        correct,
        answeredAt: Date.now(),
      };
      save<PersistedQuizState>(STORAGE_KEY, { answers: this.answers });
    },
    reset() {
      this.answers = {};
      save<PersistedQuizState>(STORAGE_KEY, { answers: {} });
    },
    resetSection(sectionId: string) {
      for (const k of Object.keys(this.answers)) {
        if (k.startsWith(sectionId + ':')) delete this.answers[k];
      }
      save<PersistedQuizState>(STORAGE_KEY, { answers: this.answers });
    },
  },
});
