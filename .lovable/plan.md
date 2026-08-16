# Astryx Design System Integration Plan

Establish the foundation for the Astryx Design System while preserving all existing project logic and visual tokens.

## User Review Required

> [!IMPORTANT]
> - React 19.2.0 is detected, meeting the requirement for Astryx (React >= 19).
> - The installation includes `@astryxdesign/cli` which will be mapped to the `npm run astryx` script as requested.

## Proposed Changes

### 1. Dependency Management
- Install `@astryxdesign/cli` as a development dependency.
- Update `package.json` to include the `"astryx"` script pointing to the local CLI binary.

### 2. Global Styling Foundation
- Update `src/styles.css`:
    - Import `@astryxdesign/core/dist/astryx.css` and `@astryxdesign/theme-neutral/dist/theme.css`.
    - Ensure imports are placed before Tailwind utilities to allow for overrides.
    - Retain all existing MIRATS 2.0 tokens (OKLCH colors, motion tokens, density modes).
- Create `src/styles/astryx-theme.css`:
    - Define the custom theme `"vatm"`.
    - Map Astryx semantic tokens to the VATM palette:
        - `primary`: `#1C51E0`
        - `attention`: `#FF8F00`
        - `neutral/graphite`: `#4C5055`
        - `background`: `white` / `foreground`: `black`
    - Configure hairline borders (8%) and radius tokens (8px control, 16px surface).
    - Implement a dark mode variant using the `.dark` selector.

### 3. Application Integration
- Modify `src/routes/__root.tsx`:
    - Import `ThemeProvider` from `@astryxdesign/core`.
    - Wrap the application `<Outlet />` with `ThemeProvider`, specifying the `"vatm"` theme.
    - Ensure all existing providers (QueryClient, Router, Toaster, etc.) remain intact.

### 4. UI Kit Route Creation
- Create `src/routes/_app.admin.ui-kit.tsx`:
    - A dedicated showcase page for the new design system foundation.
    - Present core Astryx components:
        - **Buttons & Icons**: All variants and sizes.
        - **Data Display**: Badges, Status Dots (5 semantic levels), mono-spaced numeric tables.
        - **Forms**: Inputs, Selectors, Fields.
        - **Navigation**: Breadcrumbs, Tab Lists.
        - **Feedback**: Dialogs, Toasts, Skeletons, Empty States.
    - Include density (Compact/Comfortable) and theme (Light/Dark) toggles directly on the page for immediate testing.

## Technical Details

- **React Version**: 19.2.0 (Verified).
- **Astryx Version**: ^0.4.1 (Core and Neutral Theme).
- **StyleX**: Used internally by Astryx for performant atomic CSS.
- **Constraints**: No modifications will be made to existing components or core business routes.

## Success Criteria
- The application builds successfully without type errors.
- The `/admin/ui-kit` route renders correctly in both light and dark modes.
- Astryx semantic tokens are successfully mapped to the VATM brand colors.
