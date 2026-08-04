'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { obtenerTotalVenta, obtenerGananciaVenta } from '@/types';
import NuevaVentaModal from '@/components/finanzas/NuevaVentaModal';
import NuevoGastoModal from '@/components/finanzas/NuevoGastoModal';
import ChartsFinanzas from '@/components/finanzas/ChartsFinanzas';
import { ShoppingCart, Receipt, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { getInicioSemana, getFinSemana, getSemanaAnterior, getSemanaSiguiente, formatearSemana, esSemanaActual } from '@/utils/fechas';
import BotonExportar from '@/components/shared/BotonExportar';
import { exportarReporteFinancieroExcel } from '@/utils/exportExcel';
import { exportarReporteFinancieroPdf } from '@/utils/exportPdf';
import Toast, { MensajeToast } from '@/components/shared/Toast';
import Link from 'next/link';

export default function FinanzasPage() {
  const { ventas, gastos, tasaBCV } = useTienda();

  const [modalVentaOpen, setModalVentaOpen] = useState(false);
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(() => getInicioSemana(new Date()));
  const [toastMessage, setToastMessage] = useState<MensajeToast | null>(null);

  // Ocultar toast automáticamente
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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

    const ingresosBrutos = ventasDeSemana.reduce((acc, v) => acc + obtenerTotalVenta(v), 0);
    const gananciaNeta = ventasDeSemana.reduce((acc, v) => acc + obtenerGananciaVenta(v), 0);
    const totalGastos = gastosDeSemana.reduce((acc, g) => acc + g.monto, 0);
    const balancePuro = gananciaNeta - totalGastos;

    return { ingresosBrutos, gananciaNeta, totalGastos, balancePuro, ventasDeSemana, gastosDeSemana };
  }, [ventas, gastos, semanaSeleccionada]);

  const noEsSemanaActual = !esSemanaActual(semanaSeleccionada);

  const handleExportarExcel = async () => {
    try {
      const textoSemana = formatearSemana(semanaSeleccionada);
      const nombreArchivo = `Reporte_Financiero_${textoSemana.replace(/\s+/g, '_')}`;
      await exportarReporteFinancieroExcel(
        finanzas.ventasDeSemana,
        finanzas.gastosDeSemana,
        textoSemana,
        tasaBCV ?? 1,
        nombreArchivo
      );
      setToastMessage({ title: 'Reporte Excel descargado con éxito', type: 'success' });
    } catch (error) {
      console.error("Error al exportar reporte financiero a Excel:", error);
      setToastMessage({ title: 'Error al generar el reporte Excel', type: 'error' });
    }
  };

  const handleExportarPdf = async () => {
    try {
      const textoSemana = formatearSemana(semanaSeleccionada);
      const nombreArchivo = `Reporte_Financiero_${textoSemana.replace(/\s+/g, '_')}`;
      await exportarReporteFinancieroPdf(
        finanzas.ventasDeSemana,
        finanzas.gastosDeSemana,
        textoSemana,
        tasaBCV ?? 1,
        nombreArchivo
      );
      setToastMessage({ title: 'Reporte PDF descargado con éxito', type: 'success' });
    } catch (error) {
      console.error("Error al exportar reporte financiero a PDF:", error);
      setToastMessage({ title: 'Error al generar el reporte PDF', type: 'error' });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Cabecera y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white">Finanzas</h2>
          <p className="text-muted-gray mt-1 text-sm sm:text-base">Reporte operativo semanal.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <BotonExportar
            onExportarExcel={handleExportarExcel}
            onExportarPdf={handleExportarPdf}
            texto="Reporte"
          />

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

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

        {/* Balance Neto */}
        <div className="glass-panel p-5 md:p-6 rounded-2xl border border-transparent transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Balance Neto</p>
              <h3 className={`font-space-grotesk font-bold text-xl sm:text-2xl truncate ${finanzas.balancePuro >= 0 ? 'text-cashflow-emerald' : 'text-alert-coral'}`}>
                ${finanzas.balancePuro.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-gray mt-0.5">
                Ganancia − Gastos de la semana
              </p>
            </div>
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ml-3 ${finanzas.balancePuro >= 0 ? 'bg-cashflow-emerald/10 text-cashflow-emerald' : 'bg-alert-coral/10 text-alert-coral'}`}>
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

      </div>

      {/* Tabla de Egresos de la Semana */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-plus-jakarta font-bold text-lg text-polar-white">Egresos de la Semana</h3>
          <Link href="/historial" className="text-electric-cyan text-sm font-medium hover:underline flex items-center gap-1">
            Ver todo <ArrowRight size={14} />
          </Link>
        </div>

        {finanzas.gastosDeSemana.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-gray mb-3">
              <Receipt size={22} />
            </div>
            <h4 className="text-sm font-bold text-polar-white">Sin gastos registrados</h4>
            <p className="text-xs text-muted-gray mt-1">No hay egresos operativos en esta semana.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Descripción</th>
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Categoría</th>
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Fecha</th>
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {finanzas.gastosDeSemana.map(gasto => (
                    <tr key={gasto.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-bold text-polar-white">{gasto.descripcion}</td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-0.5 rounded bg-alert-coral/10 text-alert-coral text-xs border border-alert-coral/20">
                          {gasto.categoria}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-gray">
                        {new Date(gasto.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="p-4 text-sm font-space-grotesk font-bold text-alert-coral text-right">
                        ${gasto.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/5">
                    <td colSpan={3} className="p-4 text-sm font-bold text-polar-white text-right">Total Egresos</td>
                    <td className="p-4 text-sm font-space-grotesk font-bold text-alert-coral text-right">
                      ${finanzas.totalGastos.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Charts - filtrados por semana */}
      <ChartsFinanzas ventas={finanzas.ventasDeSemana} semanaInicio={getInicioSemana(semanaSeleccionada)} />

      <NuevaVentaModal isOpen={modalVentaOpen} onClose={() => setModalVentaOpen(false)} onNotify={setToastMessage} />
      <NuevoGastoModal isOpen={modalGastoOpen} onClose={() => setModalGastoOpen(false)} onNotify={setToastMessage} />

      {/* Toast Notification */}
      <Toast mensaje={toastMessage} />
    </div>
  );
}
