import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PlugZone Digital - Control Administrativo',
    short_name: 'PlugZone Digital',
    description: 'Sistema administrativo y de control de stock y ventas de teléfonos y accesorios.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#080C14', // Midnight Black de nuestro Design System
    theme_color: '#121A2C',      // Titanium Slate para la barra de estado
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
