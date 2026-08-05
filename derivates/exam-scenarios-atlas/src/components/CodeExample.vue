<script setup lang="ts">
import { ref } from 'vue'
import type { CodeBlock } from '../data/types'

const props = defineProps<{ blocks: CodeBlock[] }>()

const active = ref(0)

const langLabel: Record<CodeBlock['lang'], string> = {
  ts: 'TypeScript',
  py: 'Python',
  json: 'JSON',
  jsonc: 'JSONC',
  bash: 'Bash',
  md: 'Markdown',
  yaml: 'YAML',
}

async function copyActive() {
  try {
    await navigator.clipboard.writeText(props.blocks[active.value].body)
  } catch {
    // no-op
  }
}
</script>

<template>
  <section class="frame overflow-hidden">
    <header class="flex items-stretch border-b border-ink-200 bg-ink-50">
      <div
        class="px-4 py-2.5 text-sm font-serif text-ink-800 border-r border-ink-200"
      >
        Worked code
      </div>
      <div class="flex-1 flex overflow-x-auto">
        <button
          v-for="(b, i) in blocks"
          :key="i"
          type="button"
          class="px-3 py-2.5 text-[12px] border-r border-ink-200 whitespace-nowrap"
          :class="i === active ? 'bg-white text-ink-800 font-medium' : 'text-ink-500 hover:text-ink-800 hover:bg-white/60'"
          @click="active = i"
        >
          {{ b.label }}
          <span class="ml-1.5 text-[10px] text-ink-400">{{ langLabel[b.lang] }}</span>
        </button>
      </div>
      <button
        type="button"
        class="px-3 py-2.5 text-[12px] text-ink-500 hover:text-ink-800 border-l border-ink-200"
        @click="copyActive"
        title="Copy active block"
      >
        Copy
      </button>
    </header>
    <pre
      class="font-mono text-[12px] leading-relaxed text-ink-800 p-4 overflow-x-auto whitespace-pre"
    ><code>{{ blocks[active].body }}</code></pre>
  </section>
</template>
