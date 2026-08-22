# N2 — Change Request (Phê duyệt thay đổi nhạy cảm)

> **Trạng thái**: SPEC — chờ phê duyệt. Không code cho tới khi duyệt. Kế thừa từ N1 spec và `docs/superpowers/specs/mirats-edit-ssot-design.md`.

## 1. Nguyên tắc

- **Phong_kt đề xuất — admin duyệt** cho các thay đổi có tác động dây chuyền hoặc phá dữ liệu.
- **Không có drift**: mọi hành động nhạy cảm chỉ đi qua 1 cửa (`createChangeRequest`); UI không được gọi mutation trực tiếp cho các loại này.
- **Không hard-delete**: từ chối vẫn giữ đề xuất để audit; approve gọi RPC nghiệp vụ tương ứng (không tự viết SQL trong app).
- **Audit hai lớp**: tạo đề xuất ghi 1 dòng audit; áp dụng ghi thêm 1 dòng (link qua `change_request_id`).
- **RLS là chốt cuối**: kể cả khi UI bug, DB vẫn chặn `phong_kt` self-approve.

## 2. Hành động nhạy cảm (whitelist `loai`)

| `loai`                   | Ý nghĩa                                                                          | Payload chính                                 | Áp dụng bằng                                                      |
| ------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `cay.delete_node`        | Xoá mềm node (hệ thống / thành phần)                                             | `{ node_id, entity, reason }`                 | RPC `cay_soft_delete_node`                                        |
| `cay.restore_node`       | Khôi phục node từ thùng rác                                                      | `{ node_id, entity }`                         | RPC `cay_restore_node`                                            |
| `cay.hard_delete_node`   | Xoá cứng (chỉ khi 0 dependency)                                                  | `{ node_id, entity }`                         | RPC `dm_xoa_an_toan` / equivalent                                 |
| `cay.reorg`              | Đổi cấu trúc cha-con: chuyển thành phần sang hệ thống khác, đổi nhóm             | `{ node_id, from_parent, to_parent, entity }` | RPC `cay_reorg_move`                                              |
| `thiet_bi.change_model`  | Đổi `model_id` của tài sản (kéo theo kế thừa NSX/loại/P/N)                       | `{ thiet_bi_id, from_model_id, to_model_id }` | UPDATE `thiet_bi.model_id` + trigger propagate đã có              |
| `thiet_bi.change_don_vi` | Chuyển tài sản sang đơn vị khác                                                  | `{ thiet_bi_id, to_don_vi_id }`               | UPDATE `thiet_bi.don_vi_id` (nếu có) hoặc reassign qua thành phần |
| `he_thong.change_nhom`   | Đổi `nhom_he_thong_id` của hệ thống                                              | `{ he_thong_id, to_nhom_id }`                 | UPDATE `dm_he_thong.nhom_he_thong_id`                             |
| `he_thong.change_don_vi` | Đổi đơn vị quản lý của hệ thống (cascade xuống thành phần & tài sản qua trigger) | `{ he_thong_id, to_don_vi_id }`               | UPDATE `dm_he_thong.don_vi_id`                                    |
| `danh_muc.merge`         | Gộp 2 bản ghi danh mục (N1)                                                      | `{ entity, keep_id, drop_id }`                | RPC `merge_danh_muc`                                              |
| `danh_muc.deactivate`    | Vô hiệu hoá 1 mục danh mục có tham chiếu                                         | `{ entity, id }`                              | UPDATE `active=false`                                             |
| `role.grant`             | Cấp vai trò `admin`/`phong_kt` cho user                                          | `{ user_id, role }`                           | INSERT `user_roles`                                               |
| `role.revoke`            | Thu hồi vai trò tương ứng                                                        | `{ user_id, role }`                           | DELETE `user_roles`                                               |

**Không** cần phê duyệt: cập nhật `ten`, ghi chú, tạo mới danh mục thông thường, tạo sự cố/công việc, nhập kho. Các CRUD hằng ngày do RLS quyết định trực tiếp.

## 3. Ai được làm gì

| Vai trò                           | Tạo change_request                                                   | Duyệt/Từ chối | Ghi chú                                                            |
| --------------------------------- | -------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `admin`                           | ✅ (được phép áp dụng trực tiếp không cần CR nếu bấm "Áp dụng ngay") | ✅            | Không thể self-approve CR **do chính mình tạo** — phải admin khác. |
| `phong_kt`                        | ✅                                                                   | ❌            | Có thể huỷ CR khi trạng thái `pending` do chính mình tạo.          |
| `to_truong`, `ktv`, các role khác | ❌ (chỉ dùng CRUD được RLS cho phép)                                 | ❌            | Không được gọi mutation nhạy cảm dưới bất kỳ hình thức nào.        |

