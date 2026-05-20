// Sample CI review summaries — Scenario 5 v0.4.
//
// Hand-mirrors the four expected.json files under docs/sample-prs/. The
// browser bundle cannot read from `docs/` at runtime, so the Scenario 5 live
// demo on /under-the-hood imports these objects instead. The hand-mirror is
// deliberate — coupling these to the on-disk fixtures keeps the in-browser
// demo and the dry-run CLI showing the same canonical reviews.
//
// When a fixture's expected.json changes, update the matching record below.
// v0.5 will add an `npm run sync:sample-reviews` step that regenerates this
// file from docs/sample-prs/**/expected.json, mirroring Scenario 6's
// extraction pattern. Until then, hand-edit.
//
// Provenance for each record:
//   - sample-1-typo / sample-1-typo:
//       docs/sample-prs/sample-1-typo/expected.json
//   - sample-2-clean:
//       docs/sample-prs/sample-2-clean/expected.json
//   - sample-3-async:
//       docs/sample-prs/sample-3-async/expected.json
//   - sample-4-style-only:
//       docs/sample-prs/sample-4-style-only/expected.json

import type { ReviewSummary } from '@/agents/schemas/reviewOutput';

/** A sample fixture entry — `id` matches the directory name under
 *  docs/sample-prs/, `summary` is the verbatim expected.json structure. */
export interface SampleReviewFixture {
  id: string;
  /** Short, beginner-readable label for the demo card. */
  label: string;
  /** One-line description of what the fixture is showing. */
  description: string;
  /** The canonical ReviewSummary Claude should emit for this fixture. */
  summary: ReviewSummary;
}

export const sampleReviews: SampleReviewFixture[] = [
  {
    id: 'sample-1-typo',
    label: 'Typo bug — request changes',
    description:
      'Greeting function reads `user.nmae` instead of `user.name`; the diff renders `Hello, undefined`.',
    summary: {
      comments: [
        {
          path: 'src/services/userGreeter.ts',
          line: 10,
          severity: 'blocker',
          rationale:
            'Property typo: reads `user.nmae` but the `User` interface declares `name`. At runtime this is `undefined` and the greeting renders as `Hello, undefined (...)!`.',
          confidence: 0.98,
        },
      ],
      verdict: 'request_changes',
      confidence: 0.97,
      promptVersion: 'v1.0-2026-05-20',
    },
  },
  {
    id: 'sample-2-clean',
    label: 'Clean diff — approve',
    description: 'A correct refactor with no findings; the canonical clean baseline.',
    summary: {
      comments: [],
      verdict: 'approve',
      confidence: 0.92,
      promptVersion: 'v1.0-2026-05-20',
    },
  },
  {
    id: 'sample-3-async',
    label: 'Missing await — request changes',
    description: 'Caller reads `u.name` on the unawaited promise from `fetchUser(id)`.',
    summary: {
      comments: [
        {
          path: 'src/services/userFetcher.ts',
          line: 10,
          severity: 'blocker',
          rationale:
            'Missing `await`: `fetchUser(id)` returns Promise<User> but line 11 reads `u.name` and `u.email` on the Promise object, producing `undefined <undefined>` at runtime.',
          confidence: 0.97,
        },
      ],
      verdict: 'request_changes',
      confidence: 0.96,
      promptVersion: 'v1.0-2026-05-20',
    },
  },
  {
    id: 'sample-4-style-only',
    label: 'Style-only diff — approve',
    description:
      'Cosmetic-only changes (rename, formatting) that the prompt explicitly ignores; verdict approve.',
    summary: {
      comments: [],
      verdict: 'approve',
      confidence: 0.9,
      promptVersion: 'v1.0-2026-05-20',
    },
  },
];

/** Lookup helper used by the Scenario 5 live demo. Returns undefined if no
 *  fixture is registered for the given id. */
export function findSampleReview(id: string): SampleReviewFixture | undefined {
  return sampleReviews.find((f) => f.id === id);
}
