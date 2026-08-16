---
name: SSR Integrity & Global Guard Restoration
description: Fix persistent 500 errors and ReferenceErrors by strictly guarding browser globals across all components.
type: feature
---

## Goals
1. Fix `ReferenceError: requestAnimationFrame is not defined` and `document is not defined` across the application.
2. Resolve the logic error in `StandardTable.tsx` where an undefined `update` function is referenced.
3. Ensure all `useState` initializers are SSR-safe.

## Proposed Changes

### 1. Global SSR Guards
- **StandardTable.tsx**:
    - Guard `window.cancelAnimationFrame(frameId)`.
    - Remove the broken `window.removeEventListener("resize", update)` call.
    - Ensure `ResizeObserver` cleanup is safe.
- **QRScanner.tsx**:
    - Guard `requestAnimationFrame`, `cancelAnimationFrame`, and `navigator.mediaDevices` usage.
- **NodeNoteDrawer.tsx**:
    - Guard `requestAnimationFrame` in `insertMention`.
- **GraphCanvas.tsx**:
    - Guard `requestAnimationFrame` and `document` references in export and laser pointer logic.
- **UI Kit Route (`_app.admin.ui-kit.tsx`)**:
    - Guard `document.documentElement` check in `useState` initializer for `isDark`.

### 2. Error Diagnostics Enhancement
- Update `src/lib/error-page.ts` to include a raw dump of the error object if a standard message isn't clear, and improve Vietnamese localization for common runtime failures.

### 3. Verification
- Run a full production build (`bun run build`).
- Verify the `/admin/ui-kit` and `/he-thong/cay` routes load without 500 errors.

## Technical Details
- All calls to `requestAnimationFrame`, `cancelAnimationFrame`, `window`, `document`, and `localStorage` must be prefixed with a `typeof window !== "undefined"` check or placed within `useEffect` hooks.
- Logic in `StandardTable.tsx`:
    ```typescript
    // Correcting the broken cleanup
    return () => {
      observer.disconnect();
      if (typeof window !== "undefined" && frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
    ```
- Logic in `UI Kit`:
    ```typescript
    const [isDark, setIsDark] = useState(() => 
      typeof window !== "undefined" ? document.documentElement.classList.contains("dark") : false
    );
    ```
