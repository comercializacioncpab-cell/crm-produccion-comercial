export interface SponsorshipOption {
  id: string;
  label: string;
  category: 'GRAFICOS' | 'ESTRATEGICOS' | 'COBERTURAS' | 'OTROS';
  isStrategic?: boolean;
  allowsDualAssignment?: boolean;
}

export const PNT_GRAFICOS_OPTIONS: SponsorshipOption[] = [
  { id: 'EP', label: 'EP', category: 'GRAFICOS' },
  { id: 'BUMPER_GRAFICO', label: 'Bumper gráfico', category: 'GRAFICOS' },
  { id: 'ANTIZAPPING_GRAFICO', label: 'Antizapping gráfico', category: 'GRAFICOS' },
  { id: 'CAPSULA_GRAFICA', label: 'Cápsula gráfica', category: 'GRAFICOS' },
  { id: 'CAPSULA_CONCEPTUAL', label: 'Cápsula conceptual', category: 'GRAFICOS' },
  { id: 'ATRAPA_LA_MARCA', label: 'Atrapa la Marca', category: 'GRAFICOS' },
  { id: 'SOBRE_EN_BARRA', label: 'Sobre en barra', category: 'GRAFICOS' },
  { id: 'SOBRE_CREATIVA', label: 'Sobre creativa', category: 'GRAFICOS' },
  { id: 'SOBRE_ESPECIAL', label: 'Sobre especial', category: 'GRAFICOS' },
  { id: 'LOGO_MOSCA', label: 'Logo Mosca', category: 'GRAFICOS' },
  { id: 'CLAQUETA_PRES_DESP', label: 'Claqueta de Presentación/Despedida', category: 'GRAFICOS' },
  { id: 'CAPSULA_PENSAMIENTO', label: 'Cápsula de Pensamiento', category: 'GRAFICOS' },
  { id: 'BLOQUE_DISRUPTIVO', label: 'Bloque Disruptivo', category: 'GRAFICOS' },
  { id: 'TRADUCTOR', label: 'Traductor', category: 'GRAFICOS' },
  { id: 'EP_3D', label: 'EP 3D', category: 'GRAFICOS' },
  { id: 'CENTRO_VIRTUAL_3D', label: 'Centro virtual de cancha 3D', category: 'GRAFICOS' },
  { id: 'ANTIZAPPING_GRAFICO_3D', label: 'Antizapping gráfico 3D', category: 'GRAFICOS' },
  { id: 'BUMPER_GRAFICO_3D', label: 'Bumper gráfico 3D', category: 'GRAFICOS' },
  { id: 'SOBRE_BARRA_3D', label: 'Sobre barra 3D', category: 'GRAFICOS' },
];

