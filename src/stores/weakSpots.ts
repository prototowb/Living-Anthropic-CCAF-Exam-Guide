// Spaced-repetition store — Leitner-box scheduler for wrong-answered quiz
// questions. Entries are added when the learner gets a question wrong; correct
// answers promote them up the boxes; wrong answers demote back to box 1.
//
// Persistence: localStorage key `aip:weak-spots:v1` via the versioned helper.

import { defineStore } from 'pinia';
import { load, save } from './persist';

const STORAGE_KEY = 'weak-spots:v1';

// Box → review interval (ms). Picked so the schedule looks familiar to anyone
// who has used Anki / a SR app: short interval on a fresh miss, then doubling
// out to ~3 weeks. The 10-minute box-1 lets a learner re-test in the same
// session if they want.
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export const BOX_INTERVAL_MS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 10 * 60 * 1000, // 10 minutes
  2: 1 * MS_PER_DAY,
  3: 3 * MS_PER_DAY,
  4: 7 * MS_PER_DAY,
  5: 21 * MS_PER_DAY,
};

export type Box = 1 | 2 | 3 | 4 | 5;

export interface WeakSpotEntry {
  sectionId: string;
  qid: number;
  box: Box;
  dueAt: number;
  lastReviewedAt: number;
  wrongCount: number;
  correctStreak: number;
}

interface PersistedState {
  entries: Record<string, WeakSpotEntry>;
}

interface State {
  entries: Record<string, WeakSpotEntry>;
}

function key(sectionId: string, qid: number) {
  return `${sectionId}:${qid}`;
}

function persist(state: State) {
  save<PersistedState>(STORAGE_KEY, { entries: state.entries });
}

function nextDueAt(box: Box, from: number): number {
  return from + BOX_INTERVAL_MS[box];
}

export const useWeakSpotsStore = defineStore('weakSpots', {
  state: (): State => {
    const persisted = load<PersistedState>(STORAGE_KEY, { entries: {} });
    return { entries: persisted.entries };
  },

  getters: {
    totalEnrolled(state): number {
      return Object.keys(state.entries).length;
    },

    dueCount(): number {
      const now = Date.now();
      return Object.values(this.entries).filter((e) => e.dueAt <= now).length;
    },

    boxBreakdown(state): Record<Box, number> {
      const counts: Record<Box, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const e of Object.values(state.entries)) counts[e.box]++;
      return counts;
    },

    dueItems(state): WeakSpotEntry[] {
      const now = Date.now();
      return Object.values(state.entries)
        .filter((e) => e.dueAt <= now)
        .sort((a, b) => a.dueAt - b.dueAt);
    },

    nextDueAfter(state): WeakSpotEntry | undefined {
      const now = Date.now();
      const upcoming = Object.values(state.entries)
        .filter((e) => e.dueAt > now)
        .sort((a, b) => a.dueAt - b.dueAt);
      return upcoming[0];
    },
  },

  actions: {
    /** Called on a wrong answer. Demotes existing entries to box 1; creates if absent. */
    enroll(sectionId: string, qid: number) {
      const k = key(sectionId, qid);
      const now = Date.now();
      const existing = this.entries[k];
      if (existing) {
        existing.box = 1;
        existing.dueAt = nextDueAt(1, now);
        existing.lastReviewedAt = now;
        existing.wrongCount += 1;
        existing.correctStreak = 0;
      } else {
        this.entries[k] = {
          sectionId,
          qid,
          box: 1,
          dueAt: nextDueAt(1, now),
          lastReviewedAt: now,
          wrongCount: 1,
          correctStreak: 0,
        };
      }
      persist(this);
    },

    /**
     * Grade a single attempt. Only mutates entries that already exist — a
     * never-missed question isn't auto-enrolled by a correct answer.
     */
    gradeAnswer(sectionId: string, qid: number, correct: boolean) {
      const k = key(sectionId, qid);
      const now = Date.now();
      if (!correct) {
        this.enroll(sectionId, qid);
        return;
      }
      const entry = this.entries[k];
      if (!entry) return; // never enrolled — nothing to grade
      const nextBox = Math.min(5, entry.box + 1) as Box;
      entry.box = nextBox;
      entry.correctStreak += 1;
      entry.lastReviewedAt = now;
      entry.dueAt = nextDueAt(nextBox, now);
      // We keep entries even at box 5 so the learner can see "mastered" counts.
      // Use dismiss() to remove explicitly.
      persist(this);
    },

    dismiss(sectionId: string, qid: number) {
      delete this.entries[key(sectionId, qid)];
      persist(this);
    },

    reset() {
      this.entries = {};
      persist(this);
    },
  },
});
