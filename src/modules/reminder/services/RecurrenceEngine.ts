import { RecurrenceRule } from '../models/Reminder';

/**
 * Platform-independent Recurrence Calculation Engine
 * Accurately computes subsequent occurrence timestamps without UI dependencies.
 */
export class RecurrenceEngine {
  public static calculateNextOccurrence(currentDueDate: string | Date, rule: RecurrenceRule): string | null {
    if (rule.frequency === 'none') {
      return null;
    }

    const current = new Date(currentDueDate);
    if (isNaN(current.getTime())) return null;

    const next = new Date(current);

    switch (rule.frequency) {
      case 'daily': {
        next.setDate(next.getDate() + 1);
        break;
      }
      case 'every_x_days': {
        const interval = Math.max(rule.interval || 1, 1);
        next.setDate(next.getDate() + interval);
        break;
      }
      case 'weekly': {
        next.setDate(next.getDate() + 7);
        break;
      }
      case 'weekdays': {
        // Next Monday-Friday
        do {
          next.setDate(next.getDate() + 1);
        } while (next.getDay() === 0 || next.getDay() === 6);
        break;
      }
      case 'weekends': {
        // Next Saturday or Sunday
        do {
          next.setDate(next.getDate() + 1);
        } while (next.getDay() !== 0 && next.getDay() !== 6);
        break;
      }
      case 'monthly': {
        const targetDay = rule.dayOfMonth || current.getDate();
        next.setMonth(next.getMonth() + 1);
        // Handle month-end overflows
        const maxDaysInNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(targetDay, maxDaysInNextMonth));
        break;
      }
      case 'yearly': {
        next.setFullYear(next.getFullYear() + 1);
        break;
      }
      default:
        return null;
    }

    // Check if beyond end date
    if (rule.endDate && next.getTime() > new Date(rule.endDate).getTime()) {
      return null;
    }

    return next.toISOString();
  }
}
