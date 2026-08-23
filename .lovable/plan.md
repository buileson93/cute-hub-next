# Plan - Unified Layout Framework & Scroll Fix (Phase 11R)

Refactor the application layout to enforce the "One Scroll Owner" principle using the `PageFrame`, `PageHeader`, and `PageBody` pattern across all routes to ensure consistent scrolling behavior and fixed navigation.

## User Review Required

> [!IMPORTANT]
> This refactor will update the internal structure of all major pages. While visual appearance will remain consistent with the Astryx design system, the scroll behavior will become unified (Header/Sidebar fixed, Content scrolls).

- Does the proposed "One Scroll Owner" approach (Fixed Header/Sidebar, Scrolling Content Body) align with your expectations for the entire site?

## Proposed Changes

### 1. Visual Text Edits (Roadmap Updates)
- Update `aria-label` in `src/components/mirats/TzClock.tsx` with the new roadmap status.
- Update `AppTooltip` `noiDung` in `src/components/mirats/app-shell/TopBar.tsx` with the new roadmap status.

### 2. Layout Framework Refactor
- **Refactor `CatalogTable.tsx`**:
    - Wrap the component's output in `PageFrame` and `PageBody`.
    - Move `PageHeader` inside `PageFrame` but outside `PageBody` to keep it fixed.
    - Ensure `PageBody` is the primary scrollable area.
- **Unified Layout Wrapping**:
    - Audit and update routes that are currently missing the framework, including:
        - `src/routes/_app.danh-muc.dac-tinh.tsx`
        - `src/routes/_app.danh-muc.vi-tri.tsx` (via `CatalogTable`)
        - `src/routes/_app.danh-muc.don-vi.tsx` (via `CatalogTable`)
        - `src/routes/_app.admin.audit.tsx`
        - And other major routes identified in the audit.

### 3. Scroll Integrity & A11y
- Ensure all `PageBody` components have `tabIndex={0}` and proper ARIA labels for keyboard accessibility.
- Verify that `AppShell`'s `main` container remains `overflow-hidden` while `PageBody` manages internal scrolling.

## Technical Details

### Unified Structure Pattern
Every content route should follow this JSX structure:
```tsx
<PageFrame>
  <PageHeader 
    title="..." 
    icon={...} 
    actions={...} 
  />
  <PageBody>
    {/* Page content here */}
    <StandardTable ... />
  </PageBody>
</PageFrame>
```

### Components Involved
- `src/components/mirats/layout/PageFrame.tsx`: Sets `h-dvh overflow-hidden`.
- `src/components/mirats/PageHeader.tsx`: Sets `sticky top-0 z-20`.
- `src/components/mirats/PageBody.tsx`: Sets `overflow-y-auto mirats-scroll flex-1`.

### Verification Plan
- **Automated Tests**: Run `tests/full-site-integrity.test.py` (or update it) to verify that Header/Sidebar are fixed and `PageBody` is scrollable on all main routes.
- **Manual Verification**: Check `/danh-muc/vi-tri` and `/danh-muc/dac-tinh` to ensure they scroll correctly.
