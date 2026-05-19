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

export type MetodoPago = 'Efectivo' | 'Pago Móvil' | 'Transferencia' | 'Tarjeta' | 'Punto' | 'Zelle';

export interface Venta {
  id: string;
  productoId: string;
  nombreProducto: string;
  cantidadVendida: number;
  precioVentaFinal: number;
  metodoPago: MetodoPago;
  gananciaNeta: number;
  fecha: string;
}

export type CategoriaGasto = 'Alquiler' | 'Sueldos' | 'Servicios' | 'Publicidad' | 'Reparaciones' | 'Envíos' | 'Suministros' | 'Otros';

export interface GastoOperativo {
  id: string;
  descripcion: string;  // Descripción del gasto operativo
  monto: number;        // Egreso en USD
  categoria: CategoriaGasto;
  fecha: string;        // ISO String
}
