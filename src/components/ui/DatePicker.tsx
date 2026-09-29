'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Check
} from 'lucide-react';

interface DatePickerProps {
  label: string;
  value: string; // "DD/MM/YYYY" or "YYYY-MM-DD"
  onChange: (formattedDate: string) => void;
  required?: boolean;
  isUrgent?: boolean;
  placeholder?: string;
  helperText?: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function DatePicker({
  label,
  value,
  onChange,
  required = false,
  isUrgent = false,
  placeholder = 'Seleccionar fecha en el calendario...',
  helperText,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to today
  const parseDate = (d: string) => {
    if (!d) return new Date();
    if (d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (d.includes('-')) {
      const parts = d.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date();
  };

  const initialDate = parseDate(value);
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const formatted = `${dayStr}/${monthStr}/${currentYear}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const setQuickDate = (offsetDays: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dayStr = String(target.getDate()).padStart(2, '0');
    const monthStr = String(target.getMonth() + 1).padStart(2, '0');
    const formatted = `${dayStr}/${monthStr}/${target.getFullYear()}`;
    setCurrentMonth(target.getMonth());
    setCurrentYear(target.getFullYear());
    onChange(formatted);
    setIsOpen(false);
  };

  // Generate calendar days grid
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div className="relative" ref={containerRef}>
      <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${isUrgent ? 'text-red-900' : 'text-slate-800'}`}>
        <CalendarIcon className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-cyan-600'}`} />
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      {/* Clickable Input Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-sm ${
          isUrgent
            ? 'bg-red-50/50 border-red-300 hover:border-red-500'
            : 'bg-white border-slate-300 hover:border-cyan-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className={`w-4 h-4 ${value ? (isUrgent ? 'text-red-600' : 'text-cyan-600') : 'text-slate-400'}`} />
          <span className={`text-xs font-black ${value ? (isUrgent ? 'text-red-900 font-mono text-sm' : 'text-slate-900 font-mono text-sm') : 'text-slate-400 font-medium'}`}>
            {value || placeholder}
          </span>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
          {isOpen ? 'Cerrar' : 'Elegir'}
        </span>
      </div>

      {helperText && (
        <span className={`text-[10px] mt-1 block font-medium ${isUrgent ? 'text-red-700' : 'text-slate-400'}`}>
          {helperText}
        </span>
      )}

      {/* INTERACTIVE CALENDAR DROPDOWN MODAL */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-72 sm:w-80 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-extrabold text-xs text-slate-900 capitalize">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 mb-3">
            <button
              type="button"
              onClick={(e) => setQuickDate(0, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-cyan-100 hover:text-cyan-800 transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={(e) => setQuickDate(1, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-cyan-100 hover:text-cyan-800 transition-colors"
            >
              Mañana
            </button>
            <button
              type="button"
              onClick={(e) => setQuickDate(3, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-cyan-100 hover:text-cyan-800 transition-colors"
            >
              +3 Días
            </button>
            <button
              type="button"
              onClick={(e) => setQuickDate(7, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-cyan-100 hover:text-cyan-800 transition-colors"
            >
              +1 Semana
            </button>
          </div>

          {/* Day Names Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase mb-1">
            {DAY_NAMES.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days Numbers Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty placeholders before 1st day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayStr = String(dayNum).padStart(2, '0');
              const monthStr = String(currentMonth + 1).padStart(2, '0');
              const thisDateStr = `${dayStr}/${monthStr}/${currentYear}`;
              const isSelected = value === thisDateStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={(e) => handleSelectDay(dayNum, e)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md font-black scale-105'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-cyan-700'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
