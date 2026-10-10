import { Reminder } from '../models/Reminder';

export interface ReminderFilterCriteria {
  userId?: string;
  status?: Reminder['status'];
  category?: Reminder['category'];
  priority?: Reminder['priority'];
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface IReminderRepository {
  init(): Promise<void>;
  create(reminder: Reminder): Promise<void>;
  update(reminder: Reminder): Promise<void>;
  delete(id: string, softDelete?: boolean): Promise<void>;
  getById(id: string): Promise<Reminder | null>;
  getAll(userId?: string): Promise<Reminder[]>;
  find(criteria: ReminderFilterCriteria): Promise<Reminder[]>;
  getDueBefore(timestamp: number): Promise<Reminder[]>;
  exportAll(): Promise<Reminder[]>;
  importAll(reminders: Reminder[]): Promise<void>;
  clearAll(): Promise<void>;
}
