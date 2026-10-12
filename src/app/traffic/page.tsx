'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Layers, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  ArrowRight,
  Filter,
  RefreshCw,
  Phone,
  Flame,
  Check
} from 'lucide-react';
import { STATUS_CONFIG, formatDateTime, formatDate } from '@/lib/order-utils';

export default function TrafficPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProducerId, setSelectedProducerId] = useState<string>('ALL');

  const fetchTraffic = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/traffic');
      if (res.status === 401 || res.status === 403) {
        setError('No tienes permisos para ver la matriz de tráfico.');
        return;
      }
      if (!res.ok) {
        throw new Error('Error al cargar datos de tráfico');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
  }, []);

  const isCoordinatorOrAdmin = user?.role === 'COORDINADOR' || 
    user?.role === 'COORDINADOR_PRODUCTOR' || 
    user?.role === 'ADMIN' || 
    user?.role === 'PRODUCTOR_SENIOR';

  if (!isCoordinatorOrAdmin) {
    return (
      <AppLayout>
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center max-w-xl mx-auto my-12">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-black text-amber-900 mb-2">Acceso de Coordinación & Tráfico</h2>
          <p className="text-xs text-amber-700 font-medium mb-4">
            La Matriz de Tráfico y Capacidad está reservada para Coordinadoras de Producción, Productores Senior y Administradores.
          </p>
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

  const producers = data?.producers || [];
  const unassignedOrders = data?.unassignedOrders || [];
  const totalActive = data?.totalActiveOrders || 0;

  const availableCount = producers.filter((p: any) => p.workload?.level === 'DISPONIBLE').length;
  const mediumCount = producers.filter((p: any) => p.workload?.level === 'MEDIA').length;
  const overloadedCount = producers.filter((p: any) => p.workload?.level === 'SOBRECARGADO').length;

  const filteredProducers = selectedProducerId === 'ALL'
    ? producers
    : producers.filter((p: any) => p.id === selectedProducerId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-cyan-100 text-cyan-800 text-lg">🚦</span>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Matriz de Tráfico y Capacidad
                  <span className="text-[11px] font-extrabold uppercase bg-cyan-600 text-white px-2.5 py-0.5 rounded-full tracking-wider">
                    Workamajig Suite
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Control en tiempo real de carga laboral, disponibilidad de editores y cronograma de salidas al aire
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchTraffic}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Recargar matriz"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            <Link
              href="/orders/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Nueva SP
            </Link>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SPs en Proceso</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalActive}</span>
              <span className="text-[11px] font-semibold text-slate-500">en edición</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
              🟢 Disponibles
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-900">{availableCount}</span>
              <span className="text-[11px] font-bold text-emerald-700">editores</span>
            </div>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
              🟡 Carga Media
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-900">{mediumCount}</span>
              <span className="text-[11px] font-bold text-amber-800">editores</span>
            </div>
          </div>

          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block flex items-center gap-1">
              🔴 Sobrecargados
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-900">{overloadedCount}</span>
              <span className="text-[11px] font-bold text-rose-800">editores (4+ SPs)</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-2xs">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Sin Asignar</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-900">{unassignedOrders.length}</span>
              <span className="text-[11px] font-bold text-purple-700">en espera</span>
            </div>
          </div>
        </div>

        {/* Alerta de SPs sin asignar */}
        {unassignedOrders.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-800 flex items-center justify-center font-black text-sm shrink-0">
                📥
              </div>
              <div>
                <h3 className="text-xs font-bold text-purple-950">
                  Hay {unassignedOrders.length} {unassignedOrders.length === 1 ? 'orden que requiere' : 'órdenes que requieren'} asignación de editor
                </h3>
                <p className="text-[11px] text-purple-700">
                  Asígnalas rápidamente a los editores disponibles con semáforo verde para evitar cuellos de botella.
                </p>
              </div>
            </div>
            <Link
              href="/orders?status=NUEVA"
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto transition-colors"
            >
              <span>Ver Bandeja de Nuevas</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            <button
              onClick={() => setSelectedProducerId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedProducerId === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos ({producers.length})
            </button>
            {producers.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelectedProducerId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedProducerId === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{p.workload?.dot}</span>
                <span>{p.name.split(' ')[0]}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {p.activeCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Post-Producers Capacity Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              Carga y Disponibilidad por Post-Productor
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Máximo sugerido: 3 órdenes simultáneas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducers.map((prod: any) => {
              const capPercent = Math.min(100, Math.round((prod.activeCount / 4) * 100));

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                >
                  <div>
                    {/* Top User Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-black text-sm shadow-inner">
                          {prod.initials || 'ED'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                            {prod.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {prod.role === 'PRODUCTOR_SENIOR' ? '👑 Productor Senior' : prod.role === 'COORDINADOR_PRODUCTOR' ? '🎯 Coord. - Productor' : '🎬 Post-Productor'}
                          </span>
                        </div>
                      </div>

                      {/* Workload Status Badge */}
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${prod.workload?.badgeClass}`}>
                        <span>{prod.workload?.dot}</span>
                        <span>{prod.workload?.label}</span>
                      </span>
                    </div>

                    {/* Workload Gauge Bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Capacidad Ocupada:</span>
                        <span className="font-black text-slate-900 font-mono">
                          {prod.activeCount} / 4 SPs ({capPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            prod.activeCount <= 1
                              ? 'bg-emerald-500'
                              : prod.activeCount <= 3
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${capPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Active Orders List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Órdenes en Edición ({prod.orders.length})
                    </span>

                    {prod.orders.length === 0 ? (
                      <div className="py-4 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-600">Completamente Libre</p>
                        <p className="text-[10px] text-slate-400">Listo para recibir nuevas asignaciones</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {prod.orders.map((ord: any) => {
                          const statusCfg = (STATUS_CONFIG as any)[ord.status] || { label: ord.status, color: 'bg-slate-100 text-slate-800' };

                          return (
                            <Link
                              key={ord.id}
                              href={`/orders/${ord.id}`}
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all flex items-center justify-between gap-2 block group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-[11px] text-blue-700 group-hover:underline">
                                    {ord.orderNumber}
                                  </span>
                                  {ord.priority === 'URGENTE' && (
                                    <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-1 rounded">
                                      🚨 Urgente
                                    </span>
                                  )}
                                  {ord.changesCount > 0 && (
                                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded">
                                      🔄 {ord.changesCount}c
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-extrabold text-slate-800 truncate">
                                  {ord.clientAgency} • {ord.product}
                                </p>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  📅 Aire: {ord.airDate || 'Por definir'}
                                </span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                  {statusCfg.label}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Contact Footer */}
                  {prod.phone && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {prod.phone}
                      </span>
                      <a
                        href={`https://wa.me/${prod.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Weekly Delivery Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Cronograma de Entregas y Salidas al Aire
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Monitoreo de compromisos de emisión comercial
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ver Todas las Órdenes <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Código SP</th>
                  <th className="py-3 px-3">Cliente / Producto</th>
                  <th className="py-3 px-3">Ejecutiva</th>
                  <th className="py-3 px-3">Editor Asignado</th>
                  <th className="py-3 px-3">Fecha Entrega</th>
                  <th className="py-3 px-3">Fecha al Aire</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.allUpcomingOrders || []).slice(0, 15).map((ord: any) => {
                  const statusCfg = (STATUS_CONFIG as any)[ord.status] || { label: ord.status, color: 'bg-slate-100 text-slate-800' };

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{ord.clientAgency}</span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">{ord.product}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {ord.executive?.name || 'Ventas'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {producers.find((p: any) => p.id === ord.postProducerId)?.name || '⚠️ Sin Asignar'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {ord.materialDeliveryDate || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-bold font-mono text-[11px]">
                        {ord.airDate || 'Por definir'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
