# Kế hoạch khắc phục lỗi Runtime Error 500 trên Trang chủ

Lỗi 500 xảy ra trong quá trình SSR (Server-Side Rendering) khi trang chủ (`/`) cố gắng tải dữ liệu thông qua các Server Function yêu cầu xác thực (`requireSupabaseAuth`). Do SSR không có Header `Authorization` chứa Bearer Token của người dùng, middleware ném lỗi "Unauthorized", dẫn đến treo trang trắng (Blank screen) thay vì chuyển hướng sang trang đăng nhập.

## Nguyên nhân cốt lõi

1. **Lỗi Middleware SSR**: `requireSupabaseAuth` ném lỗi thay vì trả về null hoặc xử lý chuyển hướng mềm khi chạy trên server mà thiếu token.
2. **Loader chặn render**: `src/routes/_app.index.tsx` sử dụng `await Promise.all` trong loader. Dù đã có `try-catch` bao quanh, nếu loader ném lỗi trong SSR, TanStack Start có thể coi đó là lỗi chí mạng tùy thuộc vào cấu hình middleware.
3. **Phụ thuộc xác thực**: Các hàm dashboard (`getCompletenessStats`, `getCompletenessOverview`) bắt buộc phải có auth ngay cả khi chỉ đang render khung trang ban đầu.

## Các bước thực hiện

### Bước 1: Điều tra chuyên sâu (Chỉ đọc)

- Kiểm tra `src/integrations/backend/auth-middleware.ts` (đã xem, xác nhận ném lỗi trực tiếp).
- Kiểm tra logs server thực tế để xem chính xác dòng code nào gây ra lỗi 500 cuối cùng.
- Xác minh `src/start.ts` có đang bắt lỗi quá chặt chẽ trong `errorMiddleware` hay không.

### Bước 2: Khắc phục lỗi (Thực hiện)

#### Giai đoạn 1: Làm mềm Middleware xác thực

- Cập nhật `requireSupabaseAuth` để không ném lỗi trực tiếp khi thiếu header trong SSR, thay vào đó trả về context trống hoặc đánh dấu "unauthenticated". Điều này cho phép component render được khung và để phía Client xử lý redirect thông qua `useSession`.

#### Giai đoạn 2: Tối ưu hóa Loader Trang chủ

- Đảm bảo loader trong `src/routes/_app.index.tsx` không bao giờ chặn việc render trang nếu fetch lỗi.
- Di chuyển logic fetch dữ liệu nhạy cảm hoàn toàn xuống phía Client (dùng `useQuery` thay vì `useSuspenseQuery` cho các khối dashboard) nếu SSR không thể lấy được token.

#### Giai đoạn 3: Củng cố Dashboard Realtime Functions

- Cập nhật các server functions trong `src/lib/mirats/dashboard-realtime.functions.ts` để kiểm tra quyền truy cập an toàn hơn, trả về dữ liệu trống thay vì lỗi 500 nếu session không hợp lệ.

## Phạm vi thay đổi

- `src/integrations/backend/auth-middleware.ts`
- `src/routes/_app.index.tsx`
- `src/lib/mirats/dashboard-realtime.functions.ts` (nếu cần)

## Xác nhận sau khi sửa

- [ ] Trang chủ mở lên không còn lỗi 500 (hiển thị loading hoặc redirect về `/auth`).
- [ ] `npx tsc --noEmit` không có lỗi.
- [ ] Kiểm tra bằng Playwright để đảm bảo flow đăng nhập/đăng xuất vẫn hoạt động đúng.
