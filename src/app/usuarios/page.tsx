'use client';

import { useState } from 'react';
import { useTienda } from '@/context/TiendaContext';
import { UserPlus, Shield, ShieldOff, Ban, CheckCircle, Trash2, Loader2, Pencil } from 'lucide-react';
import { RolUsuario, Usuario } from '@/types';
import { CrearUsuarioModal } from '@/components/usuarios/CrearUsuarioModal';
import { EditarUsuarioModal } from '@/components/usuarios/EditarUsuarioModal';

export default function UsuariosPage() {
  const { usuarios, loadingUsuarios, alternarBloqueoUsuario, actualizarRolUsuario, eliminarUsuario } = useTienda();
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);

  const mostrarNotif = (msg: string, esError = false) => {
    if (esError) {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } else {
      setExito(msg);
      setTimeout(() => setExito(''), 3000);
    }
  };

  const handleAlternarBloqueo = async (uid: string, bloquear: boolean) => {
    setAccionLoading(uid);
    const { error } = await alternarBloqueoUsuario(uid, bloquear);
    setAccionLoading(null);
    if (error) mostrarNotif(error, true);
    else mostrarNotif(bloquear ? 'Usuario bloqueado' : 'Usuario desbloqueado');
  };

  const handleCambiarRol = async (uid: string, nuevoRol: RolUsuario) => {
    setAccionLoading(uid);
    const { error } = await actualizarRolUsuario(uid, nuevoRol);
    setAccionLoading(null);
    if (error) mostrarNotif(error, true);
    else mostrarNotif(`Rol cambiado a ${nuevoRol}`);
  };

  const handleEliminar = async (uid: string) => {
    setAccionLoading(uid);
    const { error } = await eliminarUsuario(uid);
    setAccionLoading(null);
    setConfirmarEliminar(null);
    if (error) mostrarNotif(error, true);
    else mostrarNotif('Usuario eliminado');
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-plus-jakarta font-bold text-polar-white">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-gray mt-1">Administra los accesos al sistema</p>
        </div>
        <button
          onClick={() => setMostrarCrear(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-electric-cyan text-white font-bold text-sm active:scale-95 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-electric-cyan/30 transition-all duration-300"
        >
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Notificaciones */}
      {error && (
        <div className="p-4 rounded-xl bg-alert-coral/10 border border-alert-coral/20 text-alert-coral text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-alert-coral animate-pulse" />
          {error}
        </div>
      )}
      {exito && (
        <div className="p-4 rounded-xl bg-cashflow-emerald/10 border border-cashflow-emerald/20 text-cashflow-emerald text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {exito}
        </div>
      )}

      {/* Tabla */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-muted-gray text-xs uppercase tracking-wider">
                <th className="text-left py-4 px-5 font-bold">Usuario</th>
                <th className="text-left py-4 px-5 font-bold hidden sm:table-cell">Rol</th>
                <th className="text-left py-4 px-5 font-bold hidden sm:table-cell">Estado</th>
                <th className="text-left py-4 px-5 font-bold hidden md:table-cell">Creado</th>
                <th className="text-right py-4 px-5 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsuarios ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 px-5"><div className="h-4 w-40 bg-white/5 rounded animate-pulse" /></td>
                    <td className="py-4 px-5 hidden sm:table-cell"><div className="h-4 w-16 bg-white/5 rounded animate-pulse" /></td>
                    <td className="py-4 px-5 hidden sm:table-cell"><div className="h-4 w-20 bg-white/5 rounded animate-pulse" /></td>
                    <td className="py-4 px-5 hidden md:table-cell"><div className="h-4 w-24 bg-white/5 rounded animate-pulse" /></td>
                    <td className="py-4 px-5"><div className="h-4 w-24 bg-white/5 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-gray">
                    <p className="text-lg font-medium">No hay usuarios registrados</p>
                    <p className="text-sm mt-1">Crea el primer usuario usando el botón &quot;Nuevo Usuario&quot;</p>
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.uid} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-electric-cyan/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-electric-cyan">
                            {u.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-polar-white font-medium text-sm">{u.email}</p>
                          <div className="flex sm:hidden items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              u.rol === 'admin' 
                                ? 'bg-neon-amber/10 text-neon-amber' 
                                : 'bg-electric-cyan/10 text-electric-cyan'
                            }`}>
                              {u.rol}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              u.bloqueado
                                ? 'bg-alert-coral/10 text-alert-coral'
                                : 'bg-cashflow-emerald/10 text-cashflow-emerald'
                            }`}>
                              {u.bloqueado ? 'Bloqueado' : 'Activo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-lg font-bold uppercase ${
                        u.rol === 'admin' 
                          ? 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20' 
                          : 'bg-electric-cyan/10 text-electric-cyan border border-electric-cyan/20'
                      }`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="py-4 px-5 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-lg font-bold ${
                        u.bloqueado
                          ? 'bg-alert-coral/10 text-alert-coral border border-alert-coral/20'
                          : 'bg-cashflow-emerald/10 text-cashflow-emerald border border-cashflow-emerald/20'
                      }`}>
                        {u.bloqueado ? 'Bloqueado' : 'Activo'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-muted-gray text-xs hidden md:table-cell">
                      {new Date(u.creadoEn).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        {accionLoading === u.uid ? (
                          <Loader2 size={20} className="animate-spin text-electric-cyan" />
                        ) : (
                          <>
                            {/* Editar */}
                            <button
                              onClick={() => setEditandoUsuario(u)}
                              title="Editar usuario"
                              className="p-2 rounded-lg text-muted-gray hover:text-polar-white hover:bg-white/5 transition-colors"
                            >
                              <Pencil size={18} />
                            </button>

                            {/* Alternar bloqueo */}
                            <button
                              onClick={() => handleAlternarBloqueo(u.uid, !u.bloqueado)}
                              title={u.bloqueado ? 'Desbloquear' : 'Bloquear'}
                              className={`p-2 rounded-lg transition-colors ${
                                u.bloqueado
                                  ? 'text-cashflow-emerald hover:bg-cashflow-emerald/10'
                                  : 'text-neon-amber hover:bg-neon-amber/10'
                              }`}
                            >
                              {u.bloqueado ? <CheckCircle size={18} /> : <Ban size={18} />}
                            </button>

                            {/* Cambiar rol */}
                            <button
                              onClick={() => handleCambiarRol(u.uid, u.rol === 'admin' ? 'operador' : 'admin')}
                              title={u.rol === 'admin' ? 'Degradar a operador' : 'Ascender a admin'}
                              className={`p-2 rounded-lg transition-colors ${
                                u.rol === 'admin'
                                  ? 'text-muted-gray hover:text-electric-cyan hover:bg-electric-cyan/10'
                                  : 'text-muted-gray hover:text-neon-amber hover:bg-neon-amber/10'
                              }`}
                            >
                              {u.rol === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => setConfirmarEliminar(u.uid)}
                              title="Eliminar usuario"
                              className="p-2 rounded-lg text-muted-gray hover:text-alert-coral hover:bg-alert-coral/10 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contador */}
      {!loadingUsuarios && usuarios.length > 0 && (
        <p className="text-xs text-muted-gray text-center">
          {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modal crear usuario */}
      <CrearUsuarioModal
        abierto={mostrarCrear}
        onCerrar={() => setMostrarCrear(false)}
        onExito={(msg) => mostrarNotif(msg)}
        onError={(msg) => mostrarNotif(msg, true)}
      />

      {/* Modal editar usuario */}
      {editandoUsuario && (
        <EditarUsuarioModal
          usuario={editandoUsuario}
          abierto
          onCerrar={() => setEditandoUsuario(null)}
          onExito={(msg) => mostrarNotif(msg)}
          onError={(msg) => mostrarNotif(msg, true)}
        />
      )}

      {/* Modal confirmar eliminación */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-alert-coral/10 flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-alert-coral" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-polar-white">¿Eliminar usuario?</h3>
              <p className="text-sm text-muted-gray mt-1">Esta acción no se puede deshacer. El usuario perderá el acceso permanentemente.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-muted-gray hover:text-polar-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(confirmarEliminar)}
                className="flex-1 py-3 rounded-xl bg-alert-coral text-white font-bold active:scale-95 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
