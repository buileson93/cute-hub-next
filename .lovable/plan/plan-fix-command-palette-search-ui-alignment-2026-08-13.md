# Plan: Fix Command Palette Search UI & Alignment

The user reported that the search input in the Command Palette looks "ugly" and expands incorrectly when typing, specifically showing a harsh blue border and inconsistent sizing compared to the rest of the UI.

## Proposed Changes

### 1. Refine Command Input Styling

- Update `src/components/ui/command.tsx` to remove the forced `rounded-md` on the internal input which can trigger unwanted browser focus styles.
- Adjust the `CommandInput` wrapper to use a pill-shaped design or a more subtle border that matches the modern "SnowUI" aesthetic established in recent turns.
- Ensure `outline-none` is strictly applied and use a subtle internal shadow or a custom `ring` that fits the theme instead of the default browser blue.

### 2. Standardize Search Header in Command Palette

- Update `src/components/mirats/CommandPalette.tsx` to ensure the `CommandInput` container has a fixed height and proper padding to prevent layout shifts when the search term changes.
- Add a subtle background color or blur to the search input area to distinguish it from the result list.

### 3. Visual Parity with Reference

- Based on the user's screenshot, the search input should look like a clean, floating element.
- I will ensure the `cmdk-input-wrapper` in `command.tsx` has consistent padding and a refined focus state.

## Technical Details

- **Files to modify:**
  - `src/components/ui/command.tsx`: Adjust `CommandInput` wrapper and input classes.
  - `src/components/mirats/CommandPalette.tsx`: Refine how `CommandInput` is presented.
- **Styling:** Use `rounded-full` for the search input wrapper and ensure the `h-12` forced in `CommandDialog` is consistent with the wrapper's `h-12`.

## Verification Plan

- Open the Command Palette (`Alt + Space`).
- Type long and short strings to verify the height remains stable.
- Check the focus state to ensure no harsh blue rings appear.
- Verify the alignment with the preview pane on the right.
