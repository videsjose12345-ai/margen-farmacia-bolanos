import { useState, useMemo } from 'react'
import type { useAppState } from '../hooks/useAppState'
import type { CmpRow } from '../types'
import { fmt$, fmtDate, fmtN, fmtPct, shortUbic, mgClass } from '../lib/format'

type AppState = ReturnType<typeof useAppState>
interface Props { appState: AppState }

function mgBadge(m: number | null) {
  if (m == null) return <span>—</span>
  const cls = mgClass(m) === 'danger' ? 'mg-badge mg-danger' : mgClass(m) === 'warning' ? 'mg-badge mg-warning' : 'mg-badge mg-success'
  return <span className={cls}>{fmtPct(m)}</span>
}

export default function ComparativoPage({ appState }: Props) {
  const { state } = appState
  const [keyA, setKeyA] = useState('')
  const [keyB, setKeyB] = useState('')

  const files = useMemo(() => {
    const list: { key: string; label: string; products: any[] }[] = []
    if (state.actual)   list.push({ key: 'actual',   label: `Actual — ${fmtDate(state.actual.fecha)}`,   products: state.actual.products })
    if (state.anterior) list.push({ key: 'anterior', label: `Anterior — ${fmtDate(state.anterior.fecha)}`, products: state.anterior.products })
    state.historial.forEach((h, i) => {
      if (h.products?.length)
        list.push({ key: `hist_${i}`, label: `Historial — ${fmtDate(h.fecha)} (${fmtN(h.totalProductos)} prods.)`, products: h.products })
    })
    return list
  }, [state])

  const result = useMemo((): CmpRow[] | null => {
    if (!keyA || !keyB || keyA === keyB) return null
    const fa = files.find(f => f.key === keyA)
    const fb = files.find(f => f.key === keyB)
    if (!fa || !fb) return null

    const mapA = new Map(fa.products.map(p => [p.codigo, p]))
    const mapB = new Map(fb.products.map(p => [p.codigo, p]))
    const codes = new Set([...mapA.keys(), ...mapB.keys()])

    const rows: CmpRow[] = []
    for (const cod of codes) {
      const pa = mapA.get(cod) ?? null
      const pb = mapB.get(cod) ?? null
      const margenA = pa ? pa.margen : null
      const margenB = pb ? pb.margen : null
      const variacion = (margenA != null && margenB != null) ? margenB - margenA : null
      rows.push({
        codigo: cod,
        nombre: (pb ?? pa)!.nombre,
        ubicacion: (pb ?? pa)!.ubicacion,
        costoA:  pa ? pa.costoIva  : null,
        costoB:  pb ? pb.costoIva  : null,
        precioA: pa ? pa.precioIva : null,
        precioB: pb ? pb.precioIva : null,
        margenA, margenB, variacion,
      })
    }
    return rows.sort((a, b) => Math.abs(b.variacion ?? 0) - Math.abs(a.variacion ?? 0))
  }, [keyA, keyB, files])

  const kpis = useMemo(() => {
    if (!result) return null
    const vars = result.filter(r => r.variacion != null).map(r => r.variacion!)
    return {
      mejoro:    result.filter(r => (r.variacion ?? 0) > 0.01).length,
      disminuyo: result.filter(r => (r.variacion ?? 0) < -0.01).length,
      sinCambio: result.filter(r => r.variacion != null && Math.abs(r.variacion) <= 0.01).length,
      varProm:   vars.length ? vars.reduce((a, v) => a + v, 0) / vars.length : 0,
      mayorInc:  vars.length ? Math.max(...vars) : 0,
    }
  }, [result])

  if (!files.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-5xl">📊</div>
        <div className="text-lg font-bold">Sin archivos disponibles</div>
        <div className="text-sm" style={{ color: 'var(--text2)' }}>Cargue al menos dos archivos Excel para habilitar el comparativo.</div>
      </div>
    )
  }

  return (
    <div>
      {/* Selector */}
      <div className="rounded-[var(--r)] p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
        <div className="text-[0.78rem] font-bold mb-3 flex items-center gap-1.5"><span>📊</span> Seleccionar archivos para comparar</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          {[
            { label: '📁 Archivo A (base / anterior)', val: keyA, set: setKeyA },
            { label: '📁 Archivo B (nuevo / actual)',  val: keyB, set: setKeyB },
          ].map(f => (
            <div key={f.label} className="rounded-[var(--r)] p-3" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div className="text-[0.7rem] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text2)' }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} className="w-full" style={{ padding: '0.42rem 0.6rem', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.78rem' }}>
                <option value="">— Seleccionar archivo —</option>
                {files.map(fi => <option key={fi.key} value={fi.key}>{fi.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="text-[0.7rem]" style={{ color: 'var(--text2)' }}>La comparación cruza por Código de Producto.</div>
      </div>

      {result && kpis ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
            {[
              { ico: '🟢', lbl: 'Margen mejoró',   val: fmtN(kpis.mejoro),    cls: 'text-green-600' },
              { ico: '🔴', lbl: 'Margen bajó',      val: fmtN(kpis.disminuyo), cls: 'text-red-500' },
              { ico: '🟡', lbl: 'Sin cambio',       val: fmtN(kpis.sinCambio), cls: 'text-yellow-600' },
              { ico: '📊', lbl: 'Var. prom.',       val: fmtPct(kpis.varProm), cls: kpis.varProm >= 0 ? 'text-green-600' : 'text-red-500' },
              { ico: '⬆️', lbl: 'Mayor incremento', val: '+' + fmtPct(kpis.mayorInc), cls: 'text-green-600' },
            ].map(k => (
              <div key={k.lbl} className="rounded-[var(--r)] p-3 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
                <div className="text-[1.2rem] mb-0.5">{k.ico}</div>
                <div className="text-[0.58rem] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text2)' }}>{k.lbl}</div>
                <div className={`text-[1.1rem] font-extrabold tabular-nums ${k.cls}`}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
            <div className="text-[0.78rem] font-bold mb-3 flex items-center gap-1.5"><span>📋</span> Tabla comparativa de márgenes</div>
            <div style={{ maxHeight: 460, overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
              <table>
                <thead><tr>
                  <th>Código</th><th>Producto</th><th>Ubicación</th>
                  <th className="tr">Costo Ant.</th><th className="tr">Costo Act.</th>
                  <th className="tr">Precio Ant.</th><th className="tr">Precio Act.</th>
                  <th className="tr">Margen Ant.</th><th className="tr">Margen Act.</th>
                  <th className="tr">Variación %</th><th>Estado</th>
                </tr></thead>
                <tbody>
                  {result.slice(0, 500).map(r => {
                    const v = r.variacion
                    const vCls = v == null ? 'text-gray-400' : v > 0.01 ? 'text-green-600 font-bold' : v < -0.01 ? 'text-red-500 font-bold' : 'text-yellow-600 font-bold'
                    const vTxt = v != null ? (v > 0 ? '+' : '') + fmtPct(v) : '—'
                    const estIco = v == null ? '🟡' : v > 0.01 ? '🟢' : v < -0.01 ? '🔴' : '🟡'
                    const estLbl = v == null ? 'Sin datos' : v > 0.01 ? 'Mejoró' : v < -0.01 ? 'Disminuyó' : 'Sin cambio'
                    return (
                      <tr key={r.codigo}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.64rem' }}>{r.codigo}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.nombre}>{r.nombre}</td>
                        <td style={{ color: 'var(--text2)' }} title={r.ubicacion}>{shortUbic(r.ubicacion)}</td>
                        <td className="tr">{r.costoA  != null ? fmt$(r.costoA)  : '—'}</td>
                        <td className="tr" style={{ fontWeight: 600 }}>{r.costoB  != null ? fmt$(r.costoB)  : '—'}</td>
                        <td className="tr">{r.precioA != null ? fmt$(r.precioA) : '—'}</td>
                        <td className="tr" style={{ fontWeight: 600 }}>{r.precioB != null ? fmt$(r.precioB) : '—'}</td>
                        <td className="tr">{mgBadge(r.margenA)}</td>
                        <td className="tr">{mgBadge(r.margenB)}</td>
                        <td className={`tr ${vCls}`}>{vTxt}</td>
                        <td>{estIco} {estLbl}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="text-4xl">📊</div>
          <div className="font-bold">Seleccione dos archivos para comparar</div>
          <div className="text-sm" style={{ color: 'var(--text2)' }}>La comparación cruza los productos por Código y muestra las variaciones de margen.</div>
        </div>
      )}
    </div>
  )
}
