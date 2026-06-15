/**
 * cityGenerator.js
 * Generates reproducible synthetic directed weighted city graphs.
 *
 * Edge weight formula (carbon footprint in grams CO₂):
 *   w(e) = base_dist * traffic_mult + max(0, Δelev)²
 *
 * All weights are non-negative → safe for Dijkstra.
 */

function seededRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s ^ (s << 13)) >>> 0
    s = (s ^ (s >>> 17)) >>> 0
    s = (s ^ (s << 5)) >>> 0
    return s / 4294967296
  }
}

function lognorm(rng, sigma = 0.4) {
  // Box-Muller transform → log-normal with median 1.0
  const u1 = Math.max(rng(), 1e-10)
  const u2 = rng()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.exp(sigma * z)
}

function hypot2d(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Generate a directed city graph.
 * @param {number} n   Target vertex count (rounded up to next perfect square)
 * @param {number} seed  RNG seed for reproducibility
 * @returns {{ N, side, pos, elev, adj, edges }}
 */
export function generateCity(n, seed = 42) {
  const side = Math.ceil(Math.sqrt(n))
  const N = side * side
  const rng = seededRng(seed)
  const GS = 100 // grid spacing in metres

  // Positions on a square grid
  const pos = []
  for (let i = 0; i < N; i++) {
    const row = Math.floor(i / side), col = i % side
    pos.push([col * GS, row * GS])
  }

  // Smooth elevation surface (sum of sines)
  const f1 = 0.005 + rng() * 0.01,  f2 = 0.008 + rng() * 0.012
  const p1 = rng() * 6.28,          p2 = rng() * 6.28
  const elev = pos.map(([x, y]) => {
    const h = Math.sin(f1 * x + p1) * 0.6 + Math.sin(f2 * y + p2) * 0.4
    return ((h + 1) / 2) * 50 // metres, range [0, 50]
  })

  const adj = Array.from({ length: N }, () => [])
  const edges = []

  const addEdge = (u, v) => {
    const [x1, y1] = pos[u], [x2, y2] = pos[v]
    const dist = hypot2d(x1, y1, x2, y2)
    const tm = lognorm(rng)
    const de = elev[v] - elev[u]
    const w = dist * tm + Math.max(0, de) ** 2
    adj[u].push([v, w])
    edges.push([u, v, w])
  }

  // Grid edges (N/S/E/W) — bidirectional as two directed edges
  for (let i = 0; i < N; i++) {
    const row = Math.floor(i / side), col = i % side
    if (col + 1 < side) { addEdge(i, i + 1); addEdge(i + 1, i) }
    if (row + 1 < side) { addEdge(i, i + side); addEdge(i + side, i) }
  }

  // Random shortcut edges (~30% of N)
  const extra = Math.floor(N * 0.3)
  const existing = new Set(edges.map(([u, v]) => u * N + v))
  let added = 0
  for (let attempt = 0; added < extra && attempt < extra * 10; attempt++) {
    const u = Math.floor(rng() * N), v = Math.floor(rng() * N)
    if (u === v || existing.has(u * N + v)) continue
    const d = hypot2d(pos[u][0], pos[u][1], pos[v][0], pos[v][1])
    if (d > 3.5 * GS) continue
    addEdge(u, v)
    existing.add(u * N + v)
    added++
  }

  return { N, side, pos, elev, adj, edges }
}

export const BENCHMARK_SIZES = [100, 500, 1000, 2500, 5000, 10000]
