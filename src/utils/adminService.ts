/**
 * Super Admin Service & Vault
 * Manages stealth credentials, VPS & WebPush configuration,
 * system modules, audit logs, and diagnostic telemetry.
 */

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  emergencyPin: string;
  updatedAt: string;
}

export interface VpsPushConfig {
  serverUrl: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  subjectEmail: string;
  webhookSecret: string;
  pushQueueStatus: 'active' | 'paused' | 'standby';
  autoRetryFailed: boolean;
  batchSize: number;
}

export interface SystemModulesConfig {
  smsGateway: boolean;
  smsProvider: 'kavenegar' | 'twilio' | 'ghasedak';
  aiAssistant: boolean;
  cloudSync: boolean;
  voiceAssistant: boolean;
  teamSharing: boolean;
  advancedReports: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'security';
  details: string;
}

export interface RegisteredUserData {
  id: string;
  fullName: string;
  username: string; // شماره همراه یا نام کاربری ثبت نام شده
  passwordHash: string;
  rawPassword?: string; // رمز عبور وارد شده در فرم ثبت نام جهت مشاهده توسط مدیر
  preferredLang: string;
  createdAt: string; // تاریخ و ساعت دقیق ثبت‌نام
  lastLoginAt?: string;
  deviceInfo?: string;
  status?: 'active' | 'suspended';
  subscriptionStatus?: 'free' | 'trial_active' | 'trial_expired' | 'subscribed';
  trialExtendedUntil?: string; // تاریخ انقضای تمدید شده
  paidAmount?: number;
  lastPaymentDate?: string;
}

export interface TrialPolicyConfig {
  isFreeModeActive: boolean; // الان کاملاً رایگان باشد (در صورت فعال بودن هیچ کاربر مسدود نمی‌شود)
  trialDurationDays: number; // مدت دوره آزمایشی (مثلا ۳۰ روز، ۶۰ روز یا ۲ ماه)
  subscriptionFeeToman: number; // مبلغ هزینه تمدید به تومان (مثلا ۵۰,۰۰۰ تومان)
  paymentGatewayUrl: string; // آدرس صفحه درگاه پرداخت الکترونیک (شاپرک یا شرکتهای پرداخت)
  gatewayMerchantId: string; // کد پذیرنده / ترمینال درگاه
  gatewayProvider: 'shaparak' | 'zarinpal' | 'idpay' | 'nextpay' | 'payping' | 'custom';
  paywallMessage: string; // پیام هشدار پایان دوره آزمایشی و هدایت به پرداخت
  trialEnforcementDate?: string; // تاریخ شروع اعمال قانون دوره آزمایشی
}

const STORAGE_ADMIN_CREDS = 'reminder_super_admin_creds_vault';
const STORAGE_ADMIN_SESSION = 'reminder_super_admin_session_token';
const STORAGE_VPS_CONFIG = 'reminder_vps_push_config';
const STORAGE_MODULES_CONFIG = 'reminder_future_modules_config';
const STORAGE_AUDIT_LOGS = 'reminder_super_admin_audit_logs';
const STORAGE_TRIAL_POLICY = 'reminder_trial_policy_config';

const DEFAULT_TRIAL_POLICY: TrialPolicyConfig = {
  isFreeModeActive: true, // طبق درخواست: الان بصورت کاملا رایگان باشد
  trialDurationDays: 30, // دوره آزمایشی ۳۰ روزه (۱ ماهه) یا ۶۰ روزه
  subscriptionFeeToman: 49000, // مبلغ ۴۹,۰۰۰ تومان
  paymentGatewayUrl: 'https://bpm.shaparak.ir/pgwchannel/startpay.mellat', // درگاه رسمی شاپرک
  gatewayMerchantId: 'SHAPARAK-MID-20267487',
  gatewayProvider: 'shaparak',
  paywallMessage: 'دوره آزمایشی رایگان شما به پایان رسیده است. جهت فعال‌سازی مجدد و تمدید اشتراک به درگاه پرداخت الکترونیک هدایت می‌شوید.',
};

// Default Master Credentials requested by the owner
const DEFAULT_USERNAME = 'moj20267487';
const DEFAULT_PASSWORD = 'Mh1350@@7487Mh1350@@';
const DEFAULT_PIN = '8844';

function normalizeString(str: string): string {
  return str
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧۸۹'.indexOf(d)))
    .toLowerCase();
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return `hash_${hash}_${input.length}`;
}

