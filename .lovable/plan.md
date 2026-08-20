---
name: Visual Text Edits - Admin Forms Table Header
description: Update "Trạng thái" header to "lên kế hoạch khắc phục switch này nhìn bị lệch" in the admin forms management table.
type: design
---

## Proposed Changes

### UI Text Update
- In `src/routes/_app.admin.forms.index.tsx`, change the table header text for the "Status" column.
- **Old text**: "Trạng thái"
- **New text**: "lên kế hoạch khắc phục switch này nhìn bị lệch"

### Rationale
- Direct request from the user to apply a visual text edit on the specified element.

## Technical Details
- File: `src/routes/_app.admin.forms.index.tsx`
- Component: `AdminFormsPage`
- Targeted element: `<TableHead>` at line 187.
