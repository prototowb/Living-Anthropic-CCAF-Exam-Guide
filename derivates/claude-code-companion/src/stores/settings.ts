import { defineStore } from 'pinia';
import { load, save } from './persist';
import { getAdapter } from '@/sdk';

interface SettingsState {
  showUnderTheHood: boolean;
  rungFilter: 'all' | 'B' | 'I' | 'A';
}

const KEY = 'settings:v1';

export const useSettingsStore = defineStore('settings', {
  state: () =>
    load<SettingsState>(KEY, { showUnderTheHood: false, rungFilter: 'all' }),

  actions: {
    setShowUnderTheHood(v: boolean) {
      this.showUnderTheHood = v;
      save(KEY, this.$state);
    },
    setRungFilter(v: SettingsState['rungFilter']) {
      this.rungFilter = v;
      save(KEY, this.$state);
    },
  },

  getters: {
    /** Tutor uses this to label itself in the UI. */
    adapterLabel: () => getAdapter().label,
  },
});
