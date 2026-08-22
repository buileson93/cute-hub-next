# Phục hồi tính năng nghiệp vụ cho các Form Khai thác (SuCo, BaoTri, HongHoc)

Kế hoạch này nhằm merge trải nghiệm Wizard/AssetPicker mới với toàn bộ logic nghiệp vụ, validation và payload từ phiên bản "chaytot" (bản đầy đủ tính năng). Chúng ta sẽ không thay thế các component UI mới mà sẽ mở rộng chúng để chứa đủ các trường dữ liệu và luồng xử lý bị thiếu.

## Phân tích Parity (Đối chiếu tính năng)

### 1. Sự cố mới (SuCoMoiForm)

- **Wizard Step 1 (Thông tin chung)**:
  - Nút Phân tích AI/Rule (Wand2/Bot/Sparkles) để tự động điền form từ văn bản thô.
  - Nút Nhập liệu bằng giọng nói (Mic/popVoiceDraft).
  - Kinh gửi, Tóm tắt diễn biến.
- **Wizard Step 2 (Tài sản & Thành phần)**:
  - Hiển thị cảnh báo Anomaly (detectSuCoAnomalies) khi chọn tài sản.
  - Phân tích kíp trực tự động (usePrefillKipTruc).
- **Wizard Step 3 (Đánh giá & Xử lý)**:
  - Chọn phân loại A-E (Phân loại sự cố kỹ thuật).
  - Ảnh hưởng ĐHB (Điều hành bay).
  - Tình hình hiện tại, Kết quả khắc phục.
  - Nguyên nhân, Biện pháp xử lý (prefill từ usePrefillBienPhap).
  - Thời gian bắt đầu / Kết thúc (định dạng chuẩn).
- **Chức năng bổ sung**:
  - Preview báo cáo (PreviewKhaiDialog).
  - Xuất Word (exportBaoCaoBanDauToWord).
  - Lưu và Đóng sự cố (ClosingIntent).

### 2. Bảo trì mới (BaoTriMoiForm)

- **Wizard Step 1 (Hệ thống & Mẫu)**:
  - Chọn Hệ thống -> Lọc Template tương ứng.
- **Wizard Step 2 (Danh sách tài sản)**:
  - Chọn nhiều tài sản cùng lúc (Bulk assets).
- **Wizard Step 3 (Nội dung & Checklist)**:
  - Metadata động từ Template.
  - Checklist động (ChecklistRenderer).
  - Người thực hiện, Đơn vị thực hiện.
  - Kết luận bảo trì.
- **Chức năng bổ sung**:
  - Preview phiếu bảo trì.
  - Ghi sổ lý lịch cho từng tài sản trong danh sách bulk.

### 3. Hỏng hóc mới (HongHocMoiForm)

- **Wizard Step 1 (Bối cảnh)**:
  - Link tới Sự cố nguồn.
  - Vị trí / Thành phần hệ thống.
- **Wizard Step 2 (Tài sản)**:
  - Tài sản hỏng.
  - Tài sản thay thế bắt buộc (nếu phương án là thay thế).
  - Bộ phận hỏng (cấp linh kiện).
- **Wizard Step 3 (Phương án & Mô tả)**:
  - Phương án (Sửa chữa/Thay thế/Thanh lý).
  - Mô tả chi tiết hỏng hóc.
  - Quyền hạn (RBAC) và Scope.

## Payload & Validation Matrix

| Form         | Validation chính                                               | Payload đích (RPC)                     |
| :----------- | :------------------------------------------------------------- | :------------------------------------- |
| **Sự cố**    | HienTuong, ThietBi, TP, Ngay, (Neu dong: NguyenNhan, BienPhap) | `ghi_su_co_atomic` (jsonb payload)     |
| **Bảo trì**  | Template, Assets (>0), Checklist validation                    | `ghi_bao_duong_atomic` (jsonb payload) |
| **Hỏng hóc** | ThietBiHong, (Neu thay: ThietBiThayThe), NgayHong              | `ghi_hong_hoc_atomic` (jsonb payload)  |

## Kế hoạch thực hiện

### Bước 1: Phục hồi SuCoMoiForm (1 commit)

- Bố trí lại các field vào 3 Step của Wizard.
- Khôi phục logic AI Parser và Rule Parser.
- Thêm giao diện quản lý Kíp trực và Phân loại A-E.
- Tích hợp Preview và Export Word.
- Xử lý workflow "Lưu và Đóng" (Closing).

### Bước 2: Phục hồi BaoTriMoiForm (1 commit)

- Mở rộng bước 3 để chứa đầy đủ metadata và checklist.
- Đảm bảo logic Bulk Save hoạt động đúng với `ghiBaoDuongFull`.
- Thêm Kết luận và Người thực hiện.

### Bước 3: Phục hồi HongHocMoiForm (1 commit)

- Thêm field Tài sản thay thế và Bộ phận hỏng.
- Chuẩn hoá payload gửi về RPC `ghi_hong_hoc_atomic`.
- Tích hợp Preview.

### Bước 4: Kiểm thử và Hoàn thiện

- Chạy Fixture test cho các case: Tạo mới, Đóng sự cố, Export Word thất bại.
- Đảm bảo Invariant: `ma_nhom_bc` và `ma_base` được sinh đúng format.
