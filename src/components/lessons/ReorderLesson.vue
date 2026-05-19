<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { ReorderLesson } from '@/data/lessons';

const props = defineProps<{ lesson: ReorderLesson }>();
const emit = defineEmits<{
  (e: 'complete', success: boolean): void;
  (e: 'next'): void;
}>();

interface OrderedStep {
  text: string;
  originalIndex: number;
}

const items = ref<OrderedStep[]>([]);
const submitted = ref(false);
const result = ref<{ correct: boolean; firstWrongIndex: number } | null>(null);

function shuffled(): OrderedStep[] {
  const indexed = props.lesson.steps.map((s, originalIndex) => ({ text: s.text, originalIndex }));
  // Fisher-Yates
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  // Guarantee we don't return the already-sorted order.
  if (indexed.every((s, i) => s.originalIndex === i)) {
    [indexed[0], indexed[indexed.length - 1]] = [indexed[indexed.length - 1], indexed[0]];
  }
  return indexed;
}

onMounted(() => {
  items.value = shuffled();
});

function move(idx: number, dir: 1 | -1) {
  if (submitted.value) return;
  const target = idx + dir;
  if (target < 0 || target >= items.value.length) return;
  const arr = [...items.value];
  [arr[idx], arr[target]] = [arr[target], arr[idx]];
  items.value = arr;
}

function check() {
  let firstWrong = -1;
  for (let i = 0; i < items.value.length; i++) {
    if (items.value[i].originalIndex !== i) {
      firstWrong = i;
      break;
    }
  }
  const correct = firstWrong === -1;
  submitted.value = true;
  result.value = { correct, firstWrongIndex: firstWrong };
  emit('complete', correct);
}

function tryAgain() {
  submitted.value = false;
  result.value = null;
  items.value = shuffled();
}

const itemClass = (idx: number) => {
  if (!submitted.value) return '';
  if (items.value[idx].originalIndex === idx) return 'lesson__reorder-item--correct';
  return 'lesson__reorder-item--wrong';
};

const isPerfect = computed(() => result.value?.correct === true);
</script>

<template>
  <div class="lesson">
    <p v-if="lesson.hint" class="lesson__hint">💡 {{ lesson.hint }}</p>

    <ol class="lesson__reorder-list">
      <li
        v-for="(item, idx) in items"
        :key="`${item.originalIndex}-${idx}`"
        class="lesson__reorder-item"
        :class="itemClass(idx)"
      >
        <span class="lesson__reorder-handle">⠿</span>
        <pre style="margin: 0; white-space: pre-wrap; flex: 1">{{ item.text }}</pre>
        <div class="lesson__reorder-controls">
          <button class="btn btn--ghost btn--sm" :disabled="submitted || idx === 0" @click="move(idx, -1)">▲</button>
          <button class="btn btn--ghost btn--sm" :disabled="submitted || idx === items.length - 1" @click="move(idx, 1)">▼</button>
        </div>
      </li>
    </ol>

    <div v-if="result" class="lesson__feedback" :class="isPerfect ? 'lesson__feedback--correct' : 'lesson__feedback--wrong'">
      <template v-if="isPerfect">✅ Perfect order. {{ lesson.hint ?? '' }}</template>
      <template v-else>
        ❌ Not yet — the order goes wrong at position {{ result.firstWrongIndex + 1 }}.
        <span v-if="lesson.hint"><br />Hint: {{ lesson.hint }}</span>
      </template>
    </div>

    <div class="flex gap-3">
      <button v-if="!submitted" class="btn btn--primary" @click="check">Check order</button>
      <template v-else>
        <button v-if="!isPerfect" class="btn" @click="tryAgain">Try again</button>
        <button class="btn btn--primary" @click="emit('next')">Next lesson →</button>
      </template>
    </div>
  </div>
</template>
