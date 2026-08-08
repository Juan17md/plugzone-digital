'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { CierreCaja, RetiroCaja } from '@/types';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, ClipboardCheck,
  ChevronLeft, ChevronRight, ArrowDownRight, Minus, Receipt,
} from 'lucide-react';
import { getInicioSemana, getSemanaAnterior, getSemanaSiguiente, formatearSemana, esSemanaActual } from '@/utils/fechas';
import { METODOS_PAGO, METODO_COLORS, calcularResumenCaja, nombreMetodo } from '@/utils/caja';
import BotonExportar from '@/components/shared/BotonExportar';
import ModalRetiro from '@/components/caja/ModalRetiro';
import ModalCierre from '@/components/caja/ModalCierre';
import HistorialCierres from '@/components/caja/HistorialCierres';
import Toast, { MensajeToast } from '@/components/shared/Toast';
import { exportarCierreExcel } from '@/utils/exportExcel';
import { exportarCierrePdf } from '@/utils/exportPdf';

export default function CajaPage() {
  const { ventas, retiros, gastos, cierres, tasaBCV, eliminarRetiro } = useTienda();

  const [semanaSeleccionada, setSemanaSeleccionada] = useState(() => getInicioSemana(new Date()));
  const [modalRetiroOpen, setModalRetiroOpen] = useState(false);
  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [cierreSeleccionado, setCierreSeleccionado] = useState<CierreCaja | null>(null);
  const [retiroAEliminar, setRetiroAEliminar] = useState<RetiroCaja | null>(null);
  const [isEliminando, setIsEliminando] = useState(false);
  const [toastMessage, setToastMessage] = useState<MensajeToast | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const semanaAnterior = () => setSemanaSeleccionada(s => getSemanaAnterior(s));
  const semanaSiguiente = () => setSemanaSeleccionada(s => getSemanaSiguiente(s));
  const irSemanaActual = () => setSemanaSeleccionada(getInicioSemana(new Date()));

  const inicioSemana = useMemo(() => getInicioSemana(semanaSeleccionada), [semanaSeleccionada]);
  const claveSemana = inicioSemana.toISOString();

  const resumen = useMemo(() => {
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 7);
    return calcularResumenCaja(ventas, retiros, gastos, inicioSemana, finSemana);
  }, [ventas, retiros, gastos, inicioSemana]);

  const cierreDeSemana = useMemo(
    () => cierres.find(c => c.semanaInicio === claveSemana) ?? null,
    [cierres, claveSemana]
  );

  const retirosDeSemana = useMemo(() => {
    const fin = new Date(inicioSemana);
    fin.setDate(fin.getDate() + 7);
    return retiros.filter(r => {
      const fecha = new Date(r.fecha);
      return fecha >= inicioSemana && fecha < fin;
    });
  }, [retiros, inicioSemana]);

  const noEsSemanaActual = !esSemanaActual(semanaSeleccionada);

  const abrirCierreNuevo = () => {
    setCierreSeleccionado(null);
    setModalCierreOpen(true);
  };

  const abrirCierreExistente = (cierre: CierreCaja) => {
    setSemanaSeleccionada(new Date(cierre.semanaInicio));
    setCierreSeleccionado(cierre);
    setModalCierreOpen(true);
  };

  const confirmarEliminarRetiro = async () => {
    if (!retiroAEliminar) return;
    setIsEliminando(true);
    try {
      await eliminarRetiro(retiroAEliminar.id);
      setRetiroAEliminar(null);
      setToastMessage({ title: 'Retiro eliminado con éxito', type: 'success' });
    } catch (error) {
      console.error("Error eliminando retiro:", error);
      setToastMessage({ title: 'Error al eliminar el retiro', type: 'error' });
    } finally {
      setIsEliminando(false);
    }
  };

  const handleExportarExcel = async () => {
    if (!cierreDeSemana) return;
    try {
      const texto = formatearSemana(semanaSeleccionada);
      await exportarCierreExcel(cierreDeSemana, tasaBCV, `Cierre_Caja_${texto.replace(/\s+/g, '_')}`);
      setToastMessage({ title: 'Cierre exportado a Excel con éxito', type: 'success' });
    } catch (error) {
      console.error("Error exportando cierre a Excel:", error);
      setToastMessage({ title: 'Error al exportar el cierre', type: 'error' });
    }
  };

  const handleExportarPdf = async () => {
    if (!cierreDeSemana) return;
    try {
      const texto = formatearSemana(semanaSeleccionada);
      await exportarCierrePdf(cierreDeSemana, texto, tasaBCV, `Cierre_Caja_${texto.replace(/\s+/g, '_')}`);
      setToastMessage({ title: 'Cierre exportado a PDF con éxito', type: 'success' });
    } catch (error) {
      console.error("Error exportando cierre a PDF:", error);
      setToastMessage({ title: 'Error al exportar el cierre', type: 'error' });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cabecera y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white">Caja</h2>
          <p className="text-muted-gray mt-1 text-sm sm:text-base">
            Saldo disponible por método de pago y cierres dominicales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <BotonExportar
            onExportarExcel={handleExportarExcel}
            onExportarPdf={handleExportarPdf}
            texto="Cierre"
            disabled={!cierreDeSemana}
          />

          <button
            onClick={() => setModalRetiroOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neon-amber text-cosmic-midnight font-bold px-3 sm:px-5 py-3 rounded-xl shadow-lg shadow-neon-amber/20 hover:scale-105 active:scale-95 transition-all min-h-[44px] text-sm sm:text-base"
          >
            <ArrowDownRight size={18} />
            <span className="hidden sm:inline">Registrar Retiro</span>
            <span className="sm:hidden">Retiro</span>
          </button>

          <button
            onClick={abrirCierreNuevo}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-electric-cyan text-cosmic-midnight font-bold px-3 sm:px-5 py-3 rounded-xl shadow-lg shadow-electric-cyan/20 hover:scale-105 active:scale-95 transition-all min-h-[44px] text-sm sm:text-base"
          >
            <ClipboardCheck size={18} />
            <span className="hidden sm:inline">{cierreDeSemana ? 'Ver / Editar Cierre' : 'Realizar Cierre'}</span>
            <span className="sm:hidden">Cierre</span>
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

      {/* Estado del Cierre de la Semana */}
      <div className={`glass-panel px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
        cierreDeSemana ? 'border-cashflow-emerald/20' : 'border-neon-amber/20'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            cierreDeSemana ? 'bg-cashflow-emerald/10 text-cashflow-emerald' : 'bg-neon-amber/10 text-neon-amber'
          }`}>
            {cierreDeSemana ? <ClipboardCheck size={20} /> : <Minus size={20} />}
          </div>
          <div className="min-w-0">
            {cierreDeSemana ? (
              <>
                <p className="text-sm font-bold text-cashflow-emerald">Cierre realizado</p>
                <p className="text-xs text-muted-gray truncate">
                  {new Date(cierreDeSemana.fechaCierre).toLocaleString('es-VE', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                  {' · '}
                  {cierreDeSemana.registradoPorEmail ?? '—'}
                  {' · '}
                  Diferencia: {cierreDeSemana.totalDiferencia === 0 ? '$0.00' : `${cierreDeSemana.totalDiferencia > 0 ? '+' : ''}$${cierreDeSemana.totalDiferencia.toFixed(2)}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-neon-amber">Cierre pendiente</p>
                <p className="text-xs text-muted-gray">Esta semana aún no tiene cierre registrado.</p>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => cierreDeSemana ? abrirCierreExistente(cierreDeSemana) : abrirCierreNuevo()}
          className="flex-none px-4 py-2 rounded-xl text-sm font-bold bg-electric-cyan/10 text-electric-cyan hover:bg-electric-cyan/20 transition-colors"
        >
          {cierreDeSemana ? 'Ver / Editar' : 'Realizar ahora'}
        </button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-panel p-5 md:p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Ventas de la Semana</p>
              <h3 className="font-space-grotesk font-bold text-xl sm:text-2xl text-cashflow-emerald truncate">
                ${resumen.totalVentas.toFixed(2)}
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-cashflow-emerald/10 text-cashflow-emerald shrink-0 ml-3">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 md:p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Retiros de la Semana</p>
              <h3 className="font-space-grotesk font-bold text-xl sm:text-2xl text-neon-amber truncate">
                ${resumen.totalRetiros.toFixed(2)}
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-neon-amber/10 text-neon-amber shrink-0 ml-3">
              <TrendingDown size={18} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 md:p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Gastos de la Semana</p>
              <h3 className="font-space-grotesk font-bold text-xl sm:text-2xl text-alert-coral truncate">
                ${resumen.totalGastos.toFixed(2)}
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-alert-coral/10 text-alert-coral shrink-0 ml-3">
              <Receipt size={18} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 md:p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-gray mb-1">Saldo Disponible Total</p>
              <h3 className="font-space-grotesk font-bold text-xl sm:text-2xl text-polar-white truncate">
                ${resumen.totalSaldo.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-gray mt-0.5">Ventas − Retiros − Gastos</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-electric-cyan/10 text-electric-cyan shrink-0 ml-3">
              <Wallet size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas por Método de Pago */}
      <div className="space-y-3">
        <h3 className="font-plus-jakarta font-bold text-lg text-polar-white">Saldo por Método de Pago</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {METODOS_PAGO.map(({ value, label }) => {
            const ventasMetodo = resumen.ventas[value] ?? 0;
            const retirosMetodo = resumen.retiros[value] ?? 0;
            const gastosMetodo = resumen.gastos[value] ?? 0;
            const saldoMetodo = resumen.saldo[value] ?? 0;
            const sinMovimiento = ventasMetodo === 0 && retirosMetodo === 0 && gastosMetodo === 0;
            return (
              <div key={value} className={`glass-panel p-5 rounded-2xl transition-all duration-300 ${sinMovimiento ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: METODO_COLORS[value] }} />
                  <h4 className="text-sm font-bold text-polar-white">{label}</h4>
                </div>
                <p className="font-space-grotesk font-bold text-2xl text-polar-white mb-3">
                  ${saldoMetodo.toFixed(2)}
                </p>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="flex justify-between text-muted-gray">
                    <span className="flex items-center gap-1"><TrendingUp size={12} className="text-cashflow-emerald" /> Ventas</span>
                    <span className="font-space-grotesk text-cashflow-emerald">${ventasMetodo.toFixed(2)}</span>
                  </span>
                  <span className="flex justify-between text-muted-gray">
                    <span className="flex items-center gap-1"><TrendingDown size={12} className="text-neon-amber" /> Retiros</span>
                    <span className="font-space-grotesk text-neon-amber">-${retirosMetodo.toFixed(2)}</span>
                  </span>
                  <span className="flex justify-between text-muted-gray">
                    <span className="flex items-center gap-1"><Receipt size={12} className="text-alert-coral" /> Gastos</span>
                    <span className="font-space-grotesk text-alert-coral">-${gastosMetodo.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retiros de la Semana */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-plus-jakarta font-bold text-lg text-polar-white">Retiros de la Semana</h3>
          <button
            onClick={() => setModalRetiroOpen(true)}
            className="flex items-center gap-1.5 text-electric-cyan text-sm font-medium hover:underline"
          >
            <Plus size={16} /> Nuevo retiro
          </button>
        </div>

        {retirosDeSemana.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-gray mb-3">
              <Wallet size={22} />
            </div>
            <h4 className="text-sm font-bold text-polar-white">Sin retiros registrados</h4>
            <p className="text-xs text-muted-gray mt-1">No hay salidas de dinero en esta semana.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Método</th>
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Concepto</th>
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Fecha</th>
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Monto</th>
                    <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {retirosDeSemana.map(retiro => (
                    <tr key={retiro.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="flex items-center gap-2 text-sm font-bold text-polar-white">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: METODO_COLORS[retiro.metodoPago] }} />
                          {nombreMetodo(retiro.metodoPago)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-gray">{retiro.concepto ?? '—'}</td>
                      <td className="p-4 text-xs text-muted-gray">
                        {new Date(retiro.fecha).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-sm font-space-grotesk font-bold text-neon-amber text-right">
                        -${retiro.monto.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setRetiroAEliminar(retiro)}
                          className="p-2 rounded-lg text-muted-gray hover:text-alert-coral hover:bg-alert-coral/10 transition-colors"
                          aria-label={`Eliminar retiro de ${nombreMetodo(retiro.metodoPago)}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/5">
                    <td colSpan={3} className="p-4 text-sm font-bold text-polar-white text-right">Total Retiros</td>
                    <td className="p-4 text-sm font-space-grotesk font-bold text-neon-amber text-right">
                      -${resumen.totalRetiros.toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Cierres */}
      <div className="space-y-3">
        <h3 className="font-plus-jakarta font-bold text-lg text-polar-white">Historial de Cierres</h3>
        <HistorialCierres cierres={cierres} onSeleccionar={abrirCierreExistente} />
      </div>

      {/* Modal de Confirmación de Eliminación de Retiro */}
      {retiroAEliminar && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-titanium-slate w-full max-w-sm rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-alert-coral/10 text-alert-coral flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <h3 className="font-plus-jakarta text-lg font-bold text-polar-white">¿Eliminar este retiro?</h3>
              <p className="text-xs text-muted-gray leading-relaxed">
                Se eliminará el retiro de <b className="text-polar-white">${retiroAEliminar.monto.toFixed(2)}</b> por{' '}
                <b className="text-polar-white">{nombreMetodo(retiroAEliminar.metodoPago)}</b>. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isEliminando}
                onClick={() => setRetiroAEliminar(null)}
                className="flex-1 py-2.5 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isEliminando}
                onClick={confirmarEliminarRetiro}
                className="flex-1 py-2.5 rounded-xl font-bold bg-alert-coral text-white hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"
              >
                {isEliminando ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <ModalRetiro isOpen={modalRetiroOpen} onClose={() => setModalRetiroOpen(false)} onNotify={setToastMessage} />
      <ModalCierre
        key={`${cierreSeleccionado?.id ?? 'nuevo'}-${modalCierreOpen ? 'abierto' : 'cerrado'}`}
        isOpen={modalCierreOpen}
        onClose={() => { setModalCierreOpen(false); setCierreSeleccionado(null); }}
        onNotify={setToastMessage}
        semanaInicio={getInicioSemana(semanaSeleccionada)}
        resumen={resumen}
        cierreExistente={cierreSeleccionado}
      />

      {/* Toast Notification */}
      <Toast mensaje={toastMessage} />
    </div>
  );
}
