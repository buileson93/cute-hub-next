# Astryx Migration Phase 6: Controls & Forms - Report

## Migrated Components

### 1. New Wrappers
Created `src/components/astryx/MiratsButton.tsx` and `src/components/astryx/MiratsFormControls.tsx` to wrap Astryx interactive elements with MIRATS-compatible props.

| Component | Astryx Source | Key Parity Features |
|-----------|---------------|---------------------|
| `MiratsButton` | `Button` / `IconButton` | `variant` mapping, `loading` state, `tooltip`, `asChild` (via legacy shim). |
| `MiratsInput` | `TextInput` | `label` mapping, `ref` forwarding, `maxLength` support. |
| `MiratsSelector` | `Selector` | `options` mapping, `label` and `status` support. |
| `MiratsCheckbox` | `CheckboxInput` | `label` and `ref` forwarding. |
| `MiratsSwitch` | `Switch` | `label` and `ref` forwarding. |

### 2. Migrated Routes (Pilot)

#### `src/components/mirats/LienKetForm.tsx` (Simple Form)
- Migrated 11 interactive elements.
- Replaced `Select` with `MiratsSelector` using the new `options` array format.
- Standardized `MiratsButton` for submit/cancel actions.
- Preserved all `useState` and validation logic (`loi`, `canhBao`).

#### `src/routes/_app.forms.new.$code.tsx` (Complex Dynamic Form)
- Migrated static inputs (Title, Report Period, Search).
- Standardized action buttons in the sticky footer.
- Updated `onChange` handlers to receive raw values directly (standardizing away from `e.target.value`).

## Verification Results

- **Build**: Successful (Vite + TS).
- **Ref Forwarding**: Verified `MiratsInput` and `MiratsButton` forward refs correctly.
- **Contract Parity**: 
  - Loading states show spinners and disable inputs.
  - Tooltips render correctly on hover.
  - Form validation messages display via Astryx status props (where applicable).

## Next Steps
- Batch migration of other forms (BaoTriMoiForm, SuCoMoiForm, etc.).
- Gradual replacement of legacy `Button` and `Input` in remaining components.
