# Plan: [MIRATS ASTRYX — P8: OVERLAY STATIC SKIN + BEHAVIOR PARITY]

Apply Astryx visual skins to overlay components (Dialog, Sheet, Popover, Tooltip, Drawer, Command, Toast) while maintaining behavior parity and SSR compatibility.

## Tasks

### 1. Overlay Static Skins (CSS)
- Define `.astryx-popover`, `.astryx-dialog`, `.astryx-tooltip`, and `.astryx-toast` in `src/styles/astryx-component-skins.css`.
- Standardize overlay surfaces: border-radius (container), shadows (Astryx-style elevation), and backdrop blurs.

### 2. Checkpoint 1: Tooltip & Popover (B-S)
- Update `src/components/ui/tooltip.tsx`:
    - Map `TooltipContent` to `.astryx-tooltip` skin.
    - Preserving Radix animation and collision logic.
- Update `src/components/ui/popover.tsx`:
    - Map `PopoverContent` to `.astryx-popover` / `.astryx-surface`.
    - Preserve portal and focus trap.

### 3. Checkpoint 2: Dialog & Sheet (B-S)
- Update `src/components/ui/dialog.tsx`:
    - Apply `.astryx-dialog` / `.astryx-surface` to `DialogContent`.
    - Standardize header/title with `.astryx-heading-3` and label skins.
- Update `src/components/ui/sheet.tsx`:
    - Apply skins to `SheetContent`.
    - Preserve `sheetVariants` (cva) for directional transitions.

### 4. Checkpoint 3: Drawer & Command (B-S)
- Update `src/components/ui/drawer.tsx`:
    - Apply skins to `DrawerContent`.
    - Standardize the handle bar style.
- Update `src/components/ui/command.tsx`:
    - Apply skins to `Command` and `CommandInput`.
    - Ensure item selection (`data-selected`) uses Astryx primary-alpha colors.

### 5. Checkpoint 4: Toast (B-S)
- Update `src/components/ui/sonner.tsx`:
    - Map `classNames.toast` to `.astryx-toast`.
    - Align title/description with Astryx typography tokens.

## Technical Details
- **Skin Mapping (B-S)**: We use "B-S" (Behavior + Skin) mode by injecting Astryx classes into existing shadcn/ui components.
- **Parity Guard**: No changes to Radix/Vaul/Cmdk primitives. Focus management, portal logic, and keyboard shortcuts remain untouched.
- **SSR Strategy**: All overlays are marked `"use client"` but their triggers and initial markup must be SSR-safe. We avoid hydration mismatches by keeping class-based skins instead of JS-driven ones where possible.

## Verification
- **Build**: `bun run build` to ensure no Worker-runtime regressions.
- **Interaction**: Test Escape key, outside click, and focus return on each overlay type.
- **Visual**: Verify consistent elevation and padding across all surfaces using `ui-density.ts` tokens.
