# Plan: Unified Site Integrity & Accessibility Integration

Phase 11Q: Comprehensive site-wide integrity validation and accessibility (A11y) enhancement.

## 1. Visual Text Updates
- Update `src/components/mirats/TzClock.tsx` (`aria-label`) and `src/components/mirats/app-shell/TopBar.tsx` (`noiDung` tooltip) with the new roadmap text.
- Text: "Thêm bộ kiểm thử Playwright bao phủ tất cả các route chính của website để xác minh Header/Sidebar luôn cố định và nội dung chỉ trượt trong `PageBody` trên nhiều độ phân giải.\n\nTích hợp kiểm tra accessibility (keyboard navigation và focus state) cho `PageFrame`, `PageHeader`, `PageBody` để đảm bảo trải nghiệm đúng khi người dùng cuộn và dùng bàn phím.\nđã tối ưu cho điện thoại nữa"

## 2. Accessibility (A11y) Enhancements
- **PageFrame**: Ensure base layout is accessible.
- **PageHeader**: Add `role="banner"` for semantic clarity.
- **PageBody**:
    - Add `role="main"` to identify the primary content area.
    - Add `tabIndex={0}` to the scrollable container so keyboard users can focus and scroll it using arrow keys.
    - Add `aria-label="Content Area"` or similar in Vietnamese.
- **AppShell**: Verify Sidebar and Rail roles.

## 3. Comprehensive Integrity Testing
- Create `tests/full-site-integrity.test.py`:
    - Iterate through major routes: `/`, `/tong-quan`, `/thiet-bi`, `/he-thong/cay`.
    - Verify `PageHeader` and Sidebar remain fixed (Y-coordinate stability) during scroll.
    - Verify `PageBody` is the actual scrolling element.
    - Test across multiple viewports: Desktop (1280x800), Tablet (768x1024), and Mobile (375x667).
    - Add basic keyboard navigation test (Tab sequence).

## Technical Details
- Use `axe-playwright` if available, or manual role/attribute checks.
- Ensure `mirats-scroll` class remains untouched but is applied to the focusable container.
- Use `role="main"` only once per page (it's in `PageBody`, which is used once per route).
