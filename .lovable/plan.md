---
name: Visual Text Update (MIRATS Phase U4)
description: Updates "language selector" text/labels to "Core Visual Families\n\nMIRATS Phase U4: Standards for Typography, Actions & Status" as requested.
type: feature
---

# Plan - Visual Text Update

Update the UI to reflect the MIRATS Phase U4 branding, replacing placeholders previously referred to as "language selector" with the specific brand statement.

## Proposed Changes

### App Shell & UI Components

#### [src/components/mirats/app-shell/index.tsx]
- Add a new decorative or informational label in the `UserMenu` dropdown that displays the "Core Visual Families" text.
- Use `whitespace-pre-line` to handle the requested formatting.
- Since the exact "language selector" string was not found in code, I will treat the Layout/Density selector area as the target for this branding text.

## Technical Details
- Text to be added:
  ```text
  Core Visual Families

  MIRATS Phase U4: Standards for Typography, Actions & Status
  ```
- Styling: Use `astryx-text-body` or similar tokens from `astryx-component-skins.css` to ensure brand consistency.
