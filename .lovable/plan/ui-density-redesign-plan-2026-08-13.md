---
name: Compact UI & Single Source of Truth for Density
description: Redesign UI_DENSITY as the single source of truth for app density, defaulting to compact mode with a "comfortable" option stored in user preferences.
type: design
---

# UI Density Redesign Plan

## Objectives
1. **Single Source of Truth**: Unified `UI_DENSITY` tokens for all layout spacing.
2. **Compact by Default**: System defaults to `compact` for high data density.
3. **User Preference**: Persistent density choice (`compact` vs `comfortable`) via `useUserPref`.
4. **Prop-less Propagation**: Use `data-density` attribute on the root layout to drive styles without prop drilling.
5. **Usability Guardrails**: Ensure minimum touch targets and font sizes.

## Token Mapping

| Token Name | Current (Comfortable) | Proposed (Compact) | Reason |
|------------|-----------------------|--------------------|--------|
| `PAGE_PADDING` | `p-4 md:p-6` | `p-3 md:p-4` | Reclaim edge space |
| `SECTION_GAP` | `gap-4` | `gap-3` | Tighten component stacks |
| `HEADER_GAP` | `gap-2` | `gap-1.5` | Narrower header spacing |
| `CARD_PADDING` | `p-6` | `p-3 md:p-4` | Standardize card inner space |
| `CARD_HDR_PAD` | `p-6` | `px-4 pt-3 pb-2` | Distinct, narrower header |
| `TABLE_ROW_H` | `h-10` | `h-9` | Fit more rows |
| `TABLE_CELL_PX`| `px-2` | `px-3` | Balanced horizontal padding |
| `TABLE_CELL_PY`| `py-2` | `py-1.5` | Tighter vertical rows |
| `TABLE_MAX_H` | `calc(100vh-16rem)`| `calc(100vh-12rem)`| Show more table area |
| `CONTROL_H` | `h-9` | `h-8` | Slimmer buttons/inputs |
| `ICON_SM` | `h-4 w-4` | `h-3.5 w-3.5` | Proportional sizing |
| `ICON_MD` | `h-5 w-5` | `h-4 w-4` | Standard density icons |
| `TEXT_BODY` | `text-sm (14px)` | `text-[13px]` | Content density |
| `TEXT_LABEL` | `text-xs (12px)` | `text-xs (12px)` | Minimum readable size |

## Implementation Steps

### 1. Update `UI_DENSITY` Token Definition (`src/lib/mirats/ui/ui-density.ts`)
- Restructure to include all new tokens.
- Maintain legacy names for backward compatibility.
- Use CSS variables or utility classes that react to `[data-density]`.

### 2. Root Density Control (`src/components/mirats/app-shell/AppShell.tsx`)
- Read `density` from `useUserPref("ui-density", "compact")`.
- Apply `data-density={density}` to the outermost `div`.
- Add a toggle in `UserMenu` to switch modes.

### 3. Component Refactoring (Priority Order)
1. **Layout Wrappers**: `PageBody.tsx`, `PageHeader.tsx`, `ActionBar.tsx`.
2. **Cards**: `src/components/ui/card.tsx` (Update to use `data-density` selectors).
3. **Table**: `StandardTable.tsx` and `src/components/ui/table.tsx`.
4. **Inputs/Buttons**: `src/components/ui/button.tsx`, `input.tsx`.

### 4. Anti-Stacking Rules
- Components using `UI_DENSITY.SECTION_GAP` on a parent should not have `space-y` on direct children if it duplicates the margin.
- Prefer `gap` (Flex/Grid) over `space-x/y` for better density control via tokens.

## Usability Constraints
- **Touch Targets**: Buttons/Inputs must never fall below `h-8` (32px) on desktop, but maintain mobile targets >= 40px via responsive classes.
- **Font Size**: Content text minimum `13px`. Labels/Metadata minimum `12px`.
- **Contrast**: Maintain AA standards for all text sizes.

## Testing & Rollback
- **Test Scenarios**: Verify 1440x900 visibility (target +20% rows), sidebar collapse behavior in both modes, and mobile responsiveness.
- **Rollback**: To revert, change the default in `useUserPref` or update the `compact` token values in `ui-density.ts` to match `comfortable`.

## Files to Modify
- `src/lib/mirats/ui/ui-density.ts`
- `src/components/mirats/app-shell/AppShell.tsx`
- `src/components/mirats/PageBody.tsx`
- `src/components/mirats/PageHeader.tsx`
- `src/components/ui/card.tsx`
- `src/components/mirats/StandardTable.tsx`
- `src/components/ui/table.tsx`
- `src/styles.css` (Sync CSS variable overrides)
