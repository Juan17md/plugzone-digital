'use client';

import { useState, useMemo } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { Search, ReceiptText, Receipt, Calendar, ChevronLeft, ChevronRight, ArrowRightLeft, TrendingDown, ShoppingCart } from 'lucide-react';

export default function HistorialPage() {
  const { ventas, gastos } = useTienda();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'ventas' | 'gastos'>('ventas');
  const itemsPerPage = 10;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filtrado de ventas
  const ventasFiltradas = useMemo(() => ventas.filter(v => 
    v.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.metodoPago.toLowerCase().includes(searchTerm.toLowerCase())
  ), [ventas, searchTerm]);

  // Filtrado de gastos
  const gastosFiltrados = useMemo(() => gastos.filter(g =>
    g.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  ), [gastos, searchTerm]);

  // Paginación dinámica según tab activo
  const itemsActivos = activeTab === 'ventas' ? ventasFiltradas : gastosFiltrados;
  const totalPages = Math.ceil(itemsActivos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const ventasPaginadas = ventasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const gastosPaginados = gastosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  const formatearFecha = (isoString: string) => {
    const fecha = new Date(isoString);
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
    <div className="space-y-4 md:space-y-6">
      
      {/* Cabecera */}
      <div>
        <h2 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white">Historial</h2>
        <p className="text-muted-gray mt-1 text-sm sm:text-base">Registro cronológico de todos tus movimientos.</p>
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
            <div className="flex flex-col gap-3">
              {ventasPaginadas.map((venta) => (
                <div key={venta.id} className="glass-panel p-4 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cashflow-emerald/10 text-cashflow-emerald flex items-center justify-center shrink-0">
                      <ReceiptText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-polar-white leading-tight text-sm sm:text-base truncate">{venta.nombreProducto}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] sm:text-xs text-muted-gray">
                        <span className="flex items-center gap-1 whitespace-nowrap"><Calendar size={10} /> {formatearFecha(venta.fecha)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 whitespace-nowrap"><ArrowRightLeft size={10} /> {venta.metodoPago}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-white/5 sm:border-t-0 pt-2.5 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] sm:text-xs text-muted-gray uppercase tracking-wider mb-0.5">Cantidad</p>
                      <p className="font-space-grotesk font-bold text-polar-white text-sm sm:text-base">{venta.cantidadVendida} und.</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs text-muted-gray uppercase tracking-wider mb-0.5">Ingreso Neto</p>
                      <p className="font-space-grotesk font-bold text-cashflow-emerald text-base sm:text-lg">
                        ${(venta.precioVentaFinal * venta.cantidadVendida).toFixed(2)}
                      </p>
                    </div>
                  </div>

                </div>
              ))}
              {ventasFiltradas.length === 0 && searchTerm !== '' && (
                <p className="text-center text-muted-gray py-8 text-sm">No se encontraron ventas para &quot;{searchTerm}&quot;.</p>
              )}
            </div>
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
            <div className="flex flex-col gap-3">
              {gastosPaginados.map((gasto) => (
                <div key={gasto.id} className="glass-panel p-4 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-alert-coral/10 text-alert-coral flex items-center justify-center shrink-0">
                      <TrendingDown size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-polar-white leading-tight text-sm sm:text-base truncate">{gasto.descripcion}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] sm:text-xs text-muted-gray">
                        <span className="flex items-center gap-1 whitespace-nowrap"><Calendar size={10} /> {formatearFecha(gasto.fecha)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] sm:text-xs whitespace-nowrap">{gasto.categoria}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end border-t border-white/5 sm:border-t-0 pt-2.5 sm:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs text-muted-gray uppercase tracking-wider mb-0.5">Egreso</p>
                      <p className="font-space-grotesk font-bold text-alert-coral text-base sm:text-lg">
                        -${gasto.monto.toFixed(2)}
                      </p>
                    </div>
                  </div>

                </div>
              ))}
              {gastosFiltrados.length === 0 && searchTerm !== '' && (
                <p className="text-center text-muted-gray py-8 text-sm">No se encontraron gastos para &quot;{searchTerm}&quot;.</p>
              )}
            </div>
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
  );
}
