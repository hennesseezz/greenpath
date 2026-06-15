/**
 * algorithms.js
 * Dijkstra (Algorithm A) and Bellman-Ford (Algorithm B) — both from scratch.
 *
 * Both solve single-source shortest path on the same graph instances,
 * enabling direct cost cross-checks (criterion A5).
 */

import { MinHeap } from './minHeap.js'

const INF = Infinity

// ─── PATH RECONSTRUCTION ──────────────────────────────────────────────────────
/** @returns {number[]} ordered vertex list from src to tgt, or [] if unreachable */
export function reconstructPath(prev, src, tgt) {
  const path = []
  let cur = tgt
  while (cur !== -1) {
    path.push(cur)
    if (cur === src) break
    cur = prev[cur]
  }
  if (!path.length || path[path.length - 1] !== src) return []
  return path.reverse()
}

// ─── DIJKSTRA ─────────────────────────────────────────────────────────────────
/**
 * Dijkstra's algorithm using a custom binary min-heap (lazy-deletion variant).
 *
 * Time  : O((V + E) log V)
 * Space : O(V + E)
 *
 * Correct because all edge weights w(e) ≥ 0 (guaranteed by carbon formula).
 *
 * @param {{ N: number, adj: [number,number][][] }} graph
 * @param {number} source
 * @returns {{ dist: Float64Array, prev: Int32Array, comparisons: number }}
 */
export function dijkstra(graph, source) {
  const { N, adj } = graph
  const dist = new Float64Array(N).fill(INF)
  const prev = new Int32Array(N).fill(-1)
  const visited = new Uint8Array(N)
  let comparisons = 0

  dist[source] = 0
  const heap = new MinHeap()
  heap.push(0, source)

  while (!heap.isEmpty()) {
    const [d, u] = heap.pop()
    if (visited[u]) continue
    visited[u] = 1

    for (const [v, w] of adj[u]) {
      comparisons++
      const t = d + w
      if (t < dist[v]) {
        dist[v] = t
        prev[v] = u
        heap.push(t, v) // lazy: stale entries stay, skipped when popped
      }
    }
  }

  return { dist, prev, comparisons }
}

// ─── BELLMAN-FORD ─────────────────────────────────────────────────────────────
/**
 * Bellman-Ford algorithm (edge-list relaxation).
 *
 * Time  : O(V · E)  — worst case; early termination when no relaxation occurs
 * Space : O(V + E)
 *
 * Handles negative-weight edges (unlike Dijkstra), demonstrating a
 * generality vs. speed trade-off.
 *
 * @param {{ N: number, edges: [number,number,number][] }} graph
 * @param {number} source
 * @returns {{ dist: Float64Array, prev: Int32Array, comparisons: number }}
 */
export function bellmanFord(graph, source) {
  const { N, edges } = graph
  const dist = new Float64Array(N).fill(INF)
  const prev = new Int32Array(N).fill(-1)
  let comparisons = 0

  dist[source] = 0

  for (let iter = 0; iter < N - 1; iter++) {
    let relaxed = false
    for (const [u, v, w] of edges) {
      comparisons++
      if (dist[u] < INF) {
        const t = dist[u] + w
        if (t < dist[v]) {
          dist[v] = t
          prev[v] = u
          relaxed = true
        }
      }
    }
    if (!relaxed) break // converged early
  }

  return { dist, prev, comparisons }
}

// ─── CONVENIENCE WRAPPERS ─────────────────────────────────────────────────────
/** @returns {{ cost: number, path: number[], timeMs: number, comparisons: number }} */
export function dijkstraQuery(graph, source, target) {
  const t0 = performance.now()
  const { dist, prev, comparisons } = dijkstra(graph, source)
  const timeMs = performance.now() - t0
  const cost = dist[target]
  const path = cost < INF ? reconstructPath(prev, source, target) : []
  return { cost, path, timeMs, comparisons }
}

/** @returns {{ cost: number, path: number[], timeMs: number, comparisons: number }} */
export function bellmanFordQuery(graph, source, target) {
  const t0 = performance.now()
  const { dist, prev, comparisons } = bellmanFord(graph, source)
  const timeMs = performance.now() - t0
  const cost = dist[target]
  const path = cost < INF ? reconstructPath(prev, source, target) : []
  return { cost, path, timeMs, comparisons }
}
