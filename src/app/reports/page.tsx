'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Printer, 
  Layers, 
  Filter, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Clapperboard, 
  ArrowUpRight, 
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { STATUS_CONFIG, formatDateTime, formatDate } from '@/lib/order-utils';

export default function MonthlyReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedPost, setSelectedPost] = useState('ALL');
  const [selectedExecutive, setSelectedExecutive] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedMonth !== 'ALL') params.append('month', selectedMonth);
      if (selectedPost !== 'ALL') params.append('postProducerId', selectedPost);
      if (selectedExecutive !== 'ALL') params.append('executiveId', selectedExecutive);
      if (selectedClient !== 'ALL') params.append('clientAgency', selectedClient);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.status === 403) {
        setError('Acceso exclusivo para Coordinación de Producción y Administradores.');
        return;
      }
      if (!res.ok) {
        throw new Error('Error al generar el reporte');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error al obtener datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'COORDINADOR' || user.role === 'ADMIN')) {
      fetchReport();
    } else if (user) {
      setError('Acceso restringido: Este reporte está disponible para Coordinadoras y Administradores.');
      setLoading(false);
    }
  }, [user, selectedMonth, selectedPost, selectedExecutive, selectedClient]);

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-slate-500">Calculando tiempos de resolución y métricas mensuales...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-xl mx-auto my-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-black text-red-900 mb-2">Acceso No Autorizado</h2>
          <p className="text-xs text-red-700 font-medium mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
          >
            Volver al Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Filter orders for table
  const filteredOrders = (data.orders || []).filter((ord: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      ord.orderNumber.toLowerCase().includes(term) ||
      ord.clientAgency.toLowerCase().includes(term) ||
      ord.product.toLowerCase().includes(term) ||
      (ord.program && ord.program.toLowerCase().includes(term)) ||
      ord.postProducerName.toLowerCase().includes(term) ||
      (ord.executiveName && ord.executiveName.toLowerCase().includes(term)) ||
      (ord.creatorName && ord.creatorName.toLowerCase().includes(term));
    return matchesSearch;
  });

  const monthTitle = selectedMonth === 'ALL' 
    ? 'Reporte General Acumulado' 
    : (data.availableMonths?.find((m: any) => m.key === selectedMonth)?.label || selectedMonth);

  const isFiltered = selectedMonth !== 'ALL' || selectedPost !== 'ALL' || selectedExecutive !== 'ALL' || selectedClient !== 'ALL';

  const resetFilters = () => {
    setSelectedMonth('ALL');
    setSelectedPost('ALL');
    setSelectedExecutive('ALL');
    setSelectedClient('ALL');
    setSearchTerm('');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-indigo-400" /> Coordinación y Rendimiento Operativo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <Clock className="w-8 h-8 text-cyan-400 bg-cyan-500/20 rounded-2xl p-1 border border-cyan-500/40" />
              Reporte Mensual y Rendimiento de Producción
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Filtra por Cliente, Ejecutiva, Periodo y Post-Productor para obtener reportes y métricas operativas específicas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm backdrop-blur-sm"
            >
              <Printer className="w-4 h-4 text-cyan-400" /> Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Filter Toolbar with Period, Executive, Client, and Post-Producer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-600" /> Filtros de Reporte Específico:
            </span>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Limpiar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter 1: Periodo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Periodo:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">🗓️ Todos los Meses (Acumulado)</option>
                {data.availableMonths?.map((m: any) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.count} SPs)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Ejecutiva de Ventas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-600" /> Ejecutiva Solicitante:
              </label>
              <select
                value={selectedExecutive}
                onChange={(e) => setSelectedExecutive(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">👩‍💼 Todas las Ejecutivas</option>
                {data.availableExecutives?.map((ex: any) => (
                  <option key={ex.id} value={ex.id}>
                    👩‍💼 {ex.name} ({ex.count} SPs)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Cliente / Agencia */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Cliente / Agencia:
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">🏢 Todos los Clientes</option>
                {data.availableClients?.map((c: any) => (
                  <option key={c.name} value={c.name}>
                    🏢 {c.name} ({c.count} SPs)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 4: Post-Productor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Clapperboard className="w-3.5 h-3.5 text-cyan-600" /> Post-Productor:
              </label>
              <select
                value={selectedPost}
                onChange={(e) => setSelectedPost(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">🎬 Todos los Editores</option>
                {data.postProducersSummary?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    🎬 {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>
              Mostrando <strong className="text-slate-900">{data.totalReceived}</strong> órdenes en el reporte actual
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedExecutive !== 'ALL' && `Ejecutiva: ${data.availableExecutives?.find((e: any) => e.id === selectedExecutive)?.name} • `}
              {selectedClient !== 'ALL' && `Cliente: ${selectedClient} • `}
              {monthTitle}
            </span>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Recibidas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Órdenes Recibidas</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
                {data.totalReceived}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {data.totalPending} en proceso o asignación
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Entregadas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Órdenes Entregadas</p>
              <h3 className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {data.totalDelivered}
              </h3>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                {data.completionRate}% efectividad de entrega
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Tiempo Promedio de Resolución */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tiempo Promedio Resolución</p>
              <h3 className="text-2xl font-black text-cyan-600 font-mono mt-1">
                {data.avgResolutionTimeFormatted}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Desde asignación hasta entrega
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Ajustes y Cambios */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Solicitudes con Cambios</p>
              <h3 className="text-2xl font-black text-rose-600 font-mono mt-1">
                {data.totalWithChanges}
              </h3>
              <p className="text-[10px] text-rose-600 font-medium mt-1">
                {data.totalExtraCostOrders > 0 ? `⚠️ ${data.totalExtraCostOrders} con costo adicional` : 'Dentro del límite regular'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Post-Producers Breakdown Table & Cards */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Rendimiento y Productividad por Post-Productor
              </h3>
              <p className="text-[11px] text-slate-400">Desglose de entregas y tiempo estimado de resolución por editor en {monthTitle}</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {data.postProducersSummary?.length || 0} Editores
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!data.postProducersSummary || data.postProducersSummary.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center col-span-3">No hay editores con asignaciones en este periodo.</p>
            ) : (
              data.postProducersSummary.map((post: any, idx: number) => (
                <div key={post.id} className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-600 font-black text-white flex items-center justify-center text-xs shadow-inner">
                        {post.initials || 'PP'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{post.name}</h4>
                        <span className="text-[10px] text-slate-400">{post.phone || post.email}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {post.completionRate}%
                    </span>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-semibold">Asignadas</span>
                      <strong className="text-slate-900 font-mono font-bold">{post.assignedCount}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-emerald-600 block font-semibold">Entregadas</span>
                      <strong className="text-emerald-700 font-mono font-black">{post.deliveredCount}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-rose-500 block font-semibold">Cambios</span>
                      <strong className="text-rose-700 font-mono font-bold">{post.changesCount}</strong>
                    </div>
                  </div>

                  {/* Resolution Time Badge */}
                  <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-cyan-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" /> Tiempo Promedio:
                    </span>
                    <strong className="font-mono font-black text-cyan-800 text-xs">
                      {post.avgResolutionFormatted}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Orders Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" /> Detalle Individual de Órdenes y Tiempos de Resolución
              </h3>
              <p className="text-[11px] text-slate-400">Registro cronológico de atención y entregas</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar SP, cliente, editor..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Código SP</th>
                  <th className="p-3">Cliente / Agencia</th>
                  <th className="p-3">Ejecutiva Solicitante</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Post-Productor</th>
                  <th className="p-3">Ingreso (Hora)</th>
                  <th className="p-3">Entrega (Hora)</th>
                  <th className="p-3 text-center">Tiempo Resolución</th>
                  <th className="p-3 text-center">Cambios</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 text-xs">
                      No se encontraron órdenes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord: any) => {
                    const statusInfo = STATUS_CONFIG[ord.status] || STATUS_CONFIG.NUEVA;
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {ord.orderNumber}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {ord.clientAgency}
                        </td>
                        <td className="p-3 text-slate-800 whitespace-nowrap">
                          <span className="font-bold block">👩‍💼 {ord.executiveName}</span>
                          {ord.isEnteredByCoordinator && (
                            <span className="text-[10px] text-blue-600 font-semibold block">
                              (Ingresada por: {ord.creatorName})
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {ord.product}
                        </td>
                        <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                          🎬 {ord.postProducerName}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                          {formatDateTime(ord.createdAt)}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                          {ord.deliveredAt ? formatDateTime(ord.deliveredAt) : '—'}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            ord.resolutionTimeHours !== null ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'text-slate-400'
                          }`}>
                            {ord.resolutionTimeFormatted}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {ord.changesCount > 0 ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              ord.changesCount >= 4 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-50 text-rose-800'
                            }`}>
                              {ord.changesCount} {ord.changesCount >= 4 && '⚠️'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">0</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <Link
                            href={`/orders/${ord.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                          >
                            Ver <ChevronRight className="w-3.5 h-3.5" />
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
    </AppLayout>
  );
}
