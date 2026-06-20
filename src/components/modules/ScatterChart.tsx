import { useEffect, useRef } from 'react'
import { Chart, ScatterController, LinearScale, PointElement, Tooltip } from 'chart.js'
import type { Product } from '../../types'
import { fmt$, fmtPct, fmtN, shortUbic, longUbic, precioSugerido } from '../../lib/format'

Chart.register(ScatterController, LinearScale, PointElement, Tooltip)

interface Props { products: Product[]; criticos: number; medios: number; sanos: number }

export default function ScatterChart({ products, criticos, medios, sanos }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Order: críticos first, then medios, then sanos
    const ordered = [
      ...products.filter(p => p.margen < 8).sort((a, b) => a.margen - b.margen),
      ...products.filter(p => p.margen >= 8 && p.margen < 10).sort((a, b) => a.margen - b.margen),
      ...products.filter(p => p.margen >= 10).sort((a, b) => a.margen - b.margen),
    ].slice(0, 300)

    const colors = ordered.map(p =>
      p.margen < 8  ? '#ef4444' :
      p.margen < 10 ? '#f59e0b' : '#22c55e'
    )

    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const zoneBandsPlugin = {
      id: 'zoneBands',
      beforeDraw(chart: Chart) {
        const { ctx: c, chartArea: { left, right, top, bottom }, scales } = chart
        const x = scales['x'] as any
        if (!x) return
        const toX = (v: number) => x.getPixelForValue(v)

        c.save()
        c.fillStyle = 'rgba(239,68,68,.07)'
        c.fillRect(toX(0), top, toX(8) - toX(0), bottom - top)
        c.fillStyle = 'rgba(245,158,11,.07)'
        c.fillRect(toX(8), top, toX(10) - toX(8), bottom - top)
        c.fillStyle = 'rgba(34,197,94,.05)'
        c.fillRect(toX(10), top, toX(55) - toX(10), bottom - top)

        c.strokeStyle = 'rgba(100,116,139,.35)'
        c.lineWidth = 1
        c.setLineDash([5, 4]);
        [8, 10].forEach(v => {
          const px = toX(v)
          c.beginPath(); c.moveTo(px, top); c.lineTo(px, bottom); c.stroke()
        })
        c.setLineDash([])

        c.font = '700 10px system-ui'
        c.fillStyle = 'rgba(220,38,38,.7)';  c.fillText('🔴 Crítica', toX(1), top + 14)
        c.fillStyle = 'rgba(217,119,6,.7)';  c.fillText('🟡 Advertencia', toX(8.1), top + 14)
        c.fillStyle = 'rgba(22,163,74,.7)';  c.fillText('🟢 Saludable', toX(10.5), top + 14)
        c.restore()
      },
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Productos',
          data: ordered.map((p, i) => ({ x: +p.margen.toFixed(2), y: i, _p: p } as any)),
          backgroundColor: colors,
          borderColor:     colors.map(c => c.replace(')', '').replace('rgb', 'rgba') + ',0.8)'),
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 9,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: () => '',
              label(ctx) {
                const p = (ctx.raw as any)._p as Product
                const ps = precioSugerido(p.costoIva)
                const desc = longUbic(p.ubicacion)
                return [
                  '📦 ' + p.nombre.slice(0, 42),
                  'Código: '     + p.codigo,
                  'Marca: '      + (p.marca || '—'),
                  'Ubicación: '  + shortUbic(p.ubicacion) + (desc ? ` (${desc})` : ''),
                  'Existencia: ' + fmtN(p.existencia),
                  'Costo c/IVA: '  + fmt$(p.costoIva),
                  'P. Sugerido: '  + fmt$(ps),
                  'Precio c/IVA: ' + fmt$(p.precioIva),
                  'Margen: '    + fmtPct(p.margen),
                ]
              },
            },
            backgroundColor: 'rgba(15,31,46,.93)',
            bodyColor: '#cbd5e1',
            padding: 10,
            displayColors: false,
            bodyFont: { size: 11 },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Margen %', font: { size: 11 }, color: 'var(--text2)' },
            min: 0, max: 55,
            ticks: { callback: (v) => v + '%', font: { size: 10 }, color: 'var(--text2)' },
            grid: { color: 'rgba(0,0,0,.06)' },
          },
          y: { display: false, min: -1, max: ordered.length },
        },
      },
      plugins: [zoneBandsPlugin as any],
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [products])

  return (
    <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', marginBottom: '0.85rem' }}>
      <div className="text-[0.78rem] font-bold mb-3 flex items-center gap-1.5">
        <span>📊</span> MAPA DE MÁRGENES DE PRODUCTOS
      </div>
      <div className="flex gap-3 flex-wrap mb-3 text-[0.72rem]">
        <span className="mg-badge mg-danger">🔴 <strong>{fmtN(criticos)}</strong> Críticos (&lt;8%)</span>
        <span className="mg-badge mg-warning">🟡 <strong>{fmtN(medios)}</strong> Advertencia (8%–10%)</span>
        <span className="mg-badge mg-success">🟢 <strong>{fmtN(sanos)}</strong> Saludables (≥10%)</span>
        <span className="ml-auto text-[0.68rem]" style={{ color: 'var(--text2)' }}>{fmtN(Math.min(products.length, 300))} productos · cada punto = 1 producto</span>
      </div>
      <div style={{ position: 'relative', height: 420 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
