'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTienda } from '@/context/TiendaContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

const RUTA_USUARIOS = '/usuarios';
const RUTA_CAMBIAR_CONTRASENA = '/cambiar-contrasena';
const RUTAS_PUBLICAS = ['/login', '/bloqueado', '/cambiar-contrasena'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading, rol, rolLoading, bloqueado, primerInicio } = useTienda();
  const router = useRouter();
  const pathname = usePathname();
  const [suscripcionLoading, setSuscripcionLoading] = useState(true);
  const [suscripcionActiva, setSuscripcionActiva] = useState(true);

  useEffect(() => {
    if (!user) {
      setSuscripcionLoading(false);
      return;
    }

    const verificarSuscripcion = async () => {
      try {
        const ref = doc(db, 'config', 'suscripcion');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSuscripcionActiva(snap.data().activa !== false);
        } else {
          setSuscripcionActiva(true);
        }
      } catch {
        setSuscripcionActiva(true);
      } finally {
        setSuscripcionLoading(false);
      }
    };

    verificarSuscripcion();
  }, [user]);

  useEffect(() => {
    if (authLoading || suscripcionLoading || rolLoading) return;

    const esRutaPublica = RUTAS_PUBLICAS.includes(pathname);

    if (!user) {
      if (!esRutaPublica) router.push('/login');
      return;
    }

    if (primerInicio && pathname !== RUTA_CAMBIAR_CONTRASENA) {
      router.push(RUTA_CAMBIAR_CONTRASENA);
      return;
    }

    if (!primerInicio && pathname === RUTA_CAMBIAR_CONTRASENA) {
      router.push('/dashboard');
      return;
    }

    if (pathname === '/login') {
      router.push('/dashboard');
      return;
    }

    const debeEstarBloqueado = bloqueado || !suscripcionActiva;

    if (debeEstarBloqueado && pathname !== '/bloqueado') {
      router.push('/bloqueado');
      return;
    }

    if (!debeEstarBloqueado && pathname === '/bloqueado') {
      router.push('/dashboard');
      return;
    }

    if (rol === 'operador' && pathname.startsWith(RUTA_USUARIOS)) {
      router.push('/dashboard');
    }
  }, [user, authLoading, suscripcionLoading, suscripcionActiva, rolLoading, rol, bloqueado, primerInicio, pathname, router]);

  if (authLoading || suscripcionLoading || rolLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-cosmic-midnight">
        <img
          src="https://ik.imagekit.io/h5w0cdkit/plugzone/icono_sin_fondo_e9DNtxsHd.PNG"
          alt="Cargando..."
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain opacity-40 animate-pulse"
        />
        <div className="flex items-center gap-2 text-muted-gray">
          <div className="w-2 h-2 rounded-full bg-electric-cyan animate-bounce [animation-delay:0ms]"></div>
          <div className="w-2 h-2 rounded-full bg-electric-cyan animate-bounce [animation-delay:150ms]"></div>
          <div className="w-2 h-2 rounded-full bg-electric-cyan animate-bounce [animation-delay:300ms]"></div>
        </div>
      </div>
    );
  }

  if (!user && !RUTAS_PUBLICAS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
