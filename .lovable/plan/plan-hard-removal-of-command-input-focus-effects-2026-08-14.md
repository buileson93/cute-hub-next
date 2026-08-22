# Plan: Hard-Removal of Command Input Focus Effects

The user reports that despite previous attempts, a "very ugly" focus border still appears when typing in the Command Palette search input. My technical audit confirms that while Tailwind classes were removed, browser defaults or legacy styles might still be applying an `outline` or `boxShadow` during focus.

## Proposed Changes

### UI Components

#### [src/components/ui/command.tsx]

- Forcefully suppress all focus-related visual indicators (outline, ring, box-shadow) on the `CommandInput` inner input and its wrapper.
- Use explicit `!important` or specific `focus` selectors to ensure browser defaults (like Chrome's blue ring) are neutralized.
- Ensure the `CommandInput` inner component has `focus:ring-0`, `focus:outline-none`, and `focus:border-transparent`.

#### [src/components/ui/dialog.tsx] (Verification)

- Check if `DialogContent` or `CommandDialog` adds any global focus styling that might be bleeding into the input. The audit showed `outline` on the container as well.

## Technical Details

- In `src/components/ui/command.tsx`, update `CommandPrimitive.Input` className:
  - Add `focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none`.
- Update the wrapper `div` (line 80) to ensure it doesn't have any leftover `focus-within` triggers that might be defined elsewhere (e.g., global CSS).
- Add a specific CSS utility or inline style if Tailwind's `outline-none` is being overridden.
