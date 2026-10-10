import React, { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { PWAInstallButton } from './PWAInstallButton';
import { Bell, LogOut, CheckCircle2 } from 'lucide-react';
import { useReminders } from '../context/ReminderContext';

interface NavbarProps {
  onNavigateHome?: () => void;
  onNavigateReminders?: () => void;
  activePage: 'index' | 'indexremider' | 'admin';
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateReminders,
  activePage,
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { reminders } = useReminders();

  const handleLogoClick = () => {
    onNavigateHome?.();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Brand identity with 3-click admin entrance */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 text-start group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-400 group-hover:text-amber-400 transition" />
            </div>
          </div>
          <div className="hidden xs:block sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {t('app_name')}
              </span>
              <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-2.5 h-2.5" /> {t('offline')}
              </span>
            </div>
          </div>
        </button>

        {/* Right side controls: Language, PWA install, and Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language selector */}
          <LanguageSelector compact />

          {/* In-App PWA Install */}
          <PWAInstallButton variant="header" />

          {/* Logout button */}
          <div className="flex items-center ps-1 border-s border-slate-800">
            <button
              onClick={logout}
              title={t('logout')}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
