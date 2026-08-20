# 00-css-cascade.md: Stylesheet Hierarchy

## Layer Order (Current)
1. `@import "tailwindcss"`
2. `layer(astryx-core)`
3. `layer(astryx-theme)`
4. `layer(astryx-brand)`
5. `layer(astryx-skins)`

## Winning Selectors
- Astryx skins (`.astryx-card`, etc.) are winning over base Tailwind utilities due to explicit layering.
- The gray button issue is caused by `--color-accent` being used as the background for primary buttons in the Astryx theme, which is mapped to `#262626`.

## Targeted Fix
- Re-bind `--color-accent` to `var(--primary)` for brand-critical elements.
