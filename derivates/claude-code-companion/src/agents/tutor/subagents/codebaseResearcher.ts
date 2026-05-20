// Codebase researcher subagent (Architect Scenario 4 — Developer Productivity).
//
// v0.2: deterministic routine — keyword grep → read top hits → cited reply.
// v0.3 upgrades:
//   - When the prompt names a valid JS/TS identifier (camelCase / PascalCase /
//     snake_case), try `search_symbol` first. Faster and more precise than
//     free-text grep, and emits the same `SourceCitation` shape.
//   - Populates the new `summary` field on `SubagentInvocation` (TS 5.4 —
//     context isolation in large-codebase exploration). Coordinator readers
//     can prefer the short form when context budget is tight.
//   - Capabilities-aware path: when `nativeToolUse === true` a future commit
//     will hand the tool roster to the model and read tool_use blocks back.
//     For v0.3 we still drive deterministically — the branch is scaffolded
//     so v0.4 can swap in model-driven dispatch without touching callers.

import type { SubagentInvocation } from './types';
import { grepSource, readSourceFile, searchSymbol } from '../tools';
import { tutorScratchpad } from '../../scratchpad';
import type { SourceCitation } from '@/agents/schemas';
import { getAdapter } from '@/sdk';

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','to','in','on','at','for','with','by','as','is','are','was','were','be','been','being','have','has','had','do','does','did','show','me','what','where','how','why','find','tell','about','this','that','these','those','it','its','our','your','their','i','you','we','they','can','could','should','would','will','shall','may','might','must','from','into','out','up','down','if','then','than','so','too','very','here','there','app','code','codebase','project','implement','implementation','please','again',
]);

