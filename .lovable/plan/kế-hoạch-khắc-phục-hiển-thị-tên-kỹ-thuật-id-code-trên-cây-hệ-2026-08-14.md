# Kế hoạch khắc phục hiển thị tên kỹ thuật (ID/Code) trên Cây Hệ Thống

Người dùng phản hồi rằng trên giao diện Cây Hệ Thống (`/he-thong/cay`), các tên đang hiển thị dạng mã kỹ thuật (ví dụ: `AWOS::HT_PBA_AWOS_900`) thay vì tên tiếng Việt chuẩn. Nguyên nhân là do các hàm ánh xạ tên (`plMind`, `nhMind`, `htMind`) đang cố gắng tìm kiếm trong `taxonomy.htNameMap` bằng mã (code) nhưng bản đồ này lại được đánh chỉ mục bằng UUID.

## Các bước thực hiện

### 1. Cập nhật `DbTaxonomy` để hỗ trợ ánh xạ theo Mã (Code)

Trong file `src/lib/mirats/db-taxonomy.ts`, chúng ta sẽ bổ sung các bản đồ (Map) mới để có thể tra cứu tên từ mã kỹ thuật:

- Bổ sung `nhomMaMap`: ánh xạ từ mã nhóm (ví dụ: `VHF`) sang tên tiếng Việt.
- Bổ sung `htMaMap`: ánh xạ từ mã hệ thống (ví dụ: `HT_PBA_AWOS_900`) sang tên tiếng Việt.
- Cập nhật hàm `loadTaxonomy` để khởi tạo các bản đồ này.

### 2. Cập nhật các hook ánh xạ tên trong trang Cây Hệ Thống

Trong file `src/routes/_app.he-thong.cay.tsx`, cập nhật logic của `useNhMind` và `useHtMind`:

- `useNhMind`: Thử tìm trong `taxonomy.nhomMaMap` nếu không tìm thấy trong `nhomNameMap`.
- `useHtMind`: Thử tìm trong `taxonomy.htMaMap` nếu không tìm thấy trong `htNameMap`.

### 3. Đồng bộ hóa logic hiển thị trong MindMap

Đảm bảo các thay đổi trên cũng tác động đến `CayMindMap.tsx` vì nó sử dụng cùng các hook `plMind`, `nhMind`, `htMind`.

## Kỹ thuật chi tiết

- `nhomMaMap`: `Map<string, string>` (ma -> ten)
- `htMaMap`: `Map<string, string>` (ma -> ten)
- Sửa `useHtMind` để xử lý cả trường hợp `id` (UUID) và `ma` (Code).

## Kiểm tra

- Mở trang `/he-thong/cay`.
- Kiểm tra các nút bấm và nhãn trong Cây (TreeView) không còn hiển thị các chuỗi như `AWOS::HT_PBA_AWOS_900`.
- Kiểm tra MindMap cũng hiển thị tên tiếng Việt chuẩn.
