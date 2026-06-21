'use client';

import { TiendaProvider } from '@/context/TiendaContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TiendaProvider>
        <ServiceWorkerRegister />
        {children}
      </TiendaProvider>
    </ThemeProvider>
  );
}
