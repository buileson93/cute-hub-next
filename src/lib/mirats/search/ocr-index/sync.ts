import { supabase } from "@/integrations/supabase/client";
import { initOcrDb, OcrSearchDoc, OcrPageDoc } from "./db";
import { MiniSearchAdapter, IndexableDoc } from "./engine";
import { boDauTiengViet, chuanHoaTho } from "../chuan-hoa";

export class SearchSyncManager {
  private dbPromise = initOcrDb();
  private engine: MiniSearchAdapter;

  constructor(engine: MiniSearchAdapter) {
    this.engine = engine;
  }

  async sync(partitionKey: string) {
    const db = await this.dbPromise;
    const syncState = await db.get('sync_state', partitionKey);
    const lastSyncedAt = syncState?.lastSyncedAt || '1970-01-01T00:00:00Z';

    // 1. Fetch incremental updates from Supabase
    // Using manual type casting because the generated types might not have the relationships inferred correctly
    const { data: ocrRows, error } = await supabase
      .from('tai_lieu_ocr')
      .select(`
        *,
        model_tai_lieu!source_id (file_name, mo_ta, model:model_id(ten, ma)),
        thiet_bi_tep_dinh_kem!source_id (file_name, mo_ta, thiet_bi:thiet_bi_id(ten_thiet_bi, ma_thiet_bi))
      `)
      .gt('updated_at', lastSyncedAt)
      .eq('status', 'completed')
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('OCR Sync Error:', error);
      return;
    }

    if (!ocrRows || ocrRows.length === 0) return;

    const tx = db.transaction(['documents', 'pages', 'sync_state'], 'readwrite');
    const docStore = tx.objectStore('documents');
    const pageStore = tx.objectStore('pages');

    const indexableDocs: IndexableDoc[] = [];

    for (const row of (ocrRows as any[])) {
      const docId = `${row.source_type}:${row.source_id}`;
      
      // Map metadata safely
      const meta = row.source_type === 'model_tai_lieu' 
        ? { 
            name: row.model_tai_lieu?.ten_tai_lieu, 
            code: row.model_tai_lieu?.ma_tai_lieu, 
            desc: row.model_tai_lieu?.mo_ta 
          }
        : { 
            name: row.thiet_bi_tep_dinh_kem?.file_name, 
            code: undefined, 
            desc: row.thiet_bi_tep_dinh_kem?.mo_ta 
          };

      const doc: OcrSearchDoc = {
        id: docId,
        sourceType: row.source_type,
        sourceId: row.source_id,
        fileName: meta.name || 'Unknown',
        sourceName: meta.name,
        sourceCode: meta.code,
        description: meta.desc,
        route: `/tai-lieu?doc=${row.source_id}`,
        updatedAt: row.updated_at,
        ocrVersion: row.ocr_version || '1.0'
      };

      await docStore.put(doc);

      // Process pages
      const pages = (row.pages as any[]) || [];
      for (const p of pages) {
        const pageId = `${docId}:${p.page}`;
        const pageDoc: OcrPageDoc = {
          id: pageId,
          docId: docId,
          page: p.page,
          rawText: p.rawText,
          normalizedText: chuanHoaTho(p.rawText),
          confidence: p.confidence
        };
        await pageStore.put(pageDoc);

        indexableDocs.push({
          id: pageId,
          fileName: doc.fileName,
          sourceCode: doc.sourceCode,
          sourceName: doc.sourceName,
          description: doc.description,
          normalizedText: pageDoc.normalizedText,
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          page: pageDoc.page,
          route: doc.route
        });
      }
    }

    // Update engine
    this.engine.addDocuments(indexableDocs);

    // Update sync state
    await tx.objectStore('sync_state').put({
      partitionKey,
      lastSyncedAt: ocrRows[ocrRows.length - 1].updated_at,
      schemaVersion: 1
    });

    await tx.done;
  }

  async loadFromLocal(partitionKey: string) {
    const db = await this.dbPromise;
    const docs = await db.getAll('documents');
    const pages = await db.getAll('pages');

    const indexableDocs: IndexableDoc[] = [];
    
    // Efficiently build indexable docs from local data
    const docMap = new Map(docs.map(d => [d.id, d]));
    
    for (const p of pages) {
      const doc = docMap.get(p.docId);
      if (doc) {
        indexableDocs.push({
          id: p.id,
          fileName: doc.fileName,
          sourceCode: doc.sourceCode,
          sourceName: doc.sourceName,
          description: doc.description,
          normalizedText: p.normalizedText,
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          page: p.page,
          route: doc.route
        });
      }
    }

    this.engine.addDocuments(indexableDocs);
  }
}
