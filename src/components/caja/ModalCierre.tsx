'use client';

import { useMemo, useState } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { X, ClipboardCheck } from 'lucide-react';
import { MensajeToast } from '@/components/shared/Toast';
import { CierreCaja, MetodoPago, MontosPorMetodo } from '@/types';
import { METODOS_PAGO, METODO_COLORS, ResumenCajaSemana, calcularDiferenciaCierre, redondearParaArqueo } from '@/utils/caja';
import { getFinSemana, formatearSemana } from '@/utils/fechas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (mensaje: MensajeToast) => void;
  semanaInicio: Date;
  resumen: ResumenCajaSemana;
  cierreExistente?: CierreCaja | null;
}

const inicializarArqueo = (resumen: ResumenCajaSemana, cierreExistente?: CierreCaja | null): Record<MetodoPago, string> => {
  const arqueo = {} as Record<MetodoPago, string>;
  METODOS_PAGO.forEach(({ value }) => {
    const valorExistente = cierreExistente?.arqueoReal?.[value];
    const valorInicial = valorExistente !== undefined ? valorExistente : (resumen.saldo[value] ?? 0);
    arqueo[value] = valorInicial > 0 ? valorInicial.toString() : '';
  });
  return arqueo;
};

export default function ModalCierre({ isOpen, onClose, onNotify, semanaInicio, resumen, cierreExistente }: Props) {
  const { user, guardarCierre } = useTienda();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arqueo, setArqueo] = useState<Record<MetodoPago, string>>(() => inicializarArqueo(resumen, cierreExistente));
  const [observaciones, setObservaciones] = useState(cierreExistente?.observaciones ?? '');

  const arqueoNumerico = useMemo(() => {
    const valores: MontosPorMetodo = {};
    METODOS_PAGO.forEach(({ value }) => {
      const monto = Number(arqueo[value]);
      valores[value] = Number.isFinite(monto) && monto >= 0 ? redondearParaArqueo(monto) : 0;
    });
    return valores;
  }, [arqueo]);

  const diferencia = useMemo(() => calcularDiferenciaCierre(resumen.saldo, arqueoNumerico), [resumen.saldo, arqueoNumerico]);

  const totalArqueo = useMemo(
    () => Object.values(arqueoNumerico).reduce((acc, m) => acc + (m ?? 0), 0),
    [arqueoNumerico]
  );
  const totalDiferencia = useMemo(
    () => Object.values(diferencia).reduce((acc, m) => acc + (m ?? 0), 0),
    [diferencia]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cierre: Omit<CierreCaja, 'id'> = {
        semanaInicio: semanaInicio.toISOString(),
        semanaFin: getFinSemana(semanaInicio).toISOString(),
        montosVentas: resumen.ventas,
        montosRetiros: resumen.retiros,
        saldoEsperado: resumen.saldo,
        arqueoReal: arqueoNumerico,
        diferencia,
        totalVentas: resumen.totalVentas,
        totalRetiros: resumen.totalRetiros,
        totalEsperado: resumen.totalSaldo,
        totalArqueo,
        totalDiferencia,
        registradoPor: user?.uid ?? undefined,
        registradoPorEmail: user?.email ?? undefined,
        fechaCierre: new Date().toISOString(),
        ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
      };

      await guardarCierre(cierre);

      onClose();
      onNotify?.({
        title: cierreExistente ? 'Cierre actualizado con éxito' : 'Cierre de caja guardado con éxito',
        type: 'success',
      });
    } catch (error) {
      console.error("Error guardando cierre:", error);
      onNotify?.({ title: 'Error al guardar el cierre', type: 'error' });
      if (!onNotify) alert("Error al guardar el cierre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Cierre de caja semanal" className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-titanium-slate w-full max-w-3xl rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[90dvh]">

        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div className="flex items-center gap-3 text-electric-cyan">
            <ClipboardCheck size={24} />
            <div>
              <h2 className="font-plus-jakarta text-xl font-bold">
                {cierreExistente ? 'Editar Cierre de Caja' : 'Realizar Cierre de Caja'}
              </h2>
              <p className="text-xs text-muted-gray mt-0.5">{formatearSemana(semanaInicio)}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de cierre" className="p-2 rounded-full hover:bg-white/10 text-muted-gray transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          <form id="cierreForm" onSubmit={handleSubmit} className="space-y-4">

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-3 font-medium text-xs text-muted-gray uppercase tracking-wider">Método</th>
                      <th className="p-3 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Ventas</th>
                      <th className="p-3 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Retiros</th>
                      <th className="p-3 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Saldo Esperado</th>
                      <th className="p-3 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Contado Real</th>
                      <th className="p-3 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {METODOS_PAGO.map(({ value, label }) => {
                      const saldo = resumen.saldo[value] ?? 0;
                      const dif = diferencia[value] ?? 0;
                      const tieneMovimiento = saldo !== 0 || arqueo[value] !== '';
                      if (!tieneMovimiento) return null;
                      return (
                        <tr key={value} className="hover:bg-white/5 transition-colors">
                          <td className="p-3">
                            <span className="flex items-center gap-2 text-sm font-bold text-polar-white">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: METODO_COLORS[value] }} />
                              {label}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-space-grotesk text-muted-gray text-right">${(resumen.ventas[value] ?? 0).toFixed(2)}</td>
                          <td className="p-3 text-sm font-space-grotesk text-neon-amber text-right">-${(resumen.retiros[value] ?? 0).toFixed(2)}</td>
                          <td className="p-3 text-sm font-space-grotesk font-bold text-polar-white text-right">${saldo.toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={arqueo[value]}
                              onChange={e => setArqueo({ ...arqueo, [value]: e.target.value })}
                              className="w-28 text-right bg-cosmic-midnight border border-white/10 rounded-lg px-2.5 py-1.5 font-space-grotesk font-bold text-polar-white focus:outline-none focus:border-electric-cyan transition-all"
                              placeholder="0.00"
                              aria-label={`Contado real en ${label}`}
                            />
                          </td>
                          <td className={`p-3 text-sm font-space-grotesk font-bold text-right ${dif >= 0 ? 'text-cashflow-emerald' : 'text-alert-coral'}`}>
                            {dif === 0 ? '—' : `${dif > 0 ? '+' : ''}$${dif.toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-white/10 bg-white/5">
                      <td colSpan={3} className="p-3 text-sm font-bold text-polar-white text-right">Totales</td>
                      <td className="p-3 text-sm font-space-grotesk font-bold text-polar-white text-right">${resumen.totalSaldo.toFixed(2)}</td>
                      <td className="p-3 text-sm font-space-grotesk font-bold text-polar-white text-right">${totalArqueo.toFixed(2)}</td>
                      <td className={`p-3 text-sm font-space-grotesk font-bold text-right ${totalDiferencia >= 0 ? 'text-cashflow-emerald' : 'text-alert-coral'}`}>
                        {totalDiferencia === 0 ? '—' : `${totalDiferencia > 0 ? '+' : ''}$${totalDiferencia.toFixed(2)}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-muted-gray">
              💡 El campo <b>Contado Real</b> se pre-rellena con el saldo esperado. Ajusta según el dinero que cuentes físicamente. La diferencia se calcula automáticamente.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Observaciones (opcional)</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={2}
                className="w-full bg-cosmic-midnight border border-white/10 rounded-xl px-4 py-3 text-polar-white focus:outline-none focus:border-electric-cyan transition-all resize-none"
                placeholder="Ej: Faltante de $5 en efectivo, cambio dado mal, etc."
              />
            </div>

          </form>
        </div>

        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors">
            Cancelar
          </button>
          <button type="submit" form="cierreForm" disabled={isSubmitting} className="flex-[2] px-8 py-3 rounded-xl font-bold bg-electric-cyan text-cosmic-midnight shadow-lg shadow-electric-cyan/20 hover:-translate-y-0.5 hover:shadow-electric-cyan/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <ClipboardCheck size={20} />
            {isSubmitting ? 'Guardando...' : cierreExistente ? 'Actualizar Cierre' : 'Guardar Cierre'}
          </button>
        </div>

      </div>
    </div>
  );
}
