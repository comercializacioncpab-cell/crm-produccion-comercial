'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  Medal, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clapperboard, 
  CheckCircle2, 
  Clock, 
  Tv, 
  Smartphone, 
  Send, 
  Award,
  Flame,
  UserCheck
} from 'lucide-react';

export default function MonthlyRankingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'production'>('sales');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  const isCoordinatorOrAdmin = user && ['ADMIN', 'COORDINADOR', 'PRODUCTOR_SENIOR', 'COORDINADOR_PRODUCTOR', 'JEFE_MONETIZACION'].includes(user.role);

  async function loadRanking(monthQuery: string = '') {
    setLoading(true);
    setNotifMessage(null);
    try {
      const url = monthQuery ? `/api/ranking?month=${monthQuery}` : '/api/ranking';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (!selectedMonth) {
          setSelectedMonth(json.selectedMonth);
        }
      }
    } catch (e) {
      console.error('Error fetching ranking:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRanking(selectedMonth);
  }, [selectedMonth]);

  const handleSendMonthEndRecognition = async () => {
    if (!selectedMonth) return;
    const confirmSend = window.confirm(
      `¿Deseas enviar las notificaciones oficiales de felicitación y reconocimiento de fin de mes para ${data?.monthLabel || selectedMonth}?`
    );
    if (!confirmSend) return;

    setSendingNotif(true);
    setNotifMessage(null);
    try {
      const res = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setNotifMessage(`✅ ${resJson.message} (${resJson.notificationsSent?.join(', ') || 'Notificados'})`);
      } else {
        setNotifMessage(`❌ Error: ${resJson.error || 'No se pudo enviar la felicitación'}`);
      }
    } catch (err: any) {
      setNotifMessage(`❌ Error de conexión: ${err.message}`);
    } finally {
      setSendingNotif(false);
    }
  };

  const topExec = data?.topExecutive;
  const topPost = data?.topPostProducer;
  const execRanking = data?.executiveRanking || [];
  const postRanking = data?.postProducerRanking || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Competencia Interna & Reconocimiento Oficial</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-400" />
                Ranking Mensual Ecuavisa
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Reconocimiento a las ejecutivas líderes en facturación ($ USD) y a los post-productores con mayor número de SPs atendidas y entregadas con excelencia técnica.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Selector de Mes */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl flex items-center gap-2 text-white">
                <Calendar className="w-4 h-4 ml-2 text-amber-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs py-1.5 pr-4 pl-1 outline-none cursor-pointer"
                >
                  {data?.availableMonths?.map((m: any) => (
                    <option key={m.key} value={m.key} className="bg-slate-900 text-white">
                      {m.label} ({m.count} SPs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Coordinación/Admin: Enviar reconocimiento fin de mes */}
              {isCoordinatorOrAdmin && (
                <button
                  type="button"
                  onClick={handleSendMonthEndRecognition}
                  disabled={sendingNotif}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Enviar notificación de felicitación de fin de mes a los #1 del ranking"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingNotif ? 'Enviando...' : 'Reconocimiento Fin de Mes'}
                </button>
              )}
            </div>
          </div>

          {/* Feedback banner */}
          {notifMessage && (
            <div className="mt-4 p-3 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white flex items-center justify-between">
              <span>{notifMessage}</span>
              <button onClick={() => setNotifMessage(null)} className="text-white/70 hover:text-white ml-2">×</button>
            </div>
          )}
        </div>

        {/* Info Note on Month-End Automation */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-900 shadow-2xs">
          <Award className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-black">Reconocimiento Automático de Fin de Mes (Días 30 / 31):</span>
            <span className="text-blue-800 ml-1">
              Al cierre de cada mes, el sistema envía automáticamente una felicitación formal a la ejecutiva #1 en facturación comercial y al post-productor #1 en entregas exitosas a través de su mesa de trabajo y correo institucional.
            </span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200">
            Cargando ranking y podios de honor...
          </div>
        ) : (
          <>
            {/* 🏆 WINNERS SPOTLIGHT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Sales Executive */}
              <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-300 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-8xl text-amber-500 pointer-events-none">
                  #1
                </div>
                <div>
                  <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs mb-3">
                    <span className="bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      🥇 #1 LÍDER COMERCIAL ({data?.monthLabel})
                    </span>
                  </div>
                  {topExec && topExec.commercialRevenue > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                        {topExec.initials}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{topExec.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{topExec.role === 'COORDINADORA_VENTAS' ? 'Coordinadora de Ventas' : 'Ejecutiva Comercial'}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-sm px-2.5 py-0.5 rounded-lg">
                            ${topExec.commercialRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                            {topExec.totalOrders} SPs creadas
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Sin órdenes comerciales registradas en este período.
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-bold">
                  <span>🏆 Mayor Facturación Comercial</span>
                  <span>Podio de Honor Ventas</span>
                </div>
              </div>

              {/* Top Post-Producer */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50/40 border-2 border-indigo-300 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-8xl text-indigo-500 pointer-events-none">
                  #1
                </div>
                <div>
                  <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs mb-3">
                    <span className="bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      🥇 #1 LÍDER EN PRODUCCIÓN ({data?.monthLabel})
                    </span>
                  </div>
                  {topPost && topPost.deliveredOrders > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                        {topPost.initials}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{topPost.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">Post-Productor / Editor / Productor</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 border border-blue-300 font-black text-sm px-2.5 py-0.5 rounded-lg">
                            {topPost.deliveredOrders} SPs Entregadas
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                            ⏱️ Promedio: {topPost.avgResolutionFormatted}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Sin entregas finalizadas registradas en este período.
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between text-xs text-indigo-900 font-bold">
                  <span>🎬 Mayor Volumen de Entregas</span>
                  <span>Podio de Honor Producción</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: SALES VS POST-PRODUCTION */}
            <div className="flex items-center justify-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'sales'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Ejecutivas (Ventas $)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('production')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'production'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clapperboard className="w-4 h-4" />
                <span>Post-Productores (SPs)</span>
              </button>
            </div>

            {/* PODIUM VIEW */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Podio de Honor • {activeTab === 'sales' ? 'Ingresos de Ventas ($ USD)' : 'SPs Entregadas y Atendidas'}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {data?.monthLabel}
                </span>
              </h2>

              {activeTab === 'sales' ? (
                /* Podium for Sales */
                <div>
                  <div className="flex items-end justify-center gap-2 sm:gap-6 pt-10 pb-4 max-w-2xl mx-auto">
                    {/* 2nd Place */}
                    <div className="flex-1 flex flex-col items-center">
                      {execRanking[1] ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-slate-200 border-2 border-slate-300 text-slate-700 font-black flex items-center justify-center text-sm shadow-sm mb-2">
                            {execRanking[1].initials}
                          </div>
                          <span className="text-xs font-black text-slate-800 text-center truncate max-w-[110px]">
                            {execRanking[1].name}
                          </span>
                          <span className="text-[11px] font-black text-emerald-700 mb-2">
                            ${execRanking[1].commercialRevenue.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <div className="h-16 flex items-center text-xs text-slate-300">—</div>
                      )}
                      <div className="w-full bg-slate-200 rounded-t-2xl h-28 flex flex-col items-center justify-center border-t-4 border-slate-400 shadow-inner">
                        <span className="text-2xl font-black text-slate-500">2</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">🥈 Plata</span>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex-1 flex flex-col items-center">
                      {execRanking[0] && execRanking[0].commercialRevenue > 0 ? (
                        <>
                          <div className="relative mb-2">
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                              👑
                            </span>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg">
                              {execRanking[0].initials}
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-900 text-center truncate max-w-[130px]">
                            {execRanking[0].name}
                          </span>
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mb-2">
                            ${execRanking[0].commercialRevenue.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <div className="h-24 flex items-center text-xs text-slate-300">—</div>
                      )}
                      <div className="w-full bg-gradient-to-b from-amber-300 to-yellow-400 rounded-t-2xl h-40 flex flex-col items-center justify-center border-t-4 border-amber-500 shadow-md">
                        <span className="text-3xl font-black text-amber-950">1</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">🥇 Oro</span>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex-1 flex flex-col items-center">
                      {execRanking[2] ? (
                        <>
                          <div className="w-11 h-11 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-900 font-black flex items-center justify-center text-xs shadow-sm mb-2">
                            {execRanking[2].initials}
                          </div>
                          <span className="text-xs font-black text-slate-800 text-center truncate max-w-[110px]">
                            {execRanking[2].name}
                          </span>
                          <span className="text-[11px] font-black text-emerald-700 mb-2">
                            ${execRanking[2].commercialRevenue.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <div className="h-16 flex items-center text-xs text-slate-300">—</div>
                      )}
                      <div className="w-full bg-amber-100/80 rounded-t-2xl h-20 flex flex-col items-center justify-center border-t-4 border-amber-400 shadow-inner">
                        <span className="text-xl font-black text-amber-800">3</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">🥉 Bronce</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Podium for Production */
                <div>
                  <div className="flex items-end justify-center gap-2 sm:gap-6 pt-10 pb-4 max-w-2xl mx-auto">
                    {/* 2nd Place */}
                    <div className="flex-1 flex flex-col items-center">
                      {postRanking[1] ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-slate-200 border-2 border-slate-300 text-slate-700 font-black flex items-center justify-center text-sm shadow-sm mb-2">
                            {postRanking[1].initials}
                          </div>
                          <span className="text-xs font-black text-slate-800 text-center truncate max-w-[110px]">
                            {postRanking[1].name}
                          </span>
                          <span className="text-[11px] font-black text-indigo-700 mb-2">
                            {postRanking[1].deliveredOrders} SPs entregadas
                          </span>
                        </>
                      ) : (
                        <div className="h-16 flex items-center text-xs text-slate-300">—</div>
                      )}
                      <div className="w-full bg-slate-200 rounded-t-2xl h-28 flex flex-col items-center justify-center border-t-4 border-slate-400 shadow-inner">
                        <span className="text-2xl font-black text-slate-500">2</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">🥈 Plata</span>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex-1 flex flex-col items-center">
                      {postRanking[0] && postRanking[0].deliveredOrders > 0 ? (
                        <>
                          <div className="relative mb-2">
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                              🏆
                            </span>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 border-2 border-indigo-400 text-white font-black flex items-center justify-center text-lg shadow-lg">
                              {postRanking[0].initials}
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-900 text-center truncate max-w-[130px]">
                            {postRanking[0].name}
                          </span>
                          <span className="text-xs font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md mb-2">
                            {postRanking[0].deliveredOrders} SPs entregadas
                          </span>
                        </>
                      ) : (
                        <div className="h-24 flex items-center text-xs text-slate-300">—</div>
                      )}
                      <div className="w-full bg-gradient-to-b from-indigo-500 to-blue-600 rounded-t-2xl h-40 flex flex-col items-center justify-center border-t-4 border-indigo-300 shadow-md text-white">
                        <span className="text-3xl font-black">1</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100">🥇 Oro</span>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex-1 flex flex-col items-center">
                      {postRanking[2] ? (
                        <>
                          <div className="w-11 h-11 rounded-2xl bg-blue-100 border-2 border-blue-300 text-blue-900 font-black flex items-center justify-center text-xs shadow-sm mb-2">
                            {postRanking[2].initials}
                          </div>
                          <span className="text-xs font-black text-slate-800 text-center truncate max-w-[110px]">
                            {postRanking[2].name}
                          </span>
                          <span className="text-[11px] font-black text-indigo-700 mb-2">
                            {postRanking[2].deliveredOrders} SPs entregadas
                          </span>
                        </>
                      ) : (
                        <div className="h-16 flex items-center text-xs text-slate-300">—</div>
                      )}
                      <div className="w-full bg-blue-100/80 rounded-t-2xl h-20 flex flex-col items-center justify-center border-t-4 border-blue-400 shadow-inner">
                        <span className="text-xl font-black text-blue-800">3</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">🥉 Bronce</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COMPLETE LEADERBOARD TABLE */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Tabla Completa de Posiciones • {activeTab === 'sales' ? 'Ejecutivas de Ventas' : 'Post-Productores & Editores'}
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Mostrando {activeTab === 'sales' ? execRanking.length : postRanking.length} integrantes
                </span>
              </div>

              <div className="overflow-x-auto">
                {activeTab === 'sales' ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 text-center w-16">Puesto</th>
                        <th className="py-3 px-4">Ejecutiva / Solicitante</th>
                        <th className="py-3 px-4 text-right">Facturación ($ USD)</th>
                        <th className="py-3 px-4 text-center">Total SPs</th>
                        <th className="py-3 px-4 text-center">📺 TV</th>
                        <th className="py-3 px-4 text-center">📱 Digital</th>
                        <th className="py-3 px-4 text-center">Finalizadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {execRanking.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No hay registros de ventas para este mes
                          </td>
                        </tr>
                      ) : (
                        execRanking.map((item: any) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              item.rank === 1 ? 'bg-amber-50/40 font-bold' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              {item.rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">
                                  🥇
                                </span>
                              ) : item.rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black">
                                  🥈
                                </span>
                              ) : item.rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black">
                                  🥉
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-slate-500">#{item.rank}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shrink-0">
                                  {item.initials}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{item.name}</span>
                                  <span className="text-[10px] text-slate-400 block">{item.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                ${item.commercialRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700">
                              {item.totalOrders}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-600">
                              {item.tvOrders}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-600">
                              {item.digitalOrders}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[11px]">
                                {item.completedOrders}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 text-center w-16">Puesto</th>
                        <th className="py-3 px-4">Post-Productor / Editor</th>
                        <th className="py-3 px-4 text-center">SPs Entregadas</th>
                        <th className="py-3 px-4 text-center">Asignadas</th>
                        <th className="py-3 px-4 text-center">📺 TV</th>
                        <th className="py-3 px-4 text-center">📱 Digital</th>
                        <th className="py-3 px-4 text-center">Tiempo Promedio SLA</th>
                        <th className="py-3 px-4 text-center">Cumplimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {postRanking.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No hay registros de post-producción para este mes
                          </td>
                        </tr>
                      ) : (
                        postRanking.map((item: any) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              item.rank === 1 ? 'bg-indigo-50/40 font-bold' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              {item.rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">
                                  🥇
                                </span>
                              ) : item.rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black">
                                  🥈
                                </span>
                              ) : item.rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black">
                                  🥉
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-slate-500">#{item.rank}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-xs shrink-0">
                                  {item.initials}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{item.name}</span>
                                  <span className="text-[10px] text-slate-400 block">{item.role}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-black text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                                {item.deliveredOrders}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700">
                              {item.attendedOrders}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-600">
                              {item.tvCount}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-600">
                              {item.digitalCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {item.avgResolutionFormatted}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                item.completionRate >= 80 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : item.completionRate >= 50 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {item.completionRate}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
