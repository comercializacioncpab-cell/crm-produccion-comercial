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
  AlertCircle,
  Edit,
  Pencil,
  DollarSign,
  Package,
  Link2
} from 'lucide-react';
import { 
  STATUS_CONFIG, 
  PRIORITY_CONFIG, 
  SPONSORSHIP_OPTIONS,
  SPONSORSHIP_CATEGORIES,
  isStrategicPntId,
  hasStrategicPnt,
  isCoberturaId,
  hasCobertura,
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
  const [selectedSecondaryPostId, setSelectedSecondaryPostId] = useState('');
  const [assignPriority, setAssignPriority] = useState('MEDIA');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [deliveryExternalUrl, setDeliveryExternalUrl] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [acceptCostChecked, setAcceptCostChecked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload Material / Deliverable Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<'INPUT_ASSET' | 'OUTPUT_DELIVERY'>('OUTPUT_DELIVERY');
  const [uploadModalFile, setUploadModalFile] = useState<File | null>(null);
  const [uploadModalUrl, setUploadModalUrl] = useState('');
  const [uploadModalNotes, setUploadModalNotes] = useState('');
  const [uploadModalFileName, setUploadModalFileName] = useState('');

  // Date Modification States
  const [showDateModal, setShowDateModal] = useState(false);
  const [editAirDate, setEditAirDate] = useState('');
  const [editMaterialDeliveryDate, setEditMaterialDeliveryDate] = useState('');
  const [dateChangeReason, setDateChangeReason] = useState('');

  // Full SP Edit States
  const [showEditModal, setShowEditModal] = useState(false);
  const [executives, setExecutives] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    clientAgency: '',
    product: '',
    program: '',
    materialDeliveryDate: '',
    airDate: '',
    downloadUrl: '',
    materialNotes: '',
    hasBrief: true,
    sponsorshipTypes: [] as string[],
    customSponsorship: '',
    voiceoverType: 'GENERICA',
    voiceoverText: '',
    priority: 'MEDIA',
    packageValue: '',
    postProducerId: '',
    secondaryPostProducerId: '',
    executiveId: '',
  });

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        if (data.order.postProducerId) {
          setSelectedPostId(data.order.postProducerId);
        }
        if (data.order.secondaryPostProducerId) {
          setSelectedSecondaryPostId(data.order.secondaryPostProducerId);
        } else {
          setSelectedSecondaryPostId('');
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

  const fetchExecutives = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const allUsers = data.users || [];
        const salesUsers = allUsers.filter(
          (u: any) => u.status === 'APROBADO' && (u.role === 'SOLICITANTE' || u.role === 'ADMIN' || u.role === 'PRODUCTOR_SENIOR' || u.role === 'COORDINADOR')
        );
        setExecutives(salesUsers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchPostProducers();
    fetchExecutives();
  }, [orderId]);

  // Handle Assign Post-Producer (Coordinator / Admin)
  const handleAssign = async () => {
    if (!selectedPostId) {
      setMsg({ type: 'error', text: 'Selecciona un post-productor principal para asignar.' });
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
          secondaryPostProducerId: selectedSecondaryPostId || null,
          priority: assignPriority,
        }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Orden asignada exitosamente! Se registró la fecha y hora exacta y se notificó a los editores por WhatsApp/Email.' });
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

    const hasExistingOutput = order?.files?.some((f: any) => f.fileType?.startsWith('OUTPUT') && (f.filePath || f.externalUrl));
    if (!deliveryFile && !deliveryExternalUrl?.trim() && !hasExistingOutput) {
      setMsg({ type: 'error', text: 'Por favor selecciona el archivo de video/entregable o ingresa un enlace en la nube (Drive/WeTransfer/Frame.io) para completar la entrega.' });
      return;
    }

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
        if (!fileRes.ok) {
          const errData = await fileRes.json().catch(() => ({}));
          setMsg({ type: 'error', text: errData.error || 'Error al subir el archivo entregable. Por favor verifica el archivo o ingresa un enlace en la nube.' });
          setActionLoading(false);
          return;
        }
        const fileData = await fileRes.json();
        uploadedFileName = fileData.file?.fileName || '';
        uploadedFilePath = fileData.file?.filePath || '';
      }

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_DELIVERY',
          deliveryNotes,
          fileName: uploadedFileName || (deliveryExternalUrl ? 'Master en la nube' : 'Entrega Final'),
          fileUrl: uploadedFilePath,
          externalUrl: deliveryExternalUrl?.trim() || null,
        }),
      });

      if (res.ok) {
        setMsg({ type: 'success', text: '¡Trabajo entregado con hora registrada! Se notificó a la ejecutiva solicitante para su aprobación.' });
        setDeliveryFile(null);
        setDeliveryNotes('');
        setDeliveryExternalUrl('');
        fetchOrder();
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: err.error || 'Error al registrar la entrega.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión al registrar la entrega.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Direct File / Link Upload (Any user with access)
  const handleUploadNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalFile && !uploadModalUrl.trim()) {
      setMsg({ type: 'error', text: 'Debes seleccionar un archivo físico o ingresar un enlace de descarga en la nube.' });
      return;
    }
    setActionLoading(true);
    setMsg(null);
    try {
      const formData = new FormData();
      if (uploadModalFile) {
        formData.append('file', uploadModalFile);
      }
      formData.append('fileType', uploadModalType);
      if (uploadModalUrl.trim()) {
        formData.append('externalUrl', uploadModalUrl.trim());
      }
      if (uploadModalFileName.trim()) {
        formData.append('fileName', uploadModalFileName.trim());
      }
      if (uploadModalNotes.trim()) {
        formData.append('notes', uploadModalNotes.trim());
      }

      const res = await fetch(`/api/orders/${order.id}/files`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMsg({ type: 'success', text: '¡Material adjuntado exitosamente a la orden!' });
        setShowUploadModal(false);
        setUploadModalFile(null);
        setUploadModalUrl('');
        setUploadModalNotes('');
        setUploadModalFileName('');
        fetchOrder();
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: err.error || 'Error al adjuntar archivo o enlace.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de red al adjuntar archivo.' });
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

    if (nextChangeNum >= 4 && !acceptCostChecked) {
      setMsg({ type: 'error', text: 'Debes marcar la casilla aceptando el costo adicional de $200 USD para proceder a partir del 4to cambio solicitado.' });
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
          acceptExtraCost: acceptCostChecked || nextChangeNum < 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar cambios');
      }

      setMsg({ 
        type: 'success', 
        text: `¡Solicitud de Cambio #${nextChangeNum} registrada exitosamente! ${nextChangeNum >= 4 ? '(Con Costo Adicional de $200 USD aceptado)' : ''}` 
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

  // Handle Update Dates (Air Date / Material Delivery Date)
  const handleUpdateDates = async () => {
    if (!editAirDate && !editMaterialDeliveryDate) {
      setMsg({ type: 'error', text: 'Debes ingresar al menos una fecha para actualizar.' });
      return;
    }
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_DATES',
          airDate: editAirDate,
          materialDeliveryDate: editMaterialDeliveryDate,
          reason: dateChangeReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Fechas actualizadas exitosamente! Se notificó al equipo y se registró en la trazabilidad.' });
        setShowDateModal(false);
        fetchOrder();
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al actualizar las fechas.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error al actualizar las fechas.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Full Edit Modal Handlers (Executive / Coordinator / Admin)
  const openEditModal = () => {
    let currentSponsorships: string[] = [];
    try {
      currentSponsorships = JSON.parse(order.sponsorshipTypes || '[]');
    } catch {
      currentSponsorships = [];
    }

    setEditFormData({
      clientAgency: order.clientAgency || '',
      product: order.product || '',
      program: order.program || '',
      materialDeliveryDate: order.materialDeliveryDate || '',
      airDate: order.airDate || '',
      downloadUrl: order.downloadUrl || '',
      materialNotes: order.materialNotes || '',
      hasBrief: Boolean(order.hasBrief),
      sponsorshipTypes: currentSponsorships,
      customSponsorship: order.customSponsorship || '',
      voiceoverType: order.voiceoverType || 'GENERICA',
      voiceoverText: order.voiceoverText || '',
      priority: order.priority || 'MEDIA',
      packageValue: order.packageValue !== null && order.packageValue !== undefined ? String(order.packageValue) : '',
      postProducerId: order.postProducerId || '',
      secondaryPostProducerId: order.secondaryPostProducerId || '',
      executiveId: order.executiveId || order.creatorId || '',
    });
    setShowEditModal(true);
  };

  const handleEditSponsorshipToggle = (id: string) => {
    setEditFormData((prev) => {
      const exists = prev.sponsorshipTypes.includes(id);
      return {
        ...prev,
        sponsorshipTypes: exists
          ? prev.sponsorshipTypes.filter((t) => t !== id)
          : [...prev.sponsorshipTypes, id],
      };
    });
  };

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.clientAgency || !editFormData.product) {
      setMsg({ type: 'error', text: 'El Cliente/Agencia y el Producto son campos requeridos.' });
      return;
    }
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT_ORDER',
          ...editFormData,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: '¡SP modificada exitosamente! Se registró la fecha, hora y usuario en la trazabilidad y se notificó al equipo.' });
        setShowEditModal(false);
        fetchOrder();
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al modificar la SP.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error al modificar la SP.' });
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
  const effectiveExecutiveName = order.executive?.name || order.creator?.name || 'Ejecutiva';
  const waShareText = encodeURIComponent(
    `📋 *Solicitud de Producción Comercial*\n` +
    `*Código:* ${order.orderNumber}\n` +
    `*Cliente:* ${order.clientAgency}\n` +
    `*Producto:* ${order.product}\n` +
    `*Fecha al aire:* ${order.airDate || 'Por definir'}\n` +
    `*Estado:* ${statusInfo.label}\n` +
    `*Ejecutiva:* ${effectiveExecutiveName}`
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

                {/* DEMO Badges */}
                {order.isDemo ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border flex items-center gap-1 ${
                    order.demoStatus === 'VENDIDO'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                  }`}>
                    🧪 DEMO / Piloto ($0 USD) {order.demoStatus === 'VENDIDO' ? '• [VENDIDO 💰]' : '• [En Evaluación]'}
                  </span>
                ) : (
                  order.packageValue > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      💰 ${Number(order.packageValue).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>
                  )
                )}

                {order.sourceDemo && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1">
                    ✨ Convertida de Demo ({order.sourceDemo.orderNumber})
                  </span>
                )}

                {order.changesCount > 0 && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border flex items-center gap-1 ${
                    order.changesCount >= 4 
                      ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {order.changesCount >= 4 ? '⚠️' : '🔄'} {order.changesCount} {order.changesCount === 1 ? 'Cambio' : 'Cambios'}
                    {order.changesCount >= 4 && ' (+$200 USD c/u)'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.clientAgency} • {order.product} • Creada el {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Convert Demo to Official Commercial SP Action */}
            {order.isDemo && order.demoStatus !== 'VENDIDO' && (user?.role === 'COORDINADOR' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR' || user?.role === 'SOLICITANTE') && (
              <Link
                href={`/orders/new?fromDemoId=${order.id}`}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md animate-pulse"
              >
                💰 Convertir a Venta Oficial
              </Link>
            )}

            {/* Edit Full SP Action (Executive, Coordinator, Admin) */}
            {user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'SOLICITANTE', 'EJECUTIVA'].includes(user.role) && (
              <button
                type="button"
                onClick={openEditModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> ✏️ Editar SP
              </button>
            )}

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

        {/* DEMO CONVERSION BANNERS */}
        {order.isDemo && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
            order.demoStatus === 'VENDIDO'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-purple-50/90 border-purple-200 text-purple-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                order.demoStatus === 'VENDIDO' ? 'bg-emerald-200 text-emerald-900' : 'bg-purple-200 text-purple-900'
              }`}>
                {order.demoStatus === 'VENDIDO' ? '💰' : '🧪'}
              </div>
              <div>
                <h4 className="font-extrabold text-xs">
                  {order.demoStatus === 'VENDIDO' 
                    ? '¡DEMO EXITOSAMENTE COMERCIALIZADO / VENDIDO!' 
                    : 'SOLICITUD DE DEMO / PILOTO COMERCIAL ($0 USD)'}
                </h4>
                <p className="text-[11px] opacity-80">
                  {order.demoStatus === 'VENDIDO'
                    ? `Este demo fue aprobado por el cliente y convertido a venta oficial el ${formatDateTime(order.demoConvertedAt || order.updatedAt)}.`
                    : 'Muestra comercial sin costo para presentación y venta al cliente. Al concretar la venta, puedes convertirlo en una SP Oficial con valor.'}
                </p>
                {order.convertedOrders && order.convertedOrders.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold">Órdenes oficiales generadas:</span>
                    {order.convertedOrders.map((co: any) => (
                      <Link
                        key={co.id}
                        href={`/orders/${co.id}`}
                        className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1"
                      >
                        {co.orderNumber} (${Number(co.packageValue || 0).toLocaleString('es-EC')} USD) <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {order.demoStatus !== 'VENDIDO' && (user?.role === 'COORDINADOR' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR' || user?.role === 'SOLICITANTE') && (
              <Link
                href={`/orders/new?fromDemoId=${order.id}`}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                💰 Crear SP Oficial de Venta
              </Link>
            )}
          </div>
        )}

        {order.sourceDemo && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-200 text-indigo-900 flex items-center justify-center text-lg font-black shrink-0">
                ✨
              </div>
              <div>
                <h4 className="font-extrabold text-xs">SP ORIGINADA A PARTIR DE UN DEMO PREVIO</h4>
                <p className="text-[11px] text-indigo-700">
                  Esta orden comercial con valor se generó a partir de la muestra previa <strong>{order.sourceDemo.orderNumber}</strong> ({order.sourceDemo.product}).
                </p>
              </div>
            </div>
            <Link
              href={`/orders/${order.sourceDemo.id}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
            >
              Ver Demo Original ({order.sourceDemo.orderNumber}) <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-yellow-950">
                    INFORMACIÓN GENERAL
                  </span>
                  {user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'SOLICITANTE', 'EJECUTIVA'].includes(user.role) && (
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold text-[11px] rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> Editar SP
                    </button>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-yellow-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-6 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Ejecutiva de Cuentas:</span>
                  <strong className="text-slate-900 font-bold">{order.executive?.name || order.creator?.name}</strong>
                  {order.executiveId && order.creatorId !== order.executiveId && (
                    <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                      (Ingresada por: {order.creator?.name})
                    </span>
                  )}
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
                  <span className="text-purple-700 block text-[11px] font-semibold">Equipo Post:</span>
                  <strong className="text-purple-950 font-bold block truncate">
                    {order.postProducer?.name ? `🎬 ${order.postProducer.name}` : 'Sin asignar'}
                  </strong>
                  {order.secondaryPostProducer?.name && (
                    <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5 truncate">
                      + 🤝 {order.secondaryPostProducer.name} (Apoyo)
                    </span>
                  )}
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
                  MATERIAL & INSUMOS
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-yellow-900">
                    Brief: {order.hasBrief ? 'SI [✓]' : 'NO [ ]'}
                  </span>
                  {user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'SOLICITANTE', 'EJECUTIVA'].includes(user.role) && (
                    <button
                      onClick={() => {
                        setEditAirDate(order.airDate || '');
                        setEditMaterialDeliveryDate(order.materialDeliveryDate || '');
                        setDateChangeReason('');
                        setShowDateModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold text-[11px] rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Modificar Fechas
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-4 text-xs">
                {/* External Cloud Download Link (Drive, WeTransfer, etc.) */}
                {order.downloadUrl && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                          Link de Descarga de Insumos (Nube / Drive / WeTransfer)
                        </span>
                        <a
                          href={order.downloadUrl.startsWith('http') ? order.downloadUrl : `https://${order.downloadUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-900 hover:text-blue-700 underline break-all inline-block mt-0.5"
                        >
                          {order.downloadUrl}
                        </a>
                      </div>
                    </div>
                    <a
                      href={order.downloadUrl.startsWith('http') ? order.downloadUrl : `https://${order.downloadUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 inline-flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Link de Descarga
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block font-semibold">Fecha de entrega de material:</span>
                      <strong className="text-slate-800 font-bold text-sm">{order.materialDeliveryDate || 'N/A'}</strong>
                    </div>
                    {user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'SOLICITANTE', 'EJECUTIVA'].includes(user.role) && (
                      <button
                        onClick={() => {
                          setEditAirDate(order.airDate || '');
                          setEditMaterialDeliveryDate(order.materialDeliveryDate || '');
                          setDateChangeReason('');
                          setShowDateModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Modificar fecha de entrega"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                    <div>
                      <span className="text-red-600 text-[11px] block font-bold">Fecha al aire:</span>
                      <strong className="text-red-700 font-bold text-sm">{order.airDate || 'Por definir'}</strong>
                    </div>
                    {user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'SOLICITANTE', 'EJECUTIVA'].includes(user.role) && (
                      <button
                        onClick={() => {
                          setEditAirDate(order.airDate || '');
                          setEditMaterialDeliveryDate(order.materialDeliveryDate || '');
                          setDateChangeReason('');
                          setShowDateModal(true);
                        }}
                        className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        title="Modificar fecha al aire"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-indigo-600" /> Opciones Comerciales / PNTs
                    </h3>
                    {hasCobertura(sponsorshipParsed) && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                        📹 Incluye Cobertura (2 personas)
                      </span>
                    )}
                    {hasStrategicPnt(sponsorshipParsed) && !hasCobertura(sponsorshipParsed) && (
                      <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                        🚀 Incluye Estratégico (2 personas)
                      </span>
                    )}
                  </div>
                  {user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'SOLICITANTE', 'EJECUTIVA'].includes(user.role) && (
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> Modificar
                    </button>
                  )}
                </div>

                {sponsorshipParsed.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">Ningún formato especificado</p>
                ) : (
                  <div className="space-y-2">
                    {/* Gráficos */}
                    {sponsorshipParsed.some((id: string) => !isStrategicPntId(id) && !isCoberturaId(id)) && (
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          🎨 PNT’s Gráficos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sponsorshipParsed
                            .filter((id: string) => !isStrategicPntId(id) && !isCoberturaId(id))
                            .map((id: string) => {
                              const opt = SPONSORSHIP_OPTIONS.find((s) => s.id === id);
                              return (
                                <span key={id} className="bg-blue-50 text-blue-900 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                                  {opt?.label || id}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Estratégicos */}
                    {sponsorshipParsed.some((id: string) => isStrategicPntId(id) && !isCoberturaId(id)) && (
                      <div className="pt-1">
                        <span className="text-[10px] font-black uppercase text-purple-700 block mb-1 flex items-center gap-1">
                          🚀 PNT’s Estratégicos (Apoyo multi-editor habilitado):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sponsorshipParsed
                            .filter((id: string) => isStrategicPntId(id) && !isCoberturaId(id))
                            .map((id: string) => {
                              const opt = SPONSORSHIP_OPTIONS.find((s) => s.id === id);
                              return (
                                <span key={id} className="bg-purple-100 text-purple-950 text-[11px] font-black px-2.5 py-1 rounded-lg border border-purple-300 shadow-2xs">
                                  ⭐ {opt?.label || id}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Coberturas */}
                    {sponsorshipParsed.some((id: string) => isCoberturaId(id)) && (
                      <div className="pt-1">
                        <span className="text-[10px] font-black uppercase text-amber-800 block mb-1 flex items-center gap-1">
                          📹 Coberturas (Asignación de hasta 2 personas habilitada):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sponsorshipParsed
                            .filter((id: string) => isCoberturaId(id))
                            .map((id: string) => {
                              const opt = SPONSORSHIP_OPTIONS.find((s) => s.id === id);
                              return (
                                <span key={id} className="bg-amber-100 text-amber-950 text-[11px] font-black px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">
                                  📹 {opt?.label || id}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {order.customSponsorship && (
                      <div className="pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Personalizado:
                        </span>
                        <span className="bg-purple-50 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                          Otro: {order.customSponsorship}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-cyan-600" /> Locución ({order.voiceoverType})
                  </h3>
                  {user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'SOLICITANTE', 'EJECUTIVA'].includes(user.role) && (
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="text-[11px] text-cyan-600 hover:text-cyan-800 font-bold bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> Modificar
                    </button>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-mono whitespace-pre-wrap text-slate-700 max-h-32 overflow-y-auto">
                  {order.voiceoverText || 'Sin texto de locución redactado.'}
                </div>
              </div>
            </div>

            {/* ARCHIVOS Y MATERIALES ADJUNTOS */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Insumos y Materiales Adjuntos
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModalType('INPUT_ASSET');
                      setShowUploadModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" /> ➕ Adjuntar Archivo / Link
                  </button>
                  {order.files && order.files.filter((f: any) => f.filePath).length > 1 && (
                    <a
                      href={`/api/orders/${order.id}/download-all?type=ALL`}
                      download={`Archivos_${order.orderNumber}.zip`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> 📦 Descargar Todo ({order.files.filter((f: any) => f.filePath).length} en ZIP)
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Inputs / Briefs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      📥 Insumos Iniciales ({inputFiles.length}):
                    </span>
                    <div className="flex items-center gap-2">
                      {inputFiles.filter((f: any) => f.filePath).length > 1 && (
                        <a
                          href={`/api/orders/${order.id}/download-all?type=INPUT`}
                          download={`Insumos_${order.orderNumber}.zip`}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                        >
                          <Download className="w-3 h-3" /> Descargar ({inputFiles.filter((f: any) => f.filePath).length}) en ZIP
                        </a>
                      )}
                    </div>
                  </div>
                  {inputFiles.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">No hay insumos adjuntos.</p>
                  ) : (
                    inputFiles.map((f: any) => (
                      <div key={f.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs gap-2">
                        <div className="truncate flex-1 min-w-0">
                          <span className="font-medium text-slate-800 truncate block">📄 {f.fileName}</span>
                          {f.notes && <span className="text-[10px] text-slate-500 block truncate">{f.notes}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {f.externalUrl && (
                            <a href={f.externalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold flex items-center gap-1 text-[11px] bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                              <ExternalLink className="w-3 h-3" /> Enlace
                            </a>
                          )}
                          {f.filePath ? (
                            <a href={`/api/orders/${order.id}/files/${f.id}/download`} download target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold flex items-center gap-1 text-[11px] bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                              <Download className="w-3.5 h-3.5" /> Descargar
                            </a>
                          ) : !f.externalUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUploadModalType('INPUT_ASSET');
                                setShowUploadModal(true);
                              }}
                              className="text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              ⚠️ Sin archivo • Adjuntar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Outputs / Deliverables */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      🎬 Entregables de Post-Producción ({outputFiles.length}):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadModalType('OUTPUT_DELIVERY');
                          setShowUploadModal(true);
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-2.5 h-2.5" /> ➕ Subir Master
                      </button>
                      {outputFiles.filter((f: any) => f.filePath).length > 1 && (
                        <a
                          href={`/api/orders/${order.id}/download-all?type=OUTPUT`}
                          download={`Entregables_${order.orderNumber}.zip`}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors shadow-2xs"
                        >
                          <Download className="w-3 h-3" /> Descargar ({outputFiles.filter((f: any) => f.filePath).length}) en ZIP
                        </a>
                      )}
                    </div>
                  </div>
                  {outputFiles.length === 0 ? (
                    <div className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                      <p className="font-medium">Aún no se ha subido el material final resuelto.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadModalType('OUTPUT_DELIVERY');
                          setShowUploadModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3 h-3" /> Subir Video o Enlace Ahora
                      </button>
                    </div>
                  ) : (
                    outputFiles.map((f: any) => (
                      <div key={f.id} className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs gap-2">
                        <div className="truncate flex-1 min-w-0">
                          <span className="font-bold text-emerald-900 truncate block">✨ {f.fileName}</span>
                          {f.notes && <span className="text-[10px] text-emerald-700 block truncate">{f.notes}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {f.externalUrl && (
                            <a href={f.externalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold flex items-center gap-1 text-[11px] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                              <ExternalLink className="w-3 h-3" /> Abrir Enlace
                            </a>
                          )}
                          {f.filePath ? (
                            <a href={`/api/orders/${order.id}/files/${f.id}/download`} download target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline font-bold flex items-center gap-1 text-[11px] bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                              <Download className="w-3.5 h-3.5" /> Descargar Video
                            </a>
                          ) : !f.externalUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUploadModalType('OUTPUT_DELIVERY');
                                setShowUploadModal(true);
                              }}
                              className="text-amber-800 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              ⚠️ Sin archivo • Adjuntar Video
                            </button>
                          ) : null}
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
            {/* PANEL 1: ASIGNACIÓN A POST-PRODUCTOR (Coordinador / Admin / Productor Senior) */}
            {(user?.role === 'COORDINADOR' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR') && (
              <div className="bg-white rounded-3xl border border-purple-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Coordinación y Asignación</h3>
                    <p className="text-[11px] text-slate-500">Asignar editores responsables</p>
                  </div>
                </div>

                {hasStrategicPnt(sponsorshipParsed) && (
                  <div className={`p-3 border rounded-2xl text-[11px] space-y-1 ${hasCobertura(sponsorshipParsed) ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-purple-50 border-purple-200 text-purple-900'}`}>
                    <p className="font-bold flex items-center gap-1">
                      {hasCobertura(sponsorshipParsed) ? '📹' : '🚀'} <span>{hasCobertura(sponsorshipParsed) ? 'Coberturas / Formatos Especiales Detectados' : 'PNTs Estratégicos Detectados'}</span>
                    </p>
                    <p className={`text-[10px] ${hasCobertura(sponsorshipParsed) ? 'text-amber-800' : 'text-purple-700'}`}>
                      Esta SP incluye {hasCobertura(sponsorshipParsed) ? 'coberturas o formatos especiales' : 'formatos estratégicos'}. Puedes asignar un editor principal (responsable) y un segundo editor de apoyo (2 personas).
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Editor Principal (Seguimiento de SP) *:</span>
                      <span className="text-[10px] text-purple-700 font-bold">Líder</span>
                    </label>
                    <select
                      value={selectedPostId}
                      onChange={(e) => setSelectedPostId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Seleccionar Editor Principal --</option>
                      {postProducers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.role === 'PRODUCTOR_SENIOR' ? '👑' : '🎬'} {p.name} {p.role === 'PRODUCTOR_SENIOR' ? '(Productor Senior)' : ''} ({p.phone || 'Sin tel'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Editor Adicional (Coberturas / Estratégicos / Apoyo):</span>
                      <span className="text-[10px] text-indigo-600 font-bold">Opcional</span>
                    </label>
                    <select
                      value={selectedSecondaryPostId}
                      onChange={(e) => setSelectedSecondaryPostId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Ninguno (Sin Editor Adicional) --</option>
                      {postProducers
                        .filter((p) => p.id !== selectedPostId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.role === 'PRODUCTOR_SENIOR' ? '👑' : '🤝'} {p.name} {p.role === 'PRODUCTOR_SENIOR' ? '(Productor Senior)' : ''} ({p.phone || 'Sin tel'})
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
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    {actionLoading ? 'Asignando...' : 'Asignar y Notificar a Editores'}
                  </button>
                </div>
              </div>
            )}

            {/* PANEL 2: POST-PRODUCTOR ACCIONES (Recepción y Entrega) */}
            {(user?.role === 'POST_PRODUCTOR' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR') && (
              <div className="bg-white rounded-3xl border border-blue-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    🎬
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Acciones de Post-Producción</h3>
                    <p className="text-[11px] text-slate-500">
                      {order.postProducer?.name ? `Principal: ${order.postProducer.name}` : 'Sin asignar'}
                      {order.secondaryPostProducer?.name ? ` • Apoyo: ${order.secondaryPostProducer.name}` : ''}
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
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      {actionLoading ? 'Registrando recepción...' : 'Confirmar Recepción e Iniciar Edición'}
                    </button>
                  </div>
                )}

                {/* Sub-Action B: Formulario de Entrega Final de Post */}
                {(order.status === 'EN_PROCESO' || order.status === 'CON_CAMBIOS' || order.status === 'ASIGNADA' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR') && (
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      {actionLoading ? 'Procesando entrega...' : 'Marcar como Resuelta y Entregar'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* PANEL 3: APROBACIÓN Y REVISIÓN (Solicitante / Coordinadora / Admin / Productor Senior) */}
            {(user?.role === 'SOLICITANTE' || user?.role === 'COORDINADOR' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR') && (
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
                    <p className="text-[11px] text-slate-500">
                      {order.executiveId && order.creatorId !== order.executiveId
                        ? `Ingresada por ${order.creator?.name} (para ejecutiva ${order.executive?.name})`
                        : `Por ${order.creator?.name}`}
                    </p>
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
                      {order.postProducer?.name ? `Principal: ${order.postProducer.name}` : 'Esperando asignación'}
                      {order.secondaryPostProducer?.name ? ` • Apoyo: ${order.secondaryPostProducer.name}` : ''}
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
                      : order.changesCount >= 4
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
                          order.changesCount >= 4 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {order.changesCount} {order.changesCount === 1 ? 'cambio' : 'cambios'} {order.changesCount >= 4 && '⚠️ +$200 c/u'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">No requerido aún</span>
                      )}
                    </div>

                    {order.changesCount > 0 && (
                      <div className="space-y-0.5 mt-0.5">
                        <p className="text-[11px] text-slate-600">
                          {order.changesCount >= 4 
                            ? `⚠️ Se superó el límite base (3 cambios). Cambio #${order.changesCount} con costo adicional de $200 USD aceptado.` 
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

        {/* Modal de Solicitud de Cambios con Advertencia de Costo a partir del 4to Cambio */}
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

              {/* ⚠️ ADVERTENCIA DE COSTO ADICIONAL ($200 USD) A PARTIR DEL 4TO CAMBIO */}
              {nextChangeCount >= 4 && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>¡ADVERTENCIA: COSTO ADICIONAL DE $200 USD POR CAMBIO #{nextChangeCount}!</span>
                  </div>
                  
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    El paquete de producción base incluye un máximo de <strong>3 cambios gratuitos</strong>. 
                    A partir de esta <strong>{nextChangeCount}ª solicitud de cambios</strong>, se generará un 
                    <strong> costo adicional de $200 USD por cada cambio</strong> de edición y render para el cliente.
                  </p>

                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer bg-white/80 p-2.5 rounded-xl border border-amber-300">
                    <input
                      type="checkbox"
                      checked={acceptCostChecked}
                      onChange={(e) => setAcceptCostChecked(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-amber-950 leading-tight">
                      Confirmo que se ha notificado al cliente y <u>Acepto el Costo Adicional de $200 USD</u> para proceder con el cambio #{nextChangeCount}.
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
                  disabled={actionLoading || (nextChangeCount >= 4 && !acceptCostChecked)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {actionLoading ? 'Enviando...' : nextChangeCount >= 4 ? 'Aceptar Costo ($200) y Solicitar Cambio' : 'Solicitar Cambio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Modificación de Fechas (Al Aire / Entrega de Material) */}
        {showDateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Modificar Fechas de la SP
                </h3>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Puedes reprogramar la fecha de entrega de insumos o la fecha al aire. Los cambios quedarán registrados con fecha, hora y usuario en la trazabilidad.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fecha de Entrega de Material:
                  </label>
                  <input
                    type="date"
                    value={editMaterialDeliveryDate}
                    onChange={(e) => setEditMaterialDeliveryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fecha al Aire:
                  </label>
                  <input
                    type="date"
                    value={editAirDate}
                    onChange={(e) => setEditAirDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Motivo de la modificación (Opcional):
                  </label>
                  <input
                    type="text"
                    value={dateChangeReason}
                    onChange={(e) => setDateChangeReason(e.target.value)}
                    placeholder="Ej. Solicitud del cliente por cambio de pauta publicitaria..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateDates}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {actionLoading ? 'Guardando...' : 'Actualizar Fechas'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edición Completa de SP (Ejecutivas / Coordinadoras / Admin) */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      Editar Solicitud de Producción ({order.orderNumber})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Modifica los datos generales, requerimientos comerciales (PNTs/Auspicios) o insumos de la orden.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveFullEdit} className="space-y-4 text-xs">
                {/* 1. INFORMACIÓN GENERAL */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🏢 1. Información General & Valor
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Cliente / Agencia *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.clientAgency}
                        onChange={(e) => setEditFormData({ ...editFormData, clientAgency: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Producto *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.product}
                        onChange={(e) => setEditFormData({ ...editFormData, product: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>👩‍💼 Ejecutiva / Solicitante de la Cuenta (Titular)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Reasigna a quién pertenece este cliente/SP</span>
                    </label>
                    <select
                      value={editFormData.executiveId}
                      onChange={(e) => setEditFormData({ ...editFormData, executiveId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Sin Ejecutiva Asignada (Usar creador original) --</option>
                      {executives.map((exec) => (
                        <option key={exec.id} value={exec.id}>
                          {exec.name} ({exec.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Programa / Espacio</label>
                      <input
                        type="text"
                        value={editFormData.program}
                        onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
                        placeholder="Ej. Novela 15h30"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Prioridad</label>
                      <select
                        value={editFormData.priority}
                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="BAJA">Baja</option>
                        <option value="MEDIA">Media</option>
                        <option value="ALTA">Alta</option>
                        <option value="URGENTE">Urgente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-600" /> Valor Paquete ($ USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.packageValue}
                        onChange={(e) => setEditFormData({ ...editFormData, packageValue: e.target.value })}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. MATERIAL, FECHAS & LINK DE DESCARGA */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    📅 2. Material, Fechas & Descarga
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Entrega de Material</label>
                      <input
                        type="date"
                        value={editFormData.materialDeliveryDate}
                        onChange={(e) => setEditFormData({ ...editFormData, materialDeliveryDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-red-700 mb-1">Fecha al Aire</label>
                      <input
                        type="date"
                        value={editFormData.airDate}
                        onChange={(e) => setEditFormData({ ...editFormData, airDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-blue-600" /> Link de Descarga de Insumos (Drive, Dropbox, WeTransfer)
                    </label>
                    <input
                      type="url"
                      value={editFormData.downloadUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, downloadUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Notas / Especificaciones</label>
                      <textarea
                        rows={2}
                        value={editFormData.materialNotes}
                        onChange={(e) => setEditFormData({ ...editFormData, materialNotes: e.target.value })}
                        placeholder="Instrucciones sobre logos, artes, etc."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-2">¿Tiene Brief?</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name="editHasBrief"
                            checked={editFormData.hasBrief === true}
                            onChange={() => setEditFormData({ ...editFormData, hasBrief: true })}
                            className="text-blue-600"
                          />
                          SI
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name="editHasBrief"
                            checked={editFormData.hasBrief === false}
                            onChange={() => setEditFormData({ ...editFormData, hasBrief: false })}
                            className="text-blue-600"
                          />
                          NO
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. OPCIONES COMERCIALES / PNTS & AUSPICIOS */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      📺 3. Opciones Comerciales, Auspicios & PNTs (Selección Múltiple)
                    </h4>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-md">
                      {editFormData.sponsorshipTypes.length} seleccionada(s)
                    </span>
                  </div>

                  {/* Render Categories: Gráficos vs Estratégicos */}
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {SPONSORSHIP_CATEGORIES.map((cat) => {
                      const selectedCount = cat.options.filter((o) => editFormData.sponsorshipTypes.includes(o.id)).length;
                      return (
                        <div key={cat.id} className="bg-white/80 p-3 rounded-xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5">
                              {cat.id === 'COBERTURAS' ? '📹' : cat.id === 'ESTRATEGICOS' ? '🚀' : '🎨'} {cat.title}
                            </span>
                            {selectedCount > 0 && (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded-md">
                                {selectedCount} seleccionada(s)
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {cat.options.map((opt) => {
                              const isChecked = editFormData.sponsorshipTypes.includes(opt.id);
                              return (
                                <label
                                  key={opt.id}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                                    isChecked
                                      ? cat.id === 'COBERTURAS'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                        : cat.id === 'ESTRATEGICOS'
                                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                                        : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleEditSponsorshipToggle(opt.id)}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                  />
                                  <span className="truncate">{opt.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                      Auspicio / PNT Personalizado (Otro):
                    </label>
                    <input
                      type="text"
                      value={editFormData.customSponsorship}
                      onChange={(e) => setEditFormData({ ...editFormData, customSponsorship: e.target.value })}
                      placeholder="Ej. Mención con producto en mesa del presentador..."
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4. LOCUCIÓN */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🎙️ 4. Locución
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Locución</label>
                      <select
                        value={editFormData.voiceoverType}
                        onChange={(e) => setEditFormData({ ...editFormData, voiceoverType: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="GENERICA">Genérica</option>
                        <option value="EXCLUSIVA_CLIENTE">Exclusiva del Cliente</option>
                        <option value="SIN_LOCUCION">Sin Locución</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Texto de Locución</label>
                      <textarea
                        rows={2}
                        value={editFormData.voiceoverText}
                        onChange={(e) => setEditFormData({ ...editFormData, voiceoverText: e.target.value })}
                        placeholder="Guion o texto que debe leer el locutor..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. EQUIPO POST-PRODUCCIÓN (Para Coordinadores / Admins) */}
                {(user?.role === 'COORDINADOR' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR') && (
                  <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-3">
                    <h4 className="font-black text-xs text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      🎬 5. Asignación de Editores (Post-Producción)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Editor Principal (Seguimiento de SP):
                        </label>
                        <select
                          value={editFormData.postProducerId}
                          onChange={(e) => setEditFormData({ ...editFormData, postProducerId: e.target.value })}
                          className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="">-- Sin Asignar --</option>
                          {postProducers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.role === 'PRODUCTOR_SENIOR' ? '👑' : '🎬'} {p.name} {p.role === 'PRODUCTOR_SENIOR' ? '(Productor Senior)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Editor Adicional (Formatos Estratégicos / Apoyo):
                        </label>
                        <select
                          value={editFormData.secondaryPostProducerId}
                          onChange={(e) => setEditFormData({ ...editFormData, secondaryPostProducerId: e.target.value })}
                          className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="">-- Ninguno --</option>
                          {postProducers
                            .filter((p) => p.id !== editFormData.postProducerId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.role === 'PRODUCTOR_SENIOR' ? '👑' : '🤝'} {p.name} {p.role === 'PRODUCTOR_SENIOR' ? '(Productor Senior)' : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {actionLoading ? 'Guardando Cambios...' : 'Guardar y Notificar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADJUNTAR ARCHIVO O ENLACE */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${uploadModalType === 'OUTPUT_DELIVERY' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {uploadModalType === 'OUTPUT_DELIVERY' ? '🎬' : '📥'}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      {uploadModalType === 'OUTPUT_DELIVERY' ? 'Adjuntar Entregable de Post-Producción' : 'Adjuntar Insumo a la SP'}
                    </h3>
                    <p className="text-[11px] text-slate-500">Sube un archivo directo o ingresa un enlace en la nube</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadNewAsset} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo de Material:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadModalType('OUTPUT_DELIVERY')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        uploadModalType === 'OUTPUT_DELIVERY'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🎬 Video Entregable
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadModalType('INPUT_ASSET')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        uploadModalType === 'INPUT_ASSET'
                          ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      📥 Insumo / Brief / Logo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    1. Subir Archivo Físico (Video, PSD, AI, ZIP, PDF):
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadModalFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl p-1.5"
                  />
                  {uploadModalFile && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">
                      ✓ Seleccionado: {uploadModalFile.name} ({(uploadModalFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase">o también</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" /> 2. Enlace en la Nube (Google Drive, WeTransfer, OneDrive, Frame.io):
                  </label>
                  <input
                    type="url"
                    value={uploadModalUrl}
                    onChange={(e) => setUploadModalUrl(e.target.value)}
                    placeholder="https://drive.google.com/... o https://we.tl/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Notas o Descripción:
                  </label>
                  <input
                    type="text"
                    value={uploadModalNotes}
                    onChange={(e) => setUploadModalNotes(e.target.value)}
                    placeholder="Ej. Versión final con audio remasterizado..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || (!uploadModalFile && !uploadModalUrl.trim())}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {actionLoading ? 'Guardando...' : 'Adjuntar Material'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
