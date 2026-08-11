'use client';

import { useState } from 'react';
import { Producto } from '@/types';
import { PackageOpen, Edit3, Smartphone, Headphones, Zap, Shield, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  productos: Producto[];
  loading: boolean;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
}

const ITEMS_POR_PAGINA = 20;

type EstadoStock = 'agotado' | 'critico' | 'disponible';

function getEstadoStock(producto: Producto): EstadoStock {
  if (producto.stockActual <= 0) return 'agotado';
  if (producto.stockActual <= producto.stockMinimo) return 'critico';
  return 'disponible';
}

const BADGES_ESTADO: Record<EstadoStock, { label: string; clase: string; texto: string }> = {
  agotado: {
    label: 'AGOTADO',
    clase: 'bg-alert-coral/10 border-alert-coral/25 text-alert-coral',
    texto: 'text-alert-coral animate-pulse',
  },
  critico: {
    label: 'CRÍTICO',
    clase: 'bg-neon-amber/15 border-neon-amber/25 text-neon-amber',
    texto: 'text-neon-amber',
  },
  disponible: {
    label: 'DISPONIBLE',
    clase: 'bg-cashflow-emerald/10 border-cashflow-emerald/20 text-cashflow-emerald',
    texto: 'text-cashflow-emerald',
  },
};

