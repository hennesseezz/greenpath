import { useState } from 'react'
import RoutingPage   from './pages/RoutingPage.jsx'
import BenchmarkPage from './pages/BenchmarkPage.jsx'

const TABS = [
  { id: 'routing',   label: 'Routing demo' },
  { id: 'benchmark', label: 'Benchmark' },
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

      {/* ── Premium Styled Header ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(29, 158, 117, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%), var(--surface)',
        border: '1px solid rgba(29, 158, 117, 0.16)',
        borderRadius: 18,
        padding: '1.5rem 1.75rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        overflow: 'hidden',
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo */}
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #10B981 0%, #0F6E56 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, flexShrink: 0,
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>🌿</div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: 26,
                fontWeight: 900,
                margin: 0,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                GreenPath
              </h1>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.45 }}>
              Eco-friendly Delivery Routing Engine &bull; Comparing Dijkstra & Bellman-Ford Algorithms
            </p>
          </div>
        </div>

        <div style={{
          fontSize: 10.5, fontWeight: 650, color: 'var(--text-muted)',
          background: 'var(--bg)', border: '1px solid var(--border)',
          padding: '6px 12px', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#10B981', display: 'inline-block',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          }} />
          DAA Final Project
        </div>
      </div>

      {/* ── Modern Segmented Capsule Tabs ── */}
      <div style={{
        display: 'inline-flex',
        background: 'var(--surface)',
        padding: 4,
        borderRadius: 12,
        border: '1px solid var(--border)',
        marginBottom: '1.75rem',
        gap: 2,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px',
                background: isActive ? 'var(--bg)' : 'transparent',
                border: 'none',
                borderRadius: 9,
                color: isActive ? '#0F6E56' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      {activeTab === 'routing'   && <RoutingPage />}
      {activeTab === 'benchmark' && <BenchmarkPage />}
    </div>
  )
}
