<script setup lang="ts">
// /prompt-dissection — Scenario 5 v0.4 task 9.
//
// The teaching artefact for the CI review prompt. Splits
// docs/CI_REVIEW_PROMPT.md by `## ` section heading and renders each section
// alongside a hand-authored annotation explaining WHY that clause exists.
//
// This view lives in the same "architect-substrate-visible" register as
// /under-the-hood. It names Scenario 5 explicitly, references TS mandates,
// and is intentionally not in the beginner voice. Standard surface views
// (HomeView, StageView, …) stay in beginner voice; this one does not.
//
// The prompt body is imported from a TS module rather than fetched at
// runtime so the bundle is deterministic and the build typechecks the
// shape we're rendering against.

import { computed } from 'vue';
import { ciReviewPromptBody, PROMPT_VERSION } from '@/data/_generated/ciReviewPrompt';
import MarkdownBlock from '@/components/MarkdownBlock.vue';

/** A single section of the prompt, hand-annotated. */
interface PromptSection {
  /** `## ` heading text — used to look up the matching slice of the prompt
   *  body. Must match the heading verbatim including punctuation. */
  heading: string;
  /** Hand-authored teaching note for this section. Why does this clause
   *  exist? What architect mandate is it serving? What false positive does
   *  it prevent? */
  annotation: string;
  /** Optional sub-bullets the right-hand column shows under the annotation. */
  bullets?: string[];
}

// The annotations live IN this view file (not in a separate data module) so
// the teaching narrative stays close to the rendering. Hand-curated — each
// note answers "why does this clause exist?" rather than restating the text.
const ANNOTATIONS: PromptSection[] = [
  {
    heading: 'Your role',
    annotation:
      'Generator-isolation guarantee (TS 3.6). The exam guide is explicit: "the same Claude session that generated code is less effective at reviewing its own changes." Stating "You did NOT write this code" inside the prompt is the prompt-level half of the guarantee; the CI workflow side spawns a fresh process per pass with no --resume.',
    bullets: [
      'Pairs with .github/workflows/claude-review.yml asserting fresh process IDs per pass.',
      'Without this clause, the reviewer rationalises the generator\'s decisions instead of stress-testing them.',
    ],
  },
  {
    heading: 'Scope — what you may review',
    annotation:
      'Bounds the review to touched files (TS 4.1). This is the single biggest false-positive lever in the prompt: most "hallucinated" findings come from the model commenting on architecture or directory layout it can see in CLAUDE.md but that the PR did not touch. The "+ prefix only" rule is mechanical and easy for the model to apply.',
    bullets: [
      'Belt-and-braces with the .claude/hooks/scope-guard.sh hook that refuses Edit/Write outside touched files.',
      'The workflow further drops any comment whose path is not in the touched-files set — three layers of enforcement.',
    ],
  },
  {
    heading: 'Review categories you MUST consider',
    annotation:
      'Names the rubric so the model does not invent categories (TS 4.1). Without an explicit list, models drift toward the categories they have the most training data on (usually "style"), which is the lowest-signal bucket. Listing security → correctness → performance → style in that order biases attention toward high-signal findings.',
    bullets: [
      'Style is included but explicitly fenced: only when style indicates a real defect.',
      'Each category has concrete keywords (eval, off-by-one, O(n²)) so the model knows what to look for.',
    ],
  },
  {
    heading: 'Categories you MUST NOT comment on',
    annotation:
      'False-positive minimisation by direct enumeration. The exam guide calls for "minimise false positives"; this section names the categories that produced the most noise on the docs/sample-prs corpus and forbids them outright. Pairs with the post-action filter: the CI workflow silently drops comments matching these patterns.',
    bullets: [
      'Includes the "telling the model how the post-action treats its output" technique — wasted budget trains contributors to ignore the bot.',
      'Test coverage is gated until v0.4 ships a coverage-delta tool (no comments without the underlying signal).',
    ],
  },
  {
    heading: 'Severity rubric — verbatim examples per bucket',
    annotation:
      'Calibration by worked example (TS 4.1, deepening task E). "Be conservative" and "high-confidence findings" are banned strings in this prompt — they\'re vague. Instead, every severity bucket gets at least one concrete TS code example so the model can pattern-match its finding to the rubric structurally rather than semantically.',
    bullets: [
      'Four blocker examples, two suggestion examples, one nit example — the asymmetry is intentional and signals what we care about.',
      'Each example carries an inline rationale in the comment, modelling the rationale field the model should emit.',
    ],
  },
  {
    heading: 'Do-not-approve gates',
    annotation:
      'Hard "do-not-approve" gate list (TS 4.1 deepening task E). These four findings always bind the verdict to request_changes — they cannot be relaxed by the model\'s judgement. Naming them verbatim removes the model\'s temptation to soften a blocker into a suggestion when the diff is otherwise clean.',
    bullets: [
      'Each gate is paired with a structural test (e.g. "value sourced from req.body") so the model can mechanically check.',
      'If none of (1)–(4) appear, the model may still choose approve or comment_only — the gate is a floor, not a ceiling.',
    ],
  },
  {
    heading: 'Output contract',
    annotation:
      'Structured-output schema gate (TS 5.5). The JSON shape matches src/agents/schemas/reviewOutput.ts byte-for-byte. confidence is required on every comment so v0.3\'s calibration sweep can stratify by severity bucket; promptVersion is required so a regression on the false-positive corpus can be correlated to the exact prompt revision (TS 3.6 prompt-drift correlation).',
    bullets: [
      '"Return ONLY the JSON object" is critical: any prose before/after breaks downstream parsing in the workflow.',
      'The schema is enforced post-hoc by Ajv (shared with Scenario 6\'s validator). The prompt encodes the same shape so failures are caught at validation, not at runtime.',
    ],
  },
  {
    heading: 'Final check before you emit',
    annotation:
      'Self-verification pass (TS 4.6 partial). A lightweight reasoning step before emission catches the "fabricated line number" failure mode that shows up on the planted-typo corpus. v0.3 task A elevates this from "model self-check" to "independent reviewer pass" by spawning a second Claude that filters the first pass\'s output.',
    bullets: [
      'Frames the check as a question ("does the diff actually contain the line I cite?") rather than an instruction.',
      'The docs/sample-prs corpus grades against exactly this self-check — the prompt and the test set are designed together.',
    ],
  },
];

