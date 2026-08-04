'use client';

import { CheckCircle2, AlertTriangle } from 'lucide-react';

export interface MensajeToast {
  title: string;
  type: 'success' | 'error';
}

interface Props {
  mensaje: MensajeToast | null;
}

/**
 * Notificación flotante reutilizable (toast).
 * Se posiciona centrada en la parte superior, estilo glassmorphism Midn'ight Titanium.
 * Cumple WCAG con role="status" + aria-live para lectores de pantalla.
 */
export default function Toast({ mensaje }: Props) {
  if (!mensaje) return null;

  const esExito = mensaje.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg border backdrop-blur-md ${
        esExito
          ? 'bg-cashflow-emerald/10 border-cashflow-emerald/20 text-cashflow-emerald'
          : 'bg-alert-coral/10 border-alert-coral/20 text-alert-coral'
      }`}>
        {esExito ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
        <span className="text-sm font-bold">{mensaje.title}</span>
      </div>
    </div>
  );
}