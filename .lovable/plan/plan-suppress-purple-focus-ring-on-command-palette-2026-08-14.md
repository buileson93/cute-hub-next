# Plan - Suppress Purple Focus Ring on Command Palette

The "purple border" identified by the user is the system's focus ring (`--color-ring`), which is being applied to the search input via a global `:focus-visible` rule in `src/styles.css`. Despite previous attempts to suppress it with Tailwind classes, it persists due to the global rule's specificity or application order.

## Proposed Changes

### 1. Global Styles

- Add a specific suppression rule in `src/styles.css` for `[cmdk-input]` to ensure it never shows an outline, even when focused.
- This provides a "hard" override that beats the general `:focus-visible` rule.

### 2. UI Components

- Update `src/components/ui/command.tsx` to use more aggressive Tailwind overrides (`!outline-none`, `!ring-0`) on both the `CommandInput` and its wrapper `div`.
- Ensure no other elements in the `CommandPalette` hierarchy are inadvertently triggering focus rings.

## Technical Details

### Cause Analysis

- **Source:** `src/styles.css` line 243-247.
- **Rule:** `:where(... input ...):focus-visible { outline: 2px solid var(--color-ring); outline-offset: 1px; border-radius: var(--radius-control); }`.
- **Observation:** The border in the screenshot is rounded and slightly offset, which perfectly matches the `outline-offset: 1px` and `border-radius` (which defaults to 8px but might be visually rounded more by the container) defined in this global rule.

### Implementation

- Target `[cmdk-input]` directly in `src/styles.css`:

```css
[cmdk-input]:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
```

- This will completely neutralize the purple ring specifically for the search input.
