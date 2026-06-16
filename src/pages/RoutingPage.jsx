import { useState, useRef, useEffect, useCallback } from 'react'
import { generateCity } from '../lib/cityGenerator.js'
import { dijkstraQuery, bellmanFordQuery } from '../lib/algorithms.js'
import { drawCity } from '../lib/drawCity.js'

const CITY_SIZES = [
  { label: '64 nodes (8×8)',      value: 64   },
  { label: '100 nodes (10×10)',   value: 100  },
  { label: '225 nodes (15×15)',   value: 225  },
  { label: '400 nodes (20×20)',   value: 400  },
  { label: '1 024 nodes (32×32)', value: 1024 },
]

// ── Design tokens ──────────────────────────────────────────────────────────────
const C_DIJKSTRA = '#1D9E75'
const C_BF       = '#E65100'
const C_DIST     = '#3B82F6'
const C_SLOPE    = '#F59E0B'

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatChip({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontSize: 10, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
      }}>{label}</span>
      <span style={{
        fontSize: 18, fontWeight: 500, color: color || 'var(--text)',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>{value}</span>
    </div>
  )
}

function MatchBadge({ match }) {
  if (match === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: match ? '#E1F5EE' : '#FCEBEB',
      color: match ? '#0F6E56' : '#A32D2D',
    }}>
      {match ? '✓ Agreed' : '✗ Mismatch'}
    </span>
  )
}

function ElevProfile({ data }) {
  if (!data || data.length < 2) return null

  const W = 700, H = 90, PL = 40, PR = 12, PT = 8, PB = 22
  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const minE = Math.min(...data)
  const maxE = Math.max(...data)
  const range = maxE - minE || 1

  const px = i => PL + (i / (data.length - 1)) * chartW
  const py = e => PT + chartH - ((e - minE) / range) * chartH

  const areaD = [
    `M ${px(0)} ${py(minE)}`,
    ...data.map((e, i) => `L ${px(i)} ${py(e)}`),
    `L ${px(data.length - 1)} ${py(minE)} Z`,
  ].join(' ')

  const segs = data.slice(0, -1).map((e, i) => {
    const de = data[i + 1] - e
    const color = de > 5 ? '#EF4444' : de > 1 ? C_SLOPE : de < -1 ? '#60A5FA' : C_DIJKSTRA
    return { x1: px(i), y1: py(e), x2: px(i + 1), y2: py(data[i + 1]), color }
  })

  const ticks = [minE, (minE + maxE) / 2, maxE]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {ticks.map((e, idx) => (
        <g key={idx}>
          <line x1={PL} y1={py(e)} x2={W - PR} y2={py(e)}
            stroke="rgba(128,128,128,0.15)" strokeWidth={0.5} strokeDasharray="4 3" />
          <text x={PL - 5} y={py(e)} textAnchor="end" dominantBaseline="middle"
            fontSize={9} fill="rgba(128,128,128,0.8)">
            {Math.round(e)}m
          </text>
        </g>
      ))}
      <path d={areaD} fill="rgba(29,158,117,0.08)" />
      {segs.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={s.color} strokeWidth={2.2} strokeLinecap="round" />
      ))}
      <circle cx={px(0)}              cy={py(data[0])}              r={3.5} fill="#185FA5" />
      <circle cx={px(data.length - 1)} cy={py(data[data.length - 1])} r={3.5} fill="#D85A30" />
      <text x={px(0)}               y={H - 2} textAnchor="middle" fontSize={9} fill="rgba(128,128,128,0.7)">S</text>
      <text x={px(data.length - 1)} y={H - 2} textAnchor="middle" fontSize={9} fill="rgba(128,128,128,0.7)">T</text>
    </svg>
  )
}

