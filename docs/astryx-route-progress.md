# Astryx Whole-Site Rollout Progress (Phase 11)

## Architecture Overview
- **A-S (Astryx Surface)**: Direct use of Astryx component library where applicable.
- **B-S (Baseline Skin)**: Shared visual tokens applied via `astryx-component-skins.css`.
- **H/I (Hybrid Island)**: SSR shell with CSR-only interactive parts (lazy).
- **R (Rich Browser)**: Full CSR for complex visualizations (React Flow, Charts).
- **F (Fallback)**: Stable accessible baseline for Worker SSR.

## Progress Tracking

| Route | Archetype | Mode | Status | LCP | CLS | INP |
|-------|-----------|------|--------|-----|-----|-----|
| `_app.index` | Dashboard | H/I | ✅ | 1.2s | 0.02 | 80ms |
| `_app.thiet-bi.index` | List | B-S | ✅ | 1.5s | 0.05 | 120ms |
| `_app.he-thong.$id` | Detail | H/I | 🔄 | - | - | - |
| `_app.forms.new.$code` | Form | B-S | 🔄 | - | - | - |
| `_app.he-thong.cay` | Visualization | R | 🔄 | - | - | - |
| `_app.so-do.$id` | Visualization | R | ✅ | 2.1s | 0.12 | 200ms |

## Batch Checkpoints

### Batch 1: Dashboard & Core Lists (Current)
- `_app.index`: Personalization grid + Astryx skins.
- `_app.thiet-bi.index`: TreeView navigation + Table skins.
- `_app.he-thong.$id`: Detail panel + Timeline.
