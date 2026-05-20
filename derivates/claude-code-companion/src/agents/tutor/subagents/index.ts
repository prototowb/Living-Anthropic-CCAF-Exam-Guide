import { explainer } from './explainer';
import { quizmaster } from './quizmaster';
import { codebaseResearcher } from './codebaseResearcher';
import { docSynthesiser } from './docSynthesiser';
import type { SubagentInvocation } from './types';
import type { TutorSubagentName } from '../prompts/fewShot';

export type { SubagentInvocation };

export const subagentRegistry: Record<
  TutorSubagentName,
  (p: string) => Promise<SubagentInvocation>
> = {
  explainer,
  quizmaster,
  'codebase-researcher': codebaseResearcher,
  'doc-synthesiser': docSynthesiser,
};
