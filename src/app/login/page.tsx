'use client';

import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/services/firebase';
import { Lock, Mail, Key, Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Círculos luminosos ambientales para profundidad SaaS */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-electric-cyan/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-blue-600/10 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="glass-panel w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <img
            src="https://ik.imagekit.io/h5w0cdkit/plugzone/icono_con_fondo_Mjd1-WmZc.jpeg"
            alt="PlugZone Logo"
            className="w-auto h-24 sm:h-28 mb-4 sm:mb-5 object-contain"
          />
          <h1 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white tracking-tight">PlugZone Admin</h1>
          <p className="text-sm text-muted-gray mt-2 font-medium">Ingresa tus credenciales de propietario</p>
        </div>

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
                <Mail size={18} />
              </div>
              <input 
                required type="email" 
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-11 pr-4 py-3.5 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all font-medium" 
                placeholder="propietario@plugzone.com" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-gray uppercase tracking-wider">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-gray group-focus-within:text-electric-cyan transition-colors">
                <Key size={18} />
              </div>
              <input 
                required 
                type={mostrarContrasena ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className={`w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-11 pr-12 py-3.5 text-polar-white placeholder-muted-gray/50 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all font-medium ${mostrarContrasena ? 'tracking-normal' : 'tracking-widest'}`} 
                placeholder="••••••••" 
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-8 rounded-xl bg-electric-cyan text-white font-bold flex items-center justify-center gap-2 active:scale-95 hover:-translate-y-1 hover:shadow-lg hover:shadow-electric-cyan/30 hover:box-glow-cyan transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Lock size={18} className="text-white relative z-10" />
            <span className="relative z-10 tracking-wide">{loading ? 'Verificando Identidad...' : 'Acceder al Sistema'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
