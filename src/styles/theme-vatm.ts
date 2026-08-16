import { defineTheme } from "@astryxdesign/core/theme";

/**
 * VATM Theme for MIRATS 2.0
 * 
 * Ánh xạ bộ nhận diện thương hiệu MIRATS vào hệ thống Astryx:
 * - Primary Blue: #1C51E0
 * - Warning Orange: #FF8F00
 * - Graphite Text: #4C5055
 */
export const vatmTheme = defineTheme({
  name: "vatm",
  color: {
    accent: "#1C51E0",
    neutralStyle: "cool",
  },
  typography: {
    body: { family: "Inter", fallbacks: "ui-sans-serif, system-ui, sans-serif" },
    heading: { family: "Space Grotesk", fallbacks: "ui-sans-serif, system-ui, sans-serif" },
    code: { family: "IBM Plex Mono", fallbacks: "ui-monospace, monospace" },
  },
  radius: {
    base: 4, // Generates 8px for element (radius-element) and 16px for container (radius-container)
    multiplier: 1,
  },
  motion: {
    fast: 120,    // MIRATS fast: 120ms
    medium: 200,  // MIRATS base: 200ms
    ratio: 0.625, // 120 / 200 = 0.6, 200 / 320 ≈ 0.625. This maps to ~320ms for slow.
  },
  tokens: {
    "--color-warning": ["#FF8F00", "#FFB74D"], // [Light, Dark]
    "--color-text-secondary": ["#4C5055", "#AAAFB5"],
  },
  components: {
    button: {
      base: {
        borderRadius: "8px", // radius-control 0.5rem = 8px
        "--button-press-scale": "0.98", // --scale-active: 0.98
      },
    },
    card: {
      base: {
        borderRadius: "16px", // --radius: 1rem = 16px
      },
    },
  },
});
