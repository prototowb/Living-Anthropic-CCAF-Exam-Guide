import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import BlanksLesson from '@/components/lessons/BlanksLesson.vue';
import type { BlanksLesson as BlanksLessonData } from '@/data/lessons';

const lesson: BlanksLessonData = {
  id: 'test-blanks',
  title: 'Test blanks',
  domainId: 'd1',
  format: 'blanks',
  language: 'ts',
  prompt: 'Fill in the blanks.',
  template: 'const {{1}} = {{2}};',
  answers: ['alpha', 'beta'],
  choices: ['beta', 'alpha', 'decoy'],
};

// The component parses its template in onMounted — wait a tick for the DOM.
async function mountLesson() {
  const wrapper = mount(BlanksLesson, { props: { lesson } });
  await nextTick();
  return wrapper;
}

function choiceButton(wrapper: Awaited<ReturnType<typeof mountLesson>>, text: string) {
  return wrapper.findAll('.lesson__choice').find((b) => b.text() === text)!;
}

function checkButton(wrapper: Awaited<ReturnType<typeof mountLesson>>) {
  return wrapper.findAll('button').find((b) => b.text() === 'Check answers')!;
}

describe('BlanksLesson', () => {
  it('renders one blank per placeholder and check stays disabled until all are filled', async () => {
    const wrapper = await mountLesson();
    expect(wrapper.findAll('.lesson__blank')).toHaveLength(2);
    expect(checkButton(wrapper).attributes('disabled')).toBeDefined();
    await choiceButton(wrapper, 'alpha').trigger('click');
    expect(checkButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('picked choices fill blanks in order and are marked used', async () => {
    const wrapper = await mountLesson();
    await choiceButton(wrapper, 'alpha').trigger('click');
    const blanks = wrapper.findAll('.lesson__blank');
    expect(blanks[0].text()).toBe('alpha');
    expect(blanks[1].text()).toBe('?2');
    expect(choiceButton(wrapper, 'alpha').classes()).toContain('lesson__choice--used');
  });

  it('clicking a filled blank frees it and its choice', async () => {
    const wrapper = await mountLesson();
    await choiceButton(wrapper, 'alpha').trigger('click');
    await wrapper.findAll('.lesson__blank')[0].trigger('click');
    expect(wrapper.findAll('.lesson__blank')[0].text()).toBe('?1');
    expect(choiceButton(wrapper, 'alpha').classes()).not.toContain('lesson__choice--used');
  });

  it('emits complete(true) when every blank matches', async () => {
    const wrapper = await mountLesson();
    await choiceButton(wrapper, 'alpha').trigger('click');
    await choiceButton(wrapper, 'beta').trigger('click');
    await checkButton(wrapper).trigger('click');
    expect(wrapper.emitted('complete')).toEqual([[true]]);
    expect(wrapper.text()).toContain('All blanks correct');
  });

  it('emits complete(false) with the expected answers listed, try again resets', async () => {
    const wrapper = await mountLesson();
    await choiceButton(wrapper, 'decoy').trigger('click');
    await choiceButton(wrapper, 'beta').trigger('click');
    await checkButton(wrapper).trigger('click');
    expect(wrapper.emitted('complete')).toEqual([[false]]);
    expect(wrapper.text()).toContain('1 blank(s) wrong');
    expect(wrapper.text()).toContain('alpha');

    const tryAgain = wrapper.findAll('button').find((b) => b.text() === 'Try again')!;
    await tryAgain.trigger('click');
    expect(wrapper.findAll('.lesson__blank')[0].text()).toBe('?1');
    expect(wrapper.find('.lesson__feedback').exists()).toBe(false);
  });
});
