import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl border border-amber-400/40 animate-fade-in">
      <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
      <span>{t('offline_badge')}</span>
      <ShieldCheck className="w-3.5 h-3.5 ms-1 text-slate-900" />
    </div>
  );
};
