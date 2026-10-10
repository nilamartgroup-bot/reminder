import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' | 'compact' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = useLanguage();

  if (isInstalled) {
    return null;
  }

  const renderContent = () => {
    if (isInstallable) {
      if (variant === 'hero') {
        return (
          <button
            onClick={install}
            className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>{t('install_button')}</span>
          </button>
        );
      }
      return (
        <button
          onClick={install}
          className="flex items-center gap-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md active:scale-95 transition cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>{t('install_button')}</span>
        </button>
      );
    }

    if (isIOS) {
      if (variant === 'hero') {
        return (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center justify-center gap-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 px-5 py-3 text-sm font-semibold text-slate-100 shadow-lg active:scale-[0.98] transition cursor-pointer"
          >
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span>{t('install_ios')}</span>
          </button>
        );
      }
      return (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-850 hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 shadow-sm active:scale-95 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('install_ios')}</span>
        </button>
      );
    }

    return null;
  };

  return (
    <>
      {renderContent()}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 end-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t('install_ios')}</h3>
                <p className="text-xs text-slate-400">iOS Safari & iPadOS</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 text-xs leading-relaxed text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                  ۱
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>در نوار پایین مرورگر سافاری دکمه</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-white font-medium">
                    <Share2 className="w-3 h-3 text-indigo-400" /> Share
                  </span>
                  <span>را لمس کنید.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                  ۲
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>کمی به پایین اسکرول کرده و گزینه</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-white font-medium">
                    <PlusSquare className="w-3 h-3 text-emerald-400" /> Add to Home Screen
                  </span>
                  <span>را انتخاب نمایید.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
