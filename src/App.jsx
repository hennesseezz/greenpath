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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: '#1D9E75',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>🌿</div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>GreenPath</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Eco-friendly delivery router · Dijkstra vs Bellman-Ford · EF234405 DAA Final
          </p>
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
