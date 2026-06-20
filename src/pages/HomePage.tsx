import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { useAppState } from '../hooks/useAppState'
import KpiCard from '../components/ui/KpiCard'
import TrendChart from '../components/modules/TrendChart'
import { calcKpis } from '../lib/kpis'
import { fmt$, fmtDate, fmtN, fmtPct, shortUbic, mgClass } from '../lib/format'
import logoSrc from '../assets/logo.ts'

type AppState = ReturnType<typeof useAppState>
interface Props { appState: AppState; triggerFile: () => void }

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}

export default function HomePage({ appState, triggerFile }: Props) {
  const { state, getProducts } = appState
  const navigate = useNavigate()
  const now = useClock()
  const prods = getProducts()
  const kpis  = calcKpis(prods)
  const has   = !!state.actual

  const sorted = [...prods].sort((a, b) => b.margen - a.margen)
  const top5   = sorted.slice(0, 5)
  const bot5   = [...prods].sort((a, b) => a.margen - b.margen).slice(0, 5)

  const ubicsCount = has ? new Set(state.actual!.products.map(p => p.ubicacion)).size : 0

  const fileEntries = [
    state.actual   ? { label: 'Actual',    cls: 'fb-a',  fname: state.actual.fileName,   fecha: state.actual.fecha,   cnt: state.actual.products.length }   : null,
    state.anterior ? { label: 'Anterior',  cls: 'fb-b',  fname: state.anterior.fileName, fecha: state.anterior.fecha, cnt: state.anterior.products.length } : null,
    ...state.historial.slice(0, 4).map(h => ({ label: 'Histórico', cls: 'fb-h', fname: h.fileName, fecha: h.fecha, cnt: h.totalProductos })),
  ].filter(Boolean) as { label: string; cls: string; fname: string; fecha: string; cnt: number }[]

  const mgTextCls = (m: number) => mgClass(m) === 'danger' ? 'text-red-500' : mgClass(m) === 'warning' ? 'text-yellow-600' : 'text-green-600'

  return (
    <div>
      {/* HERO */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-6 overflow-hidden relative"
           style={{ background: 'linear-gradient(135deg,#0c3a52 0%,#0e7490 55%,#0891b2 100%)' }}>
        <div className="z-10">
          <div className="text-[0.6rem] font-extrabold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,.6)' }}>✦ Sistema interno · Farmacia Bolaños</div>
          <div className="text-2xl font-black text-white leading-tight mb-1">ANÁLISIS DE MARGEN BRUTO</div>
          <div className="text-[0.78rem]" style={{ color: 'rgba(255,255,255,.7)' }}>Control y monitoreo de rentabilidad, costos y precios de venta.</div>
        </div>
        <div className="z-10 text-right" style={{ color: 'rgba(255,255,255,.9)' }}>
          <div className="text-3xl font-extrabold tabular-nums leading-none">
            {now.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-[0.7rem] mt-1" style={{ color: 'rgba(255,255,255,.58)' }}>
            {now.toLocaleDateString('es-SV', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="absolute right-[-50px] top-[-50px] w-[200px] h-[200px] rounded-full" style={{ background: 'rgba(255,255,255,.05)' }} />
      </div>

      {/* KPIs */}
      <div className="text-[0.7rem] font-extrabold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text2)' }}>📊 Indicadores Generales</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 mb-5">
        <KpiCard icon="📦" label="Productos con existencia"  value={has ? fmtN(kpis.total)           : '—'} sub="saldo > 0"          color="teal" />
        <KpiCard icon="📈" label="Margen promedio"           value={has ? fmtPct(kpis.margenProm)    : '—'} sub="del portafolio"     color="success" />
        <KpiCard icon="⚠️" label="Margen < 8%"              value={has ? fmtN(kpis.criticos)         : '—'} sub="productos críticos" color="danger" />
        <KpiCard icon="✅" label="Margen ≥ 10%"             value={has ? fmtN(kpis.sanos)            : '—'} sub="margen saludable"   color="lime" />
        <KpiCard icon="📅" label="Última actualización"      value={has ? fmtDate(state.actual!.fecha): 'Sin datos'} sub="fecha del archivo" color="purple" />
        <KpiCard icon="📍" label="Ubicaciones"               value={has ? String(ubicsCount)          : '—'} sub="registradas"        color="warning" />
      </div>

      {/* QUICK ACCESS */}
      <div className="text-[0.7rem] font-extrabold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text2)' }}>⚡ Accesos Rápidos</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 mb-5">
        {[
          { ico: '📊', lbl: 'Análisis de Margen Bruto', sub: 'Costos, precios y rentabilidad', path: '/analysis' },
          { ico: '📊', lbl: 'Comparativo de Márgenes',  sub: 'Comparar dos archivos',          path: '/comparativo' },
          { ico: '📈', lbl: 'Historial de Cargas',       sub: 'Archivos anteriores',            path: '/history' },
          { ico: '📄', lbl: 'Reportes PDF',              sub: 'Exportar informes',              path: '/reports' },
          { ico: '⚙', lbl: 'Configuración',             sub: 'Parámetros del sistema',        path: '/settings' },
        ].map(q => (
          <div key={q.path} onClick={() => navigate(q.path)}
               className="rounded-[var(--r)] p-4 text-center cursor-pointer transition-all hover:-translate-y-0.5"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
            <div className="text-[1.6rem] mb-1.5">{q.ico}</div>
            <div className="text-[0.74rem] font-bold">{q.lbl}</div>
            <div className="text-[0.6rem] mt-0.5" style={{ color: 'var(--text2)' }}>{q.sub}</div>
          </div>
        ))}
      </div>

      {/* TREND */}
      <TrendChart actual={state.actual} anterior={state.anterior} historial={state.historial} />

      {/* TOP / BOTTOM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2.5">
        <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
          <div className="text-[0.78rem] font-bold mb-3">🏆 Top 5 mejor margen</div>
          {top5.length ? top5.map((p, i) => (
            <div key={p.codigo} className="flex items-center gap-2 p-1.5 rounded mb-1 text-[0.72rem]" style={{ background: 'var(--surface2)' }}>
              <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[0.56rem] font-extrabold flex-shrink-0" style={{ background: 'var(--success-lt)', color: 'var(--success)' }}>{i+1}</span>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold" title={p.nombre}>{p.nombre.length > 24 ? p.nombre.slice(0, 24) + '…' : p.nombre}</span>
              <span className={`font-extrabold whitespace-nowrap ${mgTextCls(p.margen)}`}>{fmtPct(p.margen)}</span>
            </div>
          )) : <div className="text-[0.76rem] text-center py-4" style={{ color: 'var(--text2)' }}>Sin datos</div>}
        </div>
        <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
          <div className="text-[0.78rem] font-bold mb-3">🔻 Top 5 peor margen</div>
          {bot5.length ? bot5.map((p, i) => (
            <div key={p.codigo} className="flex items-center gap-2 p-1.5 rounded mb-1 text-[0.72rem]" style={{ background: 'var(--surface2)' }}>
              <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[0.56rem] font-extrabold flex-shrink-0" style={{ background: 'var(--danger-lt)', color: 'var(--danger)' }}>{i+1}</span>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold" title={p.nombre}>{p.nombre.length > 24 ? p.nombre.slice(0, 24) + '…' : p.nombre}</span>
              <span className={`font-extrabold whitespace-nowrap ${mgTextCls(p.margen)}`}>{fmtPct(p.margen)}</span>
            </div>
          )) : <div className="text-[0.76rem] text-center py-4" style={{ color: 'var(--text2)' }}>Sin datos</div>}
        </div>
      </div>

      {/* FILE LIST */}
      <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
        <div className="text-[0.78rem] font-bold mb-3">🗂 Últimos archivos cargados</div>
        {fileEntries.length ? fileEntries.map((e, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded mb-1.5 text-[0.72rem]" style={{ background: 'var(--surface2)' }}>
            <span className={`text-[0.57rem] font-bold px-1.5 py-0.5 rounded ${e.cls === 'fb-a' ? 'bg-green-100 text-green-700' : e.cls === 'fb-b' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {e.label.toUpperCase()}
            </span>
            <span className="font-semibold flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{e.fname}</span>
            <span className="whitespace-nowrap" style={{ color: 'var(--text2)' }}>{fmtDate(e.fecha)}</span>
            <span className="whitespace-nowrap" style={{ color: 'var(--text2)' }}>{fmtN(e.cnt)} prods.</span>
          </div>
        )) : (
          <div className="text-center py-6 text-[0.78rem]" style={{ color: 'var(--text2)' }}>
            No hay archivos cargados aún. <button onClick={triggerFile} className="underline" style={{ color: 'var(--teal)' }}>Cargar Excel</button>
          </div>
        )}
      </div>
    </div>
  )
}
