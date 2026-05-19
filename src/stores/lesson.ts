import { defineStore } from 'pinia';
import { load, save } from './persist';

const STORAGE_KEY = 'lesson:v1';

export interface LessonAttempt {
  attempts: number;
  completed: boolean;
  lastAttemptAt: number;
}

interface PersistedLessonState {
  progress: Record<string, LessonAttempt>;
}

interface LessonState {
  progress: Record<string, LessonAttempt>;
}

export const useLessonStore = defineStore('lesson', {
  state: (): LessonState => {
    const persisted = load<PersistedLessonState>(STORAGE_KEY, { progress: {} });
    return { progress: persisted.progress };
  },

  getters: {
    getAttempt: (state) => (lessonId: string): LessonAttempt | undefined =>
      state.progress[lessonId],
    completedCount: (state) =>
      Object.values(state.progress).filter((p) => p.completed).length,
  },

  actions: {
    recordAttempt(lessonId: string, completed: boolean) {
      const current = this.progress[lessonId] ?? {
        attempts: 0,
        completed: false,
        lastAttemptAt: 0,
      };
      this.progress[lessonId] = {
        attempts: current.attempts + 1,
        completed: current.completed || completed,
        lastAttemptAt: Date.now(),
      };
      save<PersistedLessonState>(STORAGE_KEY, { progress: this.progress });
    },
    reset() {
      this.progress = {};
      save<PersistedLessonState>(STORAGE_KEY, { progress: {} });
    },
  },
});
