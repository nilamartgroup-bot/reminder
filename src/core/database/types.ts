/**
 * Core Database Interfaces & Migration Engine
 * Provides independent database isolation for every module.
 */

export interface Migration {
  version: number;
  description: string;
  up: (db: IDBDatabase, transaction: IDBTransaction) => void | Promise<void>;
  down?: (db: IDBDatabase, transaction: IDBTransaction) => void | Promise<void>;
}

export interface DatabaseConfig {
  name: string;
  version: number;
  migrations: Migration[];
}

export interface IModuleDatabase<T = any> {
  init(): Promise<void>;
  get(storeName: string, id: string): Promise<T | null>;
  getAll(storeName: string): Promise<T[]>;
  put(storeName: string, item: T): Promise<void>;
  putBatch(storeName: string, items: T[]): Promise<void>;
  delete(storeName: string, id: string): Promise<void>;
  clear(storeName: string): Promise<void>;
  queryByIndex(storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange): Promise<T[]>;
  exportData(): Promise<Record<string, T[]>>;
  importData(data: Record<string, T[]>): Promise<void>;
  close(): void;
}