Sequence:

```text
phong_kt bấm "Xoá node" ─▶ createChangeRequest(loai, payload) ─▶ trạng thái pending
admin mở /cho-duyet ─▶ approve(id, ly_do?) ─▶ RPC áp dụng ─▶ audit_log + resolved
                     └▶ reject(id, ly_do)  ─▶ không đổi dữ liệu + audit
```

## 4. Schema `change_request`

```sql
CREATE TYPE change_request_status AS ENUM ('pending','approved','rejected','cancelled','applied_failed');
CREATE TYPE change_request_loai AS ENUM (
  'cay.delete_node','cay.restore_node','cay.hard_delete_node','cay.reorg',
  'thiet_bi.change_model','thiet_bi.change_don_vi',
  'he_thong.change_nhom','he_thong.change_don_vi',
  'danh_muc.merge','danh_muc.deactivate',
  'role.grant','role.revoke'
);

CREATE TABLE public.change_request (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loai          change_request_loai NOT NULL,
  payload       jsonb NOT NULL,
  ghi_chu       text,                                  -- lý do đề xuất (bắt buộc ở app-layer)
  nguoi_tao     uuid NOT NULL REFERENCES auth.users(id),
  trang_thai    change_request_status NOT NULL DEFAULT 'pending',
  ly_do         text,                                  -- lý do duyệt/từ chối
  resolved_by   uuid REFERENCES auth.users(id),
  resolved_at   timestamptz,
  applied_audit_id uuid REFERENCES audit_log(id),      -- link tới audit khi approve
  error_message text,                                  -- nếu applied_failed
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_change_request_pending ON change_request(trang_thai) WHERE trang_thai='pending';
CREATE INDEX idx_change_request_nguoi_tao ON change_request(nguoi_tao);
```

**RLS** (bật ngay):

- `SELECT`: `nguoi_tao = auth.uid()` **OR** `has_role(auth.uid(),'admin')` **OR** `has_role(auth.uid(),'phong_kt')` (phong_kt cần thấy hàng đợi chung để phối hợp — chỉ đọc).
- `INSERT`: `nguoi_tao = auth.uid()` **AND** (`has_role admin` **OR** `has_role phong_kt`) **AND** `trang_thai = 'pending'`.
- `UPDATE`: chỉ `admin` **AND** `resolved_by = auth.uid()` **AND** `nguoi_tao <> auth.uid()` (chặn self-approve) — dùng function `SECURITY DEFINER` `approve_change_request(id, ly_do)` để đóng logic.
- `DELETE`: không cho phép; huỷ = UPDATE `trang_thai='cancelled'` khi `nguoi_tao=auth.uid()` và `trang_thai='pending'`.

**GRANT**: `SELECT, INSERT, UPDATE ON change_request TO authenticated; ALL TO service_role`.

## 5. Hành vi Duyệt / Từ chối / Huỷ

**`approve(id, ly_do?)`** (RPC `SECURITY DEFINER`):

1. Kiểm tra caller là `admin` và `nguoi_tao <> auth.uid()`.
2. Kiểm tra `trang_thai = 'pending'`.
3. Kiểm tra idempotency: nếu payload đã bị conflict (ví dụ node đã xoá) → chuyển `applied_failed` với `error_message`.
4. Áp dụng theo `loai` bằng RPC tương ứng, ghi `audit_log` với `metadata.change_request_id`.
5. UPDATE `trang_thai='approved'`, `resolved_by=auth.uid()`, `resolved_at=now()`, `applied_audit_id`.

**`reject(id, ly_do)`**: `ly_do` bắt buộc (`length >= 5`). Không đổi dữ liệu nghiệp vụ; ghi `audit_log` action=`reject_change_request`.

**`cancel(id)`**: bởi `nguoi_tao` khi còn `pending`. Ghi audit.

**Retry sau `applied_failed`**: admin có thể clone CR mới; không cho update-tại-chỗ.

## 6. UI