/** Pull 2–5 keyword candidates from the prompt. */
function extractKeywords(prompt: string): string[] {
  const tokens = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\-_/.\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPattern(keywords: string[]): string {
  // Word-boundary OR of the keywords — broader keywords go later.
  return `\\b(?:${keywords.map(escapeForRegex).join('|')})\\b`;
}

function summariseCitations(citations: SourceCitation[]): string {
  if (citations.length === 0) {
    return "I couldn't find a strong match in the running app's source.";
  }
  const lines = citations.map(
    (c) => `- \`${c.path}:${c.line}\` — \`${c.preview.trim().slice(0, 100)}\``,
  );
  return `Found ${citations.length} place${citations.length > 1 ? 's' : ''} in this codebase:\n\n${lines.join('\n')}`;
}

/** Identify identifier-shaped tokens the user is likely asking us to find as
 *  symbols. `camelCase`, `PascalCase`, or `snake_case` with at least one
 *  internal capital or underscore (excludes plain English words). */
function findSymbolCandidates(prompt: string): string[] {
  const matches = prompt.match(/\b[A-Za-z_$][A-Za-z0-9_$]{2,}\b/g) ?? [];
  const out = matches.filter(
    (t) =>
      /[A-Z]/.test(t.slice(1)) || // camelCase / PascalCase
      t.includes('_'), //              snake_case
  );
  return [...new Set(out)].slice(0, 3);
}

/** Short reply summary (≤ 240 chars) for the new `SubagentInvocation.summary`
 *  field. v0.3 (Scenario 4 deepening task 3 / TS 5.4). */
function summariseForContext(
  citations: SourceCitation[],
  via: 'symbol' | 'grep' | 'none',
): string {
  if (citations.length === 0) return 'No source matches found.';
  const first = citations[0];
  const more = citations.length > 1 ? ` (+ ${citations.length - 1} more)` : '';
  return `Cited ${first.path}:${first.line}${more} via ${via}.`.slice(0, 240);
}

export async function codebaseResearcher(prompt: string): Promise<SubagentInvocation> {
  const start = performance.now();
  // Capabilities branch — read but not yet acted on (v0.4 scaffold).
  // Reading this here means `getAdapter` is a load-bearing import; the v0.4
  // commit that wires model-driven dispatch will use `caps.nativeToolUse`.
  const _caps = getAdapter().capabilities;
  void _caps;

  // v0.3 — symbol-first lookup when the prompt names an identifier.
  const symbolCandidates = findSymbolCandidates(prompt);
  const symbolToolCalls: { name: string; input: Record<string, unknown> }[] = [];
  for (const name of symbolCandidates) {
    const res = searchSymbol({ name });
    symbolToolCalls.push({ name: 'search_symbol', input: { name } });
    if (!res.isError && res.data.matches.length > 0) {
      const matches = res.data.matches.slice(0, 3);
      const enriched = await enrichWithReads(matches);
      const output = summariseCitations(enriched);
      const summary = summariseForContext(enriched, 'symbol');
      if (enriched.length > 0) {
        tutorScratchpad.append(
          `symbol "${name}" → ${enriched[0].path}:${enriched[0].line}`,
        );
      }
      return {
        name: 'codebase-researcher',
        durationMs: Math.round(performance.now() - start),
        output,
        summary,
        toolCalls: [
          ...symbolToolCalls,
          ...enriched.map((c) => ({
            name: 'cite' as const,
            input: c as unknown as Record<string, unknown>,
          })),
        ],
      };
    }
  }

  const keywords = extractKeywords(prompt);

  if (keywords.length === 0) {
    const output =
      'I need at least one specific term to search for (e.g. *"where is plan mode implemented?"* or *"show me the help bot escalation predicates"*).';
    return {
      name: 'codebase-researcher',
      durationMs: Math.round(performance.now() - start),
      output,
      summary: 'No usable keywords in prompt.',
      toolCalls: symbolToolCalls,
    };
  }

  // Step 1+2 — grep.
  const grepRes = grepSource({
    pattern: buildPattern(keywords),
    limit: 8,
  });

  if (grepRes.isError) {
    return {
      name: 'codebase-researcher',
      durationMs: Math.round(performance.now() - start),
      output: `Researcher couldn't form a useful search: ${grepRes.message}`,
      summary: `Grep failed: ${grepRes.message.slice(0, 180)}`,
      toolCalls: [
        ...symbolToolCalls,
        { name: 'grep_source', input: { pattern: keywords.join('|'), error: grepRes.message } },
      ],
    };
  }

  const topCitations = grepRes.data.matches.slice(0, 3);
  const enriched = await enrichWithReads(topCitations);
  const readToolCalls = topCitations.map((cite) => ({
    name: 'read_source_file',
    input: {
      path: cite.path,
      start: Math.max(1, cite.line - 3),
      end: cite.line + 8,
    },
  }));

  const output = summariseCitations(enriched);
  const summary = summariseForContext(enriched, 'grep');

  const citeToolCalls = enriched.map((c) => ({
    name: 'cite' as const,
    input: c as unknown as Record<string, unknown>,
  }));

  if (enriched.length > 0) {
    tutorScratchpad.append(
      `cited ${enriched[0].path}:${enriched[0].line} for "${prompt.slice(0, 50)}…"`,
    );
  }

  return {
    name: 'codebase-researcher',
    durationMs: Math.round(performance.now() - start),
    output,
    summary,
    toolCalls: [
      ...symbolToolCalls,
      { name: 'grep_source', input: { pattern: keywords.join('|'), matchCount: enriched.length } },
      ...readToolCalls,
      ...citeToolCalls,
    ],
  };
}

/** Read ±3 / ±8 lines around each citation. Pure function — extracted so the
 *  symbol-first path and the grep path can share it. */
async function enrichWithReads(citations: SourceCitation[]): Promise<SourceCitation[]> {
  const out: SourceCitation[] = [];
  for (const cite of citations) {
    const startLine = Math.max(1, cite.line - 3);
    const endLine = cite.line + 8;
    const readRes = readSourceFile({ path: cite.path, start: startLine, end: endLine });
    if (!readRes.isError) {
      out.push({ ...cite, preview: readRes.data.lines.join('\n') });
    } else {
      out.push(cite);
    }
  }
  return out;
}
