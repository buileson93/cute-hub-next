# N3 — History Panel (Dòng thời gian đọc từ `audit_log`)

> **Trạng thái**: SPEC — chờ phê duyệt. Không code cho tới khi duyệt. Kế thừa `change-log.ts`, `record-timeline.ts`, spec N1/N2.

## 1. Nguyên tắc

- **Nguồn duy nhất**: bảng `audit_log` được ghi tự động bởi trigger `audit_row_change`. **KHÔNG** đổi trigger, **KHÔNG** ghi thẳng vào `audit_log` từ app.
- **Bất biến của lịch sử**: mọi row trong `audit_log` là bất biến. Restore = tạo `UPDATE` mới (thay đổi hôm nay), không ghi đè dòng cũ.
- **Bám SSoT `change-log.ts`**: tận dụng `computeChanges`, `fieldLabel`, `formatVal`, `IGNORE` set đã có.
- **RLS chốt cuối**: user chỉ thấy audit của các entity mà chính họ có quyền đọc.

## 2. Nguồn dữ liệu

- Bảng `audit_log` với các cột đang dùng: `id`, `entity`, `entity_id`, `action` (`insert|update|delete`), `old_data jsonb`, `new_data jsonb`, `actor_id`, `actor_name`, `at`, `metadata jsonb`.
- `metadata.change_request_id` (N2) — khi có, hiển thị badge "Đã duyệt CR#...".
- Hook mới `useChangeLog(entity, id, opts?)`:
  - Query key: `["audit_log", entity, id, opts]`.
  - Trả `{ items: HistoryEvent[], loading, error, hasMore, loadMore }` (keyset theo `at`).

## 3. Định dạng dòng thời gian

Mỗi `HistoryEvent`:

```ts
type HistoryEvent = {
  id: string; // audit_log.id
  at: string; // ISO datetime
  actor: { id: string | null; name: string; role?: string };
  action: "insert" | "update" | "delete";
  changes: FieldChange[]; // đã lọc IGNORE, đã diff qua computeChanges
  source?: "manual" | "bulk" | "rpc" | "trigger" | "change_request";
  changeRequestId?: string | null;
  note?: string | null; // audit_log.metadata.reason nếu có
};
```

**UI dòng** (top-down):

