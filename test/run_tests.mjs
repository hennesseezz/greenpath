/**
 * test/run_tests.mjs
 *
 * Minimal unit test suite for Dijkstra (Algorithm A) and Bellman-Ford (Algorithm B).
 * Runs entirely in Node.js — no test framework required.
 *
 * Usage:
 *   node test/run_tests.mjs
 *
 * Exit code 0 = all tests passed. Exit code 1 = one or more failures.
 */

import { dijkstra, bellmanFord, reconstructPath } from '../src/lib/algorithms.js'

// ── Tiny test runner ──────────────────────────────────────────────────────────
let passed = 0, failed = 0

function expect(desc, actual, expected, tol = 0) {
  const ok = tol > 0
    ? Math.abs(actual - expected) <= tol
    : actual === expected
  if (ok) {
    console.log(`  ✓  ${desc}`)
    passed++
  } else {
    console.error(`  ✗  ${desc}`)
    console.error(`       expected: ${expected}`)
    console.error(`       received: ${actual}`)
    failed++
  }
}

function section(name) {
  console.log(`\n── ${name} ─────────────────────────────────────`)
}

// ── Graph builders ────────────────────────────────────────────────────────────
/**
 * Build a graph object compatible with dijkstra() and bellmanFord().
 * @param {number} N  vertex count
 * @param {[number,number,number][]} edgeList  array of [u, v, w]
 * @returns {{ N, adj, edges }}
 */
function makeGraph(N, edgeList) {
  const adj = Array.from({ length: N }, () => [])
  for (const [u, v, w] of edgeList) {
    adj[u].push([v, w])
  }
  return { N, adj, edges: edgeList }
}

// ── Test graphs ───────────────────────────────────────────────────────────────

/**
 * Classic 4-node directed graph.
 *
 *   0 ─1─► 1 ─5─► 3
 *   │       │
 *   4       2
 *   ▼       ▼
 *   2 ─1─► 3
 *
 * Shortest 0→3: 0→1→2→3  cost = 1+2+1 = 4  (not 0→1→3 = 1+5 = 6)
 */
const G1 = makeGraph(4, [
  [0, 1, 1],
  [0, 2, 4],
  [1, 2, 2],
  [1, 3, 5],
  [2, 3, 1],
])

/**
 * Linear chain: 0→1→2→3→4, each weight 10.
 * Only one path exists; cost = 40.
 */
const G2 = makeGraph(5, [
  [0, 1, 10],
  [1, 2, 10],
  [2, 3, 10],
  [3, 4, 10],
])

/**
 * Two disconnected components: {0,1} and {2,3}.
 * No path from 0 to 3.
 */
const G3 = makeGraph(4, [
  [0, 1, 1],
  [2, 3, 1],
])

/**
 * Single node, no edges.
 * dist(0→0) = 0.
 */
const G4 = makeGraph(1, [])

/**
 * Dense 5-node graph with a non-obvious shortest path.
 *
 *  0 ─10─► 1
 *  0 ─3──► 2 ─2──► 1 ─1──► 4
 *  0 ─99─► 4
 *
 * Shortest 0→4: 0→2→1→4 = 3+2+1 = 6
 */
const G5 = makeGraph(5, [
  [0, 1, 10],
  [0, 2, 3],
  [2, 1, 2],
  [1, 4, 1],
  [0, 4, 99],
])

// ── Dijkstra Tests ────────────────────────────────────────────────────────────
section('Dijkstra — Algorithm A')

{
  const { dist, prev } = dijkstra(G1, 0)
  expect('G1: dist(0→3) = 4', dist[3], 4, 1e-9)
  expect('G1: dist(0→1) = 1', dist[1], 1, 1e-9)
  expect('G1: dist(0→2) = 3', dist[2], 3, 1e-9)
  const path = reconstructPath(prev, 0, 3)
  expect('G1: path 0→3 = [0,1,2,3]', JSON.stringify(path), JSON.stringify([0,1,2,3]))
}

{
  const { dist } = dijkstra(G2, 0)
  expect('G2: linear chain dist(0→4) = 40', dist[4], 40, 1e-9)
}

{
  const { dist } = dijkstra(G3, 0)
  expect('G3: disconnected → dist(0→3) = Infinity', dist[3], Infinity)
  expect('G3: dist(0→1) = 1', dist[1], 1, 1e-9)
}

{
  const { dist } = dijkstra(G4, 0)
  expect('G4: single node dist(0→0) = 0', dist[0], 0, 1e-9)
}

{
  const { dist, prev } = dijkstra(G5, 0)
  expect('G5: dist(0→4) = 6 (non-greedy path)', dist[4], 6, 1e-9)
  const path = reconstructPath(prev, 0, 4)
  expect('G5: path 0→4 = [0,2,1,4]', JSON.stringify(path), JSON.stringify([0,2,1,4]))
}

// ── Dijkstra early-exit target ────────────────────────────────────────────────
{
  const { dist } = dijkstra(G1, 0, 3)
  expect('G1: early-exit at target still gives correct dist(0→3) = 4', dist[3], 4, 1e-9)
}

// ── Bellman-Ford Tests ────────────────────────────────────────────────────────
section('Bellman-Ford — Algorithm B')

{
  const { dist, prev } = bellmanFord(G1, 0)
  expect('G1: dist(0→3) = 4', dist[3], 4, 1e-9)
  expect('G1: dist(0→2) = 3', dist[2], 3, 1e-9)
  const path = reconstructPath(prev, 0, 3)
  expect('G1: path 0→3 = [0,1,2,3]', JSON.stringify(path), JSON.stringify([0,1,2,3]))
}

{
  const { dist } = bellmanFord(G2, 0)
  expect('G2: linear chain dist(0→4) = 40', dist[4], 40, 1e-9)
}

{
  const { dist } = bellmanFord(G3, 0)
  expect('G3: disconnected → dist(0→3) = Infinity', dist[3], Infinity)
}

{
  const { dist } = bellmanFord(G4, 0)
  expect('G4: single node dist(0→0) = 0', dist[0], 0, 1e-9)
}

{
  const { dist, prev } = bellmanFord(G5, 0)
  expect('G5: dist(0→4) = 6 (non-greedy path)', dist[4], 6, 1e-9)
  const path = reconstructPath(prev, 0, 4)
  expect('G5: path 0→4 = [0,2,1,4]', JSON.stringify(path), JSON.stringify([0,2,1,4]))
}

// ── Cross-check: Both algorithms must agree on generated graphs ───────────────
section('Cross-Check — Dijkstra vs Bellman-Ford (same cost)')

import('../src/lib/cityGenerator.js').then(({ generateCity }) => {
  const sizes = [25, 64, 100, 225]
  for (const n of sizes) {
    const g   = generateCity(n, 42)
    const src = 0, tgt = g.N - 1
    const { dist: dd } = dijkstra(g, src)
    const { dist: bd } = bellmanFord(g, src)
    const dCost  = dd[tgt]
    const bfCost = bd[tgt]
    const match  = Math.abs(dCost - bfCost) < 1e-4 * Math.max(1, dCost)
    expect(
      `Generated city n=${g.N}: Dijkstra cost == Bellman-Ford cost`,
      match, true
    )
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n══════════════════════════════════════════`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    console.error(`FAIL`)
    process.exit(1)
  } else {
    console.log(`PASS`)
    process.exit(0)
  }
})
