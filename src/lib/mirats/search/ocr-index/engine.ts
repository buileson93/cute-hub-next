import MiniSearch, { SearchOptions, SearchResult } from 'minisearch';
import { boDauTiengViet, chuanHoaTho } from '../chuan-hoa';

export interface SearchResultItem {
  id: string;
  sourceType: string;
  sourceId: string;
  fileName: string;
  page?: number;
  snippet: string;
  score: number;
  route: string;
}

export interface IndexableDoc {
  id: string;
  fileName: string;
  sourceCode?: string;
  sourceName?: string;
  description?: string;
  normalizedText: string;
  sourceType: string;
  sourceId: string;
  page?: number;
  route: string;
}

/**
 * Technical token preservation regex.
 * Handles slashes, dots, dashes in codes like P/N: 123.ABC-X
 */
const TECHNICAL_TOKEN = /[a-z0-9]+(?:[./-][a-z0-9]+)*/gi;

export class MiniSearchAdapter {
  private engine: MiniSearch<IndexableDoc>;

  constructor() {
    this.engine = new MiniSearch({
      fields: ['fileName', 'sourceCode', 'sourceName', 'description', 'normalizedText'],
      storeFields: ['id', 'sourceType', 'sourceId', 'fileName', 'page', 'route'],
      searchOptions: {
        boost: {
          fileName: 4,
          sourceCode: 3,
          sourceName: 2,
          description: 2,
          normalizedText: 1
        },
        prefix: true,
        fuzzy: 0.2
      },
      // Custom tokenizer to handle technical tokens better
      tokenize: (text) => {
        const tokens = text.match(TECHNICAL_TOKEN) || [];
        return tokens.map(t => t.toLowerCase());
      },
      // Process term for matching
      processTerm: (term) => boDauTiengViet(term).toLowerCase()
    });
  }

  addDocuments(docs: IndexableDoc[]) {
    this.engine.addAll(docs);
  }

  removeDocument(id: string) {
    if (this.engine.has(id)) {
      this.engine.remove({ id } as any);
    }
  }

  search(query: string, options?: SearchOptions): SearchResultItem[] {
    const results = this.engine.search(query, options);
    return results.map(r => ({
      id: r.id,
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      fileName: r.fileName,
      page: r.page,
      score: r.score,
      route: r.route,
      snippet: this.generateSnippet(r, query)
    }));
  }

  private generateSnippet(result: SearchResult, query: string): string {
    // Basic snippet logic - in a real app we'd fetch the raw text
    // MiniSearch doesn't store the full text by default unless in storeFields
    // We'll return a placeholder or implement snippet extraction if we store rawText
    return "..."; 
  }

  toJSON(): string {
    return JSON.stringify(this.engine.toJSON());
  }

  static fromJSON(json: string): MiniSearchAdapter {
    const adapter = new MiniSearchAdapter();
    adapter.engine = MiniSearch.loadJSON(json, {
      fields: ['fileName', 'sourceCode', 'sourceName', 'description', 'normalizedText'],
      storeFields: ['id', 'sourceType', 'sourceId', 'fileName', 'page', 'route']
    });
    return adapter;
  }
}
