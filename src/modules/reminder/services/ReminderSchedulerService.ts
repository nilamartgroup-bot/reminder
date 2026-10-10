import { Reminder } from '../models/Reminder';
import { ILocalNotificationService, localNotificationService } from '../../../core/platform';

/**
 * Service orchestrating local notification scheduling for reminders
 */
export class ReminderSchedulerService {
  private notificationService: ILocalNotificationService;

  constructor(notificationService: ILocalNotificationService = localNotificationService) {
    this.notificationService = notificationService;
  }

  public async scheduleReminder(reminder: Reminder): Promise<void> {
    if (reminder.status !== 'active') {
      await this.cancelReminder(reminder.id);
      return;
    }

    const dueTime = reminder.snoozeUntil
      ? new Date(reminder.snoozeUntil).getTime()
      : new Date(reminder.dueDate).getTime();

    // Do not schedule notifications in the past
    if (dueTime <= Date.now()) {
      return;
    }

    await this.notificationService.schedule({
      id: reminder.id,
      title: reminder.title,
      body: reminder.description || 'زمان سررسید یادآور فرا رسیده است.',
      scheduledTime: dueTime,
      sound: reminder.notificationSettings.sound,
      vibrate: reminder.notificationSettings.vibration,
      category: reminder.category,
      data: { reminderId: reminder.id },
    });
  }

  public async cancelReminder(id: string): Promise<void> {
    await this.notificationService.cancel(id);
  }

  public async rescheduleAll(reminders: Reminder[]): Promise<void> {
    await this.notificationService.cancelAll();
    for (const reminder of reminders) {
      if (reminder.status === 'active') {
        await this.scheduleReminder(reminder);
      }
    }
  }
}

export const reminderSchedulerService = new ReminderSchedulerService();
