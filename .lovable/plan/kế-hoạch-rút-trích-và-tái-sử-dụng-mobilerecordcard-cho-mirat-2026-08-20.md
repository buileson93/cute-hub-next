# Kế hoạch: Rút trích và Tái sử dụng MobileRecordCard cho MIRATS StandardTable

Tách phần hiển thị chế độ thẻ (Card) dành cho Mobile từ `StandardTable.tsx` thành một component dùng chung, sau đó áp dụng cho các bảng lớn đang thiếu tính năng này.

## Giai đoạn 1: Khảo sát và Phân hạng (Đang thực hiện)

### 1. Phân tích cấu trúc 3 tầng của Mobile Record Card

Dựa trên mã nguồn `StandardTable.tsx` (dòng 1151-1250), cấu trúc thẻ gồm 3 tầng chính:

- **Tầng 1 (Tiêu đề - Primary):** Hiển thị các cột có `priority === "primary"`. Dòng đầu tiên in đậm, các dòng sau màu nhạt hơn. Có kèm Checkbox nếu bảng hỗ trợ chọn nhiều.
- **Tầng 2 (Nội dung - Secondary):** Hiển thị các cột có `priority === "secondary"`. Chia thành lưới 2 cột, mỗi ô có nhãn (header) nhỏ phía trên và giá trị phía dưới.
- **Tầng 3 (Chi tiết - Detail):** Hiển thị các cột có `priority === "detail"`. Vùng này bị ẩn mặc định và chỉ hiện ra khi người dùng nhấn "Xem thêm". Hiển thị danh sách 1 cột dọc.

### 2. Đề xuất phân hạng cột cho các bảng lớn

#### A. CatalogTable.tsx (Bảng danh mục)

- **Primary:** Tên (ten) - _Lý do: Thông tin nhận diện chính._
- **Secondary:** Mã (ma), Tài sản (soThietBi), Trạng thái (active) - _Lý do: Thông tin quan trọng cần xem nhanh._
- **Detail:** Mô tả (mo_ta), Logo, Xuất xứ (xuat_xu), Ghi chú (ghi_chu) - _Lý do: Thông tin bổ trợ, dài dòng._

#### B. ThanhPhanTable.tsx (Bảng thành phần/tài sản)

- **Primary:** Tên tài sản/thành phần (ten), Mã (ma) - _Lý do: Key chính để tìm kiếm._
- **Secondary:** Trạng thái (trangThai), Vị trí (viTri), Serial - _Lý do: Dữ liệu vận hành hay dùng._
- **Detail:** P/N, Hạn bảo hành, Nhà sản xuất, Danh sách hệ thống/thành phần đang lắp - _Lý do: Dữ liệu kỹ thuật chi tiết, chiếm nhiều diện tích._

#### C. NetworkOverview.tsx (Dữ liệu liên kết mạng)

- **Primary:** Tên hệ thống/thành phần nguồn-đích - _Lý do: Xác định liên kết._
- **Secondary:** Loại liên kết (loai_ten), Giao thức (giao_thuc), Trạng thái (trang_thai).
- **Detail:** Ghi chú, Giao diện nguồn/đích, Trọng số - _Lý do: Thông tin phụ trợ._

### 3. Cột cần xác minh nghiệp vụ

- **CatalogTable:** Cột `Logo` có nên để ở Primary để dễ nhận diện thị giác không?
- **ThanhPhanTable:** Cột `Tình trạng kỹ thuật` nên để Secondary hay Detail?

### 4. Đánh giá hiệu quả rút trích

Việc tách `MobileRecordCard.tsx` sẽ giúp:

- Giảm khoảng **80-100 dòng code** trực tiếp trong `StandardTable.tsx`.
- Quan trọng hơn là đảm bảo tính nhất quán UI/UX mobile cho toàn bộ các bảng trong hệ thống mà không cần viết lại logic render phức tạp.

## Giai đoạn 2: Triển khai (Chờ phê duyệt Giai đoạn 1)

1. Tạo `src/components/mirats/ui/MobileRecordCard.tsx`.
2. Cập nhật `StandardTable.tsx` để sử dụng component mới.
3. Áp dụng cho lần lượt: `CatalogTable.tsx`, `ThanhPhanTable.tsx`, `NetworkOverview.tsx`.
4. Đảm bảo không thay đổi prop, queryKey hay hành vi Desktop.
