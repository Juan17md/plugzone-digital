import { MetodoPago, Venta, RetiroCaja, GastoOperativo, MontosPorMetodo, obtenerTotalVenta } from '@/types';

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Pago Móvil', label: 'Pago Móvil' },
  { value: 'Transferencia', label: 'Transferencia Bancaria' },
  { value: 'Binance', label: 'Binance (USDT)' },
  { value: 'Punto', label: 'Punto de Venta' },
  { value: 'Zelle', label: 'Zelle' },
];

export const METODO_COLORS: Record<MetodoPago, string> = {
  Efectivo: '#10B981',
  'Pago Móvil': '#00F2FE',
  Transferencia: '#FF9F43',
  Punto: '#F472B6',
  Zelle: '#6366F1',
  Binance: '#F0B90B',
};

export const nombreMetodo = (metodo: MetodoPago): string =>
  METODOS_PAGO.find(m => m.value === metodo)?.label ?? metodo;

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

export const redondearParaArqueo = (valor: number): number => redondear(valor);

export function agruparVentasPorMetodo(ventas: Venta[], inicio: Date, fin: Date): MontosPorMetodo {
  const agrupado: MontosPorMetodo = {};
  ventas.forEach(v => {
    if (v.anulada) return;
    const fecha = new Date(v.fecha);
    if (fecha < inicio || fecha > fin) return;
    const total = obtenerTotalVenta(v);
    agrupado[v.metodoPago] = redondear((agrupado[v.metodoPago] ?? 0) + total);
  });
  return agrupado;
}

export function agruparRetirosPorMetodo(retiros: RetiroCaja[], inicio: Date, fin: Date): MontosPorMetodo {
  const agrupado: MontosPorMetodo = {};
  retiros.forEach(r => {
    const fecha = new Date(r.fecha);
    if (fecha < inicio || fecha > fin) return;
    agrupado[r.metodoPago] = redondear((agrupado[r.metodoPago] ?? 0) + r.monto);
  });
  return agrupado;
}

export function agruparGastosPorMetodo(gastos: GastoOperativo[], inicio: Date, fin: Date): MontosPorMetodo {
  const agrupado: MontosPorMetodo = {};
  gastos.forEach(g => {
    const fecha = new Date(g.fecha);
    if (fecha < inicio || fecha > fin) return;
    agrupado[g.metodoPago] = redondear((agrupado[g.metodoPago] ?? 0) + g.monto);
  });
  return agrupado;
}

export function sumarMontos(montos: MontosPorMetodo): number {
  return redondear(Object.values(montos).reduce((acc, m) => acc + (m ?? 0), 0));
}

export interface ResumenCajaSemana {
  ventas: MontosPorMetodo;
  retiros: MontosPorMetodo;
  gastos: MontosPorMetodo;
  saldo: MontosPorMetodo;
  totalVentas: number;
  totalRetiros: number;
  totalGastos: number;
  totalSaldo: number;
}

export function calcularResumenCajaTotal(ventas: Venta[], retiros: RetiroCaja[], gastos: GastoOperativo[]): ResumenCajaSemana {
  const inicio = new Date(0);
  const fin = new Date(8640000000000000);
  return calcularResumenCaja(ventas, retiros, gastos, inicio, fin);
}

export function calcularResumenCaja(ventas: Venta[], retiros: RetiroCaja[], gastos: GastoOperativo[], inicio: Date, fin: Date): ResumenCajaSemana {
  const ventasPorMetodo = agruparVentasPorMetodo(ventas, inicio, fin);
  const retirosPorMetodo = agruparRetirosPorMetodo(retiros, inicio, fin);
  const gastosPorMetodo = agruparGastosPorMetodo(gastos, inicio, fin);

  const saldo: MontosPorMetodo = {};
  METODOS_PAGO.forEach(({ value }) => {
    saldo[value] = redondear((ventasPorMetodo[value] ?? 0) - (retirosPorMetodo[value] ?? 0) - (gastosPorMetodo[value] ?? 0));
  });

  return {
    ventas: ventasPorMetodo,
    retiros: retirosPorMetodo,
    gastos: gastosPorMetodo,
    saldo,
    totalVentas: sumarMontos(ventasPorMetodo),
    totalRetiros: sumarMontos(retirosPorMetodo),
    totalGastos: sumarMontos(gastosPorMetodo),
    totalSaldo: redondear(sumarMontos(ventasPorMetodo) - sumarMontos(retirosPorMetodo) - sumarMontos(gastosPorMetodo)),
  };
}

export function calcularDiferenciaCierre(saldoEsperado: MontosPorMetodo, arqueoReal: MontosPorMetodo): MontosPorMetodo {
  const diferencia: MontosPorMetodo = {};
  METODOS_PAGO.forEach(({ value }) => {
    diferencia[value] = redondear((arqueoReal[value] ?? 0) - (saldoEsperado[value] ?? 0));
  });
  return diferencia;
}
