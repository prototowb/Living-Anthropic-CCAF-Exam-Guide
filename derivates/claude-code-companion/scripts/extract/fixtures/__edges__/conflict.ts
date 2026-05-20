// Edge-case fixture: conflicting structure.
//
// The source contains internally contradictory information — two definitions
// for the same term, or two values for the same field. The pipeline emits 0
// entries plus a `conflict` classification (TS 4.4 — semantic self-validation,
// the `conflict_detected` skill bullet at the edge-case scale).

import type { ExtractionError } from '../../lib/types';

export interface ConflictEdgeFixture {
  source: string;
  response: {
    entries: never[];
    extractionError: ExtractionError;
  };
}

export const conflictFixture: ConflictEdgeFixture = {
  source:
    '# Glossary\n\n## CLAUDE.md\n\nA markdown file Claude Code reads at session start to learn your conventions.\n\n## CLAUDE.md\n\nA YAML file used to configure Claude permissions. Lives in `.claude/`.\n',
  response: {
    entries: [],
    extractionError: {
      kind: 'conflict',
      reason:
        'The term "CLAUDE.md" is defined twice with contradictory content (markdown convention file vs YAML permission config). Cannot emit either entry without resolving the conflict in source.',
    },
  },
};
