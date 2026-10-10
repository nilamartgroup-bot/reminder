/**
 * Reminder Scheduler Service
 * Handles offline timer triggers, chimes, vibration, and system notifications.
 */

import { ReminderItem } from '../models/types';
import { playReminderChime } from '../../utils/audioAlert';

export class ReminderScheduler {
  private timers: Map<string, number> = new Map();

  public scheduleReminder(item: ReminderItem, onTrigger: (item: ReminderItem) => void) {
    this.cancelReminder(item.id);

    if (item.isCompleted) return;

    const targetTime = item.snoozedUntil
      ? new Date(item.snoozedUntil).getTime()
      : new Date(item.dueDate).getTime();

    const now = Date.now();
    const delay = targetTime - now;

    if (delay > 0 && delay < 2147483647) {
      const timerId = window.setTimeout(() => {
        this.timers.delete(item.id);
        if (item.soundAlert) {
          playReminderChime('alarm');
        }
        if (item.vibration && 'vibrate' in navigator) {
          try {
            navigator.vibrate([300, 150, 300, 150, 300]);
          } catch {
            // Ignore
          }
        }
        onTrigger(item);
      }, delay);

      this.timers.set(item.id, timerId);
    }
  }

  public cancelReminder(id: string) {
    const timerId = this.timers.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.timers.delete(id);
    }
  }

  public clearAll() {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers.clear();
  }
}

export const reminderScheduler = new ReminderScheduler();
