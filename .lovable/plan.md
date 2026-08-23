# Plan - Visual Text Update (Phase 11R)

The user wants to update a visual text placeholder used in tooltips and aria-labels for the roadmap/status indication.

## Proposed Changes

### 1. Update `TzClock.tsx`
- Replace the current `aria-label` content (roadmap regarding Playwright/A11y) with the new text: `"codebase nên hoàn thiện cái khung sau này có thêm menu áp dụng cũng nhanh ko bị chạy áp dụng luật chung cho toàn hệ thống UI UX, làm cho tôi bộ khùn vậy"`

### 2. Update `TopBar.tsx`
- Replace the `AppTooltip` content (roadmap regarding Playwright/A11y) with the new text verbatim.

## Technical Details
- The replacement is purely visual/textual as per the "visual text edits" request format.
- I will preserve the existing component structure and logic.

```typescript
// Example replacement in TzClock.tsx
aria-label={"codebase nên hoàn thiện cái khung sau này có thêm menu áp dụng cũng nhanh ko bị chạy áp dụng luật chung cho toàn hệ thống UI UX, làm cho tôi bộ khùn vậy"}
```

```typescript
// Example replacement in TopBar.tsx
noiDung={
  <div className="max-w-xs whitespace-pre-wrap text-[11px] leading-relaxed">
    codebase nên hoàn thiện cái khung sau này có thêm menu áp dụng cũng nhanh ko bị chạy áp dụng luật chung cho toàn hệ thống UI UX, làm cho tôi bộ khùn vậy
  </div>
}
```
