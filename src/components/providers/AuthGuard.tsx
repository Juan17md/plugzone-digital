'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTienda } from '@/context/TiendaContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useTienda();
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
    if (authLoading || suscripcionLoading) return;

    if (!user) {
      if (pathname !== '/login') router.push('/login');
    } else if (pathname === '/login') {
      router.push('/dashboard');
    } else if (!suscripcionActiva && pathname !== '/bloqueado') {
      router.push('/bloqueado');
    }
  }, [user, authLoading, suscripcionLoading, suscripcionActiva, pathname, router]);

  if (authLoading || suscripcionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-midnight">
        <div className="w-12 h-12 border-4 border-white/10 border-t-electric-cyan rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
