# Kế hoạch Cải thiện UI/UX MIRATS 2.0 (Dựa trên tài liệu người dùng)

Tôi đã phân tích tài liệu **KẾ HOẠCH CẢI THIỆN UI/UX — MIRATS 2.0** do bạn cung cấp. Dưới đây là đánh giá tính hợp lý và lộ trình triển khai chi tiết cho dự án hiện tại.

## 1. Phân tích tính hợp lý & Rủi ro

| Hạng mục | Đánh giá | Lưu ý kỹ thuật |
| :--- | :--- | :--- |
| **Giai đoạn -1 (Xác minh)** | **Bắt buộc & Cực kỳ hợp lý** | Tài liệu chỉ ra đúng rủi ro về việc xuất CSV bị thiếu cột nếu hạ mặc định xuống 6 cột. Cần xử lý `ExportContext` trước. |
| **Giai đoạn 1 (View Preset)** | **Rất cần thiết** | Giải quyết vấn đề "ngợp" thông tin. Rủi ro ảnh hưởng 34 bảng khác dùng chung `useColumnPrefs` là có thật. |
| **Giai đoạn 2 (Trang chi tiết)** | **Hợp lý** | Việc gom 15 tab phẳng thành 5 nhóm nghiệp vụ là hướng đi đúng để giảm tải nhận thức. |
| **Giai đoạn 4 (KPI & Trực quan)** | **Hiệu quả cao** | Chuyển từ đọc số sang nhìn "tín hiệu" (Health bar, Age bar) giúp vận hành nhanh hơn. |
| **Giai đoạn 6 (Nợ kỹ thuật)** | **Khó nhất** | Việc tách file `_app.he-thong.cay.tsx` (6.165 dòng) cần sự cẩn trọng tuyệt đối để không làm hỏng logic cây hệ thống. |

## 2. Lộ trình Triển khai Đề xuất

Tôi sẽ triển khai theo các "lát cắt" an toàn, đảm bảo hệ thống luôn chạy được:

### Bước 1: Hạ tầng an toàn (Giai đoạn -1 & 1 - Một phần)
- **Xử lý N1 (Xuất báo cáo):** Cập nhật `StandardTable.tsx` để hộp thoại xuất cho phép chọn "Tất cả cột" hoặc "Cột đang xem", tránh mất dữ liệu khi dùng Preset.
- **Mở rộng `use-column-prefs.ts`:** Hỗ trợ lưu `presetDangDung` nhưng phải đảm bảo tương thích ngược (không làm hỏng cấu hình của 34 bảng khác).

### Bước 2: Hệ thống Khung nhìn & KPI (Giai đoạn 1 & 4.1)
- Triển khai `THIET_BI_PRESETS` (Cơ bản, Vòng đời, Cấp phát, Đầy đủ).
- Thêm dải KPI "bấm-để-lọc" ở đầu trang danh mục tài sản.
- Cập nhật `StandardTable` để hiển thị nút chọn Preset.

### Bước 3: Trực quan hóa dữ liệu (Giai đoạn 4.2 & 4.3)
- Chuẩn hóa `TRANG_THAI_TOKEN` (khóa theo mã `ma` thay vì tên tiếng Việt như tài liệu đính chính N3).
- Thêm Progress Bar tuổi thọ, chấm sức khỏe và Breadcrumb vị trí vào bảng.

### Bước 4: Tái cấu trúc trang chi tiết (Giai đoạn 2 & 3)
- Tách file `_app.thiet-bi.$maThietBi.tsx` thành các Component tab riêng biệt.
- Triển khai logic "ẩn trường trống" và "chế độ kỹ thuật" trong `ThietBiAllFields.tsx`.

### Bước 5: Tối ưu & Nợ kỹ thuật (Giai đoạn 6)
- Tách nhỏ file Cây hệ thống (6k lines).
- Tối ưu hiệu năng render bảng (Virtualization nếu cần).

## 3. Câu hỏi làm rõ cho người dùng

1. **Về Preset mặc định:** Bạn có đồng ý đặt preset "Cơ bản" (6 cột) làm mặc định cho tất cả người dùng mới không?
2. **Về màu sắc trạng thái:** Tôi sẽ lấy mã màu từ hệ thống cũ nhưng áp dụng theo `ma_trang_thai` (bất biến) thay vì `ten` để tránh lỗi khi admin đổi tên, bạn đồng ý chứ?
3. **Về thứ tự ưu tiên:** Bạn muốn tôi bắt đầu ngay từ việc xử lý "An toàn xuất báo cáo (N1)" và "Khung nhìn (Giai đoạn 1)" trước hay tập trung vào "Trang chi tiết (Giai đoạn 2)"?

---
*Tôi sẽ đợi xác nhận của bạn trước khi bắt đầu thực hiện Bước 1.*
