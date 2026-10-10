/**
 * Recurrence Engine for Reminder Module
 * High-precision computation of recurring occurrences (daily, weekly, monthly, custom).
 */

import { RecurrenceRule } from '../models/types';

export class RecurrenceEngine {
  public static calculateNextOccurrence(
    currentIsoDate: string,
    rule: RecurrenceRule
  ): string | null {
    if (!rule || rule.frequency === 'none') {
      return null;
    }

    const current = new Date(currentIsoDate);
    if (isNaN(current.getTime())) {
      return null;
    }

    const next = new Date(current);

    switch (rule.frequency) {
      case 'daily':
        next.setUTCDate(next.getUTCDate() + 1);
        break;

      case 'every_x_days': {
        const interval = rule.interval && rule.interval > 0 ? rule.interval : 1;
        next.setUTCDate(next.getUTCDate() + interval);
        break;
      }

      case 'weekly':
        next.setUTCDate(next.getUTCDate() + 7);
        break;

      case 'monthly': {
        const currentMonth = next.getUTCMonth();
        next.setUTCMonth(currentMonth + 1);
        break;
      }

      case 'yearly':
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;

      default:
        return null;
    }

    // Check optional end date
    if (rule.endDate) {
      const end = new Date(rule.endDate);
      if (!isNaN(end.getTime()) && next.getTime() > end.getTime()) {
        return null;
      }
    }

    return next.toISOString();
  }
}
