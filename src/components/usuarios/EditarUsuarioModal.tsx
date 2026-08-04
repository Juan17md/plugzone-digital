'use client';

import { useState } from 'react';
import { X, Mail, Key, Save, Loader2 } from 'lucide-react';
import { useTienda } from '@/context/TiendaContext';
import { RolUsuario, Usuario } from '@/types';

interface Props {
  usuario: Usuario;
  abierto: boolean;
  onCerrar: () => void;
  onExito: (msg: string) => void;
  onError: (msg: string) => void;
}

export function EditarUsuarioModal({ usuario, abierto, onCerrar, onExito, onError }: Props) {
  const { editarUsuario } = useTienda();
  const [email, setEmail] = useState(usuario.email);
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>(usuario.rol);
  const [loading, setLoading] = useState(false);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const datos: { email?: string; password?: string; rol?: RolUsuario } = {};

    if (email !== usuario.email) datos.email = email;
    if (password) {
      if (password.length < 6) {
        onError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      datos.password = password;
    }
    if (rol !== usuario.rol) datos.rol = rol;

    if (Object.keys(datos).length === 0) {
      onCerrar();
      return;
    }

    setLoading(true);
    const { error } = await editarUsuario(usuario.uid, datos);
    setLoading(false);

    if (error) {
      onError(error);
    } else {
      onExito('Usuario actualizado exitosamente');
      setPassword('');
      onCerrar();
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Editar usuario" className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-titanium-slate w-full max-w-lg rounded-t-3xl md:rounded-3xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="p-5 md:p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div className="flex items-center gap-3 text-neon-amber">
            <Save size={24} />
            <div>
              <h2 className="font-plus-jakarta text-xl font-bold text-polar-white">Editar Usuario</h2>
              <p className="text-xs text-muted-gray">{usuario.email}</p>
            </div>
          </div>
          <button onClick={onCerrar} disabled={loading} aria-label="Cerrar modal de editar usuario" className="p-2 rounded-full hover:bg-white/10 text-muted-gray transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-6">
          <form id="editarUsuarioForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-gray">
                  <Mail size={16} />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-cosmic-midnight border border-white/10 rounded-xl pl-10 pr-4 py-3 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan transition-all text-sm"
                />
              </div>
            </div>

            {/* Nueva Contraseña (opcional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">
                Nueva Contraseña <span className="text-muted-gray/50 font-normal">(dejar vacío para mantener)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-gray">
                  <Key size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full bg-cosmic-midnight border border-white/10 rounded-xl pl-10 pr-4 py-3 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan transition-all text-sm"
                  placeholder="Sin cambios"
                />
              </div>
            </div>

            {/* Rol */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-gray">Rol</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRol('admin')}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all active:scale-95 ${
                    rol === 'admin'
                      ? 'bg-neon-amber/10 border-neon-amber/30 text-neon-amber'
                      : 'border-[var(--glass-border)] text-muted-gray hover:text-polar-white hover:bg-white/5'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRol('operador')}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all active:scale-95 ${
                    rol === 'operador'
                      ? 'bg-electric-cyan/10 border-electric-cyan/30 text-electric-cyan'
                      : 'border-[var(--glass-border)] text-muted-gray hover:text-polar-white hover:bg-white/5'
                  }`}
                >
                  Operador
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5">
          <button type="button" onClick={onCerrar} disabled={loading} className="flex-1 px-6 py-3 rounded-xl font-medium text-polar-white bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] transition-colors">
            Cancelar
          </button>
          <button type="submit" form="editarUsuarioForm" disabled={loading} className="flex-[2] px-8 py-3 rounded-xl font-bold bg-electric-cyan text-white shadow-lg shadow-electric-cyan/20 hover:-translate-y-0.5 hover:shadow-electric-cyan/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={20} />
            {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>
        </div>

      </div>
    </div>
  );
}
