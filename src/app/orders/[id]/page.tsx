'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Upload, 
  MessageSquare, 
  Download, 
  UserCheck, 
  Sparkles, 
  ArrowLeft,
  Tv,
  Radio,
  ExternalLink,
  RotateCcw,
  Check,
  Play,
  PlayCircle,
  Calendar,
  Layers,
  ChevronRight,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { 
  STATUS_CONFIG, 
  PRIORITY_CONFIG, 
  SPONSORSHIP_OPTIONS,
  formatDateTime,
  formatDate,
  getWorkflowStageIndex
} from '@/lib/order-utils';

export default function OrderDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [postProducers, setPostProducers] = useState<any[]>([]);
  
  // Action Modals & States
  const [selectedPostId, setSelectedPostId] = useState('');
  const [assignPriority, setAssignPriority] = useState('MEDIA');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [deliveryExternalUrl, setDeliveryExternalUrl] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [acceptCostChecked, setAcceptCostChecked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        if (data.order.postProducerId) {
          setSelectedPostId(data.order.postProducerId);
        }
        if (data.order.priority) {
          setAssignPriority(data.order.priority);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostProducers = async () => {
    try {
      const res = await fetch('/api/users?role=POST_PRODUCTOR');
      if (res.ok) {
        const data = await res.json();
        setPostProducers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchPostProducers();
  }, [orderId]);

  // Handle Assign Post-Producer (Coordinator / Admin)
  const handleAssign = async () => {
    if (!selectedPostId) {
      setMsg({ type: 'error', text: 'Selecciona un post-productor para asignar.' });
      return;
    }
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          postProducerId: selectedPostId,
          priority: assignPriority,
        }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Orden asignada exitosamente! Se registró la fecha y hora exacta y se notificó por WhatsApp/Email.' });
        fetchOrder();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al asignar la orden.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Start Work / Confirm Reception (Post-Producer)
  const handleStartWork = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START_WORK' }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Recepción confirmada! Se registró la hora de inicio y se notificó a la ejecutiva.' });
        fetchOrder();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al confirmar recepción de la orden.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Resolve Delivery (Post-Producer)
  const handleResolveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    try {
      let uploadedFileName = '';
      let uploadedFilePath = '';

      // Upload deliverable file if provided
      if (deliveryFile) {
        const uploadData = new FormData();
        uploadData.append('file', deliveryFile);
        uploadData.append('fileType', 'OUTPUT_DELIVERY');
        uploadData.append('notes', deliveryNotes || 'Entrega final de post-producción');

        const fileRes = await fetch(`/api/orders/${order.id}/files`, {
          method: 'POST',
          body: uploadData,
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          uploadedFileName = fileData.file.fileName;
          uploadedFilePath = fileData.file.filePath;
        }
      }

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_DELIVERY',
          deliveryNotes,
          fileName: uploadedFileName || (deliveryExternalUrl ? 'Master en la nube' : 'Entrega Final'),
          fileUrl: uploadedFilePath,
          externalUrl: deliveryExternalUrl,
        }),
      });

      if (res.ok) {
        setMsg({ type: 'success', text: '¡Trabajo entregado con hora registrada! Se notificó a la ejecutiva solicitante para su aprobación.' });
        setDeliveryFile(null);
        setDeliveryNotes('');
        setDeliveryExternalUrl('');
        fetchOrder();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al registrar la entrega.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request Changes (Solicitante / Coordinator)
  const handleRequestChanges = async () => {
    if (!changeNotes) {
      setMsg({ type: 'error', text: 'Por favor detalla los cambios o ajustes requeridos.' });
      return;
    }

    const currentChanges = order.changesCount || 0;
    const nextChangeNum = currentChanges + 1;

    if (nextChangeNum >= 3 && !acceptCostChecked) {
      setMsg({ type: 'error', text: 'Debes marcar la casilla aceptando el costo adicional para proceder a partir del 3er cambio solicitado.' });
      return;
    }

    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_CHANGES',
          changeNotes,
          acceptExtraCost: acceptCostChecked || nextChangeNum < 3,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar cambios');
      }

      setMsg({ 
        type: 'success', 
        text: `¡Solicitud de Cambio #${nextChangeNum} registrada exitosamente! ${nextChangeNum >= 3 ? '(Con Costo Adicional aceptado)' : ''}` 
      });
      setShowChangesModal(false);
      setChangeNotes('');
      setAcceptCostChecked(false);
      fetchOrder();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error al registrar cambios.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Approve (Solicitante / Coordinator)
  const handleApprove = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Excelente! La orden ha sido APROBADA con fecha y hora registrada. Lista para emisión al aire.' });
        fetchOrder();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al aprobar la orden.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Cargando detalles de la SP y trazabilidad...</p>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <p className="text-base font-bold text-slate-800">Orden no encontrada</p>
          <Link href="/orders" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Volver a la lista
          </Link>
        </div>
      </AppLayout>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.NUEVA;
  const priorityInfo = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.MEDIA;
  const sponsorshipParsed = (() => {
    try {
      return JSON.parse(order.sponsorshipTypes || '[]');
    } catch {
      return [];
    }
  })();

  const inputFiles = (order.files || []).filter((f: any) => f.fileType.startsWith('INPUT'));
  const outputFiles = (order.files || []).filter((f: any) => f.fileType.startsWith('OUTPUT'));

  // Activity logs timestamps extraction for step visualization
  const logs = order.activityLogs || [];
  const logCreated = logs.find((l: any) => l.action === 'CREADA') || { createdAt: order.createdAt };
  const logAssigned = logs.find((l: any) => l.action === 'ASIGNADA');
  const logStarted = logs.find((l: any) => l.action === 'EN_PRODUCCION' || l.action === 'EN_PROCESO');
  const logDelivered = logs.find((l: any) => l.action === 'ENTREGADA' || l.action === 'RESUELTA') || (order.deliveredAt ? { createdAt: order.deliveredAt } : null);
  const logLastChange = logs.find((l: any) => l.action === 'CAMBIOS');
  const logApproved = logs.find((l: any) => l.action === 'APROBADA') || (order.approvedAt ? { createdAt: order.approvedAt } : null);

  const stageIndex = getWorkflowStageIndex(order.status);
  const currentProgressPercent = order.status === 'APROBADA' || order.status === 'AL_AIRE' 
    ? 100 
    : order.status === 'RESUELTA' || order.status === 'ENTREGADO' 
    ? 80 
    : order.status === 'CON_CAMBIOS'
    ? 65
    : order.status === 'EN_PROCESO' 
    ? 50 
    : order.status === 'ASIGNADA' 
    ? 30 
    : 15;

  const nextChangeCount = (order.changesCount || 0) + 1;

  // WhatsApp direct text generator
  const waShareText = encodeURIComponent(
    `📋 *Solicitud de Producción Comercial*\n` +
    `*Código:* ${order.orderNumber}\n` +
    `*Cliente:* ${order.clientAgency}\n` +
    `*Producto:* ${order.product}\n` +
    `*Fecha al aire:* ${order.airDate || 'Por definir'}\n` +
    `*Estado:* ${statusInfo.label}\n` +
    `*Ejecutiva:* ${order.creator?.name}`
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 font-mono">
                  {order.orderNumber}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                  {statusInfo.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityInfo.badge}`}>
                  {priorityInfo.label}
                </span>
                {order.packageValue > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    💰 ${Number(order.packageValue).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                )}
                {order.changesCount > 0 && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border flex items-center gap-1 ${
                    order.changesCount >= 3 
                      ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {order.changesCount >= 3 ? '⚠️' : '🔄'} {order.changesCount} {order.changesCount === 1 ? 'Cambio' : 'Cambios'}
                    {order.changesCount >= 3 && ' (Costo Adicional)'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.clientAgency} • {order.product} • Creada el {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct WhatsApp Share */}
            <a
              href={`https://wa.me/?text=${waShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Compartir WhatsApp
            </a>

            {/* Print Official Format (replicates Excel) */}
            <Link
              href={`/orders/${order.id}/print`}
              target="_blank"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" /> Formato Oficial (Imprimir / PDF)
            </Link>
          </div>
        </div>

        {msg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        {/* WORKFLOW ACTION PANELS & CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#fef08a] px-6 py-2.5 border-b border-yellow-300 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-yellow-950">
                  INFORMACIÓN GENERAL
                </span>
                <span className="text-xs font-mono font-bold text-yellow-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Ejecutiva de Ventas:</span>
                  <strong className="text-slate-900 font-bold">{order.creator?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Cliente / Agencia:</span>
                  <strong className="text-slate-900 font-bold">{order.clientAgency}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Producto:</span>
                  <strong className="text-slate-900 font-bold">{order.product}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Programa:</span>
                  <strong className="text-slate-900 font-bold">{order.program || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[11px] font-bold">Valor Paquete:</span>
                  <strong className="text-emerald-900 font-black text-sm">
                    ${Number(order.packageValue || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: MATERIAL Y FECHAS */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#fef08a] px-6 py-2.5 border-b border-yellow-300 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-yellow-950">
                  MATERIAL
                </span>
                <span className="text-xs font-bold text-yellow-900">
                  Brief: {order.hasBrief ? 'SI [✓]' : 'NO [ ]'}
                </span>
              </div>
              <div className="p-6 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block font-semibold">Fecha de entrega de material:</span>
                    <strong className="text-slate-800 font-bold text-sm">{order.materialDeliveryDate || 'N/A'}</strong>
                  </div>
                  <div className="bg-red-50/50 p-3 rounded-xl border border-red-200">
                    <span className="text-red-600 text-[11px] block font-bold">Fecha al aire:</span>
                    <strong className="text-red-700 font-bold text-sm">{order.airDate || 'Por definir'}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block font-semibold mb-1">Notas / Especificaciones:</span>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap">
                    {order.materialNotes || 'Sin notas adicionales especificadas.'}
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: TIPO DE AUSPICIO & LOCUCIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-indigo-600" /> Tipos de Auspicio
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {sponsorshipParsed.length === 0 ? (
                    <span className="text-xs text-slate-400">Ninguno especificado</span>
                  ) : (
                    sponsorshipParsed.map((id: string) => {
                      const opt = SPONSORSHIP_OPTIONS.find((s) => s.id === id);
                      return (
                        <span key={id} className="bg-indigo-50 text-indigo-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-200">
                          {opt?.label || id}
                        </span>
                      );
                    })
                  )}
                  {order.customSponsorship && (
                    <span className="bg-purple-50 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-purple-200">
                      Otro: {order.customSponsorship}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-cyan-600" /> Locución ({order.voiceoverType})
                </h3>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-mono whitespace-pre-wrap text-slate-700 max-h-32 overflow-y-auto">
                  {order.voiceoverText || 'Sin texto de locución redactado.'}
                </div>
              </div>
            </div>

            {/* ARCHIVOS Y MATERIALES ADJUNTOS */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Insumos y Materiales Adjuntos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Inputs / Briefs */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    📥 Insumos Iniciales ({inputFiles.length}):
                  </span>
                  {inputFiles.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">No hay insumos adjuntos.</p>
                  ) : (
                    inputFiles.map((f: any) => (
                      <div key={f.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[180px]">📄 {f.fileName}</span>
                        {f.filePath && (
                          <a href={f.filePath} download target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px]">
                            <Download className="w-3.5 h-3.5" /> Descargar
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Outputs / Deliverables */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    🎬 Entregables de Post-Producción ({outputFiles.length}):
                  </span>
                  {outputFiles.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">Aún no se ha subido el material final resuelto.</p>
                  ) : (
                    outputFiles.map((f: any) => (
                      <div key={f.id} className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-900 truncate max-w-[180px]">✨ {f.fileName}</span>
                        <div className="flex items-center gap-2">
                          {f.externalUrl && (
                            <a href={f.externalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold flex items-center gap-1 text-[11px]">
                              <ExternalLink className="w-3 h-3" /> Nube
                            </a>
                          )}
                          {f.filePath && (
                            <a href={f.filePath} download target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline font-bold flex items-center gap-1 text-[11px]">
                              <Download className="w-3.5 h-3.5" /> Archivo
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action & Activity Column (1 col) */}
          <div className="space-y-6">
            {/* PANEL 1: ASIGNACIÓN A POST-PRODUCTOR (Coordinador / Admin) */}
            {(user?.role === 'COORDINADOR' || user?.role === 'ADMIN') && (
              <div className="bg-white rounded-3xl border border-purple-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Coordinación y Asignación</h3>
                    <p className="text-[11px] text-slate-500">Asignar editor responsable</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Post-Productor Asignado:
                    </label>
                    <select
                      value={selectedPostId}
                      onChange={(e) => setSelectedPostId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Seleccionar Post-Productor --</option>
                      {postProducers.map((p) => (
                        <option key={p.id} value={p.id}>
                          🎬 {p.name} ({p.phone || 'Sin tel'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prioridad:
                    </label>
                    <select
                      value={assignPriority}
                      onChange={(e) => setAssignPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAssign}
                    disabled={actionLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    {actionLoading ? 'Asignando...' : 'Asignar y Notificar a Post'}
                  </button>
                </div>
              </div>
            )}

            {/* PANEL 2: POST-PRODUCTOR ACCIONES (Recepción y Entrega) */}
            {(user?.role === 'POST_PRODUCTOR' || user?.role === 'ADMIN') && (
              <div className="bg-white rounded-3xl border border-blue-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    🎬
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Acciones del Post-Productor</h3>
                    <p className="text-[11px] text-slate-500">
                      {order.postProducer?.name ? `Asignado a: ${order.postProducer.name}` : 'Sin asignar'}
                    </p>
                  </div>
                </div>

                {/* Sub-Action A: Si la orden está ASIGNADA, botón para Confirmar Recepción e Iniciar */}
                {order.status === 'ASIGNADA' && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-blue-950">Orden Asignada Pendiente</p>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          Haz clic para registrar la hora en que recibes el trámite y comienzas la edición.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleStartWork}
                      disabled={actionLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      {actionLoading ? 'Registrando recepción...' : 'Confirmar Recepción e Iniciar Edición'}
                    </button>
                  </div>
                )}

                {/* Sub-Action B: Formulario de Entrega Final de Post */}
                {(order.status === 'EN_PROCESO' || order.status === 'CON_CAMBIOS' || order.status === 'ASIGNADA' || user?.role === 'ADMIN') && (
                  <form onSubmit={handleResolveDelivery} className="space-y-3 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Subir Video / Master Resuelto:
                    </span>

                    <div>
                      <input
                        type="file"
                        onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        O Enlace Externo (Drive / Frame.io / Vimeo):
                      </label>
                      <input
                        type="url"
                        value={deliveryExternalUrl}
                        onChange={(e) => setDeliveryExternalUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Notas de Entrega:
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Ej. Master en ProRes y MP4, audio -24 LUFS..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {actionLoading ? 'Procesando entrega...' : 'Marcar como Resuelta y Entregar'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* PANEL 3: APROBACIÓN Y REVISIÓN (Solicitante / Coordinadora / Admin) */}
            {(user?.role === 'SOLICITANTE' || user?.role === 'COORDINADOR' || user?.role === 'ADMIN') && (
              <div className="bg-white rounded-3xl border border-emerald-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    ✅
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Aprobación Final de la SP</h3>
                    <p className="text-[11px] text-slate-500">Autorización para emisión al aire</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Aprobar Solicitud (Listo al Aire)
                  </button>

                  <button
                    onClick={() => {
                      setAcceptCostChecked(false);
                      setShowChangesModal(true);
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Solicitar Ajustes / Cambios {order.changesCount > 0 && `(Actual: ${order.changesCount})`}
                  </button>
                </div>

                {order.approved && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs">
                    <p className="font-bold">✓ Aprobado por: {order.approvedBy || 'Ejecutiva'}</p>
                    <span className="text-[10px] text-teal-700 block mt-0.5">
                      Hora de Aprobación: {formatDateTime(order.approvedAt || order.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 🌟 BARRA DE PROCESO / STEPPER VISUAL CON PASO DE CAMBIOS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-600" /> Progreso del Trámite
                  </h3>
                  <p className="text-[11px] text-slate-400">Avance de la Solicitud por Etapas</p>
                </div>
                <span className="text-xs font-black font-mono text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                  {currentProgressPercent}%
                </span>
              </div>

              {/* Dynamic Fill Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    order.status === 'APROBADA' || order.status === 'AL_AIRE'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                      : order.status === 'CON_CAMBIOS'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                  }`}
                  style={{ width: `${currentProgressPercent}%` }}
                ></div>
              </div>

              {/* 6 Steps Vertical Timeline (Including Solicitud de Cambios) */}
              <div className="space-y-3 pt-1">
                {/* Paso 1: Recepción / Creada */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                    ✓
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">1. Solicitud Recibida</span>
                      <span className="text-[10px] font-semibold text-emerald-700">Completado</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Por {order.creator?.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      🕒 {formatDateTime(logCreated?.createdAt || order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Paso 2: Asignación */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                    order.postProducerId
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {order.postProducerId ? '✓' : '2'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">2. Asignada a Post</span>
                      <span className={`text-[10px] font-semibold ${order.postProducerId ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {order.postProducerId ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {order.postProducer?.name ? `Editor: ${order.postProducer.name}` : 'Esperando asignación'}
                    </p>
                    {logAssigned && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        🕒 {formatDateTime(logAssigned.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Paso 3: En Edición / Proceso */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                    stageIndex >= 2
                      ? 'bg-emerald-500 text-white'
                      : order.status === 'ASIGNADA'
                      ? 'bg-cyan-500 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {stageIndex >= 2 ? '✓' : '3'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">3. En Producción</span>
                      <span className={`text-[10px] font-semibold ${stageIndex >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {stageIndex >= 2 ? 'En Curso / Listo' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Edición y musicalización</p>
                    {logStarted && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        🕒 {formatDateTime(logStarted.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Paso 4: Material Entregado */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                    stageIndex >= 3
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {stageIndex >= 3 ? '✓' : '4'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">4. Material Entregado</span>
                      <span className={`text-[10px] font-semibold ${stageIndex >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {stageIndex >= 3 ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Master subido para revisión</p>
                    {logDelivered && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        🕒 {formatDateTime(logDelivered.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Paso 5: Solicitud de Cambios (Condicional) */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                    order.approved && (!order.changesCount || order.changesCount === 0)
                      ? 'bg-slate-200 text-slate-400'
                      : order.changesCount >= 3
                      ? 'bg-amber-500 text-white'
                      : order.changesCount > 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {order.approved && (!order.changesCount || order.changesCount === 0) ? '—' : order.changesCount > 0 ? '🔄' : '5'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">5. Solicitud de Cambios</span>
                      {order.approved && (!order.changesCount || order.changesCount === 0) ? (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Omitido (Aprobada sin cambios ✓)
                        </span>
                      ) : order.changesCount > 0 ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          order.changesCount >= 3 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {order.changesCount} {order.changesCount === 1 ? 'cambio' : 'cambios'} {order.changesCount >= 3 && '⚠️ Costo Adic.'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">No requerido aún</span>
                      )}
                    </div>

                    {order.changesCount > 0 && (
                      <div className="space-y-0.5 mt-0.5">
                        <p className="text-[11px] text-slate-600">
                          {order.changesCount >= 3 
                            ? `⚠️ Se superó el límite base (2 cambios). Cambio #${order.changesCount} con costo adicional aceptado.` 
                            : `Cambio #${order.changesCount} procesado por post-producción.`}
                        </p>
                        {logLastChange && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            🕒 Último cambio: {formatDateTime(logLastChange.createdAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Paso 6: Aprobada al Aire */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                    order.approved || order.status === 'APROBADA' || order.status === 'AL_AIRE'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {order.approved ? '✓' : '6'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">6. Aprobada al Aire</span>
                      <span className={`text-[10px] font-semibold ${order.approved ? 'text-teal-700' : 'text-slate-400'}`}>
                        {order.approved ? 'Aprobada' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {order.approved ? `Por: ${order.approvedBy || 'Ejecutiva'}` : 'Autorización comercial'}
                    </p>
                    {logApproved && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        🕒 {formatDateTime(logApproved.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 4: HISTORIAL DE TRAZABILIDAD (Con Fecha y Hora Exacta) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600" /> Historial de Trazabilidad
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  {order.activityLogs?.length || 0} registros
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(!order.activityLogs || order.activityLogs.length === 0) ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Sin actividad registrada aún.</p>
                ) : (
                  order.activityLogs.map((log: any) => (
                    <div key={log.id} className="text-xs border-l-2 border-cyan-500 pl-3 py-1 space-y-1 bg-slate-50/50 rounded-r-xl pr-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[11px] uppercase tracking-wide ${
                          log.action === 'CAMBIOS' ? 'text-rose-700' : log.action === 'APROBADA' ? 'text-teal-700' : 'text-slate-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-600" />
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{log.details}</p>
                      {log.user && (
                        <span className="text-[10px] text-slate-400 block font-medium">
                          👤 {log.user.name} ({log.user.role})
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Solicitud de Cambios con Advertencia de Costo a partir del 3er Cambio */}
        {showChangesModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" /> Solicitar Correcciones / Cambios
                </h3>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                  Cambio #{nextChangeCount}
                </span>
              </div>

              {/* ⚠️ ADVERTENCIA DE COSTO ADICIONAL A PARTIR DEL 3ER CAMBIO */}
              {nextChangeCount >= 3 && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>¡ADVERTENCIA: COSTO ADICIONAL POR CAMBIO #{nextChangeCount}!</span>
                  </div>
                  
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    El paquete de producción base incluye un máximo de <strong>2 cambios gratuitos</strong>. 
                    A partir de esta <strong>{nextChangeCount}ª solicitud de cambios</strong>, se generará un 
                    <strong> costo adicional de edición y render</strong> para el cliente.
                  </p>

                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer bg-white/80 p-2.5 rounded-xl border border-amber-300">
                    <input
                      type="checkbox"
                      checked={acceptCostChecked}
                      onChange={(e) => setAcceptCostChecked(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-amber-950 leading-tight">
                      Confirmo que se ha notificado al cliente y <u>Acepto el Costo Adicional</u> para proceder con el cambio #{nextChangeCount}.
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Descripción Detallada de los Ajustes Requeridos:
                </label>
                <textarea
                  rows={4}
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="Ej. Ajustar la duración del logo final a 3 segundos, corregir el color del cintillo y cambiar el audio de fondo..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowChangesModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={actionLoading || (nextChangeCount >= 3 && !acceptCostChecked)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {actionLoading ? 'Enviando...' : nextChangeCount >= 3 ? 'Aceptar Costo y Solicitar Cambio' : 'Solicitar Cambio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
