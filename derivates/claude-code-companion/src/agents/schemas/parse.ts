// Shared JSON-in-prose parser + retry-with-feedback loop.
// Architect TS 4.4 (validation / retry / feedback loops). Consumed by:
//   - Scenario 1 helpBot capabilities-aware dispatch (JSON-in-prose fallback)
//   - Scenario 3 tutor intent classifier (schemaMode=false fallback)
//   - Scenario 4 codebase-researcher (when capabilities.nativeToolUse=false)
//   - Scenario 6 extraction pipeline (api adapter retry loop)
//
// SYNTHESIS.md S-6 — factor once, consume everywhere; landing this means
// scenarios 1/3/4/6 don't each ship their own brittle JSON extractor.

/**
 * Extract the first balanced JSON object from a free-text string.
 * Tolerates leading prose, code fences, and trailing prose. Returns null if no
 * object can be balanced.
 *
 * @example
 *   extractFirstJsonObject('Here you go: {"x": 1, "y": [2,3]}. Done.')
 *   // => { x: 1, y: [2, 3] }
 */
export function extractFirstJsonObject(text: string): unknown | null {
  if (!text) return null;

  // Fast path — pure JSON.
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to balanced scan
    }
  }

  // Strip code fences if present — Claude often wraps JSON in ```json ... ```.
  const fenced = stripCodeFence(text);
  if (fenced !== text) {
    try {
      return JSON.parse(fenced.trim());
    } catch {
      /* fall through */
    }
  }

  // Balanced-brace scan — start at first '{', walk forward respecting strings.
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function stripCodeFence(text: string): string {
  const m = /```(?:json)?\s*\n([\s\S]*?)\n```/.exec(text);
  return m ? m[1] : text;
}

/**
 * Parse a model-emitted tool-call request from prose. Convention: the model
 * emits `{ "tool": "<name>", "input": { … } }` as a JSON object. Used by the
 * capabilities-aware fallback when `adapter.capabilities.nativeToolUse` is
 * false (small local models, mock adapter without tool_use).
 */
export function extractToolRequest(
  text: string,
): { name: string; input: Record<string, unknown> } | null {
  const obj = extractFirstJsonObject(text);
  if (!obj || typeof obj !== 'object') return null;
  const rec = obj as Record<string, unknown>;
  const name = rec.tool ?? rec.name;
  const input = rec.input ?? rec.arguments ?? {};
  if (typeof name !== 'string' || typeof input !== 'object' || input === null) {
    return null;
  }
  return { name, input: input as Record<string, unknown> };
}

/**
 * Retry-with-feedback loop. Architect TS 4.4 skill — *"appending specific
 * validation errors to the prompt on retry to guide the model toward
 * correction"*. The caller provides a `call(feedback)` function that issues
 * the underlying request (incorporating `feedback` into its prompt) and a
 * `validate` that returns either `T` or an `Error`.
 *
 * Default `maxRetries = 2` (so up to 3 total attempts) per deepening Gap-task D.
 */
export async function retryWithFeedback<T>(
  call: (feedback?: string) => Promise<string>,
  validate: (raw: string) => T | Error,
  maxRetries = 2,
): Promise<T | Error> {
  let lastError: Error | null = null;
  let lastRaw = '';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const feedback =
      lastError && attempt > 0
        ? `Your previous response was invalid: ${lastError.message}\nThe response was:\n${lastRaw.slice(0, 1200)}\nReturn ONLY a valid JSON object matching the schema.`
        : undefined;
    const raw = await call(feedback);
    const validated = validate(raw);
    if (!(validated instanceof Error)) {
      return validated;
    }
    lastError = validated;
    lastRaw = raw;
  }
  return lastError ?? new Error('retryWithFeedback exhausted without a validation result');
}
