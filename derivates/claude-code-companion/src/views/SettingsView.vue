<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import ApiKeyPanel from '@/components/settings/ApiKeyPanel.vue';
import {
  createLmStudioAdapter,
  createOllamaAdapter,
  createRealAdapter,
  createWebLlmAdapter,
  mockAdapter,
  pickDefaultModel,
  pingOpenAiCompatServer,
  prewarmWebLlm,
  webGpuAvailable,
  LM_STUDIO_BASE_URL,
  OLLAMA_BASE_URL,
} from '@/sdk';
import type { AdapterKind, SdkAdapter, WebLlmProgress } from '@/sdk';

const settings = useSettingsStore();

type Chip = 'full' | 'requires-key' | 'local';

interface AdapterOption {
  kind: AdapterKind;
  title: string;
  description: string;
  chip: Chip;
  factory: () => SdkAdapter;
  disabled?: boolean;
  disabledReason?: string;
}

// ---- Local-server detection (Ollama / LM Studio) ----------------------
// Pinged when this view mounts (and on "Re-check") — never at app boot, so
// the app stays network-silent at rest.
type DetectStatus = 'checking' | 'found' | 'not-found';
const detection = reactive<Record<'ollama' | 'lm-studio', { status: DetectStatus; models: string[] }>>({
  ollama: { status: 'checking', models: [] },
  'lm-studio': { status: 'checking', models: [] },
});

async function recheck() {
  detection.ollama = { status: 'checking', models: [] };
  detection['lm-studio'] = { status: 'checking', models: [] };
  const [ollama, lmStudio] = await Promise.all([
    pingOpenAiCompatServer(OLLAMA_BASE_URL),
    pingOpenAiCompatServer(LM_STUDIO_BASE_URL),
  ]);
  detection.ollama = { status: ollama.ok ? 'found' : 'not-found', models: ollama.models };
  detection['lm-studio'] = { status: lmStudio.ok ? 'found' : 'not-found', models: lmStudio.models };
}

onMounted(recheck);

function detectionLine(kind: 'ollama' | 'lm-studio'): string {
  const d = detection[kind];
  if (d.status === 'checking') return 'Checking for a local server…';
  if (d.status === 'found') {
    const model = pickDefaultModel(d.models, /llama-?3\.2/i);
    return `Detected — will use ${model ?? 'the first available model'}.`;
  }
  return kind === 'ollama'
    ? 'Not detected. Install from ollama.com, then `ollama serve` and `ollama pull llama3.2`.'
    : 'Not detected. Start the server in LM Studio’s Developer tab and enable CORS in its settings.';
}

// ---- WebLLM download state ---------------------------------------------
const hasWebGpu = webGpuAvailable();
const webllmProgress = ref<WebLlmProgress | null>(null);
const webllmState = ref<'idle' | 'downloading' | 'ready' | 'error'>('idle');
const webllmError = ref('');

function onWebllmProgress(p: WebLlmProgress) {
  webllmState.value = p.progress >= 1 ? 'ready' : 'downloading';
  webllmProgress.value = p;
}

async function downloadWebllmNow() {
  webllmState.value = 'downloading';
  webllmError.value = '';
  try {
    await prewarmWebLlm({ onProgress: onWebllmProgress });
    webllmState.value = 'ready';
  } catch (e) {
    webllmState.value = 'error';
    webllmError.value = e instanceof Error ? e.message : String(e);
  }
}

// ---- Adapter options ----------------------------------------------------
const options = computed<AdapterOption[]>(() => [
  {
    kind: 'mock',
    title: 'Mock (scripted)',
    description:
      'No API key, no network. Deterministic scripted responses. The default — everything in the app works.',
    chip: 'full',
    factory: () => mockAdapter,
  },
  {
    kind: 'real',
    title: 'Real Claude (Anthropic SDK)',
    description: 'Live Claude via the Anthropic API. Requires an API key.',
    chip: 'requires-key',
    factory: () => createRealAdapter(settings.anthropicApiKey),
    disabled: !settings.anthropicApiKey,
    disabledReason: 'Save an API key below to enable.',
  },
  {
    kind: 'webllm',
    title: 'WebLLM (browser-native)',
    description:
      'Llama 3.2 3B runs in your browser via WebGPU. One-time ~2 GB download, cached by your browser — nothing downloads until you ask.',
    chip: 'local',
    factory: () => createWebLlmAdapter({ onProgress: onWebllmProgress }),
    disabled: !hasWebGpu,
    disabledReason:
      'This browser does not expose WebGPU. Use Chrome, Edge, or a recent Safari.',
  },
  {
    kind: 'ollama',
    title: 'Ollama (local server)',
    description: 'Connects to a running Ollama on localhost:11434.',
    chip: 'local',
    factory: () =>
      createOllamaAdapter({
        model: pickDefaultModel(detection.ollama.models, /llama-?3\.2/i),
      }),
  },
  {
    kind: 'lm-studio',
    title: 'LM Studio (local server)',
    description: 'Connects to a running LM Studio on localhost:1234.',
    chip: 'local',
    factory: () =>
      createLmStudioAdapter({
        model: pickDefaultModel(detection['lm-studio'].models, /llama-?3\.2/i),
      }),
  },
]);

