---
name: Visual Text Update (MIRATS Phase U4)
description: Updates placeholder or incorrect text related to "language selector" to "Core Visual Families\n\nMIRATS Phase U4: Standards for Typography, Actions & Status" as requested by the user.
type: feature
---

# Plan - Visual Text Update

Update the "language selector" text in the UI (specifically within the AppShell's UserMenu or related components) to reflect the new MIRATS Phase U4 branding.

## User Review Required

> [!IMPORTANT]
> I have searched the codebase and found that "language selector" is not explicitly present as a string in the source files. However, there is an `aria-label="thay đổi mật độ ở đây"` in `src/components/mirats/app-shell/index.tsx` (UserMenu component) which is related to layout settings. 
> 
> If you are seeing "language selector" in the preview, it might be coming from a dynamic value or a component I haven't identified. I will update the relevant UI labels in the User Menu to match your request.

## Proposed Changes

### App Shell & UI Components

#### [src/components/mirats/app-shell/index.tsx]
- Update the layout density selector menu item's label or accessibility text if it was previously misidentified as a language selector.
- *Note: Since the exact string was not found, I will add a new decorative or informational label in the UserMenu that displays the requested text to satisfy the visual requirement.*

## Technical Details
- The requested text contains newlines (`\n\n`), which will be handled using appropriate React/Tailwind formatting (e.g., `whitespace-pre-line`).
- The update focuses on the `UserMenu` component within `src/components/mirats/app-shell/index.tsx`.

## Final Verification
- Verify the text appears correctly in the User Dropdown menu.
- Ensure the formatting respects the newlines.
