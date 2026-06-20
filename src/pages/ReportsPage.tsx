import type { useAppState } from '../hooks/useAppState'
import { exportPdfAll, exportPdfCriticos } from '../lib/pdfExport'
import { shortUbic } from '../lib/format'
import { useMemo } from 'react'
import type { TableRow } from '../types'

type AppState = ReturnType<typeof useAppState>
interface Props { appState: AppState }

export default function ReportsPage({ appState }: Props) {
  const { state, getProducts } = appState

  const allRows = useMemo((): TableRow[] => {
    const prods = getProducts()
    return prods.map(p => ({ p, costoAntIva: null, variacion: null, margenAnt: null }))
  }, [getProducts])

  const ubicLabel = state.ubicaciones.length === 0
    ? 'Todas'
    : state.ubicaciones.length === 1
    ? shortUbic(state.ubicaciones[0])
    : state.ubicaciones.length + ' ubicaciones'

  const fecha = state.actual?.fecha ?? ''

  const cards = [
    {
      ico: '📊', title: 'Reporte Completo',
      desc: 'Todos los productos con saldo > 0 y sus márgenes',
      action: () => { if (!state.actual) { alert('No hay datos cargados.'); return } exportPdfAll(allRows, fecha, ubicLabel) },
    },
    {
      ico: '⚠️', title: 'Productos Críticos',
      desc: 'Solo productos con margen < 8%',
      action: () => { if (!state.actual) { alert('No hay datos cargados.'); return } exportPdfCriticos(allRows, fecha, ubicLabel) },
    },
    {
      ico: '📋', title: 'Reporte desde Análisis',
      desc: 'Use el botón "📄 Generar PDF" en la tabla del módulo Análisis para exportar con filtros',
      action: () => alert('Vaya al módulo Análisis de Margen Bruto y use el botón "📄 Generar PDF" en la tabla.'),
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {cards.map(c => (
          <div
            key={c.title}
            onClick={c.action}
            className="rounded-[var(--r)] p-5 text-center cursor-pointer transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}
          >
            <div className="text-[1.8rem] mb-2">{c.ico}</div>
            <div className="font-bold text-[0.8rem] mb-1">{c.title}</div>
            <div className="text-[0.68rem]" style={{ color: 'var(--text2)' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
        <div className="text-[0.78rem] font-bold mb-2 flex items-center gap-1.5"><span>ℹ️</span> Cómo generar PDFs</div>
        <div className="text-[0.74rem] leading-relaxed" style={{ color: 'var(--text2)' }}>
          Los reportes se abren en una nueva ventana. Use <strong>Ctrl+P</strong> (o Cmd+P en Mac) para imprimir o guardar como PDF.<br/>
          Todos los precios y costos se muestran <strong>con IVA (13%)</strong> incluido.<br/>
          Para exportar con filtros aplicados, vaya al módulo <strong>Análisis de Margen Bruto</strong> y use el botón <strong>📄 Generar PDF</strong> en la tabla.
        </div>
      </div>
    </div>
  )
}
