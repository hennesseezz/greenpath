/**
 * drawCity.js
 * Renders the city graph onto an HTML canvas.
 *
 * Color encoding:
 *   Nodes  — teal gradient by elevation (dark = high, light = low)
 *   Source — blue  (#185FA5)
 *   Target — coral (#D85A30)
 *   Path   — bright teal (#5DCAA5) with thick green edges
 *   Edges  — translucent gray (non-path) / solid green (on-path)
 */

export function drawCity(canvas, graph, path = [], source = 0, target = -1) {
  if (!canvas) return
  const { N, pos, elev, adj } = graph
  const W = canvas.offsetWidth || canvas.width || 500
  const H = canvas.height || 360
  canvas.width = W

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)

  const pad = 32
  const xs = pos.map(([x]) => x), ys = pos.map(([, y]) => y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const scaleX = x => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad)
  const scaleY = y => pad + ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad)

  // Build path edge set for O(1) lookup
  const pathEdgeSet = new Set()
  for (let i = 0; i < path.length - 1; i++) {
    pathEdgeSet.add(path[i] * N + path[i + 1])
  }
  const pathNodeSet = new Set(path)

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const edgeColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'

  // ── Draw edges ────────────────────────────────────────────────
  for (let u = 0; u < N; u++) {
    for (const [v] of adj[u]) {
      const onPath = pathEdgeSet.has(u * N + v)
      ctx.beginPath()
      ctx.moveTo(scaleX(pos[u][0]), scaleY(pos[u][1]))
      ctx.lineTo(scaleX(pos[v][0]), scaleY(pos[v][1]))
      if (onPath) {
        ctx.strokeStyle = '#1D9E75'
        ctx.lineWidth = 2.8
        ctx.globalAlpha = 1
      } else {
        ctx.strokeStyle = edgeColor
        ctx.lineWidth = 0.8
        ctx.globalAlpha = 1
      }
      ctx.stroke()
    }
  }

  // ── Draw nodes ────────────────────────────────────────────────
  const minE = Math.min(...elev), maxE = Math.max(...elev)

  for (let i = 0; i < N; i++) {
    const t = (elev[i] - minE) / (maxE - minE || 1) // 0=low, 1=high
    const x = scaleX(pos[i][0]), y = scaleY(pos[i][1])

    let color, radius

    if (i === source) {
      color = '#185FA5'; radius = 7
    } else if (i === target) {
      color = '#D85A30'; radius = 7
    } else if (pathNodeSet.has(i)) {
      color = '#5DCAA5'; radius = 4
    } else {
      // Elevation tint: low = light teal, high = dark teal
      const lo = [147, 225, 181], hi = [8, 80, 65] // #93E1B5 → #085041
      const r = Math.round(lo[0] + t * (hi[0] - lo[0]))
      const g = Math.round(lo[1] + t * (hi[1] - lo[1]))
      const b = Math.round(lo[2] + t * (hi[2] - lo[2]))
      color = `rgb(${r},${g},${b})`
      radius = N > 400 ? 1.5 : N > 100 ? 2 : 2.5
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  // ── Source / target labels ────────────────────────────────────
  ctx.font = '500 11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const [i, label] of [[source, 'S'], [target === -1 ? -1 : target, 'T']]) {
    if (i < 0 || i >= N) continue
    ctx.fillStyle = '#fff'
    ctx.fillText(label, scaleX(pos[i][0]), scaleY(pos[i][1]) + 0.5)
  }

  // ── Legend (elevation) ────────────────────────────────────────
  ctx.font = '10px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'
  ctx.fillText('low elev', 6, H - 14)
  ctx.textAlign = 'right'
  ctx.fillText('high elev', W - 6, H - 14)
}
