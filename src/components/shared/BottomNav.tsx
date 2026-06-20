'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackageSearch, CircleDollarSign, History, Users } from 'lucide-react';
import { useTienda } from '@/context/TiendaContext';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/inventario', label: 'Stock', icon: PackageSearch },
  { href: '/finanzas', label: 'Finanzas', icon: CircleDollarSign },
  { href: '/historial', label: 'Historial', icon: History },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { rol } = useTienda();

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-[var(--glass-border)] border-x-0 border-b-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
      <div className="flex w-full items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative ${
                isActive 
                  ? 'text-electric-cyan' 
                  : 'text-muted-gray active:text-polar-white'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-electric-cyan" />
              )}
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}

        {rol === 'admin' && (
          <Link 
            href="/usuarios"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative ${
              pathname.startsWith('/usuarios')
                ? 'text-electric-cyan' 
                : 'text-muted-gray active:text-polar-white'
            }`}
          >
            {pathname.startsWith('/usuarios') && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-electric-cyan" />
            )}
            <Users size={20} strokeWidth={pathname.startsWith('/usuarios') ? 2.5 : 2} />
            <span className={`text-[10px] leading-none ${pathname.startsWith('/usuarios') ? 'font-bold' : 'font-medium'}`}>Usuarios</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
