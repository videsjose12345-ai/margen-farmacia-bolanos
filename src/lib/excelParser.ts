import * as XLSX from 'xlsx'
import { IVA, COL_ALIASES } from './constants'
import type { AnalysisFile, Product } from '../types'

function normStr(s: unknown): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function findCol(headers: string[], aliases: readonly string[]): number {
  const n = headers.map(h => normStr(h))
  // exact match
  for (const a of aliases) {
    const na = normStr(a)
    const i = n.findIndex(h => h === na)
    if (i !== -1) return i
  }
  // contains (min 4 chars)
  for (const a of aliases) {
    const na = normStr(a)
    if (na.length < 4) continue
    const i = n.findIndex(h => h.includes(na) || na.includes(h))
    if (i !== -1) return i
  }
  // word match
  for (const a of aliases) {
    const words = normStr(a).match(/[a-z0-9]{3,}/g) || []
    for (const w of words) {
      const i = n.findIndex(h => h.includes(w))
      if (i !== -1) return i
    }
  }
  return -1
}

function toNum(v: unknown): number {
  const s = String(v ?? '').replace(/[$,\s]/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

export async function parseExcelFile(file: File): Promise<AnalysisFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) throw new Error('No se pudo leer el archivo.')

        const wb = XLSX.read(data, { type: 'array', cellDates: true })
        if (!wb.SheetNames.length) throw new Error('El archivo no contiene hojas de cálculo.')

        // Pick sheet with most cells
        let bestSheet = wb.SheetNames[0]
        let bestCount = 0
        for (const name of wb.SheetNames) {
          const ref = wb.Sheets[name]['!ref']
          if (ref) {
            const r = XLSX.utils.decode_range(ref)
            const c = (r.e.r - r.s.r) * (r.e.c - r.s.c)
            if (c > bestCount) { bestCount = c; bestSheet = name }
          }
        }

        const ws = wb.Sheets[bestSheet]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as unknown[][]

        if (rows.length < 2) throw new Error('El archivo parece vacío.')

        // Find header row
        let headerIdx = 0
        let bestScore = 0
        for (let i = 0; i < Math.min(20, rows.length); i++) {
          const filled = rows[i].filter(c => String(c).trim() !== '').length
          if (filled > bestScore) { bestScore = filled; headerIdx = i }
          if (filled >= 5) break
        }

        const headers = rows[headerIdx].map(h => String(h))
        console.log('[FB] Headers (row', headerIdx, '):', headers.join(' | '))

        const iCod    = findCol(headers, COL_ALIASES.codigo)
        const iNom    = findCol(headers, COL_ALIASES.nombre)
        const iMarca  = findCol(headers, COL_ALIASES.marca)
        const iUbic   = findCol(headers, COL_ALIASES.ubicacion)
        const iSaldo  = findCol(headers, COL_ALIASES.saldo)
        const iCosto  = findCol(headers, COL_ALIASES.costo)
        const iPrecio = findCol(headers, COL_ALIASES.precio)

        console.log('[FB] Map → Nom:', iNom, 'Saldo:', iSaldo, 'Costo:', iCosto, 'Precio:', iPrecio)

        const missing: string[] = []
        if (iNom   === -1) missing.push('Nombre Producto')
        if (iSaldo === -1) missing.push('Saldo')
        if (iCosto === -1) missing.push('Costo Promedio')
        if (iPrecio === -1) missing.push('Precio de Lista')
        if (missing.length) {
          const cols = headers.filter(h => h.trim()).join(', ')
          throw new Error(`Columnas no encontradas: ${missing.join(', ')}.\n\nColumnas en el archivo:\n${cols}`)
        }

        const products: Product[] = []

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.length === 0) continue

          const nombre = String(row[iNom] ?? '').trim()
          if (!nombre || nombre.length < 2) continue

          const saldo = toNum(row[iSaldo])
          if (saldo <= 0) continue  // filtro saldo > 0

          const costoSinIva  = toNum(row[iCosto])
          const precioSinIva = toNum(row[iPrecio])
          if (costoSinIva === 0 && precioSinIva === 0) continue

          const costoIva     = costoSinIva  * IVA
          const precioIva    = precioSinIva * IVA
          const margen       = precioIva > 0 ? ((precioIva - costoIva) / precioIva) * 100 : 0
          const utilidadUnit = precioIva - costoIva
          const utilidadTotal = utilidadUnit * saldo

          const ubicRaw = iUbic !== -1 ? String(row[iUbic] ?? '').trim() : ''

          products.push({
            codigo:        iCod !== -1 ? String(row[iCod] ?? '').trim() || String(i) : String(i),
            nombre,
            marca:         iMarca !== -1 ? String(row[iMarca] ?? '').trim() : '',
            ubicacion:     ubicRaw || 'Sin Ubicación',
            existencia:    saldo,
            costoSinIva,
            precioSinIva,
            costoIva,
            precioIva,
            margen,
            utilidadUnit,
            utilidadTotal,
          })
        }

        console.log('[FB] Productos cargados:', products.length)
        if (!products.length) {
          throw new Error('No se encontraron productos con saldo > 0. Verifique que la columna Saldo tenga valores positivos.')
        }

        const fechaM = file.name.match(/(\d{4}[-_/]\d{1,2}[-_/]\d{1,2})|(\d{1,2}[-_/]\d{1,2}[-_/]\d{4})/)
        const fecha  = fechaM ? fechaM[0].replace(/[_/]/g, '-') : new Date().toISOString().slice(0, 10)

        resolve({ fecha, fileName: file.name, products })
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }

    reader.onerror = () => reject(new Error('No se pudo leer el archivo. Verifique que sea .xlsx o .xls válido.'))
    reader.readAsArrayBuffer(file)
  })
}
