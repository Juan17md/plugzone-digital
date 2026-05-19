'use client';

import { useEffect } from 'react';
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

/**
 * Global Error Boundary — Captura errores que ocurren en el propio Root Layout.
 * Este componente REEMPLAZA completamente el <html> ya que el layout raíz
 * puede no haberse renderizado correctamente.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PlugZone Global Error]', error);
    }
  }, [error]);

  return (
    <html lang="es" className={`${inter.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable}`}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          color: '#F8FAFC',
          fontFamily: 'Inter, system-ui, sans-serif',
          backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(14, 165, 233, 0.05) 0%, transparent 60%)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '480px' }}>

          {/* Ícono de alerta */}
          <div
            style={{
              width: 96,
              height: 96,
              margin: '0 auto 2rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={48} color="#EF4444" />
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-plus-jakarta-sans), system-ui, sans-serif',
            }}
          >
            Error Crítico del Sistema
          </h1>

          {/* Descripción */}
          <p
            style={{
              fontSize: '0.875rem',
              color: '#64748B',
              lineHeight: 1.6,
              marginBottom: '0.5rem',
            }}
          >
            Ocurrió un problema grave al cargar la aplicación. Tus datos en la nube están protegidos y no se han visto afectados.
          </p>

          {/* Digest */}
          {error.digest && (
            <p
              style={{
                fontSize: '0.7rem',
                color: 'rgba(100, 116, 139, 0.5)',
                fontFamily: 'var(--font-space-grotesk), monospace',
                marginBottom: '2rem',
              }}
            >
              Ref: {error.digest}
            </p>
          )}
          {!error.digest && <div style={{ marginBottom: '2rem' }} />}

          {/* Botón de reintentar */}
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2rem',
              borderRadius: '0.75rem',
              backgroundColor: '#0EA5E9',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.2)',
              transition: 'transform 0.2s ease',
              width: '100%',
              maxWidth: '280px',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <RefreshCw size={18} />
            Reiniciar Aplicación
          </button>

          {/* Branding */}
          <p
            style={{
              marginTop: '3rem',
              fontSize: '0.65rem',
              color: 'rgba(100, 116, 139, 0.4)',
              fontFamily: 'var(--font-space-grotesk), monospace',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            PlugZone Digital
          </p>
        </div>
      </body>
    </html>
  );
}
