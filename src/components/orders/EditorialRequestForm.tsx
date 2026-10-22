'use client';

import React from 'react';
import { 
  DIGITAL_NETWORKS, 
  DIGITAL_FORMATS, 
  DIGITAL_RESOURCES_LIST 
} from '@/lib/order-utils';
import { RefreshCw, Check, CheckSquare, Square, FileText, ExternalLink } from 'lucide-react';

export interface EditorialFormData {
  executiveName?: string;
  clientAgency?: string;
  product?: string;
  campaign?: string;
  contentObjective?: string;
  orderDescription?: string;
  receptionDate?: string;
  publishDate?: string;
  materialDeliveryDate?: string;
  finishedProductDeliveryDate?: string;
  platformsAndFormats?: Record<string, string[]>;
  publicationAccount?: string;
  isNewsroomSegment?: boolean;
  newsroomSegmentDetail?: string;
  rights?: string;
  resources?: Record<string, { applied?: boolean; detail?: string; fileUrl?: string; invitationAttached?: boolean }>;
  specialInstructions?: string;
  specialInstructionsFileUrl?: string;
  orderNumber?: string;
  oiNumber?: string;
}

interface EditorialRequestFormProps {
  data: EditorialFormData;
  onChange?: (updated: EditorialFormData) => void;
  isEditable?: boolean;
  onSyncFromSP?: () => void;
  orderNumber?: string;
  oiNumber?: string;
}

// Format names mapping to ensure standard matching with PDF
export const EDITORIAL_FORMAT_LIST = [
  'Nota de contenido',
  'Nota de contenido y video',
  'Reel',
  'Post',
  'Branded Post',
  'Video Post',
  'Video',
  'Carrusel',
  'Galería de Fotos',
  'Story',
  'En Vivo',
  'Cobertura',
  'Entrevistas',
  'Newsletter',
  'Push Notification',
  'Canales de WhatsApp',
  'Otro',
];

