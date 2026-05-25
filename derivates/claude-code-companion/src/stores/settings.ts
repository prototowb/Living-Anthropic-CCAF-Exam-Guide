import { defineStore } from 'pinia';
import { load, save } from './persist';
import { getAdapter, setAdapter as setSdkAdapter } from '@/sdk';
import type { AdapterKind, SdkAdapter } from '@/sdk';

interface SettingsState {
  showUnderTheHood: boolean;
  rungFilter: 'all' | 'B' | 'I' | 'A';
  // Non-persisted reactive mirror of the active adapter — non-mock adapters
  // can't reliably re-init at boot (real needs an API key; stubs throw on
  // first call), so we deliberately don't persist this choice. Mock on
  // every refresh.
  adapterKind: AdapterKind;
  adapterLabel: string;
}

type PersistedState = Pick<SettingsState, 'showUnderTheHood' | 'rungFilter'>;
const KEY = 'settings:v2';
const PERSISTED_DEFAULTS: PersistedState = {
  showUnderTheHood: false,
  rungFilter: 'all',
};

function persistedSlice(s: SettingsState): PersistedState {
  return { showUnderTheHood: s.showUnderTheHood, rungFilter: s.rungFilter };
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => {
    const persisted = load<PersistedState>(KEY, PERSISTED_DEFAULTS);
    const a = getAdapter();
    return {
      ...persisted,
      adapterKind: a.kind,
      adapterLabel: a.label,
    };
  },

  actions: {
    setShowUnderTheHood(v: boolean) {
      this.showUnderTheHood = v;
      save<PersistedState>(KEY, persistedSlice(this.$state));
    },
    setRungFilter(v: SettingsState['rungFilter']) {
      this.rungFilter = v;
      save<PersistedState>(KEY, persistedSlice(this.$state));
    },
    setActiveAdapter(adapter: SdkAdapter) {
      setSdkAdapter(adapter);
      this.adapterKind = adapter.kind;
      this.adapterLabel = adapter.label;
    },
  },
});
