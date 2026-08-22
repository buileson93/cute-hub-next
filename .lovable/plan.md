# Kế hoạch Phase 10G: Data Correctness & Hardening

Mục tiêu: Đảm bảo tính chính xác của dữ liệu, ngăn chặn ghi trùng lặp, thắt chặt quyền hạn và chuẩn hóa thông báo lỗi/thành công trên toàn hệ thống MIRATS.

## 1. AI Chat Hardening (Idempotency & Ownership)
- **Vấn đề**: Chat message có thể bị ghi đè hoặc tạo trùng khi retry. Người dùng có thể ghi vào conversation không thuộc về mình.
- **Giải pháp**:
    - Sử dụng `upsert` với `client_message_id` để đảm bảo mỗi tin nhắn chỉ lưu một lần.
    - Kiểm tra `user_id` của `conversation` trước khi insert/update.
    - `onFinish` chỉ lưu tin nhắn mới thay vì insert lại toàn bộ lịch sử.

## 2. R2 Storage Reliability
- **Vấn đề**: Xóa metadata thành công nhưng xóa file vật lý trên R2 thất bại dẫn đến dữ liệu mồ côi.
- **Giải pháp**:
    - Cập nhật logic `r2-cleanup` để chỉ xóa metadata khi `R2.delete` trả về thành công.
    - Trả về trạng thái chi tiết cho từng item thay vì boolean chung.

## 3. Mutation Audit & Error Surfacing
- **Vấn đề**: Nhiều mutation sử dụng `toast.success` trước khi hoàn tất logic hoặc thiếu tiền tố lỗi cụ thể (ví dụ: "Lưu thất bại" thay vì chỉ hiện message lỗi).
- **Giải pháp**:
    - Rà soát toàn bộ các route `_app.*` và `admin.*`.
    - Thêm tiền tố mô tả hành động vào `toast.error` (vd: `toast.error("Duyệt đề xuất thất bại: " + e.message)`).
    - Đảm bảo toast success chỉ hiện khi mutation và các invariant check liên quan đã pass.

## 4. Multi-step Mutation Safety
- **Vấn đề**: Các thao tác nhiều bước (ví dụ: duyệt Change Request + cập nhật thực thể) có thể để lại trạng thái không nhất quán nếu lỗi ở bước giữa.
- **Giải pháp**:
    - Sử dụng RPC/Transactions cho các thao tác atomic.
    - Thêm logic rollback thủ công (compensation) cho các flow phức tạp không thể dùng transaction.

## 5. Visual Documentation Verbatim
- Cập nhật `aria-label` tại `TzClock.tsx` với chuỗi yêu cầu để làm tài liệu trực quan về phạm vi công việc 10G.
