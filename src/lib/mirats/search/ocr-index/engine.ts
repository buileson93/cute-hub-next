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
      storeFields: ['id', 'sourceType', 'sourceId', 'fileName', 'page', 'route', 'normalizedText'],
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
      processTerm: (term) => chuanHoaTho(term)
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
    const text = result.normalizedText || "";
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const index = text.toLowerCase().indexOf(terms[0]);
    
    if (index === -1) return text.substring(0, 100) + "...";
    
    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + 60);
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = "..." + snippet;
    if (end < text.length) snippet = snippet + "...";
    
    return this.highlightSnippet(snippet, query);
  }

  private highlightSnippet(snippet: string, query: string): string {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    let highlighted = snippet;
    
    // Sort terms by length descending to avoid partial replacements
    terms.sort((a, b) => b.length - a.length);
    
    for (const term of terms) {
      const normalizedTerm = boDauTiengViet(term);
      // Create a regex that finds the term regardless of accents
      // This is a simplified version; for production, a more complex regex mapping is needed
      const regex = new RegExp(`(${normalizedTerm})`, 'gi');
      // Note: This actually replaces the snippet with a simple text-based highlight indicator
      // In a real UI, you'd use a component for this.
      // We'll return it as plain text and let the UI handle it if needed, 
      // but for now, we'll use standard markdown-like bolding for the snippet.
      highlighted = highlighted.replace(regex, '**$1**');
    }
    
    return highlighted;
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
