export type CategoriaProducto = 'Teléfonos' | 'Protectores' | 'Cargadores' | 'Auriculares' | 'Otros';

export interface Producto {
  id: string;
  sku: string;          // Código de barra o identificador único
  nombre: string;
  marca: string;
  categoria: CategoriaProducto;
  costoCompra: number;  // Costo de adquisición
  precioVenta: number;  // PVP cobrado
  stockActual: number;  // Cantidad física disponible
  stockMinimo: number;  // Umbral mínimo para alertas de reposición
  creadoEn?: string;
  ram?: string;         // Memoria RAM (opcional para teléfonos)
  almacenamiento?: string; // Almacenamiento interno (opcional para teléfonos)
}

export type MetodoPago = 'Efectivo' | 'Pago Móvil' | 'Transferencia' | 'Punto' | 'Zelle' | 'Binance';

// Representa cada artículo dentro de una venta multi-producto
export interface ItemVenta {
  productoId: string;
  nombreProducto: string;
  cantidadVendida: number;
  precioVentaFinal: number;  // Precio personalizado o PVP
  gananciaNeta: number;      // Ganancia individual = (precio - costoCompra) * cantidad
}

export interface Venta {
  id: string;
  fecha: string;
  metodoPago: MetodoPago;
  anulada?: boolean;

  // Datos del cliente
  nombreCliente?: string;
  cedulaCliente?: string;
  telefonoCliente?: string;
  direccionCliente?: string;

  // ── Multi-producto (formato nuevo) ──
  items?: ItemVenta[];        // Array de artículos del carrito
  totalUSD?: number;          // Total calculado de la transacción
  gananciaNetaTotal?: number; // Suma de ganancias de todos los items

  // ── Legacy (formato antiguo — retrocompatibilidad ventas históricas) ──
  productoId: string;
  nombreProducto: string;
  cantidadVendida: number;
  precioVentaFinal: number;
  gananciaNeta: number;
}

// ── Helpers de normalización (ambos formatos) ──

/** Detecta si la venta usa el formato multi-producto */
export const esVentaMultiProducto = (v: Venta): boolean =>
  Array.isArray(v.items) && v.items.length > 0;

/** Obtiene el total USD unificado */
export const obtenerTotalVenta = (v: Venta): number =>
  esVentaMultiProducto(v)
    ? (v.totalUSD ?? v.items!.reduce((acc, i) => acc + i.precioVentaFinal * i.cantidadVendida, 0))
    : (v.precioVentaFinal || 0) * (v.cantidadVendida || 1);

/** Obtiene la ganancia neta unificada */
export const obtenerGananciaVenta = (v: Venta): number =>
  esVentaMultiProducto(v)
    ? (v.gananciaNetaTotal ?? v.items!.reduce((acc, i) => acc + i.gananciaNeta, 0))
    : (v.gananciaNeta || 0);

/** Obtiene la cantidad total de unidades vendidas */
export const obtenerCantidadTotal = (v: Venta): number =>
  esVentaMultiProducto(v)
    ? v.items!.reduce((acc, i) => acc + i.cantidadVendida, 0)
    : (v.cantidadVendida || 1);

/** Genera un resumen textual de los productos de la venta */
export const obtenerResumenProductos = (v: Venta): string => {
  if (!esVentaMultiProducto(v)) return v.nombreProducto;
  const nombres = v.items!.map(i => i.nombreProducto);
  if (nombres.length <= 2) return nombres.join(' + ');
  return `${nombres[0]} + ${nombres.length - 1} más`;
};

export type CategoriaGasto = 'Alquiler' | 'Sueldos' | 'Servicios' | 'Publicidad' | 'Reparaciones' | 'Envíos' | 'Suministros' | 'Otros';

export interface GastoOperativo {
  id: string;
  descripcion: string;  // Descripción del gasto operativo
  monto: number;        // Egreso en USD
  categoria: CategoriaGasto;
  metodoPago: MetodoPago;  // Método del que sale el dinero (descuenta de la caja)
  fecha: string;        // ISO String
}

export type RolUsuario = 'admin' | 'operador';

export interface Usuario {
  uid: string;
  email: string;
  rol: RolUsuario;
  bloqueado: boolean;
  primerInicio: boolean;
  creadoEn: string;
}

export interface RetiroCaja {
  id: string;
  metodoPago: MetodoPago;
  monto: number;        // Salida en USD
  concepto?: string;    // Motivo del retiro
  fecha: string;        // ISO String
  registradoPor?: string;
  registradoPorEmail?: string;
}

export type MontosPorMetodo = Partial<Record<MetodoPago, number>>;

export interface CierreCaja {
  id: string;                    // Fecha del lunes de la semana (ISO)
  semanaInicio: string;          // Lunes 00:00:00
  semanaFin: string;             // Domingo 23:59:59.999
  montosVentas: MontosPorMetodo; // Ventas agrupadas por método
  montosRetiros: MontosPorMetodo;// Retiros agrupados por método
  montosGastos?: MontosPorMetodo;// Gastos agrupados por método (cierres anteriores a 2026-08-08 no lo tienen)
  saldoEsperado: MontosPorMetodo;// ventas - retiros - gastos por método
  arqueoReal: MontosPorMetodo;   // Monto contado físicamente por método
  diferencia: MontosPorMetodo;   // arqueoReal - saldoEsperado (puede ser negativo)
  totalVentas: number;
  totalRetiros: number;
  totalGastos?: number; // Total de gastos de la semana (cierres anteriores a 2026-08-08 no lo tienen)
  totalEsperado: number;
  totalArqueo: number;
  totalDiferencia: number;
  registradoPor?: string;
  registradoPorEmail?: string;
  fechaCierre: string;           // ISO String del momento del cierre
  observaciones?: string;
}
