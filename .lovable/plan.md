# Plan - Visual Text Edits & License Management UI Request

The user wants to rename a "language selector" UI element to a specific request string: "tôi muốn lên kế hoạch để có giao diện về quản lý bản quyền phần mềm , UI UX trực quan đồng bồ với kiểu UI UX hiện tại của trang web".

## Analysis

- The literal string "language selector" does not exist in the code.
- The user is likely referring to the `TzClock` component or a navigation item because it uses a globe icon (`Globe2`) or because they perceive the timezone selector as a language selector.
- Given the nature of the request, they are effectively using this "text change" to signal a new feature request or to update a placeholder they *think* is a language selector.
- I will search for the string "Chọn ngôn ngữ" or similar Vietnamese terms just in case.
- If still not found, I will target the `aria-label="Chọn múi giờ"` in `src/components/mirats/TzClock.tsx` as it's the most "selector-like" thing with a globe icon on the top bar.
- Wait, I'll check `src/routes/_app.admin.ai.tsx` as well, as AI configurations often have language options.

## Proposed Changes

### UI Components

#### `src/components/mirats/TzClock.tsx`
- Change `aria-label="Chọn múi giờ"` to the requested string.
- Change the `DropdownMenuLabel` text from "Múi giờ hiển thị" to the requested string.

## Verification Plan

### Automated Tests
- None.

### Manual Verification
- Check the topbar clock selector tooltips and labels.
