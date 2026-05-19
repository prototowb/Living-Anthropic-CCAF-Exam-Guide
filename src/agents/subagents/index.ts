export { explainer, type SubagentInvocation } from './explainer';
export { quizmaster } from './quizmaster';
export { codeReviewer } from './codeReviewer';

import { explainer } from './explainer';
import { quizmaster } from './quizmaster';
import { codeReviewer } from './codeReviewer';
import type { SubagentInvocation } from './explainer';
import type { SubagentName } from '@/agents/prompts/fewShot';

export const subagentRegistry: Record<SubagentName, (p: string) => Promise<SubagentInvocation>> = {
  explainer,
  quizmaster,
  'code-reviewer': codeReviewer,
};
