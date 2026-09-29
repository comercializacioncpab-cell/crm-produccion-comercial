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
  Check
} from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG, SPONSORSHIP_OPTIONS } from '@/lib/order-utils';

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
        setMsg({ type: 'success', text: '¡Orden asignada exitosamente! Se notificó al post-productor por WhatsApp/Email.' });
        fetchOrder();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al asignar la orden.' });
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
        setMsg({ type: 'success', text: '¡Trabajo entregado! Se notificó a la ejecutiva solicitante para su aprobación.' });
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
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_CHANGES',
          changeNotes,
        }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Cambios solicitados y notificados al post-productor.' });
        setShowChangesModal(false);
        setChangeNotes('');
        fetchOrder();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al registrar cambios.' });
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
        setMsg({ type: 'success', text: '¡Excelente! La orden ha sido APROBADA y está lista para el aire.' });
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
        <div className="py-20 text-center text-slate-400 text-xs">Cargando detalles de la SP...</div>
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
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.clientAgency} • {order.product}
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

        {/* WORKFLOW ACTION PANELS BASED ON ROLES & STATUS */}
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
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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
                    <strong className="text-red-700 font-black text-sm">{order.airDate || 'Por definir'}</strong>
                  </div>
                </div>

                {order.materialNotes && (
                  <div className="pt-2">
                    <span className="text-slate-400 text-[11px] block font-semibold mb-1">Indicaciones de material:</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs leading-relaxed">
                      {order.materialNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: TIPO DE AUSPICIO */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-ev-rowHeader px-6 py-2.5 text-white flex items-center justify-between">
                <span className="text-xs font-black uppercase">
                  TIPO DE AUSPICIO
                </span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {SPONSORSHIP_OPTIONS.map((opt) => {
                    const isSelected = sponsorshipParsed.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border font-bold ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>
                          {isSelected ? 'X' : ''}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
                {order.customSponsorship && (
                  <p className="mt-3 text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    Otro auspicio: {order.customSponsorship}
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN 4: LOCUCIÓN */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-ev-rowHeader px-6 py-2.5 text-white flex items-center justify-between">
                <span className="text-xs font-black uppercase">
                  LOCUCIÓN ({order.voiceoverType})
                </span>
              </div>
              <div className="p-6 space-y-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {order.voiceoverText || 'Sin texto de locución redactado.'}
                </div>
              </div>
            </div>

            {/* SECCIÓN 5: ARCHIVOS ADJUNTOS (Insumos vs Entregables) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                ARCHIVOS Y ENTREGABLES ASOCIADOS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Input Briefs / Assets */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    📥 Insumos / Briefs de Ejecutiva ({inputFiles.length})
                  </span>
                  {inputFiles.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Sin archivos adjuntos iniciales.</p>
                  ) : (
                    inputFiles.map((f: any) => (
                      <div key={f.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="truncate max-w-[180px] font-medium text-slate-800">
                          {f.fileName}
                        </span>
                        <a
                          href={f.filePath || f.externalUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Bajar
                        </a>
                      </div>
                    ))
                  )}
                </div>

                {/* Output Deliverables */}
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 block">
                    ✨ Material Resuelto / Masters ({outputFiles.length})
                  </span>
                  {outputFiles.length === 0 ? (
                    <p className="text-[11px] text-emerald-700/60">Aún no se ha subido material final renderizado.</p>
                  ) : (
                    outputFiles.map((f: any) => (
                      <div key={f.id} className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="truncate max-w-[180px] font-bold text-emerald-950 block">
                            🎬 {f.fileName}
                          </span>
                          {f.notes && <span className="text-[10px] text-slate-500">{f.notes}</span>}
                        </div>
                        <a
                          href={f.filePath || f.externalUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-md text-[11px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Descargar
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Interactive Panels */}
          <div className="space-y-6">
            {/* PANEL 1: ASIGNACIÓN A POST-PRODUCTOR (Coordinadora / Admin) */}
            {(user?.role === 'COORDINADOR' || user?.role === 'ADMIN') && (
              <div className="bg-white rounded-3xl border border-purple-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Coordinación de Producción</h3>
                    <p className="text-[11px] text-slate-500">Asignar responsable de edición</p>
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

            {/* PANEL 2: RESOLUCIÓN Y ENTREGA FINAL (Post-Productor / Admin) */}
            {(user?.role === 'POST_PRODUCTOR' || user?.role === 'ADMIN') && (
              <div className="bg-white rounded-3xl border border-blue-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    🎬
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Entrega de Post-Producción</h3>
                    <p className="text-[11px] text-slate-500">Subir render / master resuelto</p>
                  </div>
                </div>

                <form onSubmit={handleResolveDelivery} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Subir Video / Master Final:
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notas de Entrega / Especificaciones Técnicas:
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {actionLoading ? 'Procesando entrega...' : 'Marcar como Resuelta y Entregar'}
                  </button>
                </form>
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
                    onClick={() => setShowChangesModal(true)}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Solicitar Ajustes / Cambios
                  </button>
                </div>

                {order.approved && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs">
                    <p className="font-bold">✓ Aprobado por: {order.approvedBy || 'Ejecutiva'}</p>
                    <span className="text-[10px] text-teal-700">Listo para emisión comercial.</span>
                  </div>
                )}
              </div>
            )}

            {/* PANEL 4: TIMELINE DE ACTIVIDAD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Historial de Trazabilidad
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {(order.activityLogs || []).map((log: any) => (
                  <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Solicitud de Cambios */}
        {showChangesModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" /> Solicitar Correcciones / Cambios
              </h3>
              <p className="text-xs text-slate-500">
                Describe con precisión qué ajustes requiere el video o render para que el post-productor lo corrija.
              </p>

              <textarea
                rows={4}
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Ej. Ajustar la duración del logo final a 3 segundos y corregir el color del banner..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              ></textarea>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowChangesModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Enviando...' : 'Enviar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
