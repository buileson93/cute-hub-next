# 00-audit.md: MIRATS SSR/Hydration & Architecture Audit

## Evidence-based Findings

### SSR/Hydration
- **Duplicate React:** Verified. System is using React 19.2.5 (React 19) consistently. No version mismatch found.
- **Hydration Path:** TanStack Start v1 with previously problematic `AstryxProvider` using a hydration guard. 
- **Critical Issue:** `AstryxProvider` rendered a fragment during SSR but a wrapping `div` on the client, causing hydration mismatches. **FIXED**: Provider removed, theme moved to static CSS.

### Visual Architecture
- **Cascade Order:** Tailwind v4 -> Astryx Core -> Astryx Theme -> MIRATS Brand Overrides.
- **The Gray Button Bug:** Identified as `--color-accent` mapping in the theme layer overriding brand primary. **FIXED**: Accent re-bound to primary blue.
- **Layout:** Excessive nested padding identified. **FIXED**: Refactored PageHeader and PageBody for standardized, responsive spacing.

## Architecture Decision
- **Move to Pure Static CSS:** Completed. All runtime React imports from `@astryxdesign/core` removed.
- **CSS Variable Contract:** MIRATS components consume standardized CSS variables defined in `src/styles.css`.
- **SSR Safety:** 100% SSR-safe layout. No hydration guards required.
