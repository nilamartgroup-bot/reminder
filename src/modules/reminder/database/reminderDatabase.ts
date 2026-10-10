import { IndexedDBAdapter } from '../../../core/database/IndexedDBAdapter';
import { DatabaseConfig, Migration } from '../../../core/database/types';

/**
 * Isolated Reminder Module Database (`reminder.db`)
 * Fully independent database instance with schema versioning and migrations.
 */

const REMINDER_DB_NAME = 'reminder.db';
const CURRENT_VERSION = 2;

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema for reminders object store',
    up: (db) => {
      if (!db.objectStoreNames.contains('reminders')) {
        const store = db.createObjectStore('reminders', { keyPath: 'id' });
        store.createIndex('by_dueDate', 'dueDate', { unique: false });
        store.createIndex('by_status', 'status', { unique: false });
        store.createIndex('by_category', 'category', { unique: false });
      }
    },
  },
  {
    version: 2,
    description: 'Add userId, priority and composite indexes for high performance',
    up: (db, transaction) => {
      const store = transaction.objectStore('reminders');
      if (!store.indexNames.contains('by_userId')) {
        store.createIndex('by_userId', 'userId', { unique: false });
      }
      if (!store.indexNames.contains('by_priority')) {
        store.createIndex('by_priority', 'priority', { unique: false });
      }
      if (!store.indexNames.contains('by_updatedAt')) {
        store.createIndex('by_updatedAt', 'updatedAt', { unique: false });
      }
    },
  },
];

export const reminderDbConfig: DatabaseConfig = {
  name: REMINDER_DB_NAME,
  version: CURRENT_VERSION,
  migrations,
};

export class ReminderDatabase extends IndexedDBAdapter {
  constructor() {
    super(reminderDbConfig);
  }
}

export const reminderDatabase = new ReminderDatabase();
