// Public domain content entry point. The actual pattern data lives in
// `src/data/domain-content/<dN>.ts` and is assembled in
// `src/data/domain-content/index.ts`. This module re-exports so existing
// imports of `@/data/domains` keep working.

export { domains, getDomain } from './domain-content';
export type {
  Domain,
  DomainPattern,
  PatternType,
  SandboxKey,
  AntiPattern,
  QuizQuestionRef,
  BadgeClass,
} from './domain-content/types';
