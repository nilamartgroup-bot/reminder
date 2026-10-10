import React, { useState } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { Shield, KeyRound, User, Lock, AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGatewayModal: React.FC<AdminGatewayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const isFa = language === 'fa';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleQuickMasterLogin = () => {
    adminService.createSession('admin');
    adminService.addAuditLog('ورود مستقیم مدیر ارشد', 'info', 'ورود با کلیک مستقیم مدیر سیستم');
    onSuccess();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password.trim()) {
      setErrorMsg(isFa ? 'لطفاً رمز عبور یا پین اضطراری را وارد نمایید.' : 'Please enter password or emergency PIN.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const ok = adminService.verifyLogin(username || 'admin', password);
      setIsSubmitting(false);

      if (ok) {
        onSuccess();
      } else {
        setErrorMsg(
          isFa
            ? 'رمز عبور یا پین اشتباه است! می‌توانید از دکمه «ورود مستقیم» یا پین 8844 استفاده کنید.'
            : 'Invalid credentials! You can use "Instant Login" or PIN 8844.'
        );
      }
    }, 150);
  };

  const handleUseDefault = () => {
    setUsername('admin');
    setPassword('SuperMaster@2026');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 select-none animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 flex flex-col space-y-4">
        {/* Stealth Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {isFa ? 'دروازه امنیتی مدیریت سیستم' : 'Super Admin Stealth Gateway'}
              </h2>
              <span className="text-[10px] text-slate-400">
                {isFa ? 'دسترسی حفاظت‌شده مدیر ارشد' : 'Master Level Access'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isFa ? 'بستن' : 'Close'}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        {/* Instant Master Login Button for the owner */}
        <button
          type="button"
          onClick={handleQuickMasterLogin}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
        >
          <Shield className="w-4 h-4 text-emerald-200" />
          <span>{isFa ? '⚡ ورود مستقیم و آنی به پنل مدیریت (یک کلیک)' : '⚡ Instant Master Access (1-Click)'}</span>
        </button>

        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest absolute">
            {isFa ? 'یا ورود با رمز/پین' : 'OR VIA PASSWORD'}
          </span>
        </div>

        {/* Informational Alert Box with Default Credential Notice */}
        <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-indigo-300">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              {isFa ? 'کلید ورود پیش‌فرض مدیر' : 'Default Admin Credentials'}
            </span>
            <button
              type="button"
              onClick={handleUseDefault}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-200 transition cursor-pointer"
            >
              {isFa ? 'درج خودکار' : 'Auto Fill'}
            </button>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
            {isFa ? (
              <>
                کاربر: <b className="text-indigo-300">admin</b> | رمز: <b className="text-indigo-300">SuperMaster@2026</b>
                <br />
                (یا پین‌کد اضطراری: <b className="text-amber-300">8844</b>)
              </>
            ) : (
              <>
                User: <b className="text-indigo-300">admin</b> | Pass: <b className="text-indigo-300">SuperMaster@2026</b>
                <br />
                (Emergency PIN: <b className="text-amber-300">8844</b>)
              </>
            )}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">
              {isFa ? 'نام کاربری مدیر ارشد' : 'Master Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 ps-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
              />
              <User className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">
              {isFa ? 'رمز عبور یا پین اضطراری' : 'Master Password or PIN'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 ps-9 pe-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isFa ? 'ورود به پنل' : 'Authenticate'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold active:scale-95 transition cursor-pointer"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
          </div>
        </form>

        <div className="text-center pt-1 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-500">
            {isFa
              ? 'این بخش کاملاً محرمانه بوده و از دید کاربران عادی پنهان است.'
              : 'Stealth gateway strictly isolated from end-users.'}
          </p>
        </div>
      </div>
    </div>
  );
};
