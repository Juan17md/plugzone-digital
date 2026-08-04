'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Inicialización perezosa del tema (lee localStorage y preferencia del sistema
  // solo en el cliente, evitando el setState dentro de un useEffect).
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';

    const savedTheme = localStorage.getItem('pz_theme') as Theme | null;
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const temaInicial: Theme = savedTheme ?? (systemPrefersLight ? 'light' : 'dark');

    if (temaInicial === 'light') document.documentElement.classList.add('light');

    return temaInicial;
  });

  // Detecta el montaje en cliente sin setState en effect (evita FOUC).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      localStorage.setItem('pz_theme', newTheme);
      return newTheme;
    });
  };

  // Evita el destello (flash of unstyled content) de SSR a cliente
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
