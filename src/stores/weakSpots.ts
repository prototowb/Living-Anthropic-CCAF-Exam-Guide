// Spaced-repetition store — Leitner-box scheduler for wrong-answered quiz
// questions. Entries are added when the learner gets a question wrong; correct
// answers promote them up the boxes; wrong answers demote back to box 1.
//
// Persistence: localStorage key `aip:weak-spots:v1` via the versioned helper.

import { defineStore } from 'pinia';
import { load, save } from './persist';

const STORAGE_KEY = 'weak-spots:v1';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type Box = 1 | 2 | 3 | 4 | 5;

// AIP-049 — tunable box→interval schedules. `standard` is the original
// table (familiar to anyone who has used Anki: short interval on a fresh
// miss, then doubling out to ~3 weeks). `intense` reviews everything more
// often for a looming exam date; `relaxed` spaces further out for long-lead
// studying. Switching schedules RESCHEDULES existing entries from their
// `lastReviewedAt` — a learner mid-grind sees due dates move immediately.
export type ScheduleId = 'intense' | 'standard' | 'relaxed';

export interface ScheduleDef {
  id: ScheduleId;
  label: string;
  blurb: string;
  intervals: Record<Box, number>;
}

export const SCHEDULES: Record<ScheduleId, ScheduleDef> = {
  intense: {
    id: 'intense',
    label: 'Intense',
    blurb: 'Exam soon — everything resurfaces fast.',
    intervals: {
      1: 10 * MS_PER_MINUTE,
      2: 12 * MS_PER_HOUR,
      3: 1 * MS_PER_DAY,
      4: 3 * MS_PER_DAY,
      5: 7 * MS_PER_DAY,
    },
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    blurb: 'The default doubling ladder out to three weeks.',
    intervals: {
      1: 10 * MS_PER_MINUTE,
      2: 1 * MS_PER_DAY,
      3: 3 * MS_PER_DAY,
      4: 7 * MS_PER_DAY,
      5: 21 * MS_PER_DAY,
    },
  },
  relaxed: {
    id: 'relaxed',
    label: 'Relaxed',
    blurb: 'Long-lead studying — wider gaps, fewer reviews.',
    intervals: {
      1: 30 * MS_PER_MINUTE,
      2: 2 * MS_PER_DAY,
      3: 7 * MS_PER_DAY,
      4: 21 * MS_PER_DAY,
      5: 60 * MS_PER_DAY,
    },
  },
};

/** @deprecated since AIP-049 — the standard schedule's table. Kept so any
 *  external reference keeps compiling; new code reads the store's
 *  `schedule.intervals`. */
export const BOX_INTERVAL_MS = SCHEDULES.standard.intervals;

/** Human label for an interval, matching the app's compact style. */
export function intervalLabel(ms: number): string {
  if (ms < MS_PER_HOUR) return `${Math.round(ms / MS_PER_MINUTE)} min`;
  if (ms < 36 * MS_PER_HOUR) return `${Math.round(ms / MS_PER_HOUR)} h`;
  return `${Math.round(ms / MS_PER_DAY)} d`;
}

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
  // Added in AIP-049. Absent in payloads written before then — load()
  // defaults it, so this is an additive, back-compatible field and the key
  // stays at :v1 (a bump would discard learners' enrolled entries for no
  // structural reason).
  scheduleId?: ScheduleId;
}

interface State {
  entries: Record<string, WeakSpotEntry>;
  scheduleId: ScheduleId;
}

function key(sectionId: string, qid: number) {
  return `${sectionId}:${qid}`;
}

function persist(state: State) {
  save<PersistedState>(STORAGE_KEY, {
    entries: state.entries,
    scheduleId: state.scheduleId,
  });
}

function nextDueAt(scheduleId: ScheduleId, box: Box, from: number): number {
  return from + SCHEDULES[scheduleId].intervals[box];
}

export const useWeakSpotsStore = defineStore('weakSpots', {
  state: (): State => {
    const persisted = load<PersistedState>(STORAGE_KEY, { entries: {} });
    const scheduleId =
      persisted.scheduleId && persisted.scheduleId in SCHEDULES
        ? persisted.scheduleId
        : 'standard';
    return { entries: persisted.entries, scheduleId };
  },

  getters: {
    /** The active schedule definition (label, blurb, intervals). */
    schedule(state): ScheduleDef {
      return SCHEDULES[state.scheduleId];
    },

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
        existing.dueAt = nextDueAt(this.scheduleId, 1, now);
        existing.lastReviewedAt = now;
        existing.wrongCount += 1;
        existing.correctStreak = 0;
      } else {
        this.entries[k] = {
          sectionId,
          qid,
          box: 1,
          dueAt: nextDueAt(this.scheduleId, 1, now),
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
      entry.dueAt = nextDueAt(this.scheduleId, nextBox, now);
      // We keep entries even at box 5 so the learner can see "mastered" counts.
      // Use dismiss() to remove explicitly.
      persist(this);
    },

    /**
     * AIP-049 — switch the box-interval schedule. Existing entries are
     * rescheduled from their `lastReviewedAt` against the new table, so the
     * change takes effect immediately (an entry reviewed yesterday in box 2
     * under `intense` [12 h] becomes due NOW; under `relaxed` [2 d] it moves
     * a day out). Boxes and streaks are untouched.
     */
    setSchedule(id: ScheduleId) {
      if (id === this.scheduleId) return;
      this.scheduleId = id;
      for (const entry of Object.values(this.entries)) {
        entry.dueAt = nextDueAt(id, entry.box, entry.lastReviewedAt);
      }
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
