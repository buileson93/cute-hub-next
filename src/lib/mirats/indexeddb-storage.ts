import { openDB, type IDBPDatabase } from 'idb';
import type { OutboxItem, Storage } from './offline-queue';

const DB_NAME = 'mirats-offline-db';
const STORE_NAME = 'outbox';
const VERSION = 1;

export class IndexedDBStorage implements Storage {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db: IDBPDatabase) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('created_at', 'created_at');
        }
      },
    });
  }

  async put(item: OutboxItem): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, item);
  }

  async get(id: string): Promise<OutboxItem | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_NAME, id);
  }

  async list(): Promise<OutboxItem[]> {
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  async remove(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}

export const offlineStorage = new IndexedDBStorage();
