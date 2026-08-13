# Kế hoạch Hợp nhất Luồng nghiệp vụ Vận hành Tài sản (Lắp/Tháo/Thay/Chuyển)

Kế hoạch này tập trung vào việc chuẩn hóa trải nghiệm người dùng cho các thao tác tháo lắp tài sản, đảm bảo tính nhất quán giữa Cây hệ thống, Bảng thành phần và các hộp thoại chi tiết, đồng thời bảo vệ toàn vẹn dữ liệu sổ lý lịch.

## 1. Bảng Phân tích 4 Hành vi Nghiệp vụ

| Hành vi | Điều kiện tiên quyết | Dữ liệu đầu vào | Hệ quả Sổ lý lịch | Trường hợp bị chặn |
| :--- | :--- | :--- | :--- | :--- |
| **LẮP** | Thành phần trống | Tài sản, Ngày lắp, Ghi chú | Tạo dòng mới trong `gan_chuc_nang` | Thành phần đã có tài sản; Tài sản đã thanh lý |
| **THÁO** | Thành phần có tài sản | Vị trí đích (kho), Lý do, Ghi chú | Đóng dòng `gan_chuc_nang` hiện tại | Thành phần trống; Không chọn vị trí đích |
| **THAY THẾ** | Thành phần có tài sản | Tài sản mới, Vị trí đích (cũ), Ghi chú | Đóng dòng cũ + Mở dòng mới (nguyên tử) | Thành phần trống; Tài sản mới đang bận (hỏi chuyển) |
| **ĐIỀU CHUYỂN** | Tài sản đang ở nơi khác | Thành phần đích, Ghi chú | Đóng vị trí cũ + Mở tại vị trí mới | Tài sản đang rảnh (dùng Lắp); Đích đã bận |

## 2. Bảng Nhãn Tiếng Việt Thống nhất

| Hành vi | Nhãn nút | Tiêu đề hộp thoại | Câu xác nhận | Thông báo thành công |
| :--- | :--- | :--- | :--- | :--- |
| **Lắp** | Lắp tài sản | Lắp tài sản vào thành phần | Xác nhận lắp [TB] vào [TP]? | Đã lắp [TB] vào [TP] |
| **Tháo** | Tháo tài sản | Tháo tài sản khỏi thành phần | Tháo [TB] về [Vị trí]? | Đã tháo [TB] khỏi [TP] |
| **Thay thế** | Thay tài sản | Thay thế tài sản | Thay [TB cũ] bằng [TB mới]? | Đã thay thế tài sản tại [TP] |
| **Điều chuyển** | Chuyển đến đây | Điều chuyển tài sản | Chuyển [TB] từ [A] sang [B]? | Đã điều chuyển [TB] sang [B] |

## 3. Giải pháp Kỹ thuật: "Unified Operation Pipeline"

### Điểm vào dùng chung: `OperationDialog.tsx`
Tôi đề xuất tạo một component **`src/components/mirats/OperationDialog.tsx`** đóng vai trò là Controller duy nhất.
- Sử dụng `ResponsiveDialog` để hỗ trợ Mobile.
- Tích hợp `AssetPicker` (cho Lắp/Thay/Chuyển) và `LocationPicker` (cho Tháo).
- Gọi các hook nghiệp vụ tương ứng từ `lib/mirats/he-thong-thanh-phan.ts`.

### Xử lý trùng lặp tại `ThanhPhanChiTietDialog.tsx`:
Hàm này gọi `useLapThietBi` hai lần do sự phân tách giữa luồng "Lắp nhanh" (khi vị trí trống) và luồng "Edit mode".
**Giải pháp:** Gộp tất cả vào một trạng thái `operationMode: 'lap' | 'thao' | 'thay' | 'chuyen' | null` và gọi chung một Modal xử lý.

### Sơ đồ luồng xử lý (Chữ)
```text
[Yêu cầu Hành vi] ──> [Kiểm tra Quyền (canWrite)] ──> [Hiện Dialog Thống nhất]
      │                       │                            │
      │                       └──> [Bị chặn: Không đủ quyền] └──> [Chọn Tài sản/Vị trí]
      │                                                           │
      └──> [Kiểm tra Hợp lệ (Client-side validation)] <───────────┘
                │
                ├──> [Thành phần bận?] ──> [Gợi ý Thay thế]
                ├──> [Tài sản bận?] ──> [Gợi ý Điều chuyển]
                └──> [Hợp lệ] ──> [Gọi hook RPC] ──> [Hiện Toast + Link Lý lịch]
```

## 4. Kế hoạch Thực hiện (5 Bước)

1.  **Bước 1: Tạo `OperationDialog`**: Xây dựng UI chuẩn cho 4 hành vi, tích hợp logic "Trước - Sau" (Hiện rõ hệ quả tháo từ đâu, lắp vào đâu).
2.  **Bước 2: Port logic `ThaoTaiSanDialog`**: Chuyển toàn bộ logic hiện có vào `OperationDialog` và đánh dấu `ThaoTaiSanDialog` là deprecated.
3.  **Bước 3: Thay thế các điểm gọi**: Cập nhật `ThanhPhanTable`, `ThanhPhanManager`, `ThanhPhanChiTietDialog` để dùng chung `OperationDialog`.
4.  **Bước 4: Bổ sung Hoàn tác (Undo)**: Đảm bảo mọi hành vi (trừ Thay thế phức tạp) đều có Toast Hoàn tác trong 12 giây.
5.  **Bước 5: Link Lý lịch**: Sau khi thành công, Toast sẽ chứa 2 link: `Xem lý lịch Thành phần` và `Xem lý lịch Tài sản`.

## 5. Danh sách Kiểm thử Tình huống

1.  **Tình huống Trống**: Chọn thành phần trống -> Nút "Lắp" hiện -> Chọn tài sản rảnh -> Thành công.
2.  **Tình huống Bận (TP)**: Chọn thành phần đã có TB -> Nút "Lắp" biến mất, hiện "Thay thế/Tháo" -> Click Thay thế -> Chọn tài sản mới -> Thành công (Tài sản cũ về kho).
3.  **Tình huống Bận (TB)**: Lắp TB đang ở TP A vào TP B -> Cảnh báo "Tài sản đang ở A" -> Chọn "Điều chuyển" -> Thành công (TP A trống, TB sang B).
4.  **Tình huống Quyền**: KTV (không phải Admin) thực hiện -> Chặn hành vi hoặc yêu cầu qua luồng đề xuất (nếu cấu hình).
5.  **Tình huống Loại**: Lắp tài sản sai chủng loại yêu cầu -> Cảnh báo màu vàng nhưng vẫn cho phép (theo quy tắc nghiệp vụ hiện tại).

---
*Cam kết: Giữ nguyên 100% logic tại `lib/mirats/he-thong-thanh-phan.ts` và không thay đổi database schema.*