export const PNT_ESTRATEGICOS_OPTIONS: SponsorshipOption[] = [
  { id: 'EP_ESTRATEGICO', label: 'EP estratégico', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'MENCION_ESTRATEGICA', label: 'Mención estratégica', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'BUMPER_ESTRATEGICO', label: 'Bumper estratégico', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'CAPSULA_ESTRATEGICA', label: 'Cápsula estratégica', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'SOBRE_ACTIVA_ESTRATEGICA', label: 'Sobre activa estratégica', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'MENCION_ESTRATEGICA_3D', label: 'Mención estratégica 3D', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'BILLBOARD_ESTRATEGICO_3D', label: 'Billboard estratégico 3D', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'VIDEOWALL_3D', label: 'Videowall 3D', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
];

export const COBERTURAS_OPTIONS: SponsorshipOption[] = [
  { id: 'COBERTURA', label: 'Cobertura', category: 'COBERTURAS', isStrategic: true, allowsDualAssignment: true },
  { id: 'COBERTURA_ESPECIAL', label: 'Cobertura Especial', category: 'COBERTURAS', isStrategic: true, allowsDualAssignment: true },
  { id: 'COBERTURA_DIGITAL', label: 'Cobertura Digital', category: 'COBERTURAS', isStrategic: true, allowsDualAssignment: true },
  { id: 'COBERTURA_EVENTO', label: 'Cobertura de Evento / BTL', category: 'COBERTURAS', isStrategic: true, allowsDualAssignment: true },
];

export const SPONSORSHIP_CATEGORIES = [
  {
    id: 'GRAFICOS',
    title: 'PNT’s GRÁFICOS',
    category: 'PNT’s GRÁFICOS',
    description: 'Formatos gráficos estándares y animaciones de marca',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    options: PNT_GRAFICOS_OPTIONS,
  },
  {
    id: 'ESTRATEGICOS',
    title: 'PNT’s ESTRATÉGICOS',
    category: 'PNT’s ESTRATÉGICOS',
    description: 'Formatos de alto impacto (Permite asignar hasta 2 Editores)',
    badge: 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold',
    options: PNT_ESTRATEGICOS_OPTIONS,
  },
  {
    id: 'COBERTURAS',
    title: 'COBERTURAS',
    category: 'COBERTURAS',
    description: 'Coberturas especiales y eventos (Permite asignar hasta 2 personas / editores)',
    badge: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    options: COBERTURAS_OPTIONS,
  },
];

// Backwards-compatible consolidated list
export const SPONSORSHIP_OPTIONS: SponsorshipOption[] = [
  ...PNT_GRAFICOS_OPTIONS,
  ...PNT_ESTRATEGICOS_OPTIONS,
  ...COBERTURAS_OPTIONS,
  // Legacy aliases
  { id: 'ESPACIO_PUBLICITARIO', label: 'ESPACIO PUBLICITARIO', category: 'OTROS' },
  { id: 'BILLBOARD_ESTRATEGICO', label: 'BILLBOARD ESTRATÉGICO', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'SOBREIMPOSICION_CREATIVA', label: 'SOBREIMPOSICIÓN CREATIVA', category: 'GRAFICOS' },
  { id: 'ANTIZAPING', label: 'ANTIZAPING IA NOVELA 15H30 GYE SORPRESA DEL DESTINO', category: 'GRAFICOS' },
  { id: 'AVANCE', label: 'Avance', category: 'GRAFICOS' },
  { id: 'RESUMEN_NOVELA', label: 'Resumen de Novela 22h00', category: 'GRAFICOS' },
  { id: 'PNT_PRODUCT_PLACEMENT', label: 'PNT / Product Placement', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'PNT_MENCION_VIVO', label: 'PNT / Mención en Vivo', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'PNT_PANTALLA_DIVIDIDA', label: 'PNT / Pantalla Dividida', category: 'GRAFICOS' },
  { id: 'PNT_INTEGRACION', label: 'PNT / Integración de Contenido', category: 'ESTRATEGICOS', isStrategic: true, allowsDualAssignment: true },
  { id: 'CINTILLO_ANIMADO', label: 'Cintillo Animado / Lower Third', category: 'GRAFICOS' },
];

export function isStrategicPntId(id: string): boolean {
  const opt = SPONSORSHIP_OPTIONS.find((s) => s.id === id);
  return Boolean(
    opt?.isStrategic || 
    opt?.allowsDualAssignment || 
    opt?.category === 'ESTRATEGICOS' || 
    opt?.category === 'COBERTURAS' || 
    id.includes('ESTRATEGIC') || 
    id.includes('VIDEOWALL') || 
    id.includes('COBERTURA')
  );
}

export function isCoberturaId(id: string): boolean {
  const opt = SPONSORSHIP_OPTIONS.find((s) => s.id === id);
  return Boolean(opt?.category === 'COBERTURAS' || id.includes('COBERTURA'));
}

export function hasCobertura(sponsorshipTypes: string[] | string): boolean {
  try {
    const list: string[] = Array.isArray(sponsorshipTypes)
      ? sponsorshipTypes
      : JSON.parse(sponsorshipTypes || '[]');
    return list.some((id) => isCoberturaId(id));
  } catch {
    return false;
  }
}

export function hasStrategicPnt(sponsorshipTypes: string[] | string): boolean {
  try {
    const list: string[] = Array.isArray(sponsorshipTypes)
      ? sponsorshipTypes
      : JSON.parse(sponsorshipTypes || '[]');
    return list.some((id) => isStrategicPntId(id));
  } catch {
    return false;
  }
}

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
  BORRADOR: {
    label: 'Borrador (Sin Enviar)',
    color: 'text-amber-800',
    bg: 'bg-amber-100/90',
    border: 'border-amber-400',
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

export function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const WORKFLOW_STAGES = [
  { id: 'NUEVA', step: 1, label: 'Solicitud Recibida', desc: 'Creada por Ventas', percent: 20 },
  { id: 'ASIGNADA', step: 2, label: 'Asignada a Post', desc: 'Coordinación asignó editor', percent: 40 },
  { id: 'EN_PROCESO', step: 3, label: 'En Producción', desc: 'Post-Productor en edición', percent: 60 },
  { id: 'RESUELTA', step: 4, label: 'Material Entregado', desc: 'Master listo para revisión', percent: 80 },
  { id: 'APROBADA', step: 5, label: 'Aprobada al Aire', desc: 'Autorizada para emisión', percent: 100 },
];

export function getWorkflowStageIndex(status: string): number {
  switch (status) {
    case 'NUEVA':
      return 0;
    case 'ASIGNADA':
      return 1;
    case 'EN_PROCESO':
    case 'CON_CAMBIOS':
      return 2;
    case 'RESUELTA':
    case 'ENTREGADO':
      return 3;
    case 'APROBADA':
    case 'AL_AIRE':
      return 4;
    default:
      return 0;
  }
}

export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'PRODUCTOR_SENIOR';
}

export function isCoordinatorOrAdminRole(role?: string | null): boolean {
  return role === 'COORDINADOR' || role === 'COORDINADOR_PRODUCTOR' || role === 'ADMIN' || role === 'PRODUCTOR_SENIOR';
}

export function isPostProducerRole(role?: string | null): boolean {
  return role === 'POST_PRODUCTOR' || role === 'PRODUCTOR_SENIOR' || role === 'COORDINADOR_PRODUCTOR' || role === 'CREATIVO_DIGITAL';
}

// 🚦 Workamajig Suite: Semáforo de Capacidad del Post-Productor
export function getWorkloadStatus(activeCount: number) {
  if (activeCount <= 1) {
    return {
      level: 'DISPONIBLE',
      label: 'Disponible',
      dot: '🟢',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      pillClass: 'bg-emerald-500',
    };
  }
  if (activeCount <= 3) {
    return {
      level: 'MEDIA',
      label: 'Carga Media',
      dot: '🟡',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
      pillClass: 'bg-amber-500',
    };
  }
  return {
    level: 'SOBRECARGADO',
    label: 'Sobrecargado',
    dot: '🔴',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
    pillClass: 'bg-rose-500 animate-pulse',
  };
}

// ⚡ Workamajig Suite: Plantillas Rápidas de Producción Comercial
export interface SpTemplate {
  id: string;
  title: string;
  categoryLabel: string;
  description: string;
  icon: string;
  sponsorshipTypes: string[];
  voiceoverType: 'GENERICA' | 'ESPECIFICA';
  voiceoverDefaultText?: string;
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  hasBrief: boolean;
  notesSuggestion: string;
}

export const SP_TEMPLATES: SpTemplate[] = [
  {
    id: 'BILLBOARD_10',
    title: 'Billboard Estratégico 10"',
    categoryLabel: 'Auspicio de Entrada/Salida',
    description: 'Apertura de bloque o programa con logo 3D y locución genérica institucional.',
    icon: '🚀',
    sponsorshipTypes: ['BILLBOARD_ESTRATEGICO_3D', 'BUMPER_ESTRATEGICO'],
    voiceoverType: 'GENERICA',
    priority: 'MEDIA',
    hasBrief: true,
    notesSuggestion: 'Billboard de 10 segundos. Incluir claqueta de entrada, logo en 3D y remate de audio oficial.',
  },
  {
    id: 'CAPSULA_30',
    title: 'Cápsula Estratégica 30"',
    categoryLabel: 'Contenido / Infomercial',
    description: 'Cápsula comercial con locución específica, guion comercial y mayor despliegue de edición.',
    icon: '🎬',
    sponsorshipTypes: ['CAPSULA_ESTRATEGICA'],
    voiceoverType: 'ESPECIFICA',
    voiceoverDefaultText: 'Texto del guion a grabar con locutor asignado...',
    priority: 'ALTA',
    hasBrief: true,
    notesSuggestion: 'Cápsula de 30 segundos. Requiere edición dinámica, musicalización autorizada y mezcla a -24 LUFS.',
  },
  {
    id: 'SOBREIMPOSICION',
    title: 'Sobreimposición Creativa',
    categoryLabel: 'Gráficos en Pantalla',
    description: 'Gráfico animado / lower-third durante emisión de novela o programa en vivo.',
    icon: '🎨',
    sponsorshipTypes: ['SOBRE_CREATIVA', 'LOGO_MOSCA'],
    voiceoverType: 'GENERICA',
    priority: 'MEDIA',
    hasBrief: true,
    notesSuggestion: 'Animación en canal alfa (transparente) ajustada al tercio inferior de pantalla.',
  },
  {
    id: 'COBERTURA_BTL',
    title: 'Cobertura Especial / Evento BTL',
    categoryLabel: 'Producción en Exteriores',
    description: 'Grabación o edición de activación de marca en exteriores o eventos.',
    icon: '📹',
    sponsorshipTypes: ['COBERTURA', 'COBERTURA_DIGITAL'],
    voiceoverType: 'GENERICA',
    priority: 'ALTA',
    hasBrief: true,
    notesSuggestion: 'Cobertura presencial con cámara y edición de reel resumen para emisión y redes.',
  },
  {
    id: 'MENCION_VIVO',
    title: 'Mención en Vivo de Programa',
    categoryLabel: 'PNT con Presentador',
    description: 'PNT con producto en mesa o interacción directa del talento en vivo.',
    icon: '🎙️',
    sponsorshipTypes: ['MENCION_ESTRATEGICA'],
    voiceoverType: 'ESPECIFICA',
    voiceoverDefaultText: 'Guion que leerá el presentador durante el programa en vivo...',
    priority: 'ALTA',
    hasBrief: true,
    notesSuggestion: 'Mención en vivo de 20s. Coordinar producto físico en estudio con utilería.',
  },
];

// ==========================================
// 📱 CONSTANTES PARA MÓDULO DIGITAL (EV DIGITAL + COMERCIAL)
// Basado en el Formulario Editorial Oficial Ecuavisa Digital
// ==========================================

export interface DigitalNetworkOption {
  id: string;
  name: string;
  shortLabel: string;
  short?: string;
  badge: string;
  icon?: string;
}

export const DIGITAL_NETWORKS: DigitalNetworkOption[] = [
  { id: 'IG', name: 'Instagram', shortLabel: 'IG', short: 'IG', badge: 'bg-pink-100 text-pink-700 border-pink-200', icon: '📸' },
  { id: 'FB', name: 'Facebook', shortLabel: 'FB', short: 'FB', badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: '👤' },
  { id: 'TikTok', name: 'TikTok', shortLabel: 'TikTok', short: 'TikTok', badge: 'bg-neutral-900 text-white border-neutral-700', icon: '🎵' },
  { id: 'X', name: 'X (Twitter)', shortLabel: 'X', short: 'X', badge: 'bg-slate-800 text-white border-slate-700', icon: '🐦' },
  { id: 'Youtube', name: 'YouTube', shortLabel: 'YouTube', short: 'YouTube', badge: 'bg-red-100 text-red-700 border-red-200', icon: '▶️' },
  { id: 'Ecuavisa.com', name: 'Ecuavisa.com', shortLabel: 'Ecuavisa.com', short: 'Ecuavisa.com', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: '🌐' },
  { id: 'Ecuavisa PLAY', name: 'Ecuavisa PLAY', shortLabel: 'EV Play', short: 'EV Play', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: '📺' },
  { id: 'Otros', name: 'Otros (LinkedIn / WhatsApp)', shortLabel: 'Otros', short: 'Otros', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '💬' },
];

export const DIGITAL_FORMATS: string[] = [
  'Nota de contenido',
  'Nota de contenido y video',
  'Reel con Reportero Digital',
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

export const DIGITAL_KPIS = [
  'AWARENESS',
  'ALCANCE (REACH)',
  'ENGAGEMENT / INTERACCIÓN',
  'REPRODUCCIONES DE VIDEO (VIEWS)',
  'TRÁFICO AL SITIO WEB (CLICKS)',
  'LEADS / CONVERSIÓN',
  'BRANDING & REPUTACIÓN',
];

export const DIGITAL_RESOURCES_LIST = [
  { id: 'brief', label: 'Brief' },
  { id: 'guion', label: 'Guión' },
  { id: 'logo', label: 'Logo Vectorial / PNG' },
  { id: 'imagenes', label: 'Imágenes / Fotos en Alta' },
  { id: 'video', label: 'Video / Tomas de Insumo' },
  { id: 'hashtagsAndCopys', label: 'Hashtags oficiales y Copys' },
  { id: 'piezasGraficas', label: 'Piezas gráficas de apoyo' },
  { id: 'otros', label: 'Otros recursos' },
];

// ==========================================
// 🎬 FUNCIONES OFICIALES DEL CARGO: POST-PRODUCTOR / PRODUCTOR DIGITAL
// Alcance de responsabilidades para producciones comerciales digitales Ecuavisa
// ==========================================

export interface DigitalProducerSubItem {
  id: string;
  label: string;
}

export interface DigitalProducerFunctionItem {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  badge: string;
  icon: string;
  description: string;
  subItems: DigitalProducerSubItem[];
}

export const DIGITAL_PRODUCER_FUNCTIONS: DigitalProducerFunctionItem[] = [
  {
    id: 'PLANIFICACION',
    number: 1,
    title: 'Planificación de producciones digitales comerciales',
    shortTitle: 'Planificación Digital',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📅',
    description: 'Planificación integral de cada producción digital comercial.',
    subItems: [
      { id: 'planificacion_integral', label: 'Planificación integral de cada producción digital comercial' },
    ],
  },
  {
    id: 'REVISION_MATERIALES',
    number: 2,
    title: 'Revisión de materiales',
    shortTitle: 'Revisión de Materiales',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '🔍',
    description: 'Revisión y control de calidad de materiales como banners e insumos.',
    subItems: [
      { id: 'control_calidad_banners', label: 'Revisión y control de calidad de materiales como banners' },
    ],
  },
  {
    id: 'CARRUSELES',
    number: 3,
    title: 'Carruseles',
    shortTitle: 'Carruseles',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📑',
    description: 'Conceptualización, diseño y armado de carruseles de contenido.',
    subItems: [
      { id: 'carruseles_creativos', label: 'Creativos' },
      { id: 'carruseles_editoriales', label: 'Editoriales' },
      { id: 'carruseles_de_marca', label: 'De marca' },
      { id: 'carruseles_infograficos', label: 'Infográficos' },
    ],
  },
  {
    id: 'REELS_MARCA',
    number: 4,
    title: 'Reels de marca (con y sin talento)',
    shortTitle: 'Reels de Marca',
    badge: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '🎬',
    description: 'Flujo completo de producción de reels de marca con y sin talento en cámara.',
    subItems: [
      { id: 'reels_preproduccion', label: 'Preproducción' },
      { id: 'reels_produccion', label: 'Producción' },
      { id: 'reels_posproduccion', label: 'Posproducción (en algunos casos)' },
    ],
  },
  {
    id: 'DERECHOS_TRANSMEDIA',
    number: 5,
    title: 'Derechos digitales y proyectos transmedia',
    shortTitle: 'Derechos & Transmedia',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '🌐',
    description: 'Gestión de derechos digitales de marca y desarrollo de formatos transmedia.',
    subItems: [
      { id: 'derechos_digitales', label: 'Gestión de derechos digitales asociados a productos de las marcas' },
      { id: 'proyectos_transmedia', label: 'Adaptación de historias y contenidos para cada marca en proyectos transmedia, como Misión Emprende' },
    ],
  },
  {
    id: 'CONTENIDO_CANAL',
    number: 6,
    title: 'Contenido para el canal',
    shortTitle: 'Contenido Canal',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '📺',
    description: 'Escritura de guiones y grabación de contenido oficial para las plataformas del canal.',
    subItems: [
      { id: 'escritura_guiones', label: 'Escritura de guiones' },
      { id: 'grabacion_contenido', label: 'Grabación de contenido para uso del canal' },
    ],
  },
];


