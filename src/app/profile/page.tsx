'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, Mail, Lock, Save, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initials, setInitials] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setInitials(user.initials || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          initials,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Tus datos de perfil han sido actualizados exitosamente!' });
        setNewPassword('');
        await refreshUser();
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al guardar los cambios' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-600" /> Mi Perfil y Datos Personales
          </h1>
          <p className="text-xs text-slate-500">
            Actualiza tu número de celular para notificaciones por WhatsApp, tu nombre y tu contraseña de acceso.
          </p>
        </div>

        {msg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {/* Header Profile Badge */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-black text-lg flex items-center justify-center shadow-md">
              {user?.initials || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{user?.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
              <span className="inline-block mt-1 bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Rol: {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Iniciales (SP-**) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  placeholder="AR"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1">
                📱 Número de Teléfono / WhatsApp (Para Notificaciones)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+593 99 123 4567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/20 text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Aquí recibirás los enlaces directos y avisos de nuevas órdenes de trabajo o asignaciones.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cambiar Contraseña (Opcional)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Dejar en blanco si deseas mantener la actual"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar Mis Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
