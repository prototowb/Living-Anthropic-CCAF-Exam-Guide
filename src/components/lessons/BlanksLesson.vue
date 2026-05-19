<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import type { BlanksLesson } from '@/data/lessons';

const props = defineProps<{ lesson: BlanksLesson }>();
const emit = defineEmits<{
  (e: 'complete', success: boolean): void;
  (e: 'next'): void;
}>();

interface Token {
  kind: 'text' | 'blank';
  value: string; // text for 'text', blank index ('1'-based) for 'blank'
}

const tokens = ref<Token[]>([]);
const filled = ref<(string | null)[]>([]);
const usedChoiceIndexes = ref<Set<number>>(new Set());
const submitted = ref(false);
const wrongIndexes = ref<Set<number>>(new Set());

const choices = computed(() => props.lesson.choices);

function parseTemplate(template: string): Token[] {
  const out: Token[] = [];
  const re = /\{\{(\d+)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    if (m.index > last) out.push({ kind: 'text', value: template.slice(last, m.index) });
    out.push({ kind: 'blank', value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push({ kind: 'text', value: template.slice(last) });
  return out;
}

function reset() {
  tokens.value = parseTemplate(props.lesson.template);
  filled.value = props.lesson.answers.map(() => null);
  usedChoiceIndexes.value = new Set();
  submitted.value = false;
  wrongIndexes.value = new Set();
}

onMounted(reset);
watch(() => props.lesson.id, reset);

function nextEmptyIndex(): number {
  return filled.value.findIndex((f) => f === null);
}

function pickChoice(idx: number) {
  if (submitted.value) return;
  if (usedChoiceIndexes.value.has(idx)) return;
  const slot = nextEmptyIndex();
  if (slot === -1) return;
  const updated = [...filled.value];
  updated[slot] = choices.value[idx];
  filled.value = updated;
  usedChoiceIndexes.value = new Set([...usedChoiceIndexes.value, idx]);
}

function clearBlank(blankIndex: number) {
  if (submitted.value) return;
  const choice = filled.value[blankIndex];
  if (!choice) return;
  const updated = [...filled.value];
  updated[blankIndex] = null;
  filled.value = updated;
  // Free up the matching choice.
  const i = choices.value.findIndex((c, ci) => c === choice && usedChoiceIndexes.value.has(ci));
  if (i !== -1) {
    const set = new Set(usedChoiceIndexes.value);
    set.delete(i);
    usedChoiceIndexes.value = set;
  }
}

function check() {
  const wrong = new Set<number>();
  props.lesson.answers.forEach((expected, i) => {
    if (filled.value[i] !== expected) wrong.add(i);
  });
  wrongIndexes.value = wrong;
  submitted.value = true;
  emit('complete', wrong.size === 0);
}

function tryAgain() {
  reset();
}

const allFilled = computed(() => filled.value.every((f) => f !== null));
const isPerfect = computed(() => submitted.value && wrongIndexes.value.size === 0);

function classForBlank(blankIndex: number): string {
  if (!submitted.value) return filled.value[blankIndex] !== null ? 'lesson__blank--filled' : '';
  return wrongIndexes.value.has(blankIndex) ? 'lesson__blank--wrong' : 'lesson__blank--filled';
}
</script>

<template>
  <div class="lesson">
    <p v-if="lesson.hint" class="lesson__hint">💡 {{ lesson.hint }}</p>

    <div class="code-block" style="white-space: pre-wrap">
      <span class="code-block__lang">{{ lesson.language }}</span>
      <template v-for="(token, ti) in tokens" :key="ti">
        <template v-if="token.kind === 'text'">{{ token.value }}</template>
        <button
          v-else
          class="lesson__blank"
          :class="classForBlank(Number(token.value) - 1)"
          :disabled="submitted"
          @click="clearBlank(Number(token.value) - 1)"
        >{{ filled[Number(token.value) - 1] ?? `?${token.value}` }}</button>
      </template>
    </div>

    <div>
      <div class="text-xs uppercase tracking-widest text-ink-400 mb-2">Choice bank</div>
      <div class="lesson__choice-bank">
        <button
          v-for="(c, ci) in choices"
          :key="ci"
          class="lesson__choice"
          :class="{ 'lesson__choice--used': usedChoiceIndexes.has(ci) }"
          :disabled="submitted || usedChoiceIndexes.has(ci)"
          @click="pickChoice(ci)"
        >
          {{ c }}
        </button>
      </div>
    </div>

    <div v-if="submitted" class="lesson__feedback" :class="isPerfect ? 'lesson__feedback--correct' : 'lesson__feedback--wrong'">
      <template v-if="isPerfect">✅ All blanks correct.</template>
      <template v-else>
        ❌ {{ wrongIndexes.size }} blank(s) wrong. Expected:
        <ul class="mt-2 list-disc pl-5">
          <li v-for="i in [...wrongIndexes].sort((a, b) => a - b)" :key="i">
            blank #{{ i + 1 }} → <code>{{ lesson.answers[i] }}</code>
          </li>
        </ul>
      </template>
    </div>

    <div class="flex gap-3">
      <button v-if="!submitted" class="btn btn--primary" :disabled="!allFilled" @click="check">Check answers</button>
      <template v-else>
        <button v-if="!isPerfect" class="btn" @click="tryAgain">Try again</button>
        <button class="btn btn--primary" @click="emit('next')">Next lesson →</button>
      </template>
    </div>
  </div>
</template>
