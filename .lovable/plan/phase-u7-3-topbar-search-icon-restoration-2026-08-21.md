---
name: Fix PowerSearch Icon Visibility
description: Plan to fix the search icon visibility in TopBar by matching the style of surrounding header buttons and removing conflicting layout logic.
type: feature
---

## Phase U7.3: TopBar Search Icon Restoration

The user reports the PowerSearch magnifying glass icon is still invisible. Analysis shows that while the layout was converted to Flexbox, the button styling (`variant="ghost"`, `bg-muted/40`) and the `renderContent` logic in `Button.tsx` may be causing conflicts, or the icon color/opacity is being suppressed by global Astryx skin overrides.

### Technical Steps

1. **Button Component Fix (`src/components/ui/button.tsx`)**
    - The `renderContent` logic currently wraps children in a `span` with `w-full h-full min-w-0 transition-opacity`.
    - If `loading` is false, it sets `opacity-100`.
    - **Correction**: Simplify `renderContent` to avoid unnecessary nesting that might be swallowed by parent `flex` layouts or CSS transforms. Ensure `span` wrappers don't break flex alignment.

2. **TopBar Refactor (`src/components/mirats/app-shell/TopBar.tsx`)**
    - The search "button" is currently a full-width `Button` component inside a `sm:max-w-sm` container.
    - Other buttons in the header (`NotificationBell`, `QrScanButton`, etc.) use a consistent pattern: a wrapper `div` with `hover:bg-[#0074e2]/10` and an icon inside.
    - **Correction**: Change the search trigger to match the "surrounding buttons" mechanism. Instead of a standard `Button` which might have complex internal DOM, use a semantic `button` or a simplified `Button` variant that exactly replicates the visual style of its neighbors.
    - Explicitly set the `Search` icon color to `text-primary` (MIRATS Blue) without conditional scaling that might fail during render.

3. **CSS Skin Review (`src/styles/astryx-component-skins.css`)**
    - Check if `.astryx-control` or `.astryx-control-skin` has any `opacity: 0` or `display: none` for svg elements when nested inside certain parents.

### Verification Plan
- Use Playwright to check the computed style of the `svg` element inside the search button.
- Verify `visibility`, `opacity`, `width`, and `height`.
- Screenshot at 1280px and 768px (mobile) to ensure icon presence.
