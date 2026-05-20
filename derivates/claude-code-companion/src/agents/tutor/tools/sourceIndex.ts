// In-browser source index used by the codebase-researcher subagent
// (Architect Scenario 4 — Developer Productivity; TS 5.4 "manage context in
// large codebase exploration").
//
// Strategy: Vite's `import.meta.glob` with `?raw` materialises every matching
// `.ts` / `.vue` file as a string at build time. The dynamic-import lookup
// table is *eagerly* populated so callers don't pay per-file await latency,
// but the whole module is route-split (only loaded on /tutor) so users who
// never touch the Tutor don't pay the bundle weight.
//
// Filtering rules (matching the v0.2 scope in sprints/scenario-4-…md):
//   - include  src/**/*.ts and src/**/*.vue
//   - exclude  src/data/_generated/** (re-generation churn; not authored)
//   - exclude  src/agents/tutor/tools/sourceIndex.ts itself (the index would
//              recursively contain itself, doubling its weight)
//   - exclude  any path matching /\.test\./ or /__fixtures__/

export interface SourceFile {
  path: string;
  content: string;
  lines: number;
  lang: 'ts' | 'vue';
}

// Vite typing wart: `import.meta.glob` with `as: 'raw'` is the legacy form;
// the new form is `{ query: '?raw', import: 'default' }`. Either compiles to
// the same shape — a Record of { path → string } when `eager: true`.
const RAW_FILES = import.meta.glob('/src/**/*.{ts,vue}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function shouldExclude(path: string): boolean {
  if (path.includes('/_generated/')) return true;
  if (path.includes('/__fixtures__/')) return true;
  if (path.includes('.test.')) return true;
  // Self-reference guard.
  if (path.endsWith('/tutor/tools/sourceIndex.ts')) return true;
  return false;
}

function buildIndex(): Map<string, SourceFile> {
  const out = new Map<string, SourceFile>();
  for (const [rawPath, content] of Object.entries(RAW_FILES)) {
    if (shouldExclude(rawPath)) continue;
    // import.meta.glob keys are absolute from project root (/src/...).
    // Normalise to "src/..." so callers don't need leading-slash awareness.
    const path = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const lang: SourceFile['lang'] = path.endsWith('.vue') ? 'vue' : 'ts';
    const lines = content.split('\n').length;
    out.set(path, { path, content, lines, lang });
  }
  return out;
}

const INDEX = buildIndex();

/** Sorted list of every indexed path. Used by globPaths + diagnostics. */
export function listPaths(): string[] {
  return [...INDEX.keys()].sort();
}

/** Fetch a single file by indexed path. */
export function getFile(path: string): SourceFile | undefined {
  return INDEX.get(path);
}

/** Number of files indexed. Used by the under-the-hood diagnostics card. */
export function indexedFileCount(): number {
  return INDEX.size;
}

/** Approximate bytes of source content. Used by the bundle-size sanity check
 *  in dev mode — NOT a substitute for the build-time gzip check. */
export function indexedByteSize(): number {
  let total = 0;
  for (const file of INDEX.values()) total += file.content.length;
  return total;
}

/**
 * Glob match — minimal double-star (any-depth) and single-star (within-segment).
 * Sufficient for the patterns researcher tools accept (e.g. patterns like
 * `src/agents/&#42;&#42;/*.ts`). Anything more complex defers to a real regex
 * via `grepSource`.
 */
export function matchGlob(glob: string, path: string): boolean {
  const pattern =
    '^' +
    glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*\//g, '§§§')
      .replace(/\*\*/g, '§§§')
      .replace(/\*/g, '[^/]*')
      .replace(/§§§/g, '(?:.*/)?') +
    '$';
  return new RegExp(pattern).test(path);
}
