# Plan - Dashboard Scroll Integrity & E2E Validation

The goal is to update the roadmap status text and verify the dashboard scrolling behavior in `/tong-quan`, ensuring it follows the "One Scroll Owner" principle where the content scrolls while system components stay fixed.

## User Review Required

> [!IMPORTANT]
> - The user provided credentials (`buileson93@gmail.com` / `12345`) for testing. These will be used in a Playwright script for E2E validation.

## Proposed Changes

### 1. Visual Text Roadmap Update
- Update `src/components/mirats/app-shell/TopBar.tsx` (tooltip content) and `src/components/mirats/TzClock.tsx` (`aria-label`) with the verbatim Vietnamese text provided:
    > "Sửa lỗi cuộn Dashboard: Trang Tổng quan (/tong-quan) đã được cấu trúc lại để phần nội dung (DashboardGrid) có thể cuộn độc lập, trong khi thanh tiêu đề và các thành phần hệ thống khác vẫn được giữ cố định. chưa được kiểm tra lại và playwright test để nghiệm thu tài khoản buileson93@gmail.com pass 12345"

### 2. Dashboard Layout Refinement
- **File:** `src/routes/_app.tong-quan.tsx`
- Ensure `PageBody` (which uses `overflow-hidden`) correctly contains the scrollable `DashboardGrid`.
- Wrap the main content area in a `div` with `overflow-y-auto` and `mirats-scroll` class to ensure independent scrolling.
- Keep `PageHeader` and `HeartBeatStrip` fixed at the top if necessary, or ensure they don't scroll with the main grid if that was the intent.

### 3. E2E Validation (Playwright)
- Create and run a Playwright script `tests/dashboard-integrity.test.py` to:
    - Log in using the provided credentials.
    - Navigate to `/tong-quan`.
    - Check if the page is scrollable without breaking the layout.
    - Verify that `PageHeader` remains at the top (sticky).
    - Capture screenshots for evidence.

## Technical Details

- **Design System:** Respects `UI_DENSITY` tokens. `PageBody` provides the `flex-1 overflow-hidden` foundation.
- **Scrolling:** Using Tailwind `overflow-y-auto` on the inner container of `/tong-quan` to satisfy the "One Scroll Owner" (per container) principle.
- **Testing:** Playwright will use `headless=True` in the sandbox.

```python
# test logic snippet
await page.goto("http://localhost:8080/auth")
await page.fill('input[type="email"]', "buileson93@gmail.com")
await page.fill('input[type="password"]', "12345")
await page.click('button[type="submit"]')
await page.wait_for_url("**/tong-quan")
# ... scroll check ...
```
