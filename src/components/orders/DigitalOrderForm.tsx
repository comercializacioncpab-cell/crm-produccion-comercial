'use client';

import React from 'react';
import DatePicker from '@/components/ui/DatePicker';
import { 
  Users, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Check, 
  Upload, 
  Trash2, 
  DollarSign, 
  AlertCircle,
  ExternalLink,
  Share2,
  FileText,
  Smartphone
} from 'lucide-react';
import { 
  DIGITAL_NETWORKS, 
  DIGITAL_FORMATS, 
  DIGITAL_KPIS, 
  DIGITAL_RESOURCES_LIST 
} from '@/lib/order-utils';

export interface DigitalOrderFormProps {
  formData: {
    clientAgency: string;
    product: string;
    downloadUrl: string;
    priority: string;
    packageValue: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  digitalData: {
    campaign: string;
    contentObjective: string;
    customKpi: string;
    orderDescription: string;
    receptionDate: string;
    publishDate: string;
    materialDeliveryDate: string;
    finishedProductDeliveryDate: string;
    publicationAccount: string;
    isNewsroomSegment: boolean;
    newsroomSegmentType: string;
    newsroomDate: string;
    newsroomTime: string;
    newsroomLocation: string;
    resources: Record<string, string>;
    specialInstructions: string;
    agencyCommissionApplies?: boolean;
    informProfiles?: {
      creativeDigital?: boolean;
      communityManager?: boolean;
      monetization?: boolean;
    };
  };
  setDigitalData: React.Dispatch<React.SetStateAction<any>>;
  digitalMatrix: Record<string, string[]>;
  setDigitalMatrix: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  executives: any[];
  selectedExecutiveId: string;
  setSelectedExecutiveId: (id: string) => void;
  isCoordinatorOrAdmin: boolean;
  user: any;
  files: { name: string; size: number; fileObj?: File }[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  activeInitials: string;
  manualOrderNumber: string;
  setManualOrderNumber: (val: string) => void;
  oiNumber: string;
  setOiNumber: (val: string) => void;
  requiresNewsroom: boolean;
  setRequiresNewsroom: (val: boolean) => void;
  newsroomFormData: any;
  setNewsroomFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function DigitalOrderForm({
  formData,
  setFormData,
  digitalData,
  setDigitalData,
  digitalMatrix,
  setDigitalMatrix,
  executives,
  selectedExecutiveId,
  setSelectedExecutiveId,
  isCoordinatorOrAdmin,
  user,
  files,
  handleFileChange,
  removeFile,
  activeInitials,
  manualOrderNumber,
  setManualOrderNumber,
  oiNumber,
  setOiNumber,
  requiresNewsroom,
  setRequiresNewsroom,
  newsroomFormData,
  setNewsroomFormData,
}: DigitalOrderFormProps) {
  const selectedExec = executives.find((e) => e.id === selectedExecutiveId);

  const toggleMatrixCell = (format: string, networkId: string) => {
    setDigitalMatrix((prev) => {
      const currentList = prev[format] || [];
      const exists = currentList.includes(networkId);
      const nextList = exists
        ? currentList.filter((id) => id !== networkId)
        : [...currentList, networkId];
      
      const copy = { ...prev };
      if (nextList.length === 0) {
        delete copy[format];
      } else {
        copy[format] = nextList;
      }
      return copy;
    });
  };

  const handleResourceStatusChange = (resourceId: string, status: string) => {
    setDigitalData((prev: any) => ({
      ...prev,
      resources: {
        ...prev.resources,
        [resourceId]: status,
      },
    }));
  };

  const totalSelectedMatrixCells = Object.values(digitalMatrix).reduce(
    (acc, list) => acc + list.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* 0. NOMENCLATURA SP Y ORDEN DE INSERCIÓN (OI) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">#</span>
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
              Número de SP (Solicitud de Producción Digital) *
            </label>
            <div className="flex items-center shadow-xs rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
              <span className="inline-flex items-center px-3.5 py-2.5 bg-emerald-100 text-emerald-950 font-mono font-black text-xs border-r border-emerald-200 select-none">
                SPD-{activeInitials}-
              </span>
              <input
                type="text"
                value={manualOrderNumber}
                onChange={(e) => setManualOrderNumber(e.target.value)}
                placeholder="Ej: 1128"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none bg-white text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              El prefijo <strong>SPD-{activeInitials}-</strong> es fijo. Ingresa el número manual de la SP.
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

      {/* 1. SECCIÓN: EJECUTIVA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="px-6 py-3 bg-emerald-600 border-b border-emerald-700 text-white flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <span>1.</span>
            <span>EJECUTIVA TITULAR (VENTAS / DIGITAL)</span>
          </h2>
          <span className="text-[11px] font-bold text-emerald-100">
            {isCoordinatorOrAdmin && selectedExec 
              ? `Ejecutiva: ${selectedExec.name} (Por: ${user?.name})`
              : `Ejecutiva: ${user?.name}`}
          </span>
        </div>

        <div className="p-6">
          {isCoordinatorOrAdmin ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 p-4 rounded-2xl space-y-3 shadow-sm">
              <label className="block text-xs font-black text-emerald-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                ¿A qué Ejecutiva Digital o de Ventas pertenece esta Cuenta / Cliente? *
              </label>
              <select
                value={selectedExecutiveId}
                onChange={(e) => setSelectedExecutiveId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
              >
                <option value="">-- Seleccionar Ejecutiva Titular --</option>
                {executives.map((exec) => (
                  <option key={exec.id} value={exec.id}>
                    {exec.role === 'EJECUTIVA_DIGITAL' ? '📱 [DIGITAL] ' : exec.role === 'CREATIVO_DIGITAL' ? '🎨 [CREATIVO] ' : exec.role === 'COMMUNITY_MANAGER' ? '📲 [CM] ' : exec.role === 'JEFE_MONETIZACION' ? '💎 [MONETIZACIÓN] ' : '👩‍💼 '}
                    {exec.name} ({exec.initials || 'SP'}) - {exec.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-800">
                El código correlativo de la SP se generará con las iniciales de la ejecutiva seleccionada (ej: <strong>SPD-{activeInitials}-001</strong>).
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow">
                {user?.initials || 'ED'}
              </div>
              <div>
                <p className="text-xs text-emerald-900 font-extrabold">{user?.name}</p>
                <p className="text-[11px] text-emerald-700">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  {user?.role === 'EJECUTIVA_DIGITAL' ? '📱 Ejecutiva Digital' : user?.role === 'CREATIVO_DIGITAL' ? '🎨 Creativo Digital' : user?.role === 'COMMUNITY_MANAGER' ? '📲 Community Manager' : user?.role === 'JEFE_MONETIZACION' ? '💎 Jefe de Monetización' : '👩‍💼 Ejecutiva de Ventas'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. SECCIÓN: CLIENTE / MARCA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
            <span>2.</span>
            <span>CLIENTE / MARCA & DATOS DE LA SOLICITUD</span>
          </h2>
          <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
            Requerimientos Comerciales
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cliente / Marca *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: SUSUKI, CLARO, PRONACA"
              value={formData.clientAgency}
              onChange={(e) => setFormData({ ...formData, clientAgency: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Producto / Servicio *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: EVENTO, VEHÍCULO HÍBRIDO, PLAN FAMILIAR"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Campaña
            </label>
            <input
              type="text"
              placeholder="Ej: EVENTO, LANZAMIENTO 2026, BLACK FRIDAY"
              value={digitalData.campaign}
              onChange={(e) => setDigitalData({ ...digitalData, campaign: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Objetivo del Contenido (KPI)
            </label>
            <select
              value={digitalData.contentObjective}
              onChange={(e) => setDigitalData({ ...digitalData, contentObjective: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {DIGITAL_KPIS.map((kpi) => (
                <option key={kpi} value={kpi}>
                  🎯 {kpi}
                </option>
              ))}
              <option value="OTRO">✏️ OTRO (Personalizado)</option>
            </select>
          </div>

          {digitalData.contentObjective === 'OTRO' && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Especificar Objetivo (KPI) Personalizado:
              </label>
              <input
                type="text"
                placeholder="Ej: REPOST EN VIVO CON TALENTO"
                value={digitalData.customKpi}
                onChange={(e) => setDigitalData({ ...digitalData, customKpi: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción del Pedido *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Ej: REEL COBERTURA EVENTO DE LANZAMIENTO CON REPORTERO DIGITAL, TOMAS DINÁMICAS Y ENTREVISTA A VOCERO"
              value={digitalData.orderDescription}
              onChange={(e) => setDigitalData({ ...digitalData, orderDescription: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN: FECHAS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative z-30">
        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
            <span>3.</span>
            <span>CRONOGRAMA & FECHAS DE ENTREGA</span>
          </h2>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
            SLA Editorial
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fecha de recepción del pedido:
            </label>
            <DatePicker
              value={digitalData.receptionDate}
              onChange={(val) => setDigitalData({ ...digitalData, receptionDate: val })}
              placeholder="dd/mm/aaaa"
              align="left"
            />
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-2xl">
            <label className="block text-xs font-black text-emerald-950 mb-1">
              Fecha de publicación (Al aire en redes) *:
            </label>
            <DatePicker
              value={digitalData.publishDate}
              onChange={(val) => {
                setDigitalData({ ...digitalData, publishDate: val });
                setFormData((prev: any) => ({ ...prev, airDate: val }));
              }}
              placeholder="dd/mm/aaaa"
              align="left"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Entrega de material (Insumos cliente):
            </label>
            <DatePicker
              value={digitalData.materialDeliveryDate}
              onChange={(val) => {
                setDigitalData({ ...digitalData, materialDeliveryDate: val });
                setFormData((prev: any) => ({ ...prev, materialDeliveryDate: val }));
              }}
              placeholder="dd/mm/aaaa"
              align="right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Entrega de producto terminado (Corte):
            </label>
            <DatePicker
              value={digitalData.finishedProductDeliveryDate}
              onChange={(val) => setDigitalData({ ...digitalData, finishedProductDeliveryDate: val })}
              placeholder="dd/mm/aaaa"
              align="right"
            />
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN: PLATAFORMAS Y FORMATOS (MATRIZ INTERACTIVA) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative z-20">
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider">
              4. PLATAFORMAS Y FORMATOS (MATRIZ EDITORIAL DIGITAL)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              {totalSelectedMatrixCells > 0 ? `✓ ${totalSelectedMatrixCells} combinaciones seleccionadas` : 'Haz clic en las casillas para marcar (X)'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Marca con un clic la intersección entre el <strong>Formato</strong> requerido y la <strong>Red Social / Plataforma</strong> en la que se publicará:
          </p>

          {/* Tabla / Matriz */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-xs border-collapse text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-black text-slate-800 text-[11px] uppercase tracking-wider min-w-[200px]">
                    Formato / Red Social
                  </th>
                  {DIGITAL_NETWORKS.map((net) => (
                    <th
                      key={net.id}
                      className="py-2.5 px-2 text-center font-bold text-slate-700 text-[11px] border-l border-slate-200 whitespace-nowrap"
                    >
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${net.badge}`}>
                        {net.shortLabel}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DIGITAL_FORMATS.map((fmt, idx) => {
                  const selectedForThisFormat = digitalMatrix[fmt] || [];
                  const hasAny = selectedForThisFormat.length > 0;

                  return (
                    <tr
                      key={fmt}
                      className={`transition-colors ${
                        hasAny ? 'bg-emerald-50/50 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      } hover:bg-emerald-50/80`}
                    >
                      <td className="py-2 px-3 text-slate-900 font-semibold text-[11px] flex items-center justify-between">
                        <span>{fmt}</span>
                        {hasAny && (
                          <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full ml-2">
                            {selectedForThisFormat.length}
                          </span>
                        )}
                      </td>
                      {DIGITAL_NETWORKS.map((net) => {
                        const isChecked = selectedForThisFormat.includes(net.id);

                        return (
                          <td
                            key={net.id}
                            onClick={() => toggleMatrixCell(fmt, net.id)}
                            className={`py-2 px-2 text-center border-l border-slate-200 cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-emerald-500 text-white font-black hover:bg-emerald-600'
                                : 'hover:bg-slate-200/60 text-transparent'
                            }`}
                          >
                            <div className="w-6 h-6 mx-auto flex items-center justify-center rounded-md">
                              {isChecked ? 'X' : '·'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cuenta de publicación */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Especificar la cuenta de Ecuavisa donde se va a publicar y si tiene colaboración o repost:
            </label>
            <input
              type="text"
              placeholder="Ej: REEL COBERTURA IG ECUAVISA + FB ECUAVISA / COLABORACIÓN CON @SUSUKI_EC"
              value={digitalData.publicationAccount}
              onChange={(e) => setDigitalData({ ...digitalData, publicationAccount: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Cobertura / Segmento de Redacción */}
          <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-2">
                <span className="text-base">📹</span>
                <span>Especificar si es un producto / segmento de la redacción:</span>
              </label>
              <textarea
                rows={2}
                placeholder="Escribe el detalle aquí (ej: Cobertura de evento en exteriores, cápsula de noticias, reportaje de redacción, entrevista especial...)"
                value={digitalData.newsroomSegmentType || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDigitalData({
                    ...digitalData,
                    newsroomSegmentType: val,
                    isNewsroomSegment: Boolean(val.trim()),
                  });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fecha del Evento / Cobertura:
                </label>
                <DatePicker
                  value={digitalData.newsroomDate}
                  onChange={(val) => setDigitalData({ ...digitalData, newsroomDate: val })}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hora del Evento:
                </label>
                <input
                  type="text"
                  placeholder="Ej: 19h00"
                  value={digitalData.newsroomTime}
                  onChange={(e) => setDigitalData({ ...digitalData, newsroomTime: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold uppercase bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Lugar / Locación:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Palma Polo Club"
                  value={digitalData.newsroomLocation}
                  onChange={(e) => setDigitalData({ ...digitalData, newsroomLocation: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold uppercase bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN: RECURSOS Y MATERIALES */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative z-10">
        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
            <span>5.</span>
            <span>RECURSOS Y MATERIALES DE INSUMO</span>
          </h2>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
            Checklist & Detalle de Insumos
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {DIGITAL_RESOURCES_LIST.map((res) => {
              const currentStatus = digitalData.resources?.[res.id] || 'NO';
              const currentDetail = digitalData.resources?.[`${res.id}_detail`] || '';

              return (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 transition-all hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {res.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {['SI', 'NO'].map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => handleResourceStatusChange(res.id, statusOption)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            currentStatus === statusOption
                              ? statusOption === 'SI'
                                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                                : 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-700'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {statusOption === 'SI' ? '✓ Sí' : '✕ No'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campo para escribir detalle y/o adjuntar archivo */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Escribir detalle para ${res.label.toLowerCase()}...`}
                      value={currentDetail}
                      onChange={(e) => setDigitalData((prev: any) => ({
                        ...prev,
                        resources: {
                          ...prev.resources,
                          [`${res.id}_detail`]: e.target.value,
                        },
                      }))}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <label 
                      className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-700 flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                      title="Adjuntar archivo para este recurso"
                    >
                      <Upload className="w-3 h-3 text-emerald-600" />
                      <span>Adjuntar</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hashtags oficiales y Copys:
              </label>
              <textarea
                rows={2}
                placeholder="Ej: #EcuavisaDigital #SusukiEC - Enviar por agencia / Redacción"
                value={digitalData.resources?.hashtagsText || ''}
                onChange={(e) => setDigitalData({
                  ...digitalData,
                  resources: { ...digitalData.resources, hashtagsText: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Piezas gráficas / Otros requerimientos:
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Fondos vectoriales, fuentes corporativas, logo sin fondo"
                value={digitalData.resources?.graphicPiecesText || ''}
                onChange={(e) => setDigitalData({
                  ...digitalData,
                  resources: { ...digitalData.resources, graphicPiecesText: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECCIÓN: INSTRUCCIONES, ARCHIVOS & ENLACE DE DESCARGA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative z-10">
        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
            <span>6.</span>
            <span>INSTRUCCIONES O COMENTARIOS ESPECIALES & ARCHIVOS</span>
          </h2>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
            Adjuntos
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instrucciones o comentarios especiales:
            </label>
            <textarea
              rows={3}
              placeholder="Instrucciones creativas para el editor, tono de la redacción, lineamientos de marca o notas de publicación..."
              value={digitalData.specialInstructions}
              onChange={(e) => setDigitalData({ ...digitalData, specialInstructions: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              Enlace externo de descarga de insumos (Google Drive, Dropbox, WeTransfer, OneDrive):
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={formData.downloadUrl}
              onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-2xl p-6 text-center bg-emerald-50/30 transition-colors">
            <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">
              Adjuntar artes de referencia, brief o logos directamente
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Formatos soportados: PDF, PNG, JPG, MP4, ZIP
            </p>
            <label className="mt-3 inline-block bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
              Seleccionar archivos
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 text-left space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700">Archivos adjuntos ({files.length}):</p>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-1">
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
                          className="text-red-500 hover:text-red-700 cursor-pointer"
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
      </div>

      {/* 7. SECCIÓN: EQUIPO DIGITAL A INFORMAR (SOLO NOTIFICACIÓN INFORMATIVA - SIN ASIGNACIÓN) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative z-10 overflow-hidden">
        <div className="px-6 py-3 bg-gradient-to-r from-violet-50 via-sky-50 to-amber-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              7. Notificar a Equipo Digital (Solo Informativo - Sin Rol de Aprobación)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
            Notificaciones Informativas
          </span>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-500">
            Marca las casillas de los perfiles que deben recibir una notificación sobre esta SP Digital para mantenerse al tanto de lo solicitado. <em>(No aprueban ni modifican la orden, únicamente se les informa para su seguimiento)</em>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* 1. Creativo Digital */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
              digitalData.informProfiles?.creativeDigital
                ? 'bg-violet-50/80 border-violet-400 text-violet-950 shadow-xs ring-2 ring-violet-400/20'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={Boolean(digitalData.informProfiles?.creativeDigital)}
                onChange={(e) => setDigitalData({
                  ...digitalData,
                  informProfiles: {
                    ...digitalData.informProfiles,
                    creativeDigital: e.target.checked
                  }
                })}
                className="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>🎨</span>
                  <span>Creativo Digital</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Notificar para que esté informado de briefs, ideas creativas y guiones.
                </p>
              </div>
            </label>

            {/* 2. Community Manager */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
              digitalData.informProfiles?.communityManager
                ? 'bg-sky-50/80 border-sky-400 text-sky-950 shadow-xs ring-2 ring-sky-400/20'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={Boolean(digitalData.informProfiles?.communityManager)}
                onChange={(e) => setDigitalData({
                  ...digitalData,
                  informProfiles: {
                    ...digitalData.informProfiles,
                    communityManager: e.target.checked
                  }
                })}
                className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>📲</span>
                  <span>Community Manager</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Notificar para calendarización, fechas de salida y copys en redes.
                </p>
              </div>
            </label>

            {/* 3. Jefe de Monetización */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
              digitalData.informProfiles?.monetization
                ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-400/20'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={Boolean(digitalData.informProfiles?.monetization)}
                onChange={(e) => setDigitalData({
                  ...digitalData,
                  informProfiles: {
                    ...digitalData.informProfiles,
                    monetization: e.target.checked
                  }
                })}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>💎</span>
                  <span>Jefe de Monetización</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Notificar para control del valor comercial, rentabilidad y costos.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 8. PRIORIDAD Y VALOR COMERCIAL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prioridad de Edición & Publicación:
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="BAJA">🟢 Baja</option>
              <option value="MEDIA">🟡 Media</option>
              <option value="ALTA">🟠 Alta</option>
              <option value="URGENTE">🔴 Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor del Paquete Digital / Pauta ($ USD):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.packageValue}
                onChange={(e) => setFormData({ ...formData, packageValue: e.target.value })}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Ingresa el valor facturado para el desglose financiero y reportes.
            </p>
          </div>
        </div>

        {/* Descontar Comisión de Agencia (15%) */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
            digitalData.agencyCommissionApplies
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(digitalData.agencyCommissionApplies)}
                onChange={(e) => setDigitalData({
                  ...digitalData,
                  agencyCommissionApplies: e.target.checked
                })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-xs block">Descontar Comisión de Agencia (15%)</span>
                <span className="text-[11px] text-slate-500">Marcar si la cuenta viene a través de Agencia de Publicidad para cálculo de rentabilidad.</span>
              </div>
            </div>
            <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg ${
              digitalData.agencyCommissionApplies ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-200 text-slate-600'
            }`}>
              {digitalData.agencyCommissionApplies ? 'Aplica 15%' : 'No Aplica'}
            </span>
          </label>
        </div>
      </div>

      {/* 9. SUBFORMULARIO: SOLICITUD A REDACCIÓN */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <label className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            requiresNewsroom
              ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="checkbox"
              checked={requiresNewsroom}
              onChange={(e) => setRequiresNewsroom(e.target.checked)}
              className="mt-1 w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">📰</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Solicitar Requerimiento / Cobertura a Redacción
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                  Mesa de Redacción
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Al activar esta opción, la orden se remitirá directamente al tablero de la Mesa de Redacción (<code>/redaccion</code>) para su asignación editorial, cobertura periodística o redacción de notas y copys.
              </p>
            </div>
          </label>

          {/* Subformulario desplegable pre-llenado con datos de la SPD */}
          {requiresNewsroom && (
            <div className="mt-5 p-5 bg-gradient-to-b from-amber-50/50 to-white rounded-2xl border border-amber-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-amber-700 font-extrabold text-sm">📋</span>
                  <h3 className="text-xs font-black uppercase text-amber-950">
                    Formulario de Solicitud Editorial (EV Digital + Comercial)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  Pre-llenado automático desde la SPD
                </span>
              </div>

              {/* Resumen pre-llenado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-amber-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-semibold">Ejecutiva:</span>
                  <span className="font-bold text-slate-800">{selectedExec?.name || user?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Cliente / Marca:</span>
                  <span className="font-bold text-slate-800">{formData.clientAgency || '(Sin cliente)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Producto:</span>
                  <span className="font-bold text-slate-800">{formData.product || '(Sin producto)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Campaña:</span>
                  <span className="font-bold text-slate-800">{digitalData.campaign || '(Sin campaña)'}</span>
                </div>
              </div>

              {/* Campos específicos para Redacción */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Detalle de la Cobertura / Pauta para Redacción:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe los temas centrales que el periodista o redactor debe abordar, ángulos de la noticia, voceros clave o preguntas clave..."
                    value={newsroomFormData.editorialDetails || ''}
                    onChange={(e) => setNewsroomFormData({ ...newsroomFormData, editorialDetails: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Contacto en Sitio / Vocero de la Marca:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Lic. Carlos Pérez (0991234567)"
                      value={newsroomFormData.onSiteContact || ''}
                      onChange={(e) => setNewsroomFormData({ ...newsroomFormData, onSiteContact: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Entregable Esperado de Redacción:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Nota web en ecuavisa.com + 2 reels de cobertura"
                      value={newsroomFormData.expectedDeliverable || ''}
                      onChange={(e) => setNewsroomFormData({ ...newsroomFormData, expectedDeliverable: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(newsroomFormData.requiresJournalist)}
                      onChange={(e) => setNewsroomFormData({ ...newsroomFormData, requiresJournalist: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>🎤 Requiere Periodista / Redactor en sitio</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(newsroomFormData.requiresCameraperson)}
                      onChange={(e) => setNewsroomFormData({ ...newsroomFormData, requiresCameraperson: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>📹 Requiere Camarógrafo de Redacción</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
