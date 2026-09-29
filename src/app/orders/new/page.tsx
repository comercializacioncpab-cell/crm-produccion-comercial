'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
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
  DollarSign
} from 'lucide-react';
import { SPONSORSHIP_OPTIONS } from '@/lib/order-utils';

export default function NewOrderPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    clientAgency: '',
    product: '',
    program: '',
    materialDeliveryDate: '',
    airDate: '',
    materialNotes: '',
    hasBrief: true,
    sponsorshipTypes: [] as string[],
    customSponsorship: '',
    voiceoverType: 'GENERICA',
    voiceoverText: '',
    priority: 'MEDIA',
    packageValue: '',
  });

  const [files, setFiles] = useState<{ name: string; size: number; fileObj?: File }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientAgency || !formData.product) {
      setError('Por favor completa el Cliente/Agencia y el Producto.');
      return;
    }
    if (!formData.airDate) {
      setError('Por favor selecciona la Fecha al Aire en el calendario.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
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

      router.push(`/orders/${createdOrderId}`);
    } catch (err: any) {
      setError(err.message || 'Error inesperado al crear la SP');
      setLoading(false);
    }
  };

  const userInitials = user?.initials || 'SP';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Header replicating the Excel Title */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 text-slate-950 font-black text-xl px-3 py-1.5 rounded-xl shadow">
              EV
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">
                Producción Comercial
              </span>
              <h1 className="text-xl sm:text-2xl font-black">
                Nueva Solicitud de Producción (SP)
              </h1>
            </div>
          </div>

          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] text-slate-300 block font-semibold">Formato de Nomenclatura:</span>
            <span className="font-mono font-black text-amber-400 text-sm">
              SP-{userInitials}-001...
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#fef08a] px-6 py-3 border-b border-yellow-300 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-yellow-950">
                1. INFORMACIÓN GENERAL
              </h2>
              <span className="text-[11px] font-bold text-yellow-900">
                Ejecutiva de Ventas: {user?.name}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Valor del Paquete ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.packageValue}
                    onChange={(e) => setFormData({ ...formData, packageValue: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Valor comercial total contratado para este paquete.</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: MATERIAL Y FECHAS CRÍTICAS CON CALENDARIO INTERACTIVO */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#fef08a] px-6 py-3 border-b border-yellow-300 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-yellow-950 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-yellow-900" /> 2. MATERIAL Y FECHAS
              </h2>
              <span className="text-[10px] text-yellow-900 font-bold">Haz clic en el recuadro para abrir el calendario</span>
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
                />

                {/* DATEPICKER 2: FECHA AL AIRE (OBLIGATORIA) */}
                <DatePicker
                  label="Fecha al Aire (Emisión Comercial)"
                  value={formData.airDate}
                  onChange={(d) => setFormData({ ...formData, airDate: d })}
                  required
                  isUrgent
                  placeholder="Elegir fecha de salida al aire..."
                  helperText="Día programado para salir al aire en pantalla."
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

          {/* SECCIÓN 3: TIPO DE AUSPICIO */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-ev-rowHeader px-6 py-3 border-b border-indigo-200 text-white flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider">
                3. TIPO DE AUSPICIO
              </h2>
              <span className="text-[10px] text-white/80 font-medium">Selecciona las opciones que apliquen</span>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPONSORSHIP_OPTIONS.map((opt) => {
                  const isChecked = formData.sponsorshipTypes.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSponsorshipToggle(opt.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Otro Tipo de Auspicio (Opcional)
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-ev-rowHeader px-6 py-3 border-b border-indigo-200 text-white flex items-center justify-between">
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

          {/* SECCIÓN 5: SUBIDA DE ARCHIVOS / BRIEFS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
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

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-black px-6 py-3 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creando SP y Notificando a Coordinación...' : 'Crear y Notificar a Coordinadora'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
