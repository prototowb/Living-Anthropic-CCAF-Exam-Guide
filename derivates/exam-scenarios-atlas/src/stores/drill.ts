import { defineStore } from 'pinia'
import { DRILL_ITEMS, weightedOrder, type DrillItem, type DrillBucket } from '../data/drill'
import { load, save } from './persist'

const KEY = 'esa:drill:v1'

type Bucket = DrillBucket

/** Persisted aggregate stats (per plan §9.2: only aggregates persist — runs reset). */
interface DrillStats {
  attempts: number
  correct: number
  byScenario: Record<number, Bucket>
  byDomain: Record<number, Bucket>
  /** Most recent runs, newest first, capped. */
  runs: Array<{ total: number; correct: number; at: string }>
}

interface RunAnswer {
  itemId: string
  picked: number
  correct: boolean
}

const emptyStats = (): DrillStats => ({
  attempts: 0,
  correct: 0,
  byScenario: {},
  byDomain: {},
  runs: [],
})

/**
 * localStorage may hold valid JSON of the wrong shape (older versions,
 * manual edits, other tools). Every field is rebuilt defensively — a
 * partial or poisoned value must degrade to empty, never crash a view.
 */
function toBucket(raw: unknown): Bucket | null {
  if (typeof raw !== 'object' || raw === null) return null
  const attempts = Number((raw as Bucket).attempts)
  const correct = Number((raw as Bucket).correct)
  if (!Number.isFinite(attempts) || !Number.isFinite(correct) || attempts < 0 || correct < 0)
    return null
  return { attempts, correct: Math.min(correct, attempts) }
}

function normalizeStats(raw: unknown): DrillStats {
  const stats = emptyStats()
  if (typeof raw !== 'object' || raw === null) return stats
  const r = raw as Record<string, unknown>
  const attempts = Number(r.attempts)
  const correct = Number(r.correct)
  if (Number.isFinite(attempts) && attempts >= 0) stats.attempts = attempts
  if (Number.isFinite(correct) && correct >= 0) stats.correct = Math.min(correct, stats.attempts)
  for (const [src, dst] of [
    [r.byScenario, stats.byScenario],
    [r.byDomain, stats.byDomain],
  ] as const) {
    if (typeof src !== 'object' || src === null) continue
    for (const [key, value] of Object.entries(src)) {
      const bucket = toBucket(value)
      if (bucket && Number.isInteger(Number(key))) dst[Number(key)] = bucket
    }
  }
  if (Array.isArray(r.runs)) {
    stats.runs = r.runs
      .filter(
        (run): run is DrillStats['runs'][number] =>
          typeof run === 'object' &&
          run !== null &&
          Number.isFinite(Number((run as { total: unknown }).total)) &&
          Number.isFinite(Number((run as { correct: unknown }).correct)),
      )
      .slice(0, 20)
  }
  return stats
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** What a run is focused on: everything, weak spots, or one scenario's items. */
export type RunFocus = 'all' | 'weak' | number

export const useDrillStore = defineStore('drill', {
  state: () => ({
    stats: normalizeStats(load<unknown>(KEY, null)),
    phase: 'idle' as 'idle' | 'running' | 'done',
    focus: 'all' as RunFocus,
    order: [] as string[],
    index: 0,
    answers: [] as RunAnswer[],
    /** Learner's pick for the current item; null until answered. */
    picked: null as number | null,
  }),

  getters: {
    current(state): DrillItem | null {
      const id = state.order[state.index]
      return DRILL_ITEMS.find((i) => i.id === id) ?? null
    },
    runCorrect(state): number {
      return state.answers.filter((a) => a.correct).length
    },
    revealed(state): boolean {
      return state.picked !== null
    },
    accuracy(state): number | null {
      return state.stats.attempts === 0
        ? null
        : Math.round((100 * state.stats.correct) / state.stats.attempts)
    },
  },

  actions: {
    startRun(focus: RunFocus = 'all') {
      let items: DrillItem[]
      if (typeof focus === 'number') {
        items = shuffled(DRILL_ITEMS.filter((i) => i.ask === 'scenario' && i.answer === focus))
      } else if (focus === 'weak') {
        items = weightedOrder(DRILL_ITEMS, this.stats)
      } else {
        items = shuffled(DRILL_ITEMS)
      }
      if (!items.length) return
      this.focus = focus
      this.order = items.map((i) => i.id)
      this.index = 0
      this.answers = []
      this.picked = null
      this.phase = 'running'
    },

    answer(picked: number) {
      const item = this.current
      if (!item || this.picked !== null) return
      this.picked = picked
      const correct = picked === item.answer
      this.answers.push({ itemId: item.id, picked, correct })

      this.stats.attempts += 1
      if (correct) this.stats.correct += 1
      const bucket = item.ask === 'scenario' ? this.stats.byScenario : this.stats.byDomain
      const b = (bucket[item.answer] ??= { attempts: 0, correct: 0 })
      b.attempts += 1
      if (correct) b.correct += 1
      save(KEY, this.stats)
    },

    next() {
      if (this.picked === null) return
      if (this.index + 1 >= this.order.length) {
        this.stats.runs.unshift({
          total: this.order.length,
          correct: this.runCorrect,
          at: new Date().toISOString(),
        })
        this.stats.runs = this.stats.runs.slice(0, 20)
        save(KEY, this.stats)
        this.phase = 'done'
      } else {
        this.index += 1
        this.picked = null
      }
    },

    reset() {
      this.phase = 'idle'
    },
  },
})