- Route `/cho-duyet` (dưới `_authenticated`), nav item mới có **badge số CR pending** (query `count()` refresh mỗi 30s + realtime channel).
- Bảng: `loai`, `nguoi_tao`, `created_at`, `payload_summary` (renderer theo `loai`), nút **Xem chi tiết** mở dialog trước/sau, **Duyệt** / **Từ chối** (bắt buộc lý do khi từ chối, ≥5 ký tự).
- Filter: `trang_thai`, `loai`, khoảng thời gian.
- Các mutation nhạy cảm ở UI hiện có (nút xoá node, đổi model, gộp danh mục, cấp role) chuyển thành:
  - Nếu caller là `admin` → dialog xác nhận + "Áp dụng ngay" (đi đường cũ) hoặc "Đề xuất" (tạo CR).
  - Nếu caller là `phong_kt` → chỉ "Đề xuất"; sau khi tạo hiển thị toast + link tới CR.
- Không thay đổi `nav-contract.ts` mà không cập nhật `nav-contract.test.ts` và `nav-config.test.ts` cùng lúc.

## 7. Test — Definition of Done

**Unit `src/lib/mirats/__tests__/change-request.test.ts`**:

- `createChangeRequest(loai, payload)` trả về row `pending`; validate `loai` thuộc whitelist; từ chối payload thiếu field.
- `approve` được gọi bởi admin khác → dispatch đúng RPC theo `loai`; payload sai → `applied_failed`.
- `reject` giữ nguyên dữ liệu, `ly_do` bắt buộc.
- `cancel` chỉ hoạt động khi `pending` và của chính user.
- Mock guard: `phong_kt` gọi `approve` → throw `not_authorized`.

**pgTAP `supabase/tests/change_request_rls.sql`**:

1. Seed 3 user: admin_a, admin_b, kt_a (phong_kt), ktv_a.
2. `kt_a` INSERT CR → OK; `ktv_a` INSERT → RLS reject.
3. `kt_a` UPDATE `trang_thai='approved'` cùng row → RLS reject.
4. `admin_a` UPDATE row của chính mình → reject (no self-approve).
5. `admin_b` gọi `approve_change_request(id)` → ok, trạng thái `approved`, audit_log ghi.
6. `kt_a` SELECT thấy row của mình + của admin_b; `ktv_a` SELECT không thấy gì.

**Regression** phải xanh: `taxonomy-invariant`, `rls_cross_unit`, `quan-tri-roles`, `quyen`, `cay-delete`, `he-thong-thanh-phan`, `rename-entity`, `danh-muc-refs`, `nav-contract`, `nav-config`, `route-smoke`.

## 8. Rủi ro & Giảm thiểu

| Rủi ro                               | Giảm thiểu                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CR chồng chéo (2 CR cùng đổi 1 node) | Khi approve, tự động `cancel` các CR pending có `payload.node_id` trùng và ghi audit                                                        |
| Payload lỗi thời (node đã bị xoá)    | `applied_failed` + error_message; không rollback thay đổi trước                                                                             |
| Admin lạm quyền "Áp dụng ngay"       | Ghi audit `admin_direct_apply` với `change_request_id=NULL`; báo cáo hàng tuần                                                              |
| Realtime badge sai                   | Poll fallback 30s khi channel disconnect                                                                                                    |
| Legacy code đường tắt                | Grep guard test: cấm gọi RPC nhạy cảm ngoài `change-request.ts` (regex qua `src/lib/mirats/__tests__/no-direct-sensitive-mutation.test.ts`) |
| RLS đọc quá rộng cho phong_kt        | Ẩn `payload` chi tiết nếu CR không thuộc scope của user (view + policy)                                                                     |

## 9. Câu hỏi làm rõ

1. **Áp dụng ngay** cho admin có được phép không, hay bắt buộc admin cũng phải đi qua CR (cần admin khác duyệt)? Mặc định spec: cho phép, kèm audit rõ.
2. `phong_kt` có được **đọc payload đầy đủ** của CR do người khác tạo không, hay chỉ thấy tiêu đề?
3. Với `role.grant/revoke`: có nên **yêu cầu 2 admin duyệt** (4-eyes strict) không?
4. Chấp nhận `applied_failed` cần **retry chain** (clone CR mới) hay cho phép admin sửa payload trực tiếp?
5. Có cần **auto-expire** CR pending sau N ngày (ví dụ 14 ngày) → `cancelled` tự động?
6. Nav badge realtime: dùng Supabase Realtime channel `change_request` hay chỉ polling 30s?
7. `cay.reorg`: có tách riêng "đổi cha" (parent) vs "đổi thứ tự" (order) không? Đổi thứ tự chắc không cần duyệt.
8. Ngôn ngữ mã `loai`: giữ dot.notation tiếng Anh như trên, hay đổi sang tiếng Việt để hiển thị dễ?

---

**Dừng — chờ duyệt spec + trả lời câu hỏi trước khi sang BƯỚC 2 (migration + TDD).**