function pick(o: AdapterOption) {
  if (o.disabled) return;
  settings.setActiveAdapter(o.factory());
}

function chipLabel(c: Chip) {
  if (c === 'full') return { text: 'Fully working', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (c === 'requires-key') return { text: 'Requires key', cls: 'bg-sky-100 text-sky-800 border-sky-300' };
  return { text: 'Local model', cls: 'bg-violet-100 text-violet-800 border-violet-300' };
}

const activeBanner = computed(() => {
  switch (settings.adapterKind) {
    case 'real':
      return 'Live adapter — messages go to the Anthropic API using your stored key and will incur usage.';
    case 'webllm':
      return 'Local in-browser model. The first message triggers the ~2 GB download unless you pre-download below. Tool use and parallel agents are limited (see the badge in the header).';
    case 'ollama':
    case 'lm-studio':
      return 'Local server model. Tool use and parallel agents are limited (see the badge in the header). If calls fail, check the server is still running.';
    default:
      return '';
  }
});

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
        default — no API key, no network. The other four are live: real Claude
        with your key, an in-browser model over WebGPU, or a local
        Ollama&nbsp;/&nbsp;LM&nbsp;Studio server.
      </p>

      <div
        v-if="settings.adapterKind !== 'mock'"
        class="mt-3 flex items-start gap-3 rounded-md border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900"
      >
        <div class="flex-1">
          <p class="font-medium">
            Active: <code class="font-mono">{{ settings.adapterLabel }}</code>
          </p>
          <p class="mt-1">{{ activeBanner }}</p>
        </div>
        <button
          @click="resetToMock"
          class="rounded bg-sky-900 px-3 py-1 text-xs text-white hover:bg-sky-800"
        >
          Reset to Mock
        </button>
      </div>
    </header>

    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold">Adapters</h2>
      <button
        type="button"
        class="rounded border border-ink-300 bg-white px-2 py-0.5 text-xs text-ink-700 hover:border-ink-500"
        @click="recheck"
      >
        Re-check local servers
      </button>
    </div>

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
              chipLabel(o.chip).cls,
            ]"
          >
            {{ chipLabel(o.chip).text }}
          </span>
          <span
            v-if="settings.adapterKind === o.kind"
            class="ml-auto text-xs font-medium text-ink-900"
            >active</span
          >
        </header>
        <p class="text-sm text-ink-600">{{ o.description }}</p>
        <p
          v-if="o.kind === 'ollama' || o.kind === 'lm-studio'"
          class="mt-2 text-xs text-ink-500"
        >
          {{ detectionLine(o.kind) }}
        </p>
        <p v-if="o.disabled && o.disabledReason" class="mt-2 text-xs italic text-ink-500">
          {{ o.disabledReason }}
        </p>
      </button>
    </div>

    <ApiKeyPanel />

    <div
      v-if="settings.adapterKind === 'webllm' || webllmState !== 'idle'"
      class="rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900"
    >
      <div class="flex items-center gap-3">
        <p class="flex-1 font-medium">WebLLM model download</p>
        <button
          v-if="webllmState === 'idle' || webllmState === 'error'"
          type="button"
          class="rounded bg-violet-900 px-3 py-1 text-xs text-white hover:bg-violet-800"
          @click="downloadWebllmNow"
        >
          Download now (~2 GB)
        </button>
      </div>
      <template v-if="webllmState === 'downloading' || webllmState === 'ready'">
        <div class="mt-2 h-2 overflow-hidden rounded bg-violet-200">
          <div
            class="h-full rounded bg-violet-700 transition-all"
            :style="{ width: `${Math.round((webllmProgress?.progress ?? 0) * 100)}%` }"
          />
        </div>
        <p class="mt-1 text-xs">
          {{ webllmState === 'ready' ? 'Model ready.' : (webllmProgress?.text || 'Starting download…') }}
        </p>
      </template>
      <p v-else-if="webllmState === 'error'" class="mt-2 text-xs text-rose-800">
        {{ webllmError }}
      </p>
      <p v-else class="mt-2 text-xs">
        Nothing has downloaded yet. Either press the button, or just send a
        message — the first one triggers the download.
      </p>
    </div>

    <aside class="rounded-md border border-ink-200 bg-ink-50 p-3 text-xs text-ink-600">
      <p>
        Adapter choice is <strong>not persisted</strong> — refreshing the page
        returns to Mock, so the app never talks to a network (or spends API
        credit) without you asking in that session. Your API key, if saved,
        <strong>does</strong> persist on this device, so re-enabling Real
        Claude is one click. WebLLM's model weights stay in the browser cache,
        so a re-download is only needed if the browser evicts them.
      </p>
    </aside>
  </section>
</template>
