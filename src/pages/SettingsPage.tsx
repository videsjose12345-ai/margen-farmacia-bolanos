import type { useAppState } from '../hooks/useAppState'

type AppState = ReturnType<typeof useAppState>
interface Props { appState: AppState; triggerFile: () => void }

interface RowProps { label: string; desc?: string; right: React.ReactNode }
function Row({ label, desc, right }: RowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b gap-4" style={{ borderColor: 'var(--border)', fontSize: '0.76rem' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: '0.65rem', color: 'var(--text2)', marginTop: 2 }}>{desc}</div>}
      </div>
      <div>{right}</div>
    </div>
  )
}

export default function SettingsPage({ appState, triggerFile }: Props) {
  const { state, toggleTheme, clearAll } = appState
  const dark = state.theme === 'dark'

  const badge = (txt: string, color: string) => (
    <span style={{ fontWeight: 800, color }}>{txt}</span>
  )

  return (
    <div>
      <div className="rounded-[var(--r)] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>

        <div className="text-[0.8rem] font-bold mb-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>🎨 Apariencia</div>
        <Row label="Tema" desc="Alterna entre modo claro y oscuro"
          right={
            <button onClick={toggleTheme} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.71rem] font-semibold border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
              {dark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            </button>
          }
        />

        <div className="text-[0.8rem] font-bold mb-3 pb-2 border-b mt-5" style={{ borderColor: 'var(--border)' }}>📊 Parámetros de cálculo</div>
        <Row label="IVA aplicado"       desc="Costo × 1.13 · Precio × 1.13"                    right={badge('13%', 'var(--text)')} />
        <Row label="Filtro existencia"  desc="Solo productos con saldo > 0"                      right={badge('Activo', 'var(--success)')} />
        <Row label="Fórmula margen"     desc="(Precio IVA − Costo IVA) / Precio IVA × 100"      right={badge('Estándar', 'var(--text)')} />
        <Row label="Precio sugerido"    desc="Costo con IVA / 0.90 (margen objetivo 10%)"        right={badge('÷ 0.90', 'var(--text)')} />
        <Row label="Orden tabla"        desc="Tabla ordenada de menor a mayor margen por defecto" right={badge('Margen ↑', 'var(--text)')} />
        <Row label="Margen crítico"     desc="Umbral rojo"                                        right={badge('< 8%', 'var(--danger)')} />
        <Row label="Margen bajo"        desc="Umbral amarillo"                                    right={badge('8% – 10%', 'var(--warning)')} />
        <Row label="Margen saludable"   desc="Umbral verde"                                       right={badge('≥ 10%', 'var(--success)')} />

        <div className="text-[0.8rem] font-bold mb-3 pb-2 border-b mt-5" style={{ borderColor: 'var(--border)' }}>🗂 Persistencia</div>
        <Row label="localStorage"    desc="Actual + anterior guardados en el navegador"   right={badge('Activo', 'var(--success)')} />
        <Row label="Firestore"       desc="Historial sincronizado con Firebase"            right={badge('Activo', 'var(--success)')} />

        <div className="text-[0.8rem] font-bold mb-3 pb-2 border-b mt-5" style={{ borderColor: 'var(--border)' }}>🗑 Datos almacenados</div>
        <Row
          label="Limpiar todos los datos"
          desc="Elimina archivos y historial del navegador y Firestore"
          right={
            <button
              onClick={() => { if (confirm('¿Borrar todos los datos? Esto eliminará también el historial de Firestore.')) clearAll() }}
              className="px-3 py-1.5 rounded-lg text-[0.71rem] font-semibold text-white"
              style={{ background: 'var(--danger)' }}
            >
              🗑 Limpiar todo
            </button>
          }
        />
      </div>
    </div>
  )
}
