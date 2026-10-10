import { DatabaseConfig, IModuleDatabase } from './types';

/**
 * Robust, cross-platform IndexedDB Module Database Adapter
 * Features:
 * - Versioned schema migrations
 * - Atomic transactions
 * - In-memory fallback for headless/Node testing
 * - Backup export & restore validation
 */
export class IndexedDBAdapter implements IModuleDatabase {
  private config: DatabaseConfig;
  private db: IDBDatabase | null = null;
  private memStorage: Map<string, Map<string, any>> = new Map();
  private isNodeEnv: boolean = typeof window === 'undefined' || !('indexedDB' in window);

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  public async init(): Promise<void> {
    if (this.isNodeEnv) {
      // Memory fallback for headless unit tests
      for (const m of this.config.migrations) {
        // Prepare tables for schema
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const transaction = request.transaction!;
        const oldVersion = event.oldVersion;

        // Apply migrations sequentially from oldVersion + 1 to current
        for (const migration of this.config.migrations) {
          if (migration.version > oldVersion && migration.version <= this.config.version) {
            try {
              migration.up(db, transaction);
            } catch (err) {
              console.error(`Migration v${migration.version} failed:`, err);
              transaction.abort();
              reject(err);
              return;
            }
          }
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async get<T = any>(storeName: string, id: string): Promise<T | null> {
    if (this.isNodeEnv) {
      const store = this.memStorage.get(storeName);
      return store?.get(id) || null;
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async getAll<T = any>(storeName: string): Promise<T[]> {
    if (this.isNodeEnv) {
      const store = this.memStorage.get(storeName);
      return store ? Array.from(store.values()) : [];
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T = any>(storeName: string, item: T): Promise<void> {
    if (this.isNodeEnv) {
      if (!this.memStorage.has(storeName)) {
        this.memStorage.set(storeName, new Map());
      }
      const key = (item as any).id || (item as any).key;
      this.memStorage.get(storeName)!.set(key, item);
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async putBatch<T = any>(storeName: string, items: T[]): Promise<void> {
    if (this.isNodeEnv) {
      for (const item of items) {
        await this.put(storeName, item);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      items.forEach((item) => store.put(item));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    if (this.isNodeEnv) {
      this.memStorage.get(storeName)?.delete(id);
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clear(storeName: string): Promise<void> {
    if (this.isNodeEnv) {
      this.memStorage.get(storeName)?.clear();
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async queryByIndex<T = any>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    if (this.isNodeEnv) {
      const all = await this.getAll<T>(storeName);
      return all.filter((item: any) => item[indexName] === query);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(query);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async exportData(): Promise<Record<string, any[]>> {
    if (this.isNodeEnv) {
      const result: Record<string, any[]> = {};
      for (const [storeName, map] of this.memStorage.entries()) {
        result[storeName] = Array.from(map.values());
      }
      return result;
    }

    if (!this.db) throw new Error('Database not initialized');
    const storeNames = Array.from(this.db.objectStoreNames);
    const result: Record<string, any[]> = {};

    for (const name of storeNames) {
      result[name] = await this.getAll(name);
    }
    return result;
  }

  public async importData(data: Record<string, any[]>): Promise<void> {
    for (const [storeName, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        await this.putBatch(storeName, items);
      }
    }
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
