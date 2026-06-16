import { useState } from 'react'
import RoutingPage   from './pages/RoutingPage.jsx'
import BenchmarkPage from './pages/BenchmarkPage.jsx'

const TABS = [
  { id: 'routing',   label: '🗺  Routing demo' },
  { id: 'benchmark', label: '📊 Benchmark' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('routing')

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '1.5rem 1.25rem 3rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--text)',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.5rem' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          boxShadow: '0 2px 8px rgba(29,158,117,0.3)',
        }}>🌿</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>GreenPath</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            Eco-friendly delivery router · Dijkstra vs Bellman-Ford · EF234405 DAA Final
          </p>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
          background: 'var(--surface)', padding: '5px 10px', borderRadius: 8,
          border: '0.5px solid var(--border)', lineHeight: 1.6,
        }}>
          <span style={{ color: 'var(--text)' }}>w</span> = dist·traffic + max(0, Δelev)²
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex',
        borderBottom: '0.5px solid var(--border)',
        marginBottom: '1.5rem',
        gap: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #1D9E75' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 500 : 400,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'color .12s, border-color .12s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {activeTab === 'routing'   && <RoutingPage />}
      {activeTab === 'benchmark' && <BenchmarkPage />}
    </div>
  )
}
