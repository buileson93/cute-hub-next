# MIRATS ASTRYX TEMPLATES — UX PARITY CONTRACT

## 1. UX Immutability
- **Navigation**: Sidebar/TopBar logic (T17) must be preserved. No changes to route paths.
- **Business Logic**: All loaders, actions, and mutations must remain intact.
- **Language**: Vietnamese (tiếng Việt) is the primary UI language.

## 2. Interaction Standards
- **StandardTable**: Must maintain filtering, pagination, and multi-select behavior.
- **CommandPalette**: Must retain functional links to app actions and recent history.
- **Forms**: Must keep Wizard/Step behavior and validation logic.

## 3. Visual Identity
- **Primary Accent**: MIRATS Blue (`#0074e2`).
- **Typography**: Figtree (Body/Heading) + IBM Plex Mono (Numbers).
- **Density**: "Compact" mode preference (T27), tight paddings in tables.

## 4. Accessibility & Focus
- **Tooltips**: Required for all icon-only buttons.
- **Focus**: Consistent ring styles across all interactive elements.
- **Aria-labels**: Mandatory for accessibility parity.

## 5. Mobile & Responsiveness
- **Layout**: Fluid containers, touch-friendly targets (min 44px for icons).
- **Navigation**: Sidebar must collapse gracefully without losing state.

---
*Status: Locked for U1-U5 phases.*
