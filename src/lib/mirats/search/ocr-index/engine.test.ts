import { describe, it, expect } from 'vitest';
import { MiniSearchAdapter } from './engine';

describe('MiniSearchAdapter', () => {
  it('should generate snippets with highlights', () => {
    const adapter = new MiniSearchAdapter();
    const docs = [{
      id: '1',
      fileName: 'Test File.pdf',
      normalizedText: 'Đây là nội dung văn bản kỹ thuật với mã P/N: 123.ABC-X để kiểm tra tìm kiếm.',
      sourceType: 'thiet_bi',
      sourceId: '123',
      route: '/tai-lieu?doc=123'
    }];
    
    adapter.addDocuments(docs);
    const results = adapter.search('kỹ thuật');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet).toContain('**kỹ**');
    expect(results[0].snippet).toContain('**thuật**');
  });

  it('should handle technical tokens', () => {
    const adapter = new MiniSearchAdapter();
    const docs = [{
      id: '1',
      fileName: 'Manual.pdf',
      normalizedText: 'Part number is P/N: 123.ABC-X.',
      sourceType: 'thiet_bi',
      sourceId: '123',
      route: '/tai-lieu?doc=123'
    }];
    
    adapter.addDocuments(docs);
    const results = adapter.search('123.ABC-X');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet).toContain('**123.ABC-X**');
  });

  it('should handle unaccented search for accented text', () => {
    const adapter = new MiniSearchAdapter();
    const docs = [{
      id: '1',
      fileName: 'Accents.pdf',
      normalizedText: 'Hệ thống điều hòa không khí.',
      sourceType: 'thiet_bi',
      sourceId: '123',
      route: '/tai-lieu?doc=123'
    }];
    
    adapter.addDocuments(docs);
    // Note: MiniSearch handles the matching via processTerm, 
    // but highlighting needs to be accent-aware in engine.ts
    const results = adapter.search('he thong');
    
    expect(results.length).toBeGreaterThan(0);
    // Snippet highlight uses normalized regex, so 'Hệ thống' should be matched by 'he thong'
    expect(results[0].snippet).toContain('**Hệ thống**');
  });
});
