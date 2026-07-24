# 01 — Tính năng

Mỗi module N1–N13 có spec chi tiết trong `docs/superpowers/specs/`. File ở đây tóm tắt cho dev/PO: **mục đích, route chính, bảng liên quan, RPC, quyền, cạm bẫy**.

## Ma trận module

| Mã | Tên | Route chính | Bảng chính | Trạng thái |
|---|---|---|---|---|
| N1 | Danh mục quality (dedup, merge) | `/danh-muc/*`, `/admin/kiem-tra-so-lieu` | `dm_*`, `import_alias` | DONE |
| N2 | Change Request (duyệt sửa) | `/cho-duyet` | `change_request` | DONE |
| N3 | History panel | Drawer trong nhiều route | `audit_log`, `su_co_lich_su` | DONE |
| N4 | Preventive Maintenance | `/bao-tri/pm`, `/bao-tri/cong-viec` | `bao_tri_chinh_sach`, `pm_cong_viec`, `cong_viec_bao_tri` | DONE |
| N5 | Cảnh báo hết hạn | `/sap-het-han`, `/tuan-thu` | `giay_phep`, `chung_chi_thiet_bi`, `canh_bao_het_han_log` | DONE |
| N6 | Sự cố workflow (FSM) | `/su-co`, `/su-co/moi`, `/su-co/$maSuCo` | `su_co`, `su_co_lich_su` | DONE |
| N7 | QR + landing | `/q/$maThietBi`, `/qr/thiet-bi/$id` | `thiet_bi` | DONE |
| N8 | Dashboard KPI | `/tong-quan`, `/` | RPC `rpc_daily_brief`, `rpc_kpi_*` | DONE |
| N9 | Reliability report | `/bao-cao/do-tin-cay` | `su_co`, `bao_tri`, MV `mv_asset_anomaly` | DONE |
| N10 | Import/Export | `/nhap-lieu`, `/admin/nhap-lieu` | `import_batch`, `import_item`, `import_alias` | DONE |
| N11 | Mobile offline | Toàn app (offline queue) | localStorage + `offline-queue.ts` | DONE |
| N12 | Performance | Toàn app | RPC toàn cục, pagination, MV | DONE |
| N13 | Graph view | `/he-thong/cay`, `/topology` | `he_thong_thanh_phan`, `lien_ket_he_thong` | DONE |
| UX2026 | Personalization + multimodal | Toàn app | `user_layout_prefs`, `user_pinned`, `user_recent` | DONE |

## Nhóm nghiệp vụ

**Danh mục** — N1
**Vòng đời tài sản** — mount/unmount, kế thừa đơn vị (nằm rải rác, xem `03-database/schema.md#tai-san`)
**Vận hành** — N4, N5, N6
**Báo cáo & KPI** — N8, N9
**Nhập liệu & di động** — N10, N11
**Trình bày & tương tác** — N13, UX2026

Chi tiết từng module: xem file cùng thư mục (đang bổ sung). Trước khi đầy đủ, tham chiếu spec gốc trong `docs/superpowers/specs/`.
