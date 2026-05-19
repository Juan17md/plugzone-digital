'use client';

import { TiendaProvider } from '@/context/TiendaContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TiendaProvider>
        {children}
      </TiendaProvider>
    </ThemeProvider>
  );
}
