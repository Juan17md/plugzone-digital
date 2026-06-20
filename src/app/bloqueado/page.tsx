'use client';

import { AlertTriangle, Phone, Mail, MessageSquare } from 'lucide-react';

export default function BloqueadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-alert-coral/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-neon-amber/10 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel w-full max-w-lg rounded-2xl sm:rounded-3xl p-6 sm:p-10 relative z-10 shadow-2xl text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-alert-coral/10 flex items-center justify-center mx-auto mb-5 sm:mb-6">
          <AlertTriangle size={32} className="text-alert-coral" />
        </div>

        <h1 className="font-plus-jakarta font-bold text-2xl sm:text-3xl text-polar-white tracking-tight mb-3">
          Acceso Bloqueado
        </h1>

        <p className="text-muted-gray text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
          Por favor, contacta al proveedor para obtener más información.
        </p>

        <div className="space-y-3 text-left">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-electric-cyan/10 flex items-center justify-center shrink-0">
              <Phone size={18} className="text-electric-cyan" />
            </div>
            <div>
              <p className="text-xs text-muted-gray font-medium uppercase tracking-wider">Teléfono</p>
              <p className="text-sm text-polar-white font-bold">+58 412-1234567</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-electric-cyan/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-electric-cyan" />
            </div>
            <div>
              <p className="text-xs text-muted-gray font-medium uppercase tracking-wider">Correo Electrónico</p>
              <p className="text-sm text-polar-white font-bold">soporte@plugzone.com</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-electric-cyan/10 flex items-center justify-center shrink-0">
              <MessageSquare size={18} className="text-electric-cyan" />
            </div>
            <div>
              <p className="text-xs text-muted-gray font-medium uppercase tracking-wider">WhatsApp</p>
              <p className="text-sm text-polar-white font-bold">+58 412-1234567</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-gray mt-6 sm:mt-8 leading-relaxed">
          Una vez regularizado el acceso será restaurado.
        </p>
      </div>
    </div>
  );
}
