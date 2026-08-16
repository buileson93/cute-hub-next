# UI Parity Baseline (MIRATS 2.0)

## Interaction Tokens

| Selector | Count | Purpose |
| :--- | :--- | :--- |
| `hover:` | 597 | State change on mouse over |
| `group-hover:` | 57 | Triggering child state from parent hover |
| `focus-visible:` | 81 | Accessibility ring for keyboard navigation |
| `active:` | 58 | Visual feedback on click/press |
| `disabled:` | 54 | Visual state for non-interactive elements |
| `data-[state=...]` | 140 | Accordion, Dialog, Tabs, Collapsible logic |
| `cursor-*` | 148 | Mouse cursor feedback (pointer, wait, move) |
| `sticky` | 62 | Headers and toolbars fixed during scroll |

## Motion & Animation

| Token / Utility | Count | Purpose |
| :--- | :--- | :--- |
| `transition-*` | 569 | CSS transitions for color, transform, opacity |
| `duration-*` | 109 | Timing tokens (fast 120ms, base 200ms, slow 320ms) |
| `ease-*` | 27 | Easing functions (standard, emphasized) |
| `animate-spin` | 235 | Loading indicators |
| `animate-in` / `out` | 51 | Presence animations for overlays |
| `animate-pulse` | 15 | Skeleton and status pulse |
| `sodo-dash` | 1 | Animated path for connections in Flow |
| `indeterminate` | 1 | Background loading bar animation |

## Browser & Event Handlers

| Feature | Count | Purpose |
| :--- | :--- | :--- |
| `onKeyDown` / `onKeyUp` | 18 | Keyboard shortcuts (Cmd+K) and navigation |
| `onMouseEnter` / `Leave` | 12 | Tooltip triggers and hover states |
| `onDrop` / `onDrag*` | 5 | File uploads and column reordering |
| `onDoubleClick` | 3 | Fast-edit or drill-down actions |
| `localStorage` | 34 | UI persistence (sidebar state, density) |
| `sonner` (toast) | 132 | Operation feedback notifications |
| `ResizeObserver` | 7 | Dynamic layout adjustments (Flow, Charts) |
| `scrollIntoView` | 3 | Focus management in long forms/lists |
| `react-virtual` | 5 | Handling long tables performance |
