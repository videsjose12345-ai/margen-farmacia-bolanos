import { useState, useEffect, useRef } from 'react'
import { shortUbic, longUbic } from '../../lib/format'

interface Props {
  ubicaciones: string[]   // all available (full values from Excel)
  selected:    string[]   // [] = todas
  onChange:    (sel: string[]) => void
}

export default function UbicacionesMultiSelect({ ubicaciones, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const n     = selected.length
  const total = ubicaciones.length
  const label = n === 0 || n === total
    ? `Todas las ubicaciones (${total})`
    : n === 1
    ? shortUbic(selected[0])
    : `${n} ubicaciones seleccionadas`

  function isChecked(u: string) {
    return selected.length === 0 || selected.includes(u)
  }

  function toggle(u: string, checked: boolean) {
    let next: string[]
    if (selected.length === 0) {
      // Was "all" — uncheck one → explicitly select the rest
      next = checked ? ubicaciones : ubicaciones.filter(x => x !== u)
    } else {
      next = checked
        ? [...selected, u]
        : selected.filter(x => x !== u)
      // If all selected → back to "all"
      if (next.length === total) next = []
    }
    onChange(next)
  }

  function selectAll() { onChange([]) }
  function clearAll()  { onChange(ubicaciones.length ? [ubicaciones[0]] : []) }

  return (
    <div ref={wrapRef} className={`ms-wrap ${open ? 'open' : ''}`}>
      <div className="ms-trigger" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: '0.71rem' }}>{label}</span>
        <span className="ms-arrow">▼</span>
      </div>
      <div className="ms-dropdown">
        <div className="ms-actions">
          <button className="ms-action-btn" onClick={selectAll}>✓ Seleccionar todas</button>
          <button className="ms-action-btn" onClick={clearAll}>✕ Limpiar</button>
        </div>
        <div className="ms-list">
          {ubicaciones.length === 0
            ? <div className="ms-empty">Sin ubicaciones en el archivo</div>
            : ubicaciones.map(u => (
              <div className="ms-item" key={u}>
                <input
                  type="checkbox"
                  id={`ms-${u}`}
                  checked={isChecked(u)}
                  onChange={e => toggle(u, e.target.checked)}
                />
                <label htmlFor={`ms-${u}`} title={longUbic(u) || u}>
                  {shortUbic(u)}
                </label>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
