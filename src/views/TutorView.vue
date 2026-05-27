<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTutorStore } from '@/stores/tutor';
import {
  getAdapter,
  useRealSdkStatus,
  connectRealSdk,
  disconnectRealSdk,
  getSessionKeyMasked,
} from '@/sdk';
import { ALLOWED_TOOLS } from '@/agents/coordinator';
import PageHeader from '@/components/PageHeader.vue';

const store = useTutorStore();
const input = ref('');
const threadEl = ref<HTMLElement | null>(null);

const adapterKind = computed(() => getAdapter().kind);
const realConnected = useRealSdkStatus();
const maskedKey = computed(() => getSessionKeyMasked());

const keyPanelOpen = ref(false);
const keyInput = ref('');
const keyError = ref<string | null>(null);

function toggleKeyPanel() {
  keyPanelOpen.value = !keyPanelOpen.value;
  if (!keyPanelOpen.value) {
    keyInput.value = '';
    keyError.value = null;
  }
}

function connect() {
  keyError.value = null;
  const result = connectRealSdk(keyInput.value);
  if (!result.ok) {
    keyError.value = result.error;
    return;
  }
  keyInput.value = '';
  keyPanelOpen.value = false;
}

function disconnect() {
  disconnectRealSdk();
  keyInput.value = '';
  keyError.value = null;
}

async function scrollToBottom() {
  await nextTick();
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight;
}

onMounted(scrollToBottom);
watch(() => store.thread.length, scrollToBottom);

async function submit() {
  const value = input.value.trim();
  if (!value) return;
  input.value = '';
  await store.send(value);
}

function suggest(prompt: string) {
  input.value = prompt;
}

const suggestions = [
  'Explain hub-and-spoke',
  'Explain few-shot prompting and quiz me on it',
  'What is the scratchpad pattern?',
  'Quiz me on Domain 2',
  'answer s1 q4: B',
];
</script>

