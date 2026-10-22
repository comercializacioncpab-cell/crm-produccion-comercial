'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, Download, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCostSheetPage() {
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
    return <div className="p-12 text-center text-xs text-slate-500">Cargando ficha de costos y rentabilidad...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-xs text-slate-500">Orden no encontrada.</div>;
  }

  const digitalParsed = (() => {
    try {
      return typeof order.digitalData === 'string' ? JSON.parse(order.digitalData) : (order.digitalData || {});
    } catch {
      return {};
    }
  })();

  const costs = digitalParsed.financialCosts || {
    producerCost: 0,
    reporterCost: 0,
    mobilizationCost: 0,
    otherCost: 0,
    agencyCommissionApplies: false,
    agencyCommissionRate: 15,
    agencyCommissionAmount: 0,
    totalExpenses: 0,
    netMargin: order.packageValue || 0,
    profitabilityPercent: 100,
  };

  const packageVal = order.packageValue || 0;
  const producerCost = Number(costs.producerCost || 0);
  const reporterCost = Number(costs.reporterCost || 0);
  const mobilizationCost = Number(costs.mobilizationCost || 0);
  const otherCost = Number(costs.otherCost || 0);
  const totalExpenses = producerCost + reporterCost + mobilizationCost + otherCost;
  const agencyCommissionAmount = costs.agencyCommissionApplies ? packageVal * 0.15 : 0;
  const netMargin = packageVal - agencyCommissionAmount - totalExpenses;
  const profitabilityPercent = packageVal > 0 ? (netMargin / packageVal) * 100 : 0;
  const isOptimal = profitabilityPercent >= 70;

  // Function to download Word document (.doc)
  const downloadWordDoc = () => {
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
          <tr>
            <td class="label">Cliente / Marca:</td>
            <td class="val">${order.clientAgency || ''}</td>
          </tr>
          <tr>
            <td class="label">Producto / Servicio:</td>
            <td class="val">${order.product || ''}</td>
          </tr>
          <tr>
            <td class="label">Campaña / Tagline:</td>
            <td class="val">${order.campaign || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Objetivo de Contenido / KPI:</td>
            <td class="val">${order.contentObjective || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Ejecutiva Digital Asignada:</td>
            <td class="val">${order.executive?.name || order.creator?.name || ''}</td>
          </tr>
          <tr>
            <td class="label">Editor / Post-Productor:</td>
            <td class="val">${order.postProducer?.name || 'Por asignar'}</td>
          </tr>
          <tr>
            <td class="label">Cronograma Editorial:</td>
            <td class="val">Recepción: ${order.receptionDate || 'N/A'} | Entrega Insumos: ${order.materialDeliveryDate || 'N/A'} | Publicación: ${order.publishDate || order.airDate || 'N/A'}</td>
          </tr>
        </table>

        <div class="section-title">2. Desglose Financiero & Gastos del Proyecto</div>
        <table class="data-table">
          <tr>
            <th>Concepto</th>
            <th>Condición / Detalle</th>
            <th style="text-align: right;">Monto USD</th>
          </tr>
          <tr>
            <td style="font-weight: bold;">Valor del Paquete Comercial</td>
            <td>Tarifa acordada del proyecto publicitario</td>
            <td style="text-align: right; font-weight: bold; color: #0f172a;">$${packageVal.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Comisión de Agencia (15%)</td>
            <td>${costs.agencyCommissionApplies ? 'APLICA DESCUENTO (15%)' : 'NO APLICA COMISIÓN'}</td>
            <td style="text-align: right; font-weight: bold; color: ${costs.agencyCommissionApplies ? '#dc2626' : '#64748b'};">
              ${costs.agencyCommissionApplies ? `-$${agencyCommissionAmount.toFixed(2)} USD` : '$0.00 USD'}
            </td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td colspan="3" style="font-weight: bold; font-size: 9pt; text-transform: uppercase;">Gastos Directos de Producción:</td>
          </tr>
          <tr>
            <td>• Gasto Productor:</td>
            <td>Honorarios / Asignación de producción de campo</td>
            <td style="text-align: right;">$${producerCost.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td>• Gasto Reportero:</td>
            <td>Honorarios / Talento periodístico digital</td>
            <td style="text-align: right;">$${reporterCost.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td>• Gasto Movilización:</td>
            <td>Transporte, viáticos, combustible y traslados</td>
            <td style="text-align: right;">$${mobilizationCost.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td>• Otros Gastos:</td>
            <td>Imprevistos, utilería, música con derechos, extras</td>
            <td style="text-align: right;">$${otherCost.toFixed(2)} USD</td>
          </tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="2">TOTAL GASTOS DIRECTOS:</td>
            <td style="text-align: right; color: #dc2626;">-$${totalExpenses.toFixed(2)} USD</td>
          </tr>
          <tr style="background-color: #e2e8f0; font-weight: bold; font-size: 11pt;">
            <td colspan="2">MARGEN NETO / UTILIDAD BRUTA:</td>
            <td style="text-align: right; color: #0f172a;">$${netMargin.toFixed(2)} USD</td>
          </tr>
          <tr style="background-color: ${isOptimal ? '#dcfce7' : '#fee2e2'}; font-weight: bold; font-size: 12pt;">
            <td colspan="2">PORCENTAJE DE RENTABILIDAD:</td>
            <td style="text-align: right; color: ${isOptimal ? '#166534' : '#991b1b'};">${profitabilityPercent.toFixed(1)}%</td>
          </tr>
        </table>

        ${isOptimal ? `
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

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 print:p-0 print:bg-white text-slate-800">
      {/* Action Toolbar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        {token ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Ficha Financiera Oficial (Acceso Externo)</span>
          </div>
        ) : (
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la SP
          </Link>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={downloadWordDoc}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Descargar Documento (.doc)
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Main Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xl print:shadow-none print:p-0 print:rounded-none border border-slate-200 print:border-none">
        {/* Header Bar */}
        <div className="flex items-stretch border-2 border-slate-900 mb-6">
          <div className="bg-[#00a3ad] text-white p-4 flex flex-col justify-center border-r-2 border-slate-900 w-1/3">
            <span className="text-xs font-bold uppercase tracking-wider">Ecuavisa Digital</span>
            <span className="text-lg font-black uppercase tracking-tight leading-tight">Producción Comercial</span>
          </div>
          <div className="bg-slate-100 flex-1 flex flex-col items-center justify-center p-3 text-center border-r-2 border-slate-900">
            <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
              Informe de Costos & Rentabilidad
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">Ficha Técnica Oficial del Proyecto Digital</p>
          </div>
          <div className="bg-[#fef08a] w-1/4 p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Código SP</span>
            <span className="font-mono font-black text-sm text-slate-900">{order.orderNumber}</span>
          </div>
        </div>

        {/* Section 1: Proyecto */}
        <div className="mb-6 border border-slate-900">
          <div className="bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase">
            1. Información General del Proyecto
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 p-2 font-bold w-1/3 border-r border-slate-200 text-slate-700">Cliente / Marca:</td>
                <td className="p-2 font-black text-slate-900 uppercase">{order.clientAgency}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 p-2 font-bold border-r border-slate-200 text-slate-700">Producto / Servicio:</td>
                <td className="p-2 font-bold text-slate-900 uppercase">{order.product}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 p-2 font-bold border-r border-slate-200 text-slate-700">Campaña / Tagline:</td>
                <td className="p-2 text-slate-800">{order.campaign || 'N/A'}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 p-2 font-bold border-r border-slate-200 text-slate-700">Objetivo / KPI Digital:</td>
                <td className="p-2 font-bold text-emerald-800">{order.contentObjective || 'N/A'}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 p-2 font-bold border-r border-slate-200 text-slate-700">Ejecutiva Digital:</td>
                <td className="p-2 text-slate-900 font-semibold">{order.executive?.name || order.creator?.name}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 p-2 font-bold border-r border-slate-200 text-slate-700">Editor / Post-Productor:</td>
                <td className="p-2 text-slate-900 font-semibold">{order.postProducer?.name || 'Por asignar'}</td>
              </tr>
              <tr>
                <td className="bg-slate-50 p-2 font-bold border-r border-slate-200 text-slate-700">Cronograma Editorial:</td>
                <td className="p-2 text-slate-800 text-[11px]">
                  <strong>Recepción:</strong> {order.receptionDate || 'N/A'} &nbsp;|&nbsp;
                  <strong>Entrega Insumos:</strong> {order.materialDeliveryDate || 'N/A'} &nbsp;|&nbsp;
                  <strong>Publicación:</strong> {order.publishDate || order.airDate || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Análisis Financiero */}
        <div className="mb-6 border border-slate-900">
          <div className="bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase flex items-center justify-between">
            <span>2. Desglose Financiero, Gastos & Rentabilidad</span>
            <span className="text-[10px] text-cyan-300 font-mono">Meta de Rentabilidad: &gt;= 70%</span>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-bold text-[11px]">
                <th className="p-2.5 text-left border-r border-slate-900 w-1/3">Concepto</th>
                <th className="p-2.5 text-left border-r border-slate-900">Condición / Detalle</th>
                <th className="p-2.5 text-right w-1/4">Valor USD</th>
              </tr>
            </thead>
            <tbody>
              {/* Valor Paquete */}
              <tr className="border-b border-slate-900 bg-white">
                <td className="p-2.5 font-black text-slate-900 border-r border-slate-900 uppercase">
                  Valor del Paquete Comercial
                </td>
                <td className="p-2.5 text-slate-600 border-r border-slate-900">
                  Tarifa acordada del proyecto publicitario
                </td>
                <td className="p-2.5 text-right font-mono font-black text-sm text-slate-900">
                  ${packageVal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Comisión de Agencia */}
              <tr className="border-b border-slate-900 bg-slate-50/50">
                <td className="p-2.5 font-bold text-slate-800 border-r border-slate-900">
                  Comisión de Agencia (15%)
                </td>
                <td className="p-2.5 text-slate-700 border-r border-slate-900">
                  {costs.agencyCommissionApplies ? (
                    <span className="text-rose-700 font-bold">✓ APLICA DESCUENTO DEL 15%</span>
                  ) : (
                    <span className="text-slate-500">NO APLICA COMISIÓN DE AGENCIA</span>
                  )}
                </td>
                <td className={`p-2.5 text-right font-mono font-bold ${costs.agencyCommissionApplies ? 'text-rose-700' : 'text-slate-500'}`}>
                  {costs.agencyCommissionApplies
                    ? `-$${agencyCommissionAmount.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '$0.00'}
                </td>
              </tr>

              {/* Encabezado Gastos */}
              <tr className="bg-[#fef08a]/60 border-b border-slate-900">
                <td colSpan={3} className="px-2.5 py-1.5 font-black text-[11px] text-slate-900 uppercase tracking-wide">
                  Gastos Directos de Producción
                </td>
              </tr>

              {/* Gasto Productor */}
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-4 text-slate-700 border-r border-slate-900">
                  • Productor:
                </td>
                <td className="p-2 text-slate-500 border-r border-slate-900 text-[11px]">
                  Honorarios / asignación de producción en campo
                </td>
                <td className="p-2 text-right font-mono text-slate-800">
                  ${producerCost.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Gasto Reportero */}
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-4 text-slate-700 border-r border-slate-900">
                  • Reportero:
                </td>
                <td className="p-2 text-slate-500 border-r border-slate-900 text-[11px]">
                  Honorarios / talento periodístico digital
                </td>
                <td className="p-2 text-right font-mono text-slate-800">
                  ${reporterCost.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Gasto Movilización */}
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-4 text-slate-700 border-r border-slate-900">
                  • Movilización:
                </td>
                <td className="p-2 text-slate-500 border-r border-slate-900 text-[11px]">
                  Transporte, viáticos, combustible y traslados
                </td>
                <td className="p-2 text-right font-mono text-slate-800">
                  ${mobilizationCost.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Gasto Otros */}
              <tr className="border-b border-slate-900">
                <td className="p-2 pl-4 text-slate-700 border-r border-slate-900">
                  • Otros:
                </td>
                <td className="p-2 text-slate-500 border-r border-slate-900 text-[11px]">
                  Imprevistos, utilería, licencias o compras específicas
                </td>
                <td className="p-2 text-right font-mono text-slate-800">
                  ${otherCost.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Subtotal Gastos */}
              <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold">
                <td colSpan={2} className="p-2.5 text-right border-r border-slate-900 uppercase text-[11px] text-slate-900">
                  TOTAL GASTOS DIRECTOS:
                </td>
                <td className="p-2.5 text-right font-mono font-bold text-rose-700 text-xs">
                  -${totalExpenses.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Margen Neto */}
              <tr className="border-b border-slate-900 bg-slate-200/80 font-black text-sm">
                <td colSpan={2} className="p-3 text-right border-r border-slate-900 uppercase text-slate-900">
                  MARGEN NETO / UTILIDAD BRUTA:
                </td>
                <td className="p-3 text-right font-mono font-black text-base text-slate-900">
                  ${netMargin.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Porcentaje Rentabilidad */}
              <tr className={isOptimal ? 'bg-emerald-100 text-emerald-950 font-black' : 'bg-rose-100 text-rose-950 font-black'}>
                <td colSpan={2} className="p-3 text-right border-r border-slate-900 uppercase text-sm">
                  RENTABILIDAD LOGRADA (%):
                </td>
                <td className="p-3 text-right font-mono text-xl">
                  {profitabilityPercent.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dictamen Banner */}
        <div className={`p-4 rounded-2xl border-2 mb-8 ${isOptimal ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-rose-50 border-rose-500 text-rose-950'}`}>
          <div className="flex items-center gap-3">
            {isOptimal ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0" />
            )}
            <div>
              <h3 className="font-black text-sm uppercase">
                {isOptimal ? '✓ PROYECTO RENTABLE - DICTAMEN APROBADO' : '⚠️ ADVERTENCIA: RENTABILIDAD POR DEBAJO DEL OBJETIVO'}
              </h3>
              <p className="text-xs mt-0.5 font-medium">
                {isOptimal
                  ? `El proyecto presenta una rentabilidad del ${profitabilityPercent.toFixed(1)}%, la cual supera la política comercial mínima requerida del 70%. Viable para asignación y producción.`
                  : `El proyecto presenta una rentabilidad del ${profitabilityPercent.toFixed(1)}%, situándose por debajo del 70% requerido. Se requiere autorización especial de Gerencia para su producción.`}
              </p>
            </div>
          </div>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-8 pt-12 border-t-2 border-slate-900">
          <div className="text-center space-y-1">
            <div className="border-t border-slate-900 w-3/4 mx-auto pt-2"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">Coordinación de Producción</p>
            <p className="text-[10px] text-slate-500">Ecuavisa Digital & Comercial</p>
          </div>

          <div className="text-center space-y-1">
            <div className="border-t border-slate-900 w-3/4 mx-auto pt-2"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">Productor Senior / Gerencia</p>
            <p className="text-[10px] text-slate-500">Validación y Aprobación Financiera</p>
          </div>
        </div>
      </div>
    </div>
  );
}
