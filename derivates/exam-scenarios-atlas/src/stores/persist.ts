/**
 * Versioned localStorage helper. Keys follow `esa:<name>:v<N>` — bump the
 * version suffix on shape changes; stale versions are simply abandoned.
 */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota / private-mode failures are non-fatal: the app works session-only.
  }
}
