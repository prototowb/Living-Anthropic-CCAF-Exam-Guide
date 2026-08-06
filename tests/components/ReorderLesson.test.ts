import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ReorderLesson from '@/components/lessons/ReorderLesson.vue';
import type { ReorderLesson as ReorderLessonData } from '@/data/lessons';

const lesson: ReorderLessonData = {
  id: 'test-reorder',
  title: 'Test reorder',
  domainId: 'd1',
  format: 'reorder',
  language: 'ts',
  prompt: 'Put the steps in order.',
  hint: 'first, second, third.',
  steps: [{ text: 'step-a' }, { text: 'step-b' }, { text: 'step-c' }],
};

// Math.random() = 0 makes the Fisher-Yates shuffle deterministic:
// [a,b,c] → swap(2,0) → [c,b,a] → swap(1,0) → [b,c,a].
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// The component shuffles its items in onMounted — wait a tick for the DOM.
async function mountLesson() {
  const wrapper = mount(ReorderLesson, { props: { lesson } });
  await nextTick();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountLesson>>;

function renderedOrder(wrapper: Wrapper): string[] {
  return wrapper.findAll('.lesson__reorder-item pre').map((p) => p.text());
}

function moveUpButton(wrapper: Wrapper, idx: number) {
  return wrapper.findAll('.lesson__reorder-item').at(idx)!.findAll('button')[0];
}

function checkButton(wrapper: Wrapper) {
  return wrapper.findAll('button').find((b) => b.text() === 'Check order')!;
}

describe('ReorderLesson', () => {
  it('shuffles the steps on mount (never the authored order)', async () => {
    const wrapper = await mountLesson();
    expect(renderedOrder(wrapper)).toEqual(['step-b', 'step-c', 'step-a']);
  });

  it('emits complete(false) and points at the first wrong position', async () => {
    const wrapper = await mountLesson();
    await checkButton(wrapper).trigger('click');
    expect(wrapper.emitted('complete')).toEqual([[false]]);
    expect(wrapper.text()).toContain('the order goes wrong at position 1');
  });

  it('move buttons reorder items; a sorted list emits complete(true)', async () => {
    const wrapper = await mountLesson();
    // [b,c,a] → move 'a' up twice → [a,b,c]
    await moveUpButton(wrapper, 2).trigger('click');
    await moveUpButton(wrapper, 1).trigger('click');
    expect(renderedOrder(wrapper)).toEqual(['step-a', 'step-b', 'step-c']);

    await checkButton(wrapper).trigger('click');
    expect(wrapper.emitted('complete')).toEqual([[true]]);
    expect(wrapper.text()).toContain('Perfect order');
  });

  it('try again reshuffles and re-enables checking', async () => {
    const wrapper = await mountLesson();
    await checkButton(wrapper).trigger('click');
    const tryAgain = wrapper.findAll('button').find((b) => b.text() === 'Try again')!;
    await tryAgain.trigger('click');
    expect(wrapper.find('.lesson__feedback').exists()).toBe(false);
    expect(checkButton(wrapper).exists()).toBe(true);
  });
});
