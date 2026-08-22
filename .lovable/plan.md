# Plan: Phase 10O - Verification Mode

Implementation of text replacement in `TzClock.tsx` as requested and execution of a comprehensive verification suite for MindMap and Table components.

## User Review Required

> [!IMPORTANT]
> This phase requires access to a running environment with data (names, UUIDs, orphan references). If the sandbox environment lacks a populated database or browser session, verification will be reported as BLOCKED.

## Proposed Changes

### Visual Text Update
- Update `aria-label` in `src/components/mirats/TzClock.tsx` with the new phase description: "VERIFICATION MODE — MINDMAP/TABLE ONLY..."

### Verification Suite (Automated & Manual)

#### 1. Visual & Accessibility Audit
- **MindMap Integrity**: Verify primary labels show names (not UUIDs/Codes). Validate search, rename, and expand functionality.
- **Table Contrast**: Measure computed background/text contrast for all states (default, hover, selected, focus) against WCAG AA standards.
- **Geometry & Scroll**: Verify single-scroll-owner architecture. Check `scrollWidth`, `clientWidth`, and interaction responsiveness (mouse, trackpad, keyboard, touch).

#### 2. Regression Testing
- **Breakpoints**: Verify layout at 390px, 768px, 1024px, and 1440px in both Light and Dark modes.
- **Components**: Test `StandardTable`, `DataTableCore`, `RawTableWrapper`, virtualized tables (1,000+ rows), and tables with sticky columns.
- **Mobile**: Ensure no regression in mobile card mode or touch interactions.

#### 3. Technical Integrity
- Run `ui:audit`, `lint`, `typecheck`, and `build`.
- Execute Playwright visual regression tests.

## Technical Details

### Scripting & Evidence
- Create `/tmp/browser/verification_10o/` to store screenshots and DOM snapshots.
- Use `scripts/ui-audit.mjs` to detect visual violations.
- Log specific failures as individual bug tickets for future resolution.

### Success Criteria
- [ ] No UUID/Code as primary label when names exist.
- [ ] Accessible color states for all table rows (no black hover/lost contrast).
- [ ] Verified horizontal scrolling with correct sticky behavior.
- [ ] Full test suite pass (exit 0).
- [ ] Evidence provided via screenshots and computed-style logs.
