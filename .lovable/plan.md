# Kế hoạch phục hồi Realtime (T47)

Giao diện hiện tại bị "đứng" do Realtime không hoạt động, kết hợp với việc bộ nhớ đệm (Cache) được cấu hình giữ dữ liệu quá lâu (5-30 phút). Realtime đang ở trạng thái "hỏng im lặng": client đăng ký thành công nhưng server không bao giờ gửi tín hiệu vì các bảng chưa được bật phát sóng (Publication).

## Kết quả điều tra (Giai đoạn 1)

1.  **Bước 0 (Realtime Status):** Chưa thể tự xác minh danh sách Publication phía server (cần chủ dự án check dashboard). Tuy nhiên, các bảng nghiệp vụ chính như `su_co`, `bao_tri` chắc chắn chưa chạy vì không thấy dòng lệnh SQL nào bật chúng trong `supabase/`.
2.  **Bước 1 & 5 (Subscription List):** `useGlobalRealtime.ts` đang đăng ký tới **54 bảng**. Đây là con số quá lớn, gây tải cho server/network. Tôi đề xuất rút gọn xuống **12 bảng cốt lõi** thực sự cần cập nhật tức thì.
3.  **Bước 2 (Replica Identity):** Đã có 10 bảng được đặt `REPLICA IDENTITY FULL`. Các bảng nghiệp vụ quan trọng như `su_co`, `bao_tri`, `hong_hoc` vẫn đang thiếu, dẫn đến việc thông tin hàng bị xóa hoặc cập nhật không đầy đủ dữ liệu cũ.
4.  **Bước 3 (Retention):** `DM_STALE` hiện là 5 phút, `DM_GC` là 30 phút. Con số này là quá cao nếu Realtime không hoạt động.
5.  **Bước 4 (Materialized View):** `mv_dashboard_overview` được tạo `WITH NO DATA` và không có cơ chế `REFRESH`. Khung nhìn này hiện tại vĩnh viễn rỗng.
6.  **Realtime Tin nhắn:** Đang đăng ký vào `conversations` và `messages`. Nếu tin nhắn vẫn hoạt động, chứng tỏ Realtime server đang chạy, chỉ thiếu Publication cho các bảng khác.

## Lộ trình thực hiện

### Nhịp 1: Kích hoạt Realtime phía Cơ sở dữ liệu
- Tạo migration `20260811120000_enable_realtime_publication.sql`:
    - Đặt `REPLICA IDENTITY FULL` cho các bảng nghiệp vụ thiếu.
    - Thêm các bảng quan trọng vào publication `supabase_realtime` (sử dụng `ALTER PUBLICATION ... ADD TABLE`).
    - Các bảng đề xuất bật: `su_co`, `bao_tri`, `hong_hoc`, `van_de`, `ban_giao`, `thiet_bi`, `he_thong_thanh_phan`, `gan_chuc_nang`, `access_request`, `user_roles`.
- Tạo migration `20260811121000_dashboard_refresh_cron.sql`:
    - Tạo hàm `refresh_dashboard_overview()`.
    - Thiết lập lịch chạy định kỳ (cron) mỗi 5 phút để cập nhật số liệu Dashboard.

### Nhịp 2: Cải tiến logic Realtime tại Client
- **src/lib/realtime/useGlobalRealtime.ts**:
    - Lọc bớt danh sách đăng ký, chỉ giữ lại các bảng cốt lõi đã bật ở Nhịp 1.
    - Thêm xử lý trạng thái kết nối (tracking `status` từ `.subscribe()`).
- **src/components/mirats/app-shell/TopBar.tsx**:
    - Thêm chỉ báo `RealtimeStatus` (chấm xanh/xám nhỏ cạnh đồng hồ hoặc chuông thông báo).
- **src/hooks/use-realtime-fallback.ts** (Mới):
    - Hook tự động kích hoạt `refetchInterval` (60s) khi Realtime bị ngắt kết nối hoặc đăng ký lỗi.

### Nhịp 3: Kiểm tra và Bàn giao
- Chạy `npx tsc --noEmit`.
- Chạy `npm run test` để đảm bảo không phá vỡ logic cũ.
- Kiểm tra tính năng "tự cập nhật" bằng cách giả lập thay đổi dữ liệu trong preview.

## Câu hỏi làm rõ (Bước 0)
- **Hỏi User:** Bạn có thể xác nhận trong Supabase Dashboard > Realtime xem danh sách bảng đang được bật có trống hay không? Nếu phần Tin nhắn (bảng `messages`) đang hoạt động thì bảng đó có nằm trong danh sách không?
