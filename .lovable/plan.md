# Plan: Button & IconButton Parity (Phase 2)

Establish exact visual parity for Button and IconButton components based on the Astryx 0.4.5 reference, using only static CSS and semantic tokens while preserving existing React behavior and SSR stability.

## 1. Current Source Audit

### Button Component (`src/components/ui/button.tsx`)
- **Base:** Shadcn UI + `class-variance-authority`.
- **Props:** `variant` (default, destructive, outline, secondary, ghost, link), `size` (default, sm, xs, lg, icon), `loading`, `tooltip`.
- **Contract:** Standard HTML button attributes + Radix `Slot` for `asChild` support.
- **Density Logic:** Uses `data-density="comfortable"` for height/text-size adjustments.

### pilot Locations
- **Dashboard:** `src/routes/_app.index.tsx` (Actions: "Cá nhân hóa", "Hoàn tất").
- **Asset Catalog:** `src/routes/_app.danh-muc.model.tsx` (Action: "Thêm mẫu").

## 2. Technical Investigation

### The "Gray Primary" Bug
- **Cause:** In `src/components/ui/button.tsx`, the `astryx-control` class is added to all buttons. In `src/styles/astryx-component-skins.css`, `.astryx-control` includes `border: 1px solid var(--color-border)`. 
- **Conflict:** The `bg-primary` utility from Tailwind v4 (mapped to `--primary` in `@theme`) is being visually muted or overridden by the cascade order of Astryx static layers if not explicitly prioritized, or the `--primary` token is not being correctly applied to the background in the `astryx-base` layer.
- **Fix:** Move the primary background definition to the `@layer components` level or ensure `astryx-static/theme.css` correctly maps `--primary` to the background-color of buttons with `data-variant="primary"`.

## 3. Astryx Visual Contract (v0.4.5)

### Variants & States
- **Primary:** `bg: var(--color-accent)`, `text: var(--color-on-accent)`, `shadow: shadow-sm`.
- **Secondary:** `bg: var(--color-neutral)`, `text: var(--color-text-primary)`.
- **Ghost:** `bg: transparent`, `text: var(--color-text-secondary)`, `hover-bg: var(--color-neutral)`.
- **Danger:** `bg: var(--color-danger)`, `text: var(--color-on-danger)`.

### Sizing & Geometry
- **Height:** 28px (sm), 32px (default), 40px (lg).
- **Radius:** 0.625rem (`--radius-element`).
- **Font Size:** 11px (sm), 13px (default).
- **Active State:** `transform: scale(0.98)`, `duration: 125ms`.

## 4. Implementation Strategy

### Step A: Metadata & Selectors
Add stable data attributes to `Button` for CSS targeting without breaking React logic:
- `data-astryx-variant`: Mapping of `variant` prop.
- `data-astryx-size`: Mapping of `size` prop.
- `data-astryx-loading`: Boolean state.

### Step B: CSS Foundation Updates
Update `src/styles/astryx-static/components.css` to include precise button skinning:
```css
[data-astryx-control] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-element);
  font-weight: 600;
  transition: all var(--duration-fast) var(--ease-standard);
}

[data-astryx-variant="primary"] {
  background-color: var(--color-accent);
  color: var(--color-on-accent);
}
```

### Step C: Component Refinement
- Update `src/components/ui/button.tsx` to apply these attributes.
- Ensure `IconButton` logic (size="icon") correctly strips internal padding and centers the icon.
- Remove the "Manifesto" text from `src/components/mirats/app-shell/index.tsx` (reverting user menu to clean state).

## 5. Verification Plan

### Manual Inspection (Pilot Routes)
1. **Dashboard:** Verify "Cá nhân hóa" is MIRATS Blue (#0074e2), transitions to "Hoàn tất" with proper scale effect.
2. **Catalog:** Verify "Thêm mẫu" maintains primary state.

### Automated Checks
- **SSR/Hydration:** Run `lovable-exec "bun run build"` to ensure no tree mismatches.
- **Computed Styles:** Verify `border-radius` is exactly `10px` (0.625rem) and `font-size` is `13px`.
- **Accessibility:** Verify `aria-label` is present on all icon-only buttons.
