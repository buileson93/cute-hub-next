# 00-css-cascade.md: Stylesheet Hierarchy

## Layer Order (Current)
1. `@import "tailwindcss"`
2. `layer(astryx-core)`
3. `layer(astryx-theme)`
4. `layer(astryx-brand)`
5. `layer(astryx-skins)`

## Winning Selectors
- Astryx brand overrides (`layer(astryx-brand)`) successfully map semantic tokens to MIRATS brand colors.
- `--color-accent` is now bound to `var(--primary)`, resolving the gray button issue.

## Validation
- Checked `src/styles.css` for layer definitions.
- Verified brand layer follows theme layer in cascade.
