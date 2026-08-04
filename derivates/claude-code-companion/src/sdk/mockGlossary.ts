// Scripted glossary extraction for the mock adapter (v0.5).
//
// Until v0.4 the Scenario 6 live demo carried this markdown parser itself as
// a documented workaround: the mock claimed `schemaMode: true` but its
// jsonSchema branch only ever produced the Tutor intent shape, so the demo
// discarded the response and regex-parsed its own textarea. That made the
// mock's capability claim dishonest for every schema but one.
//
// Now the extraction lives where scripted behaviour belongs — inside the
// mock. mockAdapter keys on the schema title (`GlossaryDocument`) and returns
// `{ entries }` as `data`, so callers can branch on `capabilities.schemaMode`
// and consume `res.data` uniformly across mock, real, and local adapters.

export interface MockGlossaryEntry {
  term: string;
  definition: string;
  aliases?: string[];
  stageId?: string;
  rung: 'B' | 'I' | 'A';
}

/** Schema title the mock keys on. The Scenario 6 demo sends this. */
export const GLOSSARY_DOCUMENT_SCHEMA_TITLE = 'GlossaryDocument';

export function isGlossarySchema(schema: Record<string, unknown>): boolean {
  return schema.title === GLOSSARY_DOCUMENT_SCHEMA_TITLE;
}

/** Matches `## Term\n\nDefinition…` markdown blocks. */
export function parseGlossaryMarkdown(md: string): MockGlossaryEntry[] {
  const out: MockGlossaryEntry[] = [];
  const re = /^##\s+(.+?)\s*\n+([^\n][\s\S]*?)(?=\n##\s|\s*$)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const term = m[1].trim();
    const definition = m[2].trim().replace(/\s+/g, ' ');
    if (!term || definition.length < 1) continue;
    out.push({ term, definition, rung: guessRung(definition) });
  }
  return out;
}

// Cheap heuristic so the scripted extraction populates `rung` (a required
// field). A real model decides this from the definition's difficulty.
function guessRung(definition: string): 'B' | 'I' | 'A' {
  const lower = definition.toLowerCase();
  if (/ci|headless|grammar|json mode|webllm|ollama/.test(lower)) return 'A';
  if (/subagent|skill|mcp|hook|plan mode/.test(lower)) return 'I';
  return 'B';
}
