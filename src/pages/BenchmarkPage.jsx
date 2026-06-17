import { useState, useRef, useEffect } from 'react'
import { Chart, registerables } from 'chart.js'
import { generateCity, BENCHMARK_SIZES } from '../lib/cityGenerator.js'
import { dijkstra, bellmanFord } from '../lib/algorithms.js'

Chart.register(...registerables)

const SIZES_FULL = BENCHMARK_SIZES              // [100,500,1000,2500,5000,10000]
const SIZES_SMALL = [100, 500, 1000, 2500]

function fitPowerLaw(xs, ys) {
  const n = xs.length
  const lx = xs.map(Math.log)
  const ly = ys.map(v => Math.log(Math.max(v, 1e-9)))
  const mx = lx.reduce((a, b) => a + b) / n
  const my = ly.reduce((a, b) => a + b) / n
  const num = lx.reduce((s, x, i) => s + (x - mx) * (ly[i] - my), 0)
  const den = lx.reduce((s, x) => s + (x - mx) ** 2, 0)
  return den ? num / den : 0
}

function MatchBadge({ ok }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
      background: ok ? '#E1F5EE' : '#FCEBEB',
      color:      ok ? '#0F6E56' : '#A32D2D',
    }}>
      {ok ? '✓ Match' : '✗ Mismatch'}
    </span>
  )
}

function MetricCard({ label, value, color, description }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 130,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
        <div style={{ fontSize: 19, fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
      </div>
      {description && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.25 }}>
          {description}
        </div>
      )}
    </div>
  )
}

