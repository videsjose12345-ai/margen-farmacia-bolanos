import { useState, useEffect, useCallback } from 'react'
import type { AppState, AnalysisFile, HistoryEntry, Product } from '../types'
import { STORAGE_KEY } from '../lib/constants'
import {
  saveHistoryEntry,
  loadHistorial,
  clearHistorial,
} from '../firebase/historialService'

const defaultState: AppState = {
  actual:      null,
  anterior:    null,
  historial:   [],
  ubicaciones: [],
  theme:       'light',
}

function loadLocal(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<AppState>
  } catch {
    return {}
  }
}

function saveLocal(s: AppState) {
  try {
    const o = {
      theme:       s.theme,
      ubicaciones: s.ubicaciones,
      actual:      s.actual   ? { fecha: s.actual.fecha,   fileName: s.actual.fileName,   products: s.actual.products }   : null,
      anterior:    s.anterior ? { fecha: s.anterior.fecha, fileName: s.anterior.fileName, products: s.anterior.products } : null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o))
  } catch {
    // storage full — ignore
  }
}

function buildHistEntry(f: AnalysisFile): Omit<HistoryEntry, 'id'> {
  const p   = f.products
  const sp  = p.reduce((a, x) => a + x.precioIva * x.existencia, 0)
  const sc  = p.reduce((a, x) => a + x.costoIva  * x.existencia, 0)
  const mgs = p.map(x => x.margen)
  return {
    fecha:          f.fecha,
    fileName:       f.fileName,
    totalProductos: p.length,
    margenPromedio: p.length ? p.reduce((a, x) => a + x.margen, 0) / p.length : 0,
    margenGlobal:   sp > 0 ? ((sp - sc) / sp) * 100 : 0,
    utilidadTotal:  sp - sc,
    margenMin:      mgs.length ? Math.min(...mgs) : 0,
    margenMax:      mgs.length ? Math.max(...mgs) : 0,
    products:       p,
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadLocal()
    return { ...defaultState, ...saved }
  })

  // Load historial from Firestore on mount
  useEffect(() => {
    loadHistorial()
      .then(hist => setState(s => ({ ...s, historial: hist })))
      .catch(err => console.warn('[FB] Firestore loadHistorial:', err))
  }, [])

  // Persist theme + ubicaciones + actual/anterior to localStorage whenever they change
  useEffect(() => {
    saveLocal(state)
  }, [state])

  // Apply theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  const toggleTheme = useCallback(() => {
    setState(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
  }, [])

  const setUbicaciones = useCallback((u: string[]) => {
    setState(s => ({ ...s, ubicaciones: u }))
  }, [])

  /**
   * Load a new Excel result:
   * actual → anterior → Firestore historial
   */
  const loadFile = useCallback(async (parsed: AnalysisFile) => {
    setState(s => {
      const next = { ...s }

      if (s.actual) {
        if (s.anterior) {
          // push anterior to Firestore
          const entry = buildHistEntry(s.anterior)
          saveHistoryEntry(entry)
            .then(id => {
              setState(prev => ({
                ...prev,
                historial: [{ ...entry, id }, ...prev.historial].slice(0, 10),
              }))
            })
            .catch(err => console.warn('[FB] saveHistoryEntry:', err))
        }
        next.anterior = s.actual
      }

      next.actual      = parsed
      next.ubicaciones = []   // reset to "todas" on new file
      return next
    })
  }, [])

  const clearAll = useCallback(async () => {
    await clearHistorial().catch(err => console.warn('[FB] clearHistorial:', err))
    setState({ ...defaultState })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Helper: get products filtered by current ubicaciones selection
  const getProducts = useCallback((): Product[] => {
    if (!state.actual) return []
    const p = state.actual.products
    if (!state.ubicaciones.length) return p
    const set = new Set(state.ubicaciones)
    return p.filter(x => set.has(x.ubicacion))
  }, [state.actual, state.ubicaciones])

  // Helper: get all ubicaciones from current file
  const getAllUbicaciones = useCallback((): string[] => {
    if (!state.actual) return []
    return [...new Set(
      state.actual.products
        .map(p => (p.ubicacion || '').trim())
        .filter(u => u.length > 0)
    )].sort((a, b) => a.localeCompare(b, 'es'))
  }, [state.actual])

  return {
    state,
    setState,
    toggleTheme,
    setUbicaciones,
    loadFile,
    clearAll,
    getProducts,
    getAllUbicaciones,
  }
}
