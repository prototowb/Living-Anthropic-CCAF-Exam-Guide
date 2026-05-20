import { defineStore } from 'pinia';
import { tutor, type TutorTurn } from '@/agents/tutor/coordinator';
import { tutorScratchpad } from '@/agents/scratchpad';
import { load, save } from './persist';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  meta?: TutorTurn;
}

// v0.2 task 3 — persist the tutor thread. Bump the suffix on shape changes.
// We deliberately persist the `meta` payload too so reloads keep the per-turn
// chips (subagents, parallel-vs-serial, citations, errors) faithful to the
// adapter that was active at the time. `pending` is excluded — transient.
const STORAGE_KEY = 'tutor:v1';

interface PersistedThread {
  nextId: number;
  messages: ChatMessage[];
}

function loadPersisted(): PersistedThread {
  return load<PersistedThread>(STORAGE_KEY, { nextId: 1, messages: [] });
}

const initial = loadPersisted();
let nextId = initial.nextId;

export const useTutorStore = defineStore('tutor', {
  state: () => ({
    messages: initial.messages,
    pending: false,
  }),

  actions: {
    async send(prompt: string) {
      const trimmed = prompt.trim();
      if (!trimmed || this.pending) return;
      this.messages.push({ id: nextId++, role: 'user', text: trimmed });
      this.persist();
      this.pending = true;
      try {
        const turn = await tutor.handle(trimmed);
        this.messages.push({
          id: nextId++,
          role: 'assistant',
          text: turn.reply,
          meta: turn,
        });
        this.persist();
      } finally {
        this.pending = false;
      }
    },
    reset() {
      this.messages = [];
      nextId = 1;
      this.persist();
    },
    /** Internal — persist current thread shape under `ccc:tutor:v1`. */
    persist() {
      save(STORAGE_KEY, { nextId, messages: this.messages });
    },
    /**
     * Scratchpad bridge for views (per `src/views/CLAUDE.md` rule 2 — views
     * never import from `src/agents/**`). Returns the last `maxLines` findings
     * as a single rendered block, or empty string if the scratchpad is empty.
     */
    getTutorScratchpad(maxLines = 8): string {
      return tutorScratchpad.summarize(maxLines);
    },
  },
});
