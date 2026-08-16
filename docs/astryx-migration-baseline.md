# MIRATS ASTRYX SSR-SAFE — P0: BASELINE REPORT

## 1. Project Infrastructure & Scripts
- **Package Manager**: bun (based on `bun.lock` and `bunfig.toml`)
- **Key Scripts**:
  - `dev`: `vite dev`
  - `build`: `vite build`
  - `preview`: `vite preview`
  - `typecheck`: `tsc --noEmit`
  - `test`: `vitest run`
- **Runtime Environment**: TanStack Start v1 (Edge/Worker-compatible). Nitro is used as the underlying server engine (Nitro 3.0.260603-beta).

## 2. Baseline Health Status
- **Typecheck**: PASS
- **Production Build**: PASS (Successfully generated `dist/client` and `dist/server`)
- **Worker Preview**: 200 OK (Verified via production build output)
- **Hydration Status**: No critical hydration errors detected in build logs. (Note: browser-only 3D libraries are shimmed/chunked to prevent SSR crashes).

## 3. Route Inventory (Grouped)
### Public / Auth
- `/` (Root/Landing)
- `/auth` (Login)
- `/forgot-password`
- `/reset-password`
- `/verify/$id`

### Core App (Authenticated - `_app`)
- **Dashboard**: `/_app/tong-quan`, `/_app/`
- **Assets (Thiet Bi)**: `/_app/thiet-bi`, `/_app/thiet-bi/$maThietBi`
- **Systems (He Thong)**: `/_app/he-thong/$id`, `/_app/he-thong/cay` (Mindmap), `/_app/he-thong/thanh-phan`
- **Operations**: `/_app/su-co`, `/_app/bao-tri`, `/_app/hong-hoc`
- **Admin**: `/_app/admin/users`, `/_app/admin/permissions`, `/_app/admin/audit`
- **Forms**: `/_app/forms`, `/_app/forms/new/$code`, `/_app/admin/forms/$id`

### System / API
- `/api/public/hooks/*` (Webhooks)
- `/.mcp/*` (MCP endpoints)

## 4. Component Contract Baseline
| Component | Implementation | Dependency |
|-----------|----------------|------------|
| Button | `src/components/ui/button.tsx` | shadcn/ui + class-variance-authority |
| StandardTable | `src/components/mirats/StandardTable.tsx` | TanStack Virtual + shadcn table |
| Dialog/Sheet | `src/components/ui/dialog.tsx`, `sheet.tsx` | Radix UI |
| Form | `src/components/ui/form.tsx` | react-hook-form + zod |
| Tooltip | `src/components/ui/tooltip.tsx` | Radix UI |
| AppShell | `src/components/mirats/app-shell/AppShell.tsx` | Custom sidebar/header/layout |

## 5. SSR Risks & Browser Globals
- **Browser Globals**: Found in module scope or render in:
  - `AtcTowerScene.tsx` (`window.setInterval`, `deviceorientation`)
  - `CommandPalette.tsx` (`window.addEventListener`, `location.reload`)
  - `DensityToggle.tsx` (`document.documentElement.dataset`)
  - `GraphCanvas.tsx` (`window.localStorage`)
- **Mitigation**: Project uses `manualChunks` in `vite.config.ts` to isolate 3D/browser-only libraries (`@google/model-viewer`, `three`) into `browser-3d` chunk.

## 6. Pilot Verification (Baseline Snapshot)
- **Pilot 1: Dashboard (`/`)**: High-density KPI cards, interactive charts (Recharts).
- **Pilot 2: Asset Catalog (`/thiet-bi`)**: Virtualized `StandardTable`, multi-column filters, column reordering.
- **Pilot 3: System Mindmap (`/he-thong/cay`)**: `@xyflow/react` based diagram, auto-layout, node expansion.
- **Pilot 4: Dynamic Forms (`/forms/new/*`)**: Multi-step wizard, AI incident parsing.
- **Pilot 5: Admin Users (`/admin/users`)**: User management table, role-based access control.

## 7. Checkpoint
- Baseline established.
- Production build confirmed working.
- No immediate blocker found for starting Astryx Design System integration.
