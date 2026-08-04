import { defineStore } from 'pinia';
import { helpBot, type HelpBotReply } from '@/agents/helpBot/coordinator';
import { helpBotScratchpad } from '@/agents/scratchpad';
import { getAdapter } from '@/sdk';

export interface HelpBotMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  meta?: HelpBotReply;
}

let nextId = 1;

export const useHelpBotStore = defineStore('helpBot', {
  state: () => ({
    open: false,
    messages: [] as HelpBotMessage[],
    pending: false,
    scratchpadOpen: false,
  }),

  actions: {
    toggle() {
      this.open = !this.open;
    },
    toggleScratchpad() {
      this.scratchpadOpen = !this.scratchpadOpen;
    },
    async ask(prompt: string) {
      const trimmed = prompt.trim();
      if (!trimmed || this.pending) return;
      this.messages.push({ id: nextId++, role: 'user', text: trimmed });
      this.pending = true;
      try {
        const reply = await helpBot.handle(trimmed);
        this.messages.push({
          id: nextId++,
          role: 'assistant',
          text: reply.text,
          meta: reply,
        });
      } finally {
        this.pending = false;
      }
    },
  },

  getters: {
    /** Most recent scratchpad findings (most-recent-first, capped). v0.2 task 5. */
    scratchpadSummary: () => helpBotScratchpad.summarize(6),
    /** v0.3 — running consecutive-business-error counter for the footer chip. */
    escalationBudgetUsed: () => helpBot.escalationBudgetUsed,
    escalationBudgetMax: () => helpBot.escalationBudgetMax,
    /** v0.3 — adapter capabilities for the CapabilitiesBadge in the header.
     *  Views CLAUDE.md rule 2 — components consume capabilities via the store.
     *  Reactive since v0.5: getAdapter() reads the shallowRef composition
     *  root, so this invalidates when the adapter is swapped in /settings. */
    adapterCapabilities: () => {
      const a = getAdapter();
      return {
        nativeToolUse: a.capabilities.nativeToolUse,
        parallelSubagents: a.capabilities.parallelSubagents,
        schemaMode: a.capabilities.schemaMode,
        adapterLabel: a.label,
      };
    },
  },
});