/** Sections of the prompt body keyed by `## ` heading. The leading frontmatter
 *  block (everything up to the first `## ` line) is captured under the
 *  pseudo-heading `__intro__` so the view can render it as preamble. */
const sections = computed(() => {
  const lines = ciReviewPromptBody.split('\n');
  const out: { heading: string; body: string }[] = [];
  let currentHeading = '__intro__';
  let buf: string[] = [];
  for (const line of lines) {
    const m = /^## (.+?)\s*$/.exec(line);
    if (m) {
      out.push({ heading: currentHeading, body: buf.join('\n').trim() });
      currentHeading = m[1];
      buf = [];
    } else {
      buf.push(line);
    }
  }
  out.push({ heading: currentHeading, body: buf.join('\n').trim() });
  return out;
});

/** Resolve an annotation by heading; returns null if no annotation is
 *  registered (intro and frontmatter sections show prompt body only). */
function annotationFor(heading: string): PromptSection | null {
  return ANNOTATIONS.find((a) => a.heading === heading) ?? null;
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">/prompt-dissection</h1>
      <p class="text-ink-600 mt-1 max-w-3xl">
        The verbatim CI review prompt that ships in
        <code class="mono text-xs">docs/CI_REVIEW_PROMPT.md</code>, annotated
        clause by clause. This is the teaching artefact for Scenario 5 — every
        section names the architect mandate it serves and the false positive
        it prevents.
      </p>
      <p class="text-xs text-ink-500 mt-2 mono">
        Prompt version: {{ PROMPT_VERSION }} ·
        source: <code>docs/CI_REVIEW_PROMPT.md</code> ·
        consumed by <code>.github/workflows/claude-review.yml</code>
      </p>
    </header>

    <ol class="space-y-4">
      <li
        v-for="(section, idx) in sections"
        :key="idx"
        class="rounded-lg border border-ink-200 bg-white"
      >
        <div class="grid grid-cols-1 md:grid-cols-5 gap-0">
          <!-- Left column (3/5): prompt body for this section. -->
          <div class="md:col-span-3 p-4 border-r border-ink-100">
            <h2
              v-if="section.heading !== '__intro__'"
              class="text-base font-medium text-ink-900"
            >
              ## {{ section.heading }}
            </h2>
            <h2
              v-else
              class="text-xs uppercase tracking-wide text-ink-500"
            >
              Prompt frontmatter
            </h2>
            <div class="mt-2">
              <MarkdownBlock :source="section.body" />
            </div>
          </div>

          <!-- Right column (2/5): annotation. -->
          <aside class="md:col-span-2 p-4 bg-ink-50 text-sm text-ink-700">
            <template v-if="annotationFor(section.heading)">
              <h3 class="text-xs uppercase tracking-wide text-ink-500">
                Why this clause exists
              </h3>
              <p class="mt-2 text-ink-800">
                {{ annotationFor(section.heading)!.annotation }}
              </p>
              <ul
                v-if="annotationFor(section.heading)!.bullets?.length"
                class="mt-3 list-disc pl-5 space-y-1 text-ink-700"
              >
                <li
                  v-for="(b, j) in annotationFor(section.heading)!.bullets"
                  :key="j"
                >
                  {{ b }}
                </li>
              </ul>
            </template>
            <p v-else class="text-xs text-ink-500 italic">
              No annotation — this section is preamble or output-format detail.
            </p>
          </aside>
        </div>
      </li>
    </ol>

    <footer class="text-xs text-ink-500 pt-4 border-t border-ink-100">
      <p>
        Related: see
        <code class="mono">src/agents/schemas/reviewOutput.ts</code> for the
        output schema this prompt targets, and
        <code class="mono">docs/sample-prs/</code> for the false-positive
        corpus the prompt is graded against.
      </p>
    </footer>
  </section>
</template>
