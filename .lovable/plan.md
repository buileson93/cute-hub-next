# Plan - Adaptive OCR Engine Foundation for MIRATS

Implement a flexible, multi-provider OCR architecture that selects the best engine based on client device capabilities and document properties.

## Architecture Components

### 1. Capability & Profiling (`capabilities.ts`, `device-profiler.ts`)
- Detect browser features: WebGPU, WASM SIMD, WASM Threads, OffscreenCanvas, etc.
- Run light micro-benchmarks to assess actual processing speed.
- Cache profiles in IndexedDB (via `idb`) to avoid redundant checks.

### 2. Provider System (`provider.ts`, `provider-registry.ts`)
- Define `OcrProvider` interface for unified interaction.
- Registry for managing multiple providers (built-in and lazy-loaded).

### 3. Core Providers
- **pdf-text-provider.ts**: Extract native text layers using `pdfjs-dist` (Efficiency first).
- **tesseract-provider.ts**: Reliable fallback using `tesseract.js` in a Worker (Broad compatibility).

### 4. Adaptive Logic (`adaptive-selector.ts`)
- Select quality profiles (`eco`, `balanced`, `quality`) based on device tier.
- Orchestrate fallback logic (e.g., fallback to Tesseract if WebGPU fails or confidence is too low).
- User override support for manual quality selection.

## Technical Details

- **Strict TypeScript**: Zod validation for OCR results and capability objects.
- **Resource Management**: Explicit `dispose()` logic to clean up Workers, WebGPU contexts, and Canvases.
- **Lazy Loading**: Heavier experimental models (ONNX, etc.) will be dynamically imported.
- **Vietnamese Support**: Prioritize engines and models optimized for `vie+eng`.

## Verification Plan

- **Capability Fallbacks**: Unit tests ensuring detection logic doesn't crash on older browsers.
- **Tier Selection**: Mock different hardware configurations to verify `eco` vs `quality` auto-selection.
- **Resource Cleanup**: Verify `dispose()` correctly terminates workers.
- **Full Build**: Ensure `tesseract.js` and `pdfjs-dist` integration doesn't break SSR or bundle size limits.
