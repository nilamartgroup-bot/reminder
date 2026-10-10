import React, { useState, useEffect } from 'react';
import {
  adminService,
  VpsPushConfig,
  SystemModulesConfig,
  AuditLogItem,
  RegisteredUserData,
  TrialPolicyConfig,
} from '../utils/adminService';
import { userExportService } from '../utils/userExportService';
import { useReminders, ReminderItem } from '../context/ReminderContext';
import { useLanguage } from '../context/LanguageContext';
import { formatAppDate } from '../utils/jalali';
import {
  Shield,
  Server,
  Activity,
  Users,
  Bell,
  Cpu,
  Lock,
  Database,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
  Copy,
  Check,
  Trash2,
  Search,
  Sliders,
  Sparkles,
  MessageSquare,
  Cloud,
  Share2,
  Mic,
  PieChart,
  Terminal,
  Layers,
  Eye,
  EyeOff,
  UserPlus,
  Phone,
  Calendar,
  Globe,
  Smartphone,
  Download,
  Key,
  Edit3,
  User,
  X,
  FileSpreadsheet,
  FileText,
  Settings,
  CreditCard,
  Clock,
} from 'lucide-react';

interface SuperAdminPanelProps {
  onBackToApp: () => void;
  onLock: () => void;
}

type AdminTab = 'analytics' | 'vps' | 'reminders' | 'users' | 'modules' | 'security' | 'database';

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  onBackToApp,
  onLock,
}) => {
  const { reminders, deleteReminder, toggleComplete, exportBackup, importBackup } = useReminders();
  const { language } = useLanguage();
  const isFa = language === 'fa';

  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // VPS & Push state
  const [vpsConfig, setVpsConfig] = useState<VpsPushConfig>(() => adminService.getVpsConfig());
  const [vpsStatus, setVpsStatus] = useState<'online' | 'offline' | 'checking'>('online');
  const [vpsLatency, setVpsLatency] = useState<number>(24);
  const [testPushTitle, setTestPushTitle] = useState('هشدار سررسید مهم');
  const [testPushBody, setTestPushBody] = useState('این یک اعلان سروری آزمایشی از سرور مجازی (VPS) است.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modules state
  const [modulesConfig, setModulesConfig] = useState<SystemModulesConfig>(() => adminService.getModulesConfig());

  // Security Credentials state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => adminService.getAuditLogs());

  // Registered Users Hub state
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserData[]>(() =>
    adminService.getRegisteredUsers()
  );
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLangFilter, setUsersLangFilter] = useState<'all' | 'fa' | 'en'>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [selectedUserDetails, setSelectedUserDetails] = useState<RegisteredUserData | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserNameInput, setNewUserNameInput] = useState('');
  const [newUserPhoneInput, setNewUserPhoneInput] = useState('');
  const [newUserPassInput, setNewUserPassInput] = useState('');
  const [newUserLangInput, setNewUserLangInput] = useState('fa');
  const [editingUser, setEditingUser] = useState<RegisteredUserData | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editPhoneInput, setEditPhoneInput] = useState('');
  const [editPassInput, setEditPassInput] = useState('');
  const [editStatusInput, setEditStatusInput] = useState<'active' | 'suspended'>('active');

  const refreshUsersList = () => {
    setRegisteredUsers(adminService.getRegisteredUsers());
    showToast(isFa ? 'لیست کاربران به‌روزرسانی شد' : 'Users list refreshed');
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(isFa ? `آیا از حذف حساب کاربر «${name}» اطمینان دارید؟` : `Delete user "${name}"?`)) {
      adminService.deleteRegisteredUser(userId);
      setRegisteredUsers(adminService.getRegisteredUsers());
      showToast(isFa ? `حساب کاربری ${name} با موفقیت حذف شد` : 'User deleted successfully');
      if (selectedUserDetails?.id === userId) {
        setSelectedUserDetails(null);
      }
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserNameInput.trim() || !newUserPhoneInput.trim() || !newUserPassInput.trim()) {
      showToast(isFa ? 'لطفاً تمامی فیلدهای الزامی را تکمیل کنید' : 'Please fill all required fields');
      return;
    }
    adminService.addRegisteredUser({
      fullName: newUserNameInput.trim(),
      username: newUserPhoneInput.trim(),
      password: newUserPassInput.trim(),
      preferredLang: newUserLangInput,
    });
    setRegisteredUsers(adminService.getRegisteredUsers());
    setIsAddUserModalOpen(false);
    setNewUserNameInput('');
    setNewUserPhoneInput('');
    setNewUserPassInput('');
    showToast(isFa ? 'کاربر جدید با موفقیت ثبت شد' : 'User created successfully');
  };

  const handleOpenEditModal = (user: RegisteredUserData) => {
    setEditingUser(user);
    setEditNameInput(user.fullName);
    setEditPhoneInput(user.username);
    setEditPassInput(user.rawPassword || '');
    setEditStatusInput(user.status || 'active');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editNameInput.trim() || !editPhoneInput.trim()) {
      showToast(isFa ? 'نام و شماره تماس الزامی هستند' : 'Name and phone are required');
      return;
    }
    adminService.updateRegisteredUser(editingUser.id, {
      fullName: editNameInput.trim(),
      username: editPhoneInput.trim(),
      rawPassword: editPassInput.trim() ? editPassInput.trim() : editingUser.rawPassword,
      status: editStatusInput,
    });
    const updatedList = adminService.getRegisteredUsers();
    setRegisteredUsers(updatedList);
    if (selectedUserDetails?.id === editingUser.id) {
      const updated = updatedList.find((u) => u.id === editingUser.id);
      if (updated) setSelectedUserDetails(updated);
    }
    setEditingUser(null);
    showToast(isFa ? 'اطلاعات کاربر با موفقیت به‌روزرسانی شد' : 'User updated successfully');
  };

  const handleExportUsersJson = () => {
    const jsonStr = adminService.exportUsersJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registered_users_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(isFa ? 'فایل JSON اطلاعات کاربران دانلود شد' : 'Users JSON exported');
  };

  // Trial Policy State
  const [trialPolicy, setTrialPolicy] = useState<TrialPolicyConfig>(() =>
    adminService.getTrialPolicy()
  );
  const [isTrialPolicyModalOpen, setIsTrialPolicyModalOpen] = useState(false);
  const [policyFreeModeInput, setPolicyFreeModeInput] = useState(() => trialPolicy.isFreeModeActive);
  const [policyDurationInput, setPolicyDurationInput] = useState(() => trialPolicy.trialDurationDays);
  const [policyFeeInput, setPolicyFeeInput] = useState(() => trialPolicy.subscriptionFeeToman);
  const [policyGatewayUrlInput, setPolicyGatewayUrlInput] = useState(() => trialPolicy.paymentGatewayUrl);
  const [policyMerchantIdInput, setPolicyMerchantIdInput] = useState(() => trialPolicy.gatewayMerchantId);
  const [policyMessageInput, setPolicyMessageInput] = useState(() => trialPolicy.paywallMessage);

  const handleOpenTrialPolicyModal = () => {
    const current = adminService.getTrialPolicy();
    setTrialPolicy(current);
    setPolicyFreeModeInput(current.isFreeModeActive);
    setPolicyDurationInput(current.trialDurationDays);
    setPolicyFeeInput(current.subscriptionFeeToman);
    setPolicyGatewayUrlInput(current.paymentGatewayUrl);
    setPolicyMerchantIdInput(current.gatewayMerchantId);
    setPolicyMessageInput(current.paywallMessage);
    setIsTrialPolicyModalOpen(true);
  };

  const handleSaveTrialPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TrialPolicyConfig = {
      isFreeModeActive: policyFreeModeInput,
      trialDurationDays: Number(policyDurationInput) || 30,
      subscriptionFeeToman: Number(policyFeeInput) || 49000,
      paymentGatewayUrl: policyGatewayUrlInput.trim() || 'https://bpm.shaparak.ir/pgwchannel/startpay.mellat',
      gatewayMerchantId: policyMerchantIdInput.trim() || 'SHAPARAK-MID-20267487',
      gatewayProvider: 'shaparak',
      paywallMessage:
        policyMessageInput.trim() ||
        'دوره آزمایشی رایگان شما به پایان رسیده است. جهت فعال‌سازی مجدد و تمدید اشتراک به درگاه پرداخت الکترونیک هدایت می‌شوید.',
    };
    adminService.saveTrialPolicy(updated);
    setTrialPolicy(updated);
    setIsTrialPolicyModalOpen(false);
    showToast(isFa ? 'قوانین دوره آزمایشی و درگاه پرداخت ذخیره شد' : 'Trial policy updated');
  };

  const handleExtendUserTrial = (userId: string, name: string, days = 30) => {
    adminService.extendUserSubscription(userId, days);
    setRegisteredUsers(adminService.getRegisteredUsers());
    showToast(isFa ? `اشتراک ${name} به مدت ${days} روز تمدید شد` : `Extended by ${days} days`);
  };

  const handleSimulatePaymentForUser = (userId: string, name: string) => {
    adminService.simulateSuccessfulPayment(userId);
    setRegisteredUsers(adminService.getRegisteredUsers());
    showToast(isFa ? `پرداخت موفق تستی برای ${name} ثبت و اشتراک تمدید شد` : 'Payment simulated');
  };

  const handleExportXlsx = () => {
    userExportService.exportToXlsx(filteredUsers, trialPolicy, isFa);
    showToast(isFa ? 'فایل اکسل (.xlsx) راست‌چین با موفقیت دانلود شد' : 'Excel (.xlsx) downloaded');
  };

  const handleExportPdf = () => {
    userExportService.exportToPdf(filteredUsers, trialPolicy, isFa);
    showToast(isFa ? 'پیش‌نمایش چاپ و خروجی PDF آماده شد' : 'PDF print preview ready');
  };

  const handleCopyUserSummary = (user: RegisteredUserData) => {
    const details = `📋 اطلاعات ثبت‌نامی کاربر:
• نام و نام خانوادگی: ${user.fullName}
• شماره همراه / نام کاربری: ${user.username}
• کلمه عبور ثبت‌نامی: ${user.rawPassword || 'محفوظ'}
• زبان انتخابی: ${user.preferredLang === 'fa' ? 'فارسی' : user.preferredLang}
• تاریخ و زمان ثبت‌نام: ${formatAppDate(user.createdAt, language, true)}
• وضعیت حساب: ${user.status === 'active' ? 'فعال' : 'معلق'}
• دستگاه و پلتفرم: ${user.deviceInfo || 'نامشخص'}
• شناسه یکتا در سیستم: ${user.id}`;
    navigator.clipboard.writeText(details);
    showToast(isFa ? 'اطلاعات کامل ثبت‌نام کاربر کپی شد' : 'User info copied to clipboard');
  };

  // Reminders Hub Search & Filter
  const [remindersSearch, setRemindersSearch] = useState('');
  const [remindersFilter, setRemindersFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Ping VPS on mount
  useEffect(() => {
    checkVpsConnection();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const checkVpsConnection = async () => {
    setVpsStatus('checking');
    const res = await adminService.pingVps(vpsConfig.serverUrl);
    if (res.success) {
      setVpsStatus('online');
      setVpsLatency(res.latencyMs);
    } else {
      setVpsStatus('offline');
      setVpsLatency(res.latencyMs);
    }
  };

  const handleSaveVpsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    adminService.saveVpsConfig(vpsConfig);
    showToast(isFa ? 'تنظیمات سرور مجازی و وب‌پوش ذخیره شد' : 'VPS configuration saved successfully');
    checkVpsConnection();
  };

  const handleGenerateVapid = () => {
    const keys = adminService.generateNewVapidKeys();
    setVpsConfig((prev) => ({
      ...prev,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
    }));
    showToast(isFa ? 'کلیدهای VAPID جدید با موفقیت تولید شدند' : 'New VAPID keys generated');
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    const res = await adminService.testPushNotification({
      title: testPushTitle,
      body: testPushBody,
      priority: 'high',
    });
    setIsSendingTest(false);
    showToast(res.message);
  };

  const handleToggleModule = (key: keyof SystemModulesConfig) => {
    const updated = {
      ...modulesConfig,
      [key]: !modulesConfig[key],
    };
    setModulesConfig(updated);
    adminService.saveModulesConfig(updated);
    showToast(isFa ? 'وضعیت ماژول به‌روزرسانی شد' : 'Module state updated');
  };

  const handleUpdateSecurityCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() && !newPassword.trim() && !newPin.trim()) {
      showToast(isFa ? 'حداقل یکی از موارد را برای تغییر وارد کنید' : 'Enter at least one field to update');
      return;
    }
    const ok = adminService.updateCredentials(newUsername, newPassword, newPin);
    if (ok) {
      showToast(isFa ? 'اطلاعات امنیتی مدیر با موفقیت ذخیره شد' : 'Admin credentials updated successfully');
      setNewPassword('');
      setNewPin('');
      setAuditLogs(adminService.getAuditLogs());
    } else {
      showToast(isFa ? 'خطا در ثبت اطلاعات' : 'Error updating credentials');
    }
  };

  const handleCopyServerWorkerScript = () => {
    const serverScript = `// server-push-worker.js (VPS Standalone Daemon)
const webpush = require('web-push');
const express = require('express');
const app = express();
app.use(express.json());

const VAPID_PUBLIC = '${vpsConfig.vapidPublicKey}';
const VAPID_PRIVATE = '${vpsConfig.vapidPrivateKey}';
const VAPID_SUBJECT = '${vpsConfig.subjectEmail}';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// Dispatches push even when user's phone is asleep or screen is locked
app.post('/api/v1/dispatch-push', async (req, res) => {
  const { subscription, payload } = req.body;
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('VPS Notification Worker running on port 3000'));`;

    navigator.clipboard.writeText(serverScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    showToast(isFa ? 'اسکریپت کامل سرور کپی شد' : 'Server script copied to clipboard');
  };

  // Filter reminders
  const filteredReminders = reminders.filter((item) => {
    const matchQuery = item.title.toLowerCase().includes(remindersSearch.toLowerCase());
    if (!matchQuery) return false;
    if (remindersFilter === 'pending') return !item.isCompleted;
    if (remindersFilter === 'completed') return item.isCompleted;
    return true;
  });

  // Filter registered users
  const filteredUsers = registeredUsers.filter((u) => {
    const q = usersSearch.toLowerCase().trim();
    if (q) {
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchPhone = u.username.toLowerCase().includes(q);
      const matchId = u.id.toLowerCase().includes(q);
      const matchPass = u.rawPassword && u.rawPassword.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId && !matchPass) return false;
    }
    if (usersLangFilter !== 'all' && u.preferredLang !== usersLangFilter) {
      return false;
    }
    return true;
  });

  const completedCount = reminders.filter((r) => r.isCompleted).length;
  const pendingCount = reminders.length - completedCount;
  const audioCount = reminders.filter((r) => r.soundAlert).length;
  const completionRate = reminders.length > 0 ? Math.round((completedCount / reminders.length) * 100) : 0;

  return (
    <div className="h-screen h-dvh max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-3 start-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-2xl border border-indigo-400 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER: Non-scrolling fixed bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-3 flex-shrink-0">
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-indigo-800 p-0.5 shadow-md shadow-indigo-600/30 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black text-white tracking-tight">
                {isFa ? 'مرکز فرماندهی و سوپر پنل مدیریت' : 'Super Admin Command Hub'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                MASTER
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{isFa ? 'دسترسی ریشه و زیرساخت ابری' : 'Root Infrastructure & VPS'}</span>
              <span>•</span>
              <span>{formatAppDate(new Date(), language, false)}</span>
            </div>
          </div>
        </div>

        {/* Right: VPS Live Status + Return to App + Lock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* VPS Live Badge */}
          <button
            onClick={checkVpsConnection}
            title={isFa ? 'برای تست مجدد کلیک کنید' : 'Click to re-ping'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono cursor-pointer hover:border-slate-700 transition"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                vpsStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : vpsStatus === 'checking'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300 font-sans hidden sm:inline">
              {isFa ? 'سرور مجازی:' : 'VPS:'}
            </span>
            <span
              className={`font-bold ${
                vpsStatus === 'online'
                  ? 'text-emerald-400'
                  : vpsStatus === 'checking'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {vpsStatus === 'online' ? `${vpsLatency}ms` : vpsStatus === 'checking' ? '...' : 'آفلاین'}
            </span>
          </button>

          {/* Return to Main App */}
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            title={isFa ? 'بازگشت به اپلیکیشن اصلی' : 'Back to App'}
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="hidden xs:inline sm:inline">
              {isFa ? 'بازگشت به برنامه' : 'Back to App'}
            </span>
          </button>

          {/* Quick Lock / Logout */}
          <button
            onClick={onLock}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 border border-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title={isFa ? 'قفل فوری پنل' : 'Lock Panel'}
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{isFa ? 'قفل پنل' : 'Lock'}</span>
          </button>
        </div>
      </header>

      {/* COMPACT TAB SELECTOR: Horizontal Bar */}
      <nav className="h-11 border-b border-slate-800/80 bg-slate-950 px-2 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isFa ? 'داشبورد زنده' : 'Dashboard'}</span>
        </button>

        <button
          onClick={() => setActiveTab('vps')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'vps'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>{isFa ? 'سرور مجازی و وب‌پوش VPS' : 'VPS & Push'}</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'reminders'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{isFa ? 'مدیریت یادآوری‌ها' : 'Reminders'}</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isFa ? 'اطلاعات کاربران ثبت‌نامی' : 'Registered Users'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-mono">
            {registeredUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'modules'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isFa ? 'ماژول‌های آینده' : 'Future Modules'}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{isFa ? 'امنیت و کلیدها' : 'Security & Vault'}</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'database'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isFa ? 'پشتیبان و دیتابیس' : 'Backup & DB'}</span>
        </button>
      </nav>

      {/* MAIN VIEWPORT: Strictly No Window Scroll (flex-1 overflow-hidden) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-4 overflow-hidden flex flex-col min-h-0">
        {/* ==================== TAB 1: ANALYTICS DASHBOARD ==================== */}
        {activeTab === 'analytics' && (
          <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden animate-fade-in">
            {/* Top 4 KPI Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 flex-shrink-0">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">{isFa ? 'کل یادآوری‌ها' : 'Total Reminders'}</div>
                  <div className="text-lg sm:text-xl font-extrabold text-white">{reminders.length}</div>
                  <div className="text-[10px] text-indigo-300">{audioCount} {isFa ? 'دارای آلارم صوتی' : 'with audio'}</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">{isFa ? 'انجام شده / فعال' : 'Completed / Active'}</div>
                  <div className="text-lg sm:text-xl font-extrabold text-white">{completedCount} / {pendingCount}</div>
                  <div className="text-[10px] text-emerald-400">{completionRate}% {isFa ? 'نرخ انجام' : 'Rate'}</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">{isFa ? 'زیرساخت سرور مجازی' : 'VPS Worker'}</div>
                  <div className="text-lg sm:text-xl font-extrabold text-white">{vpsLatency}ms</div>
                  <div className="text-[10px] text-emerald-400 font-bold">{isFa ? 'فعال و گوش‌به‌زنگ' : 'Active & Listening'}</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">{isFa ? 'حافظه محلی دیتابیس' : 'Database Footprint'}</div>
                  <div className="text-lg sm:text-xl font-extrabold text-white">IndexedDB</div>
                  <div className="text-[10px] text-cyan-300">{isFa ? 'سریع و امن آفلاین' : 'Zero Quota Lag'}</div>
                </div>
              </div>
            </div>

            {/* Middle Grid: Telemetry & System Health */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0 overflow-hidden">
              {/* Telemetry Card */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>{isFa ? 'مانیتورینگ عملکرد و پردازش پس‌زمینه' : 'System & Daemon Status'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    {isFa ? '۱۰۰٪ پایدار' : '100% Operational'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">{isFa ? 'سرویس‌ورکر قفل صفحه' : 'Lock-Screen SW'}</span>
                    <span className="font-bold text-emerald-400">Active (v2.4)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">{isFa ? 'پروتکل وب‌پوش' : 'WebPush Protocol'}</span>
                    <span className="font-bold text-indigo-300">W3C VAPID Push</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">{isFa ? 'موتور بیداری صفحه' : 'Wake Lock API'}</span>
                    <span className="font-bold text-emerald-400">Screen WakeLock ON</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">{isFa ? 'همگام‌سازی ابری' : 'Cloud Sync Protocol'}</span>
                    <span className="font-bold text-amber-400">CRDT Vector Clock</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200">
                  {isFa
                    ? 'سامانه هوشمند یادآور پرو در هر دو لایه مرورگر (آفلاین) و سرور مجازی (Push Server) هماهنگ عمل می‌کند.'
                    : 'Hybrid offline-first client synchronized with lightweight VPS push daemon.'}
                </div>
              </div>

              {/* Quick Actions & Audit Snapshot */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>{isFa ? 'آخرین لاگ‌های سیستمی مدیر' : 'Recent System Audit Trail'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {auditLogs.length} {isFa ? 'ثبت' : 'entries'}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5 py-2 overflow-y-auto max-h-36 no-scrollbar">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="p-1.5 rounded-lg bg-slate-950 text-[10px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          log.severity === 'security' ? 'bg-amber-400' : log.severity === 'warning' ? 'bg-rose-400' : 'bg-emerald-400'
                        }`} />
                        <span className="text-slate-200 truncate">{log.event}</span>
                      </div>
                      <span className="text-slate-500 font-mono flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => setActiveTab('vps')}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-bold text-center transition cursor-pointer"
                  >
                    {isFa ? 'پیکربندی سرور VPS ←' : 'Configure VPS ←'}
                  </button>
                  <button
                    onClick={() => setActiveTab('modules')}
                    className="py-1.5 px-3 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-[11px] font-bold text-center transition cursor-pointer"
                  >
                    {isFa ? 'مدیریت ماژول‌ها ←' : 'Manage Modules ←'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: VPS & WEBPUSH INFRASTRUCTURE ==================== */}
        {activeTab === 'vps' && (
          <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden animate-fade-in">
            {/* Guide & Architecture Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/60 border border-indigo-500/30 flex-shrink-0 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {isFa ? 'معماری سرور مجازی و ارسال نوتیفیکیشن در حالت خاموش' : 'VPS & Push Architecture Guide'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {isFa
                      ? 'وقتی کاربر داخل اپلیکیشن نیست یا گوشی قفل است، سرور مجازی لینوکس (VPS) از طریق پروتکل استاندارد W3C WebPush و کلیدهای VAPID، پیام بیداری را مستقیماً به سرورهای پوش گوگل/اپل می‌فرستد تا صفحه کاربر روشن شده و آلارم پخش شود.'
                      : 'When the phone screen is locked or browser is closed, the VPS push daemon triggers OS-level notifications with Action buttons via VAPID keys.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyServerWorkerScript}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 flex-shrink-0 transition active:scale-95 cursor-pointer shadow-md"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isFa ? 'کپی اسکریپت سرور' : 'Copy Server Code'}</span>
              </button>
            </div>

            {/* Two Column Layout: Settings & Live Dispatch Tester */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0 overflow-hidden">
              {/* Form 1: VPS & VAPID Keys Setup */}
              <form onSubmit={handleSaveVpsConfig} className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-shrink-0">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-indigo-400" />
                    {isFa ? 'تنظیمات سرور مجازی و کلیدهای VAPID' : 'VPS Endpoint & VAPID Keys'}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateVapid}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold transition cursor-pointer"
                  >
                    {isFa ? 'تولید کلیدهای جدید' : 'Generate Keys'}
                  </button>
                </div>

                <div className="space-y-2 py-2 text-xs flex-1 overflow-y-auto no-scrollbar">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                      {isFa ? 'آدرس سرور مجازی (VPS URL)' : 'VPS Endpoint URL'}
                    </label>
                    <input
                      type="text"
                      value={vpsConfig.serverUrl}
                      onChange={(e) => setVpsConfig({ ...vpsConfig, serverUrl: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                      {isFa ? 'کلید عمومی VAPID (Public Key)' : 'VAPID Public Key'}
                    </label>
                    <input
                      type="text"
                      value={vpsConfig.vapidPublicKey}
                      onChange={(e) => setVpsConfig({ ...vpsConfig, vapidPublicKey: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-[11px] text-white font-mono focus:border-indigo-500 outline-none truncate"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                      {isFa ? 'کلید خصوصی VAPID (Private Key - محرمانه)' : 'VAPID Private Key (Secret)'}
                    </label>
                    <input
                      type="password"
                      value={vpsConfig.vapidPrivateKey}
                      onChange={(e) => setVpsConfig({ ...vpsConfig, vapidPrivateKey: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-[11px] text-white font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        {isFa ? 'ایمیل تماس (Subject)' : 'Subject Email'}
                      </label>
                      <input
                        type="text"
                        value={vpsConfig.subjectEmail}
                        onChange={(e) => setVpsConfig({ ...vpsConfig, subjectEmail: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        {isFa ? 'توکن وب‌هوک امنیتی' : 'Webhook Token'}
                      </label>
                      <input
                        type="password"
                        value={vpsConfig.webhookSecret}
                        onChange={(e) => setVpsConfig({ ...vpsConfig, webhookSecret: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-shrink-0">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer text-center"
                  >
                    {isFa ? 'ذخیره تنظیمات سرور' : 'Save Config'}
                  </button>
                  <button
                    type="button"
                    onClick={checkVpsConnection}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isFa ? 'پینگ سرور' : 'Ping'}</span>
                  </button>
                </div>
              </form>

              {/* Form 2: Live Push Tester & Linux Setup Step-by-Step */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-shrink-0">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-emerald-400" />
                    {isFa ? 'تست زنده ارسال نوتیفیکیشن سروری' : 'Live Server Push Tester'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {isFa ? 'آماده ارسال' : 'Ready'}
                  </span>
                </div>

                <div className="space-y-2 py-2 text-xs flex-1 overflow-y-auto no-scrollbar">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                      {isFa ? 'عنوان اعلان تست' : 'Notification Title'}
                    </label>
                    <input
                      type="text"
                      value={testPushTitle}
                      onChange={(e) => setTestPushTitle(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                      {isFa ? 'متن اعلان تست' : 'Notification Body'}
                    </label>
                    <input
                      type="text"
                      value={testPushBody}
                      onChange={(e) => setTestPushBody(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Step-by-Step Linux Deployment Guide Box */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 font-mono text-[10px] text-slate-300 space-y-1">
                    <div className="text-amber-400 font-bold font-sans text-[11px]">
                      {isFa ? '۳ دستور راه‌اندازی سرور روی اوبونتو (VPS Linux):' : '3-step VPS Setup commands:'}
                    </div>
                    <div>1. <span className="text-indigo-300">sudo apt update && sudo apt install -y nodejs npm</span></div>
                    <div>2. <span className="text-indigo-300">npm install express web-push pm2 -g</span></div>
                    <div>3. <span className="text-indigo-300">pm2 start server-push-worker.js --name push-daemon</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleSendTestPush}
                    disabled={isSendingTest}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                  >
                    {isSendingTest ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isFa ? 'ارسال تست به سرور مجازی و دستگاه' : 'Dispatch Test Push Payload'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: REMINDERS HUB ==================== */}
        {activeTab === 'reminders' && (
          <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden animate-fade-in">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 ms-2" />
                <input
                  type="text"
                  value={remindersSearch}
                  onChange={(e) => setRemindersSearch(e.target.value)}
                  placeholder={isFa ? 'جستجو در یادآوری‌ها...' : 'Search reminders...'}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRemindersFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    remindersFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isFa ? 'همه' : 'All'} ({reminders.length})
                </button>
                <button
                  onClick={() => setRemindersFilter('pending')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    remindersFilter === 'pending' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isFa ? 'در انتظار' : 'Pending'} ({pendingCount})
                </button>
                <button
                  onClick={() => setRemindersFilter('completed')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    remindersFilter === 'completed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isFa ? 'انجام شده' : 'Completed'} ({completedCount})
                </button>
              </div>
            </div>

            {/* Reminders Table: Compact fitted rows */}
            <div className="flex-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-800/80">
                {filteredReminders.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs py-8">
                    {isFa ? 'یادآوری مطابق با این فیلتر یافت نشد.' : 'No reminders matching filters.'}
                  </div>
                ) : (
                  filteredReminders.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-850 transition"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <button
                          onClick={() => toggleComplete(item.id)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700 text-transparent hover:border-indigo-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="truncate">
                          <span
                            className={`text-xs font-bold block truncate ${
                              item.isCompleted ? 'text-slate-500 line-through' : 'text-white'
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatAppDate(item.dueDate, language, true)} • {item.repeat !== 'none' ? `تکرار: ${item.repeat}` : 'تک‌بار'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.soundAlert && (
                          <span className="p-1 rounded-lg bg-indigo-500/15 text-indigo-400" title="دارای هشدار صوتی">
                            <Bell className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(isFa ? 'آیا این یادآوری حذف شود؟' : 'Delete reminder?')) {
                              deleteReminder(item.id);
                              showToast(isFa ? 'یادآوری حذف شد' : 'Reminder deleted');
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Status bar */}
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
              <span>
                {isFa ? 'مجموع موارد:' : 'Total items:'} <b className="text-white">{reminders.length}</b>
              </span>
              <span>
                {isFa ? 'نرخ تکمیل سیستمی:' : 'Completion rate:'} <b className="text-emerald-400">{completionRate}%</b>
              </span>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: REGISTERED USERS MANAGEMENT (SINGLE-ROW TABLE) ==================== */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col justify-between gap-2.5 sm:gap-3 overflow-hidden animate-fade-in min-h-0">
            {/* Top Bar: Title, Policy status & Action buttons */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-shrink-0 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  {isFa ? 'اطلاعات کاربران، دوره آزمایشی و درگاه پرداخت' : 'Users & Subscription Intelligence'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                  {registeredUsers.length} {isFa ? 'کاربر' : 'users'}
                </span>
                <button
                  onClick={handleOpenTrialPolicyModal}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition flex items-center gap-1 border cursor-pointer ${
                    trialPolicy.isFreeModeActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                  title={isFa ? 'کلیک جهت تغییر قوانین دوره آزمایشی و مبلغ پرداخت' : 'Click to edit policy'}
                >
                  <Settings className="w-3 h-3" />
                  <span>
                    {trialPolicy.isFreeModeActive
                      ? (isFa ? 'حالت: کاملاً رایگان (فعال)' : 'Mode: 100% Free')
                      : (isFa ? `دوره آزمایشی: ${trialPolicy.trialDurationDays} روزه` : `Trial: ${trialPolicy.trialDurationDays}d`)}
                  </span>
                </button>
              </div>

              {/* Action buttons: Excel, PDF, JSON, Add User, Policy */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Policy Settings Button */}
                <button
                  onClick={handleOpenTrialPolicyModal}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 text-[11px] font-bold border border-amber-500/30 hover:border-amber-400 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title={isFa ? 'تنظیمات دوره آزمایشی، تعیین مدت زمان و لینک درگاه پرداخت' : 'Trial & Gateway Settings'}
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{isFa ? 'دوره آزمایشی و پرداخت' : 'Trial & Pay'}</span>
                </button>

                {/* Real Excel (.xlsx) RTL Button */}
                <button
                  onClick={handleExportXlsx}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 hover:border-emerald-400 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title={isFa ? 'خروجی اکسل رسمی با فرمت xlsx فارسی و راست‌چین' : 'Export Excel (.xlsx)'}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isFa ? 'خروجی اکسل (.xlsx)' : 'Excel (.xlsx)'}</span>
                </button>

                {/* Real Printable PDF RTL Button */}
                <button
                  onClick={handleExportPdf}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[11px] font-bold border border-rose-500/30 hover:border-rose-400 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title={isFa ? 'چاپ و خروجی سند رسمی PDF با چیدمان راست‌چین فارسی' : 'Export PDF'}
                >
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isFa ? 'خروجی PDF' : 'PDF'}</span>
                </button>

                {/* Add User Button */}
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isFa ? 'ثبت کاربر' : 'New User'}</span>
                </button>

                {/* Refresh */}
                <button
                  onClick={refreshUsersList}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title={isFa ? 'تازه‌سازی لیست' : 'Refresh'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metric Summary Cards (4 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'کل حساب‌های ثبت‌نامی' : 'Registered Users'}</span>
                  <span className="font-bold text-white text-sm">{registeredUsers.length}</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
                  👥
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'وضعیت دوره آزمایشی' : 'Trial Status'}</span>
                  <span className={`font-bold text-xs block truncate ${trialPolicy.isFreeModeActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {trialPolicy.isFreeModeActive ? (isFa ? '۱۰۰٪ رایگان همگانی' : 'Free Mode ON') : (isFa ? `${trialPolicy.trialDurationDays} روزه فعال` : `${trialPolicy.trialDurationDays} Days`)}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                  ⏱️
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'مبلغ تمدید اشتراک' : 'Subscription Fee'}</span>
                  <span className="font-bold text-emerald-400 text-xs font-mono">
                    {trialPolicy.subscriptionFeeToman.toLocaleString('fa-IR')} {isFa ? 'تومان' : 'T'}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                  💰
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between truncate">
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'درگاه پرداخت متصل' : 'Gateway URL'}</span>
                  <span className="font-bold text-cyan-300 text-[11px] truncate block font-mono">
                    {trialPolicy.paymentGatewayUrl.includes('shaparak') ? 'شاپرک (BPM Mellat)' : 'درگاه الکترونیک'}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
                  💳
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  placeholder={
                    isFa
                      ? 'جستجو بر اساس نام، شماره همراه، کلمه عبور یا شناسه کاربر...'
                      : 'Search name, phone, password, user ID...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg ps-8 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setUsersLangFilter('all')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                    usersLangFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isFa ? 'همه' : 'All'}
                </button>
                <button
                  onClick={() => setUsersLangFilter('fa')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                    usersLangFilter === 'fa' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  فارسی
                </button>
                <button
                  onClick={() => setUsersLangFilter('en')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                    usersLangFilter === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Registered Users Single-Row Table Container (اطلاعات هر کاربر در یک سطر) */}
            <div className="flex-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-slate-950/95 sticky top-0 z-10 border-b border-slate-800 text-[11px] text-slate-400 font-bold select-none whitespace-nowrap">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12 border-e border-slate-850">#</th>
                      <th className="py-2.5 px-3 text-start min-w-[130px] border-e border-slate-850">
                        {isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                      </th>
                      <th className="py-2.5 px-3 text-start min-w-[125px] border-e border-slate-850">
                        {isFa ? 'شماره همراه (کاربری)' : 'Mobile / Phone'}
                      </th>
                      <th className="py-2.5 px-3 text-start min-w-[120px] border-e border-slate-850">
                        {isFa ? 'کلمه عبور ثبت‌نامی' : 'Password'}
                      </th>
                      <th className="py-2.5 px-3 text-start min-w-[135px] border-e border-slate-850">
                        {isFa ? 'تاریخ و ساعت ثبت‌نام' : 'Registration Date'}
                      </th>
                      <th className="py-2.5 px-3 text-start min-w-[130px] border-e border-slate-850">
                        {isFa ? 'دوره آزمایشی / اشتراک' : 'Trial & Sub'}
                      </th>
                      <th className="py-2.5 px-3 text-start min-w-[110px] border-e border-slate-850">
                        {isFa ? 'دستگاه و محیط' : 'Device'}
                      </th>
                      <th className="py-2.5 px-3 text-center min-w-[70px] border-e border-slate-850">
                        {isFa ? 'وضعیت' : 'Status'}
                      </th>
                      <th className="py-2.5 px-3 text-center min-w-[170px]">
                        {isFa ? 'عملیات مدیریتی' : 'Actions'}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                          <User className="w-7 h-7 mx-auto mb-2 text-slate-600" />
                          <span>{isFa ? 'هیچ کاربری با این مشخصات یافت نشد.' : 'No users found.'}</span>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => {
                        const isPasswordVisible = visiblePasswords[user.id];
                        const trialInfo = adminService.getUserTrialStatus(user, trialPolicy);
                        const regDateStr = formatAppDate(user.createdAt, language, true);

                        return (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-850/70 transition-colors group text-slate-200 whitespace-nowrap"
                          >
                            {/* Col 1: Index */}
                            <td className="py-2 px-3 text-center text-[11px] font-mono font-bold text-slate-500 border-e border-slate-850/60">
                              {idx + 1}
                            </td>

                            {/* Col 2: Full Name & ID */}
                            <td className="py-2 px-3 border-e border-slate-850/60">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                  {user.fullName.charAt(0) || 'U'}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-white block text-xs truncate">
                                    {user.fullName}
                                  </span>
                                  <span className="font-mono text-[9px] text-slate-500 block truncate" dir="ltr">
                                    {user.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Col 3: Phone / Username */}
                            <td className="py-2 px-3 border-e border-slate-850/60">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-xs font-semibold text-slate-200" dir="ltr">
                                  {user.username}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.username);
                                    showToast(isFa ? 'شماره همراه کپی شد' : 'Phone copied');
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                                  title={isFa ? 'کپی شماره' : 'Copy'}
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Col 4: Registered Password with Reveal & Copy */}
                            <td className="py-2 px-3 border-e border-slate-850/60">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`font-mono text-xs ${
                                    isPasswordVisible
                                      ? 'font-bold text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded'
                                      : 'text-slate-400'
                                  }`}
                                  dir="ltr"
                                >
                                  {user.rawPassword
                                    ? isPasswordVisible
                                      ? user.rawPassword
                                      : '••••••••'
                                    : isPasswordVisible
                                    ? '[هش]'
                                    : '••••••••'}
                                </span>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(user.id)}
                                    className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
                                    title={isPasswordVisible ? (isFa ? 'مخفی‌سازی رمز' : 'Hide') : (isFa ? 'نمایش رمز عبور' : 'Reveal')}
                                  >
                                    {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  {user.rawPassword && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(user.rawPassword || '');
                                        showToast(isFa ? 'رمز عبور کپی شد' : 'Password copied');
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                                      title={isFa ? 'کپی رمز عبور' : 'Copy'}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Col 5: Registration Date (Shamsi with Hour/Min) */}
                            <td className="py-2 px-3 border-e border-slate-850/60">
                              <span className="text-[11px] text-slate-300 block">
                                {regDateStr}
                              </span>
                            </td>

                            {/* Col 6: Trial / Subscription Status */}
                            <td className="py-2 px-3 border-e border-slate-850/60">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  trialInfo.status === 'free'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : trialInfo.status === 'trial_expired'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                    : trialInfo.status === 'subscribed'
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  trialInfo.status === 'free' || trialInfo.status === 'subscribed'
                                    ? 'bg-emerald-400'
                                    : trialInfo.status === 'trial_expired'
                                    ? 'bg-rose-400'
                                    : 'bg-amber-400'
                                }`} />
                                {trialInfo.label}
                              </span>
                            </td>

                            {/* Col 7: Device */}
                            <td className="py-2 px-3 border-e border-slate-850/60">
                              <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">
                                {user.deviceInfo || (isFa ? 'کلاینت موبایل (PWA)' : 'PWA Client')}
                              </span>
                            </td>

                            {/* Col 8: Status */}
                            <td className="py-2 px-3 text-center border-e border-slate-850/60">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  user.status === 'suspended'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {user.status === 'suspended' ? (isFa ? 'معلق' : 'Suspended') : (isFa ? 'فعال' : 'Active')}
                              </span>
                            </td>

                            {/* Col 9: Single-Row Actions */}
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* View Dossier */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserDetails(user)}
                                  className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition cursor-pointer"
                                  title={isFa ? 'مشاهده پرونده کامل کاربر' : 'View dossier'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Quick Extend Trial (+30 days) */}
                                <button
                                  type="button"
                                  onClick={() => handleExtendUserTrial(user.id, user.fullName, 30)}
                                  className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 transition cursor-pointer"
                                  title={isFa ? 'تمدید ۳۰ روزه اشتراک کاربر' : 'Extend 30 days'}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>

                                {/* Simulate Test Payment */}
                                <button
                                  type="button"
                                  onClick={() => handleSimulatePaymentForUser(user.id, user.fullName)}
                                  className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 transition cursor-pointer"
                                  title={isFa ? 'ثبت پرداخت موفق و تمدید' : 'Simulate Payment'}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit user */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(user)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                                  title={isFa ? 'ویرایش کاربر / تغییر رمز' : 'Edit'}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.id, user.fullName)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                                  title={isFa ? 'حذف کاربر' : 'Delete'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Status & Info Bar */}
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse flex-shrink-0" />
                <span className="truncate">
                  {isFa
                    ? `قانون جاری: ${trialPolicy.isFreeModeActive ? 'استفاده کاملاً رایگان برای عموم' : `دوره آزمایشی ${trialPolicy.trialDurationDays} روزه با هزینه تمدید ${trialPolicy.subscriptionFeeToman.toLocaleString()} تومان`}`
                    : `Active Policy: ${trialPolicy.isFreeModeActive ? '100% Free' : `${trialPolicy.trialDurationDays} Days Trial`}`}
                </span>
              </span>
              <span className="font-mono text-slate-400 flex-shrink-0 ms-2">
                {filteredUsers.length} / {registeredUsers.length} {isFa ? 'سطر کاربر' : 'rows'}
              </span>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: FUTURE MODULES ==================== */}
        {activeTab === 'modules' && (
          <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden animate-fade-in">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">
                  {isFa ? 'سوئیچ ماژول‌های توسعه‌پذیر آینده و میکروسرویس‌ها' : 'Future Modular Ecosystem'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {isFa ? 'قابلیت فعال‌سازی بدون دستکاری در هسته' : 'Pluggable architecture'}
              </span>
            </div>

            {/* Modules Grid (6 modules) */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 min-h-0 overflow-y-auto no-scrollbar">
              {/* Module 1: SMS & Voice Call */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    <button
                      onClick={() => handleToggleModule('smsGateway')}
                      className={`w-10 h-5 rounded-full transition cursor-pointer p-0.5 ${
                        modulesConfig.smsGateway ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition transform ${
                          modulesConfig.smsGateway ? 'translate-x-5 rtl:-translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">
                    {isFa ? 'ماژول پیامک و تماس صوتی خودکار' : 'SMS & Voice Call Gateway'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'ارسال خودکار اس‌ام‌اس و تماس خودکار سررسیدهای اضطراری از سرور' : 'Send SMS/Call reminders'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-indigo-300 mt-2">
                  {modulesConfig.smsGateway ? 'Status: ACTIVE (Kavenegar/Twilio)' : 'Status: STANDBY'}
                </div>
              </div>

              {/* Module 2: AI Assistant */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <button
                      onClick={() => handleToggleModule('aiAssistant')}
                      className={`w-10 h-5 rounded-full transition cursor-pointer p-0.5 ${
                        modulesConfig.aiAssistant ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition transform ${
                          modulesConfig.aiAssistant ? 'translate-x-5 rtl:-translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">
                    {isFa ? 'ماژول هوش مصنوعی تحلیلی' : 'AI Smart Scheduler & NLP'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'تبدیل متن محاوره‌ای به یادآوری دقیق و پیش‌بینی زمان‌بندی هوشمند' : 'Natural language to reminder'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-amber-400 mt-2">
                  {modulesConfig.aiAssistant ? 'Status: READY (Gemini Engine)' : 'Status: DISABLED'}
                </div>
              </div>

              {/* Module 3: Cloud Multi-Device Sync */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Cloud className="w-5 h-5 text-emerald-400" />
                    <button
                      onClick={() => handleToggleModule('cloudSync')}
                      className={`w-10 h-5 rounded-full transition cursor-pointer p-0.5 ${
                        modulesConfig.cloudSync ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition transform ${
                          modulesConfig.cloudSync ? 'translate-x-5 rtl:-translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">
                    {isFa ? 'همگام‌سازی ابری چنددستگاهی' : 'Multi-Device Cloud Sync'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'سینک زنده یادآوری‌ها بین موبایل، تبلت و کامپیوتر از طریق VPS' : 'Real-time WebSocket & CRDT sync'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 mt-2">
                  {modulesConfig.cloudSync ? 'Status: READY (WebSocket Relay)' : 'Status: LOCAL ONLY'}
                </div>
              </div>

              {/* Module 4: Persian Voice Assistant */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Mic className="w-5 h-5 text-purple-400" />
                    <button
                      onClick={() => handleToggleModule('voiceAssistant')}
                      className={`w-10 h-5 rounded-full transition cursor-pointer p-0.5 ${
                        modulesConfig.voiceAssistant ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition transform ${
                          modulesConfig.voiceAssistant ? 'translate-x-5 rtl:-translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">
                    {isFa ? 'ماژول دستیار صوتی فارسی' : 'Voice Assistant & Dictation'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'ثبت یادآوری با گفتار فارسی: «فردا ساعت پنج جلسه را یادآوری کن»' : 'Persian speech to reminder'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-purple-300 mt-2">
                  {modulesConfig.voiceAssistant ? 'Status: ACTIVE' : 'Status: STANDBY'}
                </div>
              </div>

              {/* Module 5: Team & Family Sharing */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Share2 className="w-5 h-5 text-blue-400" />
                    <button
                      onClick={() => handleToggleModule('teamSharing')}
                      className={`w-10 h-5 rounded-full transition cursor-pointer p-0.5 ${
                        modulesConfig.teamSharing ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition transform ${
                          modulesConfig.teamSharing ? 'translate-x-5 rtl:-translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">
                    {isFa ? 'ماژول اشتراک تیمی و خانوادگی' : 'Team & Shared Tasks'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'اختصاص وظیفه و یادآوری مشترک برای سایر اعضای خانواده یا تیم' : 'Assign shared task reminders'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-blue-300 mt-2">
                  {modulesConfig.teamSharing ? 'Status: ACTIVE' : 'Status: STANDBY'}
                </div>
              </div>

              {/* Module 6: Advanced BI Reports */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <PieChart className="w-5 h-5 text-rose-400" />
                    <button
                      onClick={() => handleToggleModule('advancedReports')}
                      className={`w-10 h-5 rounded-full transition cursor-pointer p-0.5 ${
                        modulesConfig.advancedReports ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition transform ${
                          modulesConfig.advancedReports ? 'translate-x-5 rtl:-translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">
                    {isFa ? 'ماژول گزارش‌های پیشرفته تحلیلی' : 'Advanced Analytics & Export'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFa ? 'صدور خروجی اکسل و PDF و نمودارهای روند بهره‌وری' : 'Export Excel / PDF / CSV'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-rose-300 mt-2">
                  {modulesConfig.advancedReports ? 'Status: READY' : 'Status: STANDBY'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: SECURITY VAULT ==================== */}
        {activeTab === 'security' && (
          <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden animate-fade-in">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  {isFa ? 'خزانه امنیت، تغییر اطلاعات ورود محرمانه و مدیریت دسترسی' : 'Security Vault & Master Pass'}
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">
                {isFa ? 'سطح دسترسی: ROOT' : 'Level: ROOT'}
              </span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0 overflow-hidden">
              {/* Form: Change Master Credentials */}
              <form onSubmit={handleUpdateSecurityCreds} className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                <div className="pb-2 border-b border-slate-800 flex-shrink-0">
                  <h3 className="text-xs font-bold text-white">
                    {isFa ? 'تغییر نام کاربری و رمز عبور مخفی مدیر' : 'Update Master Credentials'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isFa ? 'برای حفظ امنیت، مقادیر جدید را وارد و ذخیره کنید.' : 'Update stealth login credentials.'}
                  </p>
                </div>

                <div className="space-y-2.5 py-2 text-xs flex-1 overflow-y-auto no-scrollbar">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                      {isFa ? 'نام کاربری جدید مدیر ارشد' : 'New Master Username'}
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder={isFa ? 'مثال: myAdmin' : 'e.g. myAdmin'}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                      {isFa ? 'رمز عبور جدید ارشد' : 'New Master Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-0.5">
                      {isFa ? 'پین‌کد اضطراری جدید (۴ رقمی)' : 'New Emergency PIN (4 digits)'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="8844"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex-shrink-0">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer text-center"
                  >
                    {isFa ? 'ذخیره تغییرات امنیتی' : 'Save Security Changes'}
                  </button>
                </div>
              </form>

              {/* Audit Trail & Emergency Purge */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {isFa ? 'لاگ‌های امنیتی نشست‌ها (Audit Logs)' : 'Security Audit Trail'}
                  </span>
                  <button
                    onClick={() => {
                      adminService.clearAuditLogs();
                      setAuditLogs([]);
                      showToast(isFa ? 'لاگ‌ها پاک شدند' : 'Logs cleared');
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    {isFa ? 'پاک‌سازی لاگ‌ها' : 'Clear Logs'}
                  </button>
                </div>

                <div className="flex-1 space-y-1.5 py-2 overflow-y-auto no-scrollbar">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-2 rounded-xl bg-slate-950 border border-slate-850 text-[10px] space-y-0.5">
                      <div className="flex justify-between items-center font-bold text-slate-200">
                        <span>{log.event}</span>
                        <span className="text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[9px]">{log.details}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
                  <span className="text-[10px] text-slate-400">{isFa ? 'نشست فعال:' : 'Active session:'} 4h remaining</span>
                  <button
                    onClick={onLock}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                  >
                    {isFa ? 'خروج و قفل پنل' : 'Lock Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 7: BACKUP & DATABASE ==================== */}
        {activeTab === 'database' && (
          <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden animate-fade-in">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">
                  {isFa ? 'مدیریت پایگاه داده، یکپارچه‌سازی و پشتیبان‌گیری سروری' : 'System Database & Disaster Recovery'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {isFa ? 'فرمت: JSON / IndexedDB' : 'Format: JSON'}
              </span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0 overflow-hidden">
              {/* Card 1: Full System Export */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isFa ? 'دریافت نسخه پشتیبان کامل سیستم (Master Backup)' : 'Full Master Backup'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {isFa
                      ? 'شامل تمامی یادآوری‌ها، تنظیمات سرور مجازی VPS، کلیدهای VAPID، پیکربندی ماژول‌ها و تنظیمات امنیتی در یک فایل رمزنگاری شده.'
                      : 'Comprehensive JSON backup containing reminders, VPS endpoints, VAPID keys, and module states.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs text-slate-300 space-y-1">
                  <div>• Reminders: {reminders.length} items</div>
                  <div>• VPS Server: {vpsConfig.serverUrl}</div>
                  <div>• Storage Engine: IndexedDB & LocalStorage</div>
                </div>

                <button
                  onClick={() => {
                    exportBackup();
                    showToast(isFa ? 'فایل پشتیبان کامل دانلود شد' : 'Backup downloaded');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer text-center"
                >
                  {isFa ? 'دانلود فایل پشتیبان کامل (.json)' : 'Download Master Backup'}
                </button>
              </div>

              {/* Card 2: Restore & Database Purge */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isFa ? 'بازیابی اطلاعات و بهینه‌سازی دیتابیس' : 'Restore & Maintenance'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {isFa
                      ? 'می‌توانید یک فایل پشتیبان قبلی را برای بازنشانی فوری وارد کنید یا کش موقت را پاک‌سازی نمایید.'
                      : 'Restore previous backups or purge temporary notification logs.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold text-center border border-slate-700 transition cursor-pointer">
                    <span>{isFa ? 'انتخاب و بارگذاری فایل پشتیبان...' : 'Upload Backup File...'}</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const content = ev.target?.result as string;
                            if (content && importBackup(content)) {
                              showToast(isFa ? 'پشتیبان با موفقیت بازیابی شد' : 'Backup restored successfully');
                            } else {
                              showToast(isFa ? 'فرمت فایل پشتیبان نامعتبر است' : 'Invalid backup format');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (window.confirm(isFa ? 'آیا کش موقت سیستم و لاگ‌ها پاک‌سازی شوند؟' : 'Purge temp logs?')) {
                        adminService.clearAuditLogs();
                        showToast(isFa ? 'کش موقت پاک‌سازی شد' : 'Temp cache cleared');
                      }
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-semibold border border-slate-850 transition cursor-pointer"
                  >
                    {isFa ? 'بهینه‌سازی دیتابیس و پاک‌سازی کش موقت' : 'Vacuum & Clear Cache'}
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 text-center">
                  {isFa ? 'بازیابی پشتیبان، اطلاعات فعلی را ادغام و به‌روزرسانی می‌کند.' : 'Restoring integrates and updates data.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL 1: FULL USER REGISTRATION DOSSIER ================= */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {selectedUserDetails.fullName.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {selectedUserDetails.fullName}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {selectedUserDetails.status === 'suspended' ? (isFa ? 'معلق' : 'Suspended') : (isFa ? 'فعال' : 'Active')}
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isFa ? 'پرونده الکترونیک و اطلاعات کامل ثبت‌نامی کاربر' : 'User Registration File'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetails(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Fields List */}
            <div className="space-y-2 text-xs">
              {/* Field 1: Name */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'نام و نام خانوادگی:' : 'Full Name:'}</span>
                  <span className="font-bold text-white text-sm">{selectedUserDetails.fullName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUserDetails.fullName);
                    showToast(isFa ? 'نام کاربر کپی شد' : 'Name copied');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Field 2: Phone Number */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'شماره تلفن همراه (نام کاربری):' : 'Mobile / Username:'}</span>
                  <span className="font-mono font-bold text-indigo-300 text-sm tracking-wider" dir="ltr">
                    {selectedUserDetails.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUserDetails.username);
                    showToast(isFa ? 'شماره همراه کپی شد' : 'Phone copied');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Field 3: Plaintext Password Entered during registration */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div className="min-w-0 flex-1 me-2">
                  <span className="text-[10px] text-amber-400 font-bold block flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    {isFa ? 'رمز عبور وارد شده در هنگام ثبت‌نام:' : 'Password entered at registration:'}
                  </span>
                  <span
                    className="font-mono text-sm font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg inline-block mt-0.5 tracking-wider"
                    dir="ltr"
                  >
                    {selectedUserDetails.rawPassword || (isFa ? '[هش آفلاین در دیتابیس محفوظ است]' : '[Hashed in DB]')}
                  </span>
                </div>
                {selectedUserDetails.rawPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUserDetails.rawPassword || '');
                      showToast(isFa ? 'رمز عبور کپی شد' : 'Password copied');
                    }}
                    className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title={isFa ? 'کپی رمز عبور' : 'Copy Password'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Field 4: Security Hash */}
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-850 text-[11px]">
                <span className="text-[10px] text-slate-500 block">{isFa ? 'هش رمزنگاری امنیتی (SHA-Derived Offline Hash):' : 'Security Hash:'}</span>
                <span className="font-mono text-slate-400 text-[10px] break-all block mt-0.5" dir="ltr">
                  {selectedUserDetails.passwordHash}
                </span>
              </div>

              {/* Field 5 & 6: Registration Date & Last Activity */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'تاریخ ثبت‌نام:' : 'Registered at:'}</span>
                  <span className="font-bold text-slate-200 text-[11px] block mt-0.5">
                    {formatAppDate(selectedUserDetails.createdAt, language, true)}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'آخرین ورود:' : 'Last Login:'}</span>
                  <span className="font-bold text-slate-200 text-[11px] block mt-0.5">
                    {selectedUserDetails.lastLoginAt
                      ? formatAppDate(selectedUserDetails.lastLoginAt, language, true)
                      : (isFa ? 'همزمان با ثبت‌نام' : 'Registration')}
                  </span>
                </div>
              </div>

              {/* Field 7 & 8: Language & Device */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'زبان انتخابی:' : 'Language:'}</span>
                  <span className="font-bold text-slate-200 text-[11px] block mt-0.5">
                    {selectedUserDetails.preferredLang === 'fa' ? 'فارسی (FA)' : selectedUserDetails.preferredLang}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'دستگاه ثبت‌نام:' : 'Device:'}</span>
                  <span className="font-bold text-slate-200 text-[11px] block mt-0.5 truncate">
                    {selectedUserDetails.deviceInfo || (isFa ? 'کلاینت موبایل (PWA)' : 'PWA Client')}
                  </span>
                </div>
              </div>

              {/* Field 9: System ID */}
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-500 block">{isFa ? 'شناسه سیستمی یکتا (User ID):' : 'Unique ID:'}</span>
                <span className="font-mono text-slate-400 text-[11px] block" dir="ltr">
                  {selectedUserDetails.id}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyUserSummary(selectedUserDetails)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isFa ? 'کپی متن گزارش کامل' : 'Copy All'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(selectedUserDetails);
                    setSelectedUserDetails(null);
                  }}
                  className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isFa ? 'ویرایش کاربر' : 'Edit User'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserDetails(null)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  {isFa ? 'بستن' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD NEW USER MANUALLY ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {isFa ? 'ثبت کاربر جدید در سامانه' : 'Add New User'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isFa ? 'نام و نام خانوادگی *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newUserNameInput}
                  onChange={(e) => setNewUserNameInput(e.target.value)}
                  placeholder={isFa ? 'مثال: محمد حسینی' : 'e.g. John Doe'}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isFa ? 'شماره تلفن همراه (نام کاربری) *' : 'Phone Number (Username) *'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={newUserPhoneInput}
                  onChange={(e) => setNewUserPhoneInput(e.target.value)}
                  placeholder="09123456789"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isFa ? 'رمز عبور *' : 'Password *'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={newUserPassInput}
                  onChange={(e) => setNewUserPassInput(e.target.value)}
                  placeholder="Pass@2026"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isFa ? 'زبان ترجیحی' : 'Preferred Language'}
                </label>
                <select
                  value={newUserLangInput}
                  onChange={(e) => setNewUserLangInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="fa">فارسی (FA)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer shadow-md"
                >
                  {isFa ? 'ثبت و ذخیره حساب' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: EDIT USER & RESET PASSWORD ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {isFa ? 'ویرایش کاربر و تنظیم رمز عبور جدید' : 'Edit User & Reset Password'}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isFa ? 'شماره تلفن همراه' : 'Mobile / Phone'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={editPhoneInput}
                  onChange={(e) => setEditPhoneInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">
                  {isFa ? 'رمز عبور جدید (در صورت تمایل به تغییر)' : 'New Password (to reset)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editPassInput}
                  onChange={(e) => setEditPassInput(e.target.value)}
                  placeholder={editingUser.rawPassword || '••••••••'}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isFa ? 'وضعیت حساب' : 'Status'}
                </label>
                <select
                  value={editStatusInput}
                  onChange={(e) => setEditStatusInput(e.target.value as 'active' | 'suspended')}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">{isFa ? 'فعال (مجاز)' : 'Active'}</option>
                  <option value="suspended">{isFa ? 'معلق (مسدود)' : 'Suspended'}</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer shadow-md"
                >
                  {isFa ? 'ذخیره تغییرات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: TRIAL PERIOD & PAYMENT GATEWAY CONFIGURATION ================= */}
      {isTrialPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in select-none">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? 'مدیریت دوره آزمایشی، مهلت استفاده و درگاه پرداخت' : 'Trial & Payment Gateway Policy'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isFa
                      ? 'تعیین سیاست رایگان بودن یا مدت دوره آزمایشی و لینک درگاه الکترونیک شاپرک'
                      : 'Configure Free Mode, trial duration, fee and gateway URL'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsTrialPolicyModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrialPolicy} className="space-y-3.5 text-xs">
              {/* Option 1: 100% Free Mode Switch */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎁</span>
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {isFa ? 'حالت کاملاً رایگان برای عموم (Free Mode)' : '100% Free Mode Active'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isFa
                          ? 'در این حالت هیچ کاربری مسدود نمی‌شود و دسترسی نامحدود و رایگان است.'
                          : 'Users will have unrestricted free access.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPolicyFreeModeInput(!policyFreeModeInput)}
                    className={`w-12 h-6 rounded-full transition cursor-pointer p-0.5 flex items-center ${
                      policyFreeModeInput ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition" />
                  </button>
                </div>

                <div
                  className={`text-[10px] p-2 rounded-xl border ${
                    policyFreeModeInput
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {policyFreeModeInput
                    ? (isFa
                        ? '✓ وضعیت فعلی: برنامه در حال حاضر کاملاً رایگان است. پس از خاموش کردن این گزینه، دوره آزمایشی اعمال می‌شود.'
                        : 'Currently 100% Free.')
                    : (isFa
                        ? '⚠️ دوره آزمایشی فعال است: پس از اتمام مهلت تعیین‌شده، اپلیکیشن برای کاربر متوقف شده و نوتیفیکیشن پرداخت نمایش داده می‌شود.'
                        : 'Trial enforcement active.')}
                </div>
              </div>

              {/* Section 2: Trial Duration Configuration */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isFa ? 'مدت زمان دوره آزمایشی برای هر کاربر:' : 'Trial Duration:'}</span>
                  </label>
                  <span className="font-mono text-indigo-300 font-bold text-xs">
                    {policyDurationInput} {isFa ? 'روز' : 'days'}
                  </span>
                </div>

                {/* Quick select buttons (30 days, 60 days, 90 days) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPolicyDurationInput(30)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                      policyDurationInput === 30
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isFa ? 'یک ماهه (۳۰ روز)' : '1 Month (30d)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyDurationInput(60)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                      policyDurationInput === 60
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isFa ? 'دو ماهه (۶۰ روز)' : '2 Months (60d)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyDurationInput(90)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                      policyDurationInput === 90
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isFa ? 'سه ماهه (۹۰ روز)' : '3 Months (90d)'}
                  </button>
                </div>

                <div className="pt-1">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    {isFa ? 'یا وارد کردن تعداد روز دلخواه:' : 'Or custom days:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={policyDurationInput}
                    onChange={(e) => setPolicyDurationInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-white font-mono text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Section 3: Subscription Fee & Payment Gateway Link */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="font-bold text-slate-200 text-xs block flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isFa ? 'مبلغ و مشخصات درگاه پرداخت الکترونیک:' : 'Fee & Payment Gateway:'}</span>
                </span>

                {/* Amount input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    {isFa ? 'مبلغ تمدید اشتراک (به تومان) *' : 'Subscription Fee (Tomans) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={1000}
                      min={0}
                      required
                      value={policyFeeInput}
                      onChange={(e) => setPolicyFeeInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 ps-3 pe-16 py-2 text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 text-[11px] pointer-events-none">
                      {isFa ? 'تومان' : 'Tomans'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 block mt-0.5 text-center font-bold">
                    معادل: {policyFeeInput.toLocaleString(isFa ? 'fa-IR' : 'en-US')} تومان
                  </span>
                </div>

                {/* Payment Gateway URL */}
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    {isFa ? 'آدرس لینک درگاه پرداخت الکترونیک (شاپرک یا شرکت‌های پرداخت) *' : 'Payment Gateway Link URL *'}
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    required
                    value={policyGatewayUrlInput}
                    onChange={(e) => setPolicyGatewayUrlInput(e.target.value)}
                    placeholder="https://bpm.shaparak.ir/pgwchannel/startpay.mellat"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {isFa
                      ? 'می‌توانید لینک درگاه مستقیم شاپرک یا شرکت‌های واسط پرداخت (مانند زرین‌پال، آیدی‌پی، نکست‌پی و...) را در این کادر قرار دهید.'
                      : 'Direct Shaparak URL or third-party PSP payment link.'}
                  </span>
                </div>

                {/* Merchant ID */}
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    {isFa ? 'کد پذیرنده / مرچنت کد درگاه (Merchant ID):' : 'Gateway Merchant Code:'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={policyMerchantIdInput}
                    onChange={(e) => setPolicyMerchantIdInput(e.target.value)}
                    placeholder="SHAPARAK-MID-20267487"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Section 4: Paywall Notification Message */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 block">
                  {isFa ? 'متن پیام اعلان ارسالی به کاربر هنگام پایان دوره آزمایشی:' : 'Paywall Notification Message:'}
                </label>
                <textarea
                  rows={2}
                  value={policyMessageInput}
                  onChange={(e) => setPolicyMessageInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrialPolicyModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-indigo-600 to-indigo-700 hover:from-amber-500 hover:to-indigo-600 text-white font-bold transition cursor-pointer shadow-md"
                >
                  {isFa ? 'ذخیره تنظیمات دوره آزمایشی و درگاه' : 'Save Trial Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
