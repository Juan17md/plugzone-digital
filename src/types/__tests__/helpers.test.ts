import { describe, it, expect } from 'vitest';
import {
  esVentaMultiProducto,
  obtenerTotalVenta,
  obtenerGananciaVenta,
  obtenerCantidadTotal,
  obtenerResumenProductos,
  Venta,
} from '@/types';

const ventaLegacy: Venta = {
  id: 'l1',
  fecha: '2026-08-03T12:00:00',
  metodoPago: 'Efectivo',
  productoId: 'p1',
  nombreProducto: 'Protector',
  cantidadVendida: 2,
  precioVentaFinal: 15,
  gananciaNeta: 10,
};

const ventaMulti: Venta = {
  id: 'm1',
  fecha: '2026-08-03T12:00:00',
  metodoPago: 'Binance',
  items: [
    { productoId: 'p1', nombreProducto: 'Teléfono A', cantidadVendida: 1, precioVentaFinal: 300, gananciaNeta: 50 },
    { productoId: 'p2', nombreProducto: 'Cargador', cantidadVendida: 2, precioVentaFinal: 10, gananciaNeta: 8 },
    { productoId: 'p3', nombreProducto: 'Audífonos', cantidadVendida: 1, precioVentaFinal: 25, gananciaNeta: 12 },
  ],
  totalUSD: 345,
  gananciaNetaTotal: 70,
  productoId: 'p1',
  nombreProducto: 'Teléfono A',
  cantidadVendida: 1,
  precioVentaFinal: 300,
  gananciaNeta: 50,
};

describe('esVentaMultiProducto', () => {
  it('detecta el formato multi-producto', () => {
    expect(esVentaMultiProducto(ventaMulti)).toBe(true);
    expect(esVentaMultiProducto(ventaLegacy)).toBe(false);
  });
});

describe('obtenerTotalVenta', () => {
  it('multiplica precio x cantidad en formato legacy', () => {
    expect(obtenerTotalVenta(ventaLegacy)).toBe(30);
  });

  it('usa totalUSD en formato multi-producto', () => {
    expect(obtenerTotalVenta(ventaMulti)).toBe(345);
  });

  it('recalcula la suma si totalUSD falta en multi-producto', () => {
    const sinTotal = { ...ventaMulti, totalUSD: undefined };
    expect(obtenerTotalVenta(sinTotal)).toBe(345);
  });
});

describe('obtenerGananciaVenta', () => {
  it('devuelve gananciaNeta en formato legacy', () => {
    expect(obtenerGananciaVenta(ventaLegacy)).toBe(10);
  });

  it('usa gananciaNetaTotal en formato multi-producto', () => {
    expect(obtenerGananciaVenta(ventaMulti)).toBe(70);
  });
});

describe('obtenerCantidadTotal', () => {
  it('devuelve la cantidad del formato legacy', () => {
    expect(obtenerCantidadTotal(ventaLegacy)).toBe(2);
  });

  it('suma las cantidades de los items', () => {
    expect(obtenerCantidadTotal(ventaMulti)).toBe(4);
  });
});

describe('obtenerResumenProductos', () => {
  it('devuelve el nombre en formato legacy', () => {
    expect(obtenerResumenProductos(ventaLegacy)).toBe('Protector');
  });

  it('une hasta 2 productos con "+"', () => {
    const dos = { ...ventaMulti, items: ventaMulti.items!.slice(0, 2) };
    expect(obtenerResumenProductos(dos)).toBe('Teléfono A + Cargador');
  });

  it('resume 3+ productos como "X más"', () => {
    expect(obtenerResumenProductos(ventaMulti)).toBe('Teléfono A + 2 más');
  });
});
