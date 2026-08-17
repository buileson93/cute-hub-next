# MIRATS ASTRYX Design Contract

## 1. Spacing & Grid
- **Hierarchy**: Base-4 system (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px).
- **Page Margin**: 24px (mobile), 32px (desktop).
- **Section Gap**: 48px.
- **Component Gap**: 16px.

## 2. Controls & Sizing
- **Heights**: 
  - Small: 28px (Density Compact)
  - Medium: 32px (Default)
  - Large: 40px (Hero/Auth)
- **Touch Target**: Min 44px for icon-only buttons on mobile.
- **Icon Sizing**: 16px (in 32px button), 20px (in 40px button).

## 3. Shapes & Radius
- **Container**: 12px (rounded-3xl).
- **Element**: 10px (rounded-2xl).
- **Nested (Concentricity)**: Inner radius = Outer radius - Padding.
- **Button**: 8px or Full (capsule).

## 4. Typography (Figtree)
- **Display**: 32px / 40px (Bold)
- **Heading 1**: 24px / 32px (Bold)
- **Heading 2**: 20px / 28px (Semibold)
- **Body**: 14px / 20px (Regular)
- **Small/Support**: 12px / 16px (Medium)
- **Code/Numeric**: IBM Plex Mono (Standardized for all data values).

## 5. Elevation & Z-Order
- **Base**: 0
- **Surface (Card)**: 1 (Subtle border + faint shadow)
- **Overlay (Popover)**: 10
- **Dialog/Modal**: 50
- **Toast/Notification**: 100

## 6. Color & States
- **Primary Accent**: #0074e2 (MIRATS Blue).
- **Success**: #198100.
- **Warning**: #ffce2f.
- **Error**: #e33f4a.
- **States**: 
  - Hover: Background +10% lightness or subtle overlay.
  - Focus: 2px ring-offset-2.
  - Active: Scale 0.98 or darker background.
  - Disabled: Opacity 0.5 + grayscale filter.

## 7. Motion
- **Duration**: Fast (150ms), Standard (250ms), Slow (450ms).
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1).
- **Reduced-Motion**: Disable all non-transform animations.
