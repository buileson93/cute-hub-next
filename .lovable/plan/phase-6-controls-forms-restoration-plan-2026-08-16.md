# Phase 6: Controls & Forms Restoration Plan

This plan focuses on migrating interactive controls (Buttons, Inputs, Selectors) to the Astryx system while preserving the complex business logic and form behaviors of MIRATS 2.0.

## 1. Components to be Created

### `src/components/astryx/MiratsButton.tsx`
- **Mapping**: Wraps Astryx `Button` and `IconButton`.
- **Parity Features**: 
  - Supports legacy `variant` (default/primary, outline/secondary, ghost, destructive).
  - Supports `loading` prop (shows spinner, disables button).
  - Supports `tooltip` prop (integrates with Radix Tooltip if Astryx native is insufficient).
  - Handles `asChild` via conditional rendering (if `asChild` is true, it remains a legacy Radix Slot wrapper for now).

### `src/components/astryx/MiratsFormControls.tsx`
- **MiratsInput**: Maps to Astryx `TextInput`. Forwards `ref` for `react-hook-form`.
- **MiratsSelector**: Maps to Astryx `Selector`. Preserves `Combobox` search logic where applicable.
- **MiratsCheckbox**: Maps to Astryx `CheckboxInput`.
- **MiratsSwitch**: Maps to Astryx `Switch`.

## 2. Pilot Form: `LienKetForm.tsx`
- **Why**: Small, controlled inputs, no direct DB side effects (receives `onSubmit`), clear validation states (`loi`, `canhBao`).
- **Steps**:
  1. Replace `Button` -> `MiratsButton`.
  2. Replace `Input` -> `MiratsInput`.
  3. Replace `Select` -> `MiratsSelector`.
  4. Verify `disabled` logic and `Alert` messages.

## 3. Advanced Form: `SuCoMoiForm.tsx` (Step 1)
- **Why**: Tests integration with `useMutation`, AI parsing buttons, and complex layout.
- **Steps**:
  1. Migrate "Brief Info" section.
  2. Map the "AI Wand" button to a `MiratsIconButton`.
  3. Ensure `onChange` triggers for AI auto-fill still work perfectly.

## 4. Verification & Safeguards
- **Typecheck**: All `ref` and `HTMLAttributes` must be valid.
- **Keyboard Parity**: `Space` and `Enter` must trigger buttons; `Tab` order must be preserved.
- **ARIA**: `aria-invalid` and `aria-describedby` must correctly link to error messages.

## 5. Timeline
- **Batch 1**: Buttons and Simple Form (LienKetForm).
- **Batch 2**: Standard Input Wrappers and Status/Form layouts.
- **Batch 3**: Complex Form pilot (SuCoMoiForm section).
