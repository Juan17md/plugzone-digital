'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import BottomNav from '@/components/shared/BottomNav';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isBloqueado = pathname === '/bloqueado';

  if (isLoginPage || isBloqueado) {
    return <main className="flex-1 min-h-screen relative overflow-hidden">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 min-h-[100dvh] relative flex flex-col pt-[calc(env(safe-area-inset-top,0px)+1rem)] md:pt-6 px-4 sm:px-6 md:px-8 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
