# GreenPath — Eco-Friendly Router

> **DAA Final Exam · EF234405**  
> Finds the minimum-CO₂ delivery route through a synthetic city graph using two independent SSSP algorithms — **Dijkstra** (Algorithm A) and **Bellman-Ford** (Algorithm B) — compared side by side.

---

## Quick Start

```bash
git clone https://github.com/hennesseezz/greenpath-web.git
cd greenpath-web
npm install
npm run dev
```

---

## One-Command Benchmark

Runs both algorithms across graph sizes 100 → 10 000, then writes results to [`bench/results.csv`](bench/results.csv):

```bash
npm run benchmark
```

Optional flags:

```bash
npm run benchmark -- --runs=5              # 5 runs per size (default: 3)
npm run benchmark -- --sizes=100,1000,5000 # custom size list
```

---

## Run Tests

Verifies both algorithms against known ground-truth graphs:

```bash
npm test
```

Exit code `0` = all tests passed. Exit code `1` = failure.

---

## Project Structure

```
greenpath-web/
├── src/
│   ├── lib/
│   │   ├── algorithms.js      # Dijkstra + Bellman-Ford (from scratch)
│   │   ├── minHeap.js         # Custom binary min-heap
│   │   ├── cityGenerator.js   # Reproducible weighted directed graph generator
│   │   └── drawCity.js        # Canvas renderer
│   └── pages/
│       ├── RoutingPage.jsx    # Interactive routing demo
│       └── BenchmarkPage.jsx  # In-browser benchmark + Chart.js plot
├── bench/
│   ├── harness.mjs            # Headless Node.js benchmark harness
│   └── results.csv            # Pre-generated benchmark output
├── test/
│   └── run_tests.mjs          # Unit tests (no framework required)
├── index.html
├── package.json
└── vite.config.js
```

---

## Algorithms

### Algorithm A — Dijkstra (`dijkstra()` in `src/lib/algorithms.js`)

- **Time:** `O((V + E) log V)` using a custom binary min-heap (lazy-deletion variant)
- **Space:** `O(V + E)`
- **Correctness:** All edge weights are non-negative (guaranteed by CO₂ formula), so the greedy relaxation property holds
- **Early exit:** Stops as soon as the target vertex is settled (point-to-point queries)

### Algorithm B — Bellman-Ford (`bellmanFord()` in `src/lib/algorithms.js`)

- **Time:** `O(V · E)` — up to V−1 relaxation passes over all edges
- **Space:** `O(V + E)`
- **Early exit:** Terminates when a full pass produces no relaxation
- **Role in this project:** Correctness oracle — both algorithms must agree on path cost

### Shared Interface

Both algorithms return `{ dist: Float64Array, prev: Int32Array, comparisons: number }`.  
Path reconstruction via `reconstructPath(prev, src, tgt)` is shared by both (no duplicated logic).

---

## Edge Weight Formula (CO₂ proxy, grams)

```
w(u, v) = base_dist(u,v) × traffic_mult  +  max(0, Δelev)²
```

| Term | Description |
|------|-------------|
| `base_dist` | Euclidean distance between nodes (metres) |
| `traffic_mult` | Log-normal traffic congestion multiplier (median = 1.0) |
| `max(0, Δelev)²` | Squared uphill penalty — zero for flat or downhill segments |

All weights are strictly positive → Dijkstra is always safe to use.

---

## Build

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server at `http://localhost:5173` |
| `npm run build` | Production bundle → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run benchmark` | Headless benchmark → `bench/results.csv` |
| `npm test` | Unit tests for both algorithms |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | UI framework |
| `chart.js` + `react-chartjs-2` | Runtime chart in Benchmark tab |
| `vite` | Build tool and dev server |
