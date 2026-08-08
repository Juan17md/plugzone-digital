import { describe, it, expect } from 'vitest';
import {
  METODOS_PAGO,
  METODO_COLORS,
  nombreMetodo,
  agruparVentasPorMetodo,
  agruparRetirosPorMetodo,
  sumarMontos,
  calcularResumenCaja,
  calcularDiferenciaCierre,
  redondearParaArqueo,
} from '@/utils/caja';
import { Venta, RetiroCaja, MetodoPago } from '@/types';

const LUNES = new Date('2026-08-03T00:00:00');
const DOMINGO = new Date('2026-08-09T23:59:59.999');
const FUERA = new Date('2026-08-10T00:00:00');

const ventaLegacy = (id: string, fecha: Date, metodoPago: MetodoPago, total: number, anulada = false): Venta => ({
  id,
  fecha: fecha.toISOString(),
  metodoPago,
  anulada,
  productoId: 'p1',
  nombreProducto: 'Protector',
  cantidadVendida: 1,
  precioVentaFinal: total,
  gananciaNeta: total - 2,
});

const retiro = (id: string, fecha: Date, metodoPago: MetodoPago, monto: number): RetiroCaja => ({
  id,
  fecha: fecha.toISOString(),
  metodoPago,
  monto,
});

describe('Métodos de pago', () => {
  it('registra los 7 métodos incluyendo Binance', () => {
    expect(METODOS_PAGO.map(m => m.value)).toEqual([
      'Efectivo',
      'Pago Móvil',
      'Transferencia',
      'Binance',
      'Tarjeta',
      'Punto',
      'Zelle',
    ]);
  });

  it('define el color de marca dorado para Binance', () => {
    expect(METODO_COLORS.Binance).toBe('#F0B90B');
  });

  it('nombreMetodo devuelve la etiqueta legible', () => {
    expect(nombreMetodo('Binance')).toBe('Binance (USDT)');
    expect(nombreMetodo('Transferencia')).toBe('Transferencia Bancaria');
  });
});

describe('agruparVentasPorMetodo', () => {
  it('agrupa solo ventas no anuladas dentro del rango', () => {
    const ventas = [
      ventaLegacy('v1', LUNES, 'Efectivo', 100),
      ventaLegacy('v2', DOMINGO, 'Binance', 50),
      ventaLegacy('v3', FUERA, 'Efectivo', 999),
      ventaLegacy('v4', LUNES, 'Efectivo', 200, true),
    ];
    const res = agruparVentasPorMetodo(ventas, LUNES, DOMINGO);
    expect(res.Efectivo).toBe(100);
    expect(res.Binance).toBe(50);
  });

  it('ignora ventas anuladas', () => {
    const res = agruparVentasPorMetodo([ventaLegacy('v1', LUNES, 'Efectivo', 300, true)], LUNES, DOMINGO);
    expect(res.Efectivo).toBeUndefined();
  });

  it('redondea a 2 decimales', () => {
    const res = agruparVentasPorMetodo([ventaLegacy('v1', LUNES, 'Efectivo', 10.005)], LUNES, DOMINGO);
    expect(res.Efectivo).toBe(10.01);
  });
});

describe('agruparRetirosPorMetodo', () => {
  it('agrupa retiros del rango por método', () => {
    const retiros = [
      retiro('r1', LUNES, 'Efectivo', 40),
      retiro('r2', DOMINGO, 'Efectivo', 10),
      retiro('r3', FUERA, 'Efectivo', 999),
      retiro('r4', LUNES, 'Binance', 20),
    ];
    const res = agruparRetirosPorMetodo(retiros, LUNES, DOMINGO);
    expect(res.Efectivo).toBe(50);
    expect(res.Binance).toBe(20);
  });
});

describe('sumarMontos', () => {
  it('suma los montos presentes ignorando métodos sin valor', () => {
    expect(sumarMontos({ Efectivo: 100, Binance: 50 })).toBe(150);
  });
});

describe('calcularResumenCaja', () => {
  it('calcula ventas, retiros y saldo por método (ventas - retiros)', () => {
    const ventas = [
      ventaLegacy('v1', LUNES, 'Efectivo', 100),
      ventaLegacy('v2', LUNES, 'Binance', 50),
      ventaLegacy('v3', LUNES, 'Efectivo', 200, true),
    ];
    const retiros = [retiro('r1', LUNES, 'Efectivo', 30), retiro('r2', LUNES, 'Binance', 10)];

    const res = calcularResumenCaja(ventas, retiros, LUNES, DOMINGO);

    expect(res.ventas.Efectivo).toBe(100);
    expect(res.ventas.Binance).toBe(50);
    expect(res.retiros.Efectivo).toBe(30);
    expect(res.retiros.Binance).toBe(10);
    expect(res.saldo.Efectivo).toBe(70);
    expect(res.saldo.Binance).toBe(40);
    expect(res.saldo.Transferencia).toBe(0);
    expect(res.totalVentas).toBe(150);
    expect(res.totalRetiros).toBe(40);
    expect(res.totalSaldo).toBe(110);
  });

  it('permite saldo negativo si los retiros superan las ventas', () => {
    const res = calcularResumenCaja(
      [ventaLegacy('v1', LUNES, 'Efectivo', 10)],
      [retiro('r1', LUNES, 'Efectivo', 25)],
      LUNES,
      DOMINGO
    );
    expect(res.saldo.Efectivo).toBe(-15);
    expect(res.totalSaldo).toBe(-15);
  });

  it('usa totalUSD para ventas multi-producto', () => {
    const ventaMulti: Venta = {
      id: 'v1',
      fecha: LUNES.toISOString(),
      metodoPago: 'Pago Móvil',
      items: [
        { productoId: 'p1', nombreProducto: 'A', cantidadVendida: 1, precioVentaFinal: 30, gananciaNeta: 10 },
        { productoId: 'p2', nombreProducto: 'B', cantidadVendida: 2, precioVentaFinal: 10, gananciaNeta: 5 },
      ],
      totalUSD: 50,
      gananciaNetaTotal: 15,
      productoId: 'p1',
      nombreProducto: 'A',
      cantidadVendida: 1,
      precioVentaFinal: 30,
      gananciaNeta: 10,
    };
    const res = calcularResumenCaja([ventaMulti], [], LUNES, DOMINGO);
    expect(res.ventas['Pago Móvil']).toBe(50);
  });
});

describe('calcularDiferenciaCierre', () => {
  it('calcula arqueoReal - saldoEsperado (negativo = faltante)', () => {
    const esperado = { Efectivo: 100, Binance: 50 };
    const real = { Efectivo: 95, Binance: 60 };
    const dif = calcularDiferenciaCierre(esperado, real);
    expect(dif.Efectivo).toBe(-5);
    expect(dif.Binance).toBe(10);
  });

  it('redondea la diferencia a 2 decimales', () => {
    const dif = calcularDiferenciaCierre({ Efectivo: 100 }, { Efectivo: 100.015 });
    expect(dif.Efectivo).toBe(0.02);
  });
});

describe('redondearParaArqueo', () => {
  it('redondea a 2 decimales', () => {
    expect(redondearParaArqueo(10.555)).toBe(10.56);
    expect(redondearParaArqueo(10)).toBe(10);
  });
});
