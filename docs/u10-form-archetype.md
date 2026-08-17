# U10: FORM PAGE ARCHETYPE - Anatomy & Parity Matrix

## Anatomy Map
- **PageFrame**: Root container with `comfortable` density.
- **PageHeader**:
  - `title`: Template name (`t.ten`).
  - `subtitle`: Template code (`t.code`) + Version.
  - `breadcrumbs`: Trang chủ > Biểu mẫu > [Tên mẫu].
  - `actions`: Save Draft, Submit (Primary).
- **PageBody**: Max-width 800px (center-aligned) for single-column readability.
- **Sections**:
  - **Thông tin chung**: Tiêu đề, kỳ báo cáo.
  - **Context Picker**: Tài sản & Hệ thống (sử dụng PageSection spacing thay card).
  - **Nội dung chính**: Dynamic fields hoặc Checklist renderer.
- **PageFooter**: Sticky bottom bar with Save/Submit actions.

## UX Parity Checklist
- [ ] Maintain RHF/Zod validation logic.
- [ ] Preserve field order, groups, and `visible_if` behavior.
- [ ] Keep current autocomplete/picker logic for assets and systems.
- [ ] Standardize error summary at top of PageBody.
- [ ] Enforce Astryx typography (Plex Mono for numbers/code).

## Metrics & Rollback
- Build check: `bun run build:dev`
- Visual check: Ensure form isn't wrapped in a giant card; use section spacing.
- Rollback: Revert `src/routes/_app.forms.new.$code.tsx` to pre-refactor version.