- Header: avatar + tên actor, thời điểm relative + tooltip absolute, badge action, badge nguồn (BulkEdit / CR#123 / RPC / Trigger).
- Nội dung: danh sách trường thay đổi dạng `Tên trường: <cũ> → <mới>` (dùng `formatVal`), tối đa 5 dòng đầu + nút "Xem tất cả n thay đổi".
- Với `insert`: hiện "Tạo mới" + snapshot rút gọn.
- Với `delete`: hiện "Xoá (mềm)" + lý do.
- Nút **Khôi phục giá trị cũ** đứng cạnh mỗi field trong danh sách trường ĐƯỢC PHÉP (§5). Ẩn nếu field không cho khôi phục hoặc user không có quyền edit.

**Nhóm dòng**: gom các events cách nhau ≤ 3s cùng actor + cùng `entity_id` thành 1 nhóm hiển thị (giảm nhiễu bulk update).

## 4. Bộ lọc

- **Trường**: multi-select từ union các key đã xuất hiện trong lịch sử (label thân thiện qua `fieldLabel`).
- **Người thực hiện**: multi-select actor.
- **Khoảng thời gian**: presets (7/30/90 ngày, năm nay, tất cả) + custom range.
- **Nguồn**: manual / bulk / rpc / change_request.
- **Action**: insert / update / delete.
- Reset filter + save preset local (localStorage key `history-panel:filters:<entity>`).

Filter chạy trên client sau keyset fetch; khi user chọn "Tất cả thời gian" phải cảnh báo tải lớn nếu > 500 rows.

## 5. Danh sách trường ĐƯỢC PHÉP khôi phục

Whitelist theo entity — chỉ scalar an toàn, **loại trừ** khoá quan hệ, trạng thái vòng đời, và cột do trigger tính. Server-side (RPC `restore_audit_field`) kiểm tra lại danh sách này.

### `thiet_bi`

`ten_hien_thi`, `ghi_chu`, `mo_ta`, `so_luong_dvt`, `dvt`, `ngay_dua_vao_khai_thac`, `ngay_san_xuat`, `xuat_xu`, `nam_san_xuat`, `p_n` _(chỉ khi model không kế thừa)_, `serial` _(chỉ nếu policy cho phép sửa serial)_, và các trường trong `thuoc_tinh.*` không thuộc `dm_dac_tinh` kế thừa từ model.

### `dm_he_thong`

`ten`, `ten_viet_tat`, `ghi_chu`, `mo_ta`, `dia_diem_van_hanh`, `tan_so_hoat_dong`, `cong_suat`, `chuc_nang_chinh`.

### `he_thong_thanh_phan`

`ten`, `ma`, `ghi_chu`, `mo_ta`, `chuc_nang`.

### `dm_model`, `dm_vi_tri`, `dm_don_vi`, `dm_nha_san_xuat`, `dm_nha_cung_cap`, `dm_loai_thiet_bi`, `dm_nhom_he_thong`

`ten`, `ten_viet_tat`, `mo_ta`, `ghi_chu`. **Không** khôi phục `ma` (khoá nghiệp vụ) và `*_id`.

### Blacklist tuyệt đối (không bao giờ cho khôi phục qua panel)

- Mọi cột kết thúc `_id` (khoá quan hệ) — dùng change-request N2 nếu cần.
- `active`, `deleted_at`, `merged_into`, `deactivated_at` — dùng RPC restore/merge riêng.
- `trang_thai`, `trang_thai_van_hanh` — dùng FSM (N1 roadmap).
- `model_id`, `nhom_he_thong_id`, `don_vi_id`, `vi_tri_id` — cấu trúc, đi qua change-request.
- Cột kế thừa Model (`inherited-readonly`) — không đổi ở tài sản.
- `tsv`, `search_*`, `qr_code`, `created_*`, `updated_*`, `id`.

## 6. `restoreField(entity, entityId, field, oldValue, opts)`

Chữ ký thuần TS:

```ts
restoreField(args: {
  entity: string;
  entityId: string;
  field: string;
  oldValue: unknown;
  auditId: string;        // dòng lịch sử nguồn để trace
  reason?: string;
}): Promise<{ ok: true; newAuditId: string } | { ok: false; error: string }>
```

Hành vi:

1. Client-side: check whitelist `RESTORABLE_FIELDS[entity]` — nếu không hợp lệ, trả lỗi `field_not_restorable`.
2. Gọi RPC `restore_audit_field(entity, entity_id, field, old_value_jsonb, audit_id, reason)` (`SECURITY DEFINER`).
3. RPC:
   - Kiểm quyền `has_role admin|phong_kt`.
   - Whitelist lại phía DB (nguồn sự thật cuối).
   - Kiểm tra `entity_id` tồn tại và `active=true`.
   - Đọc giá trị hiện tại; nếu đã bằng `old_value` → no-op, trả `already_matches`.
   - Chạy `UPDATE entity SET field = old_value WHERE id = entity_id`.
   - Trigger `audit_row_change` sinh 1 row `update` mới (không cần app viết audit).
   - Trả về id audit mới (query `audit_log` mới nhất cùng txid).
4. UI hiện toast "Đã khôi phục giá trị vào lúc <at>" + refresh timeline.

**KHÔNG cho restore**:

- Trường ngoài whitelist.
- Khi entity đang bị soft-deleted.
- Khi user chỉ có role `ktv`/`to_truong`.

Restore hàng loạt nhiều trường 1 lần: gọi RPC lặp trong transaction ở phía server (RPC nhận mảng); nếu 1 fail → rollback.

## 7. Component & tích hợp

- `src/components/history/HistoryPanel.tsx`: `<HistoryPanel entity="thiet_bi" id={id} />`
  - `<HistoryFilters/>`, `<HistoryList/>`, `<HistoryEventRow/>`, `<RestoreFieldButton/>`.
  - Skeleton state; empty state ("Chưa có thay đổi nào"); error retry.
- **Gắn vào**:
  - `src/routes/_app.thiet-bi.$maThietBi.tsx` — tab **Lịch sử** (đã tồn tại timeline sự cố/bảo trì; thêm tab con "Thay đổi dữ liệu" dùng HistoryPanel).
  - Drawer chi tiết trong Vận hành (`ThanhPhanChiTietDialog`, `_app.he-thong.cay.tsx`) — tab "Thay đổi dữ liệu".
- KHÔNG tạo nav item mới; không đổi `nav-contract.ts`.

## 8. Test — Definition of Done

**Unit** (mở rộng `record-timeline.test.ts` + file mới `history-panel.test.ts`):

- `useChangeLog` (mock supabase): trả về items sắp theo `at DESC`, nhóm đúng events ≤3s.
- `computeChanges` bỏ qua IGNORE + `_id` + `tsv`; diff đúng scalar/jsonb.
- `restoreField`:
  - Field ngoài whitelist → `field_not_restorable`, KHÔNG gọi RPC.
  - Field hợp lệ → gọi RPC đúng args, trả `newAuditId`.
  - Value đã bằng current → `already_matches`, không tạo audit.
  - RPC error (RLS) → surface lỗi thân thiện.
- Whitelist `RESTORABLE_FIELDS`: có test khai báo phi rỗng cho `thiet_bi`, `dm_he_thong`, `he_thong_thanh_phan`, `dm_model`, `dm_vi_tri`, `dm_don_vi`, `dm_nha_san_xuat`, `dm_nha_cung_cap`, `dm_loai_thiet_bi`, `dm_nhom_he_thong`, và **không chứa** bất kỳ khoá `*_id`, `active`, `deleted_at`, `trang_thai`.

**Component** (RTL): render 3 events, filter theo actor lọc đúng; click Restore mở confirm; mock RPC success → toast.

**Regression** phải xanh: `record-timeline`, `record-snapshot`, `so-ly-lich-name-sync`, `so-ly-lich-readonly`, `inherited-readonly`, `model-inherit`, `nav-contract`, `route-smoke`, `taxonomy-invariant`, `rls_cross_unit`.

## 9. Rủi ro & giảm thiểu

| Rủi ro                                                            | Giảm thiểu                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Restore field bị Model kế thừa (P/N) → mất đồng bộ                | Whitelist loại trừ; RPC re-check theo `inherited-readonly` config           |
| Old value là JSON lớn (thuoc_tinh)                                | Cho restore từng key trong `thuoc_tinh.*`, không restore whole blob         |
| RLS chặn đọc audit chéo đơn vị → panel trống trong lúc có history | Hiển thị nhãn "Bị ẩn theo quyền" khi count phía server > count nhận về      |
| Loạt bulk-edit tạo hàng nghìn rows nhiễu                          | Group ≤3s + pagination 50 rows + preset filter "chỉ trường tôi có quyền"    |
| Trigger đổi shape `old_data`/`new_data` trong tương lai           | Test guard schema; `computeChanges` đã tolerant với null                    |
| Cột blacklist bị lộ nút Restore do label nhầm                     | Whitelist là allow-list rõ ràng; test đảm bảo không xuất hiện bất kỳ `*_id` |

## 10. Câu hỏi làm rõ

1. **Ai được restore?** Mặc định spec: `admin` + `phong_kt`. `ktv` chỉ xem. Có cần cho `to_truong` restore trong phạm vi ca không?
2. **Restore trên tài sản đang bị soft-deleted**: cấm hoàn toàn, hay cho phép nếu user sẽ restore luôn cả bản ghi?
3. **Group events**: ngưỡng 3s có phù hợp không? Muốn dùng txid nếu trigger có gắn?
4. **Xuất lịch sử**: có cần nút Export CSV/Excel cho lịch sử của 1 entity không?
5. **Hiển thị diff jsonb `thuoc_tinh`**: hiện tất cả keys thay đổi hay chỉ những key thuộc `dm_dac_tinh` đang active?
6. **Phân trang**: 50/trang có ổn hay muốn infinite scroll?
7. **Panel trên MindMap/Table trong Vận hành**: gắn cả 3 view (Tree/Table/MindMap) hay chỉ Drawer chi tiết (mặc định spec)?
8. **`change_request_id` metadata**: hiển thị dạng link mở CR ở `/cho-duyet`, hay chỉ badge tĩnh?

---

**Dừng — chờ duyệt spec + trả lời câu hỏi trước khi sang BƯỚC 2 (TDD).**
