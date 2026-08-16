# Theme

Wraps a subtree with a specific Astryx theme. For static production themes, use `astryx theme build` and import the generated CSS plus built theme object for first-paint and SSR performance. Use runtime `defineTheme()` when themes are dynamic or for prototyping.

`defineTheme` accepts a `tokens` object whose keys are CSS custom property names (always prefixed with `--`). Common token names include `--color-accent`, `--color-background-surface`, `--color-background-body`, `--color-text-primary`, `--color-text-secondary`, `--radius-container`, `--spacing-1` through `--spacing-6`. Values can be a string (same for light/dark) or a `[light, dark]` tuple.

Example:
```ts
import {defineTheme} from '@astryxdesign/core/theme';
const myTheme = defineTheme({
  name: 'ocean',
  tokens: {
    '--color-accent': ['#0077B6', '#48CAE4'],
    '--color-background-surface': ['#F0F8FF', '#0A1628'],
    '--color-text-primary': ['#0A1317', '#FFFFFF'],
    '--radius-container': '16px',
  },
});
```

**Import:** `import {Theme} from '@astryxdesign/core/theme';`

## Best Practices

- **Do:** Build app themes that are known ahead of time with `astryx theme build`, then import the generated CSS and built theme object.
- **Do:** Use runtime themes when the theme is created or edited in the browser, such as theme editors, user branding, or prototypes.
- **Do:** Token names always start with `--` (e.g. `--color-accent`, `--color-background-surface`). Do not omit the prefix.
- **Don't:** Default to runtime themes in SSR production apps. Component overrides inject after hydration instead of shipping as static CSS.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `DefinedTheme` | — | Theme object to apply. Prefer built theme objects for static production themes; use runtime `defineTheme()` for dynamic themes. **(required)** |
| `mode` | `'light' \| 'dark' \| 'system'` | `'system'` | Color mode. System follows OS preference. |
| `children` | `ReactNode` | — | Content to render with the theme. **(required)** |


Related block templates

dirName:     ThemeApply
description: Wrap a subtree in Theme to apply a theme to every child component in that region.

dirName:     ThemeNested
description: Nested Theme providers let a local region use a different theme without affecting the rest of the page.

dirName:     ThemeShowcase
description: Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.

dirName:     ThemeSwitcher
description: Use state to switch the theme object passed to Theme and preview a different visual treatment.

dirName:     useThemeHookUsage
description: Read resolved theme token values with useTheme for non-CSS consumers like SVG charts.
