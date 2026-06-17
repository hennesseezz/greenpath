/**
 * drawCity.js
 * Renders the city graph onto an HTML canvas element.
 */
export function drawCity(canvas, graph, path = [], source = 0, target = -1) {
  if (!canvas) return
  const { N, pos, elev, adj } = graph
  const side = graph.side || Math.ceil(Math.sqrt(N))
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

  const pathEdgeSet = new Set()
  for (let i = 0; i < path.length - 1; i++) {
    pathEdgeSet.add(path[i] * N + path[i + 1])
  }
  const pathNodeSet = new Set(path)

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // Draw edges
  for (let u = 0; u < N; u++) {
    for (const [v] of adj[u]) {
      const onPath = pathEdgeSet.has(u * N + v)
      ctx.beginPath()
      ctx.moveTo(scaleX(pos[u][0]), scaleY(pos[u][1]))
      ctx.lineTo(scaleX(pos[v][0]), scaleY(pos[v][1]))
      if (onPath) {
        const de = elev[v] - elev[u]
        ctx.strokeStyle = de > 10 ? '#EF4444' : de > 2 ? '#F59E0B' : '#1D9E75'
        ctx.lineWidth = 3.8
        ctx.globalAlpha = 1
      } else {
        const de = Math.abs(elev[v] - elev[u])
        ctx.strokeStyle = de > 10 ? '#EF4444' : de > 2 ? '#F59E0B' : '#1D9E75'
        ctx.lineWidth = 1.3
        ctx.globalAlpha = isDark ? 0.65 : 0.75
      }
      ctx.stroke()
    }
  }

  // Draw nodes
  const minE = Math.min(...elev), maxE = Math.max(...elev)
  ctx.globalAlpha = 1

  for (let i = 0; i < N; i++) {
    const t = (elev[i] - minE) / (maxE - minE || 1)
    const x = scaleX(pos[i][0]), y = scaleY(pos[i][1])

    let color, radius

    if (i === source) {
      color = '#185FA5'; radius = 9
    } else if (i === target) {
      color = '#D85A30'; radius = 9
    } else if (pathNodeSet.has(i)) {
      color = '#5DCAA5'; radius = 4.5
    } else {
      const lo = [147, 225, 181], hi = [8, 80, 65]
      const r = Math.round(lo[0] + t * (hi[0] - lo[0]))
      const g = Math.round(lo[1] + t * (hi[1] - lo[1]))
      const b = Math.round(lo[2] + t * (hi[2] - lo[2]))
      color = `rgb(${r},${g},${b})`
      radius = N > 400 ? 1.8 : N > 100 ? 2.3 : 2.8
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()

    if (i === source || i === target) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.8
      ctx.stroke()
    }
  }

  // Draw source and target node text labels
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const [i, label] of [[source, 'S'], [target === -1 ? -1 : target, 'T']]) {
    if (i < 0 || i >= N) continue
    ctx.fillStyle = '#fff'
    ctx.fillText(label, scaleX(pos[i][0]), scaleY(pos[i][1]) + 0.5)
  }

  // Draw grid coordinate labels
  ctx.font = 'bold 10px system-ui, sans-serif'
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'
  ctx.textBaseline = 'middle'

  const step = side > 20 ? 2 : 1
  const GS = 100

  // Column headers
  ctx.textAlign = 'center'
  for (let c = 0; c < side; c += step) {
    const x = scaleX(c * GS)
    const y = scaleY(0) - 15
    ctx.fillText(c.toString(), x, y)
  }

  // Row headers
  ctx.textAlign = 'right'
  for (let r = 0; r < side; r += step) {
    const x = scaleX(0) - 10
    const y = scaleY(r * GS)
    ctx.fillText((r * side).toString(), x, y)
  }

  // Elevation legend
  ctx.font = '10px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'
  ctx.fillText('low elev', 6, H - 14)
  ctx.textAlign = 'right'
  ctx.fillText('high elev', W - 6, H - 14)
}
