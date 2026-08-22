# Observability — MIRATS 2.0

Giám sát runtime + nhật ký thay đổi dữ liệu. Ba nguồn tín hiệu độc lập, bổ trợ nhau.

## 1. Error tracking (client)

Kênh trung tâm: `window.__lovableEvents.captureException` (Lovable reporter được nhúng sẵn ở published site).

API app dùng: `src/lib/observability/capture.ts`

```ts
import { captureError, setUserContext, addBreadcrumb, setTag } from "@/lib/observability/capture";

// Bootstrap (đã wire trong src/routes/__root.tsx)
// - installGlobalErrorHandlers(): bắt window.error + unhandledrejection
// - setTag("env", import.meta.env.MODE)

// Khi đăng nhập
setUserContext({ id: profile.id, email: profile.email, ho_ten: profile.ho_ten });

// Trước một hành động rủi ro
addBreadcrumb({ category: "ui", message: "click submit su co", data: { form: "PL01" } });

// Bắt lỗi thủ công trong try/catch
try {
  await goiRpc();
} catch (e) {
  captureError(e, { rpc: "ghi_su_co" });
  throw e;
}
```

Mỗi báo cáo kèm: user context, tag môi trường, 30 breadcrumb gần nhất, route hiện tại, user-agent. Xem log trong bảng điều khiển Lovable → Errors.

## 2. Audit log — nhật ký thay đổi dữ liệu

Bảng `public.audit_log` mở rộng (Task 38):

| Cột          | Ý nghĩa                                                               |
| ------------ | --------------------------------------------------------------------- |
| `user_id`    | `auth.uid()` tại thời điểm thay đổi (NULL nếu do trigger nền)         |
| `action`     | Ví dụ `row_insert`, `row_update`, `row_delete`, hoặc action nghiệp vụ |
| `entity`     | Tên bảng chịu tác động                                                |
| `entity_id`  | id / mã của dòng bị tác động                                          |
| `table_name` | (mới) Trùng `entity` với trigger tự động                              |
| `operation`  | (mới) `INSERT` / `UPDATE` / `DELETE`                                  |
| `old_data`   | (mới) `to_jsonb(OLD)` — NULL với INSERT                               |
| `new_data`   | (mới) `to_jsonb(NEW)` — NULL với DELETE                               |
| `severity`   | `info` / `warning` / `error`                                          |
| `created_at` | Thời điểm ghi log                                                     |

### 2.1. Trigger tự động

Hàm `public.audit_row_change()` (SECURITY DEFINER) được gắn AFTER INSERT / UPDATE / DELETE trên các bảng nghiệp vụ chính:

- `thiet_bi`, `su_co`, `bao_tri`, `giay_phep`, `giay_phep_khai_thac`
- `hong_hoc`, `ban_giao`, `vat_tu`, `kho_giao_dich`
- `dm_he_thong`, `dm_don_vi`, `he_thong_thanh_phan`
- `user_roles`, `form_submission`

Trigger bỏ qua UPDATE không thực chất (`to_jsonb(OLD) = to_jsonb(NEW)`).

### 2.2. Mở rộng cho bảng mới

Thêm 1 dòng trong migration mới:

```sql
CREATE TRIGGER trg_audit_<ten_bang>
  AFTER INSERT OR UPDATE OR DELETE ON public.<ten_bang>
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
```

Không gắn trigger cho bảng ghi log tần suất cao (`feature_usage_log`, `auth_event_log`, `telegram_da_gui`, chính `audit_log`) — tránh vòng lặp/khối lượng.

## 3. Màn hình tra cứu

- `/admin/audit` — nhật ký hoạt động chung: lọc theo bảng (`entity`), hành động (`action`), user, khoảng thời gian, từ khoá; hiển thị chi tiết `old_data` ↔ `new_data` khi bung dòng.
- `/admin/audit/lap-thao` — tra cứu chuyên sâu theo bảng + rollback (đã có từ Task audit trước).

Chính sách xem:

- User thường: chỉ thấy nhật ký của chính mình (`audit_self_select`).
- `admin` + `phong_kt`: xem toàn bộ (`audit_admin_kt_select_all`).

## 4. Sức khoẻ cơ bản

Truy vấn nhanh trong `/admin/audit`:

```sql
-- Số thay đổi 24h qua theo bảng
SELECT table_name, operation, count(*)
FROM public.audit_log
WHERE created_at > now() - interval '24 hours'
  AND table_name IS NOT NULL
GROUP BY 1,2 ORDER BY 3 DESC;

-- Người dùng đang thay đổi nhiều nhất
SELECT user_id, count(*)
FROM public.audit_log
WHERE created_at > now() - interval '1 hour'
GROUP BY 1 ORDER BY 2 DESC LIMIT 20;
```

## 5. Điều KHÔNG log

- Mật khẩu, token, mã OTP (không lưu trong bảng nghiệp vụ, nên `to_jsonb` không chạm tới).
- Nội dung file đính kèm — chỉ lưu metadata.
- Không log SELECT — chỉ mutation.

## 6. Retention

- `audit_log`: giữ tối thiểu 12 tháng. Có thể archive theo tháng ra bảng partition sau khi vượt 10M dòng.
- Error tracking (Lovable): theo chính sách của Lovable.

## 7. Kiểm tra khi triển khai

- [ ] `SELECT count(*) FROM public.audit_log WHERE created_at > now() - interval '5 minutes'` sau khi thao tác thử → có dòng mới.
- [ ] Tạo lỗi mẫu ở dev: `throw new Error("obs-smoke")` trong 1 handler → xuất hiện trong Lovable Errors với user + route đúng.
- [ ] `/admin/audit` lọc theo `table_name = 'thiet_bi'` trả về đúng thao tác vừa làm.
