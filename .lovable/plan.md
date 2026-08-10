# Kế hoạch Rà soát & Hoàn thiện MIRATS 2.0 (Nhập liệu & Thẩm định)

Người dùng yêu cầu rà soát lại toàn bộ kế hoạch nâng cấp UX nhập liệu (theo tài liệu đính kèm) và kiểm tra các tính năng đã thực hiện để đưa ra kế hoạch hoàn thiện.

## 1. Hiện trạng thực tế vs. Kế hoạch (Tài liệu đính kèm)

Dựa trên rà soát nhanh codebase, một số phần quan trọng của Giai đoạn A, B, C, D đã được triển khai "mồi":

| Giai đoạn | Nội dung | Trạng thái hiện tại | Đánh giá |
| --- | --- | --- | --- |
| **Z** | Đóng các nghi ngờ (N16-N28) | Đã thực hiện rà soát schema và logic | Tốt. Đã xác định được hướng đi cho Change Request. |
| **A** | Form Wizard 3 bước | `ThietBiFormDialog.tsx` đã có logic wizard | **Hoàn thành 80%**. Cần thêm Vòng tiến độ hoàn thiện (`CompletenessRing`). |
| **B** | Việc nhỏ / Góp gạch | Chưa có route `/gop-gach` | **Chưa làm**. Cần tạo màn hình tập trung cho việc "Góp gạch". |
| **C** | Đề xuất sửa (Change Request) | `saveCellSecurely.ts` đã có logic tạo CR cho KTV | **Hoàn thành 70%**. Cần dispatcher tự động áp dụng khi duyệt. |
| **D** | Mobile / Offline | `indexeddb-storage.ts` đã có | **Hoàn thành 50%**. Cần tích hợp sâu vào màn hình mobile `/q/:ma`. |
| **E** | Thẩm định (Duyệt) | `_app.cho-duyet.tsx` đã có | **Hoàn thành 60%**. Cần giao diện "Thẩm định nhanh" (quẹt thẻ). |
| **F** | Động lực (Gamification) | Chưa tìm thấy bảng `dong_gop_diem` | **Chưa làm**. |

## 2. Các lỗ hổng cần lấp đầy ngay (Kế hoạch hành động)

### Bước 1: Hoàn thiện Hạ tầng Ghi & Duyệt (Giai đoạn C & E cải tiến)
- **Tạo bảng `nhiem_vu_nhap_lieu`**: Để sinh ra các "việc nhỏ" dựa trên kết quả rà soát chất lượng dữ liệu.
- **Dispatcher `apply_propose_field`**: Cập nhật RPC `approve_change_request` hoặc tạo helper server-side để khi duyệt `thiet_bi.propose_field`, dữ liệu sẽ tự động được ghi vào bảng `thiet_bi`.

### Bước 2: Trải nghiệm "Góp gạch" (Giai đoạn B & D)
- **Route `/gop-gach`**: Tạo màn hình tối giản (Mobile-first). Mỗi lần hiện 1 thẻ tài sản thiếu thông tin + 1 câu hỏi duy nhất.
- **Tích hợp QR Code**: Cập nhật `/q/:maThietBi` để hiện ngay các trường còn thiếu (Completeness check) để người dùng "góp gạch" tại hiện trường.

### Bước 3: Thẩm định nhanh (Giai đoạn E)
- **Quick Review UI**: Cải thiện màn hình `/cho-duyet` với chế độ Card View (tương tự Tinder/quẹt thẻ) để lãnh đạo duyệt nhanh các đề xuất sửa trường thường.

### Bước 4: Gamification (Giai đoạn F)
- **Hệ thống điểm**: Triển khai bảng `dong_gop_diem` và tích hợp vào `DailyBrief` để khích lệ nhân viên.

## 3. Các đầu việc cụ thể sẽ triển khai tiếp theo

1.  **UI/UX**: Tạo component `CompletenessRing` và tích hợp vào Table/Detail.
2.  **Mobile**: Refactor `/q/:maThietBi` để biến nó thành "Trung tâm góp dữ liệu hiện trường".
3.  **Backend**: Thêm migration cho bảng `nhiem_vu_nhap_lieu` và `dong_gop_diem`.
4.  **Logic**: Hoàn thiện `saveCellSecurely` để hỗ trợ chụp ảnh bằng chứng (Evidence) đi kèm đề xuất.

---
*Ghi chú: Sẽ thực hiện kiểm tra `LanguageSelector` và thay thế text theo yêu cầu của người dùng trong quá trình triển khai.*
