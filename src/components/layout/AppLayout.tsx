'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Layers, 
  Inbox, 
  CheckSquare, 
  Users, 
  Printer, 
  Sparkles,
  Clapperboard,
  Clock,
  Radio
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Cargando Producción Comercial CRM...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    {
      name: 'Dashboard General',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SOLICITANTE', 'COORDINADOR', 'POST_PRODUCTOR', 'ADMIN'],
    },
    {
      name: 'Nueva Solicitud (SP)',
      href: '/orders/new',
      icon: FilePlus2,
      roles: ['SOLICITANTE', 'COORDINADOR', 'ADMIN'],
      highlight: true,
    },
    {
      name: 'Todas las Órdenes',
      href: '/orders',
      icon: Layers,
      roles: ['SOLICITANTE', 'COORDINADOR', 'POST_PRODUCTOR', 'ADMIN'],
    },
    {
      name: 'Bandeja Coordinación',
      href: '/orders?status=NUEVA',
      icon: Inbox,
      roles: ['COORDINADOR', 'ADMIN'],
    },
    {
      name: 'Mis Asignaciones',
      href: '/orders?scope=assigned_to_me',
      icon: Clapperboard,
      roles: ['POST_PRODUCTOR', 'COORDINADOR', 'ADMIN'],
    },
    {
      name: 'Equipo y Roles',
      href: '/users',
      icon: Users,
      roles: ['COORDINADOR', 'ADMIN'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 no-print">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 sticky top-20">
              {/* User Profile Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500 font-black text-white flex items-center justify-center text-sm shadow-inner">
                    {user.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight">{user.name}</h3>
                    <span className="text-[11px] text-cyan-300 font-medium">
                      {user.role === 'SOLICITANTE' && '👩‍💼 Ejecutiva de Ventas'}
                      {user.role === 'COORDINADOR' && '📋 Coordinadora de Producción'}
                      {user.role === 'POST_PRODUCTOR' && '🎬 Post-Productor'}
                      {user.role === 'ADMIN' && '⚡ Administrador General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        item.highlight
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md hover:opacity-95'
                          : isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.highlight ? 'text-white' : isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Info Box */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/70 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                  <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Nomenclatura SP
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Las órdenes se generan con el formato <span className="font-mono font-bold text-amber-900">SP-{user.initials}-XXXX</span> vinculando automáticamente a la ejecutiva responsable.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}
