'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackageSearch, CircleDollarSign, History, LogOut, Sun, Moon } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/services/firebase';
import { useTheme } from '@/components/providers/ThemeProvider';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', icon: PackageSearch },
  { href: '/finanzas', label: 'Finanzas', icon: CircleDollarSign },
  { href: '/historial', label: 'Historial', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[var(--glass-bg)] border-r border-[var(--glass-border)] backdrop-blur-2xl shadow-2xl z-50">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-cyan to-blue-600 flex items-center justify-center box-glow-cyan">
          <span className="font-space-grotesk font-bold text-cosmic-midnight">PZ</span>
        </div>
        <div>
          <h1 className="font-plus-jakarta font-bold text-lg text-polar-white tracking-tight leading-none">PlugZone</h1>
          <p className="text-xs text-electric-cyan font-medium">Digital Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive 
                  ? 'bg-electric-cyan/10 text-electric-cyan' 
                  : 'text-muted-gray hover:text-polar-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-2">
        <button 
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-4 py-3 rounded-xl text-muted-gray hover:text-polar-white hover:bg-white/5 font-medium transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>Tema {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </div>
        </button>

        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-muted-gray hover:text-alert-coral hover:bg-alert-coral/10 font-medium transition-colors"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
