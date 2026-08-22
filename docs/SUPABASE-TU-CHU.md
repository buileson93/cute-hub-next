# Chạy dự án trên Supabase riêng (không dùng Lovable Cloud)

Toàn bộ code nghiệp vụ đã đi qua lớp `src/integrations/backend/*`. Lớp này tự chọn backend:

| Ưu tiên | Biến                                     | Kết quả                  |
| ------- | ---------------------------------------- | ------------------------ |
| 1       | `APP_SUPABASE_*` / `VITE_APP_SUPABASE_*` | Supabase riêng của bạn   |
| 2       | `SUPABASE_*` / `VITE_SUPABASE_*`         | Lovable Cloud (mặc định) |

Không cần sửa file nào trong `src/integrations/supabase/` (auto-generated) và cũng không cần sửa `.env` do Lovable quản lý.

## Các bước

1. **Tạo project Supabase** của bạn (cloud hoặc self-host).
2. **Nạp schema + dữ liệu**: dùng `supabase/migrations-fresh/` cho project trống,
   hoặc gói `.zip` dump tại _Quản trị → Lưu trữ tệp → Tải .zip dump_ rồi phục hồi bằng
   _Phục hồi CSDL từ gói .zip_.
3. **Tạo bucket Storage**: `giay-phep-khai-thac`, `thiet-bi-hinh-anh`, `thiet-bi-tai-lieu`,
   `model-tai-lieu`, `model-anh`, `vi-tri-media`, `chu-ky`, `form-attachments`,
   `nha-san-xuat-logo`, `avatars`, `chat-files`, `su-co-images`, `form-pdf`,
   `database-backups` (đều để private). Hoặc bật chế độ **Chỉ R2** để bỏ qua Storage.
4. **Khai báo biến môi trường** theo `.env.example`:
   - Phía trình duyệt: đặt `VITE_APP_SUPABASE_*` trong `.env.local`.
   - Phía máy chủ: đặt `APP_SUPABASE_*` (kể cả service role) qua Secrets của dự án.
5. **Khởi động lại** dev server / build lại để Vite nhúng biến mới.

## Kiểm tra đang chạy backend nào

```ts
import { resolveBrowserBackend } from "@/integrations/backend/client";
console.log(resolveBrowserBackend().provider); // "self-hosted" | "lovable-cloud"
```

## Phần vẫn thuộc Lovable (tuỳ chọn tắt)

- **Lovable AI Gateway** (`LOVABLE_API_KEY`): phân tích sự cố bằng AI. Thay bằng khoá OpenAI/Gemini riêng nếu cần.
- **Lovable Email**: mẫu email xác thực. Có thể chuyển sang SMTP riêng trong Supabase Auth.
- **Storage**: đã có chế độ _Chỉ Cloudflare R2_ trong _Quản trị → Lưu trữ tệp_.
