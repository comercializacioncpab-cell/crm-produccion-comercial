'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import DatePicker from '@/components/ui/DatePicker';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Save, 
  AlertCircle, 
  Check, 
  Calendar as CalendarIcon, 
  Clock, 
  Radio, 
  FilePlus2,
  Trash2,
  DollarSign,
  Users,
  FlaskConical,
  BadgePercent,
  Link as LinkIcon,
  Link2,
  ExternalLink,
  Tv,
  Smartphone,
  Share2,
  Send,
  Copy,
  Printer,
  Download
} from 'lucide-react';
import { SPONSORSHIP_OPTIONS, SPONSORSHIP_CATEGORIES, hasStrategicPnt, hasCobertura, formatInitials, SP_TEMPLATES } from '@/lib/order-utils';
import DigitalOrderForm from '@/components/orders/DigitalOrderForm';

function NewOrderForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDemoId = searchParams.get('fromDemoId');
  const duplicateFromId = searchParams.get('duplicateFrom');
  const typeParam = searchParams.get('type')?.toUpperCase();

  // Categoría principal: TV (Tradicional) vs DIGITAL (Redes & Web)
  const isDigitalRole = user?.role === 'EJECUTIVA_DIGITAL' || user?.role === 'CREATIVO_DIGITAL' || user?.role === 'COMMUNITY_MANAGER' || user?.role === 'JEFE_MONETIZACION';
  const [orderCategory, setOrderCategory] = useState<'TV' | 'DIGITAL'>(
    typeParam === 'DIGITAL' 
      ? 'DIGITAL' 
      : typeParam === 'TV' 
      ? 'TV' 
      : (isDigitalRole ? 'DIGITAL' : 'TV')
  );

  useEffect(() => {
    if (typeParam === 'DIGITAL') {
      setOrderCategory('DIGITAL');
    } else if (typeParam === 'TV') {
      setOrderCategory('TV');
    }
  }, [typeParam]);

  // Modalidad para TV: COMMERCIAL o DEMO
  const [orderType, setOrderType] = useState<'COMMERCIAL' | 'DEMO'>('COMMERCIAL');
  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null);
  const [isFromDemo, setIsFromDemo] = useState(false);
  const [sourceDemoId, setSourceDemoId] = useState(fromDemoId || '');
  const [sourceDemoInfo, setSourceDemoInfo] = useState<any>(null);
  const [availableDemos, setAvailableDemos] = useState<any[]>([]);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);

  // Datos específicos para SP Digital (Formulario Editorial EV Digital + Comercial)
  const [digitalData, setDigitalData] = useState({
    campaign: '',
    contentObjective: 'AWARENESS',
    customKpi: '',
    orderDescription: '',
    receptionDate: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    publishDate: '',
    materialDeliveryDate: '',
    finishedProductDeliveryDate: '',
    publicationAccount: '',
    isNewsroomSegment: false,
    newsroomSegmentType: 'COBERTURA EVENTO',
    newsroomDate: '',
    newsroomTime: '',
    newsroomLocation: '',
    resources: {
      brief: 'NO',
      guion: 'NO',
      logo: 'NO',
      imagenes: 'NO',
      video: 'NO',
      hashtagsAndCopys: 'Enviado por la agencia',
      piezasGraficas: '',
      otros: '',
    } as Record<string, string>,
    specialInstructions: '',
    agencyCommissionApplies: false,
    informProfiles: {
      creativeDigital: true,
      communityManager: true,
      monetization: true,
    },
  });

  const [digitalMatrix, setDigitalMatrix] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
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
  });

  const [executives, setExecutives] = useState<any[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [isAssigningForOther, setIsAssigningForOther] = useState(false);
  const [manualOrderNumber, setManualOrderNumber] = useState('');
  const [oiNumber, setOiNumber] = useState('');
  const [requiresNewsroom, setRequiresNewsroom] = useState(false);
  const [newsroomFormData, setNewsroomFormData] = useState<any>({});
  const [files, setFiles] = useState<{ name: string; size: number; fileObj?: File }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCoordinator = user?.role === 'COORDINADOR' || user?.role === 'COORDINADORA_VENTAS' || Boolean(user?.role?.toUpperCase().includes('COORDINAD'));
  const isCoordinatorOrAdmin = isCoordinator || user?.role === 'ADMIN' || user?.role === 'PRODUCTOR_SENIOR';

  // Load executives and available demos
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [usersRes, ordersRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/orders?status=ALL'),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          const allUsers = data.users || [];
          const salesUsers = allUsers.filter((u: any) => u.status === 'APROBADO' && (u.role === 'SOLICITANTE' || u.role === 'EJECUTIVA_DIGITAL' || u.role === 'CREATIVO_DIGITAL' || u.role === 'COMMUNITY_MANAGER' || u.role === 'JEFE_MONETIZACION' || u.role === 'ADMIN' || u.role === 'PRODUCTOR_SENIOR' || u.role === 'COORDINADOR' || u.role === 'COORDINADOR_PRODUCTOR' || u.role === 'COORDINADORA_VENTAS'));
          setExecutives(salesUsers);
        }

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const allOrders = data.orders || [];
          const demos = allOrders.filter((o: any) => o.isDemo && o.demoStatus !== 'VENDIDO');
          setAvailableDemos(demos);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    }
    loadInitialData();
  }, []);

  // Pre-fill if converting from a demo via URL query param
  useEffect(() => {
    if (!fromDemoId) return;

    const loadDemoData = async () => {
      try {
        const res = await fetch(`/api/orders/${fromDemoId}`);
        if (res.ok) {
          const data = await res.json();
          const demo = data.order;
          setSourceDemoInfo(demo);
          setOrderType('COMMERCIAL');
          setIsFromDemo(true);
          setSourceDemoId(demo.id);
          if (demo.executiveId) setSelectedExecutiveId(demo.executiveId);
          setFormData((prev) => ({
            ...prev,
            clientAgency: demo.clientAgency || '',
            product: demo.product || '',
            program: demo.program || '',
            materialDeliveryDate: demo.materialDeliveryDate || '',
            downloadUrl: demo.downloadUrl || '',
            materialNotes: demo.materialNotes ? `[Origen DEMO ${demo.orderNumber}]: ${demo.materialNotes}` : '',
            hasBrief: Boolean(demo.hasBrief),
            sponsorshipTypes: (() => {
              try {
                return JSON.parse(demo.sponsorshipTypes || '[]');
              } catch {
                return [];
              }
            })(),
            customSponsorship: demo.customSponsorship || '',
            voiceoverType: demo.voiceoverType || 'GENERICA',
            voiceoverText: demo.voiceoverText || '',
            priority: demo.priority || 'MEDIA',
            packageValue: '',
          }));
        }
      } catch (err) {
        console.error('Error loading demo to convert:', err);
      }
    };
    loadDemoData();
  }, [fromDemoId]);

  // Pre-fill if duplicating from an existing SP
  useEffect(() => {
    if (!duplicateFromId) return;

    const loadDuplicateData = async () => {
      try {
        const res = await fetch(`/api/orders/${duplicateFromId}`);
        if (res.ok) {
          const data = await res.json();
          const orig = data.order;
          setDuplicateInfo(orig);
          if (orig.orderCategory === 'DIGITAL') {
            setOrderCategory('DIGITAL');
          } else {
            setOrderCategory('TV');
          }

          if (orig.executiveId) setSelectedExecutiveId(orig.executiveId);

          setFormData((prev) => ({
            ...prev,
            clientAgency: orig.clientAgency || '',
            product: `${orig.product} (Copia)`,
            program: orig.program || '',
            materialDeliveryDate: '',
            airDate: '',
            downloadUrl: orig.downloadUrl || '',
            materialNotes: orig.materialNotes || '',
            hasBrief: Boolean(orig.hasBrief),
            sponsorshipTypes: (() => {
              try {
                return JSON.parse(orig.sponsorshipTypes || '[]');
              } catch {
                return [];
              }
            })(),
            customSponsorship: orig.customSponsorship || '',
            voiceoverType: orig.voiceoverType || 'GENERICA',
            voiceoverText: orig.voiceoverText || '',
            priority: orig.priority || 'MEDIA',
            packageValue: orig.packageValue ? String(orig.packageValue) : '',
          }));

          if (orig.digitalData) {
            try {
              const dig = typeof orig.digitalData === 'string' ? JSON.parse(orig.digitalData) : orig.digitalData;
              setDigitalData((prev) => ({
                ...prev,
                campaign: orig.campaign || dig.campaign || '',
                contentObjective: orig.contentObjective || dig.contentObjective || 'AWARENESS',
                orderDescription: orig.orderDescription || dig.orderDescription || '',
                receptionDate: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                publishDate: '',
                materialDeliveryDate: '',
                finishedProductDeliveryDate: '',
                publicationAccount: dig.publicationAccount || '',
                isNewsroomSegment: Boolean(dig.isNewsroomSegment),
                newsroomSegmentType: dig.newsroomDetails?.segmentType || '',
                newsroomDate: '',
                newsroomTime: dig.newsroomDetails?.time || '',
                newsroomLocation: dig.newsroomDetails?.location || '',
                resources: dig.resources || prev.resources,
                specialInstructions: dig.specialInstructions || '',
                agencyCommissionApplies: Boolean(dig.financialCosts?.agencyCommissionApplies || dig.agencyCommissionApplies),
                informProfiles: dig.informProfiles || prev.informProfiles,
              }));
              if (dig.platformsAndFormats) {
                setDigitalMatrix(dig.platformsAndFormats);
              }
            } catch (e) {
              console.error('Error parsing digitalData for duplicate:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error loading order to duplicate:', err);
      }
    };
    loadDuplicateData();
  }, [duplicateFromId]);

  const handleSelectDemoToConvert = (demoId: string) => {
    setSourceDemoId(demoId);
    const demo = availableDemos.find((d) => d.id === demoId);
    if (demo) {
      setSourceDemoInfo(demo);
      if (demo.executiveId) setSelectedExecutiveId(demo.executiveId);
      setFormData((prev) => ({
        ...prev,
        clientAgency: demo.clientAgency || prev.clientAgency,
        product: demo.product || prev.product,
        program: demo.program || prev.program,
        downloadUrl: demo.downloadUrl || prev.downloadUrl,
        materialNotes: demo.materialNotes ? `[Origen DEMO ${demo.orderNumber}]: ${demo.materialNotes}` : prev.materialNotes,
      }));
    }
  };

  const handleSponsorshipToggle = (id: string) => {
    setFormData((prev) => {
      const exists = prev.sponsorshipTypes.includes(id);
      return {
        ...prev,
        sponsorshipTypes: exists
          ? prev.sponsorshipTypes.filter((t) => t !== id)
          : [...prev.sponsorshipTypes, id],
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: f.size,
        fileObj: f,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveOrder = async (isDraftMode: boolean = false, downloadPdfImmediately: boolean = false) => {
    if (isCoordinatorOrAdmin && !selectedExecutiveId) {
      setError('Por favor selecciona de qué Ejecutiva es la cuenta antes de ingresar la SP.');
      return;
    }

    if (!isDraftMode) {
      if (!formData.clientAgency || !formData.product) {
        setError('Por favor completa el Cliente / Marca y el Producto.');
        return;
      }
      if (orderCategory === 'TV' && !formData.airDate) {
        setError('Por favor selecciona la Fecha al Aire en el calendario.');
        return;
      }
      if (orderCategory === 'DIGITAL' && !digitalData.publishDate) {
        setError('Por favor selecciona la Fecha de Publicación en redes en el calendario.');
        return;
      }
    } else {
      if (!formData.clientAgency && !formData.product) {
        setError('Por favor escribe al menos el Cliente o el Producto para guardar como borrador.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const resolvedExecutiveId = selectedExecutiveId || user?.id || null;
      const isDigital = orderCategory === 'DIGITAL';

      const resolvedExecutiveName = newsroomFormData.executiveName || selectedExec?.name || user?.name || '';
      const newsroomPayload = requiresNewsroom ? {
        executiveName: resolvedExecutiveName,
        clientAgency: newsroomFormData.clientAgency !== undefined ? newsroomFormData.clientAgency : formData.clientAgency,
        product: newsroomFormData.product !== undefined ? newsroomFormData.product : formData.product,
        campaign: newsroomFormData.campaign !== undefined ? newsroomFormData.campaign : (isDigital ? digitalData.campaign : undefined),
        contentObjective: newsroomFormData.contentObjective !== undefined ? newsroomFormData.contentObjective : (isDigital ? (digitalData.contentObjective === 'OTRO' ? digitalData.customKpi : digitalData.contentObjective) : undefined),
        orderDescription: newsroomFormData.orderDescription !== undefined ? newsroomFormData.orderDescription : (isDigital ? digitalData.orderDescription : undefined),
        receptionDate: newsroomFormData.receptionDate !== undefined ? newsroomFormData.receptionDate : (isDigital ? digitalData.receptionDate : undefined),
        publishDate: newsroomFormData.publishDate !== undefined ? newsroomFormData.publishDate : (isDigital ? digitalData.publishDate : undefined),
        materialDeliveryDate: newsroomFormData.materialDeliveryDate !== undefined ? newsroomFormData.materialDeliveryDate : (isDigital ? digitalData.materialDeliveryDate : undefined),
        finishedProductDeliveryDate: newsroomFormData.finishedProductDeliveryDate !== undefined ? newsroomFormData.finishedProductDeliveryDate : (isDigital ? digitalData.finishedProductDeliveryDate : undefined),
        platformsAndFormats: newsroomFormData.platformsAndFormats || digitalMatrix,
        publicationAccount: newsroomFormData.publicationAccount !== undefined ? newsroomFormData.publicationAccount : (isDigital ? digitalData.publicationAccount : undefined),
        isNewsroomSegment: newsroomFormData.isNewsroomSegment !== undefined ? newsroomFormData.isNewsroomSegment : (isDigital ? digitalData.isNewsroomSegment : false),
        newsroomSegmentDetail: newsroomFormData.newsroomSegmentDetail !== undefined ? newsroomFormData.newsroomSegmentDetail : (isDigital ? digitalData.newsroomSegmentType : undefined),
        rights: newsroomFormData.rights || '',
        resources: newsroomFormData.resources || (isDigital ? digitalData.resources : {}),
        specialInstructions: newsroomFormData.specialInstructions || (isDigital ? digitalData.specialInstructions : ''),
        ...newsroomFormData,
        // Mantener compatibilidad con nombres anteriores
        editorialDetails: newsroomFormData.specialInstructions || newsroomFormData.editorialDetails || (isDigital ? digitalData.orderDescription : ''),
      } : null;

      const payload = isDigital
        ? {
            orderCategory: 'DIGITAL',
            status: isDraftMode ? 'BORRADOR' : 'NUEVA',
            isDraft: isDraftMode,
            manualOrderNumber: manualOrderNumber.trim() || undefined,
            oiNumber: oiNumber.trim() || undefined,
            requiresNewsroom: Boolean(requiresNewsroom),
            newsroomData: newsroomPayload,
            clientAgency: formData.clientAgency || 'BORRADOR SIN CLIENTE',
            product: formData.product || 'POR DEFINIR',
            campaign: digitalData.campaign,
            contentObjective: digitalData.contentObjective === 'OTRO' ? digitalData.customKpi : digitalData.contentObjective,
            orderDescription: digitalData.orderDescription,
            receptionDate: digitalData.receptionDate,
            publishDate: digitalData.publishDate,
            materialDeliveryDate: digitalData.materialDeliveryDate,
            airDate: digitalData.publishDate,
            downloadUrl: formData.downloadUrl ? formData.downloadUrl.trim() : null,
            materialNotes: digitalData.specialInstructions,
            hasBrief: digitalData.resources?.brief === 'SI',
            sponsorshipTypes: [],
            voiceoverType: 'GENERICA',
            priority: formData.priority,
            packageValue: formData.packageValue,
            executiveId: resolvedExecutiveId,
            digitalData: {
              platformsAndFormats: digitalMatrix,
              publicationAccount: digitalData.publicationAccount,
              isNewsroomSegment: digitalData.isNewsroomSegment,
              newsroomDetails: {
                segmentType: digitalData.newsroomSegmentType,
                date: digitalData.newsroomDate,
                time: digitalData.newsroomTime,
                location: digitalData.newsroomLocation,
              },
              resources: digitalData.resources,
              specialInstructions: digitalData.specialInstructions,
              finishedProductDeliveryDate: digitalData.finishedProductDeliveryDate,
              agencyCommissionApplies: Boolean(digitalData.agencyCommissionApplies),
              informProfiles: digitalData.informProfiles,
              financialCosts: {
                packageValue: parseFloat(formData.packageValue) || 0,
                producerCost: 0,
                reporterCost: 0,
                mobilizationCost: 0,
                otherCost: 0,
                agencyCommissionApplies: Boolean(digitalData.agencyCommissionApplies),
                agencyCommissionRate: 15,
                agencyCommissionAmount: Boolean(digitalData.agencyCommissionApplies) ? (parseFloat(formData.packageValue) || 0) * 0.15 : 0,
                totalExpenses: 0,
                netMargin: (parseFloat(formData.packageValue) || 0) - (Boolean(digitalData.agencyCommissionApplies) ? (parseFloat(formData.packageValue) || 0) * 0.15 : 0),
                profitabilityPercent: Boolean(digitalData.agencyCommissionApplies) ? 85 : 100,
              },
            },
            files: files.map((f) => ({
              fileName: f.name,
              fileSize: f.size,
              fileType: 'INPUT_BRIEF',
              filePath: `/uploads/pending/${f.name}`,
            })),
          }
        : {
            ...formData,
            orderCategory: 'TV',
            status: isDraftMode ? 'BORRADOR' : 'NUEVA',
            isDraft: isDraftMode,
            manualOrderNumber: manualOrderNumber.trim() || undefined,
            oiNumber: oiNumber.trim() || undefined,
            requiresNewsroom: Boolean(requiresNewsroom),
            newsroomData: newsroomPayload,
            clientAgency: formData.clientAgency || 'BORRADOR SIN CLIENTE',
            product: formData.product || 'POR DEFINIR',
            executiveId: resolvedExecutiveId,
            isDemo: orderType === 'DEMO',
            packageValue: orderType === 'DEMO' ? 0 : formData.packageValue,
            sourceDemoId: (orderType === 'COMMERCIAL' && isFromDemo && sourceDemoId) ? sourceDemoId : null,
            files: files.map((f) => ({
              fileName: f.name,
              fileSize: f.size,
              fileType: 'INPUT_BRIEF',
              filePath: `/uploads/pending/${f.name}`,
            })),
          };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la orden');
      }

      const createdOrderId = data.order.id;

      // Upload files if attached
      for (const fileItem of files) {
        if (fileItem.fileObj) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', fileItem.fileObj);
          uploadFormData.append('fileType', 'INPUT_BRIEF');
          uploadFormData.append('notes', 'Insumo inicial subido con la SP');

          await fetch(`/api/orders/${createdOrderId}/files`, {
            method: 'POST',
            body: uploadFormData,
          });
        }
      }

      if (downloadPdfImmediately) {
        window.open(`/orders/${createdOrderId}/print?autoprint=true`, '_blank');
      }

      router.push(`/orders/${createdOrderId}`);
    } catch (err: any) {
      setError(err.message || 'Error inesperado al crear la SP');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveOrder(false);
  };

  const handleApplyTemplate = (tpl: any) => {
    setAppliedTemplateName(tpl.title);
    if (tpl.id === 'demo_preventa') {
      setOrderType('DEMO');
    }
    setFormData((prev) => ({
      ...prev,
      product: tpl.defaults.product || prev.product,
      voiceoverType: tpl.defaults.voiceoverType || prev.voiceoverType,
      priority: tpl.defaults.priority || prev.priority,
      materialNotes: tpl.defaults.materialNotes
        ? prev.materialNotes
          ? `${prev.materialNotes}\n${tpl.defaults.materialNotes}`
          : tpl.defaults.materialNotes
        : prev.materialNotes,
      sponsorshipTypes: tpl.defaults.sponsorshipTypes?.length
        ? tpl.defaults.sponsorshipTypes
        : prev.sponsorshipTypes,
    }));
  };

  const selectedExec = executives.find((e) => e.id === selectedExecutiveId);
  const activeInitials = selectedExec
    ? (selectedExec.initials || formatInitials(selectedExec.name))
    : (isCoordinatorOrAdmin
        ? 'EJ'
        : (user?.initials || (user?.name ? formatInitials(user.name) : 'SP')));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 🧭 SELECTOR DE CANAL PRINCIPAL: TV (TRADICIONAL) VS DIGITAL (REDES & WEB) */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setOrderCategory('TV')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-black transition-all ${
              orderCategory === 'TV'
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-md ring-2 ring-blue-500/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tv className={`w-4 h-4 ${orderCategory === 'TV' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>📺 SP Televisión (Tradicional)</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderCategory('DIGITAL')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-black transition-all ${
              orderCategory === 'DIGITAL'
                ? 'bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white shadow-md ring-2 ring-emerald-500/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className={`w-4 h-4 ${orderCategory === 'DIGITAL' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>📱 SP Digital (Redes Sociales & Web)</span>
          </button>
        </div>

        {/* Banner Header: DIGITAL vs TV */}
        {orderCategory === 'DIGITAL' ? (
          <div className="rounded-3xl p-6 text-white shadow-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-emerald-800/50">
            <div className="flex items-center gap-3">
              <div className="font-black text-xl px-3 py-1.5 rounded-xl shadow bg-emerald-400 text-slate-950">
                📱
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-300">
                  Ecuavisa Digital • Redes Sociales & Web
                </span>
                <h1 className="text-xl sm:text-2xl font-black">
                  Solicitud Editorial EV Digital + Comercial
                </h1>
              </div>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-right">
              <span className="text-[10px] text-slate-300 block font-semibold">Formato de Nomenclatura:</span>
              {isCoordinatorOrAdmin && !selectedExec ? (
                <span className="font-mono font-black text-emerald-300 text-xs">
                  SPD-[EJECUTIVA]-001...
                </span>
              ) : (
                <span className="font-mono font-black text-emerald-400 text-sm">
                  SPD-{activeInitials}-001...
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className={`rounded-3xl p-6 text-white shadow-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            orderType === 'DEMO'
              ? 'bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 border-purple-800/50'
              : 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`font-black text-xl px-3 py-1.5 rounded-xl shadow ${
                orderType === 'DEMO' ? 'bg-purple-400 text-slate-950' : 'bg-cyan-500 text-slate-950'
              }`}>
                {orderType === 'DEMO' ? '🧪' : 'EV'}
              </div>
              <div>
                <span className={`text-xs uppercase tracking-widest font-bold ${
                  orderType === 'DEMO' ? 'text-purple-300' : 'text-cyan-300'
                }`}>
                  {orderType === 'DEMO' ? 'Muestra Comercial / Piloto ($0 USD)' : 'Producción Comercial'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black">
                  {orderType === 'DEMO' ? 'Nueva Solicitud de DEMO ($0 USD)' : 'Nueva Solicitud de Producción (SP)'}
                </h1>
              </div>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-right">
              <span className="text-[10px] text-slate-300 block font-semibold">Formato de Nomenclatura:</span>
              {isCoordinatorOrAdmin && !selectedExec ? (
                <span className="font-mono font-black text-amber-300 text-xs">
                  SP-[EJECUTIVA]-001...
                </span>
              ) : (
                <span className="font-mono font-black text-amber-400 text-sm">
                  SP-{activeInitials}-001...
                </span>
              )}
            </div>
          </div>
        )}

        {/* 🌟 BLOQUES ESPECÍFICOS DE TV (SELECTOR MODALIDAD, PLANTILLAS, CONVERSIÓN DEMO) */}
        {orderCategory === 'TV' && (
          <>
            {/* SELECTOR DE MODALIDAD: SP COMERCIAL vs DEMO ($0) */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrderType('COMMERCIAL');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                  orderType === 'COMMERCIAL'
                    ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>💰 Solicitud Comercial Estándar (Venta)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrderType('DEMO');
                  setIsFromDemo(false);
                  setSourceDemoId('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                  orderType === 'DEMO'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-purple-300" />
                <span>🧪 Solicitud de DEMO / Piloto (Costo $0 USD)</span>
              </button>
            </div>

            {/* ⚡ JOB TEMPLATES / PLANTILLAS RÁPIDAS DE PRODUCCIÓN */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 rounded-3xl border border-slate-700 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Plantillas Rápidas de Producción (Job Templates)
                </span>
                {appliedTemplateName && (
                  <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/40 animate-pulse">
                    ✨ Aplicada: {appliedTemplateName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                Haz clic en un formato típico para auto-completar requerimientos de pauta, especificaciones técnicas y tipo de locución:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {SP_TEMPLATES.map((tpl) => {
                  const isSelected = appliedTemplateName === tpl.title;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 ring-1 ring-cyan-400/50'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-xs font-black block text-white truncate">
                        {tpl.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block line-clamp-2 mt-1 leading-tight">
                        {tpl.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BANNER SI ESTÁ CONVIRTIENDO UN DEMO EN VENTA */}
            {orderType === 'COMMERCIAL' && sourceDemoInfo && (
              <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-base shrink-0 shadow">
                  💰
                </div>
                <div className="text-xs">
                  <h4 className="font-black text-emerald-950 text-sm">
                    ¡Comercializando DEMO {sourceDemoInfo.orderNumber}!
                  </h4>
                  <p className="text-emerald-800 font-medium mt-0.5">
                    Esta nueva SP se registrará como la <strong>Venta Comercial oficial</strong> originada del demo <strong>{sourceDemoInfo.orderNumber}</strong> ({sourceDemoInfo.clientAgency} - {sourceDemoInfo.product}). 
                    Ingresa el valor del paquete comercial acordado con el cliente.
                  </p>
                </div>
              </div>
            )}

            {/* SELECTOR DE VINCULACIÓN A DEMO PREVIO (EN MODO COMERCIAL) */}
            {orderType === 'COMMERCIAL' && !fromDemoId && (
              <div className={`p-4 rounded-2xl border transition-all text-xs ${
                isFromDemo 
                  ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20' 
                  : 'bg-indigo-50/70 border-indigo-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFromDemo}
                      onChange={(e) => {
                        setIsFromDemo(e.target.checked);
                        if (!e.target.checked) {
                          setSourceDemoId('');
                          setSourceDemoInfo(null);
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      🧪 <strong>¿Esta nueva SP proviene de un DEMO previo que se logró comercializar / vender?</strong>
                    </span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Conversión de DEMO
                  </span>
                </div>

                {isFromDemo && (
                  <div className="pt-3 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Selecciona el DEMO original que cerró esta venta:
                    </label>
                    {availableDemos.length === 0 ? (
                      <div className="p-3 bg-white rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                        ⚠️ No hay solicitudes de DEMO pendientes de venta registradas actualmente en el sistema.
                      </div>
                    ) : (
                      <select
                        value={sourceDemoId}
                        onChange={(e) => handleSelectDemoToConvert(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      >
                        <option value="">-- Seleccionar DEMO disponible --</option>
                        {availableDemos.map((demo) => (
                          <option key={demo.id} value={demo.id}>
                            🧪 {demo.orderNumber} • {demo.clientAgency} - {demo.product} ({demo.program || 'Sin programa'})
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-[11px] text-slate-600">
                      Al asociarlo, los datos del cliente se autocompletarán, el DEMO original quedará registrado como <strong>VENDIDO</strong> y se sumará a los reportes de ingresos y efectividad comercial.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {duplicateInfo && (
          <div className="p-4 bg-indigo-50 border-2 border-indigo-300 text-indigo-950 text-xs rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-xs text-indigo-900">
                  Duplicando desde la orden original {duplicateInfo.orderNumber}
                </p>
                <p className="text-[11px] text-indigo-700">
                  Cliente: <strong>{duplicateInfo.clientAgency}</strong> • Producto: <strong>{duplicateInfo.product}</strong>. Todos los datos, plataformas y formatos han sido precargados. Puedes editar lo que necesites y guardarla como borrador o enviarla.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase bg-indigo-200 text-indigo-900 px-2.5 py-1 rounded-full whitespace-nowrap">
              Nueva SP
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {orderCategory === 'DIGITAL' ? (
            <>
              <DigitalOrderForm
                formData={formData}
                setFormData={setFormData}
                digitalData={digitalData}
                setDigitalData={setDigitalData}
                digitalMatrix={digitalMatrix}
                setDigitalMatrix={setDigitalMatrix}
                executives={executives}
                selectedExecutiveId={selectedExecutiveId}
                setSelectedExecutiveId={setSelectedExecutiveId}
                isCoordinatorOrAdmin={isCoordinatorOrAdmin}
                user={user}
                files={files}
                handleFileChange={handleFileChange}
                removeFile={removeFile}
                activeInitials={activeInitials}
                manualOrderNumber={manualOrderNumber}
                setManualOrderNumber={setManualOrderNumber}
                oiNumber={oiNumber}
                setOiNumber={setOiNumber}
                requiresNewsroom={requiresNewsroom}
                setRequiresNewsroom={setRequiresNewsroom}
                newsroomFormData={newsroomFormData}
                setNewsroomFormData={setNewsroomFormData}
              />

              {/* Submit Action Bar for DIGITAL */}
              <div className="flex items-center justify-end gap-3 pt-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveOrder(true)}
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-3.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  {loading ? 'Guardando...' : '💾 Guardar como Borrador (Sin Enviar)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveOrder(false, true)}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-3.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  title="Guardar la orden e inmediatamente descargarla en formato PDF oficial"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Procesando...' : '📥 Guardar y Descargar como PDF'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black px-7 py-3.5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Enviando...' : '🚀 Enviar Solicitud SP Digital Oficial'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* NOMENCLATURA SP Y ORDEN DE INSERCIÓN (OI) PARA TV */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg">#</span>
                    <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Nomenclatura SP y Orden de Inserción (OI)
                    </h2>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                    Ingreso Manual de Códigos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* N° SP Manual */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Número de SP (Solicitud de Producción TV) *
                    </label>
                    <div className="flex items-center shadow-xs rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                      <span className="inline-flex items-center px-3.5 py-2.5 bg-indigo-100 text-indigo-950 font-mono font-black text-xs border-r border-indigo-200 select-none">
                        SP-{activeInitials}-
                      </span>
                      <input
                        type="text"
                        value={manualOrderNumber}
                        onChange={(e) => setManualOrderNumber(e.target.value)}
                        placeholder="Ej: 104"
                        className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      El prefijo <strong>SP-{activeInitials}-</strong> es fijo. Ingresa el número manual de la SP.
                    </p>
                  </div>

                  {/* N° OI Manual */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Orden de Inserción (OI)
                    </label>
                    <div className="flex items-center shadow-xs rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <span className="inline-flex items-center px-3.5 py-2.5 bg-blue-100 text-blue-950 font-mono font-black text-xs border-r border-blue-200 select-none">
                        OI:
                      </span>
                      <input
                        type="text"
                        value={oiNumber}
                        onChange={(e) => setOiNumber(e.target.value)}
                        placeholder="Ej: 84920"
                        className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ingresa el número de Orden de Inserción para vinculación comercial.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className={`px-6 py-3 border-b flex items-center justify-between rounded-t-3xl ${
              orderType === 'DEMO' ? 'bg-purple-100 border-purple-200' : 'bg-[#fef08a] border-yellow-300'
            }`}>
              <h2 className={`text-xs font-black uppercase tracking-wider ${
                orderType === 'DEMO' ? 'text-purple-950 flex items-center gap-1.5' : 'text-yellow-950'
              }`}>
                {orderType === 'DEMO' && <FlaskConical className="w-3.5 h-3.5 text-purple-700" />}
                1. INFORMACIÓN GENERAL {orderType === 'DEMO' && '(SOLICITUD DE DEMO)'}
              </h2>
              <span className={`text-[11px] font-bold ${
                orderType === 'DEMO' ? 'text-purple-900' : 'text-yellow-900'
              }`}>
                {isCoordinatorOrAdmin && selectedExec 
                  ? `Ejecutiva: ${selectedExec.name} (Ingresado por: ${user?.name})`
                  : `Ejecutiva de Ventas: ${user?.name}`}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coordinator Field: Select which Executive owns the client */}
              {isCoordinatorOrAdmin && (
                <div className="sm:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 p-4.5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs font-black text-blue-950 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      ¿A qué Ejecutiva/o de Ventas pertenece esta Cuenta / Cliente? *
                    </label>
                    <span className="text-[10px] font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-full border border-blue-300 w-fit">
                      Obligatorio para Coordinación
                    </span>
                  </div>
                  <select
                    required
                    value={selectedExecutiveId}
                    onChange={(e) => setSelectedExecutiveId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border-2 border-blue-400 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="">-- Seleccionar Ejecutiva de Ventas Titular --</option>
                    {executives.map((exec) => (
                      <option key={exec.id} value={exec.id}>
                        👩‍💼 {exec.name} {exec.initials ? `(Iniciales: ${exec.initials})` : ''} {exec.role === 'SOLICITANTE' ? '• Ejecutiva de Ventas' : `• ${exec.role}`}
                      </option>
                    ))}
                  </select>

                  {selectedExec ? (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-xl font-bold">
                      <span>✓ Iniciales asignadas a la SP:</span>
                      <span className="font-mono bg-emerald-200/90 text-emerald-950 px-2.5 py-0.5 rounded-lg font-black text-xs">
                        SP-{selectedExec.initials || formatInitials(selectedExec.name)}-00X
                      </span>
                      <span className="text-[10px] text-emerald-700 font-normal">
                        (La SP se registrará a nombre de {selectedExec.name} y con sus iniciales, indicando que fue ingresada por {user?.name})
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl font-semibold">
                      ⚠️ Selecciona la ejecutiva: la SP se nombrará automáticamente con las iniciales de la ejecutiva asignada y no las tuyas.
                    </p>
                  )}
                </div>
              )}

              {!isCoordinatorOrAdmin && (
                <div className="sm:col-span-2">
                  {!isAssigningForOther ? (
                    <button
                      type="button"
                      onClick={() => setIsAssigningForOther(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      ¿Estás ingresando esta SP en representación de otra ejecutiva? Haz clic aquí para asignarla
                    </button>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          Seleccionar Ejecutiva de Ventas Titular:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAssigningForOther(false);
                            setSelectedExecutiveId('');
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
                        >
                          Cancelar (Soy yo la titular)
                        </button>
                      </div>
                      <select
                        value={selectedExecutiveId}
                        onChange={(e) => setSelectedExecutiveId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Soy yo ({user?.name}) --</option>
                        {executives.map((exec) => (
                          <option key={exec.id} value={exec.id}>
                            👩‍💼 {exec.name} {exec.initials ? `(Iniciales: ${exec.initials})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente / Agencia *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientAgency}
                  onChange={(e) => setFormData({ ...formData, clientAgency: e.target.value })}
                  placeholder="Ej. MARKPLAN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder="Ej. GARNIER"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Programa / Espacio de Emisión
                </label>
                <input
                  type="text"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  placeholder="Ej. Novela 15h30 GYE Sorpresa del Destino"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prioridad de Producción
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente (Emisión Próxima)</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 flex items-center gap-1 ${
                  orderType === 'DEMO' ? 'text-purple-800' : 'text-emerald-800'
                }`}>
                  <DollarSign className={`w-3.5 h-3.5 ${orderType === 'DEMO' ? 'text-purple-600' : 'text-emerald-600'}`} />
                  Valor del Paquete ($ USD) {orderType === 'DEMO' ? '(Costo $0 USD)' : '*'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={orderType === 'DEMO'}
                    value={orderType === 'DEMO' ? '0' : formData.packageValue}
                    onChange={(e) => setFormData({ ...formData, packageValue: e.target.value })}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 ${
                      orderType === 'DEMO'
                        ? 'bg-purple-50 border-purple-300 text-purple-950 cursor-not-allowed'
                        : 'bg-emerald-50/30 border-emerald-300 text-emerald-950 focus:ring-emerald-500 placeholder-slate-400'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {orderType === 'DEMO' 
                    ? '✨ DEMO / Muestra comercial sin costo ($0.00 USD).' 
                    : 'Valor comercial total contratado para este paquete.'}
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: MATERIAL Y FECHAS CRÍTICAS CON CALENDARIO INTERACTIVO */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className={`px-6 py-3 border-b flex items-center justify-between rounded-t-3xl ${
              orderType === 'DEMO' ? 'bg-purple-100 border-purple-200' : 'bg-[#fef08a] border-yellow-300'
            }`}>
              <h2 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                orderType === 'DEMO' ? 'text-purple-950' : 'text-yellow-950'
              }`}>
                <CalendarIcon className="w-4 h-4" /> 2. MATERIAL Y FECHAS
              </h2>
              <span className="text-[10px] text-slate-600 font-bold">Haz clic en el recuadro para abrir el calendario</span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DATEPICKER 1: ENTREGA DE MATERIAL */}
                <DatePicker
                  label="Fecha de Entrega de Material (Brief/Assets)"
                  value={formData.materialDeliveryDate}
                  onChange={(d) => setFormData({ ...formData, materialDeliveryDate: d })}
                  placeholder="Elegir fecha de entrega..."
                  helperText="Fecha en que se reciben los archivos de la agencia."
                  align="left"
                />

                {/* DATEPICKER 2: FECHA AL AIRE (OBLIGATORIA) */}
                <DatePicker
                  label={orderType === 'DEMO' ? "Fecha Estimada de Muestra / Entrega del DEMO" : "Fecha al Aire (Emisión Comercial)"}
                  value={formData.airDate}
                  onChange={(d) => setFormData({ ...formData, airDate: d })}
                  required
                  isUrgent={orderType !== 'DEMO'}
                  placeholder="Elegir fecha..."
                  helperText={orderType === 'DEMO' ? "Día límite para presentar el DEMO al cliente." : "Día programado para salir al aire en pantalla."}
                  align="right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Indicaciones / Especificaciones del Material
                </label>
                <textarea
                  rows={3}
                  value={formData.materialNotes}
                  onChange={(e) => setFormData({ ...formData, materialNotes: e.target.value })}
                  placeholder="Detalles sobre logos, resolución, cintillos o requerimientos técnicos especiales..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Brief Checkbox */}
              <div className="flex items-center gap-6 pt-2">
                <span className="text-xs font-bold text-slate-800">¿Incluye Brief?:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="hasBrief"
                      checked={formData.hasBrief === true}
                      onChange={() => setFormData({ ...formData, hasBrief: true })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    SI
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="hasBrief"
                      checked={formData.hasBrief === false}
                      onChange={() => setFormData({ ...formData, hasBrief: false })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    NO
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: TIPO DE AUSPICIO (CATEGORIZADO EN GRÁFICOS, ESTRATÉGICOS Y COBERTURAS) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="bg-ev-rowHeader px-6 py-3 border-b border-indigo-200 text-white flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider">
                  3. TIPO DE AUSPICIO / FORMATOS COMERCIALES
                </h2>
                {hasCobertura(formData.sponsorshipTypes) && (
                  <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                    📹 Incluye Cobertura (Permite 2 Editores)
                  </span>
                )}
                {hasStrategicPnt(formData.sponsorshipTypes) && !hasCobertura(formData.sponsorshipTypes) && (
                  <span className="bg-purple-400 text-purple-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                    ⭐ Incluye PNT Estratégico (Permite 2 Editores)
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/80 font-medium">
                {formData.sponsorshipTypes.length} formato(s) seleccionado(s)
              </span>
            </div>

            <div className="p-6 space-y-6">
              {SPONSORSHIP_CATEGORIES.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${cat.badge}`}>
                        {cat.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                        {cat.description}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      {cat.options.filter((o) => formData.sponsorshipTypes.includes(o.id)).length} seleccionados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {cat.options.map((opt) => {
                      const isChecked = formData.sponsorshipTypes.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isChecked
                              ? opt.category === 'COBERTURAS'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : opt.isStrategic
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSponsorshipToggle(opt.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Otro Tipo de Auspicio / Formato Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.customSponsorship}
                  onChange={(e) => setFormData({ ...formData, customSponsorship: e.target.value })}
                  placeholder="Especificar otro formato..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: LOCUCIÓN */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="bg-ev-rowHeader px-6 py-3 border-b border-indigo-200 text-white flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xs font-black uppercase tracking-wider">
                4. LOCUCIÓN
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold text-slate-800">Tipo de Locución:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="voiceoverType"
                      value="GENERICA"
                      checked={formData.voiceoverType === 'GENERICA'}
                      onChange={() => setFormData({ ...formData, voiceoverType: 'GENERICA' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    Genérica
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="voiceoverType"
                      value="ESPECIFICA"
                      checked={formData.voiceoverType === 'ESPECIFICA'}
                      onChange={() => setFormData({ ...formData, voiceoverType: 'ESPECIFICA' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    Específica
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texto de Locución (Script / Guion del Locutor)
                </label>
                <textarea
                  rows={4}
                  value={formData.voiceoverText}
                  onChange={(e) => setFormData({ ...formData, voiceoverText: e.target.value })}
                  placeholder="Redacta aquí el texto exacto que leerá el locutor comercial..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                ></textarea>
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: ENLACE DE DESCARGA & SUBIDA DE INSUMOS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-5">
            {/* 🔗 CAMPO PARA ADJUNTAR LINK DE DESCARGA (DRIVE, WETRANSFER, DROPBOX) */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-blue-600" /> Link de Descarga de Insumos (Drive, WeTransfer, Dropbox, OneDrive)
                </label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  Recomendado para videos y archivos pesados
                </span>
              </div>
              <div className="relative">
                <input
                  type="url"
                  value={formData.downloadUrl}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/... o https://we.tl/t-..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-blue-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {formData.downloadUrl && (
                  <a
                    href={formData.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2.5 top-2.5 text-blue-600 hover:text-blue-800 p-1"
                    title="Probar enlace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pega aquí el enlace a la carpeta compartida en la nube para que post-producción pueda acceder directamente a los videos, audios, fotos y assets.
              </p>
            </div>

            {/* SECCIÓN ADJUNTAR INSUMOS (ARCHIVOS LOCALES) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" /> Adjuntar Insumos (Brief, Logos, Guiones, Audios)
                </h2>
                <span className="text-[11px] text-slate-400">PDF, PNG, MP4, MP3, ZIP</span>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                multiple
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Haz clic aquí para seleccionar archivos de insumo
                </p>
                <p className="text-[11px] text-slate-400">
                  Se asociarán permanentemente a la orden <span className="font-mono font-bold">SP</span>
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Archivos seleccionados ({files.length}):</p>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl border border-slate-200 p-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 text-xs">
                      <span className="font-medium text-slate-800 truncate max-w-sm">
                        📄 {file.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 flex-wrap">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrder(true)}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-3 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              💾 Guardar Borrador
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrder(false, true)}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Guardar la orden e inmediatamente descargarla en formato PDF oficial"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Procesando...' : '📥 Guardar y Descargar como PDF'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`text-white font-black px-6 py-3 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                orderType === 'DEMO'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {loading 
                ? 'Procesando...' 
                : orderType === 'DEMO' 
                ? 'Crear Solicitud de DEMO ($0 USD)' 
                : 'Crear Solicitud de Producción (SP)'}
            </button>
          </div>
            </>
          )}
        </form>
      </div>
    </AppLayout>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando formulario de SP...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}
