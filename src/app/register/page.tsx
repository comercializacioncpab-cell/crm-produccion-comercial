'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Shield, UserCheck, Phone, Mail, Lock, CheckCircle2, Clock } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SOLICITANTE',
    initials: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccessPending, setIsSuccessPending] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !prev.initials) {
        const parts = value.trim().split(' ').filter(Boolean);
        if (parts.length >= 2) {
          updated.initials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1) {
          updated.initials = parts[0].substring(0, 2).toUpperCase();
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccessPending(true);
      } else {
        setError(data.error || 'Error al registrar el usuario.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccessPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">¡Registro Enviado con Éxito!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tu cuenta para <strong className="text-slate-800">{formData.name}</strong> ha sido creada con el rol solicitado de <strong className="text-purple-700">{formData.role}</strong>.
          </p>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs text-left">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              ⏳ Aprobación del Administrador Requerida
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              El Administrador ha recibido la notificación. Una vez que apruebe tu solicitud, podrás iniciar sesión con tu correo y contraseña.
            </p>
          </div>
          <Link
            href="/login"
            className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all"
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-2xl px-4 py-2 rounded-2xl shadow-lg mb-2">
            EV
          </div>
          <h1 className="text-xl font-black text-white">Registro de Usuario</h1>
          <p className="text-xs text-cyan-300">Producción Comercial CRM</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Adriana Rojas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  name="initials"
                  value={formData.initials}
                  onChange={handleChange}
                  placeholder="AR"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold uppercase text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rol Solicitado en Producción Comercial *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="SOLICITANTE">👩‍💼 Ejecutiva de Ventas (Crea SPs y aprueba)</option>
                <option value="COORDINADOR">📋 Coordinadora de Producción (Asigna y supervisa)</option>
                <option value="POST_PRODUCTOR">🎬 Post-Productor (Edita y sube entregables)</option>
                <option value="ADMIN">⚡ Administrador General</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejecutiva@comercial.tv"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp (Notificaciones)
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+593 99 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 4 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Enviando solicitud...' : 'Enviar Solicitud de Registro'}
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              ¿Ya tienes cuenta aprobada?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
