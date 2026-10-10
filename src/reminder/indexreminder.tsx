import React, { useState, useRef } from 'react';
import {
  useReminders,
  ReminderRepeat,
} from '../context/ReminderContext';
import { useLanguage } from '../context/LanguageContext';
import { ShamsiDatePicker } from '../components/ShamsiDatePicker';
import { playReminderChime } from '../utils/audioAlert';
import { SuperAppSettingsModal } from '../components/SuperAppSettingsModal';
import {
  ArrowLeft,
  Settings,
  Plus,
  Download,
  Upload,
  ShieldCheck,
  X,
  Volume2,
  Bell,
  Sparkles,
  Check,
  Database,
} from 'lucide-react';

interface IndexReminderPageProps {
  onBackToIndex: () => void;
}

export const IndexReminderPage: React.FC<IndexReminderPageProps> = ({ onBackToIndex }) => {
  const {
    addReminder,
    exportBackup,
    importBackup,
    requestNotificationPermission,
    hasNotificationPermission,
  } = useReminders();
  const { t, language } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // View state: 'list' (main reminder hub) or 'create' (form to add reminder)
  const [isCreating, setIsCreating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationStatusMsg, setNotificationStatusMsg] = useState<string | null>(null);

  // Settings states (stored in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('reminder_pref_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    try {
      return localStorage.getItem('reminder_pref_vibration') !== 'false';
    } catch {
      return true;
    }
  });

  // Form states for Add Reminder
  const [formTitle, setFormTitle] = useState('');
  const [formDueDate, setFormDueDate] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString();
  });
  const [formRepeat, setFormRepeat] = useState<ReminderRepeat>('none');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Open Create Form
  const handleOpenCreate = () => {
    setFormTitle('');
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    setFormDueDate(d.toISOString());
    setFormRepeat('none');
    setFormError(null);
    setIsCreating(true);
  };

  // Save handler
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError(t('field_required'));
      return;
    }

    addReminder({
      title: formTitle.trim(),
      dueDate: formDueDate,
      category: 'personal',
      priority: 'medium',
      repeat: formRepeat,
      soundAlert: soundEnabled,
      vibration: vibrationEnabled,
    });

    setIsCreating(false);
    showNotice(t('saved_successfully'));
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 3000);
  };

  // Import Backup handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackup(content);
        if (ok) {
          showNotice(language === 'fa' ? 'پشتیبان با موفقیت بازیابی شد.' : 'Backup restored successfully!');
        } else {
          showNotice(language === 'fa' ? 'فرمت فایل پشتیبان نامعتبر است.' : 'Invalid backup file.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('reminder_pref_sound', String(next));
    } catch {
      // Ignored
    }
  };

  const handleToggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    try {
      localStorage.setItem('reminder_pref_vibration', String(next));
    } catch {
      // Ignored
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationStatusMsg(language === 'fa' ? 'اعلان‌ها با موفقیت فعال شدند.' : 'Notifications enabled!');
    } else {
      setNotificationStatusMsg(language === 'fa' ? 'دسترسی اعلان‌ها داده نشد.' : 'Notifications not granted.');
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between animate-fade-in select-none py-2 px-1 max-w-xl mx-auto h-full overflow-hidden">
      {/* Toast Notification message */}
      {actionNotice && (
        <div className="fixed top-16 start-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {isCreating ? (
        /* CREATE REMINDER FORM SCREEN - IN-PAGE UNDER THE NAVBAR */
        <div className="w-full flex-1 flex flex-col justify-between py-1 space-y-2.5 sm:space-y-3">
          {/* Top Bar with Back to Home Page button */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                onBackToIndex();
              }}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title={t('back_to_index')}
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-indigo-400" />
              <span>{t('back_to_index')}</span>
            </button>
            <span className="text-xs font-bold text-slate-300">
              {language === 'fa' ? 'افزودن یادآوری جدید' : 'New Reminder'}
            </span>
          </div>

          <form onSubmit={handleSaveReminder} className="flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
            {formError && (
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-semibold">
                {formError}
              </div>
            )}

            {/* Row 1: Title (عنوان یادآوری) */}
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-bold text-slate-200 text-center">
                {t('reminder_title')} *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('reminder_title_ph')}
                className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-center shadow-inner"
              />
            </div>

            {/* Row 2: Date & Time Picker */}
            <div className="space-y-1">
              <ShamsiDatePicker
                value={formDueDate}
                onChange={setFormDueDate}
              />
            </div>

            {/* Row 3: Recurrence Repeat (تکرار دوره) */}
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-bold text-slate-200 text-center">
                {t('repeat')}
              </label>
              <select
                value={formRepeat}
                onChange={(e) => setFormRepeat(e.target.value as ReminderRepeat)}
                className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer text-center shadow-inner"
              >
                <option value="none">{t('repeat_none')}</option>
                <option value="daily">{t('repeat_daily')}</option>
                <option value="weekly">{t('repeat_weekly')}</option>
                <option value="monthly">{t('repeat_monthly')}</option>
                <option value="yearly">{t('repeat_yearly')}</option>
              </select>
            </div>

            {/* Row 4: Action Buttons (ذخیره یادآوری and انصراف) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition cursor-pointer"
              >
                {t('save_reminder')}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-3 px-4 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold active:scale-[0.98] transition cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MAIN REMINDER VIEW */
        <div className="w-full flex-1 flex flex-col justify-between py-3 space-y-5">
          {/* Top Sub-Header: Back to main page and Settings */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              {/* Back to Home Button */}
              <button
                onClick={onBackToIndex}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title={t('back_to_index')}
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-indigo-400" />
                <span>{t('back_to_index')}</span>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title={t('settings')}
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>{t('settings')}</span>
              </button>
            </div>

            {/* Offline Badge */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('offline')}</span>
            </div>
          </div>

          {/* Under these two: Add New Reminder Button with generous padding */}
          <div className="w-full py-2">
            <button
              onClick={handleOpenCreate}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-600 hover:from-indigo-500 hover:to-amber-500 py-4 px-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 active:scale-[0.99] transition cursor-pointer"
            >
              <span>{t('new_reminder')}</span>
            </button>
          </div>

          {/* Backup & Restore Card */}
          <div className="w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    {t('backup_desc')}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'fa'
                      ? 'اطلاعات در این دستگاه ذخیره می‌شود. می‌توانید فایل پشتیبان دریافت یا بارگذاری کنید.'
                      : 'Data is stored locally on this device. You can download or restore your backup file.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons for Backup and Restore */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Download Backup */}
              <button
                onClick={exportBackup}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold active:scale-[0.98] transition cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>{t('export_backup')}</span>
              </button>

              {/* Upload Backup */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold active:scale-[0.98] transition cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{t('import_backup')}</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUPER-APP SETTINGS MODAL */}
      <SuperAppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onBackToHome={onBackToIndex}
      />
    </div>
  );
};

export default IndexReminderPage;