export default function ProductList({ productos, loading, onEdit, onDelete }: Props) {
  const [paginaActual, setPaginaActual] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(productos.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const inicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const productosPaginados = productos.slice(inicio, inicio + ITEMS_POR_PAGINA);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-gray animate-pulse">
        <PackageOpen size={48} className="mb-4 opacity-50" />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-gray mb-4">
          <PackageOpen size={32} />
        </div>
        <h3 className="text-xl font-bold text-polar-white">Inventario Vacío</h3>
        <p className="text-muted-gray mt-2 max-w-sm">No hay productos que coincidan con tu búsqueda o el inventario está completamente vacío.</p>
      </div>
    );
  }

  const getIcon = (categoria: string) => {
    switch(categoria) {
      case 'Teléfonos': return <Smartphone size={18} />;
      case 'Cargadores': return <Zap size={18} />;
      case 'Protectores': return <Shield size={18} />;
      case 'Auriculares': return <Headphones size={18} />;
      default: return <PackageOpen size={18} />;
    }
  };

  return (
    <>
      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="flex flex-col gap-3 md:hidden">
        {productosPaginados.map(p => (
          <div key={p.id} className="glass-panel p-3.5 sm:p-4 rounded-xl flex flex-col gap-2.5 sm:gap-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-electric-cyan shrink-0">
                  {getIcon(p.categoria)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-polar-white leading-tight text-sm sm:text-base truncate">{p.nombre}</h4>
                  <p className="text-[11px] sm:text-xs text-muted-gray mt-0.5 truncate">
                    {p.marca} • SKU: {p.sku}
                    {p.categoria === 'Teléfonos' && (p.ram || p.almacenamiento) ? ` • ${[p.ram, p.almacenamiento].filter(Boolean).join(' / ')}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 sm:gap-2 shrink-0">
                <button onClick={() => onEdit(p)} className="p-2 bg-white/5 hover:bg-electric-cyan/20 rounded-lg text-electric-cyan transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => onDelete(p)}
                  className="p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center bg-white/5 text-alert-coral hover:bg-alert-coral/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-cosmic-midnight/50 p-2.5 rounded-lg border border-white/5">
                <p className="text-[10px] text-muted-gray uppercase tracking-wider mb-0.5">Precio Venta</p>
                <p className="font-space-grotesk font-bold text-cashflow-emerald">${p.precioVenta.toFixed(2)}</p>
              </div>
              <div className={`p-2.5 rounded-lg border ${getEstadoStock(p) === 'disponible' ? 'bg-cosmic-midnight/50 border-white/5' : BADGES_ESTADO[getEstadoStock(p)].clase}`}>
                <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${getEstadoStock(p) === 'disponible' ? 'text-muted-gray' : BADGES_ESTADO[getEstadoStock(p)].texto}`}>
                  Stock Actual
                </p>
                <div className="flex items-center justify-between gap-1">
                  <p className={`font-space-grotesk font-bold ${getEstadoStock(p) === 'disponible' ? 'text-polar-white' : BADGES_ESTADO[getEstadoStock(p)].texto}`}>
                    {p.stockActual} und.
                  </p>
                  {getEstadoStock(p) !== 'disponible' && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${BADGES_ESTADO[getEstadoStock(p)].clase}`}>
                      {BADGES_ESTADO[getEstadoStock(p)].label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VISTA ESCRITORIO (Tabla) */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-medium text-sm text-muted-gray">SKU</th>
                <th className="p-4 font-medium text-sm text-muted-gray">Nombre</th>
                <th className="p-4 font-medium text-sm text-muted-gray">Marca</th>
                <th className="p-4 font-medium text-sm text-muted-gray">Categoría</th>
                <th className="p-4 font-medium text-sm text-muted-gray">Costo Compra</th>
                <th className="p-4 font-medium text-sm text-muted-gray">Precio Venta</th>
                <th className="p-4 font-medium text-sm text-muted-gray">Stock</th>
                <th className="p-4 font-medium text-sm text-muted-gray text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {productosPaginados.map(p => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className="font-space-grotesk text-xs text-muted-gray bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                      {p.sku}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-polar-white">{p.nombre}</p>
                    {p.categoria === 'Teléfonos' && (p.ram || p.almacenamiento) && (
                      <p className="text-xs text-muted-gray">
                        {[p.ram, p.almacenamiento].filter(Boolean).join(' / ')}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-gray">{p.marca}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs text-polar-white border border-white/10">
                      {getIcon(p.categoria)} {p.categoria}
                    </span>
                  </td>
                  <td className="p-4 font-space-grotesk text-muted-gray">
                    ${p.costoCompra.toFixed(2)}
                  </td>
                  <td className="p-4 font-space-grotesk font-bold text-cashflow-emerald">
                    ${p.precioVenta.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-space-grotesk font-bold px-3 py-1 rounded-lg border ${BADGES_ESTADO[getEstadoStock(p)].clase}`}>
                        {p.stockActual}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${BADGES_ESTADO[getEstadoStock(p)].texto}`}>
                        {BADGES_ESTADO[getEstadoStock(p)].label}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onEdit(p)}
                        className="p-2 inline-flex items-center justify-center rounded-lg text-muted-gray hover:text-electric-cyan hover:bg-electric-cyan/10 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(p)}
                        className="p-2 inline-flex items-center justify-center rounded-lg transition-colors text-muted-gray hover:text-alert-coral hover:bg-alert-coral/10"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
          <p className="text-xs text-muted-gray order-2 sm:order-1">
            Mostrando <span className="font-bold text-polar-white">{inicio + 1}</span>–<span className="font-bold text-polar-white">{Math.min(inicio + ITEMS_POR_PAGINA, productos.length)}</span> de <span className="font-bold text-polar-white">{productos.length}</span> productos
          </p>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              onClick={() => setPaginaActual(paginaSegura - 1)}
              disabled={paginaSegura <= 1}
              aria-label="Página anterior"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-polar-white hover:bg-electric-cyan/20 hover:text-electric-cyan disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-polar-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => setPaginaActual(num)}
                aria-label={`Página ${num}`}
                aria-current={num === paginaSegura ? 'page' : undefined}
                className={`min-w-[38px] h-[38px] px-2 rounded-lg text-sm font-bold transition-all ${
                  num === paginaSegura
                    ? 'bg-electric-cyan text-white shadow-md shadow-electric-cyan/20'
                    : 'bg-white/5 border border-white/10 text-muted-gray hover:text-polar-white hover:bg-white/10'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPaginaActual(paginaSegura + 1)}
              disabled={paginaSegura >= totalPaginas}
              aria-label="Página siguiente"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-polar-white hover:bg-electric-cyan/20 hover:text-electric-cyan disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-polar-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
