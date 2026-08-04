'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { Search, ReceiptText, Receipt, Calendar, ChevronLeft, ChevronRight, ArrowRightLeft, TrendingDown, ShoppingCart, Ban, Eye } from 'lucide-react';
import { obtenerTotalVenta, obtenerCantidadTotal, obtenerResumenProductos } from '@/types';
import DetalleVentaModal from '@/components/finanzas/DetalleVentaModal';
import BotonExportar from '@/components/shared/BotonExportar';
import { exportarVentasExcel, exportarGastosExcel } from '@/utils/exportExcel';
import { exportarVentasPdf, exportarGastosPdf } from '@/utils/exportPdf';
import Toast, { MensajeToast } from '@/components/shared/Toast';

export default function HistorialPage() {
  const { ventas, gastos, anularVenta, tasaBCV } = useTienda();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'ventas' | 'gastos'>('ventas');
  const [ventaAAnular, setVentaAAnular] = useState<string | null>(null);
  const [isAnulando, setIsAnulando] = useState(false);
  const [toastMessage, setToastMessage] = useState<MensajeToast | null>(null);
  const itemsPerPage = 10;

  // Ocultar toast automáticamente
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handler Exportar a Excel
  const handleExportarExcel = async () => {
    const fechaStr = new Date().toISOString().split('T')[0];
    try {
      if (activeTab === 'ventas') {
        if (ventasFiltradas.length === 0) {
          setToastMessage({ title: 'No hay ventas registradas para exportar', type: 'error' });
          return;
        }
        await exportarVentasExcel(ventasFiltradas, tasaBCV, `Ventas_Desglosadas_${fechaStr}`);
        setToastMessage({ title: 'Excel de ventas descargado con éxito', type: 'success' });
      } else {
        if (gastosFiltrados.length === 0) {
          setToastMessage({ title: 'No hay gastos registrados para exportar', type: 'error' });
          return;
        }
        await exportarGastosExcel(gastosFiltrados, tasaBCV, `Gastos_Operativos_${fechaStr}`);
        setToastMessage({ title: 'Excel de gastos descargado con éxito', type: 'success' });
      }
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      setToastMessage({ title: 'Error al generar el archivo Excel', type: 'error' });
    }
  };

  // Handler Exportar a PDF
  const handleExportarPdf = async () => {
    const fechaStr = new Date().toISOString().split('T')[0];
    try {
      if (activeTab === 'ventas') {
        if (ventasFiltradas.length === 0) {
          setToastMessage({ title: 'No hay ventas registradas para exportar', type: 'error' });
          return;
        }
        await exportarVentasPdf(ventasFiltradas, tasaBCV, `Ventas_Desglosadas_${fechaStr}`);
        setToastMessage({ title: 'PDF de ventas descargado con éxito', type: 'success' });
      } else {
        if (gastosFiltrados.length === 0) {
          setToastMessage({ title: 'No hay gastos registrados para exportar', type: 'error' });
          return;
        }
        await exportarGastosPdf(gastosFiltrados, tasaBCV, `Gastos_Operativos_${fechaStr}`);
        setToastMessage({ title: 'PDF de gastos descargado con éxito', type: 'success' });
      }
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      setToastMessage({ title: 'Error al generar el archivo PDF', type: 'error' });
    }
  };

  // Detalle de Venta
  const [selectedVentaDetalle, setSelectedVentaDetalle] = useState<any>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filtrado de ventas
  const ventasFiltradas = useMemo(() => ventas.filter(v => {
    const resumen = obtenerResumenProductos(v).toLowerCase();
    const term = searchTerm.toLowerCase();
    return resumen.includes(term) ||
      v.metodoPago.toLowerCase().includes(term) ||
      (v.nombreCliente || '').toLowerCase().includes(term) ||
      (v.cedulaCliente || '').toLowerCase().includes(term);
  }), [ventas, searchTerm]);

  // Filtrado de gastos defensivo
  const gastosFiltrados = useMemo(() => gastos.filter(g => {
    const desc = (g.descripcion || (g as any).concepto || (g as any).nombre || (g as any).detalle || '').toLowerCase();
    const cat = (g.categoria || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return desc.includes(term) || cat.includes(term);
  }), [gastos, searchTerm]);

  // Paginación dinámica según tab activo
  const itemsActivos = activeTab === 'ventas' ? ventasFiltradas : gastosFiltrados;
  const totalPages = Math.ceil(itemsActivos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const ventasPaginadas = ventasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const gastosPaginados = gastosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  const formatearFecha = (isoString?: string) => {
    if (!isoString) return 'Sin fecha';
    const fecha = new Date(isoString);
    if (isNaN(fecha.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-VE', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(fecha);
  };

  // Reset página al cambiar de tab
  const handleTabChange = (tab: 'ventas' | 'gastos') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6">
      
      {/* Cabecera y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white">Historial</h2>
          <p className="text-muted-gray mt-1 text-sm sm:text-base">Registro cronológico de todos tus movimientos.</p>
        </div>

        <BotonExportar
          onExportarExcel={handleExportarExcel}
          onExportarPdf={handleExportarPdf}
          texto={`Exportar ${activeTab === 'ventas' ? 'Ventas' : 'Gastos'}`}
        />
      </div>

      {/* Tabs Ventas / Gastos */}
      <div className="p-1 glass-panel rounded-xl flex w-full sm:w-auto sm:inline-flex">
        <button
          onClick={() => handleTabChange('ventas')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
            activeTab === 'ventas' 
              ? 'bg-cashflow-emerald text-white shadow-md' 
              : 'text-muted-gray hover:text-polar-white hover:bg-white/5'
          }`}
        >
          <ShoppingCart size={16} />
          Ventas
        </button>
        <button
          onClick={() => handleTabChange('gastos')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
            activeTab === 'gastos' 
              ? 'bg-alert-coral text-white shadow-md' 
              : 'text-muted-gray hover:text-polar-white hover:bg-white/5'
          }`}
        >
          <Receipt size={16} />
          Gastos
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="glass-panel p-2 rounded-xl flex">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder={activeTab === 'ventas' ? "Buscar por producto o método de pago..." : "Buscar por descripción o categoría..."} 
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-transparent text-polar-white pl-11 pr-4 py-3 min-h-[44px] rounded-lg focus:outline-none focus:bg-white/5 transition-colors text-sm sm:text-base"
          />
        </div>
      </div>

      {/* ===== TAB: VENTAS ===== */}
      {activeTab === 'ventas' && (
        <>
          {ventas.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-gray mb-4">
                <ReceiptText size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-polar-white">No hay ventas registradas</h3>
              <p className="text-muted-gray mt-2 text-sm sm:text-base">Tus ventas aparecerán aquí de forma automática.</p>
            </div>
          ) : (
            <>
              {/* Vista Móvil (Tarjetas) */}
              <div className="flex flex-col gap-3 md:hidden">
                {ventasPaginadas.map((venta) => (
                  <div key={venta.id} className={`glass-panel p-4 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 transition-all ${venta.anulada ? 'opacity-55' : ''}`}>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${venta.anulada ? 'bg-white/5 text-muted-gray' : 'bg-cashflow-emerald/10 text-cashflow-emerald'}`}>
                        <ReceiptText size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-bold leading-tight text-sm sm:text-base truncate ${venta.anulada ? 'line-through text-muted-gray' : 'text-polar-white'}`}>{obtenerResumenProductos(venta)}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] sm:text-xs text-muted-gray">
                          <span className="flex items-center gap-1 whitespace-nowrap"><Calendar size={10} /> {formatearFecha(venta.fecha)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1 whitespace-nowrap"><ArrowRightLeft size={10} /> {venta.metodoPago}</span>
                          {venta.anulada && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="px-1.5 py-0.5 rounded bg-alert-coral/10 text-alert-coral font-bold uppercase text-[9px] tracking-wide">Anulada</span>
                            </>
                          )}
                        </div>

                        {/* Información del Cliente si existe */}
                        {(venta.nombreCliente || venta.cedulaCliente || venta.telefonoCliente || venta.direccionCliente) && (
                          <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/5 max-w-md text-[10px] sm:text-xs">
                            <p className="font-bold text-polar-white/95 mb-1 flex items-center gap-1">
                              <span>Cliente:</span>
                              <span className="font-normal text-muted-gray">{venta.nombreCliente || 'No especificado'}</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-muted-gray">
                              {venta.cedulaCliente && (
                                <div>
                                  <span className="font-medium text-white/40 uppercase text-[9px] mr-1">Cédula:</span>
                                  <span className="text-polar-white/80">{venta.cedulaCliente}</span>
                                </div>
                              )}
                              {venta.telefonoCliente && (
                                <div>
                                  <span className="font-medium text-white/40 uppercase text-[9px] mr-1">Teléfono:</span>
                                  <span className="text-polar-white/80">{venta.telefonoCliente}</span>
                                </div>
                              )}
                              {venta.direccionCliente && (
                                <div className="col-span-1 sm:col-span-2">
                                  <span className="font-medium text-white/40 uppercase text-[9px] mr-1">Dirección:</span>
                                  <span className="text-polar-white/80">{venta.direccionCliente}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-white/5 sm:border-t-0 pt-2.5 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] sm:text-xs text-muted-gray uppercase tracking-wider mb-0.5">Cantidad</p>
                        <p className="font-space-grotesk font-bold text-polar-white text-sm sm:text-base">{obtenerCantidadTotal(venta)} und.</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[10px] sm:text-xs text-muted-gray uppercase tracking-wider mb-0.5">Ingreso Neto</p>
                        <p className={`font-space-grotesk font-bold text-base sm:text-lg ${venta.anulada ? 'text-muted-gray line-through' : 'text-cashflow-emerald'}`}>
                          ${obtenerTotalVenta(venta).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => { setSelectedVentaDetalle(venta); setModalDetalleOpen(true); }}
                          className="p-2 sm:p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-polar-white transition-colors cursor-pointer flex items-center justify-center"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        {!venta.anulada && (
                          <button
                            onClick={() => setVentaAAnular(venta.id)}
                            className="p-2 sm:p-2.5 rounded-lg bg-alert-coral/10 hover:bg-alert-coral/20 text-alert-coral transition-colors cursor-pointer flex items-center justify-center"
                            title="Anular venta"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Vista Escritorio (Tabla) */}
              <div className="hidden md:block glass-panel rounded-xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-gray">
                        <th className="py-4 px-4">Producto</th>
                        <th className="py-4 px-4">Cliente</th>
                        <th className="py-4 px-4">Fecha</th>
                        <th className="py-4 px-4">Método de Pago</th>
                        <th className="py-4 px-4 text-center">Cantidad</th>
                        <th className="py-4 px-4 text-right">Ingreso Total</th>
                        <th className="py-4 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {ventasPaginadas.map((venta) => (
                        <tr key={venta.id} className={`hover:bg-white/[0.03] transition-colors ${venta.anulada ? 'opacity-50' : ''}`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${venta.anulada ? 'bg-white/5 text-muted-gray' : 'bg-cashflow-emerald/10 text-cashflow-emerald'}`}>
                                <ReceiptText size={16} />
                              </div>
                              <div>
                                <p className={`font-bold leading-tight ${venta.anulada ? 'line-through text-muted-gray' : 'text-polar-white'}`}>{obtenerResumenProductos(venta)}</p>
                                {venta.anulada && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-alert-coral/10 text-alert-coral font-bold uppercase text-[9px] tracking-wide">Anulada</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {venta.nombreCliente ? (
                              <div>
                                <p className="font-medium text-polar-white/90 text-xs">{venta.nombreCliente}</p>
                                {(venta.cedulaCliente || venta.telefonoCliente) && (
                                  <p className="text-[11px] text-muted-gray">{venta.cedulaCliente || venta.telefonoCliente}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-gray/60 italic">Cliente General</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-gray whitespace-nowrap">
                            {formatearFecha(venta.fecha)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-polar-white">
                              <ArrowRightLeft size={12} className="text-cashflow-emerald" />
                              {venta.metodoPago}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-space-grotesk font-bold text-polar-white">
                            {obtenerCantidadTotal(venta)} und.
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className={`font-space-grotesk font-bold text-base ${venta.anulada ? 'text-muted-gray line-through' : 'text-cashflow-emerald'}`}>
                              ${obtenerTotalVenta(venta).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => { setSelectedVentaDetalle(venta); setModalDetalleOpen(true); }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-polar-white transition-colors cursor-pointer"
                                title="Ver detalles"
                              >
                                <Eye size={15} />
                              </button>
                              {!venta.anulada && (
                                <button
                                  onClick={() => setVentaAAnular(venta.id)}
                                  className="p-2 rounded-lg bg-alert-coral/10 hover:bg-alert-coral/20 text-alert-coral transition-colors cursor-pointer"
                                  title="Anular venta"
                                >
                                  <Ban size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {ventasFiltradas.length === 0 && searchTerm !== '' && (
                <p className="text-center text-muted-gray py-8 text-sm">No se encontraron ventas para &quot;{searchTerm}&quot;.</p>
              )}
            </>
          )}
        </>
      )}

      {/* ===== TAB: GASTOS ===== */}
      {activeTab === 'gastos' && (
        <>
          {gastos.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-gray mb-4">
                <Receipt size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-polar-white">No hay gastos registrados</h3>
              <p className="text-muted-gray mt-2 text-sm sm:text-base">Tus gastos operativos aparecerán aquí de forma automática.</p>
            </div>
          ) : (
            <>
              {/* Vista Móvil (Tarjetas) */}
              <div className="flex flex-col gap-3 md:hidden">
                {gastosPaginados.map((gasto) => {
                  const desc = gasto.descripcion || (gasto as any).concepto || (gasto as any).nombre || (gasto as any).detalle || 'Gasto Operativo';
                  const cat = gasto.categoria || 'Otros';
                  const monto = typeof gasto.monto === 'number' ? gasto.monto : Number((gasto as any).monto || 0);

                  return (
                    <div key={gasto.id} className="glass-panel p-4 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-alert-coral/10 text-alert-coral flex items-center justify-center shrink-0">
                          <TrendingDown size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-polar-white leading-tight text-sm sm:text-base truncate">{desc}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] sm:text-xs text-muted-gray">
                            <span className="flex items-center gap-1 whitespace-nowrap"><Calendar size={10} /> {formatearFecha(gasto.fecha)}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] sm:text-xs whitespace-nowrap">{cat}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end border-t border-white/5 sm:border-t-0 pt-2.5 sm:pt-0">
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs text-muted-gray uppercase tracking-wider mb-0.5">Egreso</p>
                          <p className="font-space-grotesk font-bold text-alert-coral text-base sm:text-lg">
                            -${monto.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista Escritorio (Tabla) */}
              <div className="hidden md:block glass-panel rounded-xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-gray">
                        <th className="py-4 px-4">Descripción del Gasto</th>
                        <th className="py-4 px-4">Categoría</th>
                        <th className="py-4 px-4">Fecha</th>
                        <th className="py-4 px-4 text-right">Monto (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {gastosPaginados.map((gasto) => {
                        const desc = gasto.descripcion || (gasto as any).concepto || (gasto as any).nombre || (gasto as any).detalle || 'Gasto Operativo';
                        const cat = gasto.categoria || 'Otros';
                        const monto = typeof gasto.monto === 'number' ? gasto.monto : Number((gasto as any).monto || 0);

                        return (
                          <tr key={gasto.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-polar-white">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-alert-coral/10 text-alert-coral flex items-center justify-center shrink-0">
                                  <TrendingDown size={16} />
                                </div>
                                <span>{desc}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-polar-white">
                                {cat}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-gray whitespace-nowrap">
                              {formatearFecha(gasto.fecha)}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <span className="font-space-grotesk font-bold text-base text-alert-coral">
                                -${monto.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {gastosFiltrados.length === 0 && searchTerm !== '' && (
                <p className="text-center text-muted-gray py-8 text-sm">No se encontraron gastos para &quot;{searchTerm}&quot;.</p>
              )}
            </>
          )}
        </>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between glass-panel p-4 rounded-xl mt-2">
          <p className="text-xs sm:text-sm text-muted-gray">
            Mostrando <span className="font-bold text-polar-white">{indexOfFirstItem + 1}</span> a <span className="font-bold text-polar-white">{Math.min(indexOfLastItem, itemsActivos.length)}</span> de <span className="font-bold text-polar-white">{itemsActivos.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 text-polar-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-sm font-medium text-polar-white px-2">
              {currentPage} / {totalPages}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 text-polar-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
      
      {/* Modal de Confirmación de Anulación */}
      {ventaAAnular && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-titanium-slate w-full max-w-sm rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-alert-coral/10 text-alert-coral flex items-center justify-center">
                <Ban size={24} />
              </div>
              <h3 className="font-plus-jakarta text-lg font-bold text-polar-white">¿Anular esta venta?</h3>
              <p className="text-xs text-muted-gray leading-relaxed">
                Esta acción no se puede deshacer. Se reajustará el stock y las finanzas automáticamente.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isAnulando}
                onClick={() => setVentaAAnular(null)}
                className="flex-1 py-2.5 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isAnulando}
                onClick={async () => {
                  setIsAnulando(true);
                  try {
                    await anularVenta(ventaAAnular);
                    setVentaAAnular(null);
                    setToastMessage({ title: 'Venta anulada y stock restaurado', type: 'success' });
                  } catch (err: any) {
                    setToastMessage({ title: err.message || 'Error al anular la venta', type: 'error' });
                  } finally {
                    setIsAnulando(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl font-bold bg-alert-coral text-white hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"
              >
                {isAnulando ? 'Anulando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Venta */}
      <DetalleVentaModal isOpen={modalDetalleOpen} onClose={() => { setModalDetalleOpen(false); setSelectedVentaDetalle(null); }} venta={selectedVentaDetalle} tasaBCV={tasaBCV} />

      {/* Toast Notification */}
      <Toast mensaje={toastMessage} />
    </>
  );
}
