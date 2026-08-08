'use client';

import { CierreCaja } from '@/types';
import { ClipboardCheck, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { formatearSemana } from '@/utils/fechas';

interface Props {
  cierres: CierreCaja[];
  onSeleccionar: (cierre: CierreCaja) => void;
}

export default function HistorialCierres({ cierres, onSeleccionar }: Props) {
  if (cierres.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-gray mb-3">
          <ClipboardCheck size={22} />
        </div>
        <h4 className="text-sm font-bold text-polar-white">Sin cierres registrados</h4>
        <p className="text-xs text-muted-gray mt-1">
          Realiza tu primer cierre dominical para llevar el historial contable de la caja.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Semana</th>
              <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Fecha de Cierre</th>
              <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider">Registrado Por</th>
              <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Esperado</th>
              <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Contado</th>
              <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Diferencia</th>
              <th className="p-4 font-medium text-xs text-muted-gray uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cierres.map(cierre => {
              const diferencia = cierre.totalDiferencia ?? 0;
              return (
                <tr key={cierre.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm font-bold text-polar-white">
                    {formatearSemana(new Date(cierre.semanaInicio))}
                  </td>
                  <td className="p-4 text-xs text-muted-gray">
                    {new Date(cierre.fechaCierre).toLocaleDateString('es-VE', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="p-4 text-xs text-muted-gray">{cierre.registradoPorEmail ?? '—'}</td>
                  <td className="p-4 text-sm font-space-grotesk font-bold text-polar-white text-right">
                    ${(cierre.totalEsperado ?? 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-sm font-space-grotesk font-bold text-polar-white text-right">
                    ${(cierre.totalArqueo ?? 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-space-grotesk font-bold ${
                      diferencia >= 0 ? 'text-cashflow-emerald' : 'text-alert-coral'
                    }`}>
                      {diferencia > 0 && <TrendingUp size={14} />}
                      {diferencia < 0 && <TrendingDown size={14} />}
                      {diferencia === 0 ? '$0.00' : `${diferencia > 0 ? '+' : ''}$${diferencia.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSeleccionar(cierre)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-electric-cyan bg-electric-cyan/10 hover:bg-electric-cyan/20 transition-colors"
                    >
                      Ver / Editar <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
