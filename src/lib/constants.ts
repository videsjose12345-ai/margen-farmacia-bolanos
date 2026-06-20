export const IVA = 1.13

export const STORAGE_KEY = 'fb_dash_v4'

export const COL_ALIASES = {
  codigo:    ['codigo producto','cod producto','codigo','cod','code','item','sku','codigoproducto','codprod','ref'],
  nombre:    ['nombre producto','nombre','descripcion','producto','articulo','detalle','nombreprod','desc'],
  marca:     ['marca','brand','fabricante','laboratorio','lab'],
  ubicacion: ['ubicacion','ubicación','location','bodega','almacen','lugar','zona','area','departamento'],
  saldo:     ['saldo','stock','existencia','cantidad','qty','quantity','exist','inventario','unidades','cant'],
  costo:     ['costo promedio','costo prom','costopromedio','costo','cost','costounitario','costobase'],
  precio:    ['precio de lista','precio lista','preciolista','precio','pvp','price','preciodeventa','precioventa'],
} as const

export const MARGIN_THRESHOLDS = {
  critico:    8,
  advertencia: 10,
} as const
