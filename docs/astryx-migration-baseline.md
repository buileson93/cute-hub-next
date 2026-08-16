# MIRATS ASTRYX SSR-SAFE — P1: INSTALL + SERVER IMPORT PROBE

## 1. P0 Checkpoint Verification
- **Baseline established**: Yes (Refer to `astryx-migration-baseline.md` archived version if needed).
- **Production Build Integrity**: Confirmed (last build successful).
- **Environment**: Bun + TanStack Start (Nitro Worker).

## 2. P1 Package Versions (Pinned)
- `@astryxdesign/core`: `0.4.1`
- `@astryxdesign/theme-neutral`: `0.4.1`
- `@astryxdesign/theme-stone`: `0.4.1`
- `@astryxdesign/cli`: `0.4.1` (devDependency)

## 3. Verified SSR-Safe Allowlist
The following entry points and components have passed the **Server Import Probe** (no `window`/`document` ReferenceErrors at module scope) and **Production Worker Build**:

### Core Components
- `Theme` (from `@astryxdesign/core`)
- `Button` (from `@astryxdesign/core`)
- `Badge` (from `@astryxdesign/core`)
- `Icon` (from `@astryxdesign/core`)

### Themes (/built proved)
- `neutralTheme` (from `@astryxdesign/theme-neutral`)
- `stoneTheme` (from `@astryxdesign/theme-stone`)

### Semantic Icon Names (SSR-Safe Registry)
Verified exact names available in the core fallback registry:
- `search`, `check`, `error`, `warning`, `info`, `moreHorizontal`, `chevronDown`, `chevronLeft`, `chevronRight`, `close`, `calendar`, `clock`, `externalLink`, `menu`.

## 4. SSR Risks & Probes
- **Probe Script**: `scripts/astryx-probes/server-import-probe.ts` (PASS).
- **Compile Probe**: `src/components/astryx-pilot/AstryxCompileProbe.tsx` (PASS).
- **Browser Globals**: None detected in Astryx component module scopes during Node.js import probe.

## 5. Checkpoint P1
- Packages installed and versions pinned.
- Server import probe successful for core and themes.
- Production Worker build verified.
- **Ready for P2: Design Token & Theme Integration.**

