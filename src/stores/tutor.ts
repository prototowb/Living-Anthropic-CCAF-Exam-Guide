import { defineStore } from 'pinia';
import { coordinator, type CoordinatorTurn } from '@/agents/coordinator';
import { scratchpad, type ScratchpadEntry } from '@/agents/scratchpad';
import { load, save } from './persist';

const STORAGE_KEY = 'tutor:v1';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  at: number;
  turn?: CoordinatorTurn;
}

interface PersistedTutorState {
  thread: ChatMessage[];
  scratchpad: ScratchpadEntry[];
}

interface TutorState {
  thread: ChatMessage[];
  pending: boolean;
  scratchpad: ScratchpadEntry[];
  lastError: string | null;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const useTutorStore = defineStore('tutor', {
  state: (): TutorState => {
    const persisted = load<PersistedTutorState>(STORAGE_KEY, {
      thread: [],
      scratchpad: [],
    });
    return {
      thread: persisted.thread,
      pending: false,
      scratchpad: persisted.scratchpad,
      lastError: null,
    };
  },

  actions: {
    pushUser(content: string) {
      this.thread.push({ id: uid(), role: 'user', content, at: Date.now() });
    },

    pushAssistant(turn: CoordinatorTurn) {
      this.thread.push({
        id: uid(),
        role: 'assistant',
        content: turn.reply,
        at: Date.now(),
        turn,
      });
    },

    async send(prompt: string) {
      if (!prompt.trim() || this.pending) return;
      this.lastError = null;
      this.pushUser(prompt);
      this.pending = true;
      try {
        const turn = await coordinator.handle(prompt);
        this.pushAssistant(turn);
        // Mirror scratchpad into the store so the UI can render it.
        this.scratchpad = scratchpad.read();
        this.persist();
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : String(err);
      } finally {
        this.pending = false;
      }
    },

    clear() {
      this.thread = [];
      scratchpad.clear();
      this.scratchpad = [];
      this.persist();
    },

    persist() {
      save<PersistedTutorState>(STORAGE_KEY, {
        thread: this.thread,
        scratchpad: this.scratchpad,
      });
    },
  },
});
