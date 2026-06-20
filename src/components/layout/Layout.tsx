import { useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { useAppState } from '../../hooks/useAppState'
import logoSrc from '../../assets/logo.ts'
import UbicacionesMultiSelect from '../ui/UbicacionesMultiSelect'

type AppStateReturn = ReturnType<typeof useAppState>

interface Props {
  children: ReactNode
  appState: AppStateReturn
  triggerFile: () => void
}

const NAV = [
  { path: '/analysis',    label: 'Análisis de Margen Bruto',  icon: '📊' },
  { path: '/comparativo', label: 'Comparativo de Márgenes',   icon: '📊' },
  { path: '/history',     label: 'Historial de Cargas',       icon: '📈' },
  { path: '/reports',     label: 'Reportes PDF',              icon: '📄' },
]

const PAGE_META: Record<string, { title: string; bc: string }> = {
  '/':            { title: 'Inicio',                    bc: 'Dashboard Farmacia Bolaños' },
  '/analysis':    { title: 'Análisis de Margen Bruto',  bc: 'Costos y precios con IVA (13%) · Saldo > 0' },
  '/comparativo': { title: 'Comparativo de Márgenes',   bc: 'Comparación de dos archivos por código de producto' },
  '/history':     { title: 'Historial de Cargas',       bc: 'Archivos analizados anteriormente' },
  '/reports':     { title: 'Reportes PDF',              bc: 'Exportar informes' },
  '/settings':    { title: 'Configuración',             bc: 'Parámetros del sistema' },
}

export default function Layout({ children, appState, triggerFile }: Props) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { state, toggleTheme, getAllUbicaciones, setUbicaciones } = appState

  const meta = PAGE_META[location.pathname] || { title: '', bc: '' }
  const isAnalysis = location.pathname === '/analysis'

  return (
    <div className="flex min-h-screen">

      {/* ── SIDEBAR ── */}
      <nav className="sidebar fixed top-0 left-0 bottom-0 z-50 flex flex-col overflow-hidden"
           style={{ width: 'var(--sw)', background: 'linear-gradient(180deg,#0c3a52 0%,#0e7490 100%)' }}>

        {/* Home button replaces logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-4 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/10 text-left w-full"
        >
          <span className="text-xl">🏠</span>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm">Inicio</span>
            <span className="text-xs text-white/50 font-normal">Dashboard Farmacia Bolaños</span>
          </div>
        </button>

        <div className="text-center text-[0.6rem] font-extrabold uppercase tracking-widest text-white/40 px-4 py-2">
          Dashboard Farmacia Bolaños
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-1">
          <div className="px-4 pb-1 pt-2 text-[0.57rem] font-extrabold uppercase tracking-widest text-white/30">Módulos</div>
          {NAV.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item w-full flex items-center gap-2 px-4 py-2.5 text-[0.78rem] font-medium transition-colors relative
                ${location.pathname === item.path ? 'active bg-white/16 text-white font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              {location.pathname === item.path && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-sm" style={{ background: 'var(--lime)' }} />
              )}
              <span className="text-[0.92rem] w-5 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="px-4 pb-1 pt-3 text-[0.57rem] font-extrabold uppercase tracking-widest text-white/30">Sistema</div>
          <button
            onClick={() => navigate('/settings')}
            className={`nav-item w-full flex items-center gap-2 px-4 py-2.5 text-[0.78rem] font-medium transition-colors relative
              ${location.pathname === '/settings' ? 'active bg-white/16 text-white font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            {location.pathname === '/settings' && (
              <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-sm" style={{ background: 'var(--lime)' }} />
            )}
            <span className="text-[0.92rem] w-5 text-center">⚙</span>
            Configuración
          </button>

          <div className="px-4 pb-1 pt-3 text-[0.57rem] font-extrabold uppercase tracking-widest text-white/30">Cargar datos</div>
          <button
            onClick={triggerFile}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[0.78rem] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-[0.92rem] w-5 text-center">📂</span>
            Cargar Excel
          </button>
        </div>

        <div className="px-4 py-2 text-center text-[0.6rem] text-white/25 border-t border-white/10">
          v2.2 · Farmacia Bolaños
        </div>
      </nav>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1" style={{ marginLeft: 'var(--sw)' }}>

        {/* TOPBAR */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-2.5 border-b"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--sh-sm)' }}>
          <div>
            <div className="font-bold text-[0.93rem]">{meta.title}</div>
            <div className="text-[0.67rem]" style={{ color: 'var(--text2)' }}>{meta.bc}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAnalysis && state.actual && (
              <UbicacionesMultiSelect
                ubicaciones={getAllUbicaciones()}
                selected={state.ubicaciones}
                onChange={setUbicaciones}
              />
            )}
            <button
              onClick={triggerFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.71rem] font-semibold text-white transition-colors"
              style={{ background: 'var(--teal)' }}
            >
              📂 Cargar Excel
            </button>
            <button
              onClick={toggleTheme}
              className="px-2 py-1.5 rounded-lg text-[0.86rem] border transition-colors"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text2)' }}
            >
              {state.theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-5 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
