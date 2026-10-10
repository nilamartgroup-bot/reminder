/**
 * Reminder Module Service
 * Backend business logic for reminders (CRUD, complete, snooze, backup export/import).
 */

import { ReminderItem, ReminderBackupFormat } from '../models/types';
import { reminderIsolatedDatabase } from '../database/reminderDatabase';
import { RecurrenceEngine } from './recurrenceEngine';
import { reminderScheduler } from './reminderScheduler';

export class ReminderService {
  private database = reminderIsolatedDatabase;
  private scheduler = reminderScheduler;

  public async getRemindersForUser(userId: string): Promise<ReminderItem[]> {
    return this.database.getAll(userId);
  }

  public async createReminder(
    item: Omit<ReminderItem, 'id' | 'createdAt' | 'isCompleted'>
  ): Promise<ReminderItem> {
    const id = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fullItem: ReminderItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    await this.database.put(fullItem);
    return fullItem;
  }

  public async updateReminder(id: string, updates: Partial<ReminderItem>): Promise<ReminderItem | null> {
    const existing = await this.database.getById(id);
    if (!existing) return null;

    const updated: ReminderItem = {
      ...existing,
      ...updates,
    };

    await this.database.put(updated);
    return updated;
  }

  public async deleteReminder(id: string): Promise<void> {
    this.scheduler.cancelReminder(id);
    await this.database.delete(id);
  }

  public async completeReminder(id: string): Promise<{ completed: ReminderItem; next?: ReminderItem } | null> {
    const item = await this.database.getById(id);
    if (!item) return null;

    const completed: ReminderItem = {
      ...item,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    };
    await this.database.put(completed);
    this.scheduler.cancelReminder(id);

    // If repeat is active, calculate next occurrence
    if (item.repeat && item.repeat !== 'none') {
      const nextDue = RecurrenceEngine.calculateNextOccurrence(item.dueDate, {
        frequency: item.repeat,
      });

      if (nextDue) {
        const next = await this.createReminder({
          userId: item.userId,
          title: item.title,
          description: item.description,
          dueDate: nextDue,
          category: item.category,
          priority: item.priority,
          repeat: item.repeat,
          soundAlert: item.soundAlert,
          vibration: item.vibration,
        });
        return { completed, next };
      }
    }

    return { completed };
  }

  public exportBackup(reminders: ReminderItem[]): string {
    const backup: ReminderBackupFormat = {
      backupVersion: 1,
      appVersion: '2.0.0',
      moduleVersion: 1,
      createdAt: new Date().toISOString(),
      language: 'fa',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tehran',
      remindersCount: reminders.length,
      reminders,
    };
    return JSON.stringify(backup, null, 2);
  }

  public parseBackup(jsonStr: string): ReminderItem[] | null {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.reminders)) {
        return data.reminders;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const reminderService = new ReminderService();
