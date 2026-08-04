import { GastoOperativo } from '@/types';

// Acceso defensivo a campos legacy de gastos (concepto/nombre/detalle) para
// soportar documentos creados antes de la estandarización del campo descripcion.
function obtenerCampoTexto(gasto: GastoOperativo, campo: string): string {
  const valor = (gasto as unknown as Record<string, unknown>)[campo];
  return typeof valor === 'string' ? valor : '';
}

export function obtenerDescripcionGasto(gasto: GastoOperativo): string {
  return (
    gasto.descripcion ||
    obtenerCampoTexto(gasto, 'concepto') ||
    obtenerCampoTexto(gasto, 'nombre') ||
    obtenerCampoTexto(gasto, 'detalle') ||
    'Gasto Operativo'
  );
}

export function obtenerMontoGasto(gasto: GastoOperativo): number {
  if (typeof gasto.monto === 'number') return gasto.monto;
  const monto = (gasto as unknown as Record<string, unknown>).monto;
  const numero = typeof monto === 'string' ? parseFloat(monto) : Number(monto);
  return Number.isFinite(numero) ? numero : 0;
}
