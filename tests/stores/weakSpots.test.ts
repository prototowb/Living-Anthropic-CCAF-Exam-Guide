import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWeakSpotsStore, SCHEDULES, intervalLabel } from '@/stores/weakSpots';

const T0 = new Date('2026-08-06T12:00:00Z').getTime();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('weakSpots store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enroll creates a box-1 entry due after the schedule interval', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 5);
    const entry = store.entries['s1:5'];
    expect(entry.box).toBe(1);
    expect(entry.wrongCount).toBe(1);
    expect(entry.dueAt).toBe(T0 + SCHEDULES.standard.intervals[1]);
  });

  it('re-enrolling an existing entry demotes it to box 1 and bumps wrongCount', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 5);
    store.gradeAnswer('s1', 5, true); // box 2
    store.gradeAnswer('s1', 5, false);
    const entry = store.entries['s1:5'];
    expect(entry.box).toBe(1);
    expect(entry.wrongCount).toBe(2);
    expect(entry.correctStreak).toBe(0);
  });

  it('correct answers promote up the boxes and cap at box 5', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 5);
    for (let i = 0; i < 6; i++) store.gradeAnswer('s1', 5, true);
    const entry = store.entries['s1:5'];
    expect(entry.box).toBe(5);
    expect(entry.correctStreak).toBe(6);
    expect(entry.dueAt).toBe(T0 + SCHEDULES.standard.intervals[5]);
  });

  it('a correct answer on a never-enrolled question is a no-op', () => {
    const store = useWeakSpotsStore();
    store.gradeAnswer('s1', 5, true);
    expect(store.totalEnrolled).toBe(0);
  });

  // NOTE: dueCount/dueItems are Pinia getters (cached computeds) whose only
  // non-reactive input is Date.now() — each test reads them once, after the
  // clock is set, mirroring how views read them on render.
  it('a fresh enrollment is scheduled, not yet due', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 1); // due at T0 + 10 min
    expect(store.dueCount).toBe(0);
    expect(store.nextDueAfter?.qid).toBe(1);
  });

  it('entries become due once the clock passes dueAt', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 1); // due at T0 + 10 min
    vi.setSystemTime(T0 + 11 * MIN);
    expect(store.dueCount).toBe(1);
    expect(store.dueItems.map((e) => e.qid)).toEqual([1]);
  });

  it('setSchedule reschedules existing entries from lastReviewedAt', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 1);
    store.gradeAnswer('s1', 1, true); // box 2, reviewed at T0, standard → due T0 + 1 d
    expect(store.entries['s1:1'].dueAt).toBe(T0 + 1 * DAY);
    store.setSchedule('intense'); // box 2 under intense = 12 h
    expect(store.entries['s1:1'].dueAt).toBe(T0 + 12 * HOUR);
    expect(store.entries['s1:1'].box).toBe(2); // boxes untouched
  });

  it('boxBreakdown counts entries per box', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 1);
    store.enroll('s1', 2);
    store.gradeAnswer('s1', 2, true);
    expect(store.boxBreakdown).toEqual({ 1: 1, 2: 1, 3: 0, 4: 0, 5: 0 });
  });

  it('dismiss removes a single entry; reset clears all', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 1);
    store.enroll('s2', 3);
    store.dismiss('s1', 1);
    expect(store.totalEnrolled).toBe(1);
    store.reset();
    expect(store.totalEnrolled).toBe(0);
  });

  it('hydrates entries and scheduleId from persisted state', () => {
    const store = useWeakSpotsStore();
    store.enroll('s1', 1);
    store.setSchedule('relaxed');
    setActivePinia(createPinia());
    const rehydrated = useWeakSpotsStore();
    expect(rehydrated.totalEnrolled).toBe(1);
    expect(rehydrated.scheduleId).toBe('relaxed');
  });

  it('falls back to defaults on corrupt or unknown persisted payloads', () => {
    localStorage.setItem('aip:weak-spots:v1', '{corrupt');
    let store = useWeakSpotsStore();
    expect(store.totalEnrolled).toBe(0);
    expect(store.scheduleId).toBe('standard');

    localStorage.setItem(
      'aip:weak-spots:v1',
      JSON.stringify({ entries: {}, scheduleId: 'bogus' }),
    );
    setActivePinia(createPinia());
    store = useWeakSpotsStore();
    expect(store.scheduleId).toBe('standard');
  });

  it('intervalLabel renders minutes, hours, and days', () => {
    expect(intervalLabel(10 * MIN)).toBe('10 min');
    expect(intervalLabel(12 * HOUR)).toBe('12 h');
    expect(intervalLabel(21 * DAY)).toBe('21 d');
  });
});
