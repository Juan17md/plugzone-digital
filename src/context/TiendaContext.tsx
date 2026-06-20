'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, runTransaction, limit } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, getIdToken, User } from 'firebase/auth';
import { db, app } from '@/services/firebase';
import { Producto, Venta, GastoOperativo, RolUsuario, Usuario } from '@/types';

interface TiendaState {
  isOffline: boolean;
  user: User | null;
  authLoading: boolean;
  rol: RolUsuario | null;
  rolLoading: boolean;
  bloqueado: boolean;
  primerInicio: boolean;
  
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
  anularVenta: (id: string) => Promise<void>;

  // Usuarios (solo admin)
  usuarios: Usuario[];
  loadingUsuarios: boolean;
  crearUsuario: (email: string, password: string, rol: RolUsuario) => Promise<{ error?: string }>;
  editarUsuario: (uid: string, datos: { email?: string; password?: string; rol?: RolUsuario }) => Promise<{ error?: string }>;
  cambiarContrasena: (uid: string, password: string) => Promise<{ error?: string }>;
  alternarBloqueoUsuario: (uid: string, bloqueado: boolean) => Promise<{ error?: string }>;
  actualizarRolUsuario: (uid: string, rol: RolUsuario) => Promise<{ error?: string }>;
  eliminarUsuario: (uid: string) => Promise<{ error?: string }>;

  // Tasa de cambio BCV
  tasaBCV: number | null;
  fechaTasaBCV: string | null;
  loadingTasa: boolean;
}

const defaultState: TiendaState = {
  isOffline: false,
  user: null, authLoading: true, rol: null, rolLoading: true, bloqueado: false, primerInicio: false,
  productos: [], loadingProductos: true,
  agregarProducto: async () => {}, actualizarProducto: async () => {}, eliminarProducto: async () => {},
  ventas: [], gastos: [],
  registrarVenta: async () => {}, registrarGasto: async () => {}, anularVenta: async () => {},
  usuarios: [], loadingUsuarios: true,
  crearUsuario: async () => ({}), editarUsuario: async () => ({}), cambiarContrasena: async () => ({}), alternarBloqueoUsuario: async () => ({}), actualizarRolUsuario: async () => ({}), eliminarUsuario: async () => ({}),
  tasaBCV: null, fechaTasaBCV: null, loadingTasa: true
};

const TiendaContext = createContext<TiendaState>(defaultState);

export const useTienda = () => useContext(TiendaContext);

