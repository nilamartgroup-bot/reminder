import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../utils/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, currentOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-start" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm cursor-pointer ${
          compact ? 'px-2 py-1' : ''
        }`}
        aria-label="Change language"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-base leading-none">{currentOption.flag}</span>
        <span className="font-medium">{currentOption.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ms-0.5" />
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-48 rounded-2xl bg-slate-900/95 border border-slate-700/80 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fade-in">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
            انتخاب زبان / Language
          </div>
          <div className="space-y-0.5 mt-1 max-h-60 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((opt) => {
              const isSelected = opt.code === language;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSelect(opt.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{opt.flag}</span>
                    <span>{opt.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({opt.label})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
