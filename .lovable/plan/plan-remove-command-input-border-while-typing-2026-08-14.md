# Plan: Remove Command Input Border While Typing

The user wants to remove the focus border (ring/border) that appears when typing in the Command Palette search input. The uploaded image confirms a double-border issue where a blue ring/border is visible around the input container.

## Proposed Changes

### UI Components

#### [src/components/ui/command.tsx]

- Modify the `CommandInput` wrapper styles to remove the `focus-within` border and ring effects that were previously added to "fix" alignment, as the user now explicitly wants them removed during typing/focus.
- Keep the background color transition for a subtle indicator, or remove it if a completely clean look is desired. I will remove both the border and the ring as requested ("bỏ viền").

## Technical Details

- In `CommandInput`, update the wrapper `div` (line 80):
  - Remove `border-transparent`, `focus-within:border-primary/30`, and `focus-within:ring-4 focus-within:ring-primary/10`.
  - Maintain `bg-muted/30` and `focus-within:bg-muted/50` for visual feedback without a "border" stroke.
