# KẾ HOẠCH TRIỂN KHAI TIẾP THEO — MIRATS 2.0 (Giai đoạn 0, 1, 3, 4)

Dựa trên kế hoạch cải thiện UI/UX đã được xác minh tại Giai đoạn -1 và Giai đoạn 2 đã hoàn thành một phần, chúng ta sẽ tiến hành các bước tiếp theo để tối ưu hóa luồng quản lý tài sản.

## 1. Giai đoạn 0: Đo lường & Phân tích (Hoàn thiện)
Chúng ta cần các con số thực tế để quyết định các cột cho Preset "Cơ bản" và dải KPI.
- [ ] Triển khai hàm server để tính toán tỷ lệ điền dữ liệu của các cột trong bảng `thiet_bi`.
- [ ] Phân tích tỷ lệ này để chọn ra 6-8 cột quan trọng nhất cho Khung nhìn Cơ bản.

## 2. Giai đoạn 1: Hệ thống khung nhìn (View Preset)
Giải quyết vấn đề "ngợp" thông tin tại bảng danh mục tài sản.
- [ ] Cập nhật `src/lib/mirats/ui/view-presets.ts` với các cột thực tế sau khi phân tích ở Giai đoạn 0.
- [ ] Tích hợp bộ chọn Preset vào `StandardTable` (Segmented Control).
- [ ] Mở rộng `useColumnPrefs` để lưu trữ `presetDangDung`.
- [ ] **Lưu ý quan trọng (N1, N2):** Đảm bảo việc xuất CSV vẫn cho phép chọn "Xuất toàn bộ cột" để tránh mất dữ liệu nghiệp vụ.

## 3. Giai đoạn 3: Bộc lộ dần ở tầng trường dữ liệu
Tối ưu hóa tab "Nâng cao > Toàn bộ trường" (ThietBiAllFields).
- [ ] Thêm công tắc "Chế độ kỹ thuật" (mặc định Tắt).
- [ ] Ẩn các trường UUID/ID hệ thống khi ở chế độ thường.
- [ ] Ẩn các trường không có dữ liệu (trống) mặc định.
- [ ] Nhóm các trường theo chủ đề nghiệp vụ (Định danh, Kỹ thuật, Vòng đời...).

## 4. Giai đoạn 4: Lớp tóm tắt & Trực quan hóa
- [ ] **Bước 4.1:** Triển khai dải KPI bấm-để-lọc ở đầu trang danh mục (Đang khai thác, Dự phòng, Sửa chữa...).
- [ ] **Bước 4.2:** Hoàn thiện Token trạng thái (đã bắt đầu ở `status-tokens.ts`) bằng cách ánh xạ chính xác mã trạng thái từ DB thay vì chỉ dùng tên tiếng Việt.
- [ ] **Bước 4.3:** Thêm thanh tiến độ Tuổi thọ (Life bar) và Chấm sức khỏe (Health icons) vào các hàng trong bảng.

## 5. Các bước kỹ thuật đi kèm (Verify)
- [ ] Chạy lại `scripts/export-schema.sh` để đảm bảo `dump/schema.sql` khớp với DB hiện tại.
- [ ] Kiểm tra lỗi SSR nếu có khi chuyển đổi các tab chi tiết đã refactor.

---
**Giai đoạn thực hiện tiếp theo:** Tôi sẽ bắt đầu với **Giai đoạn 0 (Phân tích tỷ lệ điền)** và **Giai đoạn 1 (View Presets)** vì đây là nền tảng để giải quyết vấn đề hiển thị quá nhiều cột.
