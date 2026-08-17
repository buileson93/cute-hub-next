# Plan: Astryx Controls & Forms Restoration (Phase 7)

Integrate Astryx visual skins (A-S/B-S) into core UI controls and form primitives while maintaining full business logic parity and SSR safety.

## 1. Shared Control Skins (B-S)
Apply `astryx-*` skins to core shadcn/ui primitives.

- **Button/IconButton:** Update `src/components/ui/button.tsx` to include `astryx-control`.
- **Inputs/Textarea:** Update `src/components/ui/input.tsx` and `textarea.tsx` to include `astryx-input`.
- **Checkbox/Radio/Switch:** Update `checkbox.tsx`, `radio-group.tsx`, and `switch.tsx` to use `astryx-checkbox` and `astryx-switch` skins.
- **Select:** Update `select.tsx` to use `astryx-input` for triggers and unified popover styling.

## 2. Form Architecture Parity
Refactor the dynamic form runtime to use the new visual foundation.

- **FormFieldRuntime.tsx:**
    - Map `LabelRow` to `astryx-text-label` (10px, bold, tracking-wider).
    - Map `Help` to `astryx-text-muted`.
    - Skinnable components for `before_after`, `measure`, and `table` fields using `astryx-surface`.
    - Apply `astryx-number` to numeric units and values.

## 3. Pilot Form Redesign
Restructure the "New Submission" form as a high-fidelity example.

- **_app.forms.new.$code.tsx:**
    - Use `astryx-heading-1` for page titles.
    - Wrap form sections in `astryx-card` with consistent `astryx-heading-3` headers.
    - Standardize spacing using Tailwind v4 `@theme` tokens.

## Technical Details
- **SSR Safety:** Maintain `typeof window` guards for interactive islands (Signature/Photo).
- **Parity:** Zero change to `react-hook-form` logic, `zod` schemas, or Supabase mutations.
- **Performance:** Ensure static CSS skins don't increase JS bundle size; verify direct refresh behavior in Worker environment.
