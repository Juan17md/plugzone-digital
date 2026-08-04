'use client';

import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/services/firebase';
import { Lock, Mail, Key, Eye, EyeOff, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { theme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);

      const ref = doc(db, 'config', 'suscripcion');
      const snap = await getDoc(ref);
      const activa = snap.exists() ? snap.data().activa !== false : true;

      router.push(activa ? '/dashboard' : '/bloqueado');
    } catch (err: any) {
      console.error(err);
      setError('Credenciales inválidas. Solo el propietario tiene acceso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2 relative overflow-hidden">

      {/* Círculos luminosos ambientales para profundidad SaaS */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-electric-cyan/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-blue-600/10 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none"></div>

      {/* Columna izquierda: marca (pantalla completa) */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-6 p-10 relative bg-gradient-to-br from-electric-cyan/10 via-transparent to-blue-600/10 border-r border-[var(--glass-border)]">
        <img
          src="https://ik.imagekit.io/h5w0cdkit/plugzone/icono_sin_fondo_e9DNtxsHd.PNG"
          alt="PlugZone Logo"
          className="w-auto h-44 object-contain drop-shadow-[0_0_30px_rgba(0,242,254,0.25)]"
        />
        <h1 className="font-plus-jakarta font-bold text-5xl text-polar-white tracking-tight text-center">PlugZone</h1>
        <p className="text-muted-gray font-medium text-center max-w-sm leading-relaxed">
          Plataforma integral para la gestión de ventas, inventario y finanzas de tu negocio.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-electric-cyan/10 border border-electric-cyan/20 text-electric-cyan text-sm font-bold">
          <Zap size={14} />
          Panel de Administración
        </div>
      </div>

      {/* Columna derecha: formulario (pantalla completa) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center p-6 sm:p-10">
        {/* Versión compacta de la marca en móvil */}
        <div className="flex flex-col items-center text-center mb-10 lg:hidden">
          <img
            src="https://ik.imagekit.io/h5w0cdkit/plugzone/icono_sin_fondo_e9DNtxsHd.PNG"
            alt="PlugZone Logo"
            className="w-auto h-24 sm:h-28 mb-4 object-contain"
          />
          <h1 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white tracking-tight">PlugZone Admin</h1>
          <p className="text-sm text-muted-gray mt-2 font-medium">Ingresa tus credenciales de propietario</p>
        </div>

        <div className="w-full max-w-lg mx-auto">
          <h2 className="hidden lg:block font-plus-jakarta font-bold text-4xl text-polar-white tracking-tight mb-2">Bienvenido de nuevo</h2>
          <p className="hidden lg:block text-sm text-muted-gray mb-10 font-medium">Ingresa tus credenciales de propietario</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-alert-coral/10 border border-alert-coral/20 text-alert-coral text-sm text-center font-medium shadow-sm flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-alert-coral animate-pulse"></span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray group-focus-within:text-electric-cyan transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  required type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-12 pr-4 py-4 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all font-medium"
                  placeholder="propietario@plugzone.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray group-focus-within:text-electric-cyan transition-colors">
                  <Key size={20} />
                </div>
                <input
                  required
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-12 pr-12 py-4 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all font-medium ${mostrarContrasena ? 'tracking-normal' : 'tracking-widest'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-gray hover:text-electric-cyan transition-colors duration-200"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-8 rounded-xl bg-electric-cyan text-white font-bold flex items-center justify-center gap-2 active:scale-95 hover:-translate-y-1 hover:shadow-lg hover:shadow-electric-cyan/30 hover:box-glow-cyan transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Lock size={20} className="text-white relative z-10" />
              <span className="relative z-10 tracking-wide">{loading ? 'Verificando Identidad...' : 'Acceder al Sistema'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
