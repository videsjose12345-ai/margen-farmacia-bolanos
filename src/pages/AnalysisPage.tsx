import React, { useMemo, useState } from 'react'
import type { useAppState } from '../hooks/useAppState'
import type { TableRow } from '../types'
import { calcKpis } from '../lib/kpis'
import { fmt$, fmtDate, fmtN, fmtPct, shortUbic, precioSugerido, mgClass } from '../lib/format'
import KpiCard from '../components/ui/KpiCard'
import { exportPdfSmart } from '../lib/pdfExport'
import logoSrc from '../assets/logo.ts'

type AppState = ReturnType<typeof useAppState>
interface Props { appState: AppState; triggerFile: () => void }

type SortCol = keyof TableRow['p'] | 'variacion' | 'margenAnt' | 'costoAntIva' | 'precioSug'
type SortDir = 'asc' | 'desc'

interface Filters {
  cod: string; nom: string; marca: string; ubic: string
  mg: string; mgMin: string; mgMax: string; psug: string
}

const EMPTY_FILTERS: Filters = { cod: '', nom: '', marca: '', ubic: '', mg: '', mgMin: '', mgMax: '', psug: '' }

function mgBadge(m: number) {
  return mgClass(m) === 'danger' ? 'mg-badge mg-danger' : mgClass(m) === 'warning' ? 'mg-badge mg-warning' : 'mg-badge mg-success'
}