export default function EditorialRequestForm({
  data,
  onChange,
  isEditable = false,
  onSyncFromSP,
  orderNumber,
  oiNumber,
}: EditorialRequestFormProps) {
  const currentData: EditorialFormData = {
    platformsAndFormats: {},
    resources: {},
    ...data,
  };

  const handleFieldChange = (field: keyof EditorialFormData, value: any) => {
    if (!onChange) return;
    onChange({
      ...currentData,
      [field]: value,
    });
  };

  const handleTogglePlatform = (format: string, networkId: string) => {
    if (!isEditable || !onChange) return;
    const currentPlatforms = currentData.platformsAndFormats || {};
    const list = currentPlatforms[format] || [];
    const exists = list.includes(networkId);
    const updatedList = exists ? list.filter((id) => id !== networkId) : [...list, networkId];
    
    onChange({
      ...currentData,
      platformsAndFormats: {
        ...currentPlatforms,
        [format]: updatedList,
      },
    });
  };

  const handleResourceChange = (resId: string, patch: Partial<{ applied: boolean; detail: string; fileUrl: string; invitationAttached: boolean }>) => {
    if (!isEditable || !onChange) return;
    const currentRes = currentData.resources || {};
    const existing = currentRes[resId] || {};
    onChange({
      ...currentData,
      resources: {
        ...currentRes,
        [resId]: {
          ...existing,
          ...patch,
        },
      },
    });
  };

  // Helper to check if a matrix cell is selected (supporting both 'Reel' and 'Reel con Reportero Digital')
  const isCellSelected = (format: string, netId: string) => {
    const matrix = currentData.platformsAndFormats || {};
    const list = matrix[format] || [];
    if (list.includes(netId)) return true;
    if (format === 'Reel') {
      const aliasList = matrix['Reel con Reportero Digital'] || [];
      return aliasList.includes(netId);
    }
    return false;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden font-sans text-slate-900">
      {/* HEADER BANNER - FORMULARIO DE SOLICITUD EDITORIAL */}
      <div className="bg-gradient-to-r from-[#003399] via-[#004bb7] to-[#0066cc] text-white p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#002266]">
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider leading-tight text-white drop-shadow-xs">
            FORMULARIO DE SOLICITUD EDITORIAL
          </h2>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-200 uppercase">
            EV DIGITAL + COMERCIAL
          </p>
        </div>

        {/* LOGO EV .com | play & Identificadores */}
        <div className="flex items-center gap-4">
          {(orderNumber || oiNumber || currentData.orderNumber || currentData.oiNumber) && (
            <div className="text-right hidden sm:block">
              {(orderNumber || currentData.orderNumber) && (
                <div className="text-xs font-mono font-bold bg-white/15 px-2.5 py-0.5 rounded border border-white/20">
                  {orderNumber || currentData.orderNumber}
                </div>
              )}
              {(oiNumber || currentData.oiNumber) && (
                <div className="text-[11px] font-mono font-extrabold text-cyan-200 mt-1">
                  OI: {oiNumber || currentData.oiNumber}
                </div>
              )}
            </div>
          )}

          {/* Logo EV */}
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 backdrop-blur-xs">
            <div className="text-center leading-none">
              <span className="font-black text-xl tracking-tighter text-white">EV</span>
              <div className="text-[8px] font-bold tracking-widest text-cyan-200 uppercase mt-0.5">
                .com • play
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar de controles si es editable */}
      {isEditable && onSyncFromSP && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
            <span>ℹ️</span>
            <span>Campos pre-llenados automáticamente desde la SP Digital. Puedes modificar cualquier dato o completar los campos manuales:</span>
          </div>
          <button
            type="button"
            onClick={onSyncFromSP}
            className="bg-amber-200/80 hover:bg-amber-300 text-amber-950 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer border border-amber-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-sincronizar con SP</span>
          </button>
        </div>
      )}

      <div className="p-6 space-y-6 text-xs">
        {/* 1. EJECUTIVA */}
        <div className="space-y-1.5">
          <label className="font-black text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
            1. EJECUTIVA:
          </label>
          {isEditable ? (
            <input
              type="text"
              value={currentData.executiveName || ''}
              onChange={(e) => handleFieldChange('executiveName', e.target.value)}
              placeholder="Nombre de la ejecutiva solicitante..."
              className="w-full p-2.5 border-2 border-slate-700 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          ) : (
            <div className="p-2.5 border-2 border-slate-700 rounded-lg font-bold text-slate-900 text-xs bg-slate-50/50">
              {currentData.executiveName || '(No especificada)'}
            </div>
          )}
        </div>

        {/* 2. CLIENTE / MARCA */}
        <div className="space-y-1.5">
          <label className="font-black text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
            2. CLIENTE / MARCA
          </label>
          <div className="border-2 border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="w-1/3 sm:w-1/4 p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Cliente / marca
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="text"
                        value={currentData.clientAgency || ''}
                        onChange={(e) => handleFieldChange('clientAgency', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.clientAgency || '-'}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Producto / servicio
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="text"
                        value={currentData.product || ''}
                        onChange={(e) => handleFieldChange('product', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.product || '-'}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Campaña
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="text"
                        value={currentData.campaign || ''}
                        onChange={(e) => handleFieldChange('campaign', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.campaign || '-'}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Objetivo del contenido (KPI)
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="text"
                        value={currentData.contentObjective || ''}
                        onChange={(e) => handleFieldChange('contentObjective', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.contentObjective || '-'}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70 align-top">
                    Descripción del pedido
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <textarea
                        rows={3}
                        value={currentData.orderDescription || ''}
                        onChange={(e) => handleFieldChange('orderDescription', e.target.value)}
                        className="w-full p-1.5 text-xs font-medium text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium text-slate-900 whitespace-pre-wrap">{currentData.orderDescription || '-'}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. FECHAS */}
        <div className="space-y-1.5">
          <label className="font-black text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
            3. FECHAS
          </label>
          <div className="border-2 border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="w-1/2 p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Fecha de recepción del pedido
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="date"
                        value={currentData.receptionDate || ''}
                        onChange={(e) => handleFieldChange('receptionDate', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.receptionDate || '-'}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Fecha de publicación
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="date"
                        value={currentData.publishDate || ''}
                        onChange={(e) => handleFieldChange('publishDate', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.publishDate || '-'}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Entrega de material
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="date"
                        value={currentData.materialDeliveryDate || ''}
                        onChange={(e) => handleFieldChange('materialDeliveryDate', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.materialDeliveryDate || '-'}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-100/70">
                    Entrega de producto terminado
                  </td>
                  <td className="p-1 sm:p-2">
                    {isEditable ? (
                      <input
                        type="date"
                        value={currentData.finishedProductDeliveryDate || ''}
                        onChange={(e) => handleFieldChange('finishedProductDeliveryDate', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{currentData.finishedProductDeliveryDate || '-'}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. PLATAFORMAS Y FORMATOS */}
        <div className="space-y-2">
          <label className="font-black text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
            4. PLATAFORMAS Y FORMATOS
          </label>
          <div className="border-2 border-slate-700 rounded-lg overflow-x-auto">
            <table className="w-full text-[11px] border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-700 text-slate-900">
                  <th className="p-2 text-left font-black border-r border-slate-700 w-44">
                    Formato / Red Social
                  </th>
                  {DIGITAL_NETWORKS.map((net) => (
                    <th key={net.id} className="p-1.5 text-center font-black border-r border-slate-700 last:border-r-0">
                      <div>{net.shortLabel}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EDITORIAL_FORMAT_LIST.map((format, idx) => {
                  return (
                    <tr 
                      key={format} 
                      className={`border-b border-slate-700 last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-700">
                        {format}
                      </td>
                      {DIGITAL_NETWORKS.map((net) => {
                        const checked = isCellSelected(format, net.id);
                        return (
                          <td 
                            key={net.id} 
                            onClick={() => handleTogglePlatform(format, net.id)}
                            className={`p-1.5 text-center border-r border-slate-700 last:border-r-0 ${
                              isEditable ? 'cursor-pointer hover:bg-blue-50' : ''
                            } ${checked ? 'bg-blue-100/60 font-black text-blue-900' : ''}`}
                          >
                            {checked ? (
                              <span className="text-blue-700 font-extrabold text-xs">✓</span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subcampos de Sección 4 */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Especificar la cuenta de Ecuavisa donde se va publicar y si tiene colaboración o repost:
              </label>
              {isEditable ? (
                <input
                  type="text"
                  value={currentData.publicationAccount || ''}
                  onChange={(e) => handleFieldChange('publicationAccount', e.target.value)}
                  placeholder="Ej: @ecuavisa / @ecuavisacom con colaboración de @marca_cliente"
                  className="w-full p-2.5 border-2 border-slate-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              ) : (
                <div className="p-2.5 border-2 border-slate-700 rounded-lg text-xs font-semibold bg-slate-50/50">
                  {currentData.publicationAccount || '(No especificada)'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Especificar si es un producto/segmento de la redacción:
              </label>
              <div className="space-y-2">
                {isEditable ? (
                  <input
                    type="text"
                    value={currentData.newsroomSegmentDetail || ''}
                    onChange={(e) => handleFieldChange('newsroomSegmentDetail', e.target.value)}
                    placeholder="Detalle del producto o segmento de redacción (ej. Contacto Directo, Televistazo, Segmento Tech)..."
                    className="w-full p-2 border-2 border-slate-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="p-2 border-2 border-slate-700 rounded-lg text-xs font-semibold bg-slate-50/50">
                    {currentData.newsroomSegmentDetail || '(Ninguno)'}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-[11px] w-20">Derechos:</span>
                  {isEditable ? (
                    <input
                      type="text"
                      value={currentData.rights || ''}
                      onChange={(e) => handleFieldChange('rights', e.target.value)}
                      placeholder="Especificar derechos de emisión, territorialidad o exclusividad..."
                      className="flex-1 p-2 border-2 border-slate-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  ) : (
                    <div className="flex-1 p-2 border-2 border-slate-700 rounded-lg text-xs font-semibold bg-slate-50/50">
                      {currentData.rights || 'Sin restricciones especiales de derechos.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. RECURSOS Y MATERIALES */}
        <div className="space-y-2">
          <label className="font-black text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
            5. RECURSOS Y MATERIALES
          </label>
          <div className="border-2 border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-700 text-slate-900">
                  <th className="p-2 text-left font-black border-r border-slate-700 w-1/3 sm:w-1/4">
                    Recurso
                  </th>
                  <th className="p-2 text-left font-black">
                    Detalle / Invitación Adjunta / Archivo
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Brief con Invitación adjunta */}
                <tr className="border-b border-slate-700">
                  <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-50/50">
                    Brief
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {isEditable ? (
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(currentData.resources?.brief?.invitationAttached)}
                            onChange={(e) => handleResourceChange('brief', { invitationAttached: e.target.checked })}
                            className="rounded text-blue-600 w-4 h-4"
                          />
                          <span>Invitación adjunta</span>
                        </label>
                      ) : (
                        currentData.resources?.brief?.invitationAttached && (
                          <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                            ✓ Invitación adjunta
                          </span>
                        )
                      )}

                      {isEditable ? (
                        <input
                          type="text"
                          value={currentData.resources?.brief?.detail || ''}
                          onChange={(e) => handleResourceChange('brief', { detail: e.target.value })}
                          placeholder="Detalle o enlace del brief..."
                          className="flex-1 min-w-[200px] p-1.5 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        <span className="text-slate-800 font-medium">
                          {currentData.resources?.brief?.detail || (currentData.resources?.brief?.invitationAttached ? '' : 'No aplica')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Resto de Recursos */}
                {[
                  { id: 'guion', label: 'Guión' },
                  { id: 'logo', label: 'Logo' },
                  { id: 'imagenes', label: 'Imágenes' },
                  { id: 'video', label: 'Video' },
                  { id: 'hashtagsAndCopys', label: 'Hashtags oficiales y Copys' },
                  { id: 'piezasGraficas', label: 'Piezas gráficas' },
                  { id: 'otros', label: 'Otros:' },
                ].map((item) => {
                  const res = currentData.resources?.[item.id] || {};
                  return (
                    <tr key={item.id} className="border-b border-slate-700 last:border-b-0">
                      <td className="p-2.5 font-bold text-slate-800 border-r border-slate-700 bg-slate-50/50">
                        {item.label}
                      </td>
                      <td className="p-2">
                        {isEditable ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={res.detail || ''}
                              onChange={(e) => handleResourceChange(item.id, { detail: e.target.value })}
                              placeholder={`Detalles o notas sobre ${item.label.toLowerCase()}...`}
                              className="w-full p-1.5 border border-slate-300 rounded text-xs"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-800 font-medium">
                            {res.detail || (res.applied ? '✓ Provisto' : '-')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Instrucciones o comentarios especiales */}
          <div className="pt-2 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Instrucciones o comentarios especiales (se escribe o se adjunta archivo):
            </label>
            {isEditable ? (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={currentData.specialInstructions || ''}
                  onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                  placeholder="Escribe todas las instrucciones editoriales, pautas, comentarios para el redactor o pega el enlace al archivo/carpeta..."
                  className="w-full p-3 border-2 border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            ) : (
              <div className="p-3 border-2 border-slate-700 rounded-lg text-xs font-medium bg-slate-50/50 whitespace-pre-wrap">
                {currentData.specialInstructions || '(Sin instrucciones especiales registradas)'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
