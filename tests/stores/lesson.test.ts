import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLessonStore } from '@/stores/lesson';

describe('lesson store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('records attempts and increments the counter', () => {
    const store = useLessonStore();
    store.recordAttempt('l1', false);
    store.recordAttempt('l1', false);
    expect(store.getAttempt('l1')).toMatchObject({ attempts: 2, completed: false });
  });

  it('completion is sticky once achieved', () => {
    const store = useLessonStore();
    store.recordAttempt('l1', true);
    store.recordAttempt('l1', false);
    expect(store.getAttempt('l1')?.completed).toBe(true);
  });

  it('completedCount counts distinct completed lessons', () => {
    const store = useLessonStore();
    store.recordAttempt('l1', true);
    store.recordAttempt('l2', false);
    store.recordAttempt('l3', true);
    expect(store.completedCount).toBe(2);
  });

  it('hydrates from persisted state and reset clears it', () => {
    useLessonStore().recordAttempt('l1', true);
    setActivePinia(createPinia());
    const rehydrated = useLessonStore();
    expect(rehydrated.completedCount).toBe(1);
    rehydrated.reset();
    expect(rehydrated.getAttempt('l1')).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('aip:lesson:v1')!)).toEqual({ progress: {} });
  });
});
