# Kế hoạch Phục hồi Luồng Nghiệp vụ MIRATS 2.0 (Operations Forms)

Hệ thống ghi nhận sự cố, bảo trì và hỏng hóc bị rút gọn quá mức dẫn đến mất dữ liệu nghiệp vụ quan trọng. Kế hoạch này phục hồi đầy đủ các trường dữ liệu bắt buộc và tái cấu trúc form theo từng bước (Wizard) để đảm bảo trải nghiệm người dùng không bị quá tải.

## Phân loại trường dữ liệu

### 1. SuCoMoiForm.tsx (Sự cố)

| Nhãn trường         | Cột CSDL                                            | Bắt buộc     | Nhóm | Nơi đặt sau phục hồi                                |
| :------------------ | :-------------------------------------------------- | :----------- | :--- | :-------------------------------------------------- |
| Kính gửi            | `bao_cao_ban_dau->kinh_gui`                         | Không        | 1    | Bước 1: Thông tin chung (Collapsible)               |
| Ngày phát hiện      | `ngay_phat_hien`                                    | Có           | 1    | Bước 1: Thông tin chung                             |
| Phân loại (A-E)     | `bao_cao_ban_dau->phan_loai` / `muc_do`             | Có           | 1    | Bước 1: Thông tin chung                             |
| Thời gian bắt đầu   | `at_bao_cao` / `bao_cao_ban_dau->thoi_gian_bat_dau` | Có           | 1    | Bước 3: Diễn biến & Đánh giá                        |
| Thời gian kết thúc  | `thoi_diem_khac_phuc` / `at_hoan_thanh`             | Cần khi đóng | 1    | Bước 3: Diễn biến & Đánh giá                        |
| Ảnh hưởng ĐHB       | `anh_huong_dhb`                                     | Có           | 1    | Bước 3: Diễn biến & Đánh giá                        |
| Vấn đề (RCA)        | `van_de_id`                                         | Không        | 1    | Bước 3: Diễn biến & Đánh giá                        |
| Tình hình hiện tại  | `bao_cao_ban_dau->tinh_hinh_hien_tai`               | Khi đóng     | 2    | Bước 3: Diễn biến & Đánh giá (Hiện khi "Đóng ngay") |
| Nguyên nhân         | `nguyen_nhan`                                       | Khi đóng     | 1    | Bước 3: Diễn biến & Đánh giá                        |
| Phương án khắc phục | `bien_phap_xu_ly`                                   | Khi đóng     | 1    | Bước 3: Diễn biến & Đánh giá                        |

**Cột bị bỏ trống hiện tại:** `van_de_id`, `nguyen_nhan` (nếu không dùng AI), `bien_phap_xu_ly`.

### 2. BaoTriMoiForm.tsx (Bảo trì)

| Nhãn trường           | Cột CSDL                | Bắt buộc | Nhóm | Nơi đặt sau phục hồi   |
| :-------------------- | :---------------------- | :------- | :--- | :--------------------- |
| Loại bảo dưỡng        | `loai_bao_tri`          | Có       | 1    | Bước 1: Hệ thống & Mẫu |
| Đơn vị thực hiện      | `don_vi_thuc_hien`      | Có       | 1    | Bước 1: Hệ thống & Mẫu |
| Trường động (Dynamic) | `form_submission->data` | Theo mẫu | 1    | Bước 3: Nội dung phiếu |
| Kết quả / kết luận    | `ket_qua`               | Không    | 1    | Bước 3: Nội dung phiếu |

**Cột bị bỏ trống hiện tại:** `loai_bao_tri` (đang hardcode), `don_vi_thuc_hien`.

### 3. HongHocMoiForm.tsx (Hỏng hóc)

| Nhãn trường      | Cột CSDL               | Bắt buộc     | Nhóm | Nơi đặt sau phục hồi        |
| :--------------- | :--------------------- | :----------- | :--- | :-------------------------- |
| Bộ phận hỏng     | `bo_phan_hong`         | Có           | 1    | Bước 2: Tài sản & Phương án |
| Tài sản thay thế | `thiet_bi_thay_the_id` | Khi thay thế | 1    | Bước 2: Tài sản & Phương án |

**Cột bị bỏ trống hiện tại:** `bo_phan_hong`, `thiet_bi_thay_the_id`.

---

## Cấu trúc Form sau phục hồi

Tái sử dụng `FormWizardSteps.tsx` và `CollapsibleSection.tsx` để quản lý độ dài.

### SuCoMoiForm

1.  **Bước 1: Khai báo nhanh & AI**
    - Hệ thống, Sự cố/Hiện tượng (Tích hợp AI/Voice).
    - Phân loại A-E (Bắt buộc).
    - Kính gửi (Collapsible).
2.  **Bước 2: Tài sản & Thành phần**
    - Sử dụng `AssetPicker` và `Checkbox` chọn thành phần.
3.  **Bước 3: Diễn biến & Xử lý**
    - Thời gian (Bắt đầu/Kết thúc).
    - Ảnh hưởng ĐHB.
    - Vấn đề liên quan (RCA).
    - Khối **"Xử lý dứt điểm"** (Chỉ hiện khi tích "Đóng sự cố ngay"):
      - Tình hình hiện tại.
      - Nguyên nhân.
      - Biện pháp xử lý.

### BaoTriMoiForm

1.  **Bước 1: Thiết lập chung**
    - Hệ thống, Mẫu phiếu.
    - Loại bảo dưỡng (Định kỳ/Đột xuất).
    - Đơn vị thực hiện.
2.  **Bước 2: Danh sách tài sản**
    - Chọn nhiều tài sản cùng lúc.
3.  **Bước 3: Chi tiết nội dung**
    - Thời gian & Người thực hiện.
    - **Trường động:** Tự động render `ChecklistRenderer` hoặc `DynamicFieldsForm` tùy theo mẫu đã chọn.

---

## Chi tiết Kỹ thuật

1.  **Phân loại A-E:** Đây là thang bắt buộc theo quy định an toàn nghiệp vụ (không được đổi nhãn). Giá trị được map sang cột `muc_do` (A=Nghiêm trọng, B=Cao, C=Trung bình, D=Thấp, E=Thấp).
2.  **Trường động:**
    - Sử dụng `ChecklistRenderer` cho các mẫu dạng danh mục kiểm tra.
    - Sử dụng `DynamicFieldsForm` cho các mẫu có trường tùy chỉnh (`form_field`).
    - Không viết lại logic render.
3.  **Xác thực (Validation):**
    - Thêm logic kiểm tra: nếu `daDong === true`, bắt buộc nhập `nguyen_nhan`, `bien_phap_xu_ly`, `thoi_gian_ket_thuc`.

## Danh sách Kiểm thử (Anti-regression)

1.  **Sự cố:** Nhập mức độ "A", kiểm tra payload gửi lên RPC có `muc_do: "Nghiêm trọng"`.
2.  **Sự cố:** Tích "Đóng ngay", bỏ trống "Nguyên nhân", bấm Lưu -> Phải báo lỗi validation.
3.  **Bảo trì:** Chọn mẫu có 5 trường động, nhập liệu -> Kiểm tra `form_submission->data` có đủ 5 key-value.
4.  **Hỏng hóc:** Chọn phương án "Thay thế", chọn tài sản thay thế -> Kiểm tra cột `thiet_bi_thay_the_id` trong DB có ID tương ứng.