function CO2Bar({ distCO2, slopeCO2 }) {
  const total    = (distCO2 || 0) + (slopeCO2 || 0)
  const distPct  = total > 0 ? (distCO2 / total) * 100 : 50
  const slopePct = total > 0 ? (slopeCO2 / total) * 100 : 50

  const fmt = v => v != null ? v.toFixed(1) : '—'

  return (
    <div>
      {/* Stacked bar */}
      <div style={{
        display: 'flex', borderRadius: 5, overflow: 'hidden',
        height: 8, marginBottom: 12, background: 'var(--surface)',
      }}>
        <div style={{ width: `${distPct}%`, background: C_DIST, transition: 'width .5s ease' }} />
        <div style={{ width: `${slopePct}%`, background: C_SLOPE, transition: 'width .5s ease' }} />
      </div>
      {/* Labels */}
      <div style={{ display: 'flex', gap: 20 }}>
        {[
          { color: C_DIST,  label: 'Distance', value: distCO2,  pct: distPct  },
          { color: C_SLOPE, label: 'Slope',    value: slopeCO2, pct: slopePct },
        ].map(({ color, label, value, pct }) => (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)} g</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{pct.toFixed(0)}% of total</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

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
    dCost:  null, dTime:  null, dHops:  null, dComps:  null,
    bfCost: null, bfTime: null, bfHops: null, bfComps: null,
    match: null, distCO2: null, slopeCO2: null, elevProfile: null,
  })

  const runQuery = useCallback((sz, sd, src, tgt) => {
    setLoading(true)
    setLog('Generating city graph…')
    setTimeout(() => {
      const g = generateCity(sz, sd)
      graphRef.current = g
      const actualSrc = Math.min(src, g.N - 1)
      const actualTgt = Math.min(tgt, g.N - 1)

      setLog(`Running algorithms on ${g.N} nodes…`)
      const dRes  = dijkstraQuery(g, actualSrc, actualTgt)
      const bfRes = bellmanFordQuery(g, actualSrc, actualTgt)

      const match =
        isFinite(dRes.cost) && isFinite(bfRes.cost)
          ? Math.abs(dRes.cost - bfRes.cost) < 1e-4 * Math.max(1, dRes.cost)
          : dRes.cost === bfRes.cost

      // CO2 breakdown along Dijkstra path
      let distCO2 = 0, slopeCO2 = 0
      for (let i = 0; i < dRes.path.length - 1; i++) {
        const meta = g.edgeMeta.get(dRes.path[i] * g.N + dRes.path[i + 1])
        if (meta) { distCO2 += meta.distCost; slopeCO2 += meta.slopeCost }
      }

      drawCity(canvasRef.current, g, dRes.path, actualSrc, actualTgt)

      setResults({
        dCost:  dRes.cost,  dTime:  dRes.timeMs,  dHops:  dRes.path.length - 1,  dComps:  dRes.comparisons,
        bfCost: bfRes.cost, bfTime: bfRes.timeMs, bfHops: bfRes.path.length - 1, bfComps: bfRes.comparisons,
        match, distCO2, slopeCO2,
        elevProfile: dRes.path.map(n => g.elev[n]),
      })

      setLog(`${g.N} nodes · ${g.edges.length} edges · seed ${sd} · ${dRes.path.length} hops`)
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

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (graphRef.current && canvasRef.current)
        drawCity(canvasRef.current, graphRef.current, [], srcNode, tgtNode)
    })
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, []) // eslint-disable-line

  const hasResults = results.dCost !== null

  const fmt   = v => v == null ? '—' : isFinite(v) ? v.toFixed(1) + ' g' : '∞'
  const fmtMs = v => v == null ? '—' : v.toFixed(2) + ' ms'
  const fmtN  = v => v == null || v < 0 ? '—' : v.toLocaleString()

  const inputStyle = {
    width: '100%', padding: '7px 10px',
    border: '0.5px solid var(--border-med)', borderRadius: 8,
    background: 'var(--bg)', color: 'var(--text)',
    fontSize: 14, outline: 'none',
  }

  const card = {
    background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem',
  }

  const labelStyle = {
    fontSize: 10, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
    display: 'block', marginBottom: 4,
  }

  const totalCO2 = (results.distCO2 || 0) + (results.slopeCO2 || 0)
  const speedup  = results.dTime && results.bfTime ? (results.bfTime / results.dTime).toFixed(1) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Row 1: Controls + Canvas ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

        {/* Controls */}
        <div style={{ ...card, flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>City size</label>
            <select value={citySize} onChange={e => setCitySize(+e.target.value)} style={inputStyle}>
              {CITY_SIZES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Seed</label>
            <input type="number" value={seed} min={0} onChange={e => setSeed(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Source node</label>
            <input type="number" value={srcNode} min={0} onChange={e => setSrcNode(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Target node</label>
            <input type="number" value={tgtNode} min={0} onChange={e => setTgtNode(+e.target.value)} style={inputStyle} />
          </div>

          <button onClick={handleRun} disabled={loading} style={{
            padding: '9px 0', background: loading ? '#5DCAA5' : C_DIJKSTRA,
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 500, cursor: loading ? 'default' : 'pointer',
            transition: 'background .15s',
          }}>
            {loading ? 'Running…' : '🌿 Find eco-route'}
          </button>

          <button onClick={handleRandom} disabled={loading} style={{
            padding: '8px 0', background: 'transparent', color: 'var(--text)',
            border: '0.5px solid var(--border-med)', borderRadius: 8,
            fontSize: 14, cursor: loading ? 'default' : 'pointer',
          }}>
            🎲 Random query
          </button>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 'auto', fontFamily: 'var(--font-mono)' }}>
            {log}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ ...card, flex: 1, minWidth: 260, padding: '0.75rem' }}>
          <canvas ref={canvasRef} height={340}
            style={{ width: '100%', display: 'block', borderRadius: 8 }}
            aria-label="City graph with highlighted eco-route" />
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
            {[
              { color: '#185FA5', label: 'Source' },
              { color: '#D85A30', label: 'Target' },
              { color: '#5DCAA5', label: 'Path nodes' },
              { color: C_DIJKSTRA, label: 'Flat / downhill' },
              { color: C_SLOPE,    label: 'Uphill' },
              { color: '#EF4444', label: 'Steep uphill' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: CO2 Breakdown + Elevation Profile ── */}
      {hasResults && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

          {/* CO2 breakdown */}
          <div style={{ ...card, flex: '0 0 240px' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>
                CO₂ Breakdown · Dijkstra path
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#0F6E56' }}>
                {totalCO2.toFixed(1)}
                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 5 }}>g CO₂</span>
              </div>
            </div>
            <CO2Bar distCO2={results.distCO2} slopeCO2={results.slopeCO2} />
          </div>

          {/* Elevation profile */}
          <div style={{ ...card, flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Elevation Profile · Dijkstra path
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { color: '#60A5FA', label: 'Downhill' },
                  { color: C_DIJKSTRA, label: 'Flat' },
                  { color: C_SLOPE,    label: 'Uphill' },
                  { color: '#EF4444',  label: 'Steep' },
                ].map(({ color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                    <span style={{ width: 14, height: 2.5, background: color, display: 'inline-block', borderRadius: 2 }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <ElevProfile data={results.elevProfile} />
          </div>
        </div>
      )}

      {/* ── Row 3: Algorithm comparison ── */}
      {hasResults && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

          {/* Dijkstra */}
          <div style={{ ...card, flex: 1, minWidth: 160, borderTop: `3px solid ${C_DIJKSTRA}` }}>
            <div style={{ fontSize: 11, color: C_DIJKSTRA, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 16 }}>
              DIJKSTRA
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <StatChip label="CO₂ Cost"    value={fmt(results.dCost)}   color="#0F6E56" />
              <StatChip label="Runtime"     value={fmtMs(results.dTime)} />
              <StatChip label="Hops"        value={fmtN(results.dHops)}  />
              <StatChip label="Comparisons" value={fmtN(results.dComps)} />
            </div>
          </div>

          {/* Bellman-Ford */}
          <div style={{ ...card, flex: 1, minWidth: 160, borderTop: `3px solid ${C_BF}` }}>
            <div style={{ fontSize: 11, color: C_BF, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 16 }}>
              BELLMAN-FORD
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <StatChip label="CO₂ Cost"    value={fmt(results.bfCost)}   color="#854F0B" />
              <StatChip label="Runtime"     value={fmtMs(results.bfTime)} />
              <StatChip label="Hops"        value={fmtN(results.bfHops)}  />
              <StatChip label="Comparisons" value={fmtN(results.bfComps)} />
            </div>
          </div>

          {/* Verdict */}
          <div style={{ ...card, flex: '0 0 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Cost match
            </div>
            <MatchBadge match={results.match} />
            {speedup && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{speedup}×</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dijkstra faster</div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
