# Kế hoạch phục hồi đầy đủ tính năng trang Chi tiết tài sản & Sổ lý lịch (GĐ3-R2)

Dự án MIRATS đang gặp tình trạng "hụt tính năng" nghiêm trọng ở trang Chi tiết tài sản (giảm từ 16 tab xuống 5 tab) và mất các điểm vào của Sổ lý lịch hệ thống. Kế hoạch này tập trung phục hồi 100% trải nghiệm nghiệp vụ cũ trên kiến trúc module mới.

## 1. Phục hồi 16 Tab trang Chi tiết tài sản

Sẽ cấu trúc lại `src/routes/_app.thiet-bi.$maThietBi.tsx` để hiển thị đầy đủ các tab nghiệp vụ. Các tab mới được tách tệp sẽ được giữ lại, nhưng bổ sung các tab còn thiếu.

| Tab cũ               | Nội dung / Component thay thế    | Trạng thái hiện tại     | Hành động                                |
| :------------------- | :------------------------------- | :---------------------- | :--------------------------------------- |
| **Tổng quan**        | `TabTongQuan.tsx`                | Đang hoạt động          | Giữ nguyên                               |
| **Dòng thời gian**   | `TabVanHanh.tsx` (Tab Timeline)  | Đang hoạt động          | Đổi nhãn "Timeline" -> "Dòng thời gian"  |
| **Lý lịch**          | `LyLichThietBiPanel.tsx`         | Bị chôn trong Tổng quan | Đưa ra thành Tab riêng (toàn chiều rộng) |
| **Linh kiện**        | `TabCauHinh.tsx` (Tab Linh kiện) | Đang hoạt động          | Giữ nguyên                               |
| **Đo đạc**           | `TelemetryPanel` (mới)           | **Mất (truyền null)**   | Dựng lại dựa trên `thiet_bi_do_dac`      |
| **Vòng đời**         | `LifecyclePanel` (mới)           | **Mất (truyền null)**   | Dựng lại dựa trên `thiet_bi_vong_doi`    |
| **KĐ/HC**            | `ChungChiPanel.tsx`              | Đã có component         | Thêm tab "Kiểm định / Hiệu chuẩn"        |
| **Giấy phép**        | `TabHoSoPhapLy.tsx`              | Đang hoạt động          | Giữ nguyên                               |
| **Bảo dưỡng**        | `TabVanHanh.tsx` (Tab Bảo dưỡng) | Đang hoạt động          | Giữ nguyên                               |
| **Sự cố**            | `TabVanHanh.tsx` (Tab Sự cố)     | Đang hoạt động          | Giữ nguyên                               |
| **Thay thế**         | `TabVanHanh.tsx` (Tab Thay thế)  | Đang hoạt động          | Giữ nguyên                               |
| **Bàn giao**         | `TabVanHanh.tsx` (Tab Bàn giao)  | Đang hoạt động          | Giữ nguyên                               |
| **Cấp phát**         | `AllocationPanel` (mới)          | **Mất (truyền null)**   | Dựng lại dựa trên `thiet_bi_cap_phat`    |
| **Phần mềm**         | `ThietBiBanQuyen.tsx`            | Đang hoạt động          | Giữ nguyên                               |
| **Tệp đính kèm**     | `ThietBiTepDinhKem.tsx`          | Đã có component         | Thêm tab "Tệp đính kèm"                  |
| **Toàn bộ trường**   | `TabNangCao.tsx` (Tab Fields)    | Đang hoạt động          | Giữ nguyên                               |
| **Lịch sử thay đổi** | `TabNangCao.tsx` (Tab Changelog) | Đang hoạt động          | Giữ nguyên                               |

## 2. Dựng lại 3 Panel bị mất (Telemetry, Allocation, Lifecycle)

Ba panel này sẽ được tạo mới tại `src/components/mirats/thiet-bi-detail/` để thay thế cho code đã bị xoá.

