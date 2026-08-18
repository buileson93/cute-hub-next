# Plan - Unified Toggle Button Styling

Ensure consistent "MIRATS Blue" styling for toggle buttons (active/pressed states) across the application, replacing inconsistent gray/white states.

## User Review Required

- **Active State Color**: The user mentioned "màu xanh nền h đã thành màu gray" (blue background has become gray). We will restore the primary blue theme for active toggle states.
- **Scope**: Includes "Cá nhân hóa" button, "Chỉnh sửa" buttons in System Tree/ThanhPhan, and any other variant="outline" or variant="ghost" buttons acting as toggles.

## Technical Details

- **Global Utility**: Ensure `astryx-control` or a new utility class correctly handles the `aria-pressed="true"` or custom state mapping to `--primary` tokens.
- **Button Component**: Update `src/components/ui/button.tsx` variants if needed, or apply consistent classes to the callers.
- **Specific Fixes**:
  - `src/routes/_app.index.tsx`: "Cá nhân hóa" button state logic.
  - `src/routes/_app.he-thong.cay.tsx`: "Chỉnh sửa" button state logic.
  - `src/routes/_app.he-thong.thanh-phan.tsx`: "Chỉnh sửa nhanh" button state logic.
  - `src/components/mirats/StandardTable.tsx`: "Kéo thả cột" button state logic.
  - Audit all `variant="outline"` or `variant="ghost"` buttons that represent a boolean state.

## Proposed Changes

### 1. Style System
- Update `.astryx-control` or similar utility in `src/styles.css` to ensure that when a button is in an "active" state (e.g., `data-state="on"`, `aria-pressed="true"`, or a specific class), it uses the primary blue color palette instead of gray.

### 2. Dashboard Home (`src/routes/_app.index.tsx`)
- Audit the "Cá nhân hóa" button. Currently uses `variant={isEditing ? "default" : "outline"}`.
- If `default` variant is still showing as gray (due to global theme overrides), fix the token mapping.
- Ensure the `isEditing` state consistently reflects the blue theme.

### 3. System Tree (`src/routes/_app.he-thong.cay.tsx`)
- Audit the "Chỉnh sửa" button. Currently uses `variant={editMode ? "default" : "outline"}`.
- Similar to home, ensure `default` variant or the specific active state is blue.

### 4. Thanh Phan List (`src/routes/_app.he-thong.thanh-phan.tsx`)
- Audit the "Chỉnh sửa nhanh" button. Currently uses `variant={editMode ? "default" : "outline"}`.

### 5. Standard Table (`src/components/mirats/StandardTable.tsx`)
- Audit the "Kéo thả cột" button. Currently uses `className={cn(..., internalReorder && "text-primary bg-primary/10")}`.
- Ensure this matches the visual language of other toggle buttons.

### 6. Global Audit
- Search for all `Button` usages where `variant` is conditionally set based on a state (e.g., `isEditing`, `editMode`, `active`).
- Ensure they all use a consistent "Active = Blue" pattern.
