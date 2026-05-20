// Shared types for the content layer. No side effects, no imports from other
// app modules — pure data shapes. Mirrors the parent's `src/data/types.ts`
// philosophy: stable, typed content; views read; nothing mutates.

export type Rung = 'B' | 'I' | 'A';

/** One of the 8 beginner-curriculum stages. See PROJECT_PLAN.md §3. */
export interface Stage {
  id: string;
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  /** One-sentence pitch shown on the index card. */
  pitch: string;
  /** The anchor question this stage teaches the learner to answer. */
  anchorQuestion: string;
  /** Rungs covered. */
  rungs: Rung[];
  /** Markdown body of the stage page. */
  body: string;
  /** Ids of lessons that anchor to this stage. */
  lessonIds: string[];
  /** Quiz section id for this stage (mirrors stage id). */
  quizSectionId: string;
  /** Optional sandbox id. */
  sandboxId?: string;
}

export type LessonFormat = 'reorder' | 'blanks' | 'mcq' | 'flow-builder';

export interface LessonBase {
  id: string;
  title: string;
  summary: string;
  stageId: string;
  rung: Rung;
  format: LessonFormat;
}

export interface ReorderLesson extends LessonBase {
  format: 'reorder';
  /** Canonical order. The runner shuffles. */
  steps: { id: string; label: string; rationale: string }[];
}

export interface BlanksLesson extends LessonBase {
  format: 'blanks';
  prompt: string;
  /** `{0}`, `{1}`, … placeholders in `prompt`. Each blank has options. */
  blanks: { options: string[]; correctIndex: number; explanation: string }[];
}

export interface McqLesson extends LessonBase {
  format: 'mcq';
  question: string;
  options: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface FlowBuilderLesson extends LessonBase {
  format: 'flow-builder';
  /** Cards the learner places into ordered slots. */
  cards: { id: string; label: string }[];
  /** Canonical order. */
  canonical: string[];
  rationale: string;
}

export type Lesson = ReorderLesson | BlanksLesson | McqLesson | FlowBuilderLesson;

export interface QuizOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: QuizOption[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  /** Optional explanation per wrong answer. */
  wrongExplanations?: Partial<Record<'A' | 'B' | 'C' | 'D', string>>;
  /** Stage this question anchors to. */
  stageId: string;
  rung: Rung;
}

export interface QuizSection {
  id: string;
  title: string;
  stageId: string;
  questions: QuizQuestion[];
}
