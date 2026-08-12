# Kế hoạch MIRATS 2.0: Nâng cấp UX Nhập liệu & Thẩm định Dữ liệu

Kế hoạch này tập trung vào việc cải thiện trải nghiệm nhập liệu (nhập ít, nhập đúng, nhập nhanh) và quy trình thẩm định dữ liệu chuyên nghiệp, hỗ trợ tối đa cho nhân viên hiện trường (mobile) và cấp quản lý (web).

## 1. Hiện trạng & Xác minh nền tảng (Giai đoạn Z)

Dựa trên rà soát codebase, chúng ta đã xác nhận:
- **Change Request (CR)**: Đã có khung (12 loại), RPC `approve_change_request` đang chạy. Tuy nhiên, chưa hỗ trợ "đề xuất sửa trường thường".
- **Offline Queue**: Đã có logic `OfflineQueue` và `useOfflineStatus` (đang dùng `sessionStorage`). Chưa có `IndexedDBStorage` thật sự.
- **RLS thiet_bi**: Đang chặn `ktv` sửa trực tiếp (chỉ `admin` có quyền `ALL`). Đây là cơ sở tốt để ép mọi thay đổi của `ktv` qua đường "Đề xuất".
- **Staging**: Đã có hạ tầng `import_batch` rất mạnh mẽ nhưng đang bị khóa cứng cho `admin`.

## 2. Chi tiết Lộ trình triển khai

### Giai đoạn A: Chia nhỏ Form & Vòng hoàn thiện (UX "Cái gì quan trọng trước")
- **Refactor `SchemaDialog` & `ThietBiFormDialog`**:
    - Thêm thuộc tính `step` và `priority` vào các trường.
    - Chuyển Form thiết bị thành Wizard 3 bước: **Nhận dạng** (Serial/Model) -> **Vị trí** (Hệ thống) -> **Bổ sung** (NSX, Ghi chú).
    - Cho phép "Lưu và tiếp tục sau" ngay từ bước 1.
- **Vòng tiến độ (% Completeness)**:
    - Triển khai logic tính % dựa trên bộ trường cốt lõi (Core Fields).
    - Hiển thị vòng tiến độ trên danh sách thiết bị và trang chi tiết.
- **Lưu nháp (Drafts)**:
    - Tích hợp `useUserPref` để tự động lưu nháp form vào CSDL (`user_layout_prefs`) với key `draft:thiet_bi:<id>`.

### Giai đoạn B: "Góp gạch" & Mobile Fieldwork (Góp dữ liệu tại chỗ)
- **Màn hình `/gop-gach` (Micro-tasks)**:
    - Tạo route mobile-first hiển thị các "việc nhỏ" sinh ra từ `data-quality.functions.ts`.
    - Thẻ "Góp gạch": 1 câu hỏi + 1 ô nhập (VD: "Máy này số Serial là gì?").
- **Tích hợp QR (`/q/:ma`)**:
    - Nâng cấp landing page QR để hiện mục "Cần bổ sung thông tin" ngay dưới thông tin thiết bị.
- **Bằng chứng ảnh**:
    - Tái sử dụng `PhotoUpload` để nhân viên chụp tem nhãn đính kèm đề xuất.
    - AI Vision hỗ trợ đọc Text từ ảnh tem để pre-fill Serial/Model.

### Giai đoạn C: Đề xuất sửa đổi (Change Request Mở rộng)
- **Mở rộng CR Type**:
    - Migration thêm các loại: `thiet_bi.propose_field`, `he_thong.propose_field`, `dm.propose_new`.
    - Cập nhật RPC `approve_change_request` để xử lý việc ghi đè giá trị trường khi duyệt.
- **Logical Dispatcher**:
    - Khi `ktv` sửa một ô (inline edit hoặc form), hệ thống tự động chuyển thành `createChangeRequest` thay vì `update` trực tiếp.
    - Cấp trên (`phong_kt`/`admin`) thấy thông báo và duyệt nhanh.

### Giai đoạn D: Hạ tầng Ngoại tuyến (Offline Reliable)
- **IndexedDB Storage**:
    - Hoàn thiện `IndexedDBStorage` adapter cho `OfflineQueue` thay thế `sessionStorage`.
    - Đảm bảo dữ liệu nhập khi mất mạng không bị mất khi đóng trình duyệt.
- **Sync & Conflict**:
    - Tối ưu hóa logic đồng bộ lại khi có mạng.
    - Xử lý xung đột (Conflict) bằng cách cho người dùng xem lại bản cũ/mới nếu dữ liệu trên server đã thay đổi.

### Giai đoạn E: Thẩm định & Ghi nhận (Duyệt nhanh & Khen thưởng)
- **Thẩm định nhanh (Swipe to Approve)**:
    - Giao diện duyệt CR dạng thẻ: Ảnh bằng chứng bên trái, Cũ -> Mới bên phải.
    - Nút "Duyệt" và "Từ chối" (kèm lý do mẫu nhanh).
- **Gamification (Điểm đóng góp)**:
    - Bảng `dong_gop_diem` ghi nhận mỗi khi đề xuất được duyệt.
    - Hiển thị huy hiệu và thứ hạng đơn vị đóng góp tốt nhất trên Dashboard.

## 3. Kế hoạch xác minh (Verification Plan)
1. **Zod/Logic Test**: Chạy `vitest` cho `inline-edit.ts` và `offline-queue.ts` đảm bảo logic chuẩn.
2. **DB Migration Test**: Kiểm tra `ALTER TYPE` cho enum `change_request_loai`.
3. **Playwright E2E**:
    - Login vai `ktv`, quét QR, gửi đề xuất sửa Serial kèm ảnh.
    - Login vai `admin`, duyệt đề xuất, kiểm tra bảng `thiet_bi` đã được cập nhật giá trị mới.
    - Tắt mạng, nhập dữ liệu, kiểm tra `OfflineQueue` badge hiện số lượng chờ, bật mạng lại và kiểm tra đồng bộ.

---
*Kế hoạch này tuân thủ triết lý MIRATS 2.0: Chuyên nghiệp hóa luồng dữ liệu, nâng tầm trải nghiệm hiện trường.*
