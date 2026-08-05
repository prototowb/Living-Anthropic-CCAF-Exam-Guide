<script setup lang="ts">
import type { Foil } from '../data/types'
import { mandateRefs } from '../data/parentLinks'

defineProps<{ foils: Foil[] }>()
</script>

<template>
  <section class="space-y-5">
    <article v-for="(f, i) in foils" :key="i" class="frame overflow-hidden">
      <header class="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3">
        <h4 class="font-serif text-base text-ink-800">{{ f.title }}</h4>
        <a
          v-for="r in mandateRefs(f.ref ?? '')"
          :key="r.ts"
          :href="r.url"
          target="_blank"
          rel="noopener"
          class="chip no-underline hover:bg-ink-50 shrink-0"
          :title="`Study this mandate in the parent playbook (pattern: ${r.patternId})`"
        >
          <span class="font-mono">{{ r.ts }}</span>
          <span class="text-ink-400 ml-1">↗</span>
        </a>
      </header>

      <div class="grid md:grid-cols-2 border-t border-ink-200">
        <div class="border-b md:border-b-0 md:border-r border-ink-200">
          <div class="flex items-center gap-2 px-4 py-2 bg-accent-soft/50">
            <span class="font-mono text-[12px] text-accent-ink">✗</span>
            <span class="text-[12px] font-medium text-accent-ink">{{ f.wrong.label }}</span>
          </div>
          <pre
            class="px-4 py-3 font-mono text-[11.5px] leading-relaxed text-ink-700 whitespace-pre-wrap break-words"
          >{{ f.wrong.body }}</pre>
        </div>
        <div>
          <div class="flex items-center gap-2 px-4 py-2 bg-domain-3/10">
            <span class="font-mono text-[12px] text-domain-3">✓</span>
            <span class="text-[12px] font-medium text-ink-800">{{ f.right.label }}</span>
          </div>
          <pre
            class="px-4 py-3 font-mono text-[11.5px] leading-relaxed text-ink-700 whitespace-pre-wrap break-words"
          >{{ f.right.body }}</pre>
        </div>
      </div>

      <footer class="px-5 py-3 border-t border-ink-200 bg-ink-50/60">
        <p class="text-[12.5px] text-ink-600 leading-relaxed max-w-prose">
          <span class="text-accent-ink font-medium">Why this fails:</span> {{ f.failure }}
        </p>
      </footer>
    </article>
  </section>
</template>
