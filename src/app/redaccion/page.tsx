'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Newspaper, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Inbox, 
  PenTool, 
  Send, 
  Eye, 
  Filter, 
  User, 
  ExternalLink,
  Sparkles,
  AlertCircle,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import EditorialRequestForm from '@/components/orders/EditorialRequestForm';

export default function RedaccionWorkboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'RECIBIDO' | 'INGRESADO' | 'ENTREGADO'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders?status=ALL');
      if (res.ok) {
        const data = await res.json();
        const allOrders = data.orders || [];
        // Filtrar estrictamente solo las SPD (Digital) en las que se chequeó el box de Redacción (requiresNewsroom: true)
        // Las SPD anteriores permanecen como registro histórico
        const newsroomOrders = allOrders.filter(
          (o: any) => o.requiresNewsroom === true && (o.orderCategory === 'DIGITAL' || o.orderNumber?.startsWith('SPD'))
        );
        setOrders(newsroomOrders);
      }
    } catch (err) {
      console.error('Error fetching newsroom orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_NEWSROOM_STATUS',
          newsroomStatus: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar estado');
      }

      const statusLabels: Record<string, string> = {
        RECIBIDO: '📥 Marcado como Recibido',
        INGRESADO: '✍️ Marcado como Ingresado',
        ENTREGADO: '✅ Marcado como Entregado',
        PENDIENTE: '⏳ Marcado como Pendiente',
      };

      setMsg({ type: 'success', text: statusLabels[newStatus] || 'Estado actualizado' });
      await fetchOrders();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error inesperado' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const currentStatus = o.newsroomStatus || 'PENDIENTE';
    if (statusFilter !== 'ALL' && currentStatus !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchOrder = o.orderNumber?.toLowerCase().includes(q);
      const matchOI = o.oiNumber?.toLowerCase().includes(q);
      const matchClient = o.clientAgency?.toLowerCase().includes(q);
      const matchProduct = o.product?.toLowerCase().includes(q);
      const matchCampaign = o.campaign?.toLowerCase().includes(q);
      const matchExec = o.executive?.name?.toLowerCase().includes(q);
      return matchOrder || matchOI || matchClient || matchProduct || matchCampaign || matchExec;
    }
    return true;
  });

  const countPending = orders.filter((o) => (o.newsroomStatus || 'PENDIENTE') === 'PENDIENTE').length;
  const countReceived = orders.filter((o) => o.newsroomStatus === 'RECIBIDO').length;
  const countEntered = orders.filter((o) => o.newsroomStatus === 'INGRESADO').length;
  const countDelivered = orders.filter((o) => o.newsroomStatus === 'ENTREGADO').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white shadow-xl border border-amber-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
              📰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-extrabold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-700/50">
                  Ecuavisa Digital + Mesa de Redacción
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                  Bandeja Editorial
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                Tablero de Requerimientos a Redacción
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Gestión, seguimiento y entrega de coberturas periodísticas, notas web y piezas de redacción vinculadas a órdenes comerciales (SPD / OI).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-black/30 backdrop-blur-sm p-2 rounded-2xl border border-white/10">
            <div className="text-right px-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Usuario Activo</span>
              <span className="text-xs font-black text-amber-300">{user?.name}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
              RD
            </div>
          </div>
        </div>

        {/* Mensaje de Feedback */}
        {msg && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm ${
            msg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Métricas del Tablero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'PENDIENTE' ? 'ALL' : 'PENDIENTE')}
            className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'PENDIENTE'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">⏳ Pendientes</span>
              <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs">
                {countPending}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{countPending}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Por revisar en mesa</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'RECIBIDO' ? 'ALL' : 'RECIBIDO')}
            className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'RECIBIDO'
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-400/30'
                : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">📥 Recibidos</span>
              <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
                {countReceived}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{countReceived}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Requerimientos tomados</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'INGRESADO' ? 'ALL' : 'INGRESADO')}
            className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'INGRESADO'
                ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-400/30'
                : 'bg-white border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">✍️ Ingresados</span>
              <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs">
                {countEntered}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{countEntered}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">En pauta / En redacción</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'ENTREGADO' ? 'ALL' : 'ENTREGADO')}
            className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'ENTREGADO'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">✅ Entregados (Registro)</span>
              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                {countDelivered}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{countDelivered}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Historial y entregas pasadas</p>
          </button>
        </div>

        {/* Buscador y Filtro */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por SPD, OI, cliente, producto o ejecutiva..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filtrar:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Todas las SPD con Redacción ({orders.length})</option>
              <option value="PENDIENTE">⏳ Pendientes ({countPending})</option>
              <option value="RECIBIDO">📥 Recibidos ({countReceived})</option>
              <option value="INGRESADO">✍️ Ingresados ({countEntered})</option>
              <option value="ENTREGADO">✅ Entregados / Registro Histórico ({countDelivered})</option>
            </select>
          </div>
        </div>

        {/* Listado de Requerimientos */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold">Cargando bandeja de requerimientos editoriales...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-2xl mx-auto">
              📭
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">
              No hay requerimientos en esta vista
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No se encontraron solicitudes para Redacción con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const currentStatus = ord.newsroomStatus || 'PENDIENTE';
              let newsroomInfo: any = {};
              try {
                newsroomInfo = ord.newsroomData ? (typeof ord.newsroomData === 'string' ? JSON.parse(ord.newsroomData) : ord.newsroomData) : {};
              } catch {
                newsroomInfo = {};
              }

              let digData: any = {};
              try {
                digData = ord.digitalData ? (typeof ord.digitalData === 'string' ? JSON.parse(ord.digitalData) : ord.digitalData) : {};
              } catch {
                digData = {};
              }

              const coverage = newsroomInfo.coverageDetails || digData.newsroomDetails || {};

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 space-y-4"
                >
                  {/* Top Bar de la Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                        {ord.orderNumber}
                      </span>
                      {ord.oiNumber && (
                        <span className="font-mono font-black text-xs text-blue-900 bg-blue-100 px-2.5 py-1 rounded-xl border border-blue-200">
                          OI: {ord.oiNumber}
                        </span>
                      )}
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl uppercase ${
                        currentStatus === 'PENDIENTE'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : currentStatus === 'RECIBIDO'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : currentStatus === 'INGRESADO'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {currentStatus === 'PENDIENTE' && '⏳ Pendiente'}
                        {currentStatus === 'RECIBIDO' && '📥 Recibido'}
                        {currentStatus === 'INGRESADO' && '✍️ Ingresado'}
                        {currentStatus === 'ENTREGADO' && '✅ Entregado'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          expandedOrderId === ord.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                        }`}
                      >
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>{expandedOrderId === ord.id ? 'Ocultar Formato' : '📋 Ver Formulario Editorial (OI)'}</span>
                        {expandedOrderId === ord.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <Link
                        href={`/orders/${ord.id}/print?type=editorial`}
                        target="_blank"
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>🖨️ PDF</span>
                      </Link>

                      <Link
                        href={`/orders/${ord.id}`}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver SP</span>
                      </Link>
                    </div>
                  </div>

                  {/* Datos Principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente / Marca</span>
                      <p className="text-xs font-black text-slate-900">{ord.clientAgency || '-'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Producto / Servicio</span>
                      <p className="text-xs font-extrabold text-slate-800">{ord.product || '-'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Campaña / Objetivo</span>
                      <p className="text-xs font-bold text-slate-700">
                        {ord.campaign || '-'} {ord.contentObjective ? `• ${ord.contentObjective}` : ''}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Ejecutiva Solicitante</span>
                      <p className="text-xs font-extrabold text-slate-800">
                        👩‍💼 {ord.executive?.name || ord.creator?.name || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Detalle Editorial / Cobertura */}
                  <div className="bg-amber-50/50 rounded-2xl border border-amber-200/80 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Newspaper className="w-3.5 h-3.5 text-amber-700" />
                        Requerimiento para Redacción:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {newsroomInfo.requiresJournalist && (
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                            🎤 Periodista en sitio
                          </span>
                        )}
                        {newsroomInfo.requiresCameraperson && (
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                            📹 Camarógrafo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Descripción de Pauta */}
                    <div className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-amber-100">
                      {newsroomInfo.editorialDetails || digData.specialInstructions || ord.orderDescription || 'Sin detalle de pauta especificado.'}
                    </div>

                    {/* Datos de Cobertura si existen */}
                    {(coverage.date || coverage.time || coverage.location || newsroomInfo.onSiteContact || newsroomInfo.expectedDeliverable) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                        {coverage.date && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span><strong>Fecha:</strong> {coverage.date}</span>
                          </div>
                        )}
                        {coverage.time && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span><strong>Hora:</strong> {coverage.time}</span>
                          </div>
                        )}
                        {coverage.location && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span><strong>Lugar:</strong> {coverage.location}</span>
                          </div>
                        )}
                        {newsroomInfo.onSiteContact && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span><strong>Contacto:</strong> {newsroomInfo.onSiteContact}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {newsroomInfo.expectedDeliverable && (
                      <div className="text-[11px] text-amber-950 font-bold bg-amber-100/60 p-2 rounded-lg">
                        🎯 <strong>Entregable Esperado:</strong> {newsroomInfo.expectedDeliverable}
                      </div>
                    )}
                  </div>

                  {/* Botonera de Acción para Mesa de Redacción */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Cambia el estado con un clic para notificar automáticamente al equipo:
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Botón: 📥 Recibido */}
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'RECIBIDO')}
                        disabled={updatingId === ord.id || currentStatus === 'RECIBIDO'}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          currentStatus === 'RECIBIDO'
                            ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                        } disabled:opacity-50`}
                      >
                        <span>📥</span>
                        <span>Recibido</span>
                      </button>

                      {/* Botón: ✍️ Ingresado */}
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'INGRESADO')}
                        disabled={updatingId === ord.id || currentStatus === 'INGRESADO'}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          currentStatus === 'INGRESADO'
                            ? 'bg-purple-600 text-white ring-2 ring-purple-500/30'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                        } disabled:opacity-50`}
                      >
                        <span>✍️</span>
                        <span>Ingresado</span>
                      </button>

                      {/* Botón: ✅ Entregado */}
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'ENTREGADO')}
                        disabled={updatingId === ord.id || currentStatus === 'ENTREGADO'}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          currentStatus === 'ENTREGADO'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        } disabled:opacity-50`}
                      >
                        <span>✅</span>
                        <span>Entregado</span>
                      </button>
                    </div>
                  </div>

                  {/* Vista Desplegable del Formulario de Solicitud Editorial Oficial */}
                  {expandedOrderId === ord.id && (
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <span>📋</span>
                          <span>Ficha Oficial Editorial (EV Digital + Comercial)</span>
                        </div>
                        <Link
                          href={`/orders/${ord.id}/print?type=editorial`}
                          target="_blank"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Abrir versión para Imprimir</span>
                        </Link>
                      </div>

                      <EditorialRequestForm
                        data={{
                          ...newsroomInfo,
                          executiveName: newsroomInfo.executiveName || ord.executive?.name || ord.creator?.name || '',
                          clientAgency: newsroomInfo.clientAgency || ord.clientAgency,
                          product: newsroomInfo.product || ord.product,
                          campaign: newsroomInfo.campaign || ord.campaign,
                          contentObjective: newsroomInfo.contentObjective || ord.contentObjective,
                          orderDescription: newsroomInfo.orderDescription || ord.orderDescription,
                          receptionDate: newsroomInfo.receptionDate || ord.receptionDate,
                          publishDate: newsroomInfo.publishDate || ord.publishDate,
                          materialDeliveryDate: newsroomInfo.materialDeliveryDate || ord.materialDeliveryDate,
                          finishedProductDeliveryDate: newsroomInfo.finishedProductDeliveryDate || digData.finishedProductDeliveryDate,
                          platformsAndFormats: newsroomInfo.platformsAndFormats || digData.platformsAndFormats,
                          publicationAccount: newsroomInfo.publicationAccount || digData.publicationAccount,
                          newsroomSegmentDetail: newsroomInfo.newsroomSegmentDetail || digData.newsroomDetails?.segmentType,
                          rights: newsroomInfo.rights,
                          resources: newsroomInfo.resources || digData.resources,
                          specialInstructions: newsroomInfo.specialInstructions || digData.specialInstructions,
                          orderNumber: ord.orderNumber,
                          oiNumber: ord.oiNumber,
                        }}
                        isEditable={false}
                        orderNumber={ord.orderNumber}
                        oiNumber={ord.oiNumber}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
