import { useState, useRef, useEffect, useCallback } from 'react'
import { generateCity } from '../lib/cityGenerator.js'
import { dijkstraQuery, bellmanFordQuery } from '../lib/algorithms.js'
import { drawCity } from '../lib/drawCity.js'

const CITY_SIZES = [
  { label: '64 nodes (8×8)',   value: 64 },
  { label: '100 nodes (10×10)', value: 100 },
  { label: '225 nodes (15×15)', value: 225 },
  { label: '400 nodes (20×20)', value: 400 },
  { label: '1 024 nodes (32×32)', value: 1024 },
]

function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 10,
      padding: '12px 16px',
      flex: 1,
      minWidth: 110,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 500, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

function MatchBadge({ match }) {
  if (match === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      background: match ? '#E1F5EE' : '#FCEBEB',
      color: match ? '#0F6E56' : '#A32D2D',
    }}>
      {match ? '✓ Agreed' : '✗ Mismatch'}
    </span>
  )
}

export default function RoutingPage() {
  const canvasRef = useRef(null)
  const graphRef  = useRef(null)

  const [citySize, setCitySize] = useState(100)
  const [seed, setSeed]         = useState(42)
  const [srcNode, setSrcNode]   = useState(0)
  const [tgtNode, setTgtNode]   = useState(99)
  const [loading, setLoading]   = useState(false)
  const [log, setLog]           = useState('Configure settings and press "Find eco-route".')

  const [results, setResults] = useState({
    dCost: null, dTime: null, dHops: null,
    bfCost: null, bfTime: null, bfHops: null,
    match: null,
  })

  const runQuery = useCallback((sz, sd, src, tgt) => {
    setLoading(true)
    setLog('Generating city graph…')

    // Defer to next frame so React can render the loading state
    setTimeout(() => {
      const g = generateCity(sz, sd)
      graphRef.current = g
      const actualSrc = Math.min(src, g.N - 1)
      const actualTgt = Math.min(tgt, g.N - 1)

      setLog(`Running Dijkstra on ${g.N} nodes…`)

      const dRes  = dijkstraQuery(g, actualSrc, actualTgt)
      const bfRes = bellmanFordQuery(g, actualSrc, actualTgt)

      const match =
        isFinite(dRes.cost) && isFinite(bfRes.cost)
          ? Math.abs(dRes.cost - bfRes.cost) < 1e-4 * Math.max(1, dRes.cost)
          : dRes.cost === bfRes.cost // both Infinity

      drawCity(canvasRef.current, g, dRes.path, actualSrc, actualTgt)

      setResults({
        dCost:  dRes.cost,  dTime:  dRes.timeMs,  dHops:  dRes.path.length - 1,
        bfCost: bfRes.cost, bfTime: bfRes.timeMs, bfHops: bfRes.path.length - 1,
        match,
      })

      setLog(
        `Graph: ${g.N} nodes · ${g.edges.length} edges · seed ${sd} · ` +
        `path: ${dRes.path.length} hops`
      )
      setLoading(false)
    }, 20)
  }, [])

  const handleRun = () => runQuery(citySize, seed, srcNode, tgtNode)

  const handleRandom = () => {
    const g = graphRef.current || generateCity(citySize, seed)
    graphRef.current = g
    const s = Math.floor(Math.random() * g.N)
    const t = Math.floor(Math.random() * g.N)
    setSrcNode(s); setTgtNode(t)
    runQuery(citySize, seed, s, t)
  }

  // Resize canvas on window resize
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (graphRef.current && canvasRef.current) {
        const r = results
        // redraw with current path — we don't store path in state, redraw on resize
        drawCity(canvasRef.current, graphRef.current, [], srcNode, tgtNode)
      }
    })
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, []) // eslint-disable-line

  const fmt   = v => (v == null ? '—' : isFinite(v) ? v.toFixed(1) + ' g' : '∞')
  const fmtMs = v => (v == null ? '—' : v.toFixed(2) + ' ms')
  const fmtN  = v => (v == null || v < 0 ? '—' : String(v))

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    border: '0.5px solid var(--border-med)',
    borderRadius: 8,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

        {/* ── Controls ── */}
        <div style={{
          flex: '0 0 200px',
          background: 'var(--bg)',
          border: '0.5px solid var(--border)',
          borderRadius: 12,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>City size</label>
            <select value={citySize} onChange={e => setCitySize(+e.target.value)} style={inputStyle}>
              {CITY_SIZES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Seed</label>
            <input type="number" value={seed} min={0} onChange={e => setSeed(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Source node</label>
            <input type="number" value={srcNode} min={0} onChange={e => setSrcNode(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Target node</label>
            <input type="number" value={tgtNode} min={0} onChange={e => setTgtNode(+e.target.value)} style={inputStyle} />
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              padding: '9px 0',
              background: loading ? '#5DCAA5' : '#1D9E75',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'default' : 'pointer',
              transition: 'background .15s',
            }}
          >
            {loading ? 'Running…' : '🌿 Find eco-route'}
          </button>

          <button
            onClick={handleRandom}
            disabled={loading}
            style={{
              padding: '8px 0',
              background: 'transparent',
              color: 'var(--text)',
              border: '0.5px solid var(--border-med)',
              borderRadius: 8,
              fontSize: 14,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            🎲 Random query
          </button>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{log}</div>
        </div>

        {/* ── Canvas ── */}
        <div style={{
          flex: 1,
          minWidth: 260,
          background: 'var(--bg)',
          border: '0.5px solid var(--border)',
          borderRadius: 12,
          padding: '0.75rem',
        }}>
          <canvas
            ref={canvasRef}
            height={360}
            style={{ width: '100%', display: 'block', borderRadius: 8 }}
            aria-label="City graph visualization with highlighted eco-route"
          />
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <MetricCard label="Dijkstra cost"     value={fmt(results.dCost)}   color="#0F6E56" />
        <MetricCard label="Dijkstra time"     value={fmtMs(results.dTime)} color="#0F6E56" />
        <MetricCard label="Dijkstra hops"     value={fmtN(results.dHops)}  color="#0F6E56" />
        <MetricCard label="Bellman-Ford cost" value={fmt(results.bfCost)}  color="#854F0B" />
        <MetricCard label="BF time"           value={fmtMs(results.bfTime)} color="#854F0B" />
        <MetricCard label="Costs match" value={<MatchBadge match={results.match} />} />
      </div>

      {/* ── Key ── */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
        {[
          { color: '#185FA5', label: 'Source (S)' },
          { color: '#D85A30', label: 'Target (T)' },
          { color: '#5DCAA5', label: 'Path nodes' },
          { color: '#1D9E75', label: 'Path edges' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 4 }}>Node shade = elevation (darker = higher)</span>
      </div>
    </div>
  )
}
