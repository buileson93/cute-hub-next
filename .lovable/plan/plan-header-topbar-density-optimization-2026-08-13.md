# Plan - Header & TopBar Density Optimization

Reduce vertical space at the top of pages by consolidating TopBar, Breadcrumbs, and PageHeader, and eliminating redundant titles.

## Phase 1: TopBar & Layout Consolidation

- **Unified TopBar Height**: Set global `APP_HEADER_H` to a strict `48px` (already defined as `h-12` or `h-[48px]` in `ui-density.ts`).
- **Horizontal Padding**: Reduce `AppShell` header padding to `px-4` (16px).
- **Search Bar**: Ensure search input is `h-8` (32px) and fully rounded.
- **Integrated Breadcrumb**: Move breadcrumb navigation into the `TopBar` next to the search bar instead of a separate row.

## Phase 2: PageHeader & ActionBar Convergence

- **Height Limit**: Refactor `PageHeader` and `ActionBar` to render as a single row with a maximum height of `40px` (using `h-10` or `UI_DENSITY` tokens).
- **Typography**: Reduce `PageHeader` title from `text-lg` to `text-base font-semibold`.
- **Icon Scale**: Reduce header icons from `h-5` to `16px` (`h-4`).
- **Description Overhaul**: Move `PageHeader.description` to a single-line truncated text with a full-content `Tooltip` (or Info icon) instead of a multiline block.
- **Redundancy Cleanup**: Remove `CardHeader`/`CardTitle` from components (like `StandardTable` wrappers) when they repeat the page's H1 title.

## Phase 3: Density Token Refinement

- **Anti-Stacking**: Remove conflicting `space-y` from children when the parent already defines a `gap`.
- **Global Spacing**: Ensure `PAGE_PADDING` and `SECTION_GAP` are consistently applied via `UI_DENSITY` to avoid layout shifts.

## Technical Details & Files

- `src/lib/mirats/ui/ui-density.ts`: Update tokens for consistent `48px` header and `40px` action bar.
- `src/components/mirats/app-shell/TopBar.tsx`: Integrate breadcrumbs, adjust search bar and padding.
- `src/components/mirats/app-shell/AppShell.tsx`: Sync header height and padding classes.
- `src/components/mirats/PageHeader.tsx`: Shrink title/icon, consolidate layout, move description to tooltip.
- `src/routes/_app.vat-tu.tsx`, `_app.thiet-bi.index.tsx`, `_app.su-co.index.tsx`: Remove redundant card titles and sync spacing.

## Measurement Targets

- **Header Height (Current)**: TopBar (56px) + PageHeader (approx. 60-80px) = **~120px+**.
- **Header Height (Goal)**: TopBar w/ Breadcrumb (48px) + Consolidated Action Bar (40px) = **~88px**.
- **Savings**: **~30-40px** of vertical real estate.
