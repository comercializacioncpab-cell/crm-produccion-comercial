'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  KeyRound, 
  CheckCircle2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Clock, 
  Layers, 
  ExternalLink,
  Save,
  Tv,
  Check,
  X,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  MessageCircle
} from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/order-utils';

export default function UserDetailPage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [editingRole, setEditingRole] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUserDetail = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTargetUser(data.user);
        setEditingRole(data.user.role);
        setEditingPhone(data.user.phone || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setMsg({ type: 'error', text: 'La contraseña debe tener mínimo 4 caracteres.' });
      return;
    }

    setSavingPassword(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `¡Contraseña actualizada exitosamente! Nueva contraseña: "${newPassword}"` });
        setNewPassword('');
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al actualizar contraseña' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSavingRole(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editingRole,
          phone: editingPhone,
        }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Perfil y rol actualizados correctamente.' });
        fetchUserDetail();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al actualizar perfil' });
    } finally {
      setSavingRole(false);
    }
  };

  const handleApprove = async () => {
    setSavingRole(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE_USER',
          role: editingRole || targetUser?.requestedRole,
        }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Usuario aprobado exitosamente!' });
        fetchUserDetail();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al aprobar usuario' });
    } finally {
      setSavingRole(false);
    }
  };

  const handleCopyPassword = () => {
    const pwd = targetUser?.plainPassword || '123456';
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const pwd = targetUser?.plainPassword || '123456';
    const phone = (targetUser?.phone || '').replace(/[^0-9]/g, '');
    const msg = `Hola ${targetUser?.name}, tus credenciales de acceso para el CRM de Producción Comercial son:\n\n📧 Correo: ${targetUser?.email}\n🔑 Contraseña: ${pwd}\n\nIngresa aquí: ${window.location.origin}/login`;
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      alert('Mensaje con clave copiado al portapapeles (el usuario no tiene WhatsApp registrado)');
    }
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/users');
      } else {
        const data = await res.json();
        setMsg({ type: 'error', text: data.error || 'Error al eliminar usuario' });
        setShowDeleteModal(false);
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión' });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-xs text-slate-400">Cargando perfil del usuario...</div>
      </AppLayout>
    );
  }

  if (!targetUser) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <p className="text-base font-bold text-slate-800">Usuario no encontrado</p>
          <Link href="/users" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Volver a la lista de usuarios
          </Link>
        </div>
      </AppLayout>
    );
  }

  const allOrders = [
    ...(targetUser.createdOrders || []).map((o: any) => ({ ...o, relationType: 'CREADA' })),
    ...(targetUser.assignedOrders || []).map((o: any) => ({ ...o, relationType: 'ASIGNADA' })),
  ];

  const isSelf = targetUser.id === currentUser?.id;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/users"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {targetUser.name}
                </h1>
                {targetUser.status === 'PENDIENTE' ? (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                    ⏳ Pendiente de Aprobación
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    ✓ Usuario Aprobado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Prefijo SP: SP-{targetUser.initials}-*
              </p>
            </div>
          </div>

          {currentUser?.role === 'ADMIN' && !isSelf && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Eliminar Usuario
            </button>
          )}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Credentials & Admin Actions */}
          <div className="space-y-6">
            {/* User Credentials Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-black text-base flex items-center justify-center shadow-md">
                  {targetUser.initials}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{targetUser.name}</h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {targetUser.email}
                  </span>
                </div>
              </div>

              {/* Status and Requested Role for Pending Users */}
              {targetUser.status === 'PENDIENTE' && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    Rol Solicitado: <span className="underline">{targetUser.requestedRole || targetUser.role}</span>
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Este usuario se registró y está esperando que tú autorices su ingreso y confirmes su rol.
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={savingRole}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Aprobar y Habilitar Acceso
                  </button>
                </div>
              )}

              {/* Edit Role & Phone */}
              {currentUser?.role === 'ADMIN' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rol Asignado:
                    </label>
                    <select
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="SOLICITANTE">👩‍💼 Solicitante (Ejecutiva de Ventas)</option>
                      <option value="COORDINADOR">📋 Coordinadora de Producción</option>
                      <option value="POST_PRODUCTOR">🎬 Post-Productor (Editor/FX)</option>
                      <option value="ADMIN">⚡ Administrador General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Teléfono / WhatsApp (Notificaciones):
                    </label>
                    <input
                      type="text"
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      placeholder="+593 99 123 4567"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    disabled={savingRole}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingRole ? 'Guardando...' : 'Guardar Cambios de Perfil'}
                  </button>
                </div>
              )}
            </div>

              {/* Admin Password View & WhatsApp Widget */}
              {currentUser?.role === 'ADMIN' && (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Contraseña Registrada
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
                      {showPassword ? (targetUser.plainPassword || '123456') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                      title="Copiar contraseña"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Enviar Credenciales por WhatsApp
                  </button>
                </div>
              )}

              {/* Admin Password Reset Widget */}
              {currentUser?.role === 'ADMIN' && (
                <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Reasignar Contraseña</h3>
                      <p className="text-[11px] text-slate-500">Asignar nueva clave si el usuario la olvidó</p>
                    </div>
                  </div>

                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nueva Contraseña para {targetUser.name.split(' ')[0]}:
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Escribe la nueva contraseña..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {savingPassword ? 'Guardando clave...' : 'Asignar y Guardar Contraseña'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Complete SP History Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-600" /> Histórico de Solicitudes (SPs)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Todas las órdenes creadas o asignadas a {targetUser.name} ({allOrders.length} registros).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Código SP</th>
                      <th className="px-4 py-3">Relación</th>
                      <th className="px-4 py-3">Cliente / Producto</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Fecha al Aire</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {allOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Este usuario aún no tiene solicitudes de producción vinculadas.
                        </td>
                      </tr>
                    ) : (
                      allOrders.map((order: any) => {
                        const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.NUEVA;
                        return (
                          <tr key={`${order.id}-${order.relationType}`} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <Link
                                href={`/orders/${order.id}`}
                                className="font-mono font-extrabold text-blue-700 hover:underline"
                              >
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.relationType === 'CREADA'
                                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {order.relationType === 'CREADA' ? '👩‍💼 Solicitante' : '🎬 Post-Productor'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-bold text-slate-900 block">{order.clientAgency}</span>
                              <span className="text-slate-500 text-[11px]">{order.product}</span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                {order.airDate || 'Por definir'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <Link
                                href={`/orders/${order.id}`}
                                className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 text-[11px]"
                              >
                                Ver SP <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-black text-slate-900">¿Eliminar a {targetUser.name}?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Se eliminará permanentemente la cuenta y se desvincularán sus órdenes asociadas.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