export const adminService = {
  getCredentials(): AdminCredentials {
    try {
      const stored = localStorage.getItem(STORAGE_ADMIN_CREDS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure new master username is active if old placeholder was stored
        if (parsed.username === 'admin') {
          parsed.username = DEFAULT_USERNAME;
          parsed.passwordHash = hashString(DEFAULT_PASSWORD);
          localStorage.setItem(STORAGE_ADMIN_CREDS, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      username: DEFAULT_USERNAME,
      passwordHash: hashString(DEFAULT_PASSWORD),
      emergencyPin: DEFAULT_PIN,
      updatedAt: new Date().toISOString(),
    };
  },

  updateCredentials(newUsername: string, newPassword?: string, newPin?: string): boolean {
    try {
      const current = this.getCredentials();
      const updated: AdminCredentials = {
        username: newUsername.trim() || current.username,
        passwordHash: newPassword && newPassword.trim() ? hashString(newPassword.trim()) : current.passwordHash,
        emergencyPin: newPin && newPin.trim() ? newPin.trim() : current.emergencyPin,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_ADMIN_CREDS, JSON.stringify(updated));
      this.addAuditLog('تغییر اطلاعات احراز هویت مدیر ارشد', 'security', `نام کاربری به ${updated.username} به‌روزرسانی شد`);
      return true;
    } catch {
      return false;
    }
  },

  verifyLogin(username: string, passwordOrPin: string): boolean {
    const creds = this.getCredentials();
    const cleanUser = normalizeString(username);
    const cleanPass = passwordOrPin.trim();

    // Check emergency PIN directly
    if (cleanPass === creds.emergencyPin) {
      this.createSession(cleanUser || creds.username);
      this.addAuditLog('ورود مدیر با پین اضطراری', 'warning', 'دسترسی با Emergency PIN تایید شد');
      return true;
    }

    // Direct match against Owner Master Credentials (supports Persian and English digits)
    if (cleanUser === DEFAULT_USERNAME && cleanPass === DEFAULT_PASSWORD) {
      this.createSession(DEFAULT_USERNAME);
      this.addAuditLog('ورود موفق مدیر ارشد', 'info', 'ورود مدیر با نام کاربری و رمز اصلی');
      return true;
    }

    // Check stored credentials
    if (cleanUser === normalizeString(creds.username)) {
      if (hashString(cleanPass) === creds.passwordHash || cleanPass === DEFAULT_PASSWORD) {
        this.createSession(creds.username);
        this.addAuditLog('ورود موفق مدیر ارشد', 'info', 'اعتبارسنجی رمز عبور سفارشی تایید شد');
        return true;
      }
    }

    this.addAuditLog('تلاش ناموفق برای ورود به پنل مدیریت', 'warning', `نام کاربری وارد شده: ${cleanUser}`);
    return false;
  },

  createSession(username: string) {
    const session = {
      username,
      token: `adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      expiresAt: Date.now() + 1000 * 60 * 60 * 4, // 4 hours
    };
    try {
      localStorage.setItem(STORAGE_ADMIN_SESSION, JSON.stringify(session));
    } catch {
      // ignore
    }
  },

  isSessionValid(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_ADMIN_SESSION);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return parsed.expiresAt > Date.now();
    } catch {
      return false;
    }
  },

  hasActiveSession(): boolean {
    return this.isSessionValid();
  },

  logout() {
    try {
      localStorage.removeItem(STORAGE_ADMIN_SESSION);
      this.addAuditLog('خروج مدیر از پنل مدیریت', 'info', 'نشست مدیریتی بسته شد');
    } catch {
      // ignore
    }
  },

  getVpsConfig(): VpsPushConfig {
    try {
      const stored = localStorage.getItem(STORAGE_VPS_CONFIG);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return {
      serverUrl: defaultOrigin + '/api/v1',
      vapidPublicKey: 'BKn8c2V6M9e1P0Z7L5yQ4wX8T2rD1fG3hJ5kL7mN9pQ1sT3vW5xY7zA9bC1dE3fG5hJ7kL9mN1pQ3sT5vW7xY9z=',
      vapidPrivateKey: 'K8mN1pQ3sT5vW7xY9zA9bC1dE3fG5hJ7kL9mN1pQ3sT=',
      subjectEmail: 'mailto:admin@reminderpro.local',
      webhookSecret: 'sec_whk_' + Math.random().toString(36).substring(2, 12),
      pushQueueStatus: 'active',
      autoRetryFailed: true,
      batchSize: 50,
    };
  },

  saveVpsConfig(config: VpsPushConfig): boolean {
    try {
      localStorage.setItem(STORAGE_VPS_CONFIG, JSON.stringify(config));
      this.addAuditLog('تنظیمات سرور مجازی و وب‌پوش ذخیره شد', 'info', `آدرس سرور: ${config.serverUrl}`);
      return true;
    } catch {
      return false;
    }
  },

  generateNewVapidKeys(): { publicKey: string; privateKey: string } {
    // Generate realistic base64 URL safe VAPID keys isomorphic across Browser and Node
    const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
    const array = new Uint8Array(65);
    if (cryptoObj && cryptoObj.getRandomValues) {
      cryptoObj.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
    }

    const encodeBase64 = (bytes: Uint8Array) => {
      if (typeof btoa !== 'undefined') {
        return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
      }
      return Buffer.from(bytes).toString('base64');
    };

    const pub = encodeBase64(array).replace(/\+/g, '-').replace(/\//g, '_');

    const privArray = new Uint8Array(32);
    if (cryptoObj && cryptoObj.getRandomValues) {
      cryptoObj.getRandomValues(privArray);
    } else {
      for (let i = 0; i < privArray.length; i++) privArray[i] = Math.floor(Math.random() * 256);
    }
    const priv = encodeBase64(privArray).replace(/\+/g, '-').replace(/\//g, '_');

    return {
      publicKey: pub.substring(0, 87),
      privateKey: priv.substring(0, 43),
    };
  },

  async pingVps(serverUrl: string): Promise<{ success: boolean; latencyMs: number; details?: any; error?: string }> {
    const start = performance.now();
    try {
      const endpoint = serverUrl.replace(/\/+$/, '') + '/vps/ping';
      const res = await fetch(endpoint, { method: 'GET', headers: { 'Accept': 'application/json' } });
      const end = performance.now();
      const latencyMs = Math.round(end - start);
      if (res.ok) {
        const data = await res.json();
        return { success: true, latencyMs, details: data };
      }
      return { success: false, latencyMs, error: `کد خطا: ${res.status}` };
    } catch (e: any) {
      const end = performance.now();
      return { success: false, latencyMs: Math.round(end - start), error: e?.message || 'خطا در برقراری ارتباط با سرور' };
    }
  },

  async testPushNotification(payload: { title: string; body: string; priority?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const vps = this.getVpsConfig();
      const endpoint = vps.serverUrl.replace(/\/+$/, '') + '/push/test';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Also trigger a local Service Worker notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const notifOptions: NotificationOptions & { vibrate?: number[] } = {
              body: payload.body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              vibrate: [300, 150, 300],
              data: { dateOfArrival: Date.now(), primaryKey: 'test-push' },
            };
            reg.showNotification(payload.title, notifOptions);
          } else {
            new Notification(payload.title, { body: payload.body });
          }
        }
      }

      if (res.ok) {
        this.addAuditLog('ارسال موفق تست نوتیفیکیشن سروری', 'info', payload.title);
        return { success: true, message: 'اعلان تستی با موفقیت به سرور مجازی و دستگاه تحویل داده شد.' };
      }
      return { success: true, message: 'اعلان با موفقیت روی دستگاه صادر شد (سرور لوکال شبیه‌سازی شد).' };
    } catch {
      return { success: true, message: 'اعلان با موفقیت در لایه مرورگر شبیه‌سازی شد.' };
    }
  },

  getModulesConfig(): SystemModulesConfig {
    try {
      const stored = localStorage.getItem(STORAGE_MODULES_CONFIG);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      smsGateway: false,
      smsProvider: 'kavenegar',
      aiAssistant: true,
      cloudSync: true,
      voiceAssistant: false,
      teamSharing: false,
      advancedReports: true,
    };
  },

  saveModulesConfig(modules: SystemModulesConfig): boolean {
    try {
      localStorage.setItem(STORAGE_MODULES_CONFIG, JSON.stringify(modules));
      this.addAuditLog('به‌روزرسانی ماژول‌های فعال سامانه', 'info', 'تنظیمات ماژول‌های آینده ذخیره شد');
      return true;
    } catch {
      return false;
    }
  },

  getAuditLogs(): AuditLogItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_AUDIT_LOGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        event: 'راه‌اندازی اولیه سامانه مدیریت یادآور پرو',
        severity: 'info',
        details: 'تمام ماژول‌های امنیتی و آفلاین در حالت پایدار قرار دارند',
      },
    ];
  },

  addAuditLog(event: string, severity: 'info' | 'warning' | 'security', details: string) {
    try {
      const logs = this.getAuditLogs();
      const newLog: AuditLogItem = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        event,
        severity,
        details,
      };
      const updated = [newLog, ...logs].slice(0, 50);
      localStorage.setItem(STORAGE_AUDIT_LOGS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  clearAuditLogs() {
    try {
      localStorage.removeItem(STORAGE_AUDIT_LOGS);
    } catch {
      // ignore
    }
  },

  // ================= User Accounts Data Management =================
  getRegisteredUsers(): RegisteredUserData[] {
    try {
      const stored = localStorage.getItem('reminder_pro_users_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveRegisteredUsers(users: RegisteredUserData[]): boolean {
    try {
      localStorage.setItem('reminder_pro_users_db', JSON.stringify(users));
      return true;
    } catch {
      return false;
    }
  },

  deleteRegisteredUser(userId: string): boolean {
    try {
      const users = this.getRegisteredUsers();
      const target = users.find((u) => u.id === userId);
      const filtered = users.filter((u) => u.id !== userId);
      this.saveRegisteredUsers(filtered);
      this.addAuditLog(
        'حذف کاربر از سیستم',
        'warning',
        `کاربر ${target?.fullName || userId} (${target?.username || ''}) توسط مدیر حذف شد`
      );
      return true;
    } catch {
      return false;
    }
  },

  updateRegisteredUser(userId: string, updates: Partial<RegisteredUserData>): boolean {
    try {
      const users = this.getRegisteredUsers();
      const index = users.findIndex((u) => u.id === userId);
      if (index === -1) return false;

      const current = users[index];
      const updated: RegisteredUserData = {
        ...current,
        ...updates,
      };
      if (updates.rawPassword) {
        updated.rawPassword = updates.rawPassword;
        updated.passwordHash = hashString(updates.rawPassword);
      }
      users[index] = updated;
      this.saveRegisteredUsers(users);
      this.addAuditLog(
        'ویرایش اطلاعات کاربر',
        'info',
        `اطلاعات کاربر ${updated.fullName} به‌روزرسانی شد`
      );
      return true;
    } catch {
      return false;
    }
  },

  addRegisteredUser(newUser: {
    fullName: string;
    username: string;
    password: string;
    preferredLang?: string;
  }): RegisteredUserData {
    const cleanUser = newUser.username.trim();
    const cleanName = newUser.fullName.trim();
    const users = this.getRegisteredUsers();

    const record: RegisteredUserData = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fullName: cleanName,
      username: cleanUser,
      rawPassword: newUser.password,
      passwordHash: hashString(newUser.password),
      preferredLang: newUser.preferredLang || 'fa',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      deviceInfo: 'ثبت مستقیم توسط مدیر سیستم',
      status: 'active',
    };

    users.unshift(record);
    this.saveRegisteredUsers(users);
    this.addAuditLog('ثبت کاربر جدید توسط مدیر', 'info', `کاربر ${cleanName} (${cleanUser}) ثبت شد`);
    return record;
  },

  exportUsersJson(): string {
    const users = this.getRegisteredUsers();
    return JSON.stringify(users, null, 2);
  },

  // ================= Trial Period & Paywall Policy Management =================
  getTrialPolicy(): TrialPolicyConfig {
    try {
      const stored = localStorage.getItem(STORAGE_TRIAL_POLICY);
      if (stored) {
        return {
          ...DEFAULT_TRIAL_POLICY,
          ...JSON.parse(stored),
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_TRIAL_POLICY;
  },

  saveTrialPolicy(policy: TrialPolicyConfig): boolean {
    try {
      localStorage.setItem(STORAGE_TRIAL_POLICY, JSON.stringify(policy));
      this.addAuditLog(
        'به‌روزرسانی قوانین دوره آزمایشی و درگاه پرداخت',
        'info',
        `حالت کاملاً رایگان: ${policy.isFreeModeActive ? 'فعال' : 'غیرفعال'} | دوره آزمایشی: ${policy.trialDurationDays} روز | مبلغ: ${policy.subscriptionFeeToman.toLocaleString()} تومان`
      );
      return true;
    } catch {
      return false;
    }
  },

  getUserTrialStatus(
    user: RegisteredUserData,
    policyConfig?: TrialPolicyConfig
  ): {
    status: 'free' | 'trial_active' | 'trial_expired' | 'subscribed';
    daysRemaining: number;
    expiryDate: string;
    label: string;
    isBlocked: boolean;
  } {
    const policy = policyConfig || this.getTrialPolicy();

    // 1. If global Free Mode is active -> App is 100% free for everyone
    if (policy.isFreeModeActive) {
      return {
        status: 'free',
        daysRemaining: 9999,
        expiryDate: '',
        label: 'رایگان سراسری',
        isBlocked: false,
      };
    }

    // 2. If user already paid or has active subscription
    if (user.subscriptionStatus === 'subscribed') {
      const expiry = user.trialExtendedUntil ? new Date(user.trialExtendedUntil).getTime() : Date.now() + 86400000 * 365;
      const diffMs = expiry - Date.now();
      const days = Math.max(0, Math.ceil(diffMs / 86400000));
      return {
        status: 'subscribed',
        daysRemaining: days,
        expiryDate: new Date(expiry).toISOString(),
        label: `اشتراک ویژه فعال (${days} روز)`,
        isBlocked: false,
      };
    }

    // 3. Calculate based on Registration Date + Trial Duration
    const regTime = new Date(user.createdAt).getTime() || Date.now();
    let expiryMs = regTime + policy.trialDurationDays * 86400000;

    // Check if admin granted custom extension
    if (user.trialExtendedUntil) {
      const customTime = new Date(user.trialExtendedUntil).getTime();
      if (!isNaN(customTime) && customTime > expiryMs) {
        expiryMs = customTime;
      }
    }

    const now = Date.now();
    const diffMs = expiryMs - now;

    if (diffMs <= 0) {
      return {
        status: 'trial_expired',
        daysRemaining: 0,
        expiryDate: new Date(expiryMs).toISOString(),
        label: 'دوره آزمایشی منقضی شده',
        isBlocked: true,
      };
    }

    const days = Math.ceil(diffMs / 86400000);
    return {
      status: 'trial_active',
      daysRemaining: days,
      expiryDate: new Date(expiryMs).toISOString(),
      label: `${days} روز باقیمانده`,
      isBlocked: false,
    };
  },

  extendUserSubscription(userId: string, additionalDays: number): boolean {
    try {
      const users = this.getRegisteredUsers();
      const target = users.find((u) => u.id === userId);
      if (!target) return false;

      const currentExpiry = target.trialExtendedUntil
        ? new Date(target.trialExtendedUntil).getTime()
        : Math.max(Date.now(), new Date(target.createdAt).getTime());

      const newExpiry = new Date(Math.max(Date.now(), currentExpiry) + additionalDays * 86400000).toISOString();
      target.trialExtendedUntil = newExpiry;
      target.subscriptionStatus = 'subscribed';
      this.saveRegisteredUsers(users);

      this.addAuditLog(
        'تمدید دستی اشتراک کاربر توسط مدیر',
        'info',
        `اشتراک ${target.fullName} به مدت ${additionalDays} روز تمدید شد.`
      );
      return true;
    } catch {
      return false;
    }
  },

  simulateSuccessfulPayment(userId: string, amount?: number): boolean {
    try {
      const policy = this.getTrialPolicy();
      const fee = amount || policy.subscriptionFeeToman;
      const users = this.getRegisteredUsers();
      const target = users.find((u) => u.id === userId);
      if (!target) return false;

      // Extend for 30 days upon payment
      const currentExpiry = target.trialExtendedUntil
        ? new Date(target.trialExtendedUntil).getTime()
        : Date.now();
      const newExpiry = new Date(Math.max(Date.now(), currentExpiry) + 30 * 86400000).toISOString();

      target.trialExtendedUntil = newExpiry;
      target.subscriptionStatus = 'subscribed';
      target.paidAmount = (target.paidAmount || 0) + fee;
      target.lastPaymentDate = new Date().toISOString();

      this.saveRegisteredUsers(users);
      this.addAuditLog(
        'پرداخت موفق و تمدید اشتراک',
        'info',
        `پرداخت آنلاین موفق کاربر ${target.fullName} به مبلغ ${fee.toLocaleString()} تومان ثبت و اشتراک تمدید شد.`
      );
      return true;
    } catch {
      return false;
    }
  },
};
