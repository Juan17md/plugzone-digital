'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

interface BotonExportarProps {
  onExportarExcel: () => void;
  onExportarPdf: () => void;
  texto?: string;
  disabled?: boolean;
}

export default function BotonExportar({
  onExportarExcel,
  onExportarPdf,
  texto = 'Exportar',
  disabled = false,
}: BotonExportarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectExcel = () => {
    setIsOpen(false);
    onExportarExcel();
  };

  const handleSelectPdf = () => {
    setIsOpen(false);
    onExportarPdf();
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 glass-panel text-[var(--color-polar-white)] font-bold px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all min-h-[44px] text-sm sm:text-base active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--color-electric-cyan)]/40"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download size={18} className="text-[var(--color-electric-cyan)]" />
        <span>{texto}</span>
        <ChevronDown
          size={16}
          className={`text-[var(--color-muted-gray)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--color-titanium-slate)] border border-[var(--glass-border)] shadow-2xl backdrop-blur-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold text-[var(--color-muted-gray)] uppercase tracking-wider border-b border-[var(--glass-border)] mb-1">
            Formato de Exportación
          </div>

          <button
            type="button"
            onClick={handleSelectExcel}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-[var(--color-polar-white)] hover:bg-[var(--glass-border)] transition-colors text-left group"
          >
            <div className="p-1.5 rounded-lg bg-[var(--color-cashflow-emerald)]/10 text-[var(--color-cashflow-emerald)] group-hover:bg-[var(--color-cashflow-emerald)]/20 transition-colors">
              <FileSpreadsheet size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold">Excel (.xlsx)</span>
              <span className="text-[11px] text-[var(--color-muted-gray)]">Hoja de cálculo editable</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSelectPdf}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-[var(--color-polar-white)] hover:bg-[var(--glass-border)] transition-colors text-left group"
          >
            <div className="p-1.5 rounded-lg bg-[var(--color-alert-coral)]/10 text-[var(--color-alert-coral)] group-hover:bg-[var(--color-alert-coral)]/20 transition-colors">
              <FileText size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold">PDF (.pdf)</span>
              <span className="text-[11px] text-[var(--color-muted-gray)]">Documento listo para imprimir</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
