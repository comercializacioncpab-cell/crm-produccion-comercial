export const SPONSORSHIP_OPTIONS = [
  { id: 'ESPACIO_PUBLICITARIO', label: 'ESPACIO PUBLICITARIO' },
  { id: 'BILLBOARD_ESTRATEGICO', label: 'BILLBOARD ESTRATEGICO' },
  { id: 'SOBREIMPOSICION_CREATIVA', label: 'SOBREIMPOSICION CREATIVA' },
  { id: 'ANTIZAPING', label: 'ANTIZAPING IA NOVELA 15H30 GYE SORPRESA DEL DESTINO' },
  { id: 'CAPSULA_ESTRATEGICA', label: 'Cápsula Estratégica 30"' },
  { id: 'AVANCE', label: 'Avance' },
  { id: 'RESUMEN_NOVELA', label: 'Resumen de Novela 22h00' },
];

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  NUEVA: {
    label: 'Nueva Solicitud',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
  },
  ASIGNADA: {
    label: 'Asignada a Post',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  EN_PROCESO: {
    label: 'En Post-Producción',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
  },
  RESUELTA: {
    label: 'Resuelta / Entregada',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
  CON_CAMBIOS: {
    label: 'Con Cambios',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
  },
  APROBADA: {
    label: 'Aprobada',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
  },
  AL_AIRE: {
    label: 'Al Aire',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
  },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  BAJA: { label: 'Baja', color: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' },
  MEDIA: { label: 'Media', color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  ALTA: { label: 'Alta', color: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  URGENTE: { label: 'Urgente', color: 'text-red-600', badge: 'bg-red-100 text-red-700 font-semibold' },
};

export function formatInitials(name: string): string {
  if (!name) return 'SP';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
