import * as jalaaliPkg from 'jalaali-js';
const jalaali = (jalaaliPkg as any).default || jalaaliPkg;

/**
 * Jalali (Solar Hijri / Shamsi) calendar algorithms & numeral conversions
 * Powered by standard jalaali-js calculation engine.
 */

// Persian numerals: ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹
export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
// Arabic numerals: ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩
export const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toLocalDigits(strOrNum: string | number, lang: string = 'fa'): string {
  if (strOrNum === null || strOrNum === undefined) return '';
  let str = String(strOrNum);
  // Normalize any Persian or Arabic digits to Latin 0-9 first
  str = str
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));

  if (lang === 'fa') {
    return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
  }
  if (lang === 'ar') {
    return str.replace(/[0-9]/g, (w) => ARABIC_DIGITS[+w]);
  }
  return str;
}

export function fromLocalDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export interface JalaliDate {
  jy: number; // Jalali year (e.g. 1405)
  jm: number; // Jalali month (1-12)
  jd: number; // Jalali day (1-31)
}

export interface GregorianDate {
  gy: number;
  gm: number; // 1-12
  gd: number; // 1-31
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEK_DAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
];

export const ARABIC_MONTH_NAMES = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الثانية',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export const GREGORIAN_MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Public converter: Gregorian to Jalali
 */
export function toJalali(date: Date | string | number): JalaliDate {
  const d = date instanceof Date ? date : new Date(date);
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { jy: j.jy, jm: j.jm, jd: j.jd };
}

/**
 * Public converter: Jalali to Gregorian Date
 */
export function toGregorian(jy: number, jm: number, jd: number, hour = 0, minute = 0): Date {
  const g = jalaali.toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd, hour, minute, 0, 0);
}

export function isJalaliLeapYear(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

export function getDaysInJalaliMonth(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

/**
 * Format date nicely according to active language and conventions:
 * - Persian ('fa'): Solar Hijri (Shamsi) with Persian month names and Persian numerals
 * - Arabic ('ar'): Islamic Hijri (Umm al-Qura) with Arabic numerals
 * - English/European ('en', 'tr', 'fr', 'de'): Localized Gregorian with Latin numerals
 */
export function formatAppDate(date: Date | string | number, lang: string = 'fa', includeTime: boolean = true): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  if (lang === 'fa') {
    const j = toJalali(d);
    const dayOfWeek = PERSIAN_WEEK_DAYS[d.getDay()];
    const monthName = PERSIAN_MONTH_NAMES[j.jm - 1];
    const dateStr = `${dayOfWeek}، ${j.jd} ${monthName} ${j.jy}`;
    const timeStr = includeTime ? ` ساعت ${hours}:${minutes}` : '';
    return toLocalDigits(`${dateStr}${timeStr}`, 'fa');
  }

  if (lang === 'ar') {
    try {
      const options: Intl.DateTimeFormatOptions = {
        calendar: 'islamic-umalqura',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
      }
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options).format(d);
    } catch {
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const timeStr = includeTime ? ` ${hours}:${minutes}` : '';
      return toLocalDigits(`${day}/${month}/${year}${timeStr}`, 'ar');
    }
  }

  // Western locales using standard Intl
  const localeMap: Record<string, string> = {
    en: 'en-US',
    tr: 'tr-TR',
    fr: 'fr-FR',
    de: 'de-DE',
  };
  const targetLocale = localeMap[lang] || 'en-US';
  try {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }
    return new Intl.DateTimeFormat(targetLocale, options).format(d);
  } catch {
    const monthName = GREGORIAN_MONTH_NAMES_EN[d.getMonth()];
    const dateStr = `${monthName} ${d.getDate()}, ${d.getFullYear()}`;
    const timeStr = includeTime ? ` at ${hours}:${minutes}` : '';
    return `${dateStr}${timeStr}`;
  }
}

export function formatAppDateShort(date: Date | string | number, lang: string = 'fa'): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  if (lang === 'fa') {
    const j = toJalali(d);
    return toLocalDigits(`${j.jy}/${pad(j.jm)}/${pad(j.jd)}`, 'fa');
  }
  if (lang === 'ar') {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    } catch {
      return toLocalDigits(`${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`, 'ar');
    }
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTimeShort(date: Date | string | number, lang: string = 'fa'): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return toLocalDigits(timeStr, lang);
}
