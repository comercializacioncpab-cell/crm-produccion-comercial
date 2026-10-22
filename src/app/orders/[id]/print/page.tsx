'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  SPONSORSHIP_CATEGORIES, 
  SPONSORSHIP_OPTIONS,
  DIGITAL_NETWORKS,
  DIGITAL_FORMATS,
  DIGITAL_RESOURCES_LIST
} from '@/lib/order-utils';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PrintOrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const token = searchParams.get('token') || '';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const query = token ? `?token=${encodeURIComponent(token)}` : '';
        const res = await fetch(`/api/orders/${orderId}${query}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId, token]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Cargando formato de impresión...</div>;
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 max-w-md mx-auto my-12 bg-white rounded-2xl shadow-sm border border-slate-200">
        <p className="font-bold text-slate-800 text-sm mb-1">Orden no disponible o enlace no autorizado</p>
        <p className="text-slate-500 text-xs">Si eres un usuario externo, solicita a la ejecutiva o coordinación de Ecuavisa el enlace actualizado de visualización.</p>
      </div>
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

  const sponsorshipParsed = (() => {
    try {
      return JSON.parse(order.sponsorshipTypes || '[]');
    } catch {
      return [];
    }
  })();

  return (
    <div className="bg-slate-200 min-h-screen py-6 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
      {/* Floating Action Controls (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between no-print gap-2">
        {token ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ficha Oficial Ecuavisa (Acceso Externo Seguro)</span>
          </div>
        ) : (
          <Link
            href={`/orders/${order.id}`}
            className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border border-slate-300 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la SP
          </Link>
        )}

        <button
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> 🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      {isDigital ? (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none mb-8 print-page">
          {/* Header Bar */}
          <div className="flex items-stretch border-2 border-slate-900 mb-2">
            <div className="bg-[#059669] text-white p-3 flex items-center gap-2 border-r-2 border-slate-900 w-1/3">
              <div>
                <p className="text-sm font-bold uppercase tracking-tight leading-none">Ecuavisa</p>
                <p className="text-lg font-black uppercase tracking-tight leading-tight">Digital</p>
              </div>
              <div className="ml-auto bg-white text-[#059669] font-black text-xl px-2.5 py-0.5 rounded-full border border-white">
                EV
              </div>
            </div>

            <div className="bg-[#d1d5db] flex-1 flex flex-col justify-center p-3 text-center">
              <h1 className="text-base font-black text-slate-900 uppercase tracking-wide leading-tight">
                FORMULARIO DE SOLICITUD EDITORIAL EV DIGITAL + COMERCIAL
              </h1>
              <p className="text-[10px] text-slate-600 font-bold uppercase">
                (Uso interno Ecuavisa Digital)
              </p>
            </div>
          </div>

          {/* Code SP Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="bg-emerald-700 text-white font-mono font-bold text-xs px-3 py-1 border border-slate-900 uppercase">
              📱 SOLICITUD DIGITAL (REDES SOCIALES & WEB)
            </div>
            <div className="bg-[#f37021] text-white font-mono font-bold text-xs px-6 py-1 border border-slate-900">
              {order.orderNumber}
            </div>
          </div>

          {/* SECTION 1: INFORMACIÓN GENERAL */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
              1. INFORMACIÓN GENERAL
            </div>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="bg-[#e0f2fe] w-1/3 p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                    Ejecutiva Digital:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 uppercase">
                    {order.executive?.name || order.creator?.name}
                    {order.executiveId && order.creatorId !== order.executiveId && (
                      <span className="text-[10px] text-slate-600 block lowercase font-normal">
                        (ingresado por: {order.creator?.name})
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                    Cliente / Marca:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 uppercase">
                    {order.clientAgency}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                    Producto / Servicio:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 uppercase">
                    {order.product}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                    Campaña:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 uppercase">
                    {order.campaign || 'N/A'}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                    Objetivo del contenido (KPI):
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 uppercase">
                    {order.contentObjective || 'N/A'}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase align-top">
                    Descripción del pedido:
                  </td>
                  <td className="p-1.5 text-slate-900 whitespace-pre-wrap">
                    {order.orderDescription || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                    Valor Paquete Digital:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900">
                    {order.packageValue ? `$ ${Number(order.packageValue).toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD` : '$ 0.00 USD'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 2: FECHAS */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
              2. FECHAS
            </div>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="w-1/2 p-1.5 font-bold border-r border-slate-900 text-slate-900">
                    Fecha de recepción de la solicitud:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 text-center">
                    {order.receptionDate || ''}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-1.5 font-bold border-r border-slate-900 text-slate-900">
                    Fecha de entrega de material:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 text-center">
                    {order.materialDeliveryDate || ''}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-1.5 font-bold border-r border-slate-900 text-slate-900">
                    Fecha de entrega de producto terminado:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 text-center">
                    {digitalParsed.finishedProductDeliveryDate || ''}
                  </td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-slate-900 text-red-700">
                    Fecha de publicación en redes:
                  </td>
                  <td className="p-1.5 font-black text-red-700 text-center">
                    {order.publishDate || order.airDate || ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 3: PLATAFORMAS Y FORMATOS (MATRIZ) */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
              3. PLATAFORMAS Y FORMATOS
            </div>
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                  <th className="p-1 text-left border-r border-slate-900 w-1/3">Formato</th>
                  {DIGITAL_NETWORKS.map((net) => (
                    <th key={net.id} className="p-1 text-center border-r border-slate-900 last:border-r-0">
                      {net.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIGITAL_FORMATS.map((fmt) => {
                  const selectedNets = (digitalParsed.platformsAndFormats && digitalParsed.platformsAndFormats[fmt]) || [];
                  const hasAny = selectedNets.length > 0;
                  return (
                    <tr key={fmt} className={`border-b border-slate-900 last:border-b-0 ${hasAny ? 'bg-emerald-50/50' : ''}`}>
                      <td className="p-1 font-medium border-r border-slate-900 text-slate-900">
                        {fmt}
                      </td>
                      {DIGITAL_NETWORKS.map((net) => (
                        <td key={net.id} className="p-1 text-center font-black border-r border-slate-900 last:border-r-0">
                          {selectedNets.includes(net.id) ? 'X' : ''}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SECTION 4 & 5: CUENTA Y COBERTURA */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
              4. PUBLICACIÓN & COBERTURA DE REDACCIÓN
            </div>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="w-1/3 p-1.5 font-bold border-r border-slate-900 bg-[#e0f2fe]">
                    Cuenta de Ecuavisa:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900">
                    {digitalParsed.publicationAccount || 'Ecuavisa Oficial'}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-1.5 font-bold border-r border-slate-900 bg-[#e0f2fe]">
                    Cobertura de redacción:
                  </td>
                  <td className="p-1.5 font-bold text-slate-900">
                    {digitalParsed.isNewsroomSegment ? 'SI [X]' : 'NO [ ]'}
                    {digitalParsed.isNewsroomSegment && ` • Tipo: ${digitalParsed.newsroomDetails?.segmentType || ''}`}
                  </td>
                </tr>
                {digitalParsed.isNewsroomSegment && (
                  <tr>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-[#e0f2fe]">
                      Fecha, Hora y Lugar:
                    </td>
                    <td className="p-1.5 text-slate-900">
                      Fecha: {digitalParsed.newsroomDetails?.date || ''} • Hora: {digitalParsed.newsroomDetails?.time || ''} • Lugar: {digitalParsed.newsroomDetails?.location || ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* SECTION 6: RECURSOS Y MATERIALES */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
              5. RECURSOS Y MATERIALES
            </div>
            <div className="grid grid-cols-4 p-2 gap-1 text-[11px]">
              {DIGITAL_RESOURCES_LIST.map((res) => {
                const isYes = digitalParsed.resources?.[res.id] === 'SI';
                return (
                  <div key={res.id} className="flex items-center justify-between border border-slate-400 p-1 rounded">
                    <span>{res.label}:</span>
                    <span className="font-mono font-black">{isYes ? 'SI [X]' : 'NO [ ]'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: INSTRUCCIONES ESPECIALES */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
              6. INSTRUCCIONES ESPECIALES & ENLACES
            </div>
            <div className="p-3 text-xs space-y-2">
              {order.downloadUrl && (
                <div>
                  <span className="font-bold text-slate-900 block">Link de descarga en la nube:</span>
                  <p className="font-mono text-blue-800 break-all">{order.downloadUrl}</p>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-900 block">Observaciones / Copys:</span>
                <p className="whitespace-pre-wrap text-slate-800">{order.materialNotes || 'Sin observaciones adicionales.'}</p>
              </div>
            </div>
          </div>

          {/* SECTION 7: NOTIFICACIÓN A EQUIPO DIGITAL (SOLO INFORMATIVO) */}
          <div className="border border-slate-900">
            <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
              7. NOTIFICACIÓN A EQUIPO DIGITAL (CARÁCTER INFORMATIVO - SIN APROBACIÓN)
            </div>
            <div className="p-3 text-xs flex flex-wrap gap-4 font-mono font-bold">
              <span>
                [{digitalParsed.informProfiles?.creativeDigital !== false ? 'X' : ' '}] Creativo Digital
              </span>
              <span>
                [{digitalParsed.informProfiles?.communityManager !== false ? 'X' : ' '}] Community Manager
              </span>
              <span>
                [{digitalParsed.informProfiles?.monetization !== false ? 'X' : ' '}] Jefe de Monetización
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* DOCUMENT SHEET 1 (Exact replication of Excel Page 1) */}
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none mb-8 print-page">
        {/* Header Bar */}
        <div className="flex items-stretch border-2 border-slate-900 mb-2">
          {/* Logo EV Box */}
          <div className="bg-[#00a3ad] text-white p-3 flex items-center gap-2 border-r-2 border-slate-900 w-1/3">
            <div>
              <p className="text-sm font-bold uppercase tracking-tight leading-none">Producción</p>
              <p className="text-lg font-black uppercase tracking-tight leading-tight">Comercial</p>
            </div>
            <div className="ml-auto bg-white text-[#00a3ad] font-black text-xl px-2.5 py-0.5 rounded-full border border-white">
              EV
            </div>
          </div>

          {/* Title Box */}
          <div className="bg-[#d1d5db] flex-1 flex items-center justify-center p-3">
            <h1 className="text-2xl font-normal text-slate-800 tracking-wide">
              Solicitud de producción
            </h1>
          </div>
        </div>

        {/* Code SP Badge */}
        <div className="flex items-center justify-between mb-2">
          {order.isDemo ? (
            <div className="bg-purple-700 text-white font-mono font-black text-xs px-3 py-1 border border-slate-900 uppercase">
              🧪 DEMO / PILOTO COMERCIAL ($0 USD) {order.demoStatus === 'VENDIDO' ? '• [VENDIDO]' : ''}
            </div>
          ) : (
            <div></div>
          )}
          <div className="bg-[#f37021] text-white font-mono font-bold text-xs px-6 py-1 border border-slate-900">
            {order.orderNumber}
          </div>
        </div>

        {/* SECTION 1: INFORMACIÓN GENERAL */}
        <div className="border border-slate-900 mb-4">
          <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
            INFORMACIÓN GENERAL
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="bg-[#e0f2fe] w-1/3 p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                  Ejecutiva de Ventas:
                </td>
                <td className="p-1.5 font-bold text-slate-900 uppercase">
                  {order.executive?.name || order.creator?.name || 'ADRIANA ROJAS'}
                  {order.executiveId && order.creatorId !== order.executiveId && (
                    <span className="text-[10px] text-slate-600 block lowercase font-normal">
                      (ingresado por: {order.creator?.name})
                    </span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                  Cliente / Agencia:
                </td>
                <td className="p-1.5 font-bold text-slate-900 uppercase">
                  {order.clientAgency}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                  Producto:
                </td>
                <td className="p-1.5 font-bold text-slate-900 uppercase">
                  {order.product}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                  Programa:
                </td>
                <td className="p-1.5 font-bold text-slate-900 uppercase">
                  {order.program || ''}
                </td>
              </tr>
              <tr>
                <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                  Tipo / Valor del Paquete:
                </td>
                <td className="p-1.5 font-bold text-slate-900">
                  {order.isDemo ? (
                    <span className="text-purple-800 font-black">
                      🧪 DEMO / MUESTRA ($0.00 USD - SIN COSTO)
                    </span>
                  ) : order.packageValue ? (
                    `$ ${Number(order.packageValue).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                  ) : (
                    '$ 0.00 USD'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2: MATERIAL */}
        <div className="border border-slate-900 mb-4">
          <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
            MATERIAL
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="w-1/2 p-1.5 font-bold border-r border-slate-900 text-slate-900">
                  Fecha de entrega de material:
                </td>
                <td className="p-1.5 font-bold text-slate-900 text-center">
                  {order.materialDeliveryDate || ''}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 font-bold border-r border-slate-900 text-slate-900">
                  Fecha al aire:
                </td>
                <td className="p-1.5 font-bold text-slate-900 text-center">
                  {order.airDate || ''}
                </td>
              </tr>
              {/* External Download Link */}
              {order.downloadUrl && (
                <tr className="border-b border-slate-900 bg-[#e0f2fe]/40">
                  <td className="p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                    Link de Descarga (Insumos):
                  </td>
                  <td className="p-1.5 font-mono text-[11px] text-blue-900 break-all">
                    {order.downloadUrl}
                  </td>
                </tr>
              )}
              {/* Material Notes Big Box */}
              <tr className="border-b border-slate-900">
                <td colSpan={2} className="p-4 bg-white min-h-[140px] align-top text-xs text-slate-800">
                  {order.materialNotes || ''}
                </td>
              </tr>
              {/* Brief SI / NO */}
              <tr>
                <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                  BRIEF:
                </td>
                <td className="p-1.5">
                  <div className="flex items-center gap-6 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      SI <span className="w-5 h-4 border border-slate-900 inline-block text-center text-[10px] leading-3 font-black">{order.hasBrief ? 'X' : ''}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      NO <span className="w-5 h-4 border border-slate-900 inline-block text-center text-[10px] leading-3 font-black">{!order.hasBrief ? 'X' : ''}</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 3: TIPO DE AUSPICIO (Categorized: Gráficos y Estratégicos) */}
        <div className="border border-slate-900">
          <div className="bg-[#8b80b6] px-3 py-1 font-bold text-xs text-white uppercase border-b border-slate-900">
            TIPO DE AUSPICIO / FORMATOS COMERCIALES
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {SPONSORSHIP_CATEGORIES.map((cat, catIdx) => (
                <React.Fragment key={cat.id}>
                  {/* Category Header Row */}
                  <tr className="bg-[#e0f2fe] border-y border-slate-900">
                    <td colSpan={2} className="p-1.5 font-black uppercase tracking-wider text-slate-900">
                      {cat.category}
                    </td>
                  </tr>
                  {/* Category Options */}
                  {cat.options.map((opt, optIdx) => {
                    const isSelected = sponsorshipParsed.includes(opt.id);
                    return (
                      <tr 
                        key={opt.id} 
                        className={
                          optIdx < cat.options.length - 1 || catIdx < SPONSORSHIP_CATEGORIES.length - 1
                            ? 'border-b border-slate-300'
                            : ''
                        }
                      >
                        <td className="p-1.5 font-medium text-slate-900 uppercase border-r border-slate-900 w-3/4 pl-4">
                          {opt.label}
                        </td>
                        <td className="p-1.5 text-center font-black text-sm bg-slate-50/50">
                          {isSelected ? 'X' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {order.customSponsorship && (
                <tr className="border-t border-slate-900 bg-purple-50">
                  <td className="p-1.5 font-bold text-purple-950 uppercase border-r border-slate-900 w-3/4 pl-4">
                    OTRO: {order.customSponsorship}
                  </td>
                  <td className="p-1.5 text-center font-black text-sm text-purple-900">
                    X
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENT SHEET 2 (Exact replication of Excel Page 2) */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none print-page">
        {/* Header Bar Page 2 */}
        <div className="border-t-2 border-slate-900 pt-4 mb-4">
          <div className="bg-[#8b80b6] px-3 py-1 font-bold text-xs text-white uppercase border border-slate-900">
            LOCUCION:
          </div>
          <table className="w-full text-xs border-x border-b border-slate-900">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="bg-[#e0f2fe] w-1/3 p-1.5 font-bold border-r border-slate-900">
                  Genérica:
                </td>
                <td className="p-1.5 font-bold text-center">
                  {order.voiceoverType === 'GENERICA' ? 'X' : ''}
                </td>
              </tr>
              <tr>
                <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900">
                  Específica:
                </td>
                <td className="p-1.5 font-bold text-center">
                  {order.voiceoverType === 'EXCLUSIVA_CLIENTE' || order.voiceoverType === 'ESPECIFICA' ? 'X' : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* LOCUCION TEXT BOX */}
        <div className="border border-slate-900 mb-6">
          <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
            LOCUCION
          </div>
          <div className="p-4 min-h-[140px] text-xs font-mono whitespace-pre-wrap text-slate-900">
            {order.voiceoverText || ''}
          </div>
        </div>

        {/* SEGUIMIENTO */}
        <div className="border border-slate-900">
          <div className="bg-[#fef08a] px-3 py-1 font-black text-xs text-slate-900 uppercase border-b border-slate-900">
            SEGUIMIENTO:
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="bg-[#93c5fd] w-1/3 p-2 font-bold border-r border-slate-900">
                  Post Productor Principal:
                </td>
                <td className="p-2 font-bold uppercase text-slate-900">
                  {order.postProducer?.name || 'SIN ASIGNAR'}
                </td>
              </tr>
              {order.secondaryPostProducer?.name && (
                <tr className="border-b border-slate-900">
                  <td className="bg-[#93c5fd] w-1/3 p-2 font-bold border-r border-slate-900">
                    Post Productor Adicional (Apoyo):
                  </td>
                  <td className="p-2 font-bold uppercase text-slate-900 text-indigo-900">
                    {order.secondaryPostProducer.name}
                  </td>
                </tr>
              )}
              <tr className="border-b border-slate-900">
                <td className="bg-[#93c5fd] p-2 font-bold border-r border-slate-900">
                  APROBADO
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-8 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      SI <span className="w-6 h-4 border border-slate-900 inline-block text-center text-xs leading-4 font-black">{order.approved ? 'X' : ''}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      NO <span className="w-6 h-4 border border-slate-900 inline-block text-center text-xs leading-4 font-black">{order.approved === false ? 'X' : ''}</span>
                    </span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="bg-[#93c5fd] p-2 font-bold border-r border-slate-900">
                  APROBADO POR:
                </td>
                <td className="p-2 font-bold uppercase text-slate-900">
                  {order.approvedBy || ''}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="bg-[#93c5fd] p-2 font-bold border-r border-slate-900">
                  Cambios:
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-8 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      SI <span className="w-6 h-4 border border-slate-900 inline-block text-center text-xs leading-4 font-black">{order.hasChanges || (order.changesCount && order.changesCount > 0) ? 'X' : ''}</span>
                      {order.changesCount > 0 && (
                        <span className="text-[10px] text-slate-700 font-semibold">
                          ({order.changesCount} {order.changesCount === 1 ? 'cambio' : 'cambios'}{order.changesCount >= 4 || order.extraCostAccepted ? ' - Con Costo Adicional de $200 USD c/u' : ''})
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      NO <span className="w-6 h-4 border border-slate-900 inline-block text-center text-xs leading-4 font-black">{!order.hasChanges && (!order.changesCount || order.changesCount === 0) ? 'X' : ''}</span>
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-[#93c5fd] p-2 font-bold border-r border-slate-900 align-top">
                  Especificaciones:
                </td>
                <td className="p-2 min-h-[80px] align-top text-xs text-slate-800">
                  {order.changeNotes || order.deliveryNotes || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
