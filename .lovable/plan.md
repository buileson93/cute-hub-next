# Plan - Task T9: Apply ResponsiveDialog for Mobile Views

Integrate the `ResponsiveDialog` component into two key forms to ensure they are mobile-friendly by automatically switching to a Sheet (bottom drawer) on mobile devices.

## Proposed Changes

### 1. `src/components/mirats/ThietBiFormDialog.tsx`
- Import `ResponsiveDialog`.
- Replace `SchemaDialog`'s internal dialog usage (if possible) or wrap the relevant parts.
- Since `SchemaDialog` is a complex wrapper, I will first check if `SchemaDialog` itself can use `ResponsiveDialog`. Wait, the requirement says "Áp dụng ResponsiveDialog cho ĐÚNG 2 file: ThietBiFormDialog.tsx và GiayPhepFormDialog.tsx".
- `ThietBiFormDialog.tsx` uses `SchemaDialog`. I need to check `SchemaDialog.tsx` to see how it renders. If `SchemaDialog` uses a standard `Dialog`, I might need to refactor `SchemaDialog` or pass a prop.
- Actually, looking at `ThietBiFormDialog.tsx` line 391, it returns `<SchemaDialog ... />`. If I want `ThietBiFormDialog` to be responsive, and it uses `SchemaDialog`, then `SchemaDialog` must be responsive.
- **However**, the task explicitly restricts me to 2 files: `ThietBiFormDialog.tsx` and `GiayPhepFormDialog.tsx`.
- If I can't touch `SchemaDialog.tsx`, I must wrap or replace the usage inside `ThietBiFormDialog.tsx`.
- Wait, `ResponsiveDialog` is designed to replace `Dialog`. `SchemaDialog` likely contains its own `Dialog`.
- Let's check `src/components/mirats/SchemaDialog.tsx`.

### 2. `src/components/mirats/GiayPhepFormDialog.tsx`
- Import `ResponsiveDialog`.
- Replace `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` with `ResponsiveDialog` and standard `Button` actions inside the children.
- The `ResponsiveDialog` signature takes `children`, `trigger`, `title`, `description`, `open`, `onOpenChange`.
- I will move the form content into the `children` of `ResponsiveDialog`.
- The `DialogFooter` content (buttons) will be moved inside the `children` block at the bottom.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to ensure no type regressions.

### Manual Verification
1. **Desktop View (>= 768px)**:
   - Open "Thêm tài sản" and "Thêm giấy phép".
   - Verify they still appear as centered Dialogs with `max-w-2xl` / `sm:max-w-[600px]`.
2. **Mobile View (< 768px)**:
   - Use browser devtools to simulate 375px.
   - Open the same forms.
   - Verify they appear as bottom Sheets (`h-[94vh]`) with scrollable content.
   - Verify no horizontal overflow.
