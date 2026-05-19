// One job: full-text search across all domain patterns.

import { domains, type DomainPattern } from '@/data/domains';
import { ok, type ToolResponse } from './types';

export interface SearchPatternsArgs {
  query: string;
  limit?: number;
}

export interface SearchHit {
  domainId: string;
  domainTitle: string;
  pattern: DomainPattern;
  score: number;
}

export async function searchPatterns(
  args: SearchPatternsArgs,
): Promise<ToolResponse<SearchHit[]>> {
  const q = args.query.trim().toLowerCase();
  const limit = args.limit ?? 6;
  if (!q) return ok([]);

  const hits: SearchHit[] = [];
  for (const d of domains) {
    for (const p of d.patterns) {
      const haystack = `${p.title} ${p.summary} ${p.codeSnippet}`.toLowerCase();
      let score = 0;
      for (const term of q.split(/\s+/)) {
        if (!term) continue;
        const count = haystack.split(term).length - 1;
        score += count;
      }
      if (score > 0) {
        hits.push({ domainId: d.id, domainTitle: d.title, pattern: p, score });
      }
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return ok(hits.slice(0, limit));
}

export const searchPatternsSpec = {
  name: 'search_patterns',
  description:
    'Search every architecture pattern (across all 5 domains) for a free-text query and return the best matches. Use when the user asks "where is X demonstrated" or for a concept they cannot place.',
  input_schema: {
    type: 'object' as const,
    required: ['query'] as const,
    properties: {
      query: { type: 'string', minLength: 2 },
      limit: { type: 'integer', minimum: 1, maximum: 20 },
    },
  },
};
