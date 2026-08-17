# Work Domain Map (MIRATS 2.0)

## Overview
This document maps the three distinct work domains in MIRATS 2.0 to their respective data structures, lifecycles, and UI routes.

| Domain | Table | Lifecycle | Primary Route | Key Roles |
| :--- | :--- | :--- | :--- | :--- |
| **Project Tasks** | `du_an_cong_viec` | Workflow: Todo → Doing → Review → Done. Linked to Milestones. | `/du-an/$id` | Project Manager, Assignee |
| **Work Orders** | `cong_viec_bao_tri` | Ad-hoc maintenance for assets/systems. Includes materials & KPIs. | `/bao-tri/cong-viec` | Maintenance Team, Operator |
| **PM Queue** | `pm_cong_viec` | Automated schedule generated from PM policies. | `/bao-tri/pm` | Admin, Maintenance Planner |

## Data Invariants

### Project Tasks (`du_an_cong_viec`)
- **Status**: `chua_bat_dau`, `dang_lam`, `cho_duyet`, `hoan_thanh`, `qua_han`.
- **Progress**: 0-100%. Triggered progress calculation for Milestones and Projects.
- **Dates**: `ngay_bat_dau` <= `ngay_ket_thuc_du_kien`. `ngay_hoan_thanh_thuc_te` set on `hoan_thanh`.

### PM Queue (`pm_cong_viec`)
- **Lifecycle**: Generated via `pm_sinh_cong_viec`. Completed via `pm_hoan_thanh_cong_viec` (creates a history entry) or Skipped.
- **Status**: `sap_den_han`, `den_han`, `qua_han`, `hoan_thanh`, `bo_qua`.

### Maintenance Work (`cong_viec_bao_tri`)
- **Context**: Usually linked to `su_co` or `hong_hoc`.
- **Outputs**: Generates electronic maintenance records (biên bản).

## Visual Standardization
All domains use the **Astryx Design Language**:
- **Typography**: Body 13px, Headers 4-level.
- **Colors**: MIRATS Blue (#1C51E0) for accents, Semantic colors for status.
- **Components**: `LayoutHeader`, `Toolbar`, `Card`, `Badge`, `StatusDot`.
