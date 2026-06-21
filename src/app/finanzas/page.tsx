'use client';

import { useState, useMemo } from 'react';
import { useTienda } from '@/context/TiendaContext';
import NuevaVentaModal from '@/components/finanzas/NuevaVentaModal';
import NuevoGastoModal from '@/components/finanzas/NuevoGastoModal';
import ChartsFinanzas from '@/components/finanzas/ChartsFinanzas';
import { ShoppingCart, Receipt, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export default function FinanzasPage() {
  const { ventas, gastos } = useTienda();
  
  const [modalVentaOpen, setModalVentaOpen] = useState(false);
  const [modalGastoOpen, setModalGastoOpen] = useState(false);

  // Cálculos Financieros del Mes Actual
  const finanzas = useMemo(() => {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anoActual = ahora.getFullYear();

    const ventasDelMes = ventas.filter(v => {
      const fecha = new Date(v.fecha);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual && !v.anulada;
    });

    const gastosDelMes = gastos.filter(g => {
      const fecha = new Date(g.fecha);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual;
    });

    const ingresosBrutos = ventasDelMes.reduce((acc, v) => acc + (v.precioVentaFinal * v.cantidadVendida), 0);
    const gananciaNeta = ventasDelMes.reduce((acc, v) => acc + v.gananciaNeta, 0);
    const totalGastos = gastosDelMes.reduce((acc, g) => acc + g.monto, 0);
    const balancePuro = gananciaNeta - totalGastos;

    return { ingresosBrutos, gananciaNeta, totalGastos, balancePuro, ventasDelMes, gastosDelMes };
  }, [ventas, gastos]);

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* Cabecera y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white">Finanzas</h2>
          <p className="text-muted-gray mt-1 text-sm sm:text-base">Reporte operativo del mes actual.</p>
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={() => setModalGastoOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-alert-coral/10 text-alert-coral font-bold px-3 sm:px-5 py-3 rounded-xl hover:bg-alert-coral/20 active:scale-95 transition-all min-h-[44px] text-sm sm:text-base"
          >
            <Receipt size={18} />
            <span className="hidden sm:inline">Nuevo Gasto</span>
            <span className="sm:hidden">Gasto</span>
          </button>
          
          <button 
            onClick={() => setModalVentaOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-cashflow-emerald text-white font-bold px-3 sm:px-5 py-3 rounded-xl shadow-lg shadow-cashflow-emerald/20 hover:scale-105 active:scale-95 transition-all min-h-[44px] text-sm sm:text-base"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Nueva Venta</span>
            <span className="sm:hidden">Venta</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Financieros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        
        {/* Balance Puro — Ocupa full width en móvil */}
        <div className="col-span-2 lg:col-span-1 glass-panel p-5 md:p-6 rounded-2xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all ${finanzas.balancePuro >= 0 ? 'bg-cashflow-emerald' : 'bg-alert-coral'}`}></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Caja Libre (Mes)</p>
              <h3 className={`font-space-grotesk font-bold text-2xl sm:text-3xl truncate ${finanzas.balancePuro >= 0 ? 'text-polar-white' : 'text-alert-coral'}`}>
                ${finanzas.balancePuro.toFixed(2)}
              </h3>
            </div>
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ml-3 ${finanzas.balancePuro >= 0 ? 'bg-white/5 text-polar-white' : 'bg-alert-coral/10 text-alert-coral'}`}>
              <Wallet size={18} />
            </div>
          </div>
        </div>

        {/* Ingresos Brutos */}
        <div className="glass-panel p-5 md:p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Ingresos Brutos</p>
              <h3 className="font-space-grotesk font-bold text-xl sm:text-2xl text-polar-white truncate">
                ${finanzas.ingresosBrutos.toFixed(2)}
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-electric-cyan/10 text-electric-cyan shrink-0 ml-3">
              <DollarSign size={18} />
            </div>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="glass-panel p-5 md:p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Ganancia Operativa</p>
              <h3 className="font-space-grotesk font-bold text-xl sm:text-2xl text-cashflow-emerald truncate">
                ${finanzas.gananciaNeta.toFixed(2)}
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-cashflow-emerald/10 text-cashflow-emerald shrink-0 ml-3">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="glass-panel p-5 md:p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Gastos Operativos</p>
              <h3 className="font-space-grotesk font-bold text-xl sm:text-2xl text-alert-coral truncate">
                ${finanzas.totalGastos.toFixed(2)}
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-alert-coral/10 text-alert-coral shrink-0 ml-3">
              <TrendingDown size={18} />
            </div>
          </div>
        </div>

      </div>

      {/* Charts */}
      <ChartsFinanzas ventas={ventas} />

      <NuevaVentaModal isOpen={modalVentaOpen} onClose={() => setModalVentaOpen(false)} />
      <NuevoGastoModal isOpen={modalGastoOpen} onClose={() => setModalGastoOpen(false)} />
    </div>
  );
}
