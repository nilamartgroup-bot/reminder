/**
 * Reminder Module Models & Types
 * Production domain entity with full timezone, recurrence, and synchronization tracking.
 */

export type ReminderCategory =
  | 'personal'
  | 'work'
  | 'health'
  | 'study'
  | 'finance'
  | 'events';

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReminderStatus = 'active' | 'completed' | 'snoozed' | 'archived';

export type RecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'every_x_days'
  | 'monthly'
  | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g., every 3 days
  daysOfWeek?: number[]; // [0 = Sunday, 1 = Monday, ..., 6 = Saturday]
  dayOfMonth?: number; // 1 to 31
  endDate?: string; // Optional recurrence termination ISO string
}

export interface NotificationSettings {
  sound: boolean;
  vibration: boolean;
  preAlertMinutes?: number; // e.g., 10 minutes before
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string; // Machine-safe ISO string (e.g. 2026-10-06T10:00:00.000Z)
  timezone: string;
  recurrence: RecurrenceRule;
  category: ReminderCategory;
  priority: ReminderPriority;
  status: ReminderStatus;
  notificationSettings: NotificationSettings;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletedAt?: string; // Soft delete support
  snoozeUntil?: string;
  version: number;
  syncStatus: 'synced' | 'pending' | 'failed';
}

export interface ReminderBackupFormat {
  backupVersion: number;
  appVersion: string;
  moduleVersion: number;
  createdAt: string;
  language: string;
  timezone: string;
  remindersCount: number;
  reminders: Reminder[];
}
