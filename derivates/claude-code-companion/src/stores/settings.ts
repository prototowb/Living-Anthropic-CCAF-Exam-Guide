import { defineStore } from 'pinia';
import { load, save, remove } from './persist';
import { getAdapter, setAdapter as setSdkAdapter } from '@/sdk';
import type { AdapterCapabilities, AdapterKind, SdkAdapter } from '@/sdk';

interface SettingsState {
  showUnderTheHood: boolean;
  rungFilter: 'all' | 'B' | 'I' | 'A';
  // Non-persisted reactive mirror of the active adapter. We deliberately
  // don't persist this choice: re-activating a non-mock adapter at boot
  // would violate "no network at rest" (local adapters ping localhost,
  // real spends API credit). Mock on every refresh; the API key (if saved)
  // persists separately so re-enabling Real is one click.
  adapterKind: AdapterKind;
  adapterLabel: string;
  // Persisted separately under its own key (not settings:v2) so forgetting
  // the key never touches the rest of the settings shape.
  anthropicApiKey: string;
}

type PersistedState = Pick<SettingsState, 'showUnderTheHood' | 'rungFilter'>;
const KEY = 'settings:v2';
const API_KEY_KEY = 'anthropic-api-key:v1';
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
      anthropicApiKey: load<string>(API_KEY_KEY, ''),
    };
  },

  getters: {
    // Reactive: getAdapter() reads the shallowRef in src/sdk/index.ts, so
    // this getter invalidates on setActiveAdapter. Views (AppShell badge)
    // consume this instead of importing from the agents/sdk layer.
    adapterCapabilities(): AdapterCapabilities {
      return { ...getAdapter().capabilities };
    },
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
    setApiKey(key: string) {
      this.anthropicApiKey = key.trim();
      save<string>(API_KEY_KEY, this.anthropicApiKey);
    },
    forgetApiKey() {
      this.anthropicApiKey = '';
      remove(API_KEY_KEY);
    },
  },
});
