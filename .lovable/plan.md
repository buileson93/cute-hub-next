# Plan: MIRATS Astryx — P11: Theme + Typography + Component Polish

This plan addresses Phase 11 of the Astryx migration, focusing on visual convergence, typography normalization, and high-impact component rollout.

## Objectives
- **Typography Alignment**: Enforce `Space Grotesk` for headings and `IBM Plex Mono` for data using semantic Astryx tokens.
- **Theme Polish**: Refine the VATM theme to match Astryx's "neutral + accent" aesthetic (subtle borders, consistent radii, restrained color).
- **Component Convergence**: Roll out `MiratsButton`, `MiratsCard`, and `MiratsHeading` to top-level routes to reach C=0 for critical production views.
- **Hierarchy & Spacing**: Standardize page headers and section layouts across the app.

## Proposed Batches

### Batch 1: Typography & Theme Foundation
- Update `src/styles/theme-vatm.ts` to refine tokens (hairline borders, radius-control at 8px).
- Update `MiratsTypography.tsx` to ensure `Heading` and `Text` wrap Astryx primitives correctly without intermediate `div` wrappers if possible (or minimal ones).
- Verify computed styles for body (Inter), heading (Space Grotesk), and data (IBM Plex Mono).

### Batch 2: Core Primitives Rollout (Actions & Containers)
- Bulk migration: Replace `@/components/ui/button` with `MiratsButton` in `src/routes/_app.index.tsx` (Dashboard), `src/routes/_app.tong-quan.tsx`, and `src/routes/_app.he-thong.cay.tsx`.
- Bulk migration: Replace `@/components/ui/card` with `MiratsCard` in the same primary routes.
- Update `MiratsButton` to handle legacy `variant="outline"` mapping more elegantly.

### Batch 3: Layout & Navigation Alignment
- Retheme `Sidebar.tsx`, `TopBar.tsx`, and `AppShell.tsx` using Astryx `Stack`, `HStack`, and `VStack`.
- Map Sidebar items to Astryx `SideNav` style (if available in version) or align with `Text type="label"`.
- Replace manual `h1/h2` in `PageHeader` with `MiratsHeading`.

### Batch 4: Form & Data Display Polish
- Migrate `MiratsFormControls` usage to `SuCoMoiForm` and `BaoTriMoiForm`.
- Refine `StandardTable` header styling using Astryx `Table` semantic headers.
- Standardize `MiratsStatus` (Badge/Dot) across the System Tree and Incident lists.

## Technical Details
- **Theme Bridge**: Maintain Tailwind v4 bridge using `var()` mapping to Astryx tokens in `src/styles.css`.
- **Computed Proof**: Use `window.getComputedStyle` in a test/audit script to verify font rendering post-fix.
- **No-Important Rule**: Avoid `!important`; use CSS `@layer components` to override legacy shadcn styles where full migration isn't immediate.
- **Batch Checkpoint**: `bun run build` and `bun test` after each batch.

## User Review Required
- Do you want to prioritize any specific route for the "Before/After" comparison first?
- Should I proceed with Batch 1 immediately upon approval?
