'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Users, 
  Shield, 
  Phone, 
  Mail, 
  Check, 
  Sparkles, 
  UserPlus, 
  KeyRound, 
  Layers, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [pendingCount, setPendingCount] = useState(0);

  // Multi-select Checkboxes State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Password Reset Modal State
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single Delete Modal State
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPendingCount(data.pendingCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approvedUsers = users.filter((u) => u.status !== 'PENDIENTE');
  const pendingUsers = users.filter((u) => u.status === 'PENDIENTE');

  // Checkbox handlers
  const toggleSelectUser = (id: string) => {
    if (id === currentUser?.id) return;
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllApproved = () => {
    const deletableUsers = approvedUsers.filter((u) => u.id !== currentUser?.id);
    if (selectedUserIds.length >= deletableUsers.length && deletableUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(deletableUsers.map((u) => u.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      if (res.ok) {
        setSelectedUserIds([]);
        setShowBulkDeleteModal(false);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleApproveUser = async (userId: string, targetRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE_USER',
          role: targetRole,
        }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT_USER',
        }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setModalMsg({ type: 'error', text: 'La contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    setSavingPassword(true);
    setModalMsg(null);
    try {
      const res = await fetch(`/api/users/${selectedUserForPassword.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          newPassword: newPasswordInput,
        }),
      });
      if (res.ok) {
        setModalMsg({ type: 'success', text: `¡Contraseña cambiada con éxito a: "${newPasswordInput}"!` });
        setTimeout(() => {
          setSelectedUserForPassword(null);
          setNewPasswordInput('');
          setModalMsg(null);
        }, 2000);
      } else {
        setModalMsg({ type: 'error', text: 'Error al cambiar contraseña' });
      }
    } catch {
      setModalMsg({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const deletableCount = approvedUsers.filter((u) => u.id !== currentUser?.id).length;
  const isAllSelected = deletableCount > 0 && selectedUserIds.length === deletableCount;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" /> Control de Usuarios y Credenciales
            </h1>
            <p className="text-xs text-slate-500">
              Selecciona usuarios con las casillas de verificación para eliminarlos en lote, reasignar contraseñas o aprobar registros.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-semibold text-slate-700">
            <button
              onClick={() => { setActiveTab('approved'); setSelectedUserIds([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'approved' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Usuarios Activos ({approvedUsers.length})
            </button>
            <button
              onClick={() => { setActiveTab('pending'); setSelectedUserIds([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative ${
                activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Solicitudes Pendientes
              {pendingCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TOP BULK ACTIONS BANNER (Always shows button or active selection) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAllApproved}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-slate-300"
            >
              {isAllSelected ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className="w-4 h-4 text-slate-400" />}
              {isAllSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos para Borrar'}
            </button>
            <span className="text-xs font-semibold text-slate-500">
              {selectedUserIds.length} de {deletableCount} usuarios seleccionados
            </span>
          </div>

          {selectedUserIds.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-bounce"
            >
              <Trash2 className="w-4 h-4 text-white" />
              Eliminar {selectedUserIds.length} Usuario(s) Seleccionado(s)
            </button>
          )}
        </div>

        {/* TAB 1: PENDING USERS AWAITING ADMIN APPROVAL */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" /> Solicitudes de Registro Pendientes
                </h3>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Revisa el rol solicitado antes de habilitar el acceso al sistema.
                </p>
              </div>
              <span className="bg-amber-200 text-amber-950 text-xs font-black px-2.5 py-1 rounded-full">
                {pendingUsers.length} pendientes
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  🎉 No hay solicitudes pendientes de aprobación en este momento.
                </div>
              ) : (
                pendingUsers.map((u) => (
                  <div key={u.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                        {u.initials || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900">{u.name}</h4>
                          <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                            Rol Solicitado: {u.requestedRole || u.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          📱 WhatsApp: <strong className="text-slate-800">{u.phone || 'Sin número'}</strong> • Fecha: {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleApproveUser(u.id, u.requestedRole || u.role)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectUser(u.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" /> Rechazar
                      </button>
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE USERS DIRECTORY */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAllApproved}
                        className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                        title="Seleccionar todos"
                      />
                    </th>
                    <th className="px-5 py-3.5">Usuario / Prefijo</th>
                    <th className="px-5 py-3.5">Correo y WhatsApp</th>
                    <th className="px-5 py-3.5">Rol en Producción</th>
                    <th className="px-5 py-3.5 text-center">Histórico SPs</th>
                    <th className="px-5 py-3.5 text-right">Credenciales / Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {approvedUsers.map((u) => {
                    const totalSPs = (u._count?.createdOrders || 0) + (u._count?.assignedOrders || 0);
                    const isSelf = u.id === currentUser?.id;
                    const isSelected = selectedUserIds.includes(u.id);

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-red-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          {!isSelf ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(u.id)}
                              className="w-4 h-4 text-red-600 rounded cursor-pointer focus:ring-red-500"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold" title="No puedes borrar tu cuenta">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-black text-xs flex items-center justify-center shadow-sm">
                              {u.initials || 'U'}
                            </div>
                            <div>
                              <Link
                                href={`/users/${u.id}`}
                                className="font-extrabold text-slate-900 text-xs hover:text-blue-600 block hover:underline"
                              >
                                {u.name} {isSelf && <span className="text-[10px] text-blue-600 font-bold">(Tú)</span>}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-mono">
                                SP-{u.initials || 'SP'}-*
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-slate-800 font-mono text-[11px] block">{u.email}</span>
                          {u.phone && (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-600" /> {u.phone}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                            u.role === 'SOLICITANTE'
                              ? 'bg-pink-50 text-pink-700 border-pink-200'
                              : u.role === 'COORDINADOR'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'POST_PRODUCTOR'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {u.role === 'SOLICITANTE' && '👩‍💼 Ejecutiva'}
                            {u.role === 'COORDINADOR' && '📋 Coordinadora'}
                            {u.role === 'POST_PRODUCTOR' && '🎬 Post-Productor'}
                            {u.role === 'ADMIN' && '⚡ Administrador'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <Link
                            href={`/users/${u.id}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3 text-slate-500" /> {totalSPs} SPs
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedUserForPassword(u);
                              setNewPasswordInput('');
                              setModalMsg(null);
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                            title="Reasignar Contraseña"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Clave
                          </button>

                          <Link
                            href={`/users/${u.id}`}
                            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                          >
                            Ficha
                          </Link>

                          {!isSelf && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg transition-all inline-flex items-center justify-center"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE BORRADO MASIVO */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900">
                  ¿Eliminar {selectedUserIds.length} Usuario(s)?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Se eliminarán permanentemente las cuentas seleccionadas y se desvincularán sus órdenes asociadas. Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {bulkDeleting ? 'Eliminando...' : `Sí, Eliminar los ${selectedUserIds.length} Usuarios`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PARA REASIGNAR CONTRASEÑA */}
        {selectedUserForPassword && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Reasignar Contraseña
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedUserForPassword(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Asigna una nueva clave para el usuario <strong className="text-slate-900">{selectedUserForPassword.name}</strong> ({selectedUserForPassword.email}).
              </p>

              {modalMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    modalMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {modalMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {modalMsg.text}
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nueva Contraseña:
                  </label>
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Escribe la contraseña nueva..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForPassword(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {savingPassword ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN INDIVIDUAL */}
        {userToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-black text-slate-900">¿Eliminar Usuario?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Estás a punto de eliminar permanentemente a <strong className="text-slate-800">{userToDelete.name}</strong> ({userToDelete.email}). Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSingle}
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
