# Plan: Synchronize UI Button and Control Sizes

Standardize the visual height and spacing of buttons, inputs, and selectors across the application to ensure consistency, especially between table toolbars, page headers, and general UI controls.

## User Review Required

> [!IMPORTANT]
> This plan will change the default height of many buttons and inputs to follow the "Compact" density mode (h-7/28px) by default if that is the active setting. Currently, many parts of the app are inconsistent (some h-7, some h-8, some h-9).

- **Global Standard**: All standard buttons, inputs, and selects will share the same height token from `UI_DENSITY.CONTROL_H`.
- **Button Variants**: We will prefer `size="xs"` (h-7) for compact views and `size="sm"` (h-8/h-9) for comfortable views.

## Proposed Changes

### 1. UI Density Standardization

- Update `src/lib/mirats/ui/ui-density.ts` to ensure `CONTROL_H` is used consistently as the source of truth for all interactive elements.
- Add `CONTROL_PX` and `FONT_SIZE` tokens for controls to ensure padding and text also scale correctly.

### 2. Component Refactoring

- **StandardTable.tsx**: Update toolbar buttons, search inputs, and column settings to strictly use `UI_DENSITY.CONTROL_H`.
- **PageHeader.tsx**: Update the `actions` slot container and any default buttons to match the standard control height.
- **BulkActionButton.tsx**: Remove hardcoded `h-7` and use the density token.

### 3. Route & Page Updates

- **src/routes/\_app.bao-tri.index.tsx**: Refactor filters (Select, Input) and the "Create" button to use `UI_DENSITY.CONTROL_H`.
- **src/routes/\_app.su-co.index.tsx**: Sync toolbar density.
- **src/routes/\_app.he-thong.cay.tsx**: Sync tree controls and search bar density.
- **src/routes/\_app.thiet-bi.index.tsx**: Sync table toolbar density.

### 4. Styling & Icons

- Ensure icons within buttons (`lucide-react`) are standardized to `w-3.5 h-3.5` for compact and `w-4 h-4` for comfortable.
- Standardize the `rounded` corner radius for all controls using `UI_DENSITY.CONTROL_RADIUS`.

## Technical Details

- **Tailwind Classes**: Use `cn(UI_DENSITY.CONTROL_H, ...)` instead of hardcoded `h-9` or `h-7`.
- **Button Props**: Use the `size` prop dynamically if possible, or apply the height class to the button container.
- **CSS Variables**: Leverage the `data-[density=...]` attributes on the `html` element to drive the visual changes without JavaScript recalculations in every component.

## Verification Plan

- **Manual Inspection**: Compare the height of the "Create" button in the PageHeader with the search input in the Table toolbar on the `/bao-tri` page. They should be identical.
- **Density Switching**: Toggle between "Compact" and "Comfortable" using the density switcher and verify that ALL controls scale in unison.
- **Visual Audit**: Check common forms and tables for alignment issues between checkboxes and text.
