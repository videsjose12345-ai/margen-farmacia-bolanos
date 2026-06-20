import type { TableRow, Product } from '../types'
import { fmt$, fmtPct, fmtN, fmtDate, shortUbic, precioSugerido, mgClass } from './format'
import { calcKpis } from './kpis'
import logoB64 from '../assets/logo.ts'   // re-exported constant

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHeader(title: string, fecha: string, filtros: string, count: number, ubicacion: string): string {
  const products = [] as Product[]  // placeholder — kpis computed by caller
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>${title}</title><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui,sans-serif;font-size:10px;color:#0f1f2e;}
.hdr{padding:11px 17px;border-bottom:2px solid #0e7490;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;}
.hdr img{height:46px;width:auto;}.hdr-t{font-size:15px;font-weight:900;color:#0e7490;margin-top:3px;}
.hdr-info{text-align:right;font-size:8.5px;color:#4a6077;line-height:1.75;}
.krow{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px 17px;border-bottom:1px solid #dde3ec;background:#f8fafc;}
.kc{background:#fff;border:1px solid #dde3ec;border-radius:5px;padding:5px 7px;}
.kl{font-size:7.5px;text-transform:uppercase;letter-spacing:.06em;color:#4a6077;font-weight:700;}
.kv{font-size:12px;font-weight:800;margin-top:1px;}
.sec{padding:8px 17px 0;}
table{width:100%;border-collapse:collapse;font-size:8px;}
thead th{background:#0e7490;color:#fff;padding:3.5px 4.5px;text-align:left;font-weight:700;}
td{padding:2.8px 4.5px;border-bottom:1px solid #f0f4f8;vertical-align:middle;}
tr:nth-child(even) td{background:#f8fafc;}
.tr{text-align:right;}.fw{font-weight:700;}
.cr{color:#dc2626;font-weight:700;}.cy{color:#d97706;font-weight:700;}.cg{color:#16a34a;font-weight:700;}
.row-r td{background:#fff0f0!important;}.row-y td{background:#fffbeb!important;}.row-g td{background:#f0fdf4!important;}
.footer{padding:6px 17px;font-size:7.5px;color:#8ea5bb;text-align:center;border-top:1px solid #dde3ec;margin-top:6px;}
@page{margin:9mm;}
</style></head><body>
<div class="hdr">
  <div><img src="${logoB64}" alt="Farmacia Bolaños"/><div class="hdr-t">${title}</div></div>
  <div class="hdr-info">
    <div><b>Generado:</b> ${new Date().toLocaleString('es-SV')}</div>
    <div><b>Fecha del archivo:</b> ${fmtDate(fecha)}</div>
    <div><b>Filtros:</b> ${filtros || 'Ninguno'}</div>
    <div><b>Registros:</b> ${fmtN(count)} · <b>Ubicación:</b> ${ubicacion}</div>
    <div><b>Nota:</b> Todos los precios incluyen IVA (13%)</div>
  </div>
</div>
<!-- KPI row injected by caller -->
KPIROW_PLACEHOLDER`
}

function buildKpiRow(prods: Product[]): string {
  const k = calcKpis(prods)
  return `<div class="krow">
  <div class="kc"><div class="kl">Productos</div><div class="kv">${fmtN(k.total)}</div></div>
  <div class="kc"><div class="kl">Margen prom.</div><div class="kv">${fmtPct(k.margenProm)}</div></div>
  <div class="kc"><div class="kl">Utilidad total</div><div class="kv">${fmt$(k.utilidadTotal)}</div></div>
  <div class="kc"><div class="kl">Margen global</div><div class="kv">${fmtPct(k.margenGlobal)}</div></div>
  <div class="kc"><div class="kl">Críticos &lt;8%</div><div class="kv cr">${fmtN(k.criticos)}</div></div>
  <div class="kc"><div class="kl">Medios 8–10%</div><div class="kv cy">${fmtN(k.medios)}</div></div>
  <div class="kc"><div class="kl">Sanos ≥10%</div><div class="kv cg">${fmtN(k.sanos)}</div></div>
  <div class="kc"><div class="kl">Exportados</div><div class="kv">${fmtN(k.total)}</div></div>
</div>`
}

function buildResumenBox(rows: TableRow[]): string {
  const prods = rows.map(r => r.p)
  const k = calcKpis(prods)
  return `<div style="padding:8px 17px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;border-bottom:1px solid #dde3ec">
    <div style="background:#fff;border:1px solid #dde3ec;border-radius:5px;padding:5px 7px"><div class="kl">Total productos</div><div class="kv">${fmtN(rows.length)}</div></div>
    <div style="background:#fee2e2;border:1px solid rgba(220,38,38,.2);border-radius:5px;padding:5px 7px"><div class="kl" style="color:#dc2626">Críticos &lt;8%</div><div class="kv cr">${fmtN(k.criticos)}</div></div>
    <div style="background:#fef3c7;border:1px solid rgba(217,119,6,.2);border-radius:5px;padding:5px 7px"><div class="kl" style="color:#d97706">Advertencia 8–10%</div><div class="kv cy">${fmtN(k.medios)}</div></div>
    <div style="background:#dcfce7;border:1px solid rgba(22,163,74,.2);border-radius:5px;padding:5px 7px"><div class="kl" style="color:#16a34a">Saludables ≥10%</div><div class="kv cg">${fmtN(k.sanos)}</div></div>
    <div style="background:#fff;border:1px solid #dde3ec;border-radius:5px;padding:5px 7px"><div class="kl">Margen promedio</div><div class="kv">${fmtPct(k.margenProm)}</div></div>
    <div style="background:#fff;border:1px solid #dde3ec;border-radius:5px;padding:5px 7px"><div class="kl">Utilidad total</div><div class="kv">${fmt$(k.utilidadTotal)}</div></div>
  </div>`
}

function buildTableRows(rows: TableRow[]): string {
  return rows.map(({ p }) => {
    const ps   = precioSugerido(p.costoIva)
    const diff = p.precioIva - ps
    const psCls = diff < -0.005 ? 'cr' : diff > 0.005 ? 'cg' : 'cy'
    const mc   = mgClass(p.margen)
    const crTxt = mc === 'danger' ? 'cr' : mc === 'warning' ? 'cy' : 'cg'
    const rowCls = mc === 'danger' ? 'row-r' : mc === 'warning' ? 'row-y' : 'row-g'
    return `<tr class="${rowCls}">
      <td style="font-family:monospace;font-size:7.5px">${esc(p.codigo)}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.nombre)}</td>
      <td>${esc(p.marca || '—')}</td>
      <td title="${esc(p.ubicacion)}">${esc(shortUbic(p.ubicacion))}</td>
      <td class="tr">${fmtN(p.existencia)}</td>
      <td class="tr">${fmt$(p.costoIva)}</td>
      <td class="tr fw ${psCls}">${fmt$(ps)}</td>
      <td class="tr fw">${fmt$(p.precioIva)}</td>
      <td class="tr ${crTxt}">${fmtPct(p.margen)}</td>
    </tr>`
  }).join('')
}

function buildTable(rows: TableRow[]): string {
  return `<div class="sec"><table><thead><tr>
    <th>Código</th><th>Nombre del Producto</th><th>Marca</th><th>Ubicación</th>
    <th class="tr">Exist.</th><th class="tr">Costo c/IVA</th><th class="tr">💡 P. Sugerido</th>
    <th class="tr">Precio c/IVA</th><th class="tr">Margen %</th>
  </tr></thead><tbody>${buildTableRows(rows)}</tbody></table></div>`
}

function openPrint(html: string) {
  const w = window.open('', '_blank')
  if (!w) { alert('Permita ventanas emergentes para generar el PDF.'); return }
  const footer = `<div class="footer">Farmacia Bolaños · Dashboard Farmacia Bolaños · Precios con IVA (13%) · ${new Date().toLocaleString('es-SV')}</div></body></html>`
  w.document.write(html + footer)
  w.document.close()
  setTimeout(() => { w.focus(); w.print() }, 700)
}

export function exportPdfAll(rows: TableRow[], fecha: string, ubicacion: string) {
  const prods = rows.map(r => r.p)
  const hdr = buildHeader('Reporte Completo de Márgenes', fecha, 'Todos los productos con saldo > 0', rows.length, ubicacion)
    .replace('KPIROW_PLACEHOLDER', buildKpiRow(prods))
  openPrint(hdr + buildResumenBox(rows) + buildTable(rows))
}

export function exportPdfCriticos(rows: TableRow[], fecha: string, ubicacion: string) {
  const criticos = rows.filter(r => r.p.margen < 8)
  const prods    = criticos.map(r => r.p)
  const hdr = buildHeader('Productos Críticos — Margen < 8%', fecha, 'Margen < 8%', criticos.length, ubicacion)
    .replace('KPIROW_PLACEHOLDER', buildKpiRow(prods))
  openPrint(hdr + buildResumenBox(criticos) + buildTable(criticos))
}

export function exportPdfFiltered(rows: TableRow[], fecha: string, filtros: string, ubicacion: string) {
  const prods = rows.map(r => r.p)
  const hdr = buildHeader('Exportación Filtrada', fecha, filtros, rows.length, ubicacion)
    .replace('KPIROW_PLACEHOLDER', buildKpiRow(prods))
  openPrint(hdr + buildResumenBox(rows) + buildTable(rows))
}

export function exportPdfSmart(
  allRows: TableRow[],
  filtRows: TableRow[],
  hasFilters: boolean,
  fecha: string,
  filtros: string,
  ubicacion: string,
) {
  if (hasFilters && filtRows.length) {
    exportPdfFiltered(filtRows, fecha, filtros, ubicacion)
  } else {
    // Priorizado: críticos → advertencia → saludables
    const priorizado = [
      ...allRows.filter(r => r.p.margen <  8).sort((a, b) => a.p.margen - b.p.margen),
      ...allRows.filter(r => r.p.margen >= 8 && r.p.margen < 10).sort((a, b) => a.p.margen - b.p.margen),
      ...allRows.filter(r => r.p.margen >= 10).sort((a, b) => a.p.margen - b.p.margen),
    ]
    const prods = priorizado.map(r => r.p)
    const hdr = buildHeader('Reporte Priorizado por Margen', fecha, 'Sin filtros — Críticos → Advertencia → Saludables', priorizado.length, ubicacion)
      .replace('KPIROW_PLACEHOLDER', buildKpiRow(prods))
    openPrint(hdr + buildResumenBox(priorizado) + buildTable(priorizado))
  }
}
