# Plan: Fix Command Input Focus Border Alignment

The user reported that the focus border on the search input in the Command Palette does not align correctly or looks "unmatched". This is likely due to the `focus-within:ring-2` on the custom input wrapper in `src/components/ui/command.tsx`.

## Proposed Changes

### UI Components

#### [src/components/ui/command.tsx]

- Refactor the `CommandInput` focus style to use a more precise ring or border that matches the rounded-2xl container.
- Adjust the padding and ring offset to ensure the focus state feels "premium" and aligned.
- Specifically, increase the `focus-within:ring-offset-2` or change the ring behavior to use a solid border transition to avoid clipping on high-DPI screens.

### Restoration & Integrity

- Verify the change does not impact other usages of `CommandInput`.
- Ensure the search icon remains centered and aligned within the focused state.

## Technical Details

- Change `focus-within:ring-2 focus-within:ring-primary/20` to `focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10` to create a softer, more integrated glow.
- Ensure `bg-muted/30` transitions smoothly to `bg-muted/50`.
