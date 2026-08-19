export interface OcrFixture {
  id: string;
  name: string;
  description: string;
  type: 'digital' | 'scan' | 'technical' | 'complex' | 'negative';
  url?: string;
  groundTruth: {
    fullText: string;
    technicalTokens: string[];
    pages: {
      page: number;
      text: string;
    }[];
  };
  metadata?: {
    dpi?: number;
    rotation?: number;
    isSkewed?: boolean;
    isMixedLanguage?: boolean;
  };
}

export const OCR_BENCHMARK_FIXTURES: OcrFixture[] = [
  {
    id: 'vi-digital-01',
    name: 'Vietnamese Digital PDF',
    description: 'Standard Unicode Vietnamese text from a digital source.',
    type: 'digital',
    groundTruth: {
      fullText: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
      technicalTokens: ['VIỆT NAM'],
      pages: [
        { page: 1, text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc' }
      ]
    }
  },
  {
    id: 'vi-scan-300dpi',
    name: 'Vietnamese Scan 300 DPI',
    description: 'High quality scan of Vietnamese document.',
    type: 'scan',
    metadata: { dpi: 300 },
    groundTruth: {
      fullText: 'Hệ thống điều hòa trung tâm VRV.',
      technicalTokens: ['VRV'],
      pages: [{ page: 1, text: 'Hệ thống điều hòa trung tâm VRV.' }]
    }
  },
  {
    id: 'tech-spec-01',
    name: 'Technical Data Sheet',
    description: 'Document with serial numbers, units, and technical parameters.',
    type: 'technical',
    groundTruth: {
      fullText: 'Model: ABC-1234. S/N: 998877. Công suất: 500kW. Tần số: 50Hz.',
      technicalTokens: ['ABC-1234', '998877', '500kW', '50Hz'],
      pages: [{ page: 1, text: 'Model: ABC-1234. S/N: 998877. Công suất: 500kW. Tần số: 50Hz.' }]
    }
  },
  {
    id: 'mixed-en-vi-01',
    name: 'Mixed language manual',
    description: 'Technical manual with mixed English and Vietnamese.',
    type: 'complex',
    metadata: { isMixedLanguage: true },
    groundTruth: {
      fullText: 'Installation Guide - Hướng dẫn lắp đặt máy phát điện.',
      technicalTokens: ['Installation Guide'],
      pages: [{ page: 1, text: 'Installation Guide - Hướng dẫn lắp đặt máy phát điện.' }]
    }
  },
  {
    id: 'rotated-90',
    name: 'Rotated Page',
    description: 'Document rotated 90 degrees.',
    type: 'complex',
    metadata: { rotation: 90 },
    groundTruth: {
      fullText: 'Văn bản nằm ngang.',
      technicalTokens: [],
      pages: [{ page: 1, text: 'Văn bản nằm ngang.' }]
    }
  },
  {
    id: 'encrypted-pdf',
    name: 'Encrypted PDF',
    description: 'Protected PDF that should fail with specific error.',
    type: 'negative',
    groundTruth: {
      fullText: '',
      technicalTokens: [],
      pages: []
    }
  }
];
