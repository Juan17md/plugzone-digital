import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import Sidebar from '@/components/shared/Sidebar';
import BottomNav from '@/components/shared/BottomNav';
import { Providers } from '@/components/providers/Providers';
import { AuthGuard } from '@/components/providers/AuthGuard';
import './globals.css';
import LayoutWrapper from '@/components/shared/LayoutWrapper';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

export const metadata: Metadata = {
  title: 'PlugZone Digital',
  description: 'Sistema administrativo y control de inventario/ventas',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PlugZone Digital' },
  icons: {
    icon: '/icons/icono-192x192.png',
    apple: '/icons/icono-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#121A2C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="es" className={`${inter.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable}`}>
      <body className="font-inter bg-cosmic-midnight text-polar-white antialiased flex min-h-screen">
        <Providers>
          <AuthGuard>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
