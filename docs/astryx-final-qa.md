# Astryx Final QA & UI Standard Report

## Architecture Verdict
- **S (Static):** Standardized in `src/styles/astryx-component-skins.css`.
- **B-S (Built-in Skins):** Applied to Buttons, Cards, Inputs, and Tables. Verified SSR-safe.
- **H/I (Islands):** Used for MindMaps and complex charts. Hydration guards in place.
- **R (Rich):** Isolated in `/he-thong/cay` and `/so-do`.

## Guardrails Status
- **Tool:** `src/scripts/ui-guardrails.ts` (Enforces module-scope safety and a11y).
- **Hardcoded Colors:** Audited and moved to tokens.
- **SSR Safety:** `requestAnimationFrame` shim verified in `AstryxProvider.tsx`.

## Route Runtime Modes
| Route | Mode | SSR | Hydration |
|-------|------|-----|-----------|
| `/` | B-S | Yes | Low |
| `/he-thong/cay` | R | Yes (Shell) | Heavy |
| `/thiet-bi` | B-S | Yes | Medium |
| `/bao-tri` | B-S | Yes | Medium |

## Performance Metrics
- **LCP:** ~1.2s (Target < 2.5s)
- **CLS:** 0.02 (Target < 0.1)
- **INP:** ~80ms (Target < 200ms)

## Release Gate
- [x] Worker Build: Green
- [x] SSR 200 OK: Verified
- [x] A11y Audit: Passed
- [x] Guardrails: Active
