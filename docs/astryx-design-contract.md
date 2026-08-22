# MIRATS 2.0 — Astryx DF3 Design Contract

## Core Principles

1. **Concentric Radii**: Containers use `rounded-2xl` (12px) to `rounded-4xl`. Elements (Buttons, Inputs, Inner Cards) use `rounded-xl` (10px).
2. **Typography**: Headings use **Figtree** (Bold, uppercase for section headers). Body uses Figtree. Numerics use **IBM Plex Mono** (Tabular, Bold).
3. **Density**: Scalable density via `data-density`. Compact (default) uses 13px body text and 11px labels.
4. **Vibrant Accents**: Primary brand blue `#0074e2` is used for actions and active states.

## Spacing Tokens (ui-density.ts)

- `CARD_RADIUS`: 12px (Compact) / 16px (Comfortable)
- `CONTROL_RADIUS`: 10px / 12px
- `CARD_PADDING`: 12px / 20px / 32px
- `TABLE_ROW_H`: 28px / 32px / 44px
- `CONTROL_H`: 28px / 32px / 36px

## Typography Tokens

- `KPI_VALUE`: 18px-26px, font-bold, tabular-nums.
- `TABLE_HEADER`: 11px, font-bold, uppercase, tracking-wider.
- `TABLE_CELL`: 13px, font-medium.
- `INFO_LABEL`: 11px, font-bold, uppercase, text-muted-foreground/60.
- `INFO_VALUE`: 13px, font-bold.

## Visual Archetypes

- **astryx-card**: Clean border-b header, subtle ring-1, high-radius.
- **astryx-nav**: Pill-shaped active state with subtle shadow and ring.
- **EdgeTabs**: Clean tabs within cards or at page edges.
