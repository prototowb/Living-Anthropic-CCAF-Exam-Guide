import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import McqLesson from '@/components/lessons/McqLesson.vue';
import type { McqLesson as McqLessonData } from '@/data/lessons';

const lesson: McqLessonData = {
  id: 'test-mcq',
  title: 'Test MCQ',
  domainId: 'd1',
  format: 'mcq',
  prompt: 'Pick the right answer.',
  options: [
    { letter: 'A', text: 'wrong one' },
    { letter: 'B', text: 'right one' },
    { letter: 'C', text: 'also wrong' },
    { letter: 'D', text: 'nope' },
  ],
  correct: 'B',
  explanation: 'B is right because the test says so.',
};

function mountLesson() {
  return mount(McqLesson, { props: { lesson } });
}

async function pickAndCheck(wrapper: Awaited<ReturnType<typeof mountLesson>>, letter: string) {
  const option = wrapper
    .findAll('.quiz-question__option')
    .find((b) => b.find('.quiz-question__option-letter').text() === letter)!;
  await option.trigger('click');
  const check = wrapper.findAll('button').find((b) => b.text() === 'Check answer')!;
  await check.trigger('click');
}

describe('McqLesson', () => {
  it('check is disabled until an option is picked', async () => {
    const wrapper = await mountLesson();
    const check = wrapper.findAll('button').find((b) => b.text() === 'Check answer')!;
    expect(check.attributes('disabled')).toBeDefined();
  });

  it('emits complete(true) and shows the explanation on a correct pick', async () => {
    const wrapper = await mountLesson();
    await pickAndCheck(wrapper, 'B');
    expect(wrapper.emitted('complete')).toEqual([[true]]);
    expect(wrapper.text()).toContain('✓ Correct');
    expect(wrapper.text()).toContain(lesson.explanation);
  });

  it('emits complete(false) on a wrong pick and try-again resets', async () => {
    const wrapper = await mountLesson();
    await pickAndCheck(wrapper, 'A');
    expect(wrapper.emitted('complete')).toEqual([[false]]);
    expect(wrapper.text()).toContain('✗ Expected B');

    const tryAgain = wrapper.findAll('button').find((b) => b.text() === 'Try again')!;
    await tryAgain.trigger('click');
    expect(wrapper.text()).not.toContain('Expected B');
    expect(wrapper.find('.quiz-question__option--selected').exists()).toBe(false);
  });

  it('emits next after submitting', async () => {
    const wrapper = await mountLesson();
    await pickAndCheck(wrapper, 'B');
    const next = wrapper.findAll('button').find((b) => b.text().includes('Next lesson'))!;
    await next.trigger('click');
    expect(wrapper.emitted('next')).toHaveLength(1);
  });
});
