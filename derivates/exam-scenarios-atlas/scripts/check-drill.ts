/**
 * Offline checks for the adaptive-drill logic (`npm run check:drill`).
 *
 * 1. Statistical: weightedOrder biases weak items early and stays uniform
 *    under flat weights.
 * 2. Corruption: itemWeight/weightedOrder never produce negative or NaN
 *    weights, lose items, or hang — whatever shape localStorage held.
 *
 * The browser never runs this file; it exists so the sampling behaviour is
 * verifiable without clicking through runs (the first-item distribution in
 * the UI is far too noisy to assert on).
 */
import { DRILL_ITEMS, itemWeight, weightedOrder, type DrillWeights } from '../src/data/drill'

let failed = 0
function check(label: string, pass: boolean, got?: unknown) {
  if (!pass) failed++
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}${pass ? '' : ` (got: ${JSON.stringify(got)})`}`)
}

// ── 1. Weighting bias ────────────────────────────────────────────────────
const mastered = { attempts: 2, correct: 2 }
const weakS1: DrillWeights = {
  byScenario: { 1: { attempts: 2, correct: 0 }, 2: mastered, 3: mastered, 4: mastered, 5: mastered, 6: mastered },
  byDomain: { 1: mastered, 2: mastered, 3: mastered, 4: mastered, 5: mastered },
}

const N = 5000
let s1Sum = 0
let restSum = 0
let s1Count = 0
let restCount = 0
for (let k = 0; k < N; k++) {
  const order = weightedOrder(DRILL_ITEMS, weakS1)
  if (order.length !== DRILL_ITEMS.length) {
    check('weightedOrder keeps all items', false, order.length)
    break
  }
  order.forEach((item, pos) => {
    if (item.ask === 'scenario' && item.answer === 1) {
      s1Sum += pos
      s1Count++
    } else {
      restSum += pos
      restCount++
    }
  })
}
const s1Avg = s1Sum / s1Count
const restAvg = restSum / restCount
check(
  `weak items surface early (S1 avg ${s1Avg.toFixed(2)} vs rest ${restAvg.toFixed(2)} over ${N} orderings)`,
  s1Avg < restAvg - 2,
  { s1Avg, restAvg },
)

let s1FlatSum = 0
for (let k = 0; k < N; k++) {
  weightedOrder(DRILL_ITEMS, { byScenario: {}, byDomain: {} }).forEach((item, pos) => {
    if (item.ask === 'scenario' && item.answer === 1) s1FlatSum += pos
  })
}
const s1FlatAvg = s1FlatSum / (2 * N)
check(`flat weights stay uniform (S1 avg ${s1FlatAvg.toFixed(2)} ≈ 8.5)`, Math.abs(s1FlatAvg - 8.5) < 0.5, s1FlatAvg)

// ── 2. Corruption safety ─────────────────────────────────────────────────
const s1item = DRILL_ITEMS.find((i) => i.ask === 'scenario' && i.answer === 1)!
const cases: Array<[string, DrillWeights]> = [
  ['correct > attempts', { byScenario: { 1: { attempts: 2, correct: 6 } }, byDomain: {} }],
  ['non-numeric attempts', { byScenario: { 1: { attempts: 'x' as unknown as number, correct: 1 } }, byDomain: {} }],
  ['negative attempts', { byScenario: { 1: { attempts: -3, correct: 0 } }, byDomain: {} }],
  ['missing maps', {} as DrillWeights],
]
for (const [label, stats] of cases) {
  const w = itemWeight(s1item, stats)
  check(`itemWeight in [1, 4] for ${label}`, Number.isFinite(w) && w >= 1 && w <= 4, w)
  const order = weightedOrder(DRILL_ITEMS, stats)
  const ids = new Set(order.map((i) => i.id))
  check(
    `weightedOrder intact for ${label}`,
    order.length === DRILL_ITEMS.length && ids.size === DRILL_ITEMS.length,
    order.length,
  )
}

check('weightedOrder([]) returns []', weightedOrder([], { byScenario: {}, byDomain: {} }).length === 0)

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll drill checks passed')
