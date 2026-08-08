import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

// El test solo corre cuando la CLI levanta el emulador (firebase emulators:exec)
const HOST_PUERTO_EMULADOR = process.env.FIRESTORE_EMULATOR_HOST ?? process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ?? '';
const CON_EMULADOR = HOST_PUERTO_EMULADOR.length > 0;
const [HOST_EMULADOR = '127.0.0.1', PUERTO_EMULADOR_STR = '8080'] = HOST_PUERTO_EMULADOR.split(':');
const PUERTO_EMULADOR = Number(PUERTO_EMULADOR_STR);

const PROYECTO = 'plugzone-digital';

const VENTA_BINANCE = {
  fecha: new Date().toISOString(),
  metodoPago: 'Binance',
  productoId: 'p1',
  nombreProducto: 'Protector',
  cantidadVendida: 1,
  precioVentaFinal: 10,
  gananciaNeta: 5,
  items: [
    { productoId: 'p1', nombreProducto: 'Protector', cantidadVendida: 1, precioVentaFinal: 10, gananciaNeta: 5 },
  ],
  totalUSD: 10,
  gananciaNetaTotal: 5,
};

const CIERRE_VALIDO = {
  semanaInicio: '2026-08-03T00:00:00.000Z',
  semanaFin: '2026-08-09T23:59:59.999Z',
  montosVentas: { Efectivo: 100 },
  montosRetiros: { Efectivo: 30 },
  saldoEsperado: { Efectivo: 70 },
  arqueoReal: { Efectivo: 70 },
  diferencia: { Efectivo: 0 },
  totalVentas: 100,
  totalRetiros: 30,
  totalEsperado: 70,
  totalArqueo: 70,
  totalDiferencia: 0,
  registradoPor: 'u1',
  registradoPorEmail: 'operador@plugzone.com',
  fechaCierre: '2026-08-09T20:00:00.000Z',
  observaciones: 'Cierre correcto',
};

const RETIRO_VALIDO = {
  metodoPago: 'Efectivo',
  monto: 40,
  concepto: 'Pago a proveedor',
  fecha: '2026-08-04T10:00:00.000Z',
  registradoPor: 'u1',
  registradoPorEmail: 'operador@plugzone.com',
};

const VENTA_LEGACY = {
  fecha: new Date().toISOString(),
  metodoPago: 'Efectivo',
  productoId: 'p1',
  nombreProducto: 'Protector',
  cantidadVendida: 1,
  precioVentaFinal: 10,
  gananciaNeta: 5,
};

