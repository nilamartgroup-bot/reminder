import { IReminderRepository } from '../repositories/IReminderRepository';
import { reminderRepository } from '../repositories/ReminderRepository';
import { Reminder, ReminderBackupFormat } from '../models/Reminder';
import { RecurrenceEngine } from './RecurrenceEngine';
import { ReminderSchedulerService, reminderSchedulerService } from './ReminderSchedulerService';

export class ReminderService {
  private repository: IReminderRepository;
  private scheduler: ReminderSchedulerService;

  constructor(
    repository: IReminderRepository = reminderRepository,
    scheduler: ReminderSchedulerService = reminderSchedulerService
  ) {
    this.repository = repository;
    this.scheduler = scheduler;
  }

  public async init(): Promise<void> {
    await this.repository.init();
    const active = await this.repository.find({ status: 'active' });
    await this.scheduler.rescheduleAll(active);
  }

  public async create(
    params: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'syncStatus'>
  ): Promise<Reminder> {
    const now = new Date().toISOString();
    const reminder: Reminder = {
      ...params,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: 'pending',
    };

    await this.repository.create(reminder);
    await this.scheduler.scheduleReminder(reminder);
    return reminder;
  }

  public async update(reminder: Reminder): Promise<void> {
    await this.repository.update(reminder);
    await this.scheduler.scheduleReminder(reminder);
  }

  public async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    await this.scheduler.cancelReminder(id);
  }

  public async complete(id: string): Promise<{ completed: Reminder; nextRecurring?: Reminder }> {
    const reminder = await this.repository.getById(id);
    if (!reminder) throw new Error(`Reminder ${id} not found`);

    const now = new Date().toISOString();

    // If recurring: compute next occurrence
    if (reminder.recurrence && reminder.recurrence.frequency !== 'none') {
      const nextDate = RecurrenceEngine.calculateNextOccurrence(reminder.dueDate, reminder.recurrence);
      if (nextDate) {
        // Update current reminder to next occurrence
        reminder.dueDate = nextDate;
        reminder.snoozeUntil = undefined;
        reminder.status = 'active';
        reminder.updatedAt = now;
        await this.repository.update(reminder);
        await this.scheduler.scheduleReminder(reminder);
        return { completed: reminder, nextRecurring: reminder };
      }
    }

    // Single occurrence completion
    reminder.status = 'completed';
    reminder.completedAt = now;
    reminder.updatedAt = now;
    await this.repository.update(reminder);
    await this.scheduler.cancelReminder(id);
    return { completed: reminder };
  }

  public async undoCompletion(id: string): Promise<Reminder> {
    const reminder = await this.repository.getById(id);
    if (!reminder) throw new Error(`Reminder ${id} not found`);

    reminder.status = 'active';
    reminder.completedAt = undefined;
    reminder.updatedAt = new Date().toISOString();
    await this.repository.update(reminder);
    await this.scheduler.scheduleReminder(reminder);
    return reminder;
  }

  public async snooze(id: string, minutes: number): Promise<Reminder> {
    const reminder = await this.repository.getById(id);
    if (!reminder) throw new Error(`Reminder ${id} not found`);

    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    reminder.snoozeUntil = snoozeTime;
    reminder.status = 'active';
    reminder.updatedAt = new Date().toISOString();

    await this.repository.update(reminder);
    await this.scheduler.scheduleReminder(reminder);
    return reminder;
  }

  public async exportBackup(language = 'fa', timezone = 'Asia/Tehran'): Promise<ReminderBackupFormat> {
    const reminders = await this.repository.exportAll();
    return {
      backupVersion: 1,
      appVersion: '1.0.0',
      moduleVersion: 1,
      createdAt: new Date().toISOString(),
      language,
      timezone,
      remindersCount: reminders.length,
      reminders,
    };
  }

  public async importBackup(backup: ReminderBackupFormat): Promise<{ success: boolean; importedCount: number }> {
    if (!backup || !Array.isArray(backup.reminders) || typeof backup.backupVersion !== 'number') {
      throw new Error('Invalid backup file format');
    }

    await this.repository.importAll(backup.reminders);
    const active = await this.repository.find({ status: 'active' });
    await this.scheduler.rescheduleAll(active);

    return {
      success: true,
      importedCount: backup.reminders.length,
    };
  }
}

export const reminderService = new ReminderService();
