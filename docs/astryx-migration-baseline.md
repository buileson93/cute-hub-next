---
name: Astryx Migration Plan
description: Phased migration to Astryx design system
type: feature
---

# Astryx Migration Plan (MIRATS 2.0)

## Status
- P0: Baseline (Green)
- P1: Install + Probe (Green)
- P2: Static CSS (Green)
- P3: Built Theme Provider (Green)
- P4: Static Brand Foundation (In Progress)

## Phase 4: Static Brand Foundation
Goal: Apply VATM brand identity (Blue #1C51E0) via CSS variable overrides on top of the built Stone theme.

### Brand Tokens Mapping
| Category | VATM Value | Astryx Token (Stone) |
| :--- | :--- | :--- |
| **Primary Color** | #1C51E0 | `--color-accent`, `--color-icon-accent`, `--color-text-accent` |
| **Warning** | #FF8F00 | `--color-warning` |
| **Radius (Container)** | 16px (1rem) | `--radius-container` |
| **Radius (Element)** | 8px (0.5rem) | `--radius-element` |
| **Font Body** | Inter | `--font-family-body` |
| **Font Heading** | Montserrat | `--font-family-heading` |
| **Font Mono** | IBM Plex Mono | `--font-family-code` |

### Technical Approach
- Using **Option B**: Override CSS custom properties in `src/styles.css`.
- Avoid runtime injection or StyleX API for brand foundation.
- Maintain deterministic SSR.

## Phase 5: Component Pilot (Next)
- Replace first set of pilot components in `_app.index.tsx`.
