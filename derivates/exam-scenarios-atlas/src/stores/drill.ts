import { defineStore } from 'pinia'
import { DRILL_ITEMS, type DrillItem } from '../data/drill'
import { load, save } from './persist'

const KEY = 'esa:drill:v1'

interface Bucket {
  attempts: number
  correct: number
}

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

function shuffled<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const useDrillStore = defineStore('drill', {
  state: () => ({
    stats: load<DrillStats>(KEY, emptyStats()),
    phase: 'idle' as 'idle' | 'running' | 'done',
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
    startRun() {
      this.order = shuffled(DRILL_ITEMS).map((i) => i.id)
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
