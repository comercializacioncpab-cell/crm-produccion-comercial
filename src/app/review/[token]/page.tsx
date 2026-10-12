'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Clapperboard,
  Tv,
  Calendar,
  ExternalLink,
  Send,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Video
} from 'lucide-react';

export default function ClientReviewPage() {
  const params = useParams();
  const token = params?.token as string;

  const [order, setOrder] = useState<any | null>(null);
  const [deliveryFiles, setDeliveryFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Approval modal/state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approverName, setApproverName] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Request changes modal/state
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [changesReason, setChangesReason] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);
  const [submittingChanges, setSubmittingChanges] = useState(false);

  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const loadReviewData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/review/${token}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setDeliveryFiles(data.deliveryFiles || []);
      } else {
        const d = await res.json();
        setError(d.error || 'No se pudo cargar la orden');
      }
    } catch (e: any) {
      setError(e.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, [token]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approverName.trim()) return;

    try {
      setSubmittingApprove(true);
      const res = await fetch(`/api/review/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          clientName: approverName.trim(),
          clientComments: approvalNotes.trim(),
        }),
      });

      if (res.ok) {
        setShowApproveModal(false);
        setFeedbackSuccess('¡Comercial aprobado con éxito! El equipo de Producción Comercial y Tráfico han sido notificados.');
        await loadReviewData();
      } else {
        const d = await res.json();
        alert(d.error || 'Error al aprobar comercial');
      }
    } catch (e: any) {
      alert(e.message || 'Error de conexión');
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim() || !changesReason.trim()) return;

    const validChecklist = checklistItems.filter((i) => i.trim().length > 0);

    try {
      setSubmittingChanges(true);
      const res = await fetch(`/api/review/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_CHANGES',
          clientName: requesterName.trim(),
          reason: changesReason.trim(),
          changeChecklist: validChecklist,
        }),
      });

      if (res.ok) {
        setShowChangesModal(false);
        setFeedbackSuccess('Ajustes enviados al editor. El equipo comenzará a trabajar en los cambios solicitados.');
        await loadReviewData();
      } else {
        const d = await res.json();
        alert(d.error || 'Error al solicitar cambios');
      }
    } catch (e: any) {
      alert(e.message || 'Error de conexión');
    } finally {
      setSubmittingChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Cargando revisión de comercial...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center text-white shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Enlace no disponible</h2>
          <p className="text-slate-400 text-sm mt-2">
            {error || 'El comercial no fue encontrado o el enlace de revisión ha caducado.'}
          </p>
        </div>
      </div>
    );
  }

  const latestFile = deliveryFiles[0];
  const isApproved = order.status === 'APROBADA' || !!order.clientApprovedAt;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider text-white">ECUAVISA</span>
                <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Producción Comercial
                </span>
              </div>
              <p className="text-xs text-slate-400">Portal de Aprobación de Comerciales & Piezas</p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-xs text-slate-400 block font-mono">Orden de Producción</span>
            <span className="text-base font-black text-cyan-400 tracking-wide font-mono">
              {order.orderNumber}
            </span>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {/* Status Card */}
        {isApproved ? (
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  ¡Aprobado para Emisión!
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Este comercial ha sido aprobado
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Aprobado por: <strong className="text-emerald-300">{order.clientApprovedBy || 'Cliente / Agencia'}</strong>{' '}
                  {order.clientApprovedAt && `el ${new Date(order.clientApprovedAt).toLocaleString()}`}
                </p>
                {order.clientNotes && (
                  <p className="text-xs text-slate-400 italic mt-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                    &ldquo;{order.clientNotes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Pendiente de Aprobación del Cliente
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Revisión de Comercial
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                Revisa el corte a continuación. Puedes aprobar la versión final directamente o enviar observaciones específicas para que el editor realice ajustes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowChangesModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-2xl transition-all text-center"
              >
                ✏️ Solicitar Ajustes
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-900/30 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Aprobar Comercial
              </button>
            </div>
          </div>
        )}

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Detalles de la Pauta
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Cliente / Agencia:</span>
                <span className="text-base font-bold text-white">{order.clientAgency}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Producto / Versión:</span>
                <span className="font-semibold text-slate-200">{order.product}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Programa / Franja:</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Tv className="w-3.5 h-3.5 text-cyan-400" /> {order.program}
                </span>
              </div>
              {order.airDate && (
                <div>
                  <span className="text-slate-500 block">Fecha de Transmisión:</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {new Date(order.airDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Equipo Ecuavisa
            </h3>
            <div className="space-y-3 text-xs">
              {order.executive && (
                <div>
                  <span className="text-slate-500 block">Ejecutiva/o de Ventas:</span>
                  <span className="font-bold text-white">{order.executive.name}</span>
                  {order.executive.phone && (
                    <span className="text-slate-400 block text-[11px] mt-0.5">📱 {order.executive.phone}</span>
                  )}
                </div>
              )}
              {order.postProducer && (
                <div>
                  <span className="text-slate-500 block">Post-Productor Responsable:</span>
                  <span className="font-bold text-white">{order.postProducer.name}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <span className="text-slate-500 block">Última entrega:</span>
                  <span className="font-medium text-slate-300">
                    {new Date(order.deliveredAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Piezas y Entregables para Revisión</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {deliveryFiles.length} entregable(s)
            </span>
          </div>

          {order.deliveryNotes && (
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Notas del Editor:
              </span>
              <p className="text-slate-300">{order.deliveryNotes}</p>
            </div>
          )}

          {deliveryFiles.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
              <p className="text-xs text-slate-400">No hay archivos entregados adjuntos aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveryFiles.map((file) => {
                const targetUrl = file.externalUrl || file.filePath;
                return (
                  <div
                    key={file.id}
                    className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black text-xs shrink-0 border border-cyan-500/20">
                        V{file.version || 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{file.fileName}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span>Versión {file.version || 1}</span>
                          <span>•</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {targetUrl && (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
                      >
                        Ver Video / Abrir Archivo <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-6">
          <p>© {new Date().getFullYear()} Ecuavisa Producción Comercial • Todos los derechos reservados</p>
        </div>
      </div>

      {/* Modal: Aprobar Comercial */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Aprobar Comercial
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Al confirmar, el comercial pasará a estado APROBADO para emisión en la señal de Ecuavisa.
            </p>

            <form onSubmit={handleApprove} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tu Nombre y Apellido / Cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María Gómez (Directora de Marca)"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Comentarios adicionales de aprobación (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Todo conforme con audio y logos."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingApprove}
                  className="px-5 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingApprove ? 'Aprobando...' : 'Confirmar Aprobación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Solicitar Ajustes */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" /> Solicitar Ajustes / Correcciones
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Detalla los cambios necesarios para que el editor realice el ajuste y genere un nuevo corte.
            </p>

            <form onSubmit={handleRequestChanges} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tu Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Pérez (Agencia Publicitaria)"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Resumen de los cambios solicitados *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Se debe corregir el precio final y aumentar el volumen de la voz en off."
                  value={changesReason}
                  onChange={(e) => setChangesReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Puntos específicos a corregir (Checklist para el editor)
                  </label>
                  <button
                    type="button"
                    onClick={() => setChecklistItems([...checklistItems, ''])}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar punto
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Ej: En el segundo 0:08 corregir el texto legal."
                        value={item}
                        onChange={(e) => {
                          const updated = [...checklistItems];
                          updated[idx] = e.target.value;
                          setChecklistItems(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                      />
                      {checklistItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setChecklistItems(checklistItems.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowChangesModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingChanges}
                  className="px-5 py-2.5 text-xs font-black bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingChanges ? 'Enviando...' : 'Enviar Correcciones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
