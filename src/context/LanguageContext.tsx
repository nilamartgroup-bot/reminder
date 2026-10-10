import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  getTranslation,
  LanguageOption,
} from '../utils/i18n';
import { toLocalDigits } from '../utils/jalali';

interface LanguageContextType {
  language: LanguageCode;
  direction: 'rtl' | 'ltr';
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string>) => string;
  toDigits: (val: string | number) => string;
  currentOption: LanguageOption;
}

const STORAGE_KEY = 'reminder_pro_app_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['fa', 'ar', 'en', 'tr', 'fr', 'de'].includes(saved)) {
        return saved as LanguageCode;
      }
    } catch {
      // fallback
    }
    return 'fa'; // Default Persian as requested
  });

  const currentOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];
  const direction = currentOption.dir;

  useEffect(() => {
    // Update HTML root attributes for complete RTL/LTR & language styling
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language, direction]);

  const setLanguage = (lang: LanguageCode) => {
    setLangState(lang);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    return getTranslation(language, key, params);
  };

  const toDigits = (val: string | number): string => {
    return toLocalDigits(val, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        setLanguage,
        t,
        toDigits,
        currentOption,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
