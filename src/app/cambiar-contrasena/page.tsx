'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTienda } from '@/context/TiendaContext';
import { Lock, Key, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function CambiarContrasenaPage() {
  const { user, cambiarContrasena } = useTienda();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!user) {
      setError('Sesión expirada. Vuelve a iniciar sesión.');
      return;
    }

    setLoading(true);
    const { error } = await cambiarContrasena(user.uid, password);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-electric-cyan/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-neon-amber/10 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none" />

      <div className="glass-panel w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-neon-amber to-electric-cyan flex items-center justify-center box-glow-cyan mb-4 sm:mb-5 shadow-lg shadow-electric-cyan/20">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white tracking-tight">
            Primer Inicio de Sesión
          </h1>
          <p className="text-sm text-muted-gray mt-2 font-medium max-w-xs">
            Por seguridad, debes establecer tu contraseña privada antes de acceder al sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-alert-coral/10 border border-alert-coral/20 text-alert-coral text-sm text-center font-medium shadow-sm flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-coral animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Nueva Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray group-focus-within:text-electric-cyan transition-colors">
                <Key size={18} />
              </div>
              <input
                required
                type={mostrarContrasena ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className={`w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-11 pr-12 py-3.5 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all font-medium ${mostrarContrasena ? 'tracking-normal' : 'tracking-widest'}`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-gray hover:text-electric-cyan transition-colors duration-200"
                aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Confirmar Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray group-focus-within:text-electric-cyan transition-colors">
                <Key size={18} />
              </div>
              <input
                required
                type={mostrarContrasena ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                minLength={6}
                className={`w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-11 pr-4 py-3.5 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all font-medium ${mostrarContrasena ? 'tracking-normal' : 'tracking-widest'}`}
                placeholder="Repite tu contraseña"
              />
            </div>
          </div>

          {/* Indicador de fortaleza */}
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full transition-all ${password.length >= 8 ? 'bg-cashflow-emerald' : password.length >= 6 ? 'bg-neon-amber' : 'bg-alert-coral'}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-cashflow-emerald' : 'bg-white/10'}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all ${/\d/.test(password) ? 'bg-cashflow-emerald' : 'bg-white/10'}`} />
              <span className="text-[10px] text-muted-gray ml-1">
                {password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)
                  ? 'Fuerte'
                  : password.length >= 6
                    ? 'Aceptable'
                    : ''}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-8 rounded-xl bg-electric-cyan text-white font-bold flex items-center justify-center gap-2 active:scale-95 hover:-translate-y-1 hover:shadow-lg hover:shadow-electric-cyan/30 hover:box-glow-cyan transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin relative z-10" />
                <span className="relative z-10 tracking-wide">Guardando contraseña...</span>
              </>
            ) : (
              <>
                <ArrowRight size={18} className="text-white relative z-10" />
                <span className="relative z-10 tracking-wide">Establecer Contraseña</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
