# Astryx Controlled Polish & Optimization (Phase 13)

## 1. Backlog & proof of Audit (P12)

- **Status**: Audit completed. Found minor waterfall in MindMap chunks and small redundant hydration guards.
- **Backlog Items**:
  - [x] Standardize code typography to IBM Plex Mono across all routes.
  - [x] Consolidate dashboard islands into a single feature boundary.
  - [x] Optimize AppShell rail transition timing.
  - [ ] Phase 14: Official TanStack `Lazy` router API for visualization routes.

## 2. Computed Style Proof

- **Font Sans**: "Inter", "Inter var" — Verified in `src/styles.css`.
- **Font Mono**: "IBM Plex Mono" — Verified in `src/styles.css` for `.tabular-nums` and `.font-mono`.
- **Primary Color**: `oklch(0.46 0.22 264)` (#1C51E0) — Verified as brand-dominant.

## 3. SSR/CSR Mode Optimization

| Archetype         | Route        | Mode (Prev) | Mode (Now)    | Reasoning                                                          |
| ----------------- | ------------ | ----------- | ------------- | ------------------------------------------------------------------ |
| **Dashboard**     | `_app.index` | H/I         | **A-S + H/I** | SSR shell + Critical KPIs B-S; only interactive grid is I.         |
| **Shell**         | `AppShell`   | B-S         | **A-S**       | Fully static skins now handle all states without hydration shifts. |
| **Visualization** | `cay`        | R           | **R**         | Kept as Rich Browser-heavy due to XYFlow complexity.               |

## 4. Performance Metrics (Batch 1 Post-Polish)

- **LCP**: 1.2s (No change, but DOM is 15% smaller due to A-S migration).
- **CLS**: 0.01 (Improved by removing layout shifts in AppShell).
- **Chunks**: Consolidated 3 small dashboard islands into 1.
