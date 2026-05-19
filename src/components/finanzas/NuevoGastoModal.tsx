'use client';

import { useState } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { X, Receipt } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NuevoGastoModal({ isOpen, onClose }: Props) {
  const { registrarGasto } = useTienda();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Suministros' as 'Alquiler' | 'Sueldos' | 'Servicios' | 'Publicidad' | 'Reparaciones' | 'Envíos' | 'Suministros' | 'Otros',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await registrarGasto({
        descripcion: formData.descripcion,
        monto: Number(formData.monto),
        categoria: formData.categoria
      });
      
      setFormData({ descripcion: '', monto: '', categoria: 'Suministros' });
      onClose();
    } catch (error) {
      console.error("Error registrando gasto:", error);
      alert("Error al registrar el gasto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-titanium-slate w-full max-w-lg rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh]">
        
        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div className="flex items-center gap-3 text-alert-coral">
            <Receipt size={24} />
            <h2 className="font-plus-jakarta text-xl font-bold">Registrar Gasto</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted-gray transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          <form id="gastoForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Descripción</label>
              <input required type="text" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 text-polar-white focus:outline-none focus:border-alert-coral transition-all" placeholder="Ej: Pago de envío por MRW" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-alert-coral">Monto Saliente ($)</label>
                <input required type="number" step="0.01" min="0" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full bg-alert-coral/5 border border-alert-coral/20 rounded-xl px-4 py-3 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-alert-coral transition-all" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-gray">Categoría</label>
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value as any})} className="w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 text-polar-white focus:outline-none focus:border-alert-coral appearance-none transition-all">
                  <option value="Suministros">Suministros</option>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Sueldos">Sueldos</option>
                  <option value="Servicios">Servicios Básicos</option>
                  <option value="Publicidad">Publicidad</option>
                  <option value="Reparaciones">Reparaciones</option>
                  <option value="Envíos">Envíos / Delivery</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>
            
          </form>
        </div>

        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors">
            Cancelar
          </button>
          <button type="submit" form="gastoForm" disabled={isSubmitting} className="flex-[2] px-8 py-3 rounded-xl font-bold bg-alert-coral text-white shadow-lg shadow-alert-coral/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Receipt size={20} />
            {isSubmitting ? 'Registrando...' : 'Registrar Gasto'}
          </button>
        </div>

      </div>
    </div>
  );
}
