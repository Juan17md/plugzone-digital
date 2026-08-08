import { describe, it, expect } from 'vitest';
import {
  getInicioSemana,
  getFinSemana,
  getSemanaAnterior,
  getSemanaSiguiente,
  formatearSemana,
  esSemanaActual,
} from '@/utils/fechas';

describe('getInicioSemana', () => {
  it('devuelve el lunes 00:00 para un día cualquiera', () => {
    const inicio = getInicioSemana(new Date('2026-08-05T15:30:00'));
    expect(inicio.getDay()).toBe(1);
    expect(inicio.getHours()).toBe(0);
    expect(inicio.toDateString()).toBe(new Date(2026, 7, 3).toDateString());
  });

  it('devuelve el lunes de la semana para un domingo', () => {
    const inicio = getInicioSemana(new Date('2026-08-09T10:00:00'));
    expect(inicio.toDateString()).toBe(new Date(2026, 7, 3).toDateString());
  });

  it('devuelve la misma fecha si ya es lunes', () => {
    const inicio = getInicioSemana(new Date('2026-08-03T08:00:00'));
    expect(inicio.toDateString()).toBe(new Date(2026, 7, 3).toDateString());
  });
});

describe('getFinSemana', () => {
  it('devuelve el domingo a las 23:59:59.999', () => {
    const fin = getFinSemana(new Date('2026-08-05T00:00:00'));
    expect(fin.getDay()).toBe(0);
    expect(fin.getHours()).toBe(23);
    expect(fin.getMinutes()).toBe(59);
    expect(fin.getMilliseconds()).toBe(999);
    expect(fin.toDateString()).toBe(new Date(2026, 7, 9).toDateString());
  });
});

describe('getSemanaAnterior y getSemanaSiguiente', () => {
  it('getSemanaAnterior devuelve el lunes anterior', () => {
    const anterior = getSemanaAnterior(new Date('2026-08-05T00:00:00'));
    expect(anterior.toDateString()).toBe(new Date(2026, 6, 27).toDateString());
  });

  it('getSemanaSiguiente devuelve el lunes siguiente', () => {
    const siguiente = getSemanaSiguiente(new Date('2026-08-05T00:00:00'));
    expect(siguiente.toDateString()).toBe(new Date(2026, 7, 10).toDateString());
  });
});

describe('formatearSemana', () => {
  it('formatea el rango Lun-Dom en español', () => {
    const texto = formatearSemana(new Date('2026-08-05T00:00:00'));
    expect(texto).toMatch(/Semana del/);
    expect(texto).toContain('al');
  });
});

describe('esSemanaActual', () => {
  it('devuelve true para fechas dentro de la semana actual', () => {
    expect(esSemanaActual(new Date())).toBe(true);
  });

  it('devuelve false para una semana distinta', () => {
    const otra = new Date();
    otra.setDate(otra.getDate() - 14);
    expect(esSemanaActual(otra)).toBe(false);
  });
});
