import { IReminderRepository, ReminderFilterCriteria } from './IReminderRepository';
import { Reminder } from '../models/Reminder';
import { reminderDatabase, ReminderDatabase } from '../database/reminderDatabase';
import { syncManager } from '../../../core/sync';
import { eventBus } from '../../../core/events';

export class ReminderRepository implements IReminderRepository {
  private db: ReminderDatabase;
  private readonly storeName = 'reminders';

  constructor(db: ReminderDatabase = reminderDatabase) {
    this.db = db;
  }

  public async init(): Promise<void> {
    await this.db.init();
  }

  public async create(reminder: Reminder): Promise<void> {
    await this.db.put(this.storeName, reminder);
    syncManager.enqueue('reminder', reminder.id, 'create', reminder);
    eventBus.emit('reminder:created', reminder);
  }

  public async update(reminder: Reminder): Promise<void> {
    const updated: Reminder = {
      ...reminder,
      updatedAt: new Date().toISOString(),
      version: (reminder.version || 1) + 1,
    };
    await this.db.put(this.storeName, updated);
    syncManager.enqueue('reminder', updated.id, 'update', updated);
    eventBus.emit('reminder:updated', updated);
  }

  public async delete(id: string, softDelete = true): Promise<void> {
    if (softDelete) {
      const existing = await this.getById(id);
      if (existing) {
        existing.deletedAt = new Date().toISOString();
        existing.status = 'archived';
        existing.version = (existing.version || 1) + 1;
        await this.db.put(this.storeName, existing);
        syncManager.enqueue('reminder', id, 'update', existing);
        eventBus.emit('reminder:deleted', { id, soft: true });
        return;
      }
    }

    await this.db.delete(this.storeName, id);
    syncManager.enqueue('reminder', id, 'delete', { id });
    eventBus.emit('reminder:deleted', { id, soft: false });
  }

  public async getById(id: string): Promise<Reminder | null> {
    const item = await this.db.get<Reminder>(this.storeName, id);
    if (item && item.deletedAt) return null;
    return item;
  }

  public async getAll(userId?: string): Promise<Reminder[]> {
    const items = await this.db.getAll<Reminder>(this.storeName);
    return items
      .filter((r) => !r.deletedAt)
      .filter((r) => (!userId ? true : r.userId === userId || r.userId === 'default'));
  }

  public async find(criteria: ReminderFilterCriteria): Promise<Reminder[]> {
    let items = await this.getAll(criteria.userId);

    if (criteria.status) {
      items = items.filter((r) => r.status === criteria.status);
    }
    if (criteria.category) {
      items = items.filter((r) => r.category === criteria.category);
    }
    if (criteria.priority) {
      items = items.filter((r) => r.priority === criteria.priority);
    }
    if (criteria.startDate) {
      items = items.filter((r) => r.dueDate >= criteria.startDate!);
    }
    if (criteria.endDate) {
      items = items.filter((r) => r.dueDate <= criteria.endDate!);
    }
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim();
      items = items.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(q);
        const descMatch = r.description ? r.description.toLowerCase().includes(q) : false;
        return titleMatch || descMatch;
      });
    }

    return items;
  }

  public async getDueBefore(timestamp: number): Promise<Reminder[]> {
    const all = await this.getAll();
    return all.filter((r) => {
      if (r.status !== 'active') return false;
      const targetTime = r.snoozeUntil ? new Date(r.snoozeUntil).getTime() : new Date(r.dueDate).getTime();
      return targetTime <= timestamp;
    });
  }

  public async exportAll(): Promise<Reminder[]> {
    const items = await this.db.getAll<Reminder>(this.storeName);
    return items.filter((r) => !r.deletedAt);
  }

  public async importAll(reminders: Reminder[]): Promise<void> {
    await this.db.putBatch(this.storeName, reminders);
    eventBus.emit('reminder:imported', { count: reminders.length });
  }

  public async clearAll(): Promise<void> {
    await this.db.clear(this.storeName);
  }
}

export const reminderRepository = new ReminderRepository();
