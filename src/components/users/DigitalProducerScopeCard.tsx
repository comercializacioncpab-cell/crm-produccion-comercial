'use client';

import React, { useState } from 'react';
import { DIGITAL_PRODUCER_FUNCTIONS } from '@/lib/order-utils';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Video, 
  Tv, 
  Smartphone, 
  ShieldCheck 
} from 'lucide-react';

interface DigitalProducerScopeCardProps {
  userName?: string;
  role?: string;
  isSelf?: boolean;
}

export default function DigitalProducerScopeCard({
  userName,
  role,
  isSelf = false,
}: DigitalProducerScopeCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl space-y-5 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Funciones Oficiales del Cargo: Post-Productor / Productor Digital
              </h3>
              <span className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Alcance Registrado en CRM
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isSelf 
                ? 'Alcance oficial de tus responsabilidades comerciales digitales y de televisión en Ecuavisa.'
                : `Alcance oficial de responsabilidades para ${userName || 'este usuario'} en producciones comerciales.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
        >
          {expanded ? (
            <>
              <span>Minimizar</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Ver las 6 Funciones</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Scope Highlights Badges */}
      <div className="flex items-center gap-2 flex-wrap text-xs relative z-10">
        <span className="bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" /> Producción Digital Comercial
        </span>
        <span className="bg-blue-500/15 border border-blue-400/30 text-blue-300 font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5" /> Post-Producción Comercial TV
        </span>
        <span className="bg-purple-500/15 border border-purple-400/30 text-purple-300 font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" /> Contenidos Transmedia & Canal
        </span>
      </div>

      {/* 6 Official Functions Grid */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 relative z-10">
          {DIGITAL_PRODUCER_FUNCTIONS.map((fn) => (
            <div
              key={fn.id}
              className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0 p-1.5 rounded-xl bg-white/10">{fn.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                      Función {fn.number}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {fn.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {fn.description}
                  </p>
                </div>
              </div>

              {/* Sub-items */}
              {fn.subItems.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  {fn.subItems.map((sub) => (
                    <div key={sub.id} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
