import type { Product, KpiSet } from '../types'

export function calcKpis(prods: Product[]): KpiSet {
  const n   = prods.length
  const sp  = prods.reduce((a, p) => a + p.precioIva * p.existencia, 0)
  const sc  = prods.reduce((a, p) => a + p.costoIva  * p.existencia, 0)
  const ut  = prods.reduce((a, p) => a + p.utilidadTotal, 0)
  const mgArr = prods.map(p => p.margen)

  return {
    total:         n,
    sp,
    sc,
    utilidadTotal: ut,
    margenProm:    n ? prods.reduce((a, p) => a + p.margen, 0) / n : 0,
    margenGlobal:  sp > 0 ? ((sp - sc) / sp) * 100 : 0,
    criticos:      prods.filter(p => p.margen < 8).length,
    medios:        prods.filter(p => p.margen >= 8 && p.margen < 10).length,
    sanos:         prods.filter(p => p.margen >= 10).length,
    existTotal:    prods.reduce((a, p) => a + p.existencia, 0),
    costoProm:     n ? prods.reduce((a, p) => a + p.costoIva, 0) / n : 0,
    precioProm:    n ? prods.reduce((a, p) => a + p.precioIva, 0) / n : 0,
    margenMin:     mgArr.length ? Math.min(...mgArr) : 0,
    margenMax:     mgArr.length ? Math.max(...mgArr) : 0,
  }
}
