import type { useAppState } from '../hooks/useAppState'
import { calcKpis } from '../lib/kpis'
import { fmt$, fmtDate, fmtN, fmtPct, mgClass } from '../lib/format'

type AppState = ReturnType<typeof useAppState>
interface Props { appState: AppState }

function mgBadgeCls(m: number) { return mgClass(m) === 'danger' ? 'mg-badge mg-danger' : mgClass(m) === 'warning' ? 'mg-badge mg-warning' : 'mg-badge mg-success' }

export default function HistoryPage({ appState }: Props) {
  const { state } = appState

  const entries = [
    state.actual   ? (() => { const p = state.actual.products;   const sp = p.reduce((a,x)=>a+x.precioIva*x.existencia,0); const sc=p.reduce((a,x)=>a+x.costoIva*x.existencia,0); return { tipo:'Actual',    fecha:state.actual.fecha,   fileName:state.actual.fileName,   cnt:p.length, mg:p.length?p.reduce((a,x)=>a+x.margen,0)/p.length:0, mgg:sp>0?((sp-sc)/sp)*100:0, ut:sp-sc }})() : null,
    state.anterior ? (() => { const p = state.anterior.products; const sp = p.reduce((a,x)=>a+x.precioIva*x.existencia,0); const sc=p.reduce((a,x)=>a+x.costoIva*x.existencia,0); return { tipo:'Anterior',  fecha:state.anterior.fecha, fileName:state.anterior.fileName, cnt:p.length, mg:p.length?p.reduce((a,x)=>a+x.margen,0)/p.length:0, mgg:sp>0?((sp-sc)/sp)*100:0, ut:sp-sc }})() : null,
    ...state.historial.map(h => ({ tipo:'Histórico', fecha:h.fecha, fileName:h.fileName, cnt:h.totalProductos, mg:h.margenPromedio, mgg:h.margenGlobal, ut:h.utilidadTotal })),
  ].filter(Boolean) as { tipo:string; fecha:string; fileName:string; cnt:number; mg:number; mgg:number; ut:number }[]

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-5xl">📈</div>
        <div className="text-lg font-bold">Sin historial</div>
        <div className="text-sm" style={{ color: 'var(--text2)' }}>Los análisis aparecerán aquí conforme cargue archivos Excel.</div>
      </div>
    )
  }

  const tipoCls = (t: string) => t === 'Actual' ? 'bg-green-100 text-green-700' : t === 'Anterior' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500 border border-gray-200'

  return (
    <div>
      <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', marginBottom: '0.65rem' }}>
        <div className="text-[0.78rem] font-bold mb-3 flex items-center gap-1.5"><span>📈</span> Historial de análisis</div>
        <div style={{ overflow: 'auto' }}>
          <table>
            <thead><tr>
              <th>Estado</th><th>Fecha</th><th>Archivo</th>
              <th className="tr">Prods.</th><th className="tr">Mg. prom.</th>
              <th className="tr">Mg. global</th><th className="tr">Utilidad total</th>
            </tr></thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td><span className={`text-[0.57rem] font-bold px-1.5 py-0.5 rounded ${tipoCls(e.tipo)}`}>{e.tipo.toUpperCase()}</span></td>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtDate(e.fecha)}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>{e.fileName}</td>
                  <td className="tr">{fmtN(e.cnt)}</td>
                  <td className="tr">{fmtPct(e.mg)}</td>
                  <td className="tr"><span className={mgBadgeCls(e.mgg)}>{fmtPct(e.mgg)}</span></td>
                  <td className="tr">{fmt$(e.ut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[0.68rem]" style={{ color: 'var(--text2)' }}>
        Los datos se conservan en Firestore y en localStorage. Al cargar un nuevo archivo: Actual → Anterior → Historial (máx. 10 entradas).
      </p>
    </div>
  )
}
