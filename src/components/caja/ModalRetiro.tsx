'use client';

import { useState } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { X, Wallet } from 'lucide-react';
import Select from '@/components/shared/Select';
import { MensajeToast } from '@/components/shared/Toast';
import { MetodoPago } from '@/types';
import { METODOS_PAGO } from '@/utils/caja';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (mensaje: MensajeToast) => void;
}

export default function ModalRetiro({ isOpen, onClose, onNotify }: Props) {
  const { registrarRetiro } = useTienda();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    metodoPago: 'Efectivo' as MetodoPago,
    monto: '',
    concepto: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await registrarRetiro({
        metodoPago: formData.metodoPago,
        monto: Number(formData.monto),
        ...(formData.concepto.trim() ? { concepto: formData.concepto.trim() } : {}),
      });

      setFormData({ metodoPago: 'Efectivo', monto: '', concepto: '' });
      onClose();
      onNotify?.({ title: 'Retiro registrado con éxito', type: 'success' });
    } catch (error) {
      console.error("Error registrando retiro:", error);
      onNotify?.({ title: 'Error al registrar el retiro', type: 'error' });
      if (!onNotify) alert("Error al registrar el retiro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Registrar retiro de caja" className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-titanium-slate w-full max-w-xl rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh]">

        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div className="flex items-center gap-3 text-neon-amber">
            <Wallet size={24} />
            <h2 className="font-plus-jakarta text-xl font-bold">Registrar Retiro</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de retiro" className="p-2 rounded-full hover:bg-white/10 text-muted-gray transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          <form id="retiroForm" onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Método de Pago</label>
              <Select
                value={formData.metodoPago}
                onChange={v => setFormData({ ...formData, metodoPago: v as MetodoPago })}
                options={METODOS_PAGO.map(m => ({ value: m.value, label: m.label }))}
                accentColor="amber"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neon-amber">Monto Saliente ($)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={e => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-neon-amber/5 border border-neon-amber/20 rounded-xl px-4 py-3 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-neon-amber transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Concepto (opcional)</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={e => setFormData({ ...formData, concepto: e.target.value })}
                className="w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 text-polar-white focus:outline-none focus:border-neon-amber transition-all"
                placeholder="Ej: Compra de inventario, cambio de dólares..."
              />
            </div>

          </form>
        </div>

        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors">
            Cancelar
          </button>
          <button type="submit" form="retiroForm" disabled={isSubmitting} className="flex-[2] px-8 py-3 rounded-xl font-bold bg-neon-amber text-cosmic-midnight shadow-lg shadow-neon-amber/20 hover:-translate-y-0.5 hover:shadow-neon-amber/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Wallet size={20} />
            {isSubmitting ? 'Registrando...' : 'Registrar Retiro'}
          </button>
        </div>

      </div>
    </div>
  );
}
