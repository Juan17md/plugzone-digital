'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTienda } from '@/context/TiendaContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useTienda();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, pathname, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-midnight">
        <div className="w-12 h-12 border-4 border-white/10 border-t-electric-cyan rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no hay usuario y estamos en la ruta de login, renderiza el login (el children será el page de login u ocultamos el menú)
  // Pero AuthGuard se envolverá ALREDEDOR de los componentes Sidebar y BottomNav en layout,
  // por ende, si no hay usuario, NO renderizamos el {children} que contiene los menús,
  // pero el contenido principal del children se manejará en el layout.
  // Wait, layout receives {children}. If I wrap everything in AuthGuard, it blocks rendering. 
  // Let's make AuthGuard just block rendering if not logged in AND not in login page.

  if (!user && pathname !== '/login') {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}
