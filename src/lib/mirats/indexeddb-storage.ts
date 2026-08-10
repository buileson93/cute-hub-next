import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'mirats-offline-db';
const STORE_NAME = 'outbox';
const VERSION = 1;

export interface OutboxItem {
  id: string;
  op: string;
  entity_key: string;
  payload: any;
  created_at: number;
  attempts: number;
  last_error?: string;
  status: 'pending' | 'syncing' | 'failed';
}

class IndexedDBStorage {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
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

  async getAll(): Promise<OutboxItem[]> {
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  async getPending(): Promise<OutboxItem[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex(STORE_NAME, 'status', 'pending');
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}

export const offlineStorage = new IndexedDBStorage();