- **TelemetryPanel**: Sử dụng hook `useTelemetry` (đã có trong `db-smart.ts`).
  - Bảng: `thiet_bi_do_dac`.
  - Cột: `thoi_diem`, `chi_so`, `gia_tri`, `don_vi_do`, `ghi_chu`.
  - UI: Biểu đồ đường (Sparkline) + Bảng lịch sử đo đạc.
- **AllocationPanel**: Sử dụng hook `useAllocationHistory` (đã có trong `db-smart.ts`).
  - Bảng: `thiet_bi_cap_phat`.
  - Cột: `thoi_diem`, `hanh_dong` (cấp phát/thu hồi), `nguoi_giu`, `don_vi_giu_id`, `ghi_chu`.
  - UI: Timeline lịch sử luân chuyển tài sản giữa các cá nhân/đơn vị.
- **LifecyclePanel**: Sử dụng hook `useLifecycle` (đã có trong `db-smart.ts`).
  - Bảng: `thiet_bi_vong_doi`.
  - Cột: `thoi_diem`, `ly_do`, `tu_trang_thai_id`, `den_trang_thai_id`.
  - UI: Timeline thô các bước chuyển trạng thái kỹ thuật (Sẵn sàng -> Đang khai thác -> Hỏng...).

## 3. Khôi phục Sổ lý lịch Hệ thống

| Cấp sổ         | Hook dữ liệu (đã có) | Component (đã có)        | Điểm mở hiện tại           | Điểm mở đề xuất                                                                |
| :------------- | :------------------- | :----------------------- | :------------------------- | :----------------------------------------------------------------------------- |
| **Hệ thống**   | `useLyLichHeThong`   | `LyLichHeThongPanel`     | Không có                   | 1. Tab "Lý lịch" trong `_app.he-thong.$id.tsx`. 2. Dialog chi tiết thành phần. |
| **Thành phần** | `useLyLichThanhPhan` | `LyLichThanhPhanPanel`   | Dialog chi tiết thành phần | Giữ nguyên                                                                     |
| **Vị trí**     | `useLyLichViTri`     | `Timeline` (trong Layer) | Không có                   | Tích hợp vào TreeView hoặc Map vị trí                                          |
| **Tài sản**    | `useLyLichThietBi`   | `LyLichThietBiPanel`     | Tab Tổng quan (nhỏ)        | Tab "Lý lịch" riêng (chiều rộng đầy đủ)                                        |

## 4. Danh sách prop truyền null/rỗng cần sửa

- `_app.thiet-bi.$maThietBi.tsx`:
  - Dòng 242: `TelemetryPanel={null}` -> Truyền component thật.
  - Dòng 242: `AllocationPanel={null}` -> Truyền component thật.
  - Dòng 242: `donViTenMap={{}}` -> Truyền `Map` từ `taxo.donViList`.
  - Dòng 248: `LifecyclePanel={null}` -> Truyền component thật.
- `TabCauHinh.tsx` & `TabNangCao.tsx`: Xoá bỏ các câu thông báo "chưa sẵn sàng".

## Chi tiết kỹ thuật & Kiểm thử

### Kỹ thuật

- Sử dụng `donViTenMap` từ `useDbTaxonomy` để hiển thị tên đơn vị trong `AllocationPanel`.
- Đổi nhãn "Timeline" thành "Dòng thời gian" trong `TabVanHanh.tsx`.
- Chuyển `LyLichThietBiPanel` từ `TabTongQuan.tsx` sang một `TabsContent` riêng trong route chính.

### Kiểm thử (Structural Integrity)

- Bổ sung test case vào `src/lib/mirats/__tests__/structural-integrity.test.ts`:
  - `checkSolyLichOpenable`: Kiểm tra xem component `LyLichHeThongPanel` có ít nhất một đường import/render từ UI chính.
  - `checkDeviceDetailTabs`: Kiểm tra sự tồn tại của đủ 16 tab (hoặc các tab nghiệp vụ trọng yếu) trong route chi tiết tài sản.
  - `checkNullProps`: Quét mã nguồn tìm các pattern `<Component ... prop={null} />` ở các vị trí nhạy cảm.