<template>
  <PageHeader
    eyebrow="Claude Tutor"
    title="Hub-and-spoke chat"
    subtitle="The coordinator routes your prompt to specialized subagents (explainer · quizmaster · code-reviewer) and runs independent ones in parallel. Look at the per-message metadata — you can see which subagents fired, in how many ms, and what tool calls they used."
  />

  <div class="tutor-key">
    <div class="tutor-key__row">
      <span
        class="tutor-key__badge"
        :class="{ 'tutor-key__badge--real': realConnected }"
      >
        <template v-if="realConnected">
          Real SDK ({{ maskedKey }}) · this session only
        </template>
        <template v-else>
          Mock SDK (default)
        </template>
      </span>
      <span class="badge">allowedTools: {{ ALLOWED_TOOLS.join(', ') }}</span>
      <button
        v-if="!realConnected"
        class="btn btn--ghost btn--sm tutor-key__toggle"
        @click="toggleKeyPanel"
      >
        {{ keyPanelOpen ? 'Close' : '⚡ Use my Anthropic API key' }}
      </button>
      <button class="btn btn--ghost btn--sm" @click="store.clear()">Clear thread</button>
    </div>

    <div v-if="keyPanelOpen && !realConnected" class="tutor-key__panel">
      <div class="tutor-key__warning">
        This calls the Anthropic API directly from your browser using
        <code>dangerouslyAllowBrowser</code>.
        <strong>Your key is held in memory for this session only</strong> — it is never
        written to <code>localStorage</code>, never sent to our servers, and is gone
        the moment you refresh. Intended for dev/study use, not production.
        <em>Treat it like a password.</em>
      </div>
      <form class="tutor-key__form" @submit.prevent="connect">
        <input
          v-model="keyInput"
          type="password"
          class="tutor-key__input"
          placeholder="sk-ant-..."
          autocomplete="off"
          spellcheck="false"
        />
        <button type="submit" class="btn btn--primary" :disabled="!keyInput.trim()">
          Connect
        </button>
      </form>
      <div class="tutor-key__hint">
        Get one at <code>console.anthropic.com</code>. The key never leaves this tab.
      </div>
      <div v-if="keyError" class="tutor-key__error">{{ keyError }}</div>
    </div>

    <div v-if="realConnected" class="tutor-key__panel">
      <div class="tutor-key__connected">
        <span>Connected to the live Anthropic API as <code>{{ maskedKey }}</code>.</span>
        <button class="btn btn--ghost btn--sm" @click="disconnect">
          Switch back to mock
        </button>
      </div>
    </div>
  </div>

  <div class="chat">
    <div ref="threadEl" class="chat__thread">
      <div v-if="store.thread.length === 0" class="chat__msg chat__msg--system">
        Try one of the suggestions below, or ask any architect-exam question.
      </div>

      <template v-for="m in store.thread" :key="m.id">
        <div class="chat__msg" :class="`chat__msg--${m.role}`">
          <div style="white-space: pre-wrap">{{ m.content }}</div>
          <div v-if="m.role === 'assistant' && m.turn" class="chat__meta">
            <span class="chat__subagent-pill">
              {{ m.turn.parallel ? 'parallel' : 'single' }} ·
              {{ m.turn.subagents.map((s) => s.name).join(' + ') }}
            </span>
            <span>{{ m.turn.totalMs }}ms</span>
            <span v-if="m.turn.escalated" class="text-rose-400">
              escalated ({{ m.turn.escalated.reason }})
            </span>
          </div>

          <details v-if="m.role === 'assistant' && m.turn" class="mt-2 text-xs text-ink-400">
            <summary class="cursor-pointer">subagent breakdown · rationale: {{ m.turn.rationale }}</summary>
            <ul class="mt-2 space-y-1">
              <li v-for="inv in m.turn.subagents" :key="inv.name">
                <span class="font-mono">{{ inv.name }}</span>
                — {{ inv.durationMs }}ms
                <span v-if="inv.toolCalls.length" class="text-ink-300">
                  · tools: {{ inv.toolCalls.map((tc) => tc.name).join(', ') }}
                </span>
              </li>
            </ul>
          </details>
        </div>
      </template>

      <div v-if="store.pending" class="chat__msg chat__msg--system">
        Coordinator dispatching subagents…
      </div>
      <div v-if="store.lastError" class="chat__msg chat__msg--system text-rose-400">
        Error: {{ store.lastError }}
      </div>
    </div>

    <form class="chat__composer" @submit.prevent="submit">
      <textarea
        v-model="input"
        class="chat__input"
        rows="2"
        placeholder='Ask the tutor — e.g. "Explain hub-and-spoke and quiz me on it"'
        @keydown.enter.exact.prevent="submit"
      />
      <button type="submit" class="btn btn--primary" :disabled="store.pending || !input.trim()">
        Send
      </button>
    </form>
  </div>

  <section class="mt-6">
    <div class="text-xs uppercase tracking-widest text-ink-400 mb-2">Try one</div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="s in suggestions"
        :key="s"
        class="btn btn--ghost btn--sm"
        @click="suggest(s)"
      >
        {{ s }}
      </button>
    </div>
  </section>

  <section v-if="store.scratchpad.length" class="mt-8">
    <h2 class="text-lg font-semibold mb-3">Scratchpad <span class="text-ink-400 text-sm">(Domain 5 pattern)</span></h2>
    <div class="card !p-4 text-sm">
      <ul class="space-y-2">
        <li v-for="(line, i) in store.scratchpad.slice(-10)" :key="i" class="font-mono text-xs text-ink-300">
          • {{ line.text }}
        </li>
      </ul>
    </div>
  </section>

  <p class="mt-6 text-xs text-ink-400">
    <span v-if="!realConnected">
      Adapter: <code class="font-mono">{{ adapterKind }}</code> · swap in your own key with the toggle above to drive the real Anthropic API for this session.
    </span>
    <span v-else>
      Adapter: <code class="font-mono">{{ adapterKind }}</code> · every send below makes a live API call against your key.
    </span>
  </p>
</template>
