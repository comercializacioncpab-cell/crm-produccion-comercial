'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Sparkles, UserCheck, Shield, Clapperboard, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('123456');
    setLoading(true);
    setError('');
    const success = await login(userEmail, '123456');
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Error al iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-2xl px-4 py-2 rounded-2xl shadow-lg mb-3">
            EV
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Producción Comercial
          </h1>
          <p className="text-xs text-cyan-300 font-medium mt-1">
            CRM para Solicitudes de Producción Publicitaria y Televisiva
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Iniciar Sesión</h2>
          <p className="text-xs text-slate-500 mb-6">
            Ingresa tus credenciales para acceder a tus órdenes de trabajo.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejecutiva@comercial.tv"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Iniciando...' : 'Entrar al CRM'}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Acceso Rápido por Rol (Demostración)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('adriana.rojas@comercial.tv')}
                className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-bold text-pink-900 flex items-center gap-1">
                  👩‍💼 Adriana Rojas
                </p>
                <p className="text-[10px] text-pink-700">Ejecutiva (Solicitante)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('coordinacion@produccion.tv')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-bold text-purple-900 flex items-center gap-1">
                  📋 Mariana Gómez
                </p>
                <p className="text-[10px] text-purple-700">Coordinadora</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('javier.post@produccion.tv')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                  🎬 Javier Post
                </p>
                <p className="text-[10px] text-blue-700">Post-Productor</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@produccion.tv')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  ⚡ Administrador
                </p>
                <p className="text-[10px] text-slate-700">Admin General</p>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              ¿No tienes cuenta aún?{' '}
              <Link href="/register" className="font-bold text-blue-600 hover:underline">
                Crear nuevo usuario
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
