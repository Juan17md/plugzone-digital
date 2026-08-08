'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { X, ShoppingCart, Search, Plus, Minus, Trash2 } from 'lucide-react';
import Select from '@/components/shared/Select';
import { MetodoPago } from '@/types';
import { MensajeToast } from '@/components/shared/Toast';

interface ItemCarrito {
  productoId: string;
  nombreProducto: string;
  cantidadVendida: number;
  precioVentaFinal: number;
  stockDisponible: number;
  precioSugerido: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (mensaje: MensajeToast) => void;
}

export default function NuevaVentaModal({ isOpen, onClose, onNotify }: Props) {
  const { productos, registrarVenta, tasaBCV } = useTienda();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [activeTab, setActiveTab] = useState<'Telefonos' | 'Accesorios'>('Telefonos');

  // Carrito
  const [itemsCarrito, setItemsCarrito] = useState<ItemCarrito[]>([]);

  // Método de pago
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');

  // Datos del cliente
  const [nombreCliente, setNombreCliente] = useState('');
  const [cedulaCliente, setCedulaCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');

  // Bloquear scroll de la página de fondo cuando el modal está activo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const productosDisponibles = useMemo(() => {
    return productos.filter(p => {
      const hasStock = p.stockActual > 0;
      const matchSearch = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const isTelefono = p.categoria === 'Teléfonos';
      const matchTab = activeTab === 'Telefonos' ? isTelefono : !isTelefono;

      // Descontar del stock visual lo que ya está en el carrito
      const enCarrito = itemsCarrito.find(i => i.productoId === p.id);
      const stockRestante = hasStock ? p.stockActual - (enCarrito?.cantidadVendida || 0) : 0;

      return stockRestante > 0 && matchSearch && matchTab;
    });
  }, [productos, busqueda, activeTab, itemsCarrito]);

  const totalUSD = useMemo(() => {
    return itemsCarrito.reduce((acc, item) => acc + item.precioVentaFinal * item.cantidadVendida, 0);
  }, [itemsCarrito]);

  const agregarAlCarrito = (productoId: string) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    setItemsCarrito(prev => {
      const existente = prev.find(i => i.productoId === productoId);
      if (existente) {
        if (existente.cantidadVendida >= producto.stockActual) return prev;
        return prev.map(i =>
          i.productoId === productoId
            ? { ...i, cantidadVendida: i.cantidadVendida + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombreProducto: producto.nombre,
          cantidadVendida: 1,
          precioVentaFinal: producto.precioVenta,
          stockDisponible: producto.stockActual,
          precioSugerido: producto.precioVenta,
        },
      ];
    });
  };

  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    setItemsCarrito(prev =>
      prev.map(i =>
        i.productoId === productoId
          ? { ...i, cantidadVendida: Math.max(1, Math.min(nuevaCantidad, i.stockDisponible)) }
          : i
      )
    );
  };

  const actualizarPrecio = (productoId: string, nuevoPrecio: string) => {
    setItemsCarrito(prev =>
      prev.map(i =>
        i.productoId === productoId
          ? { ...i, precioVentaFinal: nuevoPrecio === '' ? 0 : Number(nuevoPrecio) }
          : i
      )
    );
  };

  const eliminarDelCarrito = (productoId: string) => {
    setItemsCarrito(prev => prev.filter(i => i.productoId !== productoId));
  };

  const resetearFormulario = () => {
    setItemsCarrito([]);
    setBusqueda('');
    setMetodoPago('Efectivo');
    setNombreCliente('');
    setCedulaCliente('');
    setTelefonoCliente('');
    setDireccionCliente('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsCarrito.length === 0) return;

    setIsSubmitting(true);
    try {
      await registrarVenta({
        items: itemsCarrito.map(i => ({
          productoId: i.productoId,
          nombreProducto: i.nombreProducto,
          cantidadVendida: i.cantidadVendida,
          precioVentaFinal: i.precioVentaFinal,
        })),
        metodoPago,
        nombreCliente: nombreCliente.trim() || undefined,
        cedulaCliente: cedulaCliente.trim() || undefined,
        telefonoCliente: telefonoCliente.trim() || undefined,
        direccionCliente: direccionCliente.trim() || undefined,
      });

      resetearFormulario();
      onClose();
      onNotify?.({ title: 'Venta registrada con éxito', type: 'success' });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al registrar la venta';
      onNotify?.({ title: mensaje, type: 'error' });
      if (!onNotify) alert(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Nueva venta" className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-titanium-slate w-full max-w-6xl rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[96dvh] md:max-h-[94vh] h-[95dvh] md:h-auto">

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div className="flex items-center gap-3 text-cashflow-emerald">
            <ShoppingCart size={24} />
            <h2 className="font-plus-jakarta text-xl font-bold">Nueva Venta</h2>
            {itemsCarrito.length > 0 && (
              <span className="bg-cashflow-emerald text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {itemsCarrito.length} {itemsCarrito.length === 1 ? 'artículo' : 'artículos'}
              </span>
            )}
          </div>
          <button onClick={() => { resetearFormulario(); onClose(); }} aria-label="Cerrar modal de nueva venta" className="p-2 rounded-full hover:bg-white/10 text-muted-gray transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Contenido: 2 columnas asimétricas en desktop (5 vs 7), apilado en móvil */}
        <div className="overflow-y-auto p-5 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          <form id="ventaForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">

            {/* ===== COLUMNA IZQUIERDA: Datos del Cliente + Método de Pago (col-span-5) ===== */}
            <div className="space-y-4 md:col-span-5 order-1 md:order-1">
              <p className="text-xs font-bold text-muted-gray uppercase tracking-wider">Información del Cliente</p>

              <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-cosmic-midnight/40 backdrop-blur-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-gray">Nombre Completo</label>
                    <input
                      type="text"
                      value={nombreCliente}
                      onChange={e => setNombreCliente(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[40px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-gray">Cédula / RIF</label>
                    <input
                      type="text"
                      value={cedulaCliente}
                      onChange={e => setCedulaCliente(e.target.value)}
                      placeholder="Ej. V-12345678"
                      className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[40px]"
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
                      className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[40px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-gray">Dirección</label>
                    <input
                      type="text"
                      value={direccionCliente}
                      onChange={e => setDireccionCliente(e.target.value)}
                      placeholder="Ej. Av. Bolívar local 5"
                      className="w-full bg-cosmic-midnight/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-polar-white focus:outline-none focus:border-cashflow-emerald transition-all min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Método de Pago</label>
                <Select
                  value={metodoPago}
                  onChange={v => setMetodoPago(v as MetodoPago)}
                  options={[
                    { value: 'Efectivo', label: 'Efectivo ($)' },
                    { value: 'Punto', label: 'Punto de Venta (BS)' },
                    { value: 'Pago Móvil', label: 'Pago Móvil' },
                    { value: 'Transferencia', label: 'Transferencia Bancaria' },
                    { value: 'Zelle', label: 'Zelle' },
                    { value: 'Tarjeta', label: 'Tarjeta de Débito' },
                    { value: 'Binance', label: 'Binance (USDT)' },
                  ]}
                  accentColor="emerald"
                />
              </div>

              {/* Resumen Total (visible siempre en columna izquierda en desktop) */}
              <div className="hidden md:block">
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
              </div>
            </div>

            {/* ===== COLUMNA DERECHA: Productos + Carrito (col-span-7 - MÁS ANCHO) ===== */}
            <div className="space-y-4 md:col-span-7 order-2 md:order-2">

              {/* Selector de productos */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-gray uppercase tracking-wider">Agregar Productos</p>

                {/* Tabs Teléfonos / Accesorios */}
                <div className="p-1 bg-cosmic-midnight rounded-xl flex border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('Telefonos')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
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
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'Accesorios'
                        ? 'bg-white/10 text-polar-white shadow-sm'
                        : 'text-muted-gray hover:text-polar-white hover:bg-white/5'
                    }`}
                  >
                    Accesorios
                  </button>
                </div>

                {/* Buscador */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-muted-gray" />
                  <input
                    type="text"
                    placeholder={activeTab === 'Telefonos' ? "Buscar teléfono por nombre..." : "Buscar accesorio..."}
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full bg-cosmic-midnight border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-polar-white focus:border-cashflow-emerald focus:outline-none transition-colors"
                  />
                </div>

                {/* Lista simplificada de productos disponibles */}
                <div className="max-h-56 md:max-h-60 overflow-y-auto space-y-1.5 bg-cosmic-midnight rounded-xl p-1.5 border border-white/5">
                  {productosDisponibles.slice(0, 20).map(p => {
                    const enCarrito = itemsCarrito.find(i => i.productoId === p.id);
                    const stockRestante = p.stockActual - (enCarrito?.cantidadVendida || 0);
                    return (
                      <div
                        key={p.id}
                        onClick={() => agregarAlCarrito(p.id)}
                        className="px-3.5 py-2.5 hover:bg-cashflow-emerald/10 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors border border-transparent hover:border-cashflow-emerald/20 text-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-bold text-polar-white truncate">{p.nombre}</span>
                          <span className="px-2 py-0.5 rounded bg-white/5 text-muted-gray text-xs font-medium whitespace-nowrap">
                            Stock: {stockRestante}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-space-grotesk font-bold text-cashflow-emerald text-sm sm:text-base">
                            ${p.precioVenta.toFixed(2)}
                          </span>
                          <div className="w-6 h-6 rounded-md bg-cashflow-emerald/20 text-cashflow-emerald flex items-center justify-center">
                            <Plus size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {productosDisponibles.length === 0 && (
                    <p className="p-3 text-xs text-center text-muted-gray">No hay stock disponible.</p>
                  )}
                </div>
              </div>

              {/* Carrito de productos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-gray uppercase tracking-wider">
                    Carrito ({itemsCarrito.length} {itemsCarrito.length === 1 ? 'artículo' : 'artículos'})
                  </p>
                  {itemsCarrito.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setItemsCarrito([])}
                      className="text-xs text-alert-coral hover:text-alert-coral/80 hover:underline flex items-center gap-1 cursor-pointer font-bold transition-colors"
                    >
                      <Trash2 size={13} />
                      Vaciar Carrito
                    </button>
                  )}
                </div>

                {itemsCarrito.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-white/10 text-center">
                    <ShoppingCart size={32} className="mx-auto text-muted-gray/40 mb-2" />
                    <p className="text-sm font-medium text-muted-gray">Agrega productos al carrito para continuar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-cosmic-midnight/60 max-h-72 md:max-h-80 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs uppercase font-bold text-muted-gray tracking-wider">
                          <th className="p-3">Producto</th>
                          <th className="p-3 text-center w-32">Cant.</th>
                          <th className="p-3 w-28 text-right">Precio ($)</th>
                          <th className="p-3 text-right w-28">Subtotal</th>
                          <th className="p-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {itemsCarrito.map(item => (
                          <tr key={item.productoId} className="hover:bg-white/5 transition-colors">
                            {/* Producto */}
                            <td className="p-3 min-w-0">
                              <p className="font-bold text-polar-white truncate max-w-[160px] sm:max-w-[240px] text-sm">{item.nombreProducto}</p>
                              <p className="text-xs text-muted-gray mt-0.5">PVP: ${item.precioSugerido.toFixed(2)}</p>
                            </td>

                            {/* Cantidad (- 1 +) */}
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1.5 bg-white/5 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => actualizarCantidad(item.productoId, item.cantidadVendida - 1)}
                                  disabled={item.cantidadVendida <= 1}
                                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-muted-gray disabled:opacity-30 transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="font-space-grotesk font-bold text-sm text-polar-white w-6 text-center">
                                  {item.cantidadVendida}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => actualizarCantidad(item.productoId, item.cantidadVendida + 1)}
                                  disabled={item.cantidadVendida >= item.stockDisponible}
                                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-muted-gray disabled:opacity-30 transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </td>

                            {/* Precio unitario editable */}
                            <td className="p-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.precioVentaFinal || ''}
                                onChange={e => actualizarPrecio(item.productoId, e.target.value)}
                                placeholder={`$${item.precioSugerido}`}
                                className="w-full bg-cosmic-midnight border border-white/10 rounded-md px-2.5 py-1.5 text-sm font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-cashflow-emerald text-right"
                              />
                            </td>

                            {/* Subtotal */}
                            <td className="p-3 text-right font-space-grotesk font-bold text-cashflow-emerald text-sm sm:text-base whitespace-nowrap">
                              ${(item.precioVentaFinal * item.cantidadVendida).toFixed(2)}
                            </td>

                            {/* Eliminar */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => eliminarDelCarrito(item.productoId)}
                                className="p-1.5 rounded-lg bg-alert-coral/10 hover:bg-alert-coral/20 text-alert-coral transition-colors"
                                title="Eliminar del carrito"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Resumen Total (visible en móvil) */}
              <div className="md:hidden">
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
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          <button type="button" onClick={() => { resetearFormulario(); onClose(); }} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors">
            Cancelar
          </button>
          <button type="submit" form="ventaForm" disabled={isSubmitting || itemsCarrito.length === 0} className="flex-[2] px-8 py-3 rounded-xl font-bold bg-cashflow-emerald text-white shadow-lg shadow-cashflow-emerald/20 hover:-translate-y-0.5 hover:shadow-cashflow-emerald/40 active:scale-95 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
            <ShoppingCart size={20} />
            {isSubmitting ? 'Procesando...' : `Registrar Venta ($${totalUSD.toFixed(2)})`}
          </button>
        </div>

      </div>
    </div>
  );
}