export default function BenchmarkPage() {
  const chartRef = useRef(null)
  const chartInst = useRef(null)

  const [preset, setPreset] = useState('full')
  const [runs, setRuns] = useState(3)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState('Choose settings and press "Run benchmark".')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)

  const buildChart = (results) => {
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null }
    if (!chartRef.current) return

    const labels = results.map(r => r.n >= 1000 ? `${(r.n / 1000).toFixed(1)}k` : String(r.n))
    const dData = results.map(r => parseFloat(r.dm.toFixed(3)))
    const bfData = results.map(r => parseFloat(r.bfm.toFixed(3)))

    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Dijkstra',
            data: dData,
            borderColor: '#1D9E75',
            backgroundColor: 'rgba(29,158,117,0.08)',
            pointBackgroundColor: '#1D9E75',
            tension: 0.35, fill: true,
            borderDash: [],
            pointStyle: 'circle', pointRadius: 5,
          },
          {
            label: 'Bellman-Ford',
            data: bfData,
            borderColor: '#E65100',
            backgroundColor: 'rgba(230,81,0,0.06)',
            pointBackgroundColor: '#E65100',
            tension: 0.35, fill: true,
            borderDash: [5, 4],
            pointStyle: 'rect', pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(128,128,128,0.12)' }, ticks: { autoSkip: false, maxRotation: 0 } },
          y: {
            grid: { color: 'rgba(128,128,128,0.12)' },
            title: { display: true, text: 'runtime (ms, avg)' },
            ticks: { callback: v => v.toFixed(1) + ' ms' },
          },
        },
      },
    })
  }

  const runBenchmark = async () => {
    const sizes = preset === 'small' ? SIZES_SMALL : SIZES_FULL
    setRunning(true)
    setRows([])
    setSummary(null)

    const results = []

    for (let i = 0; i < sizes.length; i++) {
      const n = sizes[i]
      setLog(`[${i + 1}/${sizes.length}] Benchmarking n = ${n}…`)
      await new Promise(r => setTimeout(r, 0)) // yield to React

      const g = generateCity(n, 42 + i)
      const src = 0, tgt = g.N - 1
      let dtotal = 0, bftotal = 0
      let dcost = Infinity, bfcost = Infinity, allMatch = true

      for (let r = 0; r < runs; r++) {
        let t = performance.now()
        const { dist: dd } = dijkstra(g, src)
        dtotal += performance.now() - t
        dcost = dd[tgt]

        t = performance.now()
        const { dist: bd } = bellmanFord(g, src)
        bftotal += performance.now() - t
        bfcost = bd[tgt]

        const ok = isFinite(dcost) && isFinite(bfcost)
          ? Math.abs(dcost - bfcost) < 1e-4 * Math.max(1, dcost)
          : dcost === bfcost
        if (!ok) allMatch = false

        await new Promise(r => setTimeout(r, 0))
      }

      results.push({
        n: g.N,
        edges: g.edges.length,
        dm: dtotal / runs,
        bfm: bftotal / runs,
        dcost,
        bfcost,
        match: allMatch,
      })
    }

    // Summary stats
    const ns = results.map(r => r.n)
    const kd = fitPowerLaw(ns, results.map(r => r.dm))
    const kbf = fitPowerLaw(ns, results.map(r => r.bfm))
    const last = results[results.length - 1]
    const speedup = (last.bfm / last.dm).toFixed(1)
    const allOk = results.every(r => r.match)

    setRows(results)
    setSummary({ kd, kbf, speedup, allOk })
    setLog(`Done - ${sizes.length} sizes × ${runs} run(s). All costs matched: ${allOk ? 'Match ✓' : 'Mismatch ✗'}`)

    // Build chart after state settles
    setTimeout(() => buildChart(results), 50)
    setRunning(false)
  }

  // Destroy chart on unmount
  useEffect(() => () => { if (chartInst.current) chartInst.current.destroy() }, [])

  const selStyle = {
    padding: '7px 10px',
    border: '0.5px solid var(--border-med)',
    borderRadius: 8,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 14,
    cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Page Description / User Guide */}
      <div style={{
        background: 'rgba(29, 158, 117, 0.05)',
        borderLeft: '4px solid #1D9E75',
        padding: '10px 14px',
        borderRadius: '0 8px 8px 0',
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--text-muted)'
      }}>
        <strong>Computational Speed Benchmark:</strong> Measure and compare the runtime performance of <strong>Dijkstra</strong> (fast & efficient) vs <strong>Bellman-Ford</strong> (flexible) algorithms across graph sizes from 100 to 10,000 nodes.
      </div>

      {/* Controls & Glossary Container */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {/* Controls */}
        <div style={{
          background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem',
          flex: '1 1 300px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
        }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Sizes</label>
            <select value={preset} onChange={e => setPreset(e.target.value)} style={selStyle}>
              <option value="small">Quick - 100 to 2,500</option>
              <option value="full">Full - 100 to 10,000</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Runs per size</label>
            <select value={runs} onChange={e => setRuns(+e.target.value)} style={selStyle}>
              <option value={1}>1 (fast)</option>
              <option value={3}>3 (balanced)</option>
              <option value={5}>5 (accurate)</option>
            </select>
          </div>
          <button
            onClick={runBenchmark}
            disabled={running}
            style={{
              padding: '9px 20px',
              background: running ? '#5DCAA5' : '#1D9E75',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 500,
              cursor: running ? 'default' : 'pointer',
            }}
          >
            {running ? 'Running…' : '▶ Run benchmark'}
          </button>
        </div>

        {/* Glossary/Explanation */}
        <div style={{
          background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem',
          flex: '1 1 300px', fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)',
        }}>
          <h4 style={{ margin: '0 0 6px 0', color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>Quick Testing Guide</h4>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            <li><strong>Sizes:</strong> The graph sizes tested. <em>Quick</em> scales up to 2,500 nodes, while <em>Full</em> scales up to 10,000 nodes.</li>
            <li><strong>Runs per size:</strong> Number of test runs per size. Used to average out CPU noise and provide stable runtime data.</li>
          </ul>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontFamily: 'var(--font-mono, monospace)' }}>{log}</div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <MetricCard 
            label="Dijkstra Exponent (k)" 
            value={summary.kd.toFixed(2)}  
            color="#0F6E56" 
            description="Time complexity growth rate. Smaller exponent means better scalability."
          />
          <MetricCard 
            label="Bellman-Ford Exponent (k)" 
            value={summary.kbf.toFixed(2)} 
            color="#854F0B" 
            description="Time complexity growth rate. Larger exponent means worst-case slowdown."
          />
          <MetricCard 
            label={`Speedup Factor (n=${rows[rows.length - 1]?.n?.toLocaleString()})`} 
            value={`${summary.speedup}×`} 
            color="#185FA5" 
            description="How many times faster Dijkstra executed compared to Bellman-Ford."
          />
          <MetricCard
            label="All Costs Matched?"
            value={
              <span style={{
                padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                background: summary.allOk ? '#E1F5EE' : '#FCEBEB',
                color: summary.allOk ? '#0F6E56' : '#A32D2D',
              }}>
                {summary.allOk ? '✓ Match' : '✗ Mismatch'}
              </span>
            }
            description="Verifies that both algorithms resolved mathematically identical optimal costs."
          />
        </div>
      )}

      {/* Chart */}
      {rows.length > 0 && (
        <div style={{
          background: 'var(--bg)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '1rem', marginBottom: 16,
        }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            {[['#1D9E75', 'Dijkstra'], ['#E65100', 'Bellman-Ford']].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                {l}
              </span>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11 }}>
              Runtime (ms) vs Graph Size (nodes)
            </span>
          </div>
          <div style={{ position: 'relative', height: 260 }}>
            <canvas
              ref={chartRef}
              role="img"
              aria-label="Line chart: Dijkstra vs Bellman-Ford runtime across graph sizes"
            >
              Runtime comparison across graph sizes.
            </canvas>
          </div>
        </div>
      )}

      {/* Results table */}
      {rows.length > 0 && (
        <div style={{
          background: 'var(--bg)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '1rem',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Results Table</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {[
                    { key: 'n', label: 'Nodes (n)' },
                    { key: 'edges', label: 'Edges' },
                    { key: 'dijkstra', label: 'Dijkstra Avg (ms)' },
                    { key: 'bf', label: 'Bellman-Ford Avg (ms)' },
                    { key: 'speedup', label: 'Speedup' },
                    { key: 'match', label: 'Match' },
                  ].map(h => (
                    <th key={h.key} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.n}>
                    <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)' }}>{r.n.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', color: 'var(--text-muted)' }}>{r.edges.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', color: '#0F6E56', fontFamily: 'var(--font-mono, monospace)' }}>{r.dm.toFixed(2)}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', color: '#854F0B', fontFamily: 'var(--font-mono, monospace)' }}>{r.bfm.toFixed(2)}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)' }}>{(r.bfm / r.dm).toFixed(1)}×</td>
                    <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)' }}><MatchBadge ok={r.match} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            Note: Seed: 42+i per size · Average runtime over {runs} run(s) · Same source (0) and target (n-1) for both algorithms.
          </div>
        </div>
      )}
    </div>
  )
}
