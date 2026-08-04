// Versioned localStorage helper. Prefix `ccc:` (Claude Code Companion).
// Bump the `:v1` suffix per key on shape changes; old shapes drop on read.

const PREFIX = 'ccc:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or sandboxed — ignore */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* sandboxed — ignore */
  }
}
