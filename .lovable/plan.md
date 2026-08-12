# Plan: Khôi phục và làm nổi bật Sơ đồ hệ thống (MindMap)

Người dùng gặp khó khăn trong việc tìm và mở tính năng Sơ đồ hệ thống sau đợt refactor. Mặc dù tính năng vẫn hoạt động như một tab trong "Cây Hệ Thống", việc đưa nó ra ngoài menu chính (sidebar) sẽ giúp tăng tính khám phá và tiện dụng.

## User Review Required

> [!IMPORTANT]
> Tôi sẽ thêm một mục "Sơ đồ hệ thống" trực tiếp vào menu bên trái để bạn có thể mở nhanh MindMap mà không cần vào tab bên trong "Cây hệ thống". Bạn có đồng ý với cách tiếp cận này không?

## Proposed Changes

### Navigation (Menu bên trái)

- Cập nhật `src/lib/mirats/nav-contract.ts`:
  - Thêm mục "Sơ đồ hệ thống" trỏ tới `/he-thong/cay?view=mindmap` với icon `GitFork`.
  - Giữ nguyên "Bản vẽ sơ đồ" trỏ tới `/so-do` (Trình vẽ thủ công).

### Giao diện Cây hệ thống

- Cập nhật `src/routes/_app.he-thong.cay.tsx`:
  - Thêm một `Tooltip` hoặc một đoạn văn bản hướng dẫn nhỏ (Guide) cạnh tiêu đề hoặc Tabs để người dùng biết các chế độ xem (Bảng, Cây, Sơ đồ).
  - Đảm bảo khi bấm vào mục "Sơ đồ hệ thống" từ sidebar, trang sẽ chuyển đúng sang tab MindMap.

## Technical Details

- Sử dụng `GitFork` icon cho MindMap tự động để phân biệt với `Waypoints` của Bản vẽ thủ công.
- Kiểm tra tính nhất quán của `display` state với search param `view` (đã có logic đồng bộ, sẽ kiểm tra lại để đảm bảo mượt mà).

## Verification Plan

### Automated Tests
- Chạy Playwright script để kiểm tra:
  - Truy cập `/he-thong/cay?view=mindmap` có hiển thị đúng nodes (React Flow nodes > 0).
  - Bấm chuyển tab giữa "Cây" và "Sơ đồ" hoạt động đúng.

### Manual Verification
- Kiểm tra sidebar có đủ 2 mục: "Sơ đồ hệ thống" và "Bản vẽ sơ đồ".
- Kiểm tra tab "Sơ đồ" trong trang Hệ thống.
