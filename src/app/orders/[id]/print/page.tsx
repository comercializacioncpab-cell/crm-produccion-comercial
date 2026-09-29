'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SPONSORSHIP_OPTIONS } from '@/lib/order-utils';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrintOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
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
  }, [orderId]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Cargando formato de impresión...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-xs text-slate-400">Orden no encontrada.</div>;
  }

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
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between no-print">
        <Link
          href={`/orders/${order.id}`}
          className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border border-slate-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la SP
        </Link>

        <button
          onClick={() => window.print()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
        >
          <Printer className="w-4 h-4" /> Imprimir / Guardar como PDF
        </button>
      </div>

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
        <div className="flex justify-end mb-2">
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
                  {order.creator?.name || 'ADRIANA ROJAS'}
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
              <tr>
                <td className="bg-[#e0f2fe] p-1.5 font-bold border-r border-slate-900 text-slate-900 uppercase">
                  Programa:
                </td>
                <td className="p-1.5 font-bold text-slate-900 uppercase">
                  {order.program || ''}
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

        {/* SECTION 3: TIPO DE AUSPICIO */}
        <div className="border border-slate-900">
          <div className="bg-[#8b80b6] px-3 py-1 font-bold text-xs text-white uppercase border-b border-slate-900">
            TIPO DE AUSPICIO:
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {SPONSORSHIP_OPTIONS.map((opt, idx) => {
                const isSelected = sponsorshipParsed.includes(opt.id);
                return (
                  <tr key={opt.id} className={idx < SPONSORSHIP_OPTIONS.length - 1 ? 'border-b border-slate-900' : ''}>
                    <td className="p-1.5 font-bold text-slate-900 uppercase border-r border-slate-900 w-2/3">
                      {opt.label}
                    </td>
                    <td className="p-1.5 text-center font-black text-sm">
                      {isSelected ? 'X' : ''}
                    </td>
                  </tr>
                );
              })}
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
                  {order.voiceoverType === 'ESPECIFICA' ? 'X' : ''}
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
                  Post Productor:
                </td>
                <td className="p-2 font-bold uppercase text-slate-900">
                  {order.postProducer?.name || ''}
                </td>
              </tr>
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
                      SI <span className="w-6 h-4 border border-slate-900 inline-block text-center text-xs leading-4 font-black">{order.hasChanges ? 'X' : ''}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      NO <span className="w-6 h-4 border border-slate-900 inline-block text-center text-xs leading-4 font-black">{!order.hasChanges ? 'X' : ''}</span>
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
    </div>
  );
}
