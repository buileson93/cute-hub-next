# Project Plan - CommandPalette Design Parity

Applying Astryx DF3 design language to the CommandPalette to ensure visual consistency with the new MIRATS 2.0 interface.

## User Review Required

> [!IMPORTANT]
> The Astryx DF3 specification for CommandPalettes typically uses a 2-column layout (List + Preview) which we already have. This plan focuses on refining the "skins" (colors, borders, radii, typography) to match the link provided.

- No specific questions. Proceeding with standard DF3 mapping.

## Proposed Changes

### UI Components

#### `src/components/ui/command.tsx`
- Refine `CommandDialog` padding and border logic.
- Standardize `CommandInput` to use `rounded-2xl` and the DF3 neutral background tokens.
- Update `CommandItem` selection state to use `bg-primary/10` with proper text color handoff.
- Standardize `CommandGroup` heading typography (10px, uppercase, tracking-widest).

#### `src/components/mirats/CommandPalette.tsx`
- Update `CommandPreview` to use DF3 spacing (px-5, space-y-5).
- Refine `MetaCell` typography (10px labels, 13px values).
- Update status tags to use `astryx-status-*` semantic mappings if applicable, or standardized DF3 badge styles.
- Ensure all borders use the unified `border-border/50` contrast.

#### `src/styles/astryx-component-skins.css`
- (Optional) Add or refine `.astryx-command` utility if needed for global reuse.

## Verification Plan

### Automated Tests
- Run `bunx vitest src/components/mirats/app-shell/__tests__/T17-sidebar-collapse.test.tsx` (or relevant shell tests) to ensure CommandPalette still opens/closes correctly.

### Manual Verification
- Open CommandPalette (Cmd+K / Alt+Space).
- Verify search input has no blue ring, uses neutral background.
- Verify selection state is a subtle tint, not a harsh color.
- Verify border radius is 12px for the dialog and 10px for items.
- Verify typography in the preview pane matches the 10px/13px spec.
