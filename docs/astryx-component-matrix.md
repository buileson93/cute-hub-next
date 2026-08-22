---
name: Astryx Component SSR Matrix
description: Verification matrix for Astryx design system components (Phase 5)
type: reference
---

# Astryx Component SSR Matrix (MIRATS 2.0)

Verified against `@astryxdesign/core@0.4.1` on TanStack Start (Worker SSR).

| Category       | Component               | SSR Safe | Hydration | Icon Support | Eligible | Notes                                |
| :------------- | :---------------------- | :------- | :-------- | :----------- | :------- | :----------------------------------- |
| **Foundation** | Heading                 | ✅       | ✅        | N/A          | REPLACE  | Deterministic levels.                |
| **Foundation** | Text                    | ✅       | ✅        | N/A          | REPLACE  | Supports weights/variants.           |
| **Foundation** | Divider                 | ✅       | ✅        | N/A          | REPLACE  | Simple horizontal line.              |
| **Layout**     | Stack / HStack / VStack | ✅       | ✅        | N/A          | REPLACE  | Pure flexbox layouts.                |
| **Surface**    | Card                    | ✅       | ✅        | N/A          | REPLACE  | Standard container.                  |
| **Actions**    | Button                  | ✅       | ✅        | ✅           | REPLACE  | Functional loading/disabled states.  |
| **Actions**    | IconButton              | ✅       | ✅        | ✅           | REPLACE  | Accessible labels required.          |
| **Indicators** | Badge                   | ✅       | ✅        | ✅           | REPLACE  | Semantic variants (success, danger). |
| **Indicators** | StatusDot               | ✅       | ✅        | N/A          | REPLACE  | Small status indicator.              |
| **Indicators** | Skeleton                | ✅       | ✅        | N/A          | REPLACE  | Layout placeholder.                  |
| **Feedback**   | EmptyState              | ✅       | ✅        | ✅           | REPLACE  | Large centered placeholder.          |
| **Navigation** | Breadcrumbs             | ✅       | ✅        | N/A          | REPLACE  | SEO-friendly links.                  |
| **Navigation** | TabList                 | ✅       | ✅        | N/A          | REPLACE  | Controlled tab selection.            |
| **Navigation** | Pagination              | ✅       | ✅        | ✅           | REPLACE  | Basic navigation controls.           |
| **Input**      | TextInput               | ✅       | ✅        | ✅           | REPLACE  | Standard field with prefix/suffix.   |
| **Overlay**    | DropdownMenu            | ✅       | ✅        | ✅           | COMPOSE  | Verified server import safety.       |
| **Data**       | Table                   | ✅       | ✅        | N/A          | REPLACE  | Base table structures.               |
| **Data**       | Avatar                  | ✅       | ✅        | N/A          | REPLACE  | Image/Initial fallback.              |

## Icon Allowlist (SSR Safe)

The following semantic icons are verified from `defaultIcons.js` and are safe to use in server-rendered routes:

- `search`, `check`, `error`, `warning`, `info`
- `moreHorizontal`, `chevronDown`, `chevronLeft`, `chevronRight`
- `calendar`, `clock`, `externalLink`, `menu`, `copy`, `funnel`
- `success`, `close`, `chevronsLeft`, `chevronsRight`

## Restricted / Probe Required

- **Complex Table Plugins**: Recursive tree/grouping needs P6 verification.
- **Modals/Drawers**: Anatomy check required (Vaul replacement path).
- **Tooltips**: Verify portal hydration safety.

## SSR Risks Identified

- Dynamic theme resolution (Dark/Light) MUST be deterministic based on the provided `stoneTheme` constant.
- Avoid using `StyleX` runtime APIs directly in component code; keep to Astryx primitives.
