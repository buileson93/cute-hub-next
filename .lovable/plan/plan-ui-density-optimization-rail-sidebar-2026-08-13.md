# Plan - UI Density Optimization (Rail & Sidebar)

Restructuring the application's navigation layout to achieve a high-density, professional "Compact" look while maintaining the dual-layer sidebar architecture.

## Proposed Changes

### 1. UI Density Tokens (`src/lib/mirats/ui/ui-density.ts`)

- Update `UI_DENSITY` tokens to include specific sizes for the Sidebar and Rail.
- Add tokens for header heights and specific padding values.

### 2. Layout & AppShell (`src/components/mirats/app-shell/AppShell.tsx`)

- **Rail (Layer 1)**:
  - Width: Reduce from `w-14` (56px) or `w-16` to a fixed `w-[56px]`.
  - Items: Height `44px`, border-radius `10px`, icon size `18px` (`w-[18px] h-[18px]`).
  - Labels: Remove the 9.5px text labels (replaced by tooltips) to maximize vertical density and legibility.
  - Spacing: 4px between items, 12px between groups.
- **Sub-sidebar (Layer 2)**:
  - Width: Set to `w-[208px]` when expanded.
  - Header: Sync height to `h-12` (48px) to align with Rail and TopBar.
  - Transition: Maintain existing smooth width transitions and localStorage state.
- **TopBar**:
  - Sync height to `h-12` (48px).
  - Adjust padding to `px-3` or `px-4` to match the new compact layout.

### 3. Sidebar Component (`src/components/mirats/app-shell/Sidebar.tsx`)

- **Items**:
  - Height: `h-8` (32px), border-radius `8px`.
  - Typography: Font size `13px`, icon size `16px`, gap `10px`.
  - Vertical spacing: Reduce `space-y-1` to `space-y-0.5` (2px gap).
- **Group Headers**:
  - Font size `11px`, uppercase, muted color.
  - Vertical margin: Reduce to `mt-4` (16px) instead of `mt-8`.
- **Badges**:
  - Reduce size to `h-4` (16px) and text to `text-[10px]`.

### 4. Technical Audit & Metrics

- **Display Capacity**: On a 900px vertical screen, this will increase visible menu items by ~25-30%.
- **DOM Structure**: Remains unchanged; only CSS classes (via `cn` and `UI_DENSITY`) will be modified.

## Technical Specifications (Before vs After)

| Element               | Current (Compact Mode) | Targeted          |
| :-------------------- | :--------------------- | :---------------- |
| **Rail Width**        | 56px (`w-14`)          | 56px              |
| **Rail Item H**       | ~48px                  | 44px              |
| **Rail Icon**         | 20px (`h-5`)           | 18px              |
| **Rail Label**        | 9.5px                  | Removed (Tooltip) |
| **Sidebar Width**     | 208px (`w-52`)         | 208px             |
| **Sidebar Padding X** | 16px (`px-4`)          | 12px              |
| **Sidebar Item H**    | 36px                   | 32px              |
| **Sidebar Font**      | 14px (`text-sm`)       | 13px              |
| **Group Gap**         | 24px (`gap-6`)         | 16px              |
| **Header Height**     | 48px (`h-12`)          | 48px (Unified)    |

## User Recommendation: Rail Labels

**Recommendation**: Remove the 9.5px labels and rely on Tooltips.

- **Reasoning**: At 9.5px, text is barely legible and creates visual noise. Removing it allows for a cleaner "Icon-only" professional look in the Rail, which is standard for modern complex SaaS (like Raycast, Linear, or SnowUI).

## Files to be Modified

- `src/lib/mirats/ui/ui-density.ts`: Core tokens.
- `src/components/mirats/app-shell/AppShell.tsx`: Rail and Sidebar container sizes.
- `src/components/mirats/app-shell/Sidebar.tsx`: Item spacing, sizing, and typography.
- `src/components/mirats/app-shell/index.tsx`: SidebarLogoRail sizing.

## Verification Plan

- **Layout**: Verify the horizontal alignment of the TopBar border with Sidebar/Rail headers.
- **Responsiveness**: Check 1024px vs 1440px to ensure no layout breakage.
- **Interactions**: Test Sidebar collapse/expand, hover states, and Tooltips on Rail items.
- **Mobile**: Ensure Sheet navigation remains usable with 40px+ touch targets.
