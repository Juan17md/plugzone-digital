'use client';

import { useState, useMemo } from 'react';
import { useTienda } from '@/context/TiendaContext';
import NuevaVentaModal from '@/components/finanzas/NuevaVentaModal';
import NuevoGastoModal from '@/components/finanzas/NuevoGastoModal';
import ChartsFinanzas from '@/components/finanzas/ChartsFinanzas';
import { ShoppingCart, Receipt, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInicioSemana, getFinSemana, getSemanaAnterior, getSemanaSiguiente, formatearSemana, esSemanaActual } from '@/utils/fechas';

export default function FinanzasPage() {
  const { ventas, gastos } = useTienda();

  const [modalVentaOpen, setModalVentaOpen] = useState(false);
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(() => getInicioSemana(new Date()));

  const semanaAnterior = () => setSemanaSeleccionada(s => getSemanaAnterior(s));
  const semanaSiguiente = () => setSemanaSeleccionada(s => getSemanaSiguiente(s));
  const irSemanaActual = () => setSemanaSeleccionada(getInicioSemana(new Date()));

  const finanzas = useMemo(() => {
    const inicio = getInicioSemana(semanaSeleccionada);
    const fin = getFinSemana(semanaSeleccionada);

    const ventasDeSemana = ventas.filter(v => {
      const fecha = new Date(v.fecha);
      return fecha >= inicio && fecha <= fin && !v.anulada;
    });

    const gastosDeSemana = gastos.filter(g => {
      const fecha = new Date(g.fecha);
      return fecha >= inicio && fecha <= fin;
    });

    const ingresosBrutos = ventasDeSemana.reduce((acc, v) => acc + (v.precioVentaFinal * v.cantidadVendida), 0);
    const gananciaNeta = ventasDeSemana.reduce((acc, v) => acc + v.gananciaNeta, 0);
    const totalGastos = gastosDeSemana.reduce((acc, g) => acc + g.monto, 0);
    const balancePuro = gananciaNeta - totalGastos;

    return { ingresosBrutos, gananciaNeta, totalGastos, balancePuro, ventasDeSemana, gastosDeSemana };
  }, [ventas, gastos, semanaSeleccionada]);

  const noEsSemanaActual = !esSemanaActual(semanaSeleccionada);

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Cabecera y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white">Finanzas</h2>
          <p className="text-muted-gray mt-1 text-sm sm:text-base">Reporte operativo semanal.</p>
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

      {/* Selector de Semana */}
      <div className="flex items-center justify-between glass-panel px-4 py-3 rounded-xl">
        <button
          onClick={semanaAnterior}
          className="p-2 rounded-lg hover:bg-white/5 text-muted-gray hover:text-polar-white transition-colors"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-col items-center gap-1">
          {!noEsSemanaActual && (
            <span className="text-[10px] font-bold text-cashflow-emerald bg-cashflow-emerald/10 px-2 py-0.5 rounded-md tracking-wide">Semana Actual</span>
          )}
          <span className="font-plus-jakarta font-bold text-base text-polar-white">{formatearSemana(semanaSeleccionada)}</span>
          {noEsSemanaActual && (
            <button
              onClick={irSemanaActual}
              className="text-[10px] font-bold text-electric-cyan bg-electric-cyan/10 px-2.5 py-1 rounded-md hover:bg-electric-cyan/20 transition-colors tracking-wide"
            >
              ← Volver a Semana Actual
            </button>
          )}
        </div>

        <button
          onClick={semanaSiguiente}
          disabled={esSemanaActual(semanaSeleccionada)}
          className="p-2 rounded-lg hover:bg-white/5 text-muted-gray hover:text-polar-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Semana siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid de KPIs Financieros */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">

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
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Gastos Totales</p>
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

      {/* Charts - filtrados por semana */}
      <ChartsFinanzas ventas={finanzas.ventasDeSemana} semanaInicio={getInicioSemana(semanaSeleccionada)} />

      <NuevaVentaModal isOpen={modalVentaOpen} onClose={() => setModalVentaOpen(false)} />
      <NuevoGastoModal isOpen={modalGastoOpen} onClose={() => setModalGastoOpen(false)} />
    </div>
  );
}
