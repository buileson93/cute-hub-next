# Table Restoration & Standardization Plan

Audit and migrate 18 files with raw `<table>` tags to either `StandardTable` (Group A) or a standardized presentation wrapper (Group B), while leaving instructional content untouched (Group C).

## 1. Classification Mapping

| Group | File                              | Purpose            | Reason for Grouping                                          |
| :---- | :-------------------------------- | :----------------- | :----------------------------------------------------------- |
| **A** | `admin.audit.tsx`                 | Audit Logs         | Large business list, needs filtering/sorting/pagination.     |
| **A** | `_app.admin.kiem-tra-so-lieu.tsx` | Integrity Check    | Lists of groups/locations requiring sorting by delta.        |
| **A** | `_app.bao-tri.dot.$id.tsx`        | Maintenance Items  | Core business records, benefit from unified density/sorting. |
| **A** | `_app.topology.tsx`               | Connections        | Resource list, needs search and column management.           |
| **A** | `_app.tuan-thu.tsx`               | Compliance Alerts  | Large volume of notifications, needs clear sorting/status.   |
| **A** | `_app.he-thong.lien-ket.tsx`      | System Links       | Business connectivity list, needs filtering.                 |
| **B** | `ThietBiAllFields.tsx`            | Asset Properties   | Key-value vertical display, not a data list.                 |
| **B** | `AssetImportDialog.tsx`           | Import Preview     | Transient validation table in dialog.                        |
| **B** | `FieldPreview.tsx`                | Component Preview  | Small UI builder preview element.                            |
| **B** | `FormFieldRuntime.tsx`            | Dynamic Form Table | User-generated rows within a form field.                     |
| **B** | `PermissionMatrix.tsx`            | Auth Matrix        | 2D structure (Explicitly forbidden for StandardTable).       |
| **B** | `admin.schema.tsx`                | Schema Browser     | Specific technical layout for database columns.              |
| **B** | `admin.supabase-ngoai.tsx`        | Admin Config       | Small configuration list with specific action buttons.       |
| **B** | `CatalogTools.tsx`                | Merge Selection    | Selection table within a dialog flow.                        |
| **B** | `NhaSanXuatTools.tsx`             | Merge Selection    | Selection table within a dialog flow.                        |
| **C** | `AllInOneGuide.tsx`               | Documentation      | Purely instructional reference table.                        |
| **C** | `AllInOneChecklist.tsx`           | Reference Mapping  | Static instructional mapping for users.                      |
| **C** | `_app.index.tsx`                  | Dash. Health       | Dashboard summary cards (fixed layout).                      |

## 2. Implementation Strategy

### Phase 1: Standardized Presentation Wrapper (Group B)

Create a `RawTableWrapper` component in `src/components/mirats/ui/RawTableWrapper.tsx` to unify Group B.

- **Visual Features**: Sticky headers, standard row height (matching `UI_DENSITY`), border-collapse, scroll indicators, and consistent background colors.
- **Implementation**: Replace raw `<table>` with `<RawTableWrapper><table>...</table></RawTableWrapper>`.

### Phase 2: Group A Migration (Atomic Commits)

Migrate Group A files to `StandardTable` one by one, ensuring zero loss of feature parity.

#### 2.1. Audit Logs (`admin.audit.tsx`)

- **TableKey**: `admin_audit_log`
- **Columns**: Severity (dot + label), Kind (icon + verb), User (ProfileLite), Entity, Action, Time.
- **Row Actions**: Rollback (conditional), View Detail (expansion).

#### 2.2. Data Integrity (`_app.admin.kiem-tra-so-lieu.tsx`)

- **TableKey**: `admin_check_nhom` / `admin_check_vitri`
- **Columns**: Name, Code, Tree Count, Table Count, Delta (highlighted if != 0).
- **Parity**: Keep sorting by absolute delta as default.

#### 2.3. Maintenance Items (`_app.bao-tri.dot.$id.tsx`)

- **TableKey**: `bt_dot_hang_muc`
- **Columns**: System, Status, Approval, Result, Deadline, Note.
- **Features**: Filter by unit (already grouped), conditional status badges.

#### 2.4. Topology & Links (`_app.topology.tsx`, `_app.he-thong.lien-ket.tsx`)

- **TableKey**: `topol_conn` / `sys_links`
- **Columns**: Source, Arrow (Icon), Target, Type, Layer, Interface, Status.
- **Features**: Row actions (Delete, Activate/Deactivate).

#### 2.5. Compliance (`_app.tuan-thu.tsx`)

- **TableKey**: `compliance_alerts`
- **Columns**: Level (Badge), Type, Title, Deadline, Status (Read/Unread).

## 3. Preservation of Logic

- **Group A**: Ensure `hideBelow` and `priority` are set for mobile responsiveness. Use existing `useQuery` hooks; only swap the rendering layer.
- **Group B**: Maintain specific 2D table classes in `PermissionMatrix.tsx` while applying standardized borders/spacing.

## 4. Verification

- Build check: `npx tsc --noEmit`.
- Visual check: Compare Group B tables against the `UI_DENSITY` spec (Compact: 32px, Comfortable: 40px).
- Functional check: Verify sorting, filtering, and row expansion work in all migrated Group A tables.
