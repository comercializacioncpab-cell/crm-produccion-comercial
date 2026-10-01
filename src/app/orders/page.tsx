'use client';

import React, { useEffect, useState, Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FilePlus2, 
  Search, 
  Filter, 
  Layers, 
  Kanban, 
  Table as TableIcon, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Tv, 
  Paperclip,
  ArrowUpDown,
  ExternalLink,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/order-utils';

function OrdersContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState(searchParams.get('scope') || 'all');

  // Checkboxes for bulk SP deletion
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (scopeFilter !== 'all') params.append('scope', scopeFilter);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, priorityFilter, scopeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // Checkbox functions
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length && orders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch('/api/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrderIds }),
      });
      if (res.ok) {
        setSelectedOrderIds([]);
        setShowBulkDeleteModal(false);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteSingleOrder = async () => {
    if (!orderToDelete) return;
    setBulkDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOrderToDelete(null);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkDeleting(false);
    }
  };

  const kanbanColumns = [
    { id: 'NUEVA', title: '📥 Nuevas Solicitudes', border: 'border-amber-400' },
    { id: 'ASIGNADA', title: '🎯 Asignadas a Post', border: 'border-blue-400' },
    { id: 'EN_PROCESO', title: '⏳ En Post-Producción', border: 'border-indigo-400' },
    { id: 'RESUELTA', title: '✨ Resueltas / Entregadas', border: 'border-emerald-400' },
    { id: 'CON_CAMBIOS', title: '⚠️ Con Cambios', border: 'border-rose-400' },
    { id: 'APROBADA', title: '✅ Aprobadas / Listo al Aire', border: 'border-teal-400' },
  ];

  const isAllSelected = orders.length > 0 && selectedOrderIds.length === orders.length;

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-600" /> Solicitudes de Producción (SP)
          </h1>
          <p className="text-xs text-slate-500">
            Directorio y flujo operativo de todas las órdenes de trabajo comercial.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-semibold text-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Tabla
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Pipeline Kanban
            </button>
          </div>

          {user?.role !== 'POST_PRODUCTOR' && (
            <Link
              href="/orders/new"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <FilePlus2 className="w-4 h-4" /> Nueva SP
            </Link>
          )}
        </div>
      </div>

      {/* TOP BULK ACTIONS BANNER FOR SPs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-slate-300"
          >
            {isAllSelected ? <CheckSquare className="w-4 h-4 text-cyan-600" /> : <Square className="w-4 h-4 text-slate-400" />}
            {isAllSelected ? 'Deseleccionar Todas' : 'Seleccionar Todas las SPs'}
          </button>
          <span className="text-xs font-semibold text-slate-500">
            {selectedOrderIds.length} de {orders.length} órdenes seleccionadas
          </span>
        </div>

        {selectedOrderIds.length > 0 && user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-bounce"
          >
            <Trash2 className="w-4 h-4 text-white" />
            Eliminar {selectedOrderIds.length} SP(s) Seleccionada(s)
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ej. SP-AR-1128), cliente, producto o programa..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar por:
            </span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="NUEVA">📥 Nuevas Solicitudes</option>
              <option value="ASIGNADA">🎯 Asignadas a Post</option>
              <option value="EN_PROCESO">⏳ En Post-Producción</option>
              <option value="RESUELTA">✨ Resueltas / Entregadas</option>
              <option value="CON_CAMBIOS">⚠️ Con Cambios</option>
              <option value="APROBADA">✅ Aprobadas</option>
              <option value="AL_AIRE">📺 Al Aire</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todas las Prioridades</option>
              <option value="URGENTE">🔴 Urgente</option>
              <option value="ALTA">🟠 Alta</option>
              <option value="MEDIA">🔵 Media</option>
              <option value="BAJA">⚪ Baja</option>
            </select>
          </div>

          <span className="text-slate-400 font-medium text-[11px]">
            {orders.length} órdenes encontradas
          </span>
        </div>
      </div>

      {/* View Mode 1: Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                      title="Seleccionar todas"
                    />
                  </th>
                  <th className="px-4 py-3">Código SP</th>
                  <th className="px-4 py-3">Cliente / Agencia</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Programa / Auspicio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Ejecutiva / Post</th>
                  <th className="px-4 py-3 text-right">Fecha al Aire</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Cargando solicitudes de producción...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No se encontraron solicitudes con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.NUEVA;
                    const priorityInfo = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.MEDIA;
                    const isSelected = selectedOrderIds.includes(order.id);

                    return (
                      <tr key={order.id} className={`transition-colors ${isSelected ? 'bg-red-50/50' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(order.id)}
                            className="w-4 h-4 text-red-600 rounded cursor-pointer focus:ring-red-500"
                          />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono font-extrabold text-blue-700 hover:underline flex items-center gap-1"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {order.clientAgency}
                        </td>
                        <td className="px-4 py-3.5">{order.product}</td>
                        <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate">
                          {order.program || 'No especificado'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityInfo.badge}`}>
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[11px] whitespace-nowrap">
                          <span className="text-slate-900 font-bold block">
                            👩‍💼 {order.executive?.name || order.creator?.name}
                          </span>
                          <span className="text-slate-400 block text-[10px]">
                            🎬 Post: {order.postProducer?.name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                            {order.airDate || 'Por definir'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap space-x-1">
                          <Link
                            href={`/orders/${order.id}`}
                            className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1 text-[11px]"
                          >
                            Gestionar <ExternalLink className="w-3 h-3" />
                          </Link>

                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setOrderToDelete(order)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1 rounded-lg transition-all inline-flex items-center justify-center"
                              title="Eliminar SP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode 2: Kanban Pipeline View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/80 flex flex-col min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <h3 className="font-extrabold text-xs text-slate-800">{col.title}</h3>
                  <span className="bg-white text-slate-700 font-black text-xs px-2 py-0.5 rounded-full border border-slate-200">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colOrders.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                      Sin solicitudes
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const priorityInfo = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.MEDIA;
                      return (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all block group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="font-mono font-black text-xs text-blue-700 group-hover:text-blue-900">
                              {order.orderNumber}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityInfo.badge}`}>
                              {priorityInfo.label}
                            </span>
                          </div>

                          <p className="font-bold text-slate-900 text-xs">
                            {order.clientAgency} • {order.product}
                          </p>

                          {order.program && (
                            <p className="text-[11px] text-slate-500 mt-1 truncate">
                              📺 {order.program}
                            </p>
                          )}

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Post: {order.postProducer?.name.split(' ')[0] || 'Sin asignar'}</span>
                            <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                              {order.airDate || 'Sin fecha'}
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO MASIVO DE SPs */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">
                ¿Eliminar {selectedOrderIds.length} Solicitud(es) de Producción?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Se eliminarán permanentemente las órdenes seleccionadas con todos sus archivos adjuntos e historial.
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
                onClick={handleBulkDeleteOrders}
                disabled={bulkDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {bulkDeleting ? 'Eliminando...' : `Sí, Eliminar las ${selectedOrderIds.length} SPs`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO INDIVIDUAL DE SP */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                ¿Eliminar la orden {orderToDelete.orderNumber}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Se eliminará la orden de <strong className="text-slate-800">{orderToDelete.clientAgency} - {orderToDelete.product}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSingleOrder}
                disabled={bulkDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {bulkDeleting ? 'Eliminando...' : 'Sí, Eliminar SP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando órdenes...</div>}>
        <OrdersContent />
      </Suspense>
    </AppLayout>
  );
}
