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
  Link2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Copy,
  Smartphone,
  Save,
  Send,
  Mail,
  Share2
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
  getWorkflowStageIndex,
  DIGITAL_NETWORKS,
  DIGITAL_FORMATS,
  DIGITAL_RESOURCES_LIST
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
  const [deliveryMethod, setDeliveryMethod] = useState<'EMAIL' | 'LINK' | 'FILE'>('EMAIL');
  const [changeNotes, setChangeNotes] = useState('');
  const [changeChecklistItems, setChangeChecklistItems] = useState<string[]>(['']);
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
    orderNumber: '',
    oiNumber: '',
    requiresNewsroom: false,
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
    campaign: '',
    contentObjective: 'AWARENESS',
    orderDescription: '',
    publishDate: '',
    receptionDate: '',
    informCreativeDigital: true,
    informCommunityManager: true,
    informMonetization: true,
    publicationAccount: '',
    finishedProductDeliveryDate: '',
    platformsAndFormats: {} as Record<string, string[]>,
    isNewsroomSegment: false,
    newsroomSegmentType: '',
    newsroomDate: '',
    newsroomTime: '',
    newsroomLocation: '',
    resources: {} as Record<string, string>,
    agencyCommissionApplies: false,
  });

  // Financial Costs & Profitability States (Digital Project Cost Sheet)
  const [digitalCosts, setDigitalCosts] = useState({
    packageValue: 0,
    producerCost: 0,
    reporterCost: 0,
    mobilizationCost: 0,
    otherCost: 0,
    agencyCommissionApplies: false,
  });
  const [savingCosts, setSavingCosts] = useState(false);
  const [costsSuccessMsg, setCostsSuccessMsg] = useState('');

  // Share SP by Email / External PDF Modal States
  const [showShareEmailModal, setShowShareEmailModal] = useState(false);
  const [shareRecipientEmail, setShareRecipientEmail] = useState('');
  const [shareRecipientName, setShareRecipientName] = useState('');
  const [shareCustomMessage, setShareCustomMessage] = useState('');
  const [shareSending, setShareSending] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; message: string; printPdfUrl?: string; mailtoUrl?: string } | null>(null);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  const handleOpenShareEmailModal = () => {
    setShareRecipientEmail('');
    setShareRecipientName('');
    setShareCustomMessage('');
    setShareResult(null);
    setCopiedPublicLink(false);
    setShowShareEmailModal(true);
  };

  // Progress Inquiry States (Ejecutiva ↔ Post-Productor)
  const [inquiryQuestion, setInquiryQuestion] = useState('Solicito información sobre el avance y status actual de la orden.');
  const [inquiryAnswer, setInquiryAnswer] = useState('');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [newsroomLoading, setNewsroomLoading] = useState(false);

  const getPublicPdfUrl = () => {
    if (!order) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const token = order.clientReviewToken || '';
    return `${origin}/orders/${order.id}/print${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  };

  const handleCopyPublicLink = () => {
    const url = getPublicPdfUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedPublicLink(true);
    setTimeout(() => setCopiedPublicLink(false), 3000);
  };

  const handleSendExternalEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareRecipientEmail.trim() || !shareRecipientEmail.includes('@')) {
      alert('Por favor ingresa un correo electrónico válido');
      return;
    }

    setShareSending(true);
    setShareResult(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: shareRecipientEmail.trim(),
          recipientName: shareRecipientName.trim(),
          messageNote: shareCustomMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShareResult({
          success: true,
          message: data.message || 'Correo procesado exitosamente',
          printPdfUrl: data.printPdfUrl,
          mailtoUrl: data.mailtoUrl,
        });
        fetchOrder();
      } else {
        setShareResult({
          success: false,
          message: data.error || 'Error al enviar correo',
        });
      }
    } catch (err: any) {
      setShareResult({
        success: false,
        message: err.message || 'Error de conexión',
      });
    } finally {
      setShareSending(false);
    }
  };

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

        // Initialize digital financial costs
        try {
          const dData = typeof data.order.digitalData === 'string' ? JSON.parse(data.order.digitalData) : (data.order.digitalData || {});
          if (dData.financialCosts) {
            setDigitalCosts({
              packageValue: data.order.packageValue || 0,
              producerCost: dData.financialCosts.producerCost || 0,
              reporterCost: dData.financialCosts.reporterCost || 0,
              mobilizationCost: dData.financialCosts.mobilizationCost || 0,
              otherCost: dData.financialCosts.otherCost || 0,
              agencyCommissionApplies: Boolean(dData.financialCosts.agencyCommissionApplies),
            });
          } else {
            setDigitalCosts((prev: any) => ({ ...prev, packageValue: data.order.packageValue || 0 }));
          }
        } catch {
          setDigitalCosts((prev: any) => ({ ...prev, packageValue: data.order.packageValue || 0 }));
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
      const res = await fetch('/api/traffic');
      if (res.ok) {
        const data = await res.json();
        const list = data.producers || data.editors || [];
        if (Array.isArray(list) && list.length > 0) {
          setPostProducers(
            list.map((p: any) => ({
              ...p,
              activeOrders: p.activeOrders ?? p.activeCount ?? 0,
            }))
          );
          return;
        }
      }
    } catch (e) {
      console.error('Error al consultar /api/traffic para editores:', e);
    }

    try {
      const res2 = await fetch('/api/users?role=POST_PRODUCTOR&status=APROBADO');
      if (res2.ok) {
        const data2 = await res2.json();
        setPostProducers(data2.users || []);
      }
    } catch (e2) {
      console.error('Error al consultar fallback /api/users para editores:', e2);
    }
  };

  const handleToggleChecklist = async (itemIndex: number) => {
    try {
      // Optimistic update
      setOrder((prev: any) => {
        if (!prev) return prev;
        const list = Array.isArray(prev.changeChecklist) ? [...prev.changeChecklist] : [];
        if (list[itemIndex]) {
          list[itemIndex] = { ...list[itemIndex], done: !list[itemIndex].done };
        }
        return { ...prev, changeChecklist: list };
      });

      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_CHECKLIST_ITEM', itemIndex }),
      });
    } catch (e) {
      console.error(e);
      fetchOrder();
    }
  };

  const handleGenerateClientToken = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE_CLIENT_TOKEN' }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Enlace de revisión para cliente generado con éxito!' });
        fetchOrder();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchExecutives = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const allUsers = data.users || [];
        const salesUsers = allUsers.filter(
          (u: any) => u.status === 'APROBADO' && (u.role === 'SOLICITANTE' || u.role === 'ADMIN' || u.role === 'PRODUCTOR_SENIOR' || u.role === 'COORDINADOR' || u.role === 'COORDINADOR_PRODUCTOR')
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
    
    if (deliveryMethod === 'FILE') {
      if (!deliveryFile && !hasExistingOutput) {
        setMsg({ type: 'error', text: 'Por favor selecciona el archivo de video/entregable para completar la entrega.' });
        return;
      }
    } else if (deliveryMethod === 'LINK') {
      if (!deliveryExternalUrl?.trim() && !hasExistingOutput) {
        setMsg({ type: 'error', text: 'Por favor ingresa un enlace en la nube (Drive/WeTransfer/Frame.io) para completar la entrega.' });
        return;
      }
    }
    // Para 'EMAIL', no se requiere archivo ni URL, permitiendo dar por terminada la SP sin problemas de peso

    setActionLoading(true);
    setMsg(null);
    try {
      let uploadedFileName = '';
      let uploadedFilePath = '';

      // Upload deliverable file if provided and method is FILE
      if (deliveryFile && deliveryMethod === 'FILE') {
        const fileSizeMB = deliveryFile.size / (1024 * 1024);

        // If file is > 10 MB and no external URL is provided, guide user to email or cloud link
        if (fileSizeMB > 10) {
          if (!deliveryExternalUrl?.trim()) {
            setMsg({
              type: 'error',
              text: `El video "${deliveryFile.name}" pesa ${fileSizeMB.toFixed(1)} MB y supera el límite de subida directa (10 MB). Para evitar errores de carga, utiliza la opción "Enviado por Mail" o ingresa un enlace de Drive / WeTransfer.`
            });
            setActionLoading(false);
            return;
          }
        } else {
          const uploadData = new FormData();
          uploadData.append('file', deliveryFile);
          uploadData.append('fileType', 'OUTPUT_DELIVERY');
          uploadData.append('notes', deliveryNotes || 'Entrega final de post-producción');

          const fileRes = await fetch(`/api/orders/${order.id}/files`, {
            method: 'POST',
            body: uploadData,
          });

          if (!fileRes.ok) {
            let errorMsg = '';
            try {
              const errData = await fileRes.json();
              if (errData?.error) errorMsg = errData.error;
            } catch {
              if (fileRes.status === 413) {
                errorMsg = `El archivo (${fileSizeMB.toFixed(1)} MB) excede el límite del servidor web (Error 413).`;
              } else {
                errorMsg = `Error del servidor (${fileRes.status}) al procesar el archivo directo.`;
              }
            }

            if (deliveryExternalUrl?.trim()) {
              console.warn('Direct upload skipped, proceeding with cloud link:', errorMsg);
            } else {
              setMsg({
                type: 'error',
                text: `${errorMsg || 'Error al subir el archivo entregable.'} Si tienes problemas con el peso del archivo, puedes usar la opción "Enviado por Mail" o ingresar un enlace de Drive / WeTransfer.`
              });
              setActionLoading(false);
              return;
            }
          } else {
            const fileData = await fileRes.json();
            uploadedFileName = fileData.file?.fileName || '';
            uploadedFilePath = fileData.file?.filePath || '';
          }
        }
      }

      const defaultFileName = deliveryMethod === 'EMAIL'
        ? 'Master (Enviado por Mail)'
        : (deliveryExternalUrl ? 'Master en la nube' : 'Entrega Final');

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_DELIVERY',
          deliveryMethod,
          deliveryNotes,
          fileName: uploadedFileName || defaultFileName,
          fileUrl: uploadedFilePath,
          externalUrl: deliveryMethod === 'LINK' ? (deliveryExternalUrl?.trim() || null) : null,
        }),
      });

      if (res.ok) {
        setMsg({ 
          type: 'success', 
          text: deliveryMethod === 'EMAIL'
            ? '¡Trabajo entregado y reportado como enviado por mail! Se notificó a la ejecutiva solicitante para su aprobación.'
            : '¡Trabajo entregado con hora registrada! Se notificó a la ejecutiva solicitante para su aprobación.' 
        });
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

    if (uploadModalFile) {
      const fileSizeMB = uploadModalFile.size / (1024 * 1024);
      if (fileSizeMB > 10 && !uploadModalUrl.trim()) {
        setMsg({
          type: 'error',
          text: `El archivo "${uploadModalFile.name}" pesa ${fileSizeMB.toFixed(1)} MB y supera el límite directo (10 MB). Por favor pega el enlace de descarga en la nube (Drive/WeTransfer/Frame.io).`
        });
        return;
      }
    }

    setActionLoading(true);
    setMsg(null);
    try {
      const formData = new FormData();
      if (uploadModalFile && (uploadModalFile.size / (1024 * 1024) <= 10)) {
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
        let errorMsg = '';
        try {
          const err = await res.json();
          if (err?.error) errorMsg = err.error;
        } catch {
          if (res.status === 413) {
            errorMsg = 'El archivo supera el tamaño permitido por el servidor web (413).';
          } else {
            errorMsg = `Error del servidor (${res.status}).`;
          }
        }
        setMsg({ type: 'error', text: `${errorMsg || 'Error al adjuntar archivo.'} Por favor utiliza un enlace en la nube.` });
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
          changeChecklist: changeChecklistItems.filter((i) => i.trim().length > 0),
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
      setChangeChecklistItems(['']);
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

  // Calculations for Digital Costs and Profitability
  const packageVal = Number(digitalCosts.packageValue || order?.packageValue || 0);
  const producerCost = Number(digitalCosts.producerCost || 0);
  const reporterCost = Number(digitalCosts.reporterCost || 0);
  const mobilizationCost = Number(digitalCosts.mobilizationCost || 0);
  const otherCost = Number(digitalCosts.otherCost || 0);
  const totalExpenses = producerCost + reporterCost + mobilizationCost + otherCost;
  const agencyCommissionAmount = digitalCosts.agencyCommissionApplies ? packageVal * 0.15 : 0;
  const netMargin = packageVal - agencyCommissionAmount - totalExpenses;
  const profitabilityPercent = packageVal > 0 ? (netMargin / packageVal) * 100 : 0;
  const isOptimalProfitability = profitabilityPercent >= 70;

  const handleSaveFinancialCosts = async () => {
    if (!order) return;
    setSavingCosts(true);
    setCostsSuccessMsg('');
    try {
      const payload = {
        producerCost,
        reporterCost,
        mobilizationCost,
        otherCost,
        agencyCommissionApplies: digitalCosts.agencyCommissionApplies,
        agencyCommissionRate: 15,
        agencyCommissionAmount,
        totalExpenses,
        netMargin,
        profitabilityPercent: Number(profitabilityPercent.toFixed(1)),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name,
      };

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_FINANCIAL_COSTS',
          financialCosts: payload,
          packageValue: packageVal,
        }),
      });

      if (res.ok) {
        setCostsSuccessMsg('✓ Costos y rentabilidad guardados exitosamente');
        fetchOrder();
        setTimeout(() => setCostsSuccessMsg(''), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar los costos del proyecto');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al guardar los costos');
    } finally {
      setSavingCosts(false);
    }
  };

  const handleAskInquiry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inquiryQuestion.trim() || !order) return;
    setInquiryLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/progress-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ASK', question: inquiryQuestion }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al consultar avance');
      }
      const data = await res.json();
      setOrder(data.order);
      setMsg({ type: 'success', text: 'Consulta de avance enviada al post-productor exitosamente' });
      setShowInquiryForm(false);
      setInquiryQuestion('Solicito información sobre el avance y status actual de la orden.');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error inesperado' });
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleRespondInquiry = async (inquiryId?: string) => {
    if (!inquiryAnswer.trim() || !order) {
      alert('Por favor escribe el detalle del avance antes de enviar.');
      return;
    }
    setInquiryLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/progress-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESPOND', answer: inquiryAnswer, inquiryId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al responder consulta');
      }
      const data = await res.json();
      setOrder(data.order);
      setMsg({ type: 'success', text: 'Reporte de avance enviado a la ejecutiva por correo y notificación' });
      setInquiryAnswer('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error inesperado' });
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleUpdateNewsroomStatus = async (newStatus: string) => {
    if (!order) return;
    setNewsroomLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_NEWSROOM_STATUS', newsroomStatus: newStatus }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al actualizar estado de redacción');
      }
      const data = await res.json();
      setOrder(data.order);
      setMsg({ type: 'success', text: `Estado de Redacción actualizado a "${newStatus}"` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error inesperado' });
    } finally {
      setNewsroomLoading(false);
    }
  };

  const downloadWordDoc = () => {
    if (!order) return;
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Ficha de Rentabilidad - ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 20px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { padding: 8px; border: 1px solid #0f172a; }
          .title { font-size: 16pt; font-weight: bold; text-align: center; color: #0f172a; }
          .section-title { background-color: #0f172a; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 8px; text-transform: uppercase; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .data-table td, .data-table th { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 10pt; }
          .data-table th { background-color: #f1f5f9; text-align: left; font-weight: bold; }
          .label { font-weight: bold; width: 30%; background-color: #f8fafc; }
          .val { width: 70%; }
          .alert-optimal { background-color: #dcfce7; border: 2px solid #16a34a; color: #166534; padding: 12px; font-weight: bold; text-align: center; font-size: 12pt; margin: 15px 0; }
          .alert-warning { background-color: #fee2e2; border: 2px solid #dc2626; color: #991b1b; padding: 12px; font-weight: bold; text-align: center; font-size: 12pt; margin: 15px 0; }
          .signatures { width: 100%; margin-top: 50px; border-collapse: collapse; }
          .signatures td { width: 50%; text-align: center; padding-top: 40px; font-size: 10pt; }
          .sign-line { border-top: 1px solid #475569; width: 75%; margin: 0 auto 5px auto; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 25%; background-color: #00a3ad; color: #ffffff; font-weight: bold; text-align: center;">
              ECUAVISA DIGITAL<br><span style="font-size: 9pt;">PRODUCCIÓN COMERCIAL</span>
            </td>
            <td class="title">
              INFORME DE COSTOS Y RENTABILIDAD DEL PROYECTO
            </td>
            <td style="width: 25%; text-align: center; font-weight: bold; background-color: #fef08a;">
              CÓDIGO SP:<br><span style="font-size: 14pt; color: #000;">${order.orderNumber}</span>
            </td>
          </tr>
        </table>

        <div class="section-title">1. Información General del Proyecto</div>
        <table class="data-table">
          <tr><td class="label">Cliente / Marca:</td><td class="val">${order.clientAgency || ''}</td></tr>
          <tr><td class="label">Producto / Servicio:</td><td class="val">${order.product || ''}</td></tr>
          <tr><td class="label">Campaña / Tagline:</td><td class="val">${order.campaign || 'N/A'}</td></tr>
          <tr><td class="label">Objetivo de Contenido / KPI:</td><td class="val">${order.contentObjective || 'N/A'}</td></tr>
          <tr><td class="label">Ejecutiva Digital Asignada:</td><td class="val">${order.executive?.name || order.creator?.name || ''}</td></tr>
          <tr><td class="label">Editor / Post-Productor:</td><td class="val">${order.postProducer?.name || 'Por asignar'}</td></tr>
          <tr><td class="label">Cronograma Editorial:</td><td class="val">Recepción: ${order.receptionDate || 'N/A'} | Entrega Insumos: ${order.materialDeliveryDate || 'N/A'} | Publicación: ${order.publishDate || order.airDate || 'N/A'}</td></tr>
        </table>

        <div class="section-title">2. Desglose Financiero & Gastos del Proyecto</div>
        <table class="data-table">
          <tr><th>Concepto</th><th>Condición / Detalle</th><th style="text-align: right;">Monto USD</th></tr>
          <tr>
            <td style="font-weight: bold;">Valor del Paquete Comercial</td>
            <td>Tarifa acordada del proyecto publicitario</td>
            <td style="text-align: right; font-weight: bold; color: #0f172a;">$${packageVal.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Comisión de Agencia (15%)</td>
            <td>${digitalCosts.agencyCommissionApplies ? 'APLICA DESCUENTO (15%)' : 'NO APLICA COMISIÓN'}</td>
            <td style="text-align: right; font-weight: bold; color: ${digitalCosts.agencyCommissionApplies ? '#dc2626' : '#64748b'};">
              ${digitalCosts.agencyCommissionApplies ? `-$${agencyCommissionAmount.toFixed(2)} USD` : '$0.00 USD'}
            </td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td colspan="3" style="font-weight: bold; font-size: 9pt; text-transform: uppercase;">Gastos Directos de Producción:</td>
          </tr>
          <tr><td>• Gasto Productor:</td><td>Honorarios de producción en campo</td><td style="text-align: right;">$${producerCost.toFixed(2)} USD</td></tr>
          <tr><td>• Gasto Reportero:</td><td>Honorarios de talento periodístico digital</td><td style="text-align: right;">$${reporterCost.toFixed(2)} USD</td></tr>
          <tr><td>• Gasto Movilización:</td><td>Transporte, viáticos y combustible</td><td style="text-align: right;">$${mobilizationCost.toFixed(2)} USD</td></tr>
          <tr><td>• Otros Gastos:</td><td>Imprevistos, utilería, licencias o compras</td><td style="text-align: right;">$${otherCost.toFixed(2)} USD</td></tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="2">TOTAL GASTOS DIRECTOS:</td>
            <td style="text-align: right; color: #dc2626;">-$${totalExpenses.toFixed(2)} USD</td>
          </tr>
          <tr style="background-color: #e2e8f0; font-weight: bold; font-size: 11pt;">
            <td colspan="2">MARGEN NETO / UTILIDAD BRUTA:</td>
            <td style="text-align: right; color: #0f172a;">$${netMargin.toFixed(2)} USD</td>
          </tr>
          <tr style="background-color: ${isOptimalProfitability ? '#dcfce7' : '#fee2e2'}; font-weight: bold; font-size: 12pt;">
            <td colspan="2">PORCENTAJE DE RENTABILIDAD:</td>
            <td style="text-align: right; color: ${isOptimalProfitability ? '#166534' : '#991b1b'};">${profitabilityPercent.toFixed(1)}%</td>
          </tr>
        </table>

        ${isOptimalProfitability ? `
          <div class="alert-optimal">
            ✅ PROYECTO RENTABLE: Cumple con el objetivo de margen (Rentabilidad: ${profitabilityPercent.toFixed(1)}% &gt;= 70%)
          </div>
        ` : `
          <div class="alert-warning">
            ⚠️ ADVERTENCIA: RENTABILIDAD INSUFICIENTE (Rentabilidad: ${profitabilityPercent.toFixed(1)}% menor al 70% requerido). Requiere autorización de Gerencia.
          </div>
        `}

        <table class="signatures">
          <tr>
            <td>
              <div class="sign-line"></div>
              <strong>Coordinación de Producción</strong><br>
              Ecuavisa Digital
            </td>
            <td>
              <div class="sign-line"></div>
              <strong>Productor Senior / Gerencia</strong><br>
              Aprobación Financiera
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ficha_Rentabilidad_${order.orderNumber}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Full Edit Modal Handlers (Executive / Coordinator / Admin)
  const openEditModal = () => {
    let currentSponsorships: string[] = [];
    try {
      currentSponsorships = JSON.parse(order.sponsorshipTypes || '[]');
    } catch {
      currentSponsorships = [];
    }

    let parsedDigital: any = null;
    if (order.digitalData) {
      try {
        parsedDigital = JSON.parse(order.digitalData);
      } catch (e) {
        console.error(e);
      }
    }

    setEditFormData({
      orderNumber: order.orderNumber || '',
      oiNumber: order.oiNumber || '',
      requiresNewsroom: Boolean(order.requiresNewsroom),
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
      campaign: order.campaign || '',
      contentObjective: order.contentObjective || 'AWARENESS',
      orderDescription: order.orderDescription || '',
      publishDate: order.publishDate || '',
      receptionDate: order.receptionDate || '',
      informCreativeDigital: parsedDigital?.informProfiles?.creativeDigital ?? true,
      informCommunityManager: parsedDigital?.informProfiles?.communityManager ?? true,
      informMonetization: parsedDigital?.informProfiles?.monetization ?? true,
      publicationAccount: parsedDigital?.publicationAccount || '',
      finishedProductDeliveryDate: parsedDigital?.finishedProductDeliveryDate || '',
      platformsAndFormats: parsedDigital?.platformsAndFormats || {},
      isNewsroomSegment: Boolean(parsedDigital?.isNewsroomSegment),
      newsroomSegmentType: parsedDigital?.newsroomDetails?.segmentType || '',
      newsroomDate: parsedDigital?.newsroomDetails?.date || '',
      newsroomTime: parsedDigital?.newsroomDetails?.time || '',
      newsroomLocation: parsedDigital?.newsroomDetails?.location || '',
      resources: parsedDigital?.resources || {},
      agencyCommissionApplies: Boolean(parsedDigital?.financialCosts?.agencyCommissionApplies ?? digitalCosts.agencyCommissionApplies),
    });
    setShowEditModal(true);
  };

  const [duplicating, setDuplicating] = useState(false);
  const [submittingDraft, setSubmittingDraft] = useState(false);

  const handleDuplicateOrder = async () => {
    const confirmDup = window.confirm(
      `¿Deseas duplicar esta SP para crear una nueva orden?\n\nSe creará una nueva SP con un nuevo número correlativo (ej: ${order.orderCategory === 'DIGITAL' ? 'SPD' : 'SP'}-...) manteniendo todos los requerimientos, plataformas y formatos de ${order.orderNumber}.`
    );
    if (!confirmDup) return;

    setDuplicating(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.order) {
        router.push(`/orders/${data.order.id}`);
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al duplicar la SP.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error al duplicar la SP.' });
    } finally {
      setDuplicating(false);
    }
  };

  const handleSubmitDraft = async () => {
    const confirmSubmit = window.confirm(
      `¿Confirmas que deseas enviar oficialmente la orden ${order.orderNumber} a Coordinación?\n\nSe notificará inmediatamente a los coordinadores para su asignación a post-producción.`
    );
    if (!confirmSubmit) return;

    setSubmittingDraft(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT_DRAFT' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `🚀 ¡Orden ${order.orderNumber} enviada oficialmente a Coordinación!` });
        fetchOrder();
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al enviar el borrador.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error al enviar el borrador.' });
    } finally {
      setSubmittingDraft(false);
    }
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
      const isOrderDigital = order.orderCategory === 'DIGITAL';
      let parsedDigital: any = {};
      if (order.digitalData) {
        try {
          parsedDigital = typeof order.digitalData === 'string' ? JSON.parse(order.digitalData) : order.digitalData;
        } catch {
          parsedDigital = {};
        }
      }

      const updatedDigitalPayload = isOrderDigital ? {
        ...parsedDigital,
        campaign: editFormData.campaign,
        contentObjective: editFormData.contentObjective,
        orderDescription: editFormData.orderDescription,
        receptionDate: editFormData.receptionDate,
        publishDate: editFormData.publishDate,
        finishedProductDeliveryDate: editFormData.finishedProductDeliveryDate,
        publicationAccount: editFormData.publicationAccount,
        platformsAndFormats: editFormData.platformsAndFormats,
        isNewsroomSegment: editFormData.isNewsroomSegment,
        newsroomDetails: editFormData.isNewsroomSegment ? {
          segmentType: editFormData.newsroomSegmentType,
          date: editFormData.newsroomDate,
          time: editFormData.newsroomTime,
          location: editFormData.newsroomLocation,
        } : null,
        resources: editFormData.resources,
        agencyCommissionApplies: editFormData.agencyCommissionApplies,
        informProfiles: {
          creativeDigital: editFormData.informCreativeDigital,
          communityManager: editFormData.informCommunityManager,
          monetization: editFormData.informMonetization,
        },
        financialCosts: {
          ...(parsedDigital.financialCosts || {}),
          agencyCommissionApplies: editFormData.agencyCommissionApplies,
          packageValue: parseFloat(editFormData.packageValue) || order.packageValue || 0,
        },
      } : undefined;

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT_ORDER',
          ...editFormData,
          digitalData: updatedDigitalPayload,
          informProfiles: isOrderDigital ? {
            creativeDigital: editFormData.informCreativeDigital,
            communityManager: editFormData.informCommunityManager,
            monetization: editFormData.informMonetization,
          } : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: '¡SP modificada exitosamente! Se registró la fecha, hora y usuario en la trazabilidad y se notificó al equipo.' });
        setShowEditModal(false);
        if (isOrderDigital) {
          setDigitalCosts((prev) => ({
            ...prev,
            agencyCommissionApplies: editFormData.agencyCommissionApplies,
            packageValue: parseFloat(editFormData.packageValue) || prev.packageValue,
          }));
        }
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

  const isDigital = order.orderCategory === 'DIGITAL';
  const digitalParsed = (() => {
    try {
      return typeof order.digitalData === 'string' ? JSON.parse(order.digitalData) : (order.digitalData || {});
    } catch {
      return {};
    }
  })();

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.NUEVA;
  const priorityInfo = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.MEDIA;
  const sponsorshipParsed = (() => {
    try {
      return JSON.parse(order.sponsorshipTypes || '[]');
    } catch {
      return [];
    }
  })();

  const inquiriesList = (() => {
    try {
      return order?.progressInquiries ? JSON.parse(order.progressInquiries) : [];
    } catch {
      return [];
    }
  })();
  const pendingInquiry = inquiriesList.find((i: any) => i.status === 'PENDING');

  const parsedNewsroomData = (() => {
    try {
      return order?.newsroomData ? (typeof order.newsroomData === 'string' ? JSON.parse(order.newsroomData) : order.newsroomData) : null;
    } catch {
      return null;
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
    `📋 *Solicitud de Producción ${isDigital ? 'Digital' : 'Comercial'}*\n` +
    `*Código:* ${order.orderNumber}\n` +
    `*Cliente:* ${order.clientAgency}\n` +
    `*Producto:* ${order.product}\n` +
    (isDigital ? `*Campaña:* ${order.campaign || 'N/A'}\n*Fecha publicación:* ${order.publishDate || 'Por definir'}\n` : `*Fecha al aire:* ${order.airDate || 'Por definir'}\n`) +
    `*Estado:* ${statusInfo.label}\n` +
    `*Ejecutiva:* ${effectiveExecutiveName}`
  );

  const isCoordinator = Boolean(
    user &&
    user.role !== 'COORDINADORA_VENTAS' &&
    (user.role === 'COORDINADOR' || user.role === 'COORDINADOR_PRODUCTOR' || user.role === 'ADMIN' || user.role === 'PRODUCTOR_SENIOR' || (user.role?.toUpperCase().includes('COORDINAD') && !user.role?.toUpperCase().includes('VENTAS')))
  );
  const isPostProducerUser = Boolean(
    user && (user.role === 'POST_PRODUCTOR' || user.role === 'PRODUCTOR_SENIOR' || user.role === 'COORDINADOR_PRODUCTOR' || user.role === 'ADMIN')
  );
  const canEditOrder = Boolean(
    user && ['ADMIN', 'PRODUCTOR_SENIOR', 'COORDINADOR', 'COORDINADORA', 'COORDINADOR_PRODUCTOR', 'SOLICITANTE', 'EJECUTIVA', 'EJECUTIVA_DIGITAL', 'COORDINADORA_VENTAS', 'CREATIVO_DIGITAL', 'COMMUNITY_MANAGER', 'JEFE_MONETIZACION'].includes(user.role)
  );
  const canManageFinancials = Boolean(
    user && (
      isCoordinator || 
      user.role === 'JEFE_MONETIZACION' || 
      user.role === 'ADMIN' || 
      user.role === 'PRODUCTOR_SENIOR' || 
      user.role === 'COORDINADORA_VENTAS' ||
      user.role === 'COORDINADOR_PRODUCTOR' ||
      user.role === 'COORDINADORA' ||
      user.role === 'COORDINADOR' ||
      user.role === 'EJECUTIVA_DIGITAL' || 
      user.role === 'EJECUTIVA' || 
      user.role === 'SOLICITANTE' ||
      order?.creatorId === user?.id ||
      order?.executiveId === user?.id
    )
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
                {order.oiNumber && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 font-mono shadow-2xs">
                    OI: {order.oiNumber}
                  </span>
                )}
                {isDigital ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white border border-emerald-500 shadow-2xs flex items-center gap-1">
                    📱 SP Digital (Redes & Web)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    📺 SP TV (Tradicional)
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                  {statusInfo.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityInfo.badge}`}>
                  {priorityInfo.label}
                </span>

                {/* Redacción Badge */}
                {order.requiresNewsroom && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border flex items-center gap-1 shadow-2xs ${
                    order.newsroomStatus === 'ENTREGADO'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : order.newsroomStatus === 'INGRESADO'
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : order.newsroomStatus === 'RECIBIDO'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    📰 Redacción: {order.newsroomStatus === 'ENTREGADO' ? '✅ Entregado' : order.newsroomStatus === 'INGRESADO' ? '✍️ Ingresado' : order.newsroomStatus === 'RECIBIDO' ? '📥 Recibido' : '⏳ Pendiente'}
                  </span>
                )}

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
                  order.packageValue > 0 && user?.role !== 'REDACCION' && (
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
            {order.isDemo && order.demoStatus !== 'VENDIDO' && (isCoordinator || user?.role === 'SOLICITANTE') && (
              <Link
                href={`/orders/new?fromDemoId=${order.id}`}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md animate-pulse"
              >
                💰 Convertir a Venta Oficial
              </Link>
            )}

            {/* Edit Full SP Action (Executive, Coordinator, Admin) */}
            {canEditOrder && (
              <button
                type="button"
                onClick={openEditModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> ✏️ Editar SP
              </button>
            )}

            {/* Duplicate SP Action */}
            <button
              type="button"
              onClick={handleDuplicateOrder}
              disabled={duplicating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Duplica esta orden generando un nuevo correlativo como base para una nueva SP"
            >
              <Copy className="w-3.5 h-3.5" />
              {duplicating ? 'Duplicando...' : '📑 Duplicar SP'}
            </button>

            {/* Direct WhatsApp Share */}
            <a
              href={`https://wa.me/?text=${waShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Compartir WhatsApp
            </a>

            {/* Enviar SP por Correo a Externo (PDF / Direct link) */}
            <button
              type="button"
              onClick={handleOpenShareEmailModal}
              className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Enviar esta SP por correo a clientes, agencias o contactos externos con enlace a la ficha PDF sin login"
            >
              <Mail className="w-3.5 h-3.5" /> ✉️ Enviar por Mail (PDF / Externo)
            </button>

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

        {/* Banner de Estado BORRADOR */}
        {order.status === 'BORRADOR' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                📝
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Orden en Estado: BORRADOR (Sin Enviar a Coordinación)
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    Edición Preliminar
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Esta SP está guardada como borrador con el código <strong>{order.orderNumber}</strong>. No ha sido enviada a Coordinación ni notificada a los editores. Puedes modificar los datos y enviarla oficialmente cuando esté lista.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              {canEditOrder && (
                <button
                  type="button"
                  onClick={openEditModal}
                  className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Editar Borrador
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmitDraft}
                disabled={submittingDraft}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingDraft ? 'Enviando...' : '🚀 Enviar SP a Coordinación'}
              </button>
            </div>
          </div>
        )}

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

            {order.demoStatus !== 'VENDIDO' && (isCoordinator || user?.role === 'SOLICITANTE') && (
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
            {isDigital ? (
              <>
                {/* SECCIÓN 1: INFORMACIÓN EDITORIAL DIGITAL */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 px-6 py-2.5 border-b border-emerald-600 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-400" /> INFORMACIÓN EDITORIAL DIGITAL & COMERCIAL
                      </span>
                      {canEditOrder && (
                        <button
                          type="button"
                          onClick={openEditModal}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          <Edit className="w-3 h-3" /> Editar SP
                        </button>
                      )}
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-300">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-6 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Ejecutiva Digital:</span>
                      <strong className="text-slate-900 font-bold">{order.executive?.name || order.creator?.name}</strong>
                      {order.executiveId && order.creatorId !== order.executiveId && (
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                          (Ingresada por: {order.creator?.name})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Cliente / Marca:</span>
                      <strong className="text-slate-900 font-bold">{order.clientAgency}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Producto / Servicio:</span>
                      <strong className="text-slate-900 font-bold">{order.product}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Campaña:</span>
                      <strong className="text-slate-900 font-bold">{order.campaign || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Objetivo / KPI:</span>
                      <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded font-black text-[11px] inline-block">
                        🎯 {order.contentObjective || 'N/A'}
                      </span>
                    </div>
                    {user?.role !== 'REDACCION' && (
                      <div>
                        <span className="text-emerald-700 block text-[11px] font-bold">Valor Paquete Digital:</span>
                        <strong className="text-emerald-900 font-black text-sm">
                          ${Number(order.packageValue || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </div>
                    )}
                    {order.orderDescription && (
                      <div className="col-span-2 sm:col-span-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-bold mb-1 uppercase tracking-wider">
                          📝 Descripción del Pedido / Requerimiento:
                        </span>
                        <p className="text-slate-800 font-medium whitespace-pre-wrap">{order.orderDescription}</p>
                      </div>
                    )}

                    {/* Perfiles Digitales Notificados a nivel Informativo */}
                    <div className="col-span-2 sm:col-span-6 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-indigo-950 block text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          🔔 Equipo Notificado a Nivel Informativo (Sin Rol de Aprobación):
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                          Solo informativo
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          digitalParsed?.informProfiles?.creativeDigital !== false
                            ? 'bg-violet-50 text-violet-800 border-violet-200 shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                        }`}>
                          🎨 Creativo Digital {digitalParsed?.informProfiles?.creativeDigital !== false ? '✓' : '(No)'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          digitalParsed?.informProfiles?.communityManager !== false
                            ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                        }`}>
                          📲 Community Manager {digitalParsed?.informProfiles?.communityManager !== false ? '✓' : '(No)'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          digitalParsed?.informProfiles?.monetization !== false
                            ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                        }`}>
                          💎 Jefe de Monetización {digitalParsed?.informProfiles?.monetization !== false ? '✓' : '(No)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: CRONOGRAMA & FECHAS DIGITALES */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-teal-50 px-6 py-2.5 border-b border-teal-200 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-teal-950 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-700" /> CRONOGRAMA & FECHAS DE ENTREGA DIGITAL
                    </span>
                    <span className="text-xs font-bold text-teal-800">
                      Brief: {order.hasBrief ? 'SI [✓]' : 'NO [ ]'}
                    </span>
                  </div>
                  <div className="p-6 space-y-4 text-xs">
                    {/* Cloud Download URL */}
                    {order.downloadUrl && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                              Link de Insumos / Recursos (Drive / WeTransfer / Dropbox)
                            </span>
                            <a
                              href={order.downloadUrl.startsWith('http') ? order.downloadUrl : `https://${order.downloadUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-950 hover:text-emerald-700 underline break-all inline-block mt-0.5"
                            >
                              {order.downloadUrl}
                            </a>
                          </div>
                        </div>
                        <a
                          href={order.downloadUrl.startsWith('http') ? order.downloadUrl : `https://${order.downloadUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 inline-flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir Link en la Nube
                        </a>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] block font-bold uppercase">1. Recepción Solicitud:</span>
                        <strong className="text-slate-800 font-bold text-xs">{order.receptionDate || formatDate(order.createdAt)}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] block font-bold uppercase">2. Entrega Material:</span>
                        <strong className="text-slate-800 font-bold text-xs">{order.materialDeliveryDate || 'N/A'}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] block font-bold uppercase">3. Entrega Producto Final:</span>
                        <strong className="text-slate-800 font-bold text-xs">{digitalParsed.finishedProductDeliveryDate || 'N/A'}</strong>
                      </div>
                      <div className="bg-red-50/70 p-3 rounded-xl border border-red-200">
                        <span className="text-red-600 text-[10px] block font-black uppercase">4. Publicación en Redes:</span>
                        <strong className="text-red-700 font-black text-xs">{order.publishDate || order.airDate || 'Por definir'}</strong>
                      </div>
                    </div>

                    {digitalParsed.publicationAccount && (
                      <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <span className="text-indigo-900 font-bold text-xs">
                          📢 Cuenta de Ecuavisa para publicar / colaboración:
                        </span>
                        <span className="font-black text-indigo-950 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                          {digitalParsed.publicationAccount}
                        </span>
                      </div>
                    )}

                    {order.materialNotes && (
                      <div>
                        <span className="text-slate-400 text-[11px] block font-semibold mb-1">Instrucciones Especiales / Copys:</span>
                        <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap">
                          {order.materialNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECCIÓN 3: MATRIZ DE PLATAFORMAS & FORMATOS DIGITALES */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" /> Plataformas y Formatos Digitales Solicitados
                  </h3>

                  {digitalParsed.platformsAndFormats && Object.keys(digitalParsed.platformsAndFormats).some((k) => (digitalParsed.platformsAndFormats[k] || []).length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(digitalParsed.platformsAndFormats).map(([format, networks]: [string, any]) => {
                        if (!networks || networks.length === 0) return null;
                        return (
                          <div key={format} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
                            <span className="font-black text-xs text-slate-900 block">{format}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {networks.map((netId: string) => {
                                const net = DIGITAL_NETWORKS.find((n) => n.id === netId);
                                return (
                                  <span key={netId} className="bg-white text-emerald-950 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                                    {net?.icon || '🌐'} {net?.name || netId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">No se especificaron formatos en la matriz.</p>
                  )}

                  {/* Cobertura de redacción si aplica */}
                  {digitalParsed.isNewsroomSegment && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        📰 Cobertura / Segmento de Redacción
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-amber-700 font-bold block">Tipo:</span>
                          <strong className="text-amber-950 font-black">{digitalParsed.newsroomDetails?.segmentType || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 font-bold block">Fecha:</span>
                          <strong className="text-amber-950 font-black">{digitalParsed.newsroomDetails?.date || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 font-bold block">Hora:</span>
                          <strong className="text-amber-950 font-black">{digitalParsed.newsroomDetails?.time || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 font-bold block">Lugar:</span>
                          <strong className="text-amber-950 font-black">{digitalParsed.newsroomDetails?.location || 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Checklist Recursos */}
                  {digitalParsed.resources && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-black uppercase text-slate-500 block mb-2">
                        Checklist de Recursos y Materiales Entregados:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {DIGITAL_RESOURCES_LIST.map((res) => {
                          const val = digitalParsed.resources?.[res.id] || 'NO';
                          const isYes = val === 'SI';
                          return (
                            <div key={res.id} className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                              isYes ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                              <span>{res.label}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                                isYes ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isYes ? 'SI ✓' : 'NO'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#fef08a] px-6 py-2.5 border-b border-yellow-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-yellow-950">
                    INFORMACIÓN GENERAL
                  </span>
                  {canEditOrder && (
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
                {user?.role !== 'REDACCION' && (
                  <div>
                    <span className="text-emerald-700 block text-[11px] font-bold">Valor Paquete:</span>
                    <strong className="text-emerald-900 font-black text-sm">
                      ${Number(order.packageValue || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                )}
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
                  {canEditOrder && (
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
                    {canEditOrder && (
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
                    {canEditOrder && (
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
                  {canEditOrder && (
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
                  {canEditOrder && (
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
              </>
            )}

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
                    <>
                      {outputFiles.map((f: any) => (
                        <div key={f.id} className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                            <span className="bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.5 rounded text-[10px] shrink-0">
                              V{f.version || 1}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-emerald-900 truncate block">✨ {f.fileName}</span>
                              {f.notes && <span className="text-[10px] text-emerald-700 block truncate">{f.notes}</span>}
                            </div>
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
                              (f.fileName?.toLowerCase().includes('mail') || f.fileMime === 'message/rfc822') ? (
                                <span className="text-sky-800 bg-sky-100 border border-sky-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                                  ✉️ Enviado por Mail
                                </span>
                              ) : (
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
                              )
                            ) : null}
                          </div>
                        </div>
                      ))}

                      {/* Workamajig Feature: Client Review Link */}
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-blue-950 flex items-center gap-1">
                              🔗 Link de Aprobación para Cliente / Agencia
                            </span>
                            {order.clientApprovedAt ? (
                              <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                ✅ Aprobado por {order.clientApprovedBy || 'Cliente'}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Sin login requerido
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-blue-700 mt-0.5">
                            Comparte este enlace directo para que el cliente revise las piezas y apruebe o solicite cambios en 1 clic.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {order.clientReviewToken ? (
                            <button
                              type="button"
                              onClick={() => {
                                const url = `${window.location.origin}/review/${order.clientReviewToken}`;
                                navigator.clipboard.writeText(url);
                                alert('¡Enlace de revisión copiado al portapapeles!\n' + url);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copiar Link Cliente
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleGenerateClientToken}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Link2 className="w-3.5 h-3.5" /> Generar Link Cliente
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action & Activity Column (1 col) */}
          <div className="space-y-6">
            {/* PANEL 1: ASIGNACIÓN A POST-PRODUCTOR (Coordinador / Admin / Productor Senior / Coordinador-Productor) */}
            {isCoordinator && (
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

                {user?.role === 'COORDINADOR_PRODUCTOR' && (
                  <div className="bg-teal-50 border border-teal-200 text-teal-900 rounded-xl p-2.5 text-[11px] font-medium flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <span>Puedes <strong>autoasignarte</strong> esta orden seleccionando tu propio nombre como editor principal o de apoyo.</span>
                  </div>
                )}

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
                      {postProducers.length === 0 && (
                        <option disabled value="">⏳ Cargando post-productores...</option>
                      )}
                      {postProducers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.workload?.dot ? `${p.workload.dot} ` : ''}{p.role === 'PRODUCTOR_SENIOR' ? '👑 ' : p.role === 'COORDINADOR_PRODUCTOR' ? '🎯 ' : '🎬 '}{p.name} {p.activeOrders !== undefined ? `[${p.activeOrders} activas]` : ''} {p.role === 'PRODUCTOR_SENIOR' ? '(Senior)' : p.role === 'COORDINADOR_PRODUCTOR' ? '(Coord-Prod)' : ''}
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
                      {postProducers.length === 0 && (
                        <option disabled value="">⏳ Cargando post-productores...</option>
                      )}
                      {postProducers
                        .filter((p) => p.id !== selectedPostId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.workload?.dot ? `${p.workload.dot} ` : ''}{p.role === 'PRODUCTOR_SENIOR' ? '👑 ' : p.role === 'COORDINADOR_PRODUCTOR' ? '🎯 ' : '🤝 '}{p.name} {p.activeOrders !== undefined ? `[${p.activeOrders} activas]` : ''}
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

            {/* PANEL DE GASTOS & RENTABILIDAD DEL PROYECTO (SP DIGITAL) */}
            {order.orderCategory === 'DIGITAL' && user?.role !== 'REDACCION' && (
              <div className="bg-white rounded-3xl border border-emerald-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      💰
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Gastos & Rentabilidad (Proyecto Digital)</h3>
                      <p className="text-[10px] text-slate-500">Hoja de costos • Meta mínima: &gt;= 70%</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${isOptimalProfitability ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
                    {profitabilityPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Valor del Paquete */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Valor del Paquete Comercial:</span>
                      <span className="font-mono font-black text-slate-900">${packageVal.toFixed(2)} USD</span>
                    </label>
                    {canManageFinancials ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={digitalCosts.packageValue || ''}
                        onChange={(e) => setDigitalCosts({ ...digitalCosts, packageValue: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="font-mono font-bold text-slate-800">${packageVal.toFixed(2)} USD</p>
                    )}
                  </div>

                  {/* Comisión de Agencia (15%) Checkbox */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManageFinancials}
                        checked={digitalCosts.agencyCommissionApplies}
                        onChange={(e) => setDigitalCosts({ ...digitalCosts, agencyCommissionApplies: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Descontar Comisión de Agencia (15%)</span>
                    </label>
                    <span className={`font-mono text-xs font-bold ${digitalCosts.agencyCommissionApplies ? 'text-rose-600' : 'text-slate-400'}`}>
                      {digitalCosts.agencyCommissionApplies ? `-$${agencyCommissionAmount.toFixed(2)}` : '$0.00'}
                    </span>
                  </div>

                  {/* Gastos del Proyecto */}
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Gastos Directos de Producción:
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Productor ($):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!canManageFinancials}
                          value={digitalCosts.producerCost || ''}
                          onChange={(e) => setDigitalCosts({ ...digitalCosts, producerCost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:opacity-60"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Reportero ($):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!canManageFinancials}
                          value={digitalCosts.reporterCost || ''}
                          onChange={(e) => setDigitalCosts({ ...digitalCosts, reporterCost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:opacity-60"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Movilización ($):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!canManageFinancials}
                          value={digitalCosts.mobilizationCost || ''}
                          onChange={(e) => setDigitalCosts({ ...digitalCosts, mobilizationCost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:opacity-60"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Otros ($):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!canManageFinancials}
                          value={digitalCosts.otherCost || ''}
                          onChange={(e) => setDigitalCosts({ ...digitalCosts, otherCost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:opacity-60"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 bg-slate-100 p-2 rounded-lg">
                      <span>Total Gastos:</span>
                      <span className="font-mono text-rose-700 font-black">-${totalExpenses.toFixed(2)} USD</span>
                    </div>
                  </div>

                  {/* Resumen de Margen & Rentabilidad con Alerta */}
                  <div className={`p-3 rounded-2xl border-2 space-y-1.5 transition-all ${isOptimalProfitability ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-rose-50 border-rose-500 text-rose-950'}`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Margen Neto (Utilidad):</span>
                      <span className="font-mono font-black text-sm">${netMargin.toFixed(2)} USD</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-black pt-1 border-t border-black/10">
                      <span>Rentabilidad:</span>
                      <span className="font-mono text-base">{profitabilityPercent.toFixed(1)}%</span>
                    </div>
                    <div className="text-[10px] font-bold pt-1">
                      {isOptimalProfitability ? (
                        <p className="text-emerald-800 flex items-center gap-1">
                          <span>✅</span> <span>Rentabilidad óptima (Mayor o igual al 70% requerido).</span>
                        </p>
                      ) : (
                        <p className="text-rose-700 font-black flex items-center gap-1">
                          <span>⚠️</span> <span>ADVERTENCIA: Rentabilidad menor al 70% requerido.</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {costsSuccessMsg && (
                    <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-[11px] font-bold text-center">
                      {costsSuccessMsg}
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="space-y-2 pt-1">
                    {canManageFinancials && (
                      <button
                        type="button"
                        onClick={handleSaveFinancialCosts}
                        disabled={savingCosts}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {savingCosts ? 'Guardando Costos...' : 'Guardar Costos y Rentabilidad'}
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-1.5">
                      <Link
                        href={`/orders/${order.id}/cost-sheet`}
                        target="_blank"
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs text-center transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ficha PDF</span>
                      </Link>

                      <button
                        type="button"
                        onClick={downloadWordDoc}
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs text-center transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Word .doc</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenShareEmailModal}
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shadow-xs text-center transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Enviar Mail</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 2: POST-PRODUCTOR ACCIONES (Recepción y Entrega) */}
            {(isPostProducerUser || order.postProducerId === user?.id || order.secondaryPostProducerId === user?.id) && (
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

                {/* Sub-Action: Checklist Interactivo de Correcciones (Workamajig Feature) */}
                {Array.isArray(order.changeChecklist) && order.changeChecklist.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-amber-700" /> Checklist de Correcciones
                      </span>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        {order.changeChecklist.filter((c: any) => c.done).length} / {order.changeChecklist.length} listos
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {order.changeChecklist.map((item: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleChecklist(idx)}
                          className={`w-full text-left flex items-start gap-2 p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            item.done ? 'bg-amber-100/50 text-slate-400 line-through' : 'bg-white text-slate-800 hover:bg-amber-100/60 shadow-2xs'
                          }`}
                        >
                          {item.done ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <span className="leading-snug">{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-Action B: Formulario de Entrega Final de Post */}
                {(order.status === 'EN_PROCESO' || order.status === 'CON_CAMBIOS' || order.status === 'ASIGNADA' || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR') && (
                  <form onSubmit={handleResolveDelivery} className="space-y-3.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" /> Método de Entrega del Comercial:
                      </span>
                    </div>

                    {/* Selector de Método de Entrega */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('EMAIL')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                          deliveryMethod === 'EMAIL'
                            ? 'bg-white text-sky-700 shadow-sm border border-sky-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>✉️</span>
                        <span className="truncate">Enviado por Mail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('LINK')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                          deliveryMethod === 'LINK'
                            ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🔗</span>
                        <span className="truncate">Enlace Nube</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('FILE')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                          deliveryMethod === 'FILE'
                            ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>📁</span>
                        <span className="truncate">Subir Archivo</span>
                      </button>
                    </div>

                    {/* Contenido según método */}
                    {deliveryMethod === 'EMAIL' && (
                      <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-sky-950 font-black text-xs">
                          <span>✉️</span>
                          <span>Entrega directa vía Correo Electrónico (Mail)</span>
                        </div>
                        <p className="text-[11px] text-sky-800 leading-relaxed">
                          <strong>No requiere subir archivos:</strong> Puedes dar por terminada y entregada la SP directamente sin preocuparte por el peso del video. La SP cambiará a estado <strong>Resuelta</strong> y se notificará a la ejecutiva solicitante.
                        </p>
                      </div>
                    )}

                    {deliveryMethod === 'LINK' && (
                      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-indigo-950 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-indigo-600" /> Enlace en la Nube (Drive / Frame.io / WeTransfer):
                          </label>
                        </div>
                        <p className="text-[10px] text-indigo-700 leading-tight">
                          Para masters en alta resolución (MP4, ProRes, MOV), pega el enlace para entrega inmediata sin límite de tamaño.
                        </p>
                        <input
                          type="url"
                          value={deliveryExternalUrl}
                          onChange={(e) => setDeliveryExternalUrl(e.target.value)}
                          placeholder="https://drive.google.com/... o enlace WeTransfer / Frame.io"
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {deliveryMethod === 'FILE' && (
                      <div className="space-y-1.5">
                        <input
                          type="file"
                          onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl p-1"
                        />

                        {deliveryFile && (
                          <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                            deliveryFile.size > 10 * 1024 * 1024
                              ? 'bg-amber-50 border-amber-300 text-amber-900'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          }`}>
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate">📁 {deliveryFile.name}</span>
                              <span className="font-mono shrink-0 ml-2">{(deliveryFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                            </div>
                            {deliveryFile.size > 10 * 1024 * 1024 && (
                              <p className="text-[10px] text-amber-800 leading-tight">
                                ⚠️ <strong>Video pesado (más de 10 MB):</strong> Te recomendamos seleccionar <strong>"Enviado por Mail"</strong> o <strong>"Enlace Nube"</strong> para evitar errores de servidor.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Notas de Entrega (Opcional):
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder={deliveryMethod === 'EMAIL' ? 'Ej. Enviado por mail a la ejecutiva y cliente...' : 'Ej. Master en ProRes y MP4, audio nivelado a -24 LUFS...'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className={`w-full text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                        deliveryMethod === 'EMAIL'
                          ? 'bg-sky-600 hover:bg-sky-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      {actionLoading
                        ? 'Procesando entrega...'
                        : deliveryMethod === 'EMAIL'
                        ? '✉️ Marcar como Entregada (Enviado por Mail)'
                        : deliveryMethod === 'LINK'
                        ? '🔗 Entregar con Enlace Nube'
                        : '📁 Subir y Entregar Video'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* PANEL: MESA DE REDACCIÓN (Si requiresNewsroom está activado) */}
            {order.requiresNewsroom && (
              <div className="bg-white rounded-3xl border border-amber-300 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                      📰
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Mesa de Redacción</h3>
                      <p className="text-[10px] text-slate-500">Requerimiento Editorial & Cobertura</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    order.newsroomStatus === 'ENTREGADO'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : order.newsroomStatus === 'INGRESADO'
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : order.newsroomStatus === 'RECIBIDO'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {order.newsroomStatus === 'ENTREGADO' ? '✅ Entregado' : order.newsroomStatus === 'INGRESADO' ? '✍️ Ingresado' : order.newsroomStatus === 'RECIBIDO' ? '📥 Recibido' : '⏳ Pendiente'}
                  </span>
                </div>

                {/* Resumen de Requerimiento */}
                {parsedNewsroomData && (
                  <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
                    {parsedNewsroomData.editorialDetails && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-900 block">Pauta Editorial:</span>
                        <p className="text-slate-800 text-[11px]">{parsedNewsroomData.editorialDetails}</p>
                      </div>
                    )}
                    {parsedNewsroomData.expectedDeliverable && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-900 block">Entregable:</span>
                        <p className="text-slate-800 text-[11px] font-bold">{parsedNewsroomData.expectedDeliverable}</p>
                      </div>
                    )}
                    {parsedNewsroomData.onSiteContact && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-900 block">Contacto en Sitio:</span>
                        <p className="text-slate-800 text-[11px]">{parsedNewsroomData.onSiteContact}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      {parsedNewsroomData.requiresJournalist && (
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                          🎤 Periodista
                        </span>
                      )}
                      {parsedNewsroomData.requiresCameraperson && (
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                          📹 Camarógrafo
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones de acción para Redacción / Coordinación / Admin */}
                {(user?.role === 'REDACCION' || isCoordinator || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR') && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Actualizar Estado de Redacción:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateNewsroomStatus('RECIBIDO')}
                        disabled={newsroomLoading || order.newsroomStatus === 'RECIBIDO'}
                        className={`py-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                          order.newsroomStatus === 'RECIBIDO'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                        } disabled:opacity-50`}
                      >
                        <span>📥</span> Recibido
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateNewsroomStatus('INGRESADO')}
                        disabled={newsroomLoading || order.newsroomStatus === 'INGRESADO'}
                        className={`py-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                          order.newsroomStatus === 'INGRESADO'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                        } disabled:opacity-50`}
                      >
                        <span>✍️</span> Ingresado
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateNewsroomStatus('ENTREGADO')}
                        disabled={newsroomLoading || order.newsroomStatus === 'ENTREGADO'}
                        className={`py-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                          order.newsroomStatus === 'ENTREGADO'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        } disabled:opacity-50`}
                      >
                        <span>✅</span> Entregado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PANEL: CONSULTA DE AVANCE (EJECUTIVA ↔ POST-PRODUCCIÓN) */}
            <div className="bg-white rounded-3xl border border-sky-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                    💬
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Consulta de Avance</h3>
                    <p className="text-[10px] text-slate-500">Ejecutiva ↔ Post-Producción</p>
                  </div>
                </div>
                {inquiriesList.length > 0 && (
                  <span className="text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full">
                    {inquiriesList.length} {inquiriesList.length === 1 ? 'consulta' : 'consultas'}
                  </span>
                )}
              </div>

              {/* Si el usuario actual es la Ejecutiva o Coordinador o Admin: botón o formulario para consultar */}
              {(user?.role === 'SOLICITANTE' || user?.role === 'EJECUTIVA_DIGITAL' || isCoordinator || user?.id === order.executiveId || user?.id === order.creatorId) && (
                <div className="space-y-3">
                  {!showInquiryForm ? (
                    <button
                      type="button"
                      onClick={() => setShowInquiryForm(true)}
                      className="w-full bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Solicitar Información de Avance</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAskInquiry} className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2.5">
                      <label className="block text-[11px] font-bold text-sky-950">
                        Pregunta o consulta para el Post-Productor:
                      </label>
                      <textarea
                        rows={2}
                        value={inquiryQuestion}
                        onChange={(e) => setInquiryQuestion(e.target.value)}
                        placeholder="Ej: ¿Cómo va el avance del primer corte? ¿Cuándo se estima tener la versión lista?"
                        className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowInquiryForm(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={inquiryLoading}
                          className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>{inquiryLoading ? 'Enviando...' : 'Enviar Consulta'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Si el usuario actual es Post-Productor (o Admin) y hay una consulta pendiente o desea responder */}
              {(isPostProducerUser || order.postProducerId === user?.id || order.secondaryPostProducerId === user?.id || isCoordinator) && (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                        ✍️ Responder Status / Avance a la Ejecutiva:
                      </span>
                      {pendingInquiry && (
                        <span className="text-[9px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full animate-pulse">
                          Consulta Pendiente
                        </span>
                      )}
                    </div>
                    {pendingInquiry && (
                      <p className="text-[11px] text-amber-900 bg-white/80 p-2 rounded-xl border border-amber-200 italic">
                        &quot;{pendingInquiry.question}&quot; — <span className="font-bold">{pendingInquiry.askedByUserName}</span>
                      </p>
                    )}
                    <textarea
                      rows={3}
                      value={inquiryAnswer}
                      onChange={(e) => setInquiryAnswer(e.target.value)}
                      placeholder="Escribe el detalle del status actual, lo editado, tomas avanzadas o lo enviado por mail..."
                      className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRespondInquiry(pendingInquiry?.id)}
                      disabled={inquiryLoading || !inquiryAnswer.trim()}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{inquiryLoading ? 'Enviando...' : 'Enviar Reporte de Avance a la Ejecutiva'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Historial de Consultas & Respuestas */}
              {inquiriesList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Historial de Consultas de Avance:
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {inquiriesList.map((inq: any) => (
                      <div key={inq.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">{inq.askedByUserName}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${inq.status === 'RESPONDED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {inq.status === 'RESPONDED' ? '✓ Respondido' : '⏳ Pendiente'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{inq.question}</p>
                        {inq.answer && (
                          <div className="mt-1 pt-1 border-t border-slate-200/80 bg-white p-2 rounded-lg text-[11px]">
                            <span className="font-bold text-emerald-800 block text-[10px]">
                              Respuesta de {inq.respondedByUserName} ({formatDateTime(inq.respondedAt)}):
                            </span>
                            <p className="text-slate-800 mt-0.5">{inq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PANEL 3: APROBACIÓN Y REVISIÓN (Solicitante / Coordinadora / Admin / Productor Senior / Coordinador-Productor) */}
            {(user?.role === 'SOLICITANTE' || isCoordinator) && (
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
                  Descripción General de los Ajustes Requeridos:
                </label>
                <textarea
                  rows={3}
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="Ej. Ajustar la duración del logo final a 3 segundos, corregir el color del cintillo y cambiar el audio de fondo..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                ></textarea>
              </div>

              {/* Checklist de Puntos Específicos para el Editor */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Puntos específicos a corregir (Checklist para el editor):
                  </label>
                  <button
                    type="button"
                    onClick={() => setChangeChecklistItems([...changeChecklistItems, ''])}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Agregar punto
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {changeChecklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Ej: En 0:12 corregir el precio final."
                        value={item}
                        onChange={(e) => {
                          const updated = [...changeChecklistItems];
                          updated[idx] = e.target.value;
                          setChangeChecklistItems(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      {changeChecklistItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setChangeChecklistItems(changeChecklistItems.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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

                  {/* Nomenclatura SP y OI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Número de SP (Nomenclatura) *
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.orderNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, orderNumber: e.target.value })}
                        placeholder="Ej. SPD-XU-101"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Orden de Inserción (OI)
                      </label>
                      <input
                        type="text"
                        value={editFormData.oiNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, oiNumber: e.target.value })}
                        placeholder="Ej. OI-5042"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="editRequiresNewsroom"
                      checked={Boolean(editFormData.requiresNewsroom)}
                      onChange={(e) => setEditFormData({ ...editFormData, requiresNewsroom: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="editRequiresNewsroom" className="text-xs font-bold text-amber-900 cursor-pointer select-none">
                      📰 Requiere gestión en Mesa de Redacción
                    </label>
                  </div>

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

                  {/* Campos Digital vs TV */}
                  {isDigital ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre de la Campaña</label>
                        <input
                          type="text"
                          value={editFormData.campaign}
                          onChange={(e) => setEditFormData({ ...editFormData, campaign: e.target.value })}
                          placeholder="Ej. Lanzamiento App 2026..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Objetivo del Contenido / KPI</label>
                        <select
                          value={editFormData.contentObjective}
                          onChange={(e) => setEditFormData({ ...editFormData, contentObjective: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="AWARENESS">Awareness / Reconocimiento de Marca</option>
                          <option value="ENGAGEMENT">Engagement / Interacción & Conversación</option>
                          <option value="CONVERSION">Conversión / Ventas Directas</option>
                          <option value="TRAFICO">Tráfico al Sitio Web / App</option>
                          <option value="FIDELIZACION">Fidelización & Comunidad</option>
                        </select>
                      </div>
                    </div>
                  ) : (
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
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  {isDigital ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">1. Recepción de Material</label>
                          <input
                            type="date"
                            value={editFormData.receptionDate || editFormData.materialDeliveryDate}
                            onChange={(e) => setEditFormData({ ...editFormData, receptionDate: e.target.value, materialDeliveryDate: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">2. Entrega Producto Final</label>
                          <input
                            type="date"
                            value={editFormData.finishedProductDeliveryDate}
                            onChange={(e) => setEditFormData({ ...editFormData, finishedProductDeliveryDate: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-red-700 mb-1">3. Publicación / Salida Redes</label>
                          <input
                            type="date"
                            value={editFormData.publishDate || editFormData.airDate}
                            onChange={(e) => setEditFormData({ ...editFormData, publishDate: e.target.value, airDate: e.target.value })}
                            className="w-full p-2.5 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-950 focus:ring-2 focus:ring-red-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                          📢 Cuenta Oficial de Ecuavisa para Publicar / Colaboración:
                        </label>
                        <input
                          type="text"
                          value={editFormData.publicationAccount}
                          onChange={(e) => setEditFormData({ ...editFormData, publicationAccount: e.target.value })}
                          placeholder="Ej. Ecuavisa Oficial (@ecuavisa), Estadio, Ecuavisa Deportes..."
                          className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
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
                  )}

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

                {!isDigital ? (
                  <>
                    {/* 3. OPCIONES COMERCIALES / PNTS & AUSPICIOS (SOLO TV) */}
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          📺 3. Opciones Comerciales, Auspicios & PNTs (Selección Múltiple)
                        </h4>
                        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-md">
                          {editFormData.sponsorshipTypes.length} seleccionada(s)
                        </span>
                      </div>

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

                    {/* 4. LOCUCIÓN (SOLO TV) */}
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
                  </>
                ) : (
                  <>
                    {/* 3. PLATAFORMAS & FORMATOS DIGITALES (SOLO DIGITAL) */}
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-emerald-600" /> 📱 3. Plataformas & Formatos Digitales Solicitados
                        </h4>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                          Matriz Digital
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {DIGITAL_FORMATS.map((fmt) => {
                          const selectedNets: string[] = editFormData.platformsAndFormats?.[fmt] || [];
                          return (
                            <div key={fmt} className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1.5 shadow-2xs">
                              <span className="font-bold text-xs text-slate-900 block">{fmt}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {DIGITAL_NETWORKS.map((net) => {
                                  const isSelected = selectedNets.includes(net.id);
                                  return (
                                    <button
                                      key={net.id}
                                      type="button"
                                      onClick={() => {
                                        const updated = isSelected
                                          ? selectedNets.filter((id) => id !== net.id)
                                          : [...selectedNets, net.id];
                                        setEditFormData({
                                          ...editFormData,
                                          platformsAndFormats: {
                                            ...editFormData.platformsAndFormats,
                                            [fmt]: updated,
                                          },
                                        });
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {net.name} {isSelected ? '✓' : ''}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. SEGMENTO NOTICIERO & INSUMOS DIGITALES */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        📋 4. Segmento Noticiero & Insumos Digitales
                      </h4>

                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-950">
                          <input
                            type="checkbox"
                            checked={editFormData.isNewsroomSegment}
                            onChange={(e) => setEditFormData({ ...editFormData, isNewsroomSegment: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                          <span>¿Es Segmento de Noticiero Digital?</span>
                        </label>

                        {editFormData.isNewsroomSegment && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60">
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Tipo de Segmento:</label>
                              <input
                                type="text"
                                value={editFormData.newsroomSegmentType}
                                onChange={(e) => setEditFormData({ ...editFormData, newsroomSegmentType: e.target.value })}
                                placeholder="Ej. En Vivo, Bloque Deportivo, Cápsula..."
                                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Lugar / Ubicación:</label>
                              <input
                                type="text"
                                value={editFormData.newsroomLocation}
                                onChange={(e) => setEditFormData({ ...editFormData, newsroomLocation: e.target.value })}
                                placeholder="Ej. Set Principal, Exteriores..."
                                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Fecha Noticiero:</label>
                              <input
                                type="date"
                                value={editFormData.newsroomDate}
                                onChange={(e) => setEditFormData({ ...editFormData, newsroomDate: e.target.value })}
                                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Hora Estimada:</label>
                              <input
                                type="time"
                                value={editFormData.newsroomTime}
                                onChange={(e) => setEditFormData({ ...editFormData, newsroomTime: e.target.value })}
                                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="block text-[11px] font-bold text-slate-700">Recursos / Insumos Requeridos:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {DIGITAL_RESOURCES_LIST.map((res) => {
                            const isYes = editFormData.resources?.[res.id] === 'SI';
                            return (
                              <button
                                key={res.id}
                                type="button"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    resources: {
                                      ...editFormData.resources,
                                      [res.id]: isYes ? 'NO' : 'SI',
                                    },
                                  });
                                }}
                                className={`p-2 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                                  isYes
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <span>{res.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isYes ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                  {isYes ? 'SI' : 'NO'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 5. COMISIÓN DE AGENCIA (15%) */}
                    <div className="bg-emerald-50/70 p-3.5 rounded-2xl border-2 border-emerald-300 flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.agencyCommissionApplies}
                          onChange={(e) => setEditFormData({ ...editFormData, agencyCommissionApplies: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-black text-xs text-emerald-950 block">💼 Descontar Comisión de Agencia (15%)</span>
                          <span className="text-[11px] text-emerald-700">Marcar si la cuenta viene a través de Agencia de Publicidad.</span>
                        </div>
                      </label>
                      <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg ${
                        editFormData.agencyCommissionApplies ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {editFormData.agencyCommissionApplies ? 'Aplica 15%' : 'No Aplica'}
                      </span>
                    </div>

                    {/* 6. NOTIFICAR A EQUIPO DIGITAL (SOLO INFORMATIVO) */}
                    <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-3">
                      <div>
                        <h4 className="font-black text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          🔔 6. Notificar a Equipo Digital (Solo Informativo)
                        </h4>
                        <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                          Los usuarios seleccionados recibirán notificaciones para conocimiento del flujo. No intervienen como aprobadores ni editores directos.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          editFormData.informCreativeDigital
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={editFormData.informCreativeDigital}
                            onChange={(e) => setEditFormData({ ...editFormData, informCreativeDigital: e.target.checked })}
                            className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                          />
                          <span>🎨 Creativo Digital</span>
                        </label>

                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          editFormData.informCommunityManager
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={editFormData.informCommunityManager}
                            onChange={(e) => setEditFormData({ ...editFormData, informCommunityManager: e.target.checked })}
                            className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                          />
                          <span>📲 Community Manager</span>
                        </label>

                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          editFormData.informMonetization
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={editFormData.informMonetization}
                            onChange={(e) => setEditFormData({ ...editFormData, informMonetization: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                          <span>💎 Jefe de Monetización</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* 5. EQUIPO POST-PRODUCCIÓN (Para Coordinadores / Admins) */}
                {isCoordinator && (
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
                          {postProducers.length === 0 && (
                            <option disabled value="">⏳ Cargando post-productores...</option>
                          )}
                          {postProducers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.workload?.dot ? `${p.workload.dot} ` : ''}{p.role === 'PRODUCTOR_SENIOR' ? '👑 ' : p.role === 'COORDINADOR_PRODUCTOR' ? '🎯 ' : '🎬 '}{p.name} {p.activeOrders !== undefined ? `[${p.activeOrders} activas]` : ''}
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
                          {postProducers.length === 0 && (
                            <option disabled value="">⏳ Cargando post-productores...</option>
                          )}
                          {postProducers
                            .filter((p) => p.id !== editFormData.postProducerId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.workload?.dot ? `${p.workload.dot} ` : ''}{p.role === 'PRODUCTOR_SENIOR' ? '👑 ' : p.role === 'COORDINADOR_PRODUCTOR' ? '🎯 ' : '🤝 '}{p.name} {p.activeOrders !== undefined ? `[${p.activeOrders} activas]` : ''}
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
                    <div className={`mt-2 p-2 rounded-xl text-[11px] space-y-0.5 ${
                      uploadModalFile.size > 10 * 1024 * 1024
                        ? 'bg-amber-50 border border-amber-300 text-amber-900'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      <p className="font-bold">
                        ✓ Seleccionado: {uploadModalFile.name} ({(uploadModalFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                      {uploadModalFile.size > 10 * 1024 * 1024 && (
                        <p className="text-[10px] text-amber-800 leading-tight">
                          ⚠️ <strong>Archivo pesado (más de 10 MB):</strong> Por favor utiliza la opción 2 (enlace en la nube de Google Drive o WeTransfer) para adjuntarlo sin limitaciones de servidor.
                        </p>
                      )}
                    </div>
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

        {/* MODAL: COMPARTIR / ENVIAR SP POR CORREO A EXTERNOS */}
        {showShareEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    ✉️
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      Enviar SP a Contacto Externo
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Para clientes, marcas o agencias sin usuario en el CRM
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareEmailModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Info banner */}
              <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-900 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-sky-950">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Acceso Seguro Sin Contraseña (Token Oficial)</span>
                </div>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  El destinatario recibirá un correo con el membrete institucional de Ecuavisa y un enlace directo a la <strong>Ficha Oficial Imprimible en PDF</strong> para que pueda visualizarla y descargarla sin necesidad de iniciar sesión.
                </p>
              </div>

              {shareResult && (
                <div className={`p-3.5 rounded-2xl border text-xs font-bold space-y-2 ${
                  shareResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {shareResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{shareResult.message}</span>
                  </div>

                  {shareResult.mailtoUrl && (
                    <div className="pt-1 flex flex-wrap gap-2">
                      <a
                        href={shareResult.mailtoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                      >
                        <Mail className="w-3 h-3" /> Abrir en mi Outlook / Correo
                      </a>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendExternalEmail} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Correo Electrónico del Destinatario: *
                  </label>
                  <input
                    type="email"
                    required
                    value={shareRecipientEmail}
                    onChange={(e) => setShareRecipientEmail(e.target.value)}
                    placeholder="ej. cliente@empresa.com o agencia@marketing.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre o Empresa del Contacto (Opcional):
                  </label>
                  <input
                    type="text"
                    value={shareRecipientName}
                    onChange={(e) => setShareRecipientName(e.target.value)}
                    placeholder="ej. Carlos Gómez / Agencia Publicitaria"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nota o Mensaje Personalizado (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={shareCustomMessage}
                    onChange={(e) => setShareCustomMessage(e.target.value)}
                    placeholder="ej. Estimados, les comparto los requerimientos de la SP para su revisión..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={shareSending || !shareRecipientEmail.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {shareSending ? 'Enviando correo...' : '🚀 Enviar Correo con Ficha PDF'}
                  </button>
                </div>
              </form>

              {/* Separador de opciones rápidas */}
              <div className="relative flex items-center justify-center py-0.5">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">o compartir enlace</span>
              </div>

              {/* Botones de acción directa */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    copiedPublicLink
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{copiedPublicLink ? '✓ ¡Enlace Copiado!' : 'Copiar Enlace PDF'}</span>
                </button>

                <Link
                  href={getPublicPdfUrl()}
                  target="_blank"
                  className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Vista Previa PDF</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