export function TiendaProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [rolLoading, setRolLoading] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [primerInicio, setPrimerInicio] = useState(false);
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const [tasaBCV, setTasaBCV] = useState<number | null>(null);
  const [fechaTasaBCV, setFechaTasaBCV] = useState<string | null>(null);
  const [loadingTasa, setLoadingTasa] = useState(true);

  // 0. Autenticación PWA
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRol(null);
        setRolLoading(false);
        setBloqueado(false);
        setPrimerInicio(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 0.1 Cargar rol del usuario desde Firestore
  useEffect(() => {
    if (!user) return;

    const usuarioRef = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(usuarioRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRol(data.rol || null);
        setBloqueado(data.bloqueado === true);
        setPrimerInicio(data.primerInicio === true);
      } else {
        setRol(null);
        setBloqueado(false);
        setPrimerInicio(false);
      }
      setRolLoading(false);
    }, () => {
      setRolLoading(false);
    });

    return () => unsub();
  }, [user]);

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

  // 2.1 Sincronización de usuarios (solo admin)
  useEffect(() => {
    if (!user || rol !== 'admin') {
      setUsuarios([]);
      setLoadingUsuarios(false);
      return;
    }

    const unsubUsuarios = onSnapshot(query(collection(db, 'usuarios'), orderBy('creadoEn', 'desc')), (snapshot) => {
      setUsuarios(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as Usuario[]);
      setLoadingUsuarios(false);
    });

    return () => unsubUsuarios();
  }, [user, rol]);

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

  const anularVenta = async (id: string) => {
    const ventaRef = doc(db, 'ventas', id);
    
    await runTransaction(db, async (transaction) => {
      const ventaDoc = await transaction.get(ventaRef);
      if (!ventaDoc.exists()) throw new Error("La venta no existe.");
      
      const ventaData = ventaDoc.data() as Venta;
      if (ventaData.anulada) throw new Error("Esta venta ya ha sido anulada.");
      
      // Marcar la venta como anulada
      transaction.update(ventaRef, { anulada: true });
      
      // Devolver stock al producto
      if (ventaData.productoId) {
        const productoRef = doc(db, 'productos', ventaData.productoId);
        const prodDoc = await transaction.get(productoRef);
        if (prodDoc.exists()) {
          const stockActual = prodDoc.data().stockActual || 0;
          transaction.update(productoRef, { 
            stockActual: stockActual + ventaData.cantidadVendida 
          });
        }
      }
    });
  };

  // 5. Funciones CRUD Usuarios (requieren Admin SDK via API routes)
  const getAuthToken = async (): Promise<string> => {
    const auth = getAuth(app);
    if (!auth.currentUser) throw new Error('No autenticado');
    return getIdToken(auth.currentUser);
  };

  const crearUsuario = useCallback(async (email: string, password: string, rol: RolUsuario): Promise<{ error?: string }> => {
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, password, rol }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al crear usuario' };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const alternarBloqueoUsuario = useCallback(async (uid: string, bloquear: boolean): Promise<{ error?: string }> => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/usuarios/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bloqueado: bloquear }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al actualizar usuario' };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const actualizarRolUsuario = useCallback(async (uid: string, rol: RolUsuario): Promise<{ error?: string }> => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/usuarios/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rol }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al actualizar usuario' };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const eliminarUsuarioFn = useCallback(async (uid: string): Promise<{ error?: string }> => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/usuarios/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al eliminar usuario' };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const editarUsuarioFn = useCallback(async (uid: string, datos: { email?: string; password?: string; rol?: RolUsuario }): Promise<{ error?: string }> => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/usuarios/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al editar usuario' };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const cambiarContrasenaFn = useCallback(async (uid: string, password: string): Promise<{ error?: string }> => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/usuarios/${uid}/cambiar-contrasena`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al cambiar contraseña' };
      setPrimerInicio(false);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  // 5. Cargar Tasa BCV Oficial
  useEffect(() => {
    const fetchTasa = async () => {
      setLoadingTasa(true);
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (!res.ok) throw new Error('Error al consultar la API de DolarApi');
        const data = await res.json();
        
        if (data && typeof data.promedio === 'number') {
          setTasaBCV(data.promedio);
          setFechaTasaBCV(data.fechaActualizacion || new Date().toISOString());
          
          // Guardar en caché
          localStorage.setItem('pz_tasa_bcv', data.promedio.toString());
          localStorage.setItem('pz_tasa_bcv_fecha', data.fechaActualizacion || new Date().toISOString());
        }
      } catch (error) {
        console.error('Error fetching rate, trying cache:', error);
        // Intentar recuperar de caché
        const cachedTasa = localStorage.getItem('pz_tasa_bcv');
        const cachedFecha = localStorage.getItem('pz_tasa_bcv_fecha');
        if (cachedTasa) {
          setTasaBCV(parseFloat(cachedTasa));
          setFechaTasaBCV(cachedFecha || null);
        }
      } finally {
        setLoadingTasa(false);
      }
    };

    fetchTasa();
  }, []);

  return (
    <TiendaContext.Provider value={{ 
      isOffline, user, authLoading, rol, rolLoading, bloqueado, primerInicio,
      productos, loadingProductos,
      agregarProducto, actualizarProducto, eliminarProducto,
      ventas, gastos, registrarVenta, registrarGasto, anularVenta,
      usuarios, loadingUsuarios,
      crearUsuario, editarUsuario: editarUsuarioFn, cambiarContrasena: cambiarContrasenaFn, alternarBloqueoUsuario, actualizarRolUsuario, eliminarUsuario: eliminarUsuarioFn,
      tasaBCV, fechaTasaBCV, loadingTasa
    }}>
      {children}
    </TiendaContext.Provider>
  );
}