describe.runIf(CON_EMULADOR)('Reglas de Firestore - Módulo de Caja (emulador local)', () => {
  let entorno: RulesTestEnvironment;
  let autenticado: ReturnType<RulesTestEnvironment['authenticatedContext']>;
  let anonimo: ReturnType<RulesTestEnvironment['unauthenticatedContext']>;

  beforeAll(async () => {
    entorno = await initializeTestEnvironment({
      projectId: PROYECTO,
      firestore: {
        host: HOST_EMULADOR,
        port: PUERTO_EMULADOR,
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
    autenticado = entorno.authenticatedContext('u1', { email: 'operador@plugzone.com' });
    anonimo = entorno.unauthenticatedContext();

    await entorno.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('usuarios/u1').set({
        uid: 'u1',
        email: 'operador@plugzone.com',
        rol: 'operador',
        bloqueado: false,
        primerInicio: false,
        creadoEn: new Date().toISOString(),
      });
    });
  });

  afterAll(async () => {
    await entorno.cleanup();
  });

  describe('Sin autenticación', () => {
    it('rechaza toda escritura en retiros', async () => {
      await expect(
        anonimo.firestore().collection('retiros').add(RETIRO_VALIDO)
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('rechaza toda escritura en cierres', async () => {
      await expect(
        anonimo.firestore().collection('cierres').doc(CIERRE_VALIDO.semanaInicio).set(CIERRE_VALIDO)
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('rechaza toda escritura en ventas', async () => {
      await expect(
        anonimo.firestore().collection('ventas').add(VENTA_BINANCE)
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });
  });

  describe('Retiros', () => {
    it('permite crear un retiro válido por método', async () => {
      await expect(
        autenticado.firestore().collection('retiros').add(RETIRO_VALIDO)
      ).resolves.toBeDefined();
    });

    it('rechaza un retiro con monto negativo', async () => {
      await expect(
        autenticado.firestore().collection('retiros').add({ ...RETIRO_VALIDO, monto: -5 })
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('rechaza un retiro con método de pago fuera del whitelist', async () => {
      await expect(
        autenticado.firestore().collection('retiros').add({ ...RETIRO_VALIDO, metodoPago: 'Cripto' })
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('permite eliminar un retiro propio', async () => {
      const ref = await autenticado.firestore().collection('retiros').add(RETIRO_VALIDO);
      await expect(autenticado.firestore().doc(`retiros/${ref.id}`).delete()).resolves.toBeUndefined();
    });
  });

  describe('Cierres', () => {
    it('permite crear un cierre válido', async () => {
      await expect(
        autenticado.firestore().collection('cierres').doc(CIERRE_VALIDO.semanaInicio).set(CIERRE_VALIDO)
      ).resolves.toBeUndefined();
    });

    it('permite editar (corregir) un cierre existente', async () => {
      const ref = autenticado.firestore().collection('cierres').doc(CIERRE_VALIDO.semanaInicio);
      await ref.set(CIERRE_VALIDO);
      await expect(ref.update({ observaciones: 'Corrección de arqueo' })).resolves.toBeUndefined();
    });

    it('rechaza el borrado de un cierre (registro contable)', async () => {
      const ref = autenticado.firestore().collection('cierres').doc('2026-08-10T00:00:00.000Z');
      await ref.set({ ...CIERRE_VALIDO, semanaInicio: '2026-08-10T00:00:00.000Z' });
      await expect(ref.delete()).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('permite diferencia negativa (faltante de caja)', async () => {
      const ref = autenticado.firestore().collection('cierres').doc('2026-08-17T00:00:00.000Z');
      const conFaltante = {
        ...CIERRE_VALIDO,
        semanaInicio: '2026-08-17T00:00:00.000Z',
        semanaFin: '2026-08-23T23:59:59.999Z',
        arqueoReal: { Efectivo: 60 },
        diferencia: { Efectivo: -10 },
        totalArqueo: 60,
        totalDiferencia: -10,
      };
      await expect(ref.set(conFaltante)).resolves.toBeUndefined();
    });

    it('rechaza montos totales negativos', async () => {
      const ref = autenticado.firestore().collection('cierres').doc('2026-08-24T00:00:00.000Z');
      await expect(
        ref.set({ ...CIERRE_VALIDO, semanaInicio: '2026-08-24T00:00:00.000Z', totalVentas: -1 })
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });
  });

  describe('Ventas con Binance', () => {
    it('permite registrar una venta con metodoPago Binance', async () => {
      await expect(
        autenticado.firestore().collection('ventas').add(VENTA_BINANCE)
      ).resolves.toBeDefined();
    });

    it('rechaza un método de pago desconocido', async () => {
      await expect(
        autenticado.firestore().collection('ventas').add({ ...VENTA_BINANCE, metodoPago: 'Cripto' })
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('rechaza montos de venta negativos', async () => {
      await expect(
        autenticado.firestore().collection('ventas').add({ ...VENTA_BINANCE, totalUSD: -10 })
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('rechaza ganancia neta negativa en formato legacy', async () => {
      await expect(
        autenticado.firestore().collection('ventas').add({ ...VENTA_LEGACY, gananciaNeta: -5 })
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });

    it('rechaza items que no son una lista', async () => {
      await expect(
        autenticado.firestore().collection('ventas').add({ ...VENTA_BINANCE, items: 'no-lista' })
      ).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
    });
  });
});
