'use client';

import { X, ReceiptText, Calendar, ArrowRightLeft, Ban, ShieldCheck, User, Phone, FileText, MapPin } from 'lucide-react';
import { Venta } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  venta: Venta | null;
  tasaBCV: number | null;
}

export default function DetalleVentaModal({ isOpen, onClose, venta, tasaBCV }: Props) {
  if (!isOpen || !venta) return null;

  const totalUSD = venta.precioVentaFinal * venta.cantidadVendida;
  const totalBS = tasaBCV ? totalUSD * tasaBCV : null;

  const formatearFecha = (isoString: string) => {
    const fecha = new Date(isoString);
    return new Intl.DateTimeFormat('es-VE', { 
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(fecha);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-titanium-slate w-full max-w-md rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh]">
        
        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div className="flex items-center gap-3 text-cashflow-emerald">
            <ReceiptText size={24} />
            <h2 className="font-plus-jakarta text-xl font-bold text-polar-white">Detalle de Ticket</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted-gray transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          
          {/* Cabecera Estado */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div>
              <p className="text-[10px] text-muted-gray uppercase tracking-wider">ID de Transacción</p>
              <p className="font-mono text-xs text-polar-white mt-0.5">{venta.id}</p>
            </div>
            {venta.anulada ? (
              <span className="px-2.5 py-1 rounded-lg bg-alert-coral/15 text-alert-coral border border-alert-coral/25 font-bold uppercase text-[10px] tracking-wide flex items-center gap-1">
                <Ban size={12} />
                Anulada
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-cashflow-emerald/15 text-cashflow-emerald border border-cashflow-emerald/25 font-bold uppercase text-[10px] tracking-wide flex items-center gap-1">
                <ShieldCheck size={12} />
                Activa
              </span>
            )}
          </div>

          {/* Información del Producto */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-gray uppercase tracking-wider">Detalles del Producto</h3>
            <div className="p-4 rounded-xl bg-cosmic-midnight/60 border border-white/5 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-bold text-polar-white text-base leading-tight">{venta.nombreProducto}</p>
                  <p className="text-xs text-muted-gray mt-1 font-space-grotesk">Cantidad: {venta.cantidadVendida} unidades</p>
                </div>
                <div className="text-right">
                  <p className="font-space-grotesk font-bold text-cashflow-emerald text-lg">${venta.precioVentaFinal.toFixed(2)} c/u</p>
                </div>
              </div>
              
              <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                <p className="text-sm text-muted-gray">Total de Venta:</p>
                <div className="text-right">
                  <p className="font-space-grotesk font-bold text-polar-white text-xl">${totalUSD.toFixed(2)}</p>
                  {totalBS && (
                    <p className="text-xs text-muted-gray font-space-grotesk mt-0.5">
                      Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalBS)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-gray uppercase tracking-wider">Información del Cliente</h3>
            <div className="p-4 rounded-xl bg-cosmic-midnight/60 border border-white/5 space-y-3.5">
              {venta.nombreCliente || venta.cedulaCliente || venta.telefonoCliente || venta.direccionCliente ? (
                <>
                  {venta.nombreCliente && (
                    <div className="flex gap-3">
                      <User size={16} className="text-muted-gray shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-gray uppercase leading-none">Nombre</p>
                        <p className="text-sm font-semibold text-polar-white mt-1">{venta.nombreCliente}</p>
                      </div>
                    </div>
                  )}
                  {venta.cedulaCliente && (
                    <div className="flex gap-3">
                      <FileText size={16} className="text-muted-gray shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-gray uppercase leading-none">Cédula / RIF</p>
                        <p className="text-sm font-semibold text-polar-white mt-1">{venta.cedulaCliente}</p>
                      </div>
                    </div>
                  )}
                  {venta.telefonoCliente && (
                    <div className="flex gap-3">
                      <Phone size={16} className="text-muted-gray shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-gray uppercase leading-none">Teléfono</p>
                        <p className="text-sm font-semibold text-polar-white mt-1">{venta.telefonoCliente}</p>
                      </div>
                    </div>
                  )}
                  {venta.direccionCliente && (
                    <div className="flex gap-3">
                      <MapPin size={16} className="text-muted-gray shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-gray uppercase leading-none">Dirección</p>
                        <p className="text-sm font-medium text-polar-white mt-1 leading-relaxed">{venta.direccionCliente}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-center text-muted-gray py-2">No se registraron datos del cliente en esta transacción.</p>
              )}
            </div>
          </div>

          {/* Información del Pago y Registro */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-gray uppercase tracking-wider">Pago y Fecha</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-cosmic-midnight/60 border border-white/5 flex items-center gap-3">
                <ArrowRightLeft size={18} className="text-electric-cyan shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-gray uppercase leading-none">Método de Pago</p>
                  <p className="text-xs font-bold text-polar-white mt-1.5">{venta.metodoPago}</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-cosmic-midnight/60 border border-white/5 flex items-center gap-3">
                <Calendar size={18} className="text-electric-cyan shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-gray uppercase leading-none">Fecha de Registro</p>
                  <p className="text-[11px] font-bold text-polar-white mt-1.5 leading-tight font-space-grotesk">{formatearFecha(venta.fecha)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          <button type="button" onClick={onClose} className="w-full px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors text-sm min-h-[44px] cursor-pointer">
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
}
