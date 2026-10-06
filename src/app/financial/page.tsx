'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2, 
  Calendar, 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Award,
  BarChart3,
  ChevronRight,
  FlaskConical,
  Check,
  Zap,
  ExternalLink
} from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/order-utils';

export default function FinancialDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'financial' | 'demos'>('financial');

  // Table filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedOrderType, setSelectedOrderType] = useState<'ALL' | 'COMMERCIAL_ONLY' | 'FROM_DEMO_ONLY' | 'DEMOS_ONLY'>('ALL');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/financial');
        if (res.status === 403) {
          setError('Acceso restringido: Esta sección es exclusiva para el Administrador General y Productor Senior.');
          return;
        }
        if (!res.ok) {
          throw new Error('Error al cargar datos financieros');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error al obtener ingresos');
      } finally {
        setLoading(false);
      }
    }

    if (user && (user.role === 'ADMIN' || user.role === 'PRODUCTOR_SENIOR')) {
      loadStats();
    } else if (user && user.role !== 'ADMIN' && user.role !== 'PRODUCTOR_SENIOR') {
      setError('Acceso restringido: Esta sección es exclusiva para Administradores y Productores Senior.');
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-slate-500">Calculando ingresos totales y métricas financieras...</p>
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

  // Filter orders for the table
  const filteredOrders = (data.orders || []).filter((ord: any) => {
    const matchesSearch = 
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.clientAgency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.executive?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const execId = ord.executiveId || ord.creatorId;
    const matchesExec = selectedExecutive === 'ALL' || execId === selectedExecutive;
    const matchesStatus = selectedStatus === 'ALL' || ord.status === selectedStatus;

    let matchesMonth = true;
    if (selectedMonth !== 'ALL') {
      const d = new Date(ord.createdAt);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      matchesMonth = mKey === selectedMonth;
    }

    let matchesType = true;
    if (selectedOrderType === 'COMMERCIAL_ONLY') {
      matchesType = !ord.isDemo && !ord.sourceDemoId;
    } else if (selectedOrderType === 'FROM_DEMO_ONLY') {
      matchesType = !ord.isDemo && Boolean(ord.sourceDemoId);
    } else if (selectedOrderType === 'DEMOS_ONLY') {
      matchesType = Boolean(ord.isDemo);
    }

    return matchesSearch && matchesExec && matchesStatus && matchesMonth && matchesType;
  });

  const filteredTotalValue = filteredOrders.reduce((acc: number, curr: any) => acc + (curr.packageValue || 0), 0);

  // Delivered/Approved Revenue vs Pending
  const approvedRevenue = (data.statusList || [])
    .filter((s: any) => s.status === 'APROBADA' || s.status === 'ENTREGADO')
    .reduce((acc: number, curr: any) => acc + curr.totalRevenue, 0);

  const inProgressRevenue = (data.statusList || [])
    .filter((s: any) => s.status === 'EN_PROCESO' || s.status === 'ASIGNADA' || s.status === 'CAMBIOS_SOLICITADOS')
    .reduce((acc: number, curr: any) => acc + curr.totalRevenue, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Control Financiero y Métricas de Conversión
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <DollarSign className="w-8 h-8 text-emerald-400 bg-emerald-500/20 rounded-2xl p-1 border border-emerald-500/40" />
              Ingresos Totales y Efectividad de DEMOs
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Consolidación en tiempo real del valor comercial facturado y seguimiento a las muestras (DEMOs) convertidas en ventas oficiales.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-right min-w-[200px]">
            <span className="text-[11px] text-emerald-200 block font-bold uppercase tracking-wider">
              Facturación Bruta Total
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ${data.totalRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5">
              En {data.totalCommercialOrders || data.totalOrders} órdenes comerciales
            </span>
          </div>
        </div>

        {/* 🌟 4 KPI TOP CARDS (FACTURACIÓN GENERAL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Recaudado (Aprobado)</p>
              <h3 className="text-xl font-black text-emerald-600 font-mono mt-1">
                ${approvedRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">SPs Aprobadas / Entregadas</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">En Proceso / Producción</p>
              <h3 className="text-xl font-black text-cyan-600 font-mono mt-1">
                ${inProgressRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">En curso en salas de edición</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ticket Promedio por Venta</p>
              <h3 className="text-xl font-black text-slate-900 font-mono mt-1">
                ${data.averageTicket.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Valor medio por paquete</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Solicitudes (SPs)</p>
              <h3 className="text-xl font-black text-slate-900 font-mono mt-1">
                {data.totalOrders}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {data.totalCommercialOrders || 0} Comerciales • {data.totalDemos || 0} DEMOs
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 🧪 SECCIÓN DESTACADA: EFECTIVIDAD Y CONVERSIÓN DE DEMOS A VENTAS */}
        <div className="bg-gradient-to-br from-purple-950 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-lg border border-purple-800/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/40 text-purple-300 flex items-center justify-center font-bold text-lg shadow-inner">
                🧪
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Efectividad Comercial de DEMOs ($0 USD ➔ Ventas Reales)
                </h2>
                <p className="text-xs text-purple-200">
                  Métricas de cuántas muestras y pilotos piloto terminaron convirtiéndose en contratos comerciales facturados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-purple-400/20 text-purple-200 font-bold px-3 py-1 rounded-full border border-purple-400/30">
                Tasa de Cierre: <strong className="text-emerald-400 font-black">{data.demoConversionRate}%</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Total DEMOs Solicitados</span>
              <p className="text-2xl font-black text-white font-mono">{data.totalDemos || 0}</p>
              <span className="text-[10px] text-purple-200 block">Pilotos creados a costo $0</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">DEMOs Convertidos en Venta</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {data.totalDemosSold || 0} <span className="text-xs text-purple-200 font-normal">de {data.totalDemos || 0}</span>
              </p>
              <span className="text-[10px] text-emerald-200 block">✓ Cerraron contrato comercial</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">DEMOs Pendientes de Cierre</span>
              <p className="text-2xl font-black text-amber-300 font-mono">{data.totalDemosPending || 0}</p>
              <span className="text-[10px] text-amber-200 block">⏳ En evaluación con clientes</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-emerald-400/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Facturación por DEMOs</span>
              <p className="text-2xl font-black text-emerald-300 font-mono">
                ${(data.revenueFromDemos || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-200 block">Ingresos generados por DEMOs</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center text-xs font-bold text-slate-700">
            <button
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'financial' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-600" /> Facturación y Detalle de Solicitudes
            </button>
            <button
              onClick={() => setActiveTab('demos')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'demos' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-purple-600" /> Registro de Conversión de DEMOs ({data.totalDemos || 0})
            </button>
          </div>
        </div>

        {/* TAB 1: FINANCIAL & RANKINGS */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Breakdown Grids: Executives Ranking & Top Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Executive Performance Ranking */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-slate-900">Ranking por Ejecutiva de Ventas</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{data.executiveList?.length || 0} Ejecutivas</span>
                </div>

                <div className="p-5 flex-1 divide-y divide-slate-100">
                  {(!data.executiveList || data.executiveList.length === 0) ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No hay datos registrados aún.</p>
                  ) : (
                    data.executiveList.map((exec: any, idx: number) => {
                      const percent = data.totalRevenue > 0 ? (exec.totalRevenue / data.totalRevenue) * 100 : 0;
                      return (
                        <div key={exec.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                              idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              idx === 1 ? 'bg-slate-200 text-slate-800' :
                              idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              #{idx + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{exec.name}</h4>
                              <p className="text-[10px] text-slate-400">
                                {exec.count} SPs Comerciales ({percent.toFixed(1)}%) • {exec.demosSoldCount || 0}/{exec.demosCount || 0} DEMOs vendidos
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <strong className="text-sm font-black text-emerald-600 font-mono block">
                              ${exec.totalRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Prom: ${exec.count > 0 ? (exec.totalRevenue / exec.count).toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top Clients by Revenue */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-sm text-slate-900">Top Clientes / Agencias</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{data.clientList?.length || 0} Clientes</span>
                </div>

                <div className="p-5 flex-1 divide-y divide-slate-100">
                  {(!data.clientList || data.clientList.length === 0) ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No hay clientes registrados aún.</p>
                  ) : (
                    data.clientList.slice(0, 5).map((cl: any, idx: number) => {
                      const percent = data.totalRevenue > 0 ? (cl.totalRevenue / data.totalRevenue) * 100 : 0;
                      return (
                        <div key={cl.clientAgency} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{cl.clientAgency}</h4>
                              <p className="text-[10px] text-slate-400">{cl.count} {cl.count === 1 ? 'campaña' : 'campañas'} ({percent.toFixed(1)}%)</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <strong className="text-sm font-black text-slate-900 font-mono block">
                              ${cl.totalRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-mono">
                              USD
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Breakdown Bar / List */}
            {data.monthlyList && data.monthlyList.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-900">Evolución de Ingresos por Mes</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Facturación mensual</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.monthlyList.map((m: any) => {
                    const maxVal = Math.max(...data.monthlyList.map((x: any) => x.totalRevenue), 1);
                    const barWidth = Math.max((m.totalRevenue / maxVal) * 100, 4);
                    return (
                      <div key={m.monthKey} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{m.monthLabel}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">{m.count} SPs</span>
                        </div>
                        <p className="text-base font-black text-emerald-600 font-mono">
                          ${m.totalRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DETAILED ORDERS FINANCIAL TABLE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-600" /> Detalle de Solicitudes y Valores
                  </h3>
                  <p className="text-[11px] text-slate-400">Filtra por tipo de venta, ejecutiva, estado y fecha de producción</p>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-800">Total filtrado:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    ${filteredTotalValue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar SP, cliente, producto..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <select
                    value={selectedOrderType}
                    onChange={(e: any) => setSelectedOrderType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Todo Tipo de SPs</option>
                    <option value="COMMERCIAL_ONLY">💰 Ventas Directas</option>
                    <option value="FROM_DEMO_ONLY">🎯 Ventas desde DEMO</option>
                    <option value="DEMOS_ONLY">🧪 DEMOs Solicitados ($0)</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedExecutive}
                    onChange={(e) => setSelectedExecutive(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Todas las Ejecutivas</option>
                    {data.executiveList?.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="NUEVA">Nuevas</option>
                    <option value="ASIGNADA">Asignadas</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="RESUELTA">Resueltas / Entregadas</option>
                    <option value="CON_CAMBIOS">Con Cambios</option>
                    <option value="APROBADA">Aprobadas</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Todos los Meses</option>
                    {data.monthlyList?.map((m: any) => (
                      <option key={m.monthKey} value={m.monthKey}>{m.monthLabel}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Código SP</th>
                      <th className="p-3">Origen / Tipo</th>
                      <th className="p-3">Ejecutiva</th>
                      <th className="p-3">Cliente / Agencia</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Valor Paquete</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                          No se encontraron órdenes con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord: any) => {
                        const statusInfo = STATUS_CONFIG[ord.status] || STATUS_CONFIG.NUEVA;
                        const isDemo = Boolean(ord.isDemo);
                        const isFromDemo = Boolean(ord.sourceDemoId);

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              <Link href={`/orders/${ord.id}`} className="hover:text-blue-600 hover:underline">
                                {ord.orderNumber}
                              </Link>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              {isDemo ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  ord.demoStatus === 'VENDIDO'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-purple-100 text-purple-800 border-purple-300'
                                }`}>
                                  {ord.demoStatus === 'VENDIDO' ? '🧪 DEMO Vendido' : '🧪 DEMO ($0)'}
                                </span>
                              ) : isFromDemo ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1 w-fit">
                                  🎯 Venta de DEMO
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  💰 Venta Directa
                                </span>
                              )}
                            </td>

                            <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                              {ord.executive?.name || ord.creator?.name}
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {ord.clientAgency}
                            </td>
                            <td className="p-3 text-slate-600">
                              {ord.product}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(ord.createdAt).toLocaleDateString('es-EC')}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-black text-xs whitespace-nowrap">
                              {isDemo ? (
                                <span className="text-slate-400 font-bold">$0.00</span>
                              ) : (
                                <span className="text-emerald-600 font-black">
                                  ${Number(ord.packageValue || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
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
        )}

        {/* TAB 2: DETALLE Y CONVERSIÓN DE DEMOS */}
        {activeTab === 'demos' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" /> Historial de DEMOs y Conversiones en Ventas
                </h3>
                <p className="text-[11px] text-slate-400">
                  Registro de cada muestra piloto solicitada, si concluyó en venta comercial y la facturación lograda.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{data.totalDemosSold || 0} de {data.totalDemos || 0} Vendidos ({data.demoConversionRate}%)</span>
                </div>
                <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-900 font-mono">
                  ${(data.revenueFromDemos || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Código DEMO</th>
                    <th className="p-3">Fecha Solicitud</th>
                    <th className="p-3">Ejecutiva</th>
                    <th className="p-3">Cliente / Agencia</th>
                    <th className="p-3">Producto / Programa</th>
                    <th className="p-3">Estado del DEMO</th>
                    <th className="p-3">SP de Venta Conectada</th>
                    <th className="p-3 text-right">Facturación Generada</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {(!data.demosList || data.demosList.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400 text-xs">
                        🧪 Aún no hay solicitudes de DEMO registradas en el sistema.
                      </td>
                    </tr>
                  ) : (
                    data.demosList.map((demo: any) => {
                      const isSold = demo.demoStatus === 'VENDIDO';
                      return (
                        <tr key={demo.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-purple-900 whitespace-nowrap">
                            <Link href={`/orders/${demo.id}`} className="hover:underline flex items-center gap-1">
                              <span>🧪 {demo.orderNumber}</span>
                            </Link>
                          </td>
                          <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(demo.createdAt).toLocaleDateString('es-EC')}
                          </td>
                          <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                            {demo.executive?.name || demo.creator?.name}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {demo.clientAgency}
                          </td>
                          <td className="p-3 text-slate-600">
                            <span>{demo.product}</span>
                            {demo.program && <span className="text-[10px] text-slate-400 block">{demo.program}</span>}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isSold ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> VENDIDO
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pendiente de Venta
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono whitespace-nowrap">
                            {demo.convertedOrderNumber ? (
                              <Link
                                href={`/orders/${demo.convertedOrderId}`}
                                className="text-blue-700 hover:underline font-bold inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                              >
                                💰 {demo.convertedOrderNumber} <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Sin orden de venta aún</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-xs whitespace-nowrap">
                            {demo.generatedRevenue > 0 ? (
                              <span className="text-emerald-600 font-black">
                                ${Number(demo.generatedRevenue).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold">$0.00</span>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <Link
                              href={`/orders/${demo.id}`}
                              className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold text-[11px]"
                            >
                              Ver DEMO <ChevronRight className="w-3.5 h-3.5" />
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
        )}
      </div>
    </AppLayout>
  );
}
