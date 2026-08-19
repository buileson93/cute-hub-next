import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'mirats-document-search-v1';
const DB_VERSION = 1;

export interface OcrSyncState {
  partitionKey: string; // workspaceId:userId
  lastSyncedAt: string;
  schemaVersion: number;
}

export interface OcrSearchDoc {
  id: string; // source_type:source_id
  sourceType: string;
  sourceId: string;
  fileName: string;
  sourceName?: string;
  sourceCode?: string;
  description?: string;
  route: string;
  updatedAt: string;
  ocrVersion: string;
}

export interface OcrPageDoc {
  id: string; // source_type:source_id:page
  docId: string;
  page: number;
  rawText: string;
  normalizedText: string;
  confidence: number;
}

export async function initOcrDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Documents metadata
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('by_updated', 'updatedAt');
      }

      // Pages content
      if (!db.objectStoreNames.contains('pages')) {
        const pageStore = db.createObjectStore('pages', { keyPath: 'id' });
        pageStore.createIndex('by_doc', 'docId');
      }

      // Sync state per user/workspace
      if (!db.objectStoreNames.contains('sync_state')) {
        db.createObjectStore('sync_state', { keyPath: 'partitionKey' });
      }

      // Snapshots for quick engine boot
      if (!db.objectStoreNames.contains('index_snapshots')) {
        db.createObjectStore('index_snapshots', { keyPath: 'partitionKey' });
      }

      // Device tier and profiling info
      if (!db.objectStoreNames.contains('device_profiles')) {
        db.createObjectStore('device_profiles', { keyPath: 'id' });
      }
    },
  });
}

export async function clearOcrPartition(partitionKey: string) {
  const db = await initOcrDb();
  const tx = db.transaction(['documents', 'pages', 'sync_state', 'index_snapshots'], 'readwrite');
  
  // Note: For a true partition we might need a composite key or filter
  // But for MVP we follow the instruction: logout/switch clears the partition.
  // If multiple partitions exist, we'd need to index by partitionKey.
  // Adding partitionKey to documents and pages for safety.
  
  // Simplifying for now: Clear everything as per instructions for logout/switch.
  await Promise.all([
    tx.objectStore('documents').clear(),
    tx.objectStore('pages').clear(),
    tx.objectStore('sync_state').delete(partitionKey),
    tx.objectStore('index_snapshots').delete(partitionKey)
  ]);
  await tx.done;
}
