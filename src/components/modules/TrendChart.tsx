import { useEffect, useRef } from 'react'
import { Chart, LineController, LinearScale, PointElement, LineElement, CategoryScale, Tooltip, Filler } from 'chart.js'
import type { HistoryEntry, AnalysisFile } from '../../types'
import { fmtDate, fmtPct, fmt$ } from '../../lib/format'

Chart.register(LineController, LinearScale, PointElement, LineElement, CategoryScale, Tooltip, Filler)

interface TrendPoint { fecha: string; prom: number; min: number; max: number; cnt: number; ut: number }

function buildPoints(actual: AnalysisFile | null, anterior: AnalysisFile | null, historial: HistoryEntry[]): TrendPoint[] {
  const pts: TrendPoint[] = []

  ;[...historial].reverse().forEach(h => pts.push({
    fecha: h.fecha,
    prom:  h.margenPromedio,
    min:   h.margenMin,
    max:   h.margenMax,
    cnt:   h.totalProductos,
    ut:    h.utilidadTotal,
  }))

  const addFile = (f: AnalysisFile | null) => {
    if (!f) return
    const p   = f.products
    const mgs = p.map(x => x.margen)
    const sp  = p.reduce((a, x) => a + x.precioIva * x.existencia, 0)
    const sc  = p.reduce((a, x) => a + x.costoIva  * x.existencia, 0)
    pts.push({
      fecha: f.fecha,
      prom:  p.length ? p.reduce((a, x) => a + x.margen, 0) / p.length : 0,
      min:   mgs.length ? Math.min(...mgs) : 0,
      max:   mgs.length ? Math.max(...mgs) : 0,
      cnt:   p.length,
      ut:    sp - sc,
    })
  }

  addFile(anterior)
  addFile(actual)
  return pts
}

interface Props { actual: AnalysisFile | null; anterior: AnalysisFile | null; historial: HistoryEntry[] }

export default function TrendChart({ actual, anterior, historial }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pts = buildPoints(actual, anterior, historial)

    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    if (!canvasRef.current) return

    if (pts.length < 1) return

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: pts.map(p => fmtDate(p.fecha)),
        datasets: [
          {
            label: 'Margen Promedio',
            data: pts.map(p => +p.prom.toFixed(2)),
            borderColor: '#0e7490', backgroundColor: 'rgba(14,116,144,.1)',
            fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#0e7490', borderWidth: 2.5,
          },
          {
            label: 'Margen Mínimo',
            data: pts.map(p => +p.min.toFixed(2)),
            borderColor: '#dc2626', backgroundColor: 'transparent',
            fill: false, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#dc2626', borderWidth: 2,
            borderDash: [5, 4],
          },
          {
            label: 'Margen Máximo',
            data: pts.map(p => +p.max.toFixed(2)),
            borderColor: '#2563eb', backgroundColor: 'transparent',
            fill: false, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#2563eb', borderWidth: 2,
            borderDash: [5, 4],
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => fmtDate(pts[items[0].dataIndex].fecha),
              afterBody: (items) => {
                const p = pts[items[0].dataIndex]
                return ['Productos: ' + p.cnt, 'Utilidad total: ' + fmt$(p.ut)]
              },
            },
          },
        },
        scales: {
          y: { ticks: { callback: (v) => Number(v).toFixed(1) + '%', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [actual, anterior, historial])

  const pts = buildPoints(actual, anterior, historial)

  return (
    <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', marginBottom: '0.65rem' }}>
      <div className="text-[0.78rem] font-bold mb-3 flex items-center gap-1.5">
        <span>📊</span> Tendencia Histórica de Márgenes
      </div>
      <div className="flex gap-4 flex-wrap mb-3 text-[0.7rem]">
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: '#0e7490', verticalAlign: 'middle' }} />Margen promedio</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: '#dc2626', verticalAlign: 'middle' }} />Margen mínimo</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: '#2563eb', verticalAlign: 'middle' }} />Margen máximo</span>
      </div>
      {pts.length < 1
        ? <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: 'var(--text2)' }}>Cargue al menos un archivo para ver la tendencia.</div>
        : <div ref={wrapRef} style={{ position: 'relative', height: 210 }}><canvas ref={canvasRef} /></div>
      }
    </div>
  )
}
