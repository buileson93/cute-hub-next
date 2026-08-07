# Plan - Visual Text Edits & License Management UI Request

The user wants to rename a "language selector" UI element to a specific request string: "tôi muốn lên kế hoạch để có giao diện về quản lý bản quyền phần mềm , UI UX trực quan đồng bồ với kiểu UI UX hiện tại của trang web".

## Analysis

- The string "language selector" does not exist literally in the codebase.
- The most likely candidate is a placeholder or a generic selector in a component like `TzClock.tsx` or a navigation item that the user perceives as a language selector (perhaps due to the `Globe2` icon or `language: "en"` in Gantt chart).
- However, since the user is explicitly asking to "lên kế hoạch để có giao diện về quản lý bản quyền phần mềm", and I *just* implemented that feature in the previous turn, it's possible they are responding to a prompt or label they saw earlier or in a different version.
- Re-reading the prompt: "Change text from 'language selector' to 'tôi muốn lên kế hoạch...'".
- If I cannot find "language selector", I will check for any "translation" or "locale" related text.

## Proposed Changes

### UI Components

#### `src/components/mirats/TzClock.tsx`
- The `Globe2` icon is often used for language selectors. The label "Múi giờ hiển thị" might be what they mean, or the `aria-label="Chọn múi giờ"`.
- However, the user request is very specific. They want to *plan* the license management interface. But the instruction is to *change the text*.

### Investigation
- I will check `src/routes/_app.tsx` for any topbar items.
- I will check `src/components/mirats/AppShell.tsx` for any topbar icons.

## Verification Plan

### Manual Verification
- Verify the text change in the UI once the target is identified.
