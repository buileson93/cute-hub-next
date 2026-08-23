---
name: Roadmap Update & Dashboard Integrity E2E
description: Update roadmap text and implement multi-viewport E2E tests for Dashboard scroll integrity.
type: feature
---

# Roadmap Update & Dashboard Integrity E2E

Update the visual roadmap text in the UI and implement comprehensive E2E tests to verify the Dashboard's independent scrolling behavior across different screen sizes.

## User-Facing Changes
- Updated Vietnamese roadmap status text in the system clock (tooltip and ARIA label).
- Verified responsive layout integrity for the Dashboard (/tong-quan).

## Technical Details
- **Visual Text Update**: Replace the existing roadmap text in `TopBar.tsx` and `TzClock.tsx` with the new version verbatim.
- **Multi-Viewport E2E Testing**:
    - Update `tests/dashboard-integrity.test.py` (or create a new one) to run across multiple viewports (Desktop: 1280x800, Tablet: 768x1024, Mobile: 375x667).
    - Verify that the `PageHeader` and `HeartBeatStrip` remain fixed at the top while the `.mirats-scroll` container scrolls independently.
    - Measure layout stability during viewport resizing in Playwright.

## Implementation Steps

### 1. Update Visual Roadmap Text
- Edit `src/components/mirats/app-shell/TopBar.tsx` (Tooltip `noiDung`).
- Edit `src/components/mirats/TzClock.tsx` (`aria-label`).

### 2. Enhance E2E Tests
- Modify `tests/dashboard-integrity.test.py` to:
    - Iterate through a list of viewports.
    - Capture screenshots for each resolution.
    - Validate that the header's bounding box `y` coordinate remains constant during internal scrolling of the content area.
    - Test responsive behavior (e.g., sidebars collapsing/expanding) if applicable to ensure scroll containers don't break.

### 3. Verification
- Run the updated Playwright test.
- Check build logs for any CSS or TypeScript regressions.
