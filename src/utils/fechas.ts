export function getInicioSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getFinSemana(fecha: Date): Date {
  const inicio = getInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return fin;
}

export function getSemanaAnterior(fecha: Date): Date {
  const inicio = getInicioSemana(fecha);
  inicio.setDate(inicio.getDate() - 7);
  return inicio;
}

export function getSemanaSiguiente(fecha: Date): Date {
  const inicio = getInicioSemana(fecha);
  inicio.setDate(inicio.getDate() + 7);
  return inicio;
}

export function formatearSemana(fecha: Date): string {
  const inicio = getInicioSemana(fecha);
  const fin = getFinSemana(fecha);
  const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const locale = 'es-VE';

  const iniStr = inicio.toLocaleDateString(locale, opciones);
  const finStr = fin.toLocaleDateString(locale, opciones);

  return `Semana del ${iniStr} al ${finStr}`;
}

export function esSemanaActual(fecha: Date): boolean {
  const ahora = new Date();
  const inicioActual = getInicioSemana(ahora);
  const inicioFecha = getInicioSemana(fecha);
  return inicioActual.getTime() === inicioFecha.getTime();
}
