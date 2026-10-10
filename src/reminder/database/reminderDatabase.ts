/**
 * Isolated Reminder Module Database
 * Independent, high-performance database dedicated exclusively to the reminder module.
 * Runs completely offline, without blocking or sharing locks with any future modules.
 */

import { ReminderItem } from '../models/types';

const DB_NAME = 'reminder_isolated_module_db';
const DB_VERSION = 1;
const STORE_NAME = 'reminders';
const FALLBACK_KEY = 'reminder_pro_isolated_cache';

export class ReminderDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase | null> | null = null;
  private memoryCache: Map<string, ReminderItem> = new Map();

  constructor() {
    this.hydrateMemoryFromStorage();
  }

  private hydrateMemoryFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(FALLBACK_KEY);
        if (raw) {
          const list: ReminderItem[] = JSON.parse(raw);
          list.forEach((item) => this.memoryCache.set(item.id, item));
        }
      }
    } catch {
      // Ignore initial parse errors
    }
  }

  private persistMemoryCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = Array.from(this.memoryCache.values());
        localStorage.setItem(FALLBACK_KEY, JSON.stringify(list));
      }
    } catch {
      // Storage full or unavailable
    }
  }

  public async getDb(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }

    this.initPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by_userId', 'userId', { unique: false });
            store.createIndex('by_dueDate', 'dueDate', { unique: false });
            store.createIndex('by_category', 'category', { unique: false });
            store.createIndex('by_priority', 'priority', { unique: false });
            store.createIndex('by_isCompleted', 'isCompleted', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.initPromise;
  }

  public async getAll(userId?: string): Promise<ReminderItem[]> {
    const db = await this.getDb();
    if (db) {
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.getAll();

          request.onsuccess = () => {
            const items: ReminderItem[] = request.result || [];
            // Update cache
            this.memoryCache.clear();
            items.forEach((item) => this.memoryCache.set(item.id, item));
            this.persistMemoryCache();

            if (userId) {
              resolve(items.filter((i) => i.userId === userId));
            } else {
              resolve(items);
            }
          };

          request.onerror = () => {
            const cached = Array.from(this.memoryCache.values());
            resolve(userId ? cached.filter((i) => i.userId === userId) : cached);
          };
        } catch {
          const cached = Array.from(this.memoryCache.values());
          resolve(userId ? cached.filter((i) => i.userId === userId) : cached);
        }
      });
    }

    // Memory / LocalStorage fallback
    const cached = Array.from(this.memoryCache.values());
    return userId ? cached.filter((i) => i.userId === userId) : cached;
  }

  public async getById(id: string): Promise<ReminderItem | null> {
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id) || null;
    }
    const db = await this.getDb();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async put(item: ReminderItem): Promise<void> {
    this.memoryCache.set(item.id, item);
    this.persistMemoryCache();

    const db = await this.getDb();
    if (db) {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(item);
      } catch {
        // Fallback already saved
      }
    }
  }

  public async delete(id: string): Promise<void> {
    this.memoryCache.delete(id);
    this.persistMemoryCache();

    const db = await this.getDb();
    if (db) {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
      } catch {
        // Fallback already updated
      }
    }
  }

  public async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.persistMemoryCache();

    const db = await this.getDb();
    if (db) {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
      } catch {
        // Ignored
      }
    }
  }
}

export const reminderIsolatedDatabase = new ReminderDatabase();
