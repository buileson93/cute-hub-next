---
name: Astryx Migration Phase 2: CSS & Theme Integration
description: Integration of Astryx design system CSS layers and Theme Provider into the MIRATS 2.0 baseline.
type: feature
---

# Plan: Astryx Migration Phase 2 — CSS & Theme Integration

Restoration and integration of Astryx design system foundation while maintaining MIRATS 2.0 visual and functional parity.

## Proposed Changes

### Configuration & Styles
#### [CSS] `src/styles.css`
- Establish formal Tailwind v4 `@layer` order: `reset, theme, base, astryx-base, astryx-theme, components, utilities`.
- Import Astryx base styles: `reset.css`, `astryx.css`.
- Import `neutralTheme` from `@astryxdesign/theme-neutral/theme.css`.
- **Note:** `tailwind-theme.css` bridge is omitted to avoid collision with existing MIRATS semantic utilities (`text-primary`, `bg-card`).
- Preserve all existing MIRATS tokens, dark mode selectors, and specialized utility classes (density, motion, scrollbars).

### Components
#### [Astryx] `src/components/astryx-pilot/AstryxProvider.tsx`
- Implement standard `AstryxProvider` using `Theme` from `@astryxdesign/core/theme` and `neutralTheme` from `@astryxdesign/theme-neutral/built`.
- Configure default mode to support MIRATS's existing dark mode logic.

### Routing
#### [Root] `src/routes/__root.tsx`
- Wrap the core subtree (`Outlet`, `Toaster`, `SavingIndicator`, `OfflineBanner`) with `AstryxProvider`.
- Maintain existing provider order (QueryClientProvider as parent).
- Ensure no impact on existing side effects or global error handling.

## Technical Details

### CSS Layer Strategy
```css
@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;

@import "tailwindcss" source(none) layer(theme);
@import "@astryxdesign/core/reset.css" layer(reset);
@import "@astryxdesign/core/astryx.css" layer(astryx-base);
@import "@astryxdesign/theme-neutral/theme.css" layer(astryx-theme);
```

### Provider Integration
```tsx
<QueryClientProvider client={queryClient}>
  <AstryxProvider>
    <Outlet />
    <Toaster />
    {/* ... other MIRATS components */}
  </AstryxProvider>
</QueryClientProvider>
```

## Verification Plan

### Automated Tests
- `npm run typecheck`: Verify no regression in TypeScript definitions.
- `npm run build:dev`: Confirm successful production-like bundling.

### Manual Verification (5 Pilot Routes)
- Check Light/Dark mode consistency on:
  - `/` (Dashboard)
  - `/danh-muc/thiet-bi` (Catalog)
  - `/forms/new/su-co` (Forms)
  - `/he-thong/$id` (Details)
  - `/so-do/$id` (Diagrams)
- **Zero-Diff Policy:** If spacing, font sizes, or colors shift unexpectedly, the integration must be rolled back.
- Inspect Console/Network for hydration mismatches or missing CSS assets.
