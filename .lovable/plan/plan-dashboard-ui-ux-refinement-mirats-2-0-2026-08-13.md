# Plan: Dashboard UI/UX Refinement (MIRATS 2.0)

The current dashboard in `src/routes/_app.tong-quan.tsx` is functional but lacks visual cohesion and a premium, modern feel. The user describes it as "flashy" or "garish" (loè loẹt), likely referring to the high-contrast semantic colors (red, amber, emerald) and the dense, multi-row layout of cards.

## User Preferences & Constraints
- **Visual Direction:** Apple-like minimal, dark theme, off-white paper (light mode), brand blue accent (#1D52E0).
- **Typography:** Space Grotesk for headings, IBM Plex Mono for numbers.
- **Feedback:** "loè loẹt" (too colorful/distracting), needs to fit the "MIRATS 2.0" aesthetic.

## Proposed Improvements

### 1. Visual Refinement (UI)
- **Unified Palette:** Reduce the use of heavy semantic background colors (like `bg-destructive/5`). Use subtle borders or small indicator dots instead of large colored text/icons where appropriate.
- **Card Design:** Standardize card shadows and borders to match the project's minimal aesthetic.
- **Typography:** Ensure `tabular-nums` and `font-mono` are consistently applied to all numeric readouts.
- **Spacing/Density:** Optimize the layout of the "Trung tâm điều hành" and "Sức khoẻ khai thác" sections to feel less cluttered.

### 2. Layout Optimization (UX)
- **Information Hierarchy:** Prioritize critical operations (Brief today) at the top with a more distinctive layout.
- **Chart Refresh:** Update Recharts colors to use the semantic CSS variables (`--color-chart-1`, etc.) or the brand blue, rather than hardcoded HSL values in `TongQuanPage`.
- **Interactivity:** Ensure tooltips provide valuable context without being obstructive.

## Technical Details

### Files to Modify
- `src/routes/_app.tong-quan.tsx`: Main dashboard layout and styles.
- `src/components/mirats/dashboard/HeartBeatStrip.tsx`: Refine the "Heartbeat" colors to be less "loè loẹt".
- `src/components/mirats/dashboard/LiveTimeline.tsx`: Ensure timeline indicators are subtle.

### Component Changes
- **KpiCard & HealthTile:**
  - Replace full-color text tones with a subtle colored indicator (left border or dot).
  - Use `font-mono` for the main value.
  - Apply the "Apple-like" minimal border and shadow.
- **Charts:**
  - Update `MUC_DO_COLORS` and `STATUS_COLORS` to use a more sophisticated, muted palette or the brand-specific blue shades.
  - Ensure the heatmap uses the brand blue or a neutral gradient instead of pure red.

## User Review Required

> [!IMPORTANT]
> The current dashboard uses Red/Amber/Green for status. Should I switch to a more monochromatic "Aviation" theme (using shades of Blue/Slate) and only use Red for absolute critical failures?
