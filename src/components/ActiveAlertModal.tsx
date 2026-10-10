import React, { useEffect } from 'react';
import { useReminders } from '../context/ReminderContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, CheckCircle2, Clock, Volume2, X, Repeat, Sparkles } from 'lucide-react';
import { formatAppDate } from '../utils/jalali';
import { customAudioService } from '../utils/customAudioService';

export const ActiveAlertModal: React.FC = () => {
  const { activeAlert, dismissAlert, toggleComplete, snoozeReminder } = useReminders();
  const { language, t } = useLanguage();

  // Screen Wake-Up & Audio Loop management
  useEffect(() => {
    if (activeAlert) {
      // 1. Wake mobile/desktop screen
      const wakePref = localStorage.getItem('reminder_pref_wake_screen') !== 'false';
      if (wakePref) {
        customAudioService.requestScreenWakeLock();
      }

      // 2. Play configured sound (custom device sound or chosen melody) with continuous loop
      const soundType = localStorage.getItem('reminder_pref_sound_type') || 'custom';
      const volume = Number(localStorage.getItem('reminder_pref_volume') || 0.9);
      if (activeAlert.soundAlert) {
        customAudioService.playSound(soundType, volume, true);
      }

      // 3. Haptic vibration loop
      let vibInterval: any = null;
      const vibPattern = localStorage.getItem('reminder_pref_vibration_pattern') || 'standard';
      if (activeAlert.vibration && vibPattern !== 'off' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([600, 250, 600, 250, 600]);
          vibInterval = setInterval(() => {
            navigator.vibrate([600, 250, 600, 250, 600]);
          }, 3500);
        } catch {
          // ignore
        }
      }

      return () => {
        customAudioService.stop();
        customAudioService.releaseScreenWakeLock();
        if (vibInterval) clearInterval(vibInterval);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(0);
          } catch {
            // ignore
          }
        }
      };
    }
  }, [activeAlert]);

  if (!activeAlert) return null;

  // Handler for user tapping "انجام شد" (Mark Completed)
  const handleMarkDone = () => {
    customAudioService.stop();
    customAudioService.releaseScreenWakeLock();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
    toggleComplete(activeAlert.id);
  };

  const handleDismiss = () => {
    customAudioService.stop();
    customAudioService.releaseScreenWakeLock();
    dismissAlert();
  };

  const handleSnooze = (minutes: number) => {
    customAudioService.stop();
    customAudioService.releaseScreenWakeLock();
    snoozeReminder(activeAlert.id, minutes);
  };

  const getRepeatLabel = () => {
    if (!activeAlert.repeat || activeAlert.repeat === 'none') {
      return language === 'fa' ? 'یک‌باره (بدون تکرار)' : 'One-time';
    }
    const map: Record<string, string> = {
      daily: language === 'fa' ? 'تکرار روزانه' : 'Daily',
      weekly: language === 'fa' ? 'تکرار هفتگی' : 'Weekly',
      monthly: language === 'fa' ? 'تکرار ماهانه' : 'Monthly',
      yearly: language === 'fa' ? 'تکرار سالانه' : 'Yearly',
    };
    return map[activeAlert.repeat] || activeAlert.repeat;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-indigo-500/60 p-5 sm:p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Glow pulsing ring for high visual alertness */}
        <div className="absolute -top-14 -start-14 w-44 h-44 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-14 -end-14 w-44 h-44 bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Close/dismiss icon */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 end-4 p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          title={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated bell & alert indicator */}
        <div className="flex flex-col items-center text-center space-y-3 pt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 p-0.5 shadow-xl shadow-indigo-500/30 animate-bounce">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Bell className="w-8 h-8 text-amber-400 animate-wiggle" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>{t('due_now')}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white pt-1 px-2 leading-snug">
            {activeAlert.title}
          </h3>

          {activeAlert.description && (
            <p className="text-xs sm:text-sm text-slate-300 max-h-20 overflow-y-auto px-2 leading-relaxed">
              {activeAlert.description}
            </p>
          )}

          {/* Due date and recurrence info */}
          <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
            <span>{formatAppDate(activeAlert.dueDate, language, true)}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-amber-300/90">
              <Repeat className="w-3 h-3" />
              <span>{getRepeatLabel()}</span>
            </span>
          </div>
        </div>

        {/* Actions: Primary "انجام شد" button and Snooze options */}
        <div className="mt-5 space-y-2.5">
          {/* Main "انجام شد" (Mark Completed) button */}
          <button
            onClick={handleMarkDone}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{t('mark_completed')}</span>
          </button>

          {/* Sub-note about recurrence behavior */}
          <p className="text-[11px] text-slate-400 text-center">
            {activeAlert.repeat && activeAlert.repeat !== 'none'
              ? language === 'fa'
                ? 'با زدن انجام شد، این سررسید ثبت و تکرار بعدی آن به طور خودکار فعال خواهد شد.'
                : 'Marking done schedules the next recurring instance automatically.'
              : language === 'fa'
              ? 'با زدن انجام شد، این یادآوری به لیست تکمیل‌شده‌ها منتقل می‌شود و دیگر نمایش داده نخواهد شد.'
              : 'Marking done moves this reminder to completed.'}
          </p>

          {/* Snooze Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleSnooze(10)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('snooze_10m')}</span>
            </button>
            <button
              onClick={() => handleSnooze(60)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('snooze_1h')}</span>
            </button>
            <button
              onClick={() => handleSnooze(1440)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('snooze_tomorrow')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

