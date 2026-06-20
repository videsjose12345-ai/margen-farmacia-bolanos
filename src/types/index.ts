// ── Product ────────────────────────────────────────────────────────
export interface Product {
  codigo:       string
  nombre:       string
  marca:        string
  ubicacion:    string   // valor original completo del Excel
  existencia:   number
  costoSinIva:  number
  precioSinIva: number
  costoIva:     number
  precioIva:    number
  margen:       number   // % calculado con IVA
  utilidadUnit: number
  utilidadTotal: number
}

// ── Loaded analysis file ───────────────────────────────────────────
export interface AnalysisFile {
  fecha:    string
  fileName: string
  products: Product[]
}

// ── History entry (lightweight, stored in Firestore / localStorage) ─
export interface HistoryEntry {
  id?:            string   // Firestore document id
  fecha:          string
  fileName:       string
  totalProductos: number
  margenPromedio: number
  margenGlobal:   number
  utilidadTotal:  number
  margenMin:      number
  margenMax:      number
  products:       Product[]  // full products stored for comparativo
}

// ── KPI bag ───────────────────────────────────────────────────────
export interface KpiSet {
  total:         number
  sp:            number
  sc:            number
  utilidadTotal: number
  margenProm:    number
  margenGlobal:  number
  criticos:      number
  medios:        number
  sanos:         number
  existTotal:    number
  costoProm:     number
  precioProm:    number
  margenMin:     number
  margenMax:     number
}

// ── Table row (with comparison data) ──────────────────────────────
export interface TableRow {
  p:            Product
  costoAntIva:  number | null
  variacion:    number | null
  margenAnt:    number | null
}

// ── Comparativo row ────────────────────────────────────────────────
export interface CmpRow {
  codigo:    string
  nombre:    string
  ubicacion: string
  costoA:    number | null
  costoB:    number | null
  precioA:   number | null
  precioB:   number | null
  margenA:   number | null
  margenB:   number | null
  variacion: number | null
}

// ── App global state ───────────────────────────────────────────────
export interface AppState {
  actual:      AnalysisFile | null
  anterior:    AnalysisFile | null
  historial:   HistoryEntry[]
  ubicaciones: string[]   // [] = todas; array = seleccionadas
  theme:       'light' | 'dark'
}

export type Page = 'home' | 'analysis' | 'comparativo' | 'history' | 'reports' | 'settings'
