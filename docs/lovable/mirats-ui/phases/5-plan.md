# Phase 5: Feedback & Status Primitives (Plan)

## Scope
Visual migration of non-interactive feedback and status indicators to the SSR-safe static Astryx foundation.
- **Components**: `Badge`, `Skeleton`, `Avatar`, `Separator`.
- **Architecture**: Move from Tailwind utility-heavy React components to semantic `data-astryx-*` attributes and static CSS skins.
- **Visual Reference**: Astryx 0.4.5 (Pinned to MIRATS Blue #0074e2).

## Implementation Details

### 1. CSS Layer Update (`src/styles/astryx-static/components.css`)
- **Badge**:
    - Geometry: `height: 1.25rem` (20px), font `10px`, weight `700`, uppercase.
    - Variants: `default` (Solid MIRATS Blue), `secondary` (Soft Neutral), `outline`, `destructive`.
    - Semantic Status: `success`, `warning`, `error`, `info` (Using soft background + saturated text).
- **Skeleton**:
    - Static animation: `astryx-pulse` (0.5 to 0.8 opacity).
    - Skin: Subtle neutral background.
- **Avatar**:
    - Circle geometry with border-radius pinning.
    - Fallback background skins.
- **Separator**:
    - Hairline geometry (1px).
    - Horizontal and Vertical support.

### 2. React Refactor
- **Badge**: Refactor `src/components/ui/badge.tsx`. Remove CVA variant classes. Map variants to `data-astryx-variant` and `data-astryx-size`.
- **Skeleton**: Refactor `src/components/ui/skeleton.tsx`. Add `data-astryx-control="skeleton"`.
- **Avatar**: Refactor `src/components/ui/avatar.tsx`. Add `data-astryx-control="avatar"`, `data-astryx-control="avatar-image"`, etc.
- **Separator**: Refactor `src/components/ui/separator.tsx`. Add `data-astryx-control="separator"`.

## Pilot Surfaces
- **Dashboard (/tong-quan)**: Verify Skeletons and Badges in KPI cards.
- **Catalog (/thiet-bi)**: Verify Status Badges in table rows.
- **TopBar**: Verify User Avatar.

## Verification
- **SSR**: Ensure identical DOM snapshots.
- **Hydration**: Confirm zero warnings.
- **Visual**: Capture before/after evidence for `dashboard_status.png` and `avatar_check.png`.
