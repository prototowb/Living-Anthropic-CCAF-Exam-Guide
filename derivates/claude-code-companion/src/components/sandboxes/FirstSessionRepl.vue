<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ReplTranscript, ReplLine } from '@/data/sandboxes';

const props = defineProps<{ transcript: ReplTranscript }>();

type Mode = keyof ReplTranscript['modes'];
const mode = ref<Mode>('default');
const steps = ref(0);

const lines = computed(() => props.transcript.modes[mode.value]);
const visible = computed(() => lines.value.slice(0, steps.value));

watch(mode, () => {
  steps.value = 0;
});

function next() {
  if (steps.value < lines.value.length) steps.value++;
}
function prev() {
  if (steps.value > 0) steps.value--;
}
function playAll() {
  steps.value = lines.value.length;
}
function reset() {
  steps.value = 0;
}

function lineClass(line: ReplLine) {
  return `repl__line repl__line--${line.kind}`;
}

function lineText(line: ReplLine): string {
  switch (line.kind) {
    case 'system':
      return `· ${line.text}`;
    case 'prompt':
      return line.text;
    case 'user':
      return `> ${line.text}`;
    case 'assistant':
      return line.text;
    case 'tool-call':
      return `↳ tool_use { name: "${line.tool}", input: "${line.input}" }`;
    case 'permission':
      return `[?] Approve ${line.tool}("${line.input}")  →  [y] yes  [a] always  [n] no`;
    case 'tool-result':
      return `↳ ${line.text}`;
    case 'note':
      return line.text;
  }
}

const modes: { id: Mode; label: string }[] = [
  { id: 'default', label: 'default' },
  { id: 'acceptEdits', label: 'acceptEdits' },
  { id: 'plan', label: 'plan' },
  { id: 'yolo', label: 'yolo' },
];
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-3">
      <div class="text-sm text-ink-600 mr-2">Permission mode:</div>
      <div class="flex gap-1">
        <button
          v-for="m in modes"
          :key="m.id"
          @click="mode = m.id"
          class="px-2 py-1 text-xs rounded mono border"
          :class="
            mode === m.id
              ? 'bg-ink-900 text-white border-ink-900'
              : 'bg-white text-ink-700 border-ink-300 hover:border-ink-900'
          "
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <div class="repl min-h-[16rem]">
      <span v-for="(line, idx) in visible" :key="idx" :class="lineClass(line)">
        {{ lineText(line) }}
      </span>
      <span v-if="visible.length === 0" class="repl__line repl__line--system">
        · press "step" to play the transcript
      </span>
    </div>

    <div class="flex gap-2">
      <button class="px-3 py-1.5 text-sm rounded border border-ink-300 hover:border-ink-900 disabled:opacity-50" :disabled="steps === 0" @click="prev">
        ← back
      </button>
      <button class="px-3 py-1.5 text-sm bg-ink-900 text-white rounded disabled:opacity-50" :disabled="steps >= lines.length" @click="next">
        step →
      </button>
      <button class="px-3 py-1.5 text-sm rounded border border-ink-300 hover:border-ink-900" @click="playAll">
        play all
      </button>
      <button class="px-3 py-1.5 text-sm rounded border border-ink-300 hover:border-ink-900" @click="reset">
        reset
      </button>
      <span class="ml-auto text-xs text-ink-500 self-center mono">{{ steps }} / {{ lines.length }}</span>
    </div>
  </div>
</template>
