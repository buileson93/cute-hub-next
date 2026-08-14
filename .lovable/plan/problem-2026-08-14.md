---
name: Remove Redundant Selection Count in StandardTable
description: Remove the redundant selected count display in the toolbar when items are selected, as it clutters the interface and duplicates information.
type: design
---

## Problem
In `StandardTable`, when rows are selected, a text like "827 đã lắp tài sản" appears in the toolbar. The user identified this as redundant and requested its removal to clean up the UI.

## Solution
1. Modify `src/components/mirats/StandardTable.tsx` to remove the rendering of the selected count text within the `bulkActions` toolbar area.
2. Verify if the text is being passed as part of `toolbarLeft` or hardcoded in `StandardTable`.
3. In `StandardTable.tsx`, around line 795, a `div` contains `toolbarLeft` and `bulkActions`. The screenshot shows "827 đã lắp tài sản" which looks like a `Badge` or text passed via `toolbarLeft` from `ThanhPhanTable.tsx`.

## Technical Details
- In `ThanhPhanTable.tsx`, search for "đã lắp" to find the source of this text.
- It is likely inside `toolbarLeft` prop passed to `StandardTable`.
- Remove the `Badge` or `div` containing this text in `ThanhPhanTable.tsx`.
