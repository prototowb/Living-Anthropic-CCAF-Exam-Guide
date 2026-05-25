import { defineStore } from 'pinia';
import { load, save } from './persist';

// Writer side: src/agents/helpBot/tools/recordWeakSpot.ts. Same key, same shape.
// This store is the reader half — a Pinia surface so views avoid direct
// localStorage (src/views/CLAUDE.md rule 7).

export interface WeakSpot {
  topic: string;
  qid?: string;
  /** Epoch millis. */
  at: number;
  count: number;
}

interface StoredWeakSpots {
  entries: WeakSpot[];
}

const KEY = 'weakSpots:v1';

export const useWeakSpotsStore = defineStore('weakSpots', {
  state: (): StoredWeakSpots => load<StoredWeakSpots>(KEY, { entries: [] }),

  actions: {
    /** Pull the latest from localStorage. The agent tool writes directly, so
     *  views call this on mount to see fresh data. */
    refresh() {
      const next = load<StoredWeakSpots>(KEY, { entries: [] });
      this.entries = Array.isArray(next.entries) ? next.entries : [];
    },
    /** Wipe all weak spots. UI-side intent — also clears the persisted store. */
    clear() {
      this.entries = [];
      save<StoredWeakSpots>(KEY, { entries: [] });
    },
  },

  getters: {
    /** Sorted by count desc, then by recency. */
    byCount(state): WeakSpot[] {
      return [...state.entries].sort(
        (a, b) => b.count - a.count || b.at - a.at,
      );
    },
    /** Total drill misses across all entries. */
    totalMisses(state): number {
      return state.entries.reduce((s, e) => s + e.count, 0);
    },
  },
});
