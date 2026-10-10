import React, { useState, useEffect } from 'react';
import {
  toJalali,
  toGregorian,
  PERSIAN_MONTH_NAMES,
  getDaysInJalaliMonth,
  formatAppDate,
} from '../utils/jalali';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, Clock, Sparkles } from 'lucide-react';

interface ShamsiDatePickerProps {
  value: string; // ISO date string
  onChange: (isoString: string) => void;
}

export const ShamsiDatePicker: React.FC<ShamsiDatePickerProps> = ({ value, onChange }) => {
  const { language, toDigits } = useLanguage();
  const currentDate = value ? new Date(value) : new Date();

  // Jalali state
  const initialJ = toJalali(currentDate);
  const [year, setYear] = useState<number>(initialJ.jy);
  const [month, setMonth] = useState<number>(initialJ.jm);
  const [day, setDay] = useState<number>(initialJ.jd);
  const [hour, setHour] = useState<number>(currentDate.getHours());
  const [minute, setMinute] = useState<number>(currentDate.getMinutes());

  // Gregorian state for English & others
  const [gYear, setGYear] = useState<number>(currentDate.getFullYear());
  const [gMonth, setGMonth] = useState<number>(currentDate.getMonth() + 1);
  const [gDay, setGDay] = useState<number>(currentDate.getDate());

  const daysInMonth = getDaysInJalaliMonth(year, month);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const j = toJalali(d);
        setYear(j.jy);
        setMonth(j.jm);
        setDay(Math.min(j.jd, getDaysInJalaliMonth(j.jy, j.jm)));
        setHour(d.getHours());
        setMinute(d.getMinutes());

        setGYear(d.getFullYear());
        setGMonth(d.getMonth() + 1);
        setGDay(d.getDate());
      }
    }
  }, [value]);

  const updateFromJalali = (y: number, m: number, d: number, h: number, min: number) => {
    const maxDays = getDaysInJalaliMonth(y, m);
    const validDay = Math.min(d, maxDays);
    const gDate = toGregorian(y, m, validDay, h, min);
    onChange(gDate.toISOString());
  };

  const updateFromGregorian = (y: number, m: number, d: number, h: number, min: number) => {
    const gDate = new Date(y, m - 1, d, h, min);
    onChange(gDate.toISOString());
  };

  // Quick preset handlers
  const setPreset = (type: 'now' | 'in1h' | 'tonight' | 'tomorrow' | 'weekend') => {
    const d = new Date();
    if (type === 'in1h') {
      d.setHours(d.getHours() + 1);
    } else if (type === 'tonight') {
      d.setHours(20, 0, 0, 0);
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (type === 'weekend') {
      d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
      d.setHours(10, 0, 0, 0);
    }
    onChange(d.toISOString());
  };

  const isPersian = language === 'fa';
  const isArabic = language === 'ar';

  const getPresetLabel = (type: string) => {
    if (isPersian) {
      if (type === 'title') return 'میانبرهای سریع:';
      if (type === '1h') return '۱ ساعت بعد';
      if (type === 'tonight') return 'امشب ساعت ۲۰';
      if (type === 'tomorrow') return 'فردا صبح';
      if (type === 'weekend') return 'آخر هفته';
    }
    if (isArabic) {
      if (type === 'title') return 'خيارات سريعة:';
      if (type === '1h') return 'بعد ساعة';
      if (type === 'tonight') return 'الليلة ٨ م';
      if (type === 'tomorrow') return 'غداً صباحاً';
      if (type === 'weekend') return 'نهاية الأسبوع';
    }
    if (type === 'title') return 'Quick Presets:';
    if (type === '1h') return 'In 1 hour';
    if (type === 'tonight') return 'Tonight 8 PM';
    if (type === 'tomorrow') return 'Tomorrow morning';
    return 'Weekend';
  };

  const getFieldLabels = () => {
    if (isPersian) {
      return {
        dateTitle: 'تاریخ شمسی',
        day: 'روز',
        month: 'ماه',
        year: 'سال',
        timeTitle: 'زمان هشدار (ساعت و دقیقه)',
        hour: 'ساعت (۰ تا ۲۳)',
        minute: 'دقیقه (۰۰ تا ۵۹)',
        preview: 'سررسید تنظیم شده:',
      };
    }
    if (isArabic) {
      return {
        dateTitle: 'تاريخ الموعد',
        day: 'اليوم',
        month: 'الشهر',
        year: 'السنة',
        timeTitle: 'وقت التنبيه',
        hour: 'الساعة',
        minute: 'الدقيقة',
        preview: 'الموعد المحدد:',
      };
    }
    return {
      dateTitle: 'Due Date',
      day: 'Day',
      month: 'Month',
      year: 'Year',
      timeTitle: 'Time',
      hour: 'Hour (00-23)',
      minute: 'Minute (00-59)',
      preview: 'Selected time:',
    };
  };

  const labels = getFieldLabels();

  // Generate years from 1403 to 1503 (101 years)
  const jalaliYears = Array.from({ length: 1503 - 1403 + 1 }, (_, i) => 1403 + i);

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2.5 space-y-2 shadow-inner">
      {isPersian ? (
        /* Shamsi Selectors for Persian: Day, Month, Year */
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-2">
            {/* Day: 1 to 31 */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5 text-center">{labels.day}</label>
              <select
                value={day}
                onChange={(e) => {
                  const newDay = Number(e.target.value);
                  setDay(newDay);
                  updateFromJalali(year, month, newDay, hour, minute);
                }}
                className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {toDigits(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5 text-center">{labels.month}</label>
              <select
                value={month}
                onChange={(e) => {
                  const newMonth = Number(e.target.value);
                  setMonth(newMonth);
                  updateFromJalali(year, newMonth, day, hour, minute);
                }}
                className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
              >
                {PERSIAN_MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year: 1403 to 1503 */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5 text-center">{labels.year}</label>
              <select
                value={year}
                onChange={(e) => {
                  const newYear = Number(e.target.value);
                  setYear(newYear);
                  updateFromJalali(newYear, month, day, hour, minute);
                }}
                className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
              >
                {jalaliYears.map((y) => (
                  <option key={y} value={y}>
                    {toDigits(y)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* Localized date selectors for other languages */
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5 text-center">{labels.day}</label>
              <select
                value={gDay}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGDay(val);
                  updateFromGregorian(gYear, gMonth, val, hour, minute);
                }}
                className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5 text-center">{labels.month}</label>
              <select
                value={gMonth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGMonth(val);
                  updateFromGregorian(gYear, val, gDay, hour, minute);
                }}
                className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5 text-center">{labels.year}</label>
              <select
                value={gYear}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGYear(val);
                  updateFromGregorian(val, gMonth, gDay, hour, minute);
                }}
                className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
              >
                {Array.from({ length: 2035 - 2024 + 1 }, (_, i) => 2024 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Time Picker */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{labels.timeTitle}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Hour */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-0.5 text-center">
              {labels.hour}
            </label>
            <select
              value={hour}
              onChange={(e) => {
                const newHour = Number(e.target.value);
                setHour(newHour);
                if (isPersian) {
                  updateFromJalali(year, month, day, newHour, minute);
                } else {
                  updateFromGregorian(gYear, gMonth, gDay, newHour, minute);
                }
              }}
              className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
            >
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <option key={h} value={h}>
                  {toDigits(String(h).padStart(2, '0'))}
                </option>
              ))}
            </select>
          </div>

          {/* Minute: 1-minute steps (0 to 59) */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-0.5 text-center">
              {labels.minute}
            </label>
            <select
              value={minute}
              onChange={(e) => {
                const newMinute = Number(e.target.value);
                setMinute(newMinute);
                if (isPersian) {
                  updateFromJalali(year, month, day, hour, newMinute);
                } else {
                  updateFromGregorian(gYear, gMonth, gDay, hour, newMinute);
                }
              }}
              className="w-full rounded-xl bg-slate-850 border border-slate-700/70 py-1.5 px-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 text-center cursor-pointer"
            >
              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                <option key={m} value={m}>
                  {toDigits(String(m).padStart(2, '0'))}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected formatted preview */}
      <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 flex items-center justify-between text-xs text-indigo-200">
        <span className="text-slate-400">{labels.preview}</span>
        <span className="font-bold text-white">{formatAppDate(value, language, true)}</span>
      </div>
    </div>
  );
};
