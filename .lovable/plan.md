# Phase 4: Admin UI Kit - Isolated Verification

Establish an independent verification route for the Astryx Design System in MIRATS 2.0. This route will serve as the single source of truth for component API implementation and visual parity checks before migration to production routes.

## User Review Required

> [!IMPORTANT]
> The `/admin/ui-kit` route will be created. It requires an authenticated session with admin privileges (inherited from the `/admin` parent route protection).

## Proposed Changes

### 1. New Independent Route
- Create `src/routes/admin.ui-kit.tsx` implementing a comprehensive showcase of Astryx components using **static data**.
- Ensure the route is automatically registered by the TanStack Router generator.

### 2. Component Showcase (Static)
- **Buttons**: Button, IconButton (Variants: primary, secondary, ghost, destructive; States: loading, disabled, tooltip).
- **Feedback**: Badge (semantic & color), StatusDot (pulsing/static), Toast (via `useToast`), Skeleton (staggered list), EmptyState.
- **Data Display**: Card, Table (density variants, cell rendering), Breadcrumbs.
- **Inputs**: TextInput (status variants, icons), Selector (sections, search).
- **Overlays**: Dialog (standard/fullscreen/form purpose).

### 3. Visual & Technical Standards
- **Density**: Demonstrate `compact` (VATM default) vs `comfortable` vs `spacious`.
- **Theme**: Verify mapping of MIRATS brand colors (#1C51E0 blue, #FF8F00 orange) in both Light and Dark modes.
- **Accessibility**: Verify ARIA labels, focus rings, and keyboard navigation.

### 4. Verification Logic
- **Build**: Ensure production build succeeds with the new route.
- **Isolation**: Verify no existing route or component is affected by this addition.

## Technical Details

### Component Mapping (Legacy -> Astryx)
| Legacy Component | Astryx Target | Key API verified |
| --- | --- | --- |
| `Button` | `@astryxdesign/core/Button` | `label`, `clickAction` |
| `Badge` | `@astryxdesign/core/Badge` | `variant`, `label` |
| `StandardTable` | `@astryxdesign/core/Table` | `columns`, `renderCell` |
| `Dialog` | `@astryxdesign/core/Dialog` | `purpose`, `onOpenChange` |

### Infrastructure Fix (Pre-requisite)
- **Fonts**: Installed `@fontsource/inter`, `@fontsource-variable/space-grotesk`, and `@fontsource/ibm-plex-mono` to resolve the build error observed in Phase 3.
- **Layers**: Maintain `@layer` isolation in `styles.css`.

## Rollback Plan
- If the build fails or `routeTree.gen.ts` is corrupted, the `src/routes/admin.ui-kit.tsx` file will be deleted and the generator re-run to restore baseline.
