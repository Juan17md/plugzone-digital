'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, runTransaction, limit } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db, app } from '@/services/firebase';
import { Producto, Venta, GastoOperativo } from '@/types';

interface TiendaState {
  isOffline: boolean;
  user: User | null;
  authLoading: boolean;
  
  // Productos
  productos: Producto[];
  loadingProductos: boolean;
  agregarProducto: (producto: Omit<Producto, 'id' | 'creadoEn'>) => Promise<void>;
  actualizarProducto: (id: string, datos: Partial<Producto>) => Promise<void>;
  eliminarProducto: (id: string) => Promise<void>;

  // Ventas y Finanzas
  ventas: Venta[];
  gastos: GastoOperativo[];
  registrarVenta: (venta: Omit<Venta, 'id' | 'fecha' | 'gananciaNeta'>) => Promise<void>;
  registrarGasto: (gasto: Omit<GastoOperativo, 'id' | 'fecha'>) => Promise<void>;
}

const defaultState: TiendaState = {
  isOffline: false,
  user: null, authLoading: true,
  productos: [], loadingProductos: true,
  agregarProducto: async () => {}, actualizarProducto: async () => {}, eliminarProducto: async () => {},
  ventas: [], gastos: [],
  registrarVenta: async () => {}, registrarGasto: async () => {}
};

const TiendaContext = createContext<TiendaState>(defaultState);

export const useTienda = () => useContext(TiendaContext);

export function TiendaProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  // 0. Autenticación PWA
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 1. Detección Offline PWA
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    if (typeof navigator !== 'undefined') setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Sincronización en Tiempo Real (Solo si hay usuario logueado)
  useEffect(() => {
    if (!user) return; // No descargar datos de Firestore si no está logueado

    const unsubProductos = onSnapshot(query(collection(db, 'productos'), orderBy('nombre', 'asc')), (snapshot) => {
      setProductos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Producto[]);
      setLoadingProductos(false);
    });

    const unsubVentas = onSnapshot(query(collection(db, 'ventas'), orderBy('fecha', 'desc'), limit(100)), (snapshot) => {
      setVentas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Venta[]);
    });

    const unsubGastos = onSnapshot(query(collection(db, 'gastos'), orderBy('fecha', 'desc'), limit(100)), (snapshot) => {
      setGastos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GastoOperativo[]);
    });

    return () => {
      unsubProductos(); unsubVentas(); unsubGastos();
    };
  }, [user]);

  // 3. Funciones CRUD Productos
  const agregarProducto = async (producto: Omit<Producto, 'id' | 'creadoEn'>) => {
    await addDoc(collection(db, 'productos'), { ...producto, creadoEn: new Date().toISOString() });
  };
  const actualizarProducto = async (id: string, datos: Partial<Producto>) => {
    await updateDoc(doc(db, 'productos', id), datos);
  };
  const eliminarProducto = async (id: string) => {
    await deleteDoc(doc(db, 'productos', id));
  };

  // 4. Funciones Finanzas / Ventas Atómicas
  const registrarVenta = async (venta: Omit<Venta, 'id' | 'fecha' | 'gananciaNeta'>) => {
    const productoRef = doc(db, 'productos', venta.productoId);
    
    await runTransaction(db, async (transaction) => {
      const prodDoc = await transaction.get(productoRef);
      if (!prodDoc.exists()) throw new Error("El producto ya no existe.");

      const currentStock = prodDoc.data().stockActual || 0;
      if (currentStock < venta.cantidadVendida) throw new Error("No hay stock suficiente para esta venta.");

      transaction.update(productoRef, { stockActual: currentStock - venta.cantidadVendida });

      const nuevaVentaRef = doc(collection(db, 'ventas'));
      const costoTotal = prodDoc.data().costoCompra * venta.cantidadVendida;
      const ingresoTotal = venta.precioVentaFinal * venta.cantidadVendida;
      
      transaction.set(nuevaVentaRef, {
        ...venta,
        gananciaNeta: ingresoTotal - costoTotal,
        fecha: new Date().toISOString()
      });
    });
  };

  const registrarGasto = async (gasto: Omit<GastoOperativo, 'id' | 'fecha'>) => {
    await addDoc(collection(db, 'gastos'), { ...gasto, fecha: new Date().toISOString() });
  };

  return (
    <TiendaContext.Provider value={{ 
      isOffline, user, authLoading, 
      productos, loadingProductos,
      agregarProducto, actualizarProducto, eliminarProducto,
      ventas, gastos, registrarVenta, registrarGasto
    }}>
      {children}
    </TiendaContext.Provider>
  );
}
