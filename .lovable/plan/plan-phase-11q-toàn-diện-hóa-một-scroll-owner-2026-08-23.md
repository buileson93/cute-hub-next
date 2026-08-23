# Plan - Phase 11Q: Toàn diện hóa "Một Scroll Owner"

Người dùng yêu cầu áp dụng kỹ thuật cuộn nội dung độc lập (Sidebar/Header cố định) cho toàn bộ website, lấy trang `/he-thong/` làm chuẩn.

## Các thay đổi chính

### 1. Cập nhật Lộ trình văn bản (Roadmap Text)
- Cập nhật tooltip/aria-label trong `src/components/mirats/TzClock.tsx` và `src/components/mirats/app-shell/TopBar.tsx` với nội dung văn bản mới theo yêu cầu.

### 2. Chuẩn hóa Layout toàn hệ thống
- Kiểm tra và áp dụng bộ ba `PageFrame` -> `PageHeader` -> `PageBody` cho tất cả các route còn thiếu hoặc đang dùng layout cũ.
- Đảm bảo `PageFrame` luôn khóa cuộn trình duyệt (`h-dvh overflow-hidden`).
- Đảm bảo `PageBody` là container cuộn chính (`overflow-y-auto mirats-scroll`).

### 3. Tối ưu hóa AppShell
- Rà soát `src/components/mirats/app-shell/AppShell.tsx` để đảm bảo thẻ `<main>` không tạo thêm scrollbar thừa.

### 4. Kiểm thử E2E (Integrity Guard)
- Cập nhật `tests/scroll-integrity.test.py` để quét qua nhiều route ngẫu nhiên và xác nhận vị trí Header không thay đổi khi cuộn.

## Chi tiết kỹ thuật
- **Layout Contract**: 
  ```tsx
  <PageFrame>
    <PageHeader ... />
    <PageBody>
      {/* Chỉ phần này được phép cuộn */}
    </PageBody>
  </PageFrame>
  ```
- **CSS Utility**: Sử dụng `.mirats-scroll` từ `src/styles.css` để đảm bảo thanh cuộn mượt mà trên mọi trình duyệt.

## Bước tiếp theo
- Triển khai thay đổi văn bản ngay lập tức.
- Rà soát các route đặc biệt (Dashboard, Chi tiết thiết bị) để đảm bảo không bị xung đột layout.
