<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import {
  createLmStudioAdapter,
  createOllamaAdapter,
  createWebLlmAdapter,
  mockAdapter,
} from '@/sdk';
import type { AdapterKind, SdkAdapter } from '@/sdk';

const settings = useSettingsStore();

type Capability = 'full' | 'requires-key' | 'stub';

interface AdapterOption {
  kind: AdapterKind;
  title: string;
  description: string;
  capability: Capability;
  factory: () => SdkAdapter;
  disabled?: boolean;
  disabledReason?: string;
}

const options: AdapterOption[] = [
  {
    kind: 'mock',
    title: 'Mock (scripted)',
    description:
      'No API key, no network. Deterministic scripted responses. The default — everything in the app works.',
    capability: 'full',
    factory: () => mockAdapter,
  },
  {
    kind: 'real',
    title: 'Real Claude (Anthropic SDK)',
    description: 'Live Claude via the Anthropic API. Requires an API key.',
    capability: 'requires-key',
    factory: () => mockAdapter,
    disabled: true,
    disabledReason:
      'In-app API key entry arrives in v0.5. For now: call setAdapter(createRealAdapter(apiKey)) from code.',
  },
  {
    kind: 'webllm',
    title: 'WebLLM (browser-native)',
    description:
      'A small model that runs in your browser via WebGPU. Bundled stub today; full ~2 GB on-demand download arrives v0.5.',
    capability: 'stub',
    factory: () => createWebLlmAdapter(),
  },
  {
    kind: 'ollama',
    title: 'Ollama (local server)',
    description:
      'Connects to a running Ollama on localhost:11434. Auto-detect + dispatch arrives v0.5.',
    capability: 'stub',
    factory: () => createOllamaAdapter(),
  },
  {
    kind: 'lm-studio',
    title: 'LM Studio (local server)',
    description:
      'Connects to a running LM Studio on localhost:1234. Auto-detect + dispatch arrives v0.5.',
    capability: 'stub',
    factory: () => createLmStudioAdapter(),
  },
];

function pick(o: AdapterOption) {
  if (o.disabled) return;
  settings.setActiveAdapter(o.factory());
}

function capLabel(c: Capability) {
  if (c === 'full') return { text: 'Fully working', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (c === 'requires-key') return { text: 'Requires key', cls: 'bg-sky-100 text-sky-800 border-sky-300' };
  return { text: 'Stub — v0.5', cls: 'bg-rose-100 text-rose-800 border-rose-300' };
}

function resetToMock() {
  settings.setActiveAdapter(mockAdapter);
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight">Settings</h1>
      <p class="text-ink-600 mt-2 max-w-3xl">
        Pick which model adapter the Tutor and Help Bot should use. Mock is the
        default — no API key, no network. The other adapters are placeholders
        for v0.5; selecting them today lets you preview the picker, but live
        calls will throw.
      </p>

      <div
        v-if="settings.adapterKind !== 'mock'"
        class="mt-3 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
      >
        <div class="flex-1">
          <p class="font-medium">Tutor and Help Bot will throw with this adapter active.</p>
          <p class="mt-1">
            Currently selected: <code class="font-mono">{{ settings.adapterLabel }}</code>.
            Switch back to Mock if you want to interact with the app.
          </p>
        </div>
        <button
          @click="resetToMock"
          class="rounded bg-amber-900 px-3 py-1 text-xs text-white hover:bg-amber-800"
        >
          Reset to Mock
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="o in options"
        :key="o.kind"
        type="button"
        @click="pick(o)"
        :disabled="o.disabled"
        :class="[
          'rounded-lg border p-4 text-left transition',
          settings.adapterKind === o.kind
            ? 'border-ink-900 bg-ink-50 ring-2 ring-ink-900 ring-offset-1'
            : 'border-ink-200 bg-white hover:border-ink-400',
          o.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ]"
      >
        <header class="mb-2 flex items-center gap-2">
          <span class="font-semibold">{{ o.title }}</span>
          <span
            :class="[
              'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide',
              capLabel(o.capability).cls,
            ]"
          >
            {{ capLabel(o.capability).text }}
          </span>
          <span
            v-if="settings.adapterKind === o.kind"
            class="ml-auto text-xs font-medium text-ink-900"
            >active</span
          >
        </header>
        <p class="text-sm text-ink-600">{{ o.description }}</p>
        <p v-if="o.disabledReason" class="mt-2 text-xs italic text-ink-500">
          {{ o.disabledReason }}
        </p>
      </button>
    </div>

    <aside class="rounded-md border border-ink-200 bg-ink-50 p-3 text-xs text-ink-600">
      <p>
        Adapter choice is <strong>not persisted</strong> — refreshing the page
        returns to Mock. Non-mock adapters either need credentials (Real) or
        aren't wired yet (stubs), so re-initialising them at boot would just
        crash the app. v0.5 introduces credential storage and live local-server
        detection.
      </p>
    </aside>
  </section>
</template>
