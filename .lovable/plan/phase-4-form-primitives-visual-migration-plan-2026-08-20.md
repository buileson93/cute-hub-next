# Phase 4: Form Primitives Visual Migration (Plan)

## Goal
Implement exact visual parity for Input, Textarea, Switch, and Checkbox using static Astryx CSS while preserving existing SSR-stable React behavior.

## Scope: Group A
- **TextInput**: `src/components/ui/input.tsx`
- **TextArea**: `src/components/ui/textarea.tsx`
- **Switch**: `src/components/ui/switch.tsx`
- **Checkbox**: `src/components/ui/checkbox.tsx`

## Real Consumers / Pilot Surfaces
- **Auth Page**: `src/routes/auth.tsx` (Login form inputs)
- **Device Management**: `src/routes/_app.thiet-bi.tsx` (Search inputs and filter switches)
- **System Tree**: `src/routes/_app.he-thong.cay.tsx` (Node property inputs)

## Proposed Changes

### 1. Component Refactor (React)
- Add stable `data-astryx-*` selectors:
    - `Input`: `data-astryx-control="input"`, `data-astryx-type={type}`
    - `Textarea`: `data-astryx-control="textarea"`
    - `Switch`: `data-astryx-control="switch"`
    - `Checkbox`: `data-astryx-control="checkbox"`
- Support `data-astryx-state` for `invalid`, `disabled`, `checked`, `loading`.
- Preserve Radix-UI primitives (Switch, Checkbox) for keyboard/focus behavior.
- Clean up `className` by removing Tailwind utility classes that override the static CSS foundation.

### 2. Static CSS Architecture (`src/styles/astryx-static/components.css`)
- **Input/Textarea**: 
    - Height: 32px (default/comfortable), 28px (sm).
    - Typography: 13px (default), 11px (sm).
    - States: Default, Hover, Focus (accent ring), Disabled, Invalid (danger border).
- **Switch**:
    - Dimensions: Precise 36x20px rail, 16x16px thumb.
    - Motion: Static CSS transitions for `data-state="checked"`.
    - Colors: MIRATS Blue (#0074e2) for checked state.
- **Checkbox**:
    - Dimensions: 16x16px square.
    - Visuals: Custom SVG checkmark, rounded-sm corners.

### 3. Verification & Acceptance
- **SSR Integrity**: Zero hydration warnings via Playwright audits.
- **Visual Parity**: Screenshots at 1440px and 390px (mobile).
- **Interactions**: Tab navigation, focus visibility, and active state feedback.
- **Typecheck**: `npm run build` validation.

## Target Pilot Result
- Login inputs are correctly sized and themed.
- Switches in Device filters are compact and use MIRATS Blue.
- Checkboxes in tables are aligned and visually consistent.
