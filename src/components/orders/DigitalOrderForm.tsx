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
                    {exec.role === 'EJECUTIVA_DIGITAL' ? '📱 [DIGITAL] ' : '👩‍💼 '}
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
                  {user?.role === 'EJECUTIVA_DIGITAL' ? '📱 Ejecutiva Digital' : '👩‍💼 Ejecutiva de Ventas'}
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
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900 select-none">
              <input
                type="checkbox"
                checked={digitalData.isNewsroomSegment}
                onChange={(e) => setDigitalData({ ...digitalData, isNewsroomSegment: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span>📹 Especificar si es un producto/segmento de la redacción (Cobertura en exteriores)</span>
            </label>

            {digitalData.isNewsroomSegment && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo / Segmento:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: COBERTURA EVENTO"
                    value={digitalData.newsroomSegmentType}
                    onChange={(e) => setDigitalData({ ...digitalData, newsroomSegmentType: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fecha del Evento:
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
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold uppercase"
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
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold uppercase"
                  />
                </div>
              </div>
            )}
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
            Checklist de Entrega
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIGITAL_RESOURCES_LIST.map((res) => {
              const currentStatus = digitalData.resources?.[res.id] || 'NO';

              return (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50"
                >
                  <span className="text-xs font-bold text-slate-800">{res.label}</span>
                  <div className="flex items-center gap-1">
                    {['SI', 'NO', 'ENVIADO POR AGENCIA'].map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => handleResourceStatusChange(res.id, statusOption)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                          currentStatus === statusOption
                            ? statusOption === 'SI'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : statusOption === 'NO'
                              ? 'bg-slate-700 text-white shadow-sm'
                              : 'bg-amber-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {statusOption === 'SI' ? '✓ Sí' : statusOption === 'NO' ? '✕ No' : 'Agencia'}
                      </button>
                    ))}
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

      {/* 7. PRIORIDAD Y VALOR COMERCIAL */}
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
      </div>
    </div>
  );
}
