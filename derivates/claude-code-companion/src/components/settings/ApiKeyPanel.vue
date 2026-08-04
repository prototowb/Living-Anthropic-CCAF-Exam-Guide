<script setup lang="ts">
// API-key entry for the Real Claude adapter (v0.5).
// Talks to the settings store directly; the key persists in localStorage
// under `ccc:anthropic-api-key:v1` (via src/stores/persist.ts), never in
// component state beyond this input.
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';

const settings = useSettingsStore();

const draft = ref('');
const showKey = ref(false);

function saveKey() {
  if (!draft.value.trim()) return;
  settings.setApiKey(draft.value);
  draft.value = '';
}

function forgetKey() {
  settings.forgetApiKey();
  draft.value = '';
}
</script>

<template>
  <div class="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm">
    <p class="font-medium text-sky-900">Anthropic API key</p>

    <p v-if="settings.anthropicApiKey" class="mt-1 text-sky-800">
      A key is saved on this device
      (<code class="font-mono">…{{ settings.anthropicApiKey.slice(-4) }}</code>).
    </p>

    <div v-else class="mt-2 flex gap-2">
      <input
        v-model="draft"
        :type="showKey ? 'text' : 'password'"
        placeholder="sk-ant-…"
        autocomplete="off"
        spellcheck="false"
        class="min-w-0 flex-1 rounded border border-sky-300 bg-white px-2 py-1 font-mono text-xs"
        @keydown.enter="saveKey"
      />
      <button
        type="button"
        class="rounded border border-sky-300 bg-white px-2 py-1 text-xs text-sky-800 hover:bg-sky-100"
        @click="showKey = !showKey"
      >
        {{ showKey ? 'Hide' : 'Show' }}
      </button>
      <button
        type="button"
        :disabled="!draft.trim()"
        class="rounded bg-sky-900 px-3 py-1 text-xs text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
        @click="saveKey"
      >
        Save key
      </button>
    </div>

    <button
      v-if="settings.anthropicApiKey"
      type="button"
      class="mt-2 rounded border border-rose-300 bg-white px-3 py-1 text-xs text-rose-800 hover:bg-rose-50"
      @click="forgetKey"
    >
      Forget key
    </button>

    <p class="mt-2 text-xs text-sky-800">
      Stored only on this device, in your browser's localStorage. Anyone with
      access to this browser profile (or any script injected into this page)
      can read it — use a low-limit key, never a production key. The
      <strong>Forget key</strong> button deletes it.
    </p>
  </div>
</template>
