'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Layers, 
  CheckCircle2, 
  MessageSquare, 
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Settings
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, switchUserDemo } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter((n: any) => !n.read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SOLICITANTE':
        return { text: 'Ejecutiva / Solicitante', bg: 'bg-pink-100 text-pink-700 border-pink-200' };
      case 'COORDINADOR':
        return { text: 'Coordinadora de Producción', bg: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'POST_PRODUCTOR':
        return { text: 'Post-Productor', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'PRODUCTOR_SENIOR':
        return { text: '👑 Productor Senior', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' };
      case 'ADMIN':
        return { text: 'Administrador', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { text: role, bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const roleInfo = user ? getRoleBadge(user.role) : null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-tr from-cyan-600 to-blue-700 text-white font-black text-xl px-2.5 py-1 rounded-lg shadow-sm group-hover:opacity-95 transition-all">
                EV
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-lg tracking-tight flex items-center gap-1.5">
                  Producción Comercial
                  <span className="text-xs bg-cyan-100 text-cyan-800 font-semibold px-2 py-0.5 rounded-full border border-cyan-200">
                    CRM
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 font-medium leading-none">
                  Gestión de Solicitudes de Producción (SP)
                </p>
              </div>
            </Link>
          </div>

          {/* Right Area: Notifications & User */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No tienes notificaciones pendientes.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition-colors ${
                            !n.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            {n.orderId && (
                              <Link
                                href={`/orders/${n.orderId}`}
                                onClick={() => setShowNotifications(false)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                              >
                                Ver Orden <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                            {n.whatsappUrl && (
                              <a
                                href={n.whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-md font-medium flex items-center gap-1 transition-colors"
                              >
                                <MessageSquare className="w-3 h-3" /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {user.initials || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                    {roleInfo && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium inline-block mt-0.5 ${roleInfo.bg}`}>
                        {roleInfo.text}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.phone && <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">📱 {user.phone}</p>}
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" /> Mi Perfil / Mi Celular
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Layers className="w-4 h-4 text-slate-400" /> Mis Órdenes
                    </Link>

                    {(user.role === 'ADMIN' || user.role === 'PRODUCTOR_SENIOR' || user.role === 'COORDINADOR') && (
                      <Link
                        href="/users"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" /> Control de Usuarios
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
