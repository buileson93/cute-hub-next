# License Route Reliability Restoration Plan (Phase 10T)

This phase focuses on standardizing action colors and page gutters to ensure visual consistency and reliability across the application, specifically targeting the project detail and license routes.

## User Impact
- **Consistent Visuals**: Primary actions (like "Thêm việc") will consistently use the MIRATS Blue brand color instead of hardcoded black, improving hierarchy.
- **Improved Layout**: Consistent horizontal padding (gutters) ensures content doesn't touch screen edges, especially on mobile.
- **Responsive Reliability**: Toolbars will wrap correctly on small screens, preventing horizontal scrolling and cut-off buttons.

## Technical Details

### 1. Action Color Standardization
- **Target**: `src/routes/_app.du-an.$id.tsx`
- **Change**: Remove hardcoded `bg-slate-900 hover:bg-slate-800` from the "Thêm việc" button.
- **Standard**: Use `variant="default"` which automatically maps to `bg-primary` (MIRATS Blue) and `text-primary-foreground`.
- **Audit**: Identify and replace other hardcoded button colors (`bg-zinc-*`, `bg-neutral-*`, etc.) with semantic variants (`outline`, `secondary`, `ghost`).

### 2. Page Gutter Contract
- **Contract Ownership**: Move horizontal padding ownership from individual routes to standardized wrappers (`PageFrame` and `PageBody`).
- **Gutter Token**: Apply `UI_DENSITY.PAGE_PADDING` which scales based on density and screen size.
- **Migration**:
    - `src/routes/_app.du-an.$id.tsx`: Wrap content in `PageFrame` and `PageBody`. Remove custom padding.
    - `src/routes/_app.giay-phep.tsx`: Migrate to `PageFrame` and `PageBody`.
- **Toolbar Layout**: Ensure toolbars use `flex-wrap` and respect the gutter, preventing buttons from pushing against viewport edges.

### 3. Verification & Guardrails
- **Visual Tests**: Write Playwright tests to verify:
    - Button color is `bg-primary` (MIRATS Blue).
    - Horizontal distance from the outermost action to the viewport edge is `>= gutter token`.
    - No horizontal overflow at 390px (mobile) and 1440px (desktop).
- **Audit Script**: Run a scanner to detect hardcoded background colors on `Button` components.

### 4. License Route Specifics
- **Primary Action**: Ensure only "Thêm giấy phép" is primary (`variant="default"`).
- **Secondary Actions**: Set "Nhập GPKT từ PDF" and "Nhập hàng loạt" to `variant="outline"`.
- **Gutter Alignment**: Ensure tabs, charts, cards, and tables align to the same content edge.

## Implementation Steps

### Phase 0: Inventory & Test RED
1. Run `scripts/ui-audit.mjs` (or similar) to find hardcoded button colors.
2. Create `tests/gutter-contract.test.ts` to reproduce the edge-touching and color issues.

### Phase 1: Semantic Button Fixes
1. Edit `src/routes/_app.du-an.$id.tsx` to fix "Thêm việc" button.
2. Edit `src/routes/_app.giay-phep.tsx` to fix action hierarchy.

### Phase 2: Page Gutter Migration
1. Update `src/routes/_app.du-an.$id.tsx` with `PageBody`.
2. Update `src/routes/_app.giay-phep.tsx` with `PageBody`.
3. Verify `AppShell.tsx` main container settings.

### Phase 3: Final Verification
1. Run Playwright tests.
2. Run `npm run ui:audit` and `npm run build`.
