'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  FilePlus2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ArrowRight, 
  TrendingUp, 
  Tv, 
  Users, 
  Calendar,
  Sparkles,
  Inbox
} from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/order-utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 mb-2 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> Sistema de Órdenes de Trabajo Comercial
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                ¡Hola, {user?.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                {user?.role === 'SOLICITANTE' && 'Gestiona tus solicitudes de producción publicitaria, sube briefs y revisa el material entregado.'}
                {user?.role === 'COORDINADOR' && 'Bandeja de recepción general: revisa solicitudes entrantes y asígnalas a los post-productores.'}
                {user?.role === 'POST_PRODUCTOR' && 'Aquí tienes tus órdenes asignadas para edición. Sube los masters terminados y avisa a las ejecutivas.'}
                {user?.role === 'ADMIN' && 'Panel de control maestro de producción comercial, auditoría y métricas de desempeño.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(user?.role === 'SOLICITANTE' || user?.role === 'COORDINADOR' || user?.role === 'ADMIN') && (
                <Link
                  href="/orders/new"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <FilePlus2 className="w-4 h-4" /> Crear Nueva SP
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Solicitudes</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                OT
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {stats?.total ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">En registro histórico</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">Nuevas / Pendientes</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">
              {stats?.new ?? 0}
            </p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Por asignar a post</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700">En Post-Producción</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-indigo-900 mt-2">
              {stats?.inProduction ?? 0}
            </p>
            <p className="text-[11px] text-indigo-700/80 mt-0.5">En proceso de edición</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">Resueltas / Listas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2">
              {(stats?.resolved ?? 0) + (stats?.approved ?? 0)}
            </p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">Entregadas y aprobadas</p>
          </div>
        </div>

        {/* Recent Production Orders Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Últimas Solicitudes de Producción (SP)
              </h2>
              <p className="text-xs text-slate-500">
                Seguimiento en tiempo real de material y fechas al aire.
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
            >
              Ver todas las órdenes <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Cargando órdenes...</div>
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No hay órdenes registradas. ¡Crea la primera SP!
              </div>
            ) : (
              recentOrders.map((order) => {
                const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.NUEVA;
                const priorityInfo = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.MEDIA;

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors block"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-mono font-bold text-xs flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[10px] text-cyan-400 font-bold">SP</span>
                        <span>{order.consecutive}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {order.clientAgency}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityInfo.badge}`}>
                            {priorityInfo.label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          <span className="text-slate-900 font-bold">Producto:</span> {order.product}
                          {order.program && (
                            <span className="ml-2 text-slate-500">
                              • <Tv className="w-3 h-3 inline mr-1 text-slate-400" />
                              {order.program}
                            </span>
                          )}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 flex-wrap">
                          <span>
                            👩‍💼 Ejecutiva: <strong className="text-slate-700">{order.creator?.name}</strong>
                          </span>
                          <span>
                            🎬 Post: <strong className="text-slate-700">{order.postProducer?.name || 'Sin asignar'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex sm:flex-col justify-between sm:justify-center items-end">
                      <div className="text-xs">
                        <span className="text-slate-400 block sm:inline mr-1 text-[11px]">Fecha al aire:</span>
                        <strong className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                          {order.airDate || 'Por definir'}
                        </strong>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Entrega mat: {order.materialDeliveryDate || 'N/A'}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
