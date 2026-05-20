// Few-shot examples for glossary extraction. Architect TS 4.2 mandates 2-4
// worked examples for ambiguous extraction — we ship 2 here covering single-
// term and multi-alias shapes.
//
// The `assistant` field is a JSON string matching `glossaryDocumentSchema`.

import type { FewShotExample } from '../lib/types';
import { GLOSSARY_SCHEMA_VERSION } from '../schemas/glossary';

const PROV = (path: string) => ({
  sourcePath: path,
  sourceHash: 'a'.repeat(64),
  extractedAt: '2026-01-01T00:00:00.000Z',
  schemaVersion: GLOSSARY_SCHEMA_VERSION,
});

export const GLOSSARY_FEWSHOT: FewShotExample[] = [
  {
    user:
      '# Glossary\n\n## Permission prompt\n\nThe dialog Claude Code shows the first time it wants to use a tool in your project — Read, Edit, Bash, etc.\n',
    assistant: JSON.stringify({
      entries: [
        {
          term: 'Permission prompt',
          definition:
            "The dialog Claude Code shows the first time it wants to use a tool in your project — Read, Edit, Bash, etc. You answer once and your choice persists for the session.",
          rung: 'B',
          stageId: 's2',
          _provenance: PROV('docs/extraction-sources/glossary.md'),
        },
      ],
    }),
  },
  {
    user:
      '# Glossary\n\n## Plan mode\n\nA permission mode (also: "plan" mode) that lets Claude only read and search the codebase — no edits or shell. Good for unfamiliar repos.\n',
    assistant: JSON.stringify({
      entries: [
        {
          term: 'Plan mode',
          definition:
            'A permission mode that lets Claude only read and search the codebase — no edits or shell. Good for scoping a multi-file change before touching anything.',
          aliases: ['plan'],
          rung: 'I',
          stageId: 's3',
          _provenance: PROV('docs/extraction-sources/glossary.md'),
        },
      ],
    }),
  },
];
