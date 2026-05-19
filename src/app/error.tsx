'use client';

import { useEffect } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar el error en consola solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('[PlugZone Error Boundary]', error);
    }
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">

      {/* Ícono animado de error */}
      <div className="relative mb-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-alert-coral/10 flex items-center justify-center">
          <AlertTriangle size={48} className="text-alert-coral animate-pulse" />
        </div>
        <div className="absolute inset-0 blur-3xl bg-alert-coral/10 rounded-full pointer-events-none" />
      </div>

      {/* Mensaje amigable */}
      <h2 className="font-plus-jakarta text-2xl sm:text-3xl font-bold text-polar-white mb-3">
        Algo salió mal
      </h2>
      <p className="text-muted-gray text-sm sm:text-base max-w-md mb-2 leading-relaxed">
        Ocurrió un error inesperado al cargar esta sección. No te preocupes, tus datos están seguros.
      </p>

      {/* Código de error (solo digest, sin exponer detalles) */}
      {error.digest && (
        <p className="text-xs text-muted-gray/50 font-space-grotesk mb-8">
          Ref: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-8" />}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md">
        <button
          onClick={reset}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-electric-cyan text-white font-bold shadow-lg shadow-electric-cyan/20 hover:-translate-y-0.5 hover:shadow-electric-cyan/30 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <RefreshCw size={18} />
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass-panel text-polar-white font-bold hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
        >
          <Home size={18} />
          Ir al Inicio
        </Link>
      </div>

      {/* Branding sutil */}
      <p className="mt-12 text-xs text-muted-gray/60 font-space-grotesk tracking-widest uppercase">
        PlugZone Digital
      </p>
    </div>
  );
}
