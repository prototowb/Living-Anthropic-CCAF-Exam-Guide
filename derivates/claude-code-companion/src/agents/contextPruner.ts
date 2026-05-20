// Context Pruning (Architect Scenarios 1 + 3 — Context Management & Reliability).
//
// Tool outputs are verbose. Drop any field longer than `budget` chars unless
// it is explicitly marked `keep` (by ending the key with '!').

export interface PruneOptions {
  budget?: number;
  alwaysKeep?: string[];
}

export function prune<T extends Record<string, unknown>>(
  obj: T,
  options: PruneOptions = {},
): Partial<T> {
  const { budget = 400, alwaysKeep = [] } = options;
  const out: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(obj)) {
    const explicitKeep = k.endsWith('!') || alwaysKeep.includes(k);

    if (v == null) {
      out[k] = v;
      continue;
    }

    if (typeof v === 'string') {
      if (explicitKeep || v.length <= budget) out[k] = v;
      else out[k] = `${v.slice(0, budget)}… [pruned ${v.length - budget} chars]`;
      continue;
    }

    if (Array.isArray(v)) {
      out[k] = v
        .slice(0, 8)
        .map((item) =>
          typeof item === 'object' && item !== null
            ? prune(item as Record<string, unknown>, options)
            : item,
        );
      continue;
    }

    if (typeof v === 'object') {
      out[k] = prune(v as Record<string, unknown>, options);
      continue;
    }

    out[k] = v;
  }

  return out as Partial<T>;
}
