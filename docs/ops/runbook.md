# MIRATS 2.0 — Runbook vận hành

Tài liệu này liệt kê các sự cố vận hành thường gặp và quy trình xử lý. Mỗi mục
gồm: **triệu chứng → chẩn đoán → khắc phục → xác minh**.

> Vai trò truy cập: chỉ `admin` mới được thực hiện các thao tác trong runbook.
> Mọi hành động phá huỷ dữ liệu phải có backup trước (xem `ops/backup-restore.md`).

---

## 1. Không đăng nhập được (Auth down)

- **Triệu chứng**: người dùng bấm đăng nhập → xoay vô hạn, hoặc lỗi
  "Unsupported provider".
- **Chẩn đoán**
  1. Mở Console DevTools → tab Network → xem `/auth/v1/token`.
  2. Kiểm tra `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` không rỗng.
  3. Với OAuth Google: kiểm tra provider Google đã bật.
- **Khắc phục**
  - Nếu key rỗng → thông báo hạ tầng, redeploy.
  - Nếu Google báo unsupported → chạy lại `configure_social_auth`.
- **Xác minh**: đăng nhập bằng tài khoản test → vào `/admin/users` không lỗi.

## 2. Khoá tài khoản admin cuối (self-lockout)

- **Triệu chứng**: mất hoàn toàn khả năng vào `/admin/*`.
- **Phòng ngừa**: `canRevokeRole` / `canSetActive` (`src/lib/mirats/quan-tri/roles.ts`)
  chặn tháo/khoá admin cuối. Không bao giờ tắt kiểm tra này.
- **Khắc phục sự cố**: nếu vẫn xảy ra (ví dụ chỉnh trực tiếp DB), chạy migration
  gán lại `admin` qua RPC `grant_role_service` hoặc `INSERT` bảng
  `public.user_roles` từ SQL editor với `service_role`.

## 3. Sự cố ghi dữ liệu (RLS/PERMISSION_DENIED)

- **Triệu chứng**: form submit lỗi `new row violates row-level security` hoặc
  `permission denied for table X`.
- **Chẩn đoán**
  1. Kiểm tra người dùng có role phù hợp (`has_role(auth.uid(), 'X')`).
  2. Kiểm tra migration mới nhất có GRANT đầy đủ cho `authenticated`.
- **Khắc phục**: nếu thiếu GRANT → viết migration bổ sung
  `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated`.
- **Xác minh**: thao tác lại bằng tài khoản thường.

## 4. Import hàng loạt bị treo hoặc lệch số liệu

- Xem `import_batch` và `import_item` để thấy trạng thái từng dòng.
- Với mỗi batch `error > 0`: mở trang `/admin/nhap-lieu` xem lỗi chi tiết,
  sửa file rồi re-import. Không xoá batch — giữ để audit.

## 5. Cảnh báo hết hạn/quá hạn bảo dưỡng không gửi

- Kiểm tra bảng `canh_bao_het_han_log` xem cron `pg_cron` có chạy không.
- Kiểm tra `telegram_subscriber.active = true` và token bot còn hiệu lực.
- Kích hoạt lại thủ công bằng cách `SELECT public.trigger_canh_bao_het_han();`.

## 6. Realtime UI không cập nhật

- Nguyên nhân phổ biến: `useGlobalRealtime` không subscribe được → check
  Network tab (websocket) và log console.
- Khắc phục nhanh: reload trang. Nếu tái diễn → kiểm tra publication
  `supabase_realtime` có gồm bảng cần theo dõi.

## 7. Khôi phục dữ liệu

Xem `docs/ops/backup-restore.md` và `docs/ops/migration-rollback.md`. Mọi
migration cần có bản `-- rollback` tương ứng và ghi vào `backup_lich_su`.

## 8. Xoay khoá / thu hồi truy cập khẩn cấp

1. Vào `/admin/users` → khoá tài khoản (`canSetActive(false)`).
2. Nếu là API key / secret rò rỉ: chạy `secrets--update_secret` và cập nhật
   biến môi trường.
3. Ghi lại vào CHANGELOG.md phần "Security".

---

**Liên hệ khẩn cấp**: quản trị viên hệ thống (admin cuối cùng đang active).
Không bao giờ chia sẻ `SUPABASE_SERVICE_ROLE_KEY` qua kênh không mã hoá.
