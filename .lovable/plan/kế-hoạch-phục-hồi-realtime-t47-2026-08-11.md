# Kế hoạch phục hồi Realtime (T47)

Giao diện hiện tại bị "đứng" do Realtime không hoạt động, kết hợp với việc bộ nhớ đệm (Cache) được cấu hình giữ dữ liệu quá lâu (5-30 phút). Realtime đang ở trạng thái "hỏng im lặng": client đăng ký thành công nhưng server không bao giờ gửi tín hiệu vì các bảng chưa được bật phát sóng (Publication).

## Kết quả điều tra (Giai đoạn 1)

1.  **Bước 0 (Realtime Status):** Tôi đã tự xác minh qua mã nguồn và lược đồ. Các bảng nghiệp vụ chính như `su_co`, `bao_tri` chắc chắn **CHƯA** được bật phát sóng vì không có lệnh SQL nào trong `supabase/` làm việc này. Hơn nữa, chúng cũng chưa được đặt `REPLICA IDENTITY FULL`, nghĩa là kể cả khi bật, dữ liệu cũ cũng sẽ bị thiếu khi xóa/sửa.
2.  **Bước 1 & 5 (Subscription List):** `useGlobalRealtime.ts` đang đăng ký tới **54 bảng**. Đây là con số quá lớn, gây tải cho server/network. Tôi đề xuất rút gọn xuống **12 bảng cốt lõi** thực sự cần cập nhật tức thì.
3.  **Bước 2 (Replica Identity):** Đã có 10 bảng được đặt `REPLICA IDENTITY FULL` (như `thiet_bi`, `dm_he_thong`). Các bảng nghiệp vụ quan trọng như `su_co`, `bao_tri`, `hong_hoc`, `van_de`, `ban_giao`, `access_request`, `user_roles` vẫn đang thiếu.
4.  **Bước 3 (Retention):** `DM_STALE` hiện là 5 phút, `DM_GC` là 30 phút. Con số này là quá cao nếu Realtime không hoạt động.
5.  **Bước 4 (Materialized View):** `mv_dashboard_overview` được tạo `WITH NO DATA` và không có cơ chế `REFRESH`. Khung nhìn này hiện tại **vĩnh viễn rỗng**. RPC `rpc_dashboard_overview` đang phải tính toán lại mỗi lần gọi vì view rỗng, làm giảm hiệu năng.
6.  **Realtime Tin nhắn:** Đang đăng ký vào `conversations` và `messages`. Nếu tin nhắn vẫn hoạt động, chứng tỏ Realtime server đang chạy, chỉ thiếu Publication cho các bảng nghiệp vụ khác.

## Lộ trình thực hiện

### Nhịp 1: Kích hoạt Realtime phía Cơ sở dữ liệu

- Tạo migration `20260811120000_enable_realtime_publication.sql`:
  - Đặt `REPLICA IDENTITY FULL` cho các bảng nghiệp vụ còn thiếu.
  - Tạo publication `supabase_realtime` nếu chưa có và thêm các bảng quan trọng vào đó.
  - Các bảng đề xuất bật: `su_co`, `bao_tri`, `hong_hoc`, `van_de`, `ban_giao`, `thiet_bi`, `he_thong_thanh_phan`, `gan_chuc_nang`, `access_request`, `user_roles`.
- Tạo migration `20260811121000_dashboard_refresh_cron.sql`:
  - Tạo hàm `refresh_dashboard_overview()`.
  - Thiết lập lịch chạy định kỳ (cron) mỗi 5 phút để cập nhật số liệu Dashboard vào materialized view.

### Nhịp 2: Cải tiến logic Realtime tại Client

- **src/lib/realtime/useGlobalRealtime.ts**:
  - Lọc bớt danh sách đăng ký, chỉ giữ lại các bảng cốt lõi đã bật ở Nhịp 1.
  - Thêm xử lý trạng thái kết nối (tracking `status` từ `.subscribe()`).
- **src/components/mirats/app-shell/TopBar.tsx**:
  - Thêm chỉ báo `RealtimeStatus` (chấm xanh/xám nhỏ cạnh đồng hồ hoặc chuông thông báo).
- **src/hooks/use-realtime-fallback.ts** (Mới):
  - Hook tự động kích hoạt `refetchInterval` (60s) cho các query quan trọng khi Realtime bị ngắt kết nối.

### Nhịp 3: Kiểm tra và Bàn giao

- Chạy `npx tsc --noEmit`.
- Chạy `npm run test` để đảm bảo không phá vỡ logic cũ.
- Kiểm tra tính năng "tự cập nhật" bằng cách giả lập thay đổi dữ liệu trong preview.
