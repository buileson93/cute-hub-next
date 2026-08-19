/// <reference lib="webworker" />

/**
 * PDF OCR Worker for MIRATS.
 * Handles the heavy lifting of OCR in a background thread.
 * Note: Browser-only APIs like Canvas are available in Workers via OffscreenCanvas.
 */

self.onmessage = async (e: MessageEvent) => {
  const { file, options } = e.data;
  
  try {
    // In a real worker, we would import the pipeline here.
    // However, Vite workers and complex imports like pdfjs-dist 
    // often need specific configuration.
    
    // For now, this is a skeleton showing the progress communication logic.
    self.postMessage({ type: 'status', status: 'starting' });
    
    // Logic would go here to run the pipeline
    // self.postMessage({ type: 'progress', page: 1, total: 10, result: {...} });
    
    self.postMessage({ type: 'done', results: [] });
  } catch (error) {
    self.postMessage({ type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
};

export {};
