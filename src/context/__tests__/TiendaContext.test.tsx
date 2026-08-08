import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { TiendaProvider, useTienda } from '@/context/TiendaContext';
import { TiendaState } from '@/context/TiendaContext';

interface RefSimulada {
  tipo?: string;
  __nombre?: string;
  coleccion?: string;
  id?: string;
}

interface SnapSimulada {
  exists?: () => boolean;
  data?: () => Record<string, unknown>;
  docs?: { id: string; data: () => Record<string, unknown> }[];
}

interface TransaccionSimulada {
  get: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => {
  const crearSnapshot = (docs: { id: string; data: Record<string, unknown> }[]): SnapSimulada => ({
    docs: docs.map(d => ({ id: d.id, data: () => d.data })),
  });

  const onSnapshot = vi.fn((ref: unknown, cb: (snap: SnapSimulada) => void) => {
    const r = ref as RefSimulada;
    if (r?.tipo === 'doc') {
      cb({ exists: () => true, data: () => ({ rol: 'operador', bloqueado: false, primerInicio: false }) });
    } else if (r?.__nombre === 'retiros') {
      cb(crearSnapshot([{ id: 'r1', data: { metodoPago: 'Efectivo', monto: 20, concepto: 'Pago proveedor', fecha: '2026-08-03T10:00:00' } }]));
    } else if (r?.__nombre === 'cierres') {
      cb(crearSnapshot([{ id: '2026-08-03T00:00:00.000Z', data: { semanaInicio: '2026-08-03T00:00:00.000Z', totalEsperado: 100 } }]));
    } else {
      cb(crearSnapshot([]));
    }
    return vi.fn();
  });

  return {
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    runTransaction: vi.fn(),
    onSnapshot,
    collection: vi.fn((_db: unknown, nombre: string): RefSimulada => ({ __nombre: nombre })),
    query: vi.fn((ref: unknown) => ref),
    orderBy: vi.fn(),
    doc: vi.fn((ref: unknown, coleccion?: string, id?: string): RefSimulada => {
      if (typeof ref === 'string') return { tipo: 'doc', coleccion: ref, id };
      const r = ref as RefSimulada;
      return { tipo: 'doc', coleccion: r?.__nombre ?? coleccion, id };
    }),
    getAuth: vi.fn(() => ({})),
    getIdToken: vi.fn(async () => 'token-falso'),
    onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: unknown) => void) => {
      cb({ uid: 'u1' });
      return vi.fn();
    }),
  };
});

vi.mock('firebase/firestore', () => ({
  collection: mocks.collection,
  onSnapshot: mocks.onSnapshot,
  addDoc: mocks.addDoc,
  updateDoc: mocks.updateDoc,
  deleteDoc: mocks.deleteDoc,
  doc: mocks.doc,
  query: mocks.query,
  orderBy: mocks.orderBy,
  runTransaction: mocks.runTransaction,
  setDoc: mocks.setDoc,
}));

vi.mock('firebase/auth', () => ({
  getAuth: mocks.getAuth,
  onAuthStateChanged: mocks.onAuthStateChanged,
  getIdToken: mocks.getIdToken,
}));

vi.mock('@/services/firebase', () => ({
  db: {},
  app: {},
}));

const captura: { tienda: TiendaState | null } = { tienda: null };

function Captura() {
  const tienda = useTienda();
  useEffect(() => {
    captura.tienda = tienda;
  }, [tienda]);
  return null;
}

const renderProvider = () => render(<TiendaProvider><Captura /></TiendaProvider>);

const obtenerTienda = async (): Promise<TiendaState> => {
  renderProvider();
  await waitFor(() => {
    expect(captura.tienda).not.toBeNull();
  });
  return captura.tienda as TiendaState;
};

