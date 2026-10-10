/**
 * Reminder Module Models & Type Definitions
 * Complete type safety for reminder entities, categories, priorities, and recurrence rules.
 */

export type ReminderCategory =
  | 'personal'
  | 'work'
  | 'health'
  | 'study'
  | 'finance'
  | 'events';

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReminderStatus = 'active' | 'completed' | 'snoozed' | 'archived';

export interface RecurrenceRule {
  frequency: 'none' | 'daily' | 'weekly' | 'every_x_days' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
}

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

export interface ReminderBackupFormat {
  backupVersion: number;
  appVersion: string;
  moduleVersion: number;
  createdAt: string;
  language: string;
  timezone: string;
  remindersCount: number;
  reminders: ReminderItem[];
}
