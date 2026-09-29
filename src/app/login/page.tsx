'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Sparkles, UserCheck, Shield, Clapperboard, CheckCircle, HelpCircle, Phone, X, CheckCircle2, MessageSquare } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
    whatsappUrl?: string;
    adminPhone?: string;
  } | null>(null);

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotResult(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotResult({
          success: true,
          message: data.message,
          whatsappUrl: data.whatsappUrl,
          adminPhone: data.adminPhone,
        });
      } else {
        setForgotResult({
          error: data.error || 'No se pudo procesar la solicitud',
        });
      }
    } catch {
      setForgotResult({ error: 'Error de conexión con el servidor.' });
    } finally {
      setForgotLoading(false);
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotResult(null);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
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

      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    ¿Olvidaste tu Contraseña?
                  </h3>
                  <p className="text-[11px] text-slate-500">Recuperación asistida con el Administrador</p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ingresa el correo electrónico con el que te registraste. Notificaremos al Administrador para que pueda recordarte tu contraseña actual o enviártela por WhatsApp.
            </p>

            {forgotResult?.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                {forgotResult.error}
              </div>
            )}

            {forgotResult?.success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ¡Notificación enviada al Administrador!
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  El Administrador tiene tu solicitud en su panel. También puedes abrir WhatsApp ahora mismo con un mensaje preparado para que te envíe tu clave de inmediato:
                </p>

                {forgotResult.whatsappUrl && (
                  <a
                    href={forgotResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Enviar WhatsApp al Administrador ({forgotResult.adminPhone})
                  </a>
                )}
              </div>
            )}

            {!forgotResult?.success && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu Correo Registrado:
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ejemplo@comercial.tv"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {forgotLoading ? 'Consultando...' : 'Pedir Contraseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
