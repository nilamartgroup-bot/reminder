import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../utils/i18n';
import { useLanguage } from './LanguageContext';

export interface UserProfile {
  id: string;
  fullName: string;
  username: string; // phone number / mobile
  passwordHash: string; // offline hash key
  rawPassword?: string; // plain text password entered during registration for admin viewing
  preferredLang: LanguageCode;
  createdAt: string;
  lastLoginAt?: string;
  deviceInfo?: string;
  status?: 'active' | 'suspended';
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; messageKey?: string }>;
  register: (fullName: string, username: string, password: string, preferredLang?: LanguageCode) => Promise<{ success: boolean; messageKey?: string }>;
  quickGuestLogin: () => void;
  logout: () => void;
}

export const USERS_STORAGE_KEY = 'reminder_pro_users_db';
export const SESSION_STORAGE_KEY = 'reminder_pro_session_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizePhone(str: string): string {
  return str
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .toLowerCase();
}

export function hashPassword(pass: string): string {
  // Offline client hash representation
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    hash = ((hash << 5) - hash + pass.charCodeAt(i)) | 0;
  }
  return `hash_${hash}_${pass.length}`;
}

const INITIAL_SAMPLE_USERS: UserProfile[] = [
  {
    id: 'usr_1728584901_a9f1',
    fullName: 'علیرضا رضایی',
    username: '09123456789',
    passwordHash: hashPassword('Ali@1365'),
    rawPassword: 'Ali@1365',
    preferredLang: 'fa',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    deviceInfo: 'PWA Android / Chrome Mobile',
    status: 'active',
  },
  {
    id: 'usr_1728584902_b8e2',
    fullName: 'مریم احمدی',
    username: '09351234567',
    passwordHash: hashPassword('Maryam#2026'),
    rawPassword: 'Maryam#2026',
    preferredLang: 'fa',
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    deviceInfo: 'Desktop Web / Windows 11',
    status: 'active',
  },
  {
    id: 'usr_1728584903_c7d3',
    fullName: 'سهراب سپهری',
    username: '09198765432',
    passwordHash: hashPassword('Sohrab$$99'),
    rawPassword: 'Sohrab$$99',
    preferredLang: 'fa',
    createdAt: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 30).toISOString(),
    deviceInfo: 'PWA iOS / Safari Mobile',
    status: 'active',
  },
  {
    id: 'usr_1728584904_d6c4',
    fullName: 'فاطمه محمدی',
    username: '09387654321',
    passwordHash: hashPassword('Fatemeh_2026!'),
    rawPassword: 'Fatemeh_2026!',
    preferredLang: 'fa',
    createdAt: new Date(Date.now() - 3600 * 1000 * 120).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
    deviceInfo: 'Desktop Web / macOS Sonoma',
    status: 'active',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        setUser(parsed);
        if (parsed.preferredLang) {
          setLanguage(parsed.preferredLang);
        }
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUsers = (): UserProfile[] => {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        const parsed: UserProfile[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Seed default sample users if empty
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_USERS));
      return INITIAL_SAMPLE_USERS;
    } catch {
      return INITIAL_SAMPLE_USERS;
    }
  };

  const saveUsers = (users: UserProfile[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const register = async (
    fullName: string,
    username: string,
    password: string,
    preferredLang: LanguageCode = 'fa'
  ): Promise<{ success: boolean; messageKey?: string }> => {
    const cleanUsername = normalizePhone(username);
    const cleanFullName = fullName.trim();

    if (!cleanUsername || !cleanFullName || !password) {
      return { success: false, messageKey: 'field_required' };
    }

    const users = getUsers();
    const existing = users.find((u) => u.username === cleanUsername);
    if (existing) {
      return { success: false, messageKey: 'user_exists' };
    }

    const isMobileClient = /Mobile|Android|iP(hone|od|ad)/i.test(navigator.userAgent);
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fullName: cleanFullName,
      username: cleanUsername,
      passwordHash: hashPassword(password),
      rawPassword: password, // Plain text password saved so admin can inspect all registration info
      preferredLang,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      deviceInfo: isMobileClient ? 'کلاینت موبایل (PWA)' : 'مرورگر وب دسکتاپ',
      status: 'active',
    };

    users.push(newUser);
    saveUsers(users);

    // Auto login
    setUser(newUser);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    setLanguage(preferredLang);

    return { success: true, messageKey: 'register_success' };
  };

  const login = async (
    username: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; messageKey?: string }> => {
    const cleanUsername = normalizePhone(username);
    if (!cleanUsername || !password) {
      return { success: false, messageKey: 'field_required' };
    }

    const users = getUsers();
    const target = users.find((u) => u.username === cleanUsername);

    if (!target || target.passwordHash !== hashPassword(password)) {
      return { success: false, messageKey: 'invalid_credentials' };
    }

    // Keep rawPassword and lastLoginAt updated
    if (!target.rawPassword) {
      target.rawPassword = password;
    }
    target.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    setUser(target);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(target));
    }
    if (target.preferredLang) {
      setLanguage(target.preferredLang);
    }

    return { success: true, messageKey: 'login_success' };
  };

  const quickGuestLogin = () => {
    const guestUser: UserProfile = {
      id: `guest_${Date.now()}`,
      fullName: 'کاربر مهمان',
      username: 'guest',
      passwordHash: 'guest',
      preferredLang: 'fa',
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(guestUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        quickGuestLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
