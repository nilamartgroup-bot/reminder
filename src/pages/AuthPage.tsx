import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { adminService } from '../utils/adminService';
import {
  Bell,
  Lock,
  User as UserIcon,
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Check,
  X,
  LogIn,
} from 'lucide-react';

interface AuthPageProps {
  onAdminLogin?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAdminLogin }) => {
  const { login, register } = useAuth();
  const { t, language } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFullName('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancelRegister = () => {
    resetForm();
    setMode('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.trim();

    if (mode === 'login') {
      if (!cleanPhone || !password) {
        setErrorMsg(t('field_required'));
        return;
      }

      // Stealth Master Admin Authentication: username & password entered in standard login inputs
      if (adminService.verifyLogin(cleanPhone, password)) {
        onAdminLogin?.();
        return;
      }

      setLoading(true);
      const res = await login(cleanPhone, password, rememberMe);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(t(res.messageKey || 'invalid_credentials'));
      }
    } else {
      if (!fullName.trim() || !cleanPhone || !password || !confirmPassword) {
        setErrorMsg(t('field_required'));
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t('password_mismatch'));
        return;
      }
      setLoading(true);
      const res = await register(fullName.trim(), cleanPhone, password, language);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(t(res.messageKey || 'field_required'));
      } else {
        setSuccessMsg(t('register_success'));
      }
    }
  };

  return (
    <div className="h-screen h-dvh max-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between p-2 sm:p-4 text-slate-100 select-none">
      {/* Top Header Bar: App Brand & Language Selector & PWA Install */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-1 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-tight">
            {t('app_name')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector compact />
          <PWAInstallButton variant="compact" />
        </div>
      </header>

      {/* Main Authentication Card - Compact and Zero-Scroll Layout */}
      <main className="max-w-md w-full mx-auto my-auto py-1">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -end-16 w-36 h-36 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -start-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Mode Switch Tabs */}
          <div className="flex rounded-2xl bg-slate-950/90 p-1 border border-slate-800 mb-3.5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('register')}
            </button>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="mb-2.5 flex items-center gap-2 p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-2.5 flex items-center gap-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold animate-fade-in">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Field: Full Name (Register Mode Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-center text-xs font-semibold text-slate-300 mb-1 w-full">
                  {t('full_name')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('full_name_ph')}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 ps-9 pe-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-center"
                  />
                </div>
              </div>
            )}

            {/* Field: Phone Number (شماره همراه) */}
            <div>
              <label className="block text-center text-xs font-semibold text-slate-300 mb-1 w-full">
                {t('phone_number')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  dir="ltr"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t('phone_number_ph')}
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 ps-9 pe-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-center"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <label className="block text-center text-xs font-semibold text-slate-300 mb-1 w-full">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 ps-9 pe-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field: Confirm Password (Register Mode Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-center text-xs font-semibold text-slate-300 mb-1 w-full">
                  {t('confirm_password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 ps-9 pe-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-center"
                  />
                </div>
              </div>
            )}

            {/* Remember Me (Login Mode Only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-0.5 px-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[11px]">{t('remember_me')}</span>
                </label>
                <span className="text-slate-500 text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{t('offline')}</span>
                </span>
              </div>
            )}

            {/* Action Buttons */}
            {mode === 'register' ? (
              /* Two side-by-side buttons: Confirm (تأیید) and Cancel (انصراف) */
              <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('confirm_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelRegister}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>{t('cancel_btn')}</span>
                </button>
              </div>
            ) : (
              /* Single Login Button */
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('login')}</span>
              </button>
            )}
          </form>

          {/* Switch mode link */}
          <div className="mt-3 pt-2 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              {mode === 'login' ? t('dont_have_account') : t('already_have_account')}
            </button>
          </div>
        </div>
      </main>

      {/* Clean Bottom Spacer */}
      <div className="h-2" />
    </div>
  );
};

export default AuthPage;
