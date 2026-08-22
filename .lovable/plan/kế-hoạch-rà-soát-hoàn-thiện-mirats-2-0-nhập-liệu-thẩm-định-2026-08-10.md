# Kế hoạch Rà soát & Hoàn thiện MIRATS 2.0 (Nhập liệu & Thẩm định)

Người dùng yêu cầu rà soát lại toàn bộ kế hoạch nâng cấp UX nhập liệu (theo tài liệu đính kèm) và kiểm tra các tính năng đã thực hiện để đưa ra kế hoạch hoàn thiện.

## 1. Hiện trạng thực tế vs. Kế hoạch (Tài liệu đính kèm)

Dựa trên rà soát codebase, hệ thống đã có khung (framework) nhưng thiếu các "đầu nối" nghiệp vụ cụ thể:

| Giai đoạn | Nội dung                     | Trạng thái hiện tại                                             | Đánh giá                                                                             |
| --------- | ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Z**     | Đóng các nghi ngờ (N16-N28)  | Đã xác minh N16, N17, N18                                       | **Cần hành động**. RPC `cap_nhat_field` chưa tồn tại trong dump.                     |
| **A**     | Form Wizard 3 bước           | `SchemaDialog.tsx` & `FormWizardSteps.tsx` đã có                | **Hoàn thành 90%**. Cần thêm `CompletenessRing` và gán `wizardStep` cho ThietBiForm. |
| **B**     | Việc nhỏ / Góp gạch          | Chưa có route `/gop-gach`                                       | **Chưa làm**. Cần tạo màn hình tập trung cho việc "Góp gạch".                        |
| **C**     | Đề xuất sửa (Change Request) | `saveCellSecurely.ts` đã có; `change-request.ts` thiếu loại mới | **Hoàn thành 60%**. Cần thêm loại `thiet_bi.propose_field` vào enum và dispatcher.   |
| **D**     | Mobile / Offline             | `indexeddb-storage.ts` đã có                                    | **Hoàn thành 50%**. Cần tích hợp sâu vào màn hình mobile `/q/:ma`.                   |
| **E**     | Thẩm định (Duyệt)            | `_app.cho-duyet.tsx` đã có                                      | **Hoàn thành 60%**. Cần giao diện "Thẩm định nhanh" (quẹt thẻ).                      |
| **F**     | Động lực (Gamification)      | Chưa có bảng dữ liệu                                            | **Chưa làm**.                                                                        |

## 2. Kế hoạch triển khai chi tiết các việc cụ thể tiếp theo

### Nhóm 1: Hạ tầng & Backend (Ưu tiên 1)

1. **Migration SQL**:
   - Thêm giá trị `thiet_bi.propose_field`, `he_thong.propose_field` vào enum `change_request_loai`.
   - Tạo bảng `nhiem_vu_nhap_lieu` (id, loai, entity, target_id, nguoi_nhan, trang_thai).
   - Tạo bảng `dong_gop_diem` (user_id, change_request_id, diem, loai_dong_gop).
   - Viết RPC `approve_change_request` mở rộng để xử lý dispatcher `apply_propose_field` (UPDATE động theo payload).
2. **Logic Server**:
   - Cập nhật `src/lib/mirats/change-request.ts` để nhận diện các loại CR mới và hỗ trợ `summarizePayload` hiển thị ảnh bằng chứng.

### Nhóm 2: UI & UX Nâng cao (Ưu tiên 2)

3. **Component `CompletenessRing`**:
   - Tạo `src/components/mirats/CompletenessRing.tsx` (dùng SVG circle/Progress).
   - Tạo `src/lib/mirats/completeness.ts` định nghĩa "bộ trường cốt lõi" cho từng loại tài sản/hệ thống.
4. **Cải tiến `ThietBiFormDialog`**:
   - Gán `wizardStep: 1, 2, 3` cho các fields (Nhận dạng, Vị trí, Bổ sung).
   - Tích hợp `CompletenessRing` vào header của dialog.
   - Thêm logic "Lưu nháp" vào `user_layout_prefs` thông qua `useUserPref`.

### Nhóm 3: Tính năng mới "Góp gạch" & Mobile (Ưu tiên 3)

5. **Màn hình `/gop-gach`**:
   - Tạo `src/routes/_app.gop-gach.tsx` thiết kế mobile-first.
   - Logic lấy 1 nhiệm vụ từ `nhiem_vu_nhap_lieu` và hiển thị dạng Card.
6. **Nâng cấp `/q/:maThietBi`**:
   - Thêm section "Góp dữ liệu" ngay dưới thông tin thiết bị.
   - Tích hợp `PhotoUpload` để chụp bằng chứng đi kèm đề xuất sửa.

### Nhóm 4: Thẩm định & Động lực (Ưu tiên 4)

7. **Quick Review UI**:
   - Cập nhật `src/routes/_app.cho-duyet.tsx` thêm chế độ "Thẩm định nhanh" (Card quẹt trái/phải).
8. **Gamification**:
   - Tích hợp điểm thưởng vào `DailyBrief.tsx`.
   - Gửi `notifications` khi đề xuất được duyệt kèm lời khen của cấp trên.

## 3. Các đầu việc cụ thể sẽ triển khai ngay

1.  **Hành động 1**: Viết migration SQL cho các bảng và enum mới.
2.  **Hành động 2**: Tạo component `CompletenessRing` và logic tính % hoàn thiện.
3.  **Hành động 3**: Cập nhật `change-request.ts` và `save-cell-securely.ts` để hỗ trợ đề xuất sửa trường thường kèm ảnh.
4.  **Hành động 4**: Xây dựng route `/gop-gach` và nâng cấp trang QR `/q/:ma`.

---

_Ghi chú: Sẽ rà soát kỹ N16 (RPC `cap_nhat_field`) để đảm bảo code UI gọi đúng tên hàm backend._