export default function AnalysisPage({ appState, triggerFile }: Props) {
  const { state, getProducts } = appState

  const [sortCol, setSortCol] = useState<SortCol>('margen')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  if (!state.actual) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-5xl">📊</div>
        <div className="text-lg font-bold">Sin datos cargados</div>
        <div className="text-sm" style={{ color: 'var(--text2)' }}>
          Cargue un archivo Excel para ver el análisis. Solo se muestran productos con saldo &gt; 0.
        </div>
        <button onClick={triggerFile} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--teal)' }}>
          📂 Cargar archivo Excel
        </button>
      </div>
    )
  }

  const prods = getProducts()
  const kpis  = calcKpis(prods)

  const anteriorMap = useMemo(() => {
    if (!state.anterior) return null
    const m = new Map<string, import('../types').Product>()
    for (const p of state.anterior.products) m.set(p.codigo + '__' + p.ubicacion, p)
    return m
  }, [state.anterior])

  const allRows: TableRow[] = useMemo(() => {
    return prods.map((p: typeof prods[0]) => {
      const prev        = anteriorMap?.get(p.codigo + '__' + p.ubicacion) ?? null
      const costoAntIva = prev ? prev.costoIva : null
      const variacion   = (costoAntIva != null && costoAntIva > 0) ? ((p.costoIva - costoAntIva) / costoAntIva) * 100 : null
      const margenAnt   = prev && prev.precioIva > 0 ? ((prev.precioIva - prev.costoIva) / prev.precioIva) * 100 : null
      return { p, costoAntIva, variacion, margenAnt }
    })
  }, [prods, anteriorMap])

  const sortedRows = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...allRows].sort((a, b) => {
      if (sortCol === 'variacion')   { const av = a.variacion   ?? -Infinity; const bv = b.variacion   ?? -Infinity; return dir * (av - bv) }
      if (sortCol === 'margenAnt')   { const av = a.margenAnt   ?? -Infinity; const bv = b.margenAnt   ?? -Infinity; return dir * (av - bv) }
      if (sortCol === 'costoAntIva') { const av = a.costoAntIva ?? -Infinity; const bv = b.costoAntIva ?? -Infinity; return dir * (av - bv) }
      if (sortCol === 'precioSug')   { return dir * (a.p.costoIva / 0.90 - b.p.costoIva / 0.90) }
      if (['codigo', 'nombre', 'marca', 'ubicacion'].includes(sortCol as string)) {
        return dir * String((a.p as unknown as Record<string, unknown>)[sortCol] || '').localeCompare(String((b.p as unknown as Record<string, unknown>)[sortCol] || ''))
      }
      return dir * (((a.p as unknown as Record<string, number>)[sortCol] ?? 0) - ((b.p as unknown as Record<string, number>)[sortCol] ?? 0))
    })
  }, [allRows, sortCol, sortDir])

  const filtRows = useMemo(() => {
    return sortedRows.filter(({ p }: typeof sortedRows[0]) => {
      if (filters.cod  && !p.codigo.toLowerCase().includes(filters.cod.toLowerCase()))  return false
      if (filters.nom  && !p.nombre.toLowerCase().includes(filters.nom.toLowerCase()))  return false
      if (filters.marca && p.marca !== filters.marca)    return false
      if (filters.ubic  && p.ubicacion !== filters.ubic) return false
      if (filters.mg) {
        if (filters.mg === 'rojo'     && p.margen >= 8)  return false
        if (filters.mg === 'amarillo' && (p.margen < 8 || p.margen >= 10)) return false
        if (filters.mg === 'verde'    && p.margen < 10)  return false
      }
      const mn = parseFloat(filters.mgMin); if (!isNaN(mn) && p.margen < mn) return false
      const mx = parseFloat(filters.mgMax); if (!isNaN(mx) && p.margen > mx) return false
      if (filters.psug) {
        const ps   = precioSugerido(p.costoIva)
        const diff = p.precioIva - ps
        if (filters.psug === 'bajo'  && diff >= -0.005) return false
        if (filters.psug === 'sobre' && diff <=  0.005) return false
        if (filters.psug === 'igual' && Math.abs(diff) > 0.005) return false
      }
      return true
    })
  }, [sortedRows, filters])

  const hasFilters = Object.values(filters).some(v => v !== '')

  const marcas = useMemo(() => [...new Set(prods.map(p => p.marca).filter(Boolean))].sort(), [prods])
  const ubics  = useMemo(() => [...new Set(prods.map(p => p.ubicacion))].sort(), [prods])

  function sort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function thSuffix(col: SortCol) {
    return sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  }

  const getFiltrosText = () => {
    const parts: string[] = []
    if (filters.cod)   parts.push('Código: '     + filters.cod)
    if (filters.nom)   parts.push('Nombre: '     + filters.nom)
    if (filters.marca) parts.push('Marca: '      + filters.marca)
    if (filters.ubic)  parts.push('Ubicación: '  + shortUbic(filters.ubic))
    if (filters.mg)    parts.push('Margen: '     + filters.mg)
    if (filters.mgMin) parts.push('Mg.mín: '     + filters.mgMin + '%')
    if (filters.mgMax) parts.push('Mg.máx: '     + filters.mgMax + '%')
    if (filters.psug)  parts.push('P.Sugerido: ' + filters.psug)
    return parts.join(' · ') || 'Ninguno'
  }

  const ubicLabel = state.ubicaciones.length === 0
    ? 'Todas'
    : state.ubicaciones.length === 1
    ? shortUbic(state.ubicaciones[0])
    : state.ubicaciones.length + ' ubicaciones'

  const costsUp = useMemo(() =>
    allRows
      .filter(r => r.costoAntIva != null && r.p.costoIva > r.costoAntIva)
      .sort((a, b) => (b.variacion ?? 0) - (a.variacion ?? 0)),
    [allRows],
  )

  const inputStyle = {
    padding: '0.33rem 0.55rem',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: '0.69rem',
    width: '100%',
  } as const

  const selectStyle = {
    padding: '0.33rem 0.55rem',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: '0.69rem',
  } as const

  return (
    <div>
      {/* ANALYSIS HEADER WITH LOGO */}
      <div
        className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg,#0c3a52 0%,#0e7490 60%,#0891b2 100%)' }}
      >
        <div className="flex items-center gap-4">
          <img src={logoSrc} alt="Farmacia Bolaños" className="h-[46px] w-auto" />
          <div>
            <div className="text-[1rem] font-black text-white tracking-tight">ANÁLISIS DE MARGEN BRUTO</div>
            <div className="text-[0.68rem]" style={{ color: 'rgba(255,255,255,.68)' }}>
              Control y monitoreo de rentabilidad · Costos y precios con IVA (13%) · Solo productos con saldo &gt; 0
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div
        className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-[var(--r)] mb-4 text-[0.68rem]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
      >
        <div className="flex flex-wrap gap-3 items-center">
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />Actual: <b>{fmtDate(state.actual.fecha)}</b></span>
          {state.anterior && (
            <span>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: 'var(--text3)' }} />
              Anterior: <b>{fmtDate(state.anterior.fecha)}</b>
            </span>
          )}
          <span>Ubicación: <b>{ubicLabel}</b></span>
          <span>Prods.: <b>{fmtN(prods.length)}</b></span>
        </div>
        <button
          onClick={appState.clearAll}
          className="text-[0.68rem] hover:text-red-500 transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          🗑 Limpiar datos
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mb-4">
        <KpiCard icon="📦" label="Productos"      value={fmtN(kpis.total)}          sub="saldo > 0" color="teal" />
        <KpiCard icon="📈" label="Margen prom."   value={fmtPct(kpis.margenProm)}   color={mgClass(kpis.margenProm) as 'danger' | 'warning' | 'success'} />
        <KpiCard icon="💰" label="Utilidad total" value={fmt$(kpis.utilidadTotal)}   color="teal" />
        <KpiCard icon="⚠️" label="Críticos <8%"  value={fmtN(kpis.criticos)}        color="danger" />
        <KpiCard icon="⚡" label="Medios 8–10%"  value={fmtN(kpis.medios)}          color="warning" />
        <KpiCard icon="✅" label="Sanos ≥10%"    value={fmtN(kpis.sanos)}           color="success" />
      </div>

      {/* MAIN TABLE */}
      <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', marginBottom: '0.65rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="text-[0.78rem] font-bold flex items-center gap-1.5">
            <span>📋</span> Tabla de productos
            <span className="font-normal text-[0.66rem]" style={{ color: 'var(--text2)' }}>(c/IVA · saldo &gt; 0 · orden: margen ↑)</span>
          </div>
          <div className="flex items-center gap-2 text-[0.69rem]" style={{ color: 'var(--text2)' }}>
            <span>{hasFilters ? `${fmtN(filtRows.length)} de ${fmtN(allRows.length)}` : fmtN(filtRows.length)} productos</span>
            {hasFilters && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="px-1.5 py-0.5 rounded text-[0.63rem] font-semibold border"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
              >
                ✕ Limpiar filtros
              </button>
            )}
            <button
              onClick={() => exportPdfSmart(allRows, filtRows, hasFilters, state.actual!.fecha, getFiltrosText(), ubicLabel)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.68rem] font-semibold text-white"
              style={{ background: 'var(--teal)' }}
            >
              📄 Generar PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-1.5 mb-3">
          <input type="text" placeholder="Código…"  value={filters.cod}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, cod: e.target.value }))}
            style={inputStyle} />
          <input type="text" placeholder="Nombre…"  value={filters.nom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, nom: e.target.value }))}
            style={inputStyle} />
          <select value={filters.marca}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, marca: e.target.value }))}
            style={selectStyle}>
            <option value="">Marca: Todas</option>
            {marcas.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.ubic}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, ubic: e.target.value }))}
            style={selectStyle}>
            <option value="">Ubicación: Todas</option>
            {ubics.map((u: string) => <option key={u} value={u} title={u}>{shortUbic(u)}</option>)}
          </select>
          <select value={filters.mg}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, mg: e.target.value }))}
            style={selectStyle}>
            <option value="">Margen: Todos</option>
            <option value="rojo">&lt;8%</option>
            <option value="amarillo">8%–10%</option>
            <option value="verde">≥10%</option>
          </select>
          <input type="number" step="0.1" placeholder="Mg. mín. %" value={filters.mgMin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, mgMin: e.target.value }))}
            style={inputStyle} />
          <select value={filters.psug}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, psug: e.target.value }))}
            style={selectStyle}>
            <option value="">P. Sugerido: Todos</option>
            <option value="bajo">🔴 Precio &lt; Sugerido</option>
            <option value="igual">🟡 Precio = Sugerido</option>
            <option value="sobre">🟢 Precio &gt; Sugerido</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ maxHeight: 480, overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
          <table>
            <thead>
              <tr>
                {(
                  [
                    { col: 'codigo'        as SortCol, label: 'Código',          cls: '' },
                    { col: 'nombre'        as SortCol, label: 'Nombre',          cls: '' },
                    { col: 'marca'         as SortCol, label: 'Marca',           cls: '' },
                    { col: 'ubicacion'     as SortCol, label: 'Ubicación',       cls: '' },
                    { col: 'existencia'    as SortCol, label: 'Existencia',      cls: 'tr' },
                    { col: 'costoIva'      as SortCol, label: 'Costo c/IVA',     cls: 'tr' },
                    { col: 'precioSug'     as SortCol, label: '💡 P. Sugerido', cls: 'tr' },
                    { col: 'precioIva'     as SortCol, label: 'Precio c/IVA',    cls: 'tr' },
                    { col: 'margen'        as SortCol, label: 'Margen %',        cls: 'tr' },
                    { col: 'utilidadUnit'  as SortCol, label: 'Utilidad Unit.',  cls: 'tr' },
                    { col: 'utilidadTotal' as SortCol, label: 'Utilidad Total',  cls: 'tr' },
                  ] as Array<{ col: SortCol; label: string; cls: string }>
                ).map(h => (
                  <th key={h.col} onClick={() => sort(h.col)} className={h.cls}>
                    {h.label}{thSuffix(h.col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtRows.slice(0, 600).map(({ p }: typeof filtRows[0]) => {
                const ps     = precioSugerido(p.costoIva)
                const diff   = p.precioIva - ps
                const psCls  = diff < -0.005 ? 'text-red-500 font-bold' : diff > 0.005 ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'
                const psIcon = diff < -0.005 ? '🔴' : diff > 0.005 ? '🟢' : '🟡'
                return (
                  <tr key={p.codigo + p.ubicacion}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.64rem' }}>{p.codigo}</td>
                    <td style={{ maxWidth: 185, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nombre}>{p.nombre}</td>
                    <td style={{ color: 'var(--text2)' }}>{p.marca || '—'}</td>
                    <td style={{ color: 'var(--text2)' }} title={p.ubicacion}>{shortUbic(p.ubicacion)}</td>
                    <td className="tr">{fmtN(p.existencia)}</td>
                    <td className="tr" style={{ fontWeight: 600 }}>{fmt$(p.costoIva)}</td>
                    <td className={`tr ${psCls}`}>{psIcon} {fmt$(ps)}</td>
                    <td className="tr">{fmt$(p.precioIva)}</td>
                    <td className="tr"><span className={mgBadge(p.margen)}>{fmtPct(p.margen)}</span></td>
                    <td className="tr">{fmt$(p.utilidadUnit)}</td>
                    <td className="tr" style={{ fontWeight: 600 }}>{fmt$(p.utilidadTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* COSTS UP */}
      {anteriorMap && anteriorMap.size > 0 && (
        <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
          <div className="text-[0.78rem] font-bold mb-3 flex items-center gap-1.5">
            <span>📈</span> Productos cuyo costo aumentó ({costsUp.length})
          </div>
          {costsUp.length === 0 ? (
            <div className="text-[0.76rem] text-center py-4" style={{ color: 'var(--text2)' }}>
              Ningún costo aumentó respecto al archivo anterior.
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
              <table>
                <thead><tr>
                  <th>Código</th><th>Producto</th><th>Ubicación</th>
                  <th className="tr">Saldo</th>
                  <th className="tr">Costo ant. c/IVA</th>
                  <th className="tr">Costo act. c/IVA</th>
                  <th className="tr">Variación %</th>
                </tr></thead>
                <tbody>
                  {costsUp.slice(0, 80).map(({ p, costoAntIva, variacion }: typeof costsUp[0]) => (
                    <tr key={p.codigo}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.64rem' }}>{p.codigo}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nombre}>{p.nombre}</td>
                      <td style={{ color: 'var(--text2)' }} title={p.ubicacion}>{shortUbic(p.ubicacion)}</td>
                      <td className="tr">{fmtN(p.existencia)}</td>
                      <td className="tr">{fmt$(costoAntIva)}</td>
                      <td className="tr" style={{ fontWeight: 600 }}>{fmt$(p.costoIva)}</td>
                      <td className="tr text-red-500 font-bold">+{fmtPct(variacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}