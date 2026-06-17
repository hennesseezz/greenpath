/**
 * bench/harness.mjs
 *
 * Headless benchmark harness — runs Dijkstra and Bellman-Ford across
 * multiple graph sizes and writes results to bench/results.csv.
 *
 * Usage (Node.js >= 18, no browser required):
 *   node bench/harness.mjs [--runs N] [--sizes 100,500,1000]
 *
 * Default: 3 runs per size, sizes = [100, 500, 1000, 2500, 5000, 10000]
 */

import { writeFileSync } from 'node:fs'
import { performance }   from 'node:perf_hooks'
import { generateCity, BENCHMARK_SIZES } from '../src/lib/cityGenerator.js'
import { dijkstra, bellmanFord }         from '../src/lib/algorithms.js'

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args   = process.argv.slice(2)
const runsArg  = args.find(a => a.startsWith('--runs='))
const sizesArg = args.find(a => a.startsWith('--sizes='))

const RUNS  = runsArg  ? parseInt(runsArg.split('=')[1])              : 3
const SIZES = sizesArg ? sizesArg.split('=')[1].split(',').map(Number) : BENCHMARK_SIZES

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Time a thunk (zero-argument function) and return elapsed milliseconds.
 * @param {() => void} fn
 * @returns {number} elapsed ms
 */
function timeMs(fn) {
  const t0 = performance.now()
  fn()
  return performance.now() - t0
}

/**
 * Check whether two cost values are within relative tolerance 1e-4.
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
function costsMatch(a, b) {
  if (!isFinite(a) && !isFinite(b)) return true
  if (!isFinite(a) || !isFinite(b)) return false
  return Math.abs(a - b) < 1e-4 * Math.max(1, a)
}

// ── Main benchmark loop ───────────────────────────────────────────────────────
console.log(`GreenPath Benchmark — ${RUNS} run(s) per size`)
console.log(`Sizes: ${SIZES.join(', ')}\n`)

const rows = []

for (let si = 0; si < SIZES.length; si++) {
  const n   = SIZES[si]
  const g   = generateCity(n, 42 + si)   // reproducible: same seed per size
  const src = 0
  const tgt = g.N - 1

  let dTotal = 0, bfTotal = 0
  let dCost  = Infinity, bfCost = Infinity
  let allMatch = true

  for (let r = 0; r < RUNS; r++) {
    let dd, bd

    dTotal  += timeMs(() => { dd = dijkstra(g, src)     })
    bfTotal += timeMs(() => { bd = bellmanFord(g, src)  })

    dCost  = dd.dist[tgt]
    bfCost = bd.dist[tgt]
    if (!costsMatch(dCost, bfCost)) allMatch = false
  }

  const dAvg  = dTotal  / RUNS
  const bfAvg = bfTotal / RUNS
  const speedup = bfAvg / dAvg

  const row = {
    n:          g.N,
    edges:      g.edges.length,
    dijkstra_ms:    +dAvg.toFixed(4),
    bellmanford_ms: +bfAvg.toFixed(4),
    speedup:        +speedup.toFixed(2),
    costs_match:    allMatch,
  }
  rows.push(row)

  console.log(
    `n=${String(g.N).padStart(6)}  edges=${String(g.edges.length).padStart(6)}` +
    `  Dijkstra=${dAvg.toFixed(2).padStart(8)} ms` +
    `  BF=${bfAvg.toFixed(2).padStart(8)} ms` +
    `  speedup=${speedup.toFixed(1).padStart(5)}x` +
    `  match=${allMatch ? '✓' : '✗'}`
  )
}

// ── Write CSV ─────────────────────────────────────────────────────────────────
const header = 'n,edges,dijkstra_ms,bellmanford_ms,speedup,costs_match'
const csvBody = rows.map(r =>
  `${r.n},${r.edges},${r.dijkstra_ms},${r.bellmanford_ms},${r.speedup},${r.costs_match}`
).join('\n')

const csvPath = new URL('./results.csv', import.meta.url).pathname.slice(1)  // strip leading /
writeFileSync(csvPath, header + '\n' + csvBody + '\n', 'utf8')

console.log(`\nResults written to bench/results.csv`)
console.log(`All costs matched: ${rows.every(r => r.costs_match) ? 'YES ✓' : 'NO ✗'}`)