describe('TiendaContext - Módulo de Caja', () => {
  beforeEach(() => {
    mocks.addDoc.mockReset();
    mocks.setDoc.mockReset();
    mocks.deleteDoc.mockReset();
    mocks.runTransaction.mockReset();
  });

  it('carga retiros y cierres en tiempo real desde Firestore', async () => {
    const tienda = await obtenerTienda();
    await waitFor(() => {
      expect(tienda.retiros).toHaveLength(1);
      expect(tienda.cierres).toHaveLength(1);
    });
    expect(tienda.retiros[0]).toMatchObject({ id: 'r1', metodoPago: 'Efectivo', monto: 20 });
    expect(tienda.cierres[0].id).toBe('2026-08-03T00:00:00.000Z');
    expect(mocks.onSnapshot).toHaveBeenCalled();
  });

  it('registrarRetiro crea el documento con fecha actual y datos del retiro', async () => {
    const tienda = await obtenerTienda();

    await tienda.registrarRetiro({ metodoPago: 'Binance', monto: 45, concepto: 'Pago a proveedor', registradoPor: 'u1', registradoPorEmail: 'juan@plugzone.com' });

    expect(mocks.addDoc).toHaveBeenCalledTimes(1);
    const [ref, datos] = mocks.addDoc.mock.calls[0];
    expect(ref.__nombre).toBe('retiros');
    expect(datos).toMatchObject({ metodoPago: 'Binance', monto: 45, concepto: 'Pago a proveedor' });
    expect(typeof datos.fecha).toBe('string');
    expect(new Date(datos.fecha).getTime()).not.toBeNaN();
  });

  it('eliminarRetiro borra el documento por id', async () => {
    const tienda = await obtenerTienda();

    await tienda.eliminarRetiro('r1');

    expect(mocks.deleteDoc).toHaveBeenCalledTimes(1);
    const [ref] = mocks.deleteDoc.mock.calls[0];
    expect(ref).toMatchObject({ tipo: 'doc', coleccion: 'retiros', id: 'r1' });
  });

  it('guardarCierre usa setDoc con id = semanaInicio (idempotente)', async () => {
    const tienda = await obtenerTienda();

    const cierre = {
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
      registradoPorEmail: 'juan@plugzone.com',
      fechaCierre: '2026-08-09T20:00:00.000Z',
      observaciones: 'Cierre correcto',
    };
    await tienda.guardarCierre(cierre);

    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    const [ref, datos] = mocks.setDoc.mock.calls[0];
    expect(ref).toMatchObject({ tipo: 'doc', coleccion: 'cierres', id: '2026-08-03T00:00:00.000Z' });
    expect(datos).toEqual(cierre);
  });

  it('guardarCierre sobrescribe el mismo id (sin duplicar la semana)', async () => {
    const tienda = await obtenerTienda();

    const base = {
      semanaInicio: '2026-08-03T00:00:00.000Z',
      semanaFin: '2026-08-09T23:59:59.999Z',
      montosVentas: {} as Record<string, number>,
      montosRetiros: {} as Record<string, number>,
      saldoEsperado: {} as Record<string, number>,
      arqueoReal: {} as Record<string, number>,
      diferencia: {} as Record<string, number>,
      totalVentas: 0,
      totalRetiros: 0,
      totalEsperado: 0,
      totalArqueo: 0,
      totalDiferencia: 0,
      fechaCierre: '2026-08-09T20:00:00.000Z',
    };
    await tienda.guardarCierre(base);
    await tienda.guardarCierre(base);

    expect(mocks.setDoc).toHaveBeenCalledTimes(2);
    expect(mocks.setDoc.mock.calls[0][0].id).toBe(mocks.setDoc.mock.calls[1][0].id);
  });
});

describe('TiendaContext - Ventas', () => {
  beforeEach(() => {
    mocks.runTransaction.mockReset();
  });

  const mockTransaccion = (stockActual: number) => {
    mocks.runTransaction.mockImplementation(async (_db: unknown, cb: (t: TransaccionSimulada) => Promise<void>) => {
      const transaccion: TransaccionSimulada = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ stockActual, costoCompra: 5 }),
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      await cb(transaccion);
      return transaccion;
    });
  };

  it('registrarVenta valida carrito vacío', async () => {
    const tienda = await obtenerTienda();

    await expect(tienda.registrarVenta({ items: [], metodoPago: 'Binance' })).rejects.toThrow('Debe agregar al menos un producto');
    expect(mocks.runTransaction).not.toHaveBeenCalled();
  });

  it('registrarVenta decrementa stock y crea la venta con ganancia calculada', async () => {
    mockTransaccion(10);
    const tienda = await obtenerTienda();

    await tienda.registrarVenta({
      items: [{ productoId: 'p1', nombreProducto: 'Cargador', cantidadVendida: 2, precioVentaFinal: 15 }],
      metodoPago: 'Binance',
      nombreCliente: 'Cliente A',
    });

    const transaccion = (await mocks.runTransaction.mock.results[0].value) as TransaccionSimulada;
    expect(transaccion.update).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'doc', coleccion: 'productos', id: 'p1' }),
      { stockActual: 8 }
    );
    const [refVenta, datosVenta] = transaccion.set.mock.calls[0];
    expect(refVenta).toMatchObject({ tipo: 'doc', coleccion: 'ventas' });
    expect(datosVenta).toMatchObject({
      metodoPago: 'Binance',
      totalUSD: 30,
      gananciaNetaTotal: 20,
      nombreCliente: 'Cliente A',
    });
    expect(datosVenta.items[0]).toMatchObject({ cantidadVendida: 2, precioVentaFinal: 15, gananciaNeta: 20 });
  });

  it('registrarVenta rechaza cuando el stock no alcanza', async () => {
    mockTransaccion(1);
    const tienda = await obtenerTienda();

    await expect(
      tienda.registrarVenta({
        items: [{ productoId: 'p1', nombreProducto: 'Cargador', cantidadVendida: 2, precioVentaFinal: 15 }],
        metodoPago: 'Efectivo',
      })
    ).rejects.toThrow(/No hay stock suficiente/);
  });
});
