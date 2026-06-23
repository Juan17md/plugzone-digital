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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 space-y-5 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-amber/10 flex items-center justify-center">
              <Save size={20} className="text-neon-amber" />
            </div>
            <div>
              <h2 className="text-lg font-plus-jakarta font-bold text-polar-white">Editar Usuario</h2>
              <p className="text-xs text-muted-gray">{usuario.email}</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={loading}
            className="p-2 rounded-lg text-muted-gray hover:text-polar-white hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-gray">
                <Mail size={16} />
              </div>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-10 pr-4 py-3 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all text-sm"
              />
            </div>
          </div>

          {/* Nueva Contraseña (opcional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">
              Nueva Contraseña <span className="text-muted-gray/50 font-normal normal-case">(dejar vacío para mantener)</span>
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
                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-10 pr-4 py-3 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all text-sm"
                placeholder="Sin cambios"
              />
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Rol</label>
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

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-electric-cyan text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 hover:shadow-lg hover:shadow-electric-cyan/30 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando cambios...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar Cambios
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
