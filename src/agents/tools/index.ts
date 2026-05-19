export * from './types';
export * from './lookupQuestion';
export * from './lookupDomain';
export * from './searchPatterns';
export * from './gradeAnswer';
export * from './summarizeProgress';

import { lookupQuestionSpec } from './lookupQuestion';
import { lookupDomainSpec } from './lookupDomain';
import { searchPatternsSpec } from './searchPatterns';
import { gradeAnswerSpec } from './gradeAnswer';
import { summarizeProgressSpec } from './summarizeProgress';

export const toolSpecs = [
  lookupQuestionSpec,
  lookupDomainSpec,
  searchPatternsSpec,
  gradeAnswerSpec,
  summarizeProgressSpec,
] as const;
