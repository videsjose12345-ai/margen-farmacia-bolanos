export const fmt$ = (v: number | null | undefined): string => {
  if (v == null) return '—'
  return '$' + Number(v).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const fmtPct = (v: number | null | undefined): string => {
  if (v == null) return '—'
  return Number(v).toFixed(2) + '%'
}

export const fmtN = (v: number | null | undefined): string => {
  if (v == null) return '—'
  return Number(v).toLocaleString('es-SV')
}

export const fmtDate = (d: string | undefined): string => {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return d
    return dt.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

/** "BOD-ALM-FAR - BODEGA CENTRAL"  →  "BOD-ALM-FAR" */
export const shortUbic = (u: string): string => {
  if (!u) return '—'
  const idx = u.indexOf(' - ')
  return idx !== -1 ? u.slice(0, idx).trim() : u.trim()
}

/** "BOD-ALM-FAR - BODEGA CENTRAL"  →  "BODEGA CENTRAL" */
export const longUbic = (u: string): string => {
  if (!u) return ''
  const idx = u.indexOf(' - ')
  return idx !== -1 ? u.slice(idx + 3).trim() : ''
}

export const mgClass = (m: number): 'danger' | 'warning' | 'success' => {
  if (m < 8)  return 'danger'
  if (m < 10) return 'warning'
  return 'success'
}

export const precioSugerido = (costoIva: number): number => costoIva / 0.90
