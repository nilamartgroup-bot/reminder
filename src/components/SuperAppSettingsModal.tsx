import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useReminders } from '../context/ReminderContext';
import { customAudioService, SOUND_PRESETS } from '../utils/customAudioService';
import {
  X,
  ArrowLeft,
  Volume2,
  Music,
  Smartphone,
  Clock,
  ShieldCheck,
  Play,
  Square,
  Upload,
  Trash2,
  Bell,
  Sliders,
  Check,
  Sun,
  Database,
  Vibrate,
  Sparkles,
} from 'lucide-react';

interface SuperAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToHome?: () => void;
}

export const SuperAppSettingsModal: React.FC<SuperAppSettingsModalProps> = ({
  isOpen,
  onClose,
  onBackToHome,
}) => {
  const { t, language } = useLanguage();
  const { exportBackup, importBackup, reminders } = useReminders();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'sound' | 'screen' | 'timing' | 'storage'>('sound');

  // Custom audio state
  const [customAudioMeta, setCustomAudioMeta] = useState<{ name: string; size: number } | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Settings in localStorage
  const [selectedSoundType, setSelectedSoundType] = useState(() => {
    return localStorage.getItem('reminder_pref_sound_type') || 'custom';
  });

  const [volume, setVolume] = useState<number>(() => {
    const v = localStorage.getItem('reminder_pref_volume');
    return v ? Number(v) : 0.9;
  });

  const [vibrationPattern, setVibrationPattern] = useState(() => {
    return localStorage.getItem('reminder_pref_vibration_pattern') || 'standard';
  });

  const [wakeScreenEnabled, setWakeScreenEnabled] = useState(() => {
    return localStorage.getItem('reminder_pref_wake_screen') !== 'false';
  });

  const [crescendoEnabled, setCrescendoEnabled] = useState(() => {
    return localStorage.getItem('reminder_pref_crescendo') === 'true';
  });

  const [alarmDuration, setAlarmDuration] = useState(() => {
    return localStorage.getItem('reminder_pref_alarm_duration') || '30s';
  });

  const [defaultSnooze, setDefaultSnooze] = useState(() => {
    return localStorage.getItem('reminder_pref_default_snooze') || '10';
  });

  const [preAlarmMinutes, setPreAlarmMinutes] = useState(() => {
    return localStorage.getItem('reminder_pref_pre_alarm') || '0';
  });

  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
    setCustomAudioMeta(customAudioService.getCustomAudioMeta());
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      showToast(language === 'fa' ? 'لطفاً یک فایل صوتی معتبر انتخاب کنید.' : 'Please select a valid audio file.');
      return;
    }

    try {
      const res = await customAudioService.saveCustomAudio(file);
      if (res.success) {
        setCustomAudioMeta(customAudioService.getCustomAudioMeta());
        setSelectedSoundType('custom');
        localStorage.setItem('reminder_pref_sound_type', 'custom');
        showToast(language === 'fa' ? `موزیک «${file.name}» با موفقیت تنظیم شد.` : 'Custom audio saved!');
      }
    } catch {
      showToast(language === 'fa' ? 'خطا در ذخیره فایل صوتی.' : 'Failed to save audio.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTogglePlayTest = async () => {
    if (isPlayingTest) {
      customAudioService.stop();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      await customAudioService.playSound(selectedSoundType, volume, false);
      setTimeout(() => {
        setIsPlayingTest(false);
      }, 4000);
    }
  };

  const handleDeleteCustomAudio = () => {
    customAudioService.deleteCustomAudio();
    setCustomAudioMeta(null);
    setSelectedSoundType('chime');
    localStorage.setItem('reminder_pref_sound_type', 'chime');
    showToast(language === 'fa' ? 'صدای شخصی حذف شد و صدای کریستالی پیش‌فرض شد.' : 'Custom sound removed.');
  };

  const handleSoundTypeChange = (id: string) => {
    setSelectedSoundType(id);
    localStorage.setItem('reminder_pref_sound_type', id);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem('reminder_pref_volume', String(newVol));
  };

  const handleVibrationChange = (p: string) => {
    setVibrationPattern(p);
    localStorage.setItem('reminder_pref_vibration_pattern', p);
    if ('vibrate' in navigator && p !== 'off') {
      try {
        if (p === 'strong') navigator.vibrate([400, 100, 400]);
        else if (p === 'heartbeat') navigator.vibrate([150, 100, 150, 100, 300]);
        else navigator.vibrate([200, 100, 200]);
      } catch {
        // ignore
      }
    }
  };

  const handleToggleWakeScreen = () => {
    const next = !wakeScreenEnabled;
    setWakeScreenEnabled(next);
    localStorage.setItem('reminder_pref_wake_screen', String(next));
    if (next) {
      customAudioService.requestScreenWakeLock();
      setTimeout(() => customAudioService.releaseScreenWakeLock(), 1000);
    }
  };

  const handleToggleCrescendo = () => {
    const next = !crescendoEnabled;
    setCrescendoEnabled(next);
    localStorage.setItem('reminder_pref_crescendo', String(next));
  };

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setHasNotificationPermission(res === 'granted');
      if (res === 'granted') {
        showToast(language === 'fa' ? 'دسترسی اعلان‌های صفحه قفل فعال شد.' : 'Lockscreen notifications enabled!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 select-none animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Toast */}
        {toastMsg && (
          <div className="absolute top-3 start-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-1.5 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {language === 'fa' ? 'تنظیمات پیشرفته (سوپر اپ)' : 'Super App Settings'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {language === 'fa' ? 'شخصی‌سازی صدا، موزیک گوشی و بیداری صفحه' : 'Audio, Wake Screen & Preferences'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onBackToHome && (
              <button
                type="button"
                onClick={() => {
                  customAudioService.stop();
                  onClose();
                  onBackToHome();
                }}
                className="py-1 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                title={language === 'fa' ? 'بازگشت به صفحه اصلی' : 'Back to Home'}
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 text-indigo-400" />
                <span>{language === 'fa' ? 'صفحه اصلی' : 'Home'}</span>
              </button>
            )}
            <button
              onClick={() => {
                customAudioService.stop();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs (Keeps all sections strictly zero-scroll) */}
        <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-b border-slate-800/60 bg-slate-950/30 text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('sound')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sound'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-indigo-300" />
            <span>{language === 'fa' ? 'موزیک و صدا' : 'Sound & Music'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('screen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'screen'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span>{language === 'fa' ? 'روشن شدن صفحه' : 'Wake Screen'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'timing'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>{language === 'fa' ? 'تعویق و زمان' : 'Snooze'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>{language === 'fa' ? 'آفلاین و دیتا' : 'Storage'}</span>
          </button>
        </div>

        {/* Tab Body - Compact and designed to never require scrolling */}
        <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
          {/* TAB 1: Sound & Custom Music from Phone */}
          {activeTab === 'sound' && (
            <div className="space-y-3">
              {/* Custom phone audio file picker */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      {language === 'fa' ? 'صدای موزیک دلخواه از حافظه گوشی' : 'Custom Music from Device'}
                    </span>
                  </div>
                  {customAudioMeta && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      {language === 'fa' ? 'فعال' : 'Active'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-tight">
                  {customAudioMeta
                    ? `${language === 'fa' ? 'فایل انتخاب شده:' : 'File:'} ${customAudioMeta.name}`
                    : language === 'fa'
                    ? 'هر آهنگ، فایل صوتی یا ریکوردی از موبایل خود انتخاب کنید تا هنگام سررسید با آن زنگ بزند.'
                    : 'Select any MP3/Audio file from your phone to play as the alarm ringtone.'}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'fa' ? 'انتخاب موزیک از گوشی' : 'Choose Music File'}</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />

                  {customAudioMeta && (
                    <button
                      type="button"
                      onClick={handleDeleteCustomAudio}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                      title={language === 'fa' ? 'حذف موزیک شخصی' : 'Remove custom sound'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sound preset selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {language === 'fa' ? 'صدای پیش‌فرض آلارم:' : 'Alarm Sound Preset:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SOUND_PRESETS.map((preset) => {
                    const isCustomDisabled = preset.isCustom && !customAudioMeta;
                    const isSelected = selectedSoundType === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={isCustomDisabled}
                        onClick={() => handleSoundTypeChange(preset.id)}
                        className={`py-1.5 px-2.5 rounded-xl text-start text-[11px] font-semibold border transition flex items-center justify-between cursor-pointer ${
                          isCustomDisabled
                            ? 'opacity-40 bg-slate-950 border-slate-800 text-slate-500 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 shadow-sm'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{preset.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume & Preview button */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <Volume2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>{language === 'fa' ? 'بلندی صدا:' : 'Volume:'}</span>
                    <span className="font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTogglePlayTest}
                  className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                    isPlayingTest
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30'
                  }`}
                >
                  {isPlayingTest ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{isPlayingTest ? 'توقف' : 'تست'}</span>
                </button>
              </div>

              {/* Vibration Pattern */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">
                    {language === 'fa' ? 'الگوی لرزش (ویبره):' : 'Vibration Pattern:'}
                  </span>
                </div>
                <select
                  value={vibrationPattern}
                  onChange={(e) => handleVibrationChange(e.target.value)}
                  className="rounded-xl bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="standard">{language === 'fa' ? 'استاندارد' : 'Standard'}</option>
                  <option value="strong">{language === 'fa' ? 'پرقدرت و ممتد' : 'Strong Pulse'}</option>
                  <option value="heartbeat">{language === 'fa' ? 'ضربان قلب' : 'Heartbeat'}</option>
                  <option value="off">{language === 'fa' ? 'خاموش' : 'Off'}</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Screen Wake & Lock Screen Action */}
          {activeTab === 'screen' && (
            <div className="space-y-3 text-xs">
              {/* Wake Screen on Alarm Toggle */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">
                      {language === 'fa' ? 'روشن شدن خودکار صفحه هنگام سررسید' : 'Wake Screen on Due Date'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleWakeScreen}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      wakeScreenEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        wakeScreenEnabled ? 'start-5' : 'start-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {language === 'fa'
                    ? 'هنگام سررسید، صفحه نمایش به صورت خودکار روشن می‌شود و موضوع یادآوری به همراه دکمه‌های اقدام نمایش داده خواهد شد.'
                    : 'Automatically wakes and activates screen upon alarm time.'}
                </p>
              </div>

              {/* Lockscreen Notification with Action Button */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white">
                      {language === 'fa' ? 'دکمه «انجام شد» روی نوتیفیکیشن موبایل' : 'Lockscreen Action Button'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      hasNotificationPermission
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {hasNotificationPermission
                      ? language === 'fa'
                        ? 'فعال'
                        : 'Active'
                      : language === 'fa'
                      ? 'نیاز به تایید'
                      : 'Permission needed'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-tight">
                  {language === 'fa'
                    ? 'با روشن بودن این قابلیت، یک دکمه با عنوان «✓ انجام شد» مستقیماً روی نوتیفیکیشن قفل گوشی ظاهر می‌شود تا بدون نیاز به باز کردن برنامه، یادآوری تکمیل و تکرار بعدی آن تنظیم شود.'
                    : 'Displays a direct "Mark as Completed" button on lockscreen notification.'}
                </p>

                {!hasNotificationPermission && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{language === 'fa' ? 'فعال‌سازی اعلان‌های صفحه قفل' : 'Grant Lockscreen Permissions'}</span>
                  </button>
                )}
              </div>

              {/* Alarm Ring Duration */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-slate-200">
                  {language === 'fa' ? 'مدت زمان نواختن آلارم:' : 'Alarm Duration:'}
                </span>
                <select
                  value={alarmDuration}
                  onChange={(e) => {
                    setAlarmDuration(e.target.value);
                    localStorage.setItem('reminder_pref_alarm_duration', e.target.value);
                  }}
                  className="rounded-xl bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="15s">۱۵ {language === 'fa' ? 'ثانیه' : 'sec'}</option>
                  <option value="30s">۳۰ {language === 'fa' ? 'ثانیه' : 'sec'}</option>
                  <option value="60s">۱ {language === 'fa' ? 'دقیقه' : 'min'}</option>
                  <option value="until_dismissed">{language === 'fa' ? 'تا زمان لمس دکمه' : 'Until dismissed'}</option>
                </select>
              </div>

              {/* Gentle Crescendo toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 block">
                    {language === 'fa' ? 'افزایش تدریجی صدا (شروع ملایم)' : 'Gentle Volume Crescendo'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'fa' ? 'شروع با صدای کم و رسیدن به حداکثر' : 'Gradually increases alarm volume'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCrescendo}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    crescendoEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      crescendoEnabled ? 'start-5' : 'start-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Smart Timing & Snooze */}
          {activeTab === 'timing' && (
            <div className="space-y-3 text-xs">
              {/* Default Snooze Duration */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-white block">
                  {language === 'fa' ? 'مدت زمان تعویق پیش‌فرض (Snooze):' : 'Default Snooze Duration:'}
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: '5', label: '۵ دقیقه' },
                    { val: '10', label: '۱۰ دقیقه' },
                    { val: '15', label: '۱۵ دقیقه' },
                    { val: '30', label: '۳۰ دقیقه' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        setDefaultSnooze(item.val);
                        localStorage.setItem('reminder_pref_default_snooze', item.val);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-semibold border transition cursor-pointer ${
                        defaultSnooze === item.val
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-alarm notice */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-slate-200">
                  {language === 'fa' ? 'یادآوری قبل از موعد:' : 'Pre-Alarm Notice:'}
                </span>
                <select
                  value={preAlarmMinutes}
                  onChange={(e) => {
                    setPreAlarmMinutes(e.target.value);
                    localStorage.setItem('reminder_pref_pre_alarm', e.target.value);
                  }}
                  className="rounded-xl bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="0">{language === 'fa' ? 'دقیقاً در سررسید' : 'Exact time'}</option>
                  <option value="5">۵ {language === 'fa' ? 'دقیقه قبل' : 'min before'}</option>
                  <option value="15">۱۵ {language === 'fa' ? 'دقیقه قبل' : 'min before'}</option>
                  <option value="60">۱ {language === 'fa' ? 'ساعت قبل' : 'hour before'}</option>
                </select>
              </div>

              {/* Auto recurrence handling info */}
              <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{language === 'fa' ? 'موتور تکرار هوشمند فعال است' : 'Smart Recurrence Engine'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {language === 'fa'
                    ? 'هنگامی که دکمه «انجام شد» را می‌زنید، چنانچه یادآوری تکرار (روزانه، هفتگی، ماهانه، سالانه) داشته باشد، به طور خودکار به سررسید بعدی منتقل شده و آلارم دوره بعدی فعال خواهد ماند.'
                    : 'Completed recurring reminders automatically compute next interval.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Storage, Privacy & Offline */}
          {activeTab === 'storage' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">
                      {language === 'fa' ? 'دیتابیس ایزوله ماژول یادآور' : 'Isolated Module DB'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    ۱۰۰٪ آفلاین
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {language === 'fa'
                    ? `تعداد کل یادآورهای ثبت‌شده روی دستگاه: ${reminders.length}`
                    : `Total reminders stored locally: ${reminders.length}`}
                </p>
              </div>

              {/* Quick Backup and restore */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportBackup}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{language === 'fa' ? 'دانلود فایل پشتیبان' : 'Export Backup'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'fa' ? 'بازیابی از فایل' : 'Restore Backup'}</span>
                </button>

                <input
                  type="file"
                  ref={backupInputRef}
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = (ev) => {
                      const text = ev.target?.result as string;
                      if (text && importBackup(text)) {
                        showToast(language === 'fa' ? 'پشتیبان بازیابی شد.' : 'Restored successfully!');
                      }
                    };
                    r.readAsText(file);
                  }}
                  className="hidden"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-tight">
                {language === 'fa'
                  ? 'هیچ داده‌ای به هیچ سروری ارسال نمی‌شود و تمامی اطلاعات به صورت کاملاً رمزنگاری شده روی حافظه موبایل شما قرار دارد.'
                  : 'Zero external telemetry. All records remain 100% private and offline on your device.'}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2">
          {onBackToHome && (
            <button
              type="button"
              onClick={() => {
                customAudioService.stop();
                onClose();
                onBackToHome();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-indigo-400" />
              <span>{language === 'fa' ? 'بازگشت به صفحه اصلی' : 'Back to Home'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              customAudioService.stop();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-indigo-600/30 text-center"
          >
            {language === 'fa' ? 'تایید و بستن تنظیمات' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
