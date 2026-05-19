// One job: fetch a domain study page.

import { getDomain, type Domain } from '@/data/domains';
import { fail, ok, type ToolResponse } from './types';

export interface LookupDomainArgs {
  id: string;
}

export async function lookupDomain(
  args: LookupDomainArgs,
): Promise<ToolResponse<Domain>> {
  const d = getDomain(args.id);
  if (!d) return fail('business', `Domain "${args.id}" not found`);
  return ok(d);
}

export const lookupDomainSpec = {
  name: 'lookup_domain',
  description:
    'Retrieve a single exam domain by id (d1..d5) or slug (e.g. "agentic-architecture"). Use when the user asks about a specific exam domain.',
  input_schema: {
    type: 'object' as const,
    required: ['id'] as const,
    properties: {
      id: { type: 'string' },
    },
  },
};
