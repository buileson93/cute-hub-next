# Kế hoạch Cải thiện UI/UX MIRATS 2.0 (Dựa trên tài liệu người dùng)

Tôi đã phân tích tài liệu **KẾ HOẠCH CẢI THIỆN UI/UX — MIRATS 2.0** do bạn cung cấp. Dưới đây là đánh giá tính hợp lý và lộ trình triển khai chi tiết cho dự án hiện tại, tập trung vào tính an toàn và đúng nghiệp vụ.

## 1. Phân tích tính hợp lý & Rủi ro

| Hạng mục                          | Đánh giá                     | Lưu ý kỹ thuật                                                                                                          |
| :-------------------------------- | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Giai đoạn -1 (Xác minh)**       | **Bắt buộc & Cực kỳ hợp lý** | Tài liệu chỉ ra đúng rủi ro về việc xuất CSV bị thiếu cột nếu hạ mặc định xuống 6 cột. Cần xử lý `ExportContext` trước. |
| **Giai đoạn 1 (View Preset)**     | **Rất cần thiết**            | Giải quyết vấn đề "ngợp" thông tin. Rủi ro ảnh hưởng 34 bảng khác dùng chung `useColumnPrefs` là có thật.               |
| **Giai đoạn 2 (Trang chi tiết)**  | **Hợp lý**                   | Việc gom 15 tab phẳng thành 5 nhóm nghiệp vụ là hướng đi đúng để giảm tải nhận thức.                                    |
| **Giai đoạn 4 (KPI & Trực quan)** | **Hiệu quả cao**             | Chuyển từ đọc số sang nhìn "tín hiệu" (Health bar, Age bar) giúp vận hành nhanh hơn.                                    |
| **Giai đoạn 6 (Nợ kỹ thuật)**     | **Khó nhất**                 | Việc tách file `_app.he-thong.cay.tsx` (6.165 dòng) cần sự cẩn trọng tuyệt đối để không làm hỏng logic cây hệ thống.    |

## 2. Lộ trình Triển khai (Ưu tiên Hướng An toàn)

Dựa trên xác nhận của bạn, tôi sẽ triển khai theo lộ trình "An toàn là trên hết", xử lý các rủi ro hệ thống trước khi thay đổi giao diện:

### Bước 1: Hạ tầng an toàn (Giai đoạn -1 & 1 - Một phần)

- **Xử lý N1 (Bảo vệ luồng xuất báo cáo):** Cập nhật `StandardTable.tsx` để hộp thoại xuất cho phép chọn "Tất cả cột" hoặc "Cột đang xem". Đảm bảo việc ẩn cột ở Giao diện không làm hỏng file CSV gửi cấp trên.
- **Xử lý N2 (Tương thích ngược `useColumnPrefs`):** Mở rộng hook lưu cấu hình cột để hỗ trợ Presets nhưng không được làm mất cấu hình của 34 bảng khác đang dùng chung hook này.

### Bước 2: Hệ thống Khung nhìn & KPI (Giai đoạn 1 & 4.1)

- Triển khai `THIET_BI_PRESETS` (Cơ bản, Vòng đời, Cấp phát, Đầy đủ).
- Thêm dải KPI "bấm-để-lọc" ở đầu trang danh mục tài sản để user nắm bắt nhanh tình hình.
- Cập nhật `StandardTable` để hiển thị nút chọn Preset (Cơ bản 6 cột làm mặc định cho user mới).

### Bước 3: Trực quan hóa dữ liệu (Giai đoạn 4.2 & 4.3)

- Chuẩn hóa `TRANG_THAI_TOKEN`: Khóa theo mã `ma` (bất biến trong DB) thay vì `ten` (dữ liệu admin nhập) để tránh lỗi chip trạng thái mất màu khi đổi tên.
- Thêm Progress Bar tuổi thọ, chấm sức khỏe và Breadcrumb vị trí vào bảng danh mục.

### Bước 4: Tái cấu trúc trang chi tiết & Bộc lộ dần (Giai đoạn 2 & 3)

- Tách file `_app.thiet-bi.$maThietBi.tsx` thành các Component tab riêng biệt (Tổng quan, Vận hành, Hồ sơ, Cấu hình, Nâng cao).
- Triển khai logic "ẩn trường trống" và "chế độ kỹ thuật" trong `ThietBiAllFields.tsx`.

### Bước 5: Xử lý nợ kỹ thuật (Giai đoạn 6)

- Tách nhỏ file Cây hệ thống (6.165 lines) thành các module chức năng.
- Tối ưu hiệu năng render và tìm kiếm phía Server (dùng `search_tsv` đã có sẵn).

## 3. Xác nhận từ người dùng

- **Đồng ý ở mục 3 hết làm theo hướng an toàn trước**: Tôi sẽ bắt đầu ngay với việc xử lý an toàn xuất báo cáo (N1) và hạ tầng Preset an toàn (N2).
- **Preset mặc định**: Sẽ là "Cơ bản" (6 cột) cho người dùng mới.
- **Token trạng thái**: Sẽ khóa theo `ma_trang_thai` để đảm bảo bền vững.

---

_Tôi sẽ bắt đầu triển khai Bước 1 ngay bây giờ._
