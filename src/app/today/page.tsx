'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Calendar,
  CheckSquare,
  Square,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Filter
} from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/order-utils';

export default function TodayWorkboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'changes' | 'in_progress'>('all');
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<any | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'EMAIL' | 'LINK'>('EMAIL');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  const loadAssignedOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders?scope=assigned_to_me');
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
    loadAssignedOrders();
  }, []);

  const handleStartWork = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START_PROGRESS' }),
      });
      if (res.ok) {
        await loadAssignedOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChecklist = async (orderId: string, itemIndex: number) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const checklist = Array.isArray(o.changeChecklist) ? [...o.changeChecklist] : [];
        if (checklist[itemIndex]) {
          checklist[itemIndex] = {
            ...checklist[itemIndex],
            done: !checklist[itemIndex].done
          };
        }
        return { ...o, changeChecklist: checklist };
      }));

      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_CHECKLIST_ITEM', itemIndex }),
      });
    } catch (e) {
      console.error(e);
      await loadAssignedOrders();
    }
  };

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModalOrder) return;
    if (deliveryMethod === 'LINK' && !deliveryUrl.trim()) {
      setDeliveryError('Por favor ingresa el enlace de la nube (Drive/WeTransfer/Vimeo) para entregar');
      return;
    }

    try {
      setSubmittingDelivery(true);
      setDeliveryError('');
      const res = await fetch(`/api/orders/${deliveryModalOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_DELIVERY',
          deliveryMethod,
          deliveryUrl: deliveryMethod === 'LINK' ? deliveryUrl.trim() : null,
          deliveryNotes,
        }),
      });

      if (res.ok) {
        setDeliveryModalOrder(null);
        setDeliveryUrl('');
        setDeliveryNotes('');
        await loadAssignedOrders();
      } else {
        const d = await res.json();
        setDeliveryError(d.error || 'Error al entregar comercial');
      }
    } catch (err: any) {
      setDeliveryError(err.message || 'Error de conexión');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  // Active production orders
  const activeOrders = orders.filter(o => ['ASIGNADA', 'EN_PROCESO', 'CON_CAMBIOS'].includes(o.status));
  const reviewOrders = orders.filter(o => ['REVISION_INTERNA', 'APROBADA'].includes(o.status));

  // Buckets
  const urgentOrders = activeOrders.filter(o => {
    if (o.priority === 'URGENTE') return true;
    if (o.deliveryDate) {
      const d = new Date(o.deliveryDate).toISOString().split('T')[0];
      return d <= todayDateStr;
    }
    return false;
  });

  const changesOrders = activeOrders.filter(o => o.status === 'CON_CAMBIOS');
  const inProgressOrders = activeOrders.filter(o => o.status === 'EN_PROCESO');
  const newAssignedOrders = activeOrders.filter(o => o.status === 'ASIGNADA');

  // Filtered view
  let displayedOrders = activeOrders;
  if (activeTab === 'urgent') displayedOrders = urgentOrders;
  if (activeTab === 'changes') displayedOrders = changesOrders;
  if (activeTab === 'in_progress') displayedOrders = inProgressOrders;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Creative Today • Mesa de Post-Producción
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Mi Jornada Creativa de Hoy
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Órdenes asignadas activas, checklist de correcciones y entregables directos.
              </p>
            </div>

            <button
              onClick={loadAssignedOrders}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Actualizar Lista
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] font-medium text-slate-300 block">Total en mi Mesa</span>
              <p className="text-2xl font-black text-white mt-1">{activeOrders.length}</p>
            </div>
            <div className="bg-rose-500/10 backdrop-blur-md rounded-2xl p-3.5 border border-rose-500/20">
              <span className="text-[11px] font-medium text-rose-300 block flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" /> Para Hoy / Urgentes
              </span>
              <p className="text-2xl font-black text-rose-300 mt-1">{urgentOrders.length}</p>
            </div>
            <div className="bg-amber-500/10 backdrop-blur-md rounded-2xl p-3.5 border border-amber-500/20">
              <span className="text-[11px] font-medium text-amber-300 block">Con Cambios</span>
              <p className="text-2xl font-black text-amber-300 mt-1">{changesOrders.length}</p>
            </div>
            <div className="bg-cyan-500/10 backdrop-blur-md rounded-2xl p-3.5 border border-cyan-500/20">
              <span className="text-[11px] font-medium text-cyan-300 block">En Proceso</span>
              <p className="text-2xl font-black text-cyan-300 mt-1">{inProgressOrders.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'urgent'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Urgentes / Hoy ({urgentOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'changes'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Con Cambios ({changesOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'in_progress'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> En Edición ({inProgressOrders.length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-xs font-medium">Cargando mesa de trabajo...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedOrders.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">¡Todo al día en tu mesa!</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
              No tienes órdenes pendientes en este filtro. Revisa la bandeja de órdenes para nuevas asignaciones.
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 mt-4 text-xs font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800"
            >
              Ver todas las órdenes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Order Cards Grid */}
        {!loading && displayedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || {
                label: order.status,
                color: 'bg-slate-100 text-slate-700',
              };
              const priorityCfg = PRIORITY_CONFIG[order.priority as keyof typeof PRIORITY_CONFIG] || {
                label: order.priority,
                color: 'bg-slate-100 text-slate-700',
              };

              const checklist = Array.isArray(order.changeChecklist) ? order.changeChecklist : [];
              const pendingChecklistCount = checklist.filter((i: any) => !i.done).length;

              const isUrgent = order.priority === 'URGENTE' || (order.deliveryDate && new Date(order.deliveryDate).toISOString().split('T')[0] <= todayDateStr);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                    isUrgent ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Order Number, Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-black text-slate-900 hover:text-cyan-600 text-base"
                          >
                            {order.orderNumber}
                          </Link>
                          {order.orderCategory === 'DIGITAL' ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-2 py-0.5 rounded-full">
                              📱 DIGITAL
                            </span>
                          ) : (
                            <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-black px-2 py-0.5 rounded-full">
                              📺 TV
                            </span>
                          )}
                          {order.isDemo && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 font-black px-2 py-0.5 rounded-full">
                              DEMO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{order.clientAgency}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Product & Details */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-600">
                        <span className="font-semibold text-slate-700">Producto / Versión:</span>
                        <span className="font-bold text-slate-900">{order.product}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-semibold text-slate-700">
                          {order.orderCategory === 'DIGITAL' ? 'Campaña / Plataforma:' : 'Programa:'}
                        </span>
                        <span className="font-medium text-slate-900">
                          {order.orderCategory === 'DIGITAL'
                            ? (order.campaign ? `📱 ${order.campaign}` : '📱 Redes & Web')
                            : (order.program || 'Sin programa')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-semibold text-slate-700">Fecha de Entrega:</span>
                        <span className={`font-bold flex items-center gap-1 ${isUrgent ? 'text-rose-600' : 'text-slate-800'}`}>
                          <Calendar className="w-3 h-3" />
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Sin fecha'}
                        </span>
                      </div>
                      {order.materialType && (
                        <div className="flex justify-between text-slate-600">
                          <span className="font-semibold text-slate-700">Tipo de Material:</span>
                          <span className="text-slate-800">{order.materialType}</span>
                        </div>
                      )}
                    </div>

                    {/* Change Checklist (if available) */}
                    {checklist.length > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                            Ajustes Requeridos ({checklist.filter((c: any) => c.done).length}/{checklist.length})
                          </span>
                          {pendingChecklistCount === 0 && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              ¡Todos listos!
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {checklist.map((item: any, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleToggleChecklist(order.id, idx)}
                              className={`w-full text-left flex items-start gap-2 p-1.5 rounded-lg text-xs transition-colors ${
                                item.done ? 'bg-amber-100/40 text-slate-400 line-through' : 'bg-white text-slate-800 hover:bg-amber-100/50'
                              }`}
                            >
                              {item.done ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              )}
                              <span className="leading-tight">{item.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brief notes snippet */}
                    {order.orderNotes && (
                      <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        &ldquo;{order.orderNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Ver SP
                    </Link>

                    <div className="flex items-center gap-2">
                      {order.status === 'ASIGNADA' && (
                        <button
                          onClick={() => handleStartWork(order.id)}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-all"
                        >
                          <Play className="w-3 h-3" /> Iniciar Edición
                        </button>
                      )}

                      {(order.status === 'EN_PROCESO' || order.status === 'CON_CAMBIOS') && (
                        <button
                          onClick={() => {
                            setDeliveryModalOrder(order);
                            setDeliveryMethod('EMAIL');
                            setDeliveryUrl('');
                            setDeliveryNotes('');
                            setDeliveryError('');
                          }}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Upload className="w-3 h-3" /> Entregar Comercial
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently Delivered Section */}
        {reviewOrders.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Entregados Recientemente / En Revisión
            </h3>
            <div className="divide-y divide-slate-100">
              {reviewOrders.slice(0, 5).map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <Link href={`/orders/${o.id}`} className="font-bold text-slate-900 hover:text-cyan-600">
                      {o.orderNumber} - {o.clientAgency} ({o.product})
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      Estado: <span className="font-semibold text-emerald-600">{o.status}</span>
                    </p>
                  </div>
                  <Link
                    href={`/orders/${o.id}`}
                    className="text-xs text-cyan-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Detalles <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Entregar Comercial */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Entrega de Material
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Entregar: {deliveryModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {deliveryModalOrder.clientAgency} • {deliveryModalOrder.product}
                </p>
              </div>
              <button
                onClick={() => setDeliveryModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {deliveryError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {deliveryError}
              </div>
            )}

            <form onSubmit={handleDeliverSubmit} className="mt-4 space-y-4">
              {/* Selector de Método de Entrega */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod('EMAIL');
                    setDeliveryError('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deliveryMethod === 'EMAIL'
                      ? 'bg-white text-sky-700 shadow-sm border border-sky-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>✉️</span>
                  <span>Enviado por Mail</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod('LINK');
                    setDeliveryError('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deliveryMethod === 'LINK'
                      ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🔗</span>
                  <span>Enlace en la Nube</span>
                </button>
              </div>

              {deliveryMethod === 'EMAIL' ? (
                <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-950 font-black text-xs">
                    <span>✉️</span>
                    <span>Entrega directa vía Correo Electrónico</span>
                  </div>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    <strong>Sin subir archivos:</strong> Puedes dar por terminada la orden inmediatamente si enviaste el material por mail. La SP quedará en estado <strong>Resuelta</strong> y se notificará a la solicitante.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enlace del Video / Master Comercial (Google Drive, Frame.io, YouTube, etc.) *
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... o https://vimeo.com/..."
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de Entrega / Aclaraciones de Versión (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder={deliveryMethod === 'EMAIL' ? "Ej: Enviado al cliente y ejecutiva por mail con fecha..." : "Ej: Se ajustó el locutor, se incluyó pleca legal y se niveló el audio a -24 LUFS."}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-[11px] text-cyan-900">
                💡 Al entregar, el estado cambiará a <strong>Resuelta / En Revisión</strong> y se generará automáticamente el token para que el cliente o ejecutiva puedan aprobarlo.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingDelivery}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                    deliveryMethod === 'EMAIL' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {submittingDelivery ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Entregando...
                    </>
                  ) : deliveryMethod === 'EMAIL' ? (
                    <>
                      <span>✉️</span> Confirmar (Enviado por Mail)
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Confirmar Entrega
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
