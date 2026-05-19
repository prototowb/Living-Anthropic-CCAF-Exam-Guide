// Shared types for the domain / pattern content. Imported by each `dN.ts`
// file and re-exported from `src/data/domains.ts`.

export type PatternType =
  | 'architectural'
  | 'tooling'
  | 'prompt'
  | 'reliability'
  | 'config';

export type SandboxKey =
  | 'context-pruner'
  | 'structured-errors'
  | 'few-shot-routing'
  | 'hub-and-spoke-timeline';

export interface AntiPattern {
  title: string;
  badCode: string;
  language: string;
  failureMode: string;
}

export interface QuizQuestionRef {
  sectionId: string;
  questionId: number;
}

export interface DomainPattern {
  id: string;
  title: string;
  summary: string;
  source: string;
  codeSnippet: string;
  language: string;

  // Maps to the canonical task statement in the exam guide (e.g. "1.2", "5.6").
  taskRef: string;
  type: PatternType;
  tags: string[];
  // Sibling-pattern ids; rendered as chips on the detail page.
  related: string[];

  // Optional "don't do this" foil — code that looks plausible but breaks the
  // mandate, plus the failure mode it produces.
  antiPattern?: AntiPattern;

  // When present, PatternView mounts the matching live demo component.
  sandbox?: SandboxKey;

  // Quiz items embedded inline on the pattern detail page (answer-reveal UI).
  quizQuestionRefs?: QuizQuestionRef[];
}

export type BadgeClass =
  | 'domain-ci'
  | 'domain-support'
  | 'domain-codegen'
  | 'domain-ops';

export interface Domain {
  id: string;
  number: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  badgeClass: BadgeClass;
  patterns: DomainPattern[];
  relatedQuiz: { sectionId: string; questionIds: number[] }[];
}
