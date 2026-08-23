# Kế hoạch khắc phục lỗi số liệu và hiển thị bảng (Phase 11A)

Tôi đã xác định được nguyên nhân khiến số liệu bị giảm sút (108 thành phần, 339 tài sản) và các lỗi hiển thị cột/bố cục. Lỗi này xuất phát từ việc áp dụng Views mới nhưng chưa tối ưu RLS và logic Keyset Pagination bị giới hạn bởi `count: "planned"` trên các Views phức tạp.

## 1. Khắc phục số liệu (Data Recovery)
- **Vấn đề**: Số lượng bản ghi hiển thị (108/339) thấp hơn thực tế (1000+) do RLS trên Views không kế thừa hoàn toàn quyền từ bảng gốc và logic đếm `planned` của PostgREST không chính xác với Views có Join phức tạp.
- **Giải pháp**: 
    - Chuyển từ `count: "planned"` sang `count: "exact"` trong `fetchKeyset` để lấy con số chính xác.
    - Cập nhật định nghĩa View `v_thanh_phan_toan_cuc` và `v_tai_san_toan_cuc` để đảm bảo `security_invoker = true` hoặc thêm các GRANT cần thiết.
    - Kiểm tra lại các điều kiện lọc mặc định trong View có vô tình loại bỏ các bản ghi không có thông tin hệ thống hay không.

## 2. Khắc phục hiển thị cột (UI/UX Alignment)
- **Vấn đề**: Cột "Tên thành phần" chiếm hết diện tích, các cột thông tin khác bị mất hoặc không hiển thị.
- **Giải pháp**:
    - **ThanhPhanTable.tsx**: Cố định `minW` và `maxW` cho cột tên (ví dụ: `max-w-[300px]`).
    - Khôi phục các cột thông tin quan trọng bị ẩn (Mã, Hệ thống, Vị trí, Tài sản lắp).
    - Đảm bảo `StandardTable` kích hoạt cuộn ngang (`overflow-x-auto`) thay vì ép các cột co lại.

## 3. Tối ưu Load Database
- **Vấn đề**: Treo/lag khi tải dữ liệu số lượng lớn.
- **Giải pháp**:
    - Sử dụng Keyset Pagination với `sortField: "id"` (hoặc một field có index) để đảm bảo tốc độ truy vấn không phụ thuộc vào độ sâu của trang.
    - Debounce tìm kiếm ở mức 500ms thay vì 300ms để giảm tải CPU/Network khi gõ phím.

## 4. Kiểm tra và Nghiệm thu
- Sử dụng Playwright để kiểm tra con số tổng (Total Count) trả về từ API.
- Kiểm tra tính toàn vẹn của dữ liệu giữa Tab "Theo thành phần" và "Theo tài sản".

---
**Tôi sẽ bắt đầu triển khai ngay khi bạn phê duyệt kế hoạch này.**
