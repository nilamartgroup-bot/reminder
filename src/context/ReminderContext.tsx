import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { playReminderChime } from '../utils/audioAlert';
import { customAudioService } from '../utils/customAudioService';

export type ReminderCategory =
  | 'personal'
  | 'work'
  | 'health'
  | 'study'
  | 'finance'
  | 'events';

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ReminderItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  category: ReminderCategory;
  priority: ReminderPriority;
  repeat: ReminderRepeat;
  soundAlert: boolean;
  vibration: boolean;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  snoozedUntil?: string;
  notified?: boolean;
}

interface ReminderContextType {
  reminders: ReminderItem[];
  addReminder: (reminder: Omit<ReminderItem, 'id' | 'userId' | 'createdAt' | 'isCompleted'>) => ReminderItem;
  updateReminder: (id: string, updates: Partial<ReminderItem>) => void;
  deleteReminder: (id: string) => void;
  toggleComplete: (id: string) => void;
  snoozeReminder: (id: string, minutes: number) => void;
  activeAlert: ReminderItem | null;
  dismissAlert: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  hasNotificationPermission: boolean;
  exportBackup: () => void;
  importBackup: (jsonData: string) => boolean;
}

const STORAGE_KEY = 'reminder_pro_items_db';

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allReminders, setAllReminders] = useState<ReminderItem[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
    // Default initial seed data for demo
    const now = new Date();
    const laterToday = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return [
      {
        id: 'seed-1',
        userId: 'default',
        title: 'بررسی تسک‌ها و تنظیم یادآورهای روزانه',
        description: 'شروع کار با اپلیکیشن آفلاین و بررسی رویدادهای مهم',
        dueDate: laterToday.toISOString(),
        category: 'personal',
        priority: 'high',
        repeat: 'daily',
        soundAlert: true,
        vibration: true,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seed-2',
        userId: 'default',
        title: 'مصرف مکمل و ویتامین روزانه',
        description: 'همراه با یک لیوان آب بعد از صرف وعده غذایی',
        dueDate: tomorrow.toISOString(),
        category: 'health',
        priority: 'urgent',
        repeat: 'daily',
        soundAlert: true,
        vibration: true,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [activeAlert, setActiveAlert] = useState<ReminderItem | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allReminders));
    } catch (err) {
      console.error('Storage full or error:', err);
    }
  }, [allReminders]);

  // Check notification status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        const granted = res === 'granted';
        setHasNotificationPermission(granted);
        return granted;
      } catch (err) {
        console.error('Permission request failed:', err);
      }
    }
    return false;
  };

  // User-scoped reminders
  const reminders = allReminders.filter((r) => {
    if (!user) return r.userId === 'default';
    return r.userId === user.id || r.userId === 'default';
  });

  // Background reminder timer check
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const nowMs = Date.now();

      setAllReminders((prev) => {
        let alertToTrigger: ReminderItem | null = null;

        const updated = prev.map((item) => {
          if (item.isCompleted) return item;

          const dueMs = item.snoozedUntil
            ? new Date(item.snoozedUntil).getTime()
            : new Date(item.dueDate).getTime();

          // If reached due time and not yet notified in current cycle
          if (dueMs <= nowMs && !item.notified) {
            alertToTrigger = item;
            return { ...item, notified: true };
          }
          return item;
        });

        if (alertToTrigger) {
          const item = alertToTrigger as ReminderItem;
          setActiveAlert(item);

          // 1. Wake screen if enabled in settings
          const wakeScreenPref = localStorage.getItem('reminder_pref_wake_screen') !== 'false';
          if (wakeScreenPref) {
            customAudioService.requestScreenWakeLock();
          }

          // 2. Play sound alert (custom user audio from phone or preset)
          if (item.soundAlert) {
            const soundType = localStorage.getItem('reminder_pref_sound_type') || 'custom';
            const volume = Number(localStorage.getItem('reminder_pref_volume') || 0.9);
            customAudioService.playSound(soundType, volume, true);
          }

          // 3. Trigger vibration if enabled
          if (item.vibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([500, 200, 500, 200, 500]);
            } catch {
              // ignore
            }
          }

          // 4. System & Lock-screen Notification with interactive Action Button ("✓ انجام شد")
          customAudioService.showLockScreenAlert(
            item.title,
            item.description || 'زمان سررسید این یادآوری فرا رسیده است.',
            item.id
          );
        }

        return updated;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, []);

  // Listen for Service Worker notification actions (e.g. user tapped "✓ انجام شد" directly on mobile lockscreen)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'REMINDER_ACTION') {
          const { action, reminderId } = event.data;
          if (action === 'complete' && reminderId) {
            toggleComplete(reminderId);
            customAudioService.stop();
            customAudioService.releaseScreenWakeLock();
          } else if (action === 'snooze' && reminderId) {
            snoozeReminder(reminderId, 10);
            customAudioService.stop();
            customAudioService.releaseScreenWakeLock();
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, []);

  const addReminder = (
    data: Omit<ReminderItem, 'id' | 'userId' | 'createdAt' | 'isCompleted'>
  ): ReminderItem => {
    const newItem: ReminderItem = {
      ...data,
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user?.id || 'default',
      createdAt: new Date().toISOString(),
      isCompleted: false,
      notified: false,
    };

    setAllReminders((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateReminder = (id: string, updates: Partial<ReminderItem>) => {
    setAllReminders((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updates,
            // If due date changed, reset notified status
            notified: updates.dueDate ? false : item.notified,
          };
        }
        return item;
      })
    );
  };

  const deleteReminder = (id: string) => {
    setAllReminders((prev) => prev.filter((item) => item.id !== id));
    if (activeAlert?.id === id) {
      setActiveAlert(null);
    }
  };

  const toggleComplete = (id: string) => {
    setAllReminders((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.isCompleted;

          // If recurring and being marked complete, calculate next occurrence
          if (nextCompleted && item.repeat !== 'none') {
            const currentDue = new Date(item.dueDate);
            const nextDue = new Date(currentDue);

            if (item.repeat === 'daily') nextDue.setDate(nextDue.getDate() + 1);
            else if (item.repeat === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
            else if (item.repeat === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
            else if (item.repeat === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);

            return {
              ...item,
              dueDate: nextDue.toISOString(),
              isCompleted: false,
              notified: false,
              snoozedUntil: undefined,
            };
          }

          return {
            ...item,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
            notified: nextCompleted,
          };
        }
        return item;
      })
    );

    if (activeAlert?.id === id) {
      setActiveAlert(null);
    }
  };

  const snoozeReminder = (id: string, minutes: number) => {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    updateReminder(id, { snoozedUntil: snoozeTime, notified: false });
    if (activeAlert?.id === id) {
      setActiveAlert(null);
    }
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  const exportBackup = () => {
    const dataStr = JSON.stringify(reminders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reminders_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        setAllReminders(parsed);
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleComplete,
        snoozeReminder,
        activeAlert,
        dismissAlert,
        requestNotificationPermission,
        hasNotificationPermission,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export function useReminders() {
  const ctx = useContext(ReminderContext);
  if (!ctx) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return ctx;
}
