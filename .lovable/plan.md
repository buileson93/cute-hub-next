# Kế hoạch cải thiện UI/UX Quản lý bản quyền phần mềm

Người dùng yêu cầu giải quyết vấn đề: bản quyền chưa biết gắn với thiết bị nào, muốn thiết kế giao diện để biết máy tính nào đang cài phần mềm nào và các bản quyền chi tiết trong máy đó. Đồng thời đồng bộ UX nhập liệu.

## 1. Cải thiện mô hình dữ liệu (Concept)
- Hiện tại: `phan_mem_ban_quyen_cap_phat` đã liên kết `ban_quyen_id` với `thiet_bi_id`.
- Yêu cầu mới: Cần một góc nhìn "Tài sản làm trung tâm" (Asset-centric view) bên cạnh góc nhìn "Bản quyền làm trung tâm" hiện tại.

## 2. Nâng cấp giao diện Danh sách Bản quyền (`/_app/phan-mem-ban-quyen`)
- **Visual Analytics**: Bổ sung card thống kê "Tài sản đã cài đặt" (số lượng máy tính có ít nhất 1 bản quyền).
- **StandardTable**: Thêm cột "Danh sách máy cài" hiển thị chip các mã thiết bị (cắt ngắn nếu quá nhiều) để biết nhanh bản quyền này đang ở đâu.

## 3. Nâng cấp trang Chi tiết Tài sản (`/_app/thiet-bi/$maThietBi`)
- Bổ sung tab mới: **"Phần mềm & Bản quyền"**.
- Nội dung tab:
  - Danh sách toàn bộ bản quyền đang được cấp phát cho máy tính này.
  - Hiển thị: Tên phần mềm, License Key, Ngày cài đặt, Thời hạn (nếu có).
  - Nút "Cấp phát nhanh": Mở dialog chọn bản quyền để gán cho máy này ngay tại đây.

## 4. Cải thiện UX Cấp phát (`BanQuyenCapPhatDialog.tsx`)
- Thêm tìm kiếm thông minh cho tài sản (đã có Combobox nhưng cần tối ưu hiển thị: loại thiết bị, trạng thái).
- Hiển thị cảnh báo nếu máy tính đã cài một phiên bản khác của cùng phần mềm.

## 5. Đồng bộ UX Nhập liệu (`BanQuyenFormDialog.tsx`)
- Sắp xếp lại các trường thông tin theo nhóm logic: "Thông tin chung", "Chi tiết License", "Hợp đồng & Chi phí".
- Thêm tính năng "Nhân bản" (Duplicate) để tạo nhanh nhiều bản quyền tương tự (ví dụ mua nhiều lô khác nhau).

## Các bước thực hiện:
1. Sửa `src/routes/_app.phan-mem-ban-quyen.tsx`: Thêm cột thiết bị vào bảng.
2. Sửa `src/routes/_app.thiet-bi.$maThietBi.tsx`: Thêm tab Phần mềm.
3. Sửa `src/components/mirats/BanQuyenCapPhatDialog.tsx`: Cải thiện UI/UX danh sách cấp phát.
4. Sửa `src/lib/mirats/ban-quyen.ts`: Thêm hook `useThietBiBanQuyenList(thietBiId)` để lấy danh sách phần mềm của một máy.
5. Cố định lỗi Hydration trong `AtcTowerScene.tsx` (fix âm thầm theo yêu cầu hệ thống).
