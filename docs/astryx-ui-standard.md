# MIRATS ASTRYX UI Standard

This document defines the UI architecture and implementation standards for the MIRATS 2.0 migration to the Astryx Design System within a TanStack Start (Cloudflare Worker) SSR environment.

## 1. Hybrid Architecture Decision Tree

We use a graduated model for component implementation to balance SEO, performance, and interactivity.

### S: Static CSS (Pure HTML/CSS)
- **Use for:** Global resets, layout primitives, critical brand colors.
- **Rules:** No JavaScript logic. Standard HTML elements.
- **Registry:** `src/styles.css`, `src/styles/astryx-component-skins.css`.

### B-S: Built-in Skins (SSR-Safe)
- **Use for:** Buttons, Cards, Inputs, Tables (visual only), Typography.
- **Rules:** Use Astryx Stone CSS classes on standard elements (e.g., `<button className="astryx-button">`). 
- **SSR Path:** Must render identical HTML on server and client. No browser-global dependencies.

### H: Hydrated Islands (Lazy Interactivity)
- **Use for:** Complex interactive elements like Dropdowns, Modals, Tooltips, Tabs.
- **Rules:** Wrapped in `Suspense` + `lazy`. Hydrate after initial paint.
- **Fallback:** Must provide a meaningful B-S styled skeleton or static version during SSR.

### I: Interactive Components (Browser-Only)
- **Use for:** Third-party widgets, rich editors, non-critical decorative animations.
- **Rules:** Shielded by `if (!hydrated) return null;`.
- **Constraint:** Never allow `I` to block LCP (Largest Contentful Paint).

### R: Rich Visualization (Heavy Runtime)
- **Use for:** MindMaps (React Flow), Charts (Recharts/Chart.js).
- **Rules:** Path-based isolation (e.g., `/he-thong/cay`). Documentation of performance impact required.

### F: Functional Backfill (Legacy)
- **Use for:** Business logic from MIRATS 1.0 being ported to the new shell.
- **Rules:** Wrapped in standard MIRATS components to maintain visual parity.

## 2. Implementation Rules

### 2.1 CSS & Theming
- **Provenance:** All Astryx styles must come from `@astryxdesign` packages or the internal `astryx-component-skins.css`.
- **Tokens:** Use CSS variables (e.g., `--astryx-color-primary`). Never use hardcoded hex values in component files.
- **States:** Every control must implement `:hover`, `:focus-visible`, `:disabled`, and `:active` states.

### 2.2 SSR Safety
- **No Browser Globals:** `window`, `document`, `navigator`, and `requestAnimationFrame` must not be accessed at module scope.
- **Hydration Guards:** Use `AstryxProvider` to shim missing Worker APIs.
- **Module Safety:** Components using browser APIs must be `.client.tsx` or lazy-loaded.

### 2.3 Performance & Chunks
- **Waterfall Prevention:** Avoid nested lazy imports. Batch feature-related components into shared islands.
- **Preload:** Use `router.preloadRoute` on hover for high-intent navigation.

## 3. Visual & State Gates

1. **Direct Refresh Gate:** The route must load (200 OK) on a direct browser refresh without JS errors.
2. **SEO Gate:** Critical content (titles, text, primary data) must be present in the initial SSR HTML.
3. **A11y Gate:** Every icon-only button needs `aria-label`. Focus traps must be maintained in overlays.
4. **Performance Gate:** LCP < 2.5s. No layout shifts (CLS < 0.1) caused by hydration.

## 4. Allowlist

Only the following libraries are approved for interactive runtime:
- `@astryxdesign/*`
- `@xyflow/react` (MindMaps only)
- `lucide-react` (Icons)
- `sonner` (Toasts)
- `vaul` (Drawers)
