'use client';

import { useState, useEffect } from 'react';
import { Producto, CategoriaProducto } from '@/types';
import { useTienda } from '@/context/TiendaContext';
import { X, Save, Trash2 } from 'lucide-react';
import Select from '@/components/shared/Select';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productoEditar?: Producto | null;
  activeTab?: 'Telefonos' | 'Accesorios';
  onNotify?: (mensaje: { title: string; type: 'success' | 'error' }) => void;
}

const CATEGORIAS_ACCESORIOS: CategoriaProducto[] = ['Protectores', 'Cargadores', 'Auriculares', 'Otros'];

export default function ProductModal({ isOpen, onClose, productoEditar, activeTab = 'Telefonos', onNotify }: Props) {
  const { agregarProducto, actualizarProducto, eliminarProducto } = useTienda();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Determinar categorías disponibles según el tab o el producto a editar
  const opcionesCategoria = productoEditar 
    ? (productoEditar.categoria === 'Teléfonos' ? ['Teléfonos'] : CATEGORIAS_ACCESORIOS) 
    : (activeTab === 'Telefonos' ? ['Teléfonos'] : CATEGORIAS_ACCESORIOS);

  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    marca: '',
    categoria: (productoEditar ? productoEditar.categoria : (activeTab === 'Telefonos' ? 'Teléfonos' : 'Protectores')) as CategoriaProducto,
    costoCompra: '',
    precioVenta: '',
    stockActual: '',
    stockMinimo: '5',
    ram: '',
    almacenamiento: '',
  });

  useEffect(() => {
    if (productoEditar) {
      setFormData({
        sku: productoEditar.sku,
        nombre: productoEditar.nombre,
        marca: productoEditar.marca,
        categoria: productoEditar.categoria,
        costoCompra: productoEditar.costoCompra.toString(),
        precioVenta: productoEditar.precioVenta.toString(),
        stockActual: productoEditar.stockActual.toString(),
        stockMinimo: productoEditar.stockMinimo.toString(),
        ram: productoEditar.ram || '',
        almacenamiento: productoEditar.almacenamiento || '',
      });
    } else {
      setFormData({
        sku: '', 
        nombre: '', 
        marca: '', 
        categoria: activeTab === 'Telefonos' ? 'Teléfonos' : 'Protectores',
        costoCompra: '', 
        precioVenta: '', 
        stockActual: '', 
        stockMinimo: '5',
        ram: '',
        almacenamiento: '',
      });
    }
    setConfirmDelete(false);
  }, [productoEditar, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const dataAProcesar = {
      sku: formData.sku || `PZ-${Math.floor(100000 + Math.random() * 900000)}`,
      nombre: formData.nombre,
      marca: formData.marca,
      categoria: formData.categoria,
      costoCompra: Number(formData.costoCompra),
      precioVenta: Number(formData.precioVenta),
      stockActual: Number(formData.stockActual),
      stockMinimo: Number(formData.stockMinimo),
      ...(formData.categoria === 'Teléfonos' ? {
        ram: formData.ram || '',
        almacenamiento: formData.almacenamiento || '',
      } : {}),
    };

    try {
      if (productoEditar) {
        await actualizarProducto(productoEditar.id, dataAProcesar);
        onNotify?.({ title: 'Producto actualizado exitosamente', type: 'success' });
      } else {
        await agregarProducto(dataAProcesar);
        onNotify?.({ title: 'Producto creado exitosamente', type: 'success' });
      }
      onClose();
    } catch (error) {
      console.error("Error guardando producto:", error);
      onNotify?.({ title: 'Error al guardar. Revisa la conexión y las reglas de Firestore.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productoEditar) return;
    if (confirmDelete) {
      setIsSubmitting(true);
      try {
        await eliminarProducto(productoEditar.id);
        onClose();
      } catch (error) {
        console.error("Error eliminando:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setConfirmDelete(true);
    }
  };

  // Input Class Dinámico Glassmorphism
  const inputClass = "w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-polar-white focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all";

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-titanium-slate w-full max-w-2xl rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <h2 className="font-plus-jakarta text-xl font-bold text-polar-white">
            {productoEditar ? 'Editar ' : 'Nuevo '}
            {productoEditar 
              ? (productoEditar.categoria === 'Teléfonos' ? 'Teléfono' : 'Accesorio')
              : (activeTab === 'Telefonos' ? 'Teléfono' : 'Accesorio')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--glass-border)] text-muted-gray transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-5 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Nombre del Producto</label>
              <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className={inputClass} placeholder={activeTab === 'Telefonos' ? "iPhone 15 Pro Max" : "Forro MagSafe iPhone 15"} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-gray">SKU</label>
                <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className={inputClass} placeholder="Auto-generado: PZ-XXXXXX" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-gray">Marca</label>
                <input required type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className={inputClass} placeholder="Apple" />
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-4 ${formData.categoria === 'Teléfonos' ? 'sm:grid-cols-2' : ''}`}>
              
              {formData.categoria === 'Teléfonos' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-gray">Memoria RAM</label>
                    <Select
                      value={formData.ram}
                      onChange={v => setFormData({...formData, ram: v})}
                      options={[
                        { value: '2GB', label: '2 GB' },
                        { value: '3GB', label: '3 GB' },
                        { value: '4GB', label: '4 GB' },
                        { value: '6GB', label: '6 GB' },
                        { value: '8GB', label: '8 GB' },
                        { value: '12GB', label: '12 GB' },
                        { value: '16GB', label: '16 GB' },
                        { value: '24GB', label: '24 GB' },
                      ]}
                      placeholder="Seleccionar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-gray">Almacenamiento</label>
                    <Select
                      value={formData.almacenamiento}
                      onChange={v => setFormData({...formData, almacenamiento: v})}
                      options={[
                        { value: '32GB', label: '32 GB' },
                        { value: '64GB', label: '64 GB' },
                        { value: '128GB', label: '128 GB' },
                        { value: '256GB', label: '256 GB' },
                        { value: '512GB', label: '512 GB' },
                        { value: '1TB', label: '1 TB' },
                      ]}
                      placeholder="Seleccionar"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-gray">Categoría</label>
                  <Select
                    value={formData.categoria}
                    onChange={v => setFormData({...formData, categoria: v as CategoriaProducto})}
                    options={opcionesCategoria.map(c => ({ value: c, label: c }))}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-[var(--glass-border)]">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-alert-coral">Costo Compra ($)</label>
                <input required type="number" step="0.01" min="0" value={formData.costoCompra} onChange={e => setFormData({...formData, costoCompra: e.target.value})} className="w-full bg-[var(--glass-bg)] border border-alert-coral/30 rounded-xl px-4 py-3 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-alert-coral focus:ring-1 focus:ring-alert-coral transition-all" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-cashflow-emerald">Precio Venta ($)</label>
                <input required type="number" step="0.01" min="0" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: e.target.value})} className="w-full bg-[var(--glass-bg)] border border-cashflow-emerald/30 rounded-xl px-4 py-3 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-cashflow-emerald focus:ring-1 focus:ring-cashflow-emerald transition-all" placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-electric-cyan">Stock Actual</label>
                <input required type="number" min="0" value={formData.stockActual} onChange={e => setFormData({...formData, stockActual: e.target.value})} className="w-full bg-[var(--glass-bg)] border border-electric-cyan/30 rounded-xl px-4 py-3 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-gray">Stock Mínimo</label>
                <input required type="number" min="0" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} className={inputClass} placeholder="5" />
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex items-center justify-between gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          {productoEditar ? (
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all min-h-[44px] ${confirmDelete ? 'bg-alert-coral text-white animate-pulse' : 'bg-alert-coral/10 text-alert-coral hover:bg-alert-coral/20'}`}
            >
              <Trash2 size={20} />
              <span className="hidden sm:inline">{confirmDelete ? '¿Seguro?' : 'Eliminar'}</span>
            </button>
          ) : (
            <div></div> // Spacer
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors min-h-[44px]">
              Cancelar
            </button>
            <button type="submit" form="productForm" disabled={isSubmitting} className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold bg-electric-cyan text-white shadow-lg shadow-electric-cyan/20 hover:-translate-y-1 hover:shadow-electric-cyan/40 hover:box-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]">
              <Save size={20} />
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
