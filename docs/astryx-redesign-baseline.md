# MIRATS ASTRYX TEMPLATES — U0: READ-ONLY BASELINE

## 1. Package Inventory

- **Package Manager**: Bun (as per `bun run build` usage)
- **Astryx Version**: `0.4.1` (core, themes, cli)
- **Primary Exports**: `Theme`, `defineTheme` from `@astryxdesign/core`.
- **Theme Variants**: `theme-neutral`, `theme-stone`.

## 2. CI/Build Baseline

- **Build Status**: Green (Verified via `bun run build`).
- **Test Status**: Green (Verified via `bun run test`).
- **SSR Safety**: Using `AstryxProvider` with hydration guard and `requestAnimationFrame` shim in `src/server.ts`.

## 3. Route Inventory (128 Routes Total)

### Archetypes

- **Dashboard**: `_app.index.tsx` (Personalized Widget Grid).
- **List/Table**: `_app.thiet-bi.index.tsx`, `_app.admin.forms.index.tsx`.
- **Detail**: `_app.he-thong.$id.tsx`, `_app.thiet-bi.$id.tsx`.
- **Form**: `_app.forms.new.$code.tsx`, `_app.admin.forms.$id.tsx`.
- **Settings/Admin**: `_app.admin.permissions.tsx`, `_app.admin.thuong-hieu.tsx`.
- **Workflow**: `_app.ban-giao.tsx`, `_app.kiem-tra.tsx`.
- **Visualization**: `_app.he-thong.cay.tsx` (MindMap/React Flow).
- **Auth**: `auth.tsx` (Login/Register).

## 4. Component Inventory (241 MIRATS Components)

### Primitives Usage

- **PageHeader**: Unified icon + title + description header.
- **StandardTable**: Core data grid with multi-level filtering.
- **AppShell**: Main layout with collapsible sidebar (T17).
- **Astryx Skins**: Applied via `astryx-component-skins.css` and `df3Theme`.

## 5. UI Anatomy (Sample: Dashboard)

- **Anatomy**: TopBar (Breadcrumbs + Profile) -> DashboardGrid -> Widget Cards.
- **Interaction**: Drag-and-drop widgets, hover tooltips, smooth transitions.
- **Keyboard**: Full navigation support via CommandPalette (`Cmd+K`).
- **Mobile**: Responsive grid, bottom-tab-like navigation via sidebar collapse.

## 6. Astryx Integration State

- **Import Strategy**: Lazy-loaded `AstryxProvider` to prevent SSR leaks.
- **Styling**: Tailwind v4 + OKLCH tokens + static B-S skins.
- **Theme Engine**: Custom `df3Theme` mapping brand blue `#0074e2`.
- **SSR Guards**: `requestAnimationFrame` shim in entry points.

---

_Rollback Checkpoint: Ready for U1._
