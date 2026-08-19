# Plan - Update Parity Harness Manifesto

Update the visual text in the User Menu to reflect the requirements for creating an upstream reference harness and MIRATS harness, ensuring exact parity across technical and visual dimensions.

## User Review Required

> [!IMPORTANT]
> This update replaces the current component parity checklist with a strict environmental and comparative harness requirement.

- Does the list of comparison points (1-10) cover all your requirements for "100% exact parity"?
- Is the output path structure (`reports/astryx-parity/...`) consistent with your intended reporting workflow?

## Proposed Changes

### App Shell & UI
- Update `src/components/mirats/app-shell/index.tsx` to replace the "Parity Manifest" text with the "Harness Manifesto".
- Ensure proper JSX escaping for curly braces and special characters.

## Technical Details

### Code Modification
- Target the `isInventoryMode` block in `UserMenu` component within `src/components/mirats/app-shell/index.tsx`.
- Update the text content inside the `ScrollArea`.

### Text Content
```text
Tạo upstream reference harness và MIRATS harness trong cùng môi trường cố định:
- cùng Chromium version
- cùng OS/container
- cùng deviceScaleFactor
- cùng font files
- cùng viewport
- cùng light/dark mode
- cùng reduced-motion setting

Với mỗi component, render toàn bộ:
- variant và size
- default/hover/pressed/focus-visible
- disabled/loading/selected/invalid
- open/closed
- icon leading/trailing
- empty/long text
- LTR/RTL
- light/dark

SO SÁNH:
1. TypeScript public API.
2. DOM snapshot/anatomy.
3. Stable classes và data attributes.
4. Computed styles.
5. Bounding boxes.
6. Pixel screenshot.
7. Accessibility tree.
8. Keyboard/focus order.
9. Event sequence.
10. Mobile behavior.

OUTPUT:
- reports/astryx-parity/<Component>.json
- reports/astryx-parity/<Component>-light.png
- reports/astryx-parity/<Component>-dark.png
- reports/astryx-parity/<Component>-diff.png

Chỉ ghi “100% exact parity” khi source/API/DOM/state/ARIA/keyboard và visual test đều đạt. Nếu chỉ giống hình ảnh nhưng vẫn dùng Radix DOM/behavior khác upstream, ghi rõ “visual parity only”. Không tăng threshold ảnh để che sai padding, màu, font hoặc radius.
```
