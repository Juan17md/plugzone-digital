'use client';

import { useState, useMemo } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { X, ShoppingCart, Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NuevaVentaModal({ isOpen, onClose }: Props) {
  const { productos, registrarVenta, tasaBCV } = useTienda();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [activeTab, setActiveTab] = useState<'Telefonos' | 'Accesorios'>('Telefonos');
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState('1');
  const [precioPersonalizado, setPrecioPersonalizado] = useState('');
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Punto' | 'Zelle' | 'Pago Móvil' | 'Transferencia' | 'Tarjeta'>('Efectivo');
  
  // Datos del Cliente (Opcional)
  const [nombreCliente, setNombreCliente] = useState('');
  const [cedulaCliente, setCedulaCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');

  const productosDisponibles = useMemo(() => {
    return productos.filter(p => {
      const hasStock = p.stockActual > 0;
      const matchSearch = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const isTelefono = p.categoria === 'Teléfonos';
      const matchTab = activeTab === 'Telefonos' ? isTelefono : !isTelefono;
      
      return hasStock && matchSearch && matchTab;
    });
  }, [productos, busqueda, activeTab]);

  const productoSelectData = productos.find(p => p.id === productoSeleccionado);

  const totalUSD = useMemo(() => {
    if (!productoSelectData) return 0;
    const precio = precioPersonalizado ? Number(precioPersonalizado) : productoSelectData.precioVenta;
    return precio * Number(cantidad);
  }, [precioPersonalizado, productoSelectData, cantidad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado || !productoSelectData) return;

    setIsSubmitting(true);
    try {
      const precioVentaFinal = precioPersonalizado ? Number(precioPersonalizado) : productoSelectData.precioVenta;
      
      await registrarVenta({
        productoId: productoSeleccionado,
        nombreProducto: productoSelectData.nombre,
        cantidadVendida: Number(cantidad),
        precioVentaFinal: precioVentaFinal,
        metodoPago,
        nombreCliente: nombreCliente.trim() || undefined,
        cedulaCliente: cedulaCliente.trim() || undefined,
        telefonoCliente: telefonoCliente.trim() || undefined,
        direccionCliente: direccionCliente.trim() || undefined,
      });
      
      // Reset form
      setProductoSeleccionado('');
      setCantidad('1');
      setPrecioPersonalizado('');
      setBusqueda('');
      setNombreCliente('');
      setCedulaCliente('');
      setTelefonoCliente('');
      setDireccionCliente('');
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al registrar la venta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-titanium-slate w-full max-w-lg rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh]">
        
        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div className="flex items-center gap-3 text-cashflow-emerald">
            <ShoppingCart size={24} />
            <h2 className="font-plus-jakarta text-xl font-bold">Nueva Venta</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted-gray transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          <form id="ventaForm" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Seleccionar Producto</label>
              
              {!productoSeleccionado ? (
                <div className="space-y-3">
                  
                  {/* Tabs Premium Modal */}
                  <div className="p-1 bg-cosmic-midnight rounded-xl flex border border-white/5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('Telefonos')}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'Telefonos' 
                          ? 'bg-white/10 text-polar-white shadow-sm' 
                          : 'text-muted-gray hover:text-polar-white hover:bg-white/5'
                      }`}
                    >
                      Teléfonos
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Accesorios')}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'Accesorios' 
                          ? 'bg-white/10 text-polar-white shadow-sm' 
                          : 'text-muted-gray hover:text-polar-white hover:bg-white/5'
                      }`}
                    >
                      Accesorios
                    </button>
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-muted-gray" />
                    <input 
                      type="text" 
                      placeholder={activeTab === 'Telefonos' ? "Buscar teléfono..." : "Buscar accesorio..."}
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="w-full bg-cosmic-midnight border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-polar-white focus:border-cashflow-emerald focus:outline-none transition-colors" 
                    />
                  </div>
                  
                  <div className="max-h-48 sm:max-h-40 overflow-y-auto space-y-1 bg-cosmic-midnight rounded-xl p-1 border border-white/5">
                    {productosDisponibles.slice(0, 20).map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setProductoSeleccionado(p.id)}
                        className="p-2 hover:bg-cashflow-emerald/10 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="font-bold text-sm text-polar-white leading-tight">{p.nombre}</p>
                          <p className="text-xs text-muted-gray mt-0.5">Stock: {p.stockActual} • {p.categoria}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-space-grotesk font-bold text-cashflow-emerald">${p.precioVenta.toFixed(2)}</p>
                          {tasaBCV && (
                            <p className="text-[10px] text-muted-gray font-space-grotesk">
                              Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p.precioVenta * tasaBCV)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {productosDisponibles.length === 0 && (
                      <p className="p-3 text-xs text-center text-muted-gray">No hay stock de {activeTab.toLowerCase()} disponibles.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-cashflow-emerald/10 border border-cashflow-emerald/20 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-polar-white">{productoSelectData?.nombre}</p>
                    <p className="text-xs text-cashflow-emerald font-space-grotesk">
                      ${productoSelectData?.precioVenta.toFixed(2)} sugerido
                      {tasaBCV && ` (Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((productoSelectData?.precioVenta || 0) * tasaBCV)})`}
                    </p>
                  </div>
                  <button type="button" onClick={() => setProductoSeleccionado('')} className="text-xs font-bold text-muted-gray hover:text-polar-white bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Cambiar</button>
                </div>
              )}
            </div>

            {productoSeleccionado && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-gray">Cantidad</label>
                    <input required type="number" min="1" max={productoSelectData?.stockActual} value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-gray">Precio Final (Opcional)</label>
                    <input type="number" step="0.01" value={precioPersonalizado} onChange={e => setPrecioPersonalizado(e.target.value)} placeholder={`$${productoSelectData?.precioVenta}`} className="w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-gray">Método de Pago</label>
                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value as any)} className="w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 text-polar-white focus:outline-none focus:border-cashflow-emerald appearance-none transition-all">
                    <option value="Efectivo">Efectivo ($)</option>
                    <option value="Punto">Punto de Venta (BS)</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Tarjeta">Tarjeta de Débito</option>
                  </select>
                </div>

                {/* Datos del Cliente (Opcional) */}
                <div className="space-y-3.5 p-4 rounded-2xl border border-white/5 bg-cosmic-midnight/40 backdrop-blur-md">
                  <p className="text-xs font-bold text-muted-gray uppercase tracking-wider">Datos del Cliente (Opcional)</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-gray">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={nombreCliente} 
                        onChange={e => setNombreCliente(e.target.value)} 
                        placeholder="Ej. Juan Pérez" 
                        className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[44px]" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-gray">Cédula / RIF</label>
                      <input 
                        type="text" 
                        value={cedulaCliente} 
                        onChange={e => setCedulaCliente(e.target.value)} 
                        placeholder="Ej. V-12345678" 
                        className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[44px]" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-gray">Teléfono</label>
                      <input 
                        type="tel" 
                        value={telefonoCliente} 
                        onChange={e => setTelefonoCliente(e.target.value)} 
                        placeholder="Ej. 0412-1234567" 
                        className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[44px]" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-gray">Dirección</label>
                      <input 
                        type="text" 
                        value={direccionCliente} 
                        onChange={e => setDireccionCliente(e.target.value)} 
                        placeholder="Ej. Av. Bolívar local 5" 
                        className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[44px]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-cashflow-emerald/30 bg-cashflow-emerald/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-polar-white font-medium">Total a Cobrar:</p>
                    <p className="font-space-grotesk text-2xl font-bold text-cashflow-emerald">
                      ${totalUSD.toFixed(2)}
                    </p>
                  </div>
                  {tasaBCV && (
                    <div className="flex justify-between items-center border-t border-cashflow-emerald/10 pt-2 text-xs">
                      <p className="text-muted-gray">Total en Bolívares (BCV):</p>
                      <p className="font-space-grotesk font-bold text-polar-white">
                        Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalUSD * tasaBCV)}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
            
          </form>
        </div>

        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors">
            Cancelar
          </button>
          <button type="submit" form="ventaForm" disabled={isSubmitting || !productoSeleccionado} className="flex-[2] px-8 py-3 rounded-xl font-bold bg-cashflow-emerald text-white shadow-lg shadow-cashflow-emerald/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">
            <ShoppingCart size={20} />
            {isSubmitting ? 'Procesando...' : 'Registrar'}
          </button>
        </div>

      </div>
    </div>
  );
}
